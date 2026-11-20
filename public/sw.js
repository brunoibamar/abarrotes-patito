const CACHE = 'patito-demo-v6';
const FILES = ['./', './index.html', './app.js', './domain.js', './inventory-ui.js', './cash-view.js', './effects.js', './styles.css', './inventory.css', './effects.css', './theme.css', './icon.svg', './manifest.webmanifest'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('patito-demo-') && k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(r => r || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
