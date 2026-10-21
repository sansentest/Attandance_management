import { useState, useEffect, useRef } from 'react'
import {
  Download, Search, ChevronDown, AlertCircle, FileText, Calendar,
  FileCode, FileImage, Users, ChevronLeft, ChevronRight, ChevronsRight,
  BookOpen, Clock, Eye, ArrowLeft, ShieldAlert, CheckCircle, XCircle,
  TrendingUp, Info, Edit, Trash2, X, Save
} from 'lucide-react'

// ─────────────────────────────────────────────
// Searchable Dropdown Component
// ─────────────────────────────────────────────
export const SearchableDropdown = ({ value, onChange, options, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
  const selectedOption = options.find(opt => opt.id === value)

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
        <div className="absolute z-50 top-full left-0 mt-1.5 w-full min-w-[200px] bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden">
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
                  onClick={() => { onChange(opt.id); setIsOpen(false); setSearch('') }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-between ${value === opt.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {opt.label}
                  {value === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
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
  )
}

// ─────────────────────────────────────────────
// Mock Data — raw absence records per student
// ─────────────────────────────────────────────
const ALL_RECORDS = [
  // ហ៊ឹម ដារ៉ា — 20 records
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-01-05', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '08:00 - 09:30', reason: 'ឈឺក្បាល',   status: 'LEAVE' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-01-12', subject: 'រូបវិទ្យា',    teacher: 'លោកគ្រូ សុវណ្ណ', time: '09:30 - 11:00', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-01-20', subject: 'គីមីវិទ្យា',   teacher: 'អ្នកគ្រូ នីតា',   time: '02:00 - 03:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-02-03', subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ វុទ្ធី',  time: '08:00 - 09:30', reason: 'ទៅស្រុក',   status: 'LEAVE' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-02-10', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '09:30 - 11:00', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-02-18', subject: 'រូបវិទ្យា',    teacher: 'លោកគ្រូ សុវណ្ណ', time: '02:00 - 03:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-03-01', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '08:00 - 09:30', reason: 'ឈឺក្រពះ',   status: 'LEAVE' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-03-09', subject: 'គីមីវិទ្យា',   teacher: 'អ្នកគ្រូ នីតា',   time: '09:30 - 11:00', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-03-15', subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ វុទ្ធី',  time: '02:00 - 03:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-04-02', subject: 'រូបវិទ្យា',    teacher: 'លោកគ្រូ សុវណ្ណ', time: '08:00 - 09:30', reason: 'មានធុរៈ',   status: 'LEAVE' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-04-14', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '09:30 - 11:00', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-04-21', subject: 'គីមីវិទ្យា',   teacher: 'អ្នកគ្រូ នីតា',   time: '02:00 - 03:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-05-07', subject: 'រូបវិទ្យា',    teacher: 'លោកគ្រូ សុវណ្ណ', time: '08:00 - 09:30', reason: 'ឈឺ',        status: 'LEAVE' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-05-15', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '09:30 - 11:00', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-05-22', subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ វុទ្ធី',  time: '02:00 - 03:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-06-03', subject: 'គីមីវិទ្យា',   teacher: 'អ្នកគ្រូ នីតា',   time: '08:00 - 09:30', reason: 'ទៅស្រុក',   status: 'LEAVE' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-06-11', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '09:30 - 11:00', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-06-18', subject: 'រូបវិទ្យា',    teacher: 'លោកគ្រូ សុវណ្ណ', time: '02:00 - 03:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-07-05', subject: 'គីមីវិទ្យា',   teacher: 'អ្នកគ្រូ នីតា',   time: '08:00 - 09:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-001', name: 'ហ៊ឹម ដារ៉ា', class: '12A', date: '2026-07-14', subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ វុទ្ធី',  time: '09:30 - 11:00', reason: 'ឈឺក្បាល',   status: 'LEAVE' },

  // ស្រីណុច វណ្ណី — 4 records
  { studentId: 'STU-002', name: 'ស្រីណុច វណ្ណី', class: '12A', date: '2026-02-10', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '08:00 - 09:30', reason: 'ឈឺ',        status: 'LEAVE' },
  { studentId: 'STU-002', name: 'ស្រីណុច វណ្ណី', class: '12A', date: '2026-03-14', subject: 'រូបវិទ្យា',    teacher: 'លោកគ្រូ សុវណ្ណ', time: '09:30 - 11:00', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-002', name: 'ស្រីណុច វណ្ណី', class: '12A', date: '2026-04-01', subject: 'គីមីវិទ្យា',   teacher: 'អ្នកគ្រូ នីតា',   time: '02:00 - 03:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-002', name: 'ស្រីណុច វណ្ណី', class: '12A', date: '2026-05-05', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '08:00 - 09:30', reason: 'ទៅស្រុក',   status: 'LEAVE' },

  // ជា វិបុល — 2 records
  { studentId: 'STU-003', name: 'ជា វិបុល', class: '12B', date: '2026-01-08', subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ វុទ្ធី',  time: '08:00 - 09:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-003', name: 'ជា វិបុល', class: '12B', date: '2026-02-20', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '09:30 - 11:00', reason: 'ឈឺ',        status: 'LEAVE' },

  // ហេង ឌីណា — 7 records
  { studentId: 'STU-004', name: 'ហេង ឌីណា', class: '11A', date: '2026-01-15', subject: 'រូបវិទ្យា',    teacher: 'លោកគ្រូ សុវណ្ណ', time: '08:00 - 09:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-004', name: 'ហេង ឌីណា', class: '11A', date: '2026-02-22', subject: 'គីមីវិទ្យា',   teacher: 'អ្នកគ្រូ នីតា',   time: '02:00 - 03:30', reason: 'មានធុរៈ',   status: 'LEAVE' },
  { studentId: 'STU-004', name: 'ហេង ឌីណា', class: '11A', date: '2026-03-10', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '08:00 - 09:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-004', name: 'ហេង ឌីណា', class: '11A', date: '2026-04-05', subject: 'រូបវិទ្យា',    teacher: 'លោកគ្រូ សុវណ្ណ', time: '09:30 - 11:00', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-004', name: 'ហេង ឌីណា', class: '11A', date: '2026-05-12', subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ វុទ្ធី',  time: '02:00 - 03:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-004', name: 'ហេង ឌីណា', class: '11A', date: '2026-06-08', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '08:00 - 09:30', reason: 'ឈឺ',        status: 'LEAVE' },
  { studentId: 'STU-004', name: 'ហេង ឌីណា', class: '11A', date: '2026-07-01', subject: 'គីមីវិទ្យា',   teacher: 'អ្នកគ្រូ នីតា',   time: '09:30 - 11:00', reason: 'គ្មានច្បាប់', status: 'ABSENT' },

  // ចាន់ វុទ្ធី — 3 records
  { studentId: 'STU-005', name: 'ចាន់ វុទ្ធី', class: '12A', date: '2026-01-25', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '08:00 - 09:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-005', name: 'ចាន់ វុទ្ធី', class: '12A', date: '2026-03-18', subject: 'រូបវិទ្យា',    teacher: 'លោកគ្រូ សុវណ្ណ', time: '09:30 - 11:00', reason: 'ទៅស្រុក',   status: 'LEAVE' },
  { studentId: 'STU-005', name: 'ចាន់ វុទ្ធី', class: '12A', date: '2026-05-30', subject: 'គីមីវិទ្យា',   teacher: 'អ្នកគ្រូ នីតា',   time: '02:00 - 03:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },

  // ស៊ុន មានី — 10 records (warning zone)
  { studentId: 'STU-006', name: 'ស៊ុន មានី', class: '11A', date: '2026-01-07', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '08:00 - 09:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-006', name: 'ស៊ុន មានី', class: '11A', date: '2026-01-21', subject: 'រូបវិទ្យា',    teacher: 'លោកគ្រូ សុវណ្ណ', time: '09:30 - 11:00', reason: 'ឈឺ',        status: 'LEAVE' },
  { studentId: 'STU-006', name: 'ស៊ុន មានី', class: '11A', date: '2026-02-08', subject: 'គីមីវិទ្យា',   teacher: 'អ្នកគ្រូ នីតា',   time: '02:00 - 03:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-006', name: 'ស៊ុន មានី', class: '11A', date: '2026-03-02', subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ វុទ្ធី',  time: '08:00 - 09:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-006', name: 'ស៊ុន មានី', class: '11A', date: '2026-03-20', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '09:30 - 11:00', reason: 'ទៅស្រុក',   status: 'LEAVE' },
  { studentId: 'STU-006', name: 'ស៊ុន មានី', class: '11A', date: '2026-04-10', subject: 'រូបវិទ្យា',    teacher: 'លោកគ្រូ សុវណ្ណ', time: '02:00 - 03:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-006', name: 'ស៊ុន មានី', class: '11A', date: '2026-04-25', subject: 'គីមីវិទ្យា',   teacher: 'អ្នកគ្រូ នីតា',   time: '08:00 - 09:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-006', name: 'ស៊ុន មានី', class: '11A', date: '2026-05-08', subject: 'គណិតវិទ្យា', teacher: 'អ្នកគ្រូ សុខា',    time: '09:30 - 11:00', reason: 'ឈឺ',        status: 'LEAVE' },
  { studentId: 'STU-006', name: 'ស៊ុន មានី', class: '11A', date: '2026-06-01', subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ វុទ្ធី',  time: '02:00 - 03:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
  { studentId: 'STU-006', name: 'ស៊ុន មានី', class: '11A', date: '2026-06-20', subject: 'រូបវិទ្យា',    teacher: 'លោកគ្រូ សុវណ្ណ', time: '08:00 - 09:30', reason: 'គ្មានច្បាប់', status: 'ABSENT' },
]

// ─────────────────────────────────────────────
// Derive student summaries from raw records
// ─────────────────────────────────────────────
function buildStudentSummaries(records) {
  const map = {}
  records.forEach((r, idx) => {
    if (!map[r.studentId]) {
      map[r.studentId] = { studentId: r.studentId, name: r.name, class: r.class, total: 0, leave: 0, absent: 0, records: [] }
    }
    map[r.studentId].total++
    if (r.status === 'LEAVE') map[r.studentId].leave++
    else map[r.studentId].absent++
    map[r.studentId].records.push({
      ...r,
      id: r.id || `${r.studentId}-${idx + 1}-${r.date}-${r.subject}`
    })
  })
  return Object.values(map)
}

// Status badge logic based on total absences
function getStatusInfo(total) {
  if (total >= 15) return { label: 'គ្រោះថ្នាក់', color: 'rose', icon: ShieldAlert }
  if (total >= 8)  return { label: 'ប្រុងប្រយ័ត្ន', color: 'amber', icon: AlertCircle }
  return { label: 'ធម្មតា', color: 'emerald', icon: CheckCircle }
}

const colorMap = {
  rose:    { badge: 'bg-rose-50 text-rose-600 border-rose-100',       dot: 'bg-rose-500',    pulse: true },
  amber:   { badge: 'bg-amber-50 text-amber-600 border-amber-100',    dot: 'bg-amber-500',   pulse: false },
  emerald: { badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500', pulse: false },
}

// ─────────────────────────────────────────────
// Student Detail Page with Edit, Delete & Multi-Select
// ─────────────────────────────────────────────
function StudentDetailPage({ student, onBack, onUpdateRecords }) {
  // ── Records state with unique IDs ──
  const [records, setRecords] = useState(() => {
    return (student.records || []).map((r, i) => ({
      ...r,
      id: r.id || `${student.studentId}-${i + 1}-${r.date}-${r.subject}`
    }))
  })

  // ── Multi-select state ──
  const [selectedIds, setSelectedIds] = useState([])

  // ── Modal states ──
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, record: null, count: 0 })
  const [editModal, setEditModal] = useState({ open: false, record: null })
  const [editFormData, setEditFormData] = useState({
    date: '',
    subject: '',
    teacher: '',
    time: '',
    reason: '',
    status: 'ABSENT'
  })

  // ── Toast notification state ──
  const [toast, setToast] = useState(null)
  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Detail page search & filters ──
  const [detailSearch, setDetailSearch]         = useState('')
  const [detailSubject, setDetailSubject]       = useState('ALL')
  const [detailStatus,  setDetailStatus]        = useState('ALL')
  const [detailMonth,   setDetailMonth]         = useState('ALL')
  const [detailPage, setDetailPage]             = useState(1)
  const [detailExportOpen, setDetailExportOpen] = useState(false)
  const detailExportRef = useRef(null)
  const itemsPerPage = 10

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (detailExportRef.current && !detailExportRef.current.contains(e.target)) {
        setDetailExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDetailExport = (type) => {
    alert(`Exporting ${student.name}'s absence history as ${type}... (Mock)`)
    setDetailExportOpen(false)
  }

  // Dynamic counts for cards and status badge
  const totalCount = records.length
  const leaveCount = records.filter(r => r.status === 'LEAVE').length
  const absentCount = records.filter(r => r.status === 'ABSENT').length
  const statusInfo = getStatusInfo(totalCount)
  const StatusIcon = statusInfo.icon

  const allRecords = records.slice().sort((a, b) => new Date(b.date) - new Date(a.date))

  // Build unique subject options from records
  const subjectOpts = [
    { id: 'ALL', label: 'គ្រប់មុខវិជ្ជា' },
    ...([...new Set(allRecords.map(r => r.subject))].map(s => ({ id: s, label: s })))
  ]
  const statusOpts = [
    { id: 'ALL', label: 'គ្រប់ស្ថានភាព' },
    { id: 'ABSENT', label: 'គ្មានច្បាប់' },
    { id: 'LEAVE',  label: 'មានច្បាប់' },
  ]
  const monthOpts = [
    { id: 'ALL', label: 'គ្រប់ខែ' },
    { id: '01', label: 'មករា (Jan)' }, { id: '02', label: 'កុម្ភៈ (Feb)' },
    { id: '03', label: 'មីនា (Mar)' }, { id: '04', label: 'មេសា (Apr)' },
    { id: '05', label: 'ឧសភា (May)' }, { id: '06', label: 'មិថុនា (Jun)' },
    { id: '07', label: 'កក្កដា (Jul)' }, { id: '08', label: 'សីហា (Aug)' },
    { id: '09', label: 'កញ្ញា (Sep)' }, { id: '10', label: 'តុលា (Oct)' },
    { id: '11', label: 'វិច្ឆិកា (Nov)' }, { id: '12', label: 'ធ្នូ (Dec)' },
  ]

  // Apply filters
  let filtered = allRecords
  if (detailSubject !== 'ALL') filtered = filtered.filter(r => r.subject === detailSubject)
  if (detailStatus  !== 'ALL') filtered = filtered.filter(r => r.status  === detailStatus)
  if (detailMonth   !== 'ALL') filtered = filtered.filter(r => r.date.split('-')[1] === detailMonth)
  if (detailSearch.trim()) {
    const q = detailSearch.toLowerCase()
    filtered = filtered.filter(r =>
      r.subject.toLowerCase().includes(q) ||
      r.teacher?.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
    )
  }

  const totalDetailPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginatedRecords = filtered.slice((detailPage - 1) * itemsPerPage, detailPage * itemsPerPage)

  // ── Multi-select handlers ──
  const isAllFilteredSelected = filtered.length > 0 && filtered.every(r => selectedIds.includes(r.id))
  const isSomeFilteredSelected = filtered.some(r => selectedIds.includes(r.id)) && !isAllFilteredSelected

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIdSet = new Set(filtered.map(r => r.id))
      setSelectedIds(prev => prev.filter(id => !filteredIdSet.has(id)))
    } else {
      const currentSelectedSet = new Set(selectedIds)
      filtered.forEach(r => currentSelectedSet.add(r.id))
      setSelectedIds(Array.from(currentSelectedSet))
    }
  }

  const handleToggleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // ── Open Edit Modal ──
  const handleOpenEdit = (record) => {
    setEditFormData({
      date: record.date || '',
      subject: record.subject || '',
      teacher: record.teacher || '',
      time: record.time || '',
      reason: record.reason || '',
      status: record.status || 'ABSENT'
    })
    setEditModal({ open: true, record })
  }

  // ── Save Edit ──
  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editModal.record) return
    const updatedRecords = records.map(r => {
      if (r.id === editModal.record.id) {
        return { ...r, ...editFormData }
      }
      return r
    })
    setRecords(updatedRecords)
    if (onUpdateRecords) onUpdateRecords(updatedRecords)
    setEditModal({ open: false, record: null })
    showToast('បានកែសម្រួលកំណត់ត្រាដោយជោគជ័យ')
  }

  // ── Confirm Delete Action (Single or Bulk) ──
  const handleExecuteDelete = () => {
    if (deleteModal.type === 'bulk') {
      const idsToDelete = new Set(selectedIds)
      const newRecords = records.filter(r => !idsToDelete.has(r.id))
      setRecords(newRecords)
      setSelectedIds([])
      if (onUpdateRecords) onUpdateRecords(newRecords)
      showToast(`បានលុប ${deleteModal.count} កំណត់ត្រាដោយជោគជ័យ`)
    } else if (deleteModal.type === 'single') {
      const idToDelete = deleteModal.record?.id
      const newRecords = records.filter(r => r.id !== idToDelete)
      setRecords(newRecords)
      setSelectedIds(prev => prev.filter(id => id !== idToDelete))
      if (onUpdateRecords) onUpdateRecords(newRecords)
      showToast('បានលុបកំណត់ត្រាដោយជោគជ័យ')
    }
    setDeleteModal({ open: false, type: null, record: null, count: 0 })
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

      {/* Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-bold text-[13px] bg-white border border-slate-200 rounded-xl px-4 py-2.5 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          ត្រឡប់ក្រោយ
        </button>
      </div>

      {/* ── Stats Cards (Dynamic Real-Time Synced) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">

        {/* Identity Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-100 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0">
              {student.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-black text-slate-800 leading-tight truncate">{student.name}</p>
              <p className="text-[12px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                <span>ID: {student.studentId}</span>
                <span>•</span>
                <span>ថ្នាក់ {student.class}</span>
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 relative z-10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">ស្ថានភាព</span>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${colorMap[statusInfo.color].badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${colorMap[statusInfo.color].dot} ${colorMap[statusInfo.color].pulse ? 'animate-pulse' : ''} inline-block`} />
              {statusInfo.label}
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Users size={18} strokeWidth={2.5} />
            </div>
            <div className="text-[13px] font-bold text-slate-500">អវត្តមានសរុប</div>
          </div>
          <div className="text-3xl font-black text-slate-800 relative z-10">{totalCount}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">ដង</div>
        </div>

        {/* Leave */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <FileText size={18} strokeWidth={2.5} />
            </div>
            <div className="text-[13px] font-bold text-slate-500">មានច្បាប់</div>
          </div>
          <div className="text-3xl font-black text-amber-500 relative z-10">{leaveCount}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">ដង</div>
        </div>

        {/* Absent */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <AlertCircle size={18} strokeWidth={2.5} />
            </div>
            <div className="text-[13px] font-bold text-slate-500">គ្មានច្បាប់</div>
          </div>
          <div className="text-3xl font-black text-rose-500 relative z-10">{absentCount}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">ដង</div>
        </div>

      </div>

      {/* History Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">

        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Calendar size={15} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-[14px] font-black text-slate-800">ប្រវត្តិអវត្តមានទាំងអស់</p>
                <p className="text-[11px] font-medium text-slate-400">
                  {filtered.length === allRecords.length
                    ? `សរុប ${allRecords.length} កំណត់ត្រា`
                    : `បង្ហាញ ${filtered.length} / ${allRecords.length} កំណត់ត្រា`}
                </p>
              </div>
            </div>

            {/* Actions: Search & Export */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-[260px] lg:w-[280px] group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="ស្វែងរកមុខវិជ្ជា គ្រូ មូលហេតុ..."
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-8 pr-4 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm"
                  value={detailSearch}
                  onChange={e => { setDetailSearch(e.target.value); setDetailPage(1) }}
                />
              </div>

              {/* Export */}
              <div className="relative w-full sm:w-auto" ref={detailExportRef}>
                <button
                  onClick={() => setDetailExportOpen(!detailExportOpen)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-5 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto"
                >
                  <Download size={15} strokeWidth={2.5} />
                  <span>នាំចេញ (Export)</span>
                  <ChevronDown size={15} strokeWidth={2.5} className={`transition-transform duration-300 ml-1 ${detailExportOpen ? 'rotate-180' : ''}`} />
                </button>
                {detailExportOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-50 overflow-hidden py-2">
                    <button onClick={() => handleDetailExport('PDF')}   className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group"><FileText  size={16} className="text-rose-500    group-hover:scale-110 transition-transform" /> Export as PDF</button>
                    <button onClick={() => handleDetailExport('Excel')} className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group"><FileCode  size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" /> Export as Excel</button>
                    <button onClick={() => handleDetailExport('Word')}  className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group"><FileImage size={16} className="text-blue-500   group-hover:scale-110 transition-transform" /> Export as Word</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <SearchableDropdown options={subjectOpts} value={detailSubject} onChange={v => { setDetailSubject(v); setDetailPage(1) }} placeholder="ជ្រើសរើសមុខវិជ្ជា" icon={BookOpen} />
            <SearchableDropdown options={statusOpts}  value={detailStatus}  onChange={v => { setDetailStatus(v);  setDetailPage(1) }} placeholder="ជ្រើសរើសស្ថានភាព" />
            <SearchableDropdown options={monthOpts}   value={detailMonth}   onChange={v => { setDetailMonth(v);   setDetailPage(1) }} placeholder="ជ្រើសរើសខែ" icon={Calendar} />
          </div>

          {/* ── Multi-Select Batch Action Bar ── */}
          {selectedIds.length > 0 && (
            <div className="bg-indigo-50/90 border border-indigo-200/80 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shadow-sm">
                  {selectedIds.length}
                </span>
                <span className="text-[13px] font-bold text-indigo-950">
                  បានជ្រើសរើស <span className="text-indigo-600 font-extrabold">{selectedIds.length}</span> កំណត់ត្រា
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold text-slate-600 hover:text-slate-800 hover:bg-white/80 border border-transparent hover:border-slate-200 transition-all"
                >
                  បោះបង់ការជ្រើសរើស
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModal({ open: true, type: 'bulk', record: null, count: selectedIds.length })}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow transition-all"
                >
                  <Trash2 size={13} />
                  <span>លុបដែលបានជ្រើស ({selectedIds.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[880px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {/* Select All Checkbox */}
                <th className="py-4 px-4 text-center w-12">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    ref={el => { if (el) el.indeterminate = isSomeFilteredSelected }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600 transition-all"
                    title="ជ្រើសរើសទាំងអស់"
                  />
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-12 text-center">#</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[130px]">កាលបរិច្ឆេទ</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">មុខវិជ្ជា</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">គ្រូបង្រៀន</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[140px]">ម៉ោងសិក្សា</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">មូលហេតុ</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">ស្ថានភាព</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center min-w-[100px]">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedRecords.map((rec, idx) => {
                const isSelected = selectedIds.includes(rec.id)
                return (
                  <tr
                    key={rec.id || idx}
                    className={`transition-colors group ${
                      isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50/70' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(rec.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600 transition-all"
                      />
                    </td>

                    {/* Row Index */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 mx-auto">
                        {(detailPage - 1) * itemsPerPage + idx + 1}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="text-[13px] font-bold text-slate-700">{rec.date}</span>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <BookOpen size={13} className="text-indigo-400 flex-shrink-0" />
                        <span className="text-[13px] font-bold text-indigo-600">{rec.subject}</span>
                      </div>
                    </td>

                    {/* Teacher */}
                    <td className="py-3.5 px-5">
                      <span className="text-[12px] font-medium text-slate-600">{rec.teacher || '—'}</span>
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="text-[12px] font-medium text-slate-600">{rec.time}</span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-5">
                      <span className="text-[12px] font-medium text-slate-600">{rec.reason}</span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-5 text-center">
                      {rec.status === 'ABSENT' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />
                          គ្មានច្បាប់
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                          មានច្បាប់
                        </span>
                      )}
                    </td>

                    {/* Action Column: Edit & Delete */}
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                          title="កែសម្រួល"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ open: true, type: 'single', record: rec, count: 1 })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                          title="លុប"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="9" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                        <Search size={24} className="text-slate-300" />
                      </div>
                      <span className="font-bold text-slate-700 text-[14px]">មិនមានទិន្នន័យត្រូវគ្នាទេ</span>
                      <span className="text-[12px] text-slate-400 mt-1">សូមសាកល្បង Filter ផ្សេង</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[12px] font-medium text-slate-400">
            {filtered.length > 0
              ? `បង្ហាញ ${(detailPage - 1) * itemsPerPage + 1}–${Math.min(detailPage * itemsPerPage, filtered.length)} នៃ ${filtered.length} កំណត់ត្រា`
              : '0 កំណត់ត្រា'}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setDetailPage(p => Math.max(1, p - 1))} disabled={detailPage === 1} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${detailPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}><ChevronLeft size={18} /></button>
            {[...Array(totalDetailPages)].map((_, i) => (
              <button key={i} onClick={() => setDetailPage(i + 1)} className={`w-8 h-8 rounded-full font-bold text-[13px] flex items-center justify-center transition-all ${detailPage === i + 1 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setDetailPage(p => Math.min(totalDetailPages, p + 1))} disabled={detailPage === totalDetailPages} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${detailPage === totalDetailPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800">កែសម្រួលកំណត់ត្រាអវត្តមាន</h3>
                  <p className="text-[11px] font-medium text-slate-400">សិស្ស: {student.name} • #{student.studentId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModal({ open: false, record: null })}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit} className="p-6 flex flex-col gap-4">
              {/* Status Segmented Control */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">ស្ថានភាពអវត្តមាន</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, status: 'ABSENT' })}
                    className={`py-2 px-3 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      editFormData.status === 'ABSENT'
                        ? 'bg-white text-rose-600 shadow-sm border border-rose-100'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    គ្មានច្បាប់ (ABSENT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, status: 'LEAVE' })}
                    className={`py-2 px-3 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      editFormData.status === 'LEAVE'
                        ? 'bg-white text-amber-600 shadow-sm border border-amber-100'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    មានច្បាប់ (LEAVE)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">កាលបរិច្ឆេទ</label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">មុខវិជ្ជា</label>
                  <input
                    type="text"
                    required
                    value={editFormData.subject}
                    onChange={e => setEditFormData({ ...editFormData, subject: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Teacher */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">គ្រូបង្រៀន</label>
                  <input
                    type="text"
                    value={editFormData.teacher}
                    onChange={e => setEditFormData({ ...editFormData, teacher: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                    placeholder="ឈ្មោះគ្រូបង្រៀន"
                  />
                </div>

                {/* Time Slot */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">ម៉ោងសិក្សា</label>
                  <input
                    type="text"
                    value={editFormData.time}
                    onChange={e => setEditFormData({ ...editFormData, time: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                    placeholder="ឧ. 08:00 - 09:30"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">មូលហេតុ</label>
                <input
                  type="text"
                  required
                  value={editFormData.reason}
                  onChange={e => setEditFormData({ ...editFormData, reason: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  placeholder="បញ្ជាក់មូលហេតុអវត្តមាន..."
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModal({ open: false, record: null })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] font-bold transition-all"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Save size={15} />
                  <span>រក្សាទុក</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-[16px] font-black text-slate-800">
              បញ្ជាក់ការលុបកំណត់ត្រាអវត្តមាន
            </h3>
            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
              {deleteModal.type === 'bulk'
                ? `តើអ្នកពិតជាចង់លុប ${deleteModal.count} កំណត់ត្រាអវត្តមានដែលបានជ្រើសរើសនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
                : `តើអ្នកពិតជាចង់លុបកំណត់ត្រាអវត្តមានមុខវិជ្ជា "${deleteModal.record?.subject}" ថ្ងៃទី ${deleteModal.record?.date} មែនទេ?`}
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, type: null, record: null, count: 0 })}
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

    </div>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function AdminStudentAttendance() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const [filterClass, setFilterClass] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setSummaries(buildStudentSummaries(ALL_RECORDS))
      setLoading(false)
    }, 350)
  }, [])

  const classOptions = [
    { id: 'ALL', label: 'គ្រប់ថ្នាក់' },
    { id: '12A', label: 'ថ្នាក់ 12A' },
    { id: '12B', label: 'ថ្នាក់ 12B' },
    { id: '11A', label: 'ថ្នាក់ 11A' },
  ]

  const statusFilterOptions = [
    { id: 'ALL', label: 'គ្រប់ស្ថានភាព' },
    { id: 'danger',  label: 'គ្រោះថ្នាក់ (≥ 15 ដង)' },
    { id: 'warning', label: 'ប្រុងប្រយ័ត្ន (8–14 ដង)' },
    { id: 'normal',  label: 'ធម្មតា (< 8 ដង)' },
  ]

  // Filtering
  let filtered = summaries
  if (filterClass !== 'ALL') filtered = filtered.filter(s => s.class === filterClass)
  if (filterStatus !== 'ALL') {
    filtered = filtered.filter(s => {
      const info = getStatusInfo(s.total)
      if (filterStatus === 'danger')  return info.color === 'rose'
      if (filterStatus === 'warning') return info.color === 'amber'
      if (filterStatus === 'normal')  return info.color === 'emerald'
      return true
    })
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q))
  }

  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const dangerCount  = summaries.filter(s => getStatusInfo(s.total).color === 'rose').length
  const warningCount = summaries.filter(s => getStatusInfo(s.total).color === 'amber').length

  const handleExport = (type) => { alert(`Exporting as ${type}... (Mock)`); setExportOpen(false) }

  const handleUpdateStudentRecords = (studentId, newRecords) => {
    const leave = newRecords.filter(r => r.status === 'LEAVE').length
    const absent = newRecords.filter(r => r.status === 'ABSENT').length
    const total = newRecords.length

    setSummaries(prev => prev.map(s => {
      if (s.studentId === studentId) {
        return { ...s, records: newRecords, total, leave, absent }
      }
      return s
    }))

    setSelectedStudent(prev => {
      if (prev && prev.studentId === studentId) {
        return { ...prev, records: newRecords, total, leave, absent }
      }
      return prev
    })
  }

  // ── Render Detail Page ──
  if (selectedStudent) {
    return (
      <StudentDetailPage
        student={selectedStudent}
        onBack={() => setSelectedStudent(null)}
        onUpdateRecords={(newRecords) => handleUpdateStudentRecords(selectedStudent.studentId, newRecords)}
      />
    )
  }

  // ── Render Main Page ──
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 w-full">

        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">សិស្សមានអវត្តមាន</div>
          </div>
          <div className="text-3xl font-black text-slate-800 relative z-10">{summaries.length}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">នាក់</div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <ShieldAlert size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">ស្ថានភាពគ្រោះថ្នាក់</div>
          </div>
          <div className="text-3xl font-black text-rose-500 relative z-10">{dangerCount}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">នាក់ (≥ 15 ដង)</div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <AlertCircle size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">ស្ថានភាពប្រុងប្រយ័ត្ន</div>
          </div>
          <div className="text-3xl font-black text-amber-500 relative z-10">{warningCount}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">នាក់ (8–14 ដង)</div>
        </div>

      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 flex flex-col relative shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/30">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">

            {/* Search */}
            <div className="relative w-full lg:w-[350px] group">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="ស្វែងរកឈ្មោះ ឬអត្តលេខសិស្ស..."
                className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-9 pr-4 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              />
            </div>

            {/* Export */}
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
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-50 overflow-hidden py-2">
                  <button onClick={() => handleExport('PDF')}   className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group"><FileText  size={16} className="text-rose-500    group-hover:scale-110 transition-transform" /> Export as PDF</button>
                  <button onClick={() => handleExport('Excel')} className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group"><FileCode  size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" /> Export as Excel</button>
                  <button onClick={() => handleExport('Word')}  className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group"><FileImage size={16} className="text-blue-500   group-hover:scale-110 transition-transform" /> Export as Word</button>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[520px]">
            <SearchableDropdown options={classOptions}        value={filterClass}  onChange={(v) => { setFilterClass(v);  setCurrentPage(1) }} placeholder="ជ្រើសរើសថ្នាក់"    icon={Users} />
            <SearchableDropdown options={statusFilterOptions} value={filterStatus} onChange={(v) => { setFilterStatus(v); setCurrentPage(1) }} placeholder="ជ្រើសរើសស្ថានភាព" />
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto custom-scrollbar relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] z-30">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-sm" />
                <div className="text-[13px] font-bold text-indigo-600">កំពុងទាញទិន្នន័យ...</div>
              </div>
            </div>
          )}

          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student ID</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[200px]">ឈ្មោះសិស្ស</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ថ្នាក់</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">អវត្តមានសរុប</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">មានច្បាប់</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">គ្មានច្បាប់</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">ស្ថានភាព</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((student) => {
                const info   = getStatusInfo(student.total)
                const colors = colorMap[info.color]
                const StatusIcon = info.icon
                return (
                  <tr key={student.studentId} className="hover:bg-slate-50/80 transition-colors group">

                    {/* Student ID */}
                    <td className="py-4 px-5">
                      <span className="text-[12px] font-bold text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-lg">
                        {student.studentId}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-[13px] shadow-sm flex-shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-[13px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {student.name}
                        </span>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[12px]">
                        {student.class}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-4 px-5 text-center">
                      <span className="text-[15px] font-black text-slate-800">{student.total}</span>
                      <span className="text-[10px] text-slate-400 font-medium ml-1">ដង</span>
                    </td>

                    {/* Leave */}
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-600 font-bold text-[12px] border border-amber-100">
                        {student.leave}
                      </span>
                    </td>

                    {/* Absent */}
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-bold text-[12px] border border-rose-100">
                        {student.absent}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${colors.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${colors.pulse ? 'animate-pulse' : ''} inline-block`} />
                        {info.label}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold text-[12px] rounded-lg transition-all hover:shadow-md border border-indigo-100 hover:border-indigo-600 group/btn"
                      >
                        <Eye size={13} className="group-hover/btn:scale-110 transition-transform" />
                        Detail
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <Search size={28} className="text-slate-300" />
                      </div>
                      <span className="font-bold text-slate-700 text-[15px]">មិនមានទិន្នន័យត្រូវគ្នានឹងការស្វែងរកទេ</span>
                      <span className="text-[13px] font-medium text-slate-500 mt-1">សូមសាកល្បង Filter ផ្សេងទៀត</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
          <span className="text-[12px] font-medium text-slate-400">
            បង្ហាញ {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} នៃ {filtered.length} សិស្ស
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}><ChevronLeft size={20} strokeWidth={2.5} /></button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-9 h-9 rounded-full font-bold text-[14px] flex items-center justify-center transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.35)]' : 'text-slate-600 hover:bg-slate-100'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}><ChevronRight size={20} strokeWidth={2.5} /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}><ChevronsRight size={20} strokeWidth={2.5} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

