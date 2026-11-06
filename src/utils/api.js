// API Utility with Cloud Firebase Firestore & Offline LocalStorage Fallback
import {
  isFirebaseConfigured,
  saveAttendanceToFirestore,
  getStudentsFromFirestore,
  getDailyReportFromFirestore,
  getWeeklyReportFromFirestore,
  getMonthlyReportFromFirestore,
  getYearlyReportFromFirestore,
  KHMER_MONTH_NAMES,
  toKhmerDigits,
  getPeriodStateFromFirestore,
  getAllAttendanceRecordsFromFirestore,
  updateAttendanceRecordInFirestore,
  deleteAttendanceRecordInFirestore,
  deleteMultipleAttendanceRecordsInFirestore,
  saveRawAttendanceRecordsToFirestore,
  getAdminDashboardStatsFromFirestore,
  getAllStudentsFromFirestore,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  deleteMultipleStudentsFromFirestore,
  importMultipleStudentsToFirestore,
  getStudentDisciplineTrackingFromFirestore,
  getTimestampMillis,
  getInvitationLettersFromFirestore,
  saveInvitationLetterToFirestore,
  deleteInvitationLetterFromFirestore,
  deleteBatchInvitationLettersFromFirestore,
  saveBatchInvitationLettersToFirestore,
  getDisciplineResolutionsFromFirestore,
  saveDisciplineResolutionToFirestore,
  saveBatchDisciplineResolutionsToFirestore,
  deleteDisciplineResolutionFromFirestore,
  getClassesFromFirestore,
  saveClassToFirestore,
  deleteClassFromFirestore,
  getSubjectsFromFirestore,
  saveSubjectToFirestore,
  deleteSubjectFromFirestore,
  getUsersFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  getTimetablesFromFirestore,
  saveTimetableToFirestore,
  copyTimetableInFirestore,
  clearTimetableInFirestore,
  deleteTimetableFromFirestore,
  getTelegramBotsFromFirestore,
  saveTelegramBotToFirestore,
  updateTelegramBotInFirestore,
  deleteTelegramBotFromFirestore,
  getGlobalTelegramTokensFromFirestore,
  saveGlobalTelegramTokensToFirestore,
  isDummyTelegramToken,
  isDummyTelegramBot,
  getSchoolSettingsFromFirestore,
  saveSchoolSettingsToFirestore,
  exportCompleteDatabaseBackup,
  restoreCompleteDatabaseBackup,
  saveMonthlyBackupToFirestore,
  getMonthlyBackupsFromFirestore,
  getMonthlyBackupPayload,
  deleteMonthlyBackupFromFirestore,
  clearAllAttendanceDataFromFirestore,
  clearAllStudentsFromFirestore,
  wipeAllDatabaseDataFromFirestore,
  invalidateFirebaseCache
} from '../services/firebase'
import {
  testTelegramBotConnection,
  dispatchAttendanceNotification,
  dispatchDisciplineWarningNotification
} from '../services/telegram'

const PASSWORD_SALT = 'angroka_school_salt_2026';

/**
 * Hash password with SHA-256 and salt using native Web Crypto API
 */
export async function hashPassword(plainPassword, salt = PASSWORD_SALT) {
  if (!plainPassword) return '';
  if (typeof plainPassword !== 'string') plainPassword = String(plainPassword);
  // Avoid re-hashing already hashed password
  if (plainPassword.startsWith('sha256$')) return plainPassword;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainPassword + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `sha256$${hex}`;
  } catch (err) {
    console.error('[Crypto] Hash error, fallback:', err);
    return plainPassword;
  }
}

/**
 * Verify password against stored hash or legacy plaintext with automatic backward compatibility
 */
export async function verifyPassword(inputPassword, storedPassword, salt = PASSWORD_SALT) {
  if (!inputPassword || !storedPassword) return false;
  
  // 1. Plaintext backward-compatibility match
  if (storedPassword === inputPassword) return true;
  
  // 2. Salted SHA-256 hash match
  if (storedPassword.startsWith('sha256$')) {
    const computed = await hashPassword(inputPassword, salt);
    return computed === storedPassword;
  }
  
  // 3. Fallback check without prefix
  const computed = await hashPassword(inputPassword, salt);
  if (storedPassword === computed.replace('sha256$', '')) return true;

  return false;
}

function getLocalAttendanceRecords() {
  try {
    const raw = localStorage.getItem('school_attendance_records');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function getLocalClassStudentCount(className) {
  try {
    const raw = localStorage.getItem('school_students_cache');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.filter(s => (s.className || s.class) === className).length;
      }
    }
  } catch (e) {}
  return 0;
}

function calculateLocalReport(period, className = '12A', refDate = null) {
  const records = getLocalAttendanceRecords();
  const totalStudents = getLocalClassStudentCount(className);
  const d = refDate ? new Date(refDate) : new Date();

  if (period === 'week') {
    const day = d.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMon);
    const startStr = monday.toISOString().split('T')[0];

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const endStr = sunday.toISOString().split('T')[0];

    const weekDays = [
      { key: 1, date: 'ច័ន្ទ', absent: 0 },
      { key: 2, date: 'អង្គារ', absent: 0 },
      { key: 3, date: 'ពុធ', absent: 0 },
      { key: 4, date: 'ព្រហស្បតិ៍', absent: 0 },
      { key: 5, date: 'សុក្រ', absent: 0 },
      { key: 6, date: 'សៅរ៍', absent: 0 }
    ];

    const dayMap = {};
    records.forEach(r => {
      if (r.class && r.class !== className) return;
      if (!r.date || r.date < startStr || r.date > endStr) return;
      const key = `${r.name || 'សិស្ស'}_${r.date}`;
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(r);
    });

    const studentMap = {};
    let totalAbsences = 0;
    let totalLeaves = 0;

    Object.keys(dayMap).forEach(key => {
      const recs = dayMap[key];
      const name = recs[0].name || 'សិស្ស';
      if (!studentMap[name]) {
        studentMap[name] = { name, absences: 0, leaves: 0 };
      }

      const hasAbsent = recs.some(r => r.status === 'ABSENT');
      const hasLeave = recs.some(r => r.status === 'LEAVE');
      const isFullDay = recs.some(r => Boolean(r.isFullDay));
      const totalHrs = recs.reduce((sum, r) => sum + (Number(r.hours) || 1), 0);

      if (hasAbsent) {
        studentMap[name].absences += 1;
        totalAbsences += 1;
        const rDate = new Date(recs[0].date + 'T00:00:00');
        const rDay = rDate.getDay();
        const found = weekDays.find(w => w.key === rDay);
        if (found) found.absent += 1;
      } else if (hasLeave) {
        studentMap[name].leaves += 1;
        totalLeaves += 1;
      }
    });

    const topAbsentStudents = Object.values(studentMap)
      .sort((a, b) => (b.absences + b.leaves) - (a.absences + a.leaves));

    const totalExpected = Math.max(1, totalStudents * 6);
    const totalMissed = totalAbsences + totalLeaves;
    const pct = Math.max(0, Math.min(100, Math.round(((totalExpected - totalMissed) / totalExpected) * 100)));

    return {
      periodLabel: 'សប្តាហ៍នេះ',
      totalAbsences,
      totalLeaves,
      totalStudents,
      attendanceRate: `${pct}%`,
      dailyTrend: weekDays.map(({ date, absent }) => ({ date, absent })),
      topAbsentStudents
    };
  }

  if (period === 'month') {
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthNameKh = (KHMER_MONTH_NAMES && KHMER_MONTH_NAMES[month]) || '';

    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const monthWeeks = [
      { label: 'សប្តាហ៍១', min: 1, max: 7, absent: 0 },
      { label: 'សប្តាហ៍២', min: 8, max: 14, absent: 0 },
      { label: 'សប្តាហ៍៣', min: 15, max: 21, absent: 0 },
      { label: 'សប្តាហ៍៤', min: 22, max: 28, absent: 0 },
      { label: 'សប្តាហ៍៥', min: 29, max: 31, absent: 0 }
    ];

    const dayMap = {};
    records.forEach(r => {
      if (r.class && r.class !== className) return;
      if (!r.date || r.date < startStr || r.date > endStr) return;
      const key = `${r.name || 'សិស្ស'}_${r.date}`;
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(r);
    });

    const studentMap = {};
    let totalAbsences = 0;
    let totalLeaves = 0;

    Object.keys(dayMap).forEach(key => {
      const recs = dayMap[key];
      const name = recs[0].name || 'សិស្ស';
      if (!studentMap[name]) {
        studentMap[name] = { name, absences: 0, leaves: 0 };
      }

      const hasAbsent = recs.some(r => r.status === 'ABSENT');
      const hasLeave = recs.some(r => r.status === 'LEAVE');
      const isFullDay = recs.some(r => Boolean(r.isFullDay));
      const totalHrs = recs.reduce((sum, r) => sum + (Number(r.hours) || 1), 0);

      if (hasAbsent) {
        studentMap[name].absences += 1;
        totalAbsences += 1;
        const dayOfMonth = parseInt(recs[0].date.split('-')[2], 10);
        const found = monthWeeks.find(w => dayOfMonth >= w.min && dayOfMonth <= w.max);
        if (found) found.absent += 1;
      } else if (hasLeave) {
        studentMap[name].leaves += 1;
        totalLeaves += 1;
      }
    });

    const topAbsentStudents = Object.values(studentMap)
      .sort((a, b) => (b.absences + b.leaves) - (a.absences + a.leaves));

    const totalExpected = Math.max(1, totalStudents * 24);
    const totalMissed = totalAbsences + totalLeaves;
    const pct = Math.max(0, Math.min(100, Math.round(((totalExpected - totalMissed) / totalExpected) * 100)));

    return {
      periodLabel: `ខែនេះ (${monthNameKh})`,
      totalAbsences,
      totalLeaves,
      totalStudents,
      attendanceRate: `${pct}%`,
      dailyTrend: monthWeeks.map(({ label, absent }) => ({ date: label, absent })),
      topAbsentStudents
    };
  }

  if (period === 'year') {
    const year = d.getFullYear();
    const yearKh = toKhmerDigits ? toKhmerDigits(year) : String(year);
    const startStr = `${year}-01-01`;
    const endStr = `${year}-12-31`;

    const yearMonths = (KHMER_MONTH_NAMES || []).map((mName, idx) => ({
      mIndex: idx + 1,
      date: mName,
      absent: 0
    }));

    const dayMap = {};
    records.forEach(r => {
      if (r.class && r.class !== className) return;
      if (!r.date || r.date < startStr || r.date > endStr) return;
      const key = `${r.name || 'សិស្ស'}_${r.date}`;
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(r);
    });

    const studentMap = {};
    let totalAbsences = 0;
    let totalLeaves = 0;

    Object.keys(dayMap).forEach(key => {
      const recs = dayMap[key];
      const name = recs[0].name || 'សិស្ស';
      if (!studentMap[name]) {
        studentMap[name] = { name, absences: 0, leaves: 0 };
      }

      const hasAbsent = recs.some(r => r.status === 'ABSENT');
      const hasLeave = recs.some(r => r.status === 'LEAVE');
      const isFullDay = recs.some(r => Boolean(r.isFullDay));
      const totalHrs = recs.reduce((sum, r) => sum + (Number(r.hours) || 1), 0);

      if (hasAbsent) {
        studentMap[name].absences += 1;
        totalAbsences += 1;
        const m = parseInt(recs[0].date.split('-')[1], 10);
        const found = yearMonths.find(ym => ym.mIndex === m);
        if (found) found.absent += 1;
      } else if (hasLeave) {
        studentMap[name].leaves += 1;
        totalLeaves += 1;
      }
    });

    const topAbsentStudents = Object.values(studentMap)
      .sort((a, b) => (b.absences + b.leaves) - (a.absences + a.leaves));

    const totalExpected = Math.max(1, totalStudents * 200);
    const totalMissed = totalAbsences + totalLeaves;
    const pct = Math.max(0, Math.min(100, Math.round(((totalExpected - totalMissed) / totalExpected) * 100)));

    return {
      periodLabel: `ឆ្នាំនេះ (${yearKh})`,
      totalAbsences,
      totalLeaves,
      totalStudents,
      attendanceRate: `${pct}%`,
      dailyTrend: yearMonths.map(({ date, absent }) => ({ date, absent })),
      topAbsentStudents
    };
  }

  return {
    periodLabel: '',
    totalAbsences: 0,
    totalLeaves: 0,
    totalStudents,
    attendanceRate: '100%',
    dailyTrend: [],
    topAbsentStudents: []
  };
}

