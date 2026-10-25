// ─────────────────────────────────────────────
// Daily Attendance 5:00 PM Summary Scheduler
// Ang Roka High School Attendance Management
// ─────────────────────────────────────────────

import { dispatchDailySummaryNotification } from './telegram'
import { api } from '../utils/api'

/**
 * Trigger the Daily Summary dispatch either manually or automatically
 */
export async function triggerDailySummary(customDate, manual = false) {
  const today = customDate || new Date().toISOString().split('T')[0]
  
  try {
    // 1. Fetch attendance records, students, classes, and bots
    const [attRes, stdRes, clsRes, botRes, tokRes] = await Promise.all([
      api('attendance.getAll'),
      api('students.getAll'),
      api('academic.getClasses'),
      api('telegram.getBots'),
      api('telegram.getGlobalTokens')
    ])

    const records = (attRes && attRes.success && attRes.data) || JSON.parse(localStorage.getItem('school_attendance_records') || '[]')
    const students = (stdRes && stdRes.success && stdRes.data) || JSON.parse(localStorage.getItem('school_students_cache') || '[]')
    const classes = (clsRes && clsRes.success && clsRes.data) || JSON.parse(localStorage.getItem('school_classes_cache') || '[]')
    const bots = (botRes && botRes.success && botRes.data) || JSON.parse(localStorage.getItem('school_telegram_bots_cache') || '[]')
    const globalTokens = (tokRes && tokRes.success && tokRes.data) || JSON.parse(localStorage.getItem('school_telegram_global_tokens_cache') || '[]')

    const result = await dispatchDailySummaryNotification({
      date: today,
      records,
      classes,
      students,
      bots,
      globalTokens,
      manualTrigger: manual
    })

    if (result && result.success) {
      localStorage.setItem(`school_daily_summary_sent_${today}`, JSON.stringify({
        timestamp: new Date().toISOString(),
        count: result.count,
        overallRate: result.overallRate
      }))
      
      try {
        window.dispatchEvent(new CustomEvent('school_daily_summary_sent', { detail: { date: today, result } }))
      } catch (e) {}
    }

    return result
  } catch (err) {
    console.error('[DailySummaryScheduler] Error triggering daily summary:', err)
    return { success: false, error: err.message || 'បរាជ័យក្នុងការផ្ញើរបាយការណ៍សង្ខេបប្រចាំថ្ងៃ' }
  }
}

/**
 * Check if today's 5:00 PM summary has already been sent
 */
export function isDailySummarySentToday(date) {
  const targetDate = date || new Date().toISOString().split('T')[0]
  try {
    const raw = localStorage.getItem(`school_daily_summary_sent_${targetDate}`)
    return Boolean(raw)
  } catch {
    return false
  }
}

/**
 * Get daily summary sent log for today
 */
export function getDailySummarySentLog(date) {
  const targetDate = date || new Date().toISOString().split('T')[0]
  try {
    const raw = localStorage.getItem(`school_daily_summary_sent_${targetDate}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Check time and automatically dispatch at 5:00 PM (17:00+)
 */
export async function checkAndSendDailySummaryScheduled() {
  const now = new Date()
  const hour = now.getHours()
  const today = now.toISOString().split('T')[0]

  // Only trigger at or after 17:00 (5:00 PM)
  if (hour < 17) {
    return { triggered: false, reason: 'មិនទាន់ដល់ម៉ោង ៥:០០ ល្ងាច' }
  }

  // Check if already sent today
  if (isDailySummarySentToday(today)) {
    return { triggered: false, reason: 'បានផ្ញើរួចរាល់ហើយសម្រាប់ថ្ងៃនេះ' }
  }

  console.log('[DailySummaryScheduler] 5:00 PM reached! Auto-dispatching daily attendance summary to Telegram...')
  const result = await triggerDailySummary(today, false)
  return { triggered: true, result }
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
