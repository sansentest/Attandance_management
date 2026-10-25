import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { getSchoolStatus } from '../utils/academicCalendar'
import { Crown, GraduationCap, User, Clock, BookOpen, CheckSquare, CalendarOff, CheckCircle2, XCircle, LogOut, BarChart3, ChevronRight } from 'lucide-react'

export default function Dashboard({ session, onLogout, onNavigate }) {
  const [currentPeriod, setCurrentPeriod] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('day') // day, week, month, year
  const [loadingStats, setLoadingStats] = useState(false)
  const [stats, setStats] = useState({
    present: '—',
    absent: '—',
    leave: 0,
    rate: 'កំពុងទាញយក...',
    pct: 0,
    absentStudents: [],
    periodLabel: 'ថ្ងៃនេះ'
  })
  const [loadingPeriod, setLoadingPeriod] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'អរុណសួស្ដី' : hour < 17 ? 'ទិវាសួស្ដី' : 'សាយ័ន្តសួស្ដី'

  useEffect(() => {
    loadCurrentPeriod()
  }, [])

  useEffect(() => {
    loadStats(selectedPeriod)
  }, [selectedPeriod])

  const loadCurrentPeriod = async () => {
    setLoadingPeriod(true)
    const schoolStatus = getSchoolStatus()

    if (!schoolStatus.isOpen) {
      setCurrentPeriod({ isHoliday: true, schoolStatus })
      setLoadingPeriod(false)
      return
    }

    const className = session.className === 'ALL' ? null : session.className
    
    if (!className) {
      setCurrentPeriod({ noClassMsg: 'សូមជ្រើសរើសថ្នាក់ដើម្បីមើលម៉ោងបច្ចុប្បន្ន។' })
      setLoadingPeriod(false)
      return
    }

    const result = await api('schedule.current', { className })
    
    if (!result.success) {
      setCurrentPeriod({ noClassMsg: 'មិនអាចទាញយកកាលវិភាគបានទេ។' })
    } else if (result.data.currentPeriod) {
      setCurrentPeriod({ period: result.data.currentPeriod })
    } else {
      setCurrentPeriod({ noClassMsg: `ពេលនេះគ្មានម៉ោងសិក្សាទេ។` })
    }
    setLoadingPeriod(false)
  }

  const loadStats = async (period = selectedPeriod) => {
    let cls = session.className
    if (!cls || cls === 'ALL') cls = null
    
    if (!cls) {
      setStats({
        present: '—',
        absent: '—',
        leave: 0,
        rate: 'សូមជ្រើសរើសថ្នាក់',
        pct: 0,
        absentStudents: [],
        periodLabel: ''
      })
      return
    }

    setLoadingStats(true)
    let endpoint = 'reports.daily'
    let payload = { className: cls }

    if (period === 'day') {
      endpoint = 'reports.daily'
      payload.date = new Date().toISOString().split('T')[0]
    } else if (period === 'week') {
      endpoint = 'reports.weekly'
    } else if (period === 'month') {
      endpoint = 'reports.monthly'
    } else if (period === 'year') {
      endpoint = 'reports.yearly'
    }

    const result = await api(endpoint, payload)
    
    if (result.success && result.data) {
      const d = result.data
      if (period === 'day') {
        const pct = d.totalStudents > 0 ? Math.round(((d.totalStudents - d.absent) / d.totalStudents) * 100) : 0
        setStats({
          present: Math.max(0, d.totalStudents - d.absent),
          absent: d.absent,
          leave: d.leave || 0,
          rate: `អត្រាវត្តមាន៖ ${d.attendanceRate || `${pct}%`}`,
          pct,
          periodLabel: 'ថ្ងៃនេះ',
          absentStudents: (d.absentStudents || []).map(s => typeof s === 'string' ? { name: s, absences: 1, leaves: 0 } : s)
        })
      } else {
        let pct = 0
        if (d.attendanceRate) {
          pct = parseInt(String(d.attendanceRate).replace('%', ''))
        }
        if (isNaN(pct)) pct = 0

        setStats({
          present: d.totalPresent ?? (d.totalStudents ? Math.max(0, d.totalStudents - (d.totalAbsences || 0)) : '—'),
          absent: d.totalAbsences || 0,
          leave: d.totalLeaves || 0,
          rate: `អត្រាវត្តមាន៖ ${d.attendanceRate || `${pct}%`}`,
          pct,
          periodLabel: d.periodLabel || (period === 'week' ? 'សប្តាហ៍នេះ' : period === 'month' ? 'ខែនេះ' : 'ឆ្នាំនេះ'),
          absentStudents: d.topAbsentStudents || []
        })
      }
    }
    setLoadingStats(false)
  }

  return (
    <div className="page active font-[family-name:var(--font-primary)] bg-slate-50 min-h-screen pb-10 lg:pb-20">
      
      {/* HEADER (Shared for Mobile and Desktop) */}
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 pt-4 px-4 pb-5 sm:pt-5 sm:px-6 sm:pb-7 lg:pb-8 relative overflow-hidden text-white shadow-lg rounded-b-[1.5rem] sm:rounded-b-[1.75rem] lg:rounded-b-[2rem]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-[200px] sm:w-[250px] lg:w-[300px] h-[200px] sm:h-[250px] lg:h-[300px] rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-[180px] sm:w-[200px] lg:w-[250px] h-[180px] sm:h-[200px] lg:h-[250px] rounded-full bg-indigo-400 opacity-20 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex justify-between items-start lg:items-center max-w-7xl mx-auto">
          {/* Mobile Header Text */}
          <div className="lg:hidden">
            <div className="text-[12px] sm:text-[14px] text-indigo-100 font-medium tracking-wide mb-0.5 opacity-90">{greeting}</div>
            <div className="text-[20px] sm:text-[26px] font-extrabold leading-tight mb-2 sm:mb-3 drop-shadow-md">{session.fullName || session.username}</div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md text-white border border-white/30 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold shadow-xs">
                <Crown size={13} className="text-yellow-300" fill="currentColor" /> ប្រធានថ្នាក់
              </span>
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md text-white border border-white/30 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold shadow-xs">
                <GraduationCap size={13} className="text-sky-200" fill="currentColor" /> ថ្នាក់ {session.className}
              </span>
            </div>
          </div>
          <div className="lg:hidden w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xs">
            <User size={20} className="text-white" />
          </div>

          {/* Desktop Header Text */}
          <div className="hidden lg:flex gap-5 items-center w-full">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
              <User size={32} className="text-white" />
            </div>
            <div>
              <div className="text-[15px] text-indigo-100 font-medium tracking-wide mb-1 opacity-90">{greeting}</div>
              <div className="text-[34px] font-black leading-tight mb-3 drop-shadow-md">{session.fullName || session.username}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-1.5 rounded-full text-[13px] font-bold shadow-sm">
                  <Crown size={14} className="text-yellow-300" fill="currentColor" /> ប្រធានថ្នាក់
                </span>
                <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-1.5 rounded-full text-[13px] font-bold shadow-sm">
                  <GraduationCap size={14} className="text-sky-200" fill="currentColor" /> ថ្នាក់ {session.className}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="px-3 sm:px-5 -mt-2 sm:-mt-2 relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6 lg:gap-8">
          
          {/* =======================
              ROW 1: Period Card & Quick Stats
              ======================= */}
          {/* 1. Current Period Card (Col 1 on Desktop) */}
          <div className="lg:col-span-1 h-full">
            {loadingPeriod ? (
              <div className="animate-pulse h-full min-h-[110px] sm:min-h-[130px] rounded-xl sm:rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 shadow-sm"></div>
            ) : currentPeriod?.isHoliday ? (
              <div className="bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.04)]  border-sm rounded-xl sm:rounded-2xl p-3.5 sm:p-6  h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {currentPeriod.schoolStatus.icon && (
                        <span className="text-xl sm:text-2xl leading-none">{currentPeriod.schoolStatus.icon}</span>
                      )}
                      <span className="text-[11px] sm:text-[12px] font-bold tracking-wider text-slate-700 px-2 sm:px-2.5 py-0.5 rounded-full">
                        {currentPeriod.schoolStatus.badgeText}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] sm:text-xs font-bold from-red-100 to-rose-50 text-danger px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg">
                      ឈប់សម្រាក
                    </span>
                  </div>
                  <div className="text-[13px] sm:text-[18px] lg:text-[20px] font-extrabold mb-1 text-slate-800 tracking-tight mt-1 sm:mt-2">
                    {currentPeriod.schoolStatus.title}
                  </div>
                  <p className="text-[12px] sm:text-[13px] lg:text-[14px] text-slate-500 font-medium leading-relaxed mb-2 sm:mb-3">
                    {currentPeriod.schoolStatus.description}
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] font-bold text-indigo-600 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl">
                    <span>ចូលរៀនវិញ៖</span>
                    <span>{currentPeriod.schoolStatus.reopenDate}</span>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-2.5 mt-3 sm:mt-5">
                  <button 
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-lg sm:rounded-xl shadow-[0_4px_14px_0_rgb(99,102,241,0.39)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-[13px] sm:text-[14px]"
                    onClick={() => onNavigate('attendance')}
                  >
                    <CheckSquare size={16} className="sm:w-[18px] sm:h-[18px]" /> ស្រង់វត្តមាន
                  </button>
                  <button 
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all flex items-center justify-center text-[13px] sm:text-[14px]"
                    onClick={() => onNavigate('report')}
                    title="ពិនិត្យមើលរបាយការណ៍"
                  >
                    <BarChart3 size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                </div>
              </div>
            ) : currentPeriod?.period ? (
              <div className="bg-white/90 backdrop-blur-xl border border-slate-100/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-accent">
                        <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <span className="text-[12px] sm:text-[13px] font-bold tracking-widest text-accent uppercase">
                        {currentPeriod.period.periodLabel || `ម៉ោងទី ${currentPeriod.period.period}`}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-success bg-success/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-[pulse-dot_2s_infinite]"></span> កំពុងសិក្សា
                    </span>
                  </div>
                  <div className="text-[20px] sm:text-[24px] lg:text-[28px] font-extrabold mb-1 text-slate-800 tracking-tight mt-1 sm:mt-2">{currentPeriod.period.subject}</div>
                  <div className="text-[13px] sm:text-[14px] lg:text-[15px] text-slate-500 font-medium flex items-center gap-2 mt-1 sm:mt-2 mb-3 sm:mb-4 lg:mb-6">
                    <BookOpen size={15} className="text-slate-400 shrink-0" />
                    <span className="truncate">{currentPeriod.period.teacher}</span> <span className="text-slate-300">•</span> <span className="shrink-0">{currentPeriod.period.startTime} – {currentPeriod.period.endTime}</span>
                  </div>
                </div>
                <button 
                  className="w-full mt-auto bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold py-2.5 sm:py-3.5 lg:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl shadow-[0_4px_14px_0_rgb(99,102,241,0.39)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-[13px] sm:text-[15px]"
                  onClick={() => onNavigate('attendance')}
                >
                  <CheckSquare size={17} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> ស្រង់វត្តមានម៉ោងនេះ
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[140px] sm:min-h-[200px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                  <CalendarOff size={24} className="sm:w-8 sm:h-8 text-slate-300" />
                </div>
                <div className="text-[13px] sm:text-[15px] lg:text-[18px] font-medium">{currentPeriod?.noClassMsg}</div>
              </div>
            )}
          </div>

          {/* 2. Quick Stats Grid (Col 2 on Desktop) */}
          <div className="lg:col-span-1 h-full bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
              <h3 className="text-[14px] sm:text-[15px] lg:text-[18px] font-bold text-slate-800">
                ទិដ្ឋភាពទូទៅថ្ងៃនេះ
              </h3>
              <span className="text-[11px] sm:text-[12px] lg:text-[14px] font-bold text-slate-500  px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg ">
                {stats.rate}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:gap-5 flex-1 mt-0.5 sm:mt-1">
              {/* Left Box: Present */}
              <div className="bg-slate-50/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 lg:p-5 border border-slate-100 relative overflow-hidden flex flex-col justify-center group">
                <div className="absolute -right-4 -top-4 w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full transition-transform group-hover:scale-150 duration-500 bg-success/5"></div>
                <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 mb-1.5 sm:mb-2 lg:mb-3 relative z-10">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 bg-success/10 text-success">
                    <CheckCircle2 size={15} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div className="text-[11px] sm:text-[13px] lg:text-[14px] font-bold text-slate-500 truncate">
                    មានវត្តមាន
                  </div>
                </div>
                <div className="text-[22px] sm:text-[28px] lg:text-[32px] font-extrabold mt-0.5 sm:mt-1 relative z-10 leading-none text-slate-800">
                  {loadingStats ? '...' : stats.present}
                </div>
              </div>
              
              {/* Right Box: Absences */}
              <div className="bg-slate-50/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 lg:p-5 border border-slate-100 relative overflow-hidden flex flex-col justify-center group">
                <div className="absolute -right-4 -top-4 w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-danger/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
                <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 mb-1.5 sm:mb-2 lg:mb-3 relative z-10">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
                    <XCircle size={15} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div className="text-[11px] sm:text-[13px] lg:text-[14px] font-bold text-slate-500 truncate">
                    អវត្តមាន
                  </div>
                </div>
                <div className="text-[22px] sm:text-[28px] lg:text-[32px] font-extrabold text-danger mt-0.5 sm:mt-1 relative z-10 leading-none">
                  {loadingStats ? '...' : stats.absent}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3 sm:mt-5 lg:mt-auto pt-1 sm:pt-2">
              <div className="flex justify-between items-end mb-1.5 sm:mb-2">
                <span className="text-[11px] sm:text-[13px] font-bold text-slate-500 truncate mr-2">កម្រិតវត្តមានសរុប (ថ្ងៃនេះ)</span>
                <span className="text-[14px] sm:text-[16px] lg:text-[18px] font-black text-success shrink-0">{stats.pct}%</span>
              </div>
              <div className="bg-slate-100 rounded-full h-2 sm:h-2.5 lg:h-3 overflow-hidden shadow-inner">
                <div className="h-full rounded-full bg-gradient-to-r from-success to-emerald-400 transition-all duration-1000 ease-out relative" style={{ width: `${stats.pct}%` }}>
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] opacity-50"></div>
                </div>
              </div>
            </div>
          </div>

          {/* =======================
              ROW 2: Mobile Buttons (Clean, Modern & Compact on Mobile)
              ======================= */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <h3 className="text-[13px] font-bold text-slate-800">សកម្មភាពរហ័ស</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* 1. ស្រង់វត្តមាន */}
              <button 
                onClick={() => onNavigate('attendance')}
                className="bg-white rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] active:scale-95 transition-all cursor-pointer group hover:bg-slate-50"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <CheckSquare size={20} />
                </div>
                <span className="text-[12px] font-bold text-slate-700">ស្រង់វត្តមាន</span>
              </button>

              {/* 2. របាយការណ៍ */}
              <button 
                onClick={() => onNavigate('report')}
                className="bg-white rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] active:scale-95 transition-all cursor-pointer group hover:bg-slate-50"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 text-sky-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <BarChart3 size={20} />
                </div>
                <span className="text-[12px] font-bold text-slate-700">របាយការណ៍</span>
              </button>

              {/* 3. ចាកចេញ */}
              <button 
                onClick={onLogout}
                className="bg-white rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] active:scale-95 transition-all cursor-pointer group hover:bg-slate-50"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 text-rose-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <LogOut size={20} />
                </div>
                <span className="text-[12px] font-bold text-slate-700">ចាកចេញ</span>
              </button>
            </div>
          </div>

          {/* =======================
              ROW 2: Desktop Buttons (Hidden on Mobile, spans 2 cols, contains 3 btns)
              ======================= */}
          <div className="hidden lg:grid grid-cols-3 gap-6 lg:col-span-2">
            
            <button className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:bg-slate-50 transition-all cursor-pointer border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-md group" onClick={() => onNavigate('attendance')}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 text-accent flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                <CheckSquare size={28} />
              </div>
              <span className="text-[15px] font-bold text-slate-700">ស្រង់វត្តមាន</span>
            </button>

            <button className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:bg-slate-50 transition-all cursor-pointer border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-md group" onClick={() => onNavigate('report')}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                <BarChart3 size={28} />
              </div>
              <span className="text-[15px] font-bold text-slate-700">របាយការណ៍</span>
            </button>
            
            <button className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:bg-slate-50 transition-all cursor-pointer border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-md group" onClick={onLogout}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-rose-50 text-danger flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                <LogOut size={28} />
              </div>
              <span className="text-[15px] font-bold text-slate-700">ចាកចេញ</span>
            </button>

          </div>

          {/* =======================
              ROW 3: Absent Students (Full width on both Mobile and Desktop)
              ======================= */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-full">
              <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                <h3 className="text-[13px] sm:text-[15px] lg:text-[16px] font-bold text-slate-800 flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-danger animate-pulse shrink-0"></span>
                  <span className="truncate">
                    សិស្សដែលអវត្តមានថ្ងៃនេះ
                  </span>
                </h3>
                {stats.absentStudents && stats.absentStudents.length > 0 && (
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-slate-200/50 shrink-0">
                    សរុប {stats.absentStudents.length} នាក់
                  </span>
                )}
              </div>
              
              {stats.absentStudents && stats.absentStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-5 w-full">
                  {stats.absentStudents.map((item, i) => {
                    const name = typeof item === 'string' ? item : (item.name || 'សិស្ស');
                    return (
                      <div key={i} className="flex items-center justify-between p-2 sm:p-3 lg:p-4 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all rounded-lg sm:rounded-xl border border-slate-100/50">
                        <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-red-50 text-danger flex items-center justify-center shrink-0 border border-red-100 font-bold text-[12px] sm:text-sm">
                            <User size={14} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                          </div>
                          <span className="text-[13px] sm:text-[15px] lg:text-[16px] font-bold text-slate-700 truncate">{name}</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-danger bg-red-50 border border-red-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md shrink-0">
                          អវត្តមាន
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 sm:py-6 lg:py-12 text-center flex flex-col items-center justify-center w-full bg-slate-50/50 rounded-lg sm:rounded-xl border border-slate-100/50">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                    <CheckCircle2 size={20} className="sm:w-7 sm:h-7 lg:w-10 lg:h-10" />
                  </div>
                  <span className="text-[13px] sm:text-[15px] lg:text-[18px] font-bold text-slate-500 px-2">
                    គ្មានសិស្សអវត្តមានទេថ្ងៃនេះ!
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
