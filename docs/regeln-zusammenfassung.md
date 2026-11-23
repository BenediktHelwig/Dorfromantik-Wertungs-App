# Dorfromantik (Brettspiel, Pegasus) – App-relevante Regeln
 
Quelle: Spielanleitung.pdf (8 Seiten) im Ordner "Dorfromantik App" sowie Angaben von Benedikt. Nur Regeln, die für die Wertungs-App zählen. Der Fortschrittsbaum steht in `fortschrittsbaum.md`.
 
## Wertungsblatt (pro Partie)
- A: Spielnummer in der Kampagne (Krone) – keine Wertung
- B1–B5: Summe der Zahlen aller erfüllten Auftragsmarker je Typ (Wald, Getreide, Dorf, Gleis, Fluss) → S1 = Summe B1..B5
- C1–C3: Fahnen (grün = Wald, gelb = Getreide, rot = Dorf). Nur Fahnen in abgeschlossenen Gebieten zählen; Punkte je Fahne = Anzahl Plättchen des Gebiets
- D1, D2: Plättchenanzahl längstes Gleis / längster Fluss (= Punkte)
- S2 = C1+C2+C3+D1+D2
- E: Freigespielt-Boni, nur für bereits freigespielte Sonderplättchen (S3 = Summe). Im Wertungsblatt als Häkchen "freigespielt" plus Feld für die Punkte.
  - Rote Herzen 1/passender Kante; Zirkus umschlossen = 10; Bahnwärter 2/Bahnübergang; Schäferin 1/Schaf; Hügel (Abstand 2) 2/Auftrag; Baustelle pro Gebiet mit 7+ = 7; Ballon-Startplatz 2/Entfernung; Goldenes Herz 2/passender Kante; Bahnhof (beendet) 1/Plättchen; Hafen (beendet) 1/Plättchen
  - **Auftragsplättchen-Boni (Waldhütte, Erntefest, Wachturm, Lokomotive, Schiff):** Ist ein Auftrag mit dem jeweiligen Sonderlandschaftsplättchen verbunden und wird er erfüllt, wird der Auftragsmarker auf das Sonderplättchen gelegt. Seine Zahl zählt dann zusätzlich im Bereich E, also doppelt (einmal in B, einmal in E). Zuordnung: Waldhütte = Waldaufträge, Erntefest = Getreideaufträge, Wachturm = Dorfaufträge, Lokomotive = Gleisaufträge, Schiff = Flussaufträge. Punkte dieses Bonus = Summe der Zahlen der erfüllten Auftragsmarker, die auf dem jeweiligen Sonderplättchen liegen.
- H: Ergebnis = S1 + S2 + S3
- Weitere Felder: Mitspielende, Datum
## Kampagnenblatt (nach jeder Partie)
1. Ergebnis auf den nächstniedrigeren Wert der Highscoreliste abrunden (z. B. 128 → 120). In der Kronen-Spalte der Zeile die Spielnummer eintragen.
2. Das mittlere Feld der Zeile nennt die Anzahl weißer Kreise, die im Fortschrittsbaum ausgekreuzt werden (additiv über die Partien).
3. Auskreuzen: siehe `fortschrittsbaum.md` (Menge zusammenhängender Kreise, Sechsecke werden übersprungen).
4. Erstes grünes Sechseck = Schachtel 1 öffnen, zweites = Schachtel 2, alle weiteren = neue Erfolgskarte aus Schachtel 3 (eine ist je Sechseck fest vorgegeben). An 3 Stellen im Baum je ein rotes Herz (ebenfalls Schachtel 3).
5. Freigespieltes in der Liste rechts ("Eure Erfolge") ankreuzen: oben Material aus Schachtel 3 (Kampagnenblatt), unten Schachteln 1, 2, 4, 5. Alles Freigespielte gilt in allen weiteren Partien.
## Highscoreliste (Punkte → Titel → Kreise)
400 Kaiserin 15 · 375 Kronprinz 15 · 350 Baronin 15 · 340 Magnat 14 · 330 Ratsherrin 14 · 320 Bürgermeister 13 · 310 Fabrikantin 13 · 300 Ballonfahrer 12 · 290 Diplomatin 12 · 280 Ärztin 11 · 270 Astronom 11 · 260 Erfinder 10 · 250 Architektin 10 · 240 Kaufmann 9 · 230 Fotografin 9 · 220 Bahnhofsvorsteher 8 · 210 Hafenmeisterin 8 · 200 Kapitän 7 · 190 Zirkusdirektorin 7 · 180 Lokführer 6 · 170 Bäuerin 6 · 160 Förster 5 · 150 Wirtin 5 · 140 Künstlerin 4 · 130 Nachtwächter 4 · 120 Kutscher 3 · 110 Fischerin 3 · 100 Zeitungsjunge 2 · 0–99 Vagabund 1
(Die drei leeren Zeilen oberhalb von Kaiserin haben ebenfalls 15 Kreise.)
 
## Erfolgskarten
- Vorderseite: "Erfolgskarte" + Schloss, darunter Bedingung. Wird die Bedingung in einer Partie erfüllt, wird die Karte umgedreht ("Erfolg freigespielt") und das Material kommt ab der nächsten Partie ins Spiel.
- Die Bedingungen stehen auf den Karten in den Schachteln, NICHT in der Anleitung. Für die App heißt das: Freischaltung einer Erfolgskarte ist ein manueller Schalter pro Karte; automatisierbar ist nur die Punkte- und Fortschrittsbaum-Logik.
- 12 Erfolgskarten auf dem Kampagnenblatt: Wolke, Waldtunnel, Hügel, Bauernhof, Dorftunnel, Schäferin, Burg, Getreidetunnel, Bahnwärter, Damhirsch, Lagerhaus, Zirkus (+ Öffnet Schachtel 1 und 2).
## Sonstiges
- Kampagnen können jederzeit unterbrochen und parallel mit anderen Gruppen gespielt werden (mehrere Kampagnen nebeneinander).