import { useState, useEffect } from 'react';
import { Edit, X, Save, Loader2, CheckCircle, MessageCircle, BookOpen, Activity, Hash, Globe } from 'lucide-react';
import SearchableDropdown from '../../common/SearchableDropdown';

export default function EditBotModal({ isOpen, onClose, onSave, classOptions, botData, globalTokens = [] }) {
  const statusOptions = [
    { id: 'active', label: 'ដំណើរការ (Active)' },
    { id: 'inactive', label: 'ផ្អាក (Inactive)' }
  ];
  
  const globalTokenOptions = globalTokens && globalTokens.length > 0
    ? globalTokens.map(t => ({ id: t.id, label: `${t.name}${t.isActive ? ' (Active)' : ''}`, isActive: t.isActive }))
    : [
        { id: 'gt_1', label: 'Bot សាលាកណ្តាល (Active)', isActive: true },
        { id: 'gt_2', label: 'Bot បណ្ណាល័យ', isActive: false }
      ];
  
  const filteredClassOptions = classOptions ? classOptions.filter(c => c.id !== 'ALL') : [];
  
  const [bot, setBot] = useState(botData || {
    class: filteredClassOptions[0]?.id || '',
    name: '',
    token: '',
    chatId: '',
    status: 'active'
  });
  
  const [tokenType, setTokenType] = useState(botData && botData.token === 'GLOBAL_TOKEN' ? 'global' : 'custom');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    if (botData) {
      setBot(botData);
      setTokenType(botData.token === 'GLOBAL_TOKEN' ? 'global' : 'custom');
    }
  }, [botData]);

  // Auto-select the active global token when switching to global token if none is selected
  useEffect(() => {
    if (tokenType === 'global' && !bot.globalTokenId) {
      const activeGlobal = globalTokenOptions.find(t => t.isActive) || globalTokenOptions[0];
      if (activeGlobal) {
        setBot(prev => ({ ...prev, globalTokenId: activeGlobal.id }));
      }
    }
  }, [tokenType, bot.globalTokenId, globalTokens]);

  if (!isOpen && !showSuccessAlert) return null;

  const handleSave = () => {
    if (!bot.chatId.trim()) return;
    if (tokenType === 'custom' && !bot.token.trim()) return;

    const botToSave = {
      ...bot,
      name: (bot.name || '').trim() || `Bot ថ្នាក់ ${bot.class}`,
      token: tokenType === 'global' ? 'GLOBAL_TOKEN' : bot.token.trim(),
      chatId: bot.chatId.trim()
    };
    
    if (onSave) onSave(botToSave);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-6 border-b border-slate-100 flex items-start justify-between bg-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="flex items-start gap-3 relative z-10 group cursor-default">
                <div className="flex items-center justify-center text-amber-500 mt-1 group-hover:animate-bounce transition-all">
                  <Edit size={28} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col pt-0.5">
                  <h3 className="text-[18px] font-black text-slate-800 tracking-tight">កែប្រែព័ត៌មាន Telegram Bot</h3>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">ផ្លាស់ប្តូរព័ត៌មាន Bot ខាងក្រោម</p>
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
                {/* Class */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-500 flex items-center gap-1.5">
                    ថ្នាក់បន្ទុក <span className="text-rose-500">*</span>
                  </label>
                  <SearchableDropdown
                    value={bot.class}
                    onChange={(val) => setBot({...bot, class: val})}
                    options={filteredClassOptions}
                    placeholder="ជ្រើសរើសថ្នាក់"
                    icon={BookOpen}
                  />
                </div>

                {/* Status */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-500 flex items-center gap-1.5">
                    ស្ថានភាព <span className="text-rose-500">*</span>
                  </label>
                  <SearchableDropdown
                    value={bot.status}
                    onChange={(val) => setBot({...bot, status: val})}
                    options={statusOptions}
                    placeholder="ជ្រើសរើសស្ថានភាព"
                    icon={Activity}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {/* Bot Token */}
                <div className="flex flex-col gap-3">
                  <label className="text-[13px] font-bold text-slate-500 flex items-center gap-1.5">
                    Telegram Bot Token <span className="text-rose-500">*</span>
                  </label>
                  
                  {/* Segmented Control for Token Type */}
                  <div className="flex bg-slate-100/80 p-1 rounded-xl w-full sm:w-fit">
                    <button 
                      type="button"
                      onClick={() => setTokenType('global')}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${tokenType === 'global' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                      ប្រើ Global Token
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTokenType('custom')}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${tokenType === 'custom' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                      បញ្ចូល Token ថ្មី
                    </button>
                  </div>

                  {tokenType === 'custom' ? (
                    <div className="relative group animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <MessageCircle size={16} className="text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                      </div>
                      <input 
                        type="text"
                        value={bot.token}
                        onChange={(e) => setBot({...bot, token: e.target.value})}
                        placeholder="ឧ. 123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                        className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-10 pr-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300 font-mono"
                      />
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <SearchableDropdown 
                        options={globalTokenOptions}
                        value={bot.globalTokenId || ''}
                        onChange={(val) => setBot({...bot, globalTokenId: val})}
                        placeholder="ជ្រើសរើស Global Token ដែលចង់ប្រើ"
                        icon={Globe}
                      />
                    </div>
                  )}
                </div>

                {/* Chat ID */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-500 flex items-center gap-1.5">
                    Chat ID / Group ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Hash size={16} className="text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input 
                      type="text"
                      value={bot.chatId}
                      onChange={(e) => setBot({...bot, chatId: e.target.value})}
                      placeholder="ឧ. -100123456789"
                      className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-10 pr-3.5 rounded-xl font-medium text-[13px] focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all placeholder:text-slate-400 shadow-sm hover:border-slate-300 font-mono"
                    />
                  </div>
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
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold text-[13px] text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-[0_4px_12px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_16px_rgba(245,158,11,0.35)] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} strokeWidth={3} className="animate-spin" />
                    <span>កំពុងកែប្រែ...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} strokeWidth={2.5} />
                    <span>បញ្ជាក់ការកែប្រែ</span>
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
              <p className="text-[14px] font-bold text-slate-800">កែប្រែបានជោគជ័យ!</p>
              <p className="text-[12px] font-medium text-slate-500">ព័ត៌មាន Bot ត្រូវបានកែប្រែរួចរាល់។</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
