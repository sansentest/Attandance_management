import { useState } from 'react'
import { api, saveSession } from '../utils/api'
import { User, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    let valid = true
    const errors = {}

    if (!username) {
      errors.username = 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់'
      valid = false
    } else if (username.length > 30 || !/^[A-Za-z0-9_]{3,30}$/.test(username)) {
      errors.username = 'ទម្រង់ឈ្មោះមិនត្រឹមត្រូវទេ'
      valid = false
    }

    if (!password) {
      errors.password = 'សូមបញ្ចូលពាក្យសម្ងាត់'
      valid = false
    } else if (password.length < 8) {
      errors.password = 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៨ តួអក្សរ'
      valid = false
    }

    if (!valid) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    try {
      const result = await api('auth.login', { username, password })
      
      if (!result.success) {
        setError(result.error || 'ការចូលប្រព័ន្ធបរាជ័យ។ សូមពិនិត្យមើលព័ត៌មានរបស់អ្នកម្ដងទៀត។')
        setFieldErrors({ username: 'error', password: 'error' })
        setLoading(false)
        return
      }

      saveSession(result.data)
      onLogin(result.data)
    } catch (err) {
      setError('មានបញ្ហាក្នុងការភ្ជាប់ទៅប្រព័ន្ធ។')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden font-[family-name:var(--font-primary)]">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-indigo-300/30 via-purple-300/30 to-fuchsia-300/30 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-sky-300/30 via-blue-300/30 to-cyan-300/30 blur-[100px] pointer-events-none"></div>
      
      {/* Container */}
      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8 animate-in slide-in-from-bottom-5 fade-in duration-700">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20"></div>
            <div className="w-[100px] h-[100px] rounded-full bg-white flex items-center justify-center shadow-xl shadow-indigo-500/10 p-3 transform transition-transform hover:scale-105 duration-500 border border-slate-50 relative z-10">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Emblem_of_the_Ministry_of_Education%2C_Youth_and_Sport_%28Cambodia%29.svg" alt="MoEYS Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
          </div>
          <h1 className="text-[32px] font-black text-slate-800 tracking-tight text-center leading-tight">
            វិទ្យាល័យអង្គរកា
          </h1>
          <p className="text-[15px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-sky-500 mt-2 tracking-wide uppercase">
            ប្រព័ន្ធគ្រប់គ្រងវត្តមានសិស្ស
          </p>
        </div>
        
        {/* Login Card */}
        <div className="w-full bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white relative animate-in slide-in-from-bottom-10 fade-in duration-700 delay-150 fill-mode-both">
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            
            {/* Username Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={20} className={`transition-colors duration-300 ${fieldErrors.username ? 'text-red-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
              </div>
              <input 
                className={`w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-[15px] font-medium text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] ${fieldErrors.username ? '!border-red-500 !bg-red-50/50 focus:!shadow-[0_0_0_4px_rgba(239,68,68,0.1)]' : ''}`}
                type="text" 
                id="inp-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username" 
                autoCapitalize="none"
                maxLength="30" 
                spellCheck="false"
                placeholder="ឈ្មោះអ្នកប្រើប្រាស់" 
                required 
              />
              {fieldErrors.username && <div className="text-[12px] text-red-500 font-bold mt-1.5 ml-2 animate-in fade-in slide-in-from-top-1 duration-200">{fieldErrors.username}</div>}
            </div>
            
            {/* Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={20} className={`transition-colors duration-300 ${fieldErrors.password ? 'text-red-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
              </div>
              <input 
                className={`w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-[15px] font-medium text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] ${fieldErrors.password ? '!border-red-500 !bg-red-50/50 focus:!shadow-[0_0_0_4px_rgba(239,68,68,0.1)]' : ''}`}
                type="password" 
                id="inp-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                maxLength="128"
                placeholder="ពាក្យសម្ងាត់" 
                required 
              />
              {fieldErrors.password && <div className="text-[12px] text-red-500 font-bold mt-1.5 ml-2 animate-in fade-in slide-in-from-top-1 duration-200">{fieldErrors.password}</div>}
            </div>
            
            {/* Generic Error Message */}
            {error && (
              <div className="bg-red-50 text-danger text-[13px] font-bold px-4 py-3.5 rounded-2xl border border-red-100 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}
            
            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-bold text-[16px] py-4 rounded-2xl mt-4 transition-all duration-500 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none shadow-[0_8px_30px_rgb(99,102,241,0.3)] hover:shadow-[0_12px_40px_rgb(99,102,241,0.4)] hover:-translate-y-0.5 active:translate-y-0" 
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={22} /> <span>កំពុងផ្ទៀងផ្ទាត់...</span></>
              ) : (
                <><span>ចូលប្រើប្រាស់</span> <ArrowRight size={20} className="ml-1" /></>
              )}
            </button>
            
          </form>
        </div>

        <div className="mt-10 text-[13px] font-medium text-slate-400 text-center relative z-10 animate-in fade-in duration-700 delay-300 fill-mode-both">
          &copy; {new Date().getFullYear()} ប្រព័ន្ធគ្រប់គ្រងសាលារៀន. រក្សាសិទ្ធិគ្រប់យ៉ាង.
        </div>
      </div>
    </div>
  )
}
