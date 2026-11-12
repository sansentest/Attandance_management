/**
 * ─────────────────────────────────────────────────────────────
 * Export Student Discipline Tracking to Excel (.xlsx)  ·  ទម្រង់របាយការណ៍រដ្ឋបាល
 * ─────────────────────────────────────────────────────────────
 *  1. exportTrackingSummaryExcel – តារាងតាមដានវិន័យ និងអវត្តមានសិស្ស
 *  2. exportTrackingDetailExcel  – ព្រឹត្តិបត្រតាមដានប្រវត្តិអវត្តមានសិស្ស
 *
 * - បង្កើតជា .xlsx ពិតប្រាកដ (មានក្បាលលិខិត ស៊ុមតារាង ទទឹងជួរ ត្រៀមបោះពុម្ព A4)
 *   ដោយប្រើ ExcelJS ដែលទាញពី CDN តែពេល export ដំបូង (មិនចាំបាច់ npm install)។
 * - បើ ExcelJS ទាញមិនបាន (គ្មានអ៊ីនធឺណិត) នឹង export ជា CSV ជំនួស។
 */

import { buildSummarySubtitleParts, getExportMonthSuffix } from '../../../../utils/dateFilters'

// ───────────── Config ─────────────
const DEFAULT_DEPARTMENT = 'មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តតាកែវ'
const DEFAULT_ACADEMIC_YEAR = '២០២៥ - ២០២៦'
const EXCELJS_URL = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js'
const FONT_BODY = 'Khmer OS Siemreap'
const FONT_TITLE = 'Khmer OS Muol Light'

// ───────────── Helpers ─────────────
const KH_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
const kh = (v) => String(v ?? '').replace(/\d/g, (d) => KH_DIGITS[Number(d)])
const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
const khDate = (d = new Date()) => `ថ្ងៃទី${kh(d.getDate())} ខែ${KH_MONTHS[d.getMonth()]} ឆ្នាំ${kh(d.getFullYear())}`

const toNum = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
const round2 = (n) => Math.round(n * 100) / 100
const str = (v, fallback = '') => (v === undefined || v === null || v === '' ? fallback : String(v))
const pad2 = (n) => String(n).padStart(2, '0')
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const safeFileName = (s) => String(s).replace(/[\\/:*?"<>|\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ───────────── Load ExcelJS (lazy) ─────────────
let excelJsPromise = null
function loadExcelJS() {
  if (typeof window !== 'undefined' && window.ExcelJS) return Promise.resolve(window.ExcelJS)
  if (!excelJsPromise) {
    excelJsPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = EXCELJS_URL
      s.async = true
      s.onload = () => (window.ExcelJS ? resolve(window.ExcelJS) : reject(new Error('ExcelJS not found after load')))
      s.onerror = () => reject(new Error('Cannot load ExcelJS from CDN'))
      document.head.appendChild(s)
    }).catch((err) => {
      excelJsPromise = null
      throw err
    })
  }
  return excelJsPromise
}

// ───────────── CSV fallback ─────────────
const csvCell = (v) => {
  if (typeof v === 'number') return String(v)
  let s = String(v ?? '')
  if (/^[=+\-@]/.test(s) && s !== '-') s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}
const csvId = (v) => (/^\d+$/.test(v) ? `="${v}"` : csvCell(v))
const buildCsv = (headers, rows) => '\uFEFF' + [headers.map(csvCell), ...rows].map((r) => r.join(',')).join('\r\n')

// ───────────── Excel styling helpers ─────────────
const BORDER = { style: 'thin', color: { argb: 'FF000000' } }
const BORDERS = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER }
const FILL_HEAD = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDED' } }
const FILL_TOTAL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
const A_CENTER = { horizontal: 'center', vertical: 'middle', wrapText: true }
const A_LEFT = { horizontal: 'left', vertical: 'middle', wrapText: true }
const A_FIT = { horizontal: 'center', vertical: 'middle', shrinkToFit: true }
const NUM_FMT = 'General;-General;"-"'
const F = (size = 10, extra = {}) => ({ name: FONT_BODY, size, ...extra })
const FM = (size = 11) => ({ name: FONT_TITLE, size })

