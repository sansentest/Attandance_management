import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { 
  ChevronLeft, GraduationCap, Clock, RotateCcw, Users, 
  User, Check, X, FileText, AlertCircle, CheckCircle2, 
  Loader2, Send, LogOut, Search 
} from 'lucide-react'

export default function Attendance({ session, onNavigate, onLogout }) {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [attendanceState, setAttendanceState] = useState({})
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [alertMessage, setAlertMessage] = useState({ show: false, message: '', type: 'success' })
  
  const [periodInfo, setPeriodInfo] = useState({
    className: session.className === 'ALL' ? '12A' : session.className, // Fallback
    subject: 'កំពុងទាញយក...',
    startTime: '--:--',
    endTime: '--:--',
    period: 1
  })

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    setLoading(true)
    const result = await api('students.getByClass', { className: periodInfo.className })
    if (result.success && result.data) {
      setStudents(result.data)
      
      // Initialize state: everyone is assumed PRESENT unless marked otherwise
      const initialState = {}
      result.data.forEach(s => {
        initialState[s.id] = s.status === 'ABSENT' ? 'ABSENT' : s.status === 'LEAVE' ? 'LEAVE' : 'PRESENT'
      })
      setAttendanceState(initialState)
      setPeriodInfo(prev => ({ ...prev, subject: 'ទូទៅ' })) 
    }
    setLoading(false)
  }

  const setStatus = (id, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [id]: status
    }))
  }

  const resetAll = () => {
    const newState = {}
    students.forEach(s => {
      newState[s.id] = 'PRESENT'
    })
    setAttendanceState(newState)
  }

  const saveAttendance = async () => {
    setSaving(true)
    const records = students.map(s => ({
      id: s.id,
      name: s.name,
      status: attendanceState[s.id]
    }))

    const payload = {
      className: periodInfo.className,
      period: periodInfo.period,
      subject: periodInfo.subject,
      startTime: periodInfo.startTime,
      endTime: periodInfo.endTime,
      records
    }

    const result = await api('attendance.save', payload)
    if (result.success) {
      setAlertMessage({ show: true, message: 'រក្សាទុកការស្រង់វត្តមានបានជោគជ័យ!', type: 'success' })
    } else {
      setAlertMessage({ show: true, message: result.error || 'បរាជ័យក្នុងការរក្សាទុក', type: 'error' })
    }
    setSaving(false)
  }

  const absentCount = Object.values(attendanceState).filter(status => status === 'ABSENT').length
  const leaveCount = Object.values(attendanceState).filter(status => status === 'LEAVE').length

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="page active flex flex-col min-h-screen bg-slate-50 font-[family-name:var(--font-primary)]">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-600 pt-6 px-4 pb-6 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between relative z-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-sm" 
              onClick={() => onNavigate('dashboard')}
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <h2 className="text-[20px] font-extrabold text-white m-0 drop-shadow-sm">ស្រង់វត្តមាន</h2>
          </div>
          
          <button 
            className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-md border border-red-400/30 flex items-center justify-center text-red-50 hover:bg-red-500/40 transition-colors shadow-sm" 
            onClick={onLogout}
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 pb-[170px] max-w-7xl mx-auto w-full">
        {/* Period Info Card - Glassmorphism */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 bg-indigo-50 text-accent border border-indigo-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <GraduationCap size={14} /> ថ្នាក់ {periodInfo.className}
              </span>
              <span className="text-[13px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                ម៉ោងទី {periodInfo.period}
              </span>
            </div>
            <div className="text-[22px] font-extrabold text-slate-800 tracking-tight leading-tight mb-2">
              {periodInfo.subject}
            </div>
            <div className="text-[14px] text-slate-500 font-medium flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Clock size={14} />
              </div>
              {periodInfo.startTime} - {periodInfo.endTime}
            </div>
          </div>
        </div>

        {/* Search Bar */}
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

        {/* Controls */}
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
            className="text-[13px] font-bold text-accent hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-indigo-100" 
            onClick={resetAll}
          >
            <RotateCcw size={14} strokeWidth={2.5} /> លុបទាំងអស់
          </button>
        </div>

        {/* Student List */}
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
              const status = attendanceState[s.id]
              const isAbsent = status === 'ABSENT'
              const isLeave = status === 'LEAVE'
              
              let cardBg = 'bg-white border-transparent'
              if (isAbsent) cardBg = 'bg-red-50/50 border-red-200'
              if (isLeave) cardBg = 'bg-amber-50/50 border-amber-200'

              return (
                <div 
                  key={s.id} 
                  className={`relative overflow-hidden rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 select-none border-2 shadow-sm
                    ${cardBg}`}
                >
                  {/* Decorative number */}
                  <div className={`absolute -right-2 -bottom-4 text-[60px] font-black opacity-[0.03] pointer-events-none transition-colors duration-300 
                    ${isAbsent ? 'text-danger' : isLeave ? 'text-amber-500' : 'text-slate-900'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0 transition-all duration-300 shadow-sm
                        ${isAbsent ? 'bg-danger text-white scale-105' : isLeave ? 'bg-amber-500 text-white scale-105' : 'bg-slate-100 text-slate-600'}`}>
                        {s.id.slice(-2)}
                      </div>
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className={`text-[16px] font-extrabold transition-colors duration-300
                        ${isAbsent ? 'text-danger' : isLeave ? 'text-amber-600' : 'text-slate-800'}`}>
                        {s.name}
                      </span>
                      <span className="text-[13px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <User size={12} className={s.gender === 'F' ? "text-pink-400" : "text-blue-400"} />
                        {s.gender === 'F' ? 'ស្រី' : 'ប្រុស'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status Selection Buttons */}
                  <div className="grid grid-cols-3 gap-2 relative z-10 mt-1">
                    <button 
                      onClick={() => setStatus(s.id, 'PRESENT')}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all duration-200
                        ${!isAbsent && !isLeave 
                          ? 'bg-success/10 border-success text-success shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                    >
                      <Check size={18} strokeWidth={!isAbsent && !isLeave ? 3 : 2} />
                      <span className="text-[11px] font-bold mt-1">វត្តមាន</span>
                    </button>
                    
                    <button 
                      onClick={() => setStatus(s.id, 'ABSENT')}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all duration-200
                        ${isAbsent 
                          ? 'bg-danger/10 border-danger text-danger shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                    >
                      <X size={18} strokeWidth={isAbsent ? 3 : 2} />
                      <span className="text-[11px] font-bold mt-1">អវត្តមាន</span>
                    </button>
                    
                    <button 
                      onClick={() => setStatus(s.id, 'LEAVE')}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all duration-200
                        ${isLeave 
                          ? 'bg-amber-500/10 border-amber-500 text-amber-600 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                    >
                      <FileText size={18} strokeWidth={isLeave ? 3 : 2} />
                      <span className="text-[11px] font-bold mt-1">ច្បាប់</span>
                    </button>
                  </div>

                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Save Bar */}
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
        
        <button 
          className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_14px_0_rgb(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2" 
          onClick={saveAttendance}
          disabled={saving || loading || students.length === 0}
        >
          {saving ? (
            <><Loader2 className="animate-spin" size={20} /> រក្សាទុក...</>
          ) : (
            <><Send size={20} /> បញ្ជូន</>
          )}
        </button>
        </div>
      </div>

      {/* Custom Alert Modal */}
      {alertMessage.show && (
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
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all
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
      )}
    </div>
  )
}
