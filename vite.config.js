import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

function getPhnomPenhVersion() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Phnom_Penh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date())
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]))
  return `v${map.year}.${map.month}.${map.day}-${map.hour}${map.minute}`
}

const APP_VERSION = getPhnomPenhVersion()
const BUILD_TIME = new Date().toISOString()

/**
 * Generates static version.json in build output (and serves it in dev) for zero-quota update checks.
 */
function versionManifestPlugin() {
  const payload = JSON.stringify({ version: APP_VERSION, builtAt: BUILD_TIME })
  return {
    name: 'version-manifest',
    configureServer(server) {
      server.middlewares.use('/Attandance_management/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(payload)
      })
    },
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir || 'dist'
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(path.join(outDir, 'version.json'), payload, 'utf8')
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), versionManifestPlugin()],
  base: '/Attandance_management/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(BUILD_TIME)
  }
})
