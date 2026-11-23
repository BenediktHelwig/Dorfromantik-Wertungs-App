# Freischaltungen Basisspiel (Liste "Eure Erfolge" rechts auf dem Kampagnenblatt)
 
Quelle: Spielanleitung, Benedikts Angaben und seine Datei `Basisspiel_Freischaltregeln.md` (22.11.2026). Umgesetzt im Repo unter `src/core/achievements.js` (Spezifikation: `docs/spezifikation-basis.md`).
 
Jeder Eintrag hat ein Kästchen (Kreuz = Karte erhalten) und ein Feld in der Krone-Spalte (Spielnummer, in der die Aufgabe erfüllt wurde). Pro Eintrag in den Bereichen "Kampagnenblatt" und "Schachteln" steht immer nur eine Spielnummer. (Anders in "Eure Ergebnisse", dort können pro Zeile mehrere Spielnummern stehen.)
 
## Zeitpunkt (bestätigt 22.11.2026)
Eine Erfolgskarte wird immer erst am Ende einer Partie freigeschaltet. Was daraus folgt (neue Regel, Bonus, geöffnete Schachtel, neues Material), gilt ab der nächsten Partie. Das Häkchen im Wertungsblatt von Spiel N setzt die App für alle Einträge mit Spielnummer kleiner N. Jede Karte wird nur einmal erfüllt.
 
## Bereich "Kampagnenblatt" (12 Einträge, automatisch über den Fortschrittsbaum)
Bahnwärter, Bauernhof, Burg, Damhirsch, Dorftunnel, Getreidetunnel, Hügel, Lagerhaus, Schäferin, Waldtunnel, Wolke, Zirkus.
- Entspricht den 12 Erfolgskarten-Sechsecken im Fortschrittsbaum (Karten aus Schachtel 3, jede einzeln über das KB).
- Wird das Sechseck über den Baum erreicht, setzt die App automatisch Kreuz und aktuelle Spielnummer. Die Karte wird am Partieende aus Schachtel 3 geholt und gilt ab der nächsten Partie.
## Bereich "Schachteln" (14 Einträge)
Erfüllung: **auto** = App prüft das Wertungsblatt am Partieende und trägt die Spielnummer ein, **manuell** = Spieler bestätigt selbst, **KB** = über das Kampagnenblatt.
 
| Schachtel | Karte | Bedingung (in einer Partie) | Erfüllung | Prüfung in der App |
|---|---|---|---|---|
| 1 | Rote Herzen | Karte "Erfolg freigespielt", kommt mit Schachtel 1 | KB | Schachtel 1 geöffnet |
| 1 | Herzenswünsche | am Partieende 6 P durch 1 Herz | auto | Rote Herzen ≥ 6 (solange sie offen ist, gibt es nur 1 Herz) |
| 2 | Auf Erfolgsspur | ≥ 200 P | auto | Ergebnis ≥ 200 |
| 4 | Erntefest | ≥ 30 P durch Getreideaufträge | auto | B2 ≥ 30 |
| 4 | Lokomotive | ≥ 30 P durch Gleisaufträge | auto | B4 ≥ 30 |
| 4 | Schiff | ≥ 30 P durch Flussaufträge | auto | B5 ≥ 30 |
| 4 | Wachturm | ≥ 30 P durch Dorfaufträge | auto | B3 ≥ 30 |
| 4 | Waldhütte | ≥ 30 P durch Waldaufträge | auto | B1 ≥ 30 |
| 5 | Bahnhof | ≥ 180 P + Gleis aus ≥ 12 Plättchen | auto | Ergebnis ≥ 180 und D1 ≥ 12 |
| 5 | Ballon-Startplatz | ≥ 300 P | auto | Ergebnis ≥ 300 |
| 5 | Baustelle | ≥ 157 P durch Aufträge (ohne P durch Sonderplättchen) | auto | S1 ≥ 157 |
| 5 | Fahnenfest | ≥ 40 P durch ein Gebiet mit 3 Fahnen | manuell | – |
| 5 | Goldenes Herz | ≥ 18 P durch rote Herzen | auto | Rote Herzen ≥ 18 |
| 5 | Hafen | ≥ 180 P + Fluss aus ≥ 12 Plättchen | auto | Ergebnis ≥ 180 und D2 ≥ 12 |
 
## Schachteln öffnen (bestätigt 22.11.2026)
- Schachtel 1 und 2 öffnen sich über das Kampagnenblatt.
- Herzenswünsche erfüllt → Schachtel 4 wird geöffnet. Auf Erfolgsspur erfüllt → Schachtel 5 wird geöffnet.
- Die Karten der geöffneten Schachtel bekommen unter "Eure Erfolge" > "Schachteln" automatisch ihr **Kreuz** (Karte erhalten). Geöffnet wird am Partieende, die Karten sind ab der nächsten Partie im Spiel.
- **Freigeschaltet** ist eine Karte damit noch nicht: Die Spielnummer kommt erst, wenn ihre Bedingung in einer Partie erfüllt ist. Erst danach (ab der Folgepartie) wirkt ihr Bonus.
Inhalte der Schachteln:
- Schachtel 1: 5 Auftragsplättchen, 5 4er-Auftragsmarker, Karte "Erfolg freigespielt: Rote Herzen", 1 rotes Holzherz, EK Herzenswünsche.
- Schachtel 2: 5 Landschaftsplättchen, EK Auf Erfolgsspur.
- Schachtel 3: 12 EK (über das KB), 8 Sonderplättchen, 3 7er-Auftragsplättchen, 3 7er-Marker, 3 rote Herzen.
- Schachtel 4: 5 EK, 5 Sonderplättchen.
- Schachtel 5: 6 EK, 5 Sonderplättchen, 1 Ballonplättchen, 1 goldenes Holzherz.
## Rote Herzen (bestätigt 22.11.2026)
- Mit Schachtel 1 erhält man das erste von 4 roten Herzen, nutzbar ab der nächsten Partie.
- Erreicht man mit diesem Herz 6 P (Herzenswünsche erfüllt), kommen 3 weitere Herzen zum Material. Jedes muss über seinen Herz-Kreis im KB freigeschaltet (ausgekreuzt) werden und ist ab der Partie danach nutzbar.
- Pro Herz höchstens 6 P. Die App prüft im Wertungsblatt: Rote Herzen ≤ 6 × verfügbare Herzen.
- Goldenes Herz (18 P mit roten Herzen, also 3 Herzen mit je 6 P) bringt ab der Folgepartie 2 P pro passender Kante.
## Wirkung im Wertungsblatt (Bereich E, Freigespielt)
- Ist ein Bonus freigeschaltet, ist sein Häkchen automatisch gesetzt. Die Punkte trägt der Spieler als Summe ein.
- Einträge mit Punkten (15): Rote Herzen, Zirkus, Bahnwärter, Schäferin, Hügel, Baustelle, Ballon-Startplatz, Goldenes Herz, Waldhütte, Erntefest, Wachturm, Lokomotive, Schiff, Bahnhof, Hafen.
- Einträge ohne eigenes Punktefeld (11): Bauernhof, Burg, Damhirsch, Dorftunnel, Getreidetunnel, Lagerhaus, Waldtunnel, Wolke, Fahnenfest (Landschaftsplättchen, fließen in die normale Wertung ein), Auf Erfolgsspur, Herzenswünsche.
- Spielnummern sind nachträglich korrigierbar, Abgeleitetes wird neu berechnet.