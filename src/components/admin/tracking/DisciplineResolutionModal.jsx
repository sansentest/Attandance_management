import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, Calendar, User, FileText, AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react';
import { api } from '../../../utils/api';

const QUICK_NOTES = [
  'អាណាព្យាបាលបានមកសាលា និងធ្វើកិច្ចសន្យាកែលម្អ',
  'អាណាព្យាបាលសន្យាតាមដានការសិក្សា និងវត្តមានកូនឱ្យបានដិតដល់',
  'បានដោះស្រាយ និងអនុញ្ញាតឱ្យសិស្សចូលរៀនជាធម្មតាវិញ'
];

export default function DisciplineResolutionModal({ isOpen, onClose, student, onResolved }) {
  const [resolvedDate, setResolvedDate] = useState('');
  const [parentName, setParentName] = useState('');
  const [handledBy, setHandledBy] = useState('គណៈកម្មការវិន័យ');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && student) {
      setResolvedDate(new Date().toISOString().split('T')[0]);
      setParentName(student.parentName || '');
      setHandledBy('គណៈកម្មការវិន័យ');
      setNote('អាណាព្យាបាលបានមកជួបគណៈកម្មការវិន័យសាលា និងបានធ្វើកិច្ចសន្យាធានាថានឹងតាមដានការសិក្សាកូនឱ្យបានដិតដល់។');
      setError('');
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const currentCycle = student.cycle || 1;
  const nextCycle = currentCycle + 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resolvedDate) {
      setError('សូមជ្រើសរើសកាលបរិច្ឆេទដោះស្រាយ');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const resolutionPayload = {
        studentId: student.id || student.studentId,
        studentName: student.name,
        class: student.class,
        cycle: currentCycle,
        resolvedDate,
        parentName: parentName.trim(),
        handledBy: handledBy.trim(),
        note: note.trim(),
        absentAtResolution: student.absent || 0,
        totalAbsentAtResolution: student.totalAbsent || student.absent || 0,
        createdAt: new Date().toISOString()
      };

      const res = await api('discipline.saveResolution', { resolution: resolutionPayload });
      if (res && res.success) {
        if (onResolved) onResolved(resolutionPayload);
        onClose();
      } else {
        setError(res?.message || 'មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ');
      }
    } catch (err) {
      console.error('Failed to save resolution', err);
      setError('មានបញ្ហាក្នុងការតភ្ជាប់ សូមព្យាយាមម្តងទៀត');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300 border border-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 to-teal-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-slate-800">កត់ត្រាការដោះស្រាយវិន័យ</h3>
              <p className="text-[12px] font-bold text-slate-500">ធ្វើកិច្ចសន្យា និង Reset ចាប់ផ្តើមជុំថ្មី</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Student Summary Card */}
        <div className="p-5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
              {student.name?.charAt(0) || 'ស'}
            </div>
            <div className="min-w-0">
              <div className="font-black text-slate-800 text-[15px] truncate">{student.name}</div>
              <div className="text-[12px] font-bold text-slate-500 flex items-center gap-2">
                <span>អត្តលេខ៖ {student.id || student.studentId}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>ថ្នាក់ {student.class}</span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-black">
              កោះហៅលើកទី {currentCycle}
            </span>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              ល្មើសអវត្តមាន៖ <span className="text-rose-600 font-black">{student.absent || 0} ដង</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[65vh]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={15} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Resolved Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-600" />
                កាលបរិច្ឆេទដោះស្រាយ <span className="text-red-500">*</span>
              </label>
              <input 
                type="date"
                value={resolvedDate}
                onChange={e => setResolvedDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
                required
              />
            </div>

            {/* Handled By */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
                <User size={14} className="text-emerald-600" />
                អ្នកសម្របសម្រួលដោះស្រាយ
              </label>
              <input 
                type="text"
                value={handledBy}
                onChange={e => setHandledBy(e.target.value)}
                placeholder="ឧ. គណៈកម្មការវិន័យ"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
              />
            </div>
          </div>

          {/* Parent Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-bold text-slate-700">
              ឈ្មោះអាណាព្យាបាលដែលបានមកជួប
            </label>
            <input 
              type="text"
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              placeholder="ឧ. លោក ឈុន វណ្ណា (ឪពុក)"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
            />
          </div>

          {/* Resolution Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-bold text-slate-700 flex items-center justify-between">
              <span>លទ្ធផល និងកិច្ចសន្យា</span>
              <span className="text-[11px] text-slate-400 font-normal">សង្ខេបកិច្ចព្រមព្រៀង</span>
            </label>
            <textarea 
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-xl font-medium text-[13px] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-slate-400"
              placeholder="កត់ត្រាកិច្ចសន្យា ឬដំណោះស្រាយ..."
            />
            {/* Quick Note Chips */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {QUICK_NOTES.map((qn, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNote(qn)}
                  className="text-[11px] bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200 hover:border-emerald-200"
                >
                  + {qn}
                </button>
              ))}
            </div>
          </div>

          {/* Info Banner on Next Cycle */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2.5">
            <RotateCcw size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>កំណត់សម្គាល់ Reset វិន័យ ៖</strong> ក្រោយពីបញ្ជាក់ អវត្តមានបច្ចុប្បន្នរបស់សិស្សនឹងត្រូវ Reset មក <strong>០ ថ្ងៃ</strong> វិញ។ រាល់អវត្តមានថ្មីៗបន្តបន្ទាប់ទៀត នឹងរាប់ចូលទៅក្នុង <strong>«ជុំទី {nextCycle}»</strong>។
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-[13px] transition-all"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-2.5 px-5 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow"
            >
              <CheckCircle2 size={16} strokeWidth={2.5} />
              {isSubmitting ? 'កំពុងរក្សាទុក...' : 'បញ្ជាក់ និង Reset វិន័យជាជុំថ្មី'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

