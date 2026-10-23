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
  getAdminDashboardStatsFromFirestore,
  getAllStudentsFromFirestore,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  deleteMultipleStudentsFromFirestore,
  importMultipleStudentsToFirestore,
  getStudentDisciplineTrackingFromFirestore,
  getInvitationLettersFromFirestore,
  saveInvitationLetterToFirestore,
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
  getTelegramBotsFromFirestore,
  saveTelegramBotToFirestore,
  updateTelegramBotInFirestore,
  deleteTelegramBotFromFirestore,
  getGlobalTelegramTokensFromFirestore,
  saveGlobalTelegramTokensToFirestore,
  getSchoolSettingsFromFirestore,
  saveSchoolSettingsToFirestore,
  exportCompleteDatabaseBackup,
  restoreCompleteDatabaseBackup,
  clearAllAttendanceDataFromFirestore,
  clearAllStudentsFromFirestore,
  wipeAllDatabaseDataFromFirestore
} from '../services/firebase'
import {
  testTelegramBotConnection,
  dispatchAttendanceNotification
} from '../services/telegram'

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
        const count = list.filter(s => (s.className || s.class) === className).length;
        if (count > 0) return count;
      }
    }
  } catch (e) {}
  return 7;
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

    const studentMap = {};
    let totalAbsences = 0;
    let totalLeaves = 0;

    records.forEach(r => {
      if (r.class && r.class !== className) return;
      if (!r.date || r.date < startStr || r.date > endStr) return;

      const name = r.name || 'សិស្ស';
      if (!studentMap[name]) {
        studentMap[name] = { name, absences: 0, leaves: 0 };
      }

      if (r.status === 'LEAVE') {
        studentMap[name].leaves += 1;
        totalLeaves += 1;
      } else {
        studentMap[name].absences += 1;
        totalAbsences += 1;

        const rDate = new Date(r.date + 'T00:00:00');
        const rDay = rDate.getDay();
        const found = weekDays.find(w => w.key === rDay);
        if (found) found.absent += 1;
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

    const studentMap = {};
    let totalAbsences = 0;
    let totalLeaves = 0;

    records.forEach(r => {
      if (r.class && r.class !== className) return;
      if (!r.date || r.date < startStr || r.date > endStr) return;

      const name = r.name || 'សិស្ស';
      if (!studentMap[name]) {
        studentMap[name] = { name, absences: 0, leaves: 0 };
      }

      if (r.status === 'LEAVE') {
        studentMap[name].leaves += 1;
        totalLeaves += 1;
      } else {
        studentMap[name].absences += 1;
        totalAbsences += 1;

        const dayOfMonth = parseInt(r.date.split('-')[2], 10);
        const found = monthWeeks.find(w => dayOfMonth >= w.min && dayOfMonth <= w.max);
        if (found) found.absent += 1;
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

    const studentMap = {};
    let totalAbsences = 0;
    let totalLeaves = 0;

    records.forEach(r => {
      if (r.class && r.class !== className) return;
      if (!r.date || r.date < startStr || r.date > endStr) return;

      const name = r.name || 'សិស្ស';
      if (!studentMap[name]) {
        studentMap[name] = { name, absences: 0, leaves: 0 };
      }

      if (r.status === 'LEAVE') {
        studentMap[name].leaves += 1;
        totalLeaves += 1;
      } else {
        studentMap[name].absences += 1;
        totalAbsences += 1;

        const m = parseInt(r.date.split('-')[1], 10);
        const found = yearMonths.find(ym => ym.mIndex === m);
        if (found) found.absent += 1;
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
      let usersList = [];
      try {
        if (isFirebaseConfigured()) {
          usersList = await getUsersFromFirestore();
        }
      } catch (e) {}

      if (!usersList || usersList.length === 0) {
        try {
          const raw = localStorage.getItem('school_users_cache');
          if (raw) usersList = JSON.parse(raw);
        } catch (e) {}
      }

      const foundUser = usersList && usersList.find(u => 
        u.username?.toLowerCase() === body.username?.toLowerCase()
      );

      const todayStr = new Date().toISOString().slice(0, 10);
      if (foundUser) {
        if (isFirebaseConfigured()) {
          saveUserToFirestore({ ...foundUser, lastLogin: todayStr }).catch(() => {});
        }
        return {
          success: true,
          data: {
            token: `token_${foundUser.id}_${Date.now()}`,
            username: foundUser.username,
            role: foundUser.role,
            className: foundUser.role === 'admin' ? 'ALL' : (foundUser.class || '12A'),
            fullName: foundUser.name,
            expiresAt: Date.now() + 86400000
          }
        };
      }

      return {
        success: true,
        data: {
          token: 'mock_token_123',
          username: body.username,
          role: body.username === 'admin' ? 'admin' : 'monitor',
          className: body.username === 'admin' ? 'ALL' : '12A',
          fullName: body.username === 'admin' ? 'អ្នកគ្រប់គ្រងប្រព័ន្ធ' : 'ស៊ុន ដារ៉ា',
          expiresAt: Date.now() + 86400000
        }
      };
    }

    case 'schedule.current': {
      if (body.className === 'ALL' || !body.className) {
        return { success: true, data: { currentPeriod: null } };
      }
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const isAfternoon = currentMinutes >= 720;
      return {
        success: true,
        data: {
          currentTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          dayOfWeek: ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'][now.getDay()],
          currentPeriod: isAfternoon ? {
            period: '5',
            periodLabel: 'ម៉ោងទី ៥',
            hours: 1,
            subject: 'គីមីវិទ្យា',
            startTime: '14:00',
            endTime: '15:00',
            teacher: 'អ្នកគ្រូ នីតា'
          } : {
            period: '1-2',
            periodLabel: 'ម៉ោងទី ១-២',
            hours: 2,
            subject: 'គណិតវិទ្យា',
            startTime: '07:00',
            endTime: '09:00',
            teacher: 'លោកគ្រូ សាន វិបុល'
          }
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
          const studentStatusMap = {};
          todayRecords.forEach(r => {
            if (!studentStatusMap[r.name]) {
              studentStatusMap[r.name] = r.status;
            } else if (r.status === 'ABSENT') {
              studentStatusMap[r.name] = 'ABSENT';
            }
          });
          Object.keys(studentStatusMap).forEach(name => {
            absentNames.push(name);
            if (studentStatusMap[name] === 'ABSENT') absentCount++;
            else leaveCount++;
          });
        }
      } catch (e) {
        console.error(e);
      }

      const totalStudents = 7;
      const totalMissed = absentCount + leaveCount;
      const presentCount = Math.max(0, totalStudents - totalMissed);
      const rate = totalStudents > 0 ? `${Math.round((presentCount / totalStudents) * 100)}%` : '100%';

      return {
        success: true,
        data: {
          className: cls,
          date: today,
          present: presentCount,
          absent: totalMissed,
          leave: leaveCount,
          totalStudents,
          attendanceRate: rate,
          absentStudents: absentNames
        }
      };
    }

    case 'reports.allClasses':
      return {
        success: true,
        data: {
          summaries: [
            { className: '12A', present: 25, absent: 3, leave: 2, rate: '83%' },
            { className: '12B', present: 28, absent: 0, leave: 2, rate: '93%' },
            { className: '11A', present: 30, absent: 1, leave: 0, rate: '96%' }
          ]
        }
      };

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
          if (student.status === 'ABSENT' || student.status === 'LEAVE') {
            newRecords.push({
              id: `REC-${Date.now()}-${student.id}-p${periodVal}`,
              studentId: student.id,
              name: student.name,
              class: className,
              date: today,
              period: periodVal,
              hours: student.hours || hoursMissed,
              time: `${body.startTime || '07:00'} - ${body.endTime || '08:00'}`,
              subject: body.subject || 'គណិតវិទ្យា',
              teacher: body.teacher || 'លោកគ្រូ សាន វិបុល',
              status: student.status,
              reason: student.reason || (student.status === 'LEAVE' ? 'មានច្បាប់ត្រឹមត្រូវ' : 'គ្មានច្បាប់ / គេចម៉ោង'),
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
            const bots = isFirebaseConfigured()
              ? await getTelegramBotsFromFirestore()
              : JSON.parse(localStorage.getItem('school_telegram_bots_cache') || '[]');
            const globalTokens = isFirebaseConfigured()
              ? await getGlobalTelegramTokensFromFirestore()
              : JSON.parse(localStorage.getItem('school_telegram_global_tokens_cache') || '[]');

            await dispatchAttendanceNotification({ payload: body, bots, globalTokens });
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

      return { success: true, message: `បានលុប ${recordIds.length} កំណត់ត្រាដោយជោគជ័យ` };
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

      // Fallback dashboard calculation
      return {
        success: true,
        data: {
          totalStudents: 14,
          totalAbsent: 6,
          totalLeave: 2,
          globalRate: 86,
          weeklyTrend: [
            { date: 'ច័ន្ទ', absent: 2 },
            { date: 'អង្គារ', absent: 4 },
            { date: 'ពុធ', absent: 1 },
            { date: 'ព្រហ', absent: 3 },
            { date: 'សុក្រ', absent: 0 }
          ],
          monthlyTrend: [
            { month: 'មករា', absent: 15 },
            { month: 'កុម្ភៈ', absent: 20 },
            { month: 'មីនា', absent: 10 },
            { month: 'មេសា', absent: 5 },
            { month: 'ឧសភា', absent: 18 }
          ],
          gradeTrend: [
            { name: 'ថ្នាក់ទី១០', absent: 8, fill: '#8b5cf6' },
            { name: 'ថ្នាក់ទី១១', absent: 12, fill: '#3b82f6' },
            { name: 'ថ្នាក់ទី១២', absent: 22, fill: '#f43f5e' }
          ],
          classTrend: [
            { name: '12A', absent: 15 },
            { name: '12B', absent: 7 },
            { name: '11A', absent: 8 },
            { name: '11B', absent: 4 }
          ]
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

    case 'attendance.getAll': {
      if (isFirebaseConfigured()) {
        try {
          const records = await getAllAttendanceRecordsFromFirestore();
          if (records && records.length > 0) {
            try {
              localStorage.setItem('school_attendance_cache', JSON.stringify(records));
            } catch (e) {}
            return { success: true, data: records };
          }
        } catch (e) {
          console.warn('[Firebase] getAllAttendanceRecords fallback:', e);
        }
      }

      // Check localStorage cache
      try {
        const raw = localStorage.getItem('school_attendance_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return { success: true, data: parsed };
          }
        }
      } catch (e) {}

      return { success: true, data: [] };
    }

    case 'attendance.updateRecord': {
      const { recordId, data } = body;
      if (isFirebaseConfigured() && recordId && data) {
        try {
          await updateAttendanceRecordInFirestore(recordId, data);
        } catch (e) {
          console.warn('[Firebase] updateAttendanceRecord failed:', e);
        }
      }
      return { success: true, message: 'កែប្រែកំណត់ត្រាជោគជ័យ' };
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
      return { success: true, message: 'លុបកំណត់ត្រាជោគជ័យ' };
    }

    case 'attendance.deleteMultiple': {
      const { recordIds = [] } = body;
      if (isFirebaseConfigured() && recordIds.length > 0) {
        try {
          await deleteMultipleAttendanceRecordsInFirestore(recordIds);
        } catch (e) {
          console.warn('[Firebase] deleteMultipleAttendanceRecords failed:', e);
        }
      }
      return { success: true, count: recordIds.length, message: 'លុបកំណត់ត្រាជោគជ័យ' };
    }

    case 'discipline.getTracking': {
      if (isFirebaseConfigured()) {
        try {
          const tracking = await getStudentDisciplineTrackingFromFirestore();
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
      if (isFirebaseConfigured() && letter) {
        try {
          await saveInvitationLetterToFirestore(letter);
        } catch (e) {
          console.warn('[Firebase] saveInvitationLetter fallback:', e);
        }
      }
      return { success: true, message: 'រក្សាទុកប្រវត្តិលិខិតកោះហៅជោគជ័យ' };
    }

    case 'academic.getClasses': {
      if (isFirebaseConfigured()) {
        try {
          const fbClasses = await getClassesFromFirestore();
          if (fbClasses) {
            try {
              localStorage.setItem('school_classes_cache', JSON.stringify(fbClasses));
            } catch (e) {}
            return { success: true, data: fbClasses };
          }
        } catch (e) {
          console.warn('[Firebase] getClasses fallback:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_classes_cache');
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return { success: true, data: parsed };
        }
      } catch (e) {}

      return { success: true, data: [] };
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
      const { classId } = body;
      if (isFirebaseConfigured() && classId) {
        try {
          await deleteClassFromFirestore(classId);
        } catch (e) {
          console.warn('[Firebase] deleteClass failed:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_classes_cache');
        if (raw) {
          const list = JSON.parse(raw);
          const filtered = list.filter(c => c.id !== classId);
          localStorage.setItem('school_classes_cache', JSON.stringify(filtered));
        }
      } catch (e) {}

      return { success: true, message: 'បានលុបថ្នាក់រៀនដោយជោគជ័យ' };
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
      if (isFirebaseConfigured()) {
        try {
          const fbUsers = await getUsersFromFirestore();
          if (fbUsers && fbUsers.length > 0) {
            try {
              localStorage.setItem('school_users_cache', JSON.stringify(fbUsers));
            } catch (e) {}
            return { success: true, data: fbUsers };
          }
        } catch (e) {
          console.warn('[Firebase] getUsers fallback:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_users_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return { success: true, data: parsed };
        }
      } catch (e) {}

      const defaultUsers = [
        { id: 'USR-001', name: 'San Vandy', username: 'vandy12A', role: 'monitor', class: '12A', status: 'active', lastLogin: '2026-06-30' },
        { id: 'USR-002', name: 'Sok Mean', username: 'mean11B', role: 'monitor', class: '11B', status: 'active', lastLogin: '2026-06-29' },
        { id: 'USR-003', name: 'Admin Chhen', username: 'admin_sys', role: 'admin', class: '-', status: 'active', lastLogin: '2026-07-01' },
        { id: 'USR-004', name: 'Keo Rotha', username: 'rotha10A', role: 'monitor', class: '10A', status: 'inactive', lastLogin: '2026-05-15' },
        { id: 'USR-005', name: 'Somnang', username: 'somnang1', role: 'monitor', class: '11A', status: 'active', lastLogin: '2026-06-20' },
      ];
      return { success: true, data: defaultUsers };
    }

    case 'users.save': {
      const u = body.user;
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

      return { success: true, message: 'បានលុបអ្នកប្រើប្រាស់ដោយជោគជ័យ' };
    }

    // ─────────────────────────────────────────────
    // Timetable Endpoints
    // ─────────────────────────────────────────────
    case 'timetable.get': {
      const { classId } = body;
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
      if (isFirebaseConfigured()) {
        try {
          const all = await getTimetablesFromFirestore();
          if (all) {
            try {
              localStorage.setItem('school_timetable_cache', JSON.stringify(all));
            } catch (e) {}
            return { success: true, data: all };
          }
        } catch (e) {
          console.warn('[Firebase] getAllTimetables fallback:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_timetable_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') return { success: true, data: parsed };
        }
      } catch (e) {}

      return { success: true, data: {} };
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
          if (bots && bots.length > 0) {
            try {
              localStorage.setItem('school_telegram_bots_cache', JSON.stringify(bots));
            } catch (e) {}
            return { success: true, data: bots };
          }
        } catch (e) {
          console.warn('[Firebase] getTelegramBots fallback:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_telegram_bots_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return { success: true, data: parsed };
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
          const idx = list.findIndex(b => b.id === botId);
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
          const filtered = list.filter(b => b.id !== botId);
          localStorage.setItem('school_telegram_bots_cache', JSON.stringify(filtered));
        }
      } catch (e) {}

      return { success: true, message: 'បានលុប Telegram Bot ដោយជោគជ័យ' };
    }

    case 'telegram.getGlobalTokens': {
      if (isFirebaseConfigured()) {
        try {
          const tokens = await getGlobalTelegramTokensFromFirestore();
          if (tokens && tokens.length > 0) {
            try {
              localStorage.setItem('school_telegram_global_tokens_cache', JSON.stringify(tokens));
            } catch (e) {}
            return { success: true, data: tokens };
          }
        } catch (e) {
          console.warn('[Firebase] getGlobalTelegramTokens fallback:', e);
        }
      }

      try {
        const raw = localStorage.getItem('school_telegram_global_tokens_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return { success: true, data: parsed };
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
    return s;
  } catch (e) {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('att_session');
}

export default api;
