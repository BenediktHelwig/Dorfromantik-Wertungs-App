## Schritt 2: Basisspiel vollständig (Kampagnenverwaltung)

Mehrere Kampagnen nebeneinander: anlegen, fortsetzen, beenden, ansehen, löschen. Die Logik liegt rein im Kern (`src/core/campaigns.js`), `web/` bekommt den Startbildschirm.

### Umgesetzte Regeln
- Die Kampagne entsteht mit dem ersten gespeicherten Wertungsblatt (Spiel 1), Beginn = Datum des Speicherns.
- Name = Mitspielende aus Spiel 1 (dort Pflicht), ab Spiel 2 fest übernommen.
- „Kampagne beenden“ mit „Bist du sicher?“ trägt das Enddatum ein und ist gesperrt, solange im Fortschrittsbaum eine Frage offen ist.
- Beendete Kampagnen sind schreibgeschützt (Blatt, Entscheidung, manuelle Erfüllung werden abgelehnt), sie lassen sich ansehen und löschen.
- Löschen laufender und beendeter Kampagnen immer mit Sicherheitsabfrage.
- Startbildschirm: laufende und beendete Kampagnen getrennt, jüngste zuerst, mit Namen, Zeitraum und Anzahl Spiele.
- Gespeichert werden nur Rohdaten je Kampagne (`dorfromantik-kampagnen-v3`), die alte Demo-Kampagne wird übernommen.

### Abweichung von den Anforderungen
**Keine Korrektur gespeicherter Wertungsblätter** (Entscheidung von Benedikt, 23.11.2026, `docs/entscheidungen.md`). Der Abschnitt „Nachträgliche Korrektur“ in `app-anforderungen.md` und das entsprechende Kriterium aus STEPS.md entfallen; einzige Absicherung ist die Rückfrage „Ist alles eingetragen?“. `app-anforderungen.md` selbst ist unverändert, die Entscheidung geht vor.

### Tests
76 → 99 Tests, `npm test` grün. Red-Commit `060902c` (23 Tests scheitern an fehlendem Verhalten) liegt vor dem Green-Commit `7e239ff`. Review: PASS im ersten Versuch, zwei Hinweise (UTC-Datum, Blattdatum) als `fix:`-Commit behoben.

### Offene Punkte und Hinweise
- Die Oberfläche wurde nicht im Browser geprüft (nur Syntax und Auslieferung). Bitte `npm start` und `http://localhost:8080/web/`: Kampagne anlegen, zwei Partien speichern, Gabelung bei Schachtel 2 offen lassen (Beenden gesperrt), beantworten, beenden, ansehen, löschen, neu laden.
- Die Kampagne hat noch kein Feld für die Variante; Schritt 3 braucht für v3-Daten den Standard „Basisspiel“.
- Der Test zur Sperre beim Beenden deckt nur die offene Gabelungsfrage ab, „Restliche Felder“ sperrt über dieselbe Prüfung (`pending !== null`), ist aber nicht eigens getestet.

### Merge-Reihenfolge
Zuerst Schritt 1 (#1) nach `main`, dann dieser PR, jeweils mit Merge-Commit statt Squash. Basis dieses PR ist `feat/progress-tree-base`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
