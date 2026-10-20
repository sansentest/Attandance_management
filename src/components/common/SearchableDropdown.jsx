import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function SearchableDropdown({ value, onChange, options, placeholder, icon: Icon, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className={`relative group w-full ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between ${disabled ? 'bg-slate-50 border-slate-200' : 'bg-white hover:border-slate-300'} border ${isOpen ? 'border-indigo-400 ring-4 ring-indigo-100' : 'border-slate-200'} text-slate-700 py-2.5 px-3.5 rounded-xl font-medium text-[13px] focus:outline-none transition-all shadow-sm`}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon size={16} className={`flex-shrink-0 ${disabled ? 'text-slate-300' : 'text-slate-400'}`} />}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-[70] top-full left-0 mt-1.5 w-full min-w-[200px] bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-between ${value === opt.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {opt.label}
                  {value === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                </button>
              ))
            ) : (
              <div className="py-4 text-center text-slate-400 text-[12px] font-medium flex flex-col items-center gap-1">
                <Search size={16} className="opacity-30" />
                គ្មានលទ្ធផល
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
