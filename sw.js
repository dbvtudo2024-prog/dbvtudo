// Service Worker for DBV Tudo
const CACHE_NAME = 'dbv-tudo-v3.1.2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        const client = clientList[0];
        client.focus();
        if (event.action === 'update') {
          client.postMessage({ type: 'FORCE_UPDATE_NOW' });
        }
        client.navigate(client.url);
      } else {
        self.clients.openWindow('/?update_now=1');
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Não interceptar requisições POST, rotas de API, version.json ou chamadas ao Supabase/Google
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('version.json') ||
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('googleapis.com')
  ) {
    return;
  }
});


