// Service worker: při instalaci uloží všechny soubory hry, pak hra běží i bez internetu.
// Nová verze (změněné CACHE_VERSION) se stáhne na pozadí a zapne se na úvodní obrazovce,
// nebo nejpozději při dalším spuštění. Uprostřed hraní nikdy.
const CACHE_VERSION = 'kocka-v1';
const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'src/accessories.js',
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
  'src/tutorial.js',
  'src/update.js',
  'src/ui-draw.js',
  'src/ui.js',
  'src/viewport.js',
  'src/world.js',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' = vždy čerstvé soubory ze sítě, ne starší kopie z HTTP cache prohlížeče
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) =>
    cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })))));
});

// Hra požádá o převzetí řízení, až je na úvodní obrazovce (src/update.js).
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
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
