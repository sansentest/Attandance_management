import { useState, useRef } from 'react'
import { Settings, Save, School, MapPin, Phone, User, Calendar, BookOpen, Shield, Key, Database, Upload, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react'

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('school')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // File input ref for logo
  const fileInputRef = useRef(null)

  // Form States
  const [schoolInfo, setSchoolInfo] = useState({
    name: 'វិទ្យាល័យអង្គរកា',
    principal: 'លោកនាយក សុខ សាន',
    phone: '012 345 678',
    address: 'ភូមិអង្គរកា ឃុំអង្គរកា ស្រុកត្រាំកក់ ខេត្តតាកែវ',
    logo: null
  })

  const [academic, setAcademic] = useState({
    year: '2026-2027',
    semester: 'ទី១'
  })

  const [discipline, setDiscipline] = useState(() => {
    const saved = localStorage.getItem('disciplineThresholds');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { '7-9': 50, '10-12': 40 };
      }
    }
    return { '7-9': 50, '10-12': 40 };
  })

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaveSuccess(true)
      
      // Clear security fields after save if we are on security tab
      if (activeTab === 'security') {
        setSecurity({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }

      if (activeTab === 'discipline') {
        localStorage.setItem('disciplineThresholds', JSON.stringify(discipline));
      }
      
      setTimeout(() => setSaveSuccess(false), 3000)
    }, 1200)
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setSchoolInfo(prev => ({ ...prev, logo: imageUrl }))
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Header Summary (Matching other pages) */}
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-xl lg:text-2xl font-black text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
            <Settings size={22} strokeWidth={2.5} />
          </div>
          ការកំណត់ទូទៅ (Settings)
        </h2>
        <p className="text-slate-500 font-medium text-[13px] lg:text-sm sm:ml-13">
          គ្រប់គ្រងព័ត៌មានសាលារៀន ឆ្នាំសិក្សា និងសុវត្ថិភាពប្រព័ន្ធទាំងមូល
        </p>
      </div>

      {/* Main Content Card (Matching AdminAcademic & AdminUsers) */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative flex-1 min-h-[500px]">
        
        {/* Toolbar & Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col xl:flex-row gap-4 justify-between items-center bg-slate-50/50">
          
          {/* Tabs */}
          <div className="flex flex-wrap bg-slate-200/50 p-1 rounded-xl w-full xl:w-auto">
            <button 
              onClick={() => setActiveTab('school')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'school' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <School size={16} /> ព័ត៌មានសាលា
            </button>
            <button 
              onClick={() => setActiveTab('academic')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'academic' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Calendar size={16} /> ឆ្នាំសិក្សា
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'security' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Shield size={16} /> សុវត្ថិភាព
            </button>
            <button 
              onClick={() => setActiveTab('discipline')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'discipline' ? 'bg-white text-orange-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <CheckCircle2 size={16} /> គោលការណ៍វិន័យ
            </button>
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
            {/* Save Button */}
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-6 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {saving ? (
                <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 size={16} strokeWidth={2.5} />
              ) : (
                <Save size={16} strokeWidth={2.5} />
              )}
              {saving ? 'កំពុងរក្សាទុក...' : saveSuccess ? 'បានរក្សាទុក' : 'រក្សាទុកការកំណត់'}
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 lg:p-8 flex-1 overflow-y-auto relative custom-scrollbar">
          
          {/* School Tab */}
          {activeTab === 'school' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <School size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">ព័ត៌មានសាលារៀន</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5 font-medium">កែប្រែព័ត៌មានទូទៅរបស់សាលារៀនសម្រាប់បង្ហាញក្នុងប្រព័ន្ធ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Logo Upload Section */}
                <div className="md:col-span-4 flex flex-col items-center gap-4">
                  <div 
                    onClick={triggerFileInput}
                    className="w-40 h-40 rounded-full border-4 border-slate-50 bg-slate-100 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-200 transition-colors shadow-inner overflow-hidden relative group"
                  >
                    {schoolInfo.logo ? (
                      <>
                        <img src={schoolInfo.logo} alt="School Logo" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="text-white" size={24} />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={32} className="text-slate-400" strokeWidth={1.5} />
                        <span className="text-[12px] font-bold text-slate-500">បញ្ចូលឡូហ្គោ</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden" 
                    />
                  </div>
                  <p className="text-[12px] font-medium text-slate-400 text-center max-w-[200px]">
                    ទំហំរូបភាពណែនាំគឺ 500x500px ក្នុងទម្រង់ PNG ឬ JPG
                  </p>
                </div>

                {/* Input Fields */}
                <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-600 ml-1">ឈ្មោះសាលា <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <School size={16} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={schoolInfo.name}
                        onChange={(e) => setSchoolInfo({...schoolInfo, name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3 pl-10 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-600 ml-1">នាយកសាលា</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User size={16} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={schoolInfo.principal}
                        onChange={(e) => setSchoolInfo({...schoolInfo, principal: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3 pl-10 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-600 ml-1">លេខទូរស័ព្ទ</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone size={16} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={schoolInfo.phone}
                        onChange={(e) => setSchoolInfo({...schoolInfo, phone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3 pl-10 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="text-[13px] font-bold text-slate-600 ml-1">អាសយដ្ឋាន</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 pt-3.5 pointer-events-none">
                        <MapPin size={16} className="text-slate-400" />
                      </div>
                      <textarea 
                        value={schoolInfo.address}
                        onChange={(e) => setSchoolInfo({...schoolInfo, address: e.target.value})}
                        rows="3"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3 pl-10 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400 resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Tab */}
          {activeTab === 'academic' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">ការកំណត់ឆ្នាំសិក្សា</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5 font-medium">កំណត់ឆ្នាំសិក្សា និងឆមាសបច្ចុប្បន្នសម្រាប់ទិន្នន័យថ្មីៗ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-600 ml-1">ឆ្នាំសិក្សាបច្ចុប្បន្ន <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Calendar size={16} className="text-slate-400" />
                    </div>
                    <select 
                      value={academic.year}
                      onChange={(e) => setAcademic({...academic, year: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-800 py-3.5 pl-10 pr-10 rounded-xl font-bold text-[14px] focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all appearance-none cursor-pointer shadow-sm"
                    >
                      <option value="2025-2026">២០២៥-២០២៦</option>
                      <option value="2026-2027">២០២៦-២០២៧</option>
                      <option value="2027-2028">២០២៧-២០២៨</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-600 ml-1">ឆមាសបច្ចុប្បន្ន <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <BookOpen size={16} className="text-slate-400" />
                    </div>
                    <select 
                      value={academic.semester}
                      onChange={(e) => setAcademic({...academic, semester: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-800 py-3.5 pl-10 pr-10 rounded-xl font-bold text-[14px] focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all appearance-none cursor-pointer shadow-sm"
                    >
                      <option value="ទី១">ឆមាស ទី១</option>
                      <option value="ទី២">ឆមាស ទី២</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">សុវត្ថិភាព និងប្រព័ន្ធ</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5 font-medium">គ្រប់គ្រងពាក្យសម្ងាត់ និងការបម្រុងទុកទិន្នន័យ (Backup)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Password Change */}
                <div className="flex flex-col gap-5 bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Key size={18} className="text-slate-400" />
                    <h4 className="text-[14px] font-black text-slate-700">ប្តូរពាក្យសម្ងាត់</h4>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <input 
                        type="password" 
                        placeholder="ពាក្យសម្ងាត់បច្ចុប្បន្ន"
                        value={security.currentPassword}
                        onChange={(e) => setSecurity({...security, currentPassword: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3.5 px-4 rounded-xl font-medium text-[13px] focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div className="relative">
                      <input 
                        type="password" 
                        placeholder="ពាក្យសម្ងាត់ថ្មី"
                        value={security.newPassword}
                        onChange={(e) => setSecurity({...security, newPassword: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3.5 px-4 rounded-xl font-medium text-[13px] focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div className="relative">
                      <input 
                        type="password" 
                        placeholder="បញ្ជាក់ពាក្យសម្ងាត់ថ្មី"
                        value={security.confirmPassword}
                        onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3.5 px-4 rounded-xl font-medium text-[13px] focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Database Actions */}
                <div className="flex flex-col gap-5 bg-slate-50 border border-slate-100 shadow-sm rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Database size={18} className="text-slate-400" />
                    <h4 className="text-[14px] font-black text-slate-700">បម្រុងទុកទិន្នន័យ (Database)</h4>
                  </div>
                  
                  <p className="text-[13px] font-medium text-slate-500 leading-relaxed mb-4">
                    ដើម្បីជៀសវាងការបាត់បង់ទិន្នន័យដោយចៃដន្យ លោកអ្នកគួរធ្វើការទាញយកទិន្នន័យ (Backup) រក្សាទុកជាប្រចាំ។
                  </p>
                  
                  <div className="flex flex-col gap-3 mt-auto">
                    <button className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 rounded-xl font-bold text-[13px] transition-all shadow-sm">
                      <Database size={16} />
                      <span>ទាញយកទិន្នន័យ (Backup)</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 rounded-xl font-bold text-[13px] transition-all shadow-sm">
                      <Upload size={16} />
                      <span>បញ្ចូលទិន្នន័យវិញ (Restore)</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Discipline Policy Tab */}
          {activeTab === 'discipline' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">កំណត់កម្រិតវិន័យអវត្តមាន</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5 font-medium">កំណត់ចំនួនថ្ងៃអវត្តមានអត់ច្បាប់អតិបរមាមុនឈានដល់ការកោះហៅ</p>
                </div>
              </div>

              <div className="flex flex-col gap-6 bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
                    <div>
                      <span className="text-[15px] font-bold text-slate-800 block">កម្រិតអនុវិទ្យាល័យ</span>
                      <span className="text-[12px] font-medium text-slate-500">ថ្នាក់ទី 7 ដល់ទី 9</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="1" 
                        value={discipline['7-9']} 
                        onChange={e => setDiscipline({...discipline, '7-9': parseInt(e.target.value) || 0})} 
                        className="w-20 bg-white border border-slate-200 rounded-lg p-2 text-center font-bold text-[15px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" 
                      />
                      <span className="text-[14px] text-slate-500 font-bold">ដង</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
                    <div>
                      <span className="text-[15px] font-bold text-slate-800 block">កម្រិតវិទ្យាល័យ</span>
                      <span className="text-[12px] font-medium text-slate-500">ថ្នាក់ទី 10 ដល់ទី 12</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="1" 
                        value={discipline['10-12']} 
                        onChange={e => setDiscipline({...discipline, '10-12': parseInt(e.target.value) || 0})} 
                        className="w-20 bg-white border border-slate-200 rounded-lg p-2 text-center font-bold text-[15px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" 
                      />
                      <span className="text-[14px] text-slate-500 font-bold">ដង</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 mt-2">
                  <Shield size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-amber-700 leading-relaxed font-medium">
                    <span className="font-bold">ចំណាំ៖</span> ការផ្លាស់ប្តូរការកំណត់នេះ នឹងជះឥទ្ធិពលភ្លាមៗទៅលើផ្ទាំងទំព័រ <b>"តាមដានអវត្តមានសិស្ស"</b>។ រាល់សិស្សដែលមានចំនួនអវត្តមានអត់ច្បាប់ស្មើ ឬលើសកម្រិតនេះ នឹងលោតចូលស្ថានភាព <b>CRITICAL</b> ដោយស្វ័យប្រវត្តិ។
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
