// Integrationstests gegen den Nextcloud-Container. Vorher: docker compose up -d --wait
// Lauf: npm run test:integration   (der Name passt absichtlich nicht auf das Muster von "npm test")
// Regeln: docs/app-anforderungen.md (Speicherung, PWA), docs/entscheidungen.md (25.11.2026, Schritt 4).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createScoresheet } from '../src/core/scoresheet.js';
import { createSakuraSheet } from '../src/core/sakura/scoresheet.js';
import { computeCampaign } from '../src/core/campaign.js';
import { computeSakuraCampaign } from '../src/core/sakura/campaign.js';
import { startCampaign, setGameEnd, endCampaign, setManualUnlock } from '../src/core/campaigns.js';

const BASE = process.env.NC_URL ?? 'http://localhost:8081';
const APP = '/index.php/apps/dorfromantik';
const APP_PATH = /^(\/index\.php)?\/apps\/dorfromantik\/$/;
const ADMIN = { user: 'admin', password: 'Dorf-Test-Admin-2026!' };
const SECOND = { user: 'familie', password: 'Dorf-Test-Familie-2026!' };
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RUN = Date.now().toString(36);
const created = new Set();

const compose = (...args) => execFileSync('docker', ['compose', ...args], { cwd: ROOT, encoding: 'utf8' });

