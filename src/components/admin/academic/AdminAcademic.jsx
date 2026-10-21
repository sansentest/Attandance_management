import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Users, Plus, Edit, Trash2, Search, Book, GraduationCap,
  X, Save, Loader2, Download, CheckCircle2, RotateCcw, AlertTriangle,
  ChevronDown, ChevronLeft, ChevronRight, ChevronsRight, FileText, FileCode, User,
  Upload, FileSpreadsheet, ArrowRight
} from 'lucide-react';

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

  // Mock Data
  const [classes, setClasses] = useState([
    { id: 'c1', name: 'ថ្នាក់ 12A', students: 35, teacher: 'លោកគ្រូ សាន វិបុល' },
    { id: 'c2', name: 'ថ្នាក់ 12B', students: 32, teacher: 'អ្នកគ្រូ ហេង សុផល' },
    { id: 'c3', name: 'ថ្នាក់ 11A', students: 40, teacher: 'លោកគ្រូ ចាន់ ណារិន' },
    { id: 'c4', name: 'ថ្នាក់ 11B', students: 38, teacher: 'អ្នកគ្រូ កែវ សុខា' },
    { id: 'c5', name: 'ថ្នាក់ 10A', students: 42, teacher: 'លោកគ្រូ ឡុង ពិសិដ្ឋ' },
    { id: 'c6', name: 'ថ្នាក់ 10B', students: 36, teacher: 'អ្នកគ្រូ ជា ស្រីពៅ' },
  ]);

  const [subjects, setSubjects] = useState([
    { id: 's1', name: 'គណិតវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
    { id: 's2', name: 'រូបវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
    { id: 's3', name: 'គីមីវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
    { id: 's4', name: 'ជីវវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
    { id: 's5', name: 'អក្សរសាស្ត្រខ្មែរ', type: 'សង្គម' },
    { id: 's6', name: 'ប្រវត្តិវិទ្យា', type: 'សង្គម' },
    { id: 's7', name: 'ភាសាអង់គ្លេស', type: 'ភាសាបរទេស' },
    { id: 's8', name: 'ពលរដ្ឋវិទ្យា', type: 'សង្គម' },
    { id: 's9', name: 'ព័ត៌មានវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
    { id: 's10', name: 'អប់រំកាយ/កីឡា', type: 'ទូទៅ' },
  ]);

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
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', item: null });

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
  const handleSaveClass = (e) => {
    e.preventDefault();
    if (!className.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះថ្នាក់រៀន');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      if (editingItem) {
        setClasses(classes.map(c => c.id === editingItem.id ? { ...c, name: className.trim(), teacher: classTeacher.trim() } : c));
        showToast(`បានកែសម្រួលថ្នាក់ "${className.trim()}" ដោយជោគជ័យ`);
      } else {
        const newClass = { id: `c_${Date.now()}`, name: className.trim(), students: 0, teacher: classTeacher.trim() };
        setClasses([newClass, ...classes]);
        showToast(`បានបន្ថែមថ្នាក់ថ្មី "${className.trim()}" ដោយជោគជ័យ`);
      }
      setIsSaving(false);
      handleResetForm();
    }, 300);
  };

  const handleSaveSubject = (e) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះមុខវិជ្ជា');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      if (editingItem) {
        setSubjects(subjects.map(s => s.id === editingItem.id ? { ...s, name: subjectName.trim(), type: subjectType } : s));
        showToast(`បានកែសម្រួលមុខវិជ្ជា "${subjectName.trim()}" ដោយជោគជ័យ`);
      } else {
        const newSubject = { id: `s_${Date.now()}`, name: subjectName.trim(), type: subjectType };
        setSubjects([newSubject, ...subjects]);
        showToast(`បានបន្ថែមមុខវិជ្ជាថ្មី "${subjectName.trim()}" ដោយជោគជ័យ`);
      }
      setIsSaving(false);
      handleResetForm();
    }, 300);
  };

  // Delete Action
  const handleExecuteDelete = () => {
    if (!deleteConfirm.item) return;
    if (deleteConfirm.type === 'class') {
      setClasses(classes.filter(c => c.id !== deleteConfirm.item.id));
      showToast(`បានលុបថ្នាក់ "${deleteConfirm.item.name}"`);
      if (editingItem?.id === deleteConfirm.item.id) handleResetForm();
    } else {
      setSubjects(subjects.filter(s => s.id !== deleteConfirm.item.id));
      showToast(`បានលុបមុខវិជ្ជា "${deleteConfirm.item.name}"`);
      if (editingItem?.id === deleteConfirm.item.id) handleResetForm();
    }
    setDeleteConfirm({ open: false, type: '', item: null });
  };

  // Export matching AdminStudentAttendance
  const handleExport = (type = 'Excel') => {
    setExportOpen(false);
    if (activeTab === 'classes') {
      if (filteredClasses.length === 0) {
        showToast('មិនមានទិន្នន័យសម្រាប់ទាញយកទេ');
        return;
      }
      if (type === 'PDF') {
        window.print();
        return;
      }
      const headers = ['កូដថ្នាក់', 'ឈ្មោះថ្នាក់', 'គ្រូបន្ទុកថ្នាក់', 'ចំនួនសិស្ស', 'ស្ថានភាព'];
      const rows = filteredClasses.map((c, i) => [
        `"CLS-${String(i + 1).padStart(3, '0')}"`,
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
      link.setAttribute('download', `បញ្ជីថ្នាក់រៀន_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`បានទាញយកបញ្ជីថ្នាក់រៀន (${filteredClasses.length} ថ្នាក់) ជា Excel`);
    } else {
      if (filteredSubjects.length === 0) {
        showToast('មិនមានទិន្នន័យសម្រាប់ទាញយកទេ');
        return;
      }
      if (type === 'PDF') {
        window.print();
        return;
      }
      const headers = ['កូដមុខវិជ្ជា', 'ឈ្មោះមុខវិជ្ជា', 'ប្រភេទមុខវិជ្ជា', 'ស្ថានភាព'];
      const rows = filteredSubjects.map((s, i) => [
        `"SUB-${String(i + 1).padStart(3, '0')}"`,
        `"${s.name}"`,
        `"${s.type}"`,
        `"សកម្ម"`
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `បញ្ជីមុខវិជ្ជា_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`បានទាញយកបញ្ជីមុខវិជ្ជា (${filteredSubjects.length} មុខវិជ្ជា) ជា Excel`);
    }
  };

  // ── Import Logic (Excel / CSV) ──
  const handleDownloadTemplate = () => {
    if (activeTab === 'classes') {
      const headers = ['ឈ្មោះថ្នាក់', 'គ្រូបន្ទុកថ្នាក់', 'ចំនួនសិស្ស'];
      const sample = [
        ['ថ្នាក់ 12C', 'លោកគ្រូ សុខ ផល្លា', '36'],
        ['ថ្នាក់ 11C', 'អ្នកគ្រូ អ៊ុំ សាវ៉ាន', '38'],
        ['ថ្នាក់ 10C', 'លោកគ្រូ ឈុន វឌ្ឍនៈ', '40']
      ];
      const csvContent = '\uFEFF' + [headers.join(','), ...sample.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ទម្រង់គំរូនាំចូលថ្នាក់រៀន.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('បានទាញយកឯកសារគំរូនាំចូលថ្នាក់រៀន');
    } else {
      const headers = ['ឈ្មោះមុខវិជ្ជា', 'ប្រភេទមុខវិជ្ជា'];
      const sample = [
        ['សីលធម៌-ពលរដ្ឋ', 'សង្គម'],
        ['ផែនដីវិទ្យា', 'វិទ្យាសាស្ត្រ'],
        ['សេដ្ឋកិច្ចវិទ្យា', 'សង្គម']
      ];
      const csvContent = '\uFEFF' + [headers.join(','), ...sample.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ទម្រង់គំរូនាំចូលមុខវិជ្ជា.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('បានទាញយកឯកសារគំរូនាំចូលមុខវិជ្ជា');
    }
  };

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') return;

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        showToast('ឯកសារគ្មានទិន្នន័យសម្រាប់នាំចូលទេ');
        return;
      }

      const dataRows = lines.slice(1);
      const parsed = [];

      dataRows.forEach((line, idx) => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (activeTab === 'classes') {
          const name = cols[0] || `ថ្នាក់ថ្មី ${idx + 1}`;
          const teacher = cols[1] || '';
          const students = parseInt(cols[2], 10) || 0;
          parsed.push({
            id: `c_imp_${Date.now()}_${idx}`,
            name,
            teacher,
            students
          });
        } else {
          const name = cols[0] || `មុខវិជ្ជាថ្មី ${idx + 1}`;
          const type = cols[1] || 'វិទ្យាសាស្ត្រ';
          parsed.push({
            id: `s_imp_${Date.now()}_${idx}`,
            name,
            type
          });
        }
      });

      setImportModal({
        open: true,
        parsedData: parsed,
        isUploaded: true,
        fileName: file.name
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadDemoImport = () => {
    if (activeTab === 'classes') {
      const demo = [
        { id: `c_demo_1_${Date.now()}`, name: 'ថ្នាក់ 12C', teacher: 'លោកគ្រូ សុខ ផល្លា', students: 36 },
        { id: `c_demo_2_${Date.now()}`, name: 'ថ្នាក់ 11C', teacher: 'អ្នកគ្រូ អ៊ុំ សាវ៉ាន', students: 38 },
        { id: `c_demo_3_${Date.now()}`, name: 'ថ្នាក់ 10C', teacher: 'លោកគ្រូ ឈុន វឌ្ឍនៈ', students: 40 }
      ];
      setImportModal({
        open: true,
        parsedData: demo,
        isUploaded: true,
        fileName: 'demo_classes_sample.csv'
      });
    } else {
      const demo = [
        { id: `s_demo_1_${Date.now()}`, name: 'សីលធម៌-ពលរដ្ឋ', type: 'សង្គម' },
        { id: `s_demo_2_${Date.now()}`, name: 'ផែនដីវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
        { id: `s_demo_3_${Date.now()}`, name: 'សេដ្ឋកិច្ចវិទ្យា', type: 'សង្គម' }
      ];
      setImportModal({
        open: true,
        parsedData: demo,
        isUploaded: true,
        fileName: 'demo_subjects_sample.csv'
      });
    }
  };

  const handleConfirmImport = () => {
    if (!importModal.parsedData || importModal.parsedData.length === 0) return;

    if (activeTab === 'classes') {
      setClasses([...importModal.parsedData, ...classes]);
      showToast(`បាននាំចូលថ្នាក់រៀនថ្មីចំនួន ${importModal.parsedData.length} ដោយជោគជ័យ!`);
    } else {
      setSubjects([...importModal.parsedData, ...subjects]);
      showToast(`បាននាំចូលមុខវិជ្ជាថ្មីចំនួន ${importModal.parsedData.length} ដោយជោគជ័យ!`);
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

          {/* Import Button */}
          <button
            type="button"
            onClick={() => setImportModal({ open: true, parsedData: [], isUploaded: false, fileName: '' })}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-4 rounded-xl font-bold text-[13px] transition-all shadow-xs hover:shadow hover:-translate-y-0.5 shrink-0"
            title={`នាំចូលទិន្នន័យ${activeTab === 'classes' ? 'ថ្នាក់រៀន' : 'មុខវិជ្ជា'}ពី Excel (.csv, .xlsx)`}
          >
            <Upload size={15} strokeWidth={2.5} className="text-emerald-600" />
            <span>នាំចូល (Import)</span>
          </button>

          {/* Export Dropdown Button */}
          <div className="relative shrink-0" ref={exportRef}>
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-5 rounded-xl font-bold text-[13px] transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5"
            >
              <Download size={15} strokeWidth={2.5} />
              <span>នាំចេញ (Export)</span>
              <ChevronDown size={15} strokeWidth={2.5} className={`transition-transform duration-300 ml-1 ${exportOpen ? 'rotate-180' : ''}`} />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  type="button"
                  onClick={() => handleExport('Excel')}
                  className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group"
                >
                  <FileCode size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span>Export as Excel (.csv)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('PDF')}
                  className="flex items-center gap-3 w-full px-5 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors hover:text-indigo-600 group"
                >
                  <FileText size={16} className="text-rose-500 group-hover:scale-110 transition-transform" />
                  <span>Export as PDF (Print)</span>
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
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
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
            <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">

              {/* Step 1: Download Sample Template Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                    <Download size={14} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-700">ទាញយកឯកសារគំរូ (Template)</p>
                    <p className="text-[11px] text-slate-400">ទាញយកឯកសារគំរូសម្រាប់បំពេញទិន្នន័យឱ្យត្រូវទម្រង់</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 text-[12px] font-bold shadow-xs transition-all whitespace-nowrap"
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
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2.5 transition-colors">
                    <Upload size={20} />
                  </div>
                  <p className="text-[13.5px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {importModal.fileName ? importModal.fileName : 'ចុចដើម្បីជ្រើសរើសឯកសារ ឬអូសទម្លាក់ទីនេះ'}
                  </p>
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    ឯកសារ CSV ឬ Excel (.csv, .xlsx)
                  </p>
                </div>

                {/* Quick Demo Button */}
                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleLoadDemoImport}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 flex items-center gap-1"
                  >
                    <span>ចុចទីនេះដើម្បីសាកល្បងផ្ទុកទិន្នន័យគំរូ 3 {activeTab === 'classes' ? 'ថ្នាក់' : 'មុខវិជ្ជា'} ភ្លាមៗ</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>

              {/* Step 3: Preview Parsed Data */}
              {importModal.isUploaded && importModal.parsedData.length > 0 && (
                <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
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

                  <div className="border border-slate-200/80 rounded-xl overflow-hidden max-h-44 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold">
                          <th className="py-2.5 px-3">{activeTab === 'classes' ? 'ឈ្មោះថ្នាក់' : 'ឈ្មោះមុខវិជ្ជា'}</th>
                          <th className="py-2.5 px-3">{activeTab === 'classes' ? 'គ្រូបន្ទុកថ្នាក់' : 'ប្រភេទមុខវិជ្ជា'}</th>
                          {activeTab === 'classes' && <th className="py-2.5 px-3 text-center">ចំនួនសិស្ស</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {importModal.parsedData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
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
