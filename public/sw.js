const CACHE_NAME = 'arete-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700;800&display=swap',
  'https://fonts.gstatic.com/s/instrumentsans/v1/QldNNTtFjaY0MTBkMFJALSqUMs1TZI3xi-gU.ttf',
  'https://fonts.gstatic.com/s/jetbrainsmono/v13/tDbY2oFlcvOJKTDaNyJ6jZy5e1_dCag.ttf'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached response if found
        if (response) {
          return response;
        }

        // Clone the request and fetch from network if not in cache
        const fetchRequest = event.request.clone();

        // Handle API requests specially (like AI calls that can't be cached)
        if (event.request.url.includes('/api/')) {
          // For API calls, always go to network
          return fetch(fetchRequest).catch(() => {
            // If offline and AI services are unavailable, 
            // return a meaningful offline response
            if (event.request.url.includes('/api/gemini') || 
                event.request.url.includes('/api/ai')) {
              return new Response(JSON.stringify({ text: "AI connection offline. Can't process this request until online again." }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            // For other API requests, throw error
            throw new Error('Network request failed and resource not in cache');
          });
        }

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response to store in cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Network request failed, try to return from cache
          return caches.match(event.request);
        });
      })
  );
});

// Handle messaging from the app (e.g., to queue requests when offline)
self.addEventListener('message', event => {
  // Handle messages from the app
});

// Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});