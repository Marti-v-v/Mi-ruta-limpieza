// Sube el número de versión cada vez que cambies index.html
const CACHE = "ruta-limpieza-v6";
const FILES = ["./", "./index.html", "./firebase-config.js", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Archivos de la app y librerías de Firebase: primero la caché (funciona sin cobertura).
// Las llamadas a la base de datos y al login NO pasan por aquí: Firebase las gestiona solo.
self.addEventListener("fetch", e => {
  const url = e.request.url;
  const propio = url.startsWith(self.location.origin);
  const libreria = url.startsWith("https://www.gstatic.com/firebasejs/");
  if (e.request.method !== "GET" || !(propio || libreria)) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      const red = fetch(e.request).then(resp => {
        if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
        return resp;
      }).catch(() => cached);
      return cached || red;
    })
  );
});
