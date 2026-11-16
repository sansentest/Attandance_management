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

  // 1. Check prior dispatch log in Firestore
  let priorEntry = null;
  let isProgressiveUpdate = false;

  if (!forceRun) {
    try {
      const logSnap = await getDoc(doc(db, 'school_settings', 'daily_summary_log'));
      if (logSnap.exists()) {
        const data = logSnap.data();
        const dayEntry = data[`sent_${today}`];
        const validDayEntry = dayEntry ? isValidDailySummaryLogEntry(dayEntry) : false;
        if (validDayEntry) {
          priorEntry = dayEntry;
        } else if (dayEntry && !validDayEntry) {
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
  console.log('📥 Fetching attendance records, classes, students, period states, and telegram bots from Firestore...');
  const [attSnap, clsSnap, stdSnap, botSnap, settingsSnap, generalSnap, disciplineSnap, stateSnap] = await Promise.all([
    getDocs(query(collection(db, 'attendance_records'), where('date', '==', today))),
    getDocs(collection(db, 'academic_classes')),
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'telegram_bots')),
    getDoc(doc(db, 'school_settings', 'telegram')),
    getDoc(doc(db, 'school_settings', 'general')),
    getDoc(doc(db, 'school_settings', 'discipline')),
    getDocs(collection(db, 'period_states'))
  ]);

  const records = attSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const classes = clsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const students = stdSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const bots = botSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const periodStates = stateSnap.docs.filter(d => d.id.includes(today)).map(d => ({ id: d.id, ...d.data() }));
  const globalTokens = settingsSnap.exists() && settingsSnap.data().globalTokens ? settingsSnap.data().globalTokens : [];
  const schoolName = generalSnap.exists() && generalSnap.data()?.name
    ? String(generalSnap.data().name).replace(/\s*\(.*\)$/, '').trim()
    : '';
  const thresholds = disciplineSnap.exists() ? disciplineSnap.data() : null;

  const norm = (c) => String(c || '').replace(/^(ថ្នាក់ទី|ថ្នាក់|\s)+/i, '').trim().toLowerCase();
  const submittedSet = new Set([
    ...periodStates.map(p => {
      const parts = String(p.id || '').replace(/^STATE_/, '').split('_');
      return norm(parts[1] || p.className || p.class);
    }),
    ...records.map(r => norm(r.class))
  ].filter(Boolean));

  const currentSubmittedCount = submittedSet.size;
  const currentRecordsCount = records.length;

  console.log(`📊 Loaded Data:`);
  console.log(`   - Today's Attendance Records: ${currentRecordsCount}`);
  console.log(`   - Submitted Classes: ${currentSubmittedCount}`);
  console.log(`   - Academic Classes: ${classes.length}`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Telegram Bots: ${bots.length}`);
  console.log(`   - Global Tokens: ${globalTokens.length}`);

  // Progressive Sync Guard: Avoid duplicate spam, but allow update if more classes submitted
  if (priorEntry && !forceRun) {
    const prevSubmittedCount = Number(priorEntry.submittedCount) || 0;
    const prevRecordsCount = Number(priorEntry.recordsCount) || 0;
    const prevComplete = Boolean(priorEntry.isComplete);

    const hasNewClasses = currentSubmittedCount > prevSubmittedCount;
    const hasSignificantNewRecords = currentRecordsCount >= prevRecordsCount + 3;

    if (prevComplete && !hasNewClasses && !hasSignificantNewRecords) {
      console.log(`ℹ️ [Daily Summary Cloud] Summary for ${today} is ALREADY COMPLETE (${prevSubmittedCount} classes). Exiting to prevent duplicate.`);
      process.exit(0);
    }

    if (!hasNewClasses && !hasSignificantNewRecords) {
      console.log(`ℹ️ [Daily Summary Cloud] No newly submitted classes or records found since prior dispatch (${prevSubmittedCount} classes, ${prevRecordsCount} recs). Exiting.`);
      process.exit(0);
    }

    console.log(`🔄 [Daily Summary Cloud] Detected new submissions (${prevSubmittedCount} -> ${currentSubmittedCount} classes, ${prevRecordsCount} -> ${currentRecordsCount} recs). Sending progressive update!`);
    isProgressiveUpdate = true;
  }

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
    thresholds,
    periodStates,
    isUpdate: isProgressiveUpdate
  });

  if (result && result.success) {
    console.log(`✅ [Daily Summary Cloud] Dispatched successfully to ${result.count} Telegram recipients!`);

    const isComplete = (result.submittedCount >= result.totalClasses && result.totalClasses > 0);

    // 4. Record sent log in Firestore
    try {
      await setDoc(doc(db, 'school_settings', 'daily_summary_log'), {
        lastSentDate: today,
        [`sent_${today}`]: {
          timestamp: new Date().toISOString(),
          count: result.count,
          overallRate: result.overallRate,
          submittedCount: result.submittedCount || currentSubmittedCount,
          totalClasses: result.totalClasses || 0,
          recordsCount: currentRecordsCount,
          isComplete,
          source: 'cloud_cron'
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log(`📝 Sent log recorded in Firestore (Submitted: ${result.submittedCount}/${result.totalClasses}, Complete: ${isComplete}).`);
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

