const CACHE_NAME = 'the-way-v1';
// Core assets to pre-cache. Keep this list small and explicit.
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // Data seeds (optional - add files you generate)
  './data/hebrew/hebdate-2025.json',
  './data/parasha/parasha-5786.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS.map(a => new Request(a, { cache: 'reload' }))).catch(err => {
        // Ignore individual failures but ensure SW still installs
        console.warn('SW pre-cache failed:', err);
      });
    })
  );
});

// Runtime caching: prefer cache, fall back to network. Cache `data/` responses on first fetch.
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Always serve navigation requests from cache (SPA)
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(resp => resp || fetch('./index.html'))
    );
    return;
  }

  // For data files, try cache-first then network and cache the response
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(req).then(cached => cached || fetch(req).then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached))
      )
    );
    return;
  }

  // Default: cache-first then network
  event.respondWith(
    caches.match(req).then(resp => resp || fetch(req))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
