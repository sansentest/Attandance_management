import { useState } from 'react';
import { UserPlus, X, Save, Loader2, ChevronDown, CheckCircle, User, AtSign, Lock, Shield, BookOpen, Activity } from 'lucide-react';
import SearchableDropdown from '../../common/SearchableDropdown';

export default function AddUserModal({ isOpen, onClose, onSave, classOptions }) {
  const roleOptions = [
    { id: 'monitor', label: 'អ្នកត្រួតពិនិត្យ (Monitor)' },
    { id: 'admin', label: 'អ្នកគ្រប់គ្រង (Admin)' }
  ];
  
  const statusOptions = [
    { id: 'active', label: 'ដំណើរការ (Active)' },
    { id: 'inactive', label: 'ផ្អាក (Inactive)' }
  ];
  
  const filteredClassOptions = classOptions ? classOptions.filter(c => c.id !== 'ALL') : [];
  const initialUserState = {
    name: '',
    username: '',
    password: '',
    role: 'monitor',
    class: filteredClassOptions[0]?.id || '',
    status: 'active'
  };
  const [newUser, setNewUser] = useState(initialUserState);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  if (!isOpen && !showSuccessAlert) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) await onSave(newUser);
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
        onClose();
        setNewUser(initialUserState);
      }, 700);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-6 border-b border-slate-100 flex items-start justify-between bg-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="flex items-start gap-3 relative z-10 group cursor-default">
                <div className="flex items-center justify-center text-indigo-600 mt-1 group-hover:animate-bounce transition-all">
                  <UserPlus size={28} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col pt-0.5">
                  <h3 className="text-[18px] font-black text-slate-800 tracking-tight">បន្ថែមអ្នកប្រើប្រាស់ថ្មី</h3>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">បំពេញព័ត៌មានខាងក្រោមដើម្បីបង្កើតគណនី</p>
                </div>
              </div>
              <button 
                onClick={() => !isSaving && onClose()}
                disabled={isSaving}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10 mt-1"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-slate-50/30">


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-500 flex items-center gap-1.5">
                    ឈ្មោះអ្នកប្រើប្រាស់ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="ឧ. San Vandy"
                      className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-10 pr-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-500 flex items-center gap-1.5">
                    ឈ្មោះគណនី (Username) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <AtSign size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      placeholder="ឧ. vandy12A"
                      className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-10 pr-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Password */}
              <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-500 flex items-center gap-1.5">
                    ថ្នាក់បន្ទុក 
                    {newUser.role === 'admin' 
                      ? <span className="text-[11px] font-medium text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded-md">មិនតម្រូវ</span> 
                      : <span className="text-rose-500">*</span>}
                  </label>
                  <SearchableDropdown
                    value={newUser.class}
                    onChange={(val) => setNewUser({...newUser, class: val})}
                    options={filteredClassOptions}
                    placeholder="ជ្រើសរើសថ្នាក់"
                    icon={BookOpen}
                    disabled={newUser.role === 'admin'}
                  />
                </div>

                {/* Role */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-500 flex items-center gap-1.5">
                    តួនាទី <span className="text-rose-500">*</span>
                  </label>
                  <SearchableDropdown
                    value={newUser.role}
                    onChange={(val) => setNewUser({...newUser, role: val})}
                    options={roleOptions}
                    placeholder="ជ្រើសរើសតួនាទី"
                    icon={Shield}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Class */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-500 flex items-center gap-1.5">
                    ពាក្យសម្ងាត់ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="បញ្ចូលពាក្យសម្ងាត់"
                      className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-10 pr-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300"
                    />
                  </div>
                </div>
                

                {/* Status */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-500 flex items-center gap-1.5">
                    ស្ថានភាព <span className="text-rose-500">*</span>
                  </label>
                  <SearchableDropdown
                    value={newUser.status}
                    onChange={(val) => setNewUser({...newUser, status: val})}
                    options={statusOptions}
                    placeholder="ជ្រើសរើសស្ថានភាព"
                    icon={Activity}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
              <button 
                onClick={() => onClose()}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-[13px] text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                បោះបង់
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold text-[13px] text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-[0_4px_12px_rgba(79,70,229,0.25)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} strokeWidth={3} className="animate-spin" />
                    <span>កំពុងរក្សាទុក...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} strokeWidth={2.5} />
                    <span>រក្សាទុកគណនី</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert Notification */}
      {showSuccessAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 fade-in duration-300 zoom-in-95">
          <div className="bg-white px-6 py-3.5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-emerald-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-800">រក្សាទុកបានជោគជ័យ!</p>
              <p className="text-[12px] font-medium text-slate-500">គណនីថ្មីត្រូវបានបង្កើតរួចរាល់។</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
