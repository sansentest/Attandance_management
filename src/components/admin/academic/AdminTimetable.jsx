import { useState, useRef, useEffect } from 'react'
import { api, getCachedSchoolName } from '../../../utils/api'
import {
  Clock, BookOpen, Users, Plus, Edit, Trash2,
  Printer, Download, X, Save, CheckCircle2,
  GraduationCap, AlertTriangle, Copy, User,
  Calendar, Coffee, Sparkles, Check, ArrowRight,
  Sun, Sunset, Upload, FileSpreadsheet,
  ChevronDown, FileText, FileCode, FileImage,
  Layers, Clipboard
} from 'lucide-react'
import SearchableDropdown from '../../common/SearchableDropdown'

// Clean Khmer Day names matching table header
const DAYS = [
  { id: 'mon', label: 'ច័ន្ទ' },
  { id: 'tue', label: 'អង្គារ' },
  { id: 'wed', label: 'ពុធ' },
  { id: 'thu', label: 'ព្រហស្បតិ៍' },
  { id: 'fri', label: 'សុក្រ' },
  { id: 'sat', label: 'សៅរ៍' }
]

// All Periods: Continuous 7-11 Morning (NO morning break, NO "ម៉ោងទី") and 2-5 Afternoon
const PERIODS = [
  // ── ព្រឹក (07:00 - 11:00) ──
  { id: 'm1', time: '07:00 - 08:00' },
  { id: 'm2', time: '08:00 - 09:00' },
  { id: 'm3', time: '09:00 - 10:00' },
  { id: 'm4', time: '10:00 - 11:00' },

  // ── សម្រាកថ្ងៃត្រង់ (11:00 - 14:00) ──
  { id: 'break_lunch', isBreak: true, isLunch: true, time: '11:00 - 14:00', label: 'សម្រាកថ្ងៃត្រង់ (11:00 - 14:00)' },

  // ── រសៀល/ថ្ងៃ (14:00 - 17:00) ──
  { id: 'a1', time: '14:00 - 15:00' },
  { id: 'a2', time: '15:00 - 16:00' },
  { id: 'a3', time: '16:00 - 17:00' },
]

// Soft pastel color theme per subject (bg ស្រាលៗ ស្អាតទន់ភ្នែក)
const SUBJECT_THEMES = {
  'គណិតវិទ្យា': {
    bg: 'bg-blue-50/70 hover:bg-blue-50',
    border: 'border-blue-200/70',
    text: 'text-blue-900',
    badge: 'bg-blue-100 text-blue-700',
    icon: 'text-blue-500'
  },
  'ភាសាខ្មែរ': {
    bg: 'bg-emerald-50/70 hover:bg-emerald-50',
    border: 'border-emerald-200/70',
    text: 'text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: 'text-emerald-500'
  },
  'ភាសាអង់គ្លេស': {
    bg: 'bg-indigo-50/70 hover:bg-indigo-50',
    border: 'border-indigo-200/70',
    text: 'text-indigo-900',
    badge: 'bg-indigo-100 text-indigo-700',
    icon: 'text-indigo-500'
  },
  'រូបវិទ្យា': {
    bg: 'bg-violet-50/70 hover:bg-violet-50',
    border: 'border-violet-200/70',
    text: 'text-violet-900',
    badge: 'bg-violet-100 text-violet-700',
    icon: 'text-violet-500'
  },
  'គីមីវិទ្យា': {
    bg: 'bg-amber-50/70 hover:bg-amber-50',
    border: 'border-amber-200/70',
    text: 'text-amber-900',
    badge: 'bg-amber-100 text-amber-700',
    icon: 'text-amber-500'
  },
  'ជីវវិទ្យា': {
    bg: 'bg-teal-50/70 hover:bg-teal-50',
    border: 'border-teal-200/70',
    text: 'text-teal-900',
    badge: 'bg-teal-100 text-teal-700',
    icon: 'text-teal-500'
  },
  'ព័ត៌មានវិទ្យា': {
    bg: 'bg-sky-50/70 hover:bg-sky-50',
    border: 'border-sky-200/70',
    text: 'text-sky-900',
    badge: 'bg-sky-100 text-sky-700',
    icon: 'text-sky-500'
  },
  'ប្រវត្តិវិទ្យា': {
    bg: 'bg-rose-50/70 hover:bg-rose-50',
    border: 'border-rose-200/70',
    text: 'text-rose-900',
    badge: 'bg-rose-100 text-rose-700',
    icon: 'text-rose-500'
  },
  'ពលរដ្ឋវិទ្យា': {
    bg: 'bg-orange-50/70 hover:bg-orange-50',
    border: 'border-orange-200/70',
    text: 'text-orange-900',
    badge: 'bg-orange-100 text-orange-700',
    icon: 'text-orange-500'
  },
  'អប់រំកាយ/កីឡា': {
    bg: 'bg-lime-50/70 hover:bg-lime-50',
    border: 'border-lime-200/70',
    text: 'text-lime-900',
    badge: 'bg-lime-100 text-lime-700',
    icon: 'text-lime-500'
  },
}

const getSubjectTheme = (subject) => {
  return SUBJECT_THEMES[subject] || {
    bg: 'bg-slate-50/80 hover:bg-slate-100/70',
    border: 'border-slate-200/80',
    text: 'text-slate-800',
    badge: 'bg-slate-200/80 text-slate-700',
    icon: 'text-slate-400'
  }
}

// Homeroom Teachers Map (គ្រូបន្ទុកថ្នាក់)
const CLASS_HOMEROOM_MAP = {}

// Initial Timetable (Empty)
const INITIAL_TIMETABLE = {}

const CLASS_OPTIONS = [
  { id: '12A', label: 'ថ្នាក់ 12A' },
  { id: '12B', label: 'ថ្នាក់ 12B' },
  { id: '11A', label: 'ថ្នាក់ 11A' },
  { id: '11B', label: 'ថ្នាក់ 11B' },
  { id: '10A', label: 'ថ្នាក់ 10A' },
  { id: '10B', label: 'ថ្នាក់ 10B' },
]

// Subjects and teachers are loaded dynamically from table subjects (academic.getSubjects)
const DEFAULT_SUBJECT_TEACHERS = {}

// Check if a candidate slot causes a teacher conflict with another class
const checkTeacherConflict = (candidateSlot, currentClassId, allTimetableData, excludeSlotId = null) => {
  if (!candidateSlot || candidateSlot.isLibre || !candidateSlot.teacher || !candidateSlot.teacher.trim()) {
    return null
  }

  const pIdx = PERIODS.findIndex(p => p.id === candidateSlot.period)
  if (pIdx === -1) return null

  // Calculate covered periods of candidate
  const candidatePeriods = []
  let cCount = 0
  for (let i = pIdx; i < PERIODS.length && cCount < (candidateSlot.duration || 1); i++) {
    if (!PERIODS[i].isBreak) {
      candidatePeriods.push(PERIODS[i].id)
      cCount++
    }
  }

  // Iterate over all other classes
  for (const [classKey, slots] of Object.entries(allTimetableData)) {
    if (classKey === currentClassId) continue
    for (const slot of slots) {
      if (slot.id === excludeSlotId || slot.isLibre || !slot.teacher) continue
      if (slot.teacher.trim() === candidateSlot.teacher.trim() && slot.day === candidateSlot.day) {
        const sIdx = PERIODS.findIndex(p => p.id === slot.period)
        if (sIdx === -1) continue
        const slotPeriods = []
        let sCount = 0
        for (let j = sIdx; j < PERIODS.length && sCount < (slot.duration || 1); j++) {
          if (!PERIODS[j].isBreak) {
            slotPeriods.push(PERIODS[j].id)
            sCount++
          }
        }

        const hasOverlap = candidatePeriods.some(cp => slotPeriods.includes(cp))
        if (hasOverlap) {
          const dayObj = DAYS.find(d => d.id === slot.day)
          const periodObj = PERIODS.find(p => p.id === slot.period)
          return {
            class: classKey,
            subject: slot.subject,
            teacher: slot.teacher,
            dayLabel: dayObj ? dayObj.label : slot.day,
            time: periodObj ? periodObj.time : slot.period,
            duration: slot.duration || 1
          }
        }
      }
    }
  }

  return null
}

// ─────────────────────────────────────────────
// Subject & Code Mapping for Cambodian High School Timetables
// ─────────────────────────────────────────────
const CODE_TO_SUBJECT_MAP = {
  // Khmer
  'k': 'ភាសាខ្មែរ', 'kh': 'ភាសាខ្មែរ', 'ខ្មែរ': 'ភាសាខ្មែរ', 'ភាសាខ្មែរ': 'ភាសាខ្មែរ',
  // Math
  'm': 'គណិតវិទ្យា', 'math': 'គណិតវិទ្យា', 'គណិត': 'គណិតវិទ្យា', 'គណិតវិទ្យា': 'គណិតវិទ្យា',
  // Physics
  'p': 'រូបវិទ្យា', 'phy': 'រូបវិទ្យា', 'រូប': 'រូបវិទ្យា', 'រូបវិទ្យា': 'រូបវិទ្យា',
  // Chemistry
  'c': 'គីមីវិទ្យា', 'chem': 'គីមីវិទ្យា', 'គីមី': 'គីមីវិទ្យា', 'គីមីវិទ្យា': 'គីមីវិទ្យា',
  // Biology
  'b': 'ជីវវិទ្យា', 'bio': 'ជីវវិទ្យា', 'ជីវ': 'ជីវវិទ្យា', 'ជីវវិទ្យា': 'ជីវវិទ្យា',
  // History
  'h': 'ប្រវត្តិវិទ្យា', 'hist': 'ប្រវត្តិវិទ្យា', 'ប្រវត្តិ': 'ប្រវត្តិវិទ្យា', 'ប្រវត្តិវិទ្យា': 'ប្រវត្តិវិទ្យា',
  // Geography
  'g': 'ភូមិវិទ្យា', 'geo': 'ភូមិវិទ្យា', 'ភូមិ': 'ភូមិវិទ្យា', 'ភូមិវិទ្យា': 'ភូមិវិទ្យា',
  // Earth Science
  'es': 'ផែនដីវិទ្យា', 'earth': 'ផែនដីវិទ្យា', 'ផែនដី': 'ផែនដីវិទ្យា', 'ផែនដីវិទ្យា': 'ផែនដីវិទ្យា',
  // English / Foreign language
  'e': 'ភាសាអង់គ្លេស', 'eng': 'ភាសាអង់គ្លេស', 'អង់គ្លេស': 'ភាសាអង់គ្លេស', 'ភាសាអង់គ្លេស': 'ភាសាអង់គ្លេស',
  'i': 'ភាសាអង់គ្លេស', 'inter': 'ភាសាអង់គ្លេស',
  // Economics
  'ec': 'សេដ្ឋកិច្ច', 'econ': 'សេដ្ឋកិច្ច', 'សេដ្ឋកិច្ច': 'សេដ្ឋកិច្ច',
  // Physical Education / Sports
  'ed': 'អប់រំកាយ/កីឡា', 'pe': 'អប់រំកាយ/កីឡា', 'កីឡា': 'អប់រំកាយ/កីឡា', 'អប់រំកាយ': 'អប់រំកាយ/កីឡា',
  // Information Technology
  'it': 'ព័ត៌មានវិទ្យា', 'ict': 'ព័ត៌មានវិទ្យា', 'info': 'ព័ត៌មានវិទ្យា', 'ព័ត៌មានវិទ្យា': 'ព័ត៌មានវិទ្យា',
  // Agriculture
  'ag': 'កសិកម្ម', 'agri': 'កសិកម្ម', 'កសិកម្ម': 'កសិកម្ម',
  // Civics / Morality
  'mor': 'ពលរដ្ឋវិទ្យា', 'civ': 'ពលរដ្ឋវិទ្យា', 'ពលរដ្ឋ': 'ពលរដ្ឋវិទ្យា', 'សីលធម៌': 'ពលរដ្ឋវិទ្យា'
}

// Decode Cell Text to Subject and Teacher
function decodeTimetableCell(rawText) {
  if (!rawText) return null
  const trimmed = String(rawText).trim()
  if (!trimmed || trimmed === '—' || trimmed === '-' || trimmed === 'X' || trimmed === 'x') {
    return null
  }
  if (trimmed.includes('(ត)')) {
    return { isContinuation: true }
  }
  if (/ម៉ោងលីប|លីប|ទំនេរ/i.test(trimmed)) {
    return { isLibre: true, subject: 'ម៉ោងលីប', teacher: '—' }
  }

  let cleanSubj = trimmed
  let cleanTeacher = ''

  if (trimmed.includes('\n')) {
    const parts = trimmed.split('\n').map(s => s.trim()).filter(Boolean)
    cleanSubj = parts[0] || trimmed
    cleanTeacher = parts[1] || ''
  } else if (trimmed.includes(' - ')) {
    const parts = trimmed.split(' - ').map(s => s.trim())
    cleanSubj = parts[0] || trimmed
    cleanTeacher = parts[1] || ''
  } else if (trimmed.includes('(') && trimmed.includes(')')) {
    const match = trimmed.match(/^([^(]+)\s*\(([^)]+)\)$/)
    if (match) {
      cleanSubj = match[1].trim()
      const inner = match[2].trim()
      if (!inner.includes('ម៉ោង')) cleanTeacher = inner
    }
  }

  cleanSubj = cleanSubj.replace(/\(?[១1២2]\s*ម៉ោង\)?|\[?[១1២2]\s*ម៉ោង\]?/g, '').trim()

  // Match short code: e.g. K3, M1, P1, C1, B1, H1, G2, Es1, E2, Ec1, Ed1, It2, Ag, I1
  const codeMatch = cleanSubj.match(/^([a-zA-Z]+|\p{Script=Khmer}+)\s*([0-9]+.*)?$/u)
  if (codeMatch) {
    const prefix = codeMatch[1].toLowerCase()
    const numSuffix = codeMatch[2] ? codeMatch[2].trim() : ''
    if (CODE_TO_SUBJECT_MAP[prefix]) {
      const fullSubject = CODE_TO_SUBJECT_MAP[prefix]
      const teacherCode = cleanTeacher || (numSuffix ? `${codeMatch[1].toUpperCase()}${numSuffix}` : (codeMatch[1].length <= 2 ? codeMatch[1].toUpperCase() : ''))
      return { subject: fullSubject, teacher: teacherCode, isLibre: false }
    }
  }

  // Exact or partial match in subject dictionary
  for (const [key, val] of Object.entries(CODE_TO_SUBJECT_MAP)) {
    if (cleanSubj.toLowerCase().includes(key)) {
      return { subject: val, teacher: cleanTeacher, isLibre: false }
    }
  }

  return { subject: cleanSubj, teacher: cleanTeacher, isLibre: false }
}