const DOTS = (n) => '.'.repeat(n)
const LUNAR_LINE = `ថ្ងៃ${DOTS(12)}ខែ${DOTS(10)}ឆ្នាំ${DOTS(8)}ព.ស ២៥${DOTS(6)}`
const placeLine = (school) => `${school ? `${school} ` : ''}ថ្ងៃទី${DOTS(8)}ខែ${DOTS(8)}ឆ្នាំ${DOTS(8)}`

function put(ws, r, c1, c2, value, st = {}) {
  const cell = ws.getCell(r, c1)
  cell.value = value
  cell.font = st.font || F()
  cell.alignment = st.align || A_CENTER
  if (st.border) cell.border = BORDERS
  if (st.fill) cell.fill = st.fill
  if (st.numFmt) cell.numFmt = st.numFmt
  if (c2 > c1) ws.mergeCells(r, c1, r, c2)
  return cell
}
const rowH = (ws, r, h) => {
  ws.getRow(r).height = h
}
const linesFor = (text, width) => Math.max(1, Math.ceil((String(text ?? '').length * 0.75) / width))

function letterhead(ws, { cols, orgSpan, department, schoolName }) {
  put(ws, 1, 1, cols, 'ព្រះរាជាណាចក្រកម្ពុជា', { font: FM(12) })
  put(ws, 2, 1, cols, 'ជាតិ សាសនា ព្រះមហាក្សត្រ', { font: FM(12) })
  rowH(ws, 1, 26)
  rowH(ws, 2, 26)
  put(ws, 3, 1, orgSpan, department, { font: FM(11) })
  rowH(ws, 3, 24)
  let r = 4
  if (schoolName) {
    put(ws, 4, 1, orgSpan, schoolName, { font: FM(11) })
    rowH(ws, 4, 24)
    r = 5
  }
  rowH(ws, r, 8)
  return r + 1
}

function titleBlock(ws, r, cols, title, subtitle) {
  put(ws, r, 1, cols, title, { font: FM(13) })
  rowH(ws, r, 30)
  put(ws, r + 1, 1, cols, subtitle, { font: F(10.5) })
  rowH(ws, r + 1, 22)
  rowH(ws, r + 2, 8)
  return r + 3
}

function headerRow(ws, r, labels) {
  labels.forEach((label, i) => put(ws, r, i + 1, i + 1, label, { font: F(10, { bold: true }), fill: FILL_HEAD, border: true }))
  rowH(ws, r, 32)
}

function signatures(ws, r, blocks) {
  const top = r + 1
  const mid = r + 2
  const role = r + 3
  blocks.forEach((b) => {
    if (b.top) put(ws, top, b.c1, b.c2, b.top, { align: A_FIT })
    put(ws, mid, b.c1, b.c2, b.mid, { font: b.midMuol ? FM(10.5) : F(10), align: A_FIT })
    put(ws, role, b.c1, b.c2, b.role, { font: FM(10.5) })
  })
  ;[top, mid, role, role + 1, role + 2, role + 3].forEach((x) => rowH(ws, x, 24))
  return role + 3
}

function pageSetup(ws, { lastCol, lastRow, headerRowNo }) {
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: 0.6, right: 0.6, top: 0.7, bottom: 0.7, header: 0.3, footer: 0.3 },
    printArea: `A1:${lastCol}${lastRow}`,
    printTitlesRow: `${headerRowNo}:${headerRowNo}`
  }
  ws.headerFooter.oddFooter = '&Cទំព័រ &P / &N'
}