/** Anfrage an Nextcloud; `as: null` = ohne Anmeldung. */
function call(path, { as = ADMIN, method = 'GET', body, headers = {} } = {}) {
  const auth = as ? { Authorization: `Basic ${Buffer.from(`${as.user}:${as.password}`).toString('base64')}` } : {};
  return fetch(new URL(path, BASE), {
    method,
    redirect: 'manual',
    headers: {
      ...auth, 'OCS-APIRequest': 'true', Accept: 'application/json, text/html',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers,
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const urlOf = (id) => `${APP}/api/campaigns/${id}`;

function put(campaign, options = {}) {
  created.add(campaign.id);
  return call(urlOf(campaign.id), { method: 'PUT', body: campaign, ...options });
}

async function list(options) {
  const response = await call(`${APP}/api/campaigns`, options);
  assert.equal(response.status, 200, 'Liste der Kampagnen');
  return response.json();
}
const load = async (id, options) => (await list(options)).find((c) => c.id === id);

function basisCampaign(id) {
  const sheet = createScoresheet({ gameNumber: 1, date: '2026-11-25' });
  sheet.players = 'Anna, Ben (Ä ö ß)';
  sheet.orders.wald = 20; // wenige Kreuze: keine offene Frage, die Kampagne darf beendet werden
  return startCampaign({ id: `${id}-${RUN}`, date: '2026-11-25', firstSheet: sheet });
}

function sakuraCampaign(id) {
  const sheet = createSakuraSheet({ gameNumber: 1, date: '2026-11-25' });
  sheet.players = 'Anna, Ben';
  sheet.orders.kirschbaum = 150;
  return startCampaign({ id: `${id}-${RUN}`, date: '2026-11-25', firstSheet: sheet, variant: 'sakura' });
}

async function waitForServer() {
  for (let i = 0; i < 120; i += 1) {
    try {
      const status = await (await fetch(new URL('/status.php', BASE))).json();
      if (status.installed) return;
    } catch { /* Server startet noch */ }
    await new Promise((resolve) => { setTimeout(resolve, 1000); });
  }
  throw new Error(`Nextcloud unter ${BASE} antwortet nicht. Läuft "docker compose up -d --wait"?`);
}

before(waitForServer);
after(async () => {
  for (const id of created) await call(urlOf(id), { method: 'DELETE' });
});

// ---- Installation ----

test('Die App ist in der Instanz installiert und aktiviert', () => {
  const apps = JSON.parse(compose('exec', '-T', '-u', 'www-data', 'nextcloud', 'php', 'occ', 'app:list', '--output=json'));
  assert.ok('dorfromantik' in apps.enabled);
});

test('Die Seite der App lädt mit der gebauten Vue-Oberfläche', async () => {
  const response = await call(`${APP}/`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /id="dorfromantik-app"/);
  const script = html.match(/<script[^>]+src="([^"]*dorfromantik-main\.js[^"]*)"/)?.[1];
  assert.ok(script, 'Skript der Oberfläche eingebunden');
  const js = await call(script.replaceAll('&amp;', '&'));
  assert.equal(js.status, 200);
  assert.ok((await js.text()).length > 10_000, 'gebautes Bundle');
});

test('Ohne Anmeldung gibt es keinen Zugriff auf die Kampagnen', async () => {
  const campaign = basisCampaign('anonym');
  const json = { as: null, headers: { Accept: 'application/json' } };
  assert.equal((await call(`${APP}/api/campaigns`, json)).status, 401);
  assert.equal((await put(campaign, json)).status, 401);
  assert.equal(await load(campaign.id), undefined);
});

// ---- Speicherung je Kampagne ----

test('Eine Basisspiel-Kampagne kommt unverändert zurück, der Kern rechnet daraus dasselbe', async () => {
  const campaign = setManualUnlock(basisCampaign('basis'), 'fahnenfest', 1);
  assert.equal((await put(campaign)).status, 200);
  const loaded = await load(campaign.id);
  assert.deepStrictEqual(loaded, campaign);
  assert.deepStrictEqual(computeCampaign(loaded), computeCampaign(campaign));
});

test('Eine Sakura-Kampagne behält leere Objekte und den Partieende-Eintrag', async () => {
  const campaign = setGameEnd(sakuraCampaign('sakura'), 1, {});
  assert.equal((await put(campaign)).status, 200);
  const loaded = await load(campaign.id);
  assert.deepStrictEqual(loaded, campaign);
  assert.deepStrictEqual(computeSakuraCampaign(loaded), computeSakuraCampaign(campaign));
});

test('Eine laufende Kampagne wird beim erneuten Speichern fortgeschrieben, nicht doppelt angelegt', async () => {
  const campaign = basisCampaign('update');
  await put(campaign);
  const next = setManualUnlock(campaign, 'fahnenfest', 1);
  assert.equal((await put(next)).status, 200);
  const stored = (await list()).filter((c) => c.id === campaign.id);
  assert.deepStrictEqual(stored, [next]);
});

test('Keine Versionsprüfung: Bei einer laufenden Kampagne gilt das letzte Speichern', async () => {
  const campaign = basisCampaign('letztes');
  await put(campaign);
  await put(setManualUnlock(campaign, 'fahnenfest', 1));
  assert.equal((await put(campaign)).status, 200, 'auch ein älterer Stand wird angenommen');
  assert.deepStrictEqual(await load(campaign.id), campaign);
});

test('Eine Kampagne übersteht Neuladen und Neustart des Servers', async () => {
  const campaign = basisCampaign('neustart');
  await put(campaign);
  assert.deepStrictEqual(await load(campaign.id), campaign);
  compose('restart', 'nextcloud');
  await waitForServer();
  assert.deepStrictEqual(await load(campaign.id), campaign);
});

// ---- Rohdaten-Prinzip ----

for (const [name, extra] of [['rows', []], ['tree', {}], ['totalCrosses', 3], ['irgendwas', 'x']]) {
  test(`Abgeleitetes oder Unbekanntes ("${name}") wird nicht gespeichert`, async () => {
    const campaign = basisCampaign(`roh-${name}`);
    assert.equal((await put({ ...campaign, [name]: extra })).status, 400);
    assert.equal(await load(campaign.id), undefined);
  });
}

test('Felder der anderen Variante werden abgelehnt', async () => {
  const basis = basisCampaign('misch-basis');
  const sakura = sakuraCampaign('misch-sakura');
  assert.equal((await put({ ...basis, gameEnds: {} })).status, 400);
  assert.equal((await put({ ...sakura, manualReceived: [] })).status, 400);
});

test('Eine unvollständige oder unlesbare Kampagne wird abgelehnt', async () => {
  const campaign = basisCampaign('kaputt');
  const { sheets, ...incomplete } = campaign;
  assert.equal((await put(incomplete)).status, 400);
  assert.equal((await put({ ...campaign, sheets: [] })).status, 400);
  assert.equal((await call(urlOf(campaign.id), { method: 'PUT', body: '{kein json' })).status, 400);
  assert.equal(await load(campaign.id), undefined);
});

test('Die Id in der Adresse muss zur Kampagne passen', async () => {
  const campaign = basisCampaign('adresse');
  created.add(`anders-${RUN}`);
  const response = await call(urlOf(`anders-${RUN}`), { method: 'PUT', body: campaign });
  assert.equal(response.status, 400);
  assert.equal(await load(campaign.id), undefined);
});

// ---- Lebenszyklus ----

test('Eine beendete Kampagne ist auch auf dem Server schreibgeschützt', async () => {
  const campaign = basisCampaign('ende');
  await put(campaign);
  const finished = endCampaign(campaign, '2026-11-25');
  assert.equal((await put(finished)).status, 200, 'Beenden selbst ist erlaubt');
  assert.equal((await put(campaign)).status, 409, 'nicht wieder öffnen');
  assert.equal((await put({ ...finished, manualUnlocks: { fahnenfest: 1 } })).status, 409, 'nicht ändern');
  assert.deepStrictEqual(await load(campaign.id), finished);
});

test('Laufende und beendete Kampagnen lassen sich löschen, Unbekanntes meldet 404', async () => {
  const running = basisCampaign('loeschen-laufend');
  const finished = endCampaign(basisCampaign('loeschen-beendet'), '2026-11-25');
  for (const campaign of [running, finished]) {
    await put(campaign);
    assert.equal((await call(urlOf(campaign.id), { method: 'DELETE' })).status, 200);
    assert.equal(await load(campaign.id), undefined);
  }
  assert.equal((await call(urlOf(running.id), { method: 'DELETE' })).status, 404);
});

// ---- Gemeinsam für alle ----

test('Kampagnen gelten gemeinsam für alle Nutzer der Instanz', async () => {
  const campaign = basisCampaign('gemeinsam');
  await put(campaign);
  assert.deepStrictEqual(await load(campaign.id, { as: SECOND }), campaign);
  const next = setManualUnlock(campaign, 'fahnenfest', 1);
  assert.equal((await put(next, { as: SECOND })).status, 200);
  assert.deepStrictEqual(await load(campaign.id), next);
});

// ---- PWA ----

async function page() {
  const response = await call(`${APP}/`);
  assert.equal(response.status, 200);
  return { response, html: await response.text() };
}

test('Die Seite verlinkt als erstes (wirksames) Manifest das der App', async () => {
  const { html } = await page();
  const href = html.match(/<link rel="manifest"[^>]*href="([^"]+)"/)?.[1];
  assert.match(href ?? '', /\/apps\/dorfromantik\/manifest\.webmanifest/);
});

test('Das Manifest ist ohne Anmeldung abrufbar und installierbar', async () => {
  const url = new URL(`${APP}/manifest.webmanifest`, BASE);
  const response = await call(url, { as: null });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/manifest\+json/);
  const manifest = await response.json();
  assert.ok(manifest.name && manifest.short_name);
  assert.equal(manifest.display, 'standalone');
  const start = new URL(manifest.start_url, url);
  const scope = new URL(manifest.scope, url);
  assert.ok(start.pathname.startsWith(scope.pathname), 'start_url liegt im scope');
  // Mit oder ohne index.php, je nach "schönen URLs" des Servers; die Adresse muss die App liefern.
  assert.match(start.pathname, APP_PATH);
  assert.match(await (await call(start)).text(), /id="dorfromantik-app"/);
  for (const size of [192, 512]) {
    const icon = manifest.icons.find((i) => i.sizes === `${size}x${size}` && i.type === 'image/png');
    assert.ok(icon, `Icon ${size}`);
    const image = await call(new URL(icon.src, url), { as: null });
    assert.equal(image.status, 200);
    const bytes = Buffer.from(await image.arrayBuffer());
    assert.equal(bytes.readUInt32BE(16), size, 'Breite laut PNG-Kopf');
    assert.equal(bytes.readUInt32BE(20), size, 'Höhe laut PNG-Kopf');
  }
});

test('Der Service Worker ist als JavaScript abrufbar und darf die ganze App abdecken', async () => {
  const response = await call(`${APP}/sw.js`, { as: null });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /javascript/);
  const manifest = await (await call(`${APP}/manifest.webmanifest`, { as: null })).json();
  assert.equal(response.headers.get('service-worker-allowed'), manifest.scope, 'deckt Startadresse und Scope ab');
  assert.match(await response.text(), /Keine Verbindung zur Nextcloud/);
});

test('Die Seite meldet den Service Worker der App mit dem Scope des Manifests an', async () => {
  const { html } = await page();
  const attribute = (name) => html.match(new RegExp(`id="dorfromantik-app"[^>]*\\sdata-${name}="([^"]*)"`))?.[1];
  const manifest = await (await call(`${APP}/manifest.webmanifest`, { as: null })).json();
  assert.equal(attribute('scope'), manifest.scope);
  assert.equal(attribute('worker-url'), `${APP}/sw.js`);
  const worker = await call(attribute('worker-url'), { as: null });
  assert.equal(worker.status, 200);
  assert.equal(worker.headers.get('service-worker-allowed'), attribute('scope'), 'dieser Scope ist erlaubt');
  // Die gebaute Oberfläche meldet ihn mit genau diesen beiden Angaben an.
  const script = html.match(/<script[^>]+src="([^"]*dorfromantik-main\.js[^"]*)"/)[1].replaceAll('&amp;', '&');
  const bundle = await (await call(script)).text();
  assert.match(bundle, /workerUrl:([\w$]+),scope:([\w$]+)[\s\S]*serviceWorker\.register\(\1,\{scope:\2\}\)/); // Namen sind minifiziert
});

test('Die Sicherheitsrichtlinie erlaubt Service Worker und Manifest', async () => {
  const { response } = await page();
  const policy = response.headers.get('content-security-policy');
  assert.match(policy, /worker-src[^;]*'self'/);
  assert.match(policy, /manifest-src[^;]*'self'/);
});

test('Für das iPhone gibt es Home-Bildschirm-Icon und Vollbild-Angabe', async () => {
  const { html } = await page();
  const icon = html.match(/<link rel="apple-touch-icon"[^>]*href="([^"]+)"/)?.[1];
  assert.match(icon ?? '', /dorfromantik/, 'erstes apple-touch-icon ist das der App');
  assert.equal((await call(icon, { as: null })).status, 200);
  assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes"/);
});
