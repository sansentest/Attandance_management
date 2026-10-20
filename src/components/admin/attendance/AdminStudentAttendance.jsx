import { useState, useEffect, useRef } from 'react'
import { api } from '../../../utils/api'
import { Download, Search, ChevronDown, ListFilter, AlertCircle, FileText, Calendar, FileCode, FileImage, Users, ChevronLeft, ChevronRight, ChevronsRight, BookOpen, Clock } from 'lucide-react'

// Custom Searchable Dropdown Component
export const SearchableDropdown = ({ value, onChange, options, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative group w-full" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white border ${isOpen ? 'border-indigo-400 ring-4 ring-indigo-100' : 'border-slate-200'} text-slate-700 py-2.5 px-4 rounded-xl font-medium text-[13px] hover:border-slate-300 focus:outline-none transition-all shadow-sm`}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon size={14} className="text-slate-400" />}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1.5 w-full min-w-[200px] bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-50 bg-slate-50/50">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="ស្វែងរក..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-700 py-2 pl-8 pr-3 rounded-lg font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-between ${value === opt.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {opt.label}
                  {value === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                </button>
              ))
            ) : (
              <div className="py-4 text-center text-slate-400 text-[12px] font-medium flex flex-col items-center gap-1">
                <Search size={16} className="opacity-30" />
                គ្មានលទ្ធផល
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminStudentAttendance() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Custom Filter States
  const [filterClass, setFilterClass] = useState('ALL')
  const [filterSubject, setFilterSubject] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterMonth, setFilterMonth] = useState('ALL')
  const [filterYear, setFilterYear] = useState('ALL')
  
  // Custom Date States
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Options
  const classOptions = [
    { id: 'ALL', label: 'គ្រប់ថ្នាក់' },
    { id: '12A', label: 'ថ្នាក់ 12A' },
    { id: '12B', label: 'ថ្នាក់ 12B' },
    { id: '11A', label: 'ថ្នាក់ 11A' },
  ];

  const subjectOptions = [
    { id: 'ALL', label: 'គ្រប់មុខវិជ្ជា' },
    { id: 'គណិតវិទ្យា', label: 'គណិតវិទ្យា' },
    { id: 'រូបវិទ្យា', label: 'រូបវិទ្យា' },
    { id: 'គីមីវិទ្យា', label: 'គីមីវិទ្យា' },
    { id: 'អក្សរសាស្ត្រខ្មែរ', label: 'អក្សរសាស្ត្រខ្មែរ' },
  ];

  const statusOptions = [
    { id: 'ALL', label: 'គ្រប់ស្ថានភាព' },
    { id: 'ABSENT', label: 'អវត្តមាន' },
    { id: 'LEAVE', label: 'មានច្បាប់' },
  ];

  const monthOptions = [
    { id: 'ALL', label: 'គ្រប់ខែ' },
    { id: 'CUSTOM', label: 'កំណត់ថ្ងៃផ្ទាល់ខ្លួន (Custom)' },
    { id: '01', label: 'មករា (Jan)' },
    { id: '02', label: 'កុម្ភៈ (Feb)' },
    { id: '03', label: 'មីនា (Mar)' },
    { id: '04', label: 'មេសា (Apr)' },
    { id: '05', label: 'ឧសភា (May)' },
    { id: '06', label: 'មិថុនា (Jun)' },
    { id: '07', label: 'កក្កដា (Jul)' },
    { id: '08', label: 'សីហា (Aug)' },
    { id: '09', label: 'កញ្ញា (Sep)' },
    { id: '10', label: 'តុលា (Oct)' },
    { id: '11', label: 'វិច្ឆិកា (Nov)' },
    { id: '12', label: 'ធ្នូ (Dec)' },
  ];

  const yearOptions = [
    { id: 'ALL', label: 'គ្រប់ឆ្នាំ' },
    { id: '2024', label: '2024' },
    { id: '2025', label: '2025' },
    { id: '2026', label: '2026' },
  ];
  
  // State for export dropdown
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [exportRef])
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setTimeout(() => {
        const mockReport = [
          { date: '2026-06-30', time: '08:00 AM - 09:30 AM', class: '12A', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា', studentId: '003', name: 'Keo Rotha', status: 'ABSENT', reason: 'គ្មានច្បាប់' },
          { date: '2026-06-30', time: '09:30 AM - 11:00 AM', class: '12A', subject: 'រូបវិទ្យា', teacher: 'លោកគ្រូ សុវណ្ណ', studentId: '008', name: 'San Vandy', status: 'LEAVE', reason: 'ឈឺសន្លាក់' },
          { date: '2026-06-30', time: '02:00 PM - 03:30 PM', class: '12B', subject: 'គីមីវិទ្យា', teacher: 'អ្នកគ្រូ នីតា', studentId: '006', name: 'Chea Vibol', status: 'LEAVE', reason: 'មានធុរៈគ្រួសារ' },
          { date: '2026-06-30', time: '08:00 AM - 09:30 AM', class: '11A', subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ វុទ្ធី', studentId: '101', name: 'Heng Dina', status: 'ABSENT', reason: 'គ្មានច្បាប់' },
          { date: '2026-06-29', time: '08:00 AM - 09:30 AM', class: '12A', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា', studentId: '005', name: 'Chan Vuthy', status: 'ABSENT', reason: 'គ្មានច្បាប់' },
          { date: '2026-06-29', time: '09:30 AM - 11:00 AM', class: '11A', subject: 'រូបវិទ្យា', teacher: 'លោកគ្រូ សុវណ្ណ', studentId: '105', name: 'Sok Mean', status: 'LEAVE', reason: 'ទៅស្រុកកំណើត' },
          { date: '2026-05-15', time: '02:00 PM - 03:30 PM', class: '12A', subject: 'គីមីវិទ្យា', teacher: 'អ្នកគ្រូ នីតា', studentId: '010', name: 'Somnang Pheng', status: 'ABSENT', reason: 'គ្មានច្បាប់' },
        ]
        setData(mockReport)
        setLoading(false)
      }, 300)
    }
    loadData()
  }, [])

  let filteredData = data
  // 1. Filter by Class
  if (filterClass !== 'ALL') {
    filteredData = filteredData.filter(d => d.class === filterClass)
  }
  
  // 1.5 Filter by Subject
  if (filterSubject !== 'ALL') {
    filteredData = filteredData.filter(d => d.subject === filterSubject)
  }
  
  // 2. Filter by Status
  if (filterStatus !== 'ALL') {
    filteredData = filteredData.filter(d => d.status === filterStatus)
  }
  
  // 3. Filter by Month or Custom Date
  if (filterMonth === 'CUSTOM' && (startDate || endDate)) {
    filteredData = filteredData.filter(d => {
      const rowDate = new Date(d.date)
      if (startDate && new Date(startDate) > rowDate) return false
      if (endDate && new Date(endDate) < rowDate) return false
      return true
    })
  } else if (filterMonth !== 'ALL' && filterMonth !== 'CUSTOM') {
    filteredData = filteredData.filter(d => {
      const month = d.date.split('-')[1] // 'YYYY-MM-DD'
      return month === filterMonth
    })
  }

  // 4. Filter by Year (Ignore year filter if custom date is active)
  if (filterYear !== 'ALL' && filterMonth !== 'CUSTOM') {
    filteredData = filteredData.filter(d => {
      const year = d.date.split('-')[0] // 'YYYY-MM-DD'
      return year === filterYear
    })
  }

  // 5. Filter by Search Query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filteredData = filteredData.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.studentId.includes(q)
    )
  }

  // 6. Pagination Logic (10 items per page)
  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  
  // Ensure current page is valid when filtering reduces total pages
  if (currentPage > totalPages) {
    setCurrentPage(totalPages)
  }

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExport = (type) => {
    alert(`Exporting data as ${type}... (Mock Function)`)
    setExportOpen(false)
  }

  const totalRecords = filteredData.length
  const totalAbsent = filteredData.filter(d => d.status === 'ABSENT').length
  const totalLeave = filteredData.filter(d => d.status === 'LEAVE').length

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
      
      {/* Top Stats - Clean Premium Style matching Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 w-full">
        {/* Total Data Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">ចំនួនសរុប</div>
          </div>
          <div className="text-3xl font-black text-slate-800 relative z-10">{totalRecords}</div>
        </div>
        
        {/* Total Absent Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <AlertCircle size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">អវត្តមានសរុប</div>
          </div>
          <div className="text-3xl font-black text-rose-500 relative z-10">{totalAbsent}</div>
        </div>

        {/* Total Leave Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">ច្បាប់សរុប</div>
          </div>
          <div className="text-3xl font-black text-amber-500 relative z-10">{totalLeave}</div>
        </div>
      </div>

      {/* Main Table Container - Premium Theme */}
      <div className="bg-white rounded-2xl border border-slate-200/60 flex flex-col relative shadow-sm overflow-hidden">
        
        {/* Premium Toolbar & Filters (Redesigned) */}
        <div className="p-5 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/30">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
            {/* Search Input */}
            <div className="relative w-full lg:w-[350px] group">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="ស្វែងរកឈ្មោះ ឬអត្តលេខសិស្ស..." 
                className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-9 pr-4 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Export Dropdown Component */}
            <div className="relative w-full lg:w-auto" ref={exportRef}>
              <button 
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-6 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full xl:w-auto"
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
          
          {/* Custom Searchable Dropdowns Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
            <SearchableDropdown 
              options={classOptions} 
              value={filterClass} 
              onChange={setFilterClass} 
              placeholder="ជ្រើសរើសថ្នាក់" 
              icon={Users}
            />
            <SearchableDropdown 
              options={subjectOptions} 
              value={filterSubject} 
              onChange={setFilterSubject} 
              placeholder="ជ្រើសរើសមុខវិជ្ជា" 
              icon={BookOpen}
            />
            <SearchableDropdown 
              options={statusOptions} 
              value={filterStatus} 
              onChange={setFilterStatus} 
              placeholder="ជ្រើសរើសស្ថានភាព" 
            />
            <SearchableDropdown 
              options={monthOptions} 
              value={filterMonth} 
              onChange={setFilterMonth} 
              placeholder="ជ្រើសរើសខែ" 
              icon={Calendar}
            />
            <div className={filterMonth === 'CUSTOM' ? 'opacity-50 pointer-events-none' : ''}>
              <SearchableDropdown 
                options={yearOptions} 
                value={filterYear} 
                onChange={setFilterYear} 
                placeholder="ជ្រើសរើសឆ្នាំ" 
                icon={Calendar}
              />
            </div>
          </div>

          {/* Custom Date Range (Only visible if CUSTOM is selected in month) */}
          {filterMonth === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-3 w-full bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60 animate-in fade-in slide-in-from-top-2 mt-1">
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-indigo-800 flex items-center gap-1.5"><Calendar size={14}/> ចាប់ពីថ្ងៃ៖</span>
                <input 
                  type="date" 
                  className="bg-white border border-indigo-200 text-indigo-900 py-2 px-3 rounded-lg font-bold text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-indigo-800 ml-2 lg:ml-4">ដល់ថ្ងៃ៖</span>
                <input 
                  type="date" 
                  className="bg-white border border-indigo-200 text-indigo-900 py-2 px-3 rounded-lg font-bold text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="ml-auto text-[12px] font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  លុបថ្ងៃចោល (Clear)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Premium Table Area */}
        <div className="w-full overflow-x-auto custom-scrollbar relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] z-30">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-sm"></div>
                <div className="text-[13px] font-bold text-indigo-600">កំពុងទាញទិន្នន័យ...</div>
              </div>
            </div>
          )}
          
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider min-w-[200px]">ឈ្មោះសិស្ស</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">ថ្នាក់</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">មុខវិជ្ជា</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">គ្រូបង្រៀន</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider min-w-[130px]">កាលបរិច្ឆេទ</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider min-w-[160px]">ម៉ោង</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">មូលហេតុ</th>
                <th className="py-4 px-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider text-right">ស្ថានភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[12px] shadow-sm border border-indigo-100/50">
                        {row.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{row.name}</span>
                        <span className="text-[11px] font-medium text-slate-400">ID: {row.studentId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-bold text-[12px]">
                      {row.class}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[12px] font-bold text-indigo-600">
                    {row.subject}
                  </td>
                  <td className="py-3.5 px-4 text-[12px] font-medium text-slate-600">
                    {row.teacher}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      {row.date}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                      <Clock size={13} className="text-slate-400" />
                      {row.time}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[12px] font-medium text-slate-600">
                    {row.reason}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    {row.status === 'ABSENT' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold bg-rose-50 text-rose-600 border border-rose-100/50 ml-auto shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                        អវត្តមាន
                      </div>
                    )}
                    {row.status === 'LEAVE' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold bg-amber-50 text-amber-600 border border-amber-100/50 ml-auto shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        មានច្បាប់
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <Search size={28} className="text-slate-300" />
                      </div>
                      <span className="font-bold text-slate-700 text-[15px]">មិនមានទិន្នន័យត្រូវគ្នានឹងការស្វែងរកទេ</span>
                      <span className="text-[13px] font-medium text-slate-500 mt-1">សូមសាកល្បងលក្ខខណ្ឌ (Filters) ផ្សេងទៀត។</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Modern Pagination UI matching user design */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex flex-col xl:flex-row items-center justify-end gap-6 rounded-b-2xl">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Prev Button */}
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === 1 ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-full font-bold text-[15px] flex items-center justify-center transition-all ${
                      currentPage === i + 1 
                        ? 'bg-[#0062cc] hover:bg-blue-700 text-white shadow-[0_4px_12px_rgba(0,98,204,0.3)] transform hover:scale-105' 
                        : 'bg-transparent text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ml-1 ${currentPage === totalPages ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
              
              {/* Fast Forward Button */}
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === totalPages ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronsRight size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Jump to Page */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 sm:pl-6">
              <input 
                type="number" 
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= totalPages) setCurrentPage(val);
                }}
                className="w-14 h-9 border border-slate-300 rounded-lg text-center font-bold text-slate-700 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-sm"
              />
              <span className="text-[14px] font-medium text-slate-500">
                នៃ {totalPages} ទំព័រ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