export async function api(action, body = {}, token = null) {
  // Real-time direct dispatch (no artificial delay)
  switch (action) {
    case 'auth.login': {
      const usernameInput = (body.username || '').trim().toLowerCase();
      const passwordInput = body.password || '';

      if (!usernameInput) {
        return { success: false, error: 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់' };
      }

      // 1. Anti-Brute-Force Rate Limiting (Lock after 5 consecutive failed attempts)
      const attemptKey = `login_attempts_${usernameInput}`;
      let attempts = { count: 0, lockedUntil: null };
      try {
        const rawAttempts = localStorage.getItem(attemptKey);
        if (rawAttempts) attempts = JSON.parse(rawAttempts);
      } catch (e) {}

      if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
        const remainingMinutes = Math.max(1, Math.ceil((attempts.lockedUntil - Date.now()) / 60000));
        return {
          success: false,
          error: `គណនីនេះត្រូវបានផ្អាកជាបណ្ដោះអាសន្ន ដោយសារបញ្ចូលពាក្យសម្ងាត់ខុសច្រើនដង។ សូមរង់ចាំ ${remainingMinutes} នាទីទៀត ឬទាក់ទង Admin។`
        };
      }

      let usersList = [];
      if (isFirebaseConfigured()) {
        try {
          const fbUsers = await getUsersFromFirestore(true);
          if (Array.isArray(fbUsers)) {
            usersList = fbUsers;
            try {
              localStorage.setItem('school_users_cache', JSON.stringify(fbUsers));
            } catch (e) {}
          }
        } catch (e) {
          console.warn('[Firebase] auth.login getUsers fallback:', e);
        }
      }

      if (!usersList || usersList.length === 0) {
        try {
          const raw = localStorage.getItem('school_users_cache');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) usersList = parsed;
          }
        } catch (e) {}
      }

      let foundUser = usersList && usersList.find(u => 
        (u.username || '').trim().toLowerCase() === usernameInput
      );

      // Auto-create & persist default admin if logging in with default credentials and user does not exist yet
      if (!foundUser && (usernameInput === 'admin' || usernameInput === 'admin_sys') && passwordInput === 'admin123') {
        const securePass = await hashPassword('admin123');
        foundUser = {
          id: 'USR-ADMIN',
          username: 'admin',
          name: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
          role: 'admin',
          class: 'ALL',
          status: 'active',
          email: 'admin@angroka.edu.kh',
          phone: '012 345 678',
          password: securePass,
          lastLogin: 'មិនទាន់ចូលប្រើ',
          createdAt: new Date().toISOString()
        };
        try {
          const raw = localStorage.getItem('school_users_cache');
          let uList = raw ? JSON.parse(raw) : [];
          if (!uList.some(u => u.username === 'admin')) {
            uList.unshift(foundUser);
            localStorage.setItem('school_users_cache', JSON.stringify(uList));
          }
        } catch (e) {}
        if (isFirebaseConfigured()) {
          saveUserToFirestore(foundUser).catch(() => {});
        }
      }

      // Session Duration: 30 days (1 month) for convenient access for class monitors & admins
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

      if (foundUser) {
        if (foundUser.status === 'inactive') {
          return {
            success: false,
            error: 'គណនីនេះត្រូវបានផ្អាកដំណើរការ (Inactive)។ សូមទាក់ទងអ្នកគ្រប់គ្រង។'
          };
        }

        const isMatch = await verifyPassword(passwordInput, foundUser.password);
        if (!isMatch) {
          // Increment failed attempt counter
          attempts.count = (attempts.count || 0) + 1;
          if (attempts.count >= 5) {
            attempts.lockedUntil = Date.now() + 10 * 60 * 1000; // 10 minutes lockout
            try {
              localStorage.setItem(attemptKey, JSON.stringify(attempts));
            } catch (e) {}
            return {
              success: false,
              error: 'អ្នកបានបញ្ចូលពាក្យសម្ងាត់ខុស ៥ ដង។ គណនីនេះត្រូវបានចាក់សោរយៈពេល ១០ នាទី ដើម្បីសុវត្ថិភាព។'
            };
          } else {
            try {
              localStorage.setItem(attemptKey, JSON.stringify(attempts));
            } catch (e) {}
            const remaining = 5 - attempts.count;
            return {
              success: false,
              error: `ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។ សូមព្យាយាមម្តងទៀត (នៅសល់ ${remaining} ដង)។`
            };
          }
        }

        // Login Succeeded: Reset failed login attempt counter
        try {
          localStorage.removeItem(attemptKey);
        } catch (e) {}

        // Automatic security migration: If stored password was plaintext, securely hash it now
        if (foundUser.password && !foundUser.password.startsWith('sha256$')) {
          const secureHash = await hashPassword(passwordInput);
          foundUser.password = secureHash;
          if (isFirebaseConfigured()) {
            saveUserToFirestore(foundUser).catch(e => console.warn('Auto-migrate password failed:', e));
          }
          try {
            const raw = localStorage.getItem('school_users_cache');
            if (raw) {
              const list = JSON.parse(raw);
              const idx = list.findIndex(item => item.id === foundUser.id);
              if (idx >= 0) {
                list[idx].password = secureHash;
                localStorage.setItem('school_users_cache', JSON.stringify(list));
              }
            }
          } catch (e) {}
        }

        // Validate monitor assigned class against active classes
        let assignedClass = foundUser.class || '';
        if (foundUser.role === 'monitor' && assignedClass && assignedClass !== '-') {
          try {
            const rawCls = localStorage.getItem('school_classes_cache');
            if (rawCls) {
              const activeCls = JSON.parse(rawCls);
              if (Array.isArray(activeCls) && activeCls.length > 0) {
                const classExists = activeCls.some(c => c.name === assignedClass || c.id === assignedClass);
                if (!classExists) {
                  // Class was deleted by admin! Unlink user from deleted class
                  foundUser.class = '-';
                  assignedClass = '';
                  if (isFirebaseConfigured()) {
                    saveUserToFirestore(foundUser).catch(() => {});
                  }
                  try {
                    const rawUsers = localStorage.getItem('school_users_cache');
                    if (rawUsers) {
                      const uList = JSON.parse(rawUsers);
                      const uIdx = uList.findIndex(u => u.id === foundUser.id);
                      if (uIdx >= 0) {
                        uList[uIdx].class = '-';
                        localStorage.setItem('school_users_cache', JSON.stringify(uList));
                      }
                    }
                  } catch (e) {}
                }
              }
            }
          } catch (e) {}
        }

        const todayStr = new Date().toISOString().slice(0, 10);
        if (isFirebaseConfigured()) {
          saveUserToFirestore({ ...foundUser, lastLogin: todayStr }).catch(() => {});
        }

        return {
          success: true,
          data: {
            token: `token_${foundUser.id}_${Date.now()}`,
            id: foundUser.id,
            username: foundUser.username,
            role: foundUser.role || 'monitor',
            className: foundUser.role === 'admin' ? 'ALL' : (foundUser.class === '-' ? '' : (foundUser.class || '')),
            fullName: foundUser.name || foundUser.username,
            email: foundUser.email || '',
            phone: foundUser.phone || '',
            avatar: foundUser.avatar || null,
            expiresAt: Date.now() + THIRTY_DAYS_MS
          }
        };
      }

      // Default initial admin setup ONLY if database has no users at all
      const hasAnyUsers = Array.isArray(usersList) && usersList.length > 0;
      if (!hasAnyUsers && (usernameInput === 'admin' || usernameInput === 'admin_sys') && passwordInput === 'admin123') {
        try {
          localStorage.removeItem(attemptKey);
        } catch (e) {}
        return {
          success: true,
          data: {
            token: `token_admin_${Date.now()}`,
            id: 'USR-ADMIN',
            username: 'admin',
            role: 'admin',
            className: 'ALL',
            fullName: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
            email: 'admin@angroka.edu.kh',
            phone: '012 345 678',
            avatar: null,
            expiresAt: Date.now() + THIRTY_DAYS_MS
          }
        };
      }

      // Invalid username attempt: count attempts to prevent brute force
      attempts.count = (attempts.count || 0) + 1;
      if (attempts.count >= 5) {
        attempts.lockedUntil = Date.now() + 10 * 60 * 1000;
        try {
          localStorage.setItem(attemptKey, JSON.stringify(attempts));
        } catch (e) {}
        return {
          success: false,
          error: 'អ្នកបានបញ្ចូលព័ត៌មានខុស ៥ ដង។ ការចូលត្រូវបានផ្អាករយៈពេល ១០ នាទី ដើម្បីសុវត្ថិភាព។'
        };
      } else {
        try {
          localStorage.setItem(attemptKey, JSON.stringify(attempts));
        } catch (e) {}
      }

      return {
        success: false,
        error: 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ (គណនីនេះមិនមានក្នុងប្រព័ន្ធ ឬត្រូវបានលុប)'
      };
    }

    case 'schedule.current': {
      const cls = body.className;
      if (cls === 'ALL' || !cls) {
        return { success: true, data: { currentPeriod: null } };
      }

      // 0. Active class verification & orphan pruning with name normalization
      const cleanCls = String(cls).replace(/^ថ្នាក់\s*/i, '').trim();
      const khmerCls = cleanCls.startsWith('ថ្នាក់') ? cleanCls : `ថ្នាក់ ${cleanCls}`;
      let activeClasses = [];
      try {
        const rawCls = localStorage.getItem('school_classes_cache');
        if (rawCls) {
          const parsed = JSON.parse(rawCls);
          if (Array.isArray(parsed) && parsed.length > 0) activeClasses = parsed;
        }
      } catch (e) {}

      if (activeClasses.length > 0) {
        const exists = activeClasses.some(c => {
          const cNameClean = String(c.name || '').replace(/^ថ្នាក់\s*/i, '').trim();
          const cIdClean = String(c.id || '').replace(/^cls_/i, '').replace(/^ថ្នាក់\s*/i, '').trim();
          return c.name === cls || c.id === cls || cNameClean === cleanCls || cIdClean === cleanCls;
        });
        if (!exists) {
          // Class was deleted by admin! Clean up any orphan timetable cache & firestore document
          try {
            const rawTt = localStorage.getItem('school_timetable_cache');
            if (rawTt) {
              const ttCache = JSON.parse(rawTt);
              if (ttCache[cls]) delete ttCache[cls];
              if (ttCache[cleanCls]) delete ttCache[cleanCls];
              if (ttCache[khmerCls]) delete ttCache[khmerCls];
              localStorage.setItem('school_timetable_cache', JSON.stringify(ttCache));
            }
          } catch (e) {}
          if (isFirebaseConfigured()) {
            deleteTimetableFromFirestore(cls).catch(() => {});
            if (cleanCls !== cls) deleteTimetableFromFirestore(cleanCls).catch(() => {});
          }
          return {
            success: true,
            data: {
              currentPeriod: null,
              isClassDeleted: true,
              noClassMsg: `ថ្នាក់ ${cls} ត្រូវបានលុបចេញពីប្រព័ន្ធដោយ Admin ហើយ`,
              subtitle: 'សូមទាក់ទង Admin ដើម្បីកំណត់ថ្នាក់ថ្មី'
            }
          };
        }
      }

      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dayNamesKhmer = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
      const todayKey = dayKeys[dayOfWeek];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      let classSlots = null;
      if (isFirebaseConfigured()) {
        try {
          let fbSlots = await getTimetablesFromFirestore(cls);
          if ((!fbSlots || fbSlots.length === 0) && cleanCls !== cls) {
            fbSlots = await getTimetablesFromFirestore(cleanCls);
          }
          if (!fbSlots || fbSlots.length === 0) {
            fbSlots = await getTimetablesFromFirestore(khmerCls);
          }
          if (Array.isArray(fbSlots) && fbSlots.length > 0) {
            classSlots = fbSlots;
            try {
              const raw = localStorage.getItem('school_timetable_cache');
              const cache = raw ? JSON.parse(raw) : {};
              cache[cls] = fbSlots;
              cache[cleanCls] = fbSlots;
              cache[khmerCls] = fbSlots;
              localStorage.setItem('school_timetable_cache', JSON.stringify(cache));
            } catch (e) {}
          }
        } catch (e) {
          console.warn('[Firebase] schedule.current getTimetables fallback:', e);
        }
      }

      if (!classSlots || classSlots.length === 0) {
        try {
          const raw = localStorage.getItem('school_timetable_cache');
          if (raw) {
            const cache = JSON.parse(raw);
            if (cache) {
              classSlots = cache[cls] || cache[cleanCls] || cache[khmerCls];
            }
          }
        } catch (e) {}
      }

      // If no timetable configured for this class at all
      if (!classSlots || classSlots.length === 0) {
        return {
          success: true,
          data: {
            currentTime: currentTimeStr,
            dayOfWeek: dayNamesKhmer[dayOfWeek],
            currentPeriod: null,
            noClassMsg: 'ថ្នាក់នេះមិនទាន់មានកាលវិភាគនៅឡើយទេ',
            subtitle: 'Admin មិនទាន់បានបញ្ចូលកាលវិភាគសម្រាប់ថ្នាក់នេះនៅឡើយទេ'
          }
        };
      }

      // Filter slots for today
      const todaySlots = classSlots.filter(s => s.day === todayKey);
      if (todaySlots.length === 0) {
        return {
          success: true,
          data: {
            currentTime: currentTimeStr,
            dayOfWeek: dayNamesKhmer[dayOfWeek],
            currentPeriod: null,
            noClassMsg: `ថ្ងៃ${dayNamesKhmer[dayOfWeek]}នេះ គ្មានម៉ោងសិក្សាទេ`,
            subtitle: dayOfWeek === 0 ? 'ថ្ងៃអាទិត្យ ជាថ្ងៃឈប់សម្រាកចុងសប្តាហ៍' : 'គ្មានមុខវិជ្ជាកំណត់ក្នុងកាលវិភាគសម្រាប់ថ្ងៃនេះទេ'
          }
        };
      }

      const periodTimes = {
        m1: { startTime: '07:00', endTime: '08:00', startMinutes: 420, endMinutes: 480, shift: 'morning', label: 'ម៉ោងទី ១' },
        m2: { startTime: '08:00', endTime: '09:00', startMinutes: 480, endMinutes: 540, shift: 'morning', label: 'ម៉ោងទី ២' },
        m3: { startTime: '09:00', endTime: '10:00', startMinutes: 540, endMinutes: 600, shift: 'morning', label: 'ម៉ោងទី ៣' },
        m4: { startTime: '10:00', endTime: '11:00', startMinutes: 600, endMinutes: 660, shift: 'morning', label: 'ម៉ោងទី ៤' },
        a1: { startTime: '14:00', endTime: '15:00', startMinutes: 840, endMinutes: 900, shift: 'afternoon', label: 'ម៉ោងទី ៥' },
        a2: { startTime: '15:00', endTime: '16:00', startMinutes: 900, endMinutes: 960, shift: 'afternoon', label: 'ម៉ោងទី ៦' },
        a3: { startTime: '16:00', endTime: '17:00', startMinutes: 960, endMinutes: 1020, shift: 'afternoon', label: 'ម៉ោងទី ៧' }
      };

      const periodsList = [];
      todaySlots.forEach(s => {
        const def = periodTimes[s.period] || { startTime: '07:00', endTime: '08:00', startMinutes: 420, endMinutes: 480, shift: 'morning', label: s.period };
        const duration = s.duration || 1;
        const isDouble = duration === 2;

        let finalEndTime = def.endTime;
        let finalEndMinutes = def.endMinutes;
        let finalPeriodLabel = def.label;

        if (isDouble) {
          if (s.period === 'm1') {
            finalEndTime = '09:00';
            finalEndMinutes = 540;
            finalPeriodLabel = 'ម៉ោងទី ១-២';
          } else if (s.period === 'm3') {
            finalEndTime = '11:00';
            finalEndMinutes = 660;
            finalPeriodLabel = 'ម៉ោងទី ៣-៤';
          } else if (s.period === 'a1') {
            finalEndTime = '16:00';
            finalEndMinutes = 960;
            finalPeriodLabel = 'ម៉ោងទី ៥-៦';
          }
        }

        periodsList.push({
          period: isDouble ? (s.period === 'm1' ? '1-2' : s.period === 'm3' ? '3-4' : '5-6') : (s.period.startsWith('m') ? String(parseInt(s.period.slice(1))) : String(parseInt(s.period.slice(1)) + 4)),
          periodLabel: finalPeriodLabel,
          hours: duration,
          subject: s.subject || (s.isLibre ? 'ម៉ោងទំនេរ' : ''),
          teacher: s.teacher || '',
          startTime: def.startTime,
          endTime: finalEndTime,
          startMinutes: def.startMinutes,
          endMinutes: finalEndMinutes,
          shift: def.shift,
          isLibre: Boolean(s.isLibre || s.subject === 'ម៉ោងលីប')
        });
      });

      periodsList.sort((a, b) => a.startMinutes - b.startMinutes);

      // Determine active period
      // 1. Exact match where now is between startMinutes and endMinutes
      const exact = periodsList.find(p => currentMinutes >= p.startMinutes && currentMinutes < p.endMinutes);
      if (exact) {
        return {
          success: true,
          data: {
            currentTime: currentTimeStr,
            dayOfWeek: dayNamesKhmer[dayOfWeek],
            currentPeriod: {
              ...exact,
              isLive: true
            }
          }
        };
      }

      // 2. If before the first period of today
      if (periodsList.length > 0 && currentMinutes < periodsList[0].startMinutes) {
        return {
          success: true,
          data: {
            currentTime: currentTimeStr,
            dayOfWeek: dayNamesKhmer[dayOfWeek],
            currentPeriod: {
              ...periodsList[0],
              isUpcoming: true
            }
          }
        };
      }

      // 3. If between periods during school hours
      const nextUpcoming = periodsList.find(p => currentMinutes < p.startMinutes);
      if (nextUpcoming) {
        return {
          success: true,
          data: {
            currentTime: currentTimeStr,
            dayOfWeek: dayNamesKhmer[dayOfWeek],
            currentPeriod: {
              ...nextUpcoming,
              isUpcoming: true
            }
          }
        };
      }

      // 4. After all periods today have ended or closed for the night (18:00 to 06:30)
      const isNightClosed = (currentMinutes >= 18 * 60 || currentMinutes < 6 * 60 + 30);
      return {
        success: true,
        data: {
          currentTime: currentTimeStr,
          dayOfWeek: dayNamesKhmer[dayOfWeek],
          currentPeriod: null,
          noClassMsg: isNightClosed ? 'ប្រព័ន្ធបានបិទការស្រង់វត្តមាន (បិទម៉ោង ៦:០០ យប់)' : 'ម៉ោងសិក្សាថ្ងៃនេះត្រូវបានបញ្ចប់ហើយ',
          subtitle: isNightClosed
            ? `ប្រព័ន្ធបិទរៀងរាល់ម៉ោង ០៦:០០ យប់ និងបើកដំណើរការឡើងវិញនៅម៉ោង ០៦:៣០ ព្រឹក (ម៉ោងបច្ចុប្បន្ន៖ ${currentTimeStr})`
            : `ម៉ោងសិក្សានៅសាលាគឺ ០៧:០០–១១:០០ ព្រឹក និង ១៤:០០–១៧:០០ រសៀល (ម៉ោងបច្ចុប្បន្ន៖ ${currentTimeStr})`
        }
      };
    }

    case 'reports.daily': {
      const cls = body.className || '12A';
      const today = body.date || new Date().toISOString().split('T')[0];

      if (isFirebaseConfigured()) {
        try {
          const fbDaily = await getDailyReportFromFirestore(cls, today);
          if (fbDaily) return { success: true, data: fbDaily };
        } catch (e) {
          console.warn('[Firebase] Daily report fallback:', e);
        }
      }

      const absentNames = [];
      let absentCount = 0;
      let leaveCount = 0;

      try {
        const raw = localStorage.getItem('school_attendance_records');
        if (raw) {
          const records = JSON.parse(raw);
          const todayRecords = records.filter(r => r.date === today && (!r.class || r.class === cls));
          const studentRecordsMap = {};
          todayRecords.forEach(r => {
            if (!studentRecordsMap[r.name]) studentRecordsMap[r.name] = [];
            studentRecordsMap[r.name].push(r);
          });
          Object.keys(studentRecordsMap).forEach(name => {
            const recs = studentRecordsMap[name];
            const hasUnexcused = recs.some(r => r.status === 'ABSENT');
            const hasLeave = recs.some(r => r.status === 'LEAVE');
            const isFullDay = recs.some(r => Boolean(r.isFullDay));
            const totalHrs = recs.reduce((sum, r) => sum + (Number(r.hours) || 1), 0);

            if (hasUnexcused) {
              absentCount++;
              absentNames.push({ name, status: 'ABSENT' });
            } else if (hasLeave) {
              leaveCount++;
              absentNames.push({ name, status: 'LEAVE', isFullDay: true });
            }
          });
        }
      } catch (e) {
        console.error(e);
      }

      const totalStudents = getLocalClassStudentCount(cls);
      const presentCount = Math.max(0, totalStudents - absentCount - leaveCount);
      const rate = totalStudents > 0 ? `${Math.round((presentCount / totalStudents) * 100)}%` : '100%';

      return {
        success: true,
        data: {
          className: cls,
          date: today,
          present: presentCount,
          absent: absentCount,
          leave: leaveCount,
          totalStudents,
          attendanceRate: rate,
          absentStudents: absentNames
        }
      };
    }

    case 'reports.allClasses': {
      let classes = [];
      let records = [];
      try {
        const cRaw = localStorage.getItem('school_classes_cache');
        if (cRaw) classes = JSON.parse(cRaw) || [];
        const rRaw = localStorage.getItem('school_attendance_records');
        if (rRaw) records = JSON.parse(rRaw) || [];
      } catch (e) {}

      const today = new Date().toISOString().split('T')[0];
      const summaries = classes.map(c => {
        const clsName = c.name;
        const clsRecords = records.filter(r => r.date === today && r.class === clsName);
        const absent = clsRecords.filter(r => r.status === 'ABSENT').length;
        const leave = clsRecords.filter(r => r.status === 'LEAVE').length;
        const count = c.students || 0;
        const rate = count > 0 ? `${Math.round(((count - absent) / count) * 100)}%` : '100%';
        return {
          className: clsName,
          present: Math.max(0, count - absent),
          absent,
          leave,
          rate
        };
      });

      return {
        success: true,
        data: { summaries }
      };
    }

    case 'reports.weekly': {
      const cls = body.className || '12A';
      if (isFirebaseConfigured()) {
        try {
          const fbWeekly = await getWeeklyReportFromFirestore(cls);
          if (fbWeekly) return { success: true, data: fbWeekly };
        } catch (e) {
          console.warn('[Firebase] Weekly report fallback:', e);
        }
      }
      return { success: true, data: calculateLocalReport('week', cls) };
    }

    case 'reports.monthly': {
      const cls = body.className || '12A';
      if (isFirebaseConfigured()) {
        try {
          const fbMonthly = await getMonthlyReportFromFirestore(cls);
          if (fbMonthly) return { success: true, data: fbMonthly };
        } catch (e) {
          console.warn('[Firebase] Monthly report fallback:', e);
        }
      }
      return { success: true, data: calculateLocalReport('month', cls) };
    }

    case 'reports.yearly': {
      const cls = body.className || '12A';
      if (isFirebaseConfigured()) {
        try {
          const fbYearly = await getYearlyReportFromFirestore(cls);
          if (fbYearly) return { success: true, data: fbYearly };
        } catch (e) {
          console.warn('[Firebase] Yearly report fallback:', e);
        }
      }
      return { success: true, data: calculateLocalReport('year', cls) };
    }

    case 'reports.warnings': {
      const cls = body.className || '12A';
      const threshold = body.threshold || 3;
      let students = [];
      if (isFirebaseConfigured()) {
        try {
          const yRep = await getYearlyReportFromFirestore(cls);
          if (yRep && yRep.topAbsentStudents) {
            students = yRep.topAbsentStudents.filter(s => s.absences >= threshold);
          }
        } catch (e) {}
      }
      if (students.length === 0) {
        const localY = calculateLocalReport('year', cls);
        if (localY && localY.topAbsentStudents) {
          students = localY.topAbsentStudents.filter(s => s.absences >= threshold);
        }
      }
      return {
        success: true,
        data: {
          warningCount: students.length,
          threshold,
          students
        }
      };
    }

    case 'students.getByClass': {
      const cls = body.className || '12A'
      if (isFirebaseConfigured()) {
        try {
          const fbStudents = await getStudentsFromFirestore(cls);
          if (Array.isArray(fbStudents)) {
            return { success: true, data: fbStudents };
          }
        } catch (e) {
          console.warn('[Firebase] Fallback to local roster:', e);
        }
      }

      // Check localStorage cached students
      try {
        const raw = localStorage.getItem('school_students_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(s => (s.className || s.class) === cls);
            return { success: true, data: filtered };
          }
        }
      } catch (e) {}

      return {
        success: true,
        data: []
      };
    }

    case 'leave.getByClass':
      return {
        success: true,
        data: {
          records: []
        }
      };

    case 'leave.submit':
    case 'leave.delete':
      return { success: true, data: { message: 'Success' } };

    case 'period.getState': {
      const cls = body.className || '12A';
      const today = body.date || new Date().toISOString().split('T')[0];
      const periodVal = String(body.period || '1');

      if (isFirebaseConfigured()) {
        try {
          const fbState = await getPeriodStateFromFirestore(today, cls, periodVal);
          if (fbState) {
            return { success: true, data: fbState };
          }
        } catch (e) {
          console.warn('[Firebase] getPeriodState error, checking localStorage:', e);
        }
      }

      // Check localStorage cached period state
      try {
        const raw = localStorage.getItem(`school_period_state_${today}_${cls}_p${periodVal}`);
        if (raw) {
          return { success: true, data: JSON.parse(raw) };
        }

        // Reconstruct from school_attendance_records if period_state was lost
        const recRaw = localStorage.getItem('school_attendance_records');
        if (recRaw) {
          const list = JSON.parse(recRaw);
          const matched = list.filter(r => {
            if (r.class !== cls || r.date !== today) return false;
            const rP = String(r.period);
            if (rP === periodVal) return true;
            if (periodVal.includes('-')) {
              const [p1, p2] = periodVal.split('-');
              if (rP === p1 || rP === p2 || rP === periodVal) return true;
            }
            return false;
          });

          if (matched.length > 0) {
            const attendanceState = {};
            const leaveReasons = {};
            matched.forEach(r => {
              attendanceState[r.studentId] = r.status;
              if (r.reason) leaveReasons[r.studentId] = r.reason;
            });
            return {
              success: true,
              data: {
                attendanceState,
                leaveReasons,
                subject: matched[0].subject,
                teacher: matched[0].teacher,
                hours: matched[0].hours
              }
            };
          }
        }
      } catch (e) {}

      return { success: false, data: null };
    }

    case 'attendance.save': {
      let fbResult = null;
      if (isFirebaseConfigured()) {
        try {
          fbResult = await saveAttendanceToFirestore(body);
        } catch (fbErr) {
          console.warn('[Firebase] Save to cloud failed, will persist to local storage:', fbErr);
        }
      }

      try {
        const existingRaw = localStorage.getItem('school_attendance_records');
        let records = existingRaw ? JSON.parse(existingRaw) : [];

        const today = new Date().toISOString().split('T')[0];
        const periodVal = String(body.period || '1');
        const className = body.className || '12A';
        const hoursMissed = (periodVal === '1-2' || periodVal.includes('-') || body.hours === 2) ? 2 : 1;

        // Filter out any previous records for the same class, date and period to prevent duplicates
        records = records.filter(r => {
          if (r.class !== className || r.date !== today) return true;
          const rPeriod = String(r.period);
          if (rPeriod === periodVal) return false;
          if (periodVal.includes('-')) {
            const [pStart, pEnd] = periodVal.split('-');
            if (rPeriod === pStart || rPeriod === pEnd) return false;
          }
          return true;
        });

        const newRecords = [];

        (body.records || []).forEach(student => {
          if (student.status === 'ABSENT' || student.status === 'LEAVE' || student.status === 'DROPOUT') {
            newRecords.push({
              id: `REC-${Date.now()}-${student.id}-p${periodVal}`,
              studentId: student.id,
              name: student.name,
              class: className,
              date: today,
              period: periodVal,
              hours: student.hours || hoursMissed,
              time: `${body.startTime || '07:00'} - ${body.endTime || '08:00'}`,
              subject: body.subject || '',
              teacher: body.teacher || '',
              status: student.status,
              reason: student.reason || (student.status === 'DROPOUT' ? 'ឈប់រៀន' : student.status === 'LEAVE' ? 'មានច្បាប់ត្រឹមត្រូវ' : 'គ្មានច្បាប់ / គេចម៉ោង'),
              isFullDay: Boolean(student.isFullDay),
              recordedBy: body.recordedBy || 'ប្រធានថ្នាក់'
            });
          }
        });

        // Save into shared localStorage
        const updated = [...newRecords, ...records];
        localStorage.setItem('school_attendance_records', JSON.stringify(updated));

        // Save period state cache so monitor UI can reload the exact submitted state
        if (body.periodState) {
          localStorage.setItem(`school_period_state_${today}_${className}_p${periodVal}`, JSON.stringify(body.periodState));
        }

        // ── Telegram Bot Notification Auto-Dispatch (Non-blocking background job) ──
        (async () => {
          try {
            let bots = [];
            let globalTokens = [];
            if (isFirebaseConfigured()) {
              try {
                bots = await getTelegramBotsFromFirestore();
                globalTokens = await getGlobalTelegramTokensFromFirestore();
              } catch (cloudErr) {
                console.warn('[Telegram Dispatch] Firestore fetch failed, falling back to local cache:', cloudErr);
              }
            }
            if (!bots || bots.length === 0) {
              bots = JSON.parse(localStorage.getItem('school_telegram_bots_cache') || '[]');
            }
            if (!globalTokens || globalTokens.length === 0) {
              globalTokens = JSON.parse(localStorage.getItem('school_telegram_global_tokens_cache') || '[]');
            }

            console.log(`[Telegram Dispatch] Found ${bots.length} bot(s), ${globalTokens.length} global token(s). Dispatching for class:`, body.className);
            const dispatchRes = await dispatchAttendanceNotification({ payload: body, bots, globalTokens });
            console.log('[Telegram Dispatch] Result:', dispatchRes);
          } catch (tgErr) {
            console.warn('[Telegram Dispatch] Background notification error:', tgErr);
          }
        })();

        if (fbResult && fbResult.success) {
          return fbResult;
        }

        return {
          success: true,
          data: {
            savedCount: newRecords.length,
            message: 'រក្សាទុកការស្រង់វត្តមានបានជោគជ័យ'
          }
        };
      } catch (err) {
        return { success: false, error: 'បរាជ័យក្នុងការរក្សាទុក' };
      }
    }

    case 'attendance.getAll': {
      let cloudRecords = [];
      if (isFirebaseConfigured()) {
        try {
          cloudRecords = await getAllAttendanceRecordsFromFirestore();
        } catch (e) {
          console.warn('[Firebase] getAllAttendanceRecords error, fallback:', e);
        }
      }

      // Merge with localStorage
      let localRecords = [];
      try {
        const raw = localStorage.getItem('school_attendance_records');
        if (raw) localRecords = JSON.parse(raw);
      } catch (e) {}

      // Deduplicate by record ID / unique composite key
      const idMap = new Set();
      const combined = [];

      // Cloud records take precedence
      cloudRecords.forEach(r => {
        const key = r.id || `${r.studentId}-${r.date}-p${r.period || ''}`;
        if (!idMap.has(key)) {
          idMap.add(key);
          combined.push(r);
        }
      });

      localRecords.forEach(r => {
        const key = r.id || `${r.studentId}-${r.date}-p${r.period || ''}`;
        if (!idMap.has(key)) {
          idMap.add(key);
          combined.push(r);
        }
      });

      return {
        success: true,
        data: combined
      };
    }

    case 'attendance.updateRecord': {
      const { recordId, data } = body;
      if (isFirebaseConfigured() && recordId) {
        try {
          await updateAttendanceRecordInFirestore(recordId, data);
        } catch (e) {
          console.warn('[Firebase] updateAttendanceRecord failed:', e);
        }
      }

      // Sync into localStorage
      try {
        const raw = localStorage.getItem('school_attendance_records');
        if (raw) {
          const list = JSON.parse(raw);
          const updated = list.map(r => (r.id === recordId ? { ...r, ...data } : r));
          localStorage.setItem('school_attendance_records', JSON.stringify(updated));
        }
      } catch (e) {}

      return { success: true, message: 'បានកែប្រែទិន្នន័យដោយជោគជ័យ' };
    }

    case 'attendance.deleteRecord': {
      const { recordId } = body;
      if (isFirebaseConfigured() && recordId) {
        try {
          await deleteAttendanceRecordInFirestore(recordId);
        } catch (e) {
          console.warn('[Firebase] deleteAttendanceRecord failed:', e);
        }
      }

      // Remove from localStorage
      try {
        const raw = localStorage.getItem('school_attendance_records');
        if (raw) {
          const list = JSON.parse(raw);
          const filtered = list.filter(r => r.id !== recordId);
          localStorage.setItem('school_attendance_records', JSON.stringify(filtered));
        }
      } catch (e) {}

      return { success: true, message: 'បានលុបទិន្នន័យដោយជោគជ័យ' };
    }

    case 'attendance.deleteMultiple': {
      const { recordIds = [] } = body;
      if (isFirebaseConfigured() && recordIds.length > 0) {
        try {
          await deleteMultipleAttendanceRecordsInFirestore(recordIds);
        } catch (e) {
          console.warn('[Firebase] deleteMultiple failed:', e);
        }
      }

      // Remove from localStorage
      try {
        const raw = localStorage.getItem('school_attendance_records');
        if (raw) {
          const idSet = new Set(recordIds);
          const list = JSON.parse(raw);
          const filtered = list.filter(r => !idSet.has(r.id));
          localStorage.setItem('school_attendance_records', JSON.stringify(filtered));
        }
      } catch (e) {}

      try {
        localStorage.removeItem('school_attendance_cache');
        localStorage.removeItem('school_discipline_cache');
      } catch (e) {}
      invalidateFirebaseCache('attendance');
      invalidateFirebaseCache('discipline');
      invalidateFirebaseCache('dashboard');

      return { success: true, message: `បានលុប ${recordIds.length} កំណត់ត្រាដោយជោគជ័យ` };
    }

    case 'attendance.restoreRecords': {
      const { records = [] } = body;
      if (records.length === 0) return { success: true };

      if (isFirebaseConfigured()) {
        try {
          await saveRawAttendanceRecordsToFirestore(records);
        } catch (e) {
          console.warn('[Firebase] restoreRecords failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_attendance_records');
        const list = raw ? JSON.parse(raw) : [];
        const existingIds = new Set(list.map(r => r.id));
        const toAdd = records.filter(r => !existingIds.has(r.id));
        localStorage.setItem('school_attendance_records', JSON.stringify([...list, ...toAdd]));
      } catch (e) {}

      try {
        localStorage.removeItem('school_attendance_cache');
        localStorage.removeItem('school_discipline_cache');
      } catch (e) {}
      invalidateFirebaseCache('attendance');
      invalidateFirebaseCache('discipline');
      invalidateFirebaseCache('dashboard');

      return { success: true, message: `បានស្ដារឡើងវិញ ${records.length} កំណត់ត្រា` };
    }

    case 'admin.dashboardStats': {
      if (isFirebaseConfigured()) {
        try {
          const fbStats = await getAdminDashboardStatsFromFirestore();
          if (fbStats) {
            try {
              localStorage.setItem('school_dashboard_cache', JSON.stringify(fbStats));
            } catch (e) {}
            return { success: true, data: fbStats };
          }
        } catch (e) {
          console.warn('[Firebase] getAdminDashboardStats fallback:', e);
        }
      }

      // Check localStorage cache first
      try {
        const raw = localStorage.getItem('school_dashboard_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.totalStudents !== undefined) {
            return { success: true, data: parsed };
          }
        }
      } catch (e) {}

      // Dynamic calculation from local cache
      let localStudents = [];
      let localAttendance = [];
      try {
        const sRaw = localStorage.getItem('school_students_cache');
        if (sRaw) localStudents = JSON.parse(sRaw) || [];
        const aRaw = localStorage.getItem('school_attendance_records');
        if (aRaw) localAttendance = JSON.parse(aRaw) || [];
      } catch (e) {}

      const totalStudents = localStudents.length;
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = localAttendance.filter(r => r.date === today);
      const todayStudentMap = {};
      todayRecords.forEach(r => {
        if (!todayStudentMap[r.name]) todayStudentMap[r.name] = [];
        todayStudentMap[r.name].push(r);
      });
      let todayAbsent = 0;
      let todayLeave = 0;
      Object.values(todayStudentMap).forEach(recs => {
        const hasUnexcused = recs.some(r => r.status === 'ABSENT');
        const hasLeave = recs.some(r => r.status === 'LEAVE');
        const isFullDay = recs.some(r => Boolean(r.isFullDay));
        const totalHrs = recs.reduce((sum, r) => sum + (Number(r.hours) || 1), 0);
        if (hasUnexcused) {
          todayAbsent++;
        } else if (hasLeave) {
          todayLeave++;
        }
      });
      const globalRate = totalStudents > 0 
        ? Math.max(0, Math.round(((totalStudents - (todayAbsent + todayLeave)) / totalStudents) * 100))
        : 100;

      return {
        success: true,
        data: {
          totalStudents,
          totalAbsent: todayAbsent,
          totalLeave: todayLeave,
          globalRate,
          weeklyTrend: [],
          monthlyTrend: [],
          gradeTrend: [],
          classTrend: []
        }
      };
    }

    case 'students.getAll': {
      if (isFirebaseConfigured()) {
        try {
          const fbStudents = await getAllStudentsFromFirestore();
          if (fbStudents) {
            try {
              localStorage.setItem('school_students_cache', JSON.stringify(fbStudents));
            } catch (e) {}
            return { success: true, data: fbStudents };
          }
        } catch (e) {
          console.warn('[Firebase] getAllStudents fallback:', e);
        }
      }

      // Check localStorage cached students
      try {
        const raw = localStorage.getItem('school_students_cache');
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return { success: true, data: parsed };
          }
        }
      } catch (e) {}

      return { success: true, data: [] };
    }

    case 'students.save': {
      const student = body.student;
      if (isFirebaseConfigured() && student) {
        try {
          await saveStudentToFirestore(student);
        } catch (e) {
          console.warn('[Firebase] saveStudent failed:', e);
        }
      }

      // Update localStorage cache
      try {
        const raw = localStorage.getItem('school_students_cache');
        let list = raw ? JSON.parse(raw) : [];
        const index = list.findIndex(s => s.id === student.id);
        if (index >= 0) {
          list[index] = { ...list[index], ...student };
        } else {
          list.unshift(student);
        }
        localStorage.setItem('school_students_cache', JSON.stringify(list));
      } catch (e) {}

      return { success: true, data: student, message: 'រក្សាទុកព័ត៌មានសិស្សដោយជោគជ័យ' };
    }

    case 'students.delete': {
      const { studentId, className } = body;
      if (isFirebaseConfigured() && studentId) {
        try {
          await deleteStudentFromFirestore(studentId, className);
        } catch (e) {
          console.warn('[Firebase] deleteStudent failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_students_cache');
        if (raw) {
          const list = JSON.parse(raw);
          const filtered = list.filter(s => s.id !== studentId && s.studentId !== studentId);
          localStorage.setItem('school_students_cache', JSON.stringify(filtered));
        }
      } catch (e) {}

      return { success: true, message: 'បានលុបសិស្សដោយជោគជ័យ' };
    }

    case 'students.deleteMultiple': {
      const { studentIds = [] } = body;
      if (isFirebaseConfigured() && studentIds.length > 0) {
        try {
          await deleteMultipleStudentsFromFirestore(studentIds);
        } catch (e) {
          console.warn('[Firebase] deleteMultipleStudents failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_students_cache');
        if (raw) {
          const idSet = new Set(studentIds);
          const list = JSON.parse(raw);
          const filtered = list.filter(s => !idSet.has(s.id) && !idSet.has(s.studentId));
          localStorage.setItem('school_students_cache', JSON.stringify(filtered));
        }
      } catch (e) {}

      return { success: true, count: studentIds.length, message: `បានលុបសិស្ស ${studentIds.length} នាក់ដោយជោគជ័យ` };
    }

    case 'students.import': {
      const { students = [] } = body;
      if (isFirebaseConfigured() && students.length > 0) {
        try {
          await importMultipleStudentsToFirestore(students);
        } catch (e) {
          console.warn('[Firebase] importMultipleStudents failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_students_cache');
        let list = raw ? JSON.parse(raw) : [];
        const existingIds = new Set(list.map(s => s.id));
        students.forEach(s => {
          if (!existingIds.has(s.id)) {
            list.push(s);
            existingIds.add(s.id);
          }
        });
        localStorage.setItem('school_students_cache', JSON.stringify(list));
      } catch (e) {}

      return { success: true, count: students.length, message: `បាននាំចូលសិស្ស ${students.length} នាក់ដោយជោគជ័យ` };
    }

    case 'discipline.getTracking': {
      const forceFetch = Boolean(body?.force);
      if (forceFetch) { invalidateFirebaseCache('discipline'); try { localStorage.removeItem('school_discipline_cache'); } catch (e) {} }
      if (isFirebaseConfigured()) {
        try {
          const tracking = await getStudentDisciplineTrackingFromFirestore(forceFetch);
          if (tracking) {
            try {
              localStorage.setItem('school_discipline_cache', JSON.stringify(tracking));
            } catch (e) {}
            return { success: true, data: tracking };
          }
        } catch (e) {
          console.warn('[Firebase] getStudentDisciplineTracking fallback:', e);
        }
      }

      // Check localStorage cache
      try {
        const raw = localStorage.getItem('school_discipline_cache');
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return { success: true, data: parsed };
          }
        }
      } catch (e) {}

      return { success: true, data: [] };
    }

    case 'invitation.getAll': {
      if (isFirebaseConfigured()) {
        try {
          const letters = await getInvitationLettersFromFirestore();
          return { success: true, data: letters };
        } catch (e) {
          console.warn('[Firebase] getInvitationLetters fallback:', e);
        }
      }
      return { success: true, data: [] };
    }

    case 'invitation.savePrinted': {
      const letter = body.letter;
      const letters = body.letters || (letter ? [letter] : []);
      if (isFirebaseConfigured() && letters.length > 0) {
        try {
          if (letters.length === 1) {
            await saveInvitationLetterToFirestore(letters[0]);
          } else {
            await saveBatchInvitationLettersToFirestore(letters);
          }
        } catch (e) {
          console.warn('[Firebase] saveInvitationLetter fallback:', e);
        }
      }
      try {
        const raw = localStorage.getItem('school_invitations_cache');
        const list = raw ? JSON.parse(raw) : [];
        const incomingIds = new Set(letters.map(l => l.id));
        const filtered = list.filter(item => !incomingIds.has(item.id));
        localStorage.setItem('school_invitations_cache', JSON.stringify([...letters, ...filtered]));
      } catch (e) {}
      return { success: true, message: 'រក្សាទុកប្រវត្តិលិខិតកោះហៅជោគជ័យ' };
    }

    case 'invitation.delete': {
      const id = body.id || body.letterId;
      if (isFirebaseConfigured() && id) {
        try {
          await deleteInvitationLetterFromFirestore(id);
        } catch (e) {
          console.warn('[Firebase] deleteInvitation fallback:', e);
        }
      }
      try {
        const raw = localStorage.getItem('school_invitations_cache');
        if (raw) {
          const list = JSON.parse(raw);
          localStorage.setItem('school_invitations_cache', JSON.stringify(list.filter(item => item.id !== id)));
        }
      } catch (e) {}
      return { success: true, message: 'លុបលិខិតកោះហៅជោគជ័យ' };
    }

    case 'invitation.deleteMultiple': {
      const ids = body.ids || [];
      if (isFirebaseConfigured() && ids.length > 0) {
        try {
          await deleteBatchInvitationLettersFromFirestore(ids);
        } catch (e) {
          console.warn('[Firebase] deleteBatchInvitation fallback:', e);
        }
      }
      try {
        const raw = localStorage.getItem('school_invitations_cache');
        if (raw) {
          const list = JSON.parse(raw);
          const set = new Set(ids);
          localStorage.setItem('school_invitations_cache', JSON.stringify(list.filter(item => !set.has(item.id))));
        }
      } catch (e) {}
      return { success: true, message: 'លុបលិខិតកោះហៅជោគជ័យ' };
    }

    case 'discipline.getResolutions': {
      if (isFirebaseConfigured()) {
        try {
          const list = await getDisciplineResolutionsFromFirestore();
          if (list) {
            try {
              localStorage.setItem('school_discipline_resolutions_cache', JSON.stringify(list));
            } catch (e) {}
            return { success: true, data: list };
          }
        } catch (e) {
          console.warn('[Firebase] getDisciplineResolutions fallback:', e);
        }
      }
      try {
        const raw = localStorage.getItem('school_discipline_resolutions_cache');
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return { success: true, data: parsed };
        }
      } catch (e) {}
      return { success: true, data: [] };
    }

    case 'discipline.saveResolution': {
      const resolution = body.resolution;
      const resolutions = body.resolutions || (resolution ? [resolution] : (body.studentId ? [body] : []));
      if (isFirebaseConfigured() && resolutions.length > 0) {
        try {
          if (resolutions.length === 1) {
            await saveDisciplineResolutionToFirestore(resolutions[0]);
          } else {
            await saveBatchDisciplineResolutionsToFirestore(resolutions);
          }
        } catch (e) {
          console.warn('[Firebase] saveDisciplineResolution fallback:', e);
        }
      }
      try {
        const raw = localStorage.getItem('school_discipline_resolutions_cache');
        const list = raw ? JSON.parse(raw) : [];
        const incomingIds = new Set(resolutions.map(r => r.id));
        const filtered = list.filter(r => !incomingIds.has(r.id));
        localStorage.setItem('school_discipline_resolutions_cache', JSON.stringify([...resolutions, ...filtered]));
      } catch (e) {}

      try {
        localStorage.removeItem('school_discipline_cache');
      } catch (e) {}

      return { success: true, message: 'បានកត់ត្រាការដោះស្រាយ និង Reset ជុំវិន័យជោគជ័យ' };
    }

    case 'discipline.deleteResolution': {
      const id = body.id;
      if (isFirebaseConfigured() && id) {
        try {
          await deleteDisciplineResolutionFromFirestore(id);
        } catch (e) {
          console.warn('[Firebase] deleteDisciplineResolution fallback:', e);
        }
      }
      try {
        const raw = localStorage.getItem('school_discipline_resolutions_cache');
        if (raw) {
          const list = JSON.parse(raw);
          localStorage.setItem('school_discipline_resolutions_cache', JSON.stringify(list.filter(r => r.id !== id)));
        }
      } catch (e) {}
      try {
        localStorage.removeItem('school_discipline_cache');
      } catch (e) {}
      return { success: true, message: 'បានលុបកំណត់ត្រាដោះស្រាយ' };
    }

    case 'academic.getClasses': {
      let activeClasses = [];
      if (isFirebaseConfigured()) {
        try {
          const fbClasses = await getClassesFromFirestore();
          if (fbClasses && Array.isArray(fbClasses)) {
            activeClasses = fbClasses;
            try {
              localStorage.setItem('school_classes_cache', JSON.stringify(fbClasses));
            } catch (e) {}
          }
        } catch (e) {
          console.warn('[Firebase] getClasses fallback:', e);
        }
      }

      if (activeClasses.length === 0) {
        try {
          const raw = localStorage.getItem('school_classes_cache');
          if (raw !== null) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) activeClasses = parsed;
          }
        } catch (e) {}
      }

      // Automatically prune orphan timetables in cache & firestore for classes that no longer exist
      if (activeClasses && activeClasses.length > 0) {
        try {
          const validNames = new Set(activeClasses.map(c => c.name));
          activeClasses.forEach(c => validNames.add(c.id));
          const rawTt = localStorage.getItem('school_timetable_cache');
          if (rawTt) {
            const ttCache = JSON.parse(rawTt);
            let changed = false;
            Object.keys(ttCache).forEach(k => {
              if (!validNames.has(k)) {
                delete ttCache[k];
                changed = true;
                if (isFirebaseConfigured()) {
                  deleteTimetableFromFirestore(k).catch(() => {});
                }
              }
            });
            if (changed) {
              localStorage.setItem('school_timetable_cache', JSON.stringify(ttCache));
            }
          }
        } catch (e) {}
      }

      return { success: true, data: activeClasses };
    }

    case 'academic.saveClass': {
      const cls = body.class;
      if (isFirebaseConfigured() && cls) {
        try {
          await saveClassToFirestore(cls);
        } catch (e) {
          console.warn('[Firebase] saveClass failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_classes_cache');
        let list = raw ? JSON.parse(raw) : [];
        const index = list.findIndex(c => c.id === cls.id);
        if (index >= 0) list[index] = { ...list[index], ...cls };
        else list.unshift(cls);
        localStorage.setItem('school_classes_cache', JSON.stringify(list));
      } catch (e) {}

      return { success: true, data: cls, message: 'រក្សាទុកព័ត៌មានថ្នាក់រៀនដោយជោគជ័យ' };
    }

    case 'academic.deleteClass': {
      const { classId, className } = body;
      let targetClassName = className;

      // Find class name from cache if not provided
      try {
        const raw = localStorage.getItem('school_classes_cache');
        if (raw) {
          const list = JSON.parse(raw);
          const found = list.find(c => c.id === classId || c.name === classId || (className && c.name === className));
          if (found && !targetClassName) {
            targetClassName = found.name;
          }
          const filtered = list.filter(c => c.id !== classId && c.name !== classId && (targetClassName ? c.name !== targetClassName : true));
          localStorage.setItem('school_classes_cache', JSON.stringify(filtered));
        }
      } catch (e) {}

      if (isFirebaseConfigured() && (classId || targetClassName)) {
        try {
          await deleteClassFromFirestore(classId, targetClassName);
        } catch (e) {
          console.warn('[Firebase] deleteClass failed:', e);
        }
      }

      // Cascade delete timetable from school_timetable_cache
      try {
        const raw = localStorage.getItem('school_timetable_cache');
        if (raw) {
          const cache = JSON.parse(raw);
          let changed = false;
          if (targetClassName && cache[targetClassName]) {
            delete cache[targetClassName];
            changed = true;
          }
          if (classId && cache[classId]) {
            delete cache[classId];
            changed = true;
          }
          if (changed) {
            localStorage.setItem('school_timetable_cache', JSON.stringify(cache));
          }
        }
      } catch (e) {}

      // Clean up rosters and period states
      try {
        if (targetClassName) {
          localStorage.removeItem(`school_roster_cache_${targetClassName}`);
        }
        if (classId) {
          localStorage.removeItem(`school_roster_cache_${classId}`);
        }
        Object.keys(localStorage).forEach(key => {
          if ((targetClassName && key.includes(`_${targetClassName}_`)) || (classId && key.includes(`_${classId}_`))) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {}

      // Unlink users associated with this deleted class so they don't remain as ghost monitors
      try {
        const rawUsers = localStorage.getItem('school_users_cache');
        if (rawUsers) {
          const uList = JSON.parse(rawUsers);
          let usersChanged = false;
          uList.forEach(u => {
            if (u.role === 'monitor' && (u.class === targetClassName || u.class === classId)) {
              u.class = '-';
              usersChanged = true;
              if (isFirebaseConfigured()) {
                saveUserToFirestore(u).catch(() => {});
              }
            }
          });
          if (usersChanged) {
            localStorage.setItem('school_users_cache', JSON.stringify(uList));
          }
        }
      } catch (e) {}

      // Update current active session if the logged in user was in this deleted class
      try {
        const rawSession = localStorage.getItem('att_session');
        if (rawSession) {
          const activeSess = JSON.parse(rawSession);
          if (activeSess.className === targetClassName || activeSess.className === classId) {
            activeSess.className = '';
            localStorage.setItem('att_session', JSON.stringify(activeSess));
          }
        }
      } catch (e) {}

      return { success: true, message: 'បានលុបថ្នាក់រៀន និងកាលវិភាគដោយជោគជ័យ' };
    }

    case 'academic.getSubjects': {
      if (isFirebaseConfigured()) {
        try {
          const fbSubjects = await getSubjectsFromFirestore();
          if (fbSubjects) {
            try {
              localStorage.setItem('school_subjects_cache', JSON.stringify(fbSubjects));
            } catch (e) {}
            return { success: true, data: fbSubjects };
          }
        } catch (e) {
          console.warn('[Firebase] getSubjects fallback:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_subjects_cache');
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return { success: true, data: parsed };
        }
      } catch (e) {}

      return { success: true, data: [] };
    }

    case 'academic.saveSubject': {
      const sub = body.subject;
      if (isFirebaseConfigured() && sub) {
        try {
          await saveSubjectToFirestore(sub);
        } catch (e) {
          console.warn('[Firebase] saveSubject failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_subjects_cache');
        let list = raw ? JSON.parse(raw) : [];
        const index = list.findIndex(s => s.id === sub.id);
        if (index >= 0) list[index] = { ...list[index], ...sub };
        else list.unshift(sub);
        localStorage.setItem('school_subjects_cache', JSON.stringify(list));
      } catch (e) {}

      return { success: true, data: sub, message: 'រក្សាទុកព័ត៌មានមុខវិជ្ជាដោយជោគជ័យ' };
    }

    case 'academic.deleteSubject': {
      const { subjectId } = body;
      if (isFirebaseConfigured() && subjectId) {
        try {
          await deleteSubjectFromFirestore(subjectId);
        } catch (e) {
          console.warn('[Firebase] deleteSubject failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_subjects_cache');
        if (raw) {
          const list = JSON.parse(raw);
          const filtered = list.filter(s => s.id !== subjectId);
          localStorage.setItem('school_subjects_cache', JSON.stringify(filtered));
        }
      } catch (e) {}

      return { success: true, message: 'បានលុបមុខវិជ្ជាដោយជោគជ័យ' };
    }

    case 'users.getAll': {
      let usersList = [];
      if (isFirebaseConfigured()) {
        try {
          const fbUsers = await getUsersFromFirestore();
          if (Array.isArray(fbUsers)) usersList = fbUsers;
        } catch (e) {
          console.warn('[Firebase] getUsers fallback:', e);
        }
      }

      if (usersList.length === 0) {
        try {
          const raw = localStorage.getItem('school_users_cache');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) usersList = parsed;
          }
        } catch (e) {}
      }

      const hasAdmin = usersList.some(u => u.role === 'admin' || u.username === 'admin');
      if (!hasAdmin) {
        const defaultAdmin = {
          id: 'USR-ADMIN',
          username: 'admin',
          name: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
          role: 'admin',
          class: 'ALL',
          status: 'active',
          email: 'admin@angroka.edu.kh',
          phone: '012 345 678',
          password: 'admin123',
          lastLogin: 'មិនទាន់ចូលប្រើ'
        };
        usersList.unshift(defaultAdmin);
        if (isFirebaseConfigured()) {
          saveUserToFirestore(defaultAdmin).catch(() => {});
        }
      }

      try {
        localStorage.setItem('school_users_cache', JSON.stringify(usersList));
      } catch (e) {}

      return { success: true, data: usersList };
    }

    case 'users.save': {
      let u = { ...(body.user || {}) };
      // Securely hash password with SHA-256 before storing to Firestore & Cache
      if (u.password && typeof u.password === 'string' && !u.password.startsWith('sha256$')) {
        u.password = await hashPassword(u.password);
      }
      if (isFirebaseConfigured() && u) {
        try {
          await saveUserToFirestore(u);
        } catch (e) {
          console.warn('[Firebase] saveUser failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_users_cache');
        let list = raw ? JSON.parse(raw) : [];
        const index = list.findIndex(item => item.id === u.id);
        if (index >= 0) list[index] = { ...list[index], ...u };
        else list.unshift(u);
        localStorage.setItem('school_users_cache', JSON.stringify(list));
      } catch (e) {}

      return { success: true, data: u, message: 'រក្សាទុកព័ត៌មានអ្នកប្រើប្រាស់ដោយជោគជ័យ' };
    }

    case 'users.delete': {
      const { userId } = body;
      if (isFirebaseConfigured() && userId) {
        try {
          await deleteUserFromFirestore(userId);
        } catch (e) {
          console.warn('[Firebase] deleteUser failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_users_cache');
        if (raw) {
          const list = JSON.parse(raw);
          const filtered = list.filter(item => item.id !== userId);
          localStorage.setItem('school_users_cache', JSON.stringify(filtered));
        }
      } catch (e) {}

      // Invalidate session if current logged in user was deleted
      try {
        const rawSession = localStorage.getItem('att_session');
        if (rawSession) {
          const activeSess = JSON.parse(rawSession);
          if (activeSess?.id === userId || activeSess?.token?.includes(userId)) {
            clearSession();
          }
        }
      } catch (e) {}

      return { success: true, message: 'បានលុបអ្នកប្រើប្រាស់ដោយជោគជ័យ' };
    }

    // ─────────────────────────────────────────────
    // Timetable Endpoints
    // ─────────────────────────────────────────────
    case 'timetable.get': {
      const { classId } = body;
      if (!classId) return { success: true, data: [] };

      // Check if class exists in active classes
      try {
        const rawCls = localStorage.getItem('school_classes_cache');
        if (rawCls) {
          const parsed = JSON.parse(rawCls);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const exists = parsed.some(c => c.name === classId || c.id === classId);
            if (!exists) {
              // It's a deleted class! Prune and return empty
              try {
                const raw = localStorage.getItem('school_timetable_cache');
                if (raw) {
                  const cache = JSON.parse(raw);
                  if (cache[classId]) {
                    delete cache[classId];
                    localStorage.setItem('school_timetable_cache', JSON.stringify(cache));
                  }
                }
              } catch (e) {}
              if (isFirebaseConfigured()) {
                deleteTimetableFromFirestore(classId).catch(() => {});
              }
              return { success: true, data: [], isClassDeleted: true };
            }
          }
        }
      } catch (e) {}

      if (isFirebaseConfigured() && classId) {
        try {
          const slots = await getTimetablesFromFirestore(classId);
          if (slots) {
            try {
              const raw = localStorage.getItem('school_timetable_cache');
              const cache = raw ? JSON.parse(raw) : {};
              cache[classId] = slots;
              localStorage.setItem('school_timetable_cache', JSON.stringify(cache));
            } catch (e) {}
            return { success: true, data: slots };
          }
        } catch (e) {
          console.warn('[Firebase] getTimetable fallback:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_timetable_cache');
        if (raw) {
          const cache = JSON.parse(raw);
          if (classId && cache[classId]) return { success: true, data: cache[classId] };
        }
      } catch (e) {}

      return { success: true, data: [] };
    }

    case 'timetable.getAll': {
      let activeClassNames = null;
      try {
        const rawCls = localStorage.getItem('school_classes_cache');
        if (rawCls) {
          const parsed = JSON.parse(rawCls);
          if (Array.isArray(parsed) && parsed.length > 0) {
            activeClassNames = new Set(parsed.map(c => c.name));
            parsed.forEach(c => activeClassNames.add(c.id));
          }
        }
      } catch (e) {}

      let allTimetables = {};
      if (isFirebaseConfigured()) {
        try {
          const all = await getTimetablesFromFirestore();
          if (all) {
            allTimetables = all;
          }
        } catch (e) {
          console.warn('[Firebase] getAllTimetables fallback:', e);
        }
      }

      if (Object.keys(allTimetables).length === 0) {
        try {
          const raw = localStorage.getItem('school_timetable_cache');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') allTimetables = parsed;
          }
        } catch (e) {}
      }

      // Filter out orphan timetables
      if (activeClassNames && activeClassNames.size > 0) {
        const cleaned = {};
        Object.keys(allTimetables).forEach(k => {
          if (activeClassNames.has(k)) {
            cleaned[k] = allTimetables[k];
          } else {
            if (isFirebaseConfigured()) {
              deleteTimetableFromFirestore(k).catch(() => {});
            }
          }
        });
        allTimetables = cleaned;
      }

      try {
        localStorage.setItem('school_timetable_cache', JSON.stringify(allTimetables));
      } catch (e) {}

      return { success: true, data: allTimetables };
    }

    case 'timetable.save': {
      const { classId, slots } = body;
      if (isFirebaseConfigured() && classId && slots) {
        try {
          await saveTimetableToFirestore(classId, slots);
        } catch (e) {
          console.warn('[Firebase] saveTimetable failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_timetable_cache');
        const cache = raw ? JSON.parse(raw) : {};
        cache[classId] = slots;
        localStorage.setItem('school_timetable_cache', JSON.stringify(cache));
      } catch (e) {}

      return { success: true, message: `បានរក្សាទុកកាលវិភាគថ្នាក់ ${classId} ដោយជោគជ័យ` };
    }

    case 'timetable.copy': {
      const { fromClassId, toClassId } = body;
      if (isFirebaseConfigured() && fromClassId && toClassId) {
        try {
          await copyTimetableInFirestore(fromClassId, toClassId);
        } catch (e) {
          console.warn('[Firebase] copyTimetable failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_timetable_cache');
        const cache = raw ? JSON.parse(raw) : {};
        if (cache[fromClassId]) {
          cache[toClassId] = cache[fromClassId].map(s => ({
            ...s,
            id: `copy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
          }));
          localStorage.setItem('school_timetable_cache', JSON.stringify(cache));
        }
      } catch (e) {}

      return { success: true, message: `បានចម្លងកាលវិភាគពី ថ្នាក់ ${fromClassId} ទៅ ថ្នាក់ ${toClassId} ដោយជោគជ័យ` };
    }

    case 'timetable.clear': {
      const { classId } = body;
      if (isFirebaseConfigured() && classId) {
        try {
          await clearTimetableInFirestore(classId);
        } catch (e) {
          console.warn('[Firebase] clearTimetable failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_timetable_cache');
        const cache = raw ? JSON.parse(raw) : {};
        cache[classId] = [];
        localStorage.setItem('school_timetable_cache', JSON.stringify(cache));
      } catch (e) {}

      return { success: true, message: `បានសម្អាតកាលវិភាគថ្នាក់ ${classId} ដោយជោគជ័យ` };
    }

    // ─────────────────────────────────────────────
    // Telegram Bot Endpoints
    // ─────────────────────────────────────────────
    case 'telegram.getBots': {
      if (isFirebaseConfigured()) {
        try {
          const bots = await getTelegramBotsFromFirestore();
          if (Array.isArray(bots)) {
            const cleanBots = bots.filter(b => !isDummyTelegramBot(b));
            try {
              localStorage.setItem('school_telegram_bots_cache', JSON.stringify(cleanBots));
            } catch (e) {}
            return { success: true, data: cleanBots };
          }
        } catch (e) {
          console.warn('[Firebase] getTelegramBots fallback:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_telegram_bots_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const cleanBots = parsed.filter(b => !isDummyTelegramBot(b));
            if (cleanBots.length !== parsed.length) {
              localStorage.setItem('school_telegram_bots_cache', JSON.stringify(cleanBots));
            }
            return { success: true, data: cleanBots };
          }
        }
      } catch (e) {}

      return { success: true, data: [] };
    }

    case 'telegram.saveBot': {
      const { bot } = body;
      let saved = null;
      if (isFirebaseConfigured() && bot) {
        try {
          const fbRes = await saveTelegramBotToFirestore(bot);
          if (fbRes.success) saved = fbRes.data;
        } catch (e) {
          console.warn('[Firebase] saveTelegramBot failed:', e);
        }
      }

      if (!saved) {
        saved = {
          ...bot,
          id: bot.id || `BOT-${String(Date.now()).slice(-3)}`,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }

      try {
        const raw = localStorage.getItem('school_telegram_bots_cache');
        let list = raw ? JSON.parse(raw) : [];
        list.unshift(saved);
        localStorage.setItem('school_telegram_bots_cache', JSON.stringify(list));
      } catch (e) {}

      return { success: true, data: saved, message: 'បានបន្ថែម Telegram Bot ដោយជោគជ័យ' };
    }

    case 'telegram.updateBot': {
      const { botId, bot } = body;
      if (isFirebaseConfigured() && botId && bot) {
        try {
          await updateTelegramBotInFirestore(botId, bot);
        } catch (e) {
          console.warn('[Firebase] updateTelegramBot failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_telegram_bots_cache');
        if (raw) {
          let list = JSON.parse(raw);
          const idx = list.findIndex(b => b.id === botId || b.docId === botId);
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...bot, lastUpdated: new Date().toISOString().split('T')[0] };
            localStorage.setItem('school_telegram_bots_cache', JSON.stringify(list));
          }
        }
      } catch (e) {}

      return { success: true, message: 'បានកែប្រែព័ត៌មាន Bot ដោយជោគជ័យ' };
    }

    case 'telegram.deleteBot': {
      const { botId } = body;
      if (isFirebaseConfigured() && botId) {
        try {
          await deleteTelegramBotFromFirestore(botId);
        } catch (e) {
          console.warn('[Firebase] deleteTelegramBot failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_telegram_bots_cache');
        if (raw) {
          let list = JSON.parse(raw);
          const filtered = list.filter(b => b.id !== botId && b.docId !== botId);
          localStorage.setItem('school_telegram_bots_cache', JSON.stringify(filtered));
        }
      } catch (e) {}

      return { success: true, message: 'បានលុប Telegram Bot ដោយជោគជ័យ' };
    }

    case 'telegram.getGlobalTokens': {
      if (isFirebaseConfigured()) {
        try {
          const tokens = await getGlobalTelegramTokensFromFirestore();
          if (Array.isArray(tokens)) {
            const cleanTokens = tokens.filter(t => !isDummyTelegramToken(t));
            try {
              localStorage.setItem('school_telegram_global_tokens_cache', JSON.stringify(cleanTokens));
            } catch (e) {}
            return { success: true, data: cleanTokens };
          }
        } catch (e) {
          console.warn('[Firebase] getGlobalTelegramTokens fallback:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_telegram_global_tokens_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const cleanTokens = parsed.filter(t => !isDummyTelegramToken(t));
            if (cleanTokens.length !== parsed.length) {
              localStorage.setItem('school_telegram_global_tokens_cache', JSON.stringify(cleanTokens));
            }
            return { success: true, data: cleanTokens };
          }
        }
      } catch (e) {}

      return { success: true, data: [] };
    }

    case 'telegram.saveGlobalTokens': {
      const { tokens } = body;
      if (isFirebaseConfigured() && tokens) {
        try {
          await saveGlobalTelegramTokensToFirestore(tokens);
        } catch (e) {
          console.warn('[Firebase] saveGlobalTelegramTokens failed:', e);
        }
      }

      try {
        localStorage.setItem('school_telegram_global_tokens_cache', JSON.stringify(tokens || []));
      } catch (e) {}

      return { success: true, data: tokens, message: 'បានរក្សាទុក Global Tokens ដោយជោគជ័យ' };
    }

    case 'telegram.testBot': {
      const { token, chatId, botName, className } = body;
      const res = await testTelegramBotConnection({ token, chatId, botName, className });
      return res;
    }

    case 'telegram.sendDisciplineWarning': {
      const { student, totalAbsences, totalHours, warningLevel, className } = body;
      let bots = [];
      let globalTokens = [];
      if (isFirebaseConfigured()) {
        try {
          bots = await getTelegramBotsFromFirestore();
          globalTokens = await getGlobalTelegramTokensFromFirestore();
        } catch (e) {}
      }
      if (!bots || bots.length === 0) {
        bots = JSON.parse(localStorage.getItem('school_telegram_bots_cache') || '[]');
      }
      if (!globalTokens || globalTokens.length === 0) {
        globalTokens = JSON.parse(localStorage.getItem('school_telegram_global_tokens_cache') || '[]');
      }
      const res = await dispatchDisciplineWarningNotification({
        student,
        totalAbsences,
        totalHours,
        warningLevel,
        className: className || student?.class,
        bots,
        globalTokens
      });
      return res;
    }

    case 'settings.get': {
      if (isFirebaseConfigured()) {
        try {
          const settings = await getSchoolSettingsFromFirestore();
          if (settings) {
            try {
              localStorage.setItem('school_settings_cache', JSON.stringify(settings));
              if (settings.discipline) {
                localStorage.setItem('disciplineThresholds', JSON.stringify(settings.discipline));
              }
            } catch (e) {}
            return { success: true, data: settings };
          }
        } catch (e) {
          console.warn('[Firebase] getSchoolSettings fallback:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_settings_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') return { success: true, data: parsed };
        }
      } catch (e) {}

      // Fallback defaults
      const defaultSettings = {
        school: {
          name: 'វិទ្យាល័យអង្គរកា',
          principal: 'លោកនាយក សុខ សាន',
          phone: '012 345 678',
          address: 'ភូមិអង្គរកា ឃុំអង្គរកា ស្រុកត្រាំកក់ ខេត្តតាកែវ',
          logo: null
        },
        academic: {
          year: '2026-2027',
          semester: 'ទី១'
        },
        discipline: {
          '7-9': 50,
          '10-12': 40
        }
      };
      return { success: true, data: defaultSettings };
    }

    case 'settings.save': {
      const payload = body.settings || body;
      if (isFirebaseConfigured() && payload) {
        try {
          await saveSchoolSettingsToFirestore(payload);
        } catch (e) {
          console.warn('[Firebase] saveSchoolSettings failed:', e);
        }
      }

      try {
        localStorage.setItem('school_settings_cache', JSON.stringify(payload));
        if (payload.discipline) {
          localStorage.setItem('disciplineThresholds', JSON.stringify(payload.discipline));
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('school_settings_updated', { detail: payload }));
        }
      } catch (e) {}

      return { success: true, data: payload, message: 'បានរក្សាទុកការកំណត់ដោយជោគជ័យ' };
    }

    case 'backup.export': {
      try {
        const res = await exportCompleteDatabaseBackup();
        return res;
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    case 'backup.restore': {
      try {
        const backupData = body.backupData || body;
        const res = await restoreCompleteDatabaseBackup(backupData);
        return res;
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    case 'backup.getMonthlyList': {
      try {
        const list = await getMonthlyBackupsFromFirestore();
        return { success: true, data: list };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    case 'backup.createMonthly': {
      try {
        const expRes = await exportCompleteDatabaseBackup();
        if (!expRes.success || !expRes.backup) {
          return { success: false, error: expRes.error || 'បរាជ័យក្នុងការទាញយកទិន្នន័យសម្រាប់ Backup' };
        }
        const saveRes = await saveMonthlyBackupToFirestore(expRes.backup, {
          monthKey: body.monthKey,
          monthKhmer: body.monthKhmer,
          isAuto: body.isAuto
        });
        return {
          success: true,
          backupInfo: saveRes.backupDoc,
          message: `បានបង្កើតការបម្រុងទុកទិន្នន័យប្រចាំខែ (${body.monthKhmer || body.monthKey}) ដោយជោគជ័យ!`
        };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    case 'backup.getMonthlyPayload': {
      try {
        const payload = await getMonthlyBackupPayload(body.monthKey);
        if (!payload) {
          return { success: false, error: 'រកមិនឃើញទិន្នន័យ Backup សម្រាប់ខែនេះទេ' };
        }
        return { success: true, data: payload };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    case 'backup.deleteMonthly': {
      try {
        const res = await deleteMonthlyBackupFromFirestore(body.id, body.monthKey);
        return res;
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    case 'system.cleanData': {
      try {
        const { clearStudents = false, wipeEverything = false } = body;
        if (wipeEverything || clearStudents) {
          const res = await wipeAllDatabaseDataFromFirestore();
          return res;
        }
        const resAtt = await clearAllAttendanceDataFromFirestore();
        return {
          success: true,
          message: 'បានសម្អាតកំណត់ត្រាវត្តមាន និងកំណត់ត្រាតេស្តទាំងអស់ដោយជោគជ័យ'
        };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    default:
      return { success: false, error: 'Unknown action' };
  }
}

// Session Management Helpers
export function saveSession(session) {
  try {
    localStorage.setItem('att_session', JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session', e);
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem('att_session');
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.expiresAt && Date.now() > s.expiresAt) {
      clearSession();
      return null;
    }
    // Auto-extend session to 30 days so class monitors & admins don't experience unexpected logouts
    if (!s.expiresAt || s.expiresAt < Date.now() + 7 * 86400000) {
      s.expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
      saveSession(s);
    }
    return s;
  } catch (e) {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('att_session');
}

export function getCachedSchoolSettings() {
  try {
    const raw = localStorage.getItem('school_settings_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.school) return parsed.school;
    }
  } catch (e) {}
  return {
    name: 'វិទ្យាល័យអង្គរកា',
    principal: 'លោកនាយក សុខ សាន',
    phone: '012 345 678',
    address: 'ភូមិអង្គរកា ឃុំអង្គរកា ស្រុកត្រាំកក់ ខេត្តតាកែវ',
    logo: null
  };
}

export function getCachedSchoolName() {
  return getCachedSchoolSettings()?.name || 'វិទ្យាល័យអង្គរកា';
}

export default api;
