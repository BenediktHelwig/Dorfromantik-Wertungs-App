# Schritt 3 – Variante Sakura

## Context
Schritt 1 und 2 (Basisspiel) sind fertig (PR #1, #2). Schritt 3 laut `dorfromantik-crew/docs/STEPS.md`:
Sakura-Wertungsblatt, Graph, Erfolgsliste mit Automatismen, Blüten-Dialog mit Ausgabe-Budget, alles im
reinen Kern, gesteuert von der bei Kampagnenanlage gewählten Variante; `web/` nur so weit nötig.
**Fertig wenn:** Variante wählt Blatt, Graph, Highscore- und Erfolgsliste; jede Sakura-Regel hat einen
Test; Basisspiel unverändert (alle bisherigen Tests grün, Basis-Module nicht umgebaut).

Branch `feat/variant-sakura` von `feat/base-game-complete`, PR mit Basis `feat/base-game-complete`.

## Entscheidungen dieser Sitzung (kommen als erster Commit nach `docs/entscheidungen.md`, 23.11.2026)
1. **Highscoreliste Sakura** (vom Bogen-Foto): 0–100 Lastenträger 1 · 110 Rikschafahrer 2 · 120 Puppenspielerin 2 ·
   130 Bambusflößer 3 · 140 Rettichhändler 3 · 150 Flötenspielerin 4 · 160 Tofuverkäuferin 4 · 170 Feuerwerkerin 5 ·
   180 Lastkahnkapitän 5 · 190 Zubermacher 6 · 200 Tatamiflechterin 6 · 210 Glockengießer 7 · 220 Origami-Künstlerin 7 ·
   230 Maskenschnitzerin 8 · 240 Tuschemalerin 8 · 250 Waffenschmied 9 · 260 Salzsieder 9 · 270 Seidenweberin 10 ·
   280 Perlentaucher 10 · 290 Algenzüchterin 11 · 300 Teebäuerin 11 · 310 Architektin 11 · 320 Wandermönch 12 ·
   330 Harfenspielerin 12 · 340 Provinzbeamtin 12 · 350 Tempeldiener 13 · 360 Ronin 13 · 370 Geisha 13 · 380 Samurai 14 ·
   390 Präfektin 14 · 400 Priester 14 · 410 Shogun 15 · 420 Prinz 15 · 430 Prinzessin 15 · 440 Kaiserin 16 · 450 Kaiser 16 ·
   460/470/480/490/500 ohne Titel je 16. Abrunden wie im Basisspiel (105 → Zeile 0–100), ab 500 Zeile 500.
2. **Boxen 4–6:** Box 4 ist nur Aufbewahrung, ihr Inhalt kommt über den Bogen. Badende Affen erhält man mit
   der Freischaltung von Heiße Quellen. Meisterprüfung erfüllt → Box 5 öffnet sich (Dekret, Dorf & Reis,
   Kirschbaum & Dorf, Reis & Kirschbaum). Badende Affen erfüllt → Box 6 öffnet sich (Bunte Fahne, Daimyo,
   Kleine Wolken, Ochsenkarren und Handelsposten, Poet, Schiff und Anlegestelle).
3. **Zeitregel wie im Basisspiel:** Alles, was in Partie N ausgekreuzt, erhalten oder erfüllt wird, wirkt ab N+1
   (Bonusfeld aktiv, Aufgabe prüfbar, Blüten sammelbar, Spalten offen).
4. **Kalligraph (Kartentext):** Umgeben am Spielende → 1 zusätzliches Kreispfad-Feld, dazu je 10 abgegebene
   Blüten 1 weiteres Kreispfad-Feld (20 Blüten = 3 Kreuze). Alles freiwillig; ersetzt die „10 Blüten → 1
   Blütenfeld“-Fassung in `freischaltregeln-sakura.md`.
5. **Auffüllen mit Blüten (1 Blüte = 1 Pkt.):** für jede Karte mit Punkteschwelle, also Blütensammler, Lagerhaus,
   Meisterprüfung (plus 10), Dekret, Daimyo, Kleine Wolken, Ochsenkarren, Schiff, Poet (bis genau 18). Bei
   manuellen Karten und Sonderplättchen gibt der Spieler einen freien Blütenbetrag aus.
6. **Pfadende:** Kreis- und Blütenpfad enden linear vor Stern 30. Stern 30 nur für 30 Blüten auf einmal und nur
   wenn der Blütenpfad bis davor ausgekreuzt ist. Danach dürfen Kreuze bzw. Einzelblüten in die nicht gewählten
   Zweige (Blütenpfad: Gabelung an der Moossammlerin, der Graph stimmt).
7. **Benannte Felder auf dem Blütenpfad** kosten je 1 Blüte und schalten erst frei, wenn sie selbst ausgekreuzt sind.
8. **Restliche Felder wie im Basisspiel, ohne Verfall:** Der Spieler wählt ein freies Feld neben einem ausgekreuzten
   Feld, die App kreuzt in diese Richtung weiter, ausgekreuzte Felder werden übersprungen. Gefragt wird nur bei
   ≥2 freien Ausgängen bzw. ≥2 Möglichkeiten. Kreuze verfallen nur, wenn alle Felder ausgekreuzt sind.
9. ***-Karten:** In Partie N eingesetzt = verbraucht. Umdrehen für 5 Blüten erst im Blüten-Dialog einer späteren
   Partie M > N, wieder einsetzbar ab M+1.
10. **Spalten:** Rundum offen ab der Partie nach „Öffnet Box 1“, 7er-Aufträge ab der Partie nach dem Öffnen von
    Box 5. Vorher müssen die Felder 0 sein.

Doc-Hinweis (keine Regelfrage): `app-anforderungen.md` sagt „14 Einträge plus Kirschblüten“, die Liste in
`wertungsblatt-sakura.md` hat 14 Einträge einschließlich Kirschblüten. Maßgeblich ist die Liste.

## Architektur (Basis bleibt unangetastet)
Neue Module neben den Basis-Modulen, die Kampagnenverwaltung entscheidet nach `campaign.variant`.

| Datei | Inhalt |
|---|---|
| `src/core/highscore.js` | + `HIGHSCORE_SAKURA`; `highscoreRow(total, table = HIGHSCORE_BASIS)` (Standard unverändert) |
| `src/core/graph-sakura.json` | Kopie von `docs/graph-sakura.json` (wie `graph-basis.json`) |
| `src/core/sakura/progressTree.js` | `walkTrack({ graph, track: 'path'\|'star', games, decisions })`, knotenbasiert |
| `src/core/sakura/scoresheet.js` | Spalten, Zeilen, Freigespielt (14), `createScoresheet`, `computeTotals`, `validateScoresheet` |
| `src/core/sakura/achievements.js` | Erfolgsliste (41 Einträge wie auf dem Bogen), Art, Quelle, Schwelle/Lücke |
| `src/core/sakura/blossoms.js` | Kosten und Prüfung des Partieende-Eintrags (Budget, Stern 30, *-Karten, Auffüllen) |
| `src/core/sakura/campaign.js` | `computeSakuraCampaign(raw)` – alles aus Rohdaten |
| `src/core/campaigns.js` | Variante in `startCampaign` (Standard `basis`), Dispatch in `createNextSheet`/`addSheet`/`canEndCampaign`; neue reine Funktionen `chooseCollector`, `setGameEnd`; `addDecision(campaign, decision, track)` |

**Rohdaten einer Sakura-Kampagne** (nichts Abgeleitetes):
`{ id, variant: 'sakura', startDate, endDate, sheets, decisions, blossomDecisions, collector, gameEnds, manualUnlocks, manualReceived }`
- Blatt: `orders{kirschbaum,reis,dorf,strasse,fluss,rundum,sieben}`, `flags{kirschbaum,reis,dorf,strasse,fluss,rundum}`,
  `bonuses{id:{points}}`, `activated: [*-Karten-ids]`, Spielnummer, Datum, Mitspielende.
- `gameEnds[N] = { kalligraph: { surrounded, extraField, paidFields }, stars, bigStar, fills: [cardIds],
  confirmed: [teil-auto ids], flips: [ids], freeSpend }`. Kosten werden abgeleitet (Lücke je Karte), nicht gespeichert.
- Bestehende Kampagnen ohne `variant` gelten als `basis`.

**Pfadlogik Sakura** (`walkTrack`): Felder = Knoten der Spur ohne Wurzel (Start bzw. Box 3) und ohne Stern 30
(Kreis 123, Blüte 94). Laufrichtung per Abstand von der Wurzel. Jedes Feld kostet 1, Freischaltung beim eigenen Kreuz.
Gabelung → Entscheidung `{at, toward}`, Zusammenführung läuft automatisch. Ausgekreuzte Felder werden übersprungen.
Ende = letztes Feld vor Stern 30 → Restliche Felder (Entscheidung 8). Alles voll → Kreuze verfallen.
Kreispfad: Kreuze je Partie = Highscore-Kreuze + Kalligraph-Felder. Blütenpfad: `gameEnds[N].stars`.
Stern 30 gilt als ausgekreuzt, wenn `bigStar` gültig ist.

**Freischaltungen** (je Partie in Spielreihenfolge nachgespielt wie `deriveUnlocks`):
Box 1 → Rundumaufträge (direkt), Lagerhaus erhalten · Box 2 → Sackgasse, Staudamm erhalten · Box 3 → Kirschblüten
(direkt), Meisterprüfung erhalten, Frage nach dem Blütensammler (offen bis gewählt) · Pfad-N/Pfad-K-Felder →
erhalten und erfüllt · Heiße Quellen → Badende Affen · Meisterprüfung erfüllt → Box 5 · Badende Affen erfüllt → Box 6.
Auto-Prüfung am Partieende ab N+1: Lagerhaus (Rundum-Aufträge ≥18), Blütensammler (Tabelle), Dekret (Tempel ≥12),
Daimyo (Zeile Aufträge ≥169), Kleine Wolken (≥300), Poet (Tempel = 18). Mit Auffüllen aus `fills`.
Teil-auto: Meisterprüfung (≥250 + 10 Blüten), Ochsenkarren (≥300 + bestätigt), Schiff (≥200 + bestätigt).
Manuell: Sackgasse, Staudamm, Badende Affen, die drei Gebietskarten aus Box 5, Bunte Fahne (`manualUnlocks`).
Offene Fragen in `pending`: Gabelung/Restfelder je Spur, Blütensammler-Wahl, fehlender Partieende-Eintrag. Eine offene
Frage sperrt das Beenden (wie Schritt 2).

## Tests (red-Commit, je Regel benannt) – neue Dateien in `test/`
- `highscore-sakura.test.js`: Zeilen und Kreuze (0, 100, 105, 110, 255, 440, 499, 500, 700 → Zeile 500).
- `graph-sakura.test.js`: 212 Knoten, 215 Kanten, Kreispfad 123 Felder, Blütenpfad 94 + Stern 30, Gabelungen an Box 2,
  Heiße Quellen, Moossammlerin, beide Zweige gleich lang.
- `progressTree-sakura.test.js`: jedes Feld kostet 1, benanntes Feld erst mit eigenem Kreuz frei; Gabelung fragt und
  hält an, Zusammenführung automatisch; ausgekreuzte Felder kostenlos; Ende vor Stern 30; Restliche Felder (Auswahl,
  Auto bei genau einer Möglichkeit, kein Verfall); alles voll → Verfall; Blütenpfad-Gabelung; falsche Entscheidung → `rejected`.
- `scoresheet-sakura.test.js`: Summen (Aufträge, Fahnen, Freigespielt, Kirschblüten zählen voll); max. 50 Blüten;
  gesperrte Einträge/Spalten müssen 0 sein; Rundum/7er erst ab Freischaltung.
- `achievements-sakura.test.js`: jede Auto-Prüfung an der Schwelle (z. B. Rundum 17/18, Poet 17/18/19, Daimyo 168/169),
  Blütensammler-Tabelle, Teil-auto braucht Bestätigung, manuelle Karten nie automatisch.
- `blossoms.test.js`: Budget = gesammelte Blüten, nur mit aktiver Kirschblüte; Summe der Ausgaben ≤ Budget; Auffüllen
  kostet genau die Lücke; Meisterprüfung Lücke + 10; Stern 30 = 30 auf einmal und nur bei vollem Pfad davor;
  *-Karte umdrehen 5, nur Partie > Einsatz; Kalligraph je 10 Blüten 1 Feld; kein Dialog ohne Blüten.
- `campaign-sakura.test.js`: Zeitregel N+1 (Box 1 → Rundum-Spalte; Box 3 → Blüten), Box 5 nach Meisterprüfung,
  Box 6 nach Badende Affen, Badende Affen mit Heiße Quellen, Blütensammler-Wahl als offene Frage, Kalligraph-Kreuze auf
  dem Kreispfad, *-Karten einsetzen/verbraucht/umgedreht, Neuberechnung allein aus Rohdaten.
- `campaigns.test.js` (neue Fälle, bestehende unverändert): Variante bei Anlage (Standard basis), alte Kampagne ohne
  Variante = basis, Sakura-`createNextSheet` liefert Sakura-Blatt, `setGameEnd` prüft Budget und schreibt nur Rohdaten,
  Beenden gesperrt bei offener Sakura-Frage; Lücke aus Schritt 2: Sperre auch bei offener Restfelder-Frage (Basis).

## Build-Reihenfolge (Commits)
1. `docs: Entscheidungen Schritt 3` (entscheidungen.md) + `.agents/plans/step-3.md`
2. **red:** alle Tests oben, `npm test` → neue Tests scheitern an fehlendem Verhalten (Module mit leeren Exporten,
   damit kein Importfehler). sha notieren.
3. **green:** Module wie in der Tabelle, Basis-Tests bleiben grün.
4. **web:** Varianten-Auswahl bei „Neue Kampagne“, Sakura-Wertungsmaske, Baum-SVG aus den Knotenkoordinaten,
   Fragen (Gabelung, Restfelder, Blütensammler), Kalligraph-Abfrage und Blüten-Dialog nach dem Speichern,
   „Eure Erfolge“ Sakura mit *-Karten-Aktivierung und manuellen Erfüllungen.
5. **docs:** Stand/Roadmap in `CLAUDE.md`, Kommentare in den Modulen.
6. Review → Fixes → PR, `progress.md`, Plan löschen.

## Verifikation
- `npm test` grün (alte und neue Tests).
- Prototyp im Browser (`web/index.html`): Sakura-Kampagne anlegen, mehrere Partien bis Box 3, Blütensammler wählen,
  Blüten-Dialog mit Budget-Grenze, Gabelung an Box 2 und Heiße Quellen, Kalligraph-Kreuze; Basis-Kampagne
  funktioniert wie zuvor.
- Reviewer (`reviewer`-Agent) mit QUALITY-BAR, STEPS, Plan, Sakura-Docs, Diff-Bereich und red-sha.
