const CACHE_NAME = 'blog-offline-v3.8';
const ASSETS_TO_CACHE = [
  '/',
  '/?m=1',
];

// 1. Install Service Worker dan Simpan Halaman Utama
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Aktifkan Service Worker dan Bersihkan Cache Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Strategi Cache-First dengan Dynamic Caching untuk Halaman Lain
self.addEventListener('fetch', (event) => {
  // Hanya tangani permintaan GET (halaman web atau aset)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika halaman sudah ada di cache, langsung berikan (bisa dibuka meski offline)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Jika tidak ada di cache, ambil dari internet
      return fetch(event.request)
        .then((response) => {
          // Pastikan respons valid sebelum disimpan ke cache
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          let responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Jika internet mati dan halaman tidak ada di cache, arahkan ke halaman utama/beranda yang tersimpan
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
