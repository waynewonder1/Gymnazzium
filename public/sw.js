// Service worker:
// 1. Offline: keeps a copy of the app on the device so it opens with no signal.
// 2. Push: shows workout reminders from the send-reminders Edge Function, even when the site isn't open.
//
// Pages are network-first (always fresh when online, cached copy when offline).
// App code in /assets/ has unique file names per build, so it's cache-first.
// Supabase and other APIs are never cached; the app handles those itself.

const SHELL = 'gz-shell-v1'; // index.html, app code, icons
const RUNTIME = 'gz-runtime-v1'; // Google Fonts
// Look-ups ignore the Vary header: some servers send "Vary: Origin", which would stop a
// file saved in the background from matching the page's own request for it.
const MATCH = { ignoreVary: true };
const CORE = ['/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

// Save index.html plus the app code it references, and drop code from older builds.
async function cacheAppShell(response) {
  const cache = await caches.open(SHELL);
  const page = response ?? (await fetch('/index.html', { cache: 'no-store' }));
  if (!page.ok) return;
  const html = await page.clone().text();
  await cache.put('/index.html', page);

  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  await Promise.all(
    [...CORE, ...assets].map(async (url) => {
      if (await cache.match(url, MATCH)) return;
      try {
        const res = await fetch(url);
        if (res.ok) await cache.put(url, res);
      } catch {
        // Offline right now; it'll be cached on a later visit.
      }
    })
  );
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/assets/') && !assets.includes(path)) await cache.delete(request);
  }
}

const OFFLINE_PAGE = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gymnazzium</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0A0E0C;color:#ECEFEC;font-family:sans-serif;text-align:center;padding:24px">
<div><h1 style="font-size:28px">You're offline</h1><p style="color:#9AA39F">Open Gymnazzium once with internet, and it'll work offline after that.</p></div></body>`;

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAppShell().catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => ![SHELL, RUNTIME].includes(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

async function networkFirstPage(event) {
  try {
    const res = await fetch(event.request);
    if (res.ok) event.waitUntil(cacheAppShell(res.clone()).catch(() => {}));
    return res;
  } catch {
    // Offline: every route is the same single-page app.
    const cached = await caches.match('/index.html', MATCH);
    return cached ?? new Response(OFFLINE_PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, MATCH);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) (await caches.open(SHELL)).put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(event.request, MATCH);
  const refresh = fetch(event.request)
    .then((res) => {
      if (res.ok || res.type === 'opaque') cache.put(event.request, res.clone());
      return res;
    })
    .catch(() => cached);
  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }
  return refresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') return event.respondWith(networkFirstPage(event));
    if (url.pathname.startsWith('/assets/') || CORE.includes(url.pathname)) return event.respondWith(cacheFirst(request));
    return; // everything else (sw.js, og images) goes to the network as normal
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    return event.respondWith(staleWhileRevalidate(event));
  }
  // Supabase and other services: straight to the network, never cached.
});

// ---------- Push reminders ----------
self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Gymnazzium', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'gymnazzium',
      data: { url: data.url || '/plan' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/plan', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open) {
        return open.focus().then((w) => (w && 'navigate' in w ? w.navigate(url) : w)).catch(() => {});
      }
      return self.clients.openWindow(url);
    })
  );
});
