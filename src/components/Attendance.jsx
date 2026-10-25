import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { getSchoolStatus } from '../utils/academicCalendar'
import {
  isOnline, getOfflineQueue, addToOfflineQueue,
  cacheStudentRoster, getCachedStudentRoster, syncOfflineAttendanceQueue
} from '../utils/offlineSync'
import {
  ChevronLeft, GraduationCap, Clock, RotateCcw, Users,
  User, Check, X, FileText, AlertCircle, CheckCircle2,
  Loader2, Send, LogOut, Search, BookOpen, ChevronDown,
  ArrowLeftRight, Calendar, WifiOff, CloudUpload, RefreshCw, Wifi
} from 'lucide-react'

// Helper to format today's date in polite, complete Khmer text
function getKhmerDateText() {
  const d = new Date()
  const daysKhmer = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍']
  const monthsKhmer = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
  const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
  const toKhmerNum = (num) => String(num).split('').map(c => khmerNumbers[parseInt(c)] || c).join('')

  const dayName = daysKhmer[d.getDay()]
  const day = toKhmerNum(d.getDate())
  const month = monthsKhmer[d.getMonth()]
  const year = toKhmerNum(d.getFullYear())

  return `ថ្ងៃ${dayName} ទី${day} ខែ${month} ឆ្នាំ${year}`
}

// ─────────────────────────────────────────────
// Dynamic Timetable Engine
// Returns today's periods from school_timetable_cache or empty state
// ─────────────────────────────────────────────

// Helper to get today's timetable object with dynamic class support
function getTodaySchedule(className = '12A') {
  const now = new Date()
  let dayOfWeek = now.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  if (dayOfWeek === 0) dayOfWeek = 1 // Fallback Sunday to Monday
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const dayNamesKhmer = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍']
  const todayKey = dayKeys[dayOfWeek]

  try {
    const raw = localStorage.getItem('school_timetable_cache')
    if (raw) {
      const allTimetables = JSON.parse(raw)
      const classSlots = allTimetables[className]
      if (Array.isArray(classSlots) && classSlots.length > 0) {
        const todaySlots = classSlots.filter(s => s.day === todayKey)
        if (todaySlots.length > 0) {
          const morningPeriods = []
          const afternoonPeriods = []

          const periodTimes = {
            m1: { startTime: '07:00', endTime: '08:00', startMinutes: 420, endMinutes: 480, shift: 'morning', label: 'ម៉ោងទី ១' },
            m2: { startTime: '08:00', endTime: '09:00', startMinutes: 480, endMinutes: 540, shift: 'morning', label: 'ម៉ោងទី ២' },
            m3: { startTime: '09:00', endTime: '10:00', startMinutes: 540, endMinutes: 600, shift: 'morning', label: 'ម៉ោងទី ៣' },
            m4: { startTime: '10:00', endTime: '11:00', startMinutes: 600, endMinutes: 660, shift: 'morning', label: 'ម៉ោងទី ៤' },
            a1: { startTime: '14:00', endTime: '15:00', startMinutes: 840, endMinutes: 900, shift: 'afternoon', label: 'ម៉ោងទី ៥' },
            a2: { startTime: '15:00', endTime: '16:00', startMinutes: 900, endMinutes: 960, shift: 'afternoon', label: 'ម៉ោងទី ៦' },
            a3: { startTime: '16:00', endTime: '17:00', startMinutes: 960, endMinutes: 1020, shift: 'afternoon', label: 'ម៉ោងទី ៧' }
          }

          todaySlots.forEach(s => {
            const def = periodTimes[s.period] || { startTime: '07:00', endTime: '08:00', startMinutes: 420, endMinutes: 480, shift: 'morning', label: s.period }
            const duration = s.duration || 1
            const isDouble = duration === 2

            let finalEndTime = def.endTime
            let finalEndMinutes = def.endMinutes
            let finalPeriodLabel = def.label

            if (isDouble) {
              if (s.period === 'm1') {
                finalEndTime = '09:00'
                finalEndMinutes = 540
                finalPeriodLabel = 'ម៉ោងទី ១-២'
              } else if (s.period === 'm3') {
                finalEndTime = '11:00'
                finalEndMinutes = 660
                finalPeriodLabel = 'ម៉ោងទី ៣-៤'
              } else if (s.period === 'a1') {
                finalEndTime = '16:00'
                finalEndMinutes = 960
                finalPeriodLabel = 'ម៉ោងទី ៥-៦'
              }
            }

            const item = {
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
            }

            if (def.shift === 'morning') morningPeriods.push(item)
            else afternoonPeriods.push(item)
          })

          if (morningPeriods.length > 0 || afternoonPeriods.length > 0) {
            return {
              dayName: dayNamesKhmer[dayOfWeek],
              morning: morningPeriods,
              afternoon: afternoonPeriods,
              hasTimetable: true
            }
          }
        }
      }
    }
  } catch (e) {}

  return {
    dayName: dayNamesKhmer[dayOfWeek],
    morning: [],
    afternoon: [],
    hasTimetable: false
  }
}

// Helper to detect current shift based on minutes of the day
// Morning shift: 07:00 - 11:30 (before 720 min / 12:00 PM)
// Afternoon shift: 13:30 - 17:30 (from 720 min / 12:00 PM)
function detectCurrentShift(currentMinutes) {
  return currentMinutes >= 720 ? 'afternoon' : 'morning'
}

// Point 1: Auto-detect period according to actual date/day and current time
function detectCurrentPeriod(className = '12A') {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const todaySchedule = getTodaySchedule(className)
  const currentShift = detectCurrentShift(currentMinutes)
  const shiftPeriods = (todaySchedule && todaySchedule[currentShift]) || []
  const fallbackPeriods = (shiftPeriods.length > 0) ? shiftPeriods : ((todaySchedule?.morning?.length > 0) ? todaySchedule.morning : (todaySchedule?.afternoon || []))

  // If no timetable configured by Admin for this class
  if (!todaySchedule || !todaySchedule.hasTimetable || fallbackPeriods.length === 0) {
    return {
      className,
      period: 'none',
      periodLabel: 'មិនទាន់មានកាលវិភាគ',
      hours: 1,
      subject: 'មិនទាន់មានកាលវិភាគ',
      teacher: '',
      startTime: '--:--',
      endTime: '--:--',
      shift: currentShift,
      isLibre: false,
      dayName: todaySchedule?.dayName || 'ច័ន្ទ',
      hasTimetable: false
    }
  }

  // 1. Exact match with period schedule in current shift
  const exact = fallbackPeriods.find(p => currentMinutes >= p.startMinutes && currentMinutes < p.endMinutes)
  if (exact) {
    return {
      className,
      period: exact.period,
      periodLabel: exact.periodLabel,
      hours: exact.hours || 1,
      subject: exact.subject,
      teacher: exact.teacher,
      startTime: exact.startTime,
      endTime: exact.endTime,
      shift: exact.shift,
      isLibre: Boolean(exact.isLibre),
      dayName: todaySchedule.dayName,
      hasTimetable: true
    }
  }

  // 2. Nearest fallback within current shift
  let nearest = fallbackPeriods[0]
  for (let i = 0; i < fallbackPeriods.length; i++) {
    if (currentMinutes < fallbackPeriods[i].endMinutes) {
      nearest = fallbackPeriods[i]
      break
    }
    nearest = fallbackPeriods[i]
  }

  return {
    className,
    period: nearest.period,
    periodLabel: nearest.periodLabel,
    hours: nearest.hours || 1,
    subject: nearest.subject,
    teacher: nearest.teacher,
    startTime: nearest.startTime,
    endTime: nearest.endTime,
    shift: nearest.shift,
    isLibre: Boolean(nearest.isLibre),
    dayName: todaySchedule.dayName,
    hasTimetable: true
  }
}

