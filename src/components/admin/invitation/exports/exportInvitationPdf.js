/**
 * ─────────────────────────────────────────────────────────────
 * Export Student Invitation Letters to PDF (A4 Portrait)
 * Official Khmer Administrative Document Layout (គំរូសាលា)
 * ─────────────────────────────────────────────────────────────
 */

import { getCachedSchoolName } from '../../../../utils/api';
import { getKhmerLunarDateString } from '../../../../utils/khmerDate';
import { TACTEING_FONT_CSS } from './tacteingFont';

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const KH_NUMBERS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const toKhmerNum = (num) => String(num ?? '').split('').map((d) => KH_NUMBERS[parseInt(d, 10)] ?? d).join('');

const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

const formatMeetingDate = (dateString, timeString) => {
  if (!dateString) {
    return `នៅថ្ងៃ.............. ទី............ ខែ.............. ឆ្នាំ................ វេលាម៉ោង.................... ជាកំណត់។`;
  }
  const date = new Date(dateString);
  const dayNames = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
  const dayOfWeek = dayNames[date.getDay()] || '............';
  const day = toKhmerNum(date.getDate().toString().padStart(2, '0'));
  const month = KH_MONTHS[date.getMonth()] || '............';
  const year = toKhmerNum(date.getFullYear());
  const time = timeString ? toKhmerNum(timeString) : '....................';

  return `នៅថ្ងៃ<strong>${dayOfWeek}</strong> ទី <strong>${day}</strong> ខែ <strong>${month}</strong> ឆ្នាំ <strong>${year}</strong> វេលាម៉ោង <strong>${time}</strong> ជាកំណត់។`;
};

const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Moul&family=Noto+Sans+Khmer:wght@400;700&family=Battambang:wght@400;700&display=swap">`;

const BASE_CSS = `
  /* A4 · គែមស្តង់ដាររដ្ឋបាល (9mm លើ/ក្រោម, 12mm ឆ្វេង/ស្តាំ) */
  @page {
    size: A4 portrait;
    margin: 8mm 12mm;
  }
  :root {
    --font-body: 'Khmer OS Siemreap', 'Khmer OS Battambang', 'Noto Sans Khmer', 'Battambang', Arial, sans-serif;
    --font-muol: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', serif;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
    font-family: var(--font-body);
    font-size: 12pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .muol {
    font-family: var(--font-muol) !important;
    font-weight: normal;
  }
  .ornament-tacteing {
    font-family: 'Tacteing', 'Khmer OS Muol Light', serif !important;
    font-size: 16pt;
    line-height: 1;
    margin-top: 1px;
    margin-bottom: 2px;
  }

  /* ទំព័រ A4 មួយ = លិខិត ២ ច្បាប់ */
  .a4-page {
    width: 100%;
    height: 278mm;
    max-height: 278mm;
    page-break-inside: avoid;
    break-inside: avoid;
    page-break-after: always;
    break-after: page;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .a4-page:last-child {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
  .letter-half {
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1mm 0;
  }

  /* បន្ទាត់ខណ្ឌចែក ២ ច្បាប់ */
  .divider-line {
    flex: none;
    width: 100%;
    border-top: 1px dashed #555555;
    margin: 3mm 0;
    position: relative;
    text-align: center;
  }
  .divider-line::after {
    content: "✂️ កាត់ត្រង់នេះ (១ ច្បាប់ជូនអាណាព្យាបាល · ១ ច្បាប់តម្កល់ទុកនៅសាលា)";
    position: absolute;
    top: -8.5px;
    right: 25px;
    background: #ffffff;
    padding: 0 8px;
    font-size: 8.5pt;
    color: #666666;
  }

  .single-letter {
    width: 100%;
    font-size: 12pt;
    line-height: 1.6;
    color: #000000;
  }

  /* ─── ក្បាលលិខិត ─── */
  .header-center {
    text-align: center;
    line-height: 1.35;
  }
  .text-kingdom {
    font-size: 13pt;
  }
  .text-motto {
    font-size: 12pt;
  }
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: -6px;
    margin-bottom: 2px;
  }
  .header-left {
    text-align: left;
    line-height: 1.45;
  }
  .text-school {
    font-size: 12pt;
  }
  .text-ref {
    font-size: 11.5pt;
  }
  .header-right {
    text-align: right;
    font-size: 11.5pt;
    line-height: 1.45;
  }

  /* ─── ចំណងជើង ─── */
  .title-box {
    text-align: center;
    margin: 2mm 0;
  }
  .doc-title {
    font-size: 15pt;
    text-decoration: underline;
    letter-spacing: 0.5px;
  }

  /* ─── ខ្លឹមសារលិខិត ─── */
  .body-table {
    width: 100%;
    border-collapse: collapse;
    border: none;
    table-layout: fixed;
    font-size: 12pt;
    line-height: 1.65;
  }
  .body-table td {
    border: none;
    padding: 1.5px 0;
    vertical-align: top;
  }
  .col-label {
    width: 44mm;
    white-space: nowrap;
    font-weight: bold;
    font-size: 12pt;
  }
  .col-colon {
    width: 6mm;
    font-weight: bold;
    text-align: center;
    font-size: 12pt;
  }
.val-line {
  display: inline-block;
  box-sizing: border-box;
  min-width: 30mm;
  padding: 0 4px;          /* ដក padding-bottom ចេញ */
  line-height: 0.8;        /* ចំណុចសំខាន់ ៖ បន្ថយពី 1.65 */
  font-weight: bold;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline; /* ប្តូរពី bottom */
  border-bottom: 1px dotted #000;
}
.w-parent  { min-width: 25mm; }
.w-student { min-width: 28mm; }
.w-gender  { min-width: 14mm; }
.w-age     { min-width: 12mm; }
.w-class   { min-width: 14mm; }
.w-ref     { min-width: 20mm; }
  .note-text {
    font-style: normal;
    font-size: 11pt;
    color: #222222;
  }

  /* ─── កថាខណ្ឌបញ្ចប់ ─── */
.closing-text {
    margin-top: 0;
    margin-bottom: 1;
    text-align: justify;
    text-indent: 28mm;
    font-size: 12pt;
    line-height: 1.8;
}

  /* ─── ហត្ថលេខា ─── */
  .signature-box {
    margin-top: 2mm;
    padding-right: 20mm;
    text-align: right;
  }
  .text-sig-role {
    font-size: 12.5pt;
  }
  .sig-space {
    height: 13mm;
  }
  @media print {
    body { padding: 0 !important; }
  }
`;

