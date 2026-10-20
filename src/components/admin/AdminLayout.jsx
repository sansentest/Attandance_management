import { useState, useRef, useEffect } from 'react'
import { LayoutDashboard, FileText, Settings, LogOut, Menu, X, Bell, User, ChevronDown, Users, Bot, BookOpen, Mail, ShieldAlert, Database, Edit, GraduationCap } from 'lucide-react'
import AdminDashboard from './dashboard/AdminDashboard'
import AdminStudentAttendance from './attendance/AdminStudentAttendance'
import AdminStudentTracking from './tracking/AdminStudentTracking'
import AdminSettings from './settings/AdminSettings'
import AdminUsers from './users/AdminUsers'
import AdminTelegramBot from './telegram/AdminTelegramBot'
import AdminAcademic from './academic/AdminAcademic'
import AdminProfile from './profile/AdminProfile'
import AdminInvitationLetters from './invitation/AdminInvitationLetters'
import AdminStudents from './students/AdminStudents'

export default function AdminLayout({ session, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [attendanceMenuOpen, setAttendanceMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('session')
    onLogout()
  }

  const renderPage = () => {
    switch(activePage) {
      case 'dashboard': return <AdminDashboard />
      case 'student_attendance': return <AdminStudentAttendance />
      case 'student_tracking': return <AdminStudentTracking onNavigate={setActivePage} />
      case 'invitation-letters': return <AdminInvitationLetters />
      case 'students': return <AdminStudents />
      case 'users': return <AdminUsers />
      case 'telegram': return <AdminTelegramBot />
      case 'academic': return <AdminAcademic />
      case 'settings': return <AdminSettings />
      case 'profile': return <AdminProfile />
      default: return <AdminDashboard />
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'ផ្ទាំងគ្រប់គ្រងទូទៅ', icon: LayoutDashboard },
    { 
      id: 'attendance_group', 
      label: 'Attendance', 
      icon: FileText,
      subItems: [
        { id: 'student_attendance', label: 'អវត្តមានសិស្ស' },
        { id: 'student_tracking', label: 'តាមដានអវត្តមានសិស្ស' }
      ]
    },
    { id: 'invitation-letters', label: 'លិខិតកោះហៅ', icon: Mail },
    { id: 'students', label: 'បញ្ជីសិស្ស', icon: GraduationCap },
    { id: 'users', label: 'អ្នកប្រើប្រាស់', icon: Users },
    { id: 'telegram', label: 'Telegram Bot', icon: Bot },
    { id: 'academic', label: 'ថ្នាក់ & មុខវិជ្ជា', icon: BookOpen },
    { id: 'settings', label: 'ការកំណត់', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-[#F8FAFC] selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Desktop Sidebar - Clean Unified Theme matching Dashboard */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-white z-20 shrink-0 border-r border-slate-200/60">
        
        {/* Profile & Greeting Header Area */}
        <div className="p-6 pt-8 flex flex-col gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 text-indigo-600">
              <User size={22} />
            </div>
            <div className="flex flex-col group cursor-default">
              <h1 className="text-[16px] lg:text-[18px] font-black text-slate-800 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300 leading-tight tracking-tight">
                ប្រព័ន្ធគ្រប់គ្រងអវត្តមាន
              </h1>
              <span className="text-[11px] font-bold text-slate-500 tracking-wide mt-1">
                វិទ្យាល័យអង្គរកា
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <div className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">ម៉ឺនុយ (Menu)</div>
          
          {navItems.map((item) => {
            const Icon = item.icon
            
            if (item.subItems) {
              const isGroupActive = item.subItems.some(sub => sub.id === activePage)
              return (
                <div key={item.id} className="flex flex-col">
                  <button
                    onClick={() => setAttendanceMenuOpen(!attendanceMenuOpen)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all w-full text-left group
                      ${isGroupActive 
                        ? 'text-indigo-700 bg-indigo-50/50' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon size={18} strokeWidth={isGroupActive ? 2.5 : 2} className={isGroupActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'} />
                      {item.label}
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-300 text-slate-400 group-hover:text-slate-600 ${attendanceMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Collapsible Sub-menu */}
                  <div className={`overflow-hidden transition-all duration-300 ${attendanceMenuOpen ? 'max-h-40 mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col gap-1 ml-6 pl-4 border-l-2 border-slate-100/80 py-1">
                      {item.subItems.map(sub => {
                        const isSubActive = activePage === sub.id
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setActivePage(sub.id)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-bold transition-all w-full text-left
                              ${isSubActive 
                                ? 'bg-indigo-50 text-indigo-700' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                              }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isSubActive ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                            {sub.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            }

            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-bold transition-all w-full text-left group
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'} />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Footer section - Animated Logout */}
        <div className="p-4 mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-between w-full p-2.5 rounded-xl bg-gradient-to-r from-rose-50 to-red-50 hover:from-rose-500 hover:to-red-500 text-rose-600 hover:text-white border border-rose-100 hover:border-transparent transition-all duration-300 group shadow-sm hover:shadow-md hover:-translate-y-0.5 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="w-7 h-7 rounded-full bg-white text-rose-500 group-hover:text-rose-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0">
                <LogOut size={14} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform duration-300" />
              </div>
              <span className="text-[13px] font-bold">ចាកចេញពីប្រព័ន្ធ</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-[300px] bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            
            <div className="p-6 flex items-start justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 text-indigo-600">
                  <User size={22} />
                </div>
                <div className="flex flex-col group cursor-default">
                  <h1 className="text-[16px] lg:text-[18px] font-black text-slate-800 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300 leading-tight tracking-tight">
                    ប្រព័ន្ធគ្រប់គ្រងអវត្តមាន
                  </h1>
                  <span className="text-[11px] font-bold text-slate-500 tracking-wide mt-1">
                    វិទ្យាល័យអង្គរកា
                  </span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full hover:bg-slate-100 mt-1 border border-slate-200/50">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="flex-1 py-4 px-4 flex flex-col gap-1 overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">ម៉ឺនុយ (Menu)</div>
              {navItems.map((item) => {
                const Icon = item.icon
                
                if (item.subItems) {
                  const isGroupActive = item.subItems.some(sub => sub.id === activePage)
                  return (
                    <div key={item.id} className="flex flex-col">
                      <button
                        onClick={() => setAttendanceMenuOpen(!attendanceMenuOpen)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all w-full text-left group
                          ${isGroupActive 
                            ? 'text-indigo-700 bg-indigo-50/50' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Icon size={18} strokeWidth={isGroupActive ? 2.5 : 2} className={isGroupActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'} />
                          {item.label}
                        </div>
                        <ChevronDown size={16} className={`transition-transform duration-300 text-slate-400 group-hover:text-slate-600 ${attendanceMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ${attendanceMenuOpen ? 'max-h-40 mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="flex flex-col gap-1 ml-6 pl-4 border-l-2 border-slate-100/80 py-1">
                          {item.subItems.map(sub => {
                            const isSubActive = activePage === sub.id
                            return (
                              <button
                                key={sub.id}
                                onClick={() => { setActivePage(sub.id); setMobileMenuOpen(false); }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-bold transition-all w-full text-left
                                  ${isSubActive 
                                    ? 'bg-indigo-50 text-indigo-700' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                  }`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isSubActive ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                                {sub.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                }

                const isActive = activePage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActivePage(item.id); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-bold transition-all w-full text-left group
                      ${isActive 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'} />
                    {item.label}
                  </button>
                )
              })}
            </div>
            
            <div className="p-4 mt-auto border-t border-slate-100">
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl bg-gradient-to-r from-rose-50 to-red-50 hover:from-rose-500 hover:to-red-500 text-rose-600 hover:text-white border border-rose-100 hover:border-transparent transition-all duration-300 group shadow-sm hover:shadow-md hover:-translate-y-0.5 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <LogOut size={16} strokeWidth={2.5} className="relative z-10 group-hover:-translate-x-1 transition-transform duration-300" /> 
                <span className="relative z-10 font-bold text-[13px]">ចាកចេញពីប្រព័ន្ធ</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main 
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-white rounded-l-[32px] my-2 mr-2 border border-slate-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
        onClick={() => setProfileDropdownOpen(false)}
      >
        {/* Top Header */}
        <header className="h-[72px] bg-white/80 backdrop-blur-md shrink-0 flex items-center justify-between px-6 lg:px-10 relative z-10 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu size={22} strokeWidth={2.5} />
            </button>
            <h2 className="text-[18px] font-black text-slate-800 hidden sm:block">
              {activePage === 'profile' ? 'ប្រវត្តិរូបអ្នកប្រើប្រាស់' : (() => {
                for (const item of navItems) {
                  if (item.id === activePage) return item.label;
                  if (item.subItems) {
                    const subItem = item.subItems.find(sub => sub.id === activePage);
                    if (subItem) return subItem.label;
                  }
                }
                return 'គ្រប់គ្រងប្រព័ន្ធ';
              })()}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 relative" onClick={e => e.stopPropagation()}>
            
            {/* Backup Button */}
            <button 
              onClick={() => alert('មុខងារ Backup កំពុងអភិវឌ្ឍ...')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 transition-all font-bold text-[12px] shadow-sm hover:shadow"
            >
              <Database size={14} strokeWidth={2.5} />
              <span>Backup</span>
            </button>

            {/* Notification Bell with Pulse Animation */}
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-300 hover:scale-110 active:scale-95">
              <Bell size={20} strokeWidth={2} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
            </button>
            
            {/* Animated Profile Section with Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-2 p-1 pr-3 lg:pr-4 rounded-full border bg-white hover:bg-slate-50 transition-all duration-300 group ml-1 cursor-pointer ${
                  profileDropdownOpen ? 'border-indigo-300 shadow-sm ring-2 ring-indigo-50' : 'border-slate-200/60 hover:shadow-sm hover:border-indigo-100'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <User size={18} strokeWidth={2.5} className="relative z-10" />
                </div>
                <div className="hidden sm:flex flex-col items-start ml-1">
                  <span className="text-[13px] font-bold text-slate-700 leading-none group-hover:text-indigo-700 transition-colors">Admin</span>
                  <span className="text-[10px] font-medium text-indigo-500 mt-1">អ្នកគ្រប់គ្រង</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-all ml-1 lg:ml-2 duration-300 ${profileDropdownOpen ? 'rotate-180 text-indigo-500' : 'group-hover:text-indigo-500 group-hover:translate-y-0.5'}`} />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 z-50">
                  <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex flex-col gap-1">
                    <span className="text-[14px] font-black text-slate-800">Admin User</span>
                    <span className="text-[11px] font-bold text-slate-400">admin@angroka.edu.kh</span>
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    <button 
                      onClick={() => { setActivePage('profile'); setProfileDropdownOpen(false); }}
                      className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 font-bold text-[13px] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Edit size={14} />
                      </div>
                      កែប្រែប្រវត្តិរូប
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-[13px] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <LogOut size={14} />
                      </div>
                      ចាកចេញពីប្រព័ន្ធ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar relative">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
