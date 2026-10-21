import { useState, useRef } from 'react'
import {
  Search, Plus, User, Edit, Trash2, GraduationCap, ChevronLeft, ChevronRight,
  ChevronsRight, CheckCircle2, FileSpreadsheet, Upload, Download, X, Save,
  AlertTriangle, Phone, Calendar, Users, Eye, CheckCircle, ArrowRight, Sparkles, Lock, Check
} from 'lucide-react'
import SearchableDropdown from '../../common/SearchableDropdown'

// Function to generate the next unique student ID based on existing students
function getNextStudentId(studentList) {
  let maxNum = 0
  studentList.forEach(s => {
    const match = s.id?.match(/(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  })
  const nextNum = maxNum + 1
  return `S-${String(nextNum).padStart(3, '0')}`
}

// Sample initial students data
const INITIAL_STUDENTS = [
  { id: 'S-001', name: 'សាន វ៉ាន់ឌី', gender: 'M', class: '12A', dob: '2005-02-14', phone: '012 345 678', parentName: 'សាន វិបុល',   parentPhone: '012 345 678', status: 'active' },
  { id: 'S-002', name: 'សុខ មាន',     gender: 'M', class: '11B', dob: '2006-05-20', phone: '098 765 432', parentName: 'សុខ សារ៉ាត',  parentPhone: '098 765 432', status: 'active' },
  { id: 'S-003', name: 'កែវ រចនា',   gender: 'F', class: '10A', dob: '2007-11-05', phone: '011 222 333', parentName: 'កែវ សុផល',    parentPhone: '011 222 333', status: 'active' },
  { id: 'S-004', name: 'ចាន់ ស្រីនី', gender: 'F', class: '12A', dob: '2005-08-10', phone: '010 444 555', parentName: 'ចាន់ វណ្ណា',   parentPhone: '010 444 555', status: 'active' },
  { id: 'S-005', name: 'មាស សំណាង',  gender: 'M', class: '11A', dob: '2006-01-25', phone: '017 666 777', parentName: 'មាស ផល្លា',   parentPhone: '017 666 777', status: 'suspended' },
  { id: 'S-006', name: 'លី លីហ្សា',   gender: 'F', class: '12B', dob: '2005-12-12', phone: '093 888 999', parentName: 'លី សេងហុង',  parentPhone: '093 888 999', status: 'transferred' },
]

// Mock template data for Excel preview
const MOCK_EXCEL_DATA = [
  { id: 'S-007', name: 'ហ៊ឹម ចាន់ណា', gender: 'F', class: '12A', dob: '2005-06-18', phone: '012 998 877', parentName: 'ហ៊ឹម វិចិត្រ', parentPhone: '012 334 455', status: 'active' },
  { id: 'S-008', name: 'ឡេង វឌ្ឍនា',  gender: 'M', class: '11B', dob: '2006-09-22', phone: '097 554 433', parentName: 'ឡេង ភិរុណ',  parentPhone: '097 112 233', status: 'active' },
  { id: 'S-009', name: 'ជា ធារ៉ា',    gender: 'F', class: '10A', dob: '2007-04-12', phone: '088 667 788', parentName: 'ជា គឹមសួរ',  parentPhone: '088 990 011', status: 'active' },
]

export default function AdminStudents({ onNavigate }) {
  const [students, setStudents] = useState(INITIAL_STUDENTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Filters
  const [filterClass, setFilterClass]   = useState('ALL')
  const [filterGender, setFilterGender] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')

  // Batch Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [batchDeleteModal, setBatchDeleteModal] = useState(false)

  // Modals
  const [addEditModal, setAddEditModal] = useState({ open: false, mode: 'add', studentId: null })
  const [deleteModal, setDeleteModal]   = useState({ open: false, student: null })
  const [profileModal, setProfileModal] = useState({ open: false, student: null })
  const [importModal, setImportModal]   = useState({ open: false, parsedData: [], isUploaded: false, fileName: '' })

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    gender: 'M',
    class: '12A',
    dob: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    status: 'active'
  })

  // Toast
  const [toast, setToast] = useState(null)
  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const fileInputRef = useRef(null)

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

  // Filter Data
  let filteredStudents = students
  if (filterClass !== 'ALL')   filteredStudents = filteredStudents.filter(s => s.class === filterClass)
  if (filterGender !== 'ALL')  filteredStudents = filteredStudents.filter(s => s.gender === filterGender)
  if (filterStatus !== 'ALL')  filteredStudents = filteredStudents.filter(s => s.status === filterStatus)

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filteredStudents = filteredStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.parentPhone && s.parentPhone.includes(q)) ||
      (s.parentName && s.parentName.toLowerCase().includes(q))
    )
  }

  // Pagination (Dynamic rows per page)
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage))
  if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages)
  const paginatedData = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Dynamic counts for top cards
  const totalStudents   = students.length
  const activeStudents  = students.filter(s => s.status === 'active').length
  const inactiveStudents = students.filter(s => s.status === 'suspended' || s.status === 'transferred').length
  const femaleStudents  = students.filter(s => s.gender === 'F').length

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            កំពុងសិក្សា
          </span>
        )
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
            ផ្អាកការសិក្សា
          </span>
        )
      case 'transferred':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            ប្តូរសាលា
          </span>
        )
      default:
        return <span className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-slate-50 text-slate-600 border border-slate-200">{status}</span>
    }
  }

  // Check if entered ID already exists in system (excluding current student being edited)
  const isIdDuplicate = students.some(
    s => s.id?.toLowerCase().trim() === formData.id?.toLowerCase().trim() &&
         (addEditModal.mode === 'add' || s.id !== addEditModal.studentId)
  )

  // ── Open Add Modal ──
  const handleOpenAdd = () => {
    const autoId = getNextStudentId(students)
    setFormData({
      id: autoId,
      name: '',
      gender: 'M',
      class: '12A',
      dob: '2006-01-01',
      phone: '',
      parentName: '',
      parentPhone: '',
      status: 'active'
    })
    setAddEditModal({ open: true, mode: 'add', studentId: null })
  }

  // ── Open Edit Modal ──
  const handleOpenEdit = (student) => {
    setFormData({
      id: student.id,
      name: student.name,
      gender: student.gender || 'M',
      class: student.class || '12A',
      dob: student.dob || '',
      phone: student.phone || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      status: student.status || 'active'
    })
    setAddEditModal({ open: true, mode: 'edit', studentId: student.id })
  }

  // ── Save Add/Edit ──
  const handleSaveStudent = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.id.trim()) return

    if (isIdDuplicate) {
      showToast(`លេខកូដសិស្ស "${formData.id}" នេះមានក្នុងប្រព័ន្ធរួចហើយ! សូមប្តូរលេខកូដថ្មី`)
      return
    }

    if (addEditModal.mode === 'add') {
      const newStudent = { ...formData }
      setStudents([newStudent, ...students])
      showToast(`បានបន្ថែមសិស្ស "${formData.name}" (ID: ${formData.id}) ដោយជោគជ័យ`)
    } else {
      setStudents(students.map(s => s.id === addEditModal.studentId ? { ...formData } : s))
      showToast(`បានកែសម្រួលព័ត៌មានសិស្ស "${formData.name}" ដោយជោគជ័យ`)
    }
    setAddEditModal({ open: false, mode: 'add', studentId: null })
  }

  // ── Confirm Delete ──
  const handleExecuteDelete = () => {
    if (!deleteModal.student) return
    setStudents(students.filter(s => s.id !== deleteModal.student.id))
    showToast(`បានលុបសិស្ស "${deleteModal.student.name}" ដោយជោគជ័យ`)
    setDeleteModal({ open: false, student: null })
  }

  // ── Excel Import Handlers ──
  const handleSelectExcelFile = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportModal({
        open: true,
        fileName: file.name,
        parsedData: MOCK_EXCEL_DATA,
        isUploaded: true
      })
    }
  }

  const handleLoadDemoExcel = () => {
    setImportModal({
      open: true,
      fileName: 'បញ្ជីសិស្ស_ឆ្នាំសិក្សា២០២៦.xlsx',
      parsedData: MOCK_EXCEL_DATA,
      isUploaded: true
    })
  }

  const handleConfirmImport = () => {
    if (importModal.parsedData.length === 0) return
    // Auto-resolve any ID conflicts during Excel import
    let currentList = [...students]
    const newImported = importModal.parsedData.map(item => {
      let finalId = item.id
      if (currentList.some(s => s.id.toLowerCase() === finalId.toLowerCase())) {
        finalId = getNextStudentId(currentList)
      }
      const studentWithId = { ...item, id: finalId }
      currentList.push(studentWithId)
      return studentWithId
    })

    setStudents(currentList)
    showToast(`បាននាំចូលសិស្សចំនួន ${newImported.length} នាក់ពី Excel ដោយជោគជ័យ!`)
    setImportModal({ open: false, parsedData: [], isUploaded: false, fileName: '' })
  }

  // ── 1. Export to Excel/CSV ──
  const handleExportExcel = (selectedOnly = false) => {
    const dataToExport = selectedOnly && selectedStudentIds.length > 0
      ? students.filter(s => selectedStudentIds.includes(s.id))
      : filteredStudents

    if (dataToExport.length === 0) {
      showToast('មិនមានទិន្នន័យសម្រាប់ទាញយកទេ')
      return
    }

    const headers = ['លេខកូដ', 'ឈ្មោះសិស្ស', 'ភេទ', 'ថ្នាក់', 'ថ្ងៃខែឆ្នាំកំណើត', 'លេខទូរស័ព្ទសិស្ស', 'ឈ្មោះអាណាព្យាបាល', 'លេខទូរស័ព្ទអាណាព្យាបាល', 'ស្ថានភាព']
    const rows = dataToExport.map(s => [
      `"${s.id}"`,
      `"${s.name}"`,
      `"${s.gender === 'F' ? 'ស្រី' : 'ប្រុស'}"`,
      `"${s.class}"`,
      `"${s.dob || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.parentName || ''}"`,
      `"${s.parentPhone || ''}"`,
      `"${s.status === 'active' ? 'កំពុងសិក្សា' : s.status === 'suspended' ? 'ផ្អាកការសិក្សា' : 'ប្តូរសាលា'}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `បញ្ជីសិស្ស_វិទ្យាល័យអង្គរកា_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast(`បានទាញយកបញ្ជីសិស្ស (${dataToExport.length} នាក់) ជាឯកសារ Excel ដោយជោគជ័យ`)
  }

  // ── 2. Download Excel Template ──
  const handleDownloadTemplate = () => {
    const headers = ['លេខកូដ', 'ឈ្មោះសិស្ស', 'ភេទ', 'ថ្នាក់', 'ថ្ងៃខែឆ្នាំកំណើត', 'លេខទូរស័ព្ទសិស្ស', 'ឈ្មោះអាណាព្យាបាល', 'លេខទូរស័ព្ទអាណាព្យាបាល', 'ស្ថានភាព']
    const sampleRows = [
      ['"S-011"', '"ហេង ពិសិដ្ឋ"', '"M"', '"12A"', '"2005-03-15"', '"012 345 678"', '"ហេង វិបុល"', '"012 345 678"', '"active"'],
      ['"S-012"', '"សួស ធីតា"', '"F"', '"12B"', '"2005-07-20"', '"098 765 432"', '"សួស ផល្លា"', '"098 765 432"', '"active"']
    ]
    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'គំរូ_បញ្ចូលបញ្ជីសិស្ស.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast('បានទាញយកឯកសារគំរូ (.csv) ដោយជោគជ័យ')
  }

  // ── 4. Batch Selection Handlers ──
  const handleToggleSelectAll = () => {
    const pageIds = paginatedData.map(s => s.id)
    const allSelected = pageIds.every(id => selectedStudentIds.includes(id))
    if (allSelected) {
      setSelectedStudentIds(selectedStudentIds.filter(id => !pageIds.includes(id)))
    } else {
      const merged = Array.from(new Set([...selectedStudentIds, ...pageIds]))
      setSelectedStudentIds(merged)
    }
  }

  const handleToggleSelectStudent = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(item => item !== id))
    } else {
      setSelectedStudentIds([...selectedStudentIds, id])
    }
  }

  const handleBatchChangeStatus = (newStatus) => {
    if (selectedStudentIds.length === 0) return
    setStudents(students.map(s => selectedStudentIds.includes(s.id) ? { ...s, status: newStatus } : s))
    const statusLabel = newStatus === 'active' ? 'កំពុងសិក្សា' : newStatus === 'suspended' ? 'ផ្អាកការសិក្សា' : 'ប្តូរសាលា'
    showToast(`បានប្តូរស្ថានភាពសិស្ស ${selectedStudentIds.length} នាក់ ទៅ "${statusLabel}"`)
  }

  const handleConfirmBatchDelete = () => {
    setStudents(students.filter(s => !selectedStudentIds.includes(s.id)))
    showToast(`បានលុបសិស្សចំនួន ${selectedStudentIds.length} នាក់ចេញពីប្រព័ន្ធ`)
    setSelectedStudentIds([])
    setBatchDeleteModal(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10 relative">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-[13px] font-bold border border-slate-700/50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle size={15} />
          </div>
          <span>{toast}</span>
        </div>
      )}

      {/* ── Top Stats Cards (4 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 w-full">
        {/* Total Students */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <GraduationCap size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">សិស្សសរុប</div>
          </div>
          <div className="text-3xl font-black text-slate-800 relative z-10">{totalStudents}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">នាក់</div>
        </div>

        {/* Active Students */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">កំពុងសិក្សា</div>
          </div>
          <div className="text-3xl font-black text-emerald-500 relative z-10">{activeStudents}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">នាក់</div>
        </div>

        {/* Inactive / Suspended / Transferred */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">ផ្អាក / ប្តូរសាលា</div>
          </div>
          <div className="text-3xl font-black text-amber-500 relative z-10">{inactiveStudents}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">នាក់</div>
        </div>

        {/* Female Students */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">សិស្សស្រី</div>
          </div>
          <div className="text-3xl font-black text-indigo-600 relative z-10">{femaleStudents}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">
            ស្មើ {totalStudents > 0 ? Math.round((femaleStudents / totalStudents) * 100) : 0}% នៃសរុប
          </div>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative">

        {/* ── Premium Toolbar & Filters ── */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">

            {/* Search Input */}
            <div className="relative w-full sm:w-[280px] xl:w-[320px] group">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="ស្វែងរកលេខកូដ, ឈ្មោះ, ឬលេខទូរស័ព្ទ..."
                className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-9 pr-4 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            {/* Action Buttons: Export, Import Excel & Add Student */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
              {/* Export to Excel */}
              <button
                type="button"
                onClick={() => handleExportExcel(false)}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-3.5 rounded-xl font-bold text-[13px] transition-all shadow-xs hover:shadow hover:-translate-y-0.5 w-full sm:w-auto"
                title="ទាញយកបញ្ជីសិស្សជាឯកសារ Excel (.csv)"
              >
                <Download size={15} strokeWidth={2.2} className="text-slate-600" />
                <span>នាំចេញជា Excel</span>
              </button>

              {/* Import Excel Button */}
              <button
                type="button"
                onClick={() => setImportModal({ open: true, parsedData: [], isUploaded: false, fileName: '' })}
                className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 py-2.5 px-3.5 rounded-xl font-bold text-[13px] transition-all shadow-xs hover:shadow hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <FileSpreadsheet size={15} strokeWidth={2.2} className="text-emerald-600" />
                <span>នាំចូលពី Excel</span>
              </button>

              {/* Add Student Button */}
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-4.5 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>បន្ថែមសិស្សថ្មី</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-[540px]">
            <SearchableDropdown
              options={classOptions}
              value={filterClass}
              onChange={(val) => { setFilterClass(val); setCurrentPage(1) }}
              placeholder="ជ្រើសរើសថ្នាក់"
            />
            <SearchableDropdown
              options={genderOptions}
              value={filterGender}
              onChange={(val) => { setFilterGender(val); setCurrentPage(1) }}
              placeholder="ជ្រើសរើសភេទ"
            />
            <SearchableDropdown
              options={statusOptions}
              value={filterStatus}
              onChange={(val) => { setFilterStatus(val); setCurrentPage(1) }}
              placeholder="ជ្រើសរើសស្ថានភាព"
            />
          </div>
        </div>

        {/* ── Table Area ── */}
        <div className="w-full overflow-x-auto custom-scrollbar relative min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {/* Batch Master Checkbox */}
                <th className="py-4 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && paginatedData.every(s => selectedStudentIds.includes(s.id))}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    title="ជ្រើសរើសទាំងអស់លើទំព័រនេះ"
                  />
                </th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[110px] whitespace-nowrap">លេខកូដ</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[180px]">ឈ្មោះសិស្ស</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-20 text-center">ភេទ</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-20 text-center">ថ្នាក់</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[120px]">ថ្ងៃខែឆ្នាំកំណើត</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[130px]">លេខទូរស័ព្ទសិស្ស</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[190px]">អាណាព្យាបាល</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center min-w-[130px]">ស្ថានភាព</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center min-w-[120px]">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((student) => {
                const isSelected = selectedStudentIds.includes(student.id)
                return (
                  <tr
                    key={student.id}
                    className={`transition-colors group ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'}`}
                  >
                    {/* Row Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectStudent(student.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      />
                    </td>

                    {/* ID */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center font-mono font-bold text-[12px] bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200/60 whitespace-nowrap tracking-wider shadow-xs">
                        {student.id}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-[13px] shadow-sm flex-shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-[13px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {student.name}
                        </span>
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        student.gender === 'F' ? 'bg-pink-50 text-pink-600 border border-pink-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {student.gender === 'F' ? 'ស្រី' : 'ប្រុស'}
                      </span>
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-5 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[12px]">
                        {student.class}
                      </span>
                    </td>

                    {/* DOB */}
                    <td className="py-3.5 px-5 text-[12px] font-medium text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{student.dob || '—'}</span>
                      </div>
                    </td>

                    {/* Student Phone */}
                    <td className="py-3.5 px-5 text-[12px] font-medium text-slate-600">
                      {student.phone ? (
                        <a href={`tel:${student.phone}`} className="flex items-center gap-1.5 hover:text-indigo-600">
                          <Phone size={12} className="text-slate-400" />
                          <span>{student.phone}</span>
                        </a>
                      ) : '—'}
                    </td>

                    {/* Parent Info */}
                    <td className="py-3.5 px-5">
                      <div>
                        <p className="text-[12px] font-bold text-slate-700">{student.parentName || '—'}</p>
                        {student.parentPhone && (
                          <a href={`tel:${student.parentPhone}`} className="text-[11px] font-medium text-slate-400 hover:text-indigo-600 flex items-center gap-1 mt-0.5">
                            <Phone size={10} />
                            <span>{student.parentPhone}</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5 text-center">
                      {getStatusBadge(student.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 3. View Student Profile Modal */}
                        <button
                          type="button"
                          onClick={() => setProfileModal({ open: true, student })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                          title="មើលប្រវត្តិរូបសិស្ស"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(student)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                          title="កែប្រែ"
                        >
                          <Edit size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ open: true, student })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                          title="លុប"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="10" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <Search size={28} className="text-slate-300" />
                      </div>
                      <span className="font-bold text-slate-700 text-[15px]">មិនមានសិស្សត្រូវគ្នានឹងការស្វែងរកទេ</span>
                      <span className="text-[13px] font-medium text-slate-500 mt-1">សូមសាកល្បង Filters ផ្សេងទៀត</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 5. Pagination & Rows Per Page ── */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[12px] font-medium text-slate-400">
              បង្ហាញ {filteredStudents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredStudents.length)} នៃ {filteredStudents.length} សិស្ស
            </span>

            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
              <span>បង្ហាញ:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-[12px] font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-2xs"
              >
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>នាក់/ទំព័រ</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 rounded-full font-bold text-[14px] flex items-center justify-center transition-all ${
                  currentPage === i + 1
                    ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.35)]'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <ChevronsRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal 1: Add / Edit Student Modal ── */}
      {addEditModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  {addEditModal.mode === 'add' ? <Plus size={18} /> : <Edit size={16} />}
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800">
                    {addEditModal.mode === 'add' ? 'បន្ថែមសិស្សថ្មី' : 'កែសម្រួលព័ត៌មានសិស្ស'}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400">
                    {addEditModal.mode === 'add' ? 'បំពេញព័ត៌មានលម្អិតដើម្បីបង្កើតសិស្សថ្មី' : `កែសម្រួលសិស្ស #${addEditModal.studentId}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddEditModal({ open: false, mode: 'add', studentId: null })}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStudent} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ID (Auto Generated by System) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[12px] font-bold text-slate-700">លេខកូដសិស្ស (ID)</label>
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                      <Sparkles size={11} className="text-emerald-600" />
                      <span>ស្វ័យប្រវត្តិ (Auto)</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={formData.id}
                      className="w-full bg-slate-100/80 border border-slate-200 text-slate-800 font-mono font-black py-2 px-3 pl-8 rounded-xl text-[13px] cursor-not-allowed select-none shadow-xs tracking-wider"
                      placeholder="S-001"
                    />
                    <Lock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                    <span>ប្រព័ន្ធបង្កើតកូដស្វ័យប្រវត្តិ ធានាថាមិនជាន់គ្នាឡើយ</span>
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">ឈ្មោះសិស្ស *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                    placeholder="ឧ. សាន វ៉ាន់ឌី"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Gender */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">ភេទ</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'M' })}
                      className={`py-1.5 px-3 rounded-lg text-[12px] font-bold transition-all text-center ${
                        formData.gender === 'M' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ប្រុស (M)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'F' })}
                      className={`py-1.5 px-3 rounded-lg text-[12px] font-bold transition-all text-center ${
                        formData.gender === 'F' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ស្រី (F)
                    </button>
                  </div>
                </div>

                {/* Class */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">ថ្នាក់</label>
                  <select
                    value={formData.class}
                    onChange={e => setFormData({ ...formData, class: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  >
                    <option value="12A">ថ្នាក់ 12A</option>
                    <option value="12B">ថ្នាក់ 12B</option>
                    <option value="11A">ថ្នាក់ 11A</option>
                    <option value="11B">ថ្នាក់ 11B</option>
                    <option value="10A">ថ្នាក់ 10A</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* DOB */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">ថ្ងៃខែឆ្នាំកំណើត</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">លេខទូរស័ព្ទសិស្ស</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                    placeholder="012 345 678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Parent Name */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">ឈ្មោះអាណាព្យាបាល</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                    placeholder="ឈ្មោះឪពុក ឬម្តាយ"
                  />
                </div>

                {/* Parent Phone */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">លេខទូរស័ព្ទអាណាព្យាបាល</label>
                  <input
                    type="text"
                    value={formData.parentPhone}
                    onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                    placeholder="012 345 678"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">ស្ថានភាពសិក្សា</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                >
                  <option value="active">កំពុងសិក្សា (Active)</option>
                  <option value="suspended">ផ្អាកការសិក្សា (Suspended)</option>
                  <option value="transferred">ប្តូរសាលា (Transferred)</option>
                </select>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddEditModal({ open: false, mode: 'add', studentId: null })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] font-bold transition-all"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim() || !formData.id.trim()}
                  className={`px-5 py-2.5 rounded-xl text-white text-[13px] font-bold shadow-md transition-all flex items-center gap-2 ${
                    !formData.name.trim() || !formData.id.trim()
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-lg'
                  }`}
                >
                  <Save size={15} />
                  <span>រក្សាទុក</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Delete Student Modal ── */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-[16px] font-black text-slate-800">
              បញ្ជាក់ការលុបសិស្ស
            </h3>
            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
              តើអ្នកពិតជាចង់លុបសិស្ស <span className="font-bold text-slate-800">"{deleteModal.student?.name}"</span> (ID: <span className="font-mono text-slate-700 font-bold">{deleteModal.student?.id}</span>) ចេញពីប្រព័ន្ធមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, student: null })}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] font-bold transition-all"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Trash2 size={15} />
                <span>យល់ព្រមលុប</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Excel Import Modal ── */}
      {importModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800">នាំចូលទិន្នន័យសិស្សពី Excel</h3>
                  <p className="text-[11px] font-medium text-slate-400">គាំទ្រឯកសារប្រភេទ .xlsx, .xls ឬ .csv</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportModal({ open: false, parsedData: [], isUploaded: false, fileName: '' })}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto custom-scrollbar">

              {/* Step 1: Download Sample Template Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 shadow-xs">
                    <Download size={15} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-700">ទាញយកឯកសារគំរូ (Template)</p>
                    <p className="text-[11px] text-slate-400">ទាញយកឯកសារគំរូសម្រាប់បំពេញទិន្នន័យសិស្សឱ្យត្រូវទម្រង់</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 text-[12px] font-bold shadow-xs transition-all whitespace-nowrap"
                >
                  ទាញយកគំរូ (.csv)
                </button>
              </div>

              {/* Step 2: Upload Dropzone */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleSelectExcelFile}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 transition-colors">
                    <Upload size={22} />
                  </div>
                  <p className="text-[14px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {importModal.fileName ? importModal.fileName : 'ចុចដើម្បីជ្រើសរើសឯកសារ ឬអូសទម្លាក់ទីនេះ'}
                  </p>
                  <p className="text-[12px] text-slate-400 mt-1">
                    ឯកសារ Excel (.xlsx, .xls) ឬ CSV មិនលើសពី 10MB
                  </p>
                </div>

                {/* Quick Demo Button */}
                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleLoadDemoExcel}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 flex items-center gap-1"
                  >
                    <span>ចុចទីនេះដើម្បីសាកល្បងផ្ទុកទិន្នន័យគំរូ 3 នាក់ភ្លាមៗ</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>

              {/* Step 3: Preview Parsed Data */}
              {importModal.isUploaded && importModal.parsedData.length > 0 && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-[13px] font-bold text-slate-700">
                        ទិន្នន័យដែលបានផ្ទៀងផ្ទាត់ ({importModal.parsedData.length} សិស្ស)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      រួចរាល់សម្រាប់ការនាំចូល
                    </span>
                  </div>

                  <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold">
                          <th className="py-2.5 px-3">ID</th>
                          <th className="py-2.5 px-3">ឈ្មោះ</th>
                          <th className="py-2.5 px-3">ភេទ</th>
                          <th className="py-2.5 px-3">ថ្នាក់</th>
                          <th className="py-2.5 px-3">ទូរស័ព្ទ</th>
                          <th className="py-2.5 px-3">អាណាព្យាបាល</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {importModal.parsedData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono font-bold text-indigo-600">{row.id}</td>
                            <td className="py-2 px-3 font-bold">{row.name}</td>
                            <td className="py-2 px-3">{row.gender === 'F' ? 'ស្រី' : 'ប្រុស'}</td>
                            <td className="py-2 px-3">{row.class}</td>
                            <td className="py-2 px-3 text-slate-500">{row.phone}</td>
                            <td className="py-2 px-3 text-slate-500">{row.parentName} ({row.parentPhone})</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setImportModal({ open: false, parsedData: [], isUploaded: false, fileName: '' })}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-[13px] font-bold transition-all"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={!importModal.isUploaded || importModal.parsedData.length === 0}
                onClick={handleConfirmImport}
                className={`px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-md transition-all flex items-center gap-2 ${
                  !importModal.isUploaded || importModal.parsedData.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>បញ្ជាក់ការនាំចូល ({importModal.parsedData.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Batch Actions Floating Bar ── */}
      {selectedStudentIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-wrap items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700/80">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-[11px] font-bold flex items-center justify-center">
              {selectedStudentIds.length}
            </span>
            <span className="text-[13px] font-bold text-slate-200">
              បានជ្រើសរើស {selectedStudentIds.length} នាក់
            </span>
          </div>

          {/* Quick status change */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] text-slate-400 font-medium">ប្តូរស្ថានភាព:</span>
            <button
              type="button"
              onClick={() => handleBatchChangeStatus('active')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition-all"
            >
              កំពុងសិក្សា
            </button>
            <button
              type="button"
              onClick={() => handleBatchChangeStatus('suspended')}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold border border-rose-500/30 transition-all"
            >
              ផ្អាក
            </button>
            <button
              type="button"
              onClick={() => handleBatchChangeStatus('transferred')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-all"
            >
              ប្តូរសាលា
            </button>
          </div>

          {/* Export Selected */}
          <button
            type="button"
            onClick={() => handleExportExcel(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[12px] font-bold border border-slate-600 transition-all"
          >
            <Download size={13} />
            <span>ទាញយក Excel</span>
          </button>

          {/* Batch Delete */}
          <button
            type="button"
            onClick={() => setBatchDeleteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold transition-all shadow-sm"
          >
            <Trash2 size={13} />
            <span>លុប</span>
          </button>

          {/* Clear selection */}
          <button
            type="button"
            onClick={() => setSelectedStudentIds([])}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-1"
            title="បោះបង់ការជ្រើសរើស"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Modal 4: Batch Delete Confirmation Modal ── */}
      {batchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-[16px] font-black text-slate-800">
              បញ្ជាក់ការលុបសិស្សជាក្រុម
            </h3>
            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
              តើអ្នកពិតជាចង់លុបសិស្សដែលបានជ្រើសរើសចំនួន <span className="font-bold text-rose-600 font-mono text-[14px]">{selectedStudentIds.length} នាក់</span> ចេញពីប្រព័ន្ធមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setBatchDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] font-bold transition-all"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all"
              >
                លុបទាំងអស់ ({selectedStudentIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Modal 5: Student Profile Detail Modal ── */}
      {profileModal.open && profileModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header banner */}
            <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 p-6 text-white overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-xl" />
              <button
                type="button"
                onClick={() => setProfileModal({ open: false, student: null })}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                  {profileModal.student.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[18px] font-black text-white">
                      {profileModal.student.name}
                    </h3>
                    <span className="font-mono text-[11px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-md border border-white/30">
                      {profileModal.student.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[11.5px] font-bold bg-white/15 px-2.5 py-0.5 rounded-full text-indigo-100">
                      {profileModal.student.gender === 'F' ? 'ស្រី' : 'ប្រុស'} • ថ្នាក់ {profileModal.student.class}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      profileModal.student.status === 'active'
                        ? 'bg-emerald-400/25 text-emerald-200 border border-emerald-400/30'
                        : profileModal.student.status === 'suspended'
                        ? 'bg-rose-400/25 text-rose-200 border border-rose-400/30'
                        : 'bg-amber-400/25 text-amber-200 border border-amber-400/30'
                    }`}>
                      {profileModal.student.status === 'active' ? 'កំពុងសិក្សា' : profileModal.student.status === 'suspended' ? 'ផ្អាកការសិក្សា' : 'ប្តូរសាលា'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              {/* Personal & Parent Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ថ្ងៃខែឆ្នាំកំណើត</span>
                  <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700 mt-0.5">
                    <Calendar size={14} className="text-indigo-500" />
                    <span>{profileModal.student.dob || 'មិនទាន់កំណត់'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">លេខទូរស័ព្ទសិស្ស</span>
                  <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700 mt-0.5">
                    <Phone size={14} className="text-emerald-500" />
                    {profileModal.student.phone ? (
                      <a href={`tel:${profileModal.student.phone}`} className="hover:text-indigo-600 hover:underline">
                        {profileModal.student.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 font-normal">គ្មាន</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">អាណាព្យាបាល</span>
                  <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700 mt-0.5">
                    <User size={14} className="text-indigo-500" />
                    <span>{profileModal.student.parentName || 'មិនទាន់កំណត់'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">លេខទូរស័ព្ទអាណាព្យាបាល</span>
                  <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700 mt-0.5">
                    <Phone size={14} className="text-emerald-500" />
                    {profileModal.student.parentPhone ? (
                      <a href={`tel:${profileModal.student.parentPhone}`} className="hover:text-indigo-600 hover:underline">
                        {profileModal.student.parentPhone}
                      </a>
                    ) : (
                      <span className="text-slate-400 font-normal">គ្មាន</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendance & Discipline Highlights */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-indigo-100/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-black text-slate-700 flex items-center gap-1.5">
                    <GraduationCap size={15} className="text-indigo-600" />
                    <span>ស្ថានភាពវត្តមាន & វិន័យ</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    វត្តមានល្អ 96%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                    <span className="block text-[11px] text-slate-400 font-bold">វត្តមាន</span>
                    <span className="text-[14px] font-black text-emerald-600">32 ម៉ោង</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                    <span className="block text-[11px] text-slate-400 font-bold">ច្បាប់</span>
                    <span className="text-[14px] font-black text-amber-500">2 ម៉ោង</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                    <span className="block text-[11px] text-slate-400 font-bold">អវត្តមាន</span>
                    <span className="text-[14px] font-black text-rose-500">1 ម៉ោង</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const s = profileModal.student
                  setProfileModal({ open: false, student: null })
                  handleOpenEdit(s)
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200/80 text-[12.5px] font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Edit size={14} />
                <span>កែសម្រួល</span>
              </button>

              <div className="flex items-center gap-2">
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileModal({ open: false, student: null })
                      onNavigate('student_attendance')
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[12.5px] font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>មើលវត្តមានលម្អិត</span>
                    <ArrowRight size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setProfileModal({ open: false, student: null })}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-[12.5px] font-bold transition-all"
                >
                  បិទ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
