# Schritt 4 – Nextcloud-Gerüst und PWA

## Kontext
Schritte 1–3 sind fertig (PRs #1–#3, gestapelt). Der Kern in `src/core` rechnet Basisspiel und Sakura rein aus Rohdaten, die Oberfläche existiert nur als Prototyp in `web/` mit localStorage. Schritt 4 bringt die App in die Nextcloud der Familie: PHP-Backend speichert Kampagnen (nur Rohdaten), Vue-Oberfläche nutzt den **unveränderten** Kern, dazu PWA (Manifest + Service Worker) und eine Installationsanleitung.
Branch `feat/nextcloud-pwa` von `feat/variant-sakura`, PR mit Basis `feat/variant-sakura`.

## Entscheidungen von Benedikt (25.11.2026, gehen nach `docs/entscheidungen.md`)
1. Kampagnen sind **gemeinsam für alle** Nutzer der Instanz (keine Nutzerspalte). Einschränken auf die Familie über Nextcloud „Für Gruppen aktivieren“.
2. **Nur online.** Der Service Worker speichert die Oberfläche zwischen; ohne Verbindung erscheint „Keine Verbindung zur Nextcloud“. Gespeichert wird nur auf dem Server.
3. **Keine Übernahme** der Prototyp-Daten aus localStorage, Nextcloud beginnt leer.
4. **Kein gleichzeitiges Bearbeiten** (immer nur ein Gerät): keine Versionsprüfung, das letzte Speichern gilt.
5. Ziel ist die **vorhandene Nextcloud 31.0.5 ohne HTTPS**; Benedikt richtet HTTPS selbst ein. PWA wird vollständig gebaut; `docker compose` dient Entwicklung und Integrationstests. Handys: Android und iPhone.

## Aufbau (neue Dateien)
```
docker-compose.yml                 frontend-build (node:22, baut nach app/js) → nextcloud (nextcloud:31-apache, SQLite,
                                   Port 8081, mountet nextcloud-app/dorfromantik nach custom_apps/, Volume für Daten)
nextcloud/hooks/post-installation.sh  occ app:enable dorfromantik, zweiter Testnutzer
nextcloud-app/dorfromantik/
  appinfo/info.xml (id dorfromantik, NC 31–32), appinfo/routes.php
  lib/AppInfo/Application.php
  lib/Controller/PageController.php    Startseite (Template + Vue), CSP worker-src/manifest-src 'self', iOS-Meta
  lib/Controller/PwaController.php     manifest.webmanifest, sw.js (Header Service-Worker-Allowed = App-Pfad)
  lib/Controller/CampaignController.php GET /api/campaigns, PUT /api/campaigns/{id}, DELETE /api/campaigns/{id}
  lib/Db/Campaign.php, CampaignMapper.php, lib/Migration/Version000100Date20261125.php
                                       Tabelle dorfromantik_campaigns (id PK, data JSON-Text, updated_at)
  lib/Service/RawCampaign.php          Prüfung: nur Rohdaten-Schlüssel, id passt, beendete Kampagne schreibgeschützt
  templates/main.php, img/app.svg, img/icon-192.png, img/icon-512.png, sw.js, offline-Text
  package.json, vite.config.js         Deps nur hier: vue, @nextcloud/axios, @nextcloud/router, vite, @vitejs/plugin-vue
  src/main.js, App.vue, api.js         api.js: list/save/delete über generateUrl('/apps/dorfromantik/api/…')
  src/flow.js                          rein, importiert nur den Kern (siehe Regeln 2–3)
  src/components/…                     StartScreen, BasisCampaign, SakuraCampaign, NumberField, TreeBasis, TreeSakura,
                                       ResultsTable, Achievements, GameEndDialog – 1:1 Funktionsumfang des Prototyps
  js/ (Build, in .gitignore)
integration/*.integration.js          node:test gegen den Container (Name passt nicht auf `npm test`-Muster)
INSTALL.md                            Anleitung für die Familie
```
Der Kern wird per Vite-Alias aus `../../src/core` eingebunden, nicht kopiert. `src/core`, `test/` (bestehend) und `web/` bleiben unverändert. Root-`package.json` bekommt nur `"test:integration"`.

## Regeln und Tests (red zuerst)
**Unit (`npm test`, ohne Abhängigkeiten, Dateien in `test/`):**
1. `test/nextcloud-flow.test.js`
   - Speichern gesperrt bei offener Blütensammler-Wahl (`canSaveSheet` false bei `collectorOpen`).
   - Partieende-Eintrag: nach dem Speichern eines Blatts mit Blüten/Kalligraph/Bestätigung offen; ohne Anlass kein Dialog.
   - Partieende erneut abfragen: Kampagne mit letztem Blatt ohne `gameEnds[last]` → `pendingGameEnd` liefert den Dialog; nach `{}` nicht mehr.
   - Beendete Kampagne → kein Dialog.
2. `test/nextcloud-sw.test.js` (sw.js per `node:vm` mit Stub-`self`)
   - API-Anfragen (`/api/`) werden nie aus dem Cache bedient.
   - Navigation ohne Netz → Antwort „Keine Verbindung zur Nextcloud“.
   - Oberfläche (js/css/Icons) wird bei Erfolg zwischengespeichert, offline aus dem Cache.

**Integration (`npm run test:integration`, gegen `docker compose up`, Basic Auth, Header `OCS-APIRequest`):**
3. App installiert: `occ app:list` zeigt sie aktiviert; `/index.php/apps/dorfromantik/` liefert 200 mit Vue-Mount.
4. Ohne Anmeldung → 401/Login, kein Zugriff auf die API.
5. Kampagne aus `startCampaign` (Basis und Sakura) per PUT speichern, per GET laden: identisch; `computeCampaign`/`computeSakuraCampaign` des Geladenen = des Originals (Kern läuft unverändert).
6. Kampagne übersteht Neuladen (neuer GET) und Neustart (`docker compose restart nextcloud`, warten auf status.php, GET).
7. Rohdaten-Prinzip: PUT mit abgeleitetem Feld (z. B. `rows`, `tree`, unbekannter Schlüssel) → 400, nichts gespeichert.
8. id in URL ≠ id im Körper → 400.
9. Beendete Kampagne: PUT → 409; DELETE → 200 (auch laufende löschbar); unbekannte id → 404.
10. Gemeinsam für alle: Kampagne von admin ist für den zweiten Nutzer sichtbar und änderbar.
11. PWA: Manifest gültig (name, short_name, start_url im Scope, display standalone, Icons 192/512 PNG mit 200); sw.js als JavaScript mit Service-Worker-Allowed, das start_url abdeckt; Seite verlinkt das Manifest und erlaubt `worker-src 'self'`; apple-touch-icon und iOS-Meta vorhanden.

Red-Commit enthält Tests plus Stubs (flow.js/sw.js mit leerem Verhalten, App-Gerüst ohne Routen, compose), damit die Tests an fehlendem Verhalten scheitern, wie in den Schritten 1–3.

## Ablauf
1. Branch, `.agents/plans/step-4.md` schreiben.
2. **red** – Tests + Stubs, `npm test` (neue rot, bestehende grün), Integration gegen Container rot; Commit.
3. **green** – Backend, Vue-Oberfläche, PWA, compose-Build; alle Tests grün; Rauchtest der Oberfläche im Container (Headless-Chrome, Basis und Sakura je eine Partie). Commit.
4. **docs** – `INSTALL.md` (Build, Ordner nach `custom_apps`, aktivieren, Gruppe, HTTPS als Voraussetzung für die App-Installation, VPN, „Zum Startbildschirm“ auf Android/iPhone), README, `CLAUDE.md` Stand/Roadmap, `docs/entscheidungen.md`. Commit.
5. Reviewer, Fixrunden, Sign-off, Push, PR (`--base feat/variant-sakura`), `progress.md`, Plan löschen.

## Zu prüfen beim Bauen (technisch, keine Regeln)
- Ob Nextcloud 31 (Theming) selbst schon ein App-Manifest verlinkt; das wirksame Manifest muss auf die App zeigen.
- Ob Vite die Import-Attribute `with { type: 'json' }` des Kerns verarbeitet; falls nicht, Vite-Plugin statt Änderung am Kern.
- Docker Desktop muss laufen (der Daemon war beim Lesen aus); npm braucht Internet für die Frontend-Abhängigkeiten.

## Nur durch Menschen am Handy prüfbar (kommt in den PR)
Installation als App auf Android und iPhone mit HTTPS, Bedienung am Touchscreen, Verhalten über VPN, Offline-Meldung auf dem Gerät.

## Done (aus STEPS.md)
App installiert sich im Container; Kampagne übersteht Neuladen und Neustart; `src/core` unverändert (`git diff feat/variant-sakura -- src/core` leer); PWA installierbar (Manifest und SW gültig); Integrationstests grün; `npm test` grün.
