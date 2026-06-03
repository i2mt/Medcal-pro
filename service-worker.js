// Service Worker – NO CACHING, always fresh from network
self.addEventListener('install', event => {
    console.log('SW installed – skipping cache');
    self.skipWaiting();
});
self.addEventListener('activate', event => {
    console.log('SW activated – deleting all caches');
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    );
    return self.clients.claim();
});
self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request));
});