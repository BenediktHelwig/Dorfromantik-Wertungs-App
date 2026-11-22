# Spezifikation Basisspiel (Auszug für den Prototyp)

Stand 22.11.2026, abgeleitet aus den Projekt-Docs (regeln-zusammenfassung, app-anforderungen, freischaltungen).

## Wertungsblatt
- **A** Spielnummer (Krone): fortlaufend pro Kampagne, keine Wertung. Datum wird beim Anlegen automatisch gesetzt.
- **B1–B5** Aufträge: Summe der Zahlen aller erfüllten Auftragsmarker je Typ (Wald, Getreide, Dorf, Gleis, Fluss). **S1** = B1 + … + B5.
- **C1–C3** Fahnen (Wald, Getreide, Dorf): nur Fahnen in abgeschlossenen Gebieten, je Fahne Anzahl Plättchen des Gebiets.
- **D1, D2** Plättchenzahl längstes Gleis / längster Fluss. **S2** = C1 + C2 + C3 + D1 + D2.
- **E** Freigespielt: nur bereits freigespielte Boni. Häkchen setzt die App, die Punkte trägt der Spieler als Summe ein. **S3** = Summe.
  - Rote Herzen 1/passende Kante · Zirkus umschlossen = 10 · Bahnwärter 2/Bahnübergang · Schäferin 1/Schaf · Hügel (Abstand 2) 2/Auftrag · Baustelle je Gebiet mit 7+ = 7 · Ballon-Startplatz 2/Entfernung · Goldenes Herz 2/passende Kante · Bahnhof (beendet) 1/Plättchen · Hafen (beendet) 1/Plättchen
  - Waldhütte, Erntefest, Wachturm, Lokomotive, Schiff: Summe der Auftragsmarker auf dem jeweiligen Sonderplättchen (zählt zusätzlich zu B).
- **H** Ergebnis = S1 + S2 + S3.
- Vor dem Speichern fragt die App, ob alles eingetragen ist.

## Highscoreliste
Ergebnis auf die nächstniedrigere Zeile abrunden (128 → 120). Die Spielnummer kommt in die Krone-Spalte der Zeile, mehrere Spielnummern pro Zeile sind möglich. Die Zeile gibt die Kreuze für den Fortschrittsbaum (additiv).

400 Kaiserin 15 · 375 Kronprinz 15 · 350 Baronin 15 · 340 Magnat 14 · 330 Ratsherrin 14 · 320 Bürgermeister 13 · 310 Fabrikantin 13 · 300 Ballonfahrer 12 · 290 Diplomatin 12 · 280 Ärztin 11 · 270 Astronom 11 · 260 Erfinder 10 · 250 Architektin 10 · 240 Kaufmann 9 · 230 Fotografin 9 · 220 Bahnhofsvorsteher 8 · 210 Hafenmeisterin 8 · 200 Kapitän 7 · 190 Zirkusdirektorin 7 · 180 Lokführer 6 · 170 Bäuerin 6 · 160 Förster 5 · 150 Wirtin 5 · 140 Künstlerin 4 · 130 Nachtwächter 4 · 120 Kutscher 3 · 110 Fischerin 3 · 100 Zeitungsjunge 2 · 0–99 Vagabund 1

Zusätzlich drei Zeilen ohne Titel: 500, 600, 700 mit je 15 Kreuzen (fest, gleiche Abrundung: ab 700 → Zeile 700).

## Freischaltungen und Wirkung
- „Eure Erfolge“: Bereich Kampagnenblatt (12 Einträge, automatisch über den Fortschrittsbaum) und Bereich Schachteln (14 Einträge). Pro Eintrag ein Kreuz (Karte erhalten) und eine Spielnummer (Aufgabe erfüllt).
- **Zeitpunkt (bestätigt):** Eine Erfolgskarte wird immer erst am Ende einer Partie freigeschaltet. Was daraus folgt (neue Regel, Bonus), gilt ab der nächsten Partie. Ein Bonus ist also im Wertungsblatt von Spiel N aktiv, wenn seine Spielnummer kleiner als N ist.
- Jede Karte wird nur einmal erfüllt. Ist die Spielnummer gesetzt, prüft die App sie nicht mehr.