// ───────────── Summary Workbook & CSV ─────────────
function normalizeTrackingSummary({ filteredData, filterClass = 'ALL', filterMonth = 'ALL', schoolName, totalWarning, totalCritical, getStudentStatus, department, academicYear }) {
  const list = Array.isArray(filteredData) ? filteredData : []
  const records = list.map((d, i) => {
    const st = getStudentStatus ? getStudentStatus(d) : 'NORMAL'
    const stLabel = st === 'CRITICAL' ? 'ត្រូវហៅអាណាព្យាបាល' : st === 'WARNING' ? 'ស្ថិតក្នុងការប្រុងប្រយ័ត្ន' : 'ធម្មតា'
    const totalHrs = d.totalHours !== undefined ? d.totalHours : ((d.absentHours || d.absent || 0) + (d.leaveHours || d.leave || 0))
    return {
      no: i + 1,
      studentId: str(d.studentId || d.id),
      name: str(d.name),
      cls: str(d.class),
      absent: toNum(d.absent),
      leave: toNum(d.leave),
      hours: toNum(totalHrs),
      status: stLabel,
      parentPhone: str(d.parentPhone, '-')
    }
  })
  const totalWithAbsence = records.filter((r) => r.absent > 0 || r.leave > 0).length
  return { records, filterClass, filterMonth, schoolName, totalWarning: toNum(totalWarning), totalCritical: toNum(totalCritical), totalWithAbsence, department, academicYear }
}

function buildTrackingSummaryWorkbook(ExcelJS, c) {
  const COLS = 9
  const wb = new ExcelJS.Workbook()
  wb.creator = c.schoolName || 'ប្រព័ន្ធតាមដានវិន័យសិស្ស'
  wb.created = new Date()
  const ws = wb.addWorksheet('តាមដានវិន័យសិស្ស')
  const widths = [6, 12, 26, 8, 12, 12, 12, 18, 16]
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w))

  let r = letterhead(ws, { cols: COLS, orgSpan: 4, department: c.department, schoolName: c.schoolName })
  const monthSuffix = getExportMonthSuffix(c.filterMonth)
  const reportTitle = `តារាងតាមដានវិន័យ និងអវត្តមានសិស្ស${monthSuffix}`
  const subtitle = buildSummarySubtitleParts({
    academicYear: c.academicYear,
    studentCountText: kh(c.records.length),
    filterClass: c.filterClass
  }).join('  |  ')
  r = titleBlock(ws, r, COLS, reportTitle, subtitle)

  // ស្ថិតិសង្ខេប (Stats Strip)
  put(ws, r, 1, 2, 'សិស្សសរុប', { font: F(10, { bold: true }), fill: FILL_HEAD, border: true })
  put(ws, r, 3, 4, 'មានអវត្តមាន', { font: F(10, { bold: true }), fill: FILL_HEAD, border: true })
  put(ws, r, 5, 6, 'ស្ថិតក្នុងការប្រុងប្រយ័ត្ន', { font: F(10, { bold: true }), fill: FILL_HEAD, border: true })
  put(ws, r, 7, 9, 'ត្រូវហៅអាណាព្យាបាល', { font: F(10, { bold: true }), fill: FILL_HEAD, border: true })
  rowH(ws, r, 24)
  r += 1

  put(ws, r, 1, 2, `${kh(c.records.length)} នាក់`, { border: true })
  put(ws, r, 3, 4, `${kh(c.totalWithAbsence)} នាក់`, { border: true })
  put(ws, r, 5, 6, `${kh(c.totalWarning)} នាក់`, { border: true })
  put(ws, r, 7, 9, `${kh(c.totalCritical)} នាក់`, { border: true })
  rowH(ws, r, 24)
  r += 2

  const hdr = r
  headerRow(ws, hdr, ['ល.រ', 'អត្តលេខ', 'គោត្តនាម-នាម', 'ថ្នាក់', 'គ្មានច្បាប់', 'មានច្បាប់', 'សរុប (ម៉ោង)', 'ស្ថានភាពវិន័យ', 'លេខទូរស័ព្ទ'])
  r += 1

  const first = r
  c.records.forEach((d) => {
    const base = { border: true }
    put(ws, r, 1, 1, d.no, { ...base, numFmt: '0' })
    put(ws, r, 2, 2, d.studentId, { ...base, numFmt: '@' })
    put(ws, r, 3, 3, d.name, { ...base, align: A_LEFT })
    put(ws, r, 4, 4, d.cls, { ...base, numFmt: '@' })
    put(ws, r, 5, 5, d.absent, { ...base, numFmt: NUM_FMT })
    put(ws, r, 6, 6, d.leave, { ...base, numFmt: NUM_FMT })
    put(ws, r, 7, 7, d.hours, { ...base, numFmt: NUM_FMT })
    put(ws, r, 8, 8, d.status, base)
    put(ws, r, 9, 9, d.parentPhone, { ...base, numFmt: '@' })
    rowH(ws, r, 21 * Math.max(linesFor(d.name, widths[2]), linesFor(d.status, widths[7])))
    r += 1
  })
  const last = r - 1

  if (c.records.length) {
    const col = (n) => ws.getColumn(n).letter
    const sumOf = (key) => round2(c.records.reduce((s, d) => s + d[key], 0))
    put(ws, r, 1, 4, 'សរុបរួម', { font: F(10, { bold: true }), fill: FILL_TOTAL, border: true })
    ;[
      [5, 'absent'],
      [6, 'leave'],
      [7, 'hours']
    ].forEach(([n, key]) =>
      put(
        ws,
        r,
        n,
        n,
        { formula: `SUBTOTAL(109,${col(n)}${first}:${col(n)}${last})`, result: sumOf(key) },
        { font: F(10, { bold: true }), fill: FILL_TOTAL, border: true, numFmt: NUM_FMT }
      )
    )
    put(ws, r, 8, 8, '', { fill: FILL_TOTAL, border: true })
    put(ws, r, 9, 9, '', { fill: FILL_TOTAL, border: true })
    rowH(ws, r, 22)
    ws.autoFilter = { from: { row: hdr, column: 1 }, to: { row: last, column: COLS } }
    r += 1
  } else {
    put(ws, r, 1, COLS, 'មិនមានទិន្នន័យអវត្តមានទេ', { border: true })
    rowH(ws, r, 36)
    r += 1
  }

  const lastRow = signatures(ws, r + 1, [
    { c1: 1, c2: 4, mid: 'បានឃើញ និងឯកភាព', midMuol: true, role: 'នាយកសាលា' },
    { c1: 5, c2: 9, top: LUNAR_LINE, mid: placeLine(c.schoolName), role: 'អ្នករៀបចំរបាយការណ៍' }
  ])
  pageSetup(ws, { lastCol: 'I', lastRow, headerRowNo: hdr })
  return wb
}

