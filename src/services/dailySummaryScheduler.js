// ─────────────────────────────────────────────
// Daily Attendance 5:00 PM Summary Scheduler
// Ang Roka High School Attendance Management
// ─────────────────────────────────────────────

import {
  dispatchDailySummaryNotification,
  getCambodiaNowParts,
  isValidDailySummaryLogEntry
} from './telegram'
import { api } from '../utils/api'

/**
 * Trigger the Daily Summary dispatch either manually or automatically
 */
export async function triggerDailySummary(customDate, manual = false) {
  const today = customDate || getCambodiaNowParts().date
  
  try {
    // 1. Fetch attendance records, students, classes, bots, and discipline tracking
    const [attRes, stdRes, clsRes, botRes, tokRes, discRes] = await Promise.all([
      api('attendance.getAll'),
      api('students.getAll'),
      api('academic.getClasses'),
      api('telegram.getBots'),
      api('telegram.getGlobalTokens'),
      api('discipline.getTracking')
    ])

    const records = (attRes && attRes.success && attRes.data) || JSON.parse(localStorage.getItem('school_attendance_records') || '[]')
    const students = (stdRes && stdRes.success && stdRes.data) || JSON.parse(localStorage.getItem('school_students_cache') || '[]')
    const classes = (clsRes && clsRes.success && clsRes.data) || JSON.parse(localStorage.getItem('school_classes_cache') || '[]')
    const bots = (botRes && botRes.success && botRes.data) || JSON.parse(localStorage.getItem('school_telegram_bots_cache') || '[]')
    const globalTokens = (tokRes && tokRes.success && tokRes.data) || JSON.parse(localStorage.getItem('school_telegram_global_tokens_cache') || '[]')
    const disciplineTracking = (discRes && discRes.success && discRes.data) || JSON.parse(localStorage.getItem('school_discipline_cache') || '[]')

    const result = await dispatchDailySummaryNotification({
      date: today,
      records,
      classes,
      students,
      bots,
      globalTokens,
      manualTrigger: manual,
      disciplineTracking
    })

    if (result && result.success) {
      const summaryLog = {
        timestamp: new Date().toISOString(),
        count: result.count,
        overallRate: result.overallRate,
        source: manual ? 'manual' : 'browser_auto'
      };

      try {
        localStorage.setItem(`school_daily_summary_sent_${today}`, JSON.stringify(summaryLog));
      } catch (e) {}

      // Sync sent record with Firestore so Cloud runner and other devices know today is done
      try {
        await api('telegram.saveDailySummaryLog', { date: today, log: summaryLog });
      } catch (e) {}

      try {
        window.dispatchEvent(new CustomEvent('school_daily_summary_sent', { detail: { date: today, result } }));
      } catch (e) {}
    }

    return result;
  } catch (err) {
    console.error('[DailySummaryScheduler] Error triggering daily summary:', err);
    return { success: false, error: err.message || 'បរាជ័យក្នុងការផ្ញើរបាយការណ៍សង្ខេបប្រចាំថ្ងៃ' };
  }
}

/**
 * Check if today's 5:00 PM summary has already been sent
 */
export async function isDailySummarySentToday(date) {
  const targetDate = date || getCambodiaNowParts().date;
  try {
    const raw = localStorage.getItem(`school_daily_summary_sent_${targetDate}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidDailySummaryLogEntry(parsed)) return true;
      localStorage.removeItem(`school_daily_summary_sent_${targetDate}`);
    }
  } catch {}

  // Check Firestore (e.g. sent by GitHub Actions Cloud Cron or another administrator)
  try {
    const res = await api('telegram.getDailySummaryLog');
    if (res && res.success && res.data) {
      const dayEntry = res.data[`sent_${targetDate}`];
      const validDayEntry = dayEntry ? isValidDailySummaryLogEntry(dayEntry) : false;
      const lastSentValid = res.data.lastSentDate === targetDate && (!dayEntry || validDayEntry);
      if (validDayEntry || (!dayEntry && lastSentValid)) {
        try {
          const logData = dayEntry || { timestamp: new Date().toISOString() };
          localStorage.setItem(`school_daily_summary_sent_${targetDate}`, JSON.stringify(logData));
        } catch {}
        return true;
      }
    }
  } catch {}

  return false;
}

/**
 * Get daily summary sent log for today
 */
export function getDailySummarySentLog(date) {
  const targetDate = date || getCambodiaNowParts().date;
  try {
    const raw = localStorage.getItem(`school_daily_summary_sent_${targetDate}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Check time and automatically dispatch at 5:00 PM Cambodia Time (17:00+)
 */
export async function checkAndSendDailySummaryScheduled() {
  const { hour, date: today } = getCambodiaNowParts();

  // Only trigger at or after 17:00 (5:00 PM) Cambodia Time
  if (hour < 17) {
    return { triggered: false, reason: 'មិនទាន់ដល់ម៉ោង ៥:០០ ល្ងាច' };
  }

  // Check if already sent today (locally or on Cloud)
  const alreadySent = await isDailySummarySentToday(today);
  if (alreadySent) {
    return { triggered: false, reason: 'បានផ្ញើរួចរាល់ហើយសម្រាប់ថ្ងៃនេះ' };
  }

  console.log('[DailySummaryScheduler] 5:00 PM reached! Auto-dispatching daily attendance summary to Telegram...');
  const result = await triggerDailySummary(today, false);
  return { triggered: true, result };
}

/**
 * Start the background scheduler interval
 */
export function startDailySummaryScheduler() {
  // Check immediately on app boot
  checkAndSendDailySummaryScheduled()

  // Re-check every 60 seconds
  const intervalId = setInterval(() => {
    checkAndSendDailySummaryScheduled()
  }, 60000)

  return () => clearInterval(intervalId)
}
