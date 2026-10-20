import { useState, useRef } from 'react'
import { User, Save, Upload, Mail, Phone, Shield, Camera, CheckCircle2, Loader2, Info } from 'lucide-react'

export default function AdminProfile() {
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: 'admin@angroka.edu.kh',
    phone: '012 345 678',
    role: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ (Super Admin)',
    avatar: null
  })

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }, 1200)
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setProfile(prev => ({ ...prev, avatar: imageUrl }))
    }
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Header Summary (Matching other pages) */}
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-xl lg:text-2xl font-black text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
            <User size={22} strokeWidth={2.5} />
          </div>
          ប្រវត្តិរូបអ្នកប្រើប្រាស់
        </h2>
        <p className="text-slate-500 font-medium text-[13px] lg:text-sm sm:ml-13">
          កែប្រែព័ត៌មានផ្ទាល់ខ្លួន និងគណនីប្រើប្រាស់ប្រព័ន្ធ
        </p>
      </div>

      {/* Main Content Card (Matching AdminSettings & AdminAcademic) */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative flex-1 min-h-[500px]">
        
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100/50 text-indigo-600 p-2 rounded-lg">
              <Info size={18} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-700 text-[14px]">ព័ត៌មានលម្អិតនៃគណនី</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Save Button */}
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-6 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {saving ? (
                <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 size={16} strokeWidth={2.5} />
              ) : (
                <Save size={16} strokeWidth={2.5} />
              )}
              {saving ? 'កំពុងរក្សាទុក...' : saveSuccess ? 'បានរក្សាទុក' : 'រក្សាទុកការកែប្រែ'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 lg:p-10 flex-1 overflow-y-auto relative custom-scrollbar bg-slate-50/30">
          
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10">
            
            {/* Left Side: Avatar Upload */}
            <div className="flex flex-col items-center gap-5 lg:w-[320px] shrink-0">
              
              {/* Premium Avatar Upload Card */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full flex flex-col items-center relative overflow-hidden group/card">
                
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover/card:scale-110 duration-700"></div>

                {/* Animated Avatar Wrapper */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group/avatar cursor-pointer"
                >
                  {/* Spinning Dashed Ring Animation */}
                  <div className="absolute -inset-3 rounded-full border-2 border-dashed border-indigo-200/60 group-hover/avatar:border-indigo-400 group-hover/avatar:animate-[spin_10s_linear_infinite] transition-colors duration-300"></div>
                  
                  {/* Glowing Pulse Background */}
                  <div className="absolute inset-0 bg-indigo-400 rounded-full blur-lg opacity-0 group-hover/avatar:opacity-20 transition-opacity duration-300"></div>

                  <div className="w-40 h-40 rounded-full border-[6px] border-white bg-slate-50 flex flex-col items-center justify-center overflow-hidden shadow-[0_8px_20px_rgb(0,0,0,0.08)] relative z-10 transition-transform duration-300 group-hover/avatar:scale-95">
                    {profile.avatar ? (
                      <>
                        <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" />
                        <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                          <Camera className="text-white transform -translate-y-4 group-hover/avatar:translate-y-0 transition-all duration-300" size={32} />
                        </div>
                      </>
                    ) : (
                      <>
                        <User size={54} className="text-slate-300 group-hover/avatar:text-indigo-200 transition-colors" />
                        <div className="absolute inset-0 bg-indigo-900/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                          <Camera className="text-white mb-1 transform -translate-y-4 group-hover/avatar:translate-y-0 transition-all duration-300" size={28} />
                          <span className="text-[11px] font-bold text-white uppercase tracking-wider transform translate-y-4 group-hover/avatar:translate-y-0 transition-all duration-300 delay-75">Upload</span>
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
                
                <div className="text-center mt-8 w-full relative z-10">
                  <h3 className="text-[20px] font-black text-slate-800">{profile.name}</h3>
                  <div className="inline-flex items-center gap-1.5 bg-indigo-50/80 px-4 py-1.5 rounded-full mt-2 border border-indigo-100/50">
                    <Shield size={14} className="text-indigo-500" />
                    <span className="text-[12px] font-bold text-indigo-600">{profile.role}</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100/60 rounded-2xl p-4 w-full flex items-start gap-3">
                <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[12px] font-medium text-indigo-700/80 leading-relaxed">
                  ទំហំរូបភាពដែលណែនាំគឺអប្បបរមា <strong>500x500px</strong> និងជាប្រភេទឯកសារ <strong>PNG</strong> ឬ <strong>JPG</strong>។
                </p>
              </div>
            </div>

            {/* Right Side: Form Inputs Wrapped in a Premium Card */}
            <div className="flex-1">
              <div className="bg-white rounded-3xl p-6 lg:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                
                <h3 className="text-[18px] font-black text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                  ព័ត៌មានលម្អិត
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8 relative z-10">
                  
                  {/* Full Name */}
                  <div className="flex flex-col gap-2.5 sm:col-span-2">
                    <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                      ឈ្មោះអ្នកប្រើប្រាស់ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 text-slate-800 py-3.5 pl-11 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                      អាសយដ្ឋានអ៊ីមែល
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input 
                        type="email" 
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 text-slate-800 py-3.5 pl-11 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                      លេខទូរស័ព្ទ
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 text-slate-800 py-3.5 pl-11 pr-4 rounded-xl font-bold text-[14px] focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 w-full h-px bg-slate-100 my-2"></div>

                  {/* Role (Read only) */}
                  <div className="flex flex-col gap-2.5 sm:col-span-2">
                    <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                      តួនាទីក្នុងប្រព័ន្ធ
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Shield size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={profile.role}
                        readOnly
                        className="w-full bg-slate-100/80 border border-slate-200 text-slate-500 py-3.5 pl-11 pr-4 rounded-xl font-bold text-[14px] cursor-not-allowed opacity-80"
                      />
                    </div>
                    <p className="text-[12px] font-medium text-slate-500 ml-1 flex items-center gap-1.5 mt-1">
                      <Info size={14} className="text-slate-400" />
                      ទាក់ទងទៅកាន់អ្នកគ្រប់គ្រងប្រព័ន្ធផ្ទាល់ ដើម្បីស្នើសុំផ្លាស់ប្តូរតួនាទីគណនី។
                    </p>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