function buildSingleLetterHtml(student = {}, config = {}) {
  const schoolName = config.schoolName || getCachedSchoolName() || 'វិទ្យាល័យអង្គរកា';

  // Abbreviate school prefix for date header (e.g., វិទ្យាល័យអង្គរកា → វិ.អង្គរកា)
  const schoolPrefix = schoolName.startsWith('វិទ្យាល័យ')
    ? 'វិ.' + schoolName.replace(/^វិទ្យាល័យ\s*/, '')
    : schoolName.startsWith('អនុវិទ្យាល័យ')
      ? 'អ.' + schoolName.replace(/^អនុវិទ្យាល័យ\s*/, '')
      : schoolName;

  const today = new Date();
  const currentDay = toKhmerNum(today.getDate().toString().padStart(2, '0'));
  const currentMonth = KH_MONTHS[today.getMonth()];
  const currentYear = toKhmerNum(today.getFullYear());
  const lunarDateStr = getKhmerLunarDateString(today);

  const field = (cls, value) =>
    `<span class="val-line ${cls}">${value ? value : '&nbsp;'}</span>`;

  const parentNameHtml = `លោក/លោកស្រី ${field('w-parent', student.parentName && esc(student.parentName))}`;
  const studentNameHtml = field('w-student', student.name && esc(student.name));
  const genderHtml = field('w-gender', student.gender && esc(student.gender));
  const ageHtml = field('w-age', student.age && toKhmerNum(student.age));
  const classHtml = field('w-class', student.class && toKhmerNum(student.class));
  const refHtml = field('w-ref', config.reference && toKhmerNum(config.reference));
  const meetingDateHtml = formatMeetingDate(config.meetingDate, config.meetingTime);

  return `
    <div class="single-letter">
      <!-- Header: ព្រះរាជាណាចក្រ / ស្លោក / រូប 3 -->
      <div class="header-center">
        <div class="muol text-kingdom">ព្រះរាជាណាចក្រកម្ពុជា</div>
        <div class="muol text-motto">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
        <div class="ornament-tacteing">3</div>
      </div>

      <!-- ឈ្មោះសាលា + លេខ (ឆ្វេង) & កាលបរិច្ឆេទ (ស្តាំ) នៅជួរស្មើគ្នា -->
      <div class="header-row">
        <div class="header-left">
          <div class="muol text-school">${esc(schoolName)}</div>
          <div class="text-ref">លេខ${refHtml}</div>
        </div>
        <div class="header-right" style="white-space: nowrap;">
          <div>${esc(lunarDateStr)}</div>
          <div>${esc(schoolPrefix)} ថ្ងៃទី ${currentDay} ខែ ${currentMonth} ឆ្នាំ ${currentYear}</div>
        </div>
      </div>

      <!-- Title -->
      <div class="title-box">
        <span class="muol doc-title">លិខិតអញ្ជើញ${student.cycle > 1 ? ` (លើកទី ${toKhmerNum(student.cycle)})` : ''}</span>
      </div>

      <!-- Body Items -->
      <table class="body-table">
        <tbody>
          <tr>
            <td class="col-label">- សូមគោរពអញ្ជើញ</td>
            <td class="col-colon">៖</td>
            <td>
              ${parentNameHtml} ជាអាណាព្យាបាលសិស្សឈ្មោះ ${studentNameHtml}
              <br />
              ភេទ ${genderHtml} អាយុ ${ageHtml} ឆ្នាំ រៀនថ្នាក់ទី ${classHtml} នៃ${esc(schoolName)}។
              <br/>
              ទីលំនៅបច្ចុប្បន្នភូមិ..........................ឃុំ.....................ស្រុក..............ខេត្ត.........
              <br />
              <span class="note-text">(បញ្ជាក់៖ប្រសិនបើកូនលោក/លោកស្រីឈប់រៀនហើយ ពុំចាំបាច់អញ្ជើញមកទេ)</span>
            </td>
          </tr>
          <tr>
            <td class="col-label">- ដើម្បីចូលរួម</td>
            <td class="col-colon">៖</td>
            <td>
              ទទួលនូវព័ត៌មានមួយចំនួនដែលពាក់ព័ន្ធនឹងអវត្តមានកូនរបស់លោក/លោកស្រី។
            </td>
          </tr>
          <tr>
            <td class="col-label">- កាលបរិច្ឆេទ</td>
            <td class="col-colon">៖</td>
            <td>
              ${meetingDateHtml}
            </td>
          </tr>
          <tr>
            <td class="col-label">- ទីកន្លែង</td>
            <td class="col-colon">៖</td>
            <td>
              <strong>${esc(config.location || schoolName)}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Closing sentence -->
      <div class="closing-text">
        សូមលោក/លោកស្រី និងប្អូនៗសិស្សានុសិស្សដែលមានឈ្មោះខាងលើអញ្ជើញចូលរួមកុំបីខាន និង
      </div>
      <div class="closing-text">
        ទទួលនូវការគោរពរាប់អានដ៏ស្មោះអំពីខ្ញុំ។
      </div>

      <!-- Signature Area -->
      <div class="signature-box">
        <div class="muol text-sig-role">នាយកសាលា</div>
        <div class="sig-space"></div>
      </div>
    </div>
  `;
}

