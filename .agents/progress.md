- [x] Step 1 — feat/progress-tree-base, https://github.com/BenediktHelwig/Dorfromantik-Wertungs-App/pull/1 (Basis: main)
- [x] Step 2 — feat/base-game-complete, https://github.com/BenediktHelwig/Dorfromantik-Wertungs-App/pull/2 (Basis: feat/progress-tree-base)

Nächster Schritt: Step 3 — Variante Sakura, Branch `feat/variant-sakura`, Basis ist `feat/base-game-complete`.

Hinweise für Step 3 (aus Step 2):
- Eine gespeicherte Kampagne (Speicher `dorfromantik-kampagnen-v3`) hat noch kein Feld für die Variante. Für bestehende Daten gilt der Standard „basis“. Die Variante wird bei der Kampagnenanlage gewählt und bestimmt Wertungsblatt, Graph, Highscoreliste und Erfolgsliste.
- `src/core/campaigns.js`: `startCampaign` bekommt die Variante, `createNextSheet` und `computeCampaign` müssen sie auswerten (heute fest `BASIS_GRAPH`, Basis-Highscoreliste und Basis-Erfolgskarten).
- Es gibt keine Korrektur gespeicherter Wertungsblätter (Entscheidung 23.11.2026), das gilt auch für Sakura.
- Die Oberfläche in `web/` wurde bisher nur von Benedikt von Hand ausprobiert: Anlegen, Zurück zum Startbildschirm und die gesperrte Beenden-Schaltung bei offener Gabelung gehen. Das Beenden nach der Antwort, Ansehen und Löschen sind noch nicht bestätigt.
- Pull Requests: #1 (Step 1, Basis main) und #2 (Step 2, Basis feat/progress-tree-base). Mit Merge-Commit statt Squash mergen, zuerst #1, dann #2.
- Lücke im Test: Die Sperre beim Beenden ist nur mit einer offenen Gabelungsfrage getestet, nicht mit einer offenen Frage der „Restlichen Felder“.
