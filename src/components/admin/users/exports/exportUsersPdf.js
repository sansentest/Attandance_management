/**
 * ─────────────────────────────────────────────────────────────
 * Export Users to PDF (A4 Portrait)
 * Official Khmer Administrative Document Layout (គំរូសាលា)
 * ─────────────────────────────────────────────────────────────
 */

import { getCachedSchoolName } from '../../../../utils/api.js';
import { formatRoleLabel } from '../../../../utils/accessControl.js';
import { getKhmerLunarDateString } from '../../../../utils/khmerDate.js';
import { TACTEING_FONT_CSS } from '../../../../utils/tacteingFont.js';

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const KH_NUMBERS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const toKhmerNum = (num) => String(num ?? '').split('').map((d) => KH_NUMBERS[parseInt(d, 10)] ?? d).join('');

const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

const FONT_LINKS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Moul&family=Noto+Sans+Khmer:wght@400;600;700&family=Battambang:wght@400;700&display=swap">`;

const BASE_CSS = `
  @page {
    size: A4 portrait;
    margin: 15mm 15mm 15mm 15mm;
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
    font-size: 10pt;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .muol {
    font-family: var(--font-muol) !important;
    font-weight: normal;
  }
  .kingdom {
    text-align: center;
    font-size: 11.5pt;
    line-height: 1.4;
    margin-bottom: 2px;
  }
  .ornament-tacteing {
    font-family: 'Tacteing', var(--font-muol), serif !important;
    font-size: 15pt;
    line-height: 1;
    margin-top: 1px;
    margin-bottom: 2px;
  }
  .org-header {
    width: 9.5cm;
    text-align: center;
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
    margin-top: 8px;
    margin-bottom: 2px;
  }
  .doc-subtitle {
    font-size: 10pt;
    text-align: center;
    color: #333333;
    margin-bottom: 12px;
  }

  table.data-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 9.5pt;
  }
  table.data-table th, table.data-table td {
    border: 0.75pt solid #000000;
    padding: 5px 6px;
    vertical-align: middle;
  }
  table.data-table th {
    background-color: #ededed;
    font-weight: bold;
    text-align: center;
  }
  table.data-table tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }

  .footer-sign-table {
    width: 100%;
    border-collapse: collapse;
    border: none;
    margin-top: 24px;
    page-break-inside: avoid;
    break-inside: avoid;
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
    height: 2.4cm;
  }

  @media print {
    body { padding: 0 !important; }
  }
`;

function printDocument({ title, body }) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('សូមអនុញ្ញាត Popup ក្នុង Browser ដើម្បីបោះពុម្ព!');
    return;
  }

  w.document.open();
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
 * Main export function: exports users to PDF (A4 Portrait)
 */
export function exportUsersPdf({
  users = [],
  academicYear = '២០២៥ - ២០២៦',
  schoolName = '',
  department = 'មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តតាកែវ'
}) {
  if (!users || users.length === 0) {
    alert('មិនមានទិន្នន័យអ្នកប្រើប្រាស់សម្រាប់បោះពុម្ពទេ!');
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

  const total = users.length;
  const titleText = 'បញ្ជីអ្នកប្រើប្រាស់ប្រព័ន្ធ';
  const subtitleText = `ឆ្នាំសិក្សា ${academicYear} | សរុបចំនួន៖ ${toKhmerNum(total)} នាក់`;

  const rowsHtml = users.map((u, idx) => {
    const roleStr = formatRoleLabel(u.role);
    const statusStr = u.status === 'active' || !u.status ? 'ដំណើរការ' : 'ផ្អាក';
    const classStr = u.class && u.class !== '-' ? toKhmerNum(u.class) : '-';
    const loginStr = u.lastLogin ? toKhmerNum(u.lastLogin) : 'មិនទាន់ចូលប្រើ';

    return `
      <tr>
        <td class="text-center">${toKhmerNum(idx + 1)}</td>
        <td class="text-left" style="font-weight: bold; padding-left: 8px;">${esc(u.name || '')}</td>
        <td class="text-left" style="padding-left: 8px;">${esc(u.username || '')}</td>
        <td class="text-center">${esc(roleStr)}</td>
        <td class="text-center" style="font-weight: bold;">${esc(classStr)}</td>
        <td class="text-center">${esc(loginStr)}</td>
        <td class="text-center">${esc(statusStr)}</td>
      </tr>
    `;
  }).join('');

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
          <th style="width: 40px;">ល.រ</th>
          <th style="width: 150px;">ឈ្មោះអ្នកប្រើប្រាស់</th>
          <th style="width: 120px;">ឈ្មោះគណនី</th>
          <th style="width: 140px;">តួនាទី</th>
          <th style="width: 75px;">ថ្នាក់បន្ទុក</th>
          <th style="width: 120px;">ចូលចុងក្រោយ</th>
          <th style="width: 80px;">ស្ថានភាព</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- Footer Signatures -->
    <table class="footer-sign-table">
      <tr>
        <td style="width: 40%;">
          <br />
          <div class="muol">បានឃើញ និងឯកភាព</div>
          <div class="muol">នាយក${esc(finalSchoolName)}</div>
          <div class="sig-space"></div>
        </td>
        <td style="width: 50%;">
          <div>${esc(lunarDateStr)}</div>
          <div>${esc(schoolPrefix)} ថ្ងៃទី ${currentDay} ខែ ${currentMonth} ឆ្នាំ ${currentYear}</div>
          <div class="muol" style="margin-top: 2px;">អ្នករៀបចំបញ្ជី</div>
          <div class="sig-space"></div>
        </td>
      </tr>
    </table>
  `;

  const filename = `${titleText}_${finalSchoolName}_${new Date().toISOString().split('T')[0]}`;
  printDocument({ title: filename, body: bodyHtml });
}
