// ─────────────────────────────────────────────
// Cloud Daily Attendance Summary Dispatcher
// Automated Runner for GitHub Actions Cron (5:00 PM ICT)
// Ang Roka High School Attendance Management
// ─────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import {
  dispatchDailySummaryNotification,
  getCambodiaNowParts,
  isValidDailySummaryLogEntry
} from '../src/services/telegram.js';

async function run() {
  console.log('🚀 [Daily Summary Cloud] Starting Daily Attendance Summary Dispatcher...');

  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBJa26ZGvjLrZB3W1mydi_8hNkKSDFv_Cg',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'attendace-ark.firebaseapp.com',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'attendace-ark',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'attendace-ark.firebasestorage.app',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '99404890604',
    appId: process.env.VITE_FIREBASE_APP_ID || '1:99404890604:web:a0f6e4615ba74ac8c540c9'
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const cambodiaNow = getCambodiaNowParts();
  const hasExplicitTargetDate = Boolean(process.env.TARGET_DATE);
  const today = process.env.TARGET_DATE || cambodiaNow.date;
  const forceRun = process.env.FORCE === 'true';

  console.log(`📅 Target Date: ${today} | Current Cambodia Time: ${cambodiaNow.timeText} (${cambodiaNow.date}, Asia/Phnom_Penh)`);

  // Guard: If GitHub Actions delayed a scheduled run past midnight into 00:00–16:59 ICT,
  // never dispatch a premature 0-record summary for the new day or poison daily_summary_log.
  if (!forceRun && !hasExplicitTargetDate && cambodiaNow.hour < 17) {
    console.log(`⏰ [Daily Summary Cloud] Current Cambodia time (${cambodiaNow.timeText}) is before 17:00 ICT. Exiting without sending to avoid a premature midnight report for ${today}.`);
    process.exit(0);
  }

  // 1. Check if already dispatched today in Firestore (ignoring any stale pre-17:00 cloud_cron logs)
  if (!forceRun) {
    try {
      const logSnap = await getDoc(doc(db, 'school_settings', 'daily_summary_log'));
      if (logSnap.exists()) {
        const data = logSnap.data();
        const dayEntry = data[`sent_${today}`];
        const validDayEntry = dayEntry ? isValidDailySummaryLogEntry(dayEntry) : false;
        const lastSentValid = data.lastSentDate === today && (!dayEntry || validDayEntry);
        if (validDayEntry || (!dayEntry && lastSentValid)) {
          console.log(`ℹ️ [Daily Summary Cloud] Summary for ${today} was ALREADY dispatched today! Exiting to prevent duplicates.`);
          process.exit(0);
        }
        if (dayEntry && !validDayEntry) {
          console.log(`⚠️ [Daily Summary Cloud] Ignoring stale premature log entry for ${today} (${dayEntry.timestamp}); proceeding with 17:00+ ICT dispatch.`);
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not check prior log, proceeding:', e.message);
    }
  } else {
    console.log('⚡ Force run enabled. Proceeding regardless of prior log.');
  }

  // 2. Fetch all necessary data in parallel
  console.log('📥 Fetching attendance records, classes, students, and telegram bots from Firestore...');
  const [attSnap, clsSnap, stdSnap, botSnap, settingsSnap, generalSnap, disciplineSnap] = await Promise.all([
    getDocs(query(collection(db, 'attendance_records'), where('date', '==', today))),
    getDocs(collection(db, 'academic_classes')),
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'telegram_bots')),
    getDoc(doc(db, 'school_settings', 'telegram')),
    getDoc(doc(db, 'school_settings', 'general')),
    getDoc(doc(db, 'school_settings', 'discipline'))
  ]);

  const records = attSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const classes = clsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const students = stdSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const bots = botSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const globalTokens = settingsSnap.exists() && settingsSnap.data().globalTokens ? settingsSnap.data().globalTokens : [];
  const schoolName = generalSnap.exists() && generalSnap.data()?.name
    ? String(generalSnap.data().name).replace(/\s*\(.*\)$/, '').trim()
    : '';
  const thresholds = disciplineSnap.exists() ? disciplineSnap.data() : null;

  console.log(`📊 Loaded Data:`);
  console.log(`   - Today's Attendance Records: ${records.length}`);
  console.log(`   - Classes: ${classes.length}`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Telegram Bots: ${bots.length}`);
  console.log(`   - Global Tokens: ${globalTokens.length}`);

  if (bots.length === 0) {
    console.warn('⚠️ No Telegram bots configured. Exiting.');
    process.exit(0);
  }

  // 3. Dispatch Daily Summary Notification
  console.log('📤 Dispatching daily summary notification via Telegram Bot API...');
  const result = await dispatchDailySummaryNotification({
    date: today,
    records,
    classes,
    students,
    bots,
    globalTokens,
    manualTrigger: false,
    disciplineTracking: [],
    schoolName,
    thresholds
  });

  if (result && result.success) {
    console.log(`✅ [Daily Summary Cloud] Dispatched successfully to ${result.count} Telegram recipients!`);

    // 4. Record sent log in Firestore
    try {
      await setDoc(doc(db, 'school_settings', 'daily_summary_log'), {
        lastSentDate: today,
        [`sent_${today}`]: {
          timestamp: new Date().toISOString(),
          count: result.count,
          overallRate: result.overallRate,
          source: 'cloud_cron'
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('📝 Sent log recorded in Firestore.');
    } catch (logErr) {
      console.warn('⚠️ Failed to record log to Firestore:', logErr.message);
    }

    process.exit(0);
  } else {
    console.error(`❌ [Daily Summary Cloud] Failed to dispatch summary:`, result ? result.error : 'Unknown error');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('💥 Fatal error in cloud dispatcher:', err);
  process.exit(1);
});

