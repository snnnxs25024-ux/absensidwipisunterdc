
const CACHE_NAME = 'absensi-ipi-v2';
// Only cache local critical files during install.
// External CDNs will be cached at runtime (when they are fetched).
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/favicon/favicon.svg',
  '/manifest.json'
];

// Install SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // We use addAll but don't fail strictly if one fails (to ensure SW installs)
        // However, for strict offline, we ideally want them all. 
        // We stick to local files here to minimize failure risk during install.
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate SW and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Determine if we should cache this request
  const isLocal = url.hostname === self.location.hostname;
  const isCdn = [
    'aistudiocdn.com',
    'cdn.tailwindcss.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ].some(domain => url.hostname.includes(domain));

  // Skip Supabase API calls from caching strategies to ensure fresh data
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Strategy: Stale-While-Revalidate for static assets (HTML, JS, CSS, Images)
  // This serves cached content instantly, then updates the cache in the background.
  if (isLocal || isCdn) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Update cache with new version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // Network failed, do nothing (we rely on cache match below)
        });

        // Return cached response if found, else wait for network
        return cachedResponse || networkFetch;
      })
    );
  }
});
