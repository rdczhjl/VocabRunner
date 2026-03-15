const CACHE_NAME = 'vocab-runner-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icon.svg',
  '/src/main.tsx'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 忽略 API 请求
  if (url.pathname.startsWith('/api/')) return;

  // 忽略 Vite 的热更新请求 (@vite/client 等)
  if (url.pathname.includes('@vite') || url.pathname.includes('node_modules')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 策略：缓存优先，但后台更新 (Stale-While-Revalidate)
      // 这种策略对离线最友好
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(err => {
        console.log('[SW] Fetch failed, returning cache if available:', err);
        return cachedResponse; 
      });

      return cachedResponse || fetchPromise;
    }).catch(() => {
      // 如果完全失败，尝试返回首页
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
    })
  );
});
