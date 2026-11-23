# Hinweise für Agenten

## Projekt
Wertungs- und Kampagnen-App für das Brettspiel Dorfromantik (Basisspiel und später Variante Sakura). Nutzer ist eine Familie, Betrieb als Nextcloud-App im Heimnetz, Handy-Nutzung als PWA. Fachsprache und UI sind Deutsch.

## Regeln für die Arbeit
- **Keine Abhängigkeiten** in `src/core`: reines JavaScript (ES-Module), JSDoc für Typen. Die Kernlogik soll später unverändert in der Nextcloud-App (Vue) laufen.
- **Tests zuerst:** Jede Regel aus der Spezifikation bekommt einen Test in `test/`. Testlauf: `npm test` (node:test, keine Installation nötig).
- **Rohdaten-Prinzip:** Gespeichert werden nur Wertungsblätter und Spielerentscheidungen (Gabelungen, Zweigwahl, Blüten-Ausgaben, manuelle Erfüllungen). Ergebnisse, Kreuze, Laufposition und automatische Freischaltungen werden immer neu berechnet.
- **Spezifikation ist maßgeblich:** `docs/spezifikation-basis.md`. Bei Widersprüchen oder Lücken nicht raten, sondern als offene Frage notieren.
- Bezeichner im Code englisch, Fachbegriffe (Spielnummer, Freigespielt, Eure Erfolge) in Kommentaren und UI deutsch.

## Stand
- Fertig: Highscoreliste inkl. Zeilen 500/600/700, Wertungsblatt Basisspiel (B–E, S1–S3, H, Prüfung), Wirkung von Freischaltungen ab der Folgepartie, Erfolgskarten der Schachteln mit automatischer Prüfung am Partieende (`src/core/achievements.js`), „Eure Ergebnisse“ mit Kreuzen.
- Fortschrittsbaum Basisspiel (Schritt 1): Graph als JSON (`src/core/graph-basis.json`, 14 Sechsecke, 123 Kreise, 3 Herz-Kreise), Pfadlogik in `src/core/progressTree.js` (`walkTree`: Gabelungswahl, ausgekreuzte Felder kosten nichts solange nicht alles freigespielt ist, kein Pfadende, optionale Restfelder, Verfall), `computeCampaign` in `src/core/campaign.js` berechnet Baum, Einträge im Bereich Kampagnenblatt, Schachtel 1/2 über den Baum, automatische Erfüllungen und verfügbare rote Herzen rein aus den Rohdaten (Wertungsblätter, Entscheidungen, manuelle Erfüllungen).
- Entscheidungen zu Regellücken: `docs/entscheidungen.md` (hat Vorrang vor den übrigen Docs).
- Kampagnenverwaltung Basisspiel (Schritt 2): `src/core/campaigns.js` (rein, nur Rohdaten): Kampagne entsteht mit dem ersten gespeicherten Wertungsblatt, Name = Mitspielende aus Spiel 1 (ab Spiel 2 fest), Beenden mit Enddatum (gesperrt bei offener Baumfrage), beendete Kampagnen schreibgeschützt, Löschen, Übersicht laufend/beendet. Gespeicherte Wertungsblätter werden nicht korrigiert (Entscheidung 23.11.2026).
- Prototyp-UI in `web/` (nur zum Ausprobieren, wird später durch die Nextcloud-Oberfläche ersetzt): Startbildschirm mit Kampagnen, Wertungsmaske, Fortschrittsbaum als SVG mit Rückfragen an Gabelungen, „Eure Ergebnisse“ und „Eure Erfolge“. Browser-Speicher nur mit Rohdaten.

## Roadmap
Reihenfolge wie in `dorfromantik-crew/docs/STEPS.md`; Schritt 1 und 2 sind fertig (siehe Stand).
2. **Basisspiel vollständig (Kampagnenverwaltung):** Startbildschirm, neue/laufende/beendete Kampagnen, Kampagne beenden (danach nur ansehen und löschen). Fertig, siehe Stand. Eine Korrektur gespeicherter Wertungsblätter gibt es nicht (Entscheidung 23.11.2026).
3. **Variante Sakura:** eigenes Wertungsblatt, Graph `graph-sakura.json`, Kirschblüten mit Ausgabe-Budget, Erfolgsliste mit Automatismen, gewählt bei Kampagnenanlage.
4. **Nextcloud-Gerüst und PWA:** `docker compose` mit offiziellem Nextcloud-Image, PHP-Backend (Speicherung pro Kampagne, nur Rohdaten), Vue-Frontend mit unverändertem Kern, Manifest und Service Worker.

## Quellen der Spezifikation
Die vollständigen Anforderungen pflegt Benedikt im Claude-Projekt „Wertung/Kampagne Dorfromantik“ (Docs: app-anforderungen, regeln-zusammenfassung, fortschrittsbaum, freischaltungen, fortschrittsbaum-sakura, wertungsblatt-sakura, freischaltregeln-sakura). Für das Basisspiel ist der relevante Teil in `docs/spezifikation-basis.md` zusammengefasst.