// ─────────────────────────────────────────────
// Robust CSV / TSV Parser
// ─────────────────────────────────────────────
function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, '').trim()
  const lines = clean.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length === 0) return []

  const delimiter = clean.indexOf('\t') !== -1 && (clean.indexOf(',') === -1 || clean.indexOf('\t') < clean.indexOf(',')) ? '\t' : ','

  const parseLine = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''))
    return result
  }

  const rows = []
  for (let i = 0; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    if (cols.some(c => Boolean(c && c.trim()))) {
      rows.push(cols)
    }
  }
  return rows
}

// ─────────────────────────────────────────────
// Parse XML Spreadsheet 2003 with Multi-Worksheet Support
// ─────────────────────────────────────────────
function parseSpreadsheetXmlWorkbook(xmlText) {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
    const worksheets = Array.from(xmlDoc.getElementsByTagName('Worksheet'))
    if (!worksheets || worksheets.length === 0) return null

    const resultSheets = {}
    worksheets.forEach(ws => {
      const sheetName = ws.getAttribute('ss:Name') || 'Sheet1'
      const rows = Array.from(ws.getElementsByTagName('Row'))
      const matrix = []

      rows.forEach(row => {
        const rowCells = []
        let cIdx = 0
        const cells = Array.from(row.getElementsByTagName('Cell'))
        cells.forEach(cell => {
          if (cell.getAttribute('ss:Index')) {
            cIdx = parseInt(cell.getAttribute('ss:Index'), 10) - 1
          }
          const data = cell.getElementsByTagName('Data')[0]
          rowCells[cIdx] = data ? data.textContent.trim() : ''
          cIdx++
        })
        matrix.push(rowCells)
      })

      resultSheets[sheetName] = matrix
    })

    return resultSheets
  } catch (e) {
    console.error('XML parse error:', e)
    return null
  }
}

// ─────────────────────────────────────────────
// Convert 2D Matrix to Clean Timetable Slots (Error-Free)
// ─────────────────────────────────────────────
function convertMatrixToSlots(matrix, targetClassName = '12B') {
  if (!matrix || matrix.length === 0) return []

  // 1. Find Header Row containing 'ច័ន្ទ' or 'mon'
  let headerRowIdx = -1
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r] || []
    if (row.some(c => /ច័ន្ទ|mon/i.test(c)) && row.some(c => /អង្គារ|tue/i.test(c))) {
      headerRowIdx = r
      break
    }
  }

  if (headerRowIdx === -1) {
    headerRowIdx = matrix.findIndex(r => (r || []).some(c => /ច័ន្ទ|mon|អង្គារ|tue/i.test(c)))
  }

  if (headerRowIdx === -1) return []

  const headerRow = matrix[headerRowIdx]
  const colToDayMap = {}
  headerRow.forEach((cell, cIdx) => {
    const txt = (cell || '').toLowerCase().trim()
    if (/ច័ន្ទ|mon/i.test(txt)) colToDayMap[cIdx] = 'mon'
    else if (/អង្គារ|tue/i.test(txt)) colToDayMap[cIdx] = 'tue'
    else if (/ពុធ|wed/i.test(txt)) colToDayMap[cIdx] = 'wed'
    else if (/ព្រហ|thu/i.test(txt)) colToDayMap[cIdx] = 'thu'
    else if (/សុក្រ|fri/i.test(txt)) colToDayMap[cIdx] = 'fri'
    else if (/សៅរ៍|sat/i.test(txt)) colToDayMap[cIdx] = 'sat'
  })

  const dayKeys = Object.values(colToDayMap)
  if (dayKeys.length === 0) return []

  const morningPeriods = ['m1', 'm2', 'm3', 'm4']
  const afternoonPeriods = ['a1', 'a2', 'a3']

  let isAfternoon = false
  let morningIdx = 0
  let afternoonIdx = 0

  const rawSlotsGrid = {} // key: `${day}_${period}`

  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || []
    if (row.length === 0) continue

    const firstCell = (row[0] || '').trim()

    // Afternoon Divider
    if (/រសៀល|afternoon|lunch|សម្រាក/i.test(firstCell) || row.some(c => /ពេលរសៀល/i.test(c))) {
      isAfternoon = true
      continue
    }

    // Stop on legend or signatures
    if (/កំណត់សម្គាល់|កូដមុខវិជ្ជា|\*|សម្គាល់|បានឃើញ|ហត្ថលេខា/i.test(firstCell)) {
      break
    }

    let periodKey = null
    if (isAfternoon) {
      if (afternoonIdx < afternoonPeriods.length) {
        periodKey = afternoonPeriods[afternoonIdx]
        afternoonIdx++
      }
    } else {
      if (morningIdx < morningPeriods.length) {
        periodKey = morningPeriods[morningIdx]
        morningIdx++
      } else {
        isAfternoon = true
        if (afternoonIdx < afternoonPeriods.length) {
          periodKey = afternoonPeriods[afternoonIdx]
          afternoonIdx++
        }
      }
    }

    if (!periodKey) continue

    for (const [colIdxStr, dayId] of Object.entries(colToDayMap)) {
      const cIdx = parseInt(colIdxStr, 10)
      const cellText = (row[cIdx] || '').trim()
      const decoded = decodeTimetableCell(cellText)
      if (decoded) {
        rawSlotsGrid[`${dayId}_${periodKey}`] = decoded
      }
    }
  }

  // Assemble into slots with smart 2-hour merging
  const finalSlots = []
  const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const allPeriods = ['m1', 'm2', 'm3', 'm4', 'a1', 'a2', 'a3']

  allDays.forEach(dayId => {
    for (let pIdx = 0; pIdx < allPeriods.length; pIdx++) {
      const pKey = allPeriods[pIdx]
      const current = rawSlotsGrid[`${dayId}_${pKey}`]
      if (!current) continue
      if (current.isContinuation) continue

      const pObj = PERIODS.find(p => p.id === pKey)
      const dayObj = DAYS.find(d => d.id === dayId)

      let duration = 1

      // Automatically combine consecutive slots with same subject as 2 hours
      const canMergeWithNext = (pKey === 'm1' || pKey === 'm3' || pKey === 'a1')
      if (canMergeWithNext && pIdx + 1 < allPeriods.length) {
        const nextPKey = allPeriods[pIdx + 1]
        const next = rawSlotsGrid[`${dayId}_${nextPKey}`]
        if (next) {
          if (next.isContinuation || (!current.isLibre && !next.isLibre && next.subject === current.subject && (next.teacher === current.teacher || !next.teacher || !current.teacher))) {
            duration = 2
            rawSlotsGrid[`${dayId}_${nextPKey}`] = { isContinuation: true }
          }
        }
      }

      const autoCode = `SCH-${targetClassName}-${String(finalSlots.length + 1).padStart(3, '0')}`
      finalSlots.push({
        id: autoCode,
        autoCode,
        day: dayId,
        period: pKey,
        dayLabel: dayObj ? dayObj.label : dayId,
        timeLabel: pObj ? pObj.time : pKey,
        duration,
        subject: current.subject,
        teacher: current.teacher || '',
        isLibre: Boolean(current.isLibre)
      })
    }
  })

  return finalSlots
}

