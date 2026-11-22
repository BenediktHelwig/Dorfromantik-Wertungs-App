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
- „Eure Erfolge“: Bereich Kampagnenblatt (12 Einträge, automatisch über den Fortschrittsbaum) und Bereich Schachteln (14 Einträge, manuell). Pro Eintrag eine Spielnummer.
- Ein Bonus ist im Wertungsblatt von Spiel N aktiv, wenn seine Spielnummer kleiner als N ist (Wirkung ab der Folgepartie; für Goldenes Herz bestätigt, allgemein noch zu bestätigen).
- **Goldenes Herz:** Hat der Eintrag ein Kreuz (Karte erhalten) und stehen bei Rote Herzen erstmals mindestens 18 Punkte, trägt die App die aktuelle Spielnummer ein. Nur einmal, danach verbraucht.

## Korrektur
Gespeicherte Wertungsblätter dürfen geändert werden. Alles Abgeleitete (Zeile in „Eure Ergebnisse“, Kreuze, automatische Freischaltungen) wird neu berechnet.
