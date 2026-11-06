import { useState, useRef, useEffect } from 'react'
import { 
  Settings, Save, School, MapPin, Phone, User, Calendar, BookOpen, 
  Shield, Key, Database, Upload, Download, CheckCircle2, AlertTriangle, 
  RefreshCw, Loader2, Image as ImageIcon, FileCheck, HardDrive, 
  ArrowRight, X, AlertCircle, Trash2, Clock, Check, GraduationCap
} from 'lucide-react'
import { api, verifyPassword } from '../../../utils/api'

export default function AdminSettings({ initialTab = 'school' }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [toast, setToast] = useState(null)
  
  // File input refs
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
    return { '7-9': 20, '10-12': 20 };
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

  // Monthly Auto-Backup States
  const [monthlyBackups, setMonthlyBackups] = useState(() => {
    try {
      const raw = localStorage.getItem('school_monthly_backups_list');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [creatingMonthly, setCreatingMonthly] = useState(false)
  const [downloadingMonthKey, setDownloadingMonthKey] = useState(null)
  const [autoBackupSettings, setAutoBackupSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('school_auto_backup_settings');
      return raw ? JSON.parse(raw) : { enabled: true, dayOfMonth: 1 };
    } catch {
      return { enabled: true, dayOfMonth: 1 };
    }
  })
  const [deleteMonthlyModal, setDeleteMonthlyModal] = useState({ open: false, item: null })

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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('school_settings_updated', { detail: payload }));
        }
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
      const username = session?.username || session?.user?.username || 'admin'

      // Update in user list
      const resUsers = await api('users.getAll')
      if (resUsers?.success && Array.isArray(resUsers.data)) {
        const user = resUsers.data.find(u => u.username?.toLowerCase() === username?.toLowerCase())
        if (user) {
          if (security.currentPassword) {
            const isMatch = await verifyPassword(security.currentPassword, user.password)
            if (!isMatch) {
              showToast('ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ', 'error')
              setPasswordUpdating(false)
              return
            }
          }
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
          if (s.school) {
            setSchoolInfo(s.school)
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('school_settings_updated', { detail: { school: s.school } }))
            }
          }
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

  // ─────────────────────────────────────────────
  // Monthly Auto-Backup Functions
  // ─────────────────────────────────────────────
  const loadMonthlyBackups = async () => {
    setLoadingMonthly(true)
    try {
      const res = await api('backup.getMonthlyList')
      if (res?.success && Array.isArray(res.data)) {
        setMonthlyBackups(res.data)
      }
    } catch (e) {
      console.warn('Failed to load monthly backups:', e)
    } finally {
      setLoadingMonthly(false)
    }
  }

  // Load monthly backups whenever switching to backup tab
  useEffect(() => {
    if (activeTab === 'backup') {
      loadMonthlyBackups()
    }
  }, [activeTab])

  // Listen for background auto-backup creation event
  useEffect(() => {
    const handleAutoBackupCreated = (e) => {
      loadMonthlyBackups()
      if (e?.detail) {
        showToast(`បានបង្កើតការបម្រុងទុកស្វ័យប្រវត្តប្រចាំ ${e.detail.monthKhmer || ''} រួចរាល់!`, 'success')
      }
    }
    window.addEventListener('school_monthly_backup_created', handleAutoBackupCreated)
    return () => window.removeEventListener('school_monthly_backup_created', handleAutoBackupCreated)
  }, [])

  // Create monthly backup manually now
  const handleCreateMonthlyNow = async () => {
    setCreatingMonthly(true)
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const currentMonthKey = `${year}-${String(month).padStart(2, '0')}`
      const KHMER_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
      const KHMER_NUMS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
      const toKhmerNum = (num) => String(num).split('').map(c => KHMER_NUMS[parseInt(c)] || c).join('')
      const monthKhmer = `ខែ${KHMER_MONTHS[now.getMonth()]} ឆ្នាំ${toKhmerNum(year)}`

      const res = await api('backup.createMonthly', {
        monthKey: currentMonthKey,
        monthKhmer,
        isAuto: false
      })

      if (res?.success) {
        showToast(res.message || 'បានបង្កើតការបម្រុងទុកប្រចាំខែជោគជ័យ!', 'success')
        localStorage.setItem('school_last_auto_backup_month', currentMonthKey)
        const nowFormatted = new Date().toLocaleString('km-KH')
        localStorage.setItem('school_last_backup_time', nowFormatted)
        setLastBackupTime(nowFormatted)
        await loadMonthlyBackups()
      } else {
        showToast('មិនអាចបង្កើត Backup បានទេ៖ ' + (res?.error || 'បញ្ហាប្រព័ន្ធ'), 'error')
      }
    } catch (err) {
      showToast('កំហុសពេលបង្កើត Backup៖ ' + err.message, 'error')
    } finally {
      setCreatingMonthly(false)
    }
  }

  // Download a specific monthly backup
  const handleDownloadMonthly = async (item) => {
    setDownloadingMonthKey(item.monthKey)
    try {
      const res = await api('backup.getMonthlyPayload', { monthKey: item.monthKey })
      if (res?.success && res.data) {
        const filename = `angroka_school_backup_${item.monthKey}.json`
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showToast(`បានទាញយក Backup ${item.monthKhmer || item.monthKey} ជោគជ័យ!`, 'success')
      } else {
        showToast('មិនអាចទាញយកឯកសារនេះបានទេ៖ ' + (res?.error || 'មិនមានទិន្នន័យ'), 'error')
      }
    } catch (err) {
      showToast('កំហុសពេលទាញយក៖ ' + err.message, 'error')
    } finally {
      setDownloadingMonthKey(null)
    }
  }

  // Restore directly from a monthly backup
  const handleRestoreFromMonthly = async (item) => {
    try {
      const res = await api('backup.getMonthlyPayload', { monthKey: item.monthKey })
      if (res?.success && res.data) {
        setPendingRestoreData(res.data)
        setRestoreConfirmModal(true)
      } else {
        showToast('មិនអាចទាញយកទិន្នន័យ Backup សម្រាប់ស្ដារបានទេ', 'error')
      }
    } catch (err) {
      showToast('កំហុស៖ ' + err.message, 'error')
    }
  }

  // Delete a monthly backup
  const handleDeleteMonthly = async (item) => {
    try {
      const res = await api('backup.deleteMonthly', { id: item.id, monthKey: item.monthKey })
      if (res?.success) {
        showToast(`បានលុប Backup ${item.monthKhmer || item.monthKey} ដោយជោគជ័យ`, 'success')
        setDeleteMonthlyModal({ open: false, item: null })
        await loadMonthlyBackups()
      } else {
        showToast('មិនអាចលុបបានទេ៖ ' + (res?.error || 'បញ្ហាប្រព័ន្ធ'), 'error')
      }
    } catch (err) {
      showToast('កំហុស៖ ' + err.message, 'error')
    }
  }

  // Toggle or change Auto-Backup Settings
  const handleUpdateAutoBackupSetting = (key, value) => {
    const updated = { ...autoBackupSettings, [key]: value }
    setAutoBackupSettings(updated)
    try {
      localStorage.setItem('school_auto_backup_settings', JSON.stringify(updated))
      showToast(key === 'enabled' ? (value ? 'បានបើកដំណើរការ Auto-Backup ប្រចាំខែ' : 'បានបិទដំណើរការ Auto-Backup') : 'បានធ្វើបច្ចុប្បន្នភាពកាលវិភាគ Auto-Backup', 'success')
    } catch {}
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
          ការកំណត់ទូទៅ
        </h2>
        <p className="text-slate-500 font-medium text-[13px] lg:text-sm sm:ml-13">
          គ្រប់គ្រងព័ត៌មានសាលារៀន ឆ្នាំសិក្សា គោលការណ៍វិន័យ និងការបម្រុងទុកទិន្នន័យ
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

              <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* School Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">ឈ្មោះសាលា <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <School size={16} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={schoolInfo.name}
                        onChange={(e) => setSchoolInfo({...schoolInfo, name: e.target.value})}
                        className="w-full bg-white border border-slate-200 text-slate-800 py-3 pl-10 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400 shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Principal */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">នាយកសាលា</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User size={16} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={schoolInfo.principal}
                        onChange={(e) => setSchoolInfo({...schoolInfo, principal: e.target.value})}
                        className="w-full bg-white border border-slate-200 text-slate-800 py-3 pl-10 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400 shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">លេខទូរស័ព្ទ</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone size={16} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={schoolInfo.phone}
                        onChange={(e) => setSchoolInfo({...schoolInfo, phone: e.target.value})}
                        className="w-full bg-white border border-slate-200 text-slate-800 py-3 pl-10 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400 shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="text-[13px] font-bold text-slate-700 ml-1">អាសយដ្ឋាន</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 pt-3.5 pointer-events-none">
                        <MapPin size={16} className="text-slate-400" />
                      </div>
                      <textarea 
                        value={schoolInfo.address}
                        onChange={(e) => setSchoolInfo({...schoolInfo, address: e.target.value})}
                        rows="3"
                        className="w-full bg-white border border-slate-200 text-slate-800 py-3 pl-10 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400 resize-none shadow-xs"
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
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-800">កំណត់កម្រិតវិន័យអវត្តមាន</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5 font-medium">កំណត់ចំនួនថ្ងៃអវត្តមានអត់ច្បាប់អតិបរមាមុនឈានដល់ការកោះហៅអាណាព្យាបាល (គិតជាថ្ងៃ)</p>
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
                      <span className="text-[14px] text-slate-500 font-bold">ថ្ងៃ</span>
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
                        className="w-24 bg-white border-slate-200 rounded-lg p-2.5 text-center font-bold text-[15px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" 
                      />
                      <span className="text-[14px] text-slate-500 font-bold">ថ្ងៃ</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-100 to-rose-50  rounded-xl p-4 flex items-start gap-3 mt-2">
                  <Shield size={20} className="text-danger shrink-0 mt-0.5" />
                  <p className="text-[13px] text-danger leading-relaxed font-medium">
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
          {/* Backup & Restore Tab */}
          {activeTab === 'backup' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-5">

              {/* Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                    <HardDrive size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-extrabold text-slate-800">Firebase Cloud</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400">
                      {lastBackupTime ? `Backup ចុងក្រោយ: ${lastBackupTime}` : 'មិនទាន់ Backup ក្នុង browser នេះទេ'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] font-bold text-slate-600">
                    <User size={11} className="text-indigo-500" />
                    <span>អ្នកប្រើ <strong className="text-slate-800">{(() => { try { return (JSON.parse(localStorage.getItem('school_users_cache') || '[]')).length } catch { return 1 } })()}</strong></span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] font-bold text-slate-600">
                    <GraduationCap size={11} className="text-emerald-500" />
                    <span>សិស្ស <strong className="text-slate-800">{(() => { try { return (JSON.parse(localStorage.getItem('school_students_cache') || '[]')).length } catch { return 0 } })()}</strong></span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] font-bold text-slate-600">
                    <CheckCircle2 size={11} className="text-blue-500" />
                    <span>វត្តមាន <strong className="text-slate-800">{(() => { try { return (JSON.parse(localStorage.getItem('school_attendance_records') || '[]')).length } catch { return 0 } })()}</strong></span>
                  </span>
                </div>
              </div>

              {/* Monthly Auto-Backup */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-extrabold text-slate-800">Auto-Backup ប្រចាំខែ</h4>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">រក្សាទុក Cloud ស្វ័យប្រវត្តិ · ទិន្នន័យ Admin ផ្ទៃក្នុង</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateMonthlyNow}
                    disabled={creatingMonthly}
                    className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white rounded-xl font-bold text-[12px] shadow-xs transition-all cursor-pointer disabled:opacity-60 shrink-0 self-start sm:self-auto"
                  >
                    {creatingMonthly ? (
                      <><Loader2 size={13} className="animate-spin" /> កំពុង Backup...</>
                    ) : (
                      <><RefreshCw size={13} /> Backup ខែនេះ</>
                    )}
                  </button>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/40">
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[12px] font-bold text-slate-700 block">Auto-Backup</span>
                      <span className="text-[10.5px] text-slate-400 font-medium">
                        {autoBackupSettings.enabled ? 'បើកដំណើរការ · រៀងរាល់ខែ' : 'បានបិទ'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(autoBackupSettings.enabled)}
                        onChange={(e) => handleUpdateAutoBackupSetting('enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[12px] font-bold text-slate-700 block">ថ្ងៃ Backup</span>
                      <span className="text-[10.5px] text-slate-400 font-medium">ថ្ងៃក្នុងខែ</span>
                    </div>
                    <select
                      value={autoBackupSettings.dayOfMonth || 1}
                      onChange={(e) => handleUpdateAutoBackupSetting('dayOfMonth', Number(e.target.value))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value={1}>ថ្ងៃទី ១ (លំនាំដើម)</option>
                      <option value={15}>ថ្ងៃទី ១៥</option>
                      <option value={25}>ថ្ងៃទី ២៥</option>
                      <option value={28}>ថ្ងៃទី ២៨ (ចុងខែ)</option>
                    </select>
                  </div>
                </div>

                {/* Archives List */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-[12.5px] font-extrabold text-slate-700 flex items-center gap-1.5">
                      <Database size={13} className="text-indigo-500" />
                      ប្រវត្តិ Backup ប្រចាំខែ
                    </h5>
                    <button
                      type="button"
                      onClick={loadMonthlyBackups}
                      disabled={loadingMonthly}
                      className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={11} className={loadingMonthly ? 'animate-spin' : ''} />
                      ផ្ទុកឡើងវិញ
                    </button>
                  </div>

                  {monthlyBackups.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                      <HardDrive size={26} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-[12px] font-bold text-slate-500">មិនទាន់មាន Backup ប្រចាំខែ</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ស្វ័យប្រវត្តិនៅថ្ងៃទី {autoBackupSettings.dayOfMonth || 1} · ឬចុច «Backup ខែនេះ»
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            <th className="py-2 px-3">ខែ</th>
                            <th className="py-2 px-3">ទិន្នន័យ</th>
                            <th className="py-2 px-3 hidden sm:table-cell">កាលបរិច្ឆេទ</th>
                            <th className="py-2 px-3 text-right">សកម្មភាព</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11.5px]">
                          {monthlyBackups.map((item) => (
                            <tr key={item.id || item.monthKey} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-extrabold text-slate-800 text-[12px] leading-tight">
                                  {item.monthKhmer || item.monthKey}
                                </div>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5 ${
                                  item.isAuto ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {item.isAuto ? 'Auto' : 'Manual'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2 flex-wrap text-[10.5px] text-slate-500 font-medium">
                                  <span>សិស្ស <strong className="text-slate-700">{item.counts?.students ?? 0}</strong></span>
                                  <span className="text-slate-200">|</span>
                                  <span>វត្តមាន <strong className="text-slate-700">{item.counts?.attendance ?? 0}</strong></span>
                                  <span className="text-slate-200">|</span>
                                  <span>Users <strong className="text-indigo-600">{item.counts?.users ?? 0}</strong></span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 hidden sm:table-cell text-[10.5px] text-slate-400 font-mono">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('km-KH') : item.monthKey}
                                {item.sizeKb && <div className="text-[9.5px] text-slate-300">{item.sizeKb} KB</div>}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadMonthly(item)}
                                    disabled={downloadingMonthKey === item.monthKey}
                                    className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer"
                                    title="ទាញយក .json"
                                  >
                                    {downloadingMonthKey === item.monthKey
                                      ? <Loader2 size={12} className="animate-spin" />
                                      : <Download size={12} />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRestoreFromMonthly(item)}
                                    className="flex items-center gap-1 py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] transition-colors cursor-pointer"
                                    title="ស្ដារទិន្នន័យ"
                                  >
                                    <Upload size={11} /> ស្ដារ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteMonthlyModal({ open: true, item })}
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                    title="លុប"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Backup & Restore */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Download */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Download size={16} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-extrabold text-slate-800">ទាញយក Backup</h4>
                      <span className="text-[10px] font-bold text-slate-400">Export · Download .json</span>
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold text-slate-600">
                      {['បញ្ជីសិស្ស', 'វត្តមានទាំងអស់', 'ថ្នាក់ · មុខវិជ្ជា', 'Users · Bots · ការកំណត់'].map(label => (
                        <div key={label} className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                          <Check size={11} className="text-indigo-500 shrink-0" />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleExportBackup}
                      disabled={exportingBackup}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold text-[12px] transition-all shadow-xs hover:shadow disabled:opacity-70 cursor-pointer"
                    >
                      {exportingBackup ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      {exportingBackup ? 'កំពុងទាញយក...' : 'ទាញយក Backup (.json)'}
                    </button>
                  </div>
                </div>

                {/* Restore */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Upload size={16} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-extrabold text-slate-800">ស្ដារទិន្នន័យ (Restore)</h4>
                      <span className="text-[10px] font-bold text-slate-400">Import · Sync to Cloud</span>
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div
                      onClick={() => backupFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/20 rounded-xl py-6 flex flex-col items-center gap-1.5 cursor-pointer transition-all group"
                    >
                      <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all border border-slate-100">
                        <FileCheck size={16} />
                      </div>
                      <span className="text-[12px] font-bold text-slate-600 group-hover:text-emerald-700 transition-colors">ជ្រើសរើសឯកសារ .json</span>
                      <span className="text-[10px] text-slate-400">គាំទ្រ JSON Backup ពីប្រព័ន្ធ</span>
                      <input
                        type="file"
                        ref={backupFileInputRef}
                        onChange={handleBackupFileSelect}
                        accept=".json,application/json"
                        className="hidden"
                      />
                    </div>
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-2.5">
                      <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10.5px] font-medium text-amber-800 leading-relaxed">
                        Restore នឹងធ្វើបច្ចុប្បន្នភាព Cloud Firestore · អ្នកត្រូវបញ្ជាក់មុនពេលអនុវត្ត
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-rose-50/50 border border-rose-200/70 rounded-2xl px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                      <Trash2 size={15} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-extrabold text-rose-900">Danger Zone · សម្អាតទិន្នន័យ</h4>
                      <p className="text-[10.5px] font-medium text-rose-500">លុបទិន្នន័យតេស្ត · Reset ប្រព័ន្ធ</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => setCleanModal({ open: true, type: 'attendance' })}
                      className="flex items-center gap-1.5 py-2 px-3.5 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-700 rounded-xl font-bold text-[11.5px] transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 size={13} /> សម្អាតវត្តមាន
                    </button>
                    <button
                      onClick={() => setCleanModal({ open: true, type: 'all' })}
                      className="flex items-center gap-1.5 py-2 px-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl font-bold text-[11.5px] transition-all cursor-pointer whitespace-nowrap"
                    >
                      <AlertTriangle size={13} /> សម្អាតទាំងអស់
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
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400">អ្នកប្រើប្រាស់ (Users)</span>
                  <span className="text-[16px] font-black text-indigo-600">
                    {pendingRestoreData.counts?.users ?? (pendingRestoreData.data?.users?.length || 0)} នាក់
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400">ការកំណត់ប្រព័ន្ធ</span>
                  <span className="text-[16px] font-black text-emerald-600">
                    {pendingRestoreData.data?.settings ? 'រួមបញ្ចូល' : 'លំនាំដើម'}
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

      {/* Delete Monthly Backup Modal */}
      {deleteMonthlyModal.open && deleteMonthlyModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h4 className="text-[16px] font-black text-slate-800 mb-1">លុប Backup ប្រចាំខែ?</h4>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-5">
              តើអ្នកប្រាកដថាចង់លុបឯកសារ Backup សម្រាប់ <b>{deleteMonthlyModal.item.monthKhmer || deleteMonthlyModal.item.monthKey}</b> នេះឬទេ?
            </p>
            <div className="flex items-center gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => setDeleteMonthlyModal({ open: false, item: null })}
                className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 transition-colors cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMonthly(deleteMonthlyModal.item)}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[13px] transition-colors shadow-xs cursor-pointer"
              >
                យល់ព្រម លុប
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
