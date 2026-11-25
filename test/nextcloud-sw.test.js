// Service Worker der Nextcloud-App. Entscheidung 25.11.2026: nur online. Der Service Worker speichert die
// Oberfläche zwischen, ohne Verbindung erscheint "Keine Verbindung zur Nextcloud", Daten kommen nur vom Server.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SOURCE = readFileSync(new URL('../nextcloud-app/dorfromantik/pwa/sw.js', import.meta.url), 'utf8');
const ORIGIN = 'http://cloud.test';

/** Lädt den Service Worker mit nachgebauten Browser-Objekten. `network(url)` liefert eine Response oder wirft. */
function loadWorker() {
  const listeners = {};
  const stored = new Map();
  const env = { network: async () => new Response('vom Server') };
  const keyOf = (r) => (typeof r === 'string' ? r : r.url);
  const cache = {
    put: async (r, res) => { stored.set(keyOf(r), res); },
    match: async (r) => stored.get(keyOf(r))?.clone(),
  };
  vm.runInNewContext(SOURCE, {
    self: {
      location: new URL(`${ORIGIN}/index.php/apps/dorfromantik/sw.js`),
      addEventListener: (type, fn) => { listeners[type] = fn; },
      skipWaiting: async () => {},
      clients: { claim: async () => {} },
    },
    caches: { open: async () => cache, match: (r) => cache.match(r), keys: async () => [], delete: async () => true },
    fetch: (r) => env.network(keyOf(r)),
    Response,
    URL,
  });

  /** Schickt eine Anfrage durch den Worker. `handled` = false: Der Browser lädt selbst vom Netz. */
  async function request(path, { mode = 'cors', method = 'GET' } = {}) {
    let answer = null;
    const waiting = [];
    listeners.fetch?.({
      request: { url: `${ORIGIN}${path}`, mode, method },
      respondWith: (p) => { answer = Promise.resolve(p); },
      waitUntil: (p) => { waiting.push(p); },
    });
    const response = answer === null ? null : await answer;
    await Promise.all(waiting);
    return { handled: answer !== null, response };
  }

  return { env, stored, request };
}

const offline = async () => { throw new TypeError('Failed to fetch'); };
const ASSET = '/custom_apps/dorfromantik/js/dorfromantik-main.js';

test('Die Oberfläche wird beim Laden vom Server zwischengespeichert', async () => {
  const worker = loadWorker();
  const { response } = await worker.request(ASSET);
  assert.equal(await response?.text(), 'vom Server');
  assert.ok(worker.stored.has(`${ORIGIN}${ASSET}`));
});

test('Ohne Verbindung kommt die Oberfläche aus dem Zwischenspeicher', async () => {
  const worker = loadWorker();
  await worker.request(ASSET);
  worker.env.network = offline;
  const { response } = await worker.request(ASSET);
  assert.equal(await response?.text(), 'vom Server');
});

test('Mit Verbindung hat der neue Stand vom Server Vorrang vor dem Zwischenspeicher', async () => {
  const worker = loadWorker();
  await worker.request(ASSET);
  worker.env.network = async () => new Response('neue Version');
  const { response } = await worker.request(ASSET);
  assert.equal(await response?.text(), 'neue Version');
});

test('Ohne Verbindung zeigt der Seitenaufruf "Keine Verbindung zur Nextcloud"', async () => {
  const worker = loadWorker();
  worker.env.network = offline;
  const { response } = await worker.request('/index.php/apps/dorfromantik/', { mode: 'navigate' });
  assert.match((await response?.text()) ?? '', /Keine Verbindung zur Nextcloud/);
  assert.match(response.headers.get('content-type'), /text\/html/);
});

test('Seitenaufrufe werden nicht zwischengespeichert (sie hängen an der Anmeldung)', async () => {
  const worker = loadWorker();
  await worker.request('/index.php/apps/dorfromantik/', { mode: 'navigate' });
  assert.equal(worker.stored.size, 0);
});

test('Kampagnendaten werden nie zwischengespeichert und nie aus dem Zwischenspeicher bedient', async () => {
  const worker = loadWorker();
  // Gegenprobe: Der Worker arbeitet überhaupt.
  await worker.request(ASSET);
  assert.equal(worker.stored.size, 1);
  const { handled } = await worker.request('/index.php/apps/dorfromantik/api/campaigns');
  assert.equal(handled, false);
  assert.equal(worker.stored.size, 1);
});

test('Schreibende Anfragen fasst der Service Worker nicht an', async () => {
  const worker = loadWorker();
  await worker.request(ASSET);
  assert.equal(worker.stored.size, 1);
  const { handled } = await worker.request('/index.php/apps/dorfromantik/api/campaigns/a', { method: 'PUT' });
  assert.equal(handled, false);
});

test('Fehlerantworten des Servers werden nicht zwischengespeichert', async () => {
  const worker = loadWorker();
  worker.env.network = async () => new Response('kaputt', { status: 500 });
  const { response } = await worker.request(ASSET);
  assert.equal(response?.status, 500);
  assert.equal(worker.stored.size, 0);
});
