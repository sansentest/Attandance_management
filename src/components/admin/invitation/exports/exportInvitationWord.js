/**
 * ─────────────────────────────────────────────────────────────
 * Export Student Invitation Letters to Microsoft Word (.doc)
 * (A4 · ទម្រង់ឯកសាររដ្ឋបាលខ្មែរ ដូចទៅនឹងទម្រង់ PDF ទាំងស្រុង)
 * ─────────────────────────────────────────────────────────────
 */

import { getCachedSchoolName } from '../../../../utils/api';
import { getKhmerLunarDateString } from '../../../../utils/khmerDate';

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

const WORD_CSS = `
  @page WordSection1 {
    size: 595.3pt 841.9pt; /* A4 Portrait */
    margin: 22.7pt 34.0pt 22.7pt 34.0pt; /* 8mm top/bottom, 12mm left/right exactly matching PDF */
    mso-header-margin: 0pt;
    mso-footer-margin: 0pt;
    mso-paper-source: 0;
  }
  div.WordSection1 { page: WordSection1; }

  body {
    font-family: 'Khmer OS Siemreap', 'Khmer OS Battambang', 'Noto Sans Khmer', 'Battambang', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #000000;
    margin: 0;
    padding: 0;
  }
  .muol {
    font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', serif !important;
    font-weight: normal;
  }
  .ornament-tacteing {
    font-family: 'Tacteing', 'Khmer OS Muol Light', serif;
    font-size: 11pt;
    line-height: 1;
    margin-top: 1px;
    margin-bottom: 2px;
  }
  .header-table {
    width: 100%;
    border-collapse: collapse;
    border: none;
    margin-top: -6px;
    margin-bottom: 2px;
  }
  .header-table td {
    font-size: 11pt;
    vertical-align: top;
    border: none;
    padding: 0;
  }
  .doc-title {
    font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', serif !important;
    font-size: 11pt;
    text-decoration: underline;
    letter-spacing: 0.5px;
  }
  .body-table {
    width: 100%;
    border-collapse: collapse;
    border: none;
    font-size: 11pt;
    line-height: 1.65;
  }
  .body-table td {
    font-size: 11pt;
    border: none;
    vertical-align: top;
    padding: 1.5px 0;
  }
  .col-label {
    width: 130pt;
    font-weight: bold;
    white-space: nowrap;
    font-size: 11pt;
  }
  .col-colon {
    width: 18pt;
    font-weight: bold;
    text-align: center;
    font-size: 11pt;
  }
  .note-text {
    font-style: normal;
    font-size: 11pt;
    color: #222222;
  }
  .closing-text {
    margin-top: 0;
    margin-bottom: 1px;
    text-align: justify;
    text-indent: 28pt;
    font-size: 11pt;
    line-height: 1.8;
  }
  .signature-box {
    margin-top: 4pt;
    padding-left: 70pt;
    text-align: right;
  }
  .text-sig-role {
    font-size: 11pt;
  }
  .divider-line {
    border-top: 1pt dashed #555555;
    margin: 4pt 0 6pt 0;      /* ខាងលើតូច (មានចន្លោះហត្ថលេខារួចហើយ) · ខាងក្រោមធំជាងបន្តិច */
    padding: 0;
    font-size: 2pt;           /* &nbsp; តូចបំផុត ដើម្បីកុំឲ្យ Word លុប div ទទេ */
    line-height: 2pt;
  }
  .page-break {
    page-break-before: always;
    mso-break-type: page-break;
  }
`;

/**
 * Word មិនគាំទ្រ inline-block / min-width / border-bottom លើ <span> ទេ
 * ដូច្នេះប្រើចំណុច "." ជាអក្សរពិត ដើម្បីឲ្យមើលឃើញ និងមានប្រវែងស្មើគ្នា។
 */
const dots = (n) => '.'.repeat(Math.max(n, 0));

// width = ចំនួនតួអក្សរសរុបប្រហែល (ចំណុច + តម្លៃ)
const field = (width, raw, fmt = (v) => v) => {
  if (!raw) return dots(width);                  // គ្មានទិន្នន័យ → ចំណុចទទេ
  const text = fmt(String(raw));
  const pad = Math.max(width - text.length, 2);  // ចំណុចសល់ ឲ្យប្រវែងសរុបស្មើគ្នា
  const left = Math.floor(pad / 2);
  return `${dots(left)}<b>${esc(text)}</b>${dots(pad - left)}`;
};

function buildWordSingleLetter(student = {}, config = {}) {
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

  const parentNameHtml = `លោក/លោកស្រី ${field(20, student.parentName)}`;
  const studentNameHtml = field(20, student.name);
  const genderHtml = field(8, student.gender);
  const ageHtml = field(6, student.age, toKhmerNum);
  const classHtml = field(8, student.class, toKhmerNum);
  const refHtml = field(14, config.reference, toKhmerNum);
  const meetingDateHtml = formatMeetingDate(config.meetingDate, config.meetingTime);

  return `
    <!-- Header: ព្រះរាជាណាចក្រ / ស្លោក / រូប 3 -->
    <div style="text-align: center; line-height: 1.35;">
      <div class="muol" style="font-size: 11pt;">ព្រះរាជាណាចក្រកម្ពុជា</div>
      <div class="muol" style="font-size: 11pt;">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
      <div class="ornament-tacteing">3</div>
    </div>

    <!-- ឈ្មោះសាលា + លេខ (ឆ្វេង) & កាលបរិច្ឆេទ (ស្តាំ) នៅជួរស្មើគ្នា -->
    <table class="header-table" style="font-size: 11pt;">
      <tr>
        <td style="width: 38%; text-align: left; line-height: 1.45; font-size: 11pt;">
          <div class="muol" style="font-size: 11pt;">${esc(schoolName)}</div>
          <div style="font-size: 11pt;">លេខ${refHtml}</div>
        </td>
        <td style="width: 62%; text-align: right; font-size: 11pt; line-height: 1.45; white-space: nowrap;">
          <div style="font-size: 11pt;">${esc(lunarDateStr)}</div>
          <div style="font-size: 11pt;">${esc(schoolPrefix)} ថ្ងៃទី ${currentDay} ខែ ${currentMonth} ឆ្នាំ ${currentYear}</div>
        </td>
      </tr>
    </table>

    <!-- Title -->
    <div style="text-align: center; margin: 4pt 0;">
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
            <br />
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
      សូមលោក/លោកស្រី និងប្អូនៗសិស្សានុសិស្សដែលមានឈ្មោះខាងលើអញ្ជើញចូលរួមកុំបីខាន និងទទួលនូវ
    </div>
    <div class="closing-text">
      ការគោរពរាប់អានដ៏ស្មោះអំពីខ្ញុំ។
    </div>

    <!-- Signature Area -->
    <div class="signature-box">
      <div class="muol text-sig-role">នាយកសាលា</div>
      <div style="height: 40pt; line-height: 40pt;">&nbsp;</div>
    </div>
  `;
}

function wrapWordHtml(body) {
  return `<html xmlns:o='urn:schemas-microsoft-com:office:office'
xmlns:w='urn:schemas-microsoft-com:office:word'
xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>លិខិតអញ្ជើញ</title>
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
</html>`;
}

function triggerWordDownload(htmlContent, filename) {
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Main export function: exports invitation letters to Microsoft Word (.doc)
 */
export function exportInvitationWord({ selectedStudents = [], config = {} }) {
  const printMode = config.printMode || 'duplicate';

  if (!selectedStudents || selectedStudents.length === 0) {
    alert('សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ម្នាក់!');
    return;
  }

  const pages = [];
  if (printMode === 'pair') {
    // 2 different students per A4 sheet
    for (let i = 0; i < selectedStudents.length; i += 2) {
      pages.push({
        topStudent: selectedStudents[i],
        bottomStudent: selectedStudents[i + 1] || selectedStudents[i]
      });
    }
  } else {
    // Default duplicate mode: 2 copies of the same student per A4 page
    selectedStudents.forEach((student) => {
      pages.push({
        topStudent: student,
        bottomStudent: student
      });
    });
  }

  const pagesHtml = pages
    .map((page, idx) => {
      const isLast = idx === pages.length - 1;
      return `
      <div>
        ${buildWordSingleLetter(page.topStudent, config)}
        <div class="divider-line">&nbsp;</div>
        ${buildWordSingleLetter(page.bottomStudent, config)}
      </div>
      ${!isLast ? '<div class="page-break"></div>' : ''}
    `;
    })
    .join('');

  const wordHtml = wrapWordHtml(pagesHtml);
  triggerWordDownload(wordHtml, `លិខិតអញ្ជើញ_អាណាព្យាបាល_${selectedStudents.length}នាក់_${new Date().toISOString().split('T')[0]}.doc`);
}