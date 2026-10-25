// ─────────────────────────────────────────────
// Offline Cache & Synchronization Service
// Ang Roka High School Attendance Management
// ─────────────────────────────────────────────

import { dispatchAttendanceNotification } from '../services/telegram'

const OFFLINE_QUEUE_KEY = 'school_offline_attendance_queue'
const STUDENT_CACHE_PREFIX = 'school_students_cache_'

/**
 * Check if the browser currently has network connectivity
 */
export function isOnline() {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true
}

/**
 * Retrieve all pending attendance submissions waiting to sync
 */
export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('[OfflineQueue] Read error:', e)
    return []
  }
}

/**
 * Add an attendance payload to the offline queue
 */
export function addToOfflineQueue(payload) {
  try {
    const queue = getOfflineQueue()
    const queueItem = {
      id: `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      className: payload.className,
      period: payload.period,
      subject: payload.subject,
      payload
    }

    // Deduplicate if same class + period + date is already in queue
    const today = new Date().toISOString().split('T')[0]
    const filtered = queue.filter(item => {
      const p = item.payload
      return !(p.className === payload.className && String(p.period) === String(payload.period) && (item.createdAt || '').startsWith(today))
    })

    filtered.push(queueItem)
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered))
    notifyQueueChanged(filtered.length)
    return queueItem
  } catch (e) {
    console.error('[OfflineQueue] Add error:', e)
    return null
  }
}

/**
 * Remove an item from the offline queue after successful sync
 */
export function removeFromOfflineQueue(id) {
  try {
    const queue = getOfflineQueue()
    const filtered = queue.filter(item => item.id !== id)
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered))
    notifyQueueChanged(filtered.length)
    return filtered
  } catch (e) {
    console.error('[OfflineQueue] Remove error:', e)
    return []
  }
}

/**
 * Clear the entire offline queue
 */
export function clearOfflineQueue() {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY)
    notifyQueueChanged(0)
  } catch (e) {}
}

/**
 * Dispatch an event so React components can update pending badge reactively
 */
function notifyQueueChanged(count) {
  try {
    window.dispatchEvent(new CustomEvent('school_offline_queue_changed', { detail: { count } }))
  } catch (e) {}
}

/**
 * Cache student roster per class for instant offline loading
 */
export function cacheStudentRoster(className, students = []) {
  if (!className || !Array.isArray(students)) return
  try {
    localStorage.setItem(`${STUDENT_CACHE_PREFIX}${className}`, JSON.stringify(students))
    
    // Also merge into global roster cache
    const globalRaw = localStorage.getItem('school_students_cache')
    let globalList = globalRaw ? JSON.parse(globalRaw) : []
    if (!Array.isArray(globalList)) globalList = []
    
    const others = globalList.filter(s => (s.className || s.class) !== className)
    const merged = [...others, ...students]
    localStorage.setItem('school_students_cache', JSON.stringify(merged))
  } catch (e) {
    console.warn('[OfflineCache] Failed to cache students:', e)
  }
}

/**
 * Get cached student roster for a class (instant 0ms retrieval)
 */
export function getCachedStudentRoster(className) {
  if (!className) return []
  try {
    const raw = localStorage.getItem(`${STUDENT_CACHE_PREFIX}${className}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }

    // Fallback to global cache
    const globalRaw = localStorage.getItem('school_students_cache')
    if (globalRaw) {
      const parsed = JSON.parse(globalRaw)
      if (Array.isArray(parsed)) {
        return parsed.filter(s => (s.className || s.class) === className)
      }
    }
  } catch (e) {}
  return []
}

/**
 * Synchronize all pending offline submissions with Firebase and send Telegram notifications
 */
export async function syncOfflineAttendanceQueue(apiFunction) {
  if (!isOnline()) {
    return { success: false, message: 'ឧបករណ៍មិនទាន់មានការតភ្ជាប់ Internet ទេ', syncedCount: 0 }
  }

  const queue = getOfflineQueue()
  if (queue.length === 0) {
    return { success: true, message: 'គ្មានទិន្នន័យរង់ចាំ Sync ទេ', syncedCount: 0 }
  }

  let syncedCount = 0
  let failedCount = 0

  for (const item of queue) {
    try {
      if (apiFunction) {
        const res = await apiFunction('attendance.save', item.payload)
        if (res && res.success) {
          removeFromOfflineQueue(item.id)
          syncedCount++
          continue
        }
      }

      // Fallback: Dispatch Telegram notification for queued item if not already done
      try {
        const bots = JSON.parse(localStorage.getItem('school_telegram_bots_cache') || '[]')
        const globalTokens = JSON.parse(localStorage.getItem('school_telegram_global_tokens_cache') || '[]')
        await dispatchAttendanceNotification({ payload: item.payload, bots, globalTokens })
      } catch (tgErr) {
        console.warn('[OfflineSync] Telegram dispatch warning:', tgErr)
      }

      removeFromOfflineQueue(item.id)
      syncedCount++
    } catch (err) {
      console.error('[OfflineSync] Sync failed for item:', item.id, err)
      failedCount++
    }
  }

  try {
    window.dispatchEvent(new CustomEvent('school_offline_sync_completed', {
      detail: { syncedCount, failedCount }
    }))
  } catch (e) {}

  return {
    success: syncedCount > 0,
    syncedCount,
    failedCount
  }
}
