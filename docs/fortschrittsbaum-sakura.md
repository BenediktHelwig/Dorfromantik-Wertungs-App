# Fortschrittsbaum Sakura – Graph-Spezifikation
 
Quelle: Fotos des Kampagnenbogens "Sakura" (21.11.2026), per Bilderkennung erfasst (Kreise/Sterne) und manuell geprüft. Maschinenlesbar: `graph-sakura.json`, zeichnerisch: `Sakura-Kampagnenbogen-Diagramm.drawio` (beide bei Benedikt). Prüfung: 212 Knoten, 215 Kanten, ein zusammenhängender Graph, jeder Kreis/Stern hat genau 2 Nachbarn. Beide Zweige sind spiegelbildlich gleich lang, das bestätigt die Erfassung. Wertungsblatt siehe `wertungsblatt-sakura.md`, Erfolgskarten und Blüten-Ausgaben siehe `freischaltregeln-sakura.md`.
 
## Knotenarten
- **Kreis (97):** wird ausgekreuzt.
- **Sechseck (11), Quadrat (15):** zählen wie Kreise und kosten je 1 Kreuz. **Unterschied zum Basisspiel**, dort kosten Sechsecke nichts. Gesamt auf dem Kreispfad: 97 + 11 + 15 = 123 Felder.
  - **Freischaltung (bestätigt):** Ein Feld gilt erst als freigeschaltet, wenn es selbst auf dem Bogen angekreuzt ist. Im Basisspiel genügte es, dass das angrenzende Feld angekreuzt war.
  - Sechseck: schaltet durch Ankreuzen frei, keine weitere Bedingung. Schloss-Zahl = Box, aus der die Karte kommt.
  - Quadrat "Erfolgskarte" (8): fordert auf, die Erfolgskarte aus Box n zu holen (z. B. Tempel, Schloss 4: Karte "Tempel" aus Box 4; sie sagt, was zu erfüllen ist).
  - Quadrat "Öffnet Box n" (3): Box 1, 2, 3 öffnen.
  - Quadrat "+1" (4): man erhält einen weiteren Gegenstand (+1 Brücke, +1 Tempel ×2, +1 Tor). Vorher muss die zugehörige Erfolgskarte erfüllt sein. (Das Symbol, das ich zuerst für einen Baum hielt, ist ein japanischer Tempel.)
- **Stern/Kirschblüte (87 + großer Stern "30"):** Blütenpfad, siehe unten.
- **Start:** links unten.
## Kreispfad (Zahl = Kreise dazwischen, die Felder selbst kommen je +1 dazu)
- Start – 1 – Öffnet Box 1 – 3 – Öffnet Box 2
- Box 2 gabelt sich:
  - Box 2 – 3 – **See** (Sechseck, Schloss 2) – 4 – Öffnet Box 3
  - Box 2 – 3 – **Kreuzung** (Sechseck, Schloss 2) – 4 – Öffnet Box 3
- Box 3 – 4 – **Tempel** (Quadrat, 4) – 5 – **Heiße Quellen** (Sechseck, 4). Danach Gabelung:
  - **Zweig A:** HQ – 6 – Brücken (Quadrat, 4) – 3 – +1 Tempel (A) – 3 – Kalligraph (Sechseck, 4) – 4 – +1 Brücke – 3 – Sternwarte (Sechseck, 4) – 9 – Kontor
  - **Zweig B:** HQ – 6 – Tore (Quadrat, 4) – 3 – +1 Tempel (B) – 3 – Einsiedler (Sechseck, 4) – 4 – +1 Tor – 3 – Kartograph (Sechseck, 4) – 9 – Kontor
- Kontor (Quadrat, 4) – 10 – Fujiyama (Sechseck, 4) – 4 – großer Stern "30". Ab Kontor linear, kein paralleler Pfad.
- Kontrollsumme Kreise: 1+3+3+4+3+4+4+5+6+3+3+4+3+9+6+3+3+4+3+9+10+4 = 97.
Anschlüsse: Box 2 hat 3 (Box 1, See-Zweig, Kreuzung-Zweig), Box 3 hat 4 (See-Zweig, Kreuzung-Zweig, Tempel, Blütenpfad-Ende), Heiße Quellen hat 3, Kontor hat 3 (Sternwarte-Seite, Kartograph-Seite, Fujiyama-Seite).
 
## Blütenpfad (Kirschblüten), Zahl = Sterne dazwischen
Wird ab "Öffnet Box 3" angekreuzt und endet am großen Stern "30", wo auch der Kreispfad nach Fujiyama ankommt. Wie bei den Kreisen darf er mehrfach begangen werden, ohne neue Kosten.
- Box 3 – 7 – **Teemeisterin** (Quadrat, 3) – 8 – **Moossammlerin** (Sechseck, 3)
- Moossammlerin gabelt sich:
  - Moossammlerin – 9 – **Reisbäuerin** (Sechseck, 3) – 10 – **Umtrunk** (Quadrat, 3) – 11 – Geschenk
  - Moossammlerin – 9 – **Sumoringer** (Sechseck, 3) – 10 – **Reiskuchen** (Quadrat, 3) – 11 – Geschenk
- **Geschenk** (Quadrat, 3) – 12 – großer Stern 30.
- Erfolge der Sternfelder (alle Schloss 3): Teemeisterin, Moossammlerin, Reisbäuerin, Reiskuchen, Sumoringer, Umtrunk, Geschenk. Sie sind auf der Erfolgsliste rot markiert.
## Kirschblüten-Regeln (von Benedikt bestätigt, Stand 22.11.2026)
- **Gesammelte Blüten:** Der Spieler trägt sie im Wertungsblatt unter "Kirschblüten (gesammelt)" ein, **maximal 50 pro Partie** (frühere Angabe 30 korrigiert). Der Wert zählt vollständig als Punkte und wird durch Ausgaben nicht verändert.
- **Ausgabe-Budget:** Die App legt im Hintergrund ein separates Budget mit demselben Wert an. Alle Ausgaben werden davon abgezogen, ein Rest verfällt am Partieende.
- **Ausgeben** (vollständige Liste in `freischaltregeln-sakura.md`):
  1. Eine Aufgabe (Erfolgskarte) erfüllen. Blüten und Punkte werden addiert. Beispiel: Die Karte verlangt 45 Punkte aus Aufträgen und Fahnen, man hat 40 Punkte und 5 Blüten, dann ist sie erfüllt. Außerdem: Meisterprüfung (10), *-Karte umdrehen (5), Sonderplättchen.
  2. Den Blütenpfad ankreuzen: 1 Blüte = 1 Stern. Die Kreuze werden automatisch gesetzt. Das läuft parallel zu den normal verdienten Kreuzen.
  3. Den großen Stern "30" ankreuzen: 30 Blüten auf einmal in einer Partie, nicht über mehrere Partien verteilt. Außerdem muss der Blütenpfad bis zur "30" linear ausgefüllt sein. Die 4 Felder nach Fujiyama werden wie üblich mit normalen Kreuzen gefüllt.
- **Dialog am Partieende:** erscheint nach dem Bestätigen der Wertung nur, wenn Blüten gesammelt wurden. Dort wählt der Spieler, wofür er die Blüten ausgibt.
## Pfadende und nicht gewählte Zweige (von Benedikt bestätigt)
- Der Kreispfad läuft linear von "Start" bis "Stern 30", der Blütenpfad von "Öffnet Box 3" bis "Stern 30". Gewählt wird an den Gabelungen.
- Erst wenn ein Pfad nicht mehr nachfolgend ausgefüllt werden kann, also der gewählte Weg bis zum Ende gegangen ist, werden nicht gewählte Zweige mit den verbleibenden Kreuzen (Kreispfad) bzw. Blüten (Blütenpfad) angekreuzt. Angenommen: Das Ende ist erreicht, wenn der gewählte Weg bis zum Stern 30 vollständig ausgekreuzt ist.
- **Reihenfolge:** Der Spieler wählt, welcher Zweig gefüllt wird. Danach kreuzt die App automatisch weiter. Erreicht sie dabei eine Kreuzung (z. B. "Öffnet Box 2"), wählt der Spieler einen der nachfolgenden Kreise, dann geht es automatisch weiter.
- Im Basisspiel gibt es kein Pfadende, der Pfad ist endlos (siehe `app-anforderungen.md`).
## Offene Punkte
- Kalligraph-Sonderregel (zusätzliches Feld auf dem KB): Handling offen, siehe `freischaltregeln-sakura.md`.