/**
 * ─────────────────────────────────────────────────────────────
 * Export Student Discipline Tracking to Microsoft Word (.doc)
 * (A4 · ទម្រង់ឯកសាររដ្ឋបាលខ្មែរ ដូចទៅនឹងទម្រង់ PDF ទាំងស្រុង)
 * ─────────────────────────────────────────────────────────────
 *  1. exportTrackingSummaryWord – តារាងតាមដានវិន័យ និងអវត្តមានសិស្ស
 *  2. exportTrackingDetailWord  – ព្រឹត្តិបត្រតាមដានប្រវត្តិអវត្តមានសិស្ស
 */

// ───────────── Config (ប្តូរបានតាមតម្រូវការ) ─────────────
const DEFAULT_DEPARTMENT = 'មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តតាកែវ'
const DEFAULT_ACADEMIC_YEAR = '២០២៦ - ២០២៧'

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

// ───────────── Shared CSS for Word ─────────────
const WORD_CSS = `
  @page WordSection1 {
    size: 595.3pt 841.9pt; /* A4 Portrait */
    margin: 2.0cm 2.0cm 2.0cm 2.0cm;
    mso-header-margin: 36.0pt;
    mso-footer-margin: 36.0pt;
    mso-paper-source: 0;
  }
  div.WordSection1 { page: WordSection1; }

  body {
    font-family: 'Khmer OS Siemreap', 'Khmer OS Battambang', 'Segoe UI', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #000000;
    margin: 0;
    padding: 0;
  }
  .muol {
    font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', serif;
    font-weight: normal;
    line-height: 1.7;
  }

  /* ── Letterhead ── */
  .kingdom {
    text-align: center;
    font-size: 12pt;
    margin-bottom: 2px;
  }
  .ornament-font {
    font-family: 'Tacteing', 'Khmer OS Muol Light', serif;
    font-size: 20pt;
    line-height: 1.2;
    margin-top: 2px;
  }
  .org {
    width: 9.5cm;
    text-align: left;
    font-size: 11pt;
    margin-top: 2px;
  }
  .org-rule {
    width: 2.4cm;
    border-top: 0.75pt solid #000000;
    margin: 5px auto 0;
  }

  /* ── Title ── */
  .doc-title {
    text-align: center;
    font-size: 13pt;
    margin: 16px 0 2px 0;
  }
  .doc-subtitle {
    text-align: center;
    font-size: 10.5pt;
    margin-bottom: 12px;
  }

  /* ── Tables ── */
  table.data-table, table.strip {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 10pt;
    border: 0.75pt solid #000000;
    mso-border-alt: solid #000000 0.75pt;
  }
  table.data-table th, table.data-table td,
  table.strip th, table.strip td {
    border: 0.75pt solid #000000;
    mso-border-alt: solid #000000 0.75pt;
    padding: 4px 5px;
    vertical-align: middle;
    text-align: center;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  table.data-table th, table.strip th {
    background: #EDEDED;
    font-weight: bold;
    mso-shading: #EDEDED;
  }
  table.data-table td.l {
    text-align: left;
  }
  table.data-table thead {
    display: table-header-group;
  }
  table.data-table tr {
    page-break-inside: avoid;
  }
  table.data-table tr.total-row td {
    font-weight: bold;
    background: #F5F5F5;
  }
  table.data-table td.empty {
    padding: 16px;
    color: #555555;
  }

  /* ── Student info (no borders) ── */
  table.info {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 10.5pt;
  }
  table.info td {
    padding: 2px 0;
    vertical-align: top;
    border: none;
  }
  table.info td.k {
    white-space: nowrap;
    padding-right: 6px;
  }
  table.info td.v {
    font-weight: bold;
    padding-right: 14px;
  }
  table.strip {
    margin-bottom: 12px;
  }

  /* ── Signatures Table ── */
  table.sign-table {
    width: 100%;
    border-collapse: collapse;
    border: none;
    margin-bottom: 2px;
    page-break-inside: avoid;
  }
  table.sign-table td {
    vertical-align: top;
    text-align: center;
    border: none;
    font-size: 10pt;
    line-height: 1.8;
    padding: 0 4px;
  }
`

// ───────────── Letterhead ─────────────
const letterhead = ({ department, schoolName }) => `
  <div class="kingdom">
    <div class="muol">ព្រះរាជាណាចក្រកម្ពុជា</div>
    <div class="muol">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
    <div class="ornament-font">3</div>
  </div>
  <div class="org">
    <div class="muol">${esc(department)}</div>
    ${schoolName ? `<div class="muol">${esc(schoolName)}</div>` : ''}
    <div class="org-rule"></div>
  </div>`

// ───────────── Word Document Wrapper ─────────────
function buildWordDocument({ title, body }) {
  return `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${esc(title)}</title>
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
    ${WORD_CSS}
  </style>
</head>
<body>
<div class="WordSection1">
  ${body}
</div>
</body>
</html>`
}

// ───────────── Trigger File Download ─────────────
function triggerWordDownload(htmlContent, filename) {
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────
// 1. Export Summary Discipline Tracking List to Word (.doc)
// ─────────────────────────────────────────────────────────────
export function exportTrackingSummaryWord({
  filteredData = [],
  filterClass = 'ALL',
  schoolName = '',
  totalWarning = 0,
  totalCritical = 0,
  getStudentStatus,
  department = DEFAULT_DEPARTMENT,
  academicYear = DEFAULT_ACADEMIC_YEAR
}) {
  const rows = Array.isArray(filteredData) ? filteredData : []
  const hoursOf = (d) => toNum(d.totalHours !== undefined ? d.totalHours : ((d.absentHours || d.absent || 0) + (d.leaveHours || d.leave || 0)))
  const sum = (fn) => round2(rows.reduce((s, d) => s + fn(d), 0))
  const totalWithAbsence = rows.filter((s) => (Number(s.absent) || 0) > 0 || (Number(s.leave) || 0) > 0).length

  const subtitle = [
    `ឆ្នាំសិក្សា ${esc(academicYear)}`,
    filterClass !== 'ALL' ? `ថ្នាក់ទី ${esc(filterClass)}` : null,
    `សរុបចំនួនសិស្ស៖ ${kh(rows.length)} នាក់`
  ]
    .filter(Boolean)
    .join(' &nbsp;|&nbsp; ')

  const bodyRows = rows
    .map((d, idx) => {
      const st = getStudentStatus ? getStudentStatus(d) : 'NORMAL'
      const stLabel = st === 'CRITICAL' ? 'ត្រូវហៅអាណាព្យាបាល' : st === 'WARNING' ? 'ស្ថិតក្នុងការប្រុងប្រយ័ត្ន' : 'ធម្មតា'
      return `
      <tr>
        <td>${kh(idx + 1)}</td>
        <td>${esc(d.studentId || d.id || '')}</td>
        <td class="l">${esc(d.name || '')}</td>
        <td>${esc(d.class || '')}</td>
        <td>${cell(d.absent)}</td>
        <td>${cell(d.leave)}</td>
        <td>${cell(hoursOf(d))}</td>
        <td>${esc(stLabel)}</td>
        <td>${esc(d.parentPhone || '-')}</td>
      </tr>`
    })
    .join('')

  const totalRow = rows.length
    ? `
      <tr class="total-row">
        <td colspan="4">សរុបរួម</td>
        <td>${cell(sum((d) => toNum(d.absent)))}</td>
        <td>${cell(sum((d) => toNum(d.leave)))}</td>
        <td>${cell(sum(hoursOf))}</td>
        <td></td>
        <td></td>
      </tr>`
    : ''

  const body = `
  ${letterhead({ department, schoolName })}

  <div class="doc-title muol">តារាងតាមដានវិន័យ និងអវត្តមានសិស្ស</div>
  <div class="doc-subtitle">${subtitle}</div>

  <table class="data-table strip" border="1" cellspacing="0" cellpadding="4" style="width: 100%; border-collapse: collapse; border: 0.75pt solid #000000; margin-bottom: 14px;">
    <thead>
      <tr>
        <th style="width: 25%; border: 0.75pt solid #000000; background: #EDEDED; font-weight: bold; text-align: center;">សិស្សសរុប</th>
        <th style="width: 25%; border: 0.75pt solid #000000; background: #EDEDED; font-weight: bold; text-align: center;">មានអវត្តមាន</th>
        <th style="width: 25%; border: 0.75pt solid #000000; background: #EDEDED; font-weight: bold; text-align: center;">ស្ថិតក្នុងការប្រុងប្រយ័ត្ន</th>
        <th style="width: 25%; border: 0.75pt solid #000000; background: #EDEDED; font-weight: bold; text-align: center;">ត្រូវហៅអាណាព្យាបាល</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 0.75pt solid #000000; text-align: center;">${kh(rows.length)} នាក់</td>
        <td style="border: 0.75pt solid #000000; text-align: center;">${kh(totalWithAbsence)} នាក់</td>
        <td style="border: 0.75pt solid #000000; text-align: center;">${kh(totalWarning)} នាក់</td>
        <td style="border: 0.75pt solid #000000; text-align: center;">${kh(totalCritical)} នាក់</td>
      </tr>
    </tbody>
  </table>
  <br/>

  <table class="data-table" border="1" cellspacing="0" cellpadding="4" style="width: 100%; border-collapse: collapse; border: 0.75pt solid #000000;">
    <thead>
      <tr>
        <th rowspan="2" style="width: 5%;">ល.រ</th>
        <th rowspan="2" style="width: 11%;">អត្តលេខ</th>
        <th rowspan="2">គោត្តនាម-នាម</th>
        <th rowspan="2" style="width: 7%;">ថ្នាក់</th>
        <th colspan="2" style="width: 18%;">អវត្តមាន (ថ្ងៃ)</th>
        <th rowspan="2" style="width: 9%;">សរុប (ម៉ោង)</th>
        <th rowspan="2" style="width: 14%;">ស្ថានភាពវិន័យ</th>
        <th rowspan="2" style="width: 14%;">លេខទូរស័ព្ទ</th>
      </tr>
      <tr>
        <th style="width: 9%;">គ្មានច្បាប់</th>
        <th style="width: 9%;">មានច្បាប់</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows || '<tr><td colspan="9" class="empty">មិនមានទិន្នន័យអវត្តមានទេ</td></tr>'}
      ${totalRow}
    </tbody>
  </table>

  <table class="sign-table">
    <tr>
      <td style="width: 50%;">
        <div>&nbsp;</div>
        <div class="muol" style="font-size: 10.5pt; ">បានឃើញ និងឯកភាព</div>
        <div class="muol" style="font-size: 10.5pt;">នាយកសាលា</div>
        <div style="height: 2.4cm;"></div>
      </td>
      <td style="width: 50%;">
        <div>ថ្ងៃ...........ខែ...........ឆ្នាំ...........ព.ស ២៥......</div>
        <div>${esc(schoolName)} ថ្ងៃទី...........ខែ...........ឆ្នាំ...........</div>
        <div class="muol" style="font-size: 10.5pt;">អ្នករៀបចំរបាយការណ៍</div>
        <div style="height: 2.4cm;"></div>
      </td>
    </tr>
  </table>`

  const docTitle = `តារាងតាមដានវិន័យសិស្ស${filterClass !== 'ALL' ? ` ថ្នាក់ទី ${filterClass}` : ''} - ${schoolName}`
  const filename = `តារាងតាមដានវិន័យសិស្ស${filterClass !== 'ALL' ? `_ថ្នាក់ទី_${filterClass}` : ''}_${new Date().toISOString().slice(0, 10)}.doc`
  const htmlContent = buildWordDocument({ title: docTitle, body })
  triggerWordDownload(htmlContent, filename)
}

// ─────────────────────────────────────────────────────────────
// 2. Export Individual Student Detail Discipline History to Word (.doc)
// ─────────────────────────────────────────────────────────────
export function exportTrackingDetailWord({
  student = {},
  filtered = [],
  schoolName = '',
  statusInfo = { label: 'ធម្មតា' },
  threshold = 20,
  department = DEFAULT_DEPARTMENT,
  academicYear = DEFAULT_ACADEMIC_YEAR
}) {
  const rows = Array.isArray(filtered) ? filtered : []
  const absentCount = student?.absent || 0
  const leaveCount = student?.leave || 0
  const studentTotalHours = student?.totalHours !== undefined
    ? student.totalHours
    : (((student?.absentHours || 0) + (student?.leaveHours || 0)) || rows.length)

  const bodyRows = rows
    .map(
      (r, idx) => `
      <tr>
        <td>${kh(idx + 1)}</td>
        <td>${kh(esc(r.date || ''))}</td>
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
      <td class="k">អត្តលេខ ៖</td><td class="v">${esc(student?.studentId || student?.id)}</td>
    </tr>
    <tr>
      <td class="k">ថ្នាក់ទី ៖</td><td class="v">${esc(student?.class)}</td>
      <td class="k">ទូរស័ព្ទអាណាព្យាបាល ៖</td><td class="v">${esc(student?.parentPhone || '-')}</td>
    </tr>
    <tr>
      <td class="k">កាលបរិច្ឆេទចេញ ៖</td><td class="v">${khDate()}</td>
      <td class="k">កម្រិតកំណត់វិន័យ ៖</td><td class="v">${kh(toNum(threshold))} ថ្ងៃ</td>
    </tr>
  </table>

  <table class="data-table strip" border="1" cellspacing="0" cellpadding="4" style="width: 100%; border-collapse: collapse; border: 0.75pt solid #000000; margin-bottom: 14px;">
    <thead>
      <tr>
        <th style="width: 25%; border: 0.75pt solid #000000; background: #EDEDED; font-weight: bold; text-align: center;">គ្មានច្បាប់</th>
        <th style="width: 25%; border: 0.75pt solid #000000; background: #EDEDED; font-weight: bold; text-align: center;">មានច្បាប់</th>
        <th style="width: 25%; border: 0.75pt solid #000000; background: #EDEDED; font-weight: bold; text-align: center;">ម៉ោងខកខានសរុប</th>
        <th style="width: 25%; border: 0.75pt solid #000000; background: #EDEDED; font-weight: bold; text-align: center;">ស្ថានភាពវិន័យ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 0.75pt solid #000000; text-align: center;">${kh(toNum(absentCount))} ថ្ងៃ</td>
        <td style="border: 0.75pt solid #000000; text-align: center;">${kh(toNum(leaveCount))} ថ្ងៃ</td>
        <td style="border: 0.75pt solid #000000; text-align: center;">${kh(toNum(studentTotalHours))} ម៉ោង</td>
        <td style="border: 0.75pt solid #000000; text-align: center;">${esc(statusInfo?.label || 'ធម្មតា')}</td>
      </tr>
    </tbody>
  </table>
  <br/>

  <table class="data-table" border="1" cellspacing="0" cellpadding="4" style="width: 100%; border-collapse: collapse; border: 0.75pt solid #000000;">
    <thead>
      <tr>
        <th style="width: 6%;">ល.រ</th>
        <th style="width: 14%;">កាលបរិច្ឆេទ</th>
        <th style="width: 18%;">ម៉ោងសិក្សា</th>
        <th style="width: 16%;">មុខវិជ្ជា</th>
        <th style="width: 15%;">គ្រូបង្រៀន</th>
        <th style="width: 11%;">ប្រភេទ</th>
        <th style="width: 20%;">មូលហេតុ</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows || '<tr><td colspan="7" class="empty">មិនមានកំណត់ត្រាអវត្តមានទេ</td></tr>'}
    </tbody>
  </table>

  <table class="sign-table">
    <tr>
      <td style="width: 28%;">
        <div>&nbsp;</div>
        <div class="muol" style="font-size: 10.5pt;">បានឃើញ និងឯកភាព</div>
        <div class="muol" style="font-size: 10.5pt;">នាយកសាលា</div>
        <div style="height: 2.4cm;"></div>
      </td>
      <td style="width: 28%;">
        <div>&nbsp;</div>
        <div class="muol" style="font-size: 10.5pt;">បានឃើញ និងឯកភាព</div>
        <div class="muol" style="font-size: 10.5pt;">គ្រូបន្ទុកថ្នាក់</div>
        <div style="height: 2.4cm;"></div>
      </td>
      <td style="width: 44%;">
        <div>ថ្ងៃ...........ខែ...........ឆ្នាំ...........ព.ស ២៥......</div>
        <div>${esc(schoolName)} ថ្ងៃទី...........ខែ...........ឆ្នាំ...........</div>
        <div class="muol" style="font-size: 10.5pt;">អ្នករៀបចំរបាយការណ៍</div>
        <div style="height: 2.4cm;"></div>
      </td>
    </tr>
  </table>`

  const docTitle = `ព្រឹត្តិបត្រតាមដានប្រវត្តិអវត្តមានសិស្ស - ${student?.name ?? ''}`
  const filename = `ព្រឹត្តិបត្រតាមដានប្រវត្តិអវត្តមានសិស្ស_${student?.name || 'សិស្ស'}_${new Date().toISOString().slice(0, 10)}.doc`
  const htmlContent = buildWordDocument({ title: docTitle, body })
  triggerWordDownload(htmlContent, filename)
}
