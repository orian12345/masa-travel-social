// Deliberately minimal: this site is almost entirely session-gated,
// personalized, and live (feed, chat, requests) — caching HTML pages or API
// responses would risk showing a user stale or even another session's data.
// This service worker exists only to satisfy "installability" (Add to Home
// Screen needs one registered) and to make the icon/manifest available
// offline; everything else always goes straight to the network.
const SHELL_CACHE = 'travelmatch-shell-v1';
const SHELL_ASSETS = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const isShellAsset = SHELL_ASSETS.some((path) => event.request.url.endsWith(path));
  if (!isShellAsset) return; // let the browser handle everything else normally

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
