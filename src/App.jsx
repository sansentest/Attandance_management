import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Attendance from './components/Attendance'
import Report from './components/Report'
import AdminLayout from './components/admin/AdminLayout'
import { loadSession, clearSession } from './utils/api'
import { Home, ListChecks, LogOut, X } from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('attendance')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Check for existing session on load
  useEffect(() => {
    const existingSession = loadSession()
    if (existingSession) {
      setSession(existingSession)
      setActiveTab('attendance')
    }
  }, [])

  const handleLogin = (sessionData) => {
    setSession(sessionData)
    setActiveTab('attendance')
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    clearSession()
    setSession(null)
    setShowLogoutConfirm(false)
  }

  if (!session) {
    return <Login onLogin={handleLogin} />
  }

  // Admin Routing
  if (session.role === 'admin') {
    return (
      <>
        <AdminLayout session={session} onLogout={handleLogout} />
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowLogoutConfirm(false)}></div>
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative z-10 animate-in fade-in zoom-in-95 duration-200">
              <button 
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                onClick={() => setShowLogoutConfirm(false)}
              >
                <X size={18} />
              </button>
              
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-16 h-16 bg-red-50 text-danger rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                  <LogOut size={28} strokeWidth={2.5} className="ml-1" />
                </div>
                <h3 className="text-[20px] font-extrabold text-slate-800 mb-2">ចាកចេញពីគណនី</h3>
                <p className="text-[15px] font-medium text-slate-500 mb-8 px-2">
                  តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?
                </p>

                <div className="flex gap-3 w-full">
                  <button 
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    onClick={() => setShowLogoutConfirm(false)}
                  >
                    បោះបង់
                  </button>
                  <button 
                    className="flex-1 py-3 px-4 rounded-xl bg-danger hover:bg-red-600 font-bold text-white shadow-md hover:shadow-lg transition-all"
                    onClick={confirmLogout}
                  >
                    ចាកចេញ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Define tabs - ONLY Home and Attendance for Monitors
  const tabs = [
    { id: 'dashboard', label: 'ទំព័រដើម', icon: Home },
    { id: 'attendance', label: 'វត្តមាន', icon: ListChecks },
  ]

  return (
    <div className="relative min-h-screen pb-[80px] bg-bg-base font-[family-name:var(--font-primary)]">
      {/* Page Content */}
      <div className="page-enter">
        {activeTab === 'dashboard' && <Dashboard session={session} onLogout={handleLogout} onNavigate={setActiveTab} />}
        {activeTab === 'attendance' && <Attendance session={session} onNavigate={setActiveTab} onLogout={handleLogout} />}
        {activeTab === 'report' && <Report session={session} onNavigate={setActiveTab} />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-white/95 backdrop-blur-xl border-t border-border-main flex items-center justify-around z-[100] shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 min-w-[64px] p-2 rounded-md transition-all duration-200 border-none bg-transparent cursor-pointer
                ${isActive ? 'text-accent font-bold' : 'text-text-muted hover:text-text-secondary font-medium'}`}
            >
              <tab.icon size={isActive ? 26 : 24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] tracking-wide font-medium">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowLogoutConfirm(false)}></div>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <button 
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <X size={18} />
            </button>
            
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 bg-red-50 text-danger rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                <LogOut size={28} strokeWidth={2.5} className="ml-1" />
              </div>
              <h3 className="text-[20px] font-extrabold text-slate-800 mb-2">ចាកចេញពីគណនី</h3>
              <p className="text-[15px] font-medium text-slate-500 mb-8 px-2">
                តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  បោះបង់
                </button>
                <button 
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-[0_4px_14px_0_rgb(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5 transition-all"
                  onClick={confirmLogout}
                >
                  ចាកចេញ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