export default function Attendance({ session, onNavigate, onLogout }) {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [attendanceState, setAttendanceState] = useState({})
  const [leaveReasons, setLeaveReasons] = useState({}) // Add reason when student is on LEAVE
  const [fullDayState, setFullDayState] = useState({}) // Point 4: full-day leave map
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [alertMessage, setAlertMessage] = useState({ show: false, message: '', type: 'success' })
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false) // Point 2: quick switcher
  const [lastUpdatedTime, setLastUpdatedTime] = useState(Date.now()) // reactive refresh for period badges

  // Offline Mode & Sync State
  const [networkOnline, setNetworkOnline] = useState(() => isOnline())
  const [pendingSyncCount, setPendingSyncCount] = useState(() => getOfflineQueue().length)
  const [isSyncing, setIsSyncing] = useState(false)

  // Point 5: Substitution state (គ្រូប្តូរម៉ោងគ្នា / គ្រូជំនួស)
  const [isSubstituted, setIsSubstituted] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [subForm, setSubForm] = useState({
    subject: '',
    teacher: ''
  })

  // Holiday / Vacation / Weekend support (Persist override in sessionStorage so reload preserves testing mode)
  const [allowHolidayOverride, setAllowHolidayOverrideState] = useState(() => {
    try {
      return sessionStorage.getItem('school_holiday_override') === 'true'
    } catch {
      return false
    }
  })
  const setAllowHolidayOverride = (val) => {
    try {
      sessionStorage.setItem('school_holiday_override', String(val))
    } catch {}
    setAllowHolidayOverrideState(val)
  }
  const schoolStatus = getSchoolStatus()

  const currentClass = session.className === 'ALL' || !session.className ? '12A' : session.className
  const today = new Date().toISOString().split('T')[0]

  // Auto-detect period or restore last active period user worked on today
  const [periodInfo, setPeriodInfo] = useState(() => {
    const auto = detectCurrentPeriod(currentClass)
    try {
      const savedPeriodKey = localStorage.getItem(`school_active_period_${today}_${currentClass}`)
      if (savedPeriodKey && auto.hasTimetable) {
        const todaySched = getTodaySchedule(currentClass)
        const allPeriods = [...(todaySched.morning || []), ...(todaySched.afternoon || [])]
        const matched = allPeriods.find(p => String(p.period) === String(savedPeriodKey))
        if (matched) {
          return {
            className: currentClass,
            period: matched.period,
            periodLabel: matched.periodLabel,
            hours: matched.hours || 1,
            subject: matched.subject,
            teacher: matched.teacher,
            startTime: matched.startTime,
            endTime: matched.endTime,
            shift: matched.shift,
            isLibre: Boolean(matched.isLibre),
            dayName: todaySched.dayName,
            hasTimetable: true
          }
        }
      }
    } catch {}
    return auto
  })

  const todaySchedule = getTodaySchedule(currentClass)
  const hasTimetable = Boolean(periodInfo.hasTimetable !== false && ((todaySchedule.morning && todaySchedule.morning.length > 0) || (todaySchedule.afternoon && todaySchedule.afternoon.length > 0)))
  const isOffDisabled = Boolean(!schoolStatus.isOpen && !allowHolidayOverride)
  const isLibreDisabled = Boolean(periodInfo.isLibre && !isSubstituted)
  const isActionDisabled = isLibreDisabled || isOffDisabled || !hasTimetable

  // Helper to check if a specific period has already been submitted today
  const isPeriodSubmitted = (periodNum) => {
    try {
      const pKey = String(periodNum)
      const key = `school_period_state_${today}_${currentClass}_p${pKey}`
      if (localStorage.getItem(key)) return true

      const raw = localStorage.getItem('school_attendance_records')
      if (raw) {
        const list = JSON.parse(raw)
        return list.some(r => {
          if (r.class !== currentClass || r.date !== today) return false
          const rPeriod = String(r.period)
          if (rPeriod === pKey) return true
          if (pKey.includes('-')) {
            const [pStart, pEnd] = pKey.split('-')
            if (rPeriod === pStart || rPeriod === pEnd || rPeriod === pKey) return true
          }
          return false
        })
      }
    } catch {}
    return false
  }

  // Helper to get saved state for a specific period from local cache
  const getSavedPeriodState = (periodNum) => {
    try {
      const pKey = String(periodNum)
      const raw = localStorage.getItem(`school_period_state_${today}_${currentClass}_p${pKey}`)
      if (raw) return JSON.parse(raw)

      // Fallback: Reconstruct from school_attendance_records if period_state was lost
      const recRaw = localStorage.getItem('school_attendance_records')
      if (recRaw) {
        const list = JSON.parse(recRaw)
        const matched = list.filter(r => {
          if (r.class !== currentClass || r.date !== today) return false
          const rP = String(r.period)
          if (rP === pKey) return true
          if (pKey.includes('-')) {
            const [p1, p2] = pKey.split('-')
            if (rP === p1 || rP === p2 || rP === pKey) return true
          }
          return false
        })

        if (matched.length > 0) {
          const stateMap = {}
          const reasonsMap = {}
          matched.forEach(r => {
            stateMap[r.studentId] = r.status
            if (r.reason) reasonsMap[r.studentId] = r.reason
          })
          return {
            attendanceState: stateMap,
            leaveReasons: reasonsMap,
            subject: matched[0].subject,
            teacher: matched[0].teacher
          }
        }
      }
    } catch {}
    return null
  }

  // Helper to get saved full-day leaves for today (Point 4)
  const getSavedFullDayLeaves = () => {
    try {
      const raw = localStorage.getItem(`school_full_day_${today}_${currentClass}`)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  const applySavedState = (savedState, targetPeriod) => {
    const fullDayMap = getSavedFullDayLeaves()
    const mergedState = { ...savedState.attendanceState }
    Object.keys(fullDayMap).forEach(sId => {
      if (fullDayMap[sId]) {
        mergedState[sId] = 'LEAVE'
      }
    })

    setAttendanceState(mergedState)
    setLeaveReasons(savedState.leaveReasons || {})
    setIsSubstituted(Boolean(savedState.isSubstituted))
    setPeriodInfo({
      className: currentClass,
      period: targetPeriod.period,
      periodLabel: targetPeriod.periodLabel,
      hours: targetPeriod.hours || (String(targetPeriod.period).includes('-') ? 2 : 1),
      shift: targetPeriod.shift,
      dayName: targetPeriod.dayName || getTodaySchedule(currentClass).dayName,
      subject: savedState.subject || targetPeriod.subject,
      teacher: savedState.teacher || targetPeriod.teacher,
      startTime: targetPeriod.startTime,
      endTime: targetPeriod.endTime,
      isLibre: Boolean(targetPeriod.isLibre) && !savedState.isSubstituted,
      hasTimetable: targetPeriod.hasTimetable !== false
    })
  }

  const applyDefaultPresent = (targetPeriod, studentList) => {
    const fullDayMap = getSavedFullDayLeaves()
    const freshState = {}
    studentList.forEach(s => {
      if (fullDayMap[s.id]) {
        freshState[s.id] = 'LEAVE'
      } else {
        freshState[s.id] = 'PRESENT'
      }
    })
    setAttendanceState(freshState)
    setLeaveReasons({})
    setIsSubstituted(false)
    setPeriodInfo({
      className: currentClass,
      period: targetPeriod.period,
      periodLabel: targetPeriod.periodLabel,
      hours: targetPeriod.hours || (String(targetPeriod.period).includes('-') ? 2 : 1),
      shift: targetPeriod.shift,
      dayName: targetPeriod.dayName || getTodaySchedule(currentClass).dayName,
      subject: targetPeriod.subject,
      teacher: targetPeriod.teacher,
      startTime: targetPeriod.startTime,
      endTime: targetPeriod.endTime,
      isLibre: Boolean(targetPeriod.isLibre),
      hasTimetable: targetPeriod.hasTimetable !== false
    })
  }

  // Load attendance data for a specific period (Checks local storage instantly, then synchronizes from Firebase API)
  const loadPeriodData = async (targetPeriod, studentList = students) => {
    const localSaved = getSavedPeriodState(targetPeriod.period)
    if (localSaved && localSaved.attendanceState) {
      applySavedState(localSaved, targetPeriod)
    } else {
      applyDefaultPresent(targetPeriod, studentList)
    }

    // Refresh live from Firebase Cloud / Server API
    try {
      const res = await api('period.getState', {
        className: currentClass,
        date: today,
        period: targetPeriod.period
      })
      if (res && res.success && res.data && res.data.attendanceState) {
        applySavedState(res.data, targetPeriod)
        try {
          localStorage.setItem(`school_period_state_${today}_${currentClass}_p${targetPeriod.period}`, JSON.stringify(res.data))
        } catch {}
      }
    } catch (e) {
      console.warn('[Attendance] Live sync error:', e)
    }
  }

  // ── Network Connectivity & Offline Queue Listeners ──
  useEffect(() => {
    const handleOnline = () => {
      setNetworkOnline(true)
      syncOfflineAttendanceQueue(api).then(res => {
        if (res && res.syncedCount > 0) {
          setAlertMessage({
            show: true,
            message: `បាន Sync ទិន្នន័យ ${res.syncedCount} ម៉ោងដែលបានស្រង់ពេល Offline ទៅកាន់ Server & Telegram រួចរាល់!`,
            type: 'success'
          })
          setLastUpdatedTime(Date.now())
        }
        setPendingSyncCount(getOfflineQueue().length)
      })
    }

    const handleOffline = () => {
      setNetworkOnline(false)
    }

    const handleQueueChange = (e) => {
      if (e?.detail?.count !== undefined) {
        setPendingSyncCount(e.detail.count)
      } else {
        setPendingSyncCount(getOfflineQueue().length)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('school_offline_queue_changed', handleQueueChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('school_offline_queue_changed', handleQueueChange)
    }
  }, [])

  const handleSyncOffline = async () => {
    if (!networkOnline) return
    setIsSyncing(true)
    const res = await syncOfflineAttendanceQueue(api)
    if (res && res.syncedCount > 0) {
      setAlertMessage({
        show: true,
        message: `បាន Sync ទិន្នន័យ ${res.syncedCount} ម៉ោងដែលបានស្រង់ពេល Offline ទៅកាន់ Server និង Telegram រួចរាល់!`,
        type: 'success'
      })
      setLastUpdatedTime(Date.now())
    }
    setPendingSyncCount(getOfflineQueue().length)
    setIsSyncing(false)
  }

  useEffect(() => {
    loadStudents(currentClass, periodInfo)
  }, [currentClass])

  const loadStudents = async (cls = currentClass, targetPeriod = periodInfo) => {
    // 1. Instant offline cache render (0ms instant response)
    const cached = getCachedStudentRoster(cls)
    if (cached && cached.length > 0) {
      setStudents(cached)
      const fullDayMap = getSavedFullDayLeaves()
      setFullDayState(fullDayMap)
      loadPeriodData(targetPeriod, cached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    // 2. Fetch fresh roster from network if online
    try {
      const result = await api('students.getByClass', { className: cls })
      if (result.success && result.data && result.data.length > 0) {
        setStudents(result.data)
        cacheStudentRoster(cls, result.data)
        const fullDayMap = getSavedFullDayLeaves()
        setFullDayState(fullDayMap)
        await loadPeriodData(targetPeriod, result.data)
      }
    } catch (e) {
      console.warn('[Attendance] Network fetch error, fallback to offline cache:', e)
    } finally {
      setLoading(false)
    }
  }

  // Point 3: Set status (PRESENT, ABSENT, LEAVE)
  const setStatus = (id, status) => {
    if (isActionDisabled) return
    setAttendanceState(prev => ({
      ...prev,
      [id]: status
    }))

    // If changing away from LEAVE, turn off full-day leave for this student
    if (status !== 'LEAVE' && fullDayState[id]) {
      setFullDayState(prev => {
        const updated = { ...prev, [id]: false }
        try {
          localStorage.setItem(`school_full_day_${today}_${currentClass}`, JSON.stringify(updated))
        } catch (e) {
          console.error(e)
        }
        return updated
      })
    }
  }

  // Set leave reason for student
  const setLeaveReason = (id, reason) => {
    if (isActionDisabled) return
    setLeaveReasons(prev => ({
      ...prev,
      [id]: reason
    }))
  }

  // Point 4: Toggle full-day leave
  const toggleFullDay = (id) => {
    if (isActionDisabled) return
    const isNowFullDay = !fullDayState[id]
    const updatedFullDayMap = { ...fullDayState, [id]: isNowFullDay }
    setFullDayState(updatedFullDayMap)

    try {
      localStorage.setItem(`school_full_day_${today}_${currentClass}`, JSON.stringify(updatedFullDayMap))
    } catch (e) {
      console.error(e)
    }

    if (isNowFullDay) {
      // Ensure status is marked as LEAVE
      setAttendanceState(prev => ({ ...prev, [id]: 'LEAVE' }))
    }
  }

  // Point 3: Reset all students to PRESENT (respecting any full-day leave)
  const resetAll = () => {
    if (isActionDisabled) return
    const newState = {}
    students.forEach(s => {
      if (fullDayState[s.id]) {
        newState[s.id] = 'LEAVE'
      } else {
        newState[s.id] = 'PRESENT'
      }
    })
    setAttendanceState(newState)
    setLeaveReasons({})
  }

  // Point 2: Select period manually from quick dropdown (Auto-restores if submitted)
  const selectPeriodManually = (periodObj) => {
    setShowPeriodDropdown(false)
    try {
      localStorage.setItem(`school_active_period_${today}_${currentClass}`, String(periodObj.period))
    } catch {}
    loadPeriodData(periodObj, students)
  }

  // Point 5: Open Substitution Modal
  const openSubModal = () => {
    setSubForm({
      subject: (periodInfo.isLibre && !isSubstituted) ? '' : (periodInfo.subject || ''),
      teacher: (periodInfo.isLibre && !isSubstituted) ? '' : (periodInfo.teacher || '')
    })
    setShowSubModal(true)
  }

  // Point 5: Confirm Substitution
  const confirmSubstitution = () => {
    setPeriodInfo(prev => ({
      ...prev,
      subject: subForm.subject || prev.subject,
      teacher: subForm.teacher || prev.teacher,
      isLibre: false
    }))
    setIsSubstituted(true)
    setShowSubModal(false)
  }

  // Point 5: Reset back to Timetable default
  const resetToTimetableDefault = () => {
    const todaySched = getTodaySchedule(currentClass)
    const allPeriods = [...(todaySched.morning || []), ...(todaySched.afternoon || [])]
    if (allPeriods.length === 0) return
    const matchedDefault = allPeriods.find(p => p.period === periodInfo.period) || allPeriods[0]
    setPeriodInfo(prev => ({
      ...prev,
      subject: matchedDefault.subject,
      teacher: matchedDefault.teacher,
      periodLabel: matchedDefault.periodLabel,
      hours: matchedDefault.hours || 1,
      shift: matchedDefault.shift,
      dayName: todaySched.dayName,
      isLibre: Boolean(matchedDefault.isLibre),
      hasTimetable: true
    }))
    setIsSubstituted(false)
    setShowSubModal(false)
  }

  // Save attendance (Auto-updates without duplicates)
  const saveAttendance = async () => {
    if (!hasTimetable) {
      setAlertMessage({ show: true, message: 'មិនទាន់មានកាលវិភាគសម្រាប់ថ្នាក់នេះនៅឡើយទេ! សូមរង់ចាំ Admin បញ្ចូលកាលវិភាគជាមុនសិន។', type: 'error' })
      return
    }

    setSaving(true)
    const isAlreadyDone = isPeriodSubmitted(periodInfo.period)
    const hoursMissed = (periodInfo.period === '1-2' || String(periodInfo.period).includes('-') || periodInfo.hours === 2) ? 2 : 1

    const records = students.map(s => {
      const status = attendanceState[s.id] || 'PRESENT'
      const isFullDay = Boolean(fullDayState[s.id])
      let reason = ''
      if (status === 'LEAVE') {
        const customReason = (leaveReasons[s.id] || '').trim()
        if (customReason) {
          reason = isFullDay ? `${customReason} (ពេញមួយថ្ងៃ)` : customReason
        } else {
          reason = isFullDay ? 'សុំច្បាប់ពេញមួយថ្ងៃ' : 'មានច្បាប់ត្រឹមត្រូវ'
        }
      } else if (status === 'ABSENT') {
        reason = 'គ្មានច្បាប់'
      }

      return {
        id: s.id,
        name: s.name,
        status,
        isFullDay,
        hours: hoursMissed,
        reason
      }
    })

    const periodState = {
      attendanceState,
      leaveReasons,
      isSubstituted,
      subject: periodInfo.subject,
      teacher: periodInfo.teacher,
      hours: hoursMissed,
      updatedAt: new Date().toISOString()
    }

    const payload = {
      className: periodInfo.className,
      period: periodInfo.period,
      subject: periodInfo.subject,
      teacher: periodInfo.teacher,
      startTime: periodInfo.startTime,
      endTime: periodInfo.endTime,
      hours: hoursMissed,
      isSubstituted: isSubstituted,
      recordedBy: session.fullName || 'ប្រធានថ្នាក់',
      periodState,
      records
    }

    let result = { success: false }

    if (!networkOnline) {
      // 1. Offline Mode: Save locally and push to offline queue
      addToOfflineQueue(payload)
      const existingRaw = localStorage.getItem('school_attendance_records')
      const existing = existingRaw ? JSON.parse(existingRaw) : []
      const periodVal = String(periodInfo.period)
      const filteredExisting = existing.filter(r => !(r.class === periodInfo.className && r.date === today && (String(r.period) === periodVal || (periodVal.includes('-') && periodVal.split('-').includes(String(r.period))))))
      const newRecs = records.filter(r => r.status === 'ABSENT' || r.status === 'LEAVE').map(s => ({
        id: `REC-${Date.now()}-${s.id}-p${periodVal}`,
        studentId: s.id,
        name: s.name,
        class: periodInfo.className,
        date: today,
        period: periodVal,
        hours: s.hours || hoursMissed,
        time: `${periodInfo.startTime || '07:00'} - ${periodInfo.endTime || '08:00'}`,
        subject: periodInfo.subject || '',
        teacher: periodInfo.teacher || '',
        status: s.status,
        reason: s.reason,
        isFullDay: Boolean(s.isFullDay),
        recordedBy: session.fullName || 'ប្រធានថ្នាក់'
      }))
      localStorage.setItem('school_attendance_records', JSON.stringify([...newRecs, ...filteredExisting]))
      setPendingSyncCount(getOfflineQueue().length)
      result = { success: true, offline: true }
    } else {
      // 2. Online Mode
      result = await api('attendance.save', payload)
      if (!result.success) {
        // Fallback to offline queue if server is unreachable
        addToOfflineQueue(payload)
        setPendingSyncCount(getOfflineQueue().length)
        result = { success: true, offline: true }
      }
    }

    if (result.success) {
      try {
        localStorage.setItem(`school_period_state_${today}_${currentClass}_p${periodInfo.period}`, JSON.stringify(periodState))
        localStorage.setItem(`school_active_period_${today}_${currentClass}`, String(periodInfo.period))
      } catch (e) {}

      setLastUpdatedTime(Date.now())
      setAlertMessage({
        show: true,
        message: result.offline
          ? `បានរក្សាទុកក្នុងទូរស័ព្ទ (Offline Cache)! ទិន្នន័យនឹងត្រូវ Sync ទៅកាន់ Server & Telegram ស្វ័យប្រវត្តិពេលមាន Internet។`
          : isAlreadyDone
          ? `បានកែប្រែទិន្នន័យវត្តមាន${periodInfo.periodLabel || 'ម៉ោងទី ' + periodInfo.period} (${periodInfo.subject}) បានជោគជ័យ!`
          : `បានរក្សាទុកការស្រង់វត្តមាន${periodInfo.periodLabel || 'ម៉ោងទី ' + periodInfo.period} (${periodInfo.subject}) បានជោគជ័យ!`,
        type: 'success'
      })
    } else {
      setAlertMessage({ show: true, message: result.error || 'បរាជ័យក្នុងការរក្សាទុក', type: 'error' })
    }
    setSaving(false)
  }

  const absentCount = Object.values(attendanceState).filter(status => status === 'ABSENT').length
  const leaveCount = Object.values(attendanceState).filter(status => status === 'LEAVE').length
  const activeShift = periodInfo.shift || detectCurrentShift(new Date().getHours() * 60 + new Date().getMinutes())
  const currentShiftPeriods = (todaySchedule && todaySchedule[activeShift]) || todaySchedule?.morning || []

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.studentId && s.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="page active flex flex-col min-h-screen bg-slate-50 font-[family-name:var(--font-primary)] overflow-x-hidden max-w-full">
      {/* ── Premium Top Header ── */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-600 py-3 px-3.5 sm:py-3 sm:px-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between relative z-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-xs cursor-pointer shrink-0"
              onClick={() => onNavigate('dashboard')}
              title="ត្រឡប់ទៅទំព័រដើម"
            >
              <ChevronLeft size={16} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
            </button>
            <div>
              <h2 className="text-[15px] sm:text-[17px] font-extrabold text-white m-0 drop-shadow-sm leading-tight">ស្រង់វត្តមាន</h2>
              <div className="text-[10px] sm:text-[11px] text-indigo-100 font-medium mt-0.5 flex items-center gap-1 drop-shadow-xs">
                <Calendar size={11} className="sm:w-3 sm:h-3 text-indigo-200 shrink-0" />
                <span>{getKhmerDateText()}</span>
              </div>
            </div>
          </div>

          <button
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500/20 backdrop-blur-md border border-red-400/30 flex items-center justify-center text-red-50 hover:bg-red-500/40 transition-colors shadow-xs cursor-pointer"
            onClick={onLogout}
            title="ចាកចេញ"
          >
            <LogOut size={13} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="p-3.5 sm:p-4 flex-1 pb-[140px] sm:pb-[170px] max-w-7xl mx-auto w-full overflow-x-hidden">
        {/* ── Offline Mode Status Banner ── */}
        {!networkOnline && (
          <div className="mb-3.5 sm:mb-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-300 p-3 sm:p-4 flex items-center justify-between gap-3 text-[12px] sm:text-[13px] text-amber-950 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                <WifiOff size={18} />
              </span>
              <div>
                <span className="font-extrabold text-amber-950">របៀប Offline Mode (គ្មាន Internet)៖</span>{' '}
                <span className="text-amber-900/90 font-medium">អ្នកនៅតែអាចស្រង់វត្តមានបានធម្មតា។ ទិន្នន័យត្រូវបានរក្សាទុកក្នុងទូរស័ព្ទរបស់អ្នក និង Sync ស្វ័យប្រវត្តិតាម Telegram/Server ពេលមាន Internet វិញ។</span>
              </div>
            </div>
            <span className="bg-amber-200/90 text-amber-900 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-300/80 shrink-0 whitespace-nowrap">
              Offline Cache
            </span>
          </div>
        )}

        {/* ── Pending Sync Banner (When back online with items waiting) ── */}
        {networkOnline && pendingSyncCount > 0 && (
          <div className="mb-3.5 sm:mb-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 p-3 sm:p-4 flex items-center justify-between gap-3 text-[12px] sm:text-[13px] text-indigo-950 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <CloudUpload size={18} className={isSyncing ? 'animate-bounce' : ''} />
              </span>
              <div>
                <span className="font-extrabold text-indigo-950">មានទិន្នន័យវត្តមាន {pendingSyncCount} ម៉ោងរង់ចាំ Sync៖</span>{' '}
                <span className="text-indigo-800/80 font-medium">{isSyncing ? 'កំពុងធ្វើការ Sync ទៅកាន់ Server & Telegram...' : 'ចុចប៊ូតុងខាងស្តាំដើម្បី Sync ចូលប្រព័ន្ធ និង Telegram ភ្លាមៗ'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSyncOffline}
              disabled={isSyncing}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-[11px] sm:text-[12px] px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'កំពុង Sync...' : 'Sync ឥឡូវ'}</span>
            </button>
          </div>
        )}

        {/* ── Vacation / Weekend Notice Banner (វិស្សមកាលធំ / វិស្សមកាលតូច / សម្រាកចុងសប្តាហ៍) ── */}
        {!schoolStatus.isOpen && (
          <div className="mb-3.5 sm:mb-6 rounded-xl sm:rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-3.5 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-2.5 sm:gap-3.5">
                {schoolStatus.icon && (
                  <span className="text-2xl sm:text-4xl shrink-0 p-2 sm:p-2.5 bg-gradient-to-br from-red-100 to-rose-50 text-danger rounded-xl sm:rounded-2xl shadow-xs border border-red-100/50 flex items-center justify-center">
                    {schoolStatus.icon}
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h3 className="text-[14px] sm:text-[17px] font-extrabold text-danger ">
                      {schoolStatus.title}
                    </h3>

                  </div>
                  <p className="text-[12px] sm:text-[13px] text-slate-500 font-medium mt-0.5 sm:mt-1 leading-relaxed">
                    {schoolStatus.description}
                  </p>
                  <div className="text-[11px] sm:text-[12px] text-danger font-bold mt-1 sm:mt-1.5 flex items-center gap-1.5">
                    <span> ចូលរៀនវិញ៖</span>
                    <span className="underline">{schoolStatus.reopenDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {!allowHolidayOverride ? (
                  <button
                    type="button"
                    onClick={() => setAllowHolidayOverride(true)}
                    className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold text-[11px] sm:text-[13px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="បើកដំណើរការស្រង់វត្តមានសាកល្បង"
                  >
                    <span>+ ស្រង់វត្តមានសាកល្បង</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAllowHolidayOverride(false)}
                    className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-[11px] sm:text-[12px] px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    ចាកចេញពីរបៀបសាកល្បង
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compact reminder when testing mode is actively turned on during vacation/weekend */}
        {!schoolStatus.isOpen && allowHolidayOverride && (
          <div className="mb-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/70 px-3.5 py-2 flex items-center justify-between text-[12px] text-danger animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
              <span>កំពុងស្ថិតក្នុង <strong>របៀបសាកល្បង / បង្រៀនប៉ះប៉ូវ</strong> ក្នុងអំឡុង {schoolStatus.badgeText}។</span>
            </div>
            <button
              type="button"
              onClick={() => setAllowHolidayOverride(false)}
              className="text-danger hover:text-red-700 underline font-bold cursor-pointer"
            >
              បិទរបៀបនេះ
            </button>
          </div>
        )}

        {/* ── Period Info Card (Point 1: Auto-detect, Point 2: Quick Switcher, Point 5: Substitution) ── */}
        {!hasTimetable ? (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-3.5 sm:mb-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl  bg-gradient-to-br from-red-100 to-rose-50 text-danger  flex items-center justify-center shadow-inner shrink-0">
                <AlertCircle size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 flex-wrap">
                  <span className="flex items-center gap-1 bg-slate-50 text-slate-700 border border-slate-100 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                    <GraduationCap size={12} className="sm:w-[13px] sm:h-[13px] text-indigo-500" /> ថ្នាក់ {periodInfo.className}
                  </span>
                </div>
                <h3 className="text-[14px] sm:text-[16px] font-bold text-slate-800 mb-1">
                  ថ្នាក់ {periodInfo.className} មិនទាន់មានកាលវិភាគនៅឡើយទេ
                </h3>
                <p className="text-[12px] sm:text-[13px] text-slate-500 leading-relaxed max-w-2xl">
                  សូមទាក់ទងគណៈគ្រប់គ្រងសាលាដើម្បីបញ្ចូលកាលវិភាគ ទើបអាចស្រង់វត្តមានតាមម៉ោងនីមួយៗបាន។
                </p>
              </div>
            </div>
          </div>
        ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-3.5 sm:mb-6 relative overflow-visible">
          {/* Background glow isolated in clipped container so it never bleeds past screen edge */}
          <div className="absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl pointer-events-none">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1 sm:mb-1.5 flex-wrap gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="flex items-center gap-1 bg-indigo-50 text-accent border border-indigo-100 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                  <GraduationCap size={13} className="sm:w-3.5 sm:h-3.5" /> ថ្នាក់ {periodInfo.className} 
                </span>

                {/* 2h Double Period Badge */}
                {periodInfo.hours === 2 && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold animate-in fade-in duration-150">
                    ២ ម៉ោង
                  </span>
                )}

                {/* Point 5: Substitution Badge if swapped */}
                {isSubstituted && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold animate-in fade-in duration-200">
                    <ArrowLeftRight size={11} /> ម៉ោងប្តូរជាក់ស្តែង
                  </span>
                )}

                {/* Submitted Indicator Badge */}
                {isPeriodSubmitted(periodInfo.period) && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold animate-in fade-in duration-150">
                    <CheckCircle2 size={11} className="text-emerald-600" /> បានស្រង់រួច
                  </span>
                )}
              </div>

              {/* Point 2: Period Badge with quick switcher dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className="text-[12px] sm:text-[13px] text-slate-700 font-bold bg-slate-100 hover:bg-slate-200 px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer border border-slate-200/60"
                  title="ចុចដើម្បីប្តូរម៉ោងសិក្សាផ្សេងបើចាំបាច់"
                >
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{periodInfo.periodLabel || `ម៉ោងទី ${periodInfo.period}`}</span>
                  <ChevronDown size={13} className={`text-slate-400 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPeriodDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-28px)] bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                      <span>ជ្រើសរើសម៉ោង ({activeShift === 'afternoon' ? 'វេនរសៀល' : 'វេនព្រឹក'})</span>
                      <span className="text-[10px] text-indigo-500 font-semibold">ថ្ងៃ{todaySchedule.dayName} • {periodInfo.className}</span>
                    </div>
                    {currentShiftPeriods.map(p => {
                      const isCurrent = periodInfo.period === p.period
                      const isDone = isPeriodSubmitted(p.period)
                      return (
                        <button
                          key={p.period}
                          type="button"
                          onClick={() => selectPeriodManually(p)}
                          className={`w-full text-left px-3.5 py-2.5 text-[13px] flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                            isCurrent ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="leading-tight">{p.periodLabel} • {p.subject}</span>
                              {p.hours === 2 && (
                                <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded font-semibold whitespace-nowrap">
                                  2h
                                </span>
                              )}
                              {p.isLibre && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold whitespace-nowrap">
                                  លីប
                                </span>
                              )}
                              {isDone && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-bold whitespace-nowrap">
                                  ✓ ស្រង់រួច
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 truncate mt-0.5">
                              {p.isLibre ? 'ម៉ោងទំនេរ (មិនបាច់ស្រង់)' : p.teacher}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap self-start mt-0.5">
                            {p.startTime} - {p.endTime}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Subject Name */}
            <div className="text-[18px] sm:text-[22px] font-extrabold text-slate-800 tracking-tight leading-tight mb-1 sm:mb-2">
              {periodInfo.subject}
            </div>

            {/* Time & Teacher Info */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[12px] sm:text-[14px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                </div>
                <span>{periodInfo.startTime} - {periodInfo.endTime}</span>
              </div>
              {periodInfo.teacher ? (
                <>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <BookOpen size={13} className="sm:w-3.5 sm:h-3.5 text-slate-400" />
                    <span>បង្រៀនដោយ៖ <strong className="text-slate-700">{periodInfo.teacher}</strong></span>
                  </div>
                </>
              ) : periodInfo.isLibre && !isSubstituted ? (
                <>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-slate-400 italic">
                    <span>(គ្មានការបង្រៀន - ម៉ោងទំនេរ)</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Libre Notice Banner */}
            {periodInfo.isLibre && !isSubstituted && (
              <div className="mt-2.5 sm:mt-3 p-2.5 sm:p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between gap-2.5 text-[12px] sm:text-[13px] text-amber-900">
                <div className="flex items-center gap-2">
                  <span className="leading-snug">
                    ម៉ោងនេះជា <strong>ម៉ោងទំនេរ</strong> មិនបាច់ស្រង់វត្តមានទេ។
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openSubModal}
                  className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeftRight size={12} />
                  <span>+ មានគ្រូជំនួស</span>
                </button>
              </div>
            )}

            {/* Point 5: Quick Button to Swap Teacher / Subject */}
            <div className="flex items-center justify-between mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={openSubModal}
                className={`text-[11px] sm:text-[12px] font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${isSubstituted
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                  }`}
                title="ចុចដើម្បីប្តូរមុខវិជ្ជា ឬគ្រូបង្រៀនជាក់ស្តែងសម្រាប់ម៉ោងនេះ"
              >
                <ArrowLeftRight size={12} className={isSubstituted ? 'text-white' : 'text-slate-500'} />
                <span>{isSubstituted ? 'បានប្តូរម៉ោង/គ្រូជាក់ស្តែង' : (periodInfo.isLibre ? '+ បញ្ចូលគ្រូបង្រៀនជំនួស' : 'ប្តូរម៉ោង / គ្រូជំនួស')}</span>
              </button>

              {isSubstituted && (
                <button
                  type="button"
                  onClick={resetToTimetableDefault}
                  className="text-[10px] sm:text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="កំណត់ត្រឡប់មកកាលវិភាគដើមវិញ"
                >
                  (កំណត់មកកាលវិភាគដើមវិញ)
                </button>
              )}
            </div>
        </div>
      </div>
      )}

      {/* ── Search Bar ── */}
      <div className="relative mb-3 sm:mb-5">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search size={16} className="sm:w-[18px] sm:h-[18px] text-slate-400" />
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-3.5 py-2.5 sm:py-3.5 bg-white border border-slate-200 rounded-xl text-[13px] sm:text-[14px] text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 shadow-xs font-medium"
          placeholder="ស្វែងរកឈ្មោះសិស្ស..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── Controls (Point 3: Total Count & Fast Reset to Present) ── */}
      <div className="flex items-center justify-between mb-2.5 sm:mb-4 px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[12px] sm:text-[13px]">
            {filteredStudents.length}
          </div>
          <div className="text-[13px] sm:text-[15px] font-bold text-slate-700">
            សិស្សសរុប
          </div>
        </div>
        <button
          className="text-[11px] sm:text-[13px] font-bold text-accent hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-colors flex items-center gap-1 sm:gap-1.5 border border-indigo-100 cursor-pointer"
          onClick={resetAll}
          disabled={isActionDisabled}
          title={isOffDisabled ? `សាលាកំពុងឈប់សម្រាក (${schoolStatus.badgeText})` : isLibreDisabled ? "មិនអាចកំណត់វត្តមានក្នុងម៉ោងទំនេរទេ" : "កំណត់សិស្សទាំងអស់ជាមានវត្តមានវិញ"}
        >
          <RotateCcw size={13} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} /> លុបទាំងអស់
        </button>
      </div>

      {/* ── Student List (Exact Beloved Old UI Layout, Compact on Mobile) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3 md:gap-5">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse h-[80px] sm:h-[90px] rounded-xl sm:rounded-2xl bg-white shadow-xs border border-slate-100"></div>
          ))
        ) : filteredStudents.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl sm:rounded-2xl p-6 sm:p-10 text-center border border-dashed border-slate-200">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Users size={24} className="sm:w-8 sm:h-8 text-slate-300" />
            </div>
            <div className="text-[13px] sm:text-[15px] font-medium text-slate-500">
              {searchQuery ? 'មិនមានសិស្សដែលអ្នកស្វែងរកទេ' : 'មិនមានទិន្នន័យសិស្សទេ'}
            </div>
          </div>
        ) : (
          filteredStudents.map((s, index) => {
            const status = attendanceState[s.id] || 'PRESENT'
            const isAbsent = status === 'ABSENT'
            const isLeave = status === 'LEAVE'
            const isFullDay = Boolean(fullDayState[s.id])

            let cardBg = 'bg-white border-transparent'
            if (isAbsent) cardBg = 'bg-red-50/50 border-red-200'
            if (isLeave) cardBg = 'bg-amber-50/50 border-amber-200'

            return (
              <div
                key={s.id}
                className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 transition-all duration-300 select-none border sm:border-2 shadow-xs ${cardBg}`}
              >
                {/* Decorative number */}
                <div className={`absolute right-1 bottom-0 text-[50px] sm:text-[60px] font-black opacity-[0.03] pointer-events-none transition-colors duration-300 select-none leading-none
                    ${isAbsent ? 'text-danger' : isLeave ? 'text-amber-500' : 'text-slate-900'}`}>
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* Student Identity Row */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                    <div className="relative">
                      <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-[13px] sm:text-[15px] font-bold shrink-0 transition-all duration-300 shadow-xs
                          ${isAbsent ? 'bg-danger text-white scale-105' : isLeave ? 'bg-amber-500 text-white scale-105' : 'bg-slate-100 text-slate-600'}`}>
                        {s.name ? s.name.charAt(0) : s.id.slice(-2)}
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[14px] sm:text-[16px] font-extrabold truncate transition-colors duration-300
                          ${isAbsent ? 'text-danger' : isLeave ? 'text-amber-600' : 'text-slate-800'}`}>
                        {s.name}
                      </span>
                      <span className="text-[11px] sm:text-[13px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <User size={11} className={`sm:w-3 sm:h-3 ${s.gender === 'F' ? "text-pink-400" : "text-blue-400"}`} />
                        <span>{s.gender === 'F' ? 'ស្រី' : 'ប្រុស'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">#{s.id}</span>
                      </span>
                    </div>
                  </div>

                  {/* Point 4: Full-Day Leave Toggle Badge (Only appears when LEAVE is chosen) */}
                  {isLeave && (
                    <button
                      type="button"
                      disabled={isActionDisabled}
                      onClick={() => toggleFullDay(s.id)}
                      className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border transition-all whitespace-nowrap shadow-xs ${
                        isActionDisabled
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                          : isFullDay
                          ? 'bg-amber-500 text-white border-amber-600 cursor-pointer'
                          : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50 cursor-pointer'
                      }`}
                      title={isOffDisabled ? `សាលាកំពុងឈប់សម្រាក (${schoolStatus.badgeText})` : isLibreDisabled ? 'ម៉ោងទំនេរ មិនអាចកែប្រែបានទេ' : 'ចុចដើម្បីកំណត់សុំច្បាប់ពេញមួយថ្ងៃ (គ្រប់ម៉ោងសិក្សា)'}
                    >
                      {isFullDay ? '✓ ពេញមួយថ្ងៃ' : '+ ពេញមួយថ្ងៃ'}
                    </button>
                  )}
                </div>

                {/* Status Selection Buttons (Old UI 3 buttons) */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 relative z-10 mt-0.5 sm:mt-1">
                  <button
                    type="button"
                    disabled={isActionDisabled}
                    onClick={() => setStatus(s.id, 'PRESENT')}
                    className={`flex flex-col items-center justify-center py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      isActionDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-100/70 border-slate-200 text-slate-400'
                        : !isAbsent && !isLeave
                        ? 'bg-success/10 border-success text-success shadow-xs cursor-pointer'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 cursor-pointer'
                    }`}
                    title={isOffDisabled ? `សាលាកំពុងឈប់សម្រាក (${schoolStatus.badgeText})` : isLibreDisabled ? 'ម៉ោងទំនេរ មិនអាចស្រង់វត្តមានបានទេ' : undefined}
                  >
                    <Check size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={!isAbsent && !isLeave ? 3 : 2} />
                    <span className="text-[10px] sm:text-[11px] font-bold mt-0.5 sm:mt-1">វត្តមាន</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionDisabled}
                    onClick={() => setStatus(s.id, 'ABSENT')}
                    className={`flex flex-col items-center justify-center py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      isActionDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-100/70 border-slate-200 text-slate-400'
                        : isAbsent
                        ? 'bg-danger/10 border-danger text-danger shadow-xs cursor-pointer'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 cursor-pointer'
                    }`}
                    title={isOffDisabled ? `សាលាកំពុងឈប់សម្រាក (${schoolStatus.badgeText})` : isLibreDisabled ? 'ម៉ោងទំនេរ មិនអាចស្រង់វត្តមានបានទេ' : undefined}
                  >
                    <X size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={isAbsent ? 3 : 2} />
                    <span className="text-[10px] sm:text-[11px] font-bold mt-0.5 sm:mt-1">អវត្តមាន</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionDisabled}
                    onClick={() => setStatus(s.id, 'LEAVE')}
                    className={`flex flex-col items-center justify-center py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      isActionDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-100/70 border-slate-200 text-slate-400'
                        : isLeave
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600 shadow-xs cursor-pointer'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 cursor-pointer'
                    }`}
                    title={isOffDisabled ? `សាលាកំពុងឈប់សម្រាក (${schoolStatus.badgeText})` : isLibreDisabled ? 'ម៉ោងទំនេរ មិនអាចស្រង់វត្តមានបានទេ' : undefined}
                  >
                    <FileText size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={isLeave ? 3 : 2} />
                    <span className="text-[10px] sm:text-[11px] font-bold mt-0.5 sm:mt-1">ច្បាប់</span>
                  </button>
                </div>

                {/* Input មូលហេតុសុំច្បាប់ when student is on LEAVE */}
                {isLeave && !isActionDisabled && (
                  <div className="mt-1.5 sm:mt-2.5 pt-1.5 sm:pt-2.5 border-t border-amber-200/70 flex flex-col gap-1 sm:gap-1.5 animate-in fade-in duration-200 relative z-10">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="text-[10px] sm:text-[11px] font-bold text-amber-900 flex items-center gap-1">
                        <FileText size={11} className="text-amber-600" />
                        <span>មូលហេតុសុំច្បាប់៖</span>
                      </label>

                      {/* Quick preset chips */}
                      <div className="flex items-center gap-1">
                        {['ឈឺ', 'ធុរៈគ្រួសារ', 'ទៅស្រុក'].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setLeaveReason(s.id, preset)}
                            className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded transition-all cursor-pointer border ${
                              leaveReasons[s.id] === preset
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white/90 hover:bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={leaveReasons[s.id] || ''}
                      onChange={(e) => setLeaveReason(s.id, e.target.value)}
                      placeholder="វាយបញ្ចូលមូលហេតុ (ឧ. ឈឺ, គ្រុនក្តៅ, ធុរៈ...)"
                      className="w-full px-2 sm:px-2.5 py-1 text-[11px] sm:text-[12px] bg-white border border-amber-300 rounded-md sm:rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 font-medium transition-all shadow-xs"
                    />
                  </div>
                )}

              </div>
            )
          })
        )}
      </div>
    </div>

      {/* ── Save Bar (Old Sticky Bottom Bar) ── */ }
  <div className="fixed bottom-[52px] left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 py-1.5 px-3 sm:py-2.5 sm:px-4 flex items-center justify-center z-40 shadow-[0_-6px_20px_rgba(0,0,0,0.03)] overflow-hidden">
    <div className="flex items-center justify-between w-full max-w-7xl gap-2">
      <div className="flex gap-2.5 sm:gap-4 md:gap-6">
        <div className="flex flex-col items-center">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">អវត្តមាន</span>
          <div className={`flex items-center gap-1 ${absentCount > 0 ? 'text-danger' : 'text-slate-400'}`}>
            <AlertCircle size={13} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
            <span className="text-[14px] sm:text-[16px] font-black leading-none">{absentCount}</span>
          </div>
        </div>
        <div className="w-[1px] h-5 sm:h-6 bg-slate-200 self-center"></div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ច្បាប់</span>
          <div className={`flex items-center gap-1 ${leaveCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
            <FileText size={13} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
            <span className="text-[14px] sm:text-[16px] font-black leading-none">{leaveCount}</span>
          </div>
        </div>
      </div>

      {!hasTimetable ? (
        <button
          type="button"
          disabled
          className="bg-red-50 text-danger font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl flex items-center gap-1.5 cursor-not-allowed text-[11px] sm:text-[13px]"
          title="មិនទាន់មានកាលវិភាគសម្រាប់ថ្នាក់នេះនៅឡើយទេ"
        >
          <AlertCircle size={14} />
          <span>មិនទាន់មានកាលវិភាគ</span>
        </button>
      ) : periodInfo.isLibre && !isSubstituted ? (
        <button
          type="button"
          disabled
          className="bg-slate-100 border border-slate-200 text-slate-400 font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl flex items-center gap-1.5 cursor-not-allowed text-[11px] sm:text-[13px]"
          title="ម៉ោងទំនេរ មិនតម្រូវឱ្យស្រង់វត្តមានទេ"
        >
          <span>ម៉ោងទំនេរ (មិនបាច់ស្រង់ទេ)</span>
        </button>
      ) : isOffDisabled ? (
        <button
          type="button"
          disabled
          className="bg-slate-100 border border-slate-200 text-slate-400 font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl flex items-center gap-1.5 cursor-not-allowed text-[11px] sm:text-[13px]"
          title={`សាលាកំពុងឈប់សម្រាក (${schoolStatus.badgeText})`}
        >
          <span>ឈប់សម្រាក ({schoolStatus.badgeText})</span>
        </button>
      ) : (
        <button
          type="button"
          className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-1.5 sm:py-2 px-3 sm:px-5 rounded-lg sm:rounded-xl shadow-[0_4px_12px_0_rgb(99,102,241,0.3)] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5 cursor-pointer text-[11px] sm:text-[13px]"
          onClick={saveAttendance}
          disabled={saving || loading || students.length === 0 || !hasTimetable}
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin sm:w-4 sm:h-4" /> រក្សាទុក...</>
          ) : isPeriodSubmitted(periodInfo.period) ? (
            <><Send size={13} className="sm:w-4 sm:h-4" /> រក្សាទុក ({periodInfo.periodLabel || `ម៉ោងទី ${periodInfo.period}`})</>
          ) : (
            <><Send size={14} className="sm:w-4 sm:h-4" /> បញ្ជូន ({periodInfo.periodLabel || `ម៉ោងទី ${periodInfo.period}`})</>
          )}
        </button>
      )}
    </div>
  </div>

  {/* ── Point 5: Modal ប្តូរមុខវិជ្ជា ឬគ្រូបង្រៀនជាក់ស្តែង (Substitution Modal) ── */ }
  {
    showSubModal && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 relative z-10 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <ArrowLeftRight size={20} />
              </div>
              <div>
                <h3 className="text-[17px] font-extrabold text-slate-800 leading-tight">ប្តូរម៉ោង / គ្រូជំនួស</h3>
                <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                  {periodInfo.periodLabel || `ម៉ោងទី ${periodInfo.period}`} ({periodInfo.startTime} - {periodInfo.endTime}) • ថ្នាក់ {periodInfo.className}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSubModal(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="py-5 flex flex-col gap-4">
            {/* Subject Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-600" />
                មុខវិជ្ជាជាក់ស្តែង
              </label>
              <input
                type="text"
                value={subForm.subject}
                onChange={(e) => setSubForm({ ...subForm, subject: e.target.value })}
                placeholder="បញ្ចូលឈ្មោះមុខវិជ្ជា (ឧ. រូបវិទ្យា)"
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 font-medium focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-400 shadow-sm"
                autoFocus
              />
            </div>

            {/* Teacher Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                <User size={14} className="text-indigo-600" />
                ឈ្មោះគ្រូបង្រៀនជាក់ស្តែង (ឬគ្រូជំនួស)
              </label>
              <input
                type="text"
                value={subForm.teacher}
                onChange={(e) => setSubForm({ ...subForm, teacher: e.target.value })}
                placeholder="បញ្ចូលឈ្មោះគ្រូ (ឧ. អ្នកគ្រូ ហេង សុផល)"
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 font-medium focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
            <button
              type="button"
              onClick={resetToTimetableDefault}
              className="text-[12px] font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              កាលវិភាគដើម
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSubModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[13px] transition-all cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={confirmSubstitution}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[13px] shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check size={16} strokeWidth={2.5} />
                <span>យល់ព្រមប្តូរ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  {/* ── Custom Alert Modal ── */ }
  {
    alertMessage.show && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setAlertMessage({ ...alertMessage, show: false })}></div>
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center mt-2">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm
                ${alertMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-red-50 text-danger'}`}>
              {alertMessage.type === 'success' ? (
                <CheckCircle2 size={32} strokeWidth={2.5} />
              ) : (
                <AlertCircle size={32} strokeWidth={2.5} />
              )}
            </div>
            <h3 className="text-[20px] font-extrabold text-slate-800 mb-2">
              {alertMessage.type === 'success' ? 'ជោគជ័យ' : 'បរាជ័យ'}
            </h3>
            <p className="text-[15px] font-medium text-slate-500 mb-8 px-2">
              {alertMessage.message}
            </p>

            <button
              type="button"
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all cursor-pointer
                  ${alertMessage.type === 'success'
                  ? 'bg-gradient-to-r from-success to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 shadow-[0_4px_14px_0_rgba(16,185,129,0.39)]'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-[0_4px_14px_0_rgb(225,29,72,0.39)]'}`}
              onClick={() => setAlertMessage({ ...alertMessage, show: false })}
            >
              បិទ
            </button>
          </div>
        </div>
      </div>
    )
  }
    </div>
  )
}
