// ─────────────────────────────────────────────
// Firebase Service & Cloud Firestore Engine
// Supports Offline Mode via IndexedDb Persistence
// Ang Roka High School Attendance Management
// ─────────────────────────────────────────────

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

// 1. Check if Firebase credentials are provided in .env
export function isFirebaseConfigured() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  return Boolean(
    apiKey &&
    projectId &&
    apiKey.trim() !== '' &&
    projectId.trim() !== '' &&
    !apiKey.includes('your_api_key') &&
    !projectId.includes('your_project')
  );
}

// 2. Firebase App and Firestore Instance
let app = null;
let db = null;

if (isFirebaseConfigured()) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    };

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    try {
      // Enable multi-tab offline persistence
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
      console.log('[Firebase] Firestore initialized with Multi-Tab Offline Persistence.');
    } catch (cacheErr) {
      // Fallback if browser security or multiple instances restrict multi-tab caching
      db = getFirestore(app);
      console.log('[Firebase] Firestore initialized (standard mode).');
    }
  } catch (err) {
    console.warn('[Firebase] Initialization error, falling back to local mode:', err);
  }
} else {
  console.info('[Firebase] Config keys not provided in .env. Operating in LocalStorage mode.');
}

export { app, db };

// ─────────────────────────────────────────────
// Firestore Collection References
// ─────────────────────────────────────────────
const COL_ATTENDANCE = 'attendance_records';
const COL_PERIOD_STATE = 'period_states';
const COL_STUDENTS = 'students';
const COL_FULL_DAY = 'full_day_leaves';
const COL_INVITATIONS = 'invitation_letters';
const COL_CLASSES = 'academic_classes';
const COL_SUBJECTS = 'academic_subjects';
const COL_USERS = 'users';
const COL_TIMETABLES = 'academic_timetables';
const COL_TELEGRAM_BOTS = 'telegram_bots';
const COL_SETTINGS = 'school_settings';

// ─────────────────────────────────────────────
// High-Speed In-Memory Cache (RAM Acceleration)
// ─────────────────────────────────────────────
const MEMORY_CACHE_TTL_MS = 25000; // 25s hot cache for instant navigation
const _memoryCache = {
  attendance: { data: null, time: 0 },
  students: { data: null, time: 0 },
  discipline: { data: null, time: 0 },
  dashboard: { data: null, time: 0 },
  classes: { data: null, time: 0 },
  subjects: { data: null, time: 0 },
  users: { data: null, time: 0 },
  timetables: { data: null, time: 0 },
  telegramBots: { data: null, time: 0 },
  telegramGlobalTokens: { data: null, time: 0 },
  settings: { data: null, time: 0 }
};

export function invalidateFirebaseCache(key = null) {
  if (key && _memoryCache[key]) {
    _memoryCache[key].time = 0;
    _memoryCache[key].data = null;
  } else {
    Object.keys(_memoryCache).forEach(k => {
      _memoryCache[k].time = 0;
      _memoryCache[k].data = null;
    });
  }
}

