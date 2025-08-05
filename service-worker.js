self.addEventListener('install', e => {
  console.log("Service Worker Installed");
  e.waitUntil(caches.open('solo-cache').then(cache => cache.addAll([
    '/',
    '/index.html',
    '/manifest.json'
  ])));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(response => response || fetch(e.request)));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