function trackingSummaryCsv(c) {
  const headers = ['ល.រ', 'អត្តលេខ', 'ឈ្មោះសិស្ស', 'ថ្នាក់', 'គ្មានច្បាប់ (ថ្ងៃ)', 'មានច្បាប់ (ថ្ងៃ)', 'សរុបខកខាន (ម៉ោង)', 'ស្ថានភាពវិន័យ', 'លេខទូរស័ព្ទអាណាព្យាបាល']
  const rows = c.records.map((d) => [
    csvCell(d.no),
    csvId(d.studentId),
    csvCell(d.name),
    csvCell(d.cls),
    csvCell(d.absent),
    csvCell(d.leave),
    csvCell(d.hours),
    csvCell(d.status),
    csvCell(d.parentPhone)
  ])
  return buildCsv(headers, rows)
}

// ───────────── Detail Workbook & CSV ─────────────
function normalizeTrackingDetail({ student, filtered, schoolName, statusInfo, threshold, department, academicYear }) {
  const st = student || {}
  const records = (Array.isArray(filtered) ? filtered : []).map((r, i) => ({
    no: i + 1,
    date: str(r.date),
    time: str(r.time, '-'),
    subject: str(r.subject),
    teacher: str(r.teacher, '-'),
    type: r.status === 'LEAVE' ? 'មានច្បាប់' : 'គ្មានច្បាប់',
    reason: str(r.reason, '-')
  }))
  const absentCount = toNum(st.absent)
  const leaveCount = toNum(st.leave)
  const totalSessions = st.totalHours !== undefined ? toNum(st.totalHours) : (toNum(st.absentHours) + toNum(st.leaveHours) || records.length)
  return {
    student: st,
    records,
    schoolName,
    statusInfo: statusInfo || { label: 'ធម្មតា' },
    threshold: toNum(threshold || 20),
    absentCount,
    leaveCount,
    totalSessions,
    department,
    academicYear
  }
}

