// Service Worker der Dorfromantik-App. Die App ist nur online nutzbar (docs/entscheidungen.md, 25.11.2026):
// Die Oberfläche (Skript, Stile, Bilder) wird zwischengespeichert, der Server hat immer Vorrang. Ohne Verbindung
// erscheint beim Seitenaufruf ein Hinweis. Kampagnendaten und schreibende Anfragen fasst der Worker nie an.
// Ausgeliefert von PwaController, getestet in test/nextcloud-sw.test.js.

const CACHE = 'dorfromantik-oberflaeche-v1';
const ASSET = /\.(js|mjs|css|png|svg|ico|woff2?)$/;

const OFFLINE_PAGE = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Dorfromantik</title></head>
<body style="font-family: system-ui, sans-serif; background: #f7f4ec; color: #2d2a24; padding: 2rem; text-align: center">
<h1>Keine Verbindung zur Nextcloud</h1>
<p>Bitte prüft WLAN oder VPN. Die Kampagnen liegen nur auf dem Server.</p>
<p><a href="" style="color: #4f7a3a; font-weight: 600">Erneut versuchen</a></p>
</body>
</html>`;

const offlinePage = () => new Response(OFFLINE_PAGE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const stored = await cache.match(request);
    if (stored) return stored;
    throw error;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter((key) => key.startsWith('dorfromantik-') && key !== CACHE);
    await Promise.all(old.map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  // Seiten hängen an der Anmeldung und werden nie gespeichert.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(offlinePage));
  } else if (ASSET.test(url.pathname)) {
    event.respondWith(networkFirst(request));
  }
});
