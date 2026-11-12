/**
 * ─────────────────────────────────────────────────────────────
 * Export Attendance to PDF  (A4 · ទម្រង់ឯកសាររដ្ឋបាលខ្មែរ)
 * ─────────────────────────────────────────────────────────────
 *  1. exportAttendanceSummaryPdf – របាយការណ៍បូកសរុបអវត្តមានសិស្ស
 *  2. exportStudentDetailPdf     – ព្រឹត្តិបត្រតាមដានប្រវត្តិអវត្តមានសិស្ស
 *
 * ក្នុង Print dialog (Chrome / Edge) សូមកំណត់៖
 *   • Destination  = Save as PDF
 *   • Paper size   = A4
 *   • Margins      = Default
 *   • Headers and footers = បិទ (មិនឲ្យមាន URL / កាលបរិច្ឆេទ លេចនៅគែមក្រដាស)
 *   • Background graphics = បើក (ឲ្យពណ៌ផ្ទៃក្បាលតារាងចេញ)
 */

import { buildSummarySubtitleParts, getExportClassLabel, getExportMonthSuffix } from '../../../../utils/dateFilters'

// ───────────── Config (ប្តូរបានតាមតម្រូវការ) ─────────────
const DEFAULT_DEPARTMENT = 'មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តតាកែវ'
const DEFAULT_ACADEMIC_YEAR = '២០២៥ - ២០២៦'
// false = គូរសញ្ញាតុបតែងដោយ SVG (ចេញដូចគ្នាគ្រប់កុំព្យូទ័រ)
// true  = ប្រើ font Tacteing (ត្រូវតែដំឡើង font នេះក្នុងកុំព្យូទ័រដែលបោះពុម្ព)
const USE_TACTEING_FONT = false

// ───────────── Helpers ─────────────
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const KH_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
const kh = (v) => String(v ?? '').replace(/\d/g, (d) => KH_DIGITS[Number(d)])

const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
const khDate = (d = new Date()) => `ថ្ងៃទី${kh(d.getDate())} ខែ${KH_MONTHS[d.getMonth()]} ឆ្នាំ${kh(d.getFullYear())}`

const toNum = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
const round2 = (n) => Math.round(n * 100) / 100
// លេខក្នុងតារាង៖ ០ បង្ហាញជា "-" ដើម្បីឲ្យតារាងស្អាត មិនរញ៉េរញ៉ៃ
const cell = (v) => (toNum(v) === 0 ? '-' : kh(round2(toNum(v))))

const fill = (width) => `<span class="fill" style="width:${width}"></span>`

// ───────────── Shared building blocks ─────────────
const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Moul&family=Noto+Sans+Khmer:wght@400;700&display=swap">`

const ORNAMENT_SVG = `
<svg class="ornament-svg"
     width="100"
     height="24"
     viewBox="0 0 100 24"
     xmlns="http://www.w3.org/2000/svg"
     aria-hidden="true">

  <g fill="none" stroke="#000"
     stroke-width="1"
     stroke-linecap="round"
     stroke-linejoin="round">

    <!-- Horizontal lines -->
    <path d="M2 12 H25 M75 12 H98"/>

    <!-- Khmer ornamental curves -->
    <path d="M25 12
             C30 12 30 4 38 4
             C43 4 43 9 50 12
             C57 9 57 4 62 4
             C70 4 70 12 75 12"/>

    <path d="M25 12
             C30 12 30 20 38 20
             C43 20 43 15 50 12
             C57 15 57 20 62 20
             C70 20 70 12 75 12"/>

    <!-- Center diamond -->
    <path d="M50 3 L58 12 L50 21 L42 12 Z"/>

    <!-- Center detail -->
    <circle cx="50" cy="12" r="2" fill="#000"/>
  </g>
</svg>`;

const BASE_CSS = `
  @page { size: A4 portrait; margin: 2cm; }
  :root {
    --font-body: 'Khmer OS Siemreap', 'Khmer OS Battambang', 'Noto Sans Khmer', 'Battambang', 'Segoe UI', Arial, sans-serif;
    --font-muol: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', serif;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: var(--font-body);
    font-size: 10.5pt;
    line-height: 1.6;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .muol { font-family: var(--font-muol); font-weight: normal; line-height: 1.8; }

  /* ── Letterhead ── */
  .kingdom { text-align: center; font-size: 12pt; }
  .ornament-svg { display: block; margin: 4px auto 0; }
  .ornament-font { font-family: 'Tacteing', var(--font-muol); font-size: 20pt; line-height: 1.2; margin-top: 2px; }
  .org { width: 9.5cm; text-align: center; font-size: 11pt; margin-top: 2px; }
  .org-rule { width: 2.4cm; border-top: 0.75pt solid #000; margin: 6px auto 0; }

  /* ── Title ── */
  .doc-title { text-align: center; font-size: 13pt; margin: 16px 0 2px; }
  .doc-subtitle { text-align: center; font-size: 10.5pt; margin-bottom: 12px; }

  /* ── Tables ── */
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 10pt;
  }
  table.data-table th, table.data-table td {
    border: 0.75pt solid #000;
    padding: 4px 5px;
    vertical-align: middle;
    text-align: center;
    overflow-wrap: anywhere;
  }
    .ornament-svg {
    display: block;
    width: 100px;
    height: 14px;
    margin: 3px auto 0;
}
  table.data-table th { background: #EDEDED; font-weight: 700; }
  table.data-table td.l { text-align: left; }
  table.data-table .nw { white-space: nowrap; overflow-wrap: normal; }
  table.data-table thead { display: table-header-group; }
  table.data-table tr { break-inside: avoid; page-break-inside: avoid; }
  table.data-table tr.total-row td { font-weight: 700; background: #F5F5F5; }
  table.data-table td.empty { padding: 18px; }

  /* ── Student info (no borders) ── */
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10.5pt; }
  table.info td { padding: 1px 0; vertical-align: top; border: none; }
  table.info td.k { white-space: nowrap; padding-right: 6px; }
  table.info td.v { font-weight: 700; padding-right: 14px; }
  table.strip { margin-bottom: 12px; }

  /* ── Signatures ── */
  .footer-sign {
    display: grid;
    column-gap: 8px;
    align-items: end;
    text-align: center;
    margin-top: 22px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .sg-top, .sg-mid, .sg-role { font-size: 10pt; line-height: 1.8; }
  .sg-mid .muol, .sg-role .muol { font-size: 10.5pt; }
  .sg-space { height: 2.4cm; }
  .fill { display: inline-block; height: 0.9em; margin: 0 3px; border-bottom: 0.75pt dotted #000; }

  @media print { body { padding: 0; } }
`

const ornament = () => (USE_TACTEING_FONT ? '<div class="ornament-font">3</div>' : ORNAMENT_SVG)

const letterhead = ({ department, schoolName }) => `
  <div class="kingdom">
    <div class="muol">ព្រះរាជាណាចក្រកម្ពុជា</div>
    <div class="muol">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
    ${ornament()}
  </div>
  <div class="org">
    <div class="muol">${esc(department)}</div>
    ${schoolName ? `<div class="muol">${esc(schoolName)}</div>` : ''}
    <div class="org-rule"></div>
  </div>`

// ជួរហត្ថលេខា៖ តម្រឹមជួរដេកឲ្យត្រូវគ្នា (បន្ទាត់កាលបរិច្ឆេទ / បានឃើញ / តួនាទី)
const approver = (role) => ({
  top: '',
  mid: '<span class="muol">បានឃើញ និងឯកភាព</span>',
  role: `<span class="muol">${role}</span>`
})
const preparer = (schoolName) => ({
  top: `ថ្ងៃ${fill('0.9cm')}ខែ${fill('0.9cm')}ឆ្នាំ${fill('0.9cm')}ព.ស ២៥${fill('0.8cm')}`,
  mid: `${esc(schoolName)} ថ្ងៃទី${fill('0.9cm')}ខែ${fill('0.9cm')}ឆ្នាំ${fill('1.1cm')}`,
  role: '<span class="muol">អ្នករៀបចំរបាយការណ៍</span>'
})

const signatureBlock = (cols, template) => {
  const row = (key, cls) => cols.map((c) => `<div class="${cls}">${c[key] || ''}</div>`).join('')
  return `
  <div class="footer-sign" style="grid-template-columns:${template}">
    ${row('top', 'sg-top')}${row('mid', 'sg-mid')}${row('role', 'sg-role')}${cols.map(() => '<div class="sg-space"></div>').join('')}
  </div>`
}

