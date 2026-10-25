import { useState, useEffect } from 'react'
import {
  Search, Plus, Bot, MessageCircle, Edit, Trash2,
  CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronsRight,
  Activity, Globe, Save, Loader2, Copy, Check, Send, AlertCircle, Clock
} from 'lucide-react'
import AddBotModal from './AddBotModal'
import EditBotModal from './EditBotModal'
import GlobalTokenModal from './GlobalTokenModal'
import SearchableDropdown from '../../common/SearchableDropdown'
import { api } from '../../../utils/api'
import { triggerDailySummary, isDailySummarySentToday, getDailySummarySentLog } from '../../../services/dailySummaryScheduler'

export default function AdminTelegramBot() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingBot, setEditingBot] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, bot: null })
  const [copiedItem, setCopiedItem] = useState({ id: null, type: null })
  const [testingBotId, setTestingBotId] = useState(null)
  const [toast, setToast] = useState(null)
  const [isSendingDailySummary, setIsSendingDailySummary] = useState(false)
  const [summarySentToday, setSummarySentToday] = useState(() => isDailySummarySentToday())

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Global Tokens State (SWR Instant Cache)
  const [globalTokens, setGlobalTokens] = useState(() => {
    try {
      const raw = localStorage.getItem('school_telegram_global_tokens_cache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {}
    return [
      { id: 'gt_1', token: '123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11', name: 'Bot សាលាកណ្តាល', isActive: true },
      { id: 'gt_2', token: '987654321:XYZ-UVW9876abCde-rqp98L4m0n987ew22', name: 'Bot បណ្ណាល័យ', isActive: false }
    ]
  })
  const [isGlobalTokenModalOpen, setIsGlobalTokenModalOpen] = useState(false)

  // Custom Filter States
  const [filterClass, setFilterClass] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  
  const [classOptions, setClassOptions] = useState(() => {
    try {
      const raw = localStorage.getItem('school_classes_cache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [{ id: 'ALL', label: 'គ្រប់ថ្នាក់' }, ...parsed.map(c => ({ id: c.name, label: `ថ្នាក់ ${c.name}` }))]
        }
      }
    } catch (e) {}
    return [{ id: 'ALL', label: 'គ្រប់ថ្នាក់' }]
  })
  
  const statusOptions = [
    { id: 'ALL', label: 'គ្រប់ស្ថានភាព' },
    { id: 'active', label: 'ដំណើរការ' },
    { id: 'inactive', label: 'ផ្អាក' },
  ]
  
  // Bots Data State (SWR Instant Cache)
  const [bots, setBots] = useState(() => {
    try {
      const raw = localStorage.getItem('school_telegram_bots_cache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {}
    return [
      { id: 'BOT-001', class: '12A', name: 'Bot ថ្នាក់ ១២A', token: '123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11', chatId: '-1001234567890', status: 'active', notifyOnAttendance: true, lastUpdated: '2026-07-01' },
      { id: 'BOT-002', class: '12B', name: 'Bot ថ្នាក់ ១២B', token: '987654321:XYZ-DEF1234ghIkl-zyx57W2v1u123ew22', chatId: '-1009876543210', status: 'active', notifyOnAttendance: true, lastUpdated: '2026-06-25' },
      { id: 'BOT-003', class: '11A', name: 'Bot ថ្នាក់ ១១A', token: '555555555:QWE-DEF1234ghIkl-zyx57W2v1u123ew33', chatId: '-1005555555555', status: 'inactive', notifyOnAttendance: true, lastUpdated: '2026-05-10' },
    ]
  })

  // Background SWR sync with Firestore
  useEffect(() => {
    let isMounted = true
    const syncData = async () => {
      try {
        const [botsRes, tokRes, clRes] = await Promise.all([
          api('telegram.getBots'),
          api('telegram.getGlobalTokens'),
          api('academic.getClasses')
        ])

        if (isMounted) {
          if (botsRes && botsRes.success && botsRes.data) {
            setBots(botsRes.data)
          }
          if (tokRes && tokRes.success && tokRes.data) {
            setGlobalTokens(tokRes.data)
          }
          if (clRes && clRes.success && clRes.data && clRes.data.length > 0) {
            setClassOptions([{ id: 'ALL', label: 'គ្រប់ថ្នាក់' }, ...clRes.data.map(c => ({ id: c.name, label: `ថ្នាក់ ${c.name}` }))])
          }
        }
      } catch (err) {
        console.warn('[Telegram] Background sync error:', err)
      }
    }
    syncData()
    return () => { isMounted = false }
  }, [])

  const handleCopy = (text, id, type) => {
    navigator.clipboard.writeText(text)
    setCopiedItem({ id, type })
    setTimeout(() => setCopiedItem({ id: null, type: null }), 1500)
  }

  const handleSaveGlobalTokens = async (tokens) => {
    setGlobalTokens(tokens)
    showToast('បានរក្សាទុក Global Tokens ទៅកាន់ Firebase ដោយជោគជ័យ', 'success')
    await api('telegram.saveGlobalTokens', { tokens })
  }

  const handleAddBotSave = async (newBot) => {
    const botWithId = {
      id: `BOT-${String(Date.now()).slice(-3)}`,
      lastUpdated: new Date().toISOString().split('T')[0],
      ...newBot
    }
    setBots([botWithId, ...bots])
    showToast('បានបន្ថែម Telegram Bot ទៅកាន់ Firebase ដោយជោគជ័យ', 'success')
    await api('telegram.saveBot', { bot: botWithId })
  }

  const handleEditBotSave = async (updatedBot) => {
    const next = bots.map(b => b.id === updatedBot.id ? { ...b, ...updatedBot, lastUpdated: new Date().toISOString().split('T')[0] } : b)
    setBots(next)
    showToast('បានកែប្រែព័ត៌មាន Bot ទៅកាន់ Firebase ដោយជោគជ័យ', 'success')
    await api('telegram.updateBot', { botId: updatedBot.id, bot: updatedBot })
  }

  const handleConfirmDelete = async () => {
    if (deleteModal.bot) {
      const deletedId = deleteModal.bot.id
      setBots(bots.filter(b => b.id !== deletedId))
      setDeleteModal({ open: false, bot: null })
      showToast('បានលុប Telegram Bot ចេញពី Firebase ដោយជោគជ័យ', 'success')
      await api('telegram.deleteBot', { botId: deletedId })
    }
  }

  const handleTestBot = async (bot) => {
    setTestingBotId(bot.id)
    try {
      let testToken = bot.token
      if (testToken === 'GLOBAL_TOKEN' || !testToken) {
        const activeGlobal = globalTokens.find(t => t.isActive) || globalTokens[0]
        testToken = activeGlobal ? activeGlobal.token : ''
      }

      if (!testToken) {
        showToast('សូមកំណត់ Bot Token ឬជ្រើសរើស Global Token ជាមុនសិន', 'error')
        setTestingBotId(null)
        return
      }

      const res = await api('telegram.testBot', {
        token: testToken,
        chatId: bot.chatId,
        botName: bot.name || `Bot ថ្នាក់ ${bot.class}`,
        className: bot.class
      })

      if (res && res.success) {
        showToast(`បានផ្ញើសារសាកល្បងទៅកាន់ Telegram (Chat ID: ${bot.chatId}) ជោគជ័យ!`, 'success')
      } else {
        showToast(res.error || 'បរាជ័យក្នុងការតភ្ជាប់ Telegram Bot', 'error')
      }
    } catch (e) {
      showToast('មិនអាចផ្ញើសារសាកល្បងបានទេ: ' + e.message, 'error')
    } finally {
      setTestingBotId(null)
    }
  }

  // Manual Trigger for Daily 5:00 PM Summary Notification
  const handleSendDailySummaryNow = async () => {
    setIsSendingDailySummary(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await triggerDailySummary(today, true)
      if (res && res.success) {
        setSummarySentToday(true)
        showToast(`បានផ្ញើរបាយការណ៍សង្ខេបវត្តមានប្រចាំថ្ងៃទៅកាន់ Telegram (${res.count} ក្រុម) ជោគជ័យ!`, 'success')
      } else {
        showToast(res.error || 'បរាជ័យក្នុងការផ្ញើរបាយការណ៍សង្ខេប', 'error')
      }
    } catch (err) {
      showToast('កំហុសពេលផ្ញើ: ' + err.message, 'error')
    } finally {
      setIsSendingDailySummary(false)
    }
  }

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
      (b.name && b.name.toLowerCase().includes(q)) ||
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
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border animate-in slide-in-from-top duration-300 font-bold text-[13px] ${
          toast.type === 'error'
            ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-rose-500/10'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} className="text-rose-500" /> : <CheckCircle size={18} className="text-emerald-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Daily 5:00 PM Summary Info Card ── */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/90 to-sky-50/90 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 mt-0.5">
            <Clock size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-[14px] sm:text-[16px] font-extrabold text-indigo-950">
                របាយការណ៍សង្ខេបវត្តមានប្រចាំថ្ងៃស្វ័យប្រវត្តិ (រៀងរាល់ម៉ោង ០៥:០០ រសៀល)
              </h4>
              <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                summarySentToday
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {summarySentToday ? '✓ ថ្ងៃនេះបានផ្ញើរួចរាល់' : '⏳ រង់ចាំដល់ម៉ោង ៥:០០ រសៀល'}
              </span>
            </div>
            <p className="text-[12px] sm:text-[13px] text-slate-600 mt-1 leading-relaxed">
              នៅរៀងរាល់ម៉ោង <strong>០៥:០០ រសៀល</strong> ប្រព័ន្ធនឹងចងក្រងតារាងសង្ខេបវត្តមានគ្រប់ថ្នាក់ទាំងអស់ (ចំនួនសិស្សមក សិស្សឈប់ និងបញ្ជីឈ្មោះ) រួចផ្ញើជូនលោកគ្រូអ្នកគ្រូ និងគណៈគ្រប់គ្រងសាលាដោយស្វ័យប្រវត្តិតាម Telegram Bot។
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSendDailySummaryNow}
          disabled={isSendingDailySummary}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-[12px] sm:text-[13px] px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 shrink-0 self-end sm:self-center cursor-pointer"
        >
          {isSendingDailySummary ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} strokeWidth={2.5} />}
          <span>{isSendingDailySummary ? 'កំពុងផ្ញើ...' : 'ផ្ញើសេចក្តីសង្ខេបឥឡូវ'}</span>
        </button>
      </div>

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
                  placeholder="ស្វែងរកលេខកូដ, ឈ្មោះ ឬថ្នាក់..." 
                  className="w-full bg-white border border-slate-200 text-slate-800 py-2.5 pl-9 pr-4 rounded-xl font-medium text-[13px] focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-400 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-[150px]">
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
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-4 sm:px-6 rounded-xl font-bold text-[13px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <Globe size={15} strokeWidth={2.5} className="text-indigo-400" />
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
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6 text-left">លេខកូដ Bot</th>
                <th className="py-3 px-6 text-left">ថ្នាក់បន្ទុក</th>
                <th className="py-3 px-6 text-left">Bot Token</th>
                <th className="py-3 px-6 text-left">Chat ID / Group ID</th>
                <th className="py-3 px-6 text-center">ស្ថានភាព</th>
                <th className="py-3 px-6 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] text-slate-600">
              {paginatedData.map((bot) => (
                <tr key={bot.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Bot size={16} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{bot.id}</span>
                        {bot.name && <span className="text-[11px] text-slate-400 font-medium">{bot.name}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                      ថ្នាក់ {bot.class}
                    </span>
                  </td>
                  <td className="py-3 px-6 font-mono text-[12px]">
                    <div className="flex items-center gap-2 group/copy">
                      {bot.token === 'GLOBAL_TOKEN' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <Globe size={12} />
                          Global Token
                        </span>
                      ) : (
                        <>
                          <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200/50">
                            {bot.token.substring(0, 10)}...{bot.token.substring(bot.token.length - 6)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(bot.token, bot.id, 'token')}
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            title="ចម្លង Token"
                          >
                            {copiedItem.id === bot.id && copiedItem.type === 'token' ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-6 font-mono text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200/50">
                        {bot.chatId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(bot.chatId, bot.id, 'chatId')}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                        title="ចម្លង Chat ID"
                      >
                        {copiedItem.id === bot.id && copiedItem.type === 'chatId' ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-center">
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
                      {/* Live Test Bot Button */}
                      <button 
                        type="button"
                        disabled={testingBotId === bot.id}
                        onClick={() => handleTestBot(bot)}
                        className="flex items-center justify-center w-8 h-8 bg-sky-50 border border-sky-100 text-sky-600 hover:bg-sky-100 hover:border-sky-200 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                        title="សាកល្បងផ្ញើសារ (Test Bot)"
                      >
                        {testingBotId === bot.id ? (
                          <Loader2 size={14} className="animate-spin text-sky-600" />
                        ) : (
                          <Send size={14} strokeWidth={2.5} />
                        )}
                      </button>
                      
                      {/* Edit Button */}
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingBot(bot);
                          setIsEditModalOpen(true);
                        }}
                        className="flex items-center justify-center w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-200 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200"
                        title="កែប្រែ"
                      >
                        <Edit size={14} strokeWidth={2.5} />
                      </button>
                      
                      {/* Delete Button */}
                      <button 
                        type="button"
                        onClick={() => setDeleteModal({ open: true, bot })}
                        className="flex items-center justify-center w-8 h-8 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 hover:border-rose-200 rounded-lg shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-200"
                        title="លុប Bot"
                      >
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
          globalTokens={globalTokens}
        />
      )}

      {isEditModalOpen && (
        <EditBotModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleEditBotSave} 
          classOptions={classOptions} 
          botData={editingBot}
          globalTokens={globalTokens}
        />
      )}
      
      {isGlobalTokenModalOpen && (
        <GlobalTokenModal 
          isOpen={isGlobalTokenModalOpen} 
          onClose={() => setIsGlobalTokenModalOpen(false)} 
          onSave={handleSaveGlobalTokens} 
          existingTokens={globalTokens}
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
              បញ្ជាក់ការលុប Telegram Bot
            </h3>
            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
              តើអ្នកពិតជាចង់លុប Bot សម្រាប់ថ្នាក់ <span className="font-bold text-slate-800">"{deleteModal.bot?.class}"</span> (Chat ID: <span className="font-mono text-slate-700 font-bold">{deleteModal.bot?.chatId}</span>) ចេញពីប្រព័ន្ធមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, bot: null })}
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