function printDocument({ title, body }) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('សូមអនុញ្ញាត Popup ក្នុង Browser ដើម្បីបើកផ្ទាំងបោះពុម្ព');
    return;
  }

  w.document.write(`<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="utf-8">
  <title>${esc(title)}</title>
  ${FONT_LINKS}
  <style>
    ${TACTEING_FONT_CSS}
    ${BASE_CSS}
  </style>
</head>
<body>
  ${body}
</body>
</html>`);
  w.document.close();

  let printed = false;
  const doPrint = () => {
    if (printed || w.closed) return;
    printed = true;
    setTimeout(() => {
      w.focus();
      w.print();
    }, 300);
  };
  const waitForFonts = () => {
    const ready = w.document.fonts && w.document.fonts.ready;
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
    Promise.race([ready || Promise.resolve(), timeout]).then(doPrint);
  };

  if (w.document.readyState === 'complete') waitForFonts();
  else w.addEventListener('load', waitForFonts);
  setTimeout(doPrint, 6000);
}

/**
 * Main export function: prints invitation letters as A4 PDF document
 */
export function exportInvitationPdf({ selectedStudents = [], config = {} }) {
  const printMode = config.printMode || 'duplicate';

  if (!selectedStudents || selectedStudents.length === 0) {
    alert('សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ម្នាក់!');
    return;
  }

  const pagesHtml = [];

  if (printMode === 'pair') {
    // 2 different students per A4 sheet
    for (let i = 0; i < selectedStudents.length; i += 2) {
      const topStudent = selectedStudents[i];
      const bottomStudent = selectedStudents[i + 1] || selectedStudents[i];

      pagesHtml.push(`
        <div class="a4-page">
          <div class="letter-half">
            ${buildSingleLetterHtml(topStudent, config)}
          </div>
          <div class="divider-line"></div>
          <div class="letter-half">
            ${buildSingleLetterHtml(bottomStudent, config)}
          </div>
        </div>
      `);
    }
  } else {
    // Default duplicate mode: 2 identical copies of the same student per A4 page
    selectedStudents.forEach((student) => {
      pagesHtml.push(`
        <div class="a4-page">
          <div class="letter-half">
            ${buildSingleLetterHtml(student, config)}
          </div>
          <div class="divider-line"></div>
          <div class="letter-half">
            ${buildSingleLetterHtml(student, config)}
          </div>
        </div>
      `);
    });
  }

  const title = `លិខិតអញ្ជើញអាណាព្យាបាល_${selectedStudents.length}នាក់_${new Date().toISOString().split('T')[0]}`;
  printDocument({
    title,
    body: pagesHtml.join('')
  });
}