// បើកផ្ទាំងបោះពុម្ព ហើយរង់ចាំ font ទាញចប់សិន ទើប print (ជៀសវាង font ខ្មែរមិនទាន់ចេញ)
function printDocument({ title, body }) {
  const w = window.open('', '_blank')
  if (!w) {
    alert('សូមអនុញ្ញាត Popup ក្នុង Browser ដើម្បីបើកផ្ទាំងបោះពុម្ព')
    return
  }

  w.document.write(`<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="utf-8">
  <title>${esc(title)}</title>${FONT_LINKS}
  <style>${BASE_CSS}</style>
</head>
<body>${body}</body>
</html>`)
  w.document.close()

  let printed = false
  const doPrint = () => {
    if (printed || w.closed) return
    printed = true
    setTimeout(() => {
      w.focus()
      w.print()
    }, 300)
  }
  const waitForFonts = () => {
    const ready = w.document.fonts && w.document.fonts.ready
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000))
    Promise.race([ready || Promise.resolve(), timeout]).then(doPrint)
  }

  if (w.document.readyState === 'complete') waitForFonts()
  else w.addEventListener('load', waitForFonts)
  setTimeout(doPrint, 6000) // ការពារករណីមិនបាន print
}

// ─────────────────────────────────────────────────────────────
// 1. Export Summary Attendance List to PDF
// ─────────────────────────────────────────────────────────────
export function exportAttendanceSummaryPdf({
  filtered = [],
  filterClass = 'ALL',
  filterMonth = 'ALL',
  schoolName = '',
  getStatusInfo,
  department = DEFAULT_DEPARTMENT,
  academicYear = DEFAULT_ACADEMIC_YEAR
}) {
  const rows = Array.isArray(filtered) ? filtered : []
  const hoursOf = (d) => toNum(d.totalHours !== undefined ? d.totalHours : d.totalSessions)
  const sum = (fn) => round2(rows.reduce((s, d) => s + fn(d), 0))
  const monthSuffix = getExportMonthSuffix(filterMonth)
  const reportTitle = `របាយការណ៍បូកសរុបអវត្តមានសិស្ស${monthSuffix}`

  const subtitle = buildSummarySubtitleParts({
    academicYear,
    studentCountText: kh(rows.length),
    filterClass
  })
    .map(esc)
    .join(' &nbsp;|&nbsp; ')

  const bodyRows = rows
    .map((d, idx) => {
      const info = (getStatusInfo && getStatusInfo(d.total)) || { label: 'ធម្មតា' }
      return `
      <tr>
        <td>${kh(idx + 1)}</td>
        <td>${esc(d.studentId)}</td>
        <td class="l">${esc(d.name)}</td>
        <td>${esc(d.class)}</td>
        <td>${cell(d.leave)}</td>
        <td>${cell(d.absent)}</td>
        <td>${cell(d.total)}</td>
        <td>${cell(hoursOf(d))}</td>
        <td>${esc(info.label)}</td>
      </tr>`
    })
    .join('')

  const totalRow = rows.length
    ? `
      <tr class="total-row">
        <td colspan="4">សរុបរួម</td>
        <td>${cell(sum((d) => toNum(d.leave)))}</td>
        <td>${cell(sum((d) => toNum(d.absent)))}</td>
        <td>${cell(sum((d) => toNum(d.total)))}</td>
        <td>${cell(sum(hoursOf))}</td>
        <td></td>
      </tr>`
    : ''

  const body = `
  ${letterhead({ department, schoolName })}

  <div class="doc-title muol">${esc(reportTitle)}</div>
  <div class="doc-subtitle">${subtitle}</div>

  <table class="data-table">
    <colgroup>
      <col style="width:6%"><col style="width:12%"><col><col style="width:7%">
      <col style="width:10%"><col style="width:10%"><col style="width:9%"><col style="width:9%"><col style="width:13%">
    </colgroup>
    <thead>
      <tr>
        <th rowspan="2" class="nw">ល.រ</th>
        <th rowspan="2">អត្តលេខ</th>
        <th rowspan="2">គោត្តនាម-នាម</th>
        <th rowspan="2">ថ្នាក់</th>
        <th colspan="2">អវត្តមាន (ថ្ងៃ)</th>
        <th rowspan="2">សរុប (ថ្ងៃ)</th>
        <th rowspan="2">សរុប (ម៉ោង)</th>
        <th rowspan="2">ស្ថានភាព</th>
      </tr>
      <tr>
        <th>មានច្បាប់</th>
        <th>គ្មានច្បាប់</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows || '<tr><td colspan="9" class="empty">មិនមានទិន្នន័យអវត្តមានទេ</td></tr>'}
      ${totalRow}
    </tbody>
  </table>

  ${signatureBlock([approver('នាយកសាលា'), preparer(schoolName)], '1fr 7.6cm')}`

  printDocument({
    title: `${reportTitle}${filterClass !== 'ALL' ? ` ${getExportClassLabel(filterClass)}` : ''} - ${schoolName}`,
    body
  })
}