// ─────────────────────────────────────────────
// Default Roster Seeding (Runs if students collection is empty)
// ─────────────────────────────────────────────
export const DEFAULT_ROSTER = {
  '12A': [
    { id: 'STU-001', studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', gender: 'M', className: '12A' },
    { id: 'STU-002', studentId: 'STU-002', name: 'ស្រីណុច វណ្ណី', gender: 'F', className: '12A' },
    { id: 'STU-005', studentId: 'STU-005', name: 'ចាន់ វុទ្ធី', gender: 'M', className: '12A' },
    { id: 'S-001',   studentId: 'S-001',   name: 'សាន វ៉ាន់ឌី', gender: 'M', className: '12A' },
    { id: 'S-004',   studentId: 'S-004',   name: 'ចាន់ ស្រីនី', gender: 'F', className: '12A' },
    { id: 'S-007',   studentId: 'S-007',   name: 'ហ៊ឹម ចាន់ណា', gender: 'F', className: '12A' },
    { id: 'S-010',   studentId: 'S-010',   name: 'មាស សុភា', gender: 'F', className: '12A' },
  ],
  '12B': [
    { id: 'STU-003', studentId: 'STU-003', name: 'ជា វិបុល', gender: 'M', className: '12B' },
    { id: 'S-006',   studentId: 'S-006',   name: 'លី លីហ្សា', gender: 'F', className: '12B' },
  ],
  '11A': [
    { id: 'STU-004', studentId: 'STU-004', name: 'ហេង ឌីណា', gender: 'F', className: '11A' },
    { id: 'STU-006', studentId: 'STU-006', name: 'ស៊ុន មានី', gender: 'F', className: '11A' },
    { id: 'S-005',   studentId: 'S-005',   name: 'មាស សំណាង', gender: 'M', className: '11A' },
  ],
  '11B': [
    { id: 'S-002',   studentId: 'S-002',   name: 'សុខ មាន', gender: 'M', className: '11B' },
    { id: 'S-008',   studentId: 'S-008',   name: 'ឡេង វឌ្ឍនា', gender: 'M', className: '11B' },
  ],
};

// Seed initial student rosters into Firestore if not present
export async function seedStudentsIfEmpty() {
  if (!db) return;
  try {
    const snap = await getDocs(query(collection(db, COL_STUDENTS)));
    if (snap.empty) {
      console.log('[Firebase] Seeding initial student rosters into Firestore...');
      const batch = writeBatch(db);
      Object.entries(DEFAULT_ROSTER).forEach(([className, list]) => {
        list.forEach(student => {
          const docRef = doc(db, COL_STUDENTS, `${className}_${student.id}`);
          batch.set(docRef, { ...student, createdAt: serverTimestamp() });
        });
      });
      await batch.commit();
      console.log('[Firebase] Student rosters seeded successfully.');
    }
  } catch (err) {
    console.error('[Firebase] Error seeding students:', err);
  }
}

// ─────────────────────────────────────────────
// 3. Students API (Firestore)
// ─────────────────────────────────────────────
export async function getStudentsFromFirestore(className = '12A') {
  if (!db) return [];

  try {
    const q = query(collection(db, COL_STUDENTS), where('className', '==', className));
    const snap = await getDocs(q);

    if (snap.empty) {
      return [];
    }

    const students = [];
    snap.forEach(d => students.push({ id: d.id, ...d.data() }));
    return students;
  } catch (err) {
    console.error('[Firebase] Failed to fetch students from Firestore:', err);
    return [];
  }
}

// ─────────────────────────────────────────────
// 4. Save Attendance Records (with 2h support & Deduplication)
// ─────────────────────────────────────────────
export async function saveAttendanceToFirestore(body) {
  if (!db) return { success: false, error: 'Firebase not configured' };

  try {
    const today = new Date().toISOString().split('T')[0];
    const periodVal = String(body.period || '1');
    const className = body.className || '12A';
    const hoursMissed = (periodVal === '1-2' || periodVal.includes('-') || body.hours === 2) ? 2 : 1;

    // A. Delete existing records for same class, date and period to prevent duplicates
    const qExisting = query(
      collection(db, COL_ATTENDANCE),
      where('class', '==', className),
      where('date', '==', today)
    );
    const existingSnap = await getDocs(qExisting);
    const deleteBatch = writeBatch(db);
    let needDelete = false;

    existingSnap.forEach(d => {
      const data = d.data();
      const rPeriod = String(data.period);
      let match = (rPeriod === periodVal);
      if (periodVal.includes('-')) {
        const [pStart, pEnd] = periodVal.split('-');
        if (rPeriod === pStart || rPeriod === pEnd || rPeriod === periodVal) match = true;
      }
      if (match) {
        deleteBatch.delete(d.ref);
        needDelete = true;
      }
    });

    if (needDelete) {
      await deleteBatch.commit();
    }

    // B. Insert new records for students who are ABSENT or on LEAVE
    const insertBatch = writeBatch(db);
    let count = 0;

    (body.records || []).forEach(student => {
      if (student.status === 'ABSENT' || student.status === 'LEAVE') {
        const docId = `REC_${today}_${className}_p${periodVal}_${student.id}`;
        const docRef = doc(db, COL_ATTENDANCE, docId);

        insertBatch.set(docRef, {
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
          recordedBy: body.recordedBy || 'ប្រធានថ្នាក់',
          createdAt: serverTimestamp()
        });
        count++;
      }
    });

    // C. Cache period state for instant reload
    if (body.periodState) {
      const stateDocRef = doc(db, COL_PERIOD_STATE, `${today}_${className}_p${periodVal}`);
      insertBatch.set(stateDocRef, {
        ...body.periodState,
        today,
        className,
        period: periodVal,
        hours: hoursMissed,
        updatedAt: serverTimestamp()
      });
    }

    await insertBatch.commit();

    return {
      success: true,
      data: {
        savedCount: count,
        message: 'រក្សាទុកការស្រង់វត្តមានទៅកាន់ Firebase បានជោគជ័យ'
      }
    };
  } catch (err) {
    console.error('[Firebase] saveAttendanceToFirestore error:', err);
    return { success: false, error: err.message || 'បរាជ័យក្នុងការរក្សាទុកទៅ Firebase' };
  }
}

// ─────────────────────────────────────────────
// 5. Get Saved Period State (Firestore)
// ─────────────────────────────────────────────
export async function getPeriodStateFromFirestore(today, className, periodVal) {
  if (!db) return null;
  try {
    const pKey = String(periodVal);
    const docRef = doc(db, COL_PERIOD_STATE, `${today}_${className}_p${pKey}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }

    // Fallback: reconstruct state from attendance_records collection
    const q = query(
      collection(db, COL_ATTENDANCE),
      where('class', '==', className),
      where('date', '==', today)
    );
    const attSnap = await getDocs(q);
    const matchingDocs = [];
    attSnap.forEach(d => {
      const data = d.data();
      const rP = String(data.period);
      let match = (rP === pKey);
      if (pKey.includes('-')) {
        const [p1, p2] = pKey.split('-');
        if (rP === p1 || rP === p2 || rP === pKey) match = true;
      }
      if (match) matchingDocs.push(data);
    });

    if (matchingDocs.length > 0) {
      const attendanceState = {};
      const leaveReasons = {};
      matchingDocs.forEach(r => {
        attendanceState[r.studentId] = r.status;
        if (r.reason) leaveReasons[r.studentId] = r.reason;
      });
      return {
        attendanceState,
        leaveReasons,
        subject: matchingDocs[0].subject,
        teacher: matchingDocs[0].teacher,
        hours: matchingDocs[0].hours
      };
    }

    return null;
  } catch (err) {
    console.error('[Firebase] getPeriodState error:', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// 6. Reports Calculation (Live from Firestore)
// ─────────────────────────────────────────────
export const KHMER_MONTH_NAMES = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

export function toKhmerDigits(num) {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num).replace(/\d/g, d => khmerDigits[d]);
}

export async function getDailyReportFromFirestore(className = '12A', date = null) {
  if (!db) return null;
  const today = date || new Date().toISOString().split('T')[0];

  try {
    const q = query(
      collection(db, COL_ATTENDANCE),
      where('class', '==', className),
      where('date', '==', today)
    );
    const snap = await getDocs(q);

    const absentStudents = [];
    const studentStatusMap = {};
    let absentCount = 0;
    let leaveCount = 0;

    snap.forEach(d => {
      const r = d.data();
      if (!studentStatusMap[r.name]) {
        studentStatusMap[r.name] = r.status;
      } else if (r.status === 'ABSENT') {
        studentStatusMap[r.name] = 'ABSENT';
      }
    });

    Object.keys(studentStatusMap).forEach(name => {
      absentStudents.push(name);
      if (studentStatusMap[name] === 'ABSENT') absentCount++;
      else leaveCount++;
    });

    let totalStudents = DEFAULT_ROSTER[className]?.length || 7;
    try {
      const stSnap = await getDocs(query(collection(db, COL_STUDENTS), where('className', '==', className)));
      if (!stSnap.empty) totalStudents = stSnap.size;
    } catch (e) {}

    const totalMissed = absentCount + leaveCount;
    const presentCount = Math.max(0, totalStudents - totalMissed);
    const rate = totalStudents > 0 ? `${Math.round((presentCount / totalStudents) * 100)}%` : '100%';

    return {
      className,
      date: today,
      present: presentCount,
      absent: totalMissed,
      leave: leaveCount,
      totalStudents,
      attendanceRate: rate,
      absentStudents
    };
  } catch (err) {
    console.error('[Firebase] getDailyReport error:', err);
    return null;
  }
}

export async function getWeeklyReportFromFirestore(className = '12A', refDate = null) {
  if (!db) return null;
  try {
    const d = refDate ? new Date(refDate) : new Date();
    const day = d.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMon);
    const startStr = monday.toISOString().split('T')[0];

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const endStr = sunday.toISOString().split('T')[0];

    const q = query(
      collection(db, COL_ATTENDANCE),
      where('class', '==', className)
    );
    const snap = await getDocs(q);

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

    snap.forEach(docSnap => {
      const r = docSnap.data();
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

    let totalStudents = DEFAULT_ROSTER[className]?.length || 7;
    try {
      const stSnap = await getDocs(query(collection(db, COL_STUDENTS), where('className', '==', className)));
      if (!stSnap.empty) totalStudents = stSnap.size;
    } catch (e) {}

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
  } catch (err) {
    console.error('[Firebase] getWeeklyReport error:', err);
    return null;
  }
}

export async function getMonthlyReportFromFirestore(className = '12A', refDate = null) {
  if (!db) return null;
  try {
    const d = refDate ? new Date(refDate) : new Date();
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthNameKh = KHMER_MONTH_NAMES[month];

    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const q = query(
      collection(db, COL_ATTENDANCE),
      where('class', '==', className)
    );
    const snap = await getDocs(q);

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

    snap.forEach(docSnap => {
      const r = docSnap.data();
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

    let totalStudents = DEFAULT_ROSTER[className]?.length || 7;
    try {
      const stSnap = await getDocs(query(collection(db, COL_STUDENTS), where('className', '==', className)));
      if (!stSnap.empty) totalStudents = stSnap.size;
    } catch (e) {}

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
  } catch (err) {
    console.error('[Firebase] getMonthlyReport error:', err);
    return null;
  }
}

export async function getYearlyReportFromFirestore(className = '12A', refDate = null) {
  if (!db) return null;
  try {
    const d = refDate ? new Date(refDate) : new Date();
    const year = d.getFullYear();
    const yearKh = toKhmerDigits(year);

    const startStr = `${year}-01-01`;
    const endStr = `${year}-12-31`;

    const q = query(
      collection(db, COL_ATTENDANCE),
      where('class', '==', className)
    );
    const snap = await getDocs(q);

    const yearMonths = KHMER_MONTH_NAMES.map((mName, idx) => ({
      mIndex: idx + 1,
      date: mName,
      absent: 0
    }));

    const studentMap = {};
    let totalAbsences = 0;
    let totalLeaves = 0;

    snap.forEach(docSnap => {
      const r = docSnap.data();
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

    let totalStudents = DEFAULT_ROSTER[className]?.length || 7;
    try {
      const stSnap = await getDocs(query(collection(db, COL_STUDENTS), where('className', '==', className)));
      if (!stSnap.empty) totalStudents = stSnap.size;
    } catch (e) {}

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
  } catch (err) {
    console.error('[Firebase] getYearlyReport error:', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// 7. Admin Student Attendance API (Firestore)
// ─────────────────────────────────────────────
export async function getAllAttendanceRecordsFromFirestore(force = false) {
  if (!force && _memoryCache.attendance.data && (Date.now() - _memoryCache.attendance.time < MEMORY_CACHE_TTL_MS)) {
    return _memoryCache.attendance.data;
  }
  if (!db) return [];
  try {
    const q = query(collection(db, COL_ATTENDANCE));
    const snap = await getDocs(q);
    const records = [];
    snap.forEach(d => {
      const data = d.data();
      records.push({
        id: d.id,
        ...data,
        // Normalize fields
        studentId: data.studentId || d.id,
        name: data.name || 'សិស្ស',
        class: data.class || '12A',
        date: data.date || '',
        subject: data.subject || 'ទូទៅ',
        teacher: data.teacher || '',
        time: data.time || '07:00 - 09:00',
        reason: data.reason || (data.status === 'LEAVE' ? 'មានច្បាប់' : 'គ្មានច្បាប់'),
        status: data.status || 'ABSENT',
        hours: data.hours || 1,
        period: data.period || '1'
      });
    });
    _memoryCache.attendance.data = records;
    _memoryCache.attendance.time = Date.now();
    return records;
  } catch (err) {
    console.error('[Firebase] getAllAttendanceRecords error:', err);
    return _memoryCache.attendance.data || [];
  }
}

export async function updateAttendanceRecordInFirestore(recordId, updateData) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docRef = doc(db, COL_ATTENDANCE, recordId);
    await setDoc(docRef, { ...updateData, updatedAt: serverTimestamp() }, { merge: true });
    invalidateFirebaseCache('attendance');
    invalidateFirebaseCache('discipline');
    invalidateFirebaseCache('dashboard');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] updateAttendanceRecord error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteAttendanceRecordInFirestore(recordId) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docRef = doc(db, COL_ATTENDANCE, recordId);
    await deleteDoc(docRef);
    invalidateFirebaseCache('attendance');
    invalidateFirebaseCache('discipline');
    invalidateFirebaseCache('dashboard');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] deleteAttendanceRecord error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteMultipleAttendanceRecordsInFirestore(recordIds = []) {
  if (!db || recordIds.length === 0) return { success: false, error: 'No IDs or DB' };
  try {
    const batch = writeBatch(db);
    recordIds.forEach(id => {
      batch.delete(doc(db, COL_ATTENDANCE, id));
    });
    await batch.commit();
    invalidateFirebaseCache('attendance');
    invalidateFirebaseCache('discipline');
    invalidateFirebaseCache('dashboard');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] deleteMultipleAttendanceRecords error:', err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// 8. Admin Dashboard Live Stats (Firestore)
// ─────────────────────────────────────────────
export async function getAdminDashboardStatsFromFirestore(force = false) {
  if (!force && _memoryCache.dashboard.data && (Date.now() - _memoryCache.dashboard.time < MEMORY_CACHE_TTL_MS)) {
    return _memoryCache.dashboard.data;
  }
  if (!db) return null;
  try {
    const records = await getAllAttendanceRecordsFromFirestore(force);

    // Real student count from Firestore
    const allStudentsList = await getAllStudentsFromFirestore(force);
    const totalStudents = (allStudentsList || []).length;

    // Today's summary
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.date === today);
    const todayStudentMap = {};
    todayRecords.forEach(r => {
      if (!todayStudentMap[r.name]) {
        todayStudentMap[r.name] = r.status;
      } else if (r.status === 'ABSENT') {
        todayStudentMap[r.name] = 'ABSENT';
      }
    });

    let todayAbsent = 0;
    let todayLeave = 0;
    Object.values(todayStudentMap).forEach(st => {
      if (st === 'ABSENT') todayAbsent++;
      else todayLeave++;
    });

    const totalAbsentAllTime = records.filter(r => r.status === 'ABSENT').length;
    const totalLeaveAllTime = records.filter(r => r.status === 'LEAVE').length;
    const globalRate = totalStudents > 0 
      ? Math.max(0, Math.round(((totalStudents - (todayAbsent + todayLeave)) / totalStudents) * 100)) 
      : 100;

    // Weekly trend
    const dayNamesKhmer = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហ', 'សុក្រ', 'សៅរ៍'];
    const weeklyMap = { 'ច័ន្ទ': 0, 'អង្គារ': 0, 'ពុធ': 0, 'ព្រហ': 0, 'សុក្រ': 0, 'សៅរ៍': 0 };
    records.forEach(r => {
      if (r.date) {
        const d = new Date(r.date);
        const dayName = dayNamesKhmer[d.getDay()];
        if (weeklyMap[dayName] !== undefined && r.status === 'ABSENT') {
          weeklyMap[dayName] += (r.hours || 1);
        }
      }
    });
    const weeklyTrend = Object.entries(weeklyMap).map(([date, absent]) => ({ date, absent }));

    // Monthly trend
    const monthNamesKhmer = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    const monthlyMap = {};
    monthNamesKhmer.forEach(m => { monthlyMap[m] = 0; });
    records.forEach(r => {
      if (r.date) {
        const d = new Date(r.date);
        const mName = monthNamesKhmer[d.getMonth()];
        if (monthlyMap[mName] !== undefined && r.status === 'ABSENT') {
          monthlyMap[mName] += (r.hours || 1);
        }
      }
    });
    const monthlyTrend = Object.entries(monthlyMap).map(([month, absent]) => ({ month, absent }));

    // Grade trend
    const gradeMap = { 'ថ្នាក់ទី១០': 0, 'ថ្នាក់ទី១១': 0, 'ថ្នាក់ទី១២': 0 };
    records.forEach(r => {
      const cls = String(r.class || '');
      if (cls.startsWith('10')) gradeMap['ថ្នាក់ទី១០'] += (r.hours || 1);
      else if (cls.startsWith('11')) gradeMap['ថ្នាក់ទី១១'] += (r.hours || 1);
      else if (cls.startsWith('12')) gradeMap['ថ្នាក់ទី១២'] += (r.hours || 1);
    });
    const gradeTrend = [
      { name: 'ថ្នាក់ទី១០', absent: gradeMap['ថ្នាក់ទី១០'], fill: '#8b5cf6' },
      { name: 'ថ្នាក់ទី១១', absent: gradeMap['ថ្នាក់ទី១១'], fill: '#3b82f6' },
      { name: 'ថ្នាក់ទី១២', absent: gradeMap['ថ្នាក់ទី១២'], fill: '#f43f5e' }
    ];

    // Class trend
    const classMap = {};
    ['12A', '12B', '11A', '11B'].forEach(c => { classMap[c] = 0; });
    records.forEach(r => {
      const cls = r.class || '12A';
      if (classMap[cls] !== undefined && r.status === 'ABSENT') {
        classMap[cls] += (r.hours || 1);
      }
    });
    const classTrend = Object.entries(classMap).map(([name, absent]) => ({ name, absent }));

    const result = {
      totalStudents,
      totalAbsent: totalAbsentAllTime,
      totalLeave: totalLeaveAllTime,
      globalRate: globalRate || 0,
      todayAbsent,
      todayLeave,
      weeklyTrend,
      monthlyTrend,
      gradeTrend,
      classTrend
    };
    _memoryCache.dashboard.data = result;
    _memoryCache.dashboard.time = Date.now();
    return result;
  } catch (err) {
    console.error('[Firebase] getAdminDashboardStats error:', err);
    return _memoryCache.dashboard.data || null;
  }
}

// ─────────────────────────────────────────────
// 9. Student Management CRUD (Firestore)
// ─────────────────────────────────────────────
export async function getAllStudentsFromFirestore(force = false) {
  if (!force && _memoryCache.students.data && (Date.now() - _memoryCache.students.time < MEMORY_CACHE_TTL_MS)) {
    return _memoryCache.students.data;
  }
  if (!db) return [];
  try {
    const q = query(collection(db, COL_STUDENTS));
    const snap = await getDocs(q);

    if (snap.empty) {
      _memoryCache.students.data = [];
      _memoryCache.students.time = Date.now();
      return [];
    }

    const students = [];
    snap.forEach(d => {
      const data = d.data();
      const sId = data.id || data.studentId || d.id.split('_')[1] || d.id;
      const cls = data.class || data.className || d.id.split('_')[0] || '12A';
      students.push({
        id: sId,
        studentId: sId,
        docId: d.id,
        name: data.name || '',
        gender: data.gender || 'M',
        class: cls,
        className: cls,
        dob: data.dob || '2006-01-01',
        phone: data.phone || '',
        parentName: data.parentName || '',
        parentPhone: data.parentPhone || '',
        status: data.status || 'active'
      });
    });
    _memoryCache.students.data = students;
    _memoryCache.students.time = Date.now();
    return students;
  } catch (err) {
    console.error('[Firebase] getAllStudentsFromFirestore error:', err);
    return _memoryCache.students.data || [];
  }
}

export async function saveStudentToFirestore(studentData) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const sId = String(studentData.id || studentData.studentId).trim();
    const cls = String(studentData.class || studentData.className || '12A').trim();
    const docId = `${cls}_${sId}`;
    const docRef = doc(db, COL_STUDENTS, docId);

    const payload = {
      id: sId,
      studentId: sId,
      name: studentData.name,
      gender: studentData.gender || 'M',
      class: cls,
      className: cls,
      dob: studentData.dob || '',
      phone: studentData.phone || '',
      parentName: studentData.parentName || '',
      parentPhone: studentData.parentPhone || '',
      status: studentData.status || 'active',
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, payload, { merge: true });
    invalidateFirebaseCache('students');
    invalidateFirebaseCache('discipline');
    return { success: true, data: payload };
  } catch (err) {
    console.error('[Firebase] saveStudentToFirestore error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteStudentFromFirestore(studentId, className) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const sId = String(studentId).trim();
    const cls = String(className || '12A').trim();
    const docId = `${cls}_${sId}`;

    // 1. Try exact composite docId
    const docRef = doc(db, COL_STUDENTS, docId);
    await deleteDoc(docRef);

    // 2. Also clean up any doc matching id == studentId
    const q = query(collection(db, COL_STUDENTS), where('id', '==', sId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    let needCommit = false;
    snap.forEach(d => {
      batch.delete(d.ref);
      needCommit = true;
    });
    if (needCommit) await batch.commit();

    invalidateFirebaseCache('students');
    invalidateFirebaseCache('discipline');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] deleteStudentFromFirestore error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteMultipleStudentsFromFirestore(studentIds = []) {
  if (!db || studentIds.length === 0) return { success: false, error: 'No IDs or DB' };
  try {
    const idSet = new Set(studentIds.map(id => String(id).trim()));
    const q = query(collection(db, COL_STUDENTS));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    let count = 0;

    snap.forEach(d => {
      const data = d.data();
      const sId = data.id || data.studentId || d.id.split('_')[1];
      if (idSet.has(sId) || idSet.has(d.id)) {
        batch.delete(d.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }
    invalidateFirebaseCache('students');
    invalidateFirebaseCache('discipline');
    return { success: true, count };
  } catch (err) {
    console.error('[Firebase] deleteMultipleStudents error:', err);
    return { success: false, error: err.message };
  }
}

export async function importMultipleStudentsToFirestore(studentsList = []) {
  if (!db || studentsList.length === 0) return { success: false, error: 'Empty list' };
  try {
    const batch = writeBatch(db);
    studentsList.forEach(student => {
      const sId = String(student.id || student.studentId).trim();
      const cls = String(student.class || student.className || '12A').trim();
      const docId = `${cls}_${sId}`;
      const docRef = doc(db, COL_STUDENTS, docId);

      batch.set(docRef, {
        id: sId,
        studentId: sId,
        name: student.name,
        gender: student.gender || 'M',
        class: cls,
        className: cls,
        dob: student.dob || '',
        phone: student.phone || '',
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || '',
        status: student.status || 'active',
        createdAt: serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    invalidateFirebaseCache('students');
    invalidateFirebaseCache('discipline');
    return { success: true, count: studentsList.length };
  } catch (err) {
    console.error('[Firebase] importMultipleStudents error:', err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// 10. Student Discipline Tracking (Firestore)
// ─────────────────────────────────────────────
export async function getStudentDisciplineTrackingFromFirestore(force = false) {
  if (!force && _memoryCache.discipline.data && (Date.now() - _memoryCache.discipline.time < MEMORY_CACHE_TTL_MS)) {
    return _memoryCache.discipline.data;
  }
  if (!db) return null;
  try {
    const [students, records] = await Promise.all([
      getAllStudentsFromFirestore(force),
      getAllAttendanceRecordsFromFirestore(force)
    ]);

    const studentRecordsMap = new Map();
    records.forEach(rec => {
      const keys = [];
      if (rec.studentId) keys.push(String(rec.studentId).toLowerCase().trim());
      if (rec.id) keys.push(String(rec.id).toLowerCase().trim());
      if (rec.name) keys.push(String(rec.name).toLowerCase().trim());

      keys.forEach(k => {
        if (!studentRecordsMap.has(k)) {
          studentRecordsMap.set(k, []);
        }
        studentRecordsMap.get(k).push(rec);
      });
    });

    const trackingList = [];
    const processedKeys = new Set();

    students.forEach(student => {
      const sIdKey = String(student.id || student.studentId).toLowerCase().trim();
      const sNameKey = String(student.name).toLowerCase().trim();
      processedKeys.add(sIdKey);
      processedKeys.add(sNameKey);

      const matchingRecs = new Map();
      (studentRecordsMap.get(sIdKey) || []).forEach(r => matchingRecs.set(r.id, r));
      (studentRecordsMap.get(sNameKey) || []).forEach(r => matchingRecs.set(r.id, r));

      const recList = Array.from(matchingRecs.values()).sort((a, b) => {
        return (b.date || '').localeCompare(a.date || '');
      });

      // គោលការណ៍សាលា៖ ក្នុង ១ ថ្ងៃ រាប់ត្រឹមតែ ១ ដងប៉ុណ្ណោះ (Unique Days Count)
      const dateMap = new Map();
      recList.forEach(r => {
        const d = r.date || 'unknown';
        if (!dateMap.has(d)) dateMap.set(d, []);
        dateMap.get(d).push(r);
      });

      let absentDays = 0;
      let leaveDays = 0;
      let absentHours = 0;
      let leaveHours = 0;

      recList.forEach(r => {
        const hrs = Number(r.hours) || 1;
        if (r.status === 'LEAVE') {
          leaveHours += hrs;
        } else {
          absentHours += hrs;
        }
      });

      dateMap.forEach(dayRecs => {
        const hasUnexcused = dayRecs.some(r => r.status === 'ABSENT' || !r.status || r.status === 'LATE');
        const hasLeave = dayRecs.some(r => r.status === 'LEAVE');

        if (hasUnexcused) {
          absentDays += 1;
        } else if (hasLeave) {
          leaveDays += 1;
        }
      });

      trackingList.push({
        id: student.id,
        studentId: student.id || student.studentId,
        name: student.name,
        gender: student.gender || 'M',
        class: student.class || student.className || '12A',
        dob: student.dob || '',
        phone: student.phone || '',
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || '',
        status: student.status || 'active',
        leave: leaveDays,
        absent: absentDays,
        leaveHours: leaveHours,
        absentHours: absentHours,
        totalHours: absentHours + leaveHours,
        records: recList
      });
    });

    // Check if any student in attendance records is missing from students collection
    records.forEach(r => {
      const sNameKey = String(r.name).toLowerCase().trim();
      const sIdKey = String(r.studentId || r.id).toLowerCase().trim();
      if (!processedKeys.has(sNameKey) && !processedKeys.has(sIdKey)) {
        processedKeys.add(sNameKey);
        processedKeys.add(sIdKey);

        const matched = new Map();
        (studentRecordsMap.get(sNameKey) || []).forEach(m => matched.set(m.id, m));
        (studentRecordsMap.get(sIdKey) || []).forEach(m => matched.set(m.id, m));
        const matchingRecs = Array.from(matched.values());

        const dayMap = new Map();
        let absentHours = 0;
        let leaveHours = 0;

        matchingRecs.forEach(m => {
          const d = m.date || 'unknown';
          const hrs = Number(m.hours) || 1;
          if (m.status === 'LEAVE') leaveHours += hrs;
          else absentHours += hrs;

          if (!dayMap.has(d)) dayMap.set(d, []);
          dayMap.get(d).push(m);
        });

        let absentDays = 0;
        let leaveDays = 0;
        dayMap.forEach(dayRecs => {
          const hasUnexcused = dayRecs.some(m => m.status === 'ABSENT' || !m.status || m.status === 'LATE');
          const hasLeave = dayRecs.some(m => m.status === 'LEAVE');

          if (hasUnexcused) absentDays += 1;
          else if (hasLeave) leaveDays += 1;
        });

        trackingList.push({
          id: r.studentId || r.id,
          studentId: r.studentId || r.id,
          name: r.name,
          gender: 'M',
          class: r.class || '12A',
          phone: '',
          parentPhone: '012 345 678',
          leave: leaveDays,
          absent: absentDays,
          leaveHours: leaveHours,
          absentHours: absentHours,
          totalHours: absentHours + leaveHours,
          records: matchingRecs
        });
      }
    });

    _memoryCache.discipline.data = trackingList;
    _memoryCache.discipline.time = Date.now();
    return trackingList;
  } catch (err) {
    console.error('[Firebase] getStudentDisciplineTracking error:', err);
    return _memoryCache.discipline.data || null;
  }
}

// ─────────────────────────────────────────────
// 11. Invitation Letters (Firestore)
// ─────────────────────────────────────────────
export async function getInvitationLettersFromFirestore() {
  if (!db) return [];
  try {
    const q = query(collection(db, COL_INVITATIONS));
    const snap = await getDocs(q);
    const letters = [];
    snap.forEach(d => {
      letters.push({ id: d.id, ...d.data() });
    });
    return letters;
  } catch (err) {
    console.error('[Firebase] getInvitationLetters error:', err);
    return [];
  }
}

export async function saveInvitationLetterToFirestore(letterData) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docId = letterData.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, COL_INVITATIONS, docId);
    await setDoc(docRef, {
      ...letterData,
      id: docId,
      createdAt: serverTimestamp()
    }, { merge: true });
    return { success: true, id: docId };
  } catch (err) {
    console.error('[Firebase] saveInvitationLetter error:', err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// 12. Academic Classes & Subjects (Firestore)
// ─────────────────────────────────────────────
const DEFAULT_ACADEMIC_CLASSES = [
  { id: 'c1', name: 'ថ្នាក់ 12A', students: 35, teacher: 'លោកគ្រូ សាន វិបុល' },
  { id: 'c2', name: 'ថ្នាក់ 12B', students: 32, teacher: 'អ្នកគ្រូ ហេង សុផល' },
  { id: 'c3', name: 'ថ្នាក់ 11A', students: 40, teacher: 'លោកគ្រូ ចាន់ ណារិន' },
  { id: 'c4', name: 'ថ្នាក់ 11B', students: 38, teacher: 'អ្នកគ្រូ កែវ សុខា' },
  { id: 'c5', name: 'ថ្នាក់ 10A', students: 42, teacher: 'លោកគ្រូ ឡុង ពិសិដ្ឋ' },
  { id: 'c6', name: 'ថ្នាក់ 10B', students: 36, teacher: 'អ្នកគ្រូ ជា ស្រីពៅ' },
];

const DEFAULT_ACADEMIC_SUBJECTS = [
  { id: 's1', name: 'គណិតវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
  { id: 's2', name: 'រូបវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
  { id: 's3', name: 'គីមីវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
  { id: 's4', name: 'ជីវវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
  { id: 's5', name: 'អក្សរសាស្ត្រខ្មែរ', type: 'សង្គម' },
  { id: 's6', name: 'ប្រវត្តិវិទ្យា', type: 'សង្គម' },
  { id: 's7', name: 'ភាសាអង់គ្លេស', type: 'ភាសាបរទេស' },
  { id: 's8', name: 'ពលរដ្ឋវិទ្យា', type: 'សង្គម' },
  { id: 's9', name: 'ព័ត៌មានវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
  { id: 's10', name: 'អប់រំកាយ/កីឡា', type: 'ទូទៅ' },
];

export async function getClassesFromFirestore(force = false) {
  if (!force && _memoryCache.classes.data && (Date.now() - _memoryCache.classes.time < MEMORY_CACHE_TTL_MS)) {
    return _memoryCache.classes.data;
  }
  if (!db) return DEFAULT_ACADEMIC_CLASSES;
  try {
    const q = query(collection(db, COL_CLASSES));
    const snap = await getDocs(q);

    // If empty, auto-seed defaults
    if (snap.empty) {
      _memoryCache.classes.data = [];
      _memoryCache.classes.time = Date.now();
      return [];
    }

    // Reuse fast cached students list instead of separate un-cached query
    const studentsList = await getAllStudentsFromFirestore(force);
    const classCountMap = {};
    studentsList.forEach(s => {
      const cls = s.class || s.className;
      if (cls) {
        classCountMap[cls] = (classCountMap[cls] || 0) + 1;
        classCountMap[`ថ្នាក់ ${cls}`] = (classCountMap[`ថ្នាក់ ${cls}`] || 0) + 1;
      }
    });

    const classes = [];
    snap.forEach(d => {
      const data = d.data();
      const cName = data.name || '';
      const realCount = classCountMap[cName] || classCountMap[cName.replace('ថ្នាក់ ', '')] || data.students || 0;
      classes.push({
        id: d.id,
        ...data,
        students: realCount
      });
    });
    _memoryCache.classes.data = classes;
    _memoryCache.classes.time = Date.now();
    return classes;
  } catch (err) {
    console.error('[Firebase] getClasses error:', err);
    return _memoryCache.classes.data || DEFAULT_ACADEMIC_CLASSES;
  }
}

export async function saveClassToFirestore(classData) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docId = classData.id || `c_${Date.now()}`;
    const docRef = doc(db, COL_CLASSES, docId);
    const payload = {
      ...classData,
      id: docId,
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, payload, { merge: true });
    invalidateFirebaseCache('classes');
    return { success: true, data: payload };
  } catch (err) {
    console.error('[Firebase] saveClass error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteClassFromFirestore(classId) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docRef = doc(db, COL_CLASSES, classId);
    await deleteDoc(docRef);
    invalidateFirebaseCache('classes');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] deleteClass error:', err);
    return { success: false, error: err.message };
  }
}

export async function getSubjectsFromFirestore(force = false) {
  if (!force && _memoryCache.subjects.data && (Date.now() - _memoryCache.subjects.time < MEMORY_CACHE_TTL_MS)) {
    return _memoryCache.subjects.data;
  }
  if (!db) return DEFAULT_ACADEMIC_SUBJECTS;
  try {
    const q = query(collection(db, COL_SUBJECTS));
    const snap = await getDocs(q);

    // If empty, auto-seed defaults
    if (snap.empty) {
      _memoryCache.subjects.data = [];
      _memoryCache.subjects.time = Date.now();
      return [];
    }

    const subjects = [];
    snap.forEach(d => {
      subjects.push({ id: d.id, ...d.data() });
    });
    _memoryCache.subjects.data = subjects;
    _memoryCache.subjects.time = Date.now();
    return subjects;
  } catch (err) {
    console.error('[Firebase] getSubjects error:', err);
    return _memoryCache.subjects.data || DEFAULT_ACADEMIC_SUBJECTS;
  }
}

export async function saveSubjectToFirestore(subjectData) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docId = subjectData.id || `s_${Date.now()}`;
    const docRef = doc(db, COL_SUBJECTS, docId);
    const payload = {
      ...subjectData,
      id: docId,
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, payload, { merge: true });
    invalidateFirebaseCache('subjects');
    return { success: true, data: payload };
  } catch (err) {
    console.error('[Firebase] saveSubject error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteSubjectFromFirestore(subjectId) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docRef = doc(db, COL_SUBJECTS, subjectId);
    await deleteDoc(docRef);
    invalidateFirebaseCache('subjects');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] deleteSubject error:', err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// Users & Permissions Management Functions
// ─────────────────────────────────────────────
export const DEFAULT_USERS = [
  { id: 'USR-001', name: 'San Vandy', username: 'vandy12A', role: 'monitor', class: '12A', status: 'active', lastLogin: '2026-06-30' },
  { id: 'USR-002', name: 'Sok Mean', username: 'mean11B', role: 'monitor', class: '11B', status: 'active', lastLogin: '2026-06-29' },
  { id: 'USR-003', name: 'Admin Chhen', username: 'admin_sys', role: 'admin', class: '-', status: 'active', lastLogin: '2026-07-01' },
  { id: 'USR-004', name: 'Keo Rotha', username: 'rotha10A', role: 'monitor', class: '10A', status: 'inactive', lastLogin: '2026-05-15' },
  { id: 'USR-005', name: 'Somnang', username: 'somnang1', role: 'monitor', class: '11A', status: 'active', lastLogin: '2026-06-20' },
];

export async function getUsersFromFirestore(force = false) {
  if (!force && _memoryCache.users.data && (Date.now() - _memoryCache.users.time < MEMORY_CACHE_TTL_MS)) {
    return _memoryCache.users.data;
  }
  if (!db) return DEFAULT_USERS;
  try {
    const q = query(collection(db, COL_USERS));
    const snap = await getDocs(q);

    // If empty, auto-seed defaults
    if (snap.empty) {
      const batch = writeBatch(db);
      DEFAULT_USERS.forEach(u => {
        batch.set(doc(db, COL_USERS, u.id), { ...u, createdAt: serverTimestamp() });
      });
      await batch.commit();
      _memoryCache.users.data = DEFAULT_USERS;
      _memoryCache.users.time = Date.now();
      return DEFAULT_USERS;
    }

    const users = [];
    snap.forEach(d => {
      users.push({ id: d.id, ...d.data() });
    });
    _memoryCache.users.data = users;
    _memoryCache.users.time = Date.now();
    return users;
  } catch (err) {
    console.error('[Firebase] getUsers error:', err);
    return _memoryCache.users.data || DEFAULT_USERS;
  }
}

export async function saveUserToFirestore(userData) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docId = userData.id || `USR-${String(Date.now()).slice(-4)}`;
    const docRef = doc(db, COL_USERS, docId);
    const payload = {
      ...userData,
      id: docId,
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, payload, { merge: true });
    invalidateFirebaseCache('users');
    return { success: true, data: payload };
  } catch (err) {
    console.error('[Firebase] saveUser error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteUserFromFirestore(userId) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docRef = doc(db, COL_USERS, userId);
    await deleteDoc(docRef);
    invalidateFirebaseCache('users');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] deleteUser error:', err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// Academic Timetables (កាលវិភាគ) Firestore Engine
// ─────────────────────────────────────────────
const DEFAULT_TIMETABLES = {
  '12A': [
    // ថ្ងៃច័ន្ទ
    { id: 't1', day: 'mon', period: 'm1', duration: 2, subject: 'គណិតវិទ្យា', teacher: 'លោកគ្រូ សាន វិបុល', isLibre: false },
    { id: 't2', day: 'mon', period: 'm3', duration: 1, subject: 'ភាសាខ្មែរ', teacher: 'លោកគ្រូ សុខ ផល្លា', isLibre: false },
    { id: 't3', day: 'mon', period: 'm4', duration: 1, subject: 'រូបវិទ្យា', teacher: 'អ្នកគ្រូ ហេង សុផល', isLibre: false },
    { id: 't4', day: 'mon', period: 'a1', duration: 1, subject: 'គីមីវិទ្យា', teacher: 'លោកគ្រូ ឈុន វឌ្ឍនៈ', isLibre: false },
    { id: 't5', day: 'mon', period: 'a2', duration: 1, subject: 'ជីវវិទ្យា', teacher: 'អ្នកគ្រូ អ៊ុំ សាវ៉ាន', isLibre: false },
    { id: 't6', day: 'mon', period: 'a3', duration: 1, subject: 'ម៉ោងលីប', teacher: '', isLibre: true },

    // ថ្ងៃអង្គារ
    { id: 't7', day: 'tue', period: 'm1', duration: 2, subject: 'ភាសាខ្មែរ', teacher: 'លោកគ្រូ សុខ ផល្លា', isLibre: false },
    { id: 't8', day: 'tue', period: 'm3', duration: 2, subject: 'រូបវិទ្យា', teacher: 'អ្នកគ្រូ ហេង សុផល', isLibre: false },
    { id: 't9', day: 'tue', period: 'a1', duration: 1, subject: 'គណិតវិទ្យា', teacher: 'លោកគ្រូ សាន វិបុល', isLibre: false },
    { id: 't10', day: 'tue', period: 'a2', duration: 1, subject: 'ភាសាអង់គ្លេស', teacher: 'អ្នកគ្រូ កែវ ធីតា', isLibre: false },
    { id: 't11', day: 'tue', period: 'a3', duration: 1, subject: 'ម៉ោងលីប', teacher: '', isLibre: true },

    // ថ្ងៃពុធ
    { id: 't12', day: 'wed', period: 'm1', duration: 2, subject: 'ភាសាអង់គ្លេស', teacher: 'អ្នកគ្រូ កែវ ធីតា', isLibre: false },
    { id: 't13', day: 'wed', period: 'm3', duration: 2, subject: 'គណិតវិទ្យា', teacher: 'លោកគ្រូ សាន វិបុល', isLibre: false },
    { id: 't14', day: 'wed', period: 'a1', duration: 1, subject: 'គីមីវិទ្យា', teacher: 'លោកគ្រូ ឈុន វឌ្ឍនៈ', isLibre: false },
    { id: 't15', day: 'wed', period: 'a2', duration: 1, subject: 'ប្រវត្តិវិទ្យា', teacher: 'លោកគ្រូ ឡុង សារ៉ាត់', isLibre: false },
    { id: 't16', day: 'wed', period: 'a3', duration: 1, subject: 'ម៉ោងលីប', teacher: '', isLibre: true },

    // ថ្ងៃព្រហស្បតិ៍
    { id: 't17', day: 'thu', period: 'm1', duration: 2, subject: 'រូបវិទ្យា', teacher: 'អ្នកគ្រូ ហេង សុផល', isLibre: false },
    { id: 't18', day: 'thu', period: 'm3', duration: 1, subject: 'ជីវវិទ្យា', teacher: 'អ្នកគ្រូ អ៊ុំ សាវ៉ាន', isLibre: false },
    { id: 't19', day: 'thu', period: 'm4', duration: 1, subject: 'គីមីវិទ្យា', teacher: 'លោកគ្រូ ឈុន វឌ្ឍនៈ', isLibre: false },
    { id: 't20', day: 'thu', period: 'a1', duration: 1, subject: 'ម៉ោងលីប', teacher: '', isLibre: true },
    { id: 't21', day: 'thu', period: 'a2', duration: 1, subject: 'ម៉ោងលីប', teacher: '', isLibre: true },
    { id: 't22', day: 'thu', period: 'a3', duration: 1, subject: 'ម៉ោងលីប', teacher: '', isLibre: true },

    // ថ្ងៃសុក្រ
    { id: 't23', day: 'fri', period: 'm1', duration: 2, subject: 'គីមីវិទ្យា', teacher: 'លោកគ្រូ ឈុន វឌ្ឍនៈ', isLibre: false },
    { id: 't24', day: 'fri', period: 'm3', duration: 1, subject: 'គណិតវិទ្យា', teacher: 'លោកគ្រូ សាន វិបុល', isLibre: false },
    { id: 't25', day: 'fri', period: 'm4', duration: 1, subject: 'ពលរដ្ឋវិទ្យា', teacher: 'អ្នកគ្រូ ស៊ឹម ម៉ានី', isLibre: false },
    { id: 't26', day: 'fri', period: 'a1', duration: 1, subject: 'ប្រវត្តិវិទ្យា', teacher: 'លោកគ្រូ ឡុង សារ៉ាត់', isLibre: false },
    { id: 't27', day: 'fri', period: 'a2', duration: 1, subject: 'អប់រំកាយ/កីឡា', teacher: 'លោកគ្រូ ឌី សុវណ្ណ', isLibre: false },
    { id: 't28', day: 'fri', period: 'a3', duration: 1, subject: 'ម៉ោងលីប', teacher: '', isLibre: true },

    // ថ្ងៃសៅរ៍
    { id: 't29', day: 'sat', period: 'm1', duration: 2, subject: 'ព័ត៌មានវិទ្យា', teacher: 'លោកគ្រូ ម៉ែន វិចិត្រ', isLibre: false },
    { id: 't30', day: 'sat', period: 'm3', duration: 1, subject: 'ភាសាខ្មែរ', teacher: 'លោកគ្រូ សុខ ផល្លា', isLibre: false },
    { id: 't31', day: 'sat', period: 'm4', duration: 1, subject: 'ជីវវិទ្យា', teacher: 'អ្នកគ្រូ អ៊ុំ សាវ៉ាន', isLibre: false },
    { id: 't32', day: 'sat', period: 'a1', duration: 1, subject: 'ម៉ោងលីប', teacher: '', isLibre: true },
    { id: 't33', day: 'sat', period: 'a2', duration: 1, subject: 'ម៉ោងលីប', teacher: '', isLibre: true },
    { id: 't34', day: 'sat', period: 'a3', duration: 1, subject: 'ម៉ោងលីប', teacher: '', isLibre: true },
  ],
  '12B': [
    { id: 'tb1', day: 'mon', period: 'm1', duration: 2, subject: 'ភាសាខ្មែរ', teacher: 'លោកគ្រូ សុខ ផល្លា', isLibre: false },
    { id: 'tb2', day: 'mon', period: 'm3', duration: 2, subject: 'រូបវិទ្យា', teacher: 'អ្នកគ្រូ ហេង សុផល', isLibre: false },
    { id: 'tb3', day: 'mon', period: 'a1', duration: 1, subject: 'ម៉ោងលីប', teacher: '', isLibre: true },
  ]
};

export async function getTimetablesFromFirestore(classId = null) {
  const now = Date.now();
  if (_memoryCache.timetables.data && (now - _memoryCache.timetables.time) < MEMORY_CACHE_TTL_MS) {
    if (classId) return _memoryCache.timetables.data[classId] || [];
    return _memoryCache.timetables.data;
  }

  if (!db) {
    if (classId) return [];
    return {};
  }

  try {
    const colRef = collection(db, COL_TIMETABLES);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      _memoryCache.timetables.data = {};
      _memoryCache.timetables.time = Date.now();
      if (classId) return [];
      return {};
    }

    const timetableMap = {};
    snap.forEach(d => {
      const data = d.data();
      timetableMap[d.id] = data.slots || [];
    });

    _memoryCache.timetables.data = timetableMap;
    _memoryCache.timetables.time = Date.now();

    if (classId) return timetableMap[classId] || [];
    return timetableMap;
  } catch (err) {
    console.error('[Firebase] getTimetables error:', err);
    if (classId) return (_memoryCache.timetables.data && _memoryCache.timetables.data[classId]) || [];
    return _memoryCache.timetables.data || {};
  }
}

export async function saveTimetableToFirestore(classId, slots) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docRef = doc(db, COL_TIMETABLES, classId);
    await setDoc(docRef, {
      classId,
      slots,
      updatedAt: serverTimestamp()
    }, { merge: true });

    invalidateFirebaseCache('timetables');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] saveTimetable error:', err);
    return { success: false, error: err.message };
  }
}

export async function copyTimetableInFirestore(fromClassId, toClassId) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const timetables = await getTimetablesFromFirestore();
    const sourceSlots = timetables[fromClassId] || [];
    const clonedSlots = sourceSlots.map(s => ({
      ...s,
      id: `copy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }));

    await saveTimetableToFirestore(toClassId, clonedSlots);
    return { success: true, count: clonedSlots.length };
  } catch (err) {
    console.error('[Firebase] copyTimetable error:', err);
    return { success: false, error: err.message };
  }
}

