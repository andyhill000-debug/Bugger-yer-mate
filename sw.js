// Bugger Yer Mate — Service Worker
// Version: 2026.03.26.10

const CACHE_NAME = 'bym-v10';

const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-32.png',
  './icon-76.png',
  './icon-120.png',
  './icon-152.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          console.warn('SW: failed to cache', asset, e);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// Activate: delete ALL previous caches unconditionally
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        console.log('SW: deleting cache', k);
        return caches.delete(k);
      }))
    ).then(() => {
      caches.open(CACHE_NAME);
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'GET_VERSION') {
    event.source.postMessage({ type: 'VERSION', version: CACHE_NAME });
  }
});
