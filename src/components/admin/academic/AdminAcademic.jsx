import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Users, Plus, Edit, Trash2, Search, Book, GraduationCap,
  X, Save, Loader2, Download, CheckCircle2, RotateCcw, AlertTriangle,
  ChevronDown, ChevronLeft, ChevronRight, ChevronsRight, FileText, FileCode, User,
  Upload, FileSpreadsheet, ArrowRight, RefreshCw, FileImage, Sparkles
} from 'lucide-react';
import { api } from '../../../utils/api';

// Helper to generate sequential IDs for classes
function generateBatchClassIds(existingList, count) {
  let maxNum = 0;
  existingList.forEach(c => {
    const match = (c.id || '')?.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum && num < 1000000) maxNum = num;
    }
  });
  const ids = [];
  for (let i = 1; i <= count; i++) {
    ids.push(`CLS-${String(maxNum + i).padStart(3, '0')}`);
  }
  return ids;
}

// Helper to generate sequential IDs for subjects
function generateBatchSubjectIds(existingList, count) {
  let maxNum = 0;
  existingList.forEach(s => {
    const match = (s.id || '')?.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum && num < 1000000) maxNum = num;
    }
  });
  const ids = [];
  for (let i = 1; i <= count; i++) {
    ids.push(`SUB-${String(maxNum + i).padStart(3, '0')}`);
  }
  return ids;
}

// Robust CSV parser supporting Khmer Unicode, quotes, commas, tabs, semicolons, and UTF-8 BOM
function parseCSV(text) {
  const cleaned = text.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return [];

  const lines = cleaned.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line) => {
    let delimiter = ',';
    if (line.includes('\t') && !line.includes(',')) delimiter = '\t';
    else if (line.includes(';') && !line.includes(',')) delimiter = ';';

    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.every(c => !c)) continue;
    rows.push(cols);
  }
  return rows;
}

// ─────────────────────────────────────────────
// Searchable Dropdown Component (matching AdminStudentAttendance)
// ─────────────────────────────────────────────
const SearchableDropdown = ({ value, onChange, options, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative group w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white border ${isOpen ? 'border-indigo-400 ring-4 ring-indigo-100' : 'border-slate-200'
          } text-slate-700 py-2.5 px-4 rounded-xl font-medium text-[13px] hover:border-slate-300 focus:outline-none transition-all shadow-sm`}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon size={14} className="text-slate-400" />}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1.5 w-full min-w-[200px] bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-slate-50 bg-slate-50/50">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ស្វែងរក..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-700 py-2 pl-8 pr-3 rounded-lg font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-between ${value === opt.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <span>{opt.label}</span>
                  {value === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                </button>
              ))
            ) : (
              <div className="py-4 text-center text-slate-400 text-[12px] font-medium flex flex-col items-center gap-1">
                <Search size={16} className="opacity-30" />
                <span>គ្មានលទ្ធផល</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminAcademic({ initialTab = 'classes' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'classes' | 'subjects'

  // Mock Data with Cache
  const [classes, setClasses] = useState(() => {
    try {
      const cached = localStorage.getItem('school_classes_cache');
      if (cached !== null) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return [];
  });

  const [subjects, setSubjects] = useState(() => {
    try {
      const cached = localStorage.getItem('school_subjects_cache');
      if (cached !== null) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return [];
  });

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  // Export & Import States
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  const [importModal, setImportModal] = useState({ open: false, parsedData: [], isUploaded: false, fileName: '' });
  const fileInputRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form States (Strictly NO Placeholders on inputs)
  const [editingItem, setEditingItem] = useState(null);
  const [className, setClassName] = useState('');
  const [classTeacher, setClassTeacher] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectType, setSubjectType] = useState('វិទ្យាសាស្ត្រ');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', item: null });

  const fetchAcademicData = async (initial = false) => {
    if (initial) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const [resClasses, resSubjects] = await Promise.all([
        api('academic.getClasses'),
        api('academic.getSubjects')
      ]);
      if (resClasses?.success && Array.isArray(resClasses.data)) {
        setClasses(resClasses.data);
      }
      if (resSubjects?.success && Array.isArray(resSubjects.data)) {
        setSubjects(resSubjects.data);
      }
      if (!initial) {
        showToast('បានធ្វើបច្ចុប្បន្នភាពទិន្នន័យពី Firebase');
      }
    } catch (err) {
      console.error('Fetch academic error:', err);
      if (!initial) {
        showToast('មិនអាចទាញទិន្នន័យថ្មីបានទេ');
      }
    } finally {
      setIsRefreshing(false);
      if (initial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicData(false);
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      handleResetForm();
    }
  }, [initialTab]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Filter Dropdown Options (matching AdminStudentAttendance structure)
  const classLevelOptions = [
    { id: 'ALL', label: 'គ្រប់កម្រិតថ្នាក់' },
    { id: '12', label: 'ថ្នាក់ទី ១២' },
    { id: '11', label: 'ថ្នាក់ទី ១១' },
    { id: '10', label: 'ថ្នាក់ទី ១០' }
  ];

  const subjectTypeOptions = [
    { id: 'ALL', label: 'គ្រប់ប្រភេទមុខវិជ្ជា' },
    { id: 'វិទ្យាសាស្ត្រ', label: 'វិទ្យាសាស្ត្រ' },
    { id: 'សង្គម', label: 'សង្គម' },
    { id: 'ទូទៅ', label: 'ទូទៅ' },
    { id: 'ភាសាបរទេស', label: 'ភាសាបរទេស' }
  ];

  // Filtering Logic (Search by name or homeroom teacher)
  let filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.teacher && c.teacher.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  if (filterLevel !== 'ALL') {
    filteredClasses = filteredClasses.filter(c => c.name.includes(filterLevel));
  }

  let filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  if (filterType !== 'ALL') {
    filteredSubjects = filteredSubjects.filter(s => s.type === filterType);
  }

  const currentDataset = activeTab === 'classes' ? filteredClasses : filteredSubjects;
  const totalPages = Math.max(1, Math.ceil(currentDataset.length / itemsPerPage));
  const paginatedData = currentDataset.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Edit Handlers
  const handleStartEditClass = (item) => {
    setEditingItem(item);
    setClassName(item.name);
    setClassTeacher(item.teacher || '');
  };

  const handleStartEditSubject = (item) => {
    setEditingItem(item);
    setSubjectName(item.name);
    setSubjectType(item.type);
  };

  const handleResetForm = () => {
    setEditingItem(null);
    if (activeTab === 'classes') {
      setClassName('');
      setClassTeacher('');
    } else {
      setSubjectName('');
      setSubjectType('វិទ្យាសាស្ត្រ');
    }
  };

  // Save Handlers
  const handleSaveClass = async (e) => {
    e.preventDefault();
    if (!className.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះថ្នាក់រៀន');
      return;
    }
    setIsSaving(true);
    try {
      const classPayload = editingItem
        ? { ...editingItem, name: className.trim(), teacher: classTeacher.trim() }
        : { id: `c_${Date.now()}`, name: className.trim(), students: 0, teacher: classTeacher.trim() };

      const res = await api('academic.saveClass', { class: classPayload });
      if (res?.success) {
        if (editingItem) {
          setClasses(prev => prev.map(c => c.id === editingItem.id ? { ...c, ...classPayload } : c));
          showToast(`បានកែសម្រួលថ្នាក់ "${className.trim()}" ដោយជោគជ័យ`);
        } else {
          setClasses(prev => [classPayload, ...prev]);
          showToast(`បានបន្ថែមថ្នាក់ថ្មី "${className.trim()}" ដោយជោគជ័យ`);
        }
        handleResetForm();
      } else {
        showToast(res?.error || 'មានបញ្ហាក្នុងការរក្សាទុកថ្នាក់');
      }
    } catch (err) {
      console.error('Save class error:', err);
      showToast('មានបញ្ហាក្នុងការរក្សាទុកថ្នាក់');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះមុខវិជ្ជា');
      return;
    }
    setIsSaving(true);
    try {
      const subjectPayload = editingItem
        ? { ...editingItem, name: subjectName.trim(), type: subjectType }
        : { id: `s_${Date.now()}`, name: subjectName.trim(), type: subjectType };

      const res = await api('academic.saveSubject', { subject: subjectPayload });
      if (res?.success) {
        if (editingItem) {
          setSubjects(prev => prev.map(s => s.id === editingItem.id ? { ...s, ...subjectPayload } : s));
          showToast(`បានកែសម្រួលមុខវិជ្ជា "${subjectName.trim()}" ដោយជោគជ័យ`);
        } else {
          setSubjects(prev => [subjectPayload, ...prev]);
          showToast(`បានបន្ថែមមុខវិជ្ជាថ្មី "${subjectName.trim()}" ដោយជោគជ័យ`);
        }
        handleResetForm();
      } else {
        showToast(res?.error || 'មានបញ្ហាក្នុងការរក្សាទុកមុខវិជ្ជា');
      }
    } catch (err) {
      console.error('Save subject error:', err);
      showToast('មានបញ្ហាក្នុងការរក្សាទុកមុខវិជ្ជា');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Action
  const handleExecuteDelete = async () => {
    if (!deleteConfirm.item) return;
    try {
      if (deleteConfirm.type === 'class') {
        const res = await api('academic.deleteClass', { classId: deleteConfirm.item.id });
        if (res?.success) {
          setClasses(prev => prev.filter(c => c.id !== deleteConfirm.item.id));
          showToast(`បានលុបថ្នាក់ "${deleteConfirm.item.name}"`);
          if (editingItem?.id === deleteConfirm.item.id) handleResetForm();
        } else {
          showToast('មិនអាចលុបថ្នាក់រៀនបានទេ');
        }
      } else {
        const res = await api('academic.deleteSubject', { subjectId: deleteConfirm.item.id });
        if (res?.success) {
          setSubjects(prev => prev.filter(s => s.id !== deleteConfirm.item.id));
          showToast(`បានលុបមុខវិជ្ជា "${deleteConfirm.item.name}"`);
          if (editingItem?.id === deleteConfirm.item.id) handleResetForm();
        } else {
          showToast('មិនអាចលុបមុខវិជ្ជាបានទេ');
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('មានបញ្ហាក្នុងការលុប');
    } finally {
      setDeleteConfirm({ open: false, type: '', item: null });
    }
  };

  // ── Export (Excel, Word, PDF) ──
  const handleExport = (type = 'Excel') => {
    setExportOpen(false);
    const isClasses = activeTab === 'classes';
    const currentDataset = isClasses ? filteredClasses : filteredSubjects;

    if (currentDataset.length === 0) {
      showToast('មិនមានទិន្នន័យសម្រាប់ទាញយកទេ');
      return;
    }

    const title = isClasses ? 'បញ្ជីថ្នាក់រៀន' : 'បញ្ជីមុខវិជ្ជា';
    const subtitle = isClasses
      ? `ឆ្នាំសិក្សា ២០២៥ - ២០២៦ | សរុបចំនួន៖ ${filteredClasses.length} ថ្នាក់`
      : `ឆ្នាំសិក្សា ២០២៥ - ២០២៦ | សរុបចំនួន៖ ${filteredSubjects.length} មុខវិជ្ជា`;

    if (type === 'Excel') {
      if (isClasses) {
        const headers = ['ល.រ', 'កូដថ្នាក់', 'ឈ្មោះថ្នាក់', 'គ្រូបន្ទុកថ្នាក់', 'ចំនួនសិស្ស', 'ស្ថានភាព'];
        const rows = filteredClasses.map((c, i) => [
          `"${i + 1}"`,
          `"${c.id || `CLS-${String(i + 1).padStart(3, '0')}`}"`,
          `"${c.name}"`,
          `"${c.teacher || '-'}"`,
          `"${c.students || 0}"`,
          `"សកម្ម"`
        ]);
        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `បញ្ជីថ្នាក់រៀន_វិទ្យាល័យអង្គរកា_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`បានទាញយកបញ្ជីថ្នាក់រៀន (${filteredClasses.length} ថ្នាក់) ជា Excel ដោយជោគជ័យ`);
      } else {
        const headers = ['ល.រ', 'កូដមុខវិជ្ជា', 'ឈ្មោះមុខវិជ្ជា', 'ប្រភេទមុខវិជ្ជា', 'ស្ថានភាព'];
        const rows = filteredSubjects.map((s, i) => [
          `"${i + 1}"`,
          `"${s.id || `SUB-${String(i + 1).padStart(3, '0')}`}"`,
          `"${s.name}"`,
          `"${s.type}"`,
          `"សកម្ម"`
        ]);
        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `បញ្ជីមុខវិជ្ជា_វិទ្យាល័យអង្គរកា_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`បានទាញយកបញ្ជីមុខវិជ្ជា (${filteredSubjects.length} មុខវិជ្ជា) ជា Excel ដោយជោគជ័យ`);
      }
    } else if (type === 'Word') {
      const tableHeaders = isClasses
        ? `<tr>
            <th style="width: 40px;">ល.រ</th>
            <th style="width: 90px;">កូដថ្នាក់</th>
            <th>ឈ្មោះថ្នាក់</th>
            <th>គ្រូបន្ទុកថ្នាក់</th>
            <th style="width: 90px;">ចំនួនសិស្ស</th>
            <th style="width: 80px;">ស្ថានភាព</th>
          </tr>`
        : `<tr>
            <th style="width: 40px;">ល.រ</th>
            <th style="width: 100px;">កូដមុខវិជ្ជា</th>
            <th>ឈ្មោះមុខវិជ្ជា</th>
            <th style="width: 130px;">ប្រភេទមុខវិជ្ជា</th>
            <th style="width: 80px;">ស្ថានភាព</th>
          </tr>`;

      const tableRows = isClasses
        ? filteredClasses.map((c, i) => `
          <tr>
            <td class="text-center">${i + 1}</td>
            <td class="text-center" style="font-weight: bold;">${c.id || `CLS-${String(i + 1).padStart(3, '0')}`}</td>
            <td style="font-weight: bold;">${c.name}</td>
            <td>${c.teacher || '-'}</td>
            <td class="text-center">${c.students || 0}</td>
            <td class="text-center">សកម្ម</td>
          </tr>
        `).join('')
        : filteredSubjects.map((s, i) => `
          <tr>
            <td class="text-center">${i + 1}</td>
            <td class="text-center" style="font-weight: bold;">${s.id || `SUB-${String(i + 1).padStart(3, '0')}`}</td>
            <td style="font-weight: bold;">${s.name}</td>
            <td class="text-center">${s.type}</td>
            <td class="text-center">សកម្ម</td>
          </tr>
        `).join('');

      const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title} - វិទ្យាល័យអង្គរកា</title>
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
    @page { size: A4 portrait; margin: 1.5cm; }
    body { font-family: 'Khmer OS Siemreap', 'Khmer OS', 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .header-table td { border: none; padding: 4px; }
    .kingdom-title { font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 12pt; font-weight: bold; color: #1e3a8a; text-align: center; }
    .motto-title { font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 11pt; color: #1e3a8a; text-align: center; }
    .doc-title { font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', serif; font-size: 15pt; font-weight: bold; color: #0f172a; text-align: center; margin: 15px 0 5px 0; }
    .doc-subtitle { text-align: center; font-size: 10pt; color: #64748b; margin-bottom: 15px; }
    table.data-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    table.data-table th, table.data-table td { border: 1px solid #94a3b8; padding: 6px 8px; }
    table.data-table th { background-color: #f1f5f9; font-weight: bold; text-align: center; color: #1e293b; }
    .text-center { text-align: center; }
    .footer-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    .footer-table td { border: none; text-align: center; font-size: 10pt; }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <strong>ក្រសួងអប់រំ យុវជន និងកីឡា</strong><br>
        <strong>មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តតាកែវ</strong><br>
        <strong>វិទ្យាល័យអង្គរកា</strong>
      </td>
      <td style="width: 50%; vertical-align: top;">
        <div class="kingdom-title">ព្រះរាជាណាចក្រកម្ពុជា</div>
        <div class="motto-title">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
      </td>
    </tr>
  </table>

  <div class="doc-title">${title}</div>
  <div class="doc-subtitle">${subtitle}</div>

  <table class="data-table">
    <thead>${tableHeaders}</thead>
    <tbody>${tableRows}</tbody>
  </table>

  <table class="footer-table">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <br>
        <strong>បានឃើញ និងឯកភាព</strong><br>
        នាយកវិទ្យាល័យអង្គរកា
      </td>
      <td style="width: 50%; vertical-align: top;">
        ថ្ងៃទី....... ខែ....... ឆ្នាំ២០២...<br>
        <strong>អ្នករៀបចំបញ្ជី</strong>
      </td>
    </tr>
  </table>
</body>
</html>`;
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${title}_វិទ្យាល័យអង្គរកា_${new Date().toISOString().slice(0, 10)}.doc`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`បានទាញយក${title} (${currentDataset.length}) ជាឯកសារ Word (.doc) ដោយជោគជ័យ`);
    } else {
      // PDF Export via high-fidelity print window
      const printWindow = window.open('', '_blank', 'width=1000,height=800');
      if (!printWindow) {
        window.print();
        return;
      }

      const tableHeaders = isClasses
        ? `<tr>
            <th style="width: 40px;">ល.រ</th>
            <th style="width: 90px;">កូដថ្នាក់</th>
            <th>ឈ្មោះថ្នាក់</th>
            <th>គ្រូបន្ទុកថ្នាក់</th>
            <th style="width: 90px;">ចំនួនសិស្ស</th>
            <th style="width: 80px;">ស្ថានភាព</th>
          </tr>`
        : `<tr>
            <th style="width: 40px;">ល.រ</th>
            <th style="width: 100px;">កូដមុខវិជ្ជា</th>
            <th>ឈ្មោះមុខវិជ្ជា</th>
            <th style="width: 130px;">ប្រភេទមុខវិជ្ជា</th>
            <th style="width: 80px;">ស្ថានភាព</th>
          </tr>`;

      const tableRows = isClasses
        ? filteredClasses.map((c, i) => `
          <tr>
            <td class="text-center">${i + 1}</td>
            <td class="text-center" style="font-weight: 700;">${c.id || `CLS-${String(i + 1).padStart(3, '0')}`}</td>
            <td style="font-weight: 600;">${c.name}</td>
            <td>${c.teacher || '-'}</td>
            <td class="text-center">${c.students || 0} នាក់</td>
            <td class="text-center"><span class="badge status-active">សកម្ម</span></td>
          </tr>
        `).join('')
        : filteredSubjects.map((s, i) => `
          <tr>
            <td class="text-center">${i + 1}</td>
            <td class="text-center" style="font-weight: 700;">${s.id || `SUB-${String(i + 1).padStart(3, '0')}`}</td>
            <td style="font-weight: 600;">${s.name}</td>
            <td class="text-center">${s.type}</td>
            <td class="text-center"><span class="badge status-active">សកម្ម</span></td>
          </tr>
        `).join('');

      printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - វិទ្យាល័យអង្គរកា</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&family=Moul&display=swap');
    @page { size: A4 portrait; margin: 1.2cm; }
    * { box-sizing: border-box; }
    body { font-family: 'Kantumruy Pro', 'Khmer OS Siemreap', sans-serif; color: #1e293b; margin: 0; padding: 20px; background: #fff; font-size: 12px; }
    .header-grid { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .school-title { font-size: 12px; font-weight: 700; line-height: 1.6; color: #1e293b; }
    .kingdom-box { text-align: center; }
    .kingdom { font-family: 'Moul', 'Khmer OS Muol Light', serif; font-size: 13px; color: #1e3a8a; }
    .motto { font-family: 'Moul', 'Khmer OS Muol Light', serif; font-size: 11px; color: #1e3a8a; margin-top: 4px; }
    .doc-title { text-align: center; margin: 15px 0 4px 0; font-family: 'Moul', 'Khmer OS Muol Light', serif; font-size: 16px; color: #0f172a; }
    .doc-subtitle { text-align: center; font-size: 11.5px; color: #64748b; margin-bottom: 20px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }
    th { background-color: #f8fafc; font-weight: 700; color: #334155; text-align: center; }
    tr:nth-child(even) { background-color: #fdfdfd; }
    .text-center { text-align: center; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 600; }
    .status-active { color: #166534; background: #dcfce7; }
    .footer-sign { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 11.5px; page-break-inside: avoid; }
    .sign-col { width: 240px; }
    @media print { body { padding: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; padding: 10px; background: #f1f5f9; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-weight: 600;">មើលគំរូមុនពេលបោះពុម្ព ឬរក្សាទុកជា PDF (Print / Save as PDF)</span>
    <button onclick="window.print()" style="padding: 6px 14px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">បោះពុម្ព / រក្សាទុកជា PDF</button>
  </div>

  <div class="header-grid">
    <div class="school-title">
      ក្រសួងអប់រំ យុវជន និងកីឡា<br>
      មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តតាកែវ<br>
      វិទ្យាល័យអង្គរកា
    </div>
    <div class="kingdom-box">
      <div class="kingdom">ព្រះរាជាណាចក្រកម្ពុជា</div>
      <div class="motto">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
    </div>
  </div>

  <div class="doc-title">${title}</div>
  <div class="doc-subtitle">${subtitle}</div>

  <table>
    <thead>${tableHeaders}</thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer-sign">
    <div class="sign-col">
      <br>
      <strong>បានឃើញ និងឯកភាព</strong><br>
      នាយកវិទ្យាល័យអង្គរកា
    </div>
    <div class="sign-col">
      ថ្ងៃទី....... ខែ....... ឆ្នាំ២០២...<br>
      <strong>អ្នករៀបចំបញ្ជី</strong>
    </div>
  </div>
</body>
</html>
`);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 400);
      showToast(`បានបើកផ្ទាំងបោះពុម្ព${title} (${currentDataset.length}) សម្រាប់ Save as PDF`);
    }
  };

  // ── Import Logic (Excel / CSV) with Auto-ID ──
  const handleDownloadTemplate = () => {
    if (activeTab === 'classes') {
      const headers = ['កូដថ្នាក់ (ទុកទទេ - ប្រព័ន្ធបង្កើតអូតូ)', 'ឈ្មោះថ្នាក់', 'គ្រូបន្ទុកថ្នាក់', 'ចំនួនសិស្ស'];
      const sample = [
        ['""', '"12C"', '"លោកគ្រូ សុខ ផល្លា"', '"36"'],
        ['""', '"11C"', '"អ្នកគ្រូ អ៊ុំ សាវ៉ាន"', '"38"'],
        ['""', '"10C"', '"លោកគ្រូ ឈុន វឌ្ឍនៈ"', '"40"']
      ];
      const csvContent = '\uFEFF' + [headers.join(','), ...sample.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `គំរូ_បញ្ចូលថ្នាក់រៀន.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('បានទាញយកឯកសារគំរូនាំចូលថ្នាក់រៀន (.csv) ដោយជោគជ័យ (លេខកូដទុកទទេ)');
    } else {
      const headers = ['កូដមុខវិជ្ជា (ទុកទទេ - ប្រព័ន្ធបង្កើតអូតូ)', 'ឈ្មោះមុខវិជ្ជា', 'ប្រភេទមុខវិជ្ជា'];
      const sample = [
        ['""', '"សីលធម៌-ពលរដ្ឋ"', '"សង្គម"'],
        ['""', '"ផែនដីវិទ្យា"', '"វិទ្យាសាស្ត្រ"'],
        ['""', '"សេដ្ឋកិច្ចវិទ្យា"', '"សង្គម"']
      ];
      const csvContent = '\uFEFF' + [headers.join(','), ...sample.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `គំរូ_បញ្ចូលមុខវិជ្ជា.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('បានទាញយកឯកសារគំរូនាំចូលមុខវិជ្ជា (.csv) ដោយជោគជ័យ (លេខកូដទុកទទេ)');
    }
  };

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        const rawRows = parseCSV(text);
        if (rawRows.length === 0) {
          showToast('ឯកសារមិនមានទិន្នន័យ ឬខុសទម្រង់! សូមទាញយកឯកសារគំរូ។');
          return;
        }

        if (activeTab === 'classes') {
          const generatedIds = generateBatchClassIds(classes, rawRows.length);
          const parsed = rawRows.map((cols, idx) => {
            let code = '', name = '', teacher = '', students = 0;
            if (cols.length >= 4) {
              code = cols[0] || generatedIds[idx];
              name = cols[1] || `ថ្នាក់ថ្មី ${idx + 1}`;
              teacher = cols[2] || '';
              students = parseInt(cols[3], 10) || 0;
            } else if (cols.length === 3) {
              code = generatedIds[idx];
              name = cols[0] || `ថ្នាក់ថ្មី ${idx + 1}`;
              teacher = cols[1] || '';
              students = parseInt(cols[2], 10) || 0;
            } else {
              code = generatedIds[idx];
              name = cols[0] || `ថ្នាក់ថ្មី ${idx + 1}`;
              teacher = cols[1] || '';
            }
            return {
              id: code || generatedIds[idx],
              name: name.trim(),
              teacher: teacher.trim(),
              students: Number(students) || 0
            };
          });

          setImportModal({
            open: true,
            parsedData: parsed,
            isUploaded: true,
            fileName: file.name
          });
        } else {
          const generatedIds = generateBatchSubjectIds(subjects, rawRows.length);
          const parsed = rawRows.map((cols, idx) => {
            let code = '', name = '', type = 'វិទ្យាសាស្ត្រ';
            if (cols.length >= 3) {
              code = cols[0] || generatedIds[idx];
              name = cols[1] || `មុខវិជ្ជាថ្មី ${idx + 1}`;
              type = cols[2] || 'វិទ្យាសាស្ត្រ';
            } else if (cols.length === 2) {
              code = generatedIds[idx];
              name = cols[0] || `មុខវិជ្ជាថ្មី ${idx + 1}`;
              type = cols[1] || 'វិទ្យាសាស្ត្រ';
            } else {
              code = generatedIds[idx];
              name = cols[0] || `មុខវិជ្ជាថ្មី ${idx + 1}`;
            }
            return {
              id: code || generatedIds[idx],
              name: name.trim(),
              type: type.trim()
            };
          });

          setImportModal({
            open: true,
            parsedData: parsed,
            isUploaded: true,
            fileName: file.name
          });
        }
      } catch (err) {
        console.error('File parsing error:', err);
        showToast('មានបញ្ហាក្នុងការអានឯកសារ!');
      }
    };
    reader.onerror = () => {
      showToast('បរាជ័យក្នុងការបើកឯកសារ!');
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleLoadDemoImport = () => {
    if (activeTab === 'classes') {
      const demo = [
        { name: 'ថ្នាក់ 12C', teacher: 'លោកគ្រូ សុខ ផល្លា', students: 36 },
        { name: 'ថ្នាក់ 11C', teacher: 'អ្នកគ្រូ អ៊ុំ សាវ៉ាន', students: 38 },
        { name: 'ថ្នាក់ 10C', teacher: 'លោកគ្រូ ឈុន វឌ្ឍនៈ', students: 40 }
      ];
      const generatedIds = generateBatchClassIds(classes, demo.length);
      const finalDemo = demo.map((item, idx) => ({
        ...item,
        id: generatedIds[idx]
      }));
      setImportModal({
        open: true,
        parsedData: finalDemo,
        isUploaded: true,
        fileName: 'បញ្ជីថ្នាក់រៀន_គំរូសាកល្បង.csv'
      });
    } else {
      const demo = [
        { name: 'សីលធម៌-ពលរដ្ឋ', type: 'សង្គម' },
        { name: 'ផែនដីវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
        { name: 'សេដ្ឋកិច្ចវិទ្យា', type: 'សង្គម' }
      ];
      const generatedIds = generateBatchSubjectIds(subjects, demo.length);
      const finalDemo = demo.map((item, idx) => ({
        ...item,
        id: generatedIds[idx]
      }));
      setImportModal({
        open: true,
        parsedData: finalDemo,
        isUploaded: true,
        fileName: 'បញ្ជីមុខវិជ្ជា_គំរូសាកល្បង.csv'
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!importModal.parsedData || importModal.parsedData.length === 0) return;

    if (activeTab === 'classes') {
      const generatedIds = generateBatchClassIds(classes, importModal.parsedData.length);
      const finalItems = importModal.parsedData.map((item, idx) => ({
        ...item,
        id: item.id || generatedIds[idx]
      }));

      for (const c of finalItems) {
        try {
          await api('academic.saveClass', { class: c });
        } catch (e) {
          console.warn('Error saving imported class:', e);
        }
      }
      setClasses(prev => [...finalItems, ...prev]);
      showToast(`បាននាំចូលថ្នាក់រៀនថ្មីចំនួន ${finalItems.length} ដោយជោគជ័យ!`);
    } else {
      const generatedIds = generateBatchSubjectIds(subjects, importModal.parsedData.length);
      const finalItems = importModal.parsedData.map((item, idx) => ({
        ...item,
        id: item.id || generatedIds[idx]
      }));

      for (const s of finalItems) {
        try {
          await api('academic.saveSubject', { subject: s });
        } catch (e) {
          console.warn('Error saving imported subject:', e);
        }
      }
      setSubjects(prev => [...finalItems, ...prev]);
      showToast(`បាននាំចូលមុខវិជ្ជាថ្មីចំនួន ${finalItems.length} ដោយជោគជ័យ!`);
    }

    setImportModal({ open: false, parsedData: [], isUploaded: false, fileName: '' });
  };

  const totalClasses = classes.length;
  const totalSubjects = subjects.length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.students || 0), 0);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10 relative">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-[13px] font-bold border border-slate-700/50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={15} />
          </div>
          <span>{toast}</span>
        </div>
      )}

      {/* ── Top Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Classes Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">ថ្នាក់រៀនសរុប</div>
          </div>
          <div className="text-3xl font-black text-indigo-600 relative z-10">{totalClasses}</div>
          <p className="text-[11.5px] font-medium text-slate-400 mt-1">ថ្នាក់រៀនសកម្មក្នុងសាលា</p>
        </div>

        {/* Total Subjects Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <Book size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">មុខវិជ្ជាសរុប</div>
          </div>
          <div className="text-3xl font-black text-emerald-500 relative z-10">{totalSubjects}</div>
          <p className="text-[11.5px] font-medium text-slate-400 mt-1">មុខវិជ្ជាសិក្សាទូទៅ</p>
        </div>

        {/* Total Students Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <GraduationCap size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">សិស្សសរុប</div>
          </div>
          <div className="text-3xl font-black text-blue-500 relative z-10">{totalStudents}</div>
          <p className="text-[11.5px] font-medium text-slate-400 mt-1">សិស្សកំពុងសិក្សា</p>
        </div>
      </div>

      {/* ── Top Row: Tabs (គ្រប់គ្រងថ្នាក់/មុខវិជ្ជា) + Search + Filter + Export ── */}
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        {/* Left: Tabs */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('classes'); setCurrentPage(1); handleResetForm(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'classes'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
          >
            <Users size={16} />
            <span>គ្រប់គ្រងថ្នាក់រៀន ({classes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('subjects'); setCurrentPage(1); handleResetForm(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'subjects'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
          >
            <BookOpen size={16} />
            <span>គ្រប់គ្រងមុខវិជ្ជា ({subjects.length})</span>
          </button>
        </div>

        {/* Right: Search, Filter & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full 2xl:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64 min-w-[200px] group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder={activeTab === 'classes' ? 'ស្វែងរកឈ្មោះថ្នាក់ ឬ គ្រូបន្ទុកថ្នាក់...' : 'ស្វែងរកឈ្មោះមុខវិជ្ជា...'}
              className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-9 pr-4 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-xs"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Filter Dropdown */}
          <div className="w-48 shrink-0">
            {activeTab === 'classes' ? (
              <SearchableDropdown
                options={classLevelOptions}
                value={filterLevel}
                onChange={(v) => { setFilterLevel(v); setCurrentPage(1); }}
                placeholder="ជ្រើសរើសកម្រិត"
                icon={GraduationCap}
              />
            ) : (
              <SearchableDropdown
                options={subjectTypeOptions}
                value={filterType}
                onChange={(v) => { setFilterType(v); setCurrentPage(1); }}
                placeholder="ជ្រើសរើសប្រភេទ"
                icon={BookOpen}
              />
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchAcademicData(false)}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-3.5 rounded-xl font-bold text-[13px] transition-all shadow-xs hover:shadow hover:-translate-y-0.5 shrink-0 disabled:opacity-50"
            title="ទាញទិន្នន័យថ្មីពី Cloud Firestore"
          >
            <RefreshCw size={15} strokeWidth={2.5} className={`text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">ទាញទិន្នន័យថ្មី</span>
          </button>

          {/* Import Excel Button */}
          <button
            type="button"
            onClick={() => setImportModal({ open: true, parsedData: [], isUploaded: false, fileName: '' })}
            className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 py-2.5 px-3.5 rounded-xl font-bold text-[13px] transition-all shadow-xs hover:shadow hover:-translate-y-0.5 shrink-0 cursor-pointer"
            title={`នាំចូល${activeTab === 'classes' ? 'ថ្នាក់រៀន' : 'មុខវិជ្ជា'}ពី Excel (.csv, .xlsx)`}
          >
            <FileSpreadsheet size={15} strokeWidth={2.2} className="text-emerald-600" />
            <span>នាំចូលពី Excel</span>
          </button>

          {/* Export Dropdown Button */}
          <div className="relative shrink-0" ref={exportRef}>
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-5 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              title={`នាំចេញ${activeTab === 'classes' ? 'បញ្ជីថ្នាក់រៀន' : 'បញ្ជីមុខវិជ្ជា'}ជា PDF, Excel ឬ Word`}
            >
              <Download size={15} strokeWidth={2.5} />
              <span>នាំចេញ (Export)</span>
              <ChevronDown size={15} strokeWidth={2.5} className={`transition-transform duration-300 ml-0.5 ${exportOpen ? 'rotate-180' : ''}`} />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  type="button"
                  onClick={() => handleExport('PDF')}
                  className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group cursor-pointer"
                >
                  <FileText size={16} className="text-rose-500 group-hover:scale-110 transition-transform" />
                  <span>Export as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('Excel')}
                  className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group cursor-pointer"
                >
                  <FileCode size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span>Export as Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('Word')}
                  className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group cursor-pointer"
                >
                  <FileImage size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                  <span>Export as Word</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main 2-Column Layout (Left: Form Add/Edit | Right: Table using Student Attendance Template) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── LEFT COLUMN (Form Add/Edit - STRICTLY NO PLACEHOLDERS) ── */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">

            {/* Form Header */}
            <div className={`p-5 border-b border-slate-100 flex items-center justify-between ${editingItem ? 'bg-indigo-50/40' : 'bg-slate-50/40'
              }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${editingItem ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                  {editingItem ? <Edit size={17} /> : <Plus size={18} strokeWidth={2.5} />}
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-slate-800">
                    {editingItem
                      ? (activeTab === 'classes' ? 'កែសម្រួលថ្នាក់រៀន' : 'កែសម្រួលមុខវិជ្ជា')
                      : (activeTab === 'classes' ? 'បន្ថែមថ្នាក់ថ្មី' : 'បន្ថែមមុខវិជ្ជាថ្មី')
                    }
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    {editingItem ? 'កំពុងកែប្រែទិន្នន័យដែលបានជ្រើសរើស' : 'បំពេញព័ត៌មានខាងក្រោមដើម្បីបង្កើត'}
                  </p>
                </div>
              </div>

              {editingItem && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-2xs transition-colors"
                  title="បោះបង់ការកែប្រែ ហើយត្រឡប់ទៅបន្ថែមថ្មី"
                >
                  <RotateCcw size={11} />
                  <span>បន្ថែមថ្មី</span>
                </button>
              )}
            </div>

            {/* Form Body: Classes or Subjects (NO PLACEHOLDERS) */}
            {activeTab === 'classes' ? (
              <form onSubmit={handleSaveClass} className="p-5 flex flex-col gap-4">
                {/* Class Name */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                    ឈ្មោះថ្នាក់ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3.5 rounded-xl font-bold text-[13.5px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all shadow-xs"
                  />
                </div>

                {/* Homeroom Teacher */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                    គ្រូបន្ទុកថ្នាក់
                  </label>
                  <input
                    type="text"
                    value={classTeacher}
                    onChange={(e) => setClassTeacher(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3.5 rounded-xl font-bold text-[13.5px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all shadow-xs"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 mt-2 pt-4 border-t border-slate-100">
                  {editingItem && (
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[12.5px] font-bold transition-all"
                    >
                      បោះបង់
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving || !className.trim()}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>{editingItem ? 'រក្សាទុកការកែប្រែ' : 'រក្សាទុកថ្នាក់ថ្មី'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveSubject} className="p-5 flex flex-col gap-4">
                {/* Subject Name */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                    ឈ្មោះមុខវិជ្ជា <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3.5 rounded-xl font-bold text-[13.5px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all shadow-xs"
                  />
                </div>

                {/* Subject Type */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                    ប្រភេទមុខវិជ្ជា <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={subjectType}
                    onChange={(e) => setSubjectType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-3.5 rounded-xl font-bold text-[13px] focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="វិទ្យាសាស្ត្រ">វិទ្យាសាស្ត្រ</option>
                    <option value="សង្គម">សង្គម</option>
                    <option value="ទូទៅ">ទូទៅ</option>
                    <option value="ភាសាបរទេស">ភាសាបរទេស</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 mt-2 pt-4 border-t border-slate-100">
                  {editingItem && (
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[12.5px] font-bold transition-all"
                    >
                      បោះបង់
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving || !subjectName.trim()}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>{editingItem ? 'រក្សាទុកការកែប្រែ' : 'រក្សាទុកមុខវិជ្ជាថ្មី'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

        {/* ── RIGHT COLUMN: Data Table matching AdminStudentAttendance Template ── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">

          {/* Main Table Card (matching AdminStudentAttendance) */}
          <div className="bg-white rounded-2xl border border-slate-200/60 flex flex-col relative shadow-sm overflow-hidden">

            {/* Table */}
            <div className="w-full overflow-x-auto custom-scrollbar relative min-h-[380px]">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50">
                    <th className="py-3.5 px-5 text-[11.5px] font-bold text-slate-500 uppercase tracking-wider">
                      {activeTab === 'classes' ? 'កូដថ្នាក់' : 'កូដមុខវិជ្ជា'}
                    </th>
                    <th className="py-3.5 px-5 text-[11.5px] font-bold text-slate-500 uppercase tracking-wider min-w-[160px]">
                      {activeTab === 'classes' ? 'ឈ្មោះថ្នាក់រៀន' : 'ឈ្មោះមុខវិជ្ជា'}
                    </th>
                    <th className={`py-3.5 px-5 text-[11.5px] font-bold text-slate-500 uppercase tracking-wider ${activeTab === 'classes' ? 'text-left' : 'text-center'}`}>
                      {activeTab === 'classes' ? 'គ្រូបន្ទុកថ្នាក់' : 'ប្រភេទមុខវិជ្ជា'}
                    </th>
                    {activeTab === 'classes' && (
                      <th className="py-3.5 px-5 text-[11.5px] font-bold text-slate-500 uppercase tracking-wider text-center">
                        ចំនួនសិស្ស
                      </th>
                    )}
                    <th className="py-3.5 px-5 text-[11.5px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      ស្ថានភាព
                    </th>
                    <th className="py-3.5 px-5 text-[11.5px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      សកម្មភាព
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, idx) => {
                      const isEditing = editingItem?.id === item.id;
                      const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                      const code = activeTab === 'classes' ? `CLS-${String(itemIndex).padStart(3, '0')}` : `SUB-${String(itemIndex).padStart(3, '0')}`;

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${isEditing ? 'bg-indigo-50/50' : 'hover:bg-slate-50/60'}`}
                        >
                          {/* Code */}
                          <td className="py-3.5 px-5">
                            <span className="text-[12.5px] font-mono font-medium text-slate-500">
                              {code}
                            </span>
                          </td>

                          {/* Name */}
                          <td className="py-3.5 px-5">
                            <span className="text-[13.5px] font-bold text-slate-800">
                              {item.name}
                            </span>
                          </td>

                          {/* Homeroom Teacher or Subject Type */}
                          <td className={`py-3.5 px-5 ${activeTab === 'classes' ? 'text-left' : 'text-center'}`}>
                            {activeTab === 'classes' ? (
                              <span className="text-[13px] font-medium text-slate-700">
                                {item.teacher || '—'}
                              </span>
                            ) : (
                              <span className="text-[12.5px] font-medium text-slate-600">
                                {item.type}
                              </span>
                            )}
                          </td>

                          {/* Student Count for classes */}
                          {activeTab === 'classes' && (
                            <td className="py-3.5 px-5 text-center">
                              <span className="text-[13px] font-semibold text-slate-700">{item.students || 0}</span>
                              <span className="text-[11px] text-slate-400 font-normal ml-1">នាក់</span>
                            </td>
                          )}

                          {/* Status */}
                          <td className="py-3.5 px-5 text-center">
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              សកម្ម
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => activeTab === 'classes' ? handleStartEditClass(item) : handleStartEditSubject(item)}
                                className="px-2.5 py-1 text-[12px] font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1"
                                title="កែសម្រួល"
                              >
                                <Edit size={13} />
                                <span>កែប្រែ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ open: true, type: activeTab === 'classes' ? 'class' : 'subject', item })}
                                className="px-2.5 py-1 text-[12px] font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-1"
                                title="លុបចេញ"
                              >
                                <Trash2 size={13} />
                                <span>លុប</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={activeTab === 'classes' ? 6 : 5} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                            <Search size={28} className="text-slate-300" />
                          </div>
                          <span className="font-bold text-slate-700 text-[15px]">មិនមានទិន្នន័យត្រូវគ្នានឹងការស្វែងរកទេ</span>
                          <span className="text-[13px] font-medium text-slate-500 mt-1">សូមសាកល្បង Filter ផ្សេងទៀត</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer matching AdminStudentAttendance */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
              <span className="text-[12px] font-medium text-slate-400">
                បង្ហាញ {currentDataset.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, currentDataset.length)} នៃ {currentDataset.length} {activeTab === 'classes' ? 'ថ្នាក់' : 'មុខវិជ្ជា'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    type="button"
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-full font-bold text-[14px] flex items-center justify-center transition-all ${currentPage === i + 1
                        ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.35)]'
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <ChevronsRight size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm.open && deleteConfirm.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-[16px] font-black text-slate-800">
              បញ្ជាក់ការលុប{deleteConfirm.type === 'class' ? 'ថ្នាក់រៀន' : 'មុខវិជ្ជា'}
            </h3>
            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
              តើអ្នកពិតជាចង់លុប <span className="font-bold text-slate-800">"{deleteConfirm.item.name}"</span> ចេញពីប្រព័ន្ធមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: false, type: '', item: null })}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] font-bold transition-all"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all"
              >
                លុបចេញ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Modal ── */}
      {importModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800">
                    នាំចូលទិន្នន័យ{activeTab === 'classes' ? 'ថ្នាក់រៀន' : 'មុខវិជ្ជា'}ពី Excel
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400">គាំទ្រឯកសារប្រភេទ .csv, .xlsx ឬ .xls</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportModal({ open: false, parsedData: [], isUploaded: false, fileName: '' })}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto custom-scrollbar">

              {/* Step 1: Download Sample Template Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                    <Download size={15} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-700">ទាញយកឯកសារគំរូ (Template)</p>
                    <p className="text-[11px] text-slate-400">ទាញយកឯកសារគំរូសម្រាប់បំពេញទិន្នន័យ{activeTab === 'classes' ? 'ថ្នាក់រៀន' : 'មុខវិជ្ជា'} (ជួរឈរលេខកូដអាចទុកទទេបាន)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 text-[12px] font-bold shadow-xs transition-all whitespace-nowrap cursor-pointer"
                >
                  ទាញយកគំរូ (.csv)
                </button>
              </div>

              {/* Step 2: Upload Dropzone */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleSelectFile}
                  accept=".xlsx, .xls, .csv, text/csv, application/vnd.ms-excel"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 transition-colors">
                    <Upload size={22} />
                  </div>
                  <p className="text-[14px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {importModal.fileName ? importModal.fileName : 'ចុចដើម្បីជ្រើសរើសឯកសារ ឬអូសទម្លាក់ទីនេះ'}
                  </p>
                  <p className="text-[12px] text-slate-400 mt-1">
                    ឯកសារ CSV ឬ Excel (.csv, .xlsx, .xls)
                  </p>
                </div>

                {/* Quick Demo Button */}
                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleLoadDemoImport}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                  >
                    <span>ចុចទីនេះដើម្បីសាកល្បងផ្ទុកទិន្នន័យគំរូ 3 {activeTab === 'classes' ? 'ថ្នាក់' : 'មុខវិជ្ជា'} ភ្លាមៗ</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>

              {/* Step 3: Preview Parsed Data */}
              {importModal.isUploaded && importModal.parsedData.length > 0 && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-[13px] font-bold text-slate-700">
                        ទិន្នន័យដែលបានផ្ទៀងផ្ទាត់ ({importModal.parsedData.length} {activeTab === 'classes' ? 'ថ្នាក់' : 'មុខវិជ្ជា'})
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      រួចរាល់សម្រាប់ការនាំចូល
                    </span>
                  </div>

                  {/* Auto-ID Banner matching AdminStudents */}
                  <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl px-3.5 py-2 text-[12px] text-indigo-800 flex items-center gap-2 shadow-2xs">
                    <Sparkles size={14} className="text-indigo-600 shrink-0" />
                    <span>ប្រព័ន្ធបាន <strong>Auto-Generate លេខកូដ{activeTab === 'classes' ? 'ថ្នាក់' : 'មុខវិជ្ជា'}</strong> ដោយស្វ័យប្រវត្តិតាមលំដាប់ ដើម្បីធានាថាមិនមានការស្ទួនលេខកូដគ្នាឡើយ។</span>
                  </div>

                  <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold">
                          <th className="py-2.5 px-3 text-center w-12">ល.រ</th>
                          <th className="py-2.5 px-3 text-center">{activeTab === 'classes' ? 'កូដថ្នាក់ (Auto)' : 'កូដមុខវិជ្ជា (Auto)'}</th>
                          <th className="py-2.5 px-3">{activeTab === 'classes' ? 'ឈ្មោះថ្នាក់' : 'ឈ្មោះមុខវិជ្ជា'}</th>
                          <th className="py-2.5 px-3">{activeTab === 'classes' ? 'គ្រូបន្ទុកថ្នាក់' : 'ប្រភេទមុខវិជ្ជា'}</th>
                          {activeTab === 'classes' && <th className="py-2.5 px-3 text-center">ចំនួនសិស្ស</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {importModal.parsedData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-center text-slate-400 font-medium">{i + 1}</td>
                            <td className="py-2 px-3 text-center font-bold text-indigo-600 font-mono">{row.id}</td>
                            <td className="py-2 px-3 font-bold">{row.name}</td>
                            <td className="py-2 px-3">{activeTab === 'classes' ? (row.teacher || '—') : row.type}</td>
                            {activeTab === 'classes' && <td className="py-2 px-3 text-center">{row.students || 0} នាក់</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setImportModal({ open: false, parsedData: [], isUploaded: false, fileName: '' })}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-[13px] font-bold transition-all"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={!importModal.isUploaded || importModal.parsedData.length === 0}
                onClick={handleConfirmImport}
                className={`px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-md transition-all flex items-center gap-2 ${
                  !importModal.isUploaded || importModal.parsedData.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>បញ្ជាក់ការនាំចូល ({importModal.parsedData.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
