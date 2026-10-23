import { useState, useRef, useEffect } from 'react'
import { Search, Plus, Shield, User, Edit, Trash2, Users, ChevronLeft, ChevronRight, ChevronsRight, ChevronDown, CheckCircle, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react'
import AddUserModal from './AddUserModal'
import EditUserModal from './EditUserModal'
import SearchableDropdown from '../../common/SearchableDropdown'
import { api } from '../../../utils/api'

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null })

  // Loading & Toast States
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  // Users Data with cached state
  const [users, setUsers] = useState(() => {
    try {
      const cached = localStorage.getItem('school_users_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {}
    return [
      { id: 'USR-001', name: 'San Vandy', username: 'vandy12A', role: 'monitor', class: '12A', status: 'active', lastLogin: '2026-06-30' },
      { id: 'USR-002', name: 'Sok Mean', username: 'mean11B', role: 'monitor', class: '11B', status: 'active', lastLogin: '2026-06-29' },
      { id: 'USR-003', name: 'Admin Chhen', username: 'admin_sys', role: 'admin', class: '-', status: 'active', lastLogin: '2026-07-01' },
      { id: 'USR-004', name: 'Keo Rotha', username: 'rotha10A', role: 'monitor', class: '10A', status: 'inactive', lastLogin: '2026-05-15' },
      { id: 'USR-005', name: 'Somnang', username: 'somnang1', role: 'monitor', class: '11A', status: 'active', lastLogin: '2026-06-20' },
    ]
  })

  // Custom Filter States
  const [filterRole, setFilterRole] = useState('ALL')
  const [filterClass, setFilterClass] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  
  const roleOptions = [
    { id: 'ALL', label: 'គ្រប់តួនាទី' },
    { id: 'admin', label: 'អ្នកគ្រប់គ្រង (Admin)' },
    { id: 'monitor', label: 'អ្នកត្រួតពិនិត្យ (Monitor)' }
  ]
  
  const [classOptions, setClassOptions] = useState(() => {
    try {
      const raw = localStorage.getItem('school_classes_cache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [
            { id: 'ALL', label: 'គ្រប់ថ្នាក់' },
            ...parsed.map(c => {
              const cleanName = c.name.replace('ថ្នាក់ ', '').trim()
              return {
                id: cleanName,
                label: c.name.startsWith('ថ្នាក់') ? c.name : `ថ្នាក់ ${c.name}`
              }
            })
          ]
        }
      }
    } catch (e) {}
    return [{ id: 'ALL', label: 'គ្រប់ថ្នាក់' }]
  })

  const fetchUsersData = async (initial = false) => {
    if (initial) setIsLoading(true)
    setIsRefreshing(true)
    try {
      const [resUsers, resClasses] = await Promise.all([
        api('users.getAll'),
        api('academic.getClasses')
      ])

      if (resUsers?.success && Array.isArray(resUsers.data)) {
        setUsers(resUsers.data)
      }

      if (resClasses?.success && Array.isArray(resClasses.data)) {
        const dynamicClassOpts = [
          { id: 'ALL', label: 'គ្រប់ថ្នាក់' },
          ...resClasses.data.map(c => {
            const cleanName = c.name.replace('ថ្នាក់ ', '').trim()
            return {
              id: cleanName,
              label: c.name.startsWith('ថ្នាក់') ? c.name : `ថ្នាក់ ${c.name}`
            }
          })
        ]
        setClassOptions(dynamicClassOpts)
      }

      if (!initial) {
        showToast('បានធ្វើបច្ចុប្បន្នភាពទិន្នន័យពី Firebase')
      }
    } catch (err) {
      console.error('Fetch users error:', err)
      if (!initial) {
        showToast('មិនអាចទាញទិន្នន័យថ្មីបានទេ')
      }
    } finally {
      setIsRefreshing(false)
      if (initial) setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsersData(false)
  }, [])

  const handleAddUserSave = async (newUser) => {
    const userWithId = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      lastLogin: 'មិនទាន់ចូលប្រើ',
      ...newUser
    }
    try {
      const res = await api('users.save', { user: userWithId })
      if (res?.success) {
        setUsers(prev => [userWithId, ...prev])
        showToast(`បានបន្ថែមអ្នកប្រើប្រាស់ "${userWithId.name}" ដោយជោគជ័យ`)
      } else {
        showToast('មានបញ្ហាក្នុងការបន្ថែមអ្នកប្រើប្រាស់')
      }
    } catch (e) {
      console.error('Add user error:', e)
      showToast('មានបញ្ហាក្នុងការបន្ថែមអ្នកប្រើប្រាស់')
    }
  }

  const handleEditUserSave = async (updatedUser) => {
    try {
      const res = await api('users.save', { user: updatedUser })
      if (res?.success) {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
        showToast(`បានកែសម្រួលគណនី "${updatedUser.name}" ដោយជោគជ័យ`)
      } else {
        showToast('មានបញ្ហាក្នុងការកែប្រែគណនី')
      }
    } catch (e) {
      console.error('Edit user error:', e)
      showToast('មានបញ្ហាក្នុងការកែប្រែគណនី')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.user) return
    const targetUser = deleteModal.user
    try {
      const res = await api('users.delete', { userId: targetUser.id })
      if (res?.success) {
        setUsers(prev => prev.filter(u => u.id !== targetUser.id))
        showToast(`បានលុបគណនី "${targetUser.name}"`)
      } else {
        showToast('មិនអាចលុបគណនីបានទេ')
      }
    } catch (e) {
      console.error('Delete user error:', e)
      showToast('មានបញ្ហាក្នុងការលុបគណនី')
    } finally {
      setDeleteModal({ open: false, user: null })
    }
  }
  
  const statusOptions = [
    { id: 'ALL', label: 'គ្រប់ស្ថានភាព' },
    { id: 'active', label: 'ដំណើរការ' },
    { id: 'inactive', label: 'ផ្អាក' },
  ]
  
  // Filter Data
  let filteredUsers = users
  
  if (filterRole !== 'ALL') {
    filteredUsers = filteredUsers.filter(u => u.role === filterRole)
  }
  
  if (filterClass !== 'ALL') {
    filteredUsers = filteredUsers.filter(u => u.class === filterClass)
  }
  
  if (filterStatus !== 'ALL') {
    filteredUsers = filteredUsers.filter(u => u.status === filterStatus)
  }
  
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filteredUsers = filteredUsers.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.username.toLowerCase().includes(q)
    )
  }

  // Pagination Logic (10 items per page)
  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage))
  
  if (currentPage > totalPages) {
    setCurrentPage(totalPages)
  }

  const paginatedData = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const totalRecords = filteredUsers.length
  const totalActive = filteredUsers.filter(u => u.status === 'active').length
  const totalAdmins = filteredUsers.filter(u => u.role === 'admin').length
  const totalMonitors = filteredUsers.filter(u => u.role === 'monitor').length

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10 relative">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-[13px] font-bold border border-slate-700/50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={15} />
          </div>
          <span>{toast}</span>
        </div>
      )}
      
      {/* Top Stats - 4 Balanced Premium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
        {/* Total Data Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">គណនីសរុប</div>
          </div>
          <div className="text-3xl font-black text-slate-800 relative z-10">{totalRecords}</div>
        </div>

        {/* Active Users Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">កំពុងដំណើរការ</div>
          </div>
          <div className="text-3xl font-black text-emerald-500 relative z-10">{totalActive}</div>
        </div>
        
        {/* Total Admins Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <Shield size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">អ្នកគ្រប់គ្រង (Admin)</div>
          </div>
          <div className="text-3xl font-black text-rose-500 relative z-10">{totalAdmins}</div>
        </div>

        {/* Total Monitors Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <User size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">អ្នកត្រួតពិនិត្យ (Monitor)</div>
          </div>
          <div className="text-3xl font-black text-amber-500 relative z-10">{totalMonitors}</div>
        </div>
      </div>

      {/* Main Table Container - Premium Theme */}
      <div className="bg-white rounded-2xl border border-slate-200/60 flex flex-col relative shadow-sm overflow-hidden">
        
        {/* Premium Toolbar & Filters */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
            {/* Search and Filters Group */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
              {/* Search Input */}
              <div className="relative w-full sm:w-[280px] xl:w-[320px] group">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="ស្វែងរកឈ្មោះ ឬ Username..." 
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-9 pr-4 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-[150px]">
                  <SearchableDropdown 
                    options={roleOptions} 
                    value={filterRole} 
                    onChange={setFilterRole} 
                    placeholder="ជ្រើសរើសតួនាទី" 
                  />
                </div>
                <div className="w-full sm:w-[140px]">
                  <SearchableDropdown 
                    options={classOptions} 
                    value={filterClass} 
                    onChange={setFilterClass} 
                    placeholder="ជ្រើសរើសថ្នាក់" 
                  />
                </div>
                <div className="w-full sm:w-[160px]">
                  <SearchableDropdown 
                    options={statusOptions} 
                    value={filterStatus} 
                    onChange={setFilterStatus} 
                    placeholder="ជ្រើសរើសស្ថានភាព" 
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons: Refresh & Add User */}
            <div className="w-full lg:w-auto flex items-center gap-2.5 flex-shrink-0">
              <button 
                type="button"
                onClick={() => fetchUsersData(false)}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 px-4 rounded-xl font-bold text-[13px] transition-all shadow-xs hover:shadow hover:-translate-y-0.5 shrink-0 disabled:opacity-50"
                title="ទាញទិន្នន័យថ្មីពី Cloud Firestore"
              >
                <RefreshCw size={15} strokeWidth={2.5} className={`text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>ទាញទិន្នន័យថ្មី</span>
              </button>

              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-5 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>បន្ថែមអ្នកប្រើប្រាស់</span>
              </button>
            </div>
          </div>
          
        </div>

        {/* Premium Table Area */}
        <div className="w-full overflow-x-auto custom-scrollbar relative min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">ឈ្មោះអ្នកប្រើប្រាស់</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[140px]">តួនាទី</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[120px]">ថ្នាក់បន្ទុក</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[150px]">ចូលចុងក្រោយ</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[120px]">ស្ថានភាព</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[100px] text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((user, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] shadow-sm border ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50' : 'bg-slate-50 text-slate-600 border-slate-200/50'}`}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{user.name}</span>
                        <span className="text-[12px] font-medium text-slate-400">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[12px] border border-indigo-100/50">
                        <Shield size={13} strokeWidth={2.5}/> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[12px]">
                        <User size={13} strokeWidth={2.5}/> Monitor
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-6">
                    {user.class !== '-' ? (
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-bold text-[12px]">
                        {user.class}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-bold text-[14px]">-</span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-[13px] font-medium text-slate-500">
                    {user.lastLogin}
                  </td>
                  <td className="py-3 px-6">
                    {user.status === 'active' ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[13px] font-bold text-emerald-600">ដំណើរការ</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                        </span>
                        <span className="text-[13px] font-bold text-rose-600">ផ្អាក</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 transition-all duration-300">
                      <button 
                        type="button"
                        onClick={() => {
                          console.log("Edit button clicked for:", user);
                          setEditingUser(user);
                          setIsEditModalOpen(true);
                        }}
                        className="flex items-center justify-center w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-200 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <Edit size={14} strokeWidth={2.5} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => setDeleteModal({ open: true, user })}
                        className="flex items-center justify-center w-8 h-8 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 hover:border-rose-200 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200"
                        title="លុបអ្នកប្រើប្រាស់"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <Search size={28} className="text-slate-300" />
                      </div>
                      <span className="font-bold text-slate-700 text-[15px]">មិនមានគណនីត្រូវគ្នានឹងការស្វែងរកទេ</span>
                      <span className="text-[13px] font-medium text-slate-500 mt-1">សូមសាកល្បងលក្ខខណ្ឌ (Filters) ផ្សេងទៀត។</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Modern Pagination UI */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex flex-col xl:flex-row items-center justify-end gap-6 rounded-b-2xl">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Prev Button */}
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === 1 ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-full font-bold text-[15px] flex items-center justify-center transition-all ${
                      currentPage === i + 1 
                        ? 'bg-[#0062cc] hover:bg-blue-700 text-white shadow-[0_4px_12px_rgba(0,98,204,0.3)] transform hover:scale-105' 
                        : 'bg-transparent text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ml-1 ${currentPage === totalPages ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
              
              {/* Fast Forward Button */}
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === totalPages ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronsRight size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Jump to Page */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 sm:pl-6">
              <input 
                type="number" 
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= totalPages) setCurrentPage(val);
                }}
                className="w-14 h-9 border border-slate-300 rounded-lg text-center font-bold text-slate-700 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-sm"
              />
              <span className="text-[14px] font-medium text-slate-500">
                នៃ {totalPages} ទំព័រ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddUserModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={handleAddUserSave} 
          classOptions={classOptions} 
        />
      )}

      {isEditModalOpen && (
        <EditUserModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleEditUserSave} 
          classOptions={classOptions} 
          userData={editingUser}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-[16px] font-black text-slate-800">
              បញ្ជាក់ការលុបអ្នកប្រើប្រាស់
            </h3>
            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
              តើអ្នកពិតជាចង់លុបគណនី <span className="font-bold text-slate-800">"{deleteModal.user?.name}"</span> (@<span className="font-mono text-slate-700 font-bold">{deleteModal.user?.username}</span>) ចេញពីប្រព័ន្ធមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] font-bold transition-all"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Trash2 size={15} />
                <span>យល់ព្រមលុប</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
