// static/service-worker.js
const CACHE = 'kota-deals-cache-v1';
const ASSETS = [
  '/', '/static/app.js', '/static/manifest.json'
];

self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', evt => {
  const req = evt.request;
  if (req.method !== 'GET') return;
  evt.respondWith(caches.match(req).then(res => res || fetch(req)));
});