function buildTrackingDetailWorkbook(ExcelJS, c) {
  const COLS = 7
  const wb = new ExcelJS.Workbook()
  wb.creator = c.schoolName || 'ប្រព័ន្ធតាមដានវិន័យសិស្ស'
  wb.created = new Date()
  const ws = wb.addWorksheet('ប្រវត្តិអវត្តមាន')
  const widths = [6, 15, 14, 22, 18, 14, 26]
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w))

  let r = letterhead(ws, { cols: COLS, orgSpan: 4, department: c.department, schoolName: c.schoolName })
  r = titleBlock(ws, r, COLS, 'ព្រឹត្តិបត្រតាមដានប្រវត្តិអវត្តមានសិស្ស', `ឆ្នាំសិក្សា ${c.academicYear}  |  សរុបកំណត់ត្រា៖ ${kh(c.records.length)} លើក`)

  // ព័ត៌មានសិស្ស (ស្លាក + តម្លៃ)
  const info = [
    ['គោត្តនាម-នាម ៖', str(c.student.name)],
    ['អត្តលេខ ៖', str(c.student.studentId || c.student.id)],
    ['ថ្នាក់ទី ៖', str(c.student.class)],
    ['ទូរស័ព្ទអាណាព្យាបាល ៖', str(c.student.parentPhone, '-')],
    ['កាលបរិច្ឆេទចេញ ៖', khDate()],
    ['កម្រិតកំណត់វិន័យ ៖', `${kh(c.threshold)} ថ្ងៃ`],
    ['គ្មានច្បាប់ (ល្មើសវិន័យ) ៖', `${kh(c.absentCount)} ថ្ងៃ`],
    ['មានច្បាប់ ៖', `${kh(c.leaveCount)} ថ្ងៃ`],
    ['ម៉ោងខកខានសរុប ៖', `${kh(c.totalSessions)} ម៉ោង`],
    ['ស្ថានភាពវិន័យ ៖', str(c.statusInfo && c.statusInfo.label, 'ធម្មតា')]
  ]

  info.forEach(([label, value]) => {
    put(ws, r, 1, 3, label, { align: { horizontal: 'left', vertical: 'middle' } })
    put(ws, r, 4, 7, value, { font: F(10, { bold: true }), align: { horizontal: 'left', vertical: 'middle' }, numFmt: '@' })
    rowH(ws, r, 21)
    r += 1
  })
  rowH(ws, r, 10)
  r += 1

  const hdr = r
  headerRow(ws, hdr, ['ល.រ', 'កាលបរិច្ឆេទ', 'ម៉ោងសិក្សា', 'មុខវិជ្ជា', 'គ្រូបង្រៀន', 'ប្រភេទ', 'មូលហេតុ'])
  r += 1

  c.records.forEach((d) => {
    const base = { border: true }
    put(ws, r, 1, 1, d.no, { ...base, numFmt: '0' })
    put(ws, r, 2, 2, d.date, { ...base, numFmt: '@' })
    put(ws, r, 3, 3, d.time, { ...base, numFmt: '@' })
    put(ws, r, 4, 4, d.subject, { ...base, align: A_LEFT })
    put(ws, r, 5, 5, d.teacher, { ...base, align: A_LEFT })
    put(ws, r, 6, 6, d.type, base)
    put(ws, r, 7, 7, d.reason, { ...base, align: A_LEFT })
    rowH(ws, r, 21 * Math.max(linesFor(d.subject, widths[3]), linesFor(d.teacher, widths[4]), linesFor(d.reason, widths[6])))
    r += 1
  })
  const last = r - 1

  if (c.records.length) {
    ws.autoFilter = { from: { row: hdr, column: 1 }, to: { row: last, column: COLS } }
  } else {
    put(ws, r, 1, COLS, 'មិនមានកំណត់ត្រាអវត្តមានទេ', { border: true })
    rowH(ws, r, 36)
    r += 1
  }

  const lastRow = signatures(ws, r + 1, [
    { c1: 1, c2: 3, mid: 'បានឃើញ និងឯកភាព', midMuol: true, role: 'នាយកសាលា' },
    { c1: 4, c2: 5, mid: 'បានឃើញ និងឯកភាព', midMuol: true, role: 'គ្រូបន្ទុកថ្នាក់' },
    { c1: 6, c2: 7, top: LUNAR_LINE, mid: placeLine(c.schoolName), role: 'អ្នករៀបចំរបាយការណ៍' }
  ])
  pageSetup(ws, { lastCol: 'G', lastRow, headerRowNo: hdr })
  return wb
}

function trackingDetailCsv(c) {
  const headers = ['ល.រ', 'អត្តលេខ', 'ឈ្មោះសិស្ស', 'ថ្នាក់', 'កាលបរិច្ឆេទ', 'ម៉ោងសិក្សា', 'មុខវិជ្ជា', 'គ្រូបង្រៀន', 'ប្រភេទ', 'មូលហេតុ']
  const rows = c.records.map((d) => [
    csvCell(d.no),
    csvId(c.student.studentId || c.student.id),
    csvCell(c.student.name),
    csvCell(c.student.class),
    csvCell(d.date),
    csvCell(d.time),
    csvCell(d.subject),
    csvCell(d.teacher),
    csvCell(d.type),
    csvCell(d.reason)
  ])
  return buildCsv(headers, rows)
}

// ───────────── Shared export flow ─────────────
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

async function exportWorkbook({ fileBase, build, csv }) {
  const base = safeFileName(fileBase)
  try {
    const ExcelJS = await loadExcelJS()
    const buffer = await build(ExcelJS).xlsx.writeBuffer()
    downloadBlob(new Blob([buffer], { type: XLSX_MIME }), `${base}.xlsx`)
  } catch (err) {
    console.warn('[exportExcel] បង្កើត .xlsx មិនបាន ប្តូរទៅ CSV ជំនួស៖', err)
    alert('មិនអាចបង្កើតឯកសារ Excel (.xlsx) បានទេ (ប្រហែលជាគ្មានអ៊ីនធឺណិត)។ ប្រព័ន្ធបាននាំចេញជាឯកសារ CSV ជំនួស។')
    downloadBlob(new Blob([csv()], { type: 'text/csv;charset=utf-8;' }), `${base}.csv`)
  }
}

// ─────────────────────────────────────────────────────────────
// 1. Export Summary Discipline Tracking List to Excel
// ─────────────────────────────────────────────────────────────
export async function exportTrackingSummaryExcel({
  filteredData = [],
  filterClass = 'ALL',
  filterMonth = 'ALL',
  schoolName = '',
  totalWarning = 0,
  totalCritical = 0,
  getStudentStatus,
  department = DEFAULT_DEPARTMENT,
  academicYear = DEFAULT_ACADEMIC_YEAR
} = {}) {
  const ctx = normalizeTrackingSummary({
    filteredData,
    filterClass,
    filterMonth,
    schoolName,
    totalWarning,
    totalCritical,
    getStudentStatus,
    department,
    academicYear
  })
  const monthSuffix = getExportMonthSuffix(filterMonth)
  await exportWorkbook({
    fileBase: `តារាងតាមដានវិន័យសិស្ស_${monthSuffix}${filterClass !== 'ALL' ? `_ថ្នាក់${filterClass}` : ''}_${localDate()}`,
    build: (ExcelJS) => buildTrackingSummaryWorkbook(ExcelJS, ctx),
    csv: () => trackingSummaryCsv(ctx)
  })
}

// ─────────────────────────────────────────────────────────────
// 2. Export Individual Student Detail Discipline History to Excel
// ─────────────────────────────────────────────────────────────
export async function exportTrackingDetailExcel({
  student = {},
  filtered = [],
  schoolName = '',
  statusInfo = { label: 'ធម្មតា' },
  threshold = 20,
  department = DEFAULT_DEPARTMENT,
  academicYear = DEFAULT_ACADEMIC_YEAR
} = {}) {
  const ctx = normalizeTrackingDetail({
    student,
    filtered,
    schoolName,
    statusInfo,
    threshold,
    department,
    academicYear
  })
  await exportWorkbook({
    fileBase: `ប្រវត្តិអវត្តមាន_${student?.name || 'សិស្ស'}_${localDate()}`,
    build: (ExcelJS) => buildTrackingDetailWorkbook(ExcelJS, ctx),
    csv: () => trackingDetailCsv(ctx)
  })
}
