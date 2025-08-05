self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('solo-cache').then((cache) => {
      return cache.addAll(['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png']);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => resp || fetch(event.request))
  );
});
