// Cambia la versión al publicar cambios para que el móvil descargue la nueva app.
const VERSION = 'mishoras-v3';
const SHELL = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'pdf.js',
  'manifest.webmanifest',
  'vendor/jspdf.umd.min.js',
  'vendor/jspdf.plugin.autotable.min.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
  'icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// El botón "Actualizar app" pide activar ya la versión nueva
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fuentes de Google: caché en tiempo de ejecución
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(VERSION + '-fonts').then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          c.put(req, res.clone());
          return res;
        } catch {
          return new Response('', { status: 504 });
        }
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // App: red primero (para recibir actualizaciones), caché si no hay conexión
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
  );
});
