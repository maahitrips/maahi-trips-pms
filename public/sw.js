const CACHE_NAME = 'maahi-pms-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
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
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // 3. Handle only GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 5. Bypass Firestore / googleapis.com, firebaseapp.com, and /api/ requests completely
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('cloud.google.com') ||
    url.pathname.startsWith('/api/') ||
    !url.origin.includes(self.location.origin)
  ) {
    return;
  }

  const isNavigation = event.request.mode === 'navigate' || 
                       event.request.headers.get('accept')?.includes('text/html');

  // 1 & 2 & 4: event.respondWith always returns a valid Response. Network-first for navigation, cache-first/fallback for assets with 503 offline response.
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // Fetch failed, check cache first
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If navigation request and not in cache, fallback to cached root / index.html if available
        if (isNavigation) {
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
        }

        // Neither network nor cache available: return valid 503 Response
        if (isNavigation) {
          return new Response(
            '<!DOCTYPE html><html><head><title>Offline - Maahi Trips</title></head><body style="font-family:sans-serif;text-align:center;padding:60px;"><h1>You are offline</h1><p>Please check your internet connection and try again.</p></body></html>',
            { 
              status: 503, 
              headers: { 'Content-Type': 'text/html' } 
            }
          );
        }

        return new Response('Offline', { status: 503 });
      }
    })()
  );
});