export async function clearTimetableInFirestore(classId) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docRef = doc(db, COL_TIMETABLES, classId);
    await setDoc(docRef, {
      classId,
      slots: [],
      updatedAt: serverTimestamp()
    });
    invalidateFirebaseCache('timetables');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] clearTimetable error:', err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// Telegram Bots & Global Settings Firestore Engine
// ─────────────────────────────────────────────
const DEFAULT_TELEGRAM_BOTS = [
  { id: 'BOT-001', class: '12A', name: 'Bot ថ្នាក់ ១២A', token: '123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11', chatId: '-1001234567890', status: 'active', notifyOnAttendance: true, lastUpdated: '2026-07-01' },
  { id: 'BOT-002', class: '12B', name: 'Bot ថ្នាក់ ១២B', token: '987654321:XYZ-DEF1234ghIkl-zyx57W2v1u123ew22', chatId: '-1009876543210', status: 'active', notifyOnAttendance: true, lastUpdated: '2026-06-25' },
  { id: 'BOT-003', class: '11A', name: 'Bot ថ្នាក់ ១១A', token: '555555555:QWE-DEF1234ghIkl-zyx57W2v1u123ew33', chatId: '-1005555555555', status: 'inactive', notifyOnAttendance: true, lastUpdated: '2026-05-10' },
];

