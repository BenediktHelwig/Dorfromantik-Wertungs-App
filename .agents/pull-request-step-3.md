## Schritt 3: Variante Sakura

Die Variante wird bei der Anlage einer Kampagne gewählt und bestimmt Wertungsblatt, Graph, Highscoreliste und Erfolgsliste. Alles liegt im reinen Kern (`src/core/sakura/`), `web/` bekommt nur so viel Oberfläche, dass man es ausprobieren kann (`web/sakura.js`). Das Basisspiel ist unverändert (nur rückwärtskompatibel erweitert: `highscoreRow(total, table)`, `campaigns.js`).

### Umgesetzte Regeln
- **Highscoreliste Sakura** vom Kampagnenbogen (41 Zeilen, ab 500 bleibt es in Zeile 500, 16 Kreuze).
- **Wertungsblatt:** 7 Spalten (Rundum, 7er-Aufträge erst nach Box 1 bzw. Box 5 offen), Fahnen, 14 Freigespielt-Einträge inkl. Kirschblüten (max. 50, zählen als Punkte), Summen.
- **Fortschrittsbaum:** jedes Feld (Kreise, Sechsecke, Quadrate, Sterne) kostet 1 und gilt erst mit eigenem Kreuz; Gabelungen (Box 2, Heiße Quellen, Moossammlerin), Zusammenführungen automatisch, Pfadende vor Stern 30, danach Restliche Felder nur in Laufrichtung (Entscheidung 11), auch auf dem Blütenpfad (Entscheidung 12).
- **Erfolgsliste** mit 41 Karten: direkt, Feld auf dem Bogen (Pfad-N/Pfad-K), auto, teil-auto, manuell. Box 1–3 über den Bogen, Badende Affen mit Heiße Quellen, Box 5 mit der Meisterprüfung, Box 6 mit Badende Affen.
- **Kirschblüten:** Ausgabe-Budget, Auffüllen fehlender Punkte (1 Blüte = 1 Punkt), Meisterprüfung (10), Blütenpfad (1 je Stern), Stern 30 (30 auf einmal, erst nach dem gewählten Weg), *-Karten einsetzen/umdrehen (5), Kalligraph (1 freies Feld plus je 10 Blüten 1 weiteres, Kreispfad).
- **Zeitregel:** alles wirkt ab der Folgepartie, wie im Basisspiel.
- **Kampagnenverwaltung:** Blütensammler-Wahl (offene Frage, sperrt das Beenden), Partieende-Eintrag (`setGameEnd`, nur Rohdaten, ungültige Ausgaben werden abgelehnt).

Alle Entscheidungen dieses Schritts stehen in `docs/entscheidungen.md` (Schritt 3, Nr. 1 bis 12 und „Auslegung“).

### Abweichungen und Hinweise
- `fortschrittsbaum-sakura.md` zählt 123 Felder auf dem Kreispfad; gemessen am Graphen sind es 116 (die übrigen liegen auf dem Blütenpfad, 94). Die Tests gehen vom Graphen aus.
- Kartennamen folgen dem Bogen („Kleine Wolken“, „Schiff und Anlegestelle“).
- Das Speichern eines weiteren Blatts ist in der Oberfläche gesperrt, solange die Wahl des Blütensammlers offen ist.

### Tests
99 → 234 Tests, `npm test` grün. Red-Commit `3dae6ef` (neue Tests scheitern an fehlendem Verhalten, 99 bisherige grün) liegt vor den Green-Commits.
Nach dem Red-Commit wurden Tests geändert: (1) Probegraph mit ungleich langen Zweigen und (2) Zahlen im Test „Meisterprüfung mit Auffüllen“ waren Fehler in den Tests selbst; (3) drei Pfadtests beschrieben die alte Restfeld-Regel und wurden mit Entscheidung 11/12 angepasst (`fix tests per review`). Neue Tests aus dem Review: Restfeld-Frage und Beenden-Sperre am echten Graphen, 7er-Spalte nach Box 5, Zeitregel für Aufgaben.
Review: drei Versuche, siehe Commits `fix per review` und `fix tests per review`.

### Offene Punkte und Hinweise
- Die Oberfläche wurde nur per Headless-Chrome-Rauchtest geprüft (Anlegen, Gabelung, Blütensammler, Partieende-Dialog, Wiederöffnen, Löschen), nicht von Hand. Bitte `npm start`, `http://localhost:8080/web/`, „Neue Kampagne starten (Sakura)“ und mehrere Partien spielen, auch bis Heiße Quellen und mit Blüten.
- Der Test zur Beenden-Sperre bei offener Restfeld-Frage des **Basisspiels** (Lücke aus Schritt 2) fehlt weiter; das Szenario ist sehr aufwendig. Die Sakura-Variante ist dafür getestet.
- Der Partieende-Eintrag wird in der Oberfläche beim Wiederöffnen erneut abgefragt; zieht diese Regel in Schritt 4 in den Kern, braucht sie dort einen Test.
- `docs/img20261121_09333031.jpg` (Foto des Bogens) ist nicht Teil des Branches.

### Merge-Reihenfolge
Zuerst #1 nach `main`, dann #2, dann dieser PR, jeweils mit Merge-Commit statt Squash. Basis dieses PR ist `feat/base-game-complete`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
