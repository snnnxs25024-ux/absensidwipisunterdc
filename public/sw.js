
const CACHE_NAME = 'absensi-ipi-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon/favicon.svg'
];

// Install SW and cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
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

// Fetch strategy: Network first, fall back to cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // List of domains we want to cache (App itself + CDNs)
  const allowedDomains = [
    self.location.hostname,       // The app itself
    'aistudiocdn.com',            // React, Supabase JS, etc.
    'cdn.tailwindcss.com',        // Tailwind
    'fonts.googleapis.com',       // Fonts CSS
    'fonts.gstatic.com'           // Font files
  ];

  // Check if the request domain is in our allowed list
  const isAllowed = allowedDomains.some(domain => url.hostname.includes(domain));

  // Explicitly ignore Supabase API calls (let them be handled by the app logic/network)
  const isSupabaseApi = url.hostname.includes('supabase.co');

  // If it's an external API request or not in our allowed CDN list, don't cache it
  if (!isAllowed || isSupabaseApi) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'cors' && response.type !== 'basic') {
          return response;
        }

        // Clone the response to put one in the cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});