### Erfolgskarten aus den Schachteln
Quelle: `Basisspiel_Freischaltregeln.md`. Bedingung = in einer Partie erreichen. Erfüllung: **auto** = App prüft das Wertungsblatt und trägt die Spielnummer ein, **manuell** = Spieler bestätigt selbst, **KB** = über das Kampagnenblatt. (Der Code kennt zusätzlich „bestätigen“ = App schlägt vor, Spieler bestätigt; derzeit nutzt das keine Karte.)

| Schachtel | Karte | Bedingung | Erfüllung | Prüfung in der App |
|---|---|---|---|---|
| 1 | Rote Herzen | „Erfolg freigespielt“, kommt mit Schachtel 1 | KB | Schachtel 1 geöffnet |
| 1 | Herzenswünsche | am Partieende 6 P durch 1 Herz | auto | E Rote Herzen ≥ 6 (solange Herzenswünsche offen ist, gibt es nur 1 Herz) |
| 2 | Auf Erfolgsspur | ≥ 200 P | auto | H ≥ 200 |
| 4 | Erntefest | ≥ 30 P durch Getreideaufträge | auto | B2 ≥ 30 |
| 4 | Lokomotive | ≥ 30 P durch Gleisaufträge | auto | B4 ≥ 30 |
| 4 | Schiff | ≥ 30 P durch Flussaufträge | auto | B5 ≥ 30 |
| 4 | Wachturm | ≥ 30 P durch Dorfaufträge | auto | B3 ≥ 30 |
| 4 | Waldhütte | ≥ 30 P durch Waldaufträge | auto | B1 ≥ 30 |
| 5 | Bahnhof | ≥ 180 P + Gleis aus ≥ 12 Plättchen | auto | H ≥ 180 und D1 ≥ 12 |
| 5 | Ballon-Startplatz | ≥ 300 P | auto | H ≥ 300 |
| 5 | Baustelle | ≥ 157 P durch Aufträge (ohne P durch Sonderplättchen) | auto | S1 ≥ 157 |
| 5 | Fahnenfest | ≥ 40 P durch ein Gebiet mit 3 Fahnen | manuell | – |
| 5 | Goldenes Herz | ≥ 18 P durch rote Herzen | auto | E Rote Herzen ≥ 18 |
| 5 | Hafen | ≥ 180 P + Fluss aus ≥ 12 Plättchen | auto | H ≥ 180 und D2 ≥ 12 |

Weitere Inhalte: Schachtel 1 bringt 5 Auftragsplättchen, 5 4er-Marker und 1 rotes Holzherz. Schachtel 2 bringt 5 Landschaftsplättchen. Schachtel 3 enthält die 12 Erfolgskarten des Kampagnenblatts (je einzeln über das KB), 8 Sonderplättchen, 3 7er-Aufträge und 3 rote Herzen (erst über das KB freigeschaltet). Schachtel 4 bringt 5 Sonderplättchen, Schachtel 5 bringt 5 Sonderplättchen, 1 Ballonplättchen und 1 goldenes Holzherz.

### Schachteln öffnen (bestätigt 22.11.2026)
- Schachtel 1 und 2 öffnen sich über das Kampagnenblatt.
- **Herzenswünsche** erfüllt → Schachtel 4 wird geöffnet. **Auf Erfolgsspur** erfüllt → Schachtel 5 wird geöffnet. (Annahme: in der Antwort stand zweimal Herzenswünsche, gemeint ist für Schachtel 5 Auf Erfolgsspur.)
- Die Karten der geöffneten Schachtel bekommen ihr Kreuz automatisch. Geöffnet wird am Partieende, die Karten gelten ab der nächsten Partie.
- Erfolgskarten, die über das KB freigeschaltet werden, holt man am Partieende aus Schachtel 3, sie gelten ab der nächsten Partie.

### Rote Herzen (bestätigt 22.11.2026)
- Mit Schachtel 1 erhält man das erste von 4 roten Herzen, nutzbar ab der nächsten Partie.
- Erreicht man mit diesem Herz 6 P (Herzenswünsche erfüllt), kommen 3 weitere Herzen zum Material. Jedes davon muss über seinen Herz-Kreis im KB freigeschaltet (ausgekreuzt) werden, nutzbar ab der Partie danach.
- Pro Herz höchstens 6 P. Die App prüft „Rote Herzen ≤ 6 × verfügbare Herzen“.

## Korrektur
Gespeicherte Wertungsblätter dürfen geändert werden. Alles Abgeleitete (Zeile in „Eure Ergebnisse“, Kreuze, automatische Freischaltungen, geöffnete Schachteln, verfügbare Herzen) wird neu berechnet.
