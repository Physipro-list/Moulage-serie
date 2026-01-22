// PhysiPro Service Worker v1048
// ================================
// Mode hybride: Cache + Network

const CACHE_NAME = 'physipro-v1048';
const OFFLINE_URL = './index.html';

// Fichiers à mettre en cache
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Installation
self.addEventListener('install', (event) => {
  console.log('[SW] Installation PhysiPro v1048');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Mise en cache des ressources');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation terminée');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erreur installation:', error);
      })
  );
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation PhysiPro v1048');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation terminée');
        return self.clients.claim();
      })
  );
});

// Fetch - Network First avec fallback cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Ignorer Firebase et APIs externes
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.protocol === 'chrome-extension:'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push reçu');
  
  let data = {
    title: 'PhysiPro',
    body: 'Nouvelle notification',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload.notification };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      vibrate: [200, 100, 200]
    })
  );
});

// Clic notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('physipro') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

// Messages
self.addEventListener('message', (event) => {
  console.log('[SW] Message:', event.data);
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') caches.delete(CACHE_NAME);
});

console.log('[SW] PhysiPro v1048 chargé');
