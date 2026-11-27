/*
 * Service worker - makes the app shell, static assets and uploaded images available offline.
 * Notes / labels (API data) are NOT cached here: they are stored in IndexedDB by src/offline.
 *
 * Strategies
 *   page navigation        network first, fall back to the cached index.html (single page app)
 *   /assets/*              cache first   (Vite file names contain a content hash)
 *   /uploads/*             stale while revalidate (avatars, images, attachments)
 *   other same-origin GET  stale while revalidate
 *   /api/*, /ws, non-GET   never touched
 *
 * Bump VERSION to force every browser to drop the old caches.
 */
const VERSION = 'v1';
const SHELL_CACHE = `noteapp-shell-${VERSION}`;
const ASSET_CACHE = `noteapp-assets-${VERSION}`;
const UPLOAD_CACHE = `noteapp-uploads-${VERSION}`;
const KEEP = [SHELL_CACHE, ASSET_CACHE, UPLOAD_CACHE];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Pre-cache the shell AND the hashed JS/CSS it references, so the app also opens offline
      // after the very first visit (files loaded before the worker took control are not cached otherwise).
      const res = await fetch('/index.html', { cache: 'no-cache' });
      const html = await res.clone().text();
      await (await caches.open(SHELL_CACHE)).put('/index.html', res);
      const urls = [...html.matchAll(/(?:src|href)="(\/[^"#?]+\.(?:js|css|svg|png|ico|webmanifest))"/g)].map((m) => m[1]);
      const assets = await caches.open(ASSET_CACHE);
      await Promise.all([...new Set([...urls, '/manifest.webmanifest', '/icons/icon-192.png'])].map((u) => assets.add(u).catch(() => {})));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith('noteapp-') && !KEEP.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

async function navigate(request) {
  try {
    const res = await fetch(request);
    if (res.ok) (await caches.open(SHELL_CACHE)).put('/index.html', res.clone());
    return res;
  } catch (err) {
    return (await caches.match('/index.html')) || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') (await caches.open(cacheName)).put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res.ok && res.type === 'basic' && res.status === 200) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname === '/ws' || url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith(navigate(request));
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
  } else if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(staleWhileRevalidate(request, UPLOAD_CACHE));
  } else {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
});