const DEFAULT_GLOBAL_TOKENS = [
  { id: 'gt_1', token: '123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11', name: 'Bot សាលាកណ្តាល', isActive: true },
  { id: 'gt_2', token: '987654321:XYZ-UVW9876abCde-rqp98L4m0n987ew22', name: 'Bot បណ្ណាល័យ', isActive: false }
];

export async function getTelegramBotsFromFirestore() {
  const now = Date.now();
  if (_memoryCache.telegramBots.data && (now - _memoryCache.telegramBots.time) < MEMORY_CACHE_TTL_MS) {
    return _memoryCache.telegramBots.data;
  }

  if (!db) return DEFAULT_TELEGRAM_BOTS;

  try {
    const colRef = collection(db, COL_TELEGRAM_BOTS);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      console.log('[Firebase] Seeding initial telegram bots...');
      const batch = writeBatch(db);
      DEFAULT_TELEGRAM_BOTS.forEach(b => {
        batch.set(doc(db, COL_TELEGRAM_BOTS, b.id), { ...b, createdAt: serverTimestamp() });
      });
      await batch.commit();
      _memoryCache.telegramBots.data = DEFAULT_TELEGRAM_BOTS;
      _memoryCache.telegramBots.time = Date.now();
      return DEFAULT_TELEGRAM_BOTS;
    }

    const bots = [];
    snap.forEach(d => {
      bots.push({ id: d.id, ...d.data() });
    });

    _memoryCache.telegramBots.data = bots;
    _memoryCache.telegramBots.time = Date.now();
    return bots;
  } catch (err) {
    console.error('[Firebase] getTelegramBots error:', err);
    return _memoryCache.telegramBots.data || DEFAULT_TELEGRAM_BOTS;
  }
}

