# Entscheidungen

Entscheidungen von Benedikt zu Regeln, die die Anforderungsdokumente offen ließen oder
widersprüchlich beschrieben. Diese Datei hat Vorrang vor den übrigen Docs. Format: Regel,
Entscheidung, Grund, Datum.

## 23.11.2026 – Fortschrittsbaum Basisspiel (Schritt 1)

### 1. Pfadmodell statt freier Kreismenge
- **Regel:** Wie werden die Kreise im Baum ausgekreuzt?
- **Entscheidung:** Es gilt die „Wegelogik“ aus `app-anforderungen.md`: ein durchgehender Pfad mit
  Laufrichtung, an Gabelungen wählt der Spieler, ausgekreuzte Kreise werden kostenlos übersprungen,
  der Pfad endet nicht an der Wolke, danach optionale Restfelder. Der Abschnitt „Regelmodell“ in
  `fortschrittsbaum.md` („Menge von Kreisen, beliebig verteilt, auch über mehrere Äste“) ist damit
  überholt.
- **Grund:** `app-anforderungen.md` ist ausführlicher, ersetzt laut eigenem Text eine frühere
  Regel und entspricht dem gespielten Ablauf. Gespeichert werden nur die Entscheidungen des Spielers.

### 2. „Alles freigespielt“
- **Regel:** Wann gelten ausgekreuzte Kreise nicht mehr als kostenlos (Beginn der „Restlichen Felder“)?
- **Entscheidung:** Sobald alle 14 Sechsecke erreicht sind. Die 3 Herz-Kreise brauchen keine eigene
  Bedingung: Jeder Herz-Abschnitt liegt zwischen zwei Sechsecken mit nur zwei Anschlüssen, der Pfad
  läuft dort ohne Wahl durch, ein Herz-Kreis kann also nicht ausgelassen werden. Enden die Kreuze
  genau am Sechseck, geht der Pfad in der Folgepartie über die freien Kreise (1 Kreuz je Kreis)
  weiter.
- **Grund:** Antwort von Benedikt auf die Rückfrage; das Gegenbeispiel (Herz-Kreis frei trotz aller
  Sechsecke) kann beim Laufen eines Pfads nicht eintreten.

### 3. Schachtel 1 und 2 öffnen sich automatisch über den Baum
- **Regel:** Werden die Karten der Schachteln 1 und 2 im Bereich „Schachteln“ von der App eingetragen?
- **Entscheidung:** Ja. Erreicht der Pfad „Öffnet Schachtel 1“ in Spiel N, bekommen Rote Herzen und
  Herzenswünsche ihr Kreuz, bei „Rote Herzen“ steht Spielnummer N. „Öffnet Schachtel 2“ gibt Auf
  Erfolgsspur das Kreuz. Die Karten gelten ab Spiel N+1, wie bei den Schachteln 4 und 5. Manuell bleibt
  nur Fahnenfest.
- **Grund:** `freischaltungen.md` nennt als Prüfung „Schachtel 1 geöffnet“; die Schachteln 4 und 5
  öffnen sich bereits automatisch.

### Auslegung der Wegelogik (aus den Docs abgeleitet, keine neue Regel)
Diese Punkte füllen Lücken im Text. Weichen sie von deinem Spiel ab, bitte melden.
- **Rückweg:** An einem Sechseck führt der Weg, auf dem man kam, nicht zurück. Hat das Sechseck
  genau einen weiteren Ausgang, läuft der Pfad automatisch weiter, sonst wählt der Spieler.
- **Frage erst bei Bedarf:** Die App fragt nur, wenn an der Gabelung noch Kreuze übrig sind. Enden die
  Kreuze genau am Sechseck, kommt die Frage erst in der nächsten Partie. Bis zur Antwort bleiben die
  Kreuze offen, spätere Partien werden im Baum erst danach ausgewertet.
- **Restliche Felder:** Gibt es nach „alles freigespielt“ in Laufrichtung keinen freien Kreis, wählt der
  Spieler einen Abschnitt mit freiem Kreis am Sechseck oder lässt die Kreuze der Partie verfallen.
  Sind alle 123 Kreise ausgekreuzt, verfallen die Kreuze ohne Frage.
- **Kreuzungen in der Phase „Restliche Felder“ (von Benedikt bestätigt, 23.11.2026):** Hat ein Sechseck
  dort genau einen freien Ausgang, läuft der Pfad automatisch weiter, auch wenn das Sechseck im Baum
  mehrere Abschnitte hat. Gefragt wird nur bei mindestens zwei freien Ausgängen. Ist keiner frei,
  wählt der Spieler einen freien Abschnitt oder lässt die Kreuze verfallen. „Kreuze verfallen lassen“
  wird also nur dann angeboten, wenn kein freier Ausgang in Laufrichtung bleibt. Das weicht vom Wortlaut
  „fragt an jeder Kreuzung nach“ in `app-anforderungen.md` ab, die Entscheidung geht vor.
- **Entscheidungen hängen an der Reihenfolge der Fragen**, nicht an der Spielnummer. Wird ein Blatt
  korrigiert und passt eine Entscheidung nicht mehr, fragt die App neu (Warnung vor dem Speichern
  folgt in Schritt 2).
