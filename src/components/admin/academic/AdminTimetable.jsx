import { useState, useRef } from 'react'
import {
  Calendar, Clock, BookOpen, Users, Plus, Edit, Trash2,
  Printer, Download, Sparkles, X, Save, CheckCircle2, ChevronDown,
  GraduationCap, AlertCircle, User, MapPin
} from 'lucide-react'

// Color map for subjects to give a vibrant, premium look
const SUBJECT_COLORS = {
  'គណិតវិទ្យា': { bg: 'bg-indigo-50/90', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
  'រូបវិទ្យា': { bg: 'bg-sky-50/90', border: 'border-sky-200', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-700' },
  'គីមីវិទ្យា': { bg: 'bg-emerald-50/90', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  'ជីវវិទ្យា': { bg: 'bg-teal-50/90', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700' },
  'អក្សរសាស្ត្រខ្មែរ': { bg: 'bg-amber-50/90', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800' },
  'ប្រវត្តិវិទ្យា': { bg: 'bg-rose-50/90', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
  'ភាសាអង់គ្លេស': { bg: 'bg-purple-50/90', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  'ពលរដ្ឋវិទ្យា': { bg: 'bg-blue-50/90', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  'ព័ត៌មានវិទ្យា': { bg: 'bg-cyan-50/90', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700' },
  'អប់រំកាយ/កីឡា': { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700', badge: 'bg-slate-200 text-slate-700' },
}

const DEFAULT_COLOR = { bg: 'bg-indigo-50/60', border: 'border-indigo-100', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' }

const DAYS = [
  { id: 'mon', label: 'ច័ន្ទ' },
  { id: 'tue', label: 'អង្គារ' },
  { id: 'wed', label: 'ពុធ' },
  { id: 'thu', label: 'ព្រហស្បតិ៍' },
  { id: 'fri', label: 'សុក្រ' },
  { id: 'sat', label: 'សៅរ៍' }
]

const PERIODS = [
  { id: 1, time: '07:00 - 07:50', label: 'ម៉ោងទី ១' },
  { id: 2, time: '07:50 - 08:40', label: 'ម៉ោងទី ២' },
  { id: 'break', isBreak: true, time: '08:40 - 08:50', label: 'ម៉ោងសម្រាក (១០ នាទី)' },
  { id: 3, time: '08:50 - 09:40', label: 'ម៉ោងទី ៣' },
  { id: 4, time: '09:40 - 10:30', label: 'ម៉ោងទី ៤' },
  { id: 5, time: '10:30 - 11:20', label: 'ម៉ោងទី ៥' },
]

// Homeroom Teachers Map (គ្រូបន្ទុកថ្នាក់)
const CLASS_HOMEROOM_MAP = {
  '12A': 'លោកគ្រូ សាន វិបុល',
  '12B': 'អ្នកគ្រូ ហេង សុផល',
  '11A': 'លោកគ្រូ ចាន់ ណារិន',
  '11B': 'អ្នកគ្រូ កែវ សុខា',
  '10A': 'លោកគ្រូ ឡុង ពិសិដ្ឋ',
  '10B': 'អ្នកគ្រូ ជា ស្រីពៅ',
}

// Mock initial timetable data for Class 12A
const INITIAL_TIMETABLE = {
  '12A': [
    { id: 't1', day: 'mon', period: 1, subject: 'គណិតវិទ្យា', teacher: 'លោកគ្រូ សាន វិបុល', room: 'បន្ទប់ ១២A' },
    { id: 't2', day: 'mon', period: 2, subject: 'គណិតវិទ្យា', teacher: 'លោកគ្រូ សាន វិបុល', room: 'បន្ទប់ ១២A' },
    { id: 't3', day: 'mon', period: 3, subject: 'រូបវិទ្យា',   teacher: 'អ្នកគ្រូ ហេង សុផល', room: 'បន្ទប់ ១២A' },
    { id: 't4', day: 'mon', period: 4, subject: 'គីមីវិទ្យា', teacher: 'លោកគ្រូ ឈុន វឌ្ឍនៈ', room: 'បន្ទប់ពិសោធន៍' },
    { id: 't5', day: 'mon', period: 5, subject: 'ភាសាអង់គ្លេស', teacher: 'អ្នកគ្រូ កែវ ធីតា', room: 'បន្ទប់ ១២A' },

    { id: 't6', day: 'tue', period: 1, subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ សុខ ផល្លា', room: 'បន្ទប់ ១២A' },
    { id: 't7', day: 'tue', period: 2, subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ សុខ ផល្លា', room: 'បន្ទប់ ១២A' },
    { id: 't8', day: 'tue', period: 3, subject: 'ជីវវិទ្យា', teacher: 'អ្នកគ្រូ អ៊ុំ សាវ៉ាន', room: 'បន្ទប់ ១២A' },
    { id: 't9', day: 'tue', period: 4, subject: 'ប្រវត្តិវិទ្យា', teacher: 'លោកគ្រូ ឡុង សារ៉ាត់', room: 'បន្ទប់ ១២A' },
    { id: 't10', day: 'tue', period: 5, subject: 'ពលរដ្ឋវិទ្យា', teacher: 'អ្នកគ្រូ ស៊ឹម ម៉ានី', room: 'បន្ទប់ ១២A' },

    { id: 't11', day: 'wed', period: 1, subject: 'គណិតវិទ្យា', teacher: 'លោកគ្រូ សាន វិបុល', room: 'បន្ទប់ ១២A' },
    { id: 't12', day: 'wed', period: 2, subject: 'រូបវិទ្យា', teacher: 'អ្នកគ្រូ ហេង សុផល', room: 'បន្ទប់ ១២A' },
    { id: 't13', day: 'wed', period: 3, subject: 'គីមីវិទ្យា', teacher: 'លោកគ្រូ ឈុន វឌ្ឍនៈ', room: 'បន្ទប់ពិសោធន៍' },
    { id: 't14', day: 'wed', period: 4, subject: 'ភាសាអង់គ្លេស', teacher: 'អ្នកគ្រូ កែវ ធីតា', room: 'បន្ទប់ ១២A' },
    { id: 't15', day: 'wed', period: 5, subject: 'ព័ត៌មានវិទ្យា', teacher: 'លោកគ្រូ ម៉ែន វិចិត្រ', room: 'បន្ទប់កុំព្យូទ័រ' },

    { id: 't16', day: 'thu', period: 1, subject: 'រូបវិទ្យា', teacher: 'អ្នកគ្រូ ហេង សុផល', room: 'បន្ទប់ ១២A' },
    { id: 't17', day: 'thu', period: 2, subject: 'គីមីវិទ្យា', teacher: 'លោកគ្រូ ឈុន វឌ្ឍនៈ', room: 'បន្ទប់ពិសោធន៍' },
    { id: 't18', day: 'thu', period: 3, subject: 'គណិតវិទ្យា', teacher: 'លោកគ្រូ សាន វិបុល', room: 'បន្ទប់ ១២A' },
    { id: 't19', day: 'thu', period: 4, subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ សុខ ផល្លា', room: 'បន្ទប់ ១២A' },
    { id: 't20', day: 'thu', period: 5, subject: 'អប់រំកាយ/កីឡា', teacher: 'លោកគ្រូ ឌី សុវណ្ណ', room: 'ទីលានកីឡា' },

    { id: 't21', day: 'fri', period: 1, subject: 'ជីវវិទ្យា', teacher: 'អ្នកគ្រូ អ៊ុំ សាវ៉ាន', room: 'បន្ទប់ ១២A' },
    { id: 't22', day: 'fri', period: 2, subject: 'ប្រវត្តិវិទ្យា', teacher: 'លោកគ្រូ ឡុង សារ៉ាត់', room: 'បន្ទប់ ១២A' },
    { id: 't23', day: 'fri', period: 3, subject: 'គណិតវិទ្យា', teacher: 'លោកគ្រូ សាន វិបុល', room: 'បន្ទប់ ១២A' },
    { id: 't24', day: 'fri', period: 4, subject: 'ភាសាអង់គ្លេស', teacher: 'អ្នកគ្រូ កែវ ធីតា', room: 'បន្ទប់ ១២A' },
    { id: 't25', day: 'fri', period: 5, subject: 'ពលរដ្ឋវិទ្យា', teacher: 'អ្នកគ្រូ ស៊ឹម ម៉ានី', room: 'បន្ទប់ ១២A' },

    { id: 't26', day: 'sat', period: 1, subject: 'គណិតវិទ្យា', teacher: 'លោកគ្រូ សាន វិបុល', room: 'បន្ទប់ ១២A' },
    { id: 't27', day: 'sat', period: 2, subject: 'រូបវិទ្យា', teacher: 'អ្នកគ្រូ ហេង សុផល', room: 'បន្ទប់ ១២A' },
    { id: 't28', day: 'sat', period: 3, subject: 'អក្សរសាស្ត្រខ្មែរ', teacher: 'លោកគ្រូ សុខ ផល្លា', room: 'បន្ទប់ ១២A' },
    { id: 't29', day: 'sat', period: 4, subject: 'គីមីវិទ្យា', teacher: 'លោកគ្រូ ឈុន វឌ្ឍនៈ', room: 'បន្ទប់ពិសោធន៍' },
    { id: 't30', day: 'sat', period: 5, subject: 'ជីវវិទ្យា', teacher: 'អ្នកគ្រូ អ៊ុំ សាវ៉ាន', room: 'បន្ទប់ ១២A' },
  ]
}

const AVAILABLE_CLASSES = ['12A', '12B', '11A', '11B', '10A']

const AVAILABLE_SUBJECTS = [
  'គណិតវិទ្យា', 'រូបវិទ្យា', 'គីមីវិទ្យា', 'ជីវវិទ្យា',
  'អក្សរសាស្ត្រខ្មែរ', 'ប្រវត្តិវិទ្យា', 'ភាសាអង់គ្លេស',
  'ពលរដ្ឋវិទ្យា', 'ព័ត៌មានវិទ្យា', 'អប់រំកាយ/កីឡា'
]

export default function AdminTimetable() {
  const [selectedClass, setSelectedClass] = useState('12A')
  const [timetableData, setTimetableData] = useState(INITIAL_TIMETABLE)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [toast, setToast] = useState(null)

  const printRef = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const currentClassSlots = timetableData[selectedClass] || []

  // Calculate quick stats
  const totalSlots = currentClassSlots.length
  const uniqueSubjects = new Set(currentClassSlots.map(s => s.subject)).size
  const uniqueTeachers = new Set(currentClassSlots.map(s => s.teacher)).size

  // Modal Form State
  const [form, setForm] = useState({
    day: 'mon',
    period: 1,
    subject: 'គណិតវិទ្យា',
    teacher: '',
    room: `បន្ទប់ ${selectedClass}`
  })

  const handleOpenAdd = (day = 'mon', period = 1) => {
    setEditingSlot(null)
    setForm({
      day,
      period,
      subject: 'គណិតវិទ្យា',
      teacher: '',
      room: `បន្ទប់ ${selectedClass}`
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (slot) => {
    setEditingSlot(slot)
    setForm({
      day: slot.day,
      period: slot.period,
      subject: slot.subject,
      teacher: slot.teacher,
      room: slot.room
    })
    setModalOpen(true)
  }

  const handleDeleteSlot = (slotId) => {
    const updated = currentClassSlots.filter(s => s.id !== slotId)
    setTimetableData({ ...timetableData, [selectedClass]: updated })
    showToast('បានលុបម៉ោងបង្រៀនចេញពីកាលវិភាគ')
  }

  const handleSaveSlot = (e) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.teacher.trim()) {
      showToast('សូមបំពេញមុខវិជ្ជា និងឈ្មោះគ្រូបង្រៀន')
      return
    }

    if (editingSlot) {
      const updated = currentClassSlots.map(s => s.id === editingSlot.id ? { ...s, ...form } : s)
      setTimetableData({ ...timetableData, [selectedClass]: updated })
      showToast(`បានកែសម្រួលកាលវិភាគមុខវិជ្ជា "${form.subject}"`)
    } else {
      // Check if slot already exists in that day and period
      const existing = currentClassSlots.find(s => s.day === form.day && Number(s.period) === Number(form.period))
      let updated
      if (existing) {
        updated = currentClassSlots.map(s => s.id === existing.id ? { ...s, ...form } : s)
      } else {
        const newSlot = { id: `t_${Date.now()}`, ...form }
        updated = [...currentClassSlots, newSlot]
      }
      setTimetableData({ ...timetableData, [selectedClass]: updated })
      showToast(`បានបន្ថែមមុខវិជ្ជា "${form.subject}" ទៅក្នុងកាលវិភាគ`)
    }
    setModalOpen(false)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10 relative animate-in fade-in duration-300">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-[13px] font-bold border border-slate-700/50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={15} />
          </div>
          <span>{toast}</span>
        </div>
      )}

      {/* ── Top Header & Stats ── */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <Calendar className="text-indigo-600" size={26} />
              <span>កាលវិភាគបង្រៀន & រៀន</span>
            </h1>
            <p className="text-[13px] font-medium text-slate-500 mt-1">
              គ្រប់គ្រង និងតាមដានកាលវិភាគប្រចាំសប្តាហ៍ តាមថ្នាក់ មុខវិជ្ជា និងលោកគ្រូអ្នកគ្រូ
            </p>
          </div>

          {/* Action buttons & Class switcher */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Class Selector Dropdown */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 py-1.5 px-3 rounded-xl shadow-xs">
              <span className="text-[12px] font-bold text-slate-400">ថ្នាក់:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent text-[13px] font-black text-indigo-600 focus:outline-none cursor-pointer"
              >
                {AVAILABLE_CLASSES.map(cls => (
                  <option key={cls} value={cls}>ថ្នាក់ {cls}</option>
                ))}
              </select>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-3.5 rounded-xl font-bold text-[13px] transition-all shadow-xs hover:shadow hover:-translate-y-0.5"
              title="បោះពុម្ពកាលវិភាគ"
            >
              <Printer size={15} className="text-slate-600" />
              <span className="hidden sm:inline">បោះពុម្ព</span>
            </button>

            {/* Add Slot Button */}
            <button
              type="button"
              onClick={() => handleOpenAdd('mon', 1)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-4 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>បន្ថែមម៉ោងរៀន</span>
            </button>
          </div>
        </div>

        {/* 3 Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">ម៉ោងរៀនសរុប/សប្តាហ៍</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalSlots} ម៉ោង</h3>
              <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">៥ ម៉ោង/ថ្ងៃ (កម្មវិធីពេញលេញ)</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Clock size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">មុខវិជ្ជាសរុប</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{uniqueSubjects} មុខវិជ្ជា</h3>
              <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">តាមកម្មវិធីសិក្សាជាតិ</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <BookOpen size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">គ្រូបង្រៀនក្នុងកាលវិភាគ</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{uniqueTeachers} នាក់</h3>
              <p className="text-[11px] font-semibold text-blue-600 mt-0.5">គ្រូមុខវិជ្ជា & បន្ទុកថ្នាក់</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Timetable Weekly Matrix Table ── */}
      <div ref={printRef} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
        {/* Table Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-[15px] font-black text-slate-800">
              កាលវិភាគសិក្សា ថ្នាក់ {selectedClass} (ឆ្នាំសិក្សា ២០២៥-២០២៦)
            </h2>
          </div>
          <span className="text-[12px] font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5">
            <User size={13} className="text-indigo-600" />
            <span>គ្រូបន្ទុកថ្នាក់: {CLASS_HOMEROOM_MAP[selectedClass] || 'លោកគ្រូ សាន វិបុល'}</span>
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-100/70">
                <th className="py-3.5 px-4 w-36 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-center border-r border-slate-200/60">
                  ម៉ោងសិក្សា
                </th>
                {DAYS.map(day => (
                  <th key={day.id} className="py-3.5 px-3 text-[13px] font-black text-slate-700 text-center border-r border-slate-200/60 last:border-r-0">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERIODS.map(period => {
                if (period.isBreak) {
                  return (
                    <tr key="break" className="bg-amber-50/40 border-y border-amber-200/60">
                      <td colSpan={7} className="py-2 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-[12px] font-bold text-amber-800">
                          <Clock size={13} className="text-amber-600" />
                          <span>{period.label} ({period.time})</span>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={period.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Period & Time Column */}
                    <td className="py-3 px-3 text-center border-r border-slate-100 bg-slate-50/30">
                      <div className="text-[12px] font-black text-slate-700">{period.label}</div>
                      <div className="text-[10.5px] font-bold text-slate-400 mt-0.5">{period.time}</div>
                    </td>

                    {/* Day Slots */}
                    {DAYS.map(day => {
                      const slot = currentClassSlots.find(s => s.day === day.id && Number(s.period) === Number(period.id))
                      const color = slot ? (SUBJECT_COLORS[slot.subject] || DEFAULT_COLOR) : null

                      return (
                        <td
                          key={day.id}
                          className="py-2 px-2 border-r border-slate-100 last:border-r-0 align-top relative group min-h-[90px]"
                        >
                          {slot ? (
                            <div className={`${color.bg} border ${color.border} rounded-xl p-2.5 flex flex-col justify-between h-full transition-all group-hover:shadow-sm relative`}>
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className={`text-[12.5px] font-black ${color.text} line-clamp-1`}>
                                    {slot.subject}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mt-1">
                                  <User size={11} className="text-slate-400 flex-shrink-0" />
                                  <span className="truncate">{slot.teacher}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/40 text-[10px] text-slate-400 font-medium">
                                <span className="flex items-center gap-0.5">
                                  <MapPin size={10} />
                                  <span>{slot.room}</span>
                                </span>

                                {/* Quick Action Buttons on hover */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(slot)}
                                    className="p-1 rounded hover:bg-white/80 text-slate-500 hover:text-indigo-600 transition-colors"
                                    title="កែប្រែ"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="p-1 rounded hover:bg-white/80 text-slate-500 hover:text-rose-600 transition-colors"
                                    title="លុប"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenAdd(day.id, period.id)}
                              className="w-full h-20 rounded-xl border-2 border-dashed border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/30 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all opacity-40 group-hover:opacity-100"
                              title="ចុចដើម្បីបន្ថែមមុខវិជ្ជា"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Add / Edit Timetable Slot ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  {editingSlot ? <Edit size={16} /> : <Plus size={18} />}
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800">
                    {editingSlot ? 'កែសម្រួលកាលវិភាគ' : 'បន្ថែមម៉ោងរៀនថ្មី'}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400">
                    ថ្នាក់ {selectedClass} • គ្រូបន្ទុកថ្នាក់: {CLASS_HOMEROOM_MAP[selectedClass] || 'លោកគ្រូ សាន វិបុល'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSlot} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Day */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">ថ្ងៃ</label>
                  <select
                    value={form.day}
                    onChange={e => setForm({ ...form, day: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  >
                    {DAYS.map(d => (
                      <option key={d.id} value={d.id}>ថ្ងៃ{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Period */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">ម៉ោងសិក្សា</label>
                  <select
                    value={form.period}
                    onChange={e => setForm({ ...form, period: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  >
                    <option value={1}>ម៉ោងទី ១ (07:00 - 07:50)</option>
                    <option value={2}>ម៉ោងទី ២ (07:50 - 08:40)</option>
                    <option value={3}>ម៉ោងទី ៣ (08:50 - 09:40)</option>
                    <option value={4}>ម៉ោងទី ៤ (09:40 - 10:30)</option>
                    <option value={5}>ម៉ោងទី ៥ (10:30 - 11:20)</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">មុខវិជ្ជា *</label>
                <select
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-bold text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                >
                  {AVAILABLE_SUBJECTS.map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>

              {/* Teacher Name */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">គ្រូបង្រៀនទទួលបន្ទុក *</label>
                <input
                  type="text"
                  required
                  value={form.teacher}
                  onChange={e => setForm({ ...form, teacher: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  placeholder="ឧ. លោកគ្រូ សាន វិបុល"
                />
              </div>

              {/* Room */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">បន្ទប់រៀន / ទីតាំង</label>
                <input
                  type="text"
                  value={form.room}
                  onChange={e => setForm({ ...form, room: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  placeholder="ឧ. បន្ទប់ ១២A"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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

    </div>
  )
}