// ─────────────────────────────────────────────
// XML Spreadsheet 2003 Generator (Styled like school paper timetable)
// ─────────────────────────────────────────────
function generateSpreadsheetMLWorkbook(sheets) {
  const stylesXml = `
  <Styles>
   <Style ss:ID="Default" ss:Name="Normal">
    <Alignment ss:Vertical="Center"/>
    <Borders/>
    <Font ss:FontName="Khmer OS Siemreap" ss:Size="10" ss:Color="#000000"/>
    <Interior/>
    <NumberFormat/>
    <Protection/>
   </Style>
   <Style ss:ID="TitleKingdom">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Font ss:FontName="Khmer OS Muol Light" ss:Size="13" ss:Bold="1" ss:Color="#0f172a"/>
   </Style>
   <Style ss:ID="TitleMotto">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Font ss:FontName="Khmer OS Siemreap" ss:Size="11" ss:Bold="1" ss:Color="#334155"/>
   </Style>
   <Style ss:ID="TitleSchedule">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Font ss:FontName="Khmer OS Muol Light" ss:Size="12" ss:Bold="1" ss:Color="#1e3a8a"/>
   </Style>
   <Style ss:ID="MetaLeft">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    <Font ss:FontName="Khmer OS Siemreap" ss:Size="10.5" ss:Bold="1" ss:Color="#1e293b"/>
   </Style>
   <Style ss:ID="MetaRight">
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Font ss:FontName="Khmer OS Siemreap" ss:Size="10.5" ss:Bold="1" ss:Color="#1e293b"/>
   </Style>
   <Style ss:ID="ColHeader">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748b"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748b"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748b"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748b"/>
    </Borders>
    <Font ss:FontName="Khmer OS Siemreap" ss:Size="10" ss:Bold="1" ss:Color="#0f172a"/>
    <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
   </Style>
   <Style ss:ID="TimeCell">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94a3b8"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94a3b8"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94a3b8"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94a3b8"/>
    </Borders>
    <Font ss:FontName="Khmer OS Siemreap" ss:Size="9.5" ss:Bold="1" ss:Color="#334155"/>
    <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   </Style>
   <Style ss:ID="SlotCell">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
    </Borders>
    <Font ss:FontName="Khmer OS Siemreap" ss:Size="10" ss:Bold="1" ss:Color="#1e293b"/>
   </Style>
   <Style ss:ID="AfternoonBanner">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
    </Borders>
    <Font ss:FontName="Khmer OS Siemreap" ss:Size="10.5" ss:Bold="1" ss:Color="#92400e"/>
    <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   </Style>
   <Style ss:ID="LegendHead">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    <Font ss:FontName="Khmer OS Siemreap" ss:Size="9.5" ss:Bold="1" ss:Color="#4338ca"/>
   </Style>
   <Style ss:ID="LegendText">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    <Font ss:FontName="Khmer OS Siemreap" ss:Size="9" ss:Color="#475569"/>
   </Style>
   <Style ss:ID="LegendHint">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    <Font ss:FontName="Khmer OS Siemreap" ss:Size="8.5" ss:Italic="1" ss:Color="#64748b"/>
   </Style>
  </Styles>`

  const worksheetsXml = sheets.map(sheet => {
    const slots = sheet.slots || []
    const twoHourContinuations = {}

    const morningPeriods = [
      { id: 'm1', label: '០៧:០០ ដល់ ០៨:០០' },
      { id: 'm2', label: '០៨:០០ ដល់ ០៩:០០' },
      { id: 'm3', label: '០៩:០០ ដល់ ១០:០០' },
      { id: 'm4', label: '១០:០០ ដល់ ១១:០០' }
    ]

    const afternoonPeriods = [
      { id: 'a1', label: '១៤:០០ ដល់ ១៥:០០' },
      { id: 'a2', label: '១៥:០០ ដល់ ១៦:០០' },
      { id: 'a3', label: '១៦:០០ ដល់ ១៧:០០' }
    ]

    const buildRow = (period) => {
      let cells = `<Cell ss:StyleID="TimeCell"><Data ss:Type="String">${period.label}</Data></Cell>`
      DAYS.forEach(day => {
        if (twoHourContinuations[`${day.id}_${period.id}`]) {
          const cont = twoHourContinuations[`${day.id}_${period.id}`]
          cells += `<Cell ss:StyleID="SlotCell"><Data ss:Type="String">${cont.text} (ត)</Data></Cell>`
          return
        }

        const slot = slots.find(s => s.day === day.id && s.period === period.id)
        if (!slot) {
          cells += `<Cell ss:StyleID="SlotCell"><Data ss:Type="String">—</Data></Cell>`
        } else if (slot.isLibre) {
          cells += `<Cell ss:StyleID="SlotCell"><Data ss:Type="String">ម៉ោងលីប</Data></Cell>`
        } else {
          const teacherPart = slot.teacher ? `\n${slot.teacher}` : ''
          const is2H = slot.duration === 2
          const cellContent = `${slot.subject}${teacherPart}`
          cells += `<Cell ss:StyleID="SlotCell"><Data ss:Type="String">${cellContent}</Data></Cell>`

          if (is2H) {
            const allP = [...morningPeriods, ...afternoonPeriods]
            const pIdx = allP.findIndex(p => p.id === period.id)
            if (pIdx !== -1 && pIdx + 1 < allP.length) {
              twoHourContinuations[`${day.id}_${allP[pIdx + 1].id}`] = { text: slot.subject }
            }
          }
        }
      })
      cells += `<Cell ss:StyleID="SlotCell"><Data ss:Type="String"></Data></Cell>`
      return `<Row ss:Height="26">${cells}</Row>`
    }

    const morningRows = morningPeriods.map(buildRow).join('\n    ')
    const afternoonRows = afternoonPeriods.map(buildRow).join('\n    ')

    return `
  <Worksheet ss:Name="${sheet.name.replace(/[/\\?*[\]]/g, '_')}">
   <Table ss:DefaultRowHeight="24">
    <Column ss:Width="115"/>
    <Column ss:Width="95"/>
    <Column ss:Width="95"/>
    <Column ss:Width="95"/>
    <Column ss:Width="95"/>
    <Column ss:Width="95"/>
    <Column ss:Width="95"/>
    <Column ss:Width="80"/>

    <Row ss:Height="26">
     <Cell ss:MergeAcross="7" ss:StyleID="TitleKingdom"><Data ss:Type="String">ព្រះរាជាណាចក្រកម្ពុជា</Data></Cell>
    </Row>
    <Row ss:Height="22">
     <Cell ss:MergeAcross="7" ss:StyleID="TitleMotto"><Data ss:Type="String">ជាតិ  សាសនា  ព្រះមហាក្សត្រ</Data></Cell>
    </Row>
    <Row ss:Height="26">
     <Cell ss:MergeAcross="7" ss:StyleID="TitleSchedule"><Data ss:Type="String">កាលវិភាគប្រចាំសប្តាហ៍</Data></Cell>
    </Row>
    <Row ss:Height="10"><Cell ss:MergeAcross="7"/></Row>

    <Row ss:Height="24">
     <Cell ss:MergeAcross="3" ss:StyleID="MetaLeft"><Data ss:Type="String">ថ្នាក់៖ ${sheet.name}</Data></Cell>
     <Cell ss:MergeAcross="3" ss:StyleID="MetaRight"><Data ss:Type="String">បន្ទុក៖ ${sheet.teacher || '........................'}</Data></Cell>
    </Row>
    <Row ss:Height="8"><Cell ss:MergeAcross="7"/></Row>

    <Row ss:Height="28">
     <Cell ss:StyleID="ColHeader"><Data ss:Type="String">ម៉ោងបង្រៀន</Data></Cell>
     <Cell ss:StyleID="ColHeader"><Data ss:Type="String">ច័ន្ទ</Data></Cell>
     <Cell ss:StyleID="ColHeader"><Data ss:Type="String">អង្គារ</Data></Cell>
     <Cell ss:StyleID="ColHeader"><Data ss:Type="String">ពុធ</Data></Cell>
     <Cell ss:StyleID="ColHeader"><Data ss:Type="String">ព្រហស្បតិ៍</Data></Cell>
     <Cell ss:StyleID="ColHeader"><Data ss:Type="String">សុក្រ</Data></Cell>
     <Cell ss:StyleID="ColHeader"><Data ss:Type="String">សៅរ៍</Data></Cell>
     <Cell ss:StyleID="ColHeader"><Data ss:Type="String">ផ្សេងៗ</Data></Cell>
    </Row>

    ${morningRows}

    <Row ss:Height="24">
     <Cell ss:MergeAcross="7" ss:StyleID="AfternoonBanner"><Data ss:Type="String">ពេលរសៀល</Data></Cell>
    </Row>

    ${afternoonRows}

    <Row ss:Height="12"><Cell ss:MergeAcross="7"/></Row>

    <Row ss:Height="20">
     <Cell ss:MergeAcross="7" ss:StyleID="LegendHead"><Data ss:Type="String">* កំណត់សម្គាល់កូដមុខវិជ្ជាសម្រាប់ប្រធានថ្នាក់ក្នុងការបំពេញ៖</Data></Cell>
    </Row>
    <Row ss:Height="18">
     <Cell ss:MergeAcross="7" ss:StyleID="LegendText"><Data ss:Type="String">K = ភាសាខ្មែរ | M = គណិតវិទ្យា | P = រូបវិទ្យា | C = គីមីវិទ្យា | B = ជីវវិទ្យា | H = ប្រវត្តិវិទ្យា | G = ភូមិវិទ្យា</Data></Cell>
    </Row>
    <Row ss:Height="18">
     <Cell ss:MergeAcross="7" ss:StyleID="LegendText"><Data ss:Type="String">Es = ផែនដីវិទ្យា | E / I = ភាសាអង់គ្លេស | Ec = សេដ្ឋកិច្ច | Ed = អប់រំកាយ/កីឡា | It = ព័ត៌មានវិទ្យា | Ag = កសិកម្ម | X = ទំនេរ</Data></Cell>
    </Row>
    <Row ss:Height="18">
     <Cell ss:MergeAcross="7" ss:StyleID="LegendHint"><Data ss:Type="String">(ប្រធានថ្នាក់អាចសរសេរកូដកាត់ ឧ. K3, M1, P1... ឬសរសេរឈ្មោះពេញ ឧ. ភាសាខ្មែរ - K3។ ប្រព័ន្ធនឹងស្គាល់មុខវិជ្ជា និងគ្រូស្វ័យប្រវត្តិ)</Data></Cell>
    </Row>
   </Table>
  </Worksheet>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>${getCachedSchoolName()}</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 ${stylesXml}
 ${worksheetsXml}
</Workbook>`
}

export default function AdminTimetable() {
  const [selectedClass, setSelectedClass] = useState(() => {
    try {
      const raw = localStorage.getItem('school_classes_cache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].name
      }
    } catch (e) {}
    return ''
  })
  const [timetableData, setTimetableData] = useState(() => {
    try {
      const raw = localStorage.getItem('school_timetable_cache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          return parsed
        }
      }
    } catch (e) {}
    return {}
  })

  const [classesList, setClassesList] = useState(() => {
    try {
      const raw = localStorage.getItem('school_classes_cache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {}
    return []
  })

  const [classOptions, setClassOptions] = useState(() => {
    try {
      const raw = localStorage.getItem('school_classes_cache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed.map(c => ({ id: c.name, label: c.name.startsWith('ថ្នាក់') ? c.name : `ថ្នាក់ ${c.name}` }))
        }
      }
    } catch (e) {}
    return []
  })

  // Subjects loaded dynamically from table subjects (academic.getSubjects)
  const [subjectsList, setSubjectsList] = useState(() => {
    try {
      const raw = localStorage.getItem('school_subjects_cache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {}
    return []
  })

  const dynamicSubjects = subjectsList.map(s => typeof s === 'string' ? s : s.name).filter(Boolean)

  // Background SWR sync from Firestore
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        const [ttRes, clRes, sbRes] = await Promise.all([
          api('timetable.getAll'),
          api('academic.getClasses'),
          api('academic.getSubjects')
        ])

        if (isMounted) {
          if (ttRes && ttRes.success && ttRes.data) {
            setTimetableData(ttRes.data)
          }
          if (clRes && clRes.success && Array.isArray(clRes.data)) {
            setClassesList(clRes.data)
            const opts = clRes.data.map(c => ({ id: c.name, label: c.name.startsWith('ថ្នាក់') ? c.name : `ថ្នាក់ ${c.name}` }))
            setClassOptions(opts)
            if (clRes.data.length > 0) {
              setSelectedClass(prev => prev && clRes.data.some(c => c.name === prev) ? prev : clRes.data[0].name)
            } else {
              setSelectedClass('')
            }
          } else {
            setClassesList([])
            setClassOptions([])
            setSelectedClass('')
          }

          if (sbRes && sbRes.success && Array.isArray(sbRes.data)) {
            setSubjectsList(sbRes.data)
            try {
              localStorage.setItem('school_subjects_cache', JSON.stringify(sbRes.data))
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Failed to background sync timetable:', err)
      }
    }
    fetchData()
    return () => { isMounted = false }
  }, [])

  // Modals & Form
  const [modalOpen, setModalOpen] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [targetCopyClass, setTargetCopyClass] = useState('12B')
  const [editingSlot, setEditingSlot] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, slot: null })
  const [clearModalOpen, setClearModalOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Import Modal State with Multi-Sheet & Paste support
  const [importModal, setImportModal] = useState({
    open: false,
    parsedData: [],
    isUploaded: false,
    fileName: '',
    availableSheets: [],
    selectedSheet: '',
    rawWorkbookData: null,
    pasteMode: false,
    pasteText: ''
  })
  const fileInputRef = useRef(null)

  const printRef = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const currentClassSlots = timetableData[selectedClass] || []

  // Stats calculation
  const studySlots = currentClassSlots.filter(s => !s.isLibre && s.subject !== 'ម៉ោងលីប')
  const totalStudyHours = studySlots.reduce((acc, s) => acc + (s.duration || 1), 0)
  const uniqueSubjects = new Set(studySlots.map(s => s.subject)).size
  const uniqueTeachers = new Set(studySlots.filter(s => s.teacher).map(s => s.teacher)).size
  const currentClassObj = classesList.find(c => 
    c.name === selectedClass || 
    c.name === `ថ្នាក់ ${selectedClass}` || 
    c.name?.replace('ថ្នាក់ ', '') === selectedClass ||
    c.id === selectedClass
  )
  const homeroomTeacher = selectedClass ? (currentClassObj?.teacher || 'មិនទាន់មានគ្រូបន្ទុក') : '—'

  // Modal Form State & Mode ('full' from top button, 'cell' from timetable cell click)
  const [modalMode, setModalMode] = useState('full')
  const [form, setForm] = useState({
    day: 'mon',
    period: 'm1',
    duration: 1, // 1 or 2 (2H merged)
    isLibre: false,
    subject: '',
    teacher: ''
  })

  // Open Full Add Modal from Top Button (with Day & Time Pickers)
  const handleOpenAdd = (day = 'mon', period = 'm1') => {
    setEditingSlot(null)
    setModalMode('full')
    const defaultSubj = dynamicSubjects.length > 0 ? dynamicSubjects[0] : ''
    setForm({
      day,
      period: period.startsWith('break') ? 'm1' : period,
      duration: 1,
      isLibre: false,
      subject: defaultSubj,
      teacher: ''
    })
    setModalOpen(true)
  }

  // Open Cell Add Modal (Clicking directly on an empty cell - only Type, Duration, Subject, Teacher)
  const handleOpenCellAdd = (day, period) => {
    setEditingSlot(null)
    setModalMode('cell')
    const defaultSubj = dynamicSubjects.length > 0 ? dynamicSubjects[0] : ''
    setForm({
      day,
      period: period.startsWith('break') ? 'm1' : period,
      duration: 1,
      isLibre: false,
      subject: defaultSubj,
      teacher: ''
    })
    setModalOpen(true)
  }

  // Handle Quick Select Subject
  const handleSelectSubject = (subj) => {
    setForm(prev => ({
      ...prev,
      subject: subj,
      teacher: prev.teacher
    }))
  }

  // Open Edit Modal from cell
  const handleOpenEdit = (slot) => {
    setEditingSlot(slot)
    setModalMode('cell')
    setForm({
      day: slot.day,
      period: slot.period,
      duration: slot.duration || 1,
      isLibre: slot.isLibre || slot.subject === 'ម៉ោងលីប',
      subject: slot.isLibre ? 'ម៉ោងលីប' : slot.subject,
      teacher: slot.teacher || ''
    })
    setModalOpen(true)
  }

  // Delete Slot
  const handleConfirmDelete = () => {
    if (!deleteModal.slot) return
    const updated = currentClassSlots.filter(s => s.id !== deleteModal.slot.id)
    setTimetableData(prev => ({ ...prev, [selectedClass]: updated }))
    api('timetable.save', { classId: selectedClass, slots: updated })
    showToast(`បានលុបម៉ោងសិក្សាដោយជោគជ័យ`)
    setDeleteModal({ open: false, slot: null })
  }

  // Get next period sequence for fast continuous entry
  const getNextSlot = (currentDay, currentPeriod, duration = 1) => {
    const periodOrder = ['m1', 'm2', 'm3', 'm4', 'a1', 'a2', 'a3']
    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const pIdx = periodOrder.indexOf(currentPeriod)
    const nextPIdx = pIdx + duration
    if (nextPIdx >= 0 && nextPIdx < periodOrder.length) {
      return { day: currentDay, period: periodOrder[nextPIdx] }
    } else {
      const dIdx = dayOrder.indexOf(currentDay)
      const nextDay = dayOrder[(dIdx + 1) % dayOrder.length]
      return { day: nextDay, period: 'm1' }
    }
  }

  // Save Slot (Add or Edit, with optional save-and-next)
  const handleSaveSlot = (e, andNext = false) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!form.isLibre && !form.subject.trim()) {
      showToast('សូមជ្រើសរើស ឬវាយបញ្ចូលឈ្មោះមុខវិជ្ជា')
      return
    }

    const payload = {
      day: form.day,
      period: form.period,
      duration: Number(form.duration) || 1,
      isLibre: form.isLibre,
      subject: form.isLibre ? 'ម៉ោងលីប' : form.subject.trim(),
      teacher: form.isLibre ? '' : (form.teacher ? form.teacher.trim() : '')
    }

    const conflict = payload.teacher ? checkTeacherConflict(payload, selectedClass, timetableData, editingSlot ? editingSlot.id : null) : null

    let updatedSlots
    if (editingSlot) {
      updatedSlots = currentClassSlots.map(s => s.id === editingSlot.id ? { ...s, ...payload } : s)
      setTimetableData(prev => ({ ...prev, [selectedClass]: updatedSlots }))
      api('timetable.save', { classId: selectedClass, slots: updatedSlots })
      showToast(conflict
        ? `បានកែសម្រួល (⚠️ ការព្រមាន៖ ${payload.teacher} ជាន់ម៉ោងនៅថ្នាក់ ${conflict.class})`
        : `បានកែសម្រួលកាលវិភាគដោយជោគជ័យ`)
    } else {
      const existing = currentClassSlots.find(s => s.day === form.day && s.period === form.period)
      if (existing) {
        updatedSlots = currentClassSlots.map(s => s.id === existing.id ? { ...s, ...payload } : s)
      } else {
        const newSlot = { id: `t_${Date.now()}`, ...payload }
        updatedSlots = [...currentClassSlots, newSlot]
      }
      setTimetableData(prev => ({ ...prev, [selectedClass]: updatedSlots }))
      api('timetable.save', { classId: selectedClass, slots: updatedSlots })
      showToast(conflict
        ? `បានរក្សាទុក (⚠️ ការព្រមាន៖ ${payload.teacher} ជាន់ម៉ោងនៅថ្នាក់ ${conflict.class})`
        : (form.isLibre ? 'បានកំណត់ជាម៉ោងលីប' : `បានបន្ថែមមុខវិជ្ជា "${form.subject}"`))
    }

    if (andNext) {
      const next = getNextSlot(form.day, form.period, payload.duration)
      const nextExisting = updatedSlots.find(s => s.day === next.day && s.period === next.period)
      if (nextExisting) {
        setEditingSlot(nextExisting)
        setForm({
          day: next.day,
          period: next.period,
          duration: nextExisting.duration || 1,
          isLibre: nextExisting.isLibre || nextExisting.subject === 'ម៉ោងលីប',
          subject: nextExisting.subject,
          teacher: nextExisting.teacher || ''
        })
      } else {
        setEditingSlot(null)
        const defaultSubj = form.isLibre ? (dynamicSubjects[0] || '') : form.subject
        setForm({
          day: next.day,
          period: next.period,
          duration: 1,
          isLibre: false,
          subject: defaultSubj,
          teacher: ''
        })
      }
    } else {
      setModalOpen(false)
    }
  }

  // Copy Schedule from Current Class to Target Class
  const handleExecuteCopy = () => {
    if (!targetCopyClass || targetCopyClass === selectedClass) {
      showToast('សូមជ្រើសរើសថ្នាក់ដែលត្រូវចម្លងទៅ')
      return
    }

    const cloned = currentClassSlots.map(slot => ({
      ...slot,
      id: `copy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }))

    setTimetableData(prev => ({
      ...prev,
      [targetCopyClass]: cloned
    }))
    api('timetable.copy', { fromClassId: selectedClass, toClassId: targetCopyClass })

    showToast(`បានចម្លងកាលវិភាគពី ថ្នាក់ ${selectedClass} ទៅ ថ្នាក់ ${targetCopyClass} ដោយជោគជ័យ!`)
    setCopyModalOpen(false)
  }

  // Clear / Reset Timetable for current class
  const handleExecuteClear = () => {
    setTimetableData(prev => ({
      ...prev,
      [selectedClass]: []
    }))
    api('timetable.clear', { classId: selectedClass })
    setClearModalOpen(false)
    showToast(`បានសម្អាតកាលវិភាគថ្នាក់ ${selectedClass} ដោយជោគជ័យ!`)
  }

  // Print
  const handlePrint = () => {
    window.print()
  }

  // Export Schedule as PDF / Excel / Word (Matching the actual weekly timetable matrix grid)
  const handleExport = (type) => {
    const dayNameMap = { mon: 'ច័ន្ទ', tue: 'អង្គារ', wed: 'ពុធ', thu: 'ព្រហស្បតិ៍', fri: 'សុក្រ', sat: 'សៅរ៍' }
    const periodMap = {}
    PERIODS.forEach(p => {
      if (p.time) periodMap[p.id] = p.time
    })

    const title = `កាលវិភាគបង្រៀននិងរៀន - ថ្នាក់ ${selectedClass}`
    const subtitle = `ឆ្នាំសិក្សា ២០២៥ - ២០២៦ | គ្រូបន្ទុកថ្នាក់៖ ${homeroomTeacher || 'មិនទាន់កំណត់'} | សរុបម៉ោងសិក្សា៖ ${totalStudyHours} ម៉ោង/សប្តាហ៍`

    if (type === 'Excel') {
      const sheet = {
        name: selectedClass,
        teacher: homeroomTeacher !== '—' && homeroomTeacher !== 'មិនទាន់មានគ្រូបន្ទុក' ? homeroomTeacher : '',
        slots: currentClassSlots
      }
      const xmlContent = generateSpreadsheetMLWorkbook([sheet])
      const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `កាលវិភាគ_ថ្នាក់_${selectedClass}_${new Date().toISOString().slice(0, 10)}.xls`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showToast(`បានទាញយកកាលវិភាគថ្នាក់ ${selectedClass} ជា Excel (.xls) តាមទម្រង់ក្រដាសសាលា`)
      return
    }

    if (type === 'ExcelAllSheets') {
      const allClassSheets = (classOptions && classOptions.length > 0 ? classOptions : CLASS_OPTIONS).map(c => {
        const cObj = classesList.find(cls => cls.name === c.id)
        return {
          name: c.id,
          teacher: cObj?.teacher || '',
          slots: timetableData[c.id] || []
        }
      })
      const xmlContent = generateSpreadsheetMLWorkbook(allClassSheets)
      const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `កាលវិភាគ_គ្រប់ថ្នាក់_តាមSheets_${new Date().toISOString().slice(0, 10)}.xls`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showToast('បានទាញយកកាលវិភាគគ្រប់ថ្នាក់ជា Excel (.xls) ដោយមាន Sheets សម្រាប់ថ្នាក់នីមួយៗ!')
      return
    }

    // ── Build Weekly Matrix Grid (Time + 6 Days) for Word & PDF matching the actual timetable format ──
    const covered = {}
    currentClassSlots.forEach(slot => {
      if (slot.duration && slot.duration > 1) {
        const pIdx = PERIODS.findIndex(p => p.id === slot.period)
        if (pIdx !== -1) {
          let coveredCount = 1
          for (let i = pIdx + 1; i < PERIODS.length && coveredCount < slot.duration; i++) {
            if (!PERIODS[i].isBreak) {
              covered[`${slot.day}_${PERIODS[i].id}`] = true
              coveredCount++
            }
          }
        }
      }
    })

    const buildMatrixRows = (isWordDoc = false) => {
      let thead = `<tr>
        <th style="width: 14%; text-align: center; vertical-align: middle; padding: 10px 4px; background-color: #f8fafc; color: #334155; font-weight: bold; border: 1px solid #94a3b8; font-size: 11pt;">
          ពេលវេលា
        </th>`
      DAYS.forEach(day => {
        thead += `
        <th style="width: 14.33%; text-align: center; vertical-align: middle; padding: 10px 4px; background-color: #f8fafc; color: #1e293b; font-weight: bold; border: 1px solid #94a3b8; font-size: 11pt;">
          ${day.label}
        </th>`
      })
      thead += `</tr>`

      let tbody = ''
      PERIODS.forEach(period => {
        if (period.isLunch) {
          tbody += `
          <tr style="background-color: #f1f5f9;">
            <td colspan="7" style="text-align: center; vertical-align: middle; padding: 8px 12px; font-weight: bold; color: #475569; font-size: 10pt; border: 1px solid #94a3b8; letter-spacing: 0.3px;">
              ${period.label}
            </td>
          </tr>`
          return
        }

        tbody += `<tr>`
        // Time column (no clock icon)
        tbody += `
          <td style="text-align: center; vertical-align: middle; padding: 10px 4px; font-family: 'Courier New', monospace; font-size: 10pt; font-weight: bold; color: #334155; background-color: #f8fafc; border: 1px solid #94a3b8; white-space: nowrap;">
            ${period.time}
          </td>`

        // Day columns
        DAYS.forEach(day => {
          if (covered[`${day.id}_${period.id}`]) {
            return
          }

          const slot = currentClassSlots.find(s => s.day === day.id && s.period === period.id)
          const rowSpanAttr = slot && slot.duration === 2 ? ' rowspan="2"' : ''

          if (!slot) {
            // Pre-created empty cell with dash — exactly like real Word timetable and screenshot
            tbody += `
          <td style="text-align: center; vertical-align: middle; padding: 10px 4px; color: #94a3b8; font-size: 12pt; border: 1px solid #94a3b8;">
            —
          </td>`
          } else if (slot.isLibre) {
            tbody += `
          <td${rowSpanAttr} style="text-align: center; vertical-align: middle; padding: 10px 4px; background-color: #f8fafc; border: 1px solid #94a3b8;">
            <span style="color: #64748b; font-size: 10pt; font-weight: 500;">ម៉ោងលីប</span>
          </td>`
          } else {
            // Subject slot
            tbody += `
          <td${rowSpanAttr} style="text-align: center; vertical-align: middle; padding: 10px 6px; background-color: ${isWordDoc ? '#f8faff' : '#f5f3ff'}; border: 1px solid #94a3b8;">
            <div style="font-weight: bold; color: #4338ca; font-size: 11pt; line-height: 1.3;">
              ${slot.subject}
              ${slot.duration === 2 ? ` <span style="display: inline-block; font-size: 8.5pt; font-weight: bold; color: #6b21a8; background-color: #ede9fe; border: 1px solid #ddd6fe; border-radius: 3px; padding: 1px 5px; margin-left: 2px;">២ ម៉ោង</span>` : ''}
            </div>
            ${slot.teacher ? `<div style="font-size: 9.5pt; color: #475569; margin-top: 4px;">${slot.teacher}</div>` : ''}
          </td>`
          }
        })

        tbody += `</tr>`
      })

      return { thead, tbody }
    }

    if (type === 'Word') {
      const { thead, tbody } = buildMatrixRows(true)
      const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title} - ${getCachedSchoolName()}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 { size: 841.9pt 595.3pt; mso-page-orientation: landscape; margin: 28.35pt 28.35pt 28.35pt 28.35pt; }
    div.Section1 { page: Section1; }
    body { font-family: 'Khmer OS Siemreap', 'Khmer OS', 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #0f172a; line-height: 1.4; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    .header-table td { border: none; padding: 2px; }
    .kingdom-title { font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 12pt; font-weight: bold; color: #1e3a8a; text-align: center; }
    .motto-title { font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 11pt; color: #1e3a8a; text-align: center; }
    .doc-title { font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 16pt; font-weight: bold; color: #0f172a; text-align: center; margin: 12px 0 4px 0; }
    .doc-subtitle { text-align: center; font-size: 10.5pt; color: #475569; margin-bottom: 15px; }
    table.data-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #94a3b8; }
    table.data-table th, table.data-table td { border: 1px solid #94a3b8; }
    .footer-table { width: 100%; border-collapse: collapse; margin-top: 25px; }
    .footer-table td { border: none; text-align: center; font-size: 10.5pt; }
  </style>
</head>
<body>
  <div class="Section1">
    <table class="header-table">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          <strong>ក្រសួងអប់រំ យុវជន និងកីឡា</strong><br>
          <strong>មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តតាកែវ</strong><br>
          <strong>${getCachedSchoolName()}</strong>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <div class="kingdom-title">ព្រះរាជាណាចក្រកម្ពុជា</div>
          <div class="motto-title">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
        </td>
      </tr>
    </table>

    <div class="doc-title">${title}</div>
    <div class="doc-subtitle">${subtitle}</div>

    <table class="data-table">
      <thead>${thead}</thead>
      <tbody>${tbody}</tbody>
    </table>

    <table class="footer-table">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          <br>
          <strong>បានឃើញ និងឯកភាព</strong><br>
          នាយក${getCachedSchoolName()}
        </td>
        <td style="width: 50%; vertical-align: top;">
          ថ្ងៃទី....... ខែ....... ឆ្នាំ២០២...<br>
          <strong>អ្នករៀបចំកាលវិភាគ</strong>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`

      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `កាលវិភាគ_ថ្នាក់_${selectedClass}_${new Date().toISOString().slice(0, 10)}.doc`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToast(`បានទាញយកកាលវិភាគថ្នាក់ ${selectedClass} ជាឯកសារ Word (.doc) តាមទម្រង់ក្រឡាជាក់ស្តែង`)
    } else {
      // PDF Export via high-fidelity print window in Landscape format
      const printWindow = window.open('', '_blank', 'width=1100,height=850')
      if (!printWindow) {
        window.print()
        return
      }

      const { thead, tbody } = buildMatrixRows(false)

      printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ${getCachedSchoolName()}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&family=Moul&display=swap');
    @page { size: A4 landscape; margin: 1cm; }
    * { box-sizing: border-box; }
    body { font-family: 'Kantumruy Pro', 'Khmer OS Siemreap', sans-serif; color: #1e293b; margin: 0; padding: 15px 20px; background: #fff; font-size: 11.5px; }
    .header-grid { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .school-title { font-size: 11.5px; font-weight: 700; line-height: 1.6; color: #1e293b; }
    .kingdom-box { text-align: center; }
    .kingdom { font-family: 'Moul', 'Khmer OS Muol Light', serif; font-size: 12.5px; color: #1e3a8a; }
    .motto { font-family: 'Moul', 'Khmer OS Muol Light', serif; font-size: 10.5px; color: #1e3a8a; margin-top: 3px; }
    .doc-title { text-align: center; margin: 8px 0 3px 0; font-family: 'Moul', 'Khmer OS Muol Light', serif; font-size: 15px; color: #0f172a; }
    .doc-subtitle { text-align: center; font-size: 11px; color: #64748b; margin-bottom: 15px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; }
    .footer-sign { margin-top: 25px; display: flex; justify-content: space-between; text-align: center; font-size: 11px; page-break-inside: avoid; }
    .sign-col { width: 240px; }
    @media print { body { padding: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; padding: 10px 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-weight: 600; color: #334155;">ទិដ្ឋភាពកាលវិភាគបង្រៀននិងរៀន (Weekly Timetable Grid - Landscape) សម្រាប់ Save as PDF / Print</span>
    <button onclick="window.print()" style="padding: 7px 16px; background: #4f46e5; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">បោះពុម្ព / រក្សាទុកជា PDF</button>
  </div>

  <div class="header-grid">
    <div class="school-title">
      ក្រសួងអប់រំ យុវជន និងកីឡា<br>
      មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តតាកែវ<br>
      ${getCachedSchoolName()}
    </div>
    <div class="kingdom-box">
      <div class="kingdom">ព្រះរាជាណាចក្រកម្ពុជា</div>
      <div class="motto">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
    </div>
  </div>

  <div class="doc-title">${title}</div>
  <div class="doc-subtitle">${subtitle}</div>

  <table>
    <thead>${thead}</thead>
    <tbody>${tbody}</tbody>
  </table>

  <div class="footer-sign">
    <div class="sign-col">
      <br>
      <strong>បានឃើញ និងឯកភាព</strong><br>
      នាយក${getCachedSchoolName()}
    </div>
    <div class="sign-col">
      ថ្ងៃទី....... ខែ....... ឆ្នាំ២០២...<br>
      <strong>អ្នករៀបចំកាលវិភាគ</strong>
    </div>
  </div>
</body>
</html>
`)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 400)
      showToast(`បានបើកផ្ទាំងបោះពុម្ពកាលវិភាគថ្នាក់ ${selectedClass} តាមទម្រង់ក្រឡាជាក់ស្តែង`)
    }
  }

  // Backward compatibility alias
  const handleExportCSV = () => handleExport('Excel')

  // Download Sample Template with School Paper Styling (.xls)
  const handleDownloadTemplate = (mode = 'all') => {
    const targetSheets = mode === 'single'
      ? [{
          name: selectedClass,
          teacher: homeroomTeacher !== '—' && homeroomTeacher !== 'មិនទាន់មានគ្រូបន្ទុក' ? homeroomTeacher : '',
          slots: currentClassSlots
        }]
      : (classOptions && classOptions.length > 0 ? classOptions : CLASS_OPTIONS).map(c => {
          const cObj = classesList.find(cls => cls.name === c.id)
          return {
            name: c.id,
            teacher: cObj?.teacher || '',
            slots: timetableData[c.id] || []
          }
        })

    const xmlContent = generateSpreadsheetMLWorkbook(targetSheets)
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', mode === 'single' ? `គំរូកាលវិភាគ_ថ្នាក់_${selectedClass}.xls` : `គំរូកាលវិភាគ_គ្រប់ថ្នាក់_តាមSheets.xls`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast('បានទាញយកឯកសារគំរូ Excel (.xls) តាមទម្រង់ក្រដាសសាលា')
  }

  // Load Demo Data for Quick Preview with Auto-ID
  const handleLoadDemoImport = () => {
    const demo = [
      { autoCode: `SCH-${selectedClass}-001`, day: 'mon', period: 'm1', dayLabel: 'ច័ន្ទ', timeLabel: '07:00 - 08:00', duration: 2, subject: 'ភាសាខ្មែរ', teacher: 'K3', isLibre: false },
      { autoCode: `SCH-${selectedClass}-002`, day: 'mon', period: 'm3', dayLabel: 'ច័ន្ទ', timeLabel: '09:00 - 10:00', duration: 2, subject: 'គណិតវិទ្យា', teacher: 'M1', isLibre: false },
      { autoCode: `SCH-${selectedClass}-003`, day: 'mon', period: 'a1', dayLabel: 'ច័ន្ទ', timeLabel: '14:00 - 15:00', duration: 2, subject: 'រូបវិទ្យា', teacher: 'P1', isLibre: false },
      { autoCode: `SCH-${selectedClass}-004`, day: 'tue', period: 'm1', dayLabel: 'អង្គារ', timeLabel: '07:00 - 08:00', duration: 1, subject: 'ភាសាអង់គ្លេស', teacher: 'I1', isLibre: false },
      { autoCode: `SCH-${selectedClass}-005`, day: 'tue', period: 'm2', dayLabel: 'អង្គារ', timeLabel: '08:00 - 09:00', duration: 1, subject: 'ភាសាខ្មែរ', teacher: 'K3', isLibre: false }
    ]
    setImportModal({
      open: true,
      parsedData: demo,
      isUploaded: true,
      fileName: 'គំរូកាលវិភាគ_សាកល្បង.xls',
      availableSheets: [selectedClass],
      selectedSheet: selectedClass,
      rawWorkbookData: { [selectedClass]: [] },
      pasteMode: false,
      pasteText: ''
    })
  }

  // Process Workbook Text (XML .xls, HTML .xls, or CSV/TSV)
  const handleProcessWorkbookText = (text, fileName = '') => {
    try {
      if (!text || typeof text !== 'string') return

      let availableSheets = []
      let parsedSheetsData = {}

      // 1. Is it XML Spreadsheet 2003 (.xls / .xml)?
      if (text.includes('<Workbook') && text.includes('<Worksheet')) {
        const xmlSheets = parseSpreadsheetXmlWorkbook(text)
        if (xmlSheets && Object.keys(xmlSheets).length > 0) {
          parsedSheetsData = xmlSheets
          availableSheets = Object.keys(xmlSheets)
        }
      }

      // 2. Is it HTML table (.xls)?
      if (availableSheets.length === 0 && (text.includes('<table') || text.includes('<TABLE'))) {
        const htmlDoc = new DOMParser().parseFromString(text, 'text/html')
        const tables = Array.from(htmlDoc.querySelectorAll('table'))
        if (tables.length > 0) {
          tables.forEach((tbl, tIdx) => {
            const sheetName = tbl.getAttribute('data-sheet') || (tIdx === 0 ? selectedClass : `Sheet${tIdx + 1}`)
            const rows = Array.from(tbl.querySelectorAll('tr'))
            const matrix = rows.map(r => Array.from(r.querySelectorAll('th, td')).map(cell => cell.textContent.trim()))
            parsedSheetsData[sheetName] = matrix
            availableSheets.push(sheetName)
          })
        }
      }

      // 3. Fallback: Parse as CSV / TSV
      if (availableSheets.length === 0) {
        const matrix = parseCSV(text)
        if (matrix.length > 0) {
          parsedSheetsData[selectedClass] = matrix
          availableSheets = [selectedClass]
        }
      }

      if (availableSheets.length === 0) {
        showToast('ឯកសារគ្មានទិន្នន័យសម្រាប់នាំចូលទេ')
        return
      }

      // Default sheet: matching selectedClass or first available
      const defaultSheet = availableSheets.find(s => 
        s.toLowerCase().trim() === selectedClass.toLowerCase().trim() ||
        s.toLowerCase().includes(selectedClass.toLowerCase()) || 
        selectedClass.toLowerCase().includes(s.toLowerCase())
      ) || availableSheets[0]

      const activeMatrix = parsedSheetsData[defaultSheet] || []
      const parsedSlots = convertMatrixToSlots(activeMatrix, defaultSheet)

      if (parsedSlots.length === 0) {
        showToast('មិនអាចស្រង់ទិន្នន័យម៉ោងសិក្សាបានទេ សូមពិនិត្យទម្រង់តារាង')
        return
      }

      setImportModal({
        open: true,
        parsedData: parsedSlots,
        isUploaded: true,
        fileName: fileName || 'ឯកសារកាលវិភាគ',
        availableSheets,
        selectedSheet: defaultSheet,
        rawWorkbookData: parsedSheetsData,
        pasteMode: false,
        pasteText: ''
      })
    } catch (err) {
      console.error('Process workbook error:', err)
      showToast('មានបញ្ហាក្នុងការអានឯកសារ')
    }
  }

  // Switch Sheet inside Import Modal
  const handleSwitchSheet = (sheetName) => {
    if (!importModal.rawWorkbookData || !importModal.rawWorkbookData[sheetName]) return
    const matrix = importModal.rawWorkbookData[sheetName]
    const parsedSlots = convertMatrixToSlots(matrix, sheetName)
    setImportModal(prev => ({
      ...prev,
      selectedSheet: sheetName,
      parsedData: parsedSlots
    }))
  }

  // Paste Text Handler from Excel/Google Sheets
  const handlePasteChange = (val) => {
    setImportModal(prev => ({ ...prev, pasteText: val }))
    if (!val || !val.trim()) return
    const matrix = parseCSV(val)
    if (matrix.length > 0) {
      const parsedSlots = convertMatrixToSlots(matrix, selectedClass)
      if (parsedSlots.length > 0) {
        setImportModal(prev => ({
          ...prev,
          parsedData: parsedSlots,
          isUploaded: true,
          fileName: 'បិទភ្ជាប់ (Paste) ពី Excel',
          availableSheets: [selectedClass],
          selectedSheet: selectedClass
        }))
      }
    }
  }

  // Select File & Parse
  const handleSelectFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        handleProcessWorkbookText(text, file.name)
      }
    }
    reader.readAsText(file, 'utf-8')
    if (e.target) e.target.value = ''
  }

  // Confirm Import
  const handleConfirmImport = () => {
    if (importModal.parsedData.length === 0) return

    const targetClass = importModal.selectedSheet || selectedClass

    const newSlots = importModal.parsedData.map((slot, idx) => ({
      id: slot.autoCode || `import_${Date.now()}_${idx}`,
      day: slot.day,
      period: slot.period,
      duration: slot.duration,
      isLibre: slot.isLibre,
      subject: slot.subject,
      teacher: slot.teacher
    }))

    const existing = (timetableData[targetClass] || []).filter(ex => 
      !newSlots.some(n => n.day === ex.day && n.period === ex.period)
    )

    const merged = [...newSlots, ...existing]
    setTimetableData(prev => ({
      ...prev,
      [targetClass]: merged
    }))
    api('timetable.save', { classId: targetClass, slots: merged })

    showToast(`បាននាំចូលកាលវិភាគចំនួន ${newSlots.length} ម៉ោងសម្រាប់ថ្នាក់ ${targetClass} ដោយជោគជ័យ!`)
    if (targetClass !== selectedClass) {
      setSelectedClass(targetClass)
    }
    setImportModal({
      open: false,
      parsedData: [],
      isUploaded: false,
      fileName: '',
      availableSheets: [],
      selectedSheet: '',
      rawWorkbookData: null,
      pasteMode: false,
      pasteText: ''
    })
  }

  // Track covered slots for rowSpan (merging cells vertically)
  const coveredSlots = {}
  currentClassSlots.forEach(slot => {
    if (slot.duration && slot.duration > 1) {
      const pIdx = PERIODS.findIndex(p => p.id === slot.period)
      if (pIdx !== -1) {
        let coveredCount = 1
        for (let i = pIdx + 1; i < PERIODS.length && coveredCount < slot.duration; i++) {
          if (!PERIODS[i].isBreak) {
            coveredSlots[`${slot.day}_${PERIODS[i].id}`] = true
            coveredCount++
          }
        }
      }
    }
  })

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10 relative">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-[13px] font-bold border border-slate-700/50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={15} />
          </div>
          <span>{toast}</span>
        </div>
      )}

      {/* ── Top Stats Cards (4 Cards matching AdminStudents) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 w-full">
        {/* Card 1: Total Study Hours */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">ម៉ោងសិក្សាសរុប</div>
          </div>
          <div className="text-3xl font-black text-slate-800 relative z-10">{totalStudyHours}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">ម៉ោងបង្រៀនក្នុងមួយសប្តាហ៍</div>
        </div>

        {/* Card 2: Total Subjects */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">មុខវិជ្ជាសរុប</div>
          </div>
          <div className="text-3xl font-black text-emerald-500 relative z-10">{uniqueSubjects}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">មុខវិជ្ជាក្នុងកម្មវិធីសិក្សា</div>
        </div>

        {/* Card 3: Total Teachers */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">គ្រូបង្រៀនសរុប</div>
          </div>
          <div className="text-3xl font-black text-amber-500 relative z-10">{uniqueTeachers}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">នាក់ទទួលបន្ទុកបង្រៀន</div>
        </div>

        {/* Card 4: Class & Homeroom Teacher */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <GraduationCap size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">ថ្នាក់ & គ្រូបន្ទុក</div>
          </div>
          <div className="text-2xl font-black text-indigo-600 relative z-10 truncate">
            {homeroomTeacher}
          </div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">
            {selectedClass ? `ថ្នាក់ ${selectedClass} • ${currentClassObj?.room ? `បន្ទប់ ${currentClassObj.room}` : 'បន្ទប់ទូទៅ'}` : 'មិនទាន់មានថ្នាក់រៀន'}
          </div>
        </div>
      </div>

      {/* ── Main Schedule Container (Styled with clean borders & toolbar) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col relative">

        {/* ── Toolbar & Filters matching AdminStudents layout ── */}
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/40 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            
            {/* Left: Class Selection Dropdown matching AdminStudents search/filter width */}
            <div className="w-full sm:w-[240px]">
              <SearchableDropdown
                value={selectedClass}
                onChange={(val) => setSelectedClass(val)}
                options={classOptions}
                placeholder="ជ្រើសរើសថ្នាក់"
                icon={GraduationCap}
              />
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
              {/* Copy Schedule */}
              <button
                type="button"
                onClick={() => setCopyModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-3.5 rounded-xl font-bold text-[13px] transition-all w-full sm:w-auto"
                title="ចម្លងកាលវិភាគទៅថ្នាក់ផ្សេង"
              >
                <Copy size={15} strokeWidth={2.2} className="text-slate-600" />
                <span>ចម្លង</span>
              </button>

              {/* Print */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-3.5 rounded-xl font-bold text-[13px] transition-all w-full sm:w-auto"
                title="បោះពុម្ពកាលវិភាគ"
              >
                <Printer size={15} strokeWidth={2.2} className="text-slate-600" />
                <span>បោះពុម្ព</span>
              </button>

              {/* Import Excel */}
              <button
                type="button"
                onClick={() => setImportModal({ open: true, parsedData: [], isUploaded: false, fileName: '' })}
                className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 hover:border-emerald-300 py-2.5 px-3.5 rounded-xl font-bold text-[13px] transition-all shadow-sm w-full sm:w-auto"
                title="នាំចូលកាលវិភាគពី Excel (.csv, .xlsx)"
              >
                <FileSpreadsheet size={15} strokeWidth={2.2} className="text-emerald-600" />
                <span>នាំចូលពី Excel</span>
              </button>

              {/* Export Dropdown (PDF, Excel, Word) */}
              <div className="relative" ref={exportRef}>
                <button
                  type="button"
                  onClick={() => setExportOpen(!exportOpen)}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-3.5 rounded-xl font-bold text-[13px] transition-all shadow-sm w-full sm:w-auto"
                  title="នាំចេញទិន្នន័យកាលវិភាគ"
                >
                  <Download size={15} strokeWidth={2.2} className="text-slate-600" />
                  <span>នាំចេញ</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
                </button>

                {exportOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <button
                      type="button"
                      onClick={() => { handleExport('Excel'); setExportOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <FileSpreadsheet size={15} className="text-emerald-600" />
                      <span>Excel (ថ្នាក់ {selectedClass})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleExport('ExcelAllSheets'); setExportOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Layers size={15} className="text-teal-600" />
                      <span>Excel គ្រប់ថ្នាក់ (តាម Sheets)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleExport('PDF'); setExportOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <FileText size={15} className="text-rose-500" />
                      <span>ទាញយកជា PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleExport('Word'); setExportOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <FileImage size={15} className="text-blue-500" />
                      <span>ទាញយកជា Word</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Clear Schedule Button */}
              <button
                type="button"
                onClick={() => setClearModalOpen(true)}
                disabled={currentClassSlots.length === 0}
                className="flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 py-2.5 px-3.5 rounded-xl font-bold text-[13px] transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
                title="សម្អាតកាលវិភាគថ្នាក់នេះទាំងអស់"
              >
                <Trash2 size={15} strokeWidth={2.2} className="text-rose-500" />
                <span>សម្អាត</span>
              </button>

              {/* Add Schedule Button */}
              <button
                type="button"
                onClick={() => handleOpenAdd('mon', 'm1')}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-4.5 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>បន្ថែមម៉ោងរៀន</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Table Area (With clean inner borders & soft pastel subject background colors) ── */}
        <div ref={printRef} className="w-full overflow-x-auto custom-scrollbar relative min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70">
                {/* Time Column Header with Clock Icon */}
                <th className="py-3.5 px-4 text-center text-[11.5px] font-bold text-slate-600 uppercase tracking-wider w-40 whitespace-nowrap border-r border-slate-200/70">
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock size={13.5} className="text-slate-500" />
                    <span>ពេលវេលា</span>
                  </div>
                </th>

                {/* Day Headers (ច័ន្ទ, អង្គារ, ពុធ, ព្រហស្បតិ៍, សុក្រ, សៅរ៍) with inner border */}
                {DAYS.map((day, idx) => (
                  <th
                    key={day.id}
                    className={`py-3.5 px-4 text-center text-[12px] font-bold text-slate-700 uppercase tracking-wider ${
                      idx < DAYS.length - 1 ? 'border-r border-slate-200/70' : ''
                    }`}
                  >
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {PERIODS.map(period => {
                // Lunch Break Divider (Clean & Subtle)
                if (period.isLunch) {
                  return (
                    <tr key={period.id} className="bg-slate-50/70 border-y border-slate-200/70">
                      <td colSpan={DAYS.length + 1} className="py-2 px-5 text-center text-[11.5px] font-bold text-slate-500">
                        <div className="flex items-center justify-center gap-1.5">
                          <Clock size={12.5} className="text-slate-400" />
                          <span>{period.label}</span>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={period.id} className="hover:bg-slate-50/20 transition-colors">
                    
                    {/* Time Column with Clock Icon and Border-r */}
                    <td className="py-3 px-3 text-center align-middle whitespace-nowrap border-r border-slate-200/70 bg-slate-50/30">
                      <div className="flex items-center justify-center gap-1.5 font-mono text-[11.5px] font-bold text-slate-600">
                        <Clock size={12.5} className="text-slate-400 shrink-0" />
                        <span>{period.time}</span>
                      </div>
                    </td>

                    {/* Day Cells with Inner Border-r */}
                    {DAYS.map((day, dIdx) => {
                      // If covered by a preceding rowSpan (merged cell), omit this <td>
                      if (coveredSlots[`${day.id}_${period.id}`]) {
                        return null
                      }

                      const slot = currentClassSlots.find(s => s.day === day.id && s.period === period.id)
                      const is2H = slot && slot.duration === 2
                      const isLastCol = dIdx === DAYS.length - 1
                      const borderClass = isLastCol ? '' : 'border-r border-slate-200/70'

                      return slot ? (
                        slot.isLibre ? (
                          /* ── ម៉ោងលីប (Free period / ទំនេរ - NO rounded) ── */
                          <td
                            key={day.id}
                            rowSpan={slot.duration || 1}
                            className={`p-3 align-middle text-center relative group transition-colors bg-slate-50/50 hover:bg-slate-100/60 ${borderClass}`}
                          >
                            <div className="flex flex-col items-center justify-center h-full min-h-[52px]">
                              <span className="text-[11.5px] font-medium text-slate-400 select-none">
                                ម៉ោងលីប
                              </span>
                            </div>

                            {/* Hover Action Buttons */}
                            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(slot)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                                title="កែប្រែ"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteModal({ open: true, slot })}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                                title="លុប"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        ) : (
                          /* ── Regular Subject Cell with Soft Pastel Background & User Icon (NO rounded) ── */
                          (() => {
                            const theme = getSubjectTheme(slot.subject)
                            const slotConflict = checkTeacherConflict(slot, selectedClass, timetableData)
                            return (
                              <td
                                key={day.id}
                                rowSpan={slot.duration || 1}
                                className={`p-3 relative group align-middle text-center transition-colors ${borderClass} ${theme.bg}`}
                              >
                                <div className={`flex flex-col items-center justify-center h-full text-center ${is2H ? 'min-h-[110px]' : 'min-h-[52px]'}`}>
                                  {/* Subject Name + 2H badge centered */}
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    <span className={`font-bold text-[13px] leading-tight ${theme.text}`}>
                                      {slot.subject}
                                    </span>
                                    {is2H && (
                                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 ${theme.badge}`}>
                                        ២ ម៉ោង
                                      </span>
                                    )}
                                  </div>

                                  {/* Teacher Name with User Icon centered + Conflict Warning Badge if any */}
                                  {slot.teacher && (
                                    <div className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-600 mt-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <User size={11.5} className="text-slate-400 shrink-0" />
                                        <span>{slot.teacher}</span>
                                      </div>
                                      {slotConflict && (
                                        <span
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9.5px] font-bold border border-amber-200/80 shadow-2xs mt-0.5"
                                          title={`ជាន់ម៉ោងបង្រៀនជាមួយ ថ្នាក់ ${slotConflict.class} (មុខវិជ្ជា ${slotConflict.subject})`}
                                        >
                                          <AlertTriangle size={10} className="text-amber-600 shrink-0" />
                                          <span>ជាន់ម៉ោងថ្នាក់ {slotConflict.class}</span>
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Flat Hover Action Buttons (Absolute top right) */}
                                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(slot)}
                                      className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-white/80 rounded transition-colors"
                                      title="កែប្រែ"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteModal({ open: true, slot })}
                                      className="p-1 text-slate-500 hover:text-rose-600 hover:bg-white/80 rounded transition-colors"
                                      title="លុប"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              </td>
                            )
                          })()
                        )
                      ) : (
                        /* ── Empty Cell (Clean, subtle hover, no button) ── */
                        <td
                          key={day.id}
                          className={`p-3 text-center align-middle cursor-pointer hover:bg-slate-50 transition-colors bg-white ${borderClass}`}
                          onClick={() => handleOpenCellAdd(day.id, period.id)}
                          title={`ចុចដើម្បីកំណត់ ថ្ងៃ${day.label} (${period.time})`}
                        >
                          <span className="text-slate-200 text-[13px] select-none hover:text-slate-400 transition-colors">—</span>
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

      {/* ── Modal: Add / Edit Timetable Slot (Redesigned for Premium Clean UX) ── */}
      {modalOpen && (() => {
        const currentDayObj = DAYS.find(d => d.id === form.day) || DAYS[0]
        const currentPeriodObj = PERIODS.find(p => p.id === form.period) || PERIODS[0]
        const occupiedSlot = currentClassSlots.find(
          s => s.day === form.day && s.period === form.period && (!editingSlot || s.id !== editingSlot.id)
        )

        /* ── Focused Modal for Cell Click (Only: Type, Duration, Subject & Teacher) ── */
        if (modalMode === 'cell') {
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
                
                {/* ── Fixed Header ── */}
                <div className="px-6 py-4 border-b border-slate-200/70 flex items-center justify-between bg-slate-50/80 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      {editingSlot ? <Edit size={18} strokeWidth={2.3} /> : <Plus size={20} strokeWidth={2.5} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[16px] font-black text-slate-800">
                          {editingSlot ? 'កែសម្រួលម៉ោងសិក្សា' : 'កំណត់ម៉ោងសិក្សា'}
                        </h3>
                        <span className="text-[11.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                          ថ្នាក់ {selectedClass}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11.5px] font-medium text-slate-500 mt-1">
                        <div className="flex items-center gap-1 font-bold text-slate-700">
                          <Calendar size={12.5} className="text-slate-400" />
                          <span>ថ្ងៃ{currentDayObj.label}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-700">
                          <Clock size={12.5} className="text-slate-400" />
                          <span>{currentPeriodObj.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* ── Focused Form Body ── */}
                <form onSubmit={(e) => handleSaveSlot(e, false)} className="flex flex-col flex-1 overflow-hidden">
                  <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4.5">
                    
                    {/* 1. ប្រភេទម៉ោងសិក្សា */}
                    <div>
                      <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                        ប្រភេទម៉ោងសិក្សា
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            isLibre: false,
                            subject: prev.subject === 'ម៉ោងលីប' ? (dynamicSubjects[0] || '') : prev.subject,
                            teacher: prev.teacher || ''
                          }))}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12.5px] font-bold transition-all ${
                            !form.isLibre
                              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <BookOpen size={15} />
                          <span>រៀនមុខវិជ្ជា</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, isLibre: true, subject: 'ម៉ោងលីប', teacher: '' }))}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12.5px] font-bold transition-all ${
                            form.isLibre
                              ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Coffee size={15} />
                          <span>ម៉ោងលីប (ទំនេរ)</span>
                        </button>
                      </div>
                    </div>

                    {!form.isLibre && (
                      <>
                        {/* 2. រយៈពេលសិក្សា (Duration) */}
                        <div>
                          <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                            រយៈពេលសិក្សា (Duration)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, duration: 1 }))}
                              className={`py-2 px-3 rounded-xl border text-[12.5px] font-bold transition-all text-center flex items-center justify-center gap-2 ${
                                form.duration === 1
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-100 shadow-xs'
                                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span>១ ម៉ោង</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, duration: 2 }))}
                              className={`py-2 px-3 rounded-xl border text-[12.5px] font-bold transition-all text-center flex items-center justify-center gap-2 ${
                                form.duration === 2
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-100 shadow-xs'
                                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span>២ ម៉ោង (Merge ក្រឡា)</span>
                            </button>
                          </div>
                          {form.duration === 2 && (
                            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                              <Sparkles size={12} className="text-indigo-600 shrink-0" />
                              <span>មុខវិជ្ជានឹងត្រូវ Merge ភ្ជាប់គ្នា ២ ម៉ោងជាប់គ្នាលើតារាងដោយស្វ័យប្រវត្តិ។</span>
                            </p>
                          )}
                        </div>

                        {/* 3. មុខវិជ្ជាសិក្សា (ចាប់ពី table មុខវិជ្ជា) */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[12px] font-bold text-slate-700">
                              មុខវិជ្ជាសិក្សា <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[11px] text-slate-400">
                              {dynamicSubjects.length > 0 ? `ពីតារាងមុខវិជ្ជា (${dynamicSubjects.length})` : 'មិនទាន់មានក្នុងតារាង'}
                            </span>
                          </div>

                          {dynamicSubjects.length > 0 ? (
                            <div className="grid grid-cols-2 gap-1.5 mb-2 max-h-[160px] overflow-y-auto custom-scrollbar p-0.5">
                              {dynamicSubjects.map(subj => {
                                const theme = getSubjectTheme(subj)
                                const isSelected = form.subject === subj
                                return (
                                  <button
                                    key={subj}
                                    type="button"
                                    onClick={() => handleSelectSubject(subj)}
                                    className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                      isSelected
                                        ? `${theme.bg} ${theme.border} ${theme.text} ring-2 ring-indigo-400/50 shadow-xs font-bold`
                                        : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                          isSelected ? 'bg-indigo-600' : 'bg-slate-300'
                                        }`}
                                      />
                                      <span className="text-[12px] truncate">{subj}</span>
                                    </div>
                                    {isSelected && (
                                      <Check size={13} className="text-indigo-600 shrink-0" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="p-2.5 mb-2 bg-amber-50 border border-amber-200/70 rounded-xl text-amber-800 text-[11.5px] leading-relaxed">
                              មិនទាន់មានមុខវិជ្ជាក្នុងតារាងមុខវិជ្ជាទេ។ សូមវាយបញ្ចូលខាងក្រោម ឬបន្ថែមក្នុងផ្ទាំង «មុខវិជ្ជា»។
                            </div>
                          )}

                          {/* Custom Subject input fallback */}
                          <input
                            type="text"
                            placeholder="ឬវាយបញ្ចូលឈ្មោះមុខវិជ្ជាផ្សេង..."
                            value={dynamicSubjects.includes(form.subject) ? '' : form.subject}
                            onChange={(e) => {
                              const val = e.target.value
                              setForm(prev => ({
                                ...prev,
                                subject: val
                              }))
                            }}
                            className="w-full text-[12px] py-1.5 px-3 rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 font-medium"
                          />
                        </div>

                        {/* 4. គ្រូបង្រៀនទទួលបន្ទុក (Optional - មិន required) */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5">
                              <User size={13} className="text-slate-400" />
                              <span>គ្រូបង្រៀនទទួលបន្ទុក</span>
                              <span className="text-[11px] font-normal text-slate-400">(មិនបង្ខំ / ស្រេចចិត្ត)</span>
                            </label>
                          </div>
                          <div className="relative">
                            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={form.teacher}
                              onChange={e => setForm(prev => ({ ...prev, teacher: e.target.value }))}
                              className="w-full bg-white border border-slate-200 text-slate-800 py-2 pl-9 pr-3 rounded-xl font-bold text-[12.5px] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs"
                              placeholder="ឧ. ឈ្មោះគ្រូបង្រៀន (ទុកទំនេរក៏បាន)"
                            />
                          </div>

                          {/* Teacher Conflict Warning Banner */}
                          {(() => {
                            const conflict = checkTeacherConflict(form, selectedClass, timetableData, editingSlot ? editingSlot.id : null)
                            if (!conflict) return null
                            return (
                              <div className="mt-3 p-3 bg-amber-50 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-amber-900 text-[12px] leading-relaxed animate-in fade-in duration-200 shadow-2xs">
                                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">ការព្រមានអំពីការជាន់ម៉ោង៖ </span>
                                  {conflict.teacher} មានម៉ោងបង្រៀនមុខវិជ្ជា <span className="font-bold">«{conflict.subject}»</span> នៅ <span className="font-bold text-amber-950 bg-amber-100 px-1.5 py-0.5 rounded">ថ្នាក់ {conflict.class}</span> (ថ្ងៃ{conflict.dayLabel} ម៉ោង {conflict.time}) រួចហើយ!
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </>
                    )}

                  </div>

                  {/* ── Fixed Footer ── */}
                  <div className="shrink-0 px-6 py-3.5 bg-slate-50/90 border-t border-slate-200/70 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {occupiedSlot ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/70">
                          <AlertTriangle size={12} className="shrink-0" />
                          <span>មាន «{occupiedSlot.subject}» រួចហើយ</span>
                        </div>
                      ) : (
                        <span className="text-[11.5px] text-slate-500 font-medium">
                          {form.isLibre ? 'ម៉ោងលីប' : form.subject}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[12.5px] font-bold transition-all shadow-2xs"
                      >
                        បោះបង់
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-[12.5px] font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                      >
                        <Check size={15} strokeWidth={2.5} />
                        <span>{editingSlot ? 'រក្សាទុកការកែប្រែ' : 'បញ្ចូលម៉ោងសិក្សា'}</span>
                      </button>
                    </div>
                  </div>

                </form>
              </div>
            </div>
          )
        }

        /* ── Full Modal from Top Button (with Day & Time Pickers) ── */
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-3xl lg:max-w-4xl w-full shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
              
              {/* ── Fixed Header ── */}
              <div className="px-6 py-4 border-b border-slate-200/70 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    {editingSlot ? <Edit size={18} strokeWidth={2.3} /> : <Plus size={20} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[16px] font-black text-slate-800">
                        {editingSlot ? 'កែសម្រួលម៉ោងសិក្សា' : 'បន្ថែមម៉ោងសិក្សាថ្មី'}
                      </h3>
                      <span className="text-[11.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                        ថ្នាក់ {selectedClass}
                      </span>
                    </div>
                    <p className="text-[11.5px] font-medium text-slate-500 mt-0.5">
                      គ្រូបន្ទុកថ្នាក់: <span className="font-bold text-slate-700">{homeroomTeacher}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ── Form with Fixed Footer Structure ── */}
              <form onSubmit={(e) => handleSaveSlot(e, false)} className="flex flex-col flex-1 overflow-hidden">
                
                {/* Scrollable Form Body */}
                <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-5">
                  
                  {/* 1. Type Switcher: រៀនមុខវិជ្ជា vs ម៉ោងលីប */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                      ប្រភេទម៉ោងសិក្សា
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60 max-w-xs">
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          isLibre: false,
                          subject: prev.subject === 'ម៉ោងលីប' ? (dynamicSubjects[0] || '') : prev.subject,
                          teacher: prev.teacher || ''
                        }))}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12.5px] font-bold transition-all ${
                          !form.isLibre
                            ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <BookOpen size={15} />
                        <span>រៀនមុខវិជ្ជា</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, isLibre: true, subject: 'ម៉ោងលីប', teacher: '' }))}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12.5px] font-bold transition-all ${
                          form.isLibre
                            ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Coffee size={15} />
                        <span>ម៉ោងលីប (ទំនេរ)</span>
                      </button>
                    </div>
                  </div>

                  {form.isLibre ? (
                    /* ═══ WHEN ម៉ោងលីប IS ACTIVE: Balanced Day & Time Selectors ═══ */
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Left: Day Selector (5 cols) */}
                      <div className="md:col-span-5 flex flex-col gap-3">
                        <div className="block text-[12px] font-bold text-slate-700 mb-1.5">
                          <Calendar size={13} className="text-indigo-600" />
                          <span>ជ្រើសរើសថ្ងៃសិក្សា</span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[12px] font-bold text-slate-700">
                              ថ្ងៃសិក្សា
                            </label>
                            <span className="text-[11.5px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              ថ្ងៃ{currentDayObj.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {DAYS.map(d => {
                              const isActive = form.day === d.id
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => setForm(prev => ({ ...prev, day: d.id }))}
                                  className={`py-2.5 text-center rounded-xl text-[12.5px] font-bold transition-all ${
                                    isActive
                                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80'
                                  }`}
                                >
                                  {d.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Time Period Selector (7 cols) */}
                      <div className="md:col-span-7 flex flex-col gap-3">
                        <div className="text-[11.5px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                          <Clock size={13} className="text-indigo-600" />
                          <span>ជ្រើសរើសចន្លោះម៉ោង</span>
                        </div>

                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[12px] font-bold text-slate-700">
                            ចន្លោះម៉ោង
                          </label>
                          <span className="text-[11.5px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                            {currentPeriodObj.time}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          {/* Morning Shift */}
                          <div className="p-2.5 bg-amber-50/30 rounded-xl border border-amber-200/50">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2">
                              <Sun size={13} className="text-amber-500" />
                              <span>វេនព្រឹក (07:00 - 11:00)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {PERIODS.filter(p => p.id.startsWith('m')).map(p => {
                                const isActive = form.period === p.id
                                const isOccupied = currentClassSlots.some(s => s.day === form.day && s.period === p.id)
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, period: p.id }))}
                                    className={`py-2 px-2 text-center rounded-lg font-mono text-[11.5px] font-bold transition-all flex items-center justify-between ${
                                      isActive
                                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80'
                                    }`}
                                  >
                                    <span className="mx-auto">{p.time}</span>
                                    {isOccupied && !isActive && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="មានមុខវិជ្ជារួចហើយ" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Afternoon Shift */}
                          <div className="p-2.5 bg-orange-50/30 rounded-xl border border-orange-200/50">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-800 uppercase tracking-wider mb-2">
                              <Sunset size={13} className="text-orange-500" />
                              <span>វេនរសៀល (14:00 - 17:00)</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {PERIODS.filter(p => p.id.startsWith('a')).map(p => {
                                const isActive = form.period === p.id
                                const isOccupied = currentClassSlots.some(s => s.day === form.day && s.period === p.id)
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, period: p.id }))}
                                    className={`py-2 px-1 text-center rounded-lg font-mono text-[11px] font-bold transition-all flex items-center justify-between ${
                                      isActive
                                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80'
                                    }`}
                                  >
                                    <span className="mx-auto">{p.time}</span>
                                    {isOccupied && !isActive && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="មានមុខវិជ្ជារួចហើយ" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : (
                    /* ═══ WHEN REGULAR SUBJECT IS ACTIVE: Left 6 cols, Right 6 cols ═══ */
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Left Column (6 Cols): Time & Day & Duration */}
                      <div className="md:col-span-6 flex flex-col gap-4.5">
                        
                        <div className="text-[11.5px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                          <Calendar size={13} className="text-indigo-600" />
                          <span>ពេលវេលា & រយៈពេលសិក្សា</span>
                        </div>

                        {/* Day Selector */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[12px] font-bold text-slate-700">
                              ជ្រើសរើសថ្ងៃសិក្សា
                            </label>
                            <span className="text-[11.5px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              ថ្ងៃ{currentDayObj.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-6 gap-1.5">
                            {DAYS.map(d => {
                              const isActive = form.day === d.id
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => setForm(prev => ({ ...prev, day: d.id }))}
                                  className={`py-2 text-center rounded-xl text-[12.5px] font-bold transition-all ${
                                    isActive
                                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80'
                                  }`}
                                >
                                  {d.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Time Period Selector */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[12px] font-bold text-slate-700">
                              ជ្រើសរើសចន្លោះម៉ោង
                            </label>
                            <span className="text-[11.5px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                              {currentPeriodObj.time}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {/* Morning Shift */}
                            <div className="p-2.5 bg-amber-50/30 rounded-xl border border-amber-200/50">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2">
                                <Sun size={13} className="text-amber-500" />
                                <span>វេនព្រឹក (07:00 - 11:00)</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {PERIODS.filter(p => p.id.startsWith('m')).map(p => {
                                  const isActive = form.period === p.id
                                  const isOccupied = currentClassSlots.some(s => s.day === form.day && s.period === p.id)
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => setForm(prev => ({ ...prev, period: p.id }))}
                                      className={`py-2 px-2 text-center rounded-lg font-mono text-[11.5px] font-bold transition-all flex items-center justify-between ${
                                        isActive
                                          ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80'
                                      }`}
                                    >
                                      <span className="mx-auto">{p.time}</span>
                                      {isOccupied && !isActive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="មានមុខវិជ្ជារួចហើយ" />
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Afternoon Shift */}
                            <div className="p-2.5 bg-orange-50/30 rounded-xl border border-orange-200/50">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-800 uppercase tracking-wider mb-2">
                                <Sunset size={13} className="text-orange-500" />
                                <span>វេនរសៀល (14:00 - 17:00)</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {PERIODS.filter(p => p.id.startsWith('a')).map(p => {
                                  const isActive = form.period === p.id
                                  const isOccupied = currentClassSlots.some(s => s.day === form.day && s.period === p.id)
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => setForm(prev => ({ ...prev, period: p.id }))}
                                      className={`py-2 px-1 text-center rounded-lg font-mono text-[11px] font-bold transition-all flex items-center justify-between ${
                                        isActive
                                          ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80'
                                      }`}
                                    >
                                      <span className="mx-auto">{p.time}</span>
                                      {isOccupied && !isActive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="មានមុខវិជ្ជារួចហើយ" />
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Duration Selector */}
                        <div>
                          <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                            រយៈពេលសិក្សា (Duration)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, duration: 1 }))}
                              className={`py-2 px-3 rounded-xl border text-[12.5px] font-bold transition-all text-center flex items-center justify-center gap-2 ${
                                form.duration === 1
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-100 shadow-xs'
                                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span>១ ម៉ោង</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, duration: 2 }))}
                              className={`py-2 px-3 rounded-xl border text-[12.5px] font-bold transition-all text-center flex items-center justify-center gap-2 ${
                                form.duration === 2
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-100 shadow-xs'
                                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span>២ ម៉ោង (Merge ក្រឡា)</span>
                            </button>
                          </div>
                          {form.duration === 2 && (
                            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                              <Sparkles size={12} className="text-indigo-600 shrink-0" />
                              <span>មុខវិជ្ជានឹងត្រូវ Merge ភ្ជាប់គ្នា ២ ម៉ោងជាប់គ្នាលើតារាងដោយស្វ័យប្រវត្តិ។</span>
                            </p>
                          )}
                        </div>

                      </div>

                      {/* Right Column (6 Cols): មុខវិជ្ជា & គ្រូបង្រៀន */}
                      <div className="md:col-span-6 flex flex-col gap-4.5">
                        
                        <div className="text-[11.5px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                          <BookOpen size={13} className="text-indigo-600" />
                          <span>មុខវិជ្ជា & គ្រូបង្រៀន</span>
                        </div>

                        {/* Quick Subject Grid (ចាប់ពី table មុខវិជ្ជា) */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[12px] font-bold text-slate-700">
                              មុខវិជ្ជាសិក្សា <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[11px] text-slate-400">
                              {dynamicSubjects.length > 0 ? `ពីតារាងមុខវិជ្ជា (${dynamicSubjects.length})` : 'មិនទាន់មានក្នុងតារាង'}
                            </span>
                          </div>

                          {dynamicSubjects.length > 0 ? (
                            <div className="grid grid-cols-2 gap-1.5 mb-2 max-h-[160px] overflow-y-auto custom-scrollbar p-0.5">
                              {dynamicSubjects.map(subj => {
                                const theme = getSubjectTheme(subj)
                                const isSelected = form.subject === subj
                                return (
                                  <button
                                    key={subj}
                                    type="button"
                                    onClick={() => handleSelectSubject(subj)}
                                    className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                      isSelected
                                        ? `${theme.bg} ${theme.border} ${theme.text} ring-2 ring-indigo-400/50 shadow-xs font-bold`
                                        : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                          isSelected ? 'bg-indigo-600' : 'bg-slate-300'
                                        }`}
                                      />
                                      <span className="text-[12px] truncate">{subj}</span>
                                    </div>
                                    {isSelected && (
                                      <Check size={13} className="text-indigo-600 shrink-0" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="p-2.5 mb-2 bg-amber-50 border border-amber-200/70 rounded-xl text-amber-800 text-[11.5px] leading-relaxed">
                              មិនទាន់មានមុខវិជ្ជាក្នុងតារាងមុខវិជ្ជាទេ។ សូមវាយបញ្ចូលខាងក្រោម ឬបន្ថែមក្នុងផ្ទាំង «មុខវិជ្ជា»។
                            </div>
                          )}

                          {/* Custom Subject input fallback */}
                          <input
                            type="text"
                            placeholder="ឬវាយបញ្ចូលឈ្មោះមុខវិជ្ជាផ្សេង..."
                            value={dynamicSubjects.includes(form.subject) ? '' : form.subject}
                            onChange={(e) => {
                              const val = e.target.value
                              setForm(prev => ({
                                ...prev,
                                subject: val
                              }))
                            }}
                            className="w-full text-[12px] py-1.5 px-3 rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 font-medium"
                          />
                        </div>

                        {/* Teacher Input & Suggestions (Optional - មិន required) */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5">
                              <User size={13} className="text-slate-400" />
                              <span>គ្រូបង្រៀនទទួលបន្ទុក</span>
                              <span className="text-[11px] font-normal text-slate-400">(មិនបង្ខំ / ស្រេចចិត្ត)</span>
                            </label>
                          </div>
                          <div className="relative">
                            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={form.teacher}
                              onChange={e => setForm(prev => ({ ...prev, teacher: e.target.value }))}
                              className="w-full bg-white border border-slate-200 text-slate-800 py-2 pl-9 pr-3 rounded-xl font-bold text-[12.5px] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs"
                              placeholder="ឧ. ឈ្មោះគ្រូបង្រៀន (ទុកទំនេរក៏បាន)"
                            />
                          </div>

                          {/* Teacher Conflict Warning Banner */}
                          {(() => {
                            const conflict = checkTeacherConflict(form, selectedClass, timetableData, editingSlot ? editingSlot.id : null)
                            if (!conflict) return null
                            return (
                              <div className="mt-3 p-3 bg-amber-50 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-amber-900 text-[12px] leading-relaxed animate-in fade-in duration-200 shadow-2xs">
                                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">ការព្រមានអំពីការជាន់ម៉ោង៖ </span>
                                  {conflict.teacher} មានម៉ោងបង្រៀនមុខវិជ្ជា <span className="font-bold">«{conflict.subject}»</span> នៅ <span className="font-bold text-amber-950 bg-amber-100 px-1.5 py-0.5 rounded">ថ្នាក់ {conflict.class}</span> (ថ្ងៃ{conflict.dayLabel} ម៉ោង {conflict.time}) រួចហើយ!
                                </div>
                              </div>
                            )
                          })()}
                        </div>

                      </div>

                    </div>
                  )}
                </div>

                {/* ── Fixed Sticky Footer (Always 100% visible, no scrolling needed) ── */}
                <div className="shrink-0 px-6 py-3.5 bg-slate-50/90 border-t border-slate-200/70 flex items-center justify-between gap-3 flex-wrap">
                  
                  {/* Current Slot Info or Conflict Warning */}
                  <div className="flex items-center gap-2">
                    {occupiedSlot ? (
                      <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70">
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>ម៉ោងនេះមាន «{occupiedSlot.subject}» រួចហើយ (នឹងត្រូវជំនួស)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-500">
                        <Calendar size={13} className="text-slate-400" />
                        <span>
                          ថ្ងៃ{currentDayObj.label} • {currentPeriodObj.time} • {form.isLibre ? 'ម៉ោងលីប' : form.subject}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[12.5px] font-bold transition-all shadow-2xs"
                    >
                      បោះបង់
                    </button>
                    
                    {!editingSlot && (
                      <button
                        type="button"
                        onClick={(e) => handleSaveSlot(e, true)}
                        className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 text-[12.5px] font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                        title="រក្សាទុកម៉ោងនេះ ហើយប្តូរទៅម៉ោងបន្ទាប់ដោយស្វ័យប្រវត្តិ"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>រក្សាទុក & បន្តបន្ទាប់</span>
                        <ArrowRight size={13} />
                      </button>
                    )}

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-[12.5px] font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                    >
                      <Check size={15} strokeWidth={2.5} />
                      <span>{editingSlot ? 'រក្សាទុកការកែប្រែ' : 'បញ្ចូលម៉ោងសិក្សា'}</span>
                    </button>
                  </div>

                </div>

              </form>
            </div>
          </div>
        )
      })()}

      {/* ── Modal: Copy Schedule to another Class ── */}
      {copyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Copy size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800">
                    ចម្លងកាលវិភាគ
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400">
                    ចម្លងកាលវិភាគពី ថ្នាក់ {selectedClass} ទៅកាន់ថ្នាក់ផ្សេងទៀត
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[12.5px] text-slate-700 font-medium">
                កាលវិភាគទាំងអស់នៃ <span className="font-bold text-slate-900">ថ្នាក់ {selectedClass}</span> នឹងត្រូវចម្លងទៅកាន់ថ្នាក់ដែលអ្នកជ្រើសរើសខាងក្រោម។
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  ជ្រើសរើសថ្នាក់ដែលត្រូវចម្លងទៅ
                </label>
                <select
                  value={targetCopyClass}
                  onChange={e => setTargetCopyClass(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl font-bold text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                >
                  {classOptions.filter(c => c.id !== selectedClass).map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCopyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] font-bold transition-all"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  onClick={handleExecuteCopy}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Copy size={15} />
                  <span>បញ្ជាក់ការចម្លង</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Delete Slot ── */}
      {deleteModal.open && deleteModal.slot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4 border border-rose-100">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-[16px] font-black text-slate-800 mb-1">
              លុបម៉ោងសិក្សានេះ?
            </h3>
            <p className="text-[13px] text-slate-500 mb-6">
              តើអ្នកប្រាកដជាចង់លុប {deleteModal.slot.isLibre ? '«ម៉ោងលីប»' : `មុខវិជ្ជា «${deleteModal.slot.subject}»`} នេះចេញពីកាលវិភាគមែនទេ?
            </p>
            <div className="flex items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, slot: null })}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[13px] transition-all"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[13px] shadow-sm hover:shadow transition-all"
              >
                យល់ព្រមលុប
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Import Schedule from Excel ── */}
      {importModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800">
                    នាំចូលកាលវិភាគពី Excel
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400">សម្រាប់ថ្នាក់ {selectedClass} • ប្រព័ន្ធកំណត់កូដម៉ោងដោយស្វ័យប្រវត្តិ (Auto-ID)</p>
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
            <div className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto custom-scrollbar">

              {/* Step 1: Download Sample Templates (Single Class or All Classes via Sheets) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-slate-800">ទាញយកឯកសារគំរូ Excel (.xls) តាមទម្រង់ក្រដាស</p>
                    <p className="text-[11.5px] text-slate-500">តារាងមានទម្រង់ ៧ ម៉ោង (ព្រឹក-រសៀល) ដូចក្រដាសកាលវិភាគវិទ្យាល័យបេះបិទ</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('all')}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                    title="ទាញយក Excel ដែលមាន Sheets សម្រាប់គ្រប់ថ្នាក់"
                  >
                    <Layers size={13} />
                    <span>គ្រប់ថ្នាក់ (តាម Sheets)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('single')}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[12px] font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                    title="ទាញយក Excel សម្រាប់តែថ្នាក់នេះ"
                  >
                    <Download size={13} />
                    <span>ថ្នាក់ {selectedClass}</span>
                  </button>
                </div>
              </div>

              {/* Input Mode Toggle: File Upload vs Direct Paste */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <button
                  type="button"
                  onClick={() => setImportModal(prev => ({ ...prev, pasteMode: false }))}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12.5px] font-bold transition-all ${
                    !importModal.pasteMode
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <Upload size={14} />
                  <span>ជ្រើសរើសឯកសារ (.xls, .csv)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportModal(prev => ({ ...prev, pasteMode: true }))}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12.5px] font-bold transition-all ${
                    importModal.pasteMode
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <Clipboard size={14} />
                  <span>បិទភ្ជាប់ (Paste) ពី Excel</span>
                </button>
              </div>

              {/* Upload Dropzone OR Direct Paste Box */}
              {!importModal.pasteMode ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleSelectFile}
                    accept=".xls, .xlsx, .csv, .xml, application/vnd.ms-excel"
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2.5 transition-colors">
                      <Upload size={22} />
                    </div>
                    <p className="text-[14px] font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                      {importModal.fileName ? importModal.fileName : 'ចុចដើម្បីជ្រើសរើសឯកសារ ឬអូសទម្លាក់ទីនេះ'}
                    </p>
                    <p className="text-[12px] text-slate-400 mt-1">
                      គាំទ្រឯកសារ Excel (.xls, .xlsx) ឬ CSV
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={4}
                    value={importModal.pasteText || ''}
                    onChange={(e) => handlePasteChange(e.target.value)}
                    placeholder="ចម្លង (Copy) តារាងពី Excel ឬ Google Sheets រួចចុច Ctrl+V បិទភ្ជាប់ទីនេះ... (ប្រព័ន្ធនឹងស្គាល់ដោយស្វ័យប្រវត្តិ)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[12px] font-mono focus:outline-none focus:border-emerald-500 focus:bg-white transition-all custom-scrollbar"
                  />
                  <p className="text-[11px] text-slate-400 italic">
                    * គន្លឹះ៖ គ្រាន់តែ Select table ក្នុង Excel រួចចុច Ctrl+C ហើយយកមក Paste ទីនេះ។
                  </p>
                </div>
              )}

              {/* Multi-Sheet Selector Pills (if file contains multiple sheets) */}
              {importModal.availableSheets && importModal.availableSheets.length > 1 && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-emerald-950 flex items-center gap-1.5">
                      <Layers size={14} className="text-emerald-600" />
                      សន្លឹក Sheets ក្នុងឯកសារ ({importModal.availableSheets.length} ថ្នាក់)៖
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">ចុចលើ Sheet ដើម្បីប្តូរថ្នាក់ដែលត្រូវនាំចូល</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {importModal.availableSheets.map(sheetName => {
                      const isSelected = importModal.selectedSheet === sheetName
                      return (
                        <button
                          key={sheetName}
                          type="button"
                          onClick={() => handleSwitchSheet(sheetName)}
                          className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs scale-105'
                              : 'bg-white border border-emerald-200 text-slate-700 hover:bg-emerald-100/60'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={2.5} />}
                          <span>{sheetName}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quick Demo Button */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleLoadDemoImport}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 underline underline-offset-2 flex items-center gap-1"
                >
                  <span>ចុចទីនេះដើម្បីសាកល្បងផ្ទុកទិន្នន័យគំរូ 12B ភ្លាមៗ</span>
                  <ArrowRight size={11} />
                </button>
              </div>

              {/* Step 3: Preview Parsed Data */}
              {importModal.isUploaded && importModal.parsedData.length > 0 && (
                <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
                  <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] text-emerald-950 font-bold">
                        បានផ្ទៀងផ្ទាត់ដោយជោគជ័យសម្រាប់ថ្នាក់៖ <span className="text-emerald-700 underline underline-offset-2 text-[13px]">{importModal.selectedSheet || selectedClass}</span>
                      </p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        ប្រព័ន្ធបានបកប្រែកូដ (K3, M1, P1...) ទៅជាមុខវិជ្ជា និងគ្រូស្វ័យប្រវត្តិ ដោយគ្មានកំហុស Field ឡើយ។
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      <span className="text-[13px] font-bold text-slate-800">
                        ទិន្នន័យដែលបានស្រង់ ({importModal.parsedData.length} ម៉ោងសិក្សា)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      រួចរាល់សម្រាប់ការនាំចូល
                    </span>
                  </div>

                  <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar shadow-xs">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold sticky top-0 bg-slate-50">
                          <th className="py-2.5 px-3 text-center w-12">ល.រ</th>
                          <th className="py-2.5 px-3">ថ្ងៃ</th>
                          <th className="py-2.5 px-3">ពេលវេលា</th>
                          <th className="py-2.5 px-3">មុខវិជ្ជា</th>
                          <th className="py-2.5 px-3">គ្រូបង្រៀន</th>
                          <th className="py-2.5 px-3 text-center">រយៈពេល</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {importModal.parsedData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-400 font-bold">{i + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-800">{row.dayLabel}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{row.timeLabel}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">
                              {row.isLibre ? (
                                <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">ម៉ោងលីប (ទំនេរ)</span>
                              ) : (
                                <span className="text-indigo-700">{row.subject}</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {row.teacher ? (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200/60">
                                  {row.teacher}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 text-[10.5px] font-bold rounded-md ${
                                row.duration === 2 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {row.duration === 2 ? '២ ម៉ោង' : '១ ម៉ោង'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <p className="text-[11.5px] text-slate-400 hidden sm:block">
                នាំចូលទៅកាន់៖ <span className="font-bold text-slate-700">ថ្នាក់ {importModal.selectedSheet || selectedClass}</span>
              </p>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setImportModal({
                    open: false,
                    parsedData: [],
                    isUploaded: false,
                    fileName: '',
                    availableSheets: [],
                    selectedSheet: '',
                    rawWorkbookData: null,
                    pasteMode: false,
                    pasteText: ''
                  })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-[13px] font-bold transition-all"
                >
                  បោះបង់
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={!importModal.isUploaded || importModal.parsedData.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>បញ្ជាក់ការនាំចូល ({importModal.parsedData.length} ម៉ោង ទៅថ្នាក់ {importModal.selectedSheet || selectedClass})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Clear Timetable ── */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 size={24} />
            </div>
            <h3 className="text-[16px] font-black text-slate-800">
              បញ្ជាក់ការសម្អាតកាលវិភាគ
            </h3>
            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
              តើអ្នកពិតជាចង់សម្អាតម៉ោងសិក្សាទាំងអស់ ({currentClassSlots.length} ម៉ោង) នៃ <span className="font-bold text-slate-800">ថ្នាក់ {selectedClass}</span> ចេញពីប្រព័ន្ធមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] font-bold transition-all"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleExecuteClear}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Trash2 size={15} />
                <span>យល់ព្រមសម្អាតទាំងអស់</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
