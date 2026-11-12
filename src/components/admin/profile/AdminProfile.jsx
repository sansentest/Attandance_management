import { useState, useRef, useEffect } from 'react'
import { 
  User, 
  Save, 
  Upload, 
  Mail, 
  Phone, 
  Shield, 
  Camera, 
  CheckCircle2, 
  Loader2, 
  Info, 
  Lock, 
  Eye, 
  EyeOff, 
  Trash2, 
  KeyRound, 
  Check, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react'
import { api, loadSession, saveSession } from '../../../utils/api'
import { formatRoleLabel } from '../../../utils/accessControl'

// Helper function to compress images to a high-quality lightweight Base64 string (~40-60KB)
const compressImage = (file, maxWidth = 512, maxHeight = 512, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

export default function AdminProfile({ session, onUpdateSession }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const fileInputRef = useRef(null)

  // Password visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Current user DB record reference
  const [userDbId, setUserDbId] = useState('')
  const [allUsersList, setAllUsersList] = useState([])

  // Profile Form State
  const [profile, setProfile] = useState(() => {
    const active = session || loadSession() || {}
    return {
      id: active.id || 'USR-ADMIN',
      name: active.fullName || active.name || active.username || 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
      username: active.username || 'admin',
      email: active.email || 'admin@angroka.edu.kh',
      phone: active.phone || '',
      role: active.role === 'admin' ? 'អ្នកគ្រប់គ្រងប្រព័ន្ធ (Super Admin)' : formatRoleLabel(active.role),
      avatar: active.avatar || null,
      lastLogin: active.lastLogin || '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  // Load latest live user data from Database/LocalStorage on mount
  useEffect(() => {
    let isMounted = true
    const active = session || loadSession() || {}
    const activeUsername = (active.username || 'admin').toLowerCase()

    const fetchLiveUser = async () => {
      setLoading(true)
      try {
        const res = await api('users.getAll')
        if (res?.success && Array.isArray(res.data) && isMounted) {
          setAllUsersList(res.data)
          const matched = res.data.find(u => 
            (u.username || '').toLowerCase() === activeUsername ||
            u.id === active.id ||
            (active.role === 'admin' && u.role === 'admin')
          )

          if (matched) {
            setUserDbId(matched.id)
            setProfile(prev => ({
              ...prev,
              id: matched.id,
              name: matched.name || prev.name,
              username: matched.username || prev.username,
              email: matched.email || prev.email,
              phone: matched.phone || prev.phone,
              avatar: matched.avatar || prev.avatar,
              role: matched.role === 'admin' ? 'អ្នកគ្រប់គ្រងប្រព័ន្ធ (Super Admin)' : (matched.role || prev.role),
              lastLogin: matched.lastLogin || prev.lastLogin
            }))
          }
        }
      } catch (err) {
        console.warn('Failed to load profile data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchLiveUser()
    return () => { isMounted = false }
  }, [session])

  // Avatar Upload Handler
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('សូមជ្រើសរើសប្រភេទឯកសារជារូបភាព (PNG, JPG, WebP)')
      setTimeout(() => setErrorMessage(''), 4000)
      return
    }

    try {
      const compressedDataUrl = await compressImage(file, 512, 512, 0.88)
      setProfile(prev => ({ ...prev, avatar: compressedDataUrl }))
      setSuccessMessage('បានផ្ទុករូបភាពជោគជ័យ! សូមចុច "រក្សាទុកការកែប្រែ"')
      setTimeout(() => setSuccessMessage(''), 3500)
    } catch (err) {
      console.error('Image compression failed:', err)
      setErrorMessage('ការផ្ទុករូបភាពបរាជ័យ។ សូមព្យាយាមម្តងទៀត។')
      setTimeout(() => setErrorMessage(''), 4000)
    }
  }

  // Remove Avatar Handler
  const handleRemoveAvatar = (e) => {
    e.stopPropagation()
    setProfile(prev => ({ ...prev, avatar: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
    setSuccessMessage('បានដករូបភាពចេញ។ សូមចុច "រក្សាទុកការកែប្រែ"')
    setTimeout(() => setSuccessMessage(''), 3500)
  }

  // Save Profile Handler
  const handleSave = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    // Validation
    if (!profile.name.trim()) {
      setErrorMessage('សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់!')
      return
    }

    if (profile.newPassword) {
      if (profile.newPassword.length < 8) {
        setErrorMessage('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៨ តួអក្សរ!')
        return
      }
      if (profile.newPassword !== profile.confirmPassword) {
        setErrorMessage('ពាក្យសម្ងាត់ថ្មី និងការបញ្ជាក់ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ!')
        return
      }
    }

    setSaving(true)

    try {
      const active = session || loadSession() || {}
      const targetId = userDbId || profile.id || active.id || 'USR-ADMIN'

      // Find existing user in DB
      const existingUser = allUsersList.find(u => u.id === targetId || (u.username || '').toLowerCase() === profile.username.toLowerCase())

      const targetRole = existingUser?.role || active.role || 'admin'
      const userToSave = {
        id: targetId,
        name: profile.name.trim(),
        username: profile.username || 'admin',
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        avatar: profile.avatar || null,
        role: targetRole,
        class: existingUser?.class || (targetRole === 'admin' ? 'ALL' : (active.className || '-')),
        status: existingUser?.status || 'active',
        ...(profile.newPassword ? { password: profile.newPassword } : (existingUser?.password ? { password: existingUser.password } : {})),
        lastModified: new Date().toISOString()
      }

      // 1. Save to Database (Firestore & LocalStorage)
      const saveRes = await api('users.save', { user: userToSave })

      if (!saveRes?.success) {
        throw new Error(saveRes?.error || 'ការរក្សាទុកបរាជ័យ')
      }

      // 2. Update active session in LocalStorage
      const currentSess = loadSession() || session || {}
      const updatedSession = {
        ...currentSess,
        id: userToSave.id,
        username: userToSave.username,
        fullName: userToSave.name,
        email: userToSave.email,
        phone: userToSave.phone,
        avatar: userToSave.avatar,
        role: userToSave.role
      }
      saveSession(updatedSession)

      // 3. Inform parent layout/app to trigger live navbar/dropdown updates
      if (onUpdateSession) {
        onUpdateSession(updatedSession)
      }

      // 4. Update local state
      setUserDbId(userToSave.id)
      setProfile(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }))

      setSaveSuccess(true)
      setSuccessMessage('ព័ត៌មានប្រវត្តិរូបត្រូវបានរក្សាទុកដោយជោគជ័យ!')
      setTimeout(() => {
        setSaveSuccess(false)
        setSuccessMessage('')
      }, 4000)

    } catch (err) {
      console.error('Error saving profile:', err)
      setErrorMessage(err.message || 'មានបញ្ហាក្នុងការរក្សាទុកព័ត៌មាន')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Header Summary */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl lg:text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
              <User size={22} strokeWidth={2.5} />
            </div>
            ប្រវត្តិរូបអ្នកប្រើប្រាស់
          </h2>
          <p className="text-slate-500 font-medium text-[13px] lg:text-sm sm:ml-13">
            កែប្រែព័ត៌មានផ្ទាល់ខ្លួន រូបថតតំណាង និងសុវត្ថិភាពគណនីរបស់អ្នកគ្រប់គ្រង
          </p>
        </div>

        {/* Global Save Button in Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-6 rounded-xl font-bold text-[13px] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
          >
            {saving ? (
              <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 size={16} strokeWidth={2.5} className="text-emerald-200" />
            ) : (
              <Save size={16} strokeWidth={2.5} />
            )}
            {saving ? 'កំពុងរក្សាទុក...' : saveSuccess ? 'បានរក្សាទុក!' : 'រក្សាទុកការកែប្រែ'}
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 font-bold text-[13px] animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle size={20} className="text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 font-bold text-[13px] animate-in fade-in slide-in-from-top-2 duration-300 shadow-xs">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative flex-1 min-h-[500px]">
        
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-100/60 text-indigo-600 p-2 rounded-xl">
              <Info size={18} strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-[14px]">ព័ត៌មានលម្អិតនៃគណនីអ្នកគ្រប់គ្រង</span>
              <span className="hidden sm:inline text-slate-400 text-[12px] font-medium ml-2">
                (គណនីភ្ជាប់ផ្ទាល់ជាមួយ Database)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              គណនីកំពុងដំណើរការ
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 lg:p-10 flex-1 overflow-y-auto relative custom-scrollbar bg-slate-50/30">
          
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10">
            
            {/* Left Column: Avatar & Profile Summary Card */}
            <div className="flex flex-col items-center gap-5 lg:w-[320px] shrink-0">
              
              {/* Premium Avatar Card */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full flex flex-col items-center relative overflow-hidden group/card">
                
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover/card:scale-110 duration-700"></div>

                {/* Animated Avatar Wrapper */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group/avatar cursor-pointer"
                  title="ចុចដើម្បីប្តូររូបថតតំណាង"
                >
                  {/* Spinning Dashed Ring Animation */}
                  <div className="absolute -inset-3 rounded-full border-2 border-dashed border-indigo-200/70 group-hover/avatar:border-indigo-500 group-hover/avatar:animate-[spin_12s_linear_infinite] transition-colors duration-300"></div>
                  
                  {/* Glowing Pulse Background */}
                  <div className="absolute inset-0 bg-indigo-400 rounded-full blur-lg opacity-0 group-hover/avatar:opacity-20 transition-opacity duration-300"></div>

                  <div className="w-40 h-40 rounded-full border-[6px] border-white bg-slate-100 flex flex-col items-center justify-center overflow-hidden shadow-[0_8px_25px_rgb(0,0,0,0.08)] relative z-10 transition-transform duration-300 group-hover/avatar:scale-95">
                    {profile.avatar ? (
                      <>
                        <img 
                          src={profile.avatar} 
                          alt="Profile Avatar" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" 
                        />
                        <div className="absolute inset-0 bg-indigo-950/45 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                          <Camera className="text-white transform -translate-y-2 group-hover/avatar:translate-y-0 transition-all duration-300" size={32} />
                        </div>
                      </>
                    ) : (
                      <>
                        <User size={56} className="text-slate-300 group-hover/avatar:text-indigo-400 transition-colors" />
                        <div className="absolute inset-0 bg-indigo-950/50 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                          <Camera className="text-white mb-1 transform -translate-y-2 group-hover/avatar:translate-y-0 transition-all duration-300" size={28} />
                          <span className="text-[11px] font-bold text-white uppercase tracking-wider">ផ្ទុករូបភាព</span>
                        </div>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      className="hidden" 
                    />
                  </div>
                  
                  {/* Small Upload Icon Badge */}
                  <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-indigo-600 border-4 border-white flex items-center justify-center text-white shadow-lg z-20 group-hover/avatar:bg-indigo-500 transition-colors group-hover/avatar:scale-110 duration-300">
                    <Upload size={16} strokeWidth={3} className="group-hover/avatar:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

                {/* Remove Avatar Button if Avatar Exists */}
                {profile.avatar && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-[12px] font-bold border border-rose-100 transition-colors"
                  >
                    <Trash2 size={13} />
                    ដករូបភាពចេញ
                  </button>
                )}
                
                <div className="text-center mt-6 w-full relative z-10">
                  <h3 className="text-[19px] font-black text-slate-800 leading-snug">
                    {profile.name || 'Admin'}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 bg-indigo-50/80 px-3.5 py-1.5 rounded-full mt-2.5 border border-indigo-100/60 shadow-2xs">
                    <Shield size={14} className="text-indigo-600" />
                    <span className="text-[12px] font-bold text-indigo-700">{profile.role}</span>
                  </div>
                </div>

                {/* Account metadata bullets */}
                <div className="w-full mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5 text-[12px]">
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>ឈ្មោះគណនី (ID):</span>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                      @{profile.username}
                    </span>
                  </div>
                  {profile.lastLogin && (
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>ចូលប្រព័ន្ធចុងក្រោយ:</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {profile.lastLogin}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>សិទ្ធិចូលដំណើរការ:</span>
                    <span className="font-bold text-indigo-600 flex items-center gap-1">
                      <Sparkles size={12} />
                      ពេញលេញ (Full Access)
                    </span>
                  </div>
                </div>
              </div>

              {/* Photo Upload Hint */}
              <div className="bg-indigo-50/70 border border-indigo-100/60 rounded-2xl p-4 w-full flex items-start gap-3">
                <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[12px] font-medium text-indigo-800/80 leading-relaxed">
                  រូបភាពនឹងត្រូវបានបង្រួមទំហំដោយស្វ័យប្រវត្តិដើម្បីធានាការផ្ទុកលឿន និងរក្សាទុកក្នុង <strong>Firebase Cloud</strong> ជាមួយគណនីរបស់អ្នក។
                </p>
              </div>
            </div>

            {/* Right Column: Forms & Security */}
            <div className="flex-1 flex flex-col gap-6">
              
              {/* Card 1: General Profile Details */}
              <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                
                <h3 className="text-[17px] font-black text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                  <div className="w-1.5 h-5 bg-indigo-600 rounded-full"></div>
                  ព័ត៌មានផ្ទាល់ខ្លួន
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 relative z-10">
                  
                  {/* Full Name */}
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                      ឈ្មោះអ្នកប្រើប្រាស់ / ឈ្មោះបង្ហាញ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={18} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="ឧ. ឈ្មោះពេញរបស់អ្នក"
                        className="w-full bg-slate-50/60 hover:bg-slate-50 border border-slate-200 text-slate-800 py-3.5 pl-11 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Username (Read-only) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-700 flex items-center justify-between">
                      <span>ឈ្មោះគណនី (Username)</span>
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Lock size={11} /> មិនអាចកែប្រែបាន
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={profile.username}
                        readOnly
                        disabled
                        className="w-full bg-slate-100/80 border border-slate-200 text-slate-500 py-3.5 pl-11 pr-4 rounded-xl font-bold text-[14px] cursor-not-allowed select-none font-mono"
                      />
                    </div>
                  </div>

                  {/* System Role (Read-only) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                      តួនាទីក្នុងប្រព័ន្ធ
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Shield size={18} className="text-indigo-500" />
                      </div>
                      <input 
                        type="text" 
                        value={profile.role}
                        readOnly
                        disabled
                        className="w-full bg-indigo-50/40 border border-indigo-100 text-indigo-700 py-3.5 pl-11 pr-4 rounded-xl font-bold text-[14px] cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                      អាសយដ្ឋានអ៊ីមែល
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={18} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      </div>
                      <input 
                        type="email" 
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        placeholder="admin@angroka.edu.kh"
                        className="w-full bg-slate-50/60 hover:bg-slate-50 border border-slate-200 text-slate-800 py-3.5 pl-11 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                      លេខទូរស័ព្ទ
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone size={18} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      </div>
                      <input 
                        type="tel" 
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="012 345 678"
                        className="w-full bg-slate-50/60 hover:bg-slate-50 border border-slate-200 text-slate-800 py-3.5 pl-11 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 2: Password & Security */}
              <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[17px] font-black text-slate-800 flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-amber-500 rounded-full"></div>
                    សុវត្ថិភាព និងពាក្យសម្ងាត់
                  </h3>
                  <span className="text-[12px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    ស្រេចចិត្ត (Optional)
                  </span>
                </div>

                <p className="text-[13px] font-medium text-slate-500 mb-6 leading-relaxed">
                  ប្រសិនបើអ្នកមិនចង់ប្តូរពាក្យសម្ងាត់ទេ សូមទុកប្រអប់ខាងក្រោមឱ្យនៅទំនេរ។ ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ <strong>៨ តួអក្សរ</strong>។
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                  
                  {/* New Password */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                      ពាក្យសម្ងាត់ថ្មី
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <KeyRound size={18} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      </div>
                      <input 
                        type={showNewPassword ? 'text' : 'password'}
                        value={profile.newPassword}
                        onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-50/60 hover:bg-slate-50 border border-slate-200 text-slate-800 py-3.5 pl-11 pr-11 rounded-xl font-bold text-[14px] focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:text-slate-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                      បញ្ជាក់ពាក្យសម្ងាត់ថ្មី
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <KeyRound size={18} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      </div>
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={profile.confirmPassword}
                        onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-50/60 hover:bg-slate-50 border border-slate-200 text-slate-800 py-3.5 pl-11 pr-11 rounded-xl font-bold text-[14px] focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:text-slate-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-3 px-8 rounded-xl font-bold text-[14px] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle2 size={18} strokeWidth={2.5} className="text-emerald-200" />
                  ) : (
                    <Save size={18} strokeWidth={2.5} />
                  )}
                  {saving ? 'កំពុងរក្សាទុក...' : saveSuccess ? 'បានរក្សាទុកជោគជ័យ!' : 'រក្សាទុកការកែប្រែ'}
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
