import { useState, useEffect, useRef, useMemo } from 'react'
import {
  ArrowLeft, Phone, Calendar, ShieldAlert, CheckCircle2,
  AlertTriangle, FileText, Download, ChevronDown, FileCode, FileImage,
  Mail, BookOpen, Clock, Search, ChevronLeft, ChevronRight, PhoneCall,
  Users
} from 'lucide-react'
import { SearchableDropdown } from '../attendance/AdminStudentAttendance'
import { getCachedSchoolName } from '../../../utils/api'

function generateDisciplineRecords(student) {
  if (student && student.records && Array.isArray(student.records)) {
    return student.records;
  }
  return [];
}

function getStatusBadge(status) {
  if (status === 'CRITICAL') {
    return {
      label: 'ត្រូវហៅអាណាព្យាបាល',
      color: 'rose',
      badge: 'bg-rose-50 text-rose-600 border-rose-100',
      dot: 'bg-rose-500',
      pulse: true,
      icon: PhoneCall
    }
  }
  if (status === 'WARNING') {
    return {
      label: 'ស្ថិតក្នុងការប្រុងប្រយ័ត្ន',
      color: 'amber',
      badge: 'bg-amber-50 text-amber-600 border-amber-100',
      dot: 'bg-amber-500',
      pulse: false,
      icon: AlertTriangle
    }
  }
  return {
    label: 'ធម្មតា',
    color: 'emerald',
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    dot: 'bg-emerald-500',
    pulse: false,
    icon: CheckCircle2
  }
}

