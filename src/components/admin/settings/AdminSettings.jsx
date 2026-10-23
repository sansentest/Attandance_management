import { useState, useRef, useEffect } from 'react'
import { 
  Settings, Save, School, MapPin, Phone, User, Calendar, BookOpen, 
  Shield, Key, Database, Upload, Download, CheckCircle2, AlertTriangle, 
  RefreshCw, Loader2, Image as ImageIcon, FileCheck, HardDrive, 
  ArrowRight, X, AlertCircle, Trash2
} from 'lucide-react'
import { api } from '../../../utils/api'

export default function AdminSettings({ initialTab = 'school' }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [toast, setToast] = useState(null)
  
  // File input refs
  const fileInputRef = useRef(null)
  const backupFileInputRef = useRef(null)

  // Form States
  const [schoolInfo, setSchoolInfo] = useState(() => {
    try {
      const cached = localStorage.getItem('school_settings_cache');
      if (cached) {
        const p = JSON.parse(cached);
        if (p?.school) return p.school;
      }
    } catch (e) {}
    return {
      name: 'វិទ្យាល័យអង្គរកា',
      principal: 'លោកនាយក សុខ សាន',
      phone: '012 345 678',
      address: 'ភូមិអង្គរកា ឃុំអង្គរកា ស្រុកត្រាំកក់ ខេត្តតាកែវ',
      logo: null
    };
  })

  const [academic, setAcademic] = useState(() => {
    try {
      const cached = localStorage.getItem('school_settings_cache');
      if (cached) {
        const p = JSON.parse(cached);
        if (p?.academic) return p.academic;
      }
    } catch (e) {}
    return {
      year: '2026-2027',
      semester: 'ទី១'
    };
  })

  const [discipline, setDiscipline] = useState(() => {
    try {
      const saved = localStorage.getItem('disciplineThresholds');
      if (saved) return JSON.parse(saved);
      const cached = localStorage.getItem('school_settings_cache');
      if (cached) {
        const p = JSON.parse(cached);
        if (p?.discipline) return p.discipline;
      }
    } catch (e) {}
    return { '7-9': 50, '10-12': 40 };
  })

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordUpdating, setPasswordUpdating] = useState(false)

  // Backup & Restore States
  const [exportingBackup, setExportingBackup] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(false)
  const [pendingRestoreData, setPendingRestoreData] = useState(null)
  const [restoreConfirmModal, setRestoreConfirmModal] = useState(false)
  const [lastBackupTime, setLastBackupTime] = useState(() => {
    return localStorage.getItem('school_last_backup_time') || null;
  })

  // Clean / Reset Test Data States
  const [cleaningData, setCleaningData] = useState(false)
  const [cleanModal, setCleanModal] = useState({ open: false, type: 'attendance' })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Load latest settings from Firebase / Cloud SWR
  useEffect(() => {
    let isMounted = true
    const loadSettings = async () => {
      try {
        const res = await api('settings.get')
        if (isMounted && res?.success && res.data) {
          if (res.data.school) setSchoolInfo(res.data.school)
          if (res.data.academic) setAcademic(res.data.academic)
          if (res.data.discipline) setDiscipline(res.data.discipline)
        }
      } catch (err) {
        console.warn('Failed to fetch settings from cloud:', err)
      }
    }
    loadSettings()
    return () => { isMounted = false }
  }, [])

  // If initialTab changes from parent
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  // Save Settings (School, Academic, Discipline)
  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        school: schoolInfo,
        academic,
        discipline
      }
      const res = await api('settings.save', { settings: payload })
      if (res?.success) {
        setSaveSuccess(true)
        showToast('បានរក្សាទុកការកំណត់ជោគជ័យទៅកាន់ Firebase Cloud!', 'success')
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        showToast('មិនអាចរក្សាទុកបានទេ៖ ' + (res?.error || 'បញ្ហាប្រព័ន្ធ'), 'error')
      }
    } catch (err) {
      showToast('កំហុសប្រព័ន្ធ៖ ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // Password Change Handler
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!security.newPassword || security.newPassword.length < 6) {
      showToast('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ តួអក្សរ', 'error')
      return
    }
    if (security.newPassword !== security.confirmPassword) {
      showToast('ពាក្យសម្ងាត់ថ្មី និងបញ្ជាក់ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ', 'error')
      return
    }

    setPasswordUpdating(true)
    try {
      // Find current user in users list or session
      const rawSession = localStorage.getItem('att_session')
      const session = rawSession ? JSON.parse(rawSession) : null
      const username = session?.user?.username || 'admin_sys'

      // Update in user list
      const resUsers = await api('users.getAll')
      if (resUsers?.success && Array.isArray(resUsers.data)) {
        const user = resUsers.data.find(u => u.username?.toLowerCase() === username?.toLowerCase())
        if (user) {
          await api('users.save', { user: { ...user, password: security.newPassword } })
        }
      }

      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showToast('បានប្តូរពាក្យសម្ងាត់ជោគជ័យ!', 'success')
    } catch (err) {
      showToast('កំហុសពេលប្តូរពាក្យសម្ងាត់៖ ' + err.message, 'error')
    } finally {
      setPasswordUpdating(false)
    }
  }

  // Logo Upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('ទំហំរូបភាពមិនត្រូវលើសពី 2MB ឡើយ', 'error')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setSchoolInfo(prev => ({ ...prev, logo: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Backup Export Action
  const handleExportBackup = async () => {
    setExportingBackup(true)
    try {
      const res = await api('backup.export')
      if (res?.success && res.backup) {
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const filename = `angroka_school_backup_${dateStr}.json`
        
        // Trigger browser download safely
        const blob = new Blob([JSON.stringify(res.backup, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        const nowFormatted = new Date().toLocaleString('km-KH')
        localStorage.setItem('school_last_backup_time', nowFormatted)
        setLastBackupTime(nowFormatted)

        showToast('បានទាញយកទិន្នន័យ Backup ជោគជ័យ!', 'success')
      } else {
        showToast('មិនអាចទាញយក Backup បានទេ៖ ' + (res?.error || 'បញ្ហាប្រព័ន្ធ'), 'error')
      }
    } catch (err) {
      showToast('កំហុសពេលទាញយក Backup៖ ' + err.message, 'error')
    } finally {
      setExportingBackup(false)
    }
  }

  // Backup File Selection for Restore
  const handleBackupFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        if (!parsed || !parsed.data) {
          showToast('ឯកសារដែលបានជ្រើសរើសមិនមែនជាទម្រង់ Backup ត្រឹមត្រូវទេ', 'error')
          return
        }
        setPendingRestoreData(parsed)
        setRestoreConfirmModal(true)
      } catch (err) {
        showToast('មិនអាចអានឯកសារ JSON បានទេ៖ ' + err.message, 'error')
      } finally {
        if (backupFileInputRef.current) backupFileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  // Confirm Restore Database
  const handleConfirmRestore = async () => {
    if (!pendingRestoreData) return
    setRestoringBackup(true)
    try {
      const res = await api('backup.restore', { backupData: pendingRestoreData })
      if (res?.success) {
        setRestoreConfirmModal(false)
        setPendingRestoreData(null)
        showToast('បានស្ដារទិន្នន័យពី Backup ជោគជ័យពេញលេញ!', 'success')
        
        // Refresh local form states if settings were in backup
        if (pendingRestoreData.data?.settings) {
          const s = pendingRestoreData.data.settings
          if (s.school) setSchoolInfo(s.school)
          if (s.academic) setAcademic(s.academic)
          if (s.discipline) setDiscipline(s.discipline)
        }
      } else {
        showToast('ការស្ដារទិន្នន័យបានបរាជ័យ៖ ' + (res?.error || 'បញ្ហាប្រព័ន្ធ'), 'error')
      }
    } catch (err) {
      showToast('កំហុសពេលស្ដារទិន្នន័យ៖ ' + err.message, 'error')
    } finally {
      setRestoringBackup(false)
    }
  }

  // Clean / Reset Data Handler
  const handleExecuteClean = async () => {
    setCleaningData(true)
    try {
      const res = await api('system.cleanData', { 
        clearStudents: cleanModal.type === 'all',
        wipeEverything: cleanModal.type === 'all'
      })
      if (res?.success) {
        setCleanModal({ open: false, type: 'attendance' })
        showToast(res.message, 'success')
      } else {
        showToast('មិនអាចសម្អាតបានទេ៖ ' + (res?.error || 'បញ្ហាប្រព័ន្ធ'), 'error')
      }
    } catch (err) {
      showToast('កំហុសប្រព័ន្ធ៖ ' + err.message, 'error')
    } finally {
      setCleaningData(false)
    }
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border bg-white animate-in slide-in-from-top-3 duration-300">
          {toast.type === 'success' ? (
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} strokeWidth={2.5} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle size={18} strokeWidth={2.5} />
            </div>
          )}
          <span className="text-[13px] font-bold text-slate-800">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 ml-2">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Summary */}
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-xl lg:text-2xl font-black text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
            <Settings size={22} strokeWidth={2.5} />
          </div>
          ការកំណត់ទូទៅ (Settings)
        </h2>
        <p className="text-slate-500 font-medium text-[13px] lg:text-sm sm:ml-13">
          គ្រប់គ្រងព័ត៌មានសាលារៀន ឆ្នាំសិក្សា គោលការណ៍វិន័យ និងការបម្រុងទុកទិន្នន័យពពក Firebase
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative flex-1 min-h-[500px]">
        
        {/* Toolbar & Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col xl:flex-row gap-4 justify-between items-center bg-slate-50/50">
          
          {/* Tabs */}
          <div className="flex flex-wrap bg-slate-200/50 p-1 rounded-xl w-full xl:w-auto gap-1 sm:gap-0">
            <button 
              onClick={() => setActiveTab('school')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'school' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <School size={16} /> ព័ត៌មានសាលា
            </button>
            <button 
              onClick={() => setActiveTab('academic')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'academic' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Calendar size={16} /> ឆ្នាំសិក្សា
            </button>
            <button 
              onClick={() => setActiveTab('discipline')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'discipline' ? 'bg-white text-orange-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <CheckCircle2 size={16} /> គោលការណ៍វិន័យ
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'security' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Shield size={16} /> សុវត្ថិភាព
            </button>
            <button 
              onClick={() => setActiveTab('backup')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${
                activeTab === 'backup' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Database size={16} /> បម្រុងទុក & ស្ដារ (Backup)
            </button>
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
            {/* Save Button for Settings Tabs */}
            {activeTab !== 'backup' && activeTab !== 'security' && (
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-6 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
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
            )}
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
                  <p className="text-[13px] text-slate-500 mt-0.5 font-medium">កែប្រែព័ត៌មានទូទៅរបស់សាលារៀនសម្រាប់បង្ហាញក្នុងប្រព័ន្ធ និងរបាយការណ៍</p>
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
                    ទំហំរូបភាពណែនាំគឺ 500x500px ក្នុងទម្រង់ PNG ឬ JPG (មិនលើសពី 2MB)
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

                  <div className="flex flex-col gap-2 sm:col-span-2">
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
                      <option value="2024-2025">២០២៤-២០២៥</option>
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

          {/* Discipline Policy Tab */}
          {activeTab === 'discipline' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">កំណត់កម្រិតវិន័យអវត្តមាន</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5 font-medium">កំណត់ចំនួនដងអវត្តមានអត់ច្បាប់អតិបរមាមុនឈានដល់ការកោះហៅអាណាព្យាបាល</p>
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
                        className="w-24 bg-white border border-slate-200 rounded-lg p-2.5 text-center font-bold text-[15px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" 
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
                        className="w-24 bg-white border border-slate-200 rounded-lg p-2.5 text-center font-bold text-[15px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" 
                      />
                      <span className="text-[14px] text-slate-500 font-bold">ដង</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 mt-2">
                  <Shield size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-amber-800 leading-relaxed font-medium">
                    <span className="font-bold">ចំណាំ៖</span> ការផ្លាស់ប្តូរការកំណត់នេះ នឹងជះឥទ្ធិពលភ្លាមៗទៅលើផ្ទាំងទំព័រ <b>"តាមដានវិន័យសិស្ស"</b>។ រាល់សិស្សដែលមានចំនួនអវត្តមានអត់ច្បាប់ស្មើ ឬលើសកម្រិតនេះ នឹងលោតចូលស្ថានភាព <b>ប្រកាសអាសន្ន (CRITICAL)</b> ដោយស្វ័យប្រវត្តិ។
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">សុវត្ថិភាព និងការគ្រប់គ្រងគណនី</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5 font-medium">ផ្លាស់ប្តូរពាក្យសម្ងាត់សម្រាប់ចូលប្រើប្រាស់គណនី Admin</p>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="flex flex-col gap-5 bg-white border border-slate-100 shadow-sm rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <Key size={18} className="text-slate-400" />
                  <h4 className="text-[14px] font-black text-slate-700">ប្តូរពាក្យសម្ងាត់ថ្មី</h4>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-slate-600 ml-1">ពាក្យសម្ងាត់បច្ចុប្បន្ន</label>
                    <input 
                      type="password" 
                      placeholder="បញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន"
                      value={security.currentPassword}
                      onChange={(e) => setSecurity({...security, currentPassword: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3.5 px-4 rounded-xl font-medium text-[13px] focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-400 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-slate-600 ml-1">ពាក្យសម្ងាត់ថ្មី (យ៉ាងតិច ៦ តួអក្សរ)</label>
                    <input 
                      type="password" 
                      placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី"
                      value={security.newPassword}
                      onChange={(e) => setSecurity({...security, newPassword: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3.5 px-4 rounded-xl font-medium text-[13px] focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-400 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-slate-600 ml-1">បញ្ជាក់ពាក្យសម្ងាត់ថ្មី</label>
                    <input 
                      type="password" 
                      placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មីម្តងទៀត"
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3.5 px-4 rounded-xl font-medium text-[13px] focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-400 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={passwordUpdating}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white py-3 px-6 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
                  >
                    {passwordUpdating ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                    {passwordUpdating ? 'កំពុងផ្លាស់ប្តូរ...' : 'ផ្លាស់ប្តូរពាក្យសម្ងាត់'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Backup & Restore Tab */}
          {activeTab === 'backup' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">ការបម្រុងទុក និងស្ដារទិន្នន័យ (Cloud Database Backup)</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5 font-medium">គ្រប់គ្រងការទាញយក Backup រក្សាទុកក្នុងកុំព្យូទ័រ និងការស្ដារទិន្នន័យចូល Firebase</p>
                </div>
              </div>

              {/* Status Header Banner */}
              <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50/40 border border-indigo-100/80 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                    <HardDrive size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-black text-slate-800">ស្ថានភាពទិន្នន័យ Cloud</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Firebase Firestore Active
                      </span>
                    </div>
                    <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                      {lastBackupTime ? `បានទាញយក Backup ចុងក្រោយ៖ ${lastBackupTime}` : 'មិនទាន់មានការទាញយក Backup ក្នុង browser នេះទេ'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid with 2 primary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. Export Backup Card */}
                <div className="flex flex-col bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Download size={20} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-black text-slate-800">ទាញយកទិន្នន័យ Backup</h4>
                      <span className="text-[11px] font-bold text-slate-400">Export Complete JSON</span>
                    </div>
                  </div>

                  <p className="text-[13px] font-medium text-slate-500 leading-relaxed mb-5">
                    ទាញយកទិន្នន័យសាលាទាំងមូលជាឯកសារ <b>.json</b> តែមួយ រួមមាន៖ បញ្ជីសិស្ស, កំណត់ត្រាវត្តមាន, ថ្នាក់រៀន, មុខវិជ្ជា, កាលវិភាគ, Bot Telegram និងការកំណត់នានា។
                  </p>

                  <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 space-y-2 text-[12px] font-bold text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">👨‍🎓 បញ្ជីសិស្ស</span>
                      <span className="text-indigo-600 font-extrabold">រួមបញ្ចូល</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">📋 កំណត់ត្រាវត្តមានទាំងអស់</span>
                      <span className="text-indigo-600 font-extrabold">រួមបញ្ចូល</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">🏫 ថ្នាក់ មុខវិជ្ជា និងកាលវិភាគ</span>
                      <span className="text-indigo-600 font-extrabold">រួមបញ្ចូល</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">⚙️ ការកំណត់ & Telegram Bots</span>
                      <span className="text-indigo-600 font-extrabold">រួមបញ្ចូល</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button 
                      onClick={handleExportBackup}
                      disabled={exportingBackup}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
                    >
                      {exportingBackup ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      <span>{exportingBackup ? 'កំពុងទាញយកទិន្នន័យពី Firebase...' : 'ទាញយក Backup ឥឡូវនេះ (Download .json)'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Restore Backup Card */}
                <div className="flex flex-col bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Upload size={20} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-black text-slate-800">ស្ដារទិន្នន័យឡើងវិញ (Restore)</h4>
                      <span className="text-[11px] font-bold text-slate-400">Import & Sync to Cloud</span>
                    </div>
                  </div>

                  <p className="text-[13px] font-medium text-slate-500 leading-relaxed mb-5">
                    ជ្រើសរើសឯកសារ <b>.json</b> ដែលបាន Backup ពីមុន ដើម្បីបញ្ចូលទិន្នន័យឡើងវិញទៅក្នុង Firebase Cloud Firestore ដោយសុវត្ថិភាព។
                  </p>

                  <div 
                    onClick={() => backupFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/70 hover:bg-emerald-50/30 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all mb-6 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all border border-slate-100">
                      <FileCheck size={20} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                      ចុចទីនេះដើម្បីជ្រើសរើសឯកសារ Backup (.json)
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      គាំទ្រតែឯកសារទម្រង់ JSON ផ្លូវការរបស់ប្រព័ន្ធប៉ុណ្ណោះ
                    </span>
                    <input 
                      type="file" 
                      ref={backupFileInputRef}
                      onChange={handleBackupFileSelect}
                      accept=".json,application/json"
                      className="hidden" 
                    />
                  </div>

                  <div className="mt-auto">
                    <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex items-start gap-2.5">
                      <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
                        ការ Restore នឹងបញ្ចូល ឬធ្វើបច្ចុប្បន្នភាពទិន្នន័យដែលមានស្រាប់។ លោកអ្នកនឹងអាចមើលចំនួនទិន្នន័យផ្ទៀងផ្ទាត់មុនពេលអនុវត្ត។
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Clean / Reset Test Data Card */}
                <div className="md:col-span-2 flex flex-col bg-rose-50/30 border border-rose-200/70 rounded-2xl p-6 sm:p-7 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                      <Trash2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-black text-rose-950">សម្អាតទិន្នន័យតេស្ត និងកំណត់ប្រព័ន្ធឡើងវិញ (Clean / Reset Data)</h4>
                      <span className="text-[11px] font-bold text-rose-500">Wipe Test Records for Fresh School Deployment</span>
                    </div>
                  </div>

                  <p className="text-[13px] font-medium text-slate-600 leading-relaxed mb-5">
                    ប្រើមុខងារនេះដើម្បីសម្អាតរាល់កំណត់ត្រាវត្តមានសាកល្បង ឬកំណត់ត្រាសិស្សតេស្តទាំងអស់ចេញពី Firebase Cloud Firestore និង Cache ក្នុង Browser ដើម្បីឱ្យសាលាអាចចាប់ផ្តើមកត់ត្រាវត្តមានពិតប្រាកដពីលេខ ០ ឡើងវិញ។
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => setCleanModal({ open: true, type: 'attendance' })}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-700 hover:text-rose-800 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow cursor-pointer"
                    >
                      <Trash2 size={16} />
                      <span>សម្អាតទិន្នន័យវត្តមានតេស្តទាំងអស់ (Clear Attendance Records)</span>
                    </button>

                    <button 
                      onClick={() => setCleanModal({ open: true, type: 'all' })}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow cursor-pointer"
                    >
                      <AlertTriangle size={16} />
                      <span>សម្អាតទាំងអស់ (វត្តមាន + បញ្ជីសិស្សតេស្ត)</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {restoreConfirmModal && pendingRestoreData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Upload size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">ផ្ទៀងផ្ទាត់ការស្ដារទិន្នន័យ (Restore)</h3>
                  <span className="text-[12px] font-bold text-slate-400">
                    សាលា៖ {pendingRestoreData.school || 'វិទ្យាល័យអង្គរកា'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { setRestoreConfirmModal(false); setPendingRestoreData(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                ឯកសារ Backup ត្រូវបានពិនិត្យត្រឹមត្រូវ។ ខាងក្រោមនេះជាចំនួនទិន្នន័យដែលបានរកឃើញក្នុងឯកសារ៖
              </p>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400">សិស្សសរុប</span>
                  <span className="text-[16px] font-black text-slate-800">
                    {pendingRestoreData.counts?.students ?? (pendingRestoreData.data?.students?.length || 0)} នាក់
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400">កំណត់ត្រាវត្តមាន</span>
                  <span className="text-[16px] font-black text-slate-800">
                    {pendingRestoreData.counts?.attendance ?? (pendingRestoreData.data?.attendance?.length || 0)} កំណត់ត្រា
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400">ថ្នាក់រៀន</span>
                  <span className="text-[16px] font-black text-slate-800">
                    {pendingRestoreData.counts?.classes ?? (pendingRestoreData.data?.classes?.length || 0)} ថ្នាក់
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400">មុខវិជ្ជា</span>
                  <span className="text-[16px] font-black text-slate-800">
                    {pendingRestoreData.counts?.subjects ?? (pendingRestoreData.data?.subjects?.length || 0)} មុខ
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400">កាលវិភាគ</span>
                  <span className="text-[16px] font-black text-slate-800">
                    {pendingRestoreData.counts?.timetables ?? Object.keys(pendingRestoreData.data?.timetables || {}).length} ថ្នាក់
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400">Telegram Bots</span>
                  <span className="text-[16px] font-black text-slate-800">
                    {pendingRestoreData.counts?.telegramBots ?? (pendingRestoreData.data?.telegramBots?.length || 0)} bot
                  </span>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-3 flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[12px] font-bold text-rose-800 leading-relaxed">
                  ការស្ដារទិន្នន័យនឹងបញ្ចូល និងធ្វើបច្ចុប្បន្នភាពទិន្នន័យលើ Cloud Firestore។ តើលោកអ្នកប្រាកដថាចង់បន្តអនុវត្តឬទេ?
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => { setRestoreConfirmModal(false); setPendingRestoreData(null); }}
                disabled={restoringBackup}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-100 transition-colors"
              >
                បោះបង់
              </button>
              <button 
                onClick={handleConfirmRestore}
                disabled={restoringBackup}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-[13px] transition-all shadow-sm hover:shadow disabled:opacity-70 cursor-pointer"
              >
                {restoringBackup ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                <span>{restoringBackup ? 'កំពុងស្ដារទិន្នន័យចូល Firebase...' : 'យល់ព្រម ស្ដារទិន្នន័យ'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Clean Data Confirmation Modal */}
      {cleanModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">
                    {cleanModal.type === 'all' ? 'បញ្ជាក់ការសម្អាតទិន្នន័យទាំងអស់' : 'បញ្ជាក់ការសម្អាតទិន្នន័យវត្តមាន'}
                  </h3>
                  <span className="text-[11px] font-bold text-rose-600">សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយវិញបានទេ</span>
                </div>
              </div>
              <button 
                onClick={() => setCleanModal({ open: false, type: 'attendance' })}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                {cleanModal.type === 'all'
                  ? 'រាល់កំណត់ត្រាវត្តមាន កំណត់ត្រាម៉ោងសិក្សា លិខិតកោះហៅ និងបញ្ជីសិស្សតេស្តទាំងអស់ នឹងត្រូវលុបចេញពី Firebase Cloud Firestore និង Browser Cache ជារៀងរហូត។ គណនី Admin និងការកំណត់សាលានឹងនៅតែរក្សាទុកដដែល។'
                  : 'រាល់កំណត់ត្រាវត្តមានសិស្ស កំណត់ត្រាចាក់សោម៉ោងសិក្សា និងលិខិតកោះហៅតេស្តទាំងអស់ នឹងត្រូវលុបចេញពី Firebase Cloud Firestore និង Browser Cache ជារៀងរហូត។ បញ្ជីឈ្មោះសិស្ស និងថ្នាក់រៀននឹងនៅរក្សាទុកដដែល។'}
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-[12px] font-bold text-amber-800 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500 shrink-0" />
                <span>សូមណែនាំឱ្យទាញយក Backup (Download .json) រក្សាទុកមុនពេលសម្អាត។</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setCleanModal({ open: false, type: 'attendance' })}
                disabled={cleaningData}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-100 cursor-pointer"
              >
                បោះបង់
              </button>
              <button 
                onClick={handleExecuteClean}
                disabled={cleaningData}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-[13px] shadow-sm hover:shadow disabled:opacity-70 cursor-pointer"
              >
                {cleaningData ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                <span>{cleaningData ? 'កំពុងសម្អាត...' : 'យល់ព្រម សម្អាតឥឡូវនេះ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
