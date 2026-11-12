import { useState, useEffect, useRef } from 'react'
import {
  Search, AlertTriangle, Settings, PhoneCall, ShieldAlert, CheckCircle2,
  User, X, Save, Users, Calendar, Download,
  ChevronDown, FileText, FileCode, FileImage, Mail, Phone, Eye, RefreshCw, Clock
} from 'lucide-react'
import { SearchableDropdown } from '../attendance/AdminStudentAttendance'
import TablePagination from '../../common/TablePagination'
import { MONTH_FILTER_OPTIONS, matchesMonthFilter } from '../../../utils/dateFilters'

/**
 * Recompute absent/leave day and hour counts for a slice of attendance records.
 */
function computeTrackingCounts(records = []) {
  const dateMap = new Map()
  let absentHours = 0
  let leaveHours = 0

  records.forEach(r => {
    const hrs = Number(r.hours) || Number(r.periods) || 1
    if (r.status === 'LEAVE') {
      leaveHours += hrs
    } else {
      absentHours += hrs
    }
    const d = r.date || 'unknown'
    if (!dateMap.has(d)) dateMap.set(d, [])
    dateMap.get(d).push(r)
  })

  let absentDays = 0
  let leaveDays = 0
  dateMap.forEach(dayRecs => {
    const hasUnexcused = dayRecs.some(r => r.status === 'ABSENT' || !r.status || r.status === 'LATE' || r.status === 'DROPOUT')
    const hasLeave = dayRecs.some(r => r.status === 'LEAVE')
    if (hasUnexcused) {
      absentDays += 1
    } else if (hasLeave) {
      leaveDays += 1
    }
  })

  return {
    absent: absentDays,
    leave: leaveDays,
    absentHours,
    leaveHours,
    totalHours: absentHours + leaveHours
  }
}
import AdminStudentTrackingDetail from './AdminStudentTrackingDetail'
import { api, getCachedSchoolName } from '../../../utils/api'
import {
  isSuperAdmin,
  isTeacher,
  getAssignedClass,
  matchesAssignedClass,
  filterByTeacherScope
} from '../../../utils/accessControl'
import { exportTrackingSummaryExcel } from './exports/exportTrackingExcel'
import { exportTrackingSummaryWord } from './exports/exportTrackingWord'
import { exportTrackingSummaryPdf } from './exports/exportTrackingPdf'

