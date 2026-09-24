const CACHE = 'atemschutz-pwa-v1.0.1-1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png','./jsQR.js','./qrcode-generator.js'
];
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    await Promise.allSettled(LIBS.map(async url => {
      try {
        const res = await fetch(url, {mode:'cors', cache:'no-cache'});
        if (res && res.ok) await cache.put(url, res.clone());
      } catch(e) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if(cached) return cached;
    try {
      const res = await fetch(req);
      const url = new URL(req.url);
      if(url.origin === location.origin || LIBS.includes(req.url)) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone()).catch(()=>{});
      }
      return res;
    } catch(e) {
      if(req.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if(fallback) return fallback;
      }
      throw e;
    }
  })());
});
