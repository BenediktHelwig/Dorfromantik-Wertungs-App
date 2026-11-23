# App-Anforderungen (Stand Brainstorming, Benedikt)
 
Nutzung: nur Familie, im Heimnetz, von außen per VPN. Ziel: Nextcloud-App als Web-Oberfläche, aufs Handy als PWA (kein Store, keine Accounts). Umsetzung später durch Agenten in einem Repo, zuerst Prototyp der Wertungsmaske mit Tests, danach Nextcloud-Gerüst. Regeln siehe `regeln-zusammenfassung.md`, Baum siehe `fortschrittsbaum.md`, Freischaltungen siehe `freischaltungen.md`. Variante Sakura siehe Abschnitt am Ende, `fortschrittsbaum-sakura.md`, `wertungsblatt-sakura.md` und `freischaltregeln-sakura.md`.
 
## Startbildschirm
- Neue Kampagne starten oder laufende Kampagne fortsetzen.
- Die Liste zum Fortsetzen zeigt die Namen der teilnehmenden Spieler je Kampagne.
- Beim Anlegen einer neuen Kampagne wird das aktuelle Datum automatisch als Beginn eingetragen (Felder "Mitspielende", "Kampagne gespielt von … bis …" im Kampagnenblatt).
- Beendete Kampagnen stehen getrennt von den laufenden, können eingesehen und gelöscht werden, aber nicht wieder geöffnet oder fortgesetzt werden.
## Kampagne beenden
- Button "Kampagne beenden" mit Sicherheitsabfrage ("Bist du sicher?"). Beim Ausführen wird das aktuelle Datum als Ende der Kampagne eingetragen.
- Danach ist die Kampagne schreibgeschützt (nur ansehen und löschen).
## Wertungsblatt
- Jedes neue Wertungsblatt in einer Kampagne bekommt automatisch eine fortlaufende ID, das ist die Spielnummer (Krone-Feld A), und beim Anlegen das aktuelle Datum.
- Bereits freigeschaltete Boni sind im Bereich E automatisch angehakt, die Punkte trägt der Spieler als Summe ein.
- Vor dem Speichern/Abschicken fragt die App nach, ob alles eingetragen ist.
- Beim Schließen des Wertungsblatts wird die Gesamtsumme automatisch im Kampagnenblatt unter "Eure Ergebnisse" eingetragen (abgerundete Zeile, Spielnummer in der Krone-Spalte, siehe Regeln). In einer Zeile von "Eure Ergebnisse" können mehrere Spielnummern stehen.
- **Automatismus Goldenes Herz:** siehe `freischaltungen.md`. Hat "Goldenes Herz" ein Kreuz und steht bei "Rote Herzen" erstmals mindestens 18, wird die aktuelle Spielnummer unter "Goldenes Herz" eingetragen (nur einmal, danach verbraucht).
## Nachträgliche Korrektur geschlossener Wertungsblätter (erlaubt)
- Ein gespeichertes Wertungsblatt darf nachträglich geändert werden. Das Kampagnenblatt wird danach angepasst.
- Gespeichert werden nur Rohdaten: die Wertungsblätter und die Entscheidungen des Spielers (Gabelungen, Zweigwahl, Blüten-Ausgaben, manuelle Erfüllungen). Alles Abgeleitete (Ergebnisse, Baum, Laufposition, automatische Freischaltungen) wird immer daraus neu berechnet.
- Beispiele für Folgen einer Korrektur: Das Ergebnis rutscht in eine andere Zeile von "Eure Ergebnisse" (Spielnummer wandert mit). Weniger Punkte bedeuten weniger Kreuze im Baum, dadurch kann ein Sechseck (und der zugehörige Eintrag im Bereich "Kampagnenblatt") wieder entfallen. Wird "Rote Herzen" korrigiert und die Summe liegt unter 18, entfällt die automatisch gesetzte Spielnummer bei "Goldenes Herz". Das Goldenes-Herz-Beispiel ist nur eines von mehreren, die Regel gilt allgemein.
- Manuelle Einträge im Bereich "Schachteln" bleiben unberührt, außer der automatischen Spielnummer bei "Goldenes Herz". Das Kreuz dort bleibt.
- Hängen spätere Gabelungs-Entscheidungen oder bereits eingetragene Bonus-Punkte späterer Wertungsblätter an etwas, das durch die Korrektur wegfällt, warnt die App vor dem Speichern und zeigt, was sich ändert.
## Kampagnenblatt / Fortschrittsbaum: Wegelogik (von Benedikt festgelegt und bestätigt, Stand 22.11.2026)
- Nach dem Schließen eines Wertungsblatts werden Kreuze im Baum automatisch gesetzt (Anzahl laut Highscoreliste).
- Der Spieler läuft einen **Pfad** durch den Baum. An einer Gabelung wählt er den ersten Kreis nach dem Sechseck. Diese Richtung wird beibehalten, die App folgt dem Pfad und kreuzt automatisch weiter. Sechsecke mit nur einem Ausgang werden automatisch durchlaufen. Kommt der Pfad an ein Sechseck mit mehreren Ausgängen, wählt der Spieler erneut den ersten Kreis nach dem Sechseck. Beispiel: Nach Schachtel 2 wählt er den Pfad Richtung Lagerhaus. Reichen die Kreuze bis zum Lagerhaus, fragt die App, ob es Richtung Getreidetunnel oder Bahnwärter weitergeht.
- Der Spieler wählt danach, was er als Nächstes freischalten will, nicht nach den Kosten der Pfade. An der Gabelung braucht es keine zusätzliche Kosten- oder "schon begangen"-Anzeige, der Spieler sieht den Baum visuell.
- **Ausgekreuzte Felder kosten nichts, solange noch nicht alles freigespielt ist (ersetzt die frühere Regel "erneutes Begehen kostet 1 Kreuz pro Kreis"):** Ein Feld kann nicht doppelt ausgekreuzt werden. Führt der gewählte Pfad über bereits ausgekreuzte Kreise, werden sie ohne Kosten übersprungen, und es geht am nächsten freien Kreis weiter. Beispiel: Nach Lagerhaus oder Zirkus wählt der Spieler direkt den mittleren Pfad Richtung Wolke, und ein Teil davon ist schon ausgekreuzt. Ist alles freigespielt, gilt nur noch die Regel "Restliche Felder" unten.
- **Kein Pfadende, Pfad läuft über die Wolke weiter:** Es gibt drei Wege zur Wolke (links, Mitte, rechts) und viele mögliche Varianten. Der Pfad endet nicht an der Wolke, sondern läuft auf einem anderen Weg wieder hinunter und über eine andere Seite wieder hinauf. Beispiel von Benedikt: Wanderer → Schachtel 1 → Schachtel 2 → Lagerhaus → … → Waldtunnel → Wolke → Hügel → … → Bahnwärter → Zirkus → Bauernhof → Wolke. Dabei bleiben die Abschnitte Lagerhaus–Bahnwärter und Schachtel 2–Zirkus unausgekreuzt, trotzdem ist alles freigeschaltet, was über das Kampagnenblatt freigeschaltet werden kann.
- **Restliche Felder (optional, sobald alles freigespielt ist):** Ist von der aktuellen Position aus in Laufrichtung kein freier Kreis mehr erreichbar (im Beispiel: Wolke nach Bauernhof), darf der Spieler die übrigen Kreuze in die noch freien Abschnitte setzen (im Beispiel Lagerhaus–Bahnwärter und Schachtel 2–Zirkus). Sie kosten wie üblich 1 Kreuz pro Kreis. Der Spieler wählt den Abschnitt, die App kreuzt automatisch weiter und fragt an jeder Kreuzung nach. Das ist reine Optik und schaltet nichts mehr frei, deshalb kann der Spieler es auch lassen. Die Kreuze verfallen dann. Danach dient die Kampagne nur noch der Highscore-Jagd mit allen Materialien.
- Übersprungene Pfade (z. B. der Abschnitt, an dem man bei einer Rundtour vorbeigelaufen ist) werden nicht automatisch ausgekreuzt.
- Die App speichert die Laufposition (wo der Pfad nach der letzten Partie endet und in welche Richtung er geht), damit die nächste Partie dort weitermacht. Sie wird aus den Rohdaten berechnet.
- Sind alle Kreise des Baums ausgekreuzt, verfallen übrige Kreuze.
- Erreichte Sechsecke der 12 Erfolgskarten setzen automatisch Kreuz und Spielnummer im Bereich "Kampagnenblatt" der Erfolgsliste. Der Bereich "Schachteln" wird manuell gepflegt. Dort kann pro Eintrag nur eine Spielnummer stehen.
- Hinweis: Beispiele von Benedikt sind teils verkürzte Pfadbeschreibungen (z. B. Lagerhaus → Wolke). Maßgeblich ist immer der Graph in `fortschrittsbaum.md` bzw. im .drawio.
## Highscoreliste: die drei leeren Zeilen oben (von Benedikt bestätigt)
- Auf dem Kampagnenblatt gibt es über der Zeile 400 (Kaiserin) drei leere Zeilen mit je 15 Kreisen, für Ergebnisse über 400.
- Zeilen 500, 600, 700, gleiche Abrundungsregel wie bei allen Zeilen: 400–499 bleibt in der Zeile 400, 500–599 → Zeile 500, 600–699 → Zeile 600, ab 700 → Zeile 700.
- Die Schwellen sind fest (nicht pro Kampagne einstellbar). Alle drei Zeilen geben wie 400 die vollen 15 Kreuze.
- Die Höchstpunktzahl eines perfekten Spiels ist nicht bekannt.
## Variante Sakura (Stand 22.11.2026, Details in den Sakura-Docs)
- Beim Anlegen einer Kampagne wählt der Spieler die Variante (Basisspiel oder Sakura). Sie bestimmt Wertungsblatt, Graph, Highscoreliste und Erfolgsliste.
- **Wertungsblatt Sakura:** andere Spalten (Kirschbaum, Reisfeld, Dorf, Straße, Fluss, Rundum, 7er-Aufträge), Zeilen Aufträge und Fahnen, Freigespielt-Liste mit 14 Einträgen plus Zeile "Kirschblüten (gesammelt)". Der Spieler trägt alle Zellen von Hand ein, die App rechnet Summen und liest Felder für automatische Erfolgsprüfungen aus.
- **Graph:** `graph-sakura.json`, Kreispfad (von Start bis Stern 30) plus Blütenpfad (von Öffnet Box 3 bis Stern 30).
- **Unterschiede zum Basisspiel:**
  - Sechsecke und Quadrate kosten je 1 Kreuz und gelten erst als freigeschaltet, wenn sie selbst angekreuzt sind (nicht schon durch das Ankreuzen des Nachbarn).
  - Erfolgskarten kommen aus Boxen. Quadrate fordern auf, eine Karte aus Box n zu holen, "+1"-Quadrate geben einen weiteren Gegenstand.
