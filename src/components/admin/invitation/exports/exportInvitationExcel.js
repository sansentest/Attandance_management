/**
 * ─────────────────────────────────────────────────────────────
 * Export Student Invitation Letters to Microsoft Excel (.xls)
 * (ទម្រង់ឯកសាររដ្ឋបាលខ្មែរ ដូចទៅនឹងទម្រង់ PDF ទាំងស្រុង)
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

  return `នៅថ្ងៃ<b>${dayOfWeek}</b> ទី <b>${day}</b> ខែ <b>${month}</b> ឆ្នាំ <b>${year}</b> វេលាម៉ោង <b>${time}</b> ជាកំណត់។`;
};

function triggerExcelDownload(htmlContent, filename) {
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
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
 * 1. Export Letters to Excel (.xls) matching exportInvitationPdf layout exactly
 */
export function exportInvitationLetterExcel({ selectedStudents = [], config = {} }) {
  const printMode = config.printMode || 'duplicate';
  const schoolName = config.schoolName || getCachedSchoolName() || 'វិទ្យាល័យអង្គរកា';

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

  if (!selectedStudents || selectedStudents.length === 0) {
    alert('សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ម្នាក់!');
    return;
  }

  const pages = [];
  if (printMode === 'pair') {
    for (let i = 0; i < selectedStudents.length; i += 2) {
      pages.push({
        topStudent: selectedStudents[i],
        bottomStudent: selectedStudents[i + 1] || selectedStudents[i]
      });
    }
  } else {
    selectedStudents.forEach((student) => {
      pages.push({
        topStudent: student,
        bottomStudent: student
      });
    });
  }

  const renderSingleLetterTable = (student) => {
    const parentName = student.parentName ? esc(student.parentName) : '.......................................';
    const studentName = student.name ? esc(student.name) : '................................';
    const gender = student.gender ? esc(student.gender) : '.........';
    const age = student.age ? toKhmerNum(student.age) : '.......';
    const sClass = student.class ? toKhmerNum(student.class) : '..........';
    const ref = config.reference ? toKhmerNum(config.reference) : '.............';
    const meetingDateHtml = formatMeetingDate(config.meetingDate, config.meetingTime);

    return `
      <!-- Header: ព្រះរាជាណាចក្រកម្ពុជា / ជាតិ សាសនា ព្រះមហាក្សត្រ / 3 -->
      <tr>
        <td colspan="6" align="center" style="font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 13pt; font-weight: normal; padding: 2px 0;">
          ព្រះរាជាណាចក្រកម្ពុជា
        </td>
      </tr>
      <tr>
        <td colspan="6" align="center" style="font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 12pt; font-weight: normal; padding: 1px 0;">
          ជាតិ សាសនា ព្រះមហាក្សត្រ
        </td>
      </tr>
      <tr>
        <td colspan="6" align="center" style="font-family: 'Tacteing', 'Khmer OS Muol Light', serif; font-size: 15pt; line-height: 1; padding-bottom: 4px;">
          3
        </td>
      </tr>

      <!-- ឈ្មោះសាលា + លេខ (ឆ្វេង) & កាលបរិច្ឆេទ (ស្តាំ) -->
      <tr>
        <td colspan="3" align="left" style="font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 12pt; vertical-align: top;">
          ${esc(schoolName)}
        </td>
        <td colspan="3" align="right" style="font-size: 11.5pt; vertical-align: top; white-space: nowrap;">
          ${esc(lunarDateStr)}
        </td>
      </tr>
      <tr>
        <td colspan="3" align="left" style="font-size: 11.5pt; vertical-align: top;">
          លេខ <span style="font-weight: bold; border-bottom: 1px dotted #000;">${ref}</span>
        </td>
        <td colspan="3" align="right" style="font-size: 11.5pt; vertical-align: top;">
          ${esc(schoolPrefix)} ថ្ងៃទី ${currentDay} ខែ ${currentMonth} ឆ្នាំ ${currentYear}
        </td>
      </tr>

      <!-- Title -->
      <tr><td colspan="6" style="height: 6px;"></td></tr>
      <tr>
        <td colspan="6" align="center" style="font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 15pt; text-decoration: underline; padding: 4px 0;">
          លិខិតអញ្ជើញ${student.cycle > 1 ? ` (លើកទី ${toKhmerNum(student.cycle)})` : ''}
        </td>
      </tr>
      <tr><td colspan="6" style="height: 6px;"></td></tr>

      <!-- Body: សូមគោរពអញ្ជើញ -->
      <tr>
        <td style="width: 140px; font-weight: bold; vertical-align: top; white-space: nowrap;">- សូមគោរពអញ្ជើញ</td>
        <td style="width: 20px; font-weight: bold; text-align: center; vertical-align: top;">៖</td>
        <td colspan="4" style="vertical-align: top; line-height: 1.65;">
          លោក/លោកស្រី <span style="font-weight: bold; border-bottom: 1px dotted #000;">${parentName}</span> ជាអាណាព្យាបាលសិស្សឈ្មោះ <span style="font-weight: bold; border-bottom: 1px dotted #000;">${studentName}</span>
          <br />
          ភេទ <span style="font-weight: bold; border-bottom: 1px dotted #000;">${gender}</span> អាយុ <span style="font-weight: bold; border-bottom: 1px dotted #000;">${age}</span> ឆ្នាំ រៀនថ្នាក់ទី <span style="font-weight: bold; border-bottom: 1px dotted #000;">${sClass}</span> នៃ${esc(schoolName)}។
          <br />
          ទីលំនៅបច្ចុប្បន្នភូមិ..........................ឃុំ.....................ស្រុក..............ខេត្ត.........
          <br />
          <span style="font-style: normal; font-size: 11pt; color: #222222;">(បញ្ជាក់៖ប្រសិនបើកូនលោក/លោកស្រីឈប់រៀនហើយ ពុំចាំបាច់អញ្ជើញមកទេ)</span>
        </td>
      </tr>

      <!-- Body: ដើម្បីចូលរួម -->
      <tr>
        <td style="font-weight: bold; vertical-align: top; white-space: nowrap;">- ដើម្បីចូលរួម</td>
        <td style="font-weight: bold; text-align: center; vertical-align: top;">៖</td>
        <td colspan="4" style="vertical-align: top; line-height: 1.65;">
          ទទួលនូវព័ត៌មានមួយចំនួនដែលពាក់ព័ន្ធនឹងអវត្តមានកូនរបស់លោក/លោកស្រី។
        </td>
      </tr>

      <!-- Body: កាលបរិច្ឆេទ -->
      <tr>
        <td style="font-weight: bold; vertical-align: top; white-space: nowrap;">- កាលបរិច្ឆេទ</td>
        <td style="font-weight: bold; text-align: center; vertical-align: top;">៖</td>
        <td colspan="4" style="vertical-align: top; line-height: 1.65;">
          ${meetingDateHtml}
        </td>
      </tr>

      <!-- Body: ទីកន្លែង -->
      <tr>
        <td style="font-weight: bold; vertical-align: top; white-space: nowrap;">- ទីកន្លែង</td>
        <td style="font-weight: bold; text-align: center; vertical-align: top;">៖</td>
        <td colspan="4" style="vertical-align: top; line-height: 1.65;">
          <strong>${esc(config.location || schoolName)}</strong>
        </td>
      </tr>

      <!-- Closing -->
      <tr><td colspan="6" style="height: 4px;"></td></tr>
      <tr>
        <td colspan="6" style="text-indent: 40px; text-align: justify; line-height: 1.8; font-size: 12pt;">
          សូមលោក/លោកស្រី និងប្អូនៗសិស្សានុសិស្សដែលមានឈ្មោះខាងលើអញ្ជើញចូលរួមកុំបីខាន និង
        </td>
      </tr>
      <tr>
        <td colspan="6" style="text-indent: 40px; text-align: justify; line-height: 1.8; font-size: 12pt;">
          ទទួលនូវការគោរពរាប់អានដ៏ស្មោះអំពីខ្ញុំ។
        </td>
      </tr>

      <!-- Signature -->
      <tr><td colspan="6" style="height: 4px;"></td></tr>
      <tr>
        <td colspan="4"></td>
        <td colspan="2" align="center" style="font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 12.5pt;">
          នាយកសាលា
        </td>
      </tr>
      <tr>
        <td colspan="4"></td>
        <td colspan="2" style="height: 45px;"></td>
      </tr>
    `;
  };

  const tablesHtml = pages.map((page, idx) => {
    return `
      <table border="0" cellpadding="2" cellspacing="0" style="width: 100%; max-width: 760px; font-family: 'Khmer OS Siemreap', 'Khmer OS Battambang', Arial, sans-serif; font-size: 12pt; line-height: 1.6; color: #000000; margin-bottom: 20px;">
        ${renderSingleLetterTable(page.topStudent)}
        <!-- Divider -->
        <tr>
          <td colspan="6" align="right" style="border-top: 1px dashed #555555; padding-top: 6px; padding-bottom: 12px; font-size: 9pt; color: #666666;">
            ✂️ កាត់ត្រង់នេះ (១ ច្បាប់ជូនអាណាព្យាបាល · ១ ច្បាប់តម្កល់ទុកនៅសាលា)
          </td>
        </tr>
        ${renderSingleLetterTable(page.bottomStudent)}
      </table>
      ${idx < pages.length - 1 ? '<br style="page-break-before: always;" />' : ''}
    `;
  }).join('');

  const excelDoc = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>លិខិតអញ្ជើញ</x:Name>
              <x:WorksheetOptions>
                <x:Print>
                  <x:ValidPrinterInfo/>
                  <x:PaperSizeIndex>9</x:PaperSizeIndex> <!-- A4 -->
                  <x:Scale>100</x:Scale>
                </x:Print>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Khmer OS Siemreap', 'Khmer OS Battambang', Arial, sans-serif; }
      </style>
    </head>
    <body>
      ${tablesHtml}
    </body>
    </html>
  `;

  triggerExcelDownload(excelDoc, `លិខិតអញ្ជើញ_អាណាព្យាបាល_${selectedStudents.length}នាក់_${new Date().toISOString().split('T')[0]}.xls`);
}

/**
 * 2. Export Structured Invitation Table to Excel (.xls)
 */
export function exportInvitationTableExcel({ students = [], tab = 'pending', schoolName = 'វិទ្យាល័យអង្គរកា' }) {
  const currentSchool = schoolName || getCachedSchoolName() || 'វិទ្យាល័យអង្គរកា';
  const today = new Date();
  const dateStr = `${toKhmerNum(today.getDate().toString().padStart(2, '0'))}-${KH_MONTHS[today.getMonth()]}-${toKhmerNum(today.getFullYear())}`;

  const isPending = tab === 'pending';

  const rows = students.map((s, idx) => {
    const isResolved = (s.status || (s.resolvedDate ? 'RESOLVED' : 'UNRESOLVED')) === 'RESOLVED';
    const cycleNum = Number(s.cycle) || 1;

    return `
      <tr style="height: 26px; text-align: center; vertical-align: middle;">
        <td style="border: 1px solid #cbd5e1; text-align: center;">${toKhmerNum(idx + 1)}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; mso-number-format:'\\@';">${esc(s.studentId || s.id || '')}</td>
        <td style="border: 1px solid #cbd5e1; text-align: left; font-weight: bold; padding-left: 6px;">${esc(s.name || '')}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center;">${esc(s.gender || 'ប្រុស')}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center;">${s.age ? toKhmerNum(s.age) : '-'}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${toKhmerNum(s.class || '')}</td>
        <td style="border: 1px solid #cbd5e1; text-align: left; padding-left: 6px;">${esc(s.parentName || '-')}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@';">${esc(s.parentPhone || '-')}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #dc2626;">${toKhmerNum(s.absences || s.absent || 0)} ថ្ងៃ</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">លើកទី ${toKhmerNum(cycleNum)}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center;">${esc(s.meetingDate || s.dateReached || s.datePrinted || '')}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center;">
          <span style="font-weight: bold; color: ${isResolved ? '#059669' : '#d97706'};">
            ${isPending ? 'ត្រូវកោះហៅ' : isResolved ? 'ដោះស្រាយរួច' : 'កំពុងដោះស្រាយ'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const excelDoc = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Khmer OS Siemreap', 'Khmer OS Battambang', Arial, sans-serif; font-size: 11pt; }
        .muol { font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-weight: normal; }
        th { background-color: #1e293b; color: #ffffff; font-family: 'Khmer OS Muol Light', serif; font-size: 11pt; font-weight: normal; padding: 6px; border: 1px solid #475569; }
      </style>
    </head>
    <body>
      <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <!-- Header -->
        <tr>
          <td colspan="12" align="center" class="muol" style="font-size: 13pt;">ព្រះរាជាណាចក្រកម្ពុជា</td>
        </tr>
        <tr>
          <td colspan="12" align="center" class="muol" style="font-size: 12pt;">ជាតិ សាសនា ព្រះមហាក្សត្រ</td>
        </tr>
        <tr>
          <td colspan="12" align="center" style="font-family: 'Tacteing'; font-size: 14pt; padding-bottom: 6px;">3</td>
        </tr>
        <tr>
          <td colspan="6" align="left" class="muol" style="font-size: 11.5pt;">${esc(currentSchool)}</td>
          <td colspan="6" align="right" style="font-size: 11pt;">កាលបរិច្ឆេទ៖ ${dateStr}</td>
        </tr>
        <tr><td colspan="12" style="height: 10px;"></td></tr>
        <tr>
          <td colspan="12" align="center" class="muol" style="font-size: 14pt; text-decoration: underline;">
            ${isPending ? 'បញ្ជីសិស្សត្រូវកោះហៅអាណាព្យាបាល' : 'បញ្ជីប្រវត្តិបោះពុម្ពលិខិតកោះហៅអាណាព្យាបាល'}
          </td>
        </tr>
        <tr><td colspan="12" style="height: 12px;"></td></tr>

        <!-- Table Columns -->
        <thead>
          <tr>
            <th style="width: 45px;">ល.រ</th>
            <th style="width: 90px;">អត្តលេខ</th>
            <th style="width: 150px;">ឈ្មោះសិស្ស</th>
            <th style="width: 60px;">ភេទ</th>
            <th style="width: 50px;">អាយុ</th>
            <th style="width: 65px;">ថ្នាក់</th>
            <th style="width: 150px;">ឈ្មោះអាណាព្យាបាល</th>
            <th style="width: 110px;">លេខទូរស័ព្ទ</th>
            <th style="width: 90px;">អវត្តមាន</th>
            <th style="width: 75px;">លើកទី</th>
            <th style="width: 110px;">${isPending ? 'ថ្ងៃឈានដល់' : 'ថ្ងៃបោះពុម្ព'}</th>
            <th style="width: 110px;">ស្ថានភាព</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  triggerExcelDownload(excelDoc, `បញ្ជីលិខិតកោះហៅ_${isPending ? 'ត្រូវបោះពុម្ព' : 'ប្រវត្តិ'}_${new Date().toISOString().split('T')[0]}.xls`);
}

/**
 * Main export function (backward compatible with all previous callers)
 */
export function exportInvitationExcel(params = {}) {
  if (params.selectedStudents && Array.isArray(params.selectedStudents) && params.selectedStudents.length > 0) {
    return exportInvitationLetterExcel(params);
  }
  return exportInvitationTableExcel(params);
}
