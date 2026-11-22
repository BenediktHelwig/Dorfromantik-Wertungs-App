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
- Fertig: Highscoreliste inkl. Zeilen 500/600/700, Wertungsblatt Basisspiel (B–E, S1–S3, H, Prüfung), Wirkung von Freischaltungen ab der Folgepartie, Automatismus Goldenes Herz, „Eure Ergebnisse“ mit Kreuzen.
- Prototyp-UI in `web/` (nur zum Ausprobieren, wird später durch die Nextcloud-Oberfläche ersetzt).

## Roadmap
1. **Fortschrittsbaum Basisspiel:** Graph aus `Wertungsblock-Diagramm.drawio` als JSON, Pfadlogik (Gabelungswahl, ausgekreuzte Felder kosten nichts solange nicht alles freigespielt ist, kein Pfadende, optionale Restfelder), automatische Einträge in „Eure Erfolge“ (Bereich Kampagnenblatt), rote Herzen.
2. **Kampagnenverwaltung:** Startbildschirm, neue/laufende/beendete Kampagnen, Kampagne beenden, Korrektur gespeicherter Wertungsblätter mit Neuberechnung und Warnung.
3. **Nextcloud-App-Gerüst** (PHP-Backend, Vue-Frontend, Speicherung pro Kampagne), PWA.
4. **Variante Sakura:** eigenes Wertungsblatt, Graph `graph-sakura.json`, Kirschblüten mit Ausgabe-Budget, Erfolgsliste mit Automatismen.

## Quellen der Spezifikation
Die vollständigen Anforderungen pflegt Benedikt im Claude-Projekt „Wertung/Kampagne Dorfromantik“ (Docs: app-anforderungen, regeln-zusammenfassung, fortschrittsbaum, freischaltungen, fortschrittsbaum-sakura, wertungsblatt-sakura, freischaltregeln-sakura). Für das Basisspiel ist der relevante Teil in `docs/spezifikation-basis.md` zusammengefasst.
