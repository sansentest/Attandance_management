/**
 * Build version constant injected at Vite build time (Asia/Phnom_Penh timestamp).
 */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'v-dev'
export const BUILD_TIME = import.meta.env.VITE_BUILD_TIME || ''

const VERSION_PATTERN = /^v[A-Za-z0-9._-]{1,40}$/

function getBasePath() {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base : `${base}/`
}

/**
 * Fetches static version.json with cache-bypassing headers (0 Firebase reads).
 */
export async function checkForAppUpdate() {
  if (typeof window === 'undefined' || import.meta.env.DEV) {
    return { hasUpdate: false, remoteVersion: APP_VERSION }
  }
  const url = `${getBasePath()}version.json?t=${Date.now()}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    return { hasUpdate: false, remoteVersion: APP_VERSION }
  }
  const data = await res.json()
  const remoteVersion = typeof data?.version === 'string' ? data.version.trim() : ''
  if (!VERSION_PATTERN.test(remoteVersion)) {
    return { hasUpdate: false, remoteVersion: APP_VERSION }
  }
  return {
    hasUpdate: remoteVersion !== APP_VERSION,
    remoteVersion
  }
}

/**
 * Refreshes cached entry HTML + Service Worker and reloads the page while keeping session storage intact.
 */
export async function applyAppUpdate() {
  const base = getBasePath()
  try {
    await fetch(base, { cache: 'reload' }).catch(() => {})
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.update().catch(() => {})
      }
    }
  } catch {
    // Ignore SW/prefetch issues and fall through to hard reload
  }
  window.location.reload()
}
