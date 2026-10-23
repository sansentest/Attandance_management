import React, { useState, useRef, useEffect } from 'react';
import { Mail, Printer, CheckCircle2, Search, Filter, Calendar, Users, FileText, RefreshCw } from 'lucide-react';
import InvitationLetterPrint from './InvitationLetterPrint';
import { api } from '../../../utils/api';

export default function AdminInvitationLetters() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showError, setShowError] = useState(false);
  const [printSettingsOpen, setPrintSettingsOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    reference: '',
    meetingDate: '',
    meetingTime: '08:00',
    location: 'វិទ្យាល័យអង្គរកា'
  });
  const printRef = useRef(null);

  // Data for students who have reached CRITICAL threshold
  const [pendingStudents, setPendingStudents] = useState([]);
  const [printedHistory, setPrintedHistory] = useState([]);

  React.useEffect(() => {
    const printStudentStr = localStorage.getItem('printStudent');
    if (printStudentStr) {
      try {
        const student = JSON.parse(printStudentStr);
        setPendingStudents(prev => {
          const exists = prev.find(s => s.id === student.id);
          if (!exists) {
            const newStudent = {
              id: student.id,
              name: student.name,
              gender: student.gender || 'ប្រុស',
              class: student.class,
              absences: student.absent,
              dateReached: new Date().toISOString().split('T')[0]
            };
            setSelectedIds(prevIds => [...new Set([...prevIds, student.id])]);
            return [newStudent, ...prev];
          } else {
            setSelectedIds(prevIds => [...new Set([...prevIds, student.id])]);
            return prev;
          }
        });
      } catch (e) {
        console.error('Failed to parse print student', e);
      }
      localStorage.removeItem('printStudent');
    }
  }, []);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInvitationData = async () => {
    setIsRefreshing(true);
    try {
      const [invRes, discRes] = await Promise.all([
        api('invitation.getAll'),
        api('discipline.getTracking')
      ]);

      if (invRes && invRes.success && Array.isArray(invRes.data)) {
        setPrintedHistory(invRes.data);
      }

      if (discRes && discRes.success && Array.isArray(discRes.data)) {
        const criticalStudents = discRes.data
          .filter(s => (s.absent || 0) >= 20)
          .map(s => ({
            id: s.id || s.studentId,
            name: s.name,
            gender: s.gender === 'F' ? 'ស្រី' : 'ប្រុស',
            class: s.class || s.className,
            absences: s.absent || 0,
            dateReached: s.records?.[0]?.date || new Date().toISOString().split('T')[0]
          }));
        setPendingStudents(criticalStudents);
      }
    } catch (e) {
      console.error('Failed to load invitation history', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchInvitationData();
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(pendingStudents.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePrintClick = () => {
    if (selectedIds.length === 0) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    setPrintSettingsOpen(true);
  };

  const executePrint = () => {
    setPrintSettingsOpen(false);
    
    // Give react time to render the print config into the hidden div, then print
    setTimeout(() => {
      window.print();

      // In a real app, after printing, we move them to history
      setTimeout(() => {
        if (confirm('តើការបោះពុម្ពបានជោគជ័យដែរឬទេ? (វានឹងផ្លាស់ទីសិស្សទាំងនេះទៅក្នុងប្រវត្តិបោះពុម្ព)')) {
          const printed = pendingStudents.filter(s => selectedIds.includes(s.id));
          const remaining = pendingStudents.filter(s => !selectedIds.includes(s.id));
          
          const newHistory = printed.map(s => ({
            ...s,
            id: s.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            datePrinted: new Date().toISOString().split('T')[0],
            printedBy: 'អ្នកគ្រប់គ្រង'
          }));

          setPrintedHistory(prev => [...newHistory, ...prev]);
          setPendingStudents(remaining);
          setSelectedIds([]);

          // Save to Firestore
          newHistory.forEach(item => {
            api('invitation.savePrinted', { letter: item }).catch(err => console.error(err));
          });
        }
      }, 1000); // Wait a bit after print dialog closes
    }, 100);
  };

  const studentsToPrint = pendingStudents.filter(s => selectedIds.includes(s.id));

  const totalStudents = pendingStudents.length + printedHistory.length;
  const totalPending = pendingStudents.length;
  const totalPrinted = printedHistory.length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">


      {/* Custom Alert Toast */}
      {showError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-lg shadow-red-500/30 flex items-center gap-3 font-bold text-[14px]">
            <CheckCircle2 size={18} className="text-white" />
            សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ម្នាក់!
          </div>
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 w-full">
        {/* Total Data Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">សិស្សត្រូវកោះហៅសរុប</div>
          </div>
          <div className="text-3xl font-black text-slate-800 relative z-10">{totalStudents}</div>
        </div>
        
        {/* Pending Print Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <Printer size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">ត្រូវបោះពុម្ពបន្ត</div>
          </div>
          <div className="text-3xl font-black text-rose-500 relative z-10">{totalPending}</div>
        </div>

        {/* Printed Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">បានបោះពុម្ពរួច</div>
          </div>
          <div className="text-3xl font-black text-emerald-500 relative z-10">{totalPrinted}</div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/60 flex flex-col relative shadow-sm overflow-hidden min-h-[500px]">
        
        {/* Tabs inside the table container like filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col xl:flex-row gap-4 justify-between items-center">
          
          <div className="flex flex-wrap bg-slate-200/50 p-1 rounded-xl w-full xl:w-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'pending' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Printer size={16} /> ត្រូវបោះពុម្ព
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${activeTab === 'pending' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'}`}>
                {pendingStudents.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'history' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <FileText size={16} /> ប្រវត្តិបោះពុម្ព
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${activeTab === 'history' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                {printedHistory.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto justify-end">

            {/* Live Sync / Refresh from Firebase */}
            <button
              type="button"
              onClick={fetchInvitationData}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-3.5 rounded-xl font-bold text-[13px] transition-all shadow-xs hover:shadow hover:-translate-y-0.5 disabled:opacity-60"
              title="ទាញយកទិន្នន័យផ្ទាល់ពី Cloud Firebase"
            >
              <RefreshCw size={15} strokeWidth={2.2} className={`text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'កំពុងទាញ...' : 'ទាញទិន្នន័យថ្មី'}</span>
            </button>

            <div className="relative w-full sm:w-[280px] group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="ស្វែងរកឈ្មោះសិស្ស ឬអត្តលេខ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
            
            {activeTab === 'pending' && (
              <button 
                onClick={handlePrintClick}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] shadow-sm transition-all w-full sm:w-auto ${
                  selectedIds.length > 0 
                    ? 'bg-red-600 hover:bg-red-700 text-white hover:shadow-md hover:-translate-y-0.5' 
                    : 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 hover:text-red-600'
                }`}
              >
                <Printer size={16} strokeWidth={2.5} />
                បោះពុម្ព {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
              </button>
            )}
          </div>
        </div>

          {/* Table Area */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
                <tr className="text-[13px] font-bold text-slate-500">
                  {activeTab === 'pending' && (
                    <th className="py-4 px-6 w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={pendingStudents.length > 0 && selectedIds.length === pendingStudents.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className={`py-4 px-6 ${activeTab === 'history' ? 'pl-8' : ''}`}>ព័ត៌មានសិស្ស</th>
                  <th className="py-4 px-6 text-center">អវត្តមាន</th>
                  <th className="py-4 px-6">
                    {activeTab === 'pending' ? 'ថ្ងៃឈានដល់កម្រិត' : 'ប្រវត្តិបោះពុម្ព'}
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                
                {/* PENDING TAB */}
                {activeTab === 'pending' && pendingStudents.map(student => (
                  <tr key={student.id} className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors ${selectedIds.includes(student.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => handleSelectOne(student.id)}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{student.name}</div>
                          <div className="text-[12px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>ID: {student.id}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>ថ្នាក់ {student.class}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg font-bold text-xs">
                        {student.absences} ដង
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {student.dateReached}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* HISTORY TAB */}
                {activeTab === 'history' && printedHistory.map(student => (
                  <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{student.name}</div>
                          <div className="text-[12px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>ID: {student.id}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>ថ្នាក់ {student.class}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-bold text-xs">
                        {student.absences} ដង
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="text-slate-700 font-bold text-sm flex items-center gap-2">
                          <Calendar size={14} className="text-blue-500" />
                          {student.datePrinted}
                        </div>
                        <div className="text-[12px] text-slate-500 flex items-center gap-1.5">
                          <Users size={12} /> បោះពុម្ពដោយ: {student.printedBy}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty States */}
            {activeTab === 'pending' && pendingStudents.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center h-64">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">អស្ចារ្យណាស់!</h3>
                <p className="text-slate-500 mt-2 max-w-sm">មិនមានសិស្សណាម្នាក់ដល់កម្រិតត្រូវកោះហៅអាណាព្យាបាលនោះទេ។</p>
              </div>
            )}
            
            {activeTab === 'history' && printedHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center h-64">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                  <FileText size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">មិនទាន់មានប្រវត្តិបោះពុម្ពទេ</h3>
                <p className="text-slate-500 mt-2 max-w-sm">ឯកសារដែលបានបោះពុម្ពរួច នឹងបង្ហាញនៅទីនេះ។</p>
              </div>
            )}
          </div>
        </div>

      {/* Print Settings Modal */}
      {printSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Printer size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">រៀបចំមុនបោះពុម្ព</h3>
                  <p className="text-[12px] font-bold text-slate-500">កំណត់កាលបរិច្ឆេទសម្រាប់លិខិត</p>
                </div>
              </div>
              <button onClick={() => setPrintSettingsOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors bg-white hover:bg-rose-50 p-2 rounded-full border border-slate-100">
                <span className="sr-only">Close</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-700">លេខយោងលិខិត (ជាជម្រើស)</label>
                <input 
                  type="text" 
                  placeholder="ឧ. ៣១/២៥" 
                  value={printConfig.reference}
                  onChange={e => setPrintConfig({...printConfig, reference: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-4 rounded-xl font-medium text-[14px] focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
                <p className="text-[11px] text-slate-500 font-medium">ប្រសិនបើមិនបំពេញ ប្រព័ន្ធនឹងទុកចន្លោះទទេសម្រាប់សរសេរដៃ។</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-700">កាលបរិច្ឆេទជួប <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    value={printConfig.meetingDate}
                    onChange={e => setPrintConfig({...printConfig, meetingDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-4 rounded-xl font-medium text-[14px] focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-700">ម៉ោងជួប <span className="text-red-500">*</span></label>
                  <input 
                    type="time" 
                    value={printConfig.meetingTime}
                    onChange={e => setPrintConfig({...printConfig, meetingTime: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-4 rounded-xl font-medium text-[14px] focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-700">ទីកន្លែងជួប <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={printConfig.location}
                  onChange={e => setPrintConfig({...printConfig, location: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-4 rounded-xl font-medium text-[14px] focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button onClick={() => setPrintSettingsOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-bold text-[14px] transition-all">
                បោះបង់
              </button>
              <button 
                onClick={executePrint}
                disabled={!printConfig.meetingDate || !printConfig.meetingTime || !printConfig.location}
                className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-[14px] transition-all shadow-sm"
              >
                <Printer size={18} strokeWidth={2.5} />
                បញ្ជាក់ និងបោះពុម្ព
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Component */}
      <InvitationLetterPrint ref={printRef} selectedStudents={studentsToPrint} config={printConfig} />
      
    </div>
  );
}
