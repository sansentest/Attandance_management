import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { getSchoolStatus } from '../utils/academicCalendar'
import {
  ChevronLeft, GraduationCap, Clock, RotateCcw, Users,
  User, Check, X, FileText, AlertCircle, CheckCircle2,
  Loader2, Send, LogOut, Search, BookOpen, ChevronDown,
  ArrowLeftRight, Calendar
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

  useEffect(() => {
    loadStudents(currentClass, periodInfo)
  }, [currentClass])

  const loadStudents = async (cls = currentClass, targetPeriod = periodInfo) => {
    setLoading(true)
    const result = await api('students.getByClass', { className: cls })
    if (result.success && result.data) {
      setStudents(result.data)
      const fullDayMap = getSavedFullDayLeaves()
      setFullDayState(fullDayMap)
      await loadPeriodData(targetPeriod, result.data)
    }
    setLoading(false)
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

    const result = await api('attendance.save', payload)
    if (result.success) {
      try {
        localStorage.setItem(`school_period_state_${today}_${currentClass}_p${periodInfo.period}`, JSON.stringify(periodState))
        localStorage.setItem(`school_active_period_${today}_${currentClass}`, String(periodInfo.period))
      } catch (e) {}

      setLastUpdatedTime(Date.now())
      setAlertMessage({
        show: true,
        message: isAlreadyDone
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
    <div className="page active flex flex-col min-h-screen bg-slate-50 font-[family-name:var(--font-primary)]">
      {/* ── Premium Top Header ── */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-600 pt-5 px-4 pb-5 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between relative z-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-sm cursor-pointer shrink-0"
              onClick={() => onNavigate('dashboard')}
              title="ត្រឡប់ទៅទំព័រដើម"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <div>
              <h2 className="text-[20px] font-extrabold text-white m-0 drop-shadow-sm leading-tight">ស្រង់វត្តមាន</h2>
              <div className="text-[12px] text-indigo-100 font-medium mt-0.5 flex items-center gap-1.5 drop-shadow-xs">
                <Calendar size={13} className="text-indigo-200 shrink-0" />
                <span>{getKhmerDateText()}</span>
              </div>
            </div>
          </div>

          <button
            className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-md border border-red-400/30 flex items-center justify-center text-red-50 hover:bg-red-500/40 transition-colors shadow-sm cursor-pointer"
            onClick={onLogout}
            title="ចាកចេញ"
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 pb-[170px] max-w-7xl mx-auto w-full">
        {/* ── Vacation / Weekend Notice Banner (វិស្សមកាលធំ / វិស្សមកាលតូច / សម្រាកចុងសប្តាហ៍) ── */}
        {!schoolStatus.isOpen && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200/90 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                {schoolStatus.icon && (
                  <span className="text-3xl sm:text-4xl shrink-0 p-2.5 bg-white rounded-2xl shadow-xs border border-amber-100 flex items-center justify-center">
                    {schoolStatus.icon}
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[16px] sm:text-[17px] font-extrabold text-amber-950">
                      {schoolStatus.title}
                    </h3>
                    <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                      {schoolStatus.badgeText}
                    </span>
                  </div>
                  <p className="text-[13px] text-amber-900/80 font-medium mt-1 leading-relaxed">
                    {schoolStatus.description}
                  </p>
                  <div className="text-[12px] text-amber-700 font-bold mt-1.5 flex items-center gap-1.5">
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
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[12px] sm:text-[13px] px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="បើកដំណើរការស្រង់វត្តមានសាកល្ប"
                  >
                    <span>+ ស្រង់វត្តមានសាកល្បង</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAllowHolidayOverride(false)}
                    className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-[12px] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
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
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 flex items-center justify-between text-[12px] text-amber-800 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>កំពុងស្ថិតក្នុង <strong>របៀបសាកល្បង / បង្រៀនប៉ះប៉ូវ</strong> ក្នុងអំឡុង {schoolStatus.badgeText}។</span>
            </div>
            <button
              type="button"
              onClick={() => setAllowHolidayOverride(false)}
              className="text-amber-700 hover:text-amber-900 underline font-bold cursor-pointer"
            >
              បិទរបៀបនេះ
            </button>
          </div>
        )}

        {/* ── Period Info Card (Point 1: Auto-detect, Point 2: Quick Switcher, Point 5: Substitution) ── */}
        {!hasTimetable ? (
          <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-200 mb-6 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-xs">
                <AlertCircle size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                    <GraduationCap size={13} /> ថ្នាក់ {periodInfo.className}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    មិនទាន់មានកាលវិភាគ
                  </span>
                </div>
                <h3 className="text-[17px] font-extrabold text-slate-800 mb-1">
                  ថ្នាក់ {periodInfo.className} មិនទាន់មានកាលវិភាគនៅឡើយទេ
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed max-w-2xl">
                  គណៈគ្រប់គ្រងសាលា (Admin) មិនទាន់បានបញ្ចូលកាលវិភាគសិក្សាប្រចាំសប្តាហ៍សម្រាប់ថ្នាក់នេះក្នុងប្រព័ន្ធទេ។ សូមរង់ចាំ Admin រៀបចំកាលវិភាគ ឬទាក់ទងគណៈគ្រប់គ្រងដើម្បីបញ្ចូលកាលវិភាគ ទើបអាចស្រង់វត្តមានតាមម៉ោងនីមួយៗបាន។
                </p>
              </div>
            </div>
          </div>
        ) : (
        <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 relative overflow-visible">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 bg-indigo-50 text-accent border border-indigo-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <GraduationCap size={14} /> ថ្នាក់ {periodInfo.className} 
                </span>

                {/* 2h Double Period Badge */}
                {periodInfo.hours === 2 && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] font-bold animate-in fade-in duration-150">
                    ២ ម៉ោង
                  </span>
                )}

                {/* Point 5: Substitution Badge if swapped */}
                {isSubstituted && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold animate-in fade-in duration-200">
                    <ArrowLeftRight size={12} /> ម៉ោងប្តូរជាក់ស្តែង
                  </span>
                )}

                {/* Submitted Indicator Badge */}
                {isPeriodSubmitted(periodInfo.period) && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold animate-in fade-in duration-150">
                    <CheckCircle2 size={12} className="text-emerald-600" /> បានស្រង់រួច
                  </span>
                )}
              </div>

              {/* Point 2: Period Badge with quick switcher dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className="text-[13px] text-slate-700 font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200/60"
                  title="ចុចដើម្បីប្តូរម៉ោងសិក្សាផ្សេងបើចាំបាច់"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{periodInfo.periodLabel || `ម៉ោងទី ${periodInfo.period}`}</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPeriodDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
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
            <div className="text-[22px] font-extrabold text-slate-800 tracking-tight leading-tight mb-2">
              {periodInfo.subject}
            </div>

            {/* Time & Teacher Info */}
            <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Clock size={14} />
                </div>
                <span>{periodInfo.startTime} - {periodInfo.endTime}</span>
              </div>
              {periodInfo.teacher ? (
                <>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <BookOpen size={14} className="text-slate-400" />
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
              <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 text-[13px] text-amber-900">
                <div className="flex items-center gap-2">
                  <span className="leading-snug">
                    ម៉ោងនេះជា <strong>ម៉ោងទំនេរ</strong> មិនបាច់ស្រង់វត្តមានទេ។
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openSubModal}
                  className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeftRight size={13} />
                  <span>+ មានគ្រូមកបង្រៀនជំនួស</span>
                </button>
              </div>
            )}

            {/* Point 5: Quick Button to Swap Teacher / Subject */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={openSubModal}
                className={`text-[12px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${isSubstituted
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                  }`}
                title="ចុចដើម្បីប្តូរមុខវិជ្ជា ឬគ្រូបង្រៀនជាក់ស្តែងសម្រាប់ម៉ោងនេះ"
              >
                <ArrowLeftRight size={13} className={isSubstituted ? 'text-white' : 'text-slate-500'} />
                <span>{isSubstituted ? 'បានប្តូរម៉ោង/គ្រូជាក់ស្តែង' : (periodInfo.isLibre ? '+ បញ្ចូលគ្រូបង្រៀនជំនួស' : 'ប្តូរម៉ោង / គ្រូជំនួស')}</span>
              </button>

              {isSubstituted && (
                <button
                  type="button"
                  onClick={resetToTimetableDefault}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 shadow-sm font-medium"
          placeholder="ស្វែងរកឈ្មោះសិស្ស..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── Controls (Point 3: Total Count & Fast Reset to Present) ── */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[13px]">
            {filteredStudents.length}
          </div>
          <div className="text-[15px] font-bold text-slate-700">
            សិស្សសរុប
          </div>
        </div>
        <button
          className="text-[13px] font-bold text-accent hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-indigo-100 cursor-pointer"
          onClick={resetAll}
          disabled={isActionDisabled}
          title={isOffDisabled ? `សាលាកំពុងឈប់សម្រាក (${schoolStatus.badgeText})` : isLibreDisabled ? "មិនអាចកំណត់វត្តមានក្នុងម៉ោងទំនេរទេ" : "កំណត់សិស្សទាំងអស់ជាមានវត្តមានវិញ"}
        >
          <RotateCcw size={14} strokeWidth={2.5} /> លុបទាំងអស់
        </button>
      </div>

      {/* ── Student List (Exact Beloved Old UI Layout) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse h-[90px] rounded-2xl bg-white shadow-sm border border-slate-100"></div>
          ))
        ) : filteredStudents.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-slate-300" />
            </div>
            <div className="text-[15px] font-medium text-slate-500">
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
                className={`relative overflow-hidden rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 select-none border-2 shadow-sm ${cardBg}`}
              >
                {/* Decorative number */}
                <div className={`absolute -right-2 -bottom-4 text-[60px] font-black opacity-[0.03] pointer-events-none transition-colors duration-300 
                    ${isAbsent ? 'text-danger' : isLeave ? 'text-amber-500' : 'text-slate-900'}`}>
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* Student Identity Row */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0 transition-all duration-300 shadow-sm
                          ${isAbsent ? 'bg-danger text-white scale-105' : isLeave ? 'bg-amber-500 text-white scale-105' : 'bg-slate-100 text-slate-600'}`}>
                        {s.name ? s.name.charAt(0) : s.id.slice(-2)}
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[16px] font-extrabold truncate transition-colors duration-300
                          ${isAbsent ? 'text-danger' : isLeave ? 'text-amber-600' : 'text-slate-800'}`}>
                        {s.name}
                      </span>
                      <span className="text-[13px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <User size={12} className={s.gender === 'F' ? "text-pink-400" : "text-blue-400"} />
                        <span>{s.gender === 'F' ? 'ស្រី' : 'ប្រុស'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-mono text-slate-400">#{s.id}</span>
                      </span>
                    </div>
                  </div>

                  {/* Point 4: Full-Day Leave Toggle Badge (Only appears when LEAVE is chosen) */}
                  {isLeave && (
                    <button
                      type="button"
                      disabled={isActionDisabled}
                      onClick={() => toggleFullDay(s.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap shadow-sm ${
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
                <div className="grid grid-cols-3 gap-2 relative z-10 mt-1">
                  <button
                    type="button"
                    disabled={isActionDisabled}
                    onClick={() => setStatus(s.id, 'PRESENT')}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all duration-200 ${
                      isActionDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-100/70 border-slate-200 text-slate-400'
                        : !isAbsent && !isLeave
                        ? 'bg-success/10 border-success text-success shadow-sm cursor-pointer'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 cursor-pointer'
                    }`}
                    title={isOffDisabled ? `សាលាកំពុងឈប់សម្រាក (${schoolStatus.badgeText})` : isLibreDisabled ? 'ម៉ោងទំនេរ មិនអាចស្រង់វត្តមានបានទេ' : undefined}
                  >
                    <Check size={18} strokeWidth={!isAbsent && !isLeave ? 3 : 2} />
                    <span className="text-[11px] font-bold mt-1">វត្តមាន</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionDisabled}
                    onClick={() => setStatus(s.id, 'ABSENT')}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all duration-200 ${
                      isActionDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-100/70 border-slate-200 text-slate-400'
                        : isAbsent
                        ? 'bg-danger/10 border-danger text-danger shadow-sm cursor-pointer'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 cursor-pointer'
                    }`}
                    title={isOffDisabled ? `សាលាកំពុងឈប់សម្រាក (${schoolStatus.badgeText})` : isLibreDisabled ? 'ម៉ោងទំនេរ មិនអាចស្រង់វត្តមានបានទេ' : undefined}
                  >
                    <X size={18} strokeWidth={isAbsent ? 3 : 2} />
                    <span className="text-[11px] font-bold mt-1">អវត្តមាន</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionDisabled}
                    onClick={() => setStatus(s.id, 'LEAVE')}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all duration-200 ${
                      isActionDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-100/70 border-slate-200 text-slate-400'
                        : isLeave
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600 shadow-sm cursor-pointer'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 cursor-pointer'
                    }`}
                    title={isOffDisabled ? `សាលាកំពុងឈប់សម្រាក (${schoolStatus.badgeText})` : isLibreDisabled ? 'ម៉ោងទំនេរ មិនអាចស្រង់វត្តមានបានទេ' : undefined}
                  >
                    <FileText size={18} strokeWidth={isLeave ? 3 : 2} />
                    <span className="text-[11px] font-bold mt-1">ច្បាប់</span>
                  </button>
                </div>

                {/* Input មូលហេតុសុំច្បាប់ when student is on LEAVE */}
                {isLeave && !isActionDisabled && (
                  <div className="mt-2.5 pt-2.5 border-t border-amber-200/70 flex flex-col gap-1.5 animate-in fade-in duration-200 relative z-10">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                        <FileText size={12} className="text-amber-600" />
                        <span>មូលហេតុសុំច្បាប់៖</span>
                      </label>

                      {/* Quick preset chips */}
                      <div className="flex items-center gap-1">
                        {['ឈឺ', 'ធុរៈគ្រួសារ', 'ទៅស្រុក'].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setLeaveReason(s.id, preset)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer border ${
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
                      className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-amber-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 font-medium transition-all shadow-xs"
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
  <div className="fixed bottom-[64px] left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 flex items-center justify-center z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
    <div className="flex items-center justify-between w-full max-w-7xl">
      <div className="flex gap-4 md:gap-8">
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">អវត្តមាន</span>
          <div className={`flex items-center gap-1.5 ${absentCount > 0 ? 'text-danger' : 'text-slate-400'}`}>
            <AlertCircle size={16} strokeWidth={2.5} />
            <span className="text-[18px] font-black leading-none">{absentCount}</span>
          </div>
        </div>
        <div className="w-[1px] h-8 bg-slate-200 self-center"></div>
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">ច្បាប់</span>
          <div className={`flex items-center gap-1.5 ${leaveCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
            <FileText size={16} strokeWidth={2.5} />
            <span className="text-[18px] font-black leading-none">{leaveCount}</span>
          </div>
        </div>
      </div>

      {!hasTimetable ? (
        <button
          type="button"
          disabled
          className="bg-amber-50 border border-amber-200 text-amber-700 font-bold py-3 px-5 rounded-xl flex items-center gap-2 cursor-not-allowed text-[14px]"
          title="មិនទាន់មានកាលវិភាគសម្រាប់ថ្នាក់នេះនៅឡើយទេ"
        >
          <AlertCircle size={18} />
          <span>មិនទាន់មានកាលវិភាគ</span>
        </button>
      ) : periodInfo.isLibre && !isSubstituted ? (
        <button
          type="button"
          disabled
          className="bg-slate-100 border border-slate-200 text-slate-400 font-bold py-3 px-5 rounded-xl flex items-center gap-2 cursor-not-allowed text-[14px]"
          title="ម៉ោងទំនេរ មិនតម្រូវឱ្យស្រង់វត្តមានទេ"
        >
          <span>ម៉ោងទំនេរ (មិនបាច់ស្រង់វត្តមានទេ)</span>
        </button>
      ) : isOffDisabled ? (
        <button
          type="button"
          disabled
          className="bg-slate-100 border border-slate-200 text-slate-400 font-bold py-3 px-5 rounded-xl flex items-center gap-2 cursor-not-allowed text-[14px]"
          title={`សាលាកំពុងឈប់សម្រាក (${schoolStatus.badgeText})`}
        >
          <span>សាលាឈប់សម្រាក ({schoolStatus.badgeText})</span>
        </button>
      ) : (
        <button
          type="button"
          className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_14px_0_rgb(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 cursor-pointer"
          onClick={saveAttendance}
          disabled={saving || loading || students.length === 0 || !hasTimetable}
        >
          {saving ? (
            <><Loader2 className="animate-spin" size={20} /> រក្សាទុក...</>
          ) : isPeriodSubmitted(periodInfo.period) ? (
            <><Send size={18} /> រក្សាទុកការកែប្រែ ({periodInfo.periodLabel || `ម៉ោងទី ${periodInfo.period}`})</>
          ) : (
            <><Send size={20} /> បញ្ជូន ({periodInfo.periodLabel || `ម៉ោងទី ${periodInfo.period}`})</>
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
