/*
 * RNF-006 · Service worker de EcoLogística: guarda la aplicación en el celular para que el modo conductor
 * abra aunque no haya señal. Los datos de la API no se guardan aquí (los maneja src/offline.ts).
 */
const VERSION = 'ecologistica-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(['/', '/index.html'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// La primera visita descarga los archivos antes de que el service worker esté activo: la página le pasa la lista
self.addEventListener('message', (event) => {
  // Solo se aceptan mensajes de páginas de este mismo sitio
  if (event.origin !== self.location.origin) return;
  const urls = (event.data && event.data.tipo === 'guardar' && Array.isArray(event.data.urls) && event.data.urls) || [];
  const propias = urls.filter((u) => {
    const destino = new URL(u, self.location.origin);
    return destino.origin === self.location.origin && destino.pathname.startsWith('/assets/');
  });
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(propias)).catch(() => undefined));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Pantallas: primero la red (versión nueva) y, sin señal, la copia guardada
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((r) => {
          const copia = r.clone();
          caches.open(VERSION).then((c) => c.put('/index.html', copia)).catch(() => undefined);
          return r;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  // Archivos con huella (/assets/...): no cambian, se sirven desde la copia guardada
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (guardado) =>
          guardado ||
          fetch(request).then((r) => {
            if (r.ok) {
              const copia = r.clone();
              caches.open(VERSION).then((c) => c.put(request, copia)).catch(() => undefined);
            }
            return r;
          }),
      ),
    );
  }
});
