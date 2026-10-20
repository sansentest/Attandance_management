import { useState } from 'react'
import { ChevronLeft, Phone, User, Calendar, ShieldAlert, CheckCircle2, AlertTriangle, FileText, RotateCcw, MessageSquare, Plus, BookOpen, Clock, Activity, Download, Trash2 } from 'lucide-react'

export default function AdminStudentTrackingDetail({ student, onBack, threshold, status, onNavigate }) {
  const [remark, setRemark] = useState('')
  const [remarksList, setRemarksList] = useState([
    { id: 1, date: '2026-06-25', time: '09:30 AM', text: 'បានទូរស័ព្ទទៅម្តាយសិស្ស គាត់ថានឹងមកជួបនាយកនៅថ្ងៃច័ន្ទ។', author: 'Admin រតនា', role: 'នាយករង' },
    { id: 2, date: '2026-06-20', time: '14:15 PM', text: 'សិស្សមានអាការៈឈឺក្បាលញឹកញាប់ បានអនុញ្ញាតឱ្យទៅផ្ទះមុនម៉ោង។', author: 'គ្រូ សុខ', role: 'គ្រូបន្ទុកថ្នាក់' }
  ])

  const historyData = [
    { id: 1, date: '2026-07-01', day: 'ពុធ', subject: 'គណិតវិទ្យា', teacher: 'លោកគ្រូ សុខ', reason: '', type: 'ABSENT' },
    { id: 2, date: '2026-06-28', day: 'អាទិត្យ', subject: 'រូបវិទ្យា', teacher: 'អ្នកគ្រូ នីតា', reason: 'ឈឺផ្តាសាយ', type: 'LEAVE' },
    { id: 3, date: '2026-06-25', day: 'ព្រហស្បតិ៍', subject: 'គីមីវិទ្យា', teacher: 'លោកគ្រូ វ៉ាន់', reason: '', type: 'ABSENT' },
    { id: 4, date: '2026-06-15', day: 'ច័ន្ទ', subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'អ្នកគ្រូ ចន្ថា', reason: '', type: 'ABSENT' },
  ]

  const handleAddRemark = () => {
    if (!remark.trim()) return
    const now = new Date();
    setRemarksList([
      { 
        id: Date.now(), 
        date: now.toISOString().split('T')[0], 
        time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
        text: remark, 
        author: 'Admin Current',
        role: 'អ្នកគ្រប់គ្រង'
      },
      ...remarksList
    ])
    setRemark('')
  }

  const getInitials = (name) => {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  const handleDeleteRemark = (id) => {
    if (confirm('តើអ្នកពិតជាចង់លុបកំណត់ត្រានេះមែនទេ?')) {
      setRemarksList(remarksList.filter(item => item.id !== id))
    }
  }

  const handleExport = () => {
    alert(`កំពុងរៀបចំឯកសារ (Export) សម្រាប់សិស្ស ${student.name}...`)
  }

  const getStatusProps = () => {
    if (status === 'CRITICAL') return { 
      bg: 'bg-red-50', 
      text: 'text-red-600',
      border: 'border-red-200',
      spinBorder: 'border-t-red-400',
      icon: <ShieldAlert size={18} />,
      badgeIcon: <ShieldAlert size={14} className="text-white" />,
      label: 'ត្រូវកោះហៅអាណាព្យាបាល',
      progressBg: 'bg-red-500',
      avatarGradient: 'from-red-500 to-rose-600'
    }
    if (status === 'WARNING') return { 
      bg: 'bg-amber-50', 
      text: 'text-amber-600',
      border: 'border-amber-200',
      spinBorder: 'border-t-amber-400',
      icon: <AlertTriangle size={18} />,
      badgeIcon: <AlertTriangle size={14} className="text-white" />,
      label: 'កម្រិតប្រុងប្រយ័ត្ន',
      progressBg: 'bg-amber-500',
      avatarGradient: 'from-amber-400 to-orange-500'
    }
    return { 
      bg: 'bg-blue-50', 
      text: 'text-blue-600',
      border: 'border-blue-200',
      spinBorder: 'border-t-blue-400',
      icon: <CheckCircle2 size={18} />,
      badgeIcon: <CheckCircle2 size={14} className="text-white" />,
      label: 'ធម្មតា',
      progressBg: 'bg-blue-500',
      avatarGradient: 'from-blue-500 to-indigo-600'
    }
  }

  const statusProps = getStatusProps()
  const progressPercentage = Math.min(100, (student.absent / threshold) * 100)

  return (
    <div className="flex flex-col w-full pb-12 animate-in fade-in duration-300 bg-[#F8FAFC] min-h-screen">
      
      {/* Top Header - White Background */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">ព័ត៌មានលម្អិតសិស្ស</h1>
              <div className="flex items-center gap-2 mt-0.5 text-[13px] text-slate-500 font-medium">
                <span className="text-blue-600 font-bold">{student.id}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>ថ្នាក់ {student.class}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {status === 'CRITICAL' && (
                <button className="flex items-center gap-2 text-[13px] font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100">
                  <RotateCcw size={16} strokeWidth={2.5} />
                  ដោះស្រាយរួច
                </button>
              )}
             <button 
               onClick={handleExport}
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-all shadow-md hover:shadow-lg"
             >
               <Download size={16} strokeWidth={2.5} />
               នាំចេញ (Export)
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          
          {/* Animated Profile Card */}
          <div className="bg-white rounded-2xl p-6 border-t-4 border-t-blue-500 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group">
            {/* Background accent animation */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-700 -z-10"></div>
            
            {/* Professional Enterprise Profile Avatar */}
            <div className="relative mb-6 z-10 flex justify-center">
              {/* Clean Standard Avatar */}
              <div className="w-28 h-28 rounded-full bg-slate-50 border-[1.5px] border-slate-200 shadow-sm flex items-center justify-center relative overflow-hidden z-10">
                <User size={56} className="text-slate-400" strokeWidth={1.5} />
              </div>
              
              {/* Professional Status Dot */}
              <div className="absolute bottom-2 right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 z-20">
                <div className={`w-4 h-4 rounded-full ${statusProps.progressBg}`}></div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-3 relative z-10">{student.name}</h2>
            
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold ${statusProps.bg} ${statusProps.text} ${statusProps.border} border mb-6 relative z-10`}>
              {statusProps.icon}
              {statusProps.label}
            </div>

            <div className="w-full h-[1px] bg-slate-100 mb-6 relative z-10"></div>

            <div className="w-full flex flex-col gap-4 text-left relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-slate-500">លេខទូរស័ព្ទម្តាយ</span>
                <span className="text-[14px] font-bold text-slate-700">012 345 678</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-slate-500">កម្រិតវិន័យ (អត់ច្បាប់)</span>
                <span className="text-[14px] font-bold text-red-600">{threshold} ដង</span>
              </div>
            </div>

            <button 
              onClick={() => {
                if (onNavigate) {
                  localStorage.setItem('printStudent', JSON.stringify(student));
                  onNavigate('invitation-letters');
                } else {
                  console.error('onNavigate is not defined');
                  alert('មុខងារបង្វែរទំព័រមិនដំណើរការទេ (onNavigate is undefined)');
                }
              }}
              className="w-full mt-6 relative overflow-hidden flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-[14px] font-bold transition-colors shadow-sm border border-blue-100 z-10"
            >
              <FileText size={18} />
              រៀបចំលិខិតកោះហៅ
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-red-200 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                  <Activity size={16} />
                </div>
              </div>
              <h4 className="text-3xl font-bold text-slate-800 mb-1">{student.absent}</h4>
              <p className="text-[13px] font-medium text-slate-500">អត់ច្បាប់សរុប</p>
              
              {/* Progress Line */}
              <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${statusProps.progressBg}`} style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                  <FileText size={16} />
                </div>
              </div>
              <h4 className="text-3xl font-bold text-slate-800 mb-1">{student.leave}</h4>
              <p className="text-[13px] font-medium text-slate-500">មានច្បាប់សរុប</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          
          {/* Remarks Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <MessageSquare size={16} strokeWidth={2.5} />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800">
                កត់ត្រាចំណាត់ការ
              </h3>
            </div>
            
            <div className="p-6 bg-white border-b border-slate-100 flex gap-3">
              <input 
                type="text" 
                value={remark}
                onChange={e => setRemark(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRemark()}
                placeholder="វាយបញ្ចូលកំណត់ចំណាំថ្មី..."
                className="flex-1 bg-white border border-slate-300 text-slate-800 py-2.5 px-4 rounded-xl text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
              />
              <button 
                onClick={handleAddRemark}
                disabled={!remark.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 rounded-xl text-[14px] font-bold transition-colors flex items-center gap-2 shadow-sm"
              >
                រក្សាទុក
              </button>
            </div>

            <div className="p-6 pt-2 flex flex-col gap-0 relative bg-white max-h-[300px] overflow-y-auto">
              {remarksList.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">មិនទាន់មានកំណត់ត្រាឡើយ។</p>
              ) : (
                <>
                  <div className="absolute left-[39px] top-6 bottom-4 w-[2px] bg-blue-50"></div>
                  {remarksList.map((item, index) => (
                    <div key={item.id} className="relative pl-14 py-4 group">
                      <div className="absolute left-[35px] top-[22px] w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white z-10 group-hover:scale-125 transition-transform"></div>
                      <div className="bg-slate-50/80 hover:bg-slate-50 rounded-xl p-4 border border-slate-100 transition-colors relative">
                        {/* Delete Button (always visible) */}
                        <button 
                          onClick={() => handleDeleteRemark(item.id)}
                          className="absolute top-4 right-4 text-red-400 hover:text-red-600 hover:bg-red-100 p-1.5 rounded-lg transition-all bg-red-50 opacity-100"
                          title="លុបកំណត់ត្រា"
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pr-8">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-bold text-blue-900">{item.author}</span>
                            <span className="text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">{item.role}</span>
                          </div>
                          <span className="text-[12px] font-medium text-slate-400 flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-100">
                            <Clock size={12} /> {item.date} {item.time}
                          </span>
                        </div>
                        <p className="text-[14px] text-slate-600 leading-relaxed pr-6">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <Calendar size={16} strokeWidth={2.5} />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800">
                ប្រវត្តិអវត្តមានលម្អិត
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-[12px] font-bold text-slate-400 border-b border-slate-200">
                    <th className="py-4 px-6 font-medium">កាលបរិច្ឆេទ</th>
                    <th className="py-4 px-6 font-medium">មុខវិជ្ជា/ម៉ោង</th>
                    <th className="py-4 px-6 font-medium">គ្រូបង្រៀន</th>
                    <th className="py-4 px-6 font-medium text-center">ស្ថានភាព</th>
                  </tr>
                </thead>
                <tbody className="text-[14px]">
                  {historyData.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-700">{row.date}</span>
                          <span className="text-[12px] text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">{row.day}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-slate-700">
                          <BookOpen size={14} className="text-slate-400" />
                          {row.subject}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {row.teacher}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {row.type === 'ABSENT' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-red-50 text-red-600 border border-red-100">
                            អត់ច្បាប់
                          </span>
                        ) : (
                          <span className="inline-flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              មានច្បាប់
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">{row.reason}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
