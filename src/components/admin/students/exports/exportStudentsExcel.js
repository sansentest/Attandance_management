/**
 * ─────────────────────────────────────────────────────────────
 * Export Student List to Excel (.xlsx) · ទម្រង់របាយការណ៍រដ្ឋបាល
 * ─────────────────────────────────────────────────────────────
 */

import { getCachedSchoolName } from '../../../../utils/api.js';
import { getKhmerLunarDateString } from '../../../../utils/khmerDate.js';

const DEFAULT_DEPARTMENT = 'មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តតាកែវ';
const DEFAULT_ACADEMIC_YEAR = '២០២៥ - ២០២៦';
const EXCELJS_URL = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
const FONT_BODY = 'Khmer OS Siemreap';
const FONT_TITLE = 'Khmer OS Muol Light';

const KH_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const kh = (v) => String(v ?? '').replace(/\d/g, (d) => KH_DIGITS[Number(d)]);
const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

const str = (v, fallback = '') => (v === undefined || v === null || v === '' ? fallback : String(v));

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Lazy loader for ExcelJS
let excelJsPromise = null;
function loadExcelJS() {
  if (typeof window !== 'undefined' && window.ExcelJS) return Promise.resolve(window.ExcelJS);
  if (!excelJsPromise) {
    excelJsPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = EXCELJS_URL;
      s.async = true;
      s.onload = () => (window.ExcelJS ? resolve(window.ExcelJS) : reject(new Error('ExcelJS not found')));
      s.onerror = () => reject(new Error('Cannot load ExcelJS from CDN'));
      document.head.appendChild(s);
    }).catch((err) => {
      excelJsPromise = null;
      throw err;
    });
  }
  return excelJsPromise;
}

// CSV Fallback
const csvCell = (v) => {
  if (typeof v === 'number') return String(v);
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s) && s !== '-') s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};
const csvId = (v) => (/^\d+$/.test(v) ? `="${v}"` : csvCell(v));
const buildCsv = (headers, rows) => '\uFEFF' + [headers.map(csvCell), ...rows].map((r) => r.join(',')).join('\r\n');

// Excel styling helpers
const BORDER = { style: 'thin', color: { argb: 'FF000000' } };
const BORDERS = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
const FILL_HEAD = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDED' } };
const A_CENTER = { horizontal: 'center', vertical: 'middle', wrapText: true };
const A_LEFT = { horizontal: 'left', vertical: 'middle', wrapText: true };
const A_FIT = { horizontal: 'center', vertical: 'middle', shrinkToFit: true };
const F = (size = 10, extra = {}) => ({ name: FONT_BODY, size, ...extra });
const FM = (size = 11) => ({ name: FONT_TITLE, size });

function put(ws, r, c1, c2, value, st = {}) {
  const cell = ws.getCell(r, c1);
  cell.value = value;
  cell.font = st.font || F();
  cell.alignment = st.align || A_CENTER;
  if (st.border) cell.border = BORDERS;
  if (st.fill) cell.fill = st.fill;
  if (st.numFmt) cell.numFmt = st.numFmt;
  if (c2 > c1) ws.mergeCells(r, c1, r, c2);
  return cell;
}

const rowH = (ws, r, h) => {
  ws.getRow(r).height = h;
};

export async function exportStudentsExcel({
  students = [],
  filterClass = 'ALL',
  academicYear = DEFAULT_ACADEMIC_YEAR,
  schoolName = '',
  department = DEFAULT_DEPARTMENT
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
  const currentDay = kh(today.getDate().toString().padStart(2, '0'));
  const currentMonth = KH_MONTHS[today.getMonth()];
  const currentYear = kh(today.getFullYear());
  const lunarDateStr = getKhmerLunarDateString(today);

  const total = students.length;
  const femaleCount = students.filter((s) => s.gender === 'F' || s.gender === 'ស្រី').length;

  const titleText = filterClass && filterClass !== 'ALL'
    ? `បញ្ជីរាយនាមសិស្ស ថ្នាក់ទី ${kh(filterClass)}`
    : 'បញ្ជីរាយនាមសិស្ស';

  const subtitleText = `ឆ្នាំសិក្សា ${academicYear}   |   សរុបចំនួន៖ ${kh(total)} នាក់ (ស្រី ${kh(femaleCount)} នាក់)`;

  // Normalized records
  const records = students.map((s, idx) => {
    const isFemale = s.gender === 'F' || s.gender === 'ស្រី';
    const statusStr = s.status === 'active' || !s.status ? 'កំពុងសិក្សា' : s.status === 'suspended' ? 'ផ្អាកការសិក្សា' : 'ប្តូរសាលា';
    return {
      no: idx + 1,
      studentId: str(s.id || s.studentId),
      name: str(s.name),
      gender: isFemale ? 'ស្រី' : 'ប្រុស',
      cls: str(s.class || s.className),
      dob: str(s.dob, '-'),
      phone: str(s.phone, '-'),
      parentName: str(s.parentName, '-'),
      parentPhone: str(s.parentPhone, '-'),
      status: statusStr
    };
  });

  const headers = ['ល.រ', 'អត្តលេខ', 'គោត្តនាម - នាម', 'ភេទ', 'ថ្នាក់', 'ថ្ងៃខែឆ្នាំកំណើត', 'លេខទូរស័ព្ទ', 'ឈ្មោះអាណាព្យាបាល', 'ទូរស័ព្ទអាណាព្យាបាល', 'ស្ថានភាព'];

  try {
    const ExcelJS = await loadExcelJS();
    const wb = new ExcelJS.Workbook();
    wb.creator = finalSchoolName;
    wb.created = new Date();

    const ws = wb.addWorksheet('បញ្ជីសិស្ស');
    const widths = [6, 13, 26, 8, 10, 16, 16, 24, 16, 14];
    widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));

    const COLS = 10;

    // Header Kingdom (Centered at top)
    put(ws, 1, 1, COLS, 'ព្រះរាជាណាចក្រកម្ពុជា', { font: FM(12) });
    put(ws, 2, 1, COLS, 'ជាតិ សាសនា ព្រះមហាក្សត្រ', { font: FM(12) });
    rowH(ws, 1, 26);
    rowH(ws, 2, 26);

    // Left org info (Moved down below Kingdom)
    put(ws, 3, 1, 4, 'ក្រសួងអប់រំ យុវជន និងកីឡា', { font: FM(10.5), align: A_LEFT });
    put(ws, 4, 1, 4, department, { font: FM(10.5), align: A_LEFT });
    put(ws, 5, 1, 4, finalSchoolName, { font: FM(10.5), align: A_LEFT });
    rowH(ws, 3, 22);
    rowH(ws, 4, 22);
    rowH(ws, 5, 22);
    rowH(ws, 6, 8);

    // Title Block
    put(ws, 7, 1, COLS, titleText, { font: FM(14) });
    rowH(ws, 7, 30);
    put(ws, 8, 1, COLS, subtitleText, { font: F(10.5) });
    rowH(ws, 8, 22);
    rowH(ws, 9, 8);

    // Table Header
    const hdrRow = 10;
    headers.forEach((label, i) => put(ws, hdrRow, i + 1, i + 1, label, { font: F(10, { bold: true }), fill: FILL_HEAD, border: true }));
    rowH(ws, hdrRow, 30);

    // Rows
    let r = 11;
    records.forEach((rec) => {
      put(ws, r, 1, 1, rec.no, { border: true, numFmt: '0' });
      put(ws, r, 2, 2, rec.studentId, { border: true, numFmt: '@' });
      put(ws, r, 3, 3, rec.name, { border: true, align: A_LEFT, font: F(10, { bold: true }) });
      put(ws, r, 4, 4, rec.gender, { border: true });
      put(ws, r, 5, 5, rec.cls, { border: true, font: F(10, { bold: true }) });
      put(ws, r, 6, 6, rec.dob, { border: true });
      put(ws, r, 7, 7, rec.phone, { border: true });
      put(ws, r, 8, 8, rec.parentName, { border: true, align: A_LEFT });
      put(ws, r, 9, 9, rec.parentPhone, { border: true });
      put(ws, r, 10, 10, rec.status, { border: true });
      rowH(ws, r, 22);
      r++;
    });

    // Signatures
    const sigStart = r + 2;
    put(ws, sigStart, 1, 4, 'បានឃើញ និងឯកភាព', { font: FM(10.5) });
    put(ws, sigStart + 1, 1, 4, `នាយក${finalSchoolName}`, { font: FM(10.5) });

    put(ws, sigStart, 7, 10, lunarDateStr, { font: F(9.5) });
    put(ws, sigStart + 1, 7, 10, `${schoolPrefix} ថ្ងៃទី ${currentDay} ខែ ${currentMonth} ឆ្នាំ ${currentYear}`, { font: F(9.5) });
    put(ws, sigStart + 2, 7, 10, 'អ្នករៀបចំបញ្ជី', { font: FM(10.5) });

    for (let s = sigStart; s <= sigStart + 5; s++) rowH(ws, s, 22);

    // Page Setup (Landscape A4, fit to width)
    ws.pageSetup = {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
      printArea: `A1:J${sigStart + 5}`,
      printTitlesRow: `${hdrRow}:${hdrRow}`
    };
    ws.headerFooter.oddFooter = '&Cទំព័រ &P / &N';

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, `${titleText}_${finalSchoolName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (err) {
    console.warn('ExcelJS export failed, falling back to CSV:', err);
    const csvRows = records.map((rec) => [
      csvCell(rec.no),
      csvId(rec.studentId),
      csvCell(rec.name),
      csvCell(rec.gender),
      csvCell(rec.cls),
      csvCell(rec.dob),
      csvCell(rec.phone),
      csvCell(rec.parentName),
      csvCell(rec.parentPhone),
      csvCell(rec.status)
    ]);
    const csvContent = buildCsv(headers, csvRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${titleText}_${finalSchoolName}_${new Date().toISOString().split('T')[0]}.csv`);
  }
}

