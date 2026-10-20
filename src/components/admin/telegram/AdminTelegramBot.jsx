import { useState } from 'react'
import { Search, Plus, Bot, MessageCircle, Edit, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronsRight, Activity, Globe, Save, Loader2 } from 'lucide-react'
import AddBotModal from './AddBotModal'
import EditBotModal from './EditBotModal'
import GlobalTokenModal from './GlobalTokenModal'
import SearchableDropdown from '../../common/SearchableDropdown'

export default function AdminTelegramBot() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingBot, setEditingBot] = useState(null)

  // Global Token State
  const [globalToken, setGlobalToken] = useState('')
  const [isGlobalTokenModalOpen, setIsGlobalTokenModalOpen] = useState(false)

  const handleSaveGlobalToken = (token) => {
    setGlobalToken(token)
  }

  const handleDeleteGlobalToken = () => {
    if (window.confirm("តើអ្នកពិតជាចង់លុប Global Token នេះមែនទេ?")) {
      setGlobalToken('')
    }
  }

  const handleAddBotSave = (newBot) => {
    console.log("New bot to add:", newBot);
  }

  const handleEditBotSave = (updatedBot) => {
    console.log("Updated bot:", updatedBot);
  }
  
  // Custom Filter States
  const [filterClass, setFilterClass] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  
  const classOptions = [
    { id: 'ALL', label: 'គ្រប់ថ្នាក់' },
    { id: '12A', label: 'ថ្នាក់ 12A' },
    { id: '12B', label: 'ថ្នាក់ 12B' },
    { id: '12C', label: 'ថ្នាក់ 12C' },
    { id: '11A', label: 'ថ្នាក់ 11A' },
    { id: '11B', label: 'ថ្នាក់ 11B' },
    { id: '10A', label: 'ថ្នាក់ 10A' },
  ]
  
  const statusOptions = [
    { id: 'ALL', label: 'គ្រប់ស្ថានភាព' },
    { id: 'active', label: 'ដំណើរការ' },
    { id: 'inactive', label: 'ផ្អាក' },
  ]
  
  // Mock Bots Data
  const [bots] = useState([
    { id: 'BOT-001', class: '12A', token: '123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11', chatId: '-1001234567890', status: 'active', lastUpdated: '2026-07-01' },
    { id: 'BOT-002', class: '12B', token: '987654321:XYZ-DEF1234ghIkl-zyx57W2v1u123ew22', chatId: '-1009876543210', status: 'active', lastUpdated: '2026-06-25' },
    { id: 'BOT-003', class: '11A', token: '555555555:QWE-DEF1234ghIkl-zyx57W2v1u123ew33', chatId: '-1005555555555', status: 'inactive', lastUpdated: '2026-05-10' },
  ])

  // Filter Data
  let filteredBots = bots
  
  if (filterClass !== 'ALL') {
    filteredBots = filteredBots.filter(b => b.class === filterClass)
  }
  
  if (filterStatus !== 'ALL') {
    filteredBots = filteredBots.filter(b => b.status === filterStatus)
  }
  
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filteredBots = filteredBots.filter(b => 
      b.class.toLowerCase().includes(q) || 
      b.chatId.toLowerCase().includes(q) ||
      b.token.toLowerCase().includes(q)
    )
  }

  // Pagination Logic
  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredBots.length / itemsPerPage))
  
  if (currentPage > totalPages) {
    setCurrentPage(totalPages)
  }

  const paginatedData = filteredBots.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const totalRecords = filteredBots.length
  const totalActive = filteredBots.filter(b => b.status === 'active').length
  const totalInactive = filteredBots.filter(b => b.status === 'inactive').length

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 w-full">
        {/* Total Data Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Bot size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">Bot សរុប</div>
          </div>
          <div className="text-3xl font-black text-slate-800 relative z-10">{totalRecords}</div>
        </div>
        
        {/* Active Card */}
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

        {/* Inactive Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <XCircle size={20} strokeWidth={2.5} />
            </div>
            <div className="text-[14px] font-bold text-slate-500">បានផ្អាក</div>
          </div>
          <div className="text-3xl font-black text-rose-500 relative z-10">{totalInactive}</div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/60 flex flex-col relative shadow-sm overflow-hidden">
        
        {/* Toolbar & Filters */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
              <div className="relative w-full sm:w-[280px] xl:w-[320px] group">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="ស្វែងរកលេខកូដ ឬថ្នាក់..." 
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-9 pr-4 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
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

            <div className="w-full lg:w-auto flex-shrink-0 flex items-center justify-end gap-3 flex-wrap">
              <button 
                onClick={() => setIsGlobalTokenModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white py-2.5 px-4 sm:px-6 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <Globe size={15} strokeWidth={2.5} />
                <span>គ្រប់គ្រង Global Token</span>
              </button>
              
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-2.5 px-4 sm:px-6 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>បន្ថែម Bot ថ្មី</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="w-full overflow-x-auto custom-scrollbar relative min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[120px]">ថ្នាក់បន្ទុក</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Bot Token</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[200px]">Chat ID</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[130px]">កែប្រែចុងក្រោយ</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[120px]">ស្ថានភាព</th>
                <th className="py-4 px-6 text-[12px] font-bold text-slate-400 uppercase tracking-wider w-[100px] text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((bot, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3 px-6">
                    <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[14px] border border-indigo-100/50 shadow-sm">
                      {bot.class}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-slate-100 text-slate-500">
                        <MessageCircle size={14} />
                      </div>
                      <span className="text-[13px] font-medium text-slate-600 font-mono truncate max-w-[200px]" title={bot.token}>
                        {bot.token.substring(0, 15)}...
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <span className="text-[13px] font-medium text-slate-600 font-mono">
                      {bot.chatId}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-[13px] font-medium text-slate-500">
                    {bot.lastUpdated}
                  </td>
                  <td className="py-3 px-6">
                    {bot.status === 'active' ? (
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
                          setEditingBot(bot);
                          setIsEditModalOpen(true);
                        }}
                        className="flex items-center justify-center w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-200 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <Edit size={14} strokeWidth={2.5} />
                      </button>
                      <button className="flex items-center justify-center w-8 h-8 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 hover:border-rose-200 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200">
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBots.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <Search size={28} className="text-slate-300" />
                      </div>
                      <span className="font-bold text-slate-700 text-[15px]">មិនមានទិន្នន័យត្រូវគ្នានឹងការស្វែងរកទេ</span>
                      <span className="text-[13px] font-medium text-slate-500 mt-1">សូមសាកល្បងលក្ខខណ្ឌផ្សេងទៀត។</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex flex-col xl:flex-row items-center justify-end gap-6 rounded-b-2xl">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === 1 ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              
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

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ml-1 ${currentPage === totalPages ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
              
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentPage === totalPages ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronsRight size={20} strokeWidth={2.5} />
              </button>
            </div>

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
        <AddBotModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={handleAddBotSave} 
          classOptions={classOptions} 
        />
      )}

      {isEditModalOpen && (
        <EditBotModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleEditBotSave} 
          classOptions={classOptions} 
          botData={editingBot}
        />
      )}
      {isGlobalTokenModalOpen && (
        <GlobalTokenModal 
          isOpen={isGlobalTokenModalOpen} 
          onClose={() => setIsGlobalTokenModalOpen(false)} 
          onSave={handleSaveGlobalToken} 
          existingToken={globalToken}
        />
      )}
    </div>
  )
}
