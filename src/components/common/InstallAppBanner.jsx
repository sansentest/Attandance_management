import { useState, useEffect } from 'react'
import { Download, X, Share2, Smartphone, Monitor, CheckCircle2 } from 'lucide-react'

const FALLBACK_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Emblem_of_the_Ministry_of_Education%2C_Youth_and_Sport_%28Cambodia%29.svg'

export default function InstallAppBanner({ schoolName = 'វិទ្យាល័យអង្គរកា', logoUrl = 'icon-192.png' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosTip, setShowIosTip] = useState(false)
  const [showDesktopTip, setShowDesktopTip] = useState(false)

  // Resolve base path dynamically for GitHub Pages, custom domain, and localhost
  const getAssetUrl = (path) => {
    if (!path) return FALLBACK_LOGO
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ? import.meta.env.BASE_URL : './'
    const cleanPath = String(path).replace(/^\.?\//, '')
    const cleanBase = base.endsWith('/') ? base : base + '/'
    return cleanBase + cleanPath
  }

  const effectiveLogo = getAssetUrl(logoUrl || 'icon-192.png')

  useEffect(() => {
    // 1. Check if already installed & running in standalone mode
    if (typeof window === 'undefined') return
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true ||
                         document.referrer.includes('android-app://')
    if (isStandalone) return

    // 2. Check if dismissed during this browser session
    try {
      if (sessionStorage.getItem('dismiss_install_app_banner') === '1') return
    } catch {}

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent
    const isIosDevice = /iPhone|iPad|iPod/i.test(ua) && !window.MSStream
    setIsIos(isIosDevice)

    // 4. Connect to early prompt captured in index.html
    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt)
      setVisible(true)
    }

    const handlePromptAvailable = (e) => {
      const promptObj = e?.detail || window.__pwaInstallPrompt
      if (promptObj) {
        setDeferredPrompt(promptObj)
        setVisible(true)
      }
    }

    window.addEventListener('pwa-prompt-available', handlePromptAvailable)

    // 5. Also listen for beforeinstallprompt in case it fires now
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      window.__pwaInstallPrompt = e
      setDeferredPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Show banner after 600ms
    const timer = setTimeout(() => {
      setVisible(true)
    }, 600)

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      clearTimeout(timer)
    }
  }, [])

  const handleInstallClick = async () => {
    const promptToUse = deferredPrompt || (typeof window !== 'undefined' ? window.__pwaInstallPrompt : null)
    if (promptToUse) {
      // Android / Chromium Desktop native auto-install prompt
      try {
        promptToUse.prompt()
        const { outcome } = await promptToUse.userChoice
        if (outcome === 'accepted') {
          setVisible(false)
          setDeferredPrompt(null)
          if (typeof window !== 'undefined') window.__pwaInstallPrompt = null
        }
      } catch (err) {
        console.warn('Install prompt error:', err)
      }
    } else if (isIos) {
      // iPhone / iPad helper tooltip
      setShowIosTip(true)
    } else {
      // Desktop or Android where prompt hasn't fired yet
      setShowDesktopTip(true)
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    setShowIosTip(false)
    setShowDesktopTip(false)
    try {
      sessionStorage.setItem('dismiss_install_app_banner', '1')
    } catch {}
  }

  if (!visible) return null

  return (
    <>
      {/* ── Top-Right Floating Pill Banner ── */}
      <aside aria-label="Install App Banner" className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[999] max-w-[calc(100vw-24px)] sm:max-w-md animate-in slide-in-from-top-3 fade-in duration-300">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-[0_12px_40px_-8px_rgba(79,70,229,0.25)] border border-indigo-100 flex items-center justify-between gap-2.5 sm:gap-3 transition-all hover:shadow-[0_16px_50px_-8px_rgba(79,70,229,0.35)]">
          
          {/* Logo & Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 border border-indigo-100 shadow-xs shrink-0 overflow-hidden">
              <img
                src={effectiveLogo}
                alt="School Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  if (e.currentTarget.src !== FALLBACK_LOGO) {
                    e.currentTarget.src = FALLBACK_LOGO
                  }
                }}
              />
            </div>
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[12px] sm:text-[13px] font-extrabold text-slate-800 truncate leading-tight">
                  ប្រព័ន្ធគ្រប់គ្រងអវត្តមាន{schoolName ? ` ${schoolName}` : ''}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate mt-0.5">
                ដំឡើងដាក់លើ Screen ទូរស័ព្ទ / កុំព្យូទ័រ
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 py-1.5 px-3 sm:py-2 sm:px-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-700 hover:to-blue-700 active:scale-95 text-white font-bold text-[11.5px] sm:text-[12.5px] rounded-xl shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap"
              title="ចុចដើម្បីដំឡើងកម្មវិធីលើអេក្រង់ដើម"
            >
              <Download size={14} strokeWidth={2.5} />
              <span>Install Now</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="បិទ"
              aria-label="បិទ"
            >
              <X size={15} />
            </button>
          </div>

        </div>
      </aside>

      {/* ── iOS Safari Tooltip Guide (if on iPhone) ── */}
      {showIosTip && (
        <div className="fixed inset-x-3 bottom-4 sm:bottom-6 z-[1000] max-w-sm mx-auto animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 relative">
            <button
              onClick={() => setShowIosTip(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2 mb-2 font-bold text-[13px] text-indigo-300">
              <Share2 size={16} className="text-indigo-400" />
              <span>របៀបដំឡើងលើ iPhone / Safari</span>
            </div>
            <ol className="text-[12px] text-slate-200 space-y-1.5 font-medium pl-1">
              <li>១. ចុចប៊ូតុង <b>Share 📤</b> នៅរបារខាងក្រោមនៃ Safari</li>
              <li>២. រមូរចុះក្រោម រួចជ្រើសរើស <b>«បន្ថែមទៅអេក្រង់ដើម (Add to Home Screen)»</b></li>
            </ol>
            <button
              onClick={() => setShowIosTip(false)}
              className="mt-3 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[12px] transition-colors"
            >
              យល់ហើយ
            </button>
            <div className="w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45 mx-auto -mb-5.5 mt-2"></div>
          </div>
        </div>
      )}

      {/* ── Desktop Tip (if deferredPrompt not triggered yet) ── */}
      {showDesktopTip && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-[13px]">
                <Monitor size={17} />
                <span>ដំឡើងលើកុំព្យូទ័រ (Desktop Chrome / Edge)</span>
              </div>
              <button onClick={() => setShowDesktopTip(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="py-3 text-[12.5px] text-slate-600 space-y-2">
              <p>សូមក្រឡេកមើល **របារអាសយដ្ឋាន (URL Address Bar)** ខាងលើស្ដាំនៃ Browser របស់អ្នក៖</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2 font-bold text-slate-800">
                <Download size={16} className="text-indigo-600 shrink-0" />
                <span>ចុចលើសញ្ញា «Install App (ដំឡើងកម្មវិធី)» លើ URL Bar</span>
              </div>
              <p className="text-[11px] text-slate-400">វានឹងបង្កើត Shortcut លើ Desktop កុំព្យូទ័ររបស់អ្នកភ្លាម!</p>
            </div>
            <button
              onClick={() => setShowDesktopTip(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[12.5px] rounded-xl transition-colors cursor-pointer"
            >
              យល់ព្រម
            </button>
          </div>
        </div>
      )}
    </>
  )
}


