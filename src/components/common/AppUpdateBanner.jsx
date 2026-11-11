import { useState, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, Sparkles, X, Loader2 } from 'lucide-react'
import { APP_VERSION, checkForAppUpdate, applyAppUpdate } from '../../utils/version'

const CHECK_COOLDOWN_MS = 60 * 1000
const BACKGROUND_INTERVAL_MS = 5 * 60 * 1000

/**
 * Floating global banner that notifies open Chrome tabs (pre-login or logged-in)
 * whenever a newer static build is deployed on hosting (0 Firebase reads).
 */
export default function AppUpdateBanner() {
  const [remoteVersion, setRemoteVersion] = useState('')
  const [dismissedVersion, setDismissedVersion] = useState('')
  const [reloading, setReloading] = useState(false)
  const lastCheckRef = useRef(0)

  const runCheck = useCallback(async (bypassCooldown = false) => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return
    const now = Date.now()
    if (!bypassCooldown && now - lastCheckRef.current < CHECK_COOLDOWN_MS) return
    lastCheckRef.current = now

    try {
      const result = await checkForAppUpdate()
      if (result.hasUpdate && result.remoteVersion) {
        setRemoteVersion(result.remoteVersion)
      }
    } catch {
      // Offline or transient network error — silently skip until next check
    }
  }, [])

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      runCheck(true)
    }, 2500)

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        runCheck(false)
      }
    }

    const handleManualTrigger = () => {
      setDismissedVersion('')
      runCheck(true)
    }

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        runCheck(false)
      }
    }, BACKGROUND_INTERVAL_MS)

    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)
    window.addEventListener('app-check-update', handleManualTrigger)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('focus', handleVisibilityOrFocus)
      window.removeEventListener('app-check-update', handleManualTrigger)
    }
  }, [runCheck])

  const handleReload = async () => {
    setReloading(true)
    await applyAppUpdate()
  }

  if (!remoteVersion || remoteVersion === APP_VERSION || dismissedVersion === remoteVersion) {
    return null
  }

  return (
    <aside
      aria-label="សេចក្តីជូនដំណឹងអាប់ដេតប្រព័ន្ធ"
      className="fixed bottom-16 sm:bottom-5 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100vw-24px)] max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 sm:p-3.5 shadow-[0_14px_40px_-8px_rgba(15,23,42,0.45)] border border-indigo-400/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-bold text-white leading-tight">
                មានការអាប់ដេតប្រព័ន្ធថ្មី!
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {remoteVersion}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 truncate">
              សូមផ្ទុកទំព័រឡើងវិញដើម្បីប្រើជំនាន់ចុងក្រោយ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleReload}
            disabled={reloading}
            className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-[12px] font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-60 shadow-sm"
          >
            {reloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            <span>{reloading ? 'កំពុងផ្ទុក...' : 'ផ្ទុកឡើងវិញ'}</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissedVersion(remoteVersion)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="បិទបណ្តោះអាសន្ន"
            aria-label="បិទ"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
