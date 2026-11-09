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

const getEnv = () => (typeof import.meta !== 'undefined' && import.meta?.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

// 1. Check if Firebase credentials are provided in .env
export function isFirebaseConfigured() {
  const env = getEnv();
  const apiKey = env.VITE_FIREBASE_API_KEY;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;

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
    const env = getEnv();
    const firebaseConfig = {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
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
const COL_DISCIPLINE_RESOLUTIONS = 'discipline_resolutions';
const COL_CLASSES = 'academic_classes';
const COL_SUBJECTS = 'academic_subjects';
const COL_USERS = 'users';
const COL_TIMETABLES = 'academic_timetables';
const COL_TELEGRAM_BOTS = 'telegram_bots';
const COL_SETTINGS = 'school_settings';
const COL_MONTHLY_BACKUPS = 'monthly_backups';

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
// Default Roster Seeding (Removed mock students)
// ─────────────────────────────────────────────
export const DEFAULT_ROSTER = {};

// Initial student rosters (No mock data auto-seeded)
export async function seedStudentsIfEmpty() {
  // Purely dynamic - no mock data seeded
  return;
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
      if (student.status === 'ABSENT' || student.status === 'LEAVE' || student.status === 'DROPOUT') {
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
          subject: body.subject || '',
          teacher: body.teacher || '',
          status: student.status,
          reason: student.reason || (student.status === 'DROPOUT' ? 'ឈប់រៀន' : student.status === 'LEAVE' ? 'មានច្បាប់ត្រឹមត្រូវ' : 'គ្មានច្បាប់ / គេចម៉ោង'),
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
    invalidateFirebaseCache();

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

    const studentRecordsMap = {};
    snap.forEach(d => {
      const r = d.data();
      if (!studentRecordsMap[r.name]) studentRecordsMap[r.name] = [];
      studentRecordsMap[r.name].push(r);
    });

    const absentStudents = [];
    let absentCount = 0;
    let leaveCount = 0;

    Object.keys(studentRecordsMap).forEach(name => {
      const recs = studentRecordsMap[name];
      const hasUnexcused = recs.some(r => r.status === 'ABSENT');
      const hasLeave = recs.some(r => r.status === 'LEAVE');

      if (hasUnexcused) {
        absentCount++;
        absentStudents.push({ name, status: 'ABSENT' });
      } else if (hasLeave) {
        leaveCount++;
        absentStudents.push({ name, status: 'LEAVE', isFullDay: true });
      }
    });

    let totalStudents = 0;
    try {
      const stSnap = await getDocs(query(collection(db, COL_STUDENTS), where('className', '==', className)));
      if (!stSnap.empty) totalStudents = stSnap.size;
    } catch (e) { }

    const presentCount = Math.max(0, totalStudents - absentCount - leaveCount);
    const rate = totalStudents > 0 ? `${Math.round((presentCount / totalStudents) * 100)}%` : '100%';

    return {
      className,
      date: today,
      present: presentCount,
      absent: absentCount,
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

    let totalStudents = 0;
    try {
      const stSnap = await getDocs(query(collection(db, COL_STUDENTS), where('className', '==', className)));
      if (!stSnap.empty) totalStudents = stSnap.size;
    } catch (e) { }

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

    let totalStudents = 0;
    try {
      const stSnap = await getDocs(query(collection(db, COL_STUDENTS), where('className', '==', className)));
      if (!stSnap.empty) totalStudents = stSnap.size;
    } catch (e) { }

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

    let totalStudents = 0;
    try {
      const stSnap = await getDocs(query(collection(db, COL_STUDENTS), where('className', '==', className)));
      if (!stSnap.empty) totalStudents = stSnap.size;
    } catch (e) { }

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

export async function saveRawAttendanceRecordsToFirestore(records = []) {
  if (!db || !Array.isArray(records) || records.length === 0) return { success: true };
  try {
    const batch = writeBatch(db);
    records.forEach(rec => {
      const docId = rec.id || `REC_${rec.date || Date.now()}_${rec.class || 'general'}_${rec.studentId || 'unknown'}`;
      const docRef = doc(db, COL_ATTENDANCE, docId);
      const { id, ...dataToSave } = rec;
      batch.set(docRef, {
        ...dataToSave,
        id: docId
      }, { merge: true });
    });
    await batch.commit();
    invalidateFirebaseCache('attendance');
    invalidateFirebaseCache('discipline');
    invalidateFirebaseCache('dashboard');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] saveRawAttendanceRecords error:', err);
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
      if (!todayStudentMap[r.name]) todayStudentMap[r.name] = [];
      todayStudentMap[r.name].push(r);
    });

    let todayAbsent = 0;
    let todayLeave = 0;
    Object.values(todayStudentMap).forEach(recs => {
      const hasUnexcused = recs.some(r => r.status === 'ABSENT');
      const hasLeave = recs.some(r => r.status === 'LEAVE');
      if (hasUnexcused) {
        todayAbsent++;
      } else if (hasLeave) {
        todayLeave++;
      }
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
export function getTimestampMillis(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val.seconds !== undefined) return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
  if (typeof val === 'string') {
    const t = new Date(val).getTime();
    return isNaN(t) ? 0 : t;
  }
  return 0;
}

export async function getStudentDisciplineTrackingFromFirestore(force = false) {
  if (!force && _memoryCache.discipline.data && (Date.now() - _memoryCache.discipline.time < MEMORY_CACHE_TTL_MS)) {
    return _memoryCache.discipline.data;
  }
  if (!db) return null;
  try {
    const [students, records, resolutions] = await Promise.all([
      getAllStudentsFromFirestore(force),
      getAllAttendanceRecordsFromFirestore(force),
      getDisciplineResolutionsFromFirestore()
    ]);

    const resolutionsMap = new Map();
    (resolutions || []).forEach(r => {
      const keys = [];
      if (r.studentId) keys.push(String(r.studentId).toLowerCase().trim());
      if (r.id) keys.push(String(r.id).toLowerCase().trim());
      if (r.name) keys.push(String(r.name).toLowerCase().trim());
      keys.forEach(k => {
        if (!resolutionsMap.has(k)) resolutionsMap.set(k, []);
        resolutionsMap.get(k).push(r);
      });
    });

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

      // Find resolutions for this student (sorted by most recent first)
      const sResolutions = (resolutionsMap.get(sIdKey) || resolutionsMap.get(sNameKey) || [])
        .sort((a, b) => {
          const tA = getTimestampMillis(a.createdAt) || (a.resolvedDate ? new Date(a.resolvedDate).getTime() : 0);
          const tB = getTimestampMillis(b.createdAt) || (b.resolvedDate ? new Date(b.resolvedDate).getTime() : 0);
          return tB - tA;
        });
      const lastResolution = sResolutions[0] || null;
      const cycleNumber = sResolutions.length + 1;

      // Filter records for current discipline cycle (after last resolution)
      const lastResTime = lastResolution
        ? (getTimestampMillis(lastResolution.createdAt) || (lastResolution.resolvedDate ? new Date(lastResolution.resolvedDate).getTime() : 0))
        : 0;

      const cycleRecList = lastResolution && lastResolution.resolvedDate
        ? recList.filter(r => {
            const rDate = r.date || '';
            if (rDate > lastResolution.resolvedDate) return true;
            if (rDate === lastResolution.resolvedDate) {
              const rTime = getTimestampMillis(r.createdAt);
              if (rTime && lastResTime) {
                return rTime > lastResTime;
              }
            }
            return false;
          })
        : recList;

      // 1. Overall cumulative totals (Lifetime)
      const dateMap = new Map();
      recList.forEach(r => {
        const d = r.date || 'unknown';
        if (!dateMap.has(d)) dateMap.set(d, []);
        dateMap.get(d).push(r);
      });

      let totalAbsentDays = 0;
      let totalLeaveDays = 0;
      let totalAbsentHours = 0;
      let totalLeaveHours = 0;

      recList.forEach(r => {
        const hrs = Number(r.hours) || 1;
        if (r.status === 'LEAVE') {
          totalLeaveHours += hrs;
        } else {
          totalAbsentHours += hrs;
        }
      });

      dateMap.forEach(dayRecs => {
        const hasUnexcused = dayRecs.some(r => r.status === 'ABSENT' || !r.status || r.status === 'LATE');
        const hasLeave = dayRecs.some(r => r.status === 'LEAVE');

        if (hasUnexcused) {
          totalAbsentDays += 1;
        } else if (hasLeave) {
          totalLeaveDays += 1;
        }
      });

      // 2. Current cycle totals (Used for discipline threshold triggers)
      const cycleDateMap = new Map();
      cycleRecList.forEach(r => {
        const d = r.date || 'unknown';
        if (!cycleDateMap.has(d)) cycleDateMap.set(d, []);
        cycleDateMap.get(d).push(r);
      });

      let cycleAbsentDays = 0;
      let cycleLeaveDays = 0;
      let cycleAbsentHours = 0;
      let cycleLeaveHours = 0;

      cycleRecList.forEach(r => {
        const hrs = Number(r.hours) || 1;
        if (r.status === 'LEAVE') {
          cycleLeaveHours += hrs;
        } else {
          cycleAbsentHours += hrs;
        }
      });

      cycleDateMap.forEach(dayRecs => {
        const hasUnexcused = dayRecs.some(r => r.status === 'ABSENT' || !r.status || r.status === 'LATE');
        const hasLeave = dayRecs.some(r => r.status === 'LEAVE');

        if (hasUnexcused) {
          cycleAbsentDays += 1;
        } else if (hasLeave) {
          cycleLeaveDays += 1;
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
        // Cycle counts (used for discipline triggers & resets)
        absent: cycleAbsentDays,
        leave: cycleLeaveDays,
        absentHours: cycleAbsentHours,
        leaveHours: cycleLeaveHours,
        totalHours: cycleAbsentHours + cycleLeaveHours,
        // Cumulative lifetime counts (for transcripts & academic reports)
        totalAbsent: totalAbsentDays,
        totalLeave: totalLeaveDays,
        totalAbsentHours: totalAbsentHours,
        totalLeaveHours: totalLeaveHours,
        lifetimeTotalHours: totalAbsentHours + totalLeaveHours,
        // Discipline cycle metadata
        cycle: cycleNumber,
        resolutions: sResolutions,
        lastResolution: lastResolution,
        records: recList,
        cycleRecords: cycleRecList
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

          if (hasUnexcused) {
            absentDays += 1;
          } else if (hasLeave) {
            leaveDays += 1;
          }
        });

        trackingList.push({
          id: r.studentId || r.id,
          studentId: r.studentId || r.id,
          name: r.name,
          gender: 'M',
          class: r.class || '12A',
          phone: '',
          parentPhone: r.parentPhone || '',
          leave: leaveDays,
          absent: absentDays,
          totalAbsent: absentDays,
          totalLeave: leaveDays,
          leaveHours: leaveHours,
          absentHours: absentHours,
          totalHours: absentHours + leaveHours,
          cycle: 1,
          resolutions: [],
          lastResolution: null,
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

export async function deleteInvitationLetterFromFirestore(id) {
  if (!db || !id) return { success: false, error: 'Firebase not configured or missing ID' };
  try {
    const docRef = doc(db, COL_INVITATIONS, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.error('[Firebase] deleteInvitationLetter error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteBatchInvitationLettersFromFirestore(ids = []) {
  if (!db || !Array.isArray(ids) || ids.length === 0) return { success: true };
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.delete(doc(db, COL_INVITATIONS, id));
    });
    await batch.commit();
    return { success: true };
  } catch (err) {
    console.error('[Firebase] deleteBatchInvitationLetters error:', err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// 11.1 Discipline Resolutions (Firestore)
// ─────────────────────────────────────────────
export async function getDisciplineResolutionsFromFirestore() {
  if (!db) return [];
  try {
    const q = query(collection(db, COL_DISCIPLINE_RESOLUTIONS));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (err) {
    console.error('[Firebase] getDisciplineResolutions error:', err);
    return [];
  }
}

export async function saveDisciplineResolutionToFirestore(resData) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docId = resData.id || `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, COL_DISCIPLINE_RESOLUTIONS, docId);
    await setDoc(docRef, {
      ...resData,
      id: docId,
      createdAt: serverTimestamp()
    }, { merge: true });
    invalidateFirebaseCache('discipline');
    return { success: true, id: docId };
  } catch (err) {
    console.error('[Firebase] saveDisciplineResolution error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteDisciplineResolutionFromFirestore(id) {
  if (!db) return { success: false };
  try {
    await deleteDoc(doc(db, COL_DISCIPLINE_RESOLUTIONS, id));
    invalidateFirebaseCache('discipline');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] deleteDisciplineResolution error:', err);
    return { success: false, error: err.message };
  }
}

export async function saveBatchDisciplineResolutionsToFirestore(resolutions) {
  if (!db || !Array.isArray(resolutions) || resolutions.length === 0) return { success: true };
  try {
    const batch = writeBatch(db);
    resolutions.forEach(resData => {
      const docId = resData.id || `res_${resData.studentId || Date.now()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const docRef = doc(db, COL_DISCIPLINE_RESOLUTIONS, docId);
      batch.set(docRef, {
        ...resData,
        id: docId,
        createdAt: serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
    invalidateFirebaseCache('discipline');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] saveBatchDisciplineResolutions error:', err);
    return { success: false, error: err.message };
  }
}

export async function saveBatchInvitationLettersToFirestore(letters) {
  if (!db || !Array.isArray(letters) || letters.length === 0) return { success: true };
  try {
    const batch = writeBatch(db);
    letters.forEach(letter => {
      const docId = letter.id || `inv_${letter.studentId || Date.now()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const docRef = doc(db, COL_INVITATIONS, docId);
      batch.set(docRef, {
        ...letter,
        id: docId,
        createdAt: serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
    return { success: true };
  } catch (err) {
    console.error('[Firebase] saveBatchInvitationLetters error:', err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// 12. Academic Classes & Subjects (Firestore)
// ─────────────────────────────────────────────
const DEFAULT_ACADEMIC_CLASSES = [];
const DEFAULT_ACADEMIC_SUBJECTS = [];

export async function getClassesFromFirestore(force = false) {
  if (!force && _memoryCache.classes.data && (Date.now() - _memoryCache.classes.time < MEMORY_CACHE_TTL_MS)) {
    return _memoryCache.classes.data;
  }
  if (!db) return [];
  try {
    const q = query(collection(db, COL_CLASSES));
    const snap = await getDocs(q);

    // If empty, return empty array
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
    return _memoryCache.classes.data || [];
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

export async function deleteClassFromFirestore(classId, className = null) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    if (classId) {
      const docRef = doc(db, COL_CLASSES, classId);
      await deleteDoc(docRef);
    }
    invalidateFirebaseCache('classes');

    // Cascade delete associated timetable document from COL_TIMETABLES (both by classId and className)
    if (classId) {
      try {
        await deleteDoc(doc(db, COL_TIMETABLES, classId));
      } catch (e) { }
    }
    if (className && className !== classId) {
      try {
        await deleteDoc(doc(db, COL_TIMETABLES, className));
      } catch (e) { }
    }
    invalidateFirebaseCache('timetables');

    return { success: true };
  } catch (err) {
    console.error('[Firebase] deleteClass error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteTimetableFromFirestore(classKey) {
  if (!db || !classKey) return { success: false };
  try {
    await deleteDoc(doc(db, COL_TIMETABLES, classKey));
    invalidateFirebaseCache('timetables');
    return { success: true };
  } catch (err) {
    console.error('[Firebase] deleteTimetable error:', err);
    return { success: false, error: err.message };
  }
}


export async function getSubjectsFromFirestore(force = false) {
  if (!force && _memoryCache.subjects.data && (Date.now() - _memoryCache.subjects.time < MEMORY_CACHE_TTL_MS)) {
    return _memoryCache.subjects.data;
  }
  if (!db) return [];
  try {
    const q = query(collection(db, COL_SUBJECTS));
    const snap = await getDocs(q);

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
    return _memoryCache.subjects.data || [];
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
  {
    id: 'USR-ADMIN',
    username: 'ark_admin',
    name: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
    role: 'admin',
    class: 'ALL',
    status: 'active',
    email: 'admin@angroka.edu.kh',
    phone: '012 345 678',
    password: 'attendace_ark_56789$',
    lastLogin: 'មិនទាន់ចូលប្រើ'
  }
];

export async function getUsersFromFirestore(force = false) {
  if (!force && _memoryCache.users.data && (Date.now() - _memoryCache.users.time < MEMORY_CACHE_TTL_MS)) {
    return _memoryCache.users.data;
  }
  if (!db) return DEFAULT_USERS;
  try {
    const q = query(collection(db, COL_USERS));
    const snap = await getDocs(q);

    if (snap.empty) {
      const initialAdmin = { ...DEFAULT_USERS[0], updatedAt: serverTimestamp() };
      saveUserToFirestore(initialAdmin).catch(() => {});
      _memoryCache.users.data = [initialAdmin];
      _memoryCache.users.time = Date.now();
      return [initialAdmin];
    }

    const users = [];
    snap.forEach(d => {
      users.push({ id: d.id, ...d.data() });
    });

    const hasAdmin = users.some(u => u.role === 'admin' || u.username === 'admin');
    if (!hasAdmin) {
      const initialAdmin = { ...DEFAULT_USERS[0], updatedAt: serverTimestamp() };
      saveUserToFirestore(initialAdmin).catch(() => {});
      users.unshift(initialAdmin);
    }

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
const DEFAULT_TIMETABLES = {};

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
export const DEFAULT_TELEGRAM_BOTS = [];
export const DEFAULT_GLOBAL_TOKENS = [];

export const isDummyTelegramToken = (tokenObj) => {
  if (!tokenObj) return false;
  const tok = tokenObj.token || '';
  const id = tokenObj.id || '';
  const name = tokenObj.name || '';
  if (id === 'gt_1' || id === 'gt_2') return true;
  if (tok.includes('123456789:ABC') || tok.includes('987654321:XYZ') || tok.includes('555555555:QWE')) return true;
  if ((name === 'Bot សាលាកណ្តាល' || name === 'Bot បណ្ណាល័យ') && (tok.includes('123456789') || tok.includes('987654321') || !tok)) return true;
  return false;
};

export const isDummyTelegramBot = (bot) => {
  if (!bot) return false;
  const tok = bot.token || '';
  const id = bot.id || '';
  const name = bot.name || '';
  if (id === 'BOT-001' || id === 'BOT-002') return true;
  if (tok.includes('123456789:ABC') || tok.includes('987654321:XYZ') || tok.includes('555555555:QWE')) return true;
  if ((name === 'Bot សាលាកណ្តាល' || name === 'Bot បណ្ណាល័យ') && (tok.includes('123456789') || tok.includes('987654321') || !tok)) return true;
  return false;
};

export async function getTelegramBotsFromFirestore(force = false) {
  const now = Date.now();
  if (!force && _memoryCache.telegramBots.data && (now - _memoryCache.telegramBots.time) < MEMORY_CACHE_TTL_MS) {
    return _memoryCache.telegramBots.data.filter(b => !isDummyTelegramBot(b));
  }

  if (!db) return [];

  try {
    const colRef = collection(db, COL_TELEGRAM_BOTS);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      _memoryCache.telegramBots.data = [];
      _memoryCache.telegramBots.time = Date.now();
      return [];
    }

    const bots = [];
    const dummyDocRefs = [];
    snap.forEach(d => {
      const bData = { ...d.data(), id: d.id, docId: d.id };
      if (isDummyTelegramBot(bData)) {
        dummyDocRefs.push(d.ref);
      } else {
        bots.push(bData);
      }
    });

    if (dummyDocRefs.length > 0) {
      try {
        const batch = writeBatch(db);
        dummyDocRefs.forEach(ref => batch.delete(ref));
        await batch.commit();
      } catch (e) { }
    }

    _memoryCache.telegramBots.data = bots;
    _memoryCache.telegramBots.time = Date.now();
    return bots;
  } catch (err) {
    console.error('[Firebase] getTelegramBots error:', err);
    return (_memoryCache.telegramBots.data || []).filter(b => !isDummyTelegramBot(b));
  }
}

export async function saveTelegramBotToFirestore(botData) {
  if (!db) return { success: false, error: 'Firebase not configured' };
  try {
    const docId = botData.docId || botData.id || `BOT-${String(Date.now()).slice(-4)}`;
    const docRef = doc(db, COL_TELEGRAM_BOTS, docId);
    const payload = {
      ...botData,
      id: docId,
      docId: docId,
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
    const docId = botData.docId || botId;
    const docRef = doc(db, COL_TELEGRAM_BOTS, docId);
    const payload = {
      ...botData,
      id: docId,
      docId: docId,
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
    // 1. Direct doc delete by ID
    const docRef = doc(db, COL_TELEGRAM_BOTS, botId);
    await deleteDoc(docRef);

    // 2. Query by 'id' or 'docId' field in case Firestore document key differed
    try {
      const q = query(collection(db, COL_TELEGRAM_BOTS), where('id', '==', botId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) { }

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
    return _memoryCache.telegramGlobalTokens.data.filter(t => !isDummyTelegramToken(t));
  }

  if (!db) return [];

  try {
    const docRef = doc(db, COL_SETTINGS, 'telegram');
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      _memoryCache.telegramGlobalTokens.data = [];
      _memoryCache.telegramGlobalTokens.time = Date.now();
      return [];
    }

    const data = snap.data();
    const rawTokens = Array.isArray(data.globalTokens) ? data.globalTokens : [];
    const tokens = rawTokens.filter(t => !isDummyTelegramToken(t));

    // If Firestore document still holds dummy tokens, purge them immediately
    if (tokens.length !== rawTokens.length) {
      setDoc(docRef, { globalTokens: tokens, updatedAt: serverTimestamp() }, { merge: true }).catch(() => { });
    }

    _memoryCache.telegramGlobalTokens.data = tokens;
    _memoryCache.telegramGlobalTokens.time = Date.now();
    return tokens;
  } catch (err) {
    console.error('[Firebase] getGlobalTelegramTokens error:', err);
    return (_memoryCache.telegramGlobalTokens.data || []).filter(t => !isDummyTelegramToken(t));
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

export async function getDailySummaryLogFromFirestore() {
  if (!db) return null;
  try {
    const docRef = doc(db, COL_SETTINGS, 'daily_summary_log');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    return null;
  }
}

export async function saveDailySummaryLogToFirestore(date, log) {
  if (!db) return { success: false };
  try {
    const docRef = doc(db, COL_SETTINGS, 'daily_summary_log');
    await setDoc(docRef, {
      lastSentDate: date,
      [`sent_${date}`]: log,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (err) {
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

    // Include full user accounts for complete school restoration
    const userRecords = (users || []).map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      status: u.status,
      assignedClass: u.assignedClass || null,
      phone: u.phone || '',
      password: u.password || ''
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
        users: userRecords.length
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
        users: userRecords
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

      // 9. Restore User Accounts
      if (data.users && Array.isArray(data.users)) {
        await commitInBatches(data.users, COL_USERS, u => u.id || u.username);
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
    if (data.users) localStorage.setItem('school_users_cache', JSON.stringify(data.users));
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
 * Monthly Backups & Auto-Backup Archives (Private Admin Data, No Telegram)
 */
export async function saveMonthlyBackupToFirestore(backupPayload, meta = {}) {
  const monthKey = meta.monthKey || backupPayload.exportedAt?.slice(0, 7) || new Date().toISOString().slice(0, 7);
  const docId = `backup_${monthKey.replace('-', '_')}`;

  const jsonString = JSON.stringify(backupPayload);
  const sizeBytes = jsonString.length;
  // Firestore limit is 1MB per document; keep safely under 900KB
  const isEmbeddable = sizeBytes < 900000;

  const backupDoc = {
    id: docId,
    monthKey,
    monthKhmer: meta.monthKhmer || monthKey,
    createdAt: new Date().toISOString(),
    isAuto: Boolean(meta.isAuto),
    sizeBytes,
    sizeKb: Math.round(sizeBytes / 1024),
    counts: backupPayload.counts || {},
    isEmbeddable,
    data: isEmbeddable ? backupPayload : null
  };

  // Save to Firestore if available
  if (db) {
    try {
      await setDoc(doc(db, COL_MONTHLY_BACKUPS, docId), {
        ...backupDoc,
        restoredAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('[Firebase] saveMonthlyBackupToFirestore error:', err);
    }
  }

  // Always save in LocalStorage so it's instantly available offline / locally
  try {
    const listRaw = localStorage.getItem('school_monthly_backups_list');
    let list = listRaw ? JSON.parse(listRaw) : [];
    list = list.filter(item => item.monthKey !== monthKey);
    // Put newest at the top
    list.unshift({
      id: docId,
      monthKey,
      monthKhmer: backupDoc.monthKhmer,
      createdAt: backupDoc.createdAt,
      isAuto: backupDoc.isAuto,
      sizeBytes,
      sizeKb: backupDoc.sizeKb,
      counts: backupDoc.counts
    });
    localStorage.setItem('school_monthly_backups_list', JSON.stringify(list));

    // Store the full JSON backup object locally
    localStorage.setItem(`school_monthly_payload_${monthKey}`, jsonString);
  } catch (e) {
    console.warn('[Cache] saveMonthlyBackup LocalStorage error:', e);
  }

  return { success: true, docId, backupDoc };
}

export async function getMonthlyBackupsFromFirestore() {
  const localListRaw = localStorage.getItem('school_monthly_backups_list');
  const localList = localListRaw ? JSON.parse(localListRaw) : [];

  if (!db) return localList;

  try {
    const q = query(collection(db, COL_MONTHLY_BACKUPS));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const cloudList = [];
      snap.forEach(d => {
        const item = d.data();
        cloudList.push({
          id: d.id,
          monthKey: item.monthKey,
          monthKhmer: item.monthKhmer || item.monthKey,
          createdAt: item.createdAt,
          isAuto: Boolean(item.isAuto),
          sizeKb: item.sizeKb || Math.round((item.sizeBytes || 0) / 1024),
          counts: item.counts || {}
        });
      });
      // Sort newest first
      cloudList.sort((a, b) => (b.monthKey || '').localeCompare(a.monthKey || ''));
      try {
        localStorage.setItem('school_monthly_backups_list', JSON.stringify(cloudList));
      } catch {}
      return cloudList;
    }
  } catch (err) {
    console.warn('[Firebase] getMonthlyBackupsFromFirestore error:', err);
  }

  return localList;
}

export async function getMonthlyBackupPayload(monthKey) {
  // 1. Check local storage
  try {
    const raw = localStorage.getItem(`school_monthly_payload_${monthKey}`);
    if (raw) return JSON.parse(raw);
  } catch {}

  // 2. Check Firestore
  if (db) {
    try {
      const docId = `backup_${monthKey.replace('-', '_')}`;
      const snap = await getDoc(doc(db, COL_MONTHLY_BACKUPS, docId));
      if (snap.exists()) {
        const d = snap.data();
        if (d.data) return d.data;
      }
    } catch (e) {
      console.warn('[Firebase] getMonthlyBackupPayload error:', e);
    }
  }

  return null;
}

export async function deleteMonthlyBackupFromFirestore(backupId, monthKey) {
  if (db) {
    try {
      await deleteDoc(doc(db, COL_MONTHLY_BACKUPS, backupId));
    } catch (err) {
      console.warn('[Firebase] deleteMonthlyBackup error:', err);
    }
  }

  try {
    const listRaw = localStorage.getItem('school_monthly_backups_list');
    if (listRaw) {
      const list = JSON.parse(listRaw);
      const filtered = list.filter(item => item.id !== backupId && item.monthKey !== monthKey);
      localStorage.setItem('school_monthly_backups_list', JSON.stringify(filtered));
    }
    if (monthKey) {
      localStorage.removeItem(`school_monthly_payload_${monthKey}`);
    }
  } catch {}

  return { success: true };
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
      await deleteCollectionDocs(COL_DISCIPLINE_RESOLUTIONS);
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
    localStorage.removeItem('school_discipline_resolutions_cache');
    localStorage.removeItem('school_discipline_cache');
    localStorage.removeItem('attendance_records');
    localStorage.setItem('school_attendance_records', '[]');
    localStorage.setItem('school_attendance_cache', '[]');
  } catch (e) { }

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
  } catch (e) { }

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
      await deleteCollectionDocs(COL_DISCIPLINE_RESOLUTIONS);
      await deleteCollectionDocs(COL_STUDENTS);
      await deleteCollectionDocs(COL_CLASSES);
      await deleteCollectionDocs(COL_SUBJECTS);
      await deleteCollectionDocs(COL_TIMETABLES);
      await deleteCollectionDocs(COL_TELEGRAM_BOTS);

      try {
        const telSetDoc = doc(db, COL_SETTINGS, 'telegram');
        await setDoc(telSetDoc, { globalTokens: [], updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) { }

      // Clean non-admin users in users collection
      const uSnap = await getDocs(query(collection(db, COL_USERS)));
      let hasAdminInDb = false;
      if (!uSnap.empty) {
        const b = writeBatch(db);
        let hasDeletes = false;
        uSnap.docs.forEach(d => {
          const u = d.data();
          if (u.role !== 'admin' && u.username !== 'admin') {
            b.delete(d.ref);
            hasDeletes = true;
          } else {
            hasAdminInDb = true;
          }
        });
        if (hasDeletes) await b.commit();
      }

      if (!hasAdminInDb) {
        try {
          const adminRef = doc(db, COL_USERS, 'USR-ADMIN');
          await setDoc(adminRef, {
            id: 'USR-ADMIN',
            name: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
            username: 'admin',
            role: 'admin',
            class: 'ALL',
            status: 'active',
            email: 'admin@angroka.edu.kh',
            phone: '012 345 678',
            password: 'admin123',
            lastLogin: 'មិនទាន់ចូលប្រើ',
            createdAt: serverTimestamp()
          });
        } catch (e) {
          console.warn('[Firebase] wipeAll save admin error:', e);
        }
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

    localStorage.removeItem('school_telegram_global_tokens_cache');
    localStorage.setItem('school_telegram_global_tokens_cache', '[]');

    // Keep only Admin User
    const adminUser = {
      id: 'USR-ADMIN',
      name: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
      username: 'admin',
      role: 'admin',
      class: 'ALL',
      status: 'active',
      email: 'admin@angroka.edu.kh',
      phone: '012 345 678',
      password: 'admin123',
      lastLogin: 'មិនទាន់ចូលប្រើ'
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





