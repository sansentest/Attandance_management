import { useState, useRef } from 'react';
import {
  X, Upload, FileSpreadsheet, Download, CheckCircle2,
  AlertCircle, Eye, EyeOff, Trash2, Loader2, Sparkles, UserCheck, Shield
} from 'lucide-react';
import { exportUsersTemplateExcel, downloadUsersTemplateCsv } from './exports/exportUsersTemplateExcel.js';

// Helper to generate sequential user IDs (USR-xxx)
export function generateBatchUserIds(existingUsers = [], count = 1) {
  const existingNumbers = (existingUsers || [])
    .map((u) => {
      const match = String(u.id || '').match(/USR-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));

  let maxId = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  const result = [];
  for (let i = 0; i < count; i++) {
    maxId++;
    result.push(`USR-${String(maxId).padStart(3, '0')}`);
  }
  return result;
}

// Clean and normalize class name (e.g. "ថ្នាក់ 10A" -> "10A")
function cleanClassName(val) {
  if (!val) return '';
  return String(val).replace(/^(ថ្នាក់|ថ្នាក់ទី|\s)+/i, '').trim() || String(val).trim();
}

export default function ImportUsersModal({
  isOpen,
  onClose,
  onImportSuccess,
  existingUsers = [],
  classOptions = [],
  showToast
}) {
  const [fileName, setFileName] = useState('');
  const [parsedUsers, setParsedUsers] = useState([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Existing usernames set for duplicate checking
  const existingUsernames = new Set(
    (existingUsers || []).map((u) => (u.username || '').toLowerCase().trim())
  );

  // ── Dynamically Load SheetJS ──
  const loadSheetJS = async () => {
    if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      s.onload = () => resolve(window.XLSX);
      s.onerror = () => {
        const fallback = document.createElement('script');
        fallback.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        fallback.onload = () => resolve(window.XLSX);
        fallback.onerror = () => reject(new Error('Cannot load XLSX library'));
        document.head.appendChild(fallback);
      };
      document.head.appendChild(s);
    });
  };

  // ── Parse Matrix/Rows into Users ──
  const parseRowsToUsers = (rows = []) => {
    if (!rows || rows.length < 2) return [];

    // Find header row (usually row 0 to 12 in administrative templates)
    let headerIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const rowStr = (rows[i] || []).map((c) => String(c || '').toLowerCase()).join(' ');
      if (
        rowStr.includes('username') ||
        rowStr.includes('គណនី') ||
        rowStr.includes('password') ||
        rowStr.includes('សម្ងាត់') ||
        rowStr.includes('ឈ្មោះ')
      ) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) headerIdx = 0;

    const headers = (rows[headerIdx] || []).map((h) => String(h || '').toLowerCase().trim());

    let nameCol = headers.findIndex((h) => (h.includes('ឈ្មោះ') && !h.includes('គណនី')) || h.includes('name') || h.includes('fullname'));
    let userCol = headers.findIndex((h) => h.includes('username') || h.includes('ឈ្មោះគណនី') || h.includes('គណនី'));
    let passCol = headers.findIndex((h) => h.includes('password') || h.includes('ពាក្យសម្ងាត់') || h.includes('សម្ងាត់') || h.includes('pass'));
    let roleCol = headers.findIndex((h) => h.includes('តួនាទី') || h.includes('role'));
    let classCol = headers.findIndex((h) => h.includes('ថ្នាក់') || h.includes('class') || h.includes('grade'));
    let statusCol = headers.findIndex((h) => h.includes('ស្ថានភាព') || h.includes('status'));

    // Fallbacks if not recognized by keywords
    if (nameCol === -1) nameCol = 1;
    if (userCol === -1) userCol = 2;
    if (passCol === -1) passCol = 3;
    if (roleCol === -1) roleCol = 4;
    if (classCol === -1) classCol = 5;
    if (statusCol === -1) statusCol = 6;

    const results = [];
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rowText = row.map((c) => String(c || '')).join(' ');
      // Skip administrative metadata, instructions, or signatures
      if (
        rowText.includes('ការណែនាំ') ||
        rowText.includes('បានឃើញ') ||
        rowText.includes('នាយក') ||
        rowText.includes('អ្នករៀបចំ') ||
        rowText.includes('សរុប')
      ) {
        continue;
      }

      let rawUsername = String(row[userCol] ?? '').trim();
      let rawName = String(row[nameCol] ?? '').trim();
      let rawPass = String(row[passCol] ?? '').trim();
      let rawRole = String(row[roleCol] ?? '').toLowerCase().trim();
      let rawClass = cleanClassName(row[classCol]);
      let rawStatus = String(row[statusCol] ?? '').toLowerCase().trim();

      // If username is empty, try to derive from name or class
      if (!rawUsername && rawName) {
        rawUsername = rawName.toLowerCase().replace(/[^a-z0-9_]/g, '');
      }
      if (!rawUsername && rawClass) {
        rawUsername = `monitor_${rawClass.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      }

      // If still no username or name, skip empty row
      if (!rawUsername && !rawName) continue;

      // Fill fallback values
      if (!rawName) rawName = rawUsername;
      if (!rawPass) rawPass = '123456';

      const role = (rawRole.includes('admin') || rawRole.includes('គ្រប់គ្រង'))
        ? 'admin'
        : (rawRole.includes('teacher') || rawRole.includes('គ្រូ'))
          ? 'teacher'
          : 'monitor';
      const status = (rawRole.includes('inactive') || rawRole.includes('ផ្អាក') || rawStatus.includes('inactive') || rawStatus.includes('ផ្អាក')) ? 'inactive' : 'active';
      const targetClass = role === 'admin' ? (rawClass || 'ALL') : (rawClass || '10A');

      results.push({
        name: rawName,
        username: rawUsername.replace(/\s+/g, ''),
        password: rawPass,
        role,
        class: targetClass,
        status
      });
    }

    return results;
  };

  // ── Handle File Upload (.xlsx, .xls, .csv) ──
  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsLoadingFile(true);
    setFileName(file.name);

    try {
      const fileNameLower = file.name.toLowerCase();
      let allUsers = [];

      if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
        const XLSX = await loadSheetJS();
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const sheetUsers = parseRowsToUsers(matrix);
          if (sheetUsers.length > 0) {
            allUsers.push(...sheetUsers);
          }
        }
      } else {
        // Plain CSV text parsing
        const text = await file.text();
        const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
        const matrix = lines.map((l) => l.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim()));
        allUsers = parseRowsToUsers(matrix);
      }

      if (allUsers.length === 0) {
        showToast('ឯកសារមិនមានទិន្នន័យត្រឹមត្រូវ ឬខុសទម្រង់! សូមទាញយកឯកសារគំរូ។');
      } else {
        setParsedUsers(allUsers);
        showToast(`បានអានទិន្នន័យដោយជោគជ័យ ចំនួន ${allUsers.length} នាក់`);
      }
    } catch (err) {
      console.error('Import error:', err);
      showToast('មានបញ្ហាក្នុងការអានឯកសារ Excel/CSV!');
    } finally {
      setIsLoadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Load Demo Data for Quick Testing ──
  const handleLoadDemo = () => {
    const demo = [
      { name: 'សុខ ពិសិដ្ឋ (ប្រធានថ្នាក់)', username: 'monitor_10a', password: 'password123', role: 'monitor', class: '10A', status: 'active' },
      { name: 'ចាន់ ធារ៉ា (ប្រធានថ្នាក់)', username: 'monitor_10b', password: 'password123', role: 'monitor', class: '10B', status: 'active' },
      { name: 'កែវ សំណាង (ប្រធានថ្នាក់)', username: 'monitor_11a', password: 'password123', role: 'monitor', class: '11A', status: 'active' },
      { name: 'ម៉េង ស្រីពៅ (ប្រធានថ្នាក់)', username: 'monitor_11b', password: 'password123', role: 'monitor', class: '11B', status: 'active' },
      { name: 'ហុង វីរៈ (ប្រធានថ្នាក់)', username: 'monitor_12a', password: 'password123', role: 'monitor', class: '12A', status: 'active' },
      { name: 'ឡុង ស្រីនី (ប្រធានថ្នាក់)', username: 'monitor_12b', password: 'password123', role: 'monitor', class: '12B', status: 'active' }
    ];
    setFileName('គំរូអ្នកប្រើប្រាស់_សាកល្បង.xlsx');
    setParsedUsers(demo);
    showToast('បានផ្ទុកទិន្នន័យគំរូចំនួន ៦ នាក់សម្រាប់សាកល្បង');
  };

  // ── Delete Row from Preview ──
  const handleDeleteRow = (index) => {
    setParsedUsers((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Confirm Import ──
  const handleConfirmImport = async () => {
    if (!parsedUsers || parsedUsers.length === 0) return;
    setIsSaving(true);

    try {
      const generatedIds = generateBatchUserIds(existingUsers, parsedUsers.length);
      const readyUsers = parsedUsers.map((u, idx) => ({
        id: generatedIds[idx],
        name: u.name,
        username: u.username,
        password: u.password,
        role: u.role || 'monitor',
        class: u.class || '10A',
        status: u.status || 'active',
        lastLogin: 'មិនទាន់ចូលប្រើ'
      }));

      if (onImportSuccess) {
        await onImportSuccess(readyUsers);
      }

      onClose();
    } catch (err) {
      console.error('Confirm import error:', err);
      showToast('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យនាំចូល');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80 shadow-xs">
              <FileSpreadsheet size={24} strokeWidth={2.3} />
            </div>
            <div>
              <h3 className="text-[18px] font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>នាំចូលអ្នកប្រើប្រាស់ពី Excel (Import Users)</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                  .xlsx / .csv
                </span>
              </h3>
              <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                ផ្ទុកឡើងឯកសារ Excel ឬ CSV ដែលមាន Username និង Password សម្រាប់បង្កើតគណនីប្រធានថ្នាក់យ៉ាងឆាប់រហ័ស
              </p>
            </div>
          </div>
          <button
            onClick={() => !isSaving && onClose()}
            disabled={isSaving}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-slate-50/40 flex-1">
          {/* Top Templates Download & Demo Bar */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                <Download size={15} className="text-indigo-600" />
                <span>ទាញយកឯកសារគំរូផ្លូវការ (Excel Template)</span>
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                ទម្រង់រដ្ឋបាលស្អាតដូច Export អាចបំពេញ Username/Password រួចបោះពុម្ពចែកសិស្ស និង Import ចូលប្រព័ន្ធ
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => exportUsersTemplateExcel({ classOptions })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[12px] font-bold transition-all shadow-2xs hover:shadow cursor-pointer"
                title="ទាញយកជា Excel .xlsx មានរចនាបទស្អាត"
              >
                <FileSpreadsheet size={14} />
                <span>ទាញយកគំរូ (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => downloadUsersTemplateCsv(classOptions)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[12px] font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Download size={14} />
                <span>គំរូ (.csv)</span>
              </button>
              <button
                type="button"
                onClick={handleLoadDemo}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[12px] font-bold transition-all shadow-2xs cursor-pointer"
                title="ផ្ទុកទិន្នន័យគំរូចំនួន ៦ នាក់ដើម្បីសាកល្បងភ្លាមៗ"
              >
                <Sparkles size={14} />
                <span>ទិន្នន័យសាកល្បង</span>
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              fileName
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                {isLoadingFile ? (
                  <Loader2 size={24} className="animate-spin text-emerald-600" />
                ) : (
                  <Upload size={24} />
                )}
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-700">
                  {fileName ? (
                    <span className="text-emerald-700 flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={16} /> {fileName}
                    </span>
                  ) : (
                    'ចុចទីនេះ ឬទម្លាក់ឯកសារ Excel (.xlsx, .xls) ឬ .csv'
                  )}
                </p>
                <p className="text-[12px] font-medium text-slate-400 mt-0.5">
                  ប្រព័ន្ធនឹងស្វែងរកជួរឈរ ឈ្មោះពេញ, Username, Password, Role និង Class ដោយស្វ័យប្រវត្តិ
                </p>
              </div>
            </div>
          </div>

          {/* Parsed Data Preview Table */}
          {parsedUsers.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className="text-emerald-600" />
                  <span className="text-[13px] font-bold text-slate-700">
                    ទិន្នន័យដែលបានផ្ទៀងផ្ទាត់រួចរាល់ ({parsedUsers.length} នាក់)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showPasswords ? 'លាក់ Password' : 'បង្ហាញ Password'}</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-72 custom-scrollbar">
                <table className="w-full text-left border-collapse text-[12.5px]">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-2.5 px-3 text-center w-12">ល.រ</th>
                      <th className="py-2.5 px-4">ឈ្មោះពេញ</th>
                      <th className="py-2.5 px-4">Username</th>
                      <th className="py-2.5 px-4">Password</th>
                      <th className="py-2.5 px-3 text-center">តួនាទី</th>
                      <th className="py-2.5 px-3 text-center">ថ្នាក់</th>
                      <th className="py-2.5 px-3 text-center">ស្ថានភាព</th>
                      <th className="py-2.5 px-3 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedUsers.map((u, i) => {
                      const isDup = existingUsernames.has(u.username.toLowerCase());
                      return (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                            {i + 1}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">
                            {u.name}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-medium">
                            <span className="text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md">
                              {u.username}
                            </span>
                            {isDup && (
                              <span
                                className="ml-1.5 inline-flex items-center text-[10px] text-amber-600 font-bold"
                                title="Username នេះមានក្នុងប្រព័ន្ធរួចហើយ នឹងត្រូវធ្វើបច្ចុប្បន្នភាព"
                              >
                                (មានរួច)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">
                            {showPasswords ? (
                              <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                                {u.password}
                              </span>
                            ) : (
                              '••••••••'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                                u.role === 'admin'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : u.role === 'teacher'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {u.role === 'admin' ? 'Admin' : u.role === 'teacher' ? 'Teacher' : 'Monitor'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                              {u.class}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                                u.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {u.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(i)}
                              className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="លុបជួរដេកនេះចេញ"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-[12px] font-medium text-slate-500">
            {parsedUsers.length > 0 ? (
              <span>
                សរុបទិន្នន័យត្រៀមនាំចូល៖{' '}
                <strong className="text-slate-800">{parsedUsers.length}</strong> នាក់
              </span>
            ) : (
              <span>សូមជ្រើសរើសឯកសារ Excel ឬទិន្នន័យគំរូ</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              បោះបង់
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isSaving || parsedUsers.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-[13px] rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>កំពុងនាំចូល...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>បញ្ជាក់ការនាំចូល ({parsedUsers.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