export default function AdminStudentTracking({ onNavigate, session }) {
  const superAdmin = isSuperAdmin(session)
  const teacherMode = isTeacher(session)
  const assignedClass = teacherMode ? getAssignedClass(session) : ''

  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('school_discipline_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return filterByTeacherScope(parsed, session)
        }
      }
    } catch (e) {}
    return []
  })
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('school_discipline_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0 && !teacherMode) return false
      }
    } catch (e) {}
    return true
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState(assignedClass || 'ALL')
  const [filterStatus, setFilterStatus] = useState('HAS_ABSENCE')
  const [filterMonth, setFilterMonth] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  // Selected Student for Detail View
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Threshold Settings Modal State (School rule: 20 days maximum)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [thresholds, setThresholds] = useState({
    '7-9': 20,
    '10-12': 20
  })
  const [tempThresholds, setTempThresholds] = useState({
    '7-9': 20,
    '10-12': 20
  })

  // Export Modal State
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [exportRef])

  useEffect(() => {
    const saved = localStorage.getItem('disciplineThresholds')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Auto-migrate legacy 40/50 thresholds to the official school rule 20
        if (parsed['10-12'] === 40 || parsed['7-9'] === 50) {
          parsed['10-12'] = 20
          parsed['7-9'] = 20
          localStorage.setItem('disciplineThresholds', JSON.stringify(parsed))
        }
        setThresholds(parsed)
        setTempThresholds(parsed)
      } catch (e) {
        console.error('Error parsing thresholds')
      }
    }
  }, [])

  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchTrackingData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setIsRefreshing(true)
    try {
      const res = await api('discipline.getTracking', { force: true })
      if (res && res.success && Array.isArray(res.data)) {
        setData(filterByTeacherScope(res.data, session))
      }
    } catch (err) {
      console.error('Failed to fetch discipline tracking data:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTrackingData(data.length === 0)
  }, [assignedClass])

  const [academicClasses, setAcademicClasses] = useState(() => {
    try {
      const raw = localStorage.getItem('school_classes_cache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed.map(c => c.name)
      }
    } catch (e) {}
    return []
  })

  useEffect(() => {
    api('academic.getClasses').then(res => {
      if (res && res.success && Array.isArray(res.data)) {
        setAcademicClasses(res.data.map(c => c.name))
      }
    }).catch(() => {})
  }, [])

  const scopedData = filterByTeacherScope(data, session)

  const availableClasses = Array.from(new Set([
    ...academicClasses,
    ...scopedData.map(d => d.class).filter(Boolean)
  ])).sort()

  const classOptions = [
    { id: 'ALL', label: 'គ្រប់ថ្នាក់' },
    ...availableClasses.map(c => ({ id: c, label: `ថ្នាក់ ${c}` }))
  ]

  const effectiveFilterClass = teacherMode ? (assignedClass || '__NONE__') : filterClass
  const effectiveClassOptions = teacherMode
    ? [{ id: assignedClass || '__NONE__', label: assignedClass ? `ថ្នាក់ ${assignedClass}` : 'មិនទាន់មានថ្នាក់' }]
    : classOptions

  const statusFilterOptions = [
    { id: 'HAS_ABSENCE', label: 'សិស្សមានអវត្តមាន (លំនាំដើម)' },
    { id: 'CRITICAL', label: 'ត្រូវហៅអាណាព្យាបាល (Critical)' },
    { id: 'WARNING', label: 'ស្ថិតក្នុងការប្រុងប្រយ័ត្ន (Warning)' },
    { id: 'NORMAL', label: 'ធម្មតា (Normal)' },
    { id: 'ALL', label: 'សិស្សទាំងអស់ (All Students)' },
  ]

  // Derived Logic for Status
  const normalizeGrade = (className) => {
    if (!className) return null
    const str = String(className)
      .replace(/០/g, '0').replace(/១/g, '1').replace(/២/g, '2')
      .replace(/៣/g, '3').replace(/៤/g, '4').replace(/៥/g, '5')
      .replace(/៦/g, '6').replace(/៧/g, '7').replace(/៨/g, '8')
      .replace(/៩/g, '9')
    const match = str.match(/\d+/)
    return match ? parseInt(match[0], 10) : null
  }

  const getThreshold = (className) => {
    const grade = normalizeGrade(className)
    if (grade !== null) {
      if (grade >= 7 && grade <= 9 && thresholds['7-9'] !== undefined) return Number(thresholds['7-9']) || 20
      if (grade >= 10 && grade <= 12 && thresholds['10-12'] !== undefined) return Number(thresholds['10-12']) || 20
    }
    return Number(thresholds['10-12']) || Number(thresholds['7-9']) || 20
  }

  const getStudentStatus = (student) => {
    const limit = getThreshold(student.class)
    if (student.absent >= limit) return 'CRITICAL' // Needs parent call
    if (student.absent >= limit - 1) return 'WARNING' // Close to limit
    return 'NORMAL'
  }

  // Scope counts to selected month when a specific month is chosen
  const monthScopedData = filterMonth === 'ALL'
    ? scopedData
    : scopedData.map(d => {
        const sourceRecords = Array.isArray(d.cycleRecords)
          ? d.cycleRecords
          : (Array.isArray(d.records) ? d.records : [])
        const monthRecords = sourceRecords.filter(r => matchesMonthFilter(r.date, filterMonth))
        return {
          ...d,
          ...computeTrackingCounts(monthRecords)
        }
      })

  // Filtering
  let filteredData = monthScopedData
  if (!teacherMode && effectiveFilterClass !== 'ALL') {
    filteredData = filteredData.filter(d => matchesAssignedClass(d.class, effectiveFilterClass))
  }
  if (filterStatus === 'HAS_ABSENCE') {
    filteredData = filteredData.filter(d => (Number(d.absent) || 0) > 0 || (Number(d.leave) || 0) > 0)
  } else if (filterStatus !== 'ALL') {
    filteredData = filteredData.filter(d => getStudentStatus(d) === filterStatus)
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filteredData = filteredData.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.id.includes(q) ||
      (d.studentId && d.studentId.toLowerCase().includes(q)) ||
      (d.parentPhone && d.parentPhone.includes(q))
    )
  }

  // Pagination
  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Stats
  const totalWithAbsence = monthScopedData.filter(d => (Number(d.absent) || 0) > 0 || (Number(d.leave) || 0) > 0).length
  const totalCritical = monthScopedData.filter(d => getStudentStatus(d) === 'CRITICAL').length
  const totalWarning = monthScopedData.filter(d => getStudentStatus(d) === 'WARNING').length

  const handleOpenSettings = () => {
    setTempThresholds({ ...thresholds })
    setSettingsOpen(true)
  }

  const handleSaveSettings = () => {
    setThresholds(tempThresholds)
    localStorage.setItem('disciplineThresholds', JSON.stringify(tempThresholds))
    setSettingsOpen(false)
  }

  const handleExport = (type) => {
    setExportOpen(false)
    const schoolName = getCachedSchoolName()
    const payload = {
      filteredData,
      filterClass: effectiveFilterClass,
      filterMonth,
      schoolName,
      totalWarning,
      totalCritical,
      getStudentStatus
    }
    if (type === 'Excel') {
      exportTrackingSummaryExcel(payload)
    } else if (type === 'Word') {
      exportTrackingSummaryWord(payload)
    } else if (type === 'PDF') {
      exportTrackingSummaryPdf(payload)
    }
  }

  // If a student is selected, show the detail view (preserve full student record counts & pass selected month)
  if (selectedStudent) {
    const fullStudent = scopedData.find(d => d.id === selectedStudent.id || d.studentId === selectedStudent.studentId)
    if (fullStudent && (!teacherMode || matchesAssignedClass(fullStudent.class, assignedClass))) {
      return (
        <AdminStudentTrackingDetail
          student={fullStudent}
          onBack={() => {
            setSelectedStudent(null)
            fetchTrackingData()
          }}
          threshold={getThreshold(fullStudent.class)}
          status={getStudentStatus(fullStudent)}
          onNavigate={onNavigate}
          onDataChanged={fetchTrackingData}
          initialMonth={filterMonth}
        />
      )
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">

   

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 w-full">
        {/* Card 1: Total Under Tracking */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <User size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">សិស្សទាំងអស់កំពុងតាមដាន</div>
          </div>
          <div className="text-3xl font-black text-slate-800 relative z-10">{filterMonth === 'ALL' ? monthScopedData.length : totalWithAbsence}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">នាក់</div>
        </div>

        {/* Card 2: Warning */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-amber-600">ស្ថិតក្នុងការប្រុងប្រយ័ត្ន</div>
          </div>
          <div className="text-3xl font-black text-amber-500 relative z-10">{totalWarning}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">នាក់ (ជិតដល់កម្រិតកំណត់)</div>
        </div>

        {/* Card 3: Critical */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center animate-pulse">
              <PhoneCall size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-rose-600">ត្រូវហៅអាណាព្យាបាល</div>
          </div>
          <div className="text-3xl font-black text-rose-500 relative z-10">{totalCritical}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">នាក់ (លើសកម្រិតកំណត់)</div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/60 flex flex-col relative shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/30">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">

            {/* Left: Search Bar */}
            <div className="relative w-full lg:w-[320px] group">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="ស្វែងរកអត្តលេខ ឈ្មោះ លេខទូរស័ព្ទ..."
                className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-9 pr-4 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              />
            </div>

            {/* Right: Settings & Export Buttons */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto">

              {/* Live Sync / Refresh from Firebase */}
              <button
                type="button"
                onClick={() => fetchTrackingData(false)}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-3.5 rounded-xl font-bold text-[13px] transition-all shadow-xs hover:shadow hover:-translate-y-0.5 disabled:opacity-60"
                title="ទាញយកទិន្នន័យវត្តមានផ្ទាល់ពី Cloud Firebase"
              >
                <RefreshCw size={15} strokeWidth={2.2} className={`text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'កំពុងទាញ...' : 'ទាញទិន្នន័យថ្មី'}</span>
              </button>

              {/* Threshold Settings Button (Super Admin Only) */}
              {superAdmin && (
                <button
                  onClick={handleOpenSettings}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 py-2.5 px-4 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
                  title="កំណត់កម្រិតវិន័យអវត្តមាន"
                >
                  <Settings size={15} strokeWidth={2.5} className="text-slate-400 group-hover:text-indigo-600" />
                  <span>កំណត់វិន័យ</span>
                </button>
              )}

              {/* Export Dropdown */}
              <div className="relative flex-1 lg:flex-none" ref={exportRef}>
                <button
                  onClick={() => setExportOpen(!exportOpen)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-5 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full lg:w-auto whitespace-nowrap"
                >
                  <Download size={15} strokeWidth={2.5} />
                  <span>នាំចេញ / បោះពុម្ព</span>
                  <ChevronDown size={15} strokeWidth={2.5} className={`transition-transform duration-300 ml-1 ${exportOpen ? 'rotate-180' : ''}`} />
                </button>

                {exportOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-50 overflow-hidden py-2">
                    <button
                      onClick={() => handleExport('PDF')}
                      className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group cursor-pointer"
                    >
                      <FileText size={16} className="text-rose-500 group-hover:scale-110 transition-transform" />
                      បោះពុម្ព / Save as PDF
                    </button>
                    <button
                      onClick={() => handleExport('Excel')}
                      className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group cursor-pointer"
                    >
                      <FileCode size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                      ទាញយកជា Excel (.csv)
                    </button>
                    <button
                      onClick={() => handleExport('Word')}
                      className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group cursor-pointer"
                    >
                      <FileImage size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                      ទាញយកជា Word (.doc)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-[780px]">
            <SearchableDropdown
              value={effectiveFilterClass}
              onChange={(v) => { if (!teacherMode) { setFilterClass(v); setCurrentPage(1) } }}
              options={effectiveClassOptions}
              placeholder="ជ្រើសរើសថ្នាក់"
              icon={Users}
              disabled={teacherMode}
            />
            <SearchableDropdown
              value={filterStatus}
              onChange={(v) => { setFilterStatus(v); setCurrentPage(1) }}
              options={statusFilterOptions}
              placeholder="ជ្រើសរើសស្ថានភាព"
            />
            <SearchableDropdown
              value={filterMonth}
              onChange={(v) => { setFilterMonth(v); setCurrentPage(1) }}
              options={MONTH_FILTER_OPTIONS}
              placeholder="ជ្រើសរើសខែ"
              icon={Calendar}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full overflow-x-auto custom-scrollbar relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] z-30">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-sm" />
                <div className="text-[13px] font-bold text-indigo-600">កំពុងទាញទិន្នន័យ...</div>
              </div>
            </div>
          )}

          <table className="w-full text-left border-collapse min-w-[940px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student ID</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[190px]">ឈ្មោះសិស្ស</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ថ្នាក់</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[160px]">លេខអាណាព្យាបាល</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">មានច្បាប់ (ថ្ងៃ)</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center min-w-[170px]">គ្មានច្បាប់ & កម្រិតវិន័យ</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center min-w-[125px]">សរុប (ម៉ោង)</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">ស្ថានភាព</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center min-w-[190px]">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((student) => {
                const status = getStudentStatus(student)
                const limit = getThreshold(student.class)
                const percent = Math.min(100, Math.round((student.absent / limit) * 100))
                const totalHrs = student.totalHours !== undefined ? student.totalHours : ((student.absentHours || student.absent || 0) + (student.leaveHours || student.leave || 0))

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">

                    {/* Student ID */}
                    <td className="py-4 px-5">
                      <span className="text-[12px] font-bold text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-lg">
                        #{student.id}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-[13px] shadow-sm flex-shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-[13px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {student.name}
                        </span>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[12px]">
                        {student.class}
                      </span>
                    </td>

                    {/* Parent Phone */}
                    <td className="py-4 px-5">
                      <a
                        href={`tel:${student.parentPhone}`}
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                        title="ចុចដើម្បីហៅទូរស័ព្ទ"
                      >
                        <Phone size={12} className="text-slate-400" />
                        <span>{student.parentPhone}</span>
                      </a>
                    </td>

                    {/* Leave */}
                    <td className="py-4 px-5 text-center">
                      <span className="font-bold text-[12px] text-amber-600">
                        {student.leave} <span className="text-[10px] font-normal text-slate-400">ថ្ងៃ</span>
                      </span>
                    </td>

                    {/* Absent & Progress */}
                    <td className="py-4 px-5">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <span className={`text-[15px] font-black ${status === 'CRITICAL' ? 'text-rose-600' : status === 'WARNING' ? 'text-amber-600' : 'text-slate-800'}`}>
                            {student.absent}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold">/ {limit} ថ្ងៃ</span>
                        </div>
                        {/* Mini Progress Bar */}
                        <div className="w-28 h-1 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${status === 'CRITICAL' ? 'bg-rose-400' : status === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                      </div>
                    </td>

                    {/* Total Hours */}
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50/70 text-indigo-700 font-bold text-[12px] border border-indigo-100/70 font-mono">
                        <Clock size={12} className="text-indigo-500" />
                        <span>{totalHrs}</span>
                        <span className="text-[10px] font-sans font-medium text-indigo-400">ម៉ោង</span>
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5 text-center">
                      {status === 'NORMAL' && (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100 text-[11px] font-bold">
                            <CheckCircle2 size={13} strokeWidth={2.5} />
                            ធម្មតា
                          </span>
                          {student.cycle > 1 && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200" title={`បានដោះស្រាយកិច្ចសន្យា ${(student.cycle || 1) - 1} លើក`}>
                              ជុំទី {student.cycle}
                            </span>
                          )}
                        </div>
                      )}
                      {status === 'WARNING' && (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-[11px] font-bold">
                          <AlertTriangle size={13} strokeWidth={2.5} />
                          ប្រយ័ត្ន
                        </span>
                      )}
                      {status === 'CRITICAL' && (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full text-[11px] font-bold animate-pulse">
                            <PhoneCall size={13} strokeWidth={2.5} />
                            កោះហៅ {student.cycle > 1 ? `(លើកទី ${student.cycle})` : ''}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {status === 'CRITICAL' && onNavigate && (
                          <button
                            onClick={() => {
                              try {
                                localStorage.setItem('printStudent', JSON.stringify(student))
                              } catch (e) {}
                              onNavigate('invitation-letters')
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 hover:border-rose-600 font-bold text-[12px] rounded-lg group/btn"
                            title="រៀបចំលិខិតកោះហៅ"
                          >
                            <Mail size={13} className="group-hover/btn:scale-110 transition-transform" />
                            <span>រៀបចំ</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 hover:border-indigo-600 font-bold text-[12px] rounded-lg group/btn"
                        >
                          <ShieldAlert size={13} className="group-hover/btn:scale-110 transition-transform" />
                          <span>មើលលំអិត</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredData.length === 0 && !loading && (
                <tr>
                  <td colSpan="9" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <Search size={28} className="text-slate-300" />
                      </div>
                      <span className="font-bold text-slate-700 text-[15px]">មិនមានទិន្នន័យត្រូវគ្នានឹងការស្វែងរកទេ</span>
                      <span className="text-[13px] font-medium text-slate-500 mt-1">សូមសាកល្បង Filter ផ្សេងទៀត</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Threshold Settings Modal */}
      {superAdmin && settingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Settings size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">កំណត់កម្រិតវិន័យអវត្តមាន</h3>
                  <p className="text-[12px] font-medium text-slate-400">កំណត់ចំនួនថ្ងៃអតិបរមាអនុញ្ញាត (១ ថ្ងៃ = ១ អវត្តមាន)</p>
                </div>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  កម្រិតអនុវិទ្យាល័យ (ថ្នាក់ទី ៧ ដល់ ទី ៩)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={tempThresholds['7-9']}
                    onChange={e => setTempThresholds({ ...tempThresholds, '7-9': Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-slate-800 text-[14px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">ថ្ងៃ</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">បើអវត្តមានលើសចំនួននេះ (គិតជាថ្ងៃ) ប្រព័ន្ធនឹងដាក់ស្ថានភាព «ត្រូវហៅអាណាព្យាបាល»</span>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  កម្រិតវិទ្យាល័យ (ថ្នាក់ទី ១០ ដល់ ទី ១២)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={tempThresholds['10-12']}
                    onChange={e => setTempThresholds({ ...tempThresholds, '10-12': Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-slate-800 text-[14px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">ថ្ងៃ</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">កម្រិតវិន័យតឹងរឹងសម្រាប់សិស្សវិទ្យាល័យ (គិតជាថ្ងៃ)</span>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-[13px] transition-all"
              >
                បោះបង់
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[13px] shadow-sm hover:shadow transition-all flex items-center gap-2"
              >
                <Save size={15} />
                <span>រក្សាទុក</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
