import { useState, useEffect } from 'react'
import { api } from '../../../utils/api'
import { Users, AlertCircle, FileText, TrendingUp, CalendarDays, BarChart3, PieChart as PieChartIcon, BarChart2 } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function AdminDashboard() {
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('school_dashboard_cache')
      if (cached) return JSON.parse(cached)
    } catch (e) {}
    return null
  })
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('school_dashboard_cache')
      return !cached
    } catch (e) {
      return true
    }
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api('admin.dashboardStats')
        if (res && res.success && res.data) {
          setData(res.data)
        }
      } catch (err) {
        console.error('Failed to load admin dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-12 h-12 border-[5px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
      
      {/* Top Stats - Focused on Absences and Leaves */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">សិស្សសរុប</div>
          </div>
          <div className="text-4xl font-black text-slate-800 relative z-10">{data?.totalStudents}</div>
        </div>
        
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <AlertCircle size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">អវត្តមានសរុប</div>
          </div>
          <div className="text-4xl font-black text-rose-500 relative z-10">{data?.totalAbsent}</div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">ច្បាប់សរុប</div>
          </div>
          <div className="text-4xl font-black text-amber-500 relative z-10">{data?.totalLeave}</div>
        </div>

        <div className="bg-indigo-600 rounded-[24px] p-6 shadow-[0_8px_30px_rgba(99,102,241,0.2)] flex flex-col justify-center relative overflow-hidden group text-white hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <TrendingUp size={20} strokeWidth={2.5} className="text-white" />
            </div>
            <div className="text-[14px] font-bold text-indigo-100">អត្រាវត្តមានរួម</div>
          </div>
          <div className="text-4xl font-black text-white relative z-10">{data?.globalRate}%</div>
        </div>
      </div>

      {/* Row 1: Weekly & Monthly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend (Area Chart) */}
        <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-full">
          <h3 className="text-[16px] lg:text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <CalendarDays size={20} className="text-rose-500" /> និន្នាការអវត្តមានប្រចាំសប្តាហ៍
          </h3>
          <div className="h-[260px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.weeklyTrend} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeeklyAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dy={10}/>
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }}/>
                <Tooltip 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', fontSize: '15px' }}
                  itemStyle={{ fontWeight: 'bold', color: '#f43f5e', fontSize: '16px' }}
                  formatter={(value) => [value, 'អវត្តមាន']}
                />
                <Area type="monotone" dataKey="absent" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorWeeklyAbsent)" activeDot={{ r: 7, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2, boxShadow: '0 0 10px rgba(244,63,94,0.5)' }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend (Bar Chart) */}
        <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-full">
          <h3 className="text-[16px] lg:text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-500" /> ទិន្នន័យអវត្តមានប្រចាំខែ
          </h3>
          <div className="h-[260px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyTrend} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dy={10}/>
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }}/>
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', fontSize: '15px' }}
                  itemStyle={{ fontWeight: 'bold', color: '#6366f1', fontSize: '16px' }}
                  formatter={(value) => [value, 'អវត្តមាន']}
                />
                <Bar dataKey="absent" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Grade & Class Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Grade Trend (Pie/Donut Chart) */}
        <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-full">
          <h3 className="text-[16px] lg:text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-amber-500" /> អវត្តមានប្រចាំកម្រិតថ្នាក់ (Grade)
          </h3>
          <div className="h-[260px] w-full mt-auto relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.gradeTrend}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="absent"
                  stroke="none"
                >
                  {data?.gradeTrend.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '16px' }}
                  formatter={(value) => [value + ' នាក់', 'អវត្តមាន']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontWeight: 'bold', fontSize: '13px', color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text for Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-[12px] font-bold text-slate-400">សរុប</span>
              <span className="text-2xl font-black text-slate-800">
                {data?.gradeTrend.reduce((acc, curr) => acc + curr.absent, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Class Trend (Horizontal Bar Chart) */}
        <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-full">
          <h3 className="text-[16px] lg:text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <BarChart2 size={20} className="text-blue-500" /> អវត្តមានប្រចាំថ្នាក់ (Class)
          </h3>
          <div className="h-[260px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.classTrend} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }}/>
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} width={45}/>
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', fontSize: '15px' }}
                  itemStyle={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '16px' }}
                  formatter={(value) => [value, 'អវត្តមាន']}
                />
                <Bar dataKey="absent" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
