// Service worker: při instalaci uloží všechny soubory hry, pak hra běží i bez internetu.
// Nová verze (změněné CACHE_VERSION) se stáhne na pozadí a projeví se při dalším spuštění.
const CACHE_VERSION = 'kocka-v1';
const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'src/art/avocado.js',
  'src/art/cat.js',
  'src/art/effects.js',
  'src/art/fish.js',
  'src/art/heart.js',
  'src/art/scene.js',
  'src/art/shapes.js',
  'src/art/squirrel.js',
  'src/audio.js',
  'src/cat.js',
  'src/collision.js',
  'src/config.js',
  'src/daynight.js',
  'src/game.js',
  'src/input.js',
  'src/main.js',
  'src/obstacles.js',
  'src/pickups.js',
  'src/storage.js',
  'src/ui-draw.js',
  'src/ui.js',
  'src/viewport.js',
  'src/world.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const page = await cache.match('index.html');
        if (page) return page;
      }
      return fetch(req);
    }),
  );
});
