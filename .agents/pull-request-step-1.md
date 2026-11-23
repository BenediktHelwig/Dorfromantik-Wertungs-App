## Schritt 1: Fortschrittsbaum Basisspiel

Der Baum aus `Wertungsblock-Diagramm.drawio` ist als JSON im Kern, die Pfadlogik läuft rein aus Rohdaten, die Prototyp-UI zeigt den Baum.

### Umgesetzte Regeln
- Graph `src/core/graph-basis.json`: 14 Sechsecke, 123 Kreise, 3 Herz-Kreise (gegen die drawio-Datei geprüft).
- Pfadlogik `src/core/progressTree.js` (`walkTree`): Gabelungswahl ohne Rückweg, Sechsecke kosten nichts und gelten als erreicht, sobald ein Nachbarkreis ausgekreuzt ist, ausgekreuzte Felder kosten nichts solange nicht alle 14 Sechsecke erreicht sind, kein Pfadende an der Wolke, optionale Restfelder, Verfall übriger Kreuze, keine Annahmen bei fehlender oder unpassender Entscheidung.
- `computeCampaign` (`src/core/campaign.js`): Einträge im Bereich Kampagnenblatt, Schachtel 1 und 2 über den Baum (Karten ab der Folgepartie), automatische Erfüllungen, verfügbare rote Herzen. Auch das Häkchen „freigespielt“ der Boni wird je Partie neu berechnet.
- UI `web/`: Baum als SVG, Rückfragen an Gabelungen und bei Restfeldern, Speicherung nur als Rohdaten (alte Demodaten werden übernommen).

### Tests
72 → 76 Tests, `npm test` grün. Red-Commit `b12db60` (41 Tests scheitern an fehlendem Verhalten) liegt vor dem Green-Commit `07ecd61`. Die Review-Runde kam mit `fix tests per review` (`9af3516`) und `fix per review` (`2a6858b`).

### Entscheidungen (`docs/entscheidungen.md`)
1. Pfadmodell statt freier Kreismenge (`app-anforderungen.md` geht vor `fortschrittsbaum.md`).
2. „Alles freigespielt“ = alle 14 Sechsecke erreicht.
3. Schachtel 1 und 2 öffnen sich automatisch über den Baum.
4. In der Phase „Restliche Felder“ läuft der Pfad bei genau einem freien Ausgang automatisch weiter (weicht vom Wortlaut „an jeder Kreuzung“ ab). Der Reviewer hält diesen Fall im Basisgraph für nicht erreichbar, deshalb gibt es dafür keinen Test.

### Offene Punkte und Hinweise
- Die Prototyp-UI wurde nicht im Browser geprüft (nur Syntax und Auslieferung). Bitte einmal `npm start` und `http://localhost:8080/web/` ausprobieren: drei Partien speichern, Gabelung bei Schachtel 2 beantworten, neu laden.
- `web/app.js` speichert die Wertungsblätter weiter mit dem Feld `bonuses[id].unlocked`. Der Kern ignoriert es, es ließe sich beim Umbau der Speicherung in Schritt 4 entfernen.
- Das JSON wird per `import … with { type: 'json' }` geladen, `engines` steht deshalb auf `>=20.10`. Ältere Handy-Browser ohne Bundler können das nicht, relevant für Schritt 4.
- Die Anforderungs-Docs (auch Sakura) liegen jetzt unverändert in `docs/` (erster Commit).

### Merge-Reihenfolge
Schritt 1 nach `main` mergen, mit Merge-Commit statt Squash, damit die gestapelten Branches der nächsten Schritte gültig bleiben.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
