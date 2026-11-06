/**
 * ─────────────────────────────────────────────────────────────
 * Export Student List to Microsoft Word (.doc)
 * (A4 Landscape · ទម្រង់ឯកសាររដ្ឋបាលខ្មែរ ដូចទៅនឹងទម្រង់ PDF ទាំងស្រុង)
 * ─────────────────────────────────────────────────────────────
 */

import { getCachedSchoolName } from '../../../../utils/api.js';
import { getKhmerLunarDateString } from '../../../../utils/khmerDate.js';

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const KH_NUMBERS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const toKhmerNum = (num) => String(num ?? '').split('').map((d) => KH_NUMBERS[parseInt(d, 10)] ?? d).join('');

const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

const WORD_CSS = `
  @page WordSection1 {
    size: 841.9pt 595.3pt; /* A4 Landscape */
    margin: 34.0pt 42.5pt 34.0pt 42.5pt; /* ~12mm top/bottom, 15mm left/right */
    mso-header-margin: 0pt;
    mso-footer-margin: 0pt;
    mso-paper-source: 0;
  }
  div.WordSection1 { page: WordSection1; }

  body {
    font-family: 'Khmer OS Siemreap', 'Khmer OS Battambang', 'Noto Sans Khmer', 'Battambang', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #000000;
    margin: 0;
    padding: 0;
  }
  .muol {
    font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', serif !important;
    font-weight: normal;
  }
  .kingdom {
    text-align: center;
    font-size: 11.5pt;
    line-height: 1.4;
    margin-bottom: 2px;
  }
  .ornament-tacteing {
    font-family: 'Tacteing', 'Khmer OS Muol Light', serif;
    font-size: 15pt;
    line-height: 1;
    margin-top: 1px;
    margin-bottom: 2px;
  }
  .org-header {
    width: 9.5cm;
    text-align: left;
    font-size: 10pt;
    line-height: 1.5;
    margin-top: 4px;
    margin-bottom: 4px;
  }
  .org-rule {
    width: 2.4cm;
    border-top: 0.75pt solid #000000;
    margin: 4px auto 0;
  }

  .doc-title {
    font-size: 14pt;
    text-align: center;
    margin-top: 6px;
    margin-bottom: 2px;
  }
  .doc-subtitle {
    font-size: 10pt;
    text-align: center;
    color: #333333;
    margin-bottom: 10px;
  }

  table.data-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 9.5pt;
    border: 0.75pt solid #000000;
  }
  table.data-table th, table.data-table td {
    border: 0.75pt solid #000000;
    padding: 4.5px 4px;
    vertical-align: middle;
  }
  table.data-table th {
    background-color: #ededed;
    font-weight: bold;
    text-align: center;
  }

  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }

  .footer-sign-table {
    width: 100%;
    border-collapse: collapse;
    border: none;
    margin-top: 18px;
  }
  .footer-sign-table td {
    border: none;
    vertical-align: top;
    text-align: center;
    padding: 0;
    font-size: 10pt;
    line-height: 1.6;
  }
  .sig-space {
    height: 60pt;
    line-height: 60pt;
    font-size: 1pt;
  }
`;

function wrapWordHtml(title, body) {
  return `<html xmlns:o='urn:schemas-microsoft-com:office:office'
xmlns:w='urn:schemas-microsoft-com:office:word'
xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
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
 * Main export function: exports student list to Word (.doc)
 */
export function exportStudentsWord({
  students = [],
  filterClass = 'ALL',
  academicYear = '២០២៥ - ២០២៦',
  schoolName = '',
  department = 'មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តតាកែវ'
}) {
  if (!students || students.length === 0) {
    alert('មិនមានទិន្នន័យសិស្សសម្រាប់ទាញយកទេ!');
    return;
  }

  const finalSchoolName = schoolName || getCachedSchoolName() || 'វិទ្យាល័យអង្គរកា';
  const schoolPrefix = finalSchoolName.startsWith('វិទ្យាល័យ')
    ? 'វិ.' + finalSchoolName.replace(/^វិទ្យាល័យ\s*/, '')
    : finalSchoolName.startsWith('អនុវិទ្យាល័យ')
      ? 'អ.' + finalSchoolName.replace(/^អនុវិទ្យាល័យ\s*/, '')
      : finalSchoolName;

  const today = new Date();
  const currentDay = toKhmerNum(today.getDate().toString().padStart(2, '0'));
  const currentMonth = KH_MONTHS[today.getMonth()];
  const currentYear = toKhmerNum(today.getFullYear());
  const lunarDateStr = getKhmerLunarDateString(today);

  const total = students.length;
  const femaleCount = students.filter((s) => s.gender === 'F' || s.gender === 'ស្រី').length;

  const titleText = filterClass && filterClass !== 'ALL'
    ? `បញ្ជីរាយនាមសិស្ស ថ្នាក់ទី ${toKhmerNum(filterClass)}`
    : 'បញ្ជីរាយនាមសិស្ស';

  const subtitleText = `ឆ្នាំសិក្សា ${academicYear} | សរុបចំនួន៖ ${toKhmerNum(total)} នាក់ (ស្រី ${toKhmerNum(femaleCount)} នាក់)`;

  const rowsHtml = students
    .map((s, idx) => {
      const isFemale = s.gender === 'F' || s.gender === 'ស្រី';
      const genderStr = isFemale ? 'ស្រី' : 'ប្រុស';
      const statusStr = s.status === 'active' || !s.status ? 'កំពុងសិក្សា' : s.status === 'suspended' ? 'ផ្អាកការសិក្សា' : 'ប្តូរសាលា';

      return `
      <tr>
        <td class="text-center">${toKhmerNum(idx + 1)}</td>
        <td class="text-center" style="font-weight: bold;">${esc(s.id || s.studentId || '')}</td>
        <td class="text-left" style="font-weight: bold; padding-left: 6px;">${esc(s.name || '')}</td>
        <td class="text-center">${genderStr}</td>
        <td class="text-center" style="font-weight: bold;">${toKhmerNum(s.class || s.className || '')}</td>
        <td class="text-center">${toKhmerNum(s.dob || '-')}</td>
        <td class="text-center">${toKhmerNum(s.phone || '-')}</td>
        <td class="text-left" style="padding-left: 6px;">${esc(s.parentName || '-')}</td>
        <td class="text-center">${toKhmerNum(s.parentPhone || '-')}</td>
        <td class="text-center">${statusStr}</td>
      </tr>
    `;
    })
    .join('');

  const bodyHtml = `
    <!-- Top Kingdom Block (Centered) -->
    <div class="kingdom">
      <div class="muol" style="font-size: 11.5pt;">ព្រះរាជាណាចក្រកម្ពុជា</div>
      <div class="muol" style="font-size: 10.5pt;">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
      <div class="ornament-tacteing">3</div>
    </div>

    <!-- Organization Header (Moved down below Kingdom) -->
    <div class="org-header">
      <div class="muol" style="font-size: 10pt;">ក្រសួងអប់រំ យុវជន និងកីឡា</div>
      <div class="muol" style="font-size: 10pt;">${esc(department)}</div>
      <div class="muol" style="font-size: 10pt;">${esc(finalSchoolName)}</div>
      <div class="org-rule"></div>
    </div>

    <!-- Title & Subtitle -->
    <div class="doc-title muol">${esc(titleText)}</div>
    <div class="doc-subtitle">${esc(subtitleText)}</div>

    <!-- Data Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 38px;">ល.រ</th>
          <th style="width: 75px;">អត្តលេខ</th>
          <th style="width: 170px;">គោត្តនាម - នាម</th>
          <th style="width: 48px;">ភេទ</th>
          <th style="width: 55px;">ថ្នាក់</th>
          <th style="width: 95px;">ថ្ងៃខែឆ្នាំកំណើត</th>
          <th style="width: 100px;">លេខទូរស័ព្ទ</th>
          <th style="width: 160px;">ឈ្មោះអាណាព្យាបាល</th>
          <th style="width: 105px;">ទូរស័ព្ទអាណាព្យាបាល</th>
          <th style="width: 85px;">ស្ថានភាព</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- Footer Signatures -->
    <table class="footer-sign-table">
      <tr>
        <td style="width: 45%;">
          <br />
          <div class="muol">បានឃើញ និងឯកភាព</div>
          <div class="muol">នាយក${esc(finalSchoolName)}</div>
          <div class="sig-space">&nbsp;</div>
        </td>
        <td style="width: 10%;"></td>
        <td style="width: 45%;">
          <div>${esc(lunarDateStr)}</div>
          <div>${esc(schoolPrefix)} ថ្ងៃទី ${currentDay} ខែ ${currentMonth} ឆ្នាំ ${currentYear}</div>
          <div class="muol" style="margin-top: 2px;">អ្នករៀបចំបញ្ជី</div>
          <div class="sig-space">&nbsp;</div>
        </td>
      </tr>
    </table>
  `;

  const wordHtml = wrapWordHtml(titleText, bodyHtml);
  triggerWordDownload(wordHtml, `${titleText}_${finalSchoolName}_${new Date().toISOString().split('T')[0]}.doc`);
}

