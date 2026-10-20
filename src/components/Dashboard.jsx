import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { Crown, GraduationCap, User, Clock, BookOpen, CheckSquare, CalendarOff, CheckCircle2, XCircle, LogOut, BarChart3, ChevronRight } from 'lucide-react'

export default function Dashboard({ session, onLogout, onNavigate }) {
  const [currentPeriod, setCurrentPeriod] = useState(null)
  const [stats, setStats] = useState({ present: '—', absent: '—', rate: 'កំពុងទាញយក...', pct: 0, absentStudents: [] })
  const [loadingPeriod, setLoadingPeriod] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'អរុណសួស្ដី' : hour < 17 ? 'ទិវាសួស្ដី' : 'សាយ័ន្តសួស្ដី'

  useEffect(() => {
    loadCurrentPeriod()
    loadTodayStats()
  }, [])

  const loadCurrentPeriod = async () => {
    setLoadingPeriod(true)
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

  const loadTodayStats = async () => {
    let cls = session.className
    if (!cls || cls === 'ALL') cls = null
    
    if (!cls) {
      setStats({ present: '—', absent: '—', rate: 'សូមជ្រើសរើសថ្នាក់', pct: 0, absentStudents: [] })
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const result = await api('reports.daily', { className: cls, date: today })
    
    if (result.success && result.data) {
      const d = result.data
      const pct = d.totalStudents > 0 ? Math.round(((d.totalStudents - d.absent) / d.totalStudents) * 100) : 0
      setStats({
        present: d.totalStudents - d.absent,
        absent: d.absent,
        rate: `អត្រាវត្តមាន៖ ${d.attendanceRate}`,
        pct,
        absentStudents: d.absentStudents || []
      })
    }
  }

  return (
    <div className="page active font-[family-name:var(--font-primary)] bg-slate-50 min-h-screen pb-10 lg:pb-20">
      
      {/* HEADER (Shared for Mobile and Desktop) */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 pt-8 px-6 pb-12 lg:pb-14 relative overflow-hidden text-white shadow-lg rounded-b-[2rem] lg:rounded-b-[3rem]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-[250px] lg:w-[300px] h-[250px] lg:h-[300px] rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-[200px] lg:w-[250px] h-[200px] lg:h-[250px] rounded-full bg-indigo-400 opacity-20 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex justify-between items-start lg:items-center max-w-7xl mx-auto">
          {/* Mobile Header Text */}
          <div className="lg:hidden">
            <div className="text-[14px] text-indigo-100 font-medium tracking-wide mb-1 opacity-90">{greeting}</div>
            <div className="text-[26px] font-extrabold leading-tight mb-3 drop-shadow-md">{session.fullName || session.username}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                <Crown size={14} className="text-yellow-300" fill="currentColor" /> ប្រធានថ្នាក់
              </span>
              <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                <GraduationCap size={14} className="text-sky-200" fill="currentColor" /> ថ្នាក់ {session.className}
              </span>
            </div>
          </div>
          <div className="lg:hidden w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-sm">
            <User size={24} className="text-white" />
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
      <div className="px-5 -mt-8 relative z-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* =======================
              ROW 1: Period Card & Quick Stats
              ======================= */}
              
          {/* 1. Current Period Card (Col 1 on Desktop) */}
          <div className="lg:col-span-1 h-full">
            {loadingPeriod ? (
              <div className="animate-pulse h-full min-h-[130px] rounded-2xl bg-white border border-slate-100 shadow-md"></div>
            ) : currentPeriod?.period ? (
              <div className="bg-white/90 backdrop-blur-xl border border-slate-100/50 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-accent">
                        <Clock size={18} />
                      </div>
                      <span className="text-[13px] font-bold tracking-widest text-accent uppercase">
                        ម៉ោងទី {currentPeriod.period.period}
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-[pulse-dot_2s_infinite]"></span> កំពុងសិក្សា
                    </span>
                  </div>
                  <div className="text-[24px] lg:text-[28px] font-extrabold mb-1 text-slate-800 tracking-tight mt-2">{currentPeriod.period.subject}</div>
                  <div className="text-[14px] lg:text-[15px] text-slate-500 font-medium flex items-center gap-2 mt-2 mb-4 lg:mb-6">
                    <BookOpen size={16} className="text-slate-400" />
                    {currentPeriod.period.teacher} <span className="text-slate-300">•</span> {currentPeriod.period.startTime} – {currentPeriod.period.endTime}
                  </div>
                </div>
                <button 
                  className="w-full mt-auto bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold py-3.5 lg:py-4 px-6 rounded-xl shadow-[0_4px_14px_0_rgb(99,102,241,0.39)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  onClick={() => onNavigate('attendance')}
                >
                  <CheckSquare size={20} className="lg:w-6 lg:h-6" /> ស្រង់វត្តមានម៉ោងនេះ
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[200px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <CalendarOff size={32} className="text-slate-300" />
                </div>
                <div className="text-[15px] lg:text-[18px] font-medium">{currentPeriod?.noClassMsg}</div>
              </div>
            )}
          </div>

          {/* 2. Quick Stats Grid (Col 2 on Desktop) */}
          <div className="lg:col-span-1 h-full bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-3 lg:mb-6">
              <h3 className="text-[15px] lg:text-[18px] font-bold text-slate-800">ទិដ្ឋភាពទូទៅថ្ងៃនេះ</h3>
              <span className="text-[12px] lg:text-[14px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{stats.rate}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:gap-5 flex-1 mt-2">
              <div className="bg-slate-50/50 rounded-2xl p-4 lg:p-5 border border-slate-100 relative overflow-hidden flex flex-col justify-center group">
                <div className="absolute -right-4 -top-4 w-16 h-16 lg:w-20 lg:h-20 bg-success/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
                <div className="flex items-center gap-3 mb-2 lg:mb-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="text-[13px] lg:text-[14px] font-bold text-slate-500">មានវត្តមាន</div>
                </div>
                <div className="text-[28px] lg:text-[32px] font-extrabold text-slate-800 mt-1 relative z-10 leading-none">{stats.present}</div>
              </div>
              
              <div className="bg-slate-50/50 rounded-2xl p-4 lg:p-5 border border-slate-100 relative overflow-hidden flex flex-col justify-center group">
                <div className="absolute -right-4 -top-4 w-16 h-16 lg:w-20 lg:h-20 bg-danger/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
                <div className="flex items-center gap-3 mb-2 lg:mb-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center">
                    <XCircle size={18} />
                  </div>
                  <div className="text-[13px] lg:text-[14px] font-bold text-slate-500">អវត្តមាន</div>
                </div>
                <div className="text-[28px] lg:text-[32px] font-extrabold text-danger mt-1 relative z-10 leading-none">{stats.absent}</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-5 lg:mt-auto pt-2">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[13px] font-bold text-slate-500">កម្រិតវត្តមានសរុប</span>
                <span className="text-[16px] lg:text-[18px] font-black text-success">{stats.pct}%</span>
              </div>
              <div className="bg-slate-100 rounded-full h-2.5 lg:h-3 overflow-hidden shadow-inner">
                <div className="h-full rounded-full bg-gradient-to-r from-success to-emerald-400 transition-all duration-1000 ease-out relative" style={{ width: `${stats.pct}%` }}>
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] opacity-50"></div>
                </div>
              </div>
            </div>
          </div>

          {/* =======================
              ROW 2: Mobile Buttons (Hidden on Desktop)
              ======================= */}
          <div className="lg:hidden flex flex-col gap-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800 mb-3 px-1">សកម្មភាពរហ័ស</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-slate-50 transition-all cursor-pointer border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" onClick={() => onNavigate('attendance')}>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 text-accent flex items-center justify-center shadow-inner">
                    <CheckSquare size={28} />
                  </div>
                  <span className="text-[14px] font-bold text-slate-700">ស្រង់វត្តមាន</span>
                </button>
                
                <button className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-slate-50 transition-all cursor-pointer border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" onClick={onLogout}>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-100 to-rose-50 text-danger flex items-center justify-center shadow-inner">
                    <LogOut size={28} />
                  </div>
                  <span className="text-[14px] font-bold text-slate-700">ចាកចេញ</span>
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => onNavigate('report')}
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-2xl p-4 flex items-center justify-between shadow-[0_8px_30px_rgb(99,102,241,0.2)] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 size={20} className="text-white" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[16px] font-extrabold">របាយការណ៍វត្តមាន</span>
                  <span className="text-[12px] text-indigo-100 font-medium">មើលទិន្នន័យប្រចាំថ្ងៃ សប្តាហ៍ ខែ ឆ្នាំ</span>
                </div>
              </div>
              <ChevronRight size={24} className="text-white/80 group-hover:text-white group-hover:translate-x-1 transition-transform" />
            </button>
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
            <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-full">
              <h3 className="text-[15px] lg:text-[16px] font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-danger animate-pulse"></span>
                សិស្សដែលអវត្តមានថ្ងៃនេះ
              </h3>
              
              {stats.absentStudents && stats.absentStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 w-full">
                  {stats.absentStudents.map((name, i) => (
                    <div key={i} className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all rounded-xl border border-slate-100/50">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-red-50 text-danger flex items-center justify-center shrink-0 border border-red-100">
                        <User size={16} className="lg:w-5 lg:h-5" />
                      </div>
                      <span className="text-[15px] lg:text-[16px] font-bold text-slate-700">{name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 lg:py-16 text-center flex flex-col items-center justify-center w-full bg-slate-50/50 rounded-xl border border-slate-100/50">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3 lg:mb-4">
                    <CheckCircle2 size={32} className="lg:w-10 lg:h-10" />
                  </div>
                  <span className="text-[15px] lg:text-[18px] font-bold text-slate-500">គ្មានសិស្សអវត្តមានទេថ្ងៃនេះ!</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
