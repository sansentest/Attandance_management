// ─────────────────────────────────────────────
// Service Worker for Ang Roka High School PWA
// Enables 1-Click Installation on Desktop & Mobile
// ─────────────────────────────────────────────

const CACHE_NAME = 'angroka-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Let network handle dynamic data; never intercept version.json so update checks stay live
  if (event.request.method !== 'GET') return;
  const reqUrl = new URL(event.request.url);
  if (reqUrl.pathname.endsWith('/version.json')) return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

