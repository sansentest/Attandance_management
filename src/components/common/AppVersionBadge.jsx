import { useState } from 'react'
import { APP_VERSION, checkForAppUpdate } from '../../utils/version'

/**
 * Displays the current build version and allows manual one-click update verification (0 Firebase reads).
 */
export default function AppVersionBadge({ className = '' }) {
  const [statusText, setStatusText] = useState('')

  const handleCheck = async () => {
    setStatusText('កំពុងពិនិត្យ...')
    try {
      const result = await checkForAppUpdate()
      if (result.hasUpdate) {
        setStatusText('')
        window.dispatchEvent(new CustomEvent('app-check-update'))
      } else {
        setStatusText('ជំនាន់ចុងក្រោយហើយ')
        setTimeout(() => setStatusText(''), 2500)
      }
    } catch {
      setStatusText('')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCheck}
      title="ចុចដើម្បីពិនិត្យមើលការអាប់ដេតប្រព័ន្ធ"
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer select-none ${className}`}
    >
      <span>ជំនាន់ {APP_VERSION}</span>
      {statusText && (
        <span className="text-[10px] font-bold text-indigo-500">({statusText})</span>
      )}
    </button>
  )
}
