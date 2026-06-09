const CACHE = 'el-impostor-v2';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/favicon.svg'];

function canCache(request, response) {
  return request.method === 'GET' && !request.headers.has('range') && response.status === 200;
}

function cacheResponse(request, response) {
  if (!canCache(request, response)) return;
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Network-first para navegación (HTML)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then((res) => {
        cacheResponse(e.request, res);
        return res;
      }).catch(() => caches.match(e.request).then((r) => r || caches.match('/index.html')))
    );
    return;
  }
  // Cache-first para assets estáticos del mismo origen
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
        cacheResponse(e.request, res);
        return res;
      }))
    );
  }
});
