- [x] Step 1 — feat/progress-tree-base, https://github.com/BenediktHelwig/Dorfromantik-Wertungs-App/pull/1 (Basis: main)
- [x] Step 2 — feat/base-game-complete, https://github.com/BenediktHelwig/Dorfromantik-Wertungs-App/pull/2 (Basis: feat/progress-tree-base)
- [x] Step 3 — feat/variant-sakura, https://github.com/BenediktHelwig/Dorfromantik-Wertungs-App/pull/3 (Basis: feat/base-game-complete)
- [x] Step 4 — feat/nextcloud-pwa, https://github.com/BenediktHelwig/Dorfromantik-Wertungs-App/pull/4 (Basis: feat/variant-sakura)

Kein weiterer Schritt in `dorfromantik-crew/docs/STEPS.md`.

Offen, nur durch Benedikt:
- Pull Requests in der Reihenfolge #1 bis #4 mit Merge-Commit statt Squash mergen.
- App nach `INSTALL.md` auf dem Heimserver einrichten, HTTPS einrichten, auf Android und iPhone installieren und über VPN prüfen.
- `docs/img20261121_09333031.jpg` (Foto des Sakura-Bogens) liegt untracked im Repo, nicht committen ohne Rückfrage.

Hinweise für spätere Arbeiten:
- Die Vue-Komponenten haben keine automatischen Tests (nur `src/flow.js`, `pwa/sw.js` und die Integrationstests gegen den Container).
- Nach neuen Datenbank-Migrationen oder Änderungen am Einrichtungs-Skript den Entwicklungs-Container mit `docker compose down -v` neu aufsetzen.
- Die Sperre beim Beenden ist für das Basisspiel nur mit offener Gabelungsfrage getestet, nicht mit „Restliche Felder“.
