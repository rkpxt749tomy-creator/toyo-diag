const CACHE = 'toyo-diag-v1';
const ASSETS = ['./','./index.html','./style.css','./app.js','./data.js','./manifest.json','./icon.svg'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request, { cache: 'no-store' });
      if (res && res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    } catch {
      const cached = await caches.match(e.request);
      return cached || new Response('Offline', { status: 503 });
    }
  })());
});
