import { useState } from 'react';
import { BookOpen, Users, Plus, Edit, Trash2, Search, Book, GraduationCap, X, Save, Loader2 } from 'lucide-react';

export default function AdminAcademic() {
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'subjects'
  
  // Mock Data
  const [classes, setClasses] = useState([
    { id: 'c1', name: 'ថ្នាក់ 12A', students: 35, shift: 'ព្រឹក' },
    { id: 'c2', name: 'ថ្នាក់ 12B', students: 32, shift: 'ព្រឹក' },
    { id: 'c3', name: 'ថ្នាក់ 11A', students: 40, shift: 'រសៀល' },
  ]);

  const [subjects, setSubjects] = useState([
    { id: 's1', name: 'គណិតវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
    { id: 's2', name: 'រូបវិទ្យា', type: 'វិទ្យាសាស្ត្រ' },
    { id: 's3', name: 'អក្សរសាស្ត្រខ្មែរ', type: 'សង្គម' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form States
  const [className, setClassName] = useState('');
  const [classShift, setClassShift] = useState('ព្រឹក');
  const [subjectName, setSubjectName] = useState('');
  const [subjectType, setSubjectType] = useState('វិទ្យាសាស្ត្រ');
  
  const [isSaving, setIsSaving] = useState(false);

  // Filtered Data
  const filteredClasses = classes.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Handlers
  const openClassModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setClassName(item.name);
      setClassShift(item.shift);
    } else {
      setClassName('');
      setClassShift('ព្រឹក');
    }
    setIsClassModalOpen(true);
  };

  const openSubjectModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setSubjectName(item.name);
      setSubjectType(item.type);
    } else {
      setSubjectName('');
      setSubjectType('វិទ្យាសាស្ត្រ');
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveClass = () => {
    if (!className.trim()) return;
    setIsSaving(true);
    setTimeout(() => {
      if (editingItem) {
        setClasses(classes.map(c => c.id === editingItem.id ? { ...c, name: className, shift: classShift } : c));
      } else {
        setClasses([{ id: Date.now().toString(), name: className, students: 0, shift: classShift }, ...classes]);
      }
      setIsSaving(false);
      setIsClassModalOpen(false);
    }, 500);
  };

  const handleSaveSubject = () => {
    if (!subjectName.trim()) return;
    setIsSaving(true);
    setTimeout(() => {
      if (editingItem) {
        setSubjects(subjects.map(s => s.id === editingItem.id ? { ...s, name: subjectName, type: subjectType } : s));
      } else {
        setSubjects([{ id: Date.now().toString(), name: subjectName, type: subjectType }, ...subjects]);
      }
      setIsSaving(false);
      setIsSubjectModalOpen(false);
    }, 500);
  };

  const handleDeleteClass = (id) => {
    if (window.confirm("តើអ្នកពិតជាចង់លុបថ្នាក់នេះមែនទេ?")) {
      setClasses(classes.filter(c => c.id !== id));
    }
  };

  const handleDeleteSubject = (id) => {
    if (window.confirm("តើអ្នកពិតជាចង់លុបមុខវិជ្ជានេះមែនទេ?")) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const totalClasses = classes.length;
  const totalSubjects = subjects.length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.students || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        {/* Total Classes Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">ថ្នាក់សរុប</div>
          </div>
          <div className="text-3xl font-black text-indigo-600 relative z-10">{totalClasses}</div>
        </div>
        
        {/* Total Subjects Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <Book size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">មុខវិជ្ជាសរុប</div>
          </div>
          <div className="text-3xl font-black text-emerald-500 relative z-10">{totalSubjects}</div>
        </div>

        {/* Total Students Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <GraduationCap size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">សិស្សសរុប</div>
          </div>
          <div className="text-3xl font-black text-blue-500 relative z-10">{totalStudents}</div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative">
        
        {/* Toolbar & Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          
          {/* Tabs */}
          <div className="flex bg-slate-200/50 p-1 rounded-xl w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('classes')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'classes' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Users size={16} /> ថ្នាក់រៀន
            </button>
            <button 
              onClick={() => setActiveTab('subjects')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'subjects' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen size={16} /> មុខវិជ្ជា
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64 group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={14} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder={`ស្វែងរក${activeTab === 'classes' ? 'ថ្នាក់' : 'មុខវិជ្ជា'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 pl-9 pr-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
            
            {/* Add Button */}
            <button 
              onClick={() => activeTab === 'classes' ? openClassModal() : openSubjectModal()}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-4 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">{activeTab === 'classes' ? 'បន្ថែមថ្នាក់ថ្មី' : 'បន្ថែមមុខវិជ្ជាថ្មី'}</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-0 overflow-x-auto custom-scrollbar min-h-[400px]">
          {activeTab === 'classes' ? (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">ឈ្មោះថ្នាក់</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">វេនសិក្សា</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider text-center">ចំនួនសិស្សសរុប</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredClasses.length > 0 ? filteredClasses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                          <Users size={16} />
                        </div>
                        <span className="text-[14px] font-bold text-slate-800">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-slate-100 text-slate-600 font-bold text-[12px]">
                        {c.shift}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-[13px] font-bold text-slate-600">{c.students} នាក់</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openClassModal(c)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                          title="កែប្រែ"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClass(c.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="លុប"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400 font-medium text-[13px]">មិនមានទិន្នន័យថ្នាក់រៀនទេ</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">ឈ្មោះមុខវិជ្ជា</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">ប្រភេទមុខវិជ្ជា</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSubjects.length > 0 ? filteredSubjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
                          <Book size={16} />
                        </div>
                        <span className="text-[14px] font-bold text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-slate-100 text-slate-600 font-bold text-[12px]">
                        {s.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openSubjectModal(s)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                          title="កែប្រែ"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSubject(s.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="លុប"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="py-12 text-center text-slate-400 font-medium text-[13px]">មិនមានទិន្នន័យមុខវិជ្ជាទេ</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{editingItem ? 'កែប្រែថ្នាក់' : 'បន្ថែមថ្នាក់ថ្មី'}</h3>
              </div>
              <button onClick={() => setIsClassModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-500">ឈ្មោះថ្នាក់ <span className="text-rose-500">*</span></label>
                <input 
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="ឧ. 12A"
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 px-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-500">វេនសិក្សា <span className="text-rose-500">*</span></label>
                <select 
                  value={classShift}
                  onChange={(e) => setClassShift(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 px-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all"
                >
                  <option value="ព្រឹក">ព្រឹក</option>
                  <option value="រសៀល">រសៀល</option>
                  <option value="ពេញមួយថ្ងៃ">ពេញមួយថ្ងៃ</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsClassModalOpen(false)} className="px-5 py-2 rounded-xl font-bold text-[12px] text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">បោះបង់</button>
              <button onClick={handleSaveClass} disabled={isSaving || !className.trim()} className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-bold text-[12px] text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} <span>រក្សាទុក</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Book size={16} />
                </div>
                <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{editingItem ? 'កែប្រែមុខវិជ្ជា' : 'បន្ថែមមុខវិជ្ជាថ្មី'}</h3>
              </div>
              <button onClick={() => setIsSubjectModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-500">ឈ្មោះមុខវិជ្ជា <span className="text-rose-500">*</span></label>
                <input 
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="ឧ. គណិតវិទ្យា"
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 px-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-500">ប្រភេទមុខវិជ្ជា <span className="text-rose-500">*</span></label>
                <select 
                  value={subjectType}
                  onChange={(e) => setSubjectType(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 px-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all"
                >
                  <option value="វិទ្យាសាស្ត្រ">វិទ្យាសាស្ត្រ</option>
                  <option value="សង្គម">សង្គម</option>
                  <option value="ទូទៅ">ទូទៅ</option>
                  <option value="ភាសាបរទេស">ភាសាបរទេស</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsSubjectModalOpen(false)} className="px-5 py-2 rounded-xl font-bold text-[12px] text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">បោះបង់</button>
              <button onClick={handleSaveSubject} disabled={isSaving || !subjectName.trim()} className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-bold text-[12px] text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} <span>រក្សាទុក</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
