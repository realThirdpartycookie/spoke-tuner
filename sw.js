'use strict';
// SpokeTuner service worker — installable + offline app shell.
// Bump CACHE on every deploy so clients pick up new assets.
const CACHE = 'spoketuner-v2';
const ASSETS = [
  './', 'index.html', 'app.js', 'i18n.js', 'manifest.json', 'favicon.png',
  'icons/Icon-192.png', 'icons/Icon-512.png',
  'icons/Icon-maskable-192.png', 'icons/Icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first with network fallback; offline navigations fall back to the shell.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.ok && new URL(req.url).origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
