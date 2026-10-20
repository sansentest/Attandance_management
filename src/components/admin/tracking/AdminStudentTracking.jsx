import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, AlertTriangle, Settings, PhoneCall, ShieldAlert, CheckCircle2, User, ChevronLeft, ChevronRight, X, Save, Users, BookOpen, Calendar, Download, ChevronDown, FileText, FileCode, FileImage, Mail, Filter } from 'lucide-react'
import { SearchableDropdown } from '../attendance/AdminStudentAttendance'
import AdminStudentTrackingDetail from './AdminStudentTrackingDetail'

export default function AdminStudentTracking({ onNavigate }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Selected Student for Detail View
  const [selectedStudent, setSelectedStudent] = useState(null)
  
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
  
  const [thresholds, setThresholds] = useState({
    '7-9': 50,
    '10-12': 40
  })

  useEffect(() => {
    const saved = localStorage.getItem('disciplineThresholds');
    if (saved) {
      try {
        setThresholds(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing thresholds');
      }
    }
  }, [])

  const classOptions = [
    { id: 'ALL', label: 'គ្រប់ថ្នាក់' },
    { id: '7A', label: 'ថ្នាក់ 7A' },
    { id: '8B', label: 'ថ្នាក់ 8B' },
    { id: '9A', label: 'ថ្នាក់ 9A' },
    { id: '11A', label: 'ថ្នាក់ 11A' },
    { id: '12A', label: 'ថ្នាក់ 12A' },
    { id: '12B', label: 'ថ្នាក់ 12B' },
  ];

  useEffect(() => {
    // Mock Data
    setTimeout(() => {
      setData([
        { id: '001', name: 'សាន វ៉ាន់ឌី', class: '12A', leave: 1, absent: 38 },
        { id: '002', name: 'ចាន់ វុទ្ធី', class: '12B', leave: 3, absent: 40 },
        { id: '003', name: 'កែវ រដ្ឋា', class: '11A', leave: 0, absent: 42 },
        { id: '004', name: 'សេង ហុង', class: '7A', leave: 2, absent: 10 },
        { id: '005', name: 'ម៉ៅ ស្រីនាថ', class: '8B', leave: 0, absent: 49 },
        { id: '006', name: 'ឌីណា រិទ្ធី', class: '9A', leave: 1, absent: 51 },
      ])
      setLoading(false)
    }, 400)
  }, [])

  // Derived Logic for Status
  const getThreshold = (className) => {
    const match = className.match(/\d+/)
    if (match) {
      const grade = parseInt(match[0])
      if (grade >= 7 && grade <= 9) return thresholds['7-9']
      if (grade >= 10 && grade <= 12) return thresholds['10-12']
    }
    return 40 // default fallback
  }
  
  const getStudentStatus = (student) => {
    const limit = getThreshold(student.class)
    if (student.absent >= limit) return 'CRITICAL' // Needs parent call
    if (student.absent >= limit - 1) return 'WARNING' // Close to limit
    return 'NORMAL'
  }

  // Filtering
  let filteredData = data
  if (filterClass !== 'ALL') {
    filteredData = filteredData.filter(d => d.class === filterClass)
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filteredData = filteredData.filter(d => 
      d.name.includes(q) || d.id.includes(q)
    )
  }

  // Pagination
  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  if (currentPage > totalPages) setCurrentPage(totalPages)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Stats
  const totalCritical = data.filter(d => getStudentStatus(d) === 'CRITICAL').length
  const totalWarning = data.filter(d => getStudentStatus(d) === 'WARNING').length

  const handleSaveSettings = () => {
    // Save to API here
    setSettingsOpen(false)
  }

  const handleExport = (type) => {
    alert(`នាំចេញទិន្នន័យតាមដានសិស្សជា ${type}... (Mock Function)`)
    setExportOpen(false)
  }

  // If a student is selected, show the detail view
  if (selectedStudent) {
    return (
      <AdminStudentTrackingDetail 
        student={selectedStudent} 
        onBack={() => setSelectedStudent(null)} 
        threshold={getThreshold(selectedStudent.class)}
        status={getStudentStatus(selectedStudent)}
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10 animate-in fade-in duration-300">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 w-full">
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <User size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">សិស្សទាំងអស់កំពុងតាមដាន</div>
          </div>
          <div className="text-3xl font-black text-slate-800 relative z-10">{data.length}</div>
        </div>
        
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-amber-700/70">ស្ថិតក្នុងការប្រុងប្រយ័ត្ន</div>
          </div>
          <div className="text-3xl font-black text-amber-500 relative z-10">{totalWarning}</div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center animate-pulse">
              <PhoneCall size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-rose-700/70">ត្រូវហៅអាណាព្យាបាល</div>
          </div>
          <div className="text-3xl font-black text-rose-500 relative z-10">{totalCritical}</div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/60 flex flex-col relative shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50/30">
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64 group">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="ស្វែងរកអត្តលេខ ឬឈ្មោះ..." 
                className="w-full bg-white border border-slate-200 text-slate-800 py-2 pl-9 pr-4 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Filter Class */}
            <div className="w-full sm:w-[150px]">
              <SearchableDropdown 
                value={filterClass} 
                onChange={setFilterClass} 
                options={classOptions} 
                placeholder="ជ្រើសរើសថ្នាក់"
                icon={Users}
              />
            </div>
          </div>
          
          {/* Right Actions: Settings & Export */}
          <div className="flex items-center gap-3 w-full xl:w-auto mt-4 xl:mt-0">
            
            {/* Export Dropdown Component */}
            <div className="relative flex-1 xl:flex-none" ref={exportRef}>
              <button 
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-6 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full whitespace-nowrap"
              >
                <Download size={15} strokeWidth={2.5} />
                <span>នាំចេញ (Export)</span>
                <ChevronDown size={15} strokeWidth={2.5} className={`transition-transform duration-300 ml-1 ${exportOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {exportOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 overflow-hidden py-2 transform origin-top-right transition-all">
                  <button 
                    onClick={() => handleExport('PDF')}
                    className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group"
                  >
                    <FileText size={16} className="text-rose-500 group-hover:scale-110 transition-transform" /> Export as PDF
                  </button>
                  <button 
                    onClick={() => handleExport('Excel')}
                    className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group"
                  >
                    <FileCode size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" /> Export as Excel
                  </button>
                  <button 
                    onClick={() => handleExport('Word')}
                    className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group"
                  >
                    <FileImage size={16} className="text-blue-500 group-hover:scale-110 transition-transform" /> Export as Word
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider">អត្តលេខ</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider">ឈ្មោះសិស្ស</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider">ថ្នាក់</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-center">មានច្បាប់</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-center">អត់ច្បាប់</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-center">ស្ថានភាព</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-center">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <span className="text-[13px] font-bold text-slate-400">កំពុងទាញយកទិន្នន័យ...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-500 text-[13px] font-medium">គ្មានទិន្នន័យបង្ហាញទេ</td>
                </tr>
              ) : (
                paginatedData.map((student, idx) => {
                  const status = getStudentStatus(student)
                  const limit = getThreshold(student.class)
                  
                  return (
                    <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-6">
                        <span className="text-[13px] font-bold text-slate-500">#{student.id}</span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="text-[14px] font-bold text-slate-800">{student.name}</span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="text-[13px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">{student.class}</span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="text-[14px] font-bold text-slate-600">{student.leave}</span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className={`text-[15px] font-black ${status === 'CRITICAL' ? 'text-rose-600' : status === 'WARNING' ? 'text-amber-600' : 'text-slate-700'}`}>
                          {student.absent}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium ml-1">/ {limit}</span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {status === 'NORMAL' && (
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                            <CheckCircle2 size={14} strokeWidth={2.5} />
                            <span className="text-[12px] font-bold">ធម្មតា</span>
                          </div>
                        )}
                        {status === 'WARNING' && (
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-full border border-amber-100">
                            <AlertTriangle size={14} strokeWidth={2.5} />
                            <span className="text-[12px] font-bold">ប្រុងប្រយ័ត្ន</span>
                          </div>
                        )}
                        {status === 'CRITICAL' && (
                          <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1 rounded-full border border-rose-100 shadow-sm animate-pulse">
                            <PhoneCall size={14} strokeWidth={2.5} />
                            <span className="text-[12px] font-bold">ហៅអាណាព្យាបាល</span>
                          </div>
                        )}
                      </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {status === 'CRITICAL' && onNavigate && (
                              <button 
                                onClick={() => onNavigate('invitation-letters')}
                                className="flex items-center gap-1.5 text-rose-600 font-bold text-[13px] hover:text-white bg-rose-50 hover:bg-rose-500 border border-rose-200 px-3 py-2 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                              >
                                <Mail size={14} strokeWidth={2.5} />
                                រៀបចំលិខិត
                              </button>
                            )}
                            <button 
                              onClick={() => setSelectedStudent(student)}
                              className="text-indigo-600 font-bold text-[13px] hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors whitespace-nowrap border border-indigo-100"
                            >
                              មើលលំអិត
                            </button>
                          </div>
                        </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-[13px] font-bold text-slate-500">
              ទំព័រទី <span className="text-indigo-600">{currentPage}</span> នៃ {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
