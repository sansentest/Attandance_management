// ─────────────────────────────────────────────
// Monthly Auto-Backup Scheduler
// Ang Roka High School - Private Admin Data Protection
// ─────────────────────────────────────────────

import { api } from '../utils/api'

const KHMER_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
const KHMER_NUMS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
const toKhmerNum = (num) => String(num).split('').map(c => KHMER_NUMS[parseInt(c)] || c).join('')

export function getKhmerMonthYear(year, monthIndex) {
  const m = KHMER_MONTHS[monthIndex] || ''
  const y = toKhmerNum(year)
  return `ខែ${m} ឆ្នាំ${y}`
}

/**
 * Check if a monthly backup is due, and execute it silently (Admin Only, No Telegram)
 */
export async function checkAndRunMonthlyBackup(force = false) {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const currentMonthKey = `${year}-${String(month).padStart(2, '0')}`

    // Fetch settings
    let settings = { enabled: true, dayOfMonth: 1 }
    try {
      const raw = localStorage.getItem('school_auto_backup_settings')
      if (raw) settings = { ...settings, ...JSON.parse(raw) }
    } catch {}

    if (!force && !settings.enabled) {
      return { skipped: true, reason: 'Auto backup disabled' }
    }

    const lastBackupMonth = localStorage.getItem('school_last_auto_backup_month')
    const currentDay = now.getDate()
    const targetDay = Number(settings.dayOfMonth) || 1

    // If already backed up this month and not forced, skip
    if (!force && lastBackupMonth === currentMonthKey) {
      return { skipped: true, reason: 'Already backed up for this month' }
    }

    // Check if scheduled day has been reached
    if (!force && currentDay < targetDay) {
      return { skipped: true, reason: 'Scheduled day not reached yet' }
    }

    console.log(`[MonthlyBackup] Executing monthly backup for ${currentMonthKey}...`)

    const res = await api('backup.createMonthly', {
      monthKey: currentMonthKey,
      monthKhmer: getKhmerMonthYear(year, now.getMonth()),
      isAuto: !force
    })

    if (res?.success) {
      localStorage.setItem('school_last_auto_backup_month', currentMonthKey)
      localStorage.setItem('school_last_backup_time', new Date().toLocaleString('km-KH'))
      
      try {
        window.dispatchEvent(new CustomEvent('school_monthly_backup_created', { detail: res.backupInfo }))
      } catch {}

      console.log(`[MonthlyBackup] ✅ Successfully completed monthly backup for ${currentMonthKey}`)
      return { success: true, backupInfo: res.backupInfo }
    } else {
      console.warn('[MonthlyBackup] ❌ Failed to create monthly backup:', res?.error)
      return { success: false, error: res?.error }
    }
  } catch (err) {
    console.error('[MonthlyBackup] Scheduler error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Start the background scheduler for monthly backups
 */
export function startMonthlyBackupScheduler() {
  // Check after 6 seconds on initial boot
  const initialTimer = setTimeout(() => {
    checkAndRunMonthlyBackup().catch(() => {})
  }, 6000)

  // Periodic check every 1 hour (3600000 ms)
  const hourlyInterval = setInterval(() => {
    checkAndRunMonthlyBackup().catch(() => {})
  }, 3600000)

  return () => {
    clearTimeout(initialTimer)
    clearInterval(hourlyInterval)
  }
}