- **Erfolgsliste Sakura:** drei Arten der Freischaltung (direkt, per Aufgabe, manuell), automatische Prüfungen je Erfolgskarte, aktivierbare *-Karten, Auswahl-Dialog für einen Blütensammler direkt nach Freischaltung der Kirschblüten. Vollständig in `freischaltregeln-sakura.md`.
- **Highscoreliste Sakura:** Tabelle von 0–100 (1 Kreuz) bis 500 (16 Kreuze), keine leeren Zusatzzeilen. Ergebnisse ab 500 bleiben in der Zeile 500 (bestätigt: 700 bleibt in Zeile 500).
- **Kirschblüten:** Der Spieler trägt die gesammelten Blüten unter "Kirschblüten (gesammelt)" ein (maximal 50 pro Partie). Dieser Wert zählt vollständig als Punkte und bleibt unverändert. Für die Ausgaben legt die App im Hintergrund ein separates Ausgabe-Budget mit demselben Wert an, von dem alle Ausgaben abgezogen werden. Ein Rest verfällt am Partieende. Fehlende Punkte für eine Erfolgskarte oder ein Sonderplättchen können 1:1 mit Blüten aufgefüllt werden.
- **Ablauf am Partieende:** Wertung bestätigen, dann Kalligraph-Abfrage (falls freigeschaltet, beide Kalligraph-Felder sind freiwillig), dann Blüten-Dialog (nur wenn Blüten gesammelt wurden). Ausgeben für Erfolgskarten (z. B. Blütensammler), Sonderplättchen, Meisterprüfung (10), *-Karte umdrehen (5), Kalligraph-Kreuz auf dem Blütenpfad (10), Blütenpfad (1 je Stern, Kreuze automatisch) oder Stern 30 (30 auf einmal, Blütenpfad bis dahin linear ausgefüllt). Liste in `freischaltregeln-sakura.md`.