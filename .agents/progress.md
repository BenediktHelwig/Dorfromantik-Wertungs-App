- [x] Step 1 — feat/progress-tree-base, https://github.com/BenediktHelwig/Dorfromantik-Wertungs-App/pull/1 (Basis: main)
- [x] Step 2 — feat/base-game-complete, https://github.com/BenediktHelwig/Dorfromantik-Wertungs-App/pull/2 (Basis: feat/progress-tree-base)
- [x] Step 3 — feat/variant-sakura, https://github.com/BenediktHelwig/Dorfromantik-Wertungs-App/pull/3 (Basis: feat/base-game-complete)

Nächster Schritt: Step 4 — Nextcloud-Gerüst und PWA, Branch `feat/nextcloud-pwa`, Basis ist `feat/variant-sakura`.

Hinweise für Step 4 (aus Step 3):
- Gespeichert werden Kampagnen als Rohdaten, je nach Variante: Basis `{ id, startDate, endDate, sheets, decisions, manualUnlocks, manualReceived }`, Sakura zusätzlich `variant: 'sakura'`, `collector`, `gameEnds` (statt `manualReceived`). Kampagnen ohne `variant` sind Basisspiel. Speicherschlüssel im Prototyp: `dorfromantik-kampagnen-v3`.
- Der Kern (`src/core`) muss unverändert laufen. Die Regel „Partieende-Eintrag beim Öffnen erneut abfragen, bis ein Eintrag (auch `{}`) gespeichert ist“ und „Speichern gesperrt bei offener Blütensammler-Wahl“ stehen heute nur in `web/sakura.js`; ziehen sie in den Kern oder in Vue, brauchen sie Tests.
- Ältere Hinweise: Es gibt keine Korrektur gespeicherter Wertungsblätter (Entscheidung 23.11.2026). Die Sperre beim Beenden ist für das Basisspiel nur mit offener Gabelungsfrage getestet, nicht mit „Restliche Felder“.
- Die Oberflächen von Basisspiel und Sakura wurden nur per Headless-Chrome-Rauchtest bzw. von Hand von Benedikt angesehen, nicht vollständig durchgespielt.
- `docs/img20261121_09333031.jpg` (Foto des Sakura-Bogens) liegt untracked im Repo, nicht committen ohne Rückfrage.
- Pull Requests: #1 (Step 1, Basis main), #2 (Step 2), Step 3 (Basis feat/base-game-complete). Mit Merge-Commit statt Squash mergen, in dieser Reihenfolge.
