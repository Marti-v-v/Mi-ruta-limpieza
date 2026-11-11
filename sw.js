// Sube el número de versión cada vez que cambies index.html
const CACHE = "ruta-limpieza-v13";
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

// La página y la configuración: primero internet (siempre la versión nueva); sin cobertura, la guardada.
// Iconos y librerías de Firebase: primero la caché.
// Las llamadas a la base de datos y al login NO pasan por aquí: Firebase las gestiona solo.
self.addEventListener("fetch", e => {
  const req = e.request, url = req.url;
  const propio = url.startsWith(self.location.origin);
  const libreria = url.startsWith("https://www.gstatic.com/firebasejs/");
  if (req.method !== "GET" || !(propio || libreria)) return;
  const guardar = resp => { if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then(c => c.put(req, copia)); } return resp; };
  const esPagina = req.mode === "navigate" || /\/(index\.html|firebase-config\.js)?$/.test(new URL(url).pathname);
  if (propio && esPagina) {
    e.respondWith(fetch(req, { cache: "no-store" }).then(guardar).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(c => c || fetch(req).then(guardar)));
});