export async function saveTelegramBotToFirestore(botData) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docId = botData.id || `BOT-${String(Date.now()).slice(-4)}`;
    const docRef = doc(db, COL_TELEGRAM_BOTS, docId);
    const payload = {
      ...botData,
      id: docId,
      lastUpdated: new Date().toISOString().split('T')[0],
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, payload, { merge: true });
    invalidateFirebaseCache('telegramBots');
    return { success: true, data: payload };
  } catch (err) {
    console.error('[Firebase] saveTelegramBot error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateTelegramBotInFirestore(botId, botData) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docRef = doc(db, COL_TELEGRAM_BOTS, botId);
    const payload = {
      ...botData,
      lastUpdated: new Date().toISOString().split('T')[0],
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, payload, { merge: true });
    invalidateFirebaseCache('telegramBots');
    return { success: true, data: payload };
  } catch (err) {
    console.error('[Firebase] updateTelegramBot error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteTelegramBotFromFirestore(botId) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docRef = doc(db, COL_TELEGRAM_BOTS, botId);
    await deleteDoc(docRef);
    invalidateFirebaseCache('telegramBots');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] deleteTelegramBot error:', err);
    return { success: false, error: err.message };
  }
}

export async function getGlobalTelegramTokensFromFirestore() {
  const now = Date.now();
  if (_memoryCache.telegramGlobalTokens.data && (now - _memoryCache.telegramGlobalTokens.time) < MEMORY_CACHE_TTL_MS) {
    return _memoryCache.telegramGlobalTokens.data;
  }

  if (!db) return DEFAULT_GLOBAL_TOKENS;

  try {
    const docRef = doc(db, COL_SETTINGS, 'telegram');
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      await setDoc(docRef, { globalTokens: DEFAULT_GLOBAL_TOKENS, updatedAt: serverTimestamp() });
      _memoryCache.telegramGlobalTokens.data = DEFAULT_GLOBAL_TOKENS;
      _memoryCache.telegramGlobalTokens.time = Date.now();
      return DEFAULT_GLOBAL_TOKENS;
    }

    const data = snap.data();
    const tokens = data.globalTokens || DEFAULT_GLOBAL_TOKENS;
    _memoryCache.telegramGlobalTokens.data = tokens;
    _memoryCache.telegramGlobalTokens.time = Date.now();
    return tokens;
  } catch (err) {
    console.error('[Firebase] getGlobalTelegramTokens error:', err);
    return _memoryCache.telegramGlobalTokens.data || DEFAULT_GLOBAL_TOKENS;
  }
}

