import { useState } from 'react'
import { Search, Plus, User, Edit, Trash2, GraduationCap, ChevronLeft, ChevronRight, ChevronsRight, Filter, CheckCircle2 } from 'lucide-react'
import SearchableDropdown from '../../common/SearchableDropdown'

export default function AdminStudents() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Custom Filter States
  const [filterClass, setFilterClass] = useState('ALL')
  const [filterGender, setFilterGender] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  
  const classOptions = [
    { id: 'ALL', label: 'គ្រប់ថ្នាក់' },
    { id: '12A', label: 'ថ្នាក់ 12A' },
    { id: '12B', label: 'ថ្នាក់ 12B' },
    { id: '11A', label: 'ថ្នាក់ 11A' },
    { id: '11B', label: 'ថ្នាក់ 11B' },
    { id: '10A', label: 'ថ្នាក់ 10A' },
  ]
  
  const genderOptions = [
    { id: 'ALL', label: 'គ្រប់ភេទ' },
    { id: 'M', label: 'ប្រុស' },
    { id: 'F', label: 'ស្រី' },
  ]
  
  const statusOptions = [
    { id: 'ALL', label: 'គ្រប់ស្ថានភាព' },
    { id: 'active', label: 'កំពុងសិក្សា' },
    { id: 'suspended', label: 'ផ្អាកការសិក្សា' },
    { id: 'transferred', label: 'ប្តូរសាលា' },
  ]
  
  // Mock Students Data
  const [students] = useState([
    { id: 'S-001', name: 'សាន វ៉ាន់ឌី', gender: 'M', class: '12A', dob: '2005-02-14', phone: '012 345 678', status: 'active' },
    { id: 'S-002', name: 'សុខ មាន', gender: 'M', class: '11B', dob: '2006-05-20', phone: '098 765 432', status: 'active' },
    { id: 'S-003', name: 'កែវ រចនា', gender: 'F', class: '10A', dob: '2007-11-05', phone: '011 222 333', status: 'active' },
    { id: 'S-004', name: 'ចាន់ ស្រីនី', gender: 'F', class: '12A', dob: '2005-08-10', phone: '010 444 555', status: 'active' },
    { id: 'S-005', name: 'មាស សំណាង', gender: 'M', class: '11A', dob: '2006-01-25', phone: '017 666 777', status: 'suspended' },
    { id: 'S-006', name: 'លី លីហ្សា', gender: 'F', class: '12B', dob: '2005-12-12', phone: '093 888 999', status: 'transferred' },
  ])

  // Filter Data
  let filteredStudents = students
  
  if (filterClass !== 'ALL') {
    filteredStudents = filteredStudents.filter(s => s.class === filterClass)
  }
  
  if (filterGender !== 'ALL') {
    filteredStudents = filteredStudents.filter(s => s.gender === filterGender)
  }
  
  if (filterStatus !== 'ALL') {
    filteredStudents = filteredStudents.filter(s => s.status === filterStatus)
  }
  
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filteredStudents = filteredStudents.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.id.toLowerCase().includes(q) ||
      s.phone.includes(q)
    )
  }

  // Pagination Logic (10 items per page)
  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage))
  
  if (currentPage > totalPages) {
    setCurrentPage(totalPages)
  }

  const paginatedData = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const totalRecords = filteredStudents.length
  const totalActive = filteredStudents.filter(s => s.status === 'active').length

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">កំពុងសិក្សា</span>
      case 'suspended':
        return <span className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-rose-50 text-rose-600 border border-rose-100">ផ្អាកការសិក្សា</span>
      case 'transferred':
        return <span className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-amber-50 text-amber-600 border border-amber-100">ប្តូរសាលា</span>
      default:
        return <span className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-slate-50 text-slate-600 border border-slate-200">{status}</span>
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
      
      {/* Top Stats - Clean Premium Style matching Reports */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 w-full">
        {/* Total Data Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <GraduationCap size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">សិស្សសរុប</div>
          </div>
          <div className="text-3xl font-black text-slate-800 relative z-10">{totalRecords}</div>
        </div>

        {/* Total Active Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">កំពុងសិក្សា</div>
          </div>
          <div className="text-3xl font-black text-emerald-500 relative z-10">{totalActive}</div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative">
        
        {/* Premium Toolbar & Filters */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
            {/* Search and Filters Group */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
              {/* Search Input */}
              <div className="relative w-full sm:w-[280px] xl:w-[320px] group">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="ស្វែងរកលេខកូដ, ឈ្មោះ, ឬលេខទូរស័ព្ទ..." 
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-9 pr-4 rounded-xl font-medium text-[13px] focus:outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-[140px]">
                  <SearchableDropdown 
                    options={classOptions} 
                    value={filterClass} 
                    onChange={(val) => {
                      setFilterClass(val)
                      setCurrentPage(1)
                    }} 
                    placeholder="ជ្រើសរើសថ្នាក់" 
                  />
                </div>
                <div className="w-full sm:w-[140px]">
                  <SearchableDropdown 
                    options={genderOptions} 
                    value={filterGender} 
                    onChange={(val) => {
                      setFilterGender(val)
                      setCurrentPage(1)
                    }} 
                    placeholder="ជ្រើសរើសភេទ" 
                  />
                </div>
                <div className="w-full sm:w-[160px]">
                  <SearchableDropdown 
                    options={statusOptions} 
                    value={filterStatus} 
                    onChange={(val) => {
                      setFilterStatus(val)
                      setCurrentPage(1)
                    }} 
                    placeholder="ជ្រើសរើសស្ថានភាព" 
                  />
                </div>
              </div>
            </div>

            {/* Add Student Button */}
            <div className="w-full lg:w-auto flex-shrink-0">
              <button 
                onClick={() => alert('មុខងារបន្ថែមសិស្សកំពុងអភិវឌ្ឍ!')}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 px-6 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full lg:w-auto"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>បន្ថែមសិស្សថ្មី</span>
              </button>
            </div>
          </div>
        </div>

        {/* Premium Table Area */}
        <div className="w-full overflow-x-auto custom-scrollbar relative min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">លេខកូដ</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">ឈ្មោះសិស្ស</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[100px]">ភេទ</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[100px]">ថ្នាក់</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[120px]">ថ្ងៃខែឆ្នាំកំណើត</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[120px]">លេខទូរស័ព្ទ</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[140px]">ស្ថានភាព</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[100px] text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((student, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3 px-6">
                    <span className="text-[13px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200/50">
                      {student.id}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[14px] shadow-sm border border-blue-100/50">
                        {student.name.charAt(0)}
                      </div>
                      <span className="text-[14px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{student.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-[14px] text-slate-600">
                    {student.gender === 'M' ? 'ប្រុស' : 'ស្រី'}
                  </td>
                  <td className="py-3 px-6">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-bold text-[12px]">
                      {student.class}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-[13px] font-medium text-slate-500">
                    {student.dob}
                  </td>
                  <td className="py-3 px-6 text-[13px] font-medium text-slate-500">
                    {student.phone}
                  </td>
                  <td className="py-3 px-6">
                    {getStatusBadge(student.status)}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 transition-all duration-300">
                      <button 
                        className="flex items-center justify-center w-8 h-8 bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 hover:border-blue-200 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200"
                        title="កែប្រែ"
                      >
                        <Edit size={14} strokeWidth={2.5} />
                      </button>
                      <button 
                        className="flex items-center justify-center w-8 h-8 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 hover:border-rose-200 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200"
                        title="លុប"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <Search size={28} className="text-slate-300" />
                      </div>
                      <span className="font-bold text-slate-700 text-[15px]">មិនមានសិស្សត្រូវគ្នានឹងការស្វែងរកទេ</span>
                      <span className="text-[13px] font-medium text-slate-500 mt-1">សូមសាកល្បងលក្ខខណ្ឌ (Filters) ផ្សេងទៀត។</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Pagination UI */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex flex-col xl:flex-row items-center justify-end gap-6 rounded-b-2xl">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === 1 ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              
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

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ml-1 ${currentPage === totalPages ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
              
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === totalPages ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronsRight size={20} strokeWidth={2.5} />
              </button>
            </div>

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