// ─────────────────────────────────────────────────────────────
// 2. Export Individual Student Detail Attendance to PDF
// ─────────────────────────────────────────────────────────────
export function exportStudentDetailPdf({
  student = {},
  filtered = [],
  schoolName = '',
  statusInfo = { label: 'ធម្មតា' },
  absentCount = 0,
  leaveCount = 0,
  totalSessions = 0,
  department = DEFAULT_DEPARTMENT,
  academicYear = DEFAULT_ACADEMIC_YEAR
}) {
  const rows = Array.isArray(filtered) ? filtered : []

  const bodyRows = rows
    .map(
      (r, idx) => `
      <tr>
        <td>${kh(idx + 1)}</td>
        <td class="nw">${kh(esc(r.date || ''))}</td>
        <td style="font-size: 9.5pt;">${kh(esc(r.time || '-'))}</td>
        <td class="l">${esc(r.subject || '')}</td>
        <td class="l">${esc(r.teacher || '-')}</td>
        <td>${r.status === 'LEAVE' ? 'មានច្បាប់' : 'គ្មានច្បាប់'}</td>
        <td class="l">${esc(r.reason || '-')}</td>
      </tr>`
    )
    .join('')

  const body = `
  ${letterhead({ department, schoolName })}

  <div class="doc-title muol">ព្រឹត្តិបត្រតាមដានប្រវត្តិអវត្តមានសិស្ស</div>
  <div class="doc-subtitle">ឆ្នាំសិក្សា ${esc(academicYear)} &nbsp;|&nbsp; សរុបកំណត់ត្រា៖ ${kh(rows.length)} លើក</div>

  <table class="info">
    <tr>
      <td class="k">គោត្តនាម-នាម ៖</td><td class="v">${esc(student?.name)}</td>
      <td class="k">អត្តលេខ ៖</td><td class="v">${esc(student?.studentId)}</td>
    </tr>
    <tr>
      <td class="k">ថ្នាក់ទី ៖</td><td class="v">${esc(student?.class)}</td>
      <td class="k">កាលបរិច្ឆេទចេញ ៖</td><td class="v">${khDate()}</td>
    </tr>
  </table>

  <table class="data-table strip">
    <thead>
      <tr>
        <th>គ្មានច្បាប់</th>
        <th>មានច្បាប់</th>
        <th>ម៉ោងខកខានសរុប</th>
        <th>ស្ថានភាពវិន័យ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${kh(toNum(absentCount))} ថ្ងៃ</td>
        <td>${kh(toNum(leaveCount))} ថ្ងៃ</td>
        <td>${kh(toNum(totalSessions))} ម៉ោង</td>
        <td>${esc(statusInfo?.label || 'ធម្មតា')}</td>
      </tr>
    </tbody>
  </table>

  <table class="data-table">
    <colgroup>
      <col style="width:6%"><col style="width:18%"><col style="width:18%"><col style="width:14%">
      <col style="width:15%"><col style="width:11%"><col style="width:20%">
    </colgroup>
    <thead>
      <tr>
        <th class="nw">ល.រ</th>
        <th>កាលបរិច្ឆេទ</th>
        <th>ម៉ោងសិក្សា</th>
        <th>មុខវិជ្ជា</th>
        <th>គ្រូបង្រៀន</th>
        <th>ប្រភេទ</th>
        <th>មូលហេតុ</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows || '<tr><td colspan="7" class="empty">មិនមានកំណត់ត្រាអវត្តមានទេ</td></tr>'}
    </tbody>
  </table>

  ${signatureBlock([approver('នាយកសាលា'), approver('គ្រូបន្ទុកថ្នាក់'), preparer(schoolName)], '1fr 1fr 7.6cm')}`

  printDocument({
    title: `ព្រឹត្តិបត្រតាមដានប្រវត្តិអវត្តមានសិស្ស - ${student?.name ?? ''}`,
    body
  })
}