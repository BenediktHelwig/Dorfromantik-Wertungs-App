# Fortschrittsbaum – Graph-Spezifikation
 
Quelle der Wahrheit: `Wertungsblock-Diagramm.drawio` im Ordner "Dorfromantik App" (von Benedikt gezeichnet, 14 Sechsecke, 123 Kreise, 3 Herzen, 1 Start). Aus der Datei maschinell geprüft: ein einziger zusammenhängender Graph, keine Duplikat- oder Selbstkanten, keine losen Enden. Die Zahlen unten stimmen mit dem Beispiel in der Anleitung überein (Spiel 1 mit 4 Kreisen öffnet Schachtel 1, Spiel 2 mit 5 weiteren Kreisen öffnet Schachtel 2, danach 2 Kreise Richtung Lagerhaus). Von Benedikt bestätigt.
 
## Knoten
- **Start:** Wanderer (unten rechts)
- **Kreise:** 123 (jeder hat genau 2 Nachbarn; nur die 3 Herz-Kreise haben zusätzlich ein Herz)
- **Sechsecke (14):** Öffnet Schachtel 1, Öffnet Schachtel 2, und 12 Erfolgskarten: Wolke, Waldtunnel, Hügel, Bauernhof, Dorftunnel, Schäferin, Burg, Getreidetunnel, Bahnwärter, Damhirsch (im Diagramm "Dammhirsch" geschrieben, im Spiel und in der App "Damhirsch"), Lagerhaus, Zirkus
- **Herzen (3):** je an einem Kreis in der Mitte der drei Verbindungen Dorftunnel–Getreidetunnel, Schäferin–Bahnwärter, Burg–Damhirsch (siehe unten)
## Strecken (Anzahl Kreise zwischen den Endpunkten)
- Wanderer – 2 – Schachtel 1 – 5 – Schachtel 2
- Schachtel 2 – 4 – Lagerhaus
- Schachtel 2 – 4 – Zirkus
- Lagerhaus – 6 – Getreidetunnel
- Lagerhaus – 6 – Bahnwärter
- Zirkus – 6 – Bahnwärter
- Zirkus – 6 – Damhirsch
- Getreidetunnel – 3 – [Herz-Kreis] – 4 – Dorftunnel (8 Kreise insgesamt)
- Bahnwärter – 3 – [Herz-Kreis] – 4 – Schäferin (8 Kreise insgesamt)
- Damhirsch – 3 – [Herz-Kreis] – 4 – Burg (8 Kreise insgesamt)
- Dorftunnel – 10 – Waldtunnel
- Schäferin – 10 – Hügel
- Burg – 10 – Bauernhof
- Waldtunnel – 10 – Wolke
- Hügel – 10 – Wolke
- Bauernhof – 10 – Wolke
Kontrollsumme: 2+5+4+4+6+6+6+6+8+8+8+10+10+10+10+10+10 = 123 Kreise.
 
Sechsecke mit 3 Anschlüssen: Schachtel 2, Lagerhaus, Zirkus, Bahnwärter, Wolke. Alle anderen Sechsecke haben 2 Anschlüsse. Schachtel 1 hat 2 Anschlüsse.
 
## Regelmodell für die App (bestätigt)
- Ausgekreuzt wird eine **Menge von Kreisen** (keine Reihenfolge, keine Richtung, Wege dürfen mehrfach begangen werden). Ein Kreis darf nur ausgekreuzt werden, wenn er an den Start, einen bereits ausgekreuzten Kreis oder ein erreichtes Sechseck grenzt.
- Pro Partie dürfen so viele Kreise ausgekreuzt werden, wie die Highscoreliste für das (abgerundete) Ergebnis angibt. Die Kreise addieren sich über die Partien.
- Sechsecke werden nie angekreuzt und kosten keinen Kreis. Ein Sechseck gilt als erreicht, sobald einer seiner Nachbarkreise ausgekreuzt ist. Der Kreis dahinter muss dafür nicht ausgekreuzt werden. Das Sechseck wird übersprungen, die Kreise auf seinen anderen Seiten werden dann auskreuzbar.
- Erreichtes Sechseck löst aus: Schachtel 1 öffnen, Schachtel 2 öffnen, oder eine neue Erfolgskarte aus Schachtel 3.
- Ein ausgekreuzter Herz-Kreis schaltet ein rotes Herz frei (Schachtel 3).
- Die Kreise einer Partie dürfen beliebig verteilt werden, auch über mehrere Äste.