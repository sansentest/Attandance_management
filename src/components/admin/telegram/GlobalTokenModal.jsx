import { useState } from 'react';
import { Globe, X, Save, Loader2, MessageCircle, Edit, Trash2, CheckCircle, Tag } from 'lucide-react';

export default function GlobalTokenModal({ isOpen, onClose }) {
  // Mock data for Global Tokens list
  const [tokens, setTokens] = useState([
    { id: 1, token: '123456789:ABC-DEF1234ghIkl-zyx...', name: 'Bot សាលាកណ្តាល', isActive: true },
    { id: 2, token: '987654321:XYZ-UVW9876abCde-rqp...', name: 'Bot បណ្ណាល័យ', isActive: false }
  ]);
  
  const [newToken, setNewToken] = useState('');
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!newToken.trim()) return;
    setIsSaving(true);
    setTimeout(() => {
      if (editingId) {
        setTokens(tokens.map(t => t.id === editingId ? { ...t, token: newToken, name: newName || 'Bot ថ្មី' } : t));
        setEditingId(null);
      } else {
        setTokens([{ id: Date.now(), token: newToken, name: newName || 'Bot ថ្មី', isActive: tokens.length === 0 }, ...tokens]);
      }
      setNewToken('');
      setNewName('');
      setIsSaving(false);
    }, 500);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewToken('');
    setNewName('');
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setNewToken(t.token);
    setNewName(t.name || '');
  };

  const handleDelete = (id) => {
    if (window.confirm("តើអ្នកពិតជាចង់លុប Token នេះមែនទេ?")) {
      setTokens(tokens.filter(t => t.id !== id));
      if (editingId === id) handleCancelEdit();
    }
  };

  const handleSetActive = (id) => {
    setTokens(tokens.map(t => ({ ...t, isActive: t.id === id })));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="flex items-start gap-3 relative z-10 group cursor-default">
            <div className="flex items-center justify-center text-rose-500 mt-1 transition-all">
              <Globe size={24} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col pt-0.5">
              <h3 className="text-[16px] font-black text-slate-800 tracking-tight">គ្រប់គ្រង Global Token</h3>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">បន្ថែម ឬជ្រើសរើស Token កណ្តាលសម្រាប់ប្រើប្រាស់រួម។</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10 mt-0.5"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 p-6 flex flex-col gap-8">
          
          {/* Add/Edit Form */}
          <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
            <h4 className="text-[14px] font-bold text-slate-700 flex items-center gap-2">
              {editingId ? <Edit size={16} className="text-rose-500"/> : <Globe size={16} className="text-rose-500"/>}
              {editingId ? 'កែប្រែ Token' : 'បន្ថែម Token ថ្មី'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Token Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5">
                  ឈ្មោះសម្គាល់ <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Tag size={16} className="text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                  </div>
                  <input 
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="ឧ. Bot សាលាកណ្តាល"
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-10 pr-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300"
                  />
                </div>
              </div>
              
              {/* Token Value */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5">
                  Telegram Bot Token <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MessageCircle size={16} className="text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                  </div>
                  <input 
                    type="text"
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    placeholder="ឧ. 123456789:ABC-DEF1234..."
                    className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-10 pr-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              {editingId && (
                <button 
                  onClick={handleCancelEdit}
                  className="px-5 py-2 rounded-xl font-bold text-[12px] text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  បោះបង់
                </button>
              )}
              <button 
                onClick={handleSave}
                disabled={isSaving || !newToken.trim() || !newName.trim()}
                className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-bold text-[12px] text-white bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{editingId ? 'រក្សាទុកការកែប្រែ' : 'បន្ថែម'}</span>
              </button>
            </div>
          </div>

          {/* Token List */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[14px] font-bold text-slate-700">បញ្ជី Global Token ដែលមាន</h4>
            {tokens.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-[13px]">
                មិនទាន់មាន Global Token នៅឡើយទេ។
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tokens.map((t) => (
                  <div key={t.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border ${t.isActive ? 'border-emerald-200 bg-emerald-50/30 shadow-sm' : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'} transition-all`}>
                    <div className="flex items-start sm:items-center gap-3">
                      <button 
                        onClick={() => handleSetActive(t.id)}
                        className={`w-5 h-5 mt-2.5 sm:mt-0 rounded-full border-2 flex items-center justify-center shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 ${
                          t.isActive ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-emerald-400 bg-white'
                        }`}
                        title={t.isActive ? "កំពុងប្រើ" : "ជ្រើសរើស"}
                      >
                        {t.isActive && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </button>
                      
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {t.isActive ? <CheckCircle size={20} /> : <Globe size={20} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                          {t.name}
                          {t.isActive && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">កំពុងប្រើ</span>}
                        </span>
                        <span className="text-[12px] font-mono text-slate-500 mt-0.5 break-all max-w-[280px] sm:max-w-[320px] line-clamp-1" title={t.token}>{t.token}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button 
                        onClick={() => handleEdit(t)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                        title="កែប្រែ"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                        title="លុប"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
