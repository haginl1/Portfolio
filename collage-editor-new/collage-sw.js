const CACHE_NAME = 'collage-editor-v5';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/state.js',
  './js/storage.js',
  './js/image-manager.js',
  './js/grid-builder.js',
  './js/print-generator.js',
  './js/ui-controller.js',
  './collage-manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Some assets failed to cache:', err);
        return cache.add('./index.html');
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.includes(CACHE_NAME.split('-')[0])).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Network first for API calls
  if (url.pathname.includes('/api/')) {
    return e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
  
  // Cache first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseToCache));
        return response;
      }).catch(() => {
        // Return offline page if available
        return caches.match('./index.html');
      });
    })
  );
});