export default function AdminStudentTrackingDetail({ student, onBack, threshold, status, onNavigate }) {
  const [detailSearch, setDetailSearch]         = useState('')
  const [detailSubject, setDetailSubject]       = useState('ALL')
  const [detailStatus,  setDetailStatus]        = useState('ALL')
  const [detailMonth,   setDetailMonth]         = useState('ALL')
  const [detailPage, setDetailPage]             = useState(1)
  const [detailExportOpen, setDetailExportOpen] = useState(false)
  const detailExportRef = useRef(null)
  const itemsPerPage = 10

  const allRecords = useMemo(() => generateDisciplineRecords(student), [student])
  const statusInfo = getStatusBadge(status)
  const percent = Math.min(100, Math.round(((student.absent || 0) / (threshold || 20)) * 100))

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (detailExportRef.current && !detailExportRef.current.contains(e.target)) {
        setDetailExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Administrative Standard Print & Export for Student Detail History ──
  const handleDetailExport = (type) => {
    const studentTotalHours = student.totalHours !== undefined ? student.totalHours : (((student.absentHours || 0) + (student.leaveHours || 0)) || student.records?.length || 0)

    if (type === 'Excel') {
      const headers = ['ល.រ', 'អត្តលេខ', 'ឈ្មោះសិស្ស', 'ថ្នាក់', 'កាលបរិច្ឆេទ', 'ម៉ោងសិក្សា', 'មុខវិជ្ជា', 'គ្រូបង្រៀន', 'ប្រភេទ', 'មូលហេតុ']
      const rows = filtered.map((r, idx) => [
        `"${idx + 1}"`,
        `"${student.studentId || student.id}"`,
        `"${student.name}"`,
        `"${student.class}"`,
        `"${r.date || ''}"`,
        `"${r.time || ''}"`,
        `"${r.subject || ''}"`,
        `"${r.teacher || ''}"`,
        `"${r.status === 'LEAVE' ? 'មានច្បាប់' : 'គ្មានច្បាប់'}"`,
        `"${(r.reason || '').replace(/"/g, '""')}"`
      ])
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `ប្រវត្តិអវត្តមាន_${student.name}_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else if (type === 'Word') {
      const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>ព្រឹត្តិបត្រតាមដានប្រវត្តិអវត្តមានសិស្ស - ${student.name}</title>
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
    @page WordSection1 {
      size: 595.3pt 841.9pt;
      margin: 2.0cm 2.0cm 2.0cm 2.0cm;
      mso-header-margin: 36.0pt;
      mso-footer-margin: 36.0pt;
      mso-paper-source: 0;
    }
    div.WordSection1 { page: WordSection1; }
    body { font-family: 'Khmer OS Siemreap', 'Khmer OS', 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; color: #000000; line-height: 1.5; }
    .header-wrap { width: 100%; margin-bottom: 12px; overflow: hidden; }
    .header-left-col { float: left; width: 46%; text-align: center; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 12pt; color: #000000; line-height: 1.7; }
    .header-right-col { float: right; width: 46%; text-align: center; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 12pt; color: #000000; line-height: 1.7; }
    .ornament { font-family: 'Tacteing', 'Khmer OS Muol Light', serif; font-size: 20pt; line-height: 1.2; margin-top: 2px; text-align: center; }
    .clear { clear: both; }
    .doc-title { font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 14pt; font-weight: bold; color: #0f172a; text-align: center; margin: 15px 0 4px 0; }
    .doc-subtitle { text-align: center; font-size: 10pt; color: #000000; margin-bottom: 15px; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; background: #f8fafc; }
    .info-table td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; }
    table.data-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    table.data-table th, table.data-table td { border: 1px solid #94a3b8; padding: 5px 8px; }
    table.data-table th { background-color: #f1f5f9; font-weight: bold; text-align: center; color: #000000; }
    .text-center { text-align: center; }
    .footer-wrap { width: 100%; margin-top: 35px; overflow: hidden; }
    .footer-col-left { float: left; width: 30%; text-align: center; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 11pt; color: #000000; line-height: 1.8; }
    .footer-col-mid { float: left; width: 30%; text-align: center; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 11pt; color: #000000; line-height: 1.8; }
    .footer-col-right { float: right; width: 35%; text-align: center; font-size: 10pt; color: #000000; line-height: 1.7; }
    .footer-sign-title { font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 11pt; font-weight: bold; margin-top: 4px; }
  </style>
</head>
<body>
<div class="WordSection1">
  <div class="header-wrap">
    <div class="header-left-col">
      <div>មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តតាកែវ</div>
      <div>${getCachedSchoolName()}</div>
    </div>
    <div class="header-right-col">
      <div>ព្រះរាជាណាចក្រកម្ពុជា</div>
      <div>ជាតិ​ សាសនា ព្រះមហាក្សត្រ</div>
      <div class="ornament">3</div>
    </div>
    <div class="clear"></div>
  </div>

  <div class="doc-title">ព្រឹត្តិបត្រតាមដានប្រវត្តិអវត្តមានសិស្ស</div>
  <div class="doc-subtitle">ឆ្នាំសិក្សា ២០២៥ - ២០២៦ | សរុបកំណត់ត្រា៖ ${filtered.length} លើក</div>

  <table class="info-table">
    <tr>
      <td><strong>គោត្តនាម-នាម៖</strong> ${student.name}</td>
      <td><strong>អត្តលេខ៖</strong> ${student.studentId || student.id}</td>
      <td><strong>ថ្នាក់ទី៖</strong> ${student.class}</td>
    </tr>
    <tr>
      <td><strong>គ្មានច្បាប់ (ល្មើសវិន័យ)៖</strong> <span style="color: #e11d48; font-weight: bold;">${student.absent || 0} ថ្ងៃ</span></td>
      <td><strong>មានច្បាប់៖</strong> <span style="color: #d97706; font-weight: bold;">${student.leave || 0} ថ្ងៃ</span></td>
      <td><strong>ម៉ោងខកខានសរុប៖</strong> ${studentTotalHours} ម៉ោង</td>
    </tr>
    <tr>
      <td colspan="2"><strong>ស្ថានភាពវិន័យ៖</strong> ${statusInfo.label} (កម្រិតកំណត់៖ ${threshold || 20} ថ្ងៃ)</td>
      <td><strong>កាលបរិច្ឆេទចេញ៖</strong> ${new Date().toLocaleDateString('km-KH')}</td>
    </tr>
  </table>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 35px;">ល.រ</th>
        <th style="width: 85px;">កាលបរិច្ឆេទ</th>
        <th style="width: 75px;">ម៉ោងសិក្សា</th>
        <th>មុខវិជ្ជា</th>
        <th>គ្រូបង្រៀន</th>
        <th style="width: 80px;">ប្រភេទ</th>
        <th>មូលហេតុ</th>
      </tr>
    </thead>
    <tbody>
      ${filtered.map((r, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center" style="font-weight: bold;">${r.date || ''}</td>
          <td class="text-center">${r.time || '-'}</td>
          <td style="font-weight: bold;">${r.subject || ''}</td>
          <td>${r.teacher || '-'}</td>
          <td class="text-center" style="color: ${r.status === 'LEAVE' ? '#d97706' : '#e11d48'}; font-weight: bold;">
            ${r.status === 'LEAVE' ? 'មានច្បាប់' : 'គ្មានច្បាប់'}
          </td>
          <td>${r.reason || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer-wrap">
    <div class="footer-col-left">
      <div>បានឃើញ និងឯកភាព</div>
      <div>នាយកសាលា</div>
    </div>
    <div class="footer-col-mid">
      <div>បានឃើញ និងឯកភាព</div>
      <div>គ្រូបន្ទុកថ្នាក់</div>
    </div>
    <div class="footer-col-right">
      <div>ថ្ងៃ....................ខែ.............ឆ្នាំ...........ព.ស ២៥......</div>
      <div>${getCachedSchoolName()} ថ្ងៃទី...........ខែ.............ឆ្នាំ.............</div>
      <div class="footer-sign-title">អ្នករៀបចំរបាយការណ៍</div>
    </div>
    <div class="clear"></div>
  </div>
</div>
</body>
</html>`
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `ប្រវត្តិអវត្តមាន_${student.name}_${new Date().toISOString().slice(0, 10)}.doc`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else {
      // PDF / Print (Official Cambodian Administrative Standard)
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('សូមអនុញ្ញាត Popup ក្នុង Browser ដើម្បីបើកផ្ទាំងបោះពុម្ព')
        return
      }
      printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ព្រឹត្តិបត្រតាមដានប្រវត្តិអវត្តមានសិស្ស - ${student.name}</title>
  <style>
    @page { size: A4 portrait; margin: 2.0cm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Khmer OS Siemreap', 'Khmer OS', 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      color: #000000;
      margin: 0;
      padding: 0;
      line-height: 1.5;
    }
    .header-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    .school-title {
      font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000;
      text-align: center;
    }
    .kingdom-box {
      text-align: center;
      line-height: 1.5;
    }
    .kingdom {
      font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif;
      font-size: 12pt;
      font-weight: bold;
      color: #000000;
    }
    .motto {
      font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif;
      font-size: 12pt;
      color: #000000;
    }
    .ornament {
      font-family: 'Tacteing', 'Khmer OS Muol Light', serif;
      font-size: 20pt;
      line-height: 1.2;
      margin-top: 2px;
      color: #000000;
    }
    .doc-title {
      text-align: center;
      font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif;
      font-size: 14pt;
      font-weight: bold;
      color: #0f172a;
      margin: 12px 0 4px 0;
    }
    .doc-subtitle {
      text-align: center;
      font-size: 10pt;
      color: #000000;
      margin-bottom: 15px;
    }
    .info-card {
      border: 1px solid #94a3b8;
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 15px;
      background: #f8fafc;
      font-size: 10pt;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 12px;
    }
    .info-item {
      display: flex;
      gap: 6px;
    }
    .info-label { color: #475569; font-weight: 500; }
    .info-val { color: #000000; font-weight: 700; }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #94a3b8;
      padding: 6px 8px;
    }
    table.data-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: center;
      color: #000000;
    }
    .text-center { text-align: center; }
    .badge-absent { color: #e11d48; font-weight: bold; }
    .badge-leave { color: #d97706; font-weight: bold; }
    .footer-sign {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      text-align: center;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    .sign-col {
      width: 190px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; padding: 10px 14px; background: #f1f5f9; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #cbd5e1;">
    <span style="font-weight: bold; font-size: 13px; color: #334155;">មើលគំរូមុនពេលបោះពុម្ព ឬរក្សាទុកជា PDF (Print / Save as PDF)</span>
    <button onclick="window.print()" style="padding: 7px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer;">បោះពុម្ព / រក្សាទុកជា PDF</button>
  </div>

  <div class="header-grid">
    <div class="school-title">
      <div>មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តតាកែវ</div>
      <div>${getCachedSchoolName()}</div>
    </div>
    <div class="kingdom-box">
      <div class="kingdom">ព្រះរាជាណាចក្រកម្ពុជា</div>
      <div class="motto">ជាតិ​ សាសនា ព្រះមហាក្សត្រ</div>
      <div class="ornament">3</div>
    </div>
  </div>

  <div class="doc-title">ព្រឹត្តិបត្រតាមដានប្រវត្តិអវត្តមានសិស្ស</div>
  <div class="doc-subtitle">ឆ្នាំសិក្សា ២០២៥ - ២០២៦ | សរុបកំណត់ត្រា៖ ${filtered.length} លើក</div>

  <div class="info-card">
    <div class="info-item"><span class="info-label">គោត្តនាម-នាម៖</span> <span class="info-val">${student.name}</span></div>
    <div class="info-item"><span class="info-label">អត្តលេខ៖</span> <span class="info-val" style="font-family: monospace;">${student.studentId || student.id}</span></div>
    <div class="info-item"><span class="info-label">ថ្នាក់ទី៖</span> <span class="info-val">${student.class}</span></div>
    <div class="info-item"><span class="info-label">គ្មានច្បាប់ (ល្មើសវិន័យ)៖</span> <span class="info-val" style="color: #e11d48;">${student.absent || 0} ថ្ងៃ</span></div>
    <div class="info-item"><span class="info-label">មានច្បាប់៖</span> <span class="info-val" style="color: #d97706;">${student.leave || 0} ថ្ងៃ</span></div>
    <div class="info-item"><span class="info-label">ម៉ោងខកខានសរុប៖</span> <span class="info-val">${studentTotalHours} ម៉ោង</span></div>
    <div class="info-item" style="grid-column: span 2;"><span class="info-label">ស្ថានភាពវិន័យ៖</span> <span class="info-val">${statusInfo.label} (កម្រិតកំណត់៖ ${threshold || 20} ថ្ងៃ)</span></div>
    <div class="info-item"><span class="info-label">កាលបរិច្ឆេទចេញ៖</span> <span class="info-val">${new Date().toLocaleDateString('km-KH')}</span></div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 35px;">ល.រ</th>
        <th style="width: 85px;">កាលបរិច្ឆេទ</th>
        <th style="width: 75px;">ម៉ោងសិក្សា</th>
        <th>មុខវិជ្ជា</th>
        <th>គ្រូបង្រៀន</th>
        <th style="width: 80px;">ប្រភេទ</th>
        <th>មូលហេតុ</th>
      </tr>
    </thead>
    <tbody>
      ${filtered.length > 0 ? filtered.map((r, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center" style="font-weight: bold; font-family: monospace;">${r.date || ''}</td>
          <td class="text-center">${r.time || '-'}</td>
          <td style="font-weight: bold;">${r.subject || ''}</td>
          <td>${r.teacher || '-'}</td>
          <td class="text-center ${r.status === 'LEAVE' ? 'badge-leave' : 'badge-absent'}">
            ${r.status === 'LEAVE' ? 'មានច្បាប់' : 'គ្មានច្បាប់'}
          </td>
          <td>${r.reason || '-'}</td>
        </tr>
      `).join('') : `
        <tr>
          <td colspan="7" class="text-center" style="padding: 20px; color: #94a3b8;">មិនមានទិន្នន័យអវត្តមានទេ</td>
        </tr>
      `}
    </tbody>
  </table>

  <div class="footer-sign">
    <div class="sign-col">
      <br>
      <div style="font-family: 'Khmer OS Muol Light', serif; font-size: 11pt;">បានឃើញ និងឯកភាព</div>
      <div style="font-family: 'Khmer OS Muol Light', serif; font-size: 11pt; margin-top: 2px;">នាយកសាលា</div>
    </div>
    <div class="sign-col">
      <br>
      <div style="font-family: 'Khmer OS Muol Light', serif; font-size: 11pt;">បានឃើញ និងឯកភាព</div>
      <div style="font-family: 'Khmer OS Muol Light', serif; font-size: 11pt; margin-top: 2px;">គ្រូបន្ទុកថ្នាក់</div>
    </div>
    <div class="sign-col" style="width: 220px;">
      <div>ថ្ងៃ....................ខែ.............ឆ្នាំ...........ព.ស ២៥......</div>
      <div style="margin-top: 2px;">${getCachedSchoolName()} ថ្ងៃទី...........ខែ.............ឆ្នាំ.............</div>
      <div style="font-family: 'Khmer OS Muol Light', serif; font-size: 11pt; font-weight: bold; margin-top: 4px;">អ្នករៀបចំរបាយការណ៍</div>
    </div>
  </div>
</body>
</html>`)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 400)
    }
    setDetailExportOpen(false)
  }

  // Build unique subject options from records
  const subjectOpts = [
    { id: 'ALL', label: 'គ្រប់មុខវិជ្ជា' },
    ...([...new Set(allRecords.map(r => r.subject))].map(s => ({ id: s, label: s })))
  ]

  const statusOpts = [
    { id: 'ALL', label: 'គ្រប់ស្ថានភាព' },
    { id: 'ABSENT', label: 'គ្មានច្បាប់' },
    { id: 'LEAVE',  label: 'មានច្បាប់' },
  ]

  const monthOpts = [
    { id: 'ALL', label: 'គ្រប់ខែ' },
    { id: '01', label: 'មករា (Jan)' }, { id: '02', label: 'កុម្ភៈ (Feb)' },
    { id: '03', label: 'មីនា (Mar)' }, { id: '04', label: 'មេសា (Apr)' },
    { id: '05', label: 'ឧសភា (May)' }, { id: '06', label: 'មិថុនា (Jun)' },
    { id: '07', label: 'កក្កដា (Jul)' }, { id: '08', label: 'សីហា (Aug)' },
    { id: '09', label: 'កញ្ញា (Sep)' }, { id: '10', label: 'តុលា (Oct)' },
    { id: '11', label: 'វិច្ឆិកា (Nov)' }, { id: '12', label: 'ធ្នូ (Dec)' },
  ]

  // Filter records
  let filtered = allRecords
  if (detailSubject !== 'ALL') filtered = filtered.filter(r => r.subject === detailSubject)
  if (detailStatus  !== 'ALL') filtered = filtered.filter(r => r.status  === detailStatus)
  if (detailMonth   !== 'ALL') filtered = filtered.filter(r => r.date.split('-')[1] === detailMonth)
  if (detailSearch.trim()) {
    const q = detailSearch.toLowerCase()
    filtered = filtered.filter(r =>
      r.subject.toLowerCase().includes(q) ||
      r.teacher?.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
    )
  }

  const totalDetailPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginatedRecords = filtered.slice((detailPage - 1) * itemsPerPage, detailPage * itemsPerPage)

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">

      {/* Top Header: Back Button, Breadcrumb & Main Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-bold text-[13px] bg-white border border-slate-200 rounded-xl px-4 py-2.5 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            ត្រឡប់ក្រោយ
          </button>
        </div>

        {/* Action Button: Invitation Letter */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {status === 'CRITICAL' && onNavigate && (
            <button
              onClick={() => {
                localStorage.setItem('printStudent', JSON.stringify(student))
                onNavigate('invitation-letters')
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white py-2.5 px-5 rounded-xl font-bold text-[13px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Mail size={15} strokeWidth={2.5} />
              <span>រៀបចំលិខិតកោះហៅ</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Cards (4 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">

        {/* Card 1: Student & Parent Info */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-100 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0">
              {student.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-black text-slate-800 leading-tight truncate">{student.name}</p>
              <p className="text-[12px] font-bold text-slate-400 mt-0.5">
                #{student.id} • ថ្នាក់ {student.class}
              </p>
              {student.parentPhone && (
                <a
                  href={`tel:${student.parentPhone}`}
                  className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 mt-1"
                  title="ចុចដើម្បីហៅទូរស័ព្ទ"
                >
                  <Phone size={11} className="text-slate-400" />
                  <span>{student.parentPhone}</span>
                </a>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 relative z-10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">ស្ថានភាពវិន័យ</span>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusInfo.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot} ${statusInfo.pulse ? 'animate-pulse' : ''} inline-block`} />
              {statusInfo.label}
            </div>
          </div>
        </div>

        {/* Card 2: គ្មានច្បាប់ & កម្រិតវិន័យ */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <ShieldAlert size={18} strokeWidth={2.5} />
            </div>
            <div className="text-[13px] font-bold text-slate-500">គ្មានច្បាប់ (ល្មើសវិន័យ)</div>
          </div>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-3xl font-black text-rose-500">{student.absent}</span>
            <span className="text-[13px] font-bold text-slate-400">/ {threshold} ថ្ងៃ</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2 relative z-10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status === 'CRITICAL' ? 'bg-rose-500' : status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="text-[11px] font-medium text-slate-400 mt-1 relative z-10">
            ឈានដល់ {percent}% នៃកម្រិតកំណត់ (គិតជាថ្ងៃ)
          </div>
        </div>

        {/* Card 3: មានច្បាប់ */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <FileText size={18} strokeWidth={2.5} />
            </div>
            <div className="text-[13px] font-bold text-slate-500">មានច្បាប់</div>
          </div>
          <div className="text-3xl font-black text-amber-500 relative z-10">{student.leave}</div>
          <div className="text-[12px] font-medium text-slate-400 mt-1 relative z-10">ថ្ងៃ</div>
        </div>

        {/* Card 4: ម៉ោងខកខានសរុប */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Clock size={18} strokeWidth={2.5} />
            </div>
            <div className="text-[13px] font-bold text-slate-500">ម៉ោងខកខានសរុប</div>
          </div>
          <div className="flex items-baseline gap-1.5 relative z-10">
            <span className="text-3xl font-black text-slate-800">
              {student.totalHours !== undefined ? student.totalHours : ((student.absentHours || 0) + (student.leaveHours || 0) || student.records?.length || 0)}
            </span>
            <span className="text-[13px] font-bold text-slate-500">ម៉ោង</span>
          </div>
          <div className="text-[11px] font-medium text-slate-400 mt-1 relative z-10 flex items-center gap-1">
            <span>ស្មើនឹង {student.records?.length || 0} លើកកត់ត្រា</span>
          </div>
        </div>

      </div>

      {/* ── Absence History Table Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Calendar size={15} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-[14px] font-black text-slate-800">ប្រវត្តិអវត្តមានដែលឈានដល់កម្រិតវិន័យ</p>
                <p className="text-[11px] font-medium text-slate-400">
                  {filtered.length === allRecords.length
                    ? `សរុប ${allRecords.length} កំណត់ត្រា`
                    : `បង្ហាញ ${filtered.length} / ${allRecords.length} កំណត់ត្រា`}
                </p>
              </div>
            </div>

            {/* Actions: Search & Export */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-[260px] lg:w-[280px] group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="ស្វែងរកមុខវិជ្ជា គ្រូ មូលហេតុ..."
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-8 pr-4 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm"
                  value={detailSearch}
                  onChange={e => { setDetailSearch(e.target.value); setDetailPage(1) }}
                />
              </div>

              {/* Export */}
              <div className="relative w-full sm:w-auto" ref={detailExportRef}>
                <button
                  onClick={() => setDetailExportOpen(!detailExportOpen)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-5 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto"
                >
                  <Download size={15} strokeWidth={2.5} />
                  <span>នាំចេញ / បោះពុម្ព</span>
                  <ChevronDown size={15} strokeWidth={2.5} className={`transition-transform duration-300 ml-1 ${detailExportOpen ? 'rotate-180' : ''}`} />
                </button>
                {detailExportOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-50 overflow-hidden py-2">
                    <button onClick={() => handleDetailExport('PDF')}   className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group cursor-pointer"><FileText  size={16} className="text-rose-500    group-hover:scale-110 transition-transform" /> បោះពុម្ព / Save as PDF</button>
                    <button onClick={() => handleDetailExport('Excel')} className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group cursor-pointer"><FileCode  size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" /> ទាញយកជា Excel (.csv)</button>
                    <button onClick={() => handleDetailExport('Word')}  className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group cursor-pointer"><FileImage size={16} className="text-blue-500   group-hover:scale-110 transition-transform" /> ទាញយកជា Word (.doc)</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <SearchableDropdown options={subjectOpts} value={detailSubject} onChange={v => { setDetailSubject(v); setDetailPage(1) }} placeholder="ជ្រើសរើសមុខវិជ្ជា" icon={BookOpen} />
            <SearchableDropdown options={statusOpts}  value={detailStatus}  onChange={v => { setDetailStatus(v);  setDetailPage(1) }} placeholder="ជ្រើសរើសស្ថានភាព" />
            <SearchableDropdown options={monthOpts}   value={detailMonth}   onChange={v => { setDetailMonth(v);   setDetailPage(1) }} placeholder="ជ្រើសរើសខែ" icon={Calendar} />
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-12">#</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[130px]">កាលបរិច្ឆេទ</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">មុខវិជ្ជា</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">គ្រូបង្រៀន</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[140px]">ម៉ោងសិក្សា</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">មូលហេតុ</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ស្ថានភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedRecords.map((rec, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3.5 px-5">
                    <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500">
                      {(detailPage - 1) * itemsPerPage + idx + 1}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="text-[13px] font-bold text-slate-700">{rec.date}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <BookOpen size={13} className="text-indigo-400 flex-shrink-0" />
                      <span className="text-[13px] font-bold text-indigo-600">{rec.subject}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="text-[12px] font-medium text-slate-600">{rec.teacher || '—'}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="text-[12px] font-medium text-slate-600">{rec.time}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="text-[12px] font-medium text-slate-600">{rec.reason}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {rec.status === 'ABSENT' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />
                        គ្មានច្បាប់
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        មានច្បាប់
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                        <Search size={24} className="text-slate-300" />
                      </div>
                      <span className="font-bold text-slate-700 text-[14px]">មិនមានទិន្នន័យត្រូវគ្នាទេ</span>
                      <span className="text-[12px] text-slate-400 mt-1">សូមសាកល្បង Filter ផ្សេង</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[12px] font-medium text-slate-400">
            {filtered.length > 0
              ? `បង្ហាញ ${(detailPage - 1) * itemsPerPage + 1}–${Math.min(detailPage * itemsPerPage, filtered.length)} នៃ ${filtered.length} កំណត់ត្រា`
              : '0 កំណត់ត្រា'}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDetailPage(p => Math.max(1, p - 1))}
              disabled={detailPage === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                detailPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            {[...Array(totalDetailPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setDetailPage(i + 1)}
                className={`w-8 h-8 rounded-full font-bold text-[13px] flex items-center justify-center transition-all ${
                  detailPage === i + 1 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setDetailPage(p => Math.min(totalDetailPages, p + 1))}
              disabled={detailPage === totalDetailPages}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                detailPage === totalDetailPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
