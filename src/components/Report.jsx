import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { ChevronLeft, BarChart3, Users, CalendarDays, TrendingUp, AlertCircle, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'

export default function Report({ session, onNavigate }) {
  const [filter, setFilter] = useState('day') // day, week, month, year
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    loadReportData(filter)
  }, [filter])

  const loadReportData = async (selectedFilter) => {
    setLoading(true)
    let endpoint = 'reports.daily'
    let payload = { className: session.className === 'ALL' ? '12A' : session.className }
    
    if (selectedFilter === 'day') {
      endpoint = 'reports.daily'
      payload.date = new Date().toISOString().split('T')[0]
    } else if (selectedFilter === 'week') {
      endpoint = 'reports.weekly'
    } else if (selectedFilter === 'month') {
      endpoint = 'reports.monthly'
    } else if (selectedFilter === 'year') {
      endpoint = 'reports.yearly'
    }

    const result = await api(endpoint, payload)
    
    if (result.success && result.data) {
      if (selectedFilter === 'day') {
        // Map daily data to match the format of weekly/monthly/yearly for easy rendering
        setReportData({
          periodLabel: 'ថ្ងៃនេះ',
          totalAbsences: result.data.absent,
          totalLeaves: result.data.leave || 0,
          attendanceRate: result.data.attendanceRate,
          pct: result.data.totalStudents > 0 ? Math.round(((result.data.totalStudents - result.data.absent) / result.data.totalStudents) * 100) : 0,
          dailyTrend: [],
          topAbsentStudents: (result.data.absentStudents || []).map(name => ({ name, absences: 1, leaves: 0 }))
        })
      } else {
        // Assume weekly/monthly returns attendanceRate as string "XX%"
        // Parse it to pct for progress bar
        let pct = 0;
        if (result.data.attendanceRate) {
           pct = parseInt(result.data.attendanceRate.replace('%', ''));
        }
        setReportData({
          ...result.data,
          pct: isNaN(pct) ? 0 : pct
        })
      }
    }
    setLoading(false)
  }

  const filters = [
    { id: 'day', label: 'ថ្ងៃនេះ' },
    { id: 'week', label: 'សប្តាហ៍នេះ' },
    { id: 'month', label: 'ខែនេះ' },
    { id: 'year', label: 'ឆ្នាំនេះ' }
  ]

  return (
    <div className="page active flex flex-col min-h-screen bg-slate-50 font-[family-name:var(--font-primary)]">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 pt-3.5 px-3.5 sm:pt-6 sm:px-4 lg:px-8 pb-8 sm:pb-16 lg:pb-20 relative overflow-hidden text-white shadow-lg rounded-b-[1.5rem] sm:rounded-b-[2rem] lg:rounded-b-[3rem]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-[200px] sm:w-[250px] lg:w-[300px] h-[200px] sm:h-[250px] lg:h-[300px] rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-2.5 sm:gap-3 relative z-10 max-w-7xl mx-auto">
          <button 
            className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-xs lg:hover:-translate-x-1" 
            onClick={() => onNavigate('dashboard')}
          >
            <ChevronLeft size={22} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
          </button>
          <h2 className="text-[17px] sm:text-[20px] lg:text-[28px] font-extrabold m-0 drop-shadow-sm flex items-center gap-2 lg:gap-3">
            <BarChart3 size={18} className="sm:w-5 sm:h-5 lg:w-8 lg:h-8" /> របាយការណ៍វត្តមាន
          </h2>
        </div>
      </div>

      <div className="px-3 sm:px-4 lg:px-8 -mt-5 sm:-mt-10 lg:-mt-12 relative z-20 flex-1 pb-[80px] sm:pb-[100px] max-w-7xl mx-auto w-full">
        {/* Filter Tabs */}
        <div className="bg-white/90 backdrop-blur-xl p-1 sm:p-1.5 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between mb-3 sm:mb-6 lg:mb-8 lg:max-w-2xl">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-1.5 sm:py-2 lg:py-2.5 text-[12px] sm:text-[13px] lg:text-[15px] font-bold rounded-lg sm:rounded-xl transition-all duration-300
                ${filter === f.id 
                  ? 'bg-indigo-600 text-white shadow-[0_4px_14px_0_rgb(99,102,241,0.39)]' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 sm:gap-5 lg:grid lg:grid-cols-4 lg:gap-6">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:col-span-2">
              <div className="h-[90px] sm:h-[120px] bg-white rounded-xl sm:rounded-2xl animate-pulse shadow-xs"></div>
              <div className="h-[90px] sm:h-[120px] bg-white rounded-xl sm:rounded-2xl animate-pulse shadow-xs"></div>
            </div>
            <div className="h-[90px] sm:h-[120px] bg-white rounded-xl sm:rounded-2xl animate-pulse shadow-xs lg:col-span-2"></div>
            <div className="h-[140px] sm:h-[180px] bg-white rounded-xl sm:rounded-2xl animate-pulse shadow-xs lg:col-span-4"></div>
          </div>
        ) : reportData ? (
          <div className="flex flex-col gap-3 sm:gap-5 lg:grid lg:grid-cols-4 lg:gap-6">
            
            {/* =======================
                ROW 1: Summary Cards & Attendance Rate
                ======================= */}
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:gap-6 lg:col-span-2 h-full">
              <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 lg:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-red-100 relative overflow-hidden flex flex-col justify-center group h-full">
                <div className="absolute -right-4 -top-4 w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-danger/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 mb-1 sm:mb-2 lg:mb-3 relative z-10">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
                    <AlertCircle size={14} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
                  </div>
                  <div className="text-[11px] sm:text-[13px] lg:text-[14px] font-bold text-slate-500 truncate">អវត្តមានសរុប</div>
                </div>
                <div className="text-[22px] sm:text-[28px] lg:text-[32px] font-extrabold text-danger mt-0.5 sm:mt-1 relative z-10 leading-none">{reportData.totalAbsences}</div>
              </div>
              
              <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 lg:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100 relative overflow-hidden flex flex-col justify-center group h-full">
                <div className="absolute -right-4 -top-4 w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-amber-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 mb-1 sm:mb-2 lg:mb-3 relative z-10">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <FileText size={14} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
                  </div>
                  <div className="text-[11px] sm:text-[13px] lg:text-[14px] font-bold text-slate-500 truncate">ច្បាប់សរុប</div>
                </div>
                <div className="text-[22px] sm:text-[28px] lg:text-[32px] font-extrabold text-amber-500 mt-0.5 sm:mt-1 relative z-10 leading-none">{reportData.totalLeaves}</div>
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 lg:col-span-2 h-full flex flex-col justify-center">
              <div className="flex justify-between items-center mb-2.5 sm:mb-4 lg:mb-6">
                <h3 className="text-[13px] sm:text-[15px] lg:text-[16px] font-bold text-slate-800 flex items-center gap-1.5 sm:gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <TrendingUp size={14} className="sm:w-4 sm:h-4 text-success" />
                  </div>
                  <span className="truncate">អត្រាវត្តមាន ({reportData.periodLabel?.replace(/[()]/g, '') || 'ទូទៅ'})</span>
                </h3>
                <span className="text-[18px] sm:text-[20px] lg:text-[24px] font-black text-success shrink-0">{reportData.attendanceRate}</span>
              </div>
              
              <div className="mt-auto">
                <div className="flex justify-between items-end mb-1 sm:mb-2">
                  <span className="text-[11px] sm:text-[13px] font-bold text-slate-500">កម្រិតវត្តមានសរុប</span>
                  <span className="text-[12px] sm:text-[14px] font-extrabold text-success">{reportData.pct}%</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2 sm:h-2.5 overflow-hidden shadow-inner">
                  <div className="h-full rounded-full bg-gradient-to-r from-success to-emerald-400 relative transition-all duration-1000" style={{ width: `${reportData.pct}%` }}>
                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] opacity-50"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* =======================
                ROW 2: Trend Chart
                ======================= */}
            {reportData.dailyTrend && reportData.dailyTrend.length > 0 && (
              <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 lg:col-span-4 w-full">
                <h3 className="text-[13px] sm:text-[15px] lg:text-[16px] font-bold text-slate-800 mb-3 sm:mb-5 lg:mb-8 flex items-center gap-1.5 sm:gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <CalendarDays size={14} className="sm:w-4 sm:h-4 text-indigo-500" />
                  </div>
                  និន្នាការអវត្តមាន
                </h3>
                <div className="h-[150px] sm:h-[180px] lg:h-[240px] w-full mt-2 sm:mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.dailyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#818cf8" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                        dy={10}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px', fontSize: '13px' }}
                        itemStyle={{ fontWeight: 'bold', color: '#4f46e5', fontSize: '14px' }}
                        formatter={(value) => [value, 'សិស្សអវត្តមាន']}
                      />
                      <Bar 
                        dataKey="absent" 
                        fill="url(#barGradient)" 
                        radius={[6, 6, 6, 6]} 
                        barSize={20} 
                        activeBar={{ fill: '#4338ca' }}
                      >
                        <LabelList 
                          dataKey="absent" 
                          position="top" 
                          fill="#818cf8" 
                          fontSize={12} 
                          fontWeight="bold" 
                          formatter={(val) => val > 0 ? val : ''} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* =======================
                ROW 3: Top Absent Students
                ======================= */}
            <div className="lg:col-span-4 w-full">
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <h3 className="text-[13px] sm:text-[15px] lg:text-[16px] font-bold text-slate-800 mb-2.5 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <Users size={14} className="sm:w-4 sm:h-4 text-orange-500" />
                  </div>
                  សិស្សអវត្តមានច្រើនជាងគេ
                </h3>
                
                {reportData.topAbsentStudents && reportData.topAbsentStudents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 w-full">
                    {reportData.topAbsentStudents.map((student, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xs transition-all">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-orange-100 text-orange-600 font-bold text-[11px] sm:text-[13px] lg:text-[14px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-[13px] sm:text-[14px] lg:text-[15px] font-bold text-slate-700 truncate">{student.name}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 text-[10px] sm:text-[12px] font-bold shrink-0">
                          {student.leaves > 0 && <span className="text-amber-500 bg-amber-100 px-1.5 sm:px-2 lg:px-3 py-1 rounded-md leading-none">{student.leaves} ច្បាប់</span>}
                          <span className="text-danger bg-red-100 px-1.5 sm:px-2 lg:px-3 py-1 rounded-md leading-none">{student.absences} អវត្តមាន</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6 lg:py-12 text-slate-400 font-medium text-[13px] sm:text-[14px] lg:text-[16px] flex flex-col items-center justify-center h-full bg-slate-50/50 rounded-lg sm:rounded-xl border border-slate-100/50">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white shadow-xs rounded-full flex items-center justify-center mb-2 sm:mb-4">
                      <Users size={20} className="sm:w-8 sm:h-8 text-slate-300" />
                    </div>
                    គ្មានទិន្នន័យសិស្សអវត្តមានទេ
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center text-danger font-medium p-4 bg-red-50 rounded-xl border border-red-100 max-w-7xl mx-auto">
            បរាជ័យក្នុងការទាញយករបាយការណ៍
          </div>
        )}
      </div>
    </div>
  )
}
