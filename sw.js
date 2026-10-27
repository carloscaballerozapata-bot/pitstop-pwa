// ============================================================
// GO KART SPORT BAR — Service Worker
// Al publicar cambios, subir CACHE_NAME (gokart-v3, v4…) para que los teléfonos los reciban.
// ============================================================
const CACHE_NAME = "gokart-v3";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./mapa.html",
  "./menu.html",
  "./cuenta.html",
  "./admin.html",
  "./css/styles.css",
  "./js/api.js",
  "./js/app.js",
  "./js/mapa.js",
  "./js/menu.js",
  "./js/admin.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./img/logo.png",
  "./img/render-pista.jpg",
  "./img/render-aereo.jpg",
  "./img/galeria-mural.jpg",
  "./img/como-llegar.jpg"
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
  // Solo GET a archivos propios: la API (script.google.com) y las fuentes van siempre directo a la red
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("script.google.com")) return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  if (e.request.mode === "navigate") {
    // Páginas: red primero (recibe actualizaciones); sin conexión, la copia guardada
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, clone)); }
        return res;
      }).catch(() =>
        caches.match(e.request, { ignoreSearch: true }).then(cached => cached || caches.match("./index.html")).then(cached => cached || new Response(
          '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GO KART — Sin conexión</title>' +
          '<style>body{background:#090b10;color:#f5f7fb;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}' +
          '.c{padding:2rem}h1{font-size:1.6rem}p{color:#a5adbb;margin-top:1rem}button{background:#ff3545;color:#fff;border:none;padding:.8rem 2rem;border-radius:10px;font-size:1rem;cursor:pointer}</style></head>' +
          '<body><div class="c"><h1>🏎️ GO KART SPORT BAR</h1><p>Sin conexión. Intenta de nuevo cuando tengas internet.</p>' +
          '<p style="margin-top:2rem"><button onclick="location.reload()">Reintentar</button></p></div></body></html>',
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        ))
      )
    );
  } else {
    // CSS, JS, imágenes: caché primero
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, clone)); }
        return res;
      }))
    );
  }
});
