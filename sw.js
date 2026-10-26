// ============================================================
// PITSTOP — Service Worker
// ============================================================
const CACHE_NAME = "pitstop-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./css/styles.css",
  "./js/api.js",
  "./js/app.js",
  "./js/admin.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("script.google.com")) return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  const isNavigation = e.request.mode === "navigate";

  if (isNavigation) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        return caches.match(e.request).then(cached => {
          return cached || new Response(
            '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PITSTOP Offline</title>' +
            '<style>body{background:#090b10;color:#f5f7fb;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}' +
            '.c{padding:2rem}h1{font-size:2rem;font-style:italic}p{color:#a5adbb;margin-top:1rem}</style></head>' +
            '<body><div class="c"><h1>🏎️ PITSTOP</h1><p>Sin conexión. Intenta de nuevo cuando tengas internet.</p>' +
            '<p style="margin-top:2rem"><button onclick="location.reload()" style="background:#ff3545;color:#fff;border:none;padding:.8rem 2rem;border-radius:8px;font-size:1rem;cursor:pointer">Reintentar</button></p></div></body></html>',
            { headers: { "Content-Type": "text/html" } }
          );
        });
      })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        });
      })
    );
  }
});