export async function saveGlobalTelegramTokensToFirestore(tokens) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docRef = doc(db, COL_SETTINGS, 'telegram');
    await setDoc(docRef, {
      globalTokens: tokens,
      updatedAt: serverTimestamp()
    }, { merge: true });

    invalidateFirebaseCache('telegramGlobalTokens');
    return { success: true, data: tokens };
  } catch (err) {
    console.error('[Firebase] saveGlobalTelegramTokens error:', err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// School Settings & System Backup/Restore Engine
// ─────────────────────────────────────────────
const DEFAULT_SCHOOL_SETTINGS = {
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

export async function getSchoolSettingsFromFirestore() {
  const now = Date.now();
  if (_memoryCache.settings.data && (now - _memoryCache.settings.time) < MEMORY_CACHE_TTL_MS) {
    return _memoryCache.settings.data;
  }

  if (!db) return DEFAULT_SCHOOL_SETTINGS;

  try {
    const [genDoc, acadDoc, discDoc] = await Promise.all([
      getDoc(doc(db, COL_SETTINGS, 'general')),
      getDoc(doc(db, COL_SETTINGS, 'academic')),
      getDoc(doc(db, COL_SETTINGS, 'discipline'))
    ]);

    const settings = {
      school: genDoc.exists() ? { ...DEFAULT_SCHOOL_SETTINGS.school, ...genDoc.data() } : DEFAULT_SCHOOL_SETTINGS.school,
      academic: acadDoc.exists() ? { ...DEFAULT_SCHOOL_SETTINGS.academic, ...acadDoc.data() } : DEFAULT_SCHOOL_SETTINGS.academic,
      discipline: discDoc.exists() ? { ...DEFAULT_SCHOOL_SETTINGS.discipline, ...discDoc.data() } : DEFAULT_SCHOOL_SETTINGS.discipline,
    };

    _memoryCache.settings.data = settings;
    _memoryCache.settings.time = Date.now();
    return settings;
  } catch (err) {
    console.error('[Firebase] getSchoolSettings error:', err);
    return _memoryCache.settings.data || DEFAULT_SCHOOL_SETTINGS;
  }
}

export async function saveSchoolSettingsToFirestore(settings) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const batch = writeBatch(db);

    if (settings.school) {
      batch.set(doc(db, COL_SETTINGS, 'general'), {
        ...settings.school,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    if (settings.academic) {
      batch.set(doc(db, COL_SETTINGS, 'academic'), {
        ...settings.academic,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    if (settings.discipline) {
      batch.set(doc(db, COL_SETTINGS, 'discipline'), {
        ...settings.discipline,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    await batch.commit();
    invalidateFirebaseCache('settings');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] saveSchoolSettings error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Export complete school database (All Collections) to a single portable JSON backup
 */
export async function exportCompleteDatabaseBackup() {
  try {
    const [
      students,
      attendance,
      classes,
      subjects,
      timetables,
      invitations,
      bots,
      settings,
      users
    ] = await Promise.all([
      getAllStudentsFromFirestore(),
      getAllAttendanceRecordsFromFirestore(),
      getClassesFromFirestore(),
      getSubjectsFromFirestore(),
      getTimetablesFromFirestore(),
      getInvitationLettersFromFirestore(),
      getTelegramBotsFromFirestore(),
      getSchoolSettingsFromFirestore(),
      getUsersFromFirestore()
    ]);

    // Omit sensitive authentication passwords from export for security
    const safeUsers = (users || []).map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      status: u.status,
      assignedClass: u.assignedClass || null,
      phone: u.phone || ''
    }));

    const backupPayload = {
      version: '1.0',
      school: settings?.school?.name || 'វិទ្យាល័យអង្គរកា',
      exportedAt: new Date().toISOString(),
      counts: {
        students: (students || []).length,
        attendance: (attendance || []).length,
        classes: (classes || []).length,
        subjects: (subjects || []).length,
        timetables: Object.keys(timetables || {}).length,
        invitations: (invitations || []).length,
        telegramBots: (bots || []).length,
        users: safeUsers.length
      },
      data: {
        students: students || [],
        attendance: attendance || [],
        classes: classes || [],
        subjects: subjects || [],
        timetables: timetables || {},
        invitations: invitations || [],
        telegramBots: bots || [],
        settings: settings || DEFAULT_SCHOOL_SETTINGS,
        users: safeUsers
      }
    };

    return { success: true, backup: backupPayload };
  } catch (err) {
    console.error('[Firebase] exportCompleteDatabaseBackup error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Restore complete school database from a verified JSON backup object
 */
export async function restoreCompleteDatabaseBackup(backupPayload) {
  if (!backupPayload || !backupPayload.data) {
    return { success: false, error: 'ឯកសារ Backup មិនត្រឹមត្រូវ ឬខូចទម្រង់' };
  }

  const { data } = backupPayload;

  if (db) {
    try {
      // Chunked writes to respect Firestore 500-op limit
      const commitInBatches = async (items, collectionName, idGetter) => {
        if (!items || items.length === 0) return;
        const chunkSize = 400;
        for (let i = 0; i < items.length; i += chunkSize) {
          const chunk = items.slice(i, i + chunkSize);
          const b = writeBatch(db);
          chunk.forEach(item => {
            const docId = idGetter(item);
            if (docId) {
              b.set(doc(db, collectionName, String(docId)), {
                ...item,
                restoredAt: serverTimestamp()
              }, { merge: true });
            }
          });
          await b.commit();
        }
      };

      // 1. Restore Students
      if (data.students && Array.isArray(data.students)) {
        await commitInBatches(data.students, COL_STUDENTS, s => s.id);
      }

      // 2. Restore Attendance Records
      if (data.attendance && Array.isArray(data.attendance)) {
        await commitInBatches(data.attendance, COL_ATTENDANCE, a => a.id);
      }

      // 3. Restore Academic Classes
      if (data.classes && Array.isArray(data.classes)) {
        await commitInBatches(data.classes, COL_CLASSES, c => c.name || c.id);
      }

      // 4. Restore Academic Subjects
      if (data.subjects && Array.isArray(data.subjects)) {
        await commitInBatches(data.subjects, COL_SUBJECTS, s => s.name || s.id);
      }

      // 5. Restore Timetables
      if (data.timetables && typeof data.timetables === 'object') {
        const b = writeBatch(db);
        Object.entries(data.timetables).forEach(([cId, slots]) => {
          b.set(doc(db, COL_TIMETABLES, cId), {
            classId: cId,
            slots,
            restoredAt: serverTimestamp()
          }, { merge: true });
        });
        await b.commit();
      }

      // 6. Restore Telegram Bots
      if (data.telegramBots && Array.isArray(data.telegramBots)) {
        await commitInBatches(data.telegramBots, COL_TELEGRAM_BOTS, b => b.id);
      }

      // 7. Restore Invitations
      if (data.invitations && Array.isArray(data.invitations)) {
        await commitInBatches(data.invitations, COL_INVITATIONS, inv => inv.id);
      }

      // 8. Restore Settings
      if (data.settings) {
        await saveSchoolSettingsToFirestore(data.settings);
      }
    } catch (err) {
      console.error('[Firebase] Firestore batch restore error:', err);
    }
  }

  // Update LocalStorage Caches to guarantee instantaneous offline availability
  try {
    if (data.students) localStorage.setItem('school_students_cache', JSON.stringify(data.students));
    if (data.attendance) {
      localStorage.setItem('school_attendance_cache', JSON.stringify(data.attendance));
      localStorage.setItem('school_attendance_records', JSON.stringify(data.attendance));
    }
    if (data.classes) localStorage.setItem('school_classes_cache', JSON.stringify(data.classes));
    if (data.subjects) localStorage.setItem('school_subjects_cache', JSON.stringify(data.subjects));
    if (data.timetables) localStorage.setItem('school_timetable_cache', JSON.stringify(data.timetables));
    if (data.telegramBots) localStorage.setItem('school_telegram_bots_cache', JSON.stringify(data.telegramBots));
    if (data.settings) localStorage.setItem('school_settings_cache', JSON.stringify(data.settings));
  } catch (e) {
    console.warn('[Cache] LocalStorage cache update error:', e);
  }

  invalidateFirebaseCache();

  return {
    success: true,
    message: 'ការស្ដារទិន្នន័យពី Backup ត្រូវបានបញ្ចប់ដោយជោគជ័យ!',
    counts: backupPayload.counts || {}
  };
}

/**
 * Clean all attendance records, period states, and invitation letters from Firestore and LocalStorage
 */
export async function clearAllAttendanceDataFromFirestore() {
  if (db) {
    try {
      const deleteCollectionDocs = async (colName) => {
        const q = query(collection(db, colName));
        const snap = await getDocs(q);
        if (snap.empty) return;
        const docs = snap.docs;
        const chunkSize = 400;
        for (let i = 0; i < docs.length; i += chunkSize) {
          const chunk = docs.slice(i, i + chunkSize);
          const b = writeBatch(db);
          chunk.forEach(d => b.delete(d.ref));
          await b.commit();
        }
      };

      await deleteCollectionDocs(COL_ATTENDANCE);
      await deleteCollectionDocs(COL_PERIOD_STATE);
      await deleteCollectionDocs(COL_FULL_DAY);
      await deleteCollectionDocs(COL_INVITATIONS);
    } catch (err) {
      console.error('[Firebase] clearAllAttendanceData error:', err);
    }
  }

  // Clear all local attendance caches
  try {
    localStorage.removeItem('school_attendance_records');
    localStorage.removeItem('school_attendance_cache');
    localStorage.removeItem('school_period_state');
    localStorage.removeItem('school_invitations_cache');
    localStorage.removeItem('attendance_records');
    localStorage.setItem('school_attendance_records', '[]');
    localStorage.setItem('school_attendance_cache', '[]');
  } catch (e) {}

  invalidateFirebaseCache('attendance');
  invalidateFirebaseCache('discipline');
  invalidateFirebaseCache('dashboard');

  return { success: true, message: 'បានសម្អាតទិន្នន័យវត្តមាន និងកំណត់ត្រាតេស្តទាំងអស់ដោយជោគជ័យ' };
}

/**
 * Clean all students from Firestore and LocalStorage (reset roster to clean empty state)
 */
export async function clearAllStudentsFromFirestore() {
  if (db) {
    try {
      const q = query(collection(db, COL_STUDENTS));
      const snap = await getDocs(q);
      const docs = snap.docs;
      const chunkSize = 400;
      for (let i = 0; i < docs.length; i += chunkSize) {
        const chunk = docs.slice(i, i + chunkSize);
        const b = writeBatch(db);
        chunk.forEach(d => b.delete(d.ref));
        await b.commit();
      }
    } catch (err) {
      console.error('[Firebase] clearAllStudents error:', err);
    }
  }

  try {
    localStorage.removeItem('school_students_cache');
    localStorage.setItem('school_students_cache', '[]');
  } catch (e) {}

  invalidateFirebaseCache('students');
  invalidateFirebaseCache('discipline');
  invalidateFirebaseCache('dashboard');

  return { success: true, message: 'បានសម្អាតបញ្ជីសិស្សទាំងអស់ដោយជោគជ័យ' };
}

/**
 * Complete Full Factory Reset: Wipes ALL school data from Firestore and LocalStorage
 * - Students
 * - Classes
 * - Subjects
 * - Timetables
 * - Attendance Records & Period States
 * - Invitation Letters
 * - Telegram Bots
 * (Preserves only the Admin account so administrators can log in and re-configure the school)
 */
export async function wipeAllDatabaseDataFromFirestore() {
  if (db) {
    try {
      const deleteCollectionDocs = async (colName) => {
        const q = query(collection(db, colName));
        const snap = await getDocs(q);
        if (snap.empty) return;
        const docs = snap.docs;
        const chunkSize = 400;
        for (let i = 0; i < docs.length; i += chunkSize) {
          const chunk = docs.slice(i, i + chunkSize);
          const b = writeBatch(db);
          chunk.forEach(d => b.delete(d.ref));
          await b.commit();
        }
      };

      await deleteCollectionDocs(COL_ATTENDANCE);
      await deleteCollectionDocs(COL_PERIOD_STATE);
      await deleteCollectionDocs(COL_FULL_DAY);
      await deleteCollectionDocs(COL_INVITATIONS);
      await deleteCollectionDocs(COL_STUDENTS);
      await deleteCollectionDocs(COL_CLASSES);
      await deleteCollectionDocs(COL_SUBJECTS);
      await deleteCollectionDocs(COL_TIMETABLES);
      await deleteCollectionDocs(COL_TELEGRAM_BOTS);

      // Clean non-admin users in users collection
      const uSnap = await getDocs(query(collection(db, COL_USERS)));
      if (!uSnap.empty) {
        const b = writeBatch(db);
        let hasDeletes = false;
        uSnap.docs.forEach(d => {
          const u = d.data();
          if (u.role !== 'admin' && u.username !== 'admin_sys') {
            b.delete(d.ref);
            hasDeletes = true;
          }
        });
        if (hasDeletes) await b.commit();
      }
    } catch (err) {
      console.error('[Firebase] wipeAllDatabaseData error:', err);
    }
  }

  // Clear all LocalStorage caches
  try {
    localStorage.removeItem('school_attendance_records');
    localStorage.removeItem('school_attendance_cache');
    localStorage.removeItem('school_period_state');
    localStorage.removeItem('school_invitations_cache');
    localStorage.removeItem('attendance_records');
    localStorage.removeItem('school_discipline_cache');
    localStorage.removeItem('school_dashboard_cache');
    localStorage.removeItem('printStudent');

    // Remove any dynamic class period keys from localStorage
    Object.keys(localStorage).forEach(key => {
      if (
        key.startsWith('school_period_state_') ||
        key.startsWith('school_active_period_') ||
        key.startsWith('school_full_day_')
      ) {
        localStorage.removeItem(key);
      }
    });

    localStorage.setItem('school_attendance_records', '[]');
    localStorage.setItem('school_attendance_cache', '[]');
    localStorage.setItem('school_discipline_cache', '[]');
    localStorage.setItem('school_invitations_cache', '[]');

    localStorage.removeItem('school_students_cache');
    localStorage.setItem('school_students_cache', '[]');

    localStorage.removeItem('school_classes_cache');
    localStorage.setItem('school_classes_cache', '[]');

    localStorage.removeItem('school_subjects_cache');
    localStorage.setItem('school_subjects_cache', '[]');

    localStorage.removeItem('school_timetable_cache');
    localStorage.setItem('school_timetable_cache', '{}');

    localStorage.removeItem('school_telegram_bots_cache');
    localStorage.setItem('school_telegram_bots_cache', '[]');

    // Keep only Admin User
    const adminUser = {
      id: 'USR-001',
      name: 'Admin Chhen',
      username: 'admin_sys',
      role: 'admin',
      class: '-',
      status: 'active',
      phone: ''
    };
    localStorage.setItem('school_users_cache', JSON.stringify([adminUser]));
  } catch (e) {
    console.warn('[Cache] wipeAll localStorage error:', e);
  }

  invalidateFirebaseCache();

  return { 
    success: true, 
    message: 'បានលុបទិន្នន័យសាលាទាំងអស់ចេញស្អាត ១០០% (បញ្ជីសិស្ស, ថ្នាក់, មុខវិជ្ជា, កាលវិភាគ, វត្តមាន, លិខិត) ដោយជោគជ័យ' 
  };
}





