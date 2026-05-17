const CACHE_NAME = 'c21-projects-v2.0.0';
const STATIC_CACHE = 'c21-static-v2.0.0';
const DYNAMIC_CACHE = 'c21-dynamic-v2.0.0';

// Archivos estáticos para cachear en instalación
const STATIC_FILES = [
  './',
  './index.html',
  './manifest.json',
  './js/app.js',
  './js/engine.js',
  './js/validator.js',
  './js/cefrEngine.js',
  './js/steamEngine.js',
  './js/socialAgent.js',
  './js/rubricEngine.js',
  './js/exporter.js',
  './js/vendor/docx.umd.js',
  './js/vendor/FileSaver.js'
];

// Archivos de datos (cachear bajo demanda)
const DATA_FILES = [
  './data/grade_pre-k.json',
  './data/grade_kinder.json',
  './data/grade_1.json',
  './data/grade_2.json',
  './data/grade_3.json',
  './data/grade_4.json',
  './data/grade_5.json',
  './data/grade_6.json'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación y limpieza de cachés antiguos
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Estrategia de fetch: Cache First, falling back to Network
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip para requests que no sean GET
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          console.log('[SW] Serving from cache:', request.url);
          return response;
        }

        // Si no está en caché, hacer fetch y cachear dinámicamente
        return fetch(request)
          .then(networkResponse => {
            // Solo cachear respuestas exitosas
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Cachear archivos JSON de datos
            if (request.url.includes('.json')) {
              return caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  console.log('[SW] Caching dynamically:', request.url);
                  cache.put(request, networkResponse.clone());
                  return networkResponse;
                });
            }

            return networkResponse;
          })
          .catch(error => {
            console.error('[SW] Fetch failed:', error);
            // Aquí podrías retornar una página offline personalizada
            return new Response('Offline - Please check your connection', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Mensaje para actualizar el SW
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
