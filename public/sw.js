const CACHE_NAME = 'maahi-pms-v4';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  // Activate immediately upon installation
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Optional assets cache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Purge ALL old/stale caches to eliminate white screen / stale JS chunk mismatches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          console.log('[SW] Deleting cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);

  // 1. Skip cross-origin, firestore, chrome extensions, or API requests
  if (!url.origin.includes(self.location.origin)) return;
  if (url.pathname.startsWith('/api/')) return;

  // 2. CRITICAL FIX FOR WHITE SCREEN & STALE CHUNKS:
  // For navigation requests (HTML), scripts (.js), styles (.css), and Vite assets:
  // ALWAYS fetch fresh from Network! NEVER serve stale JavaScript chunks or outdated HTML!
  const isScriptOrStyle = url.pathname.endsWith('.js') || 
                           url.pathname.endsWith('.css') || 
                           url.pathname.includes('/assets/') || 
                           url.pathname.includes('/src/') ||
                           url.pathname.includes('/@');

  const isNavigation = event.request.mode === 'navigate' || 
                       event.request.headers.get('accept')?.includes('text/html');

  if (isNavigation || isScriptOrStyle) {
    // Pure network pass-through: browser directly fetches latest version
    event.respondWith(fetch(event.request));
    return;
  }

  // 3. For static images/icons only: Network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
