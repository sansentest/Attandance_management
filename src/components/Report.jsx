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
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 pt-6 px-4 lg:px-8 pb-16 lg:pb-20 relative overflow-hidden text-white shadow-lg rounded-b-[2rem] lg:rounded-b-[3rem]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-[250px] lg:w-[300px] h-[250px] lg:h-[300px] rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-3 relative z-10 max-w-7xl mx-auto">
          <button 
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-sm lg:hover:-translate-x-1" 
            onClick={() => onNavigate('dashboard')}
          >
            <ChevronLeft size={24} strokeWidth={2.5} className="lg:w-7 lg:h-7" />
          </button>
          <h2 className="text-[20px] lg:text-[28px] font-extrabold m-0 drop-shadow-sm flex items-center gap-2 lg:gap-3">
            <BarChart3 size={20} className="lg:w-8 lg:h-8" /> របាយការណ៍វត្តមាន
          </h2>
        </div>
      </div>

      <div className="px-4 lg:px-8 -mt-10 lg:-mt-12 relative z-20 flex-1 pb-[100px] max-w-7xl mx-auto w-full">
        {/* Filter Tabs */}
        <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-2xl shadow-md border border-slate-100 flex items-center justify-between mb-6 lg:mb-8 lg:max-w-2xl">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-2 lg:py-2.5 text-[13px] lg:text-[15px] font-bold rounded-xl transition-all duration-300
                ${filter === f.id 
                  ? 'bg-indigo-600 text-white shadow-[0_4px_14px_0_rgb(99,102,241,0.39)]' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-4 lg:gap-6">
            <div className="grid grid-cols-2 gap-4 lg:col-span-2">
              <div className="h-[120px] bg-white rounded-2xl animate-pulse shadow-sm"></div>
              <div className="h-[120px] bg-white rounded-2xl animate-pulse shadow-sm"></div>
            </div>
            <div className="h-[120px] bg-white rounded-2xl animate-pulse shadow-sm lg:col-span-2"></div>
            <div className="h-[180px] bg-white rounded-2xl animate-pulse shadow-sm lg:col-span-4"></div>
          </div>
        ) : reportData ? (
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-4 lg:gap-6">
            
            {/* =======================
                ROW 1: Summary Cards & Attendance Rate
                ======================= */}
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 lg:gap-6 lg:col-span-2 h-full">
              <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-red-100 relative overflow-hidden flex flex-col justify-center group h-full">
                <div className="absolute -right-4 -top-4 w-16 h-16 lg:w-20 lg:h-20 bg-danger/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
                <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center">
                    <AlertCircle size={16} strokeWidth={2.5} />
                  </div>
                  <div className="text-[13px] lg:text-[14px] font-bold text-slate-500">អវត្តមានសរុប</div>
                </div>
                <div className="text-[28px] lg:text-[32px] font-extrabold text-danger mt-1 relative z-10 leading-none">{reportData.totalAbsences}</div>
              </div>
              
              <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100 relative overflow-hidden flex flex-col justify-center group h-full">
                <div className="absolute -right-4 -top-4 w-16 h-16 lg:w-20 lg:h-20 bg-amber-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
                <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <FileText size={16} strokeWidth={2.5} />
                  </div>
                  <div className="text-[13px] lg:text-[14px] font-bold text-slate-500">ច្បាប់សរុប</div>
                </div>
                <div className="text-[28px] lg:text-[32px] font-extrabold text-amber-500 mt-1 relative z-10 leading-none">{reportData.totalLeaves}</div>
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 lg:col-span-2 h-full flex flex-col justify-center">
              <div className="flex justify-between items-center mb-4 lg:mb-6">
                <h3 className="text-[15px] lg:text-[16px] font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <TrendingUp size={16} className="text-success" />
                  </div>
                  អត្រាវត្តមាន ({reportData.periodLabel?.replace(/[()]/g, '') || 'ទូទៅ'})
                </h3>
                <span className="text-[20px] lg:text-[24px] font-black text-success">{reportData.attendanceRate}</span>
              </div>
              
              <div className="mt-auto">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[13px] font-bold text-slate-500">កម្រិតវត្តមានសរុប</span>
                  <span className="text-[14px] font-extrabold text-success">{reportData.pct}%</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
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
              <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 lg:col-span-4 w-full">
                <h3 className="text-[15px] lg:text-[16px] font-bold text-slate-800 mb-5 lg:mb-8 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                    <CalendarDays size={16} className="text-indigo-500" />
                  </div>
                  និន្នាការអវត្តមាន
                </h3>
                <div className="h-[180px] lg:h-[240px] w-full mt-4">
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
                        tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} 
                        dy={15}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', fontSize: '15px' }}
                        itemStyle={{ fontWeight: 'bold', color: '#4f46e5', fontSize: '16px' }}
                        formatter={(value) => [value, 'សិស្សអវត្តមាន']}
                      />
                      <Bar 
                        dataKey="absent" 
                        fill="url(#barGradient)" 
                        radius={[10, 10, 10, 10]} 
                        barSize={24} 
                        activeBar={{ fill: '#4338ca' }}
                      >
                        <LabelList 
                          dataKey="absent" 
                          position="top" 
                          fill="#818cf8" 
                          fontSize={14} 
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
              <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <h3 className="text-[15px] lg:text-[16px] font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                    <Users size={16} className="text-orange-500" />
                  </div>
                  សិស្សអវត្តមានច្រើនជាងគេ
                </h3>
                
                {reportData.topAbsentStudents && reportData.topAbsentStudents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 w-full">
                    {reportData.topAbsentStudents.map((student, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 lg:p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-orange-100 text-orange-600 font-bold text-[13px] lg:text-[14px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-[14px] lg:text-[15px] font-bold text-slate-700">{student.name}</span>
                        </div>
                        <div className="flex items-center gap-2 lg:gap-3 text-[12px] font-bold">
                          {student.leaves > 0 && <span className="text-amber-500 bg-amber-100 px-2 lg:px-3 py-1.5 rounded-md leading-none">{student.leaves} ច្បាប់</span>}
                          <span className="text-danger bg-red-100 px-2 lg:px-3 py-1.5 rounded-md leading-none">{student.absences} អវត្តមាន</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 lg:py-12 text-slate-400 font-medium text-[14px] lg:text-[16px] flex flex-col items-center justify-center h-full bg-slate-50/50 rounded-xl border border-slate-100/50">
                    <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
                      <Users size={32} className="text-slate-300" />
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
