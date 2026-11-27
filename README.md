# Dorfromantik – Wertung und Kampagne

Familien-App zur Wertung von Kampagnen des Brettspiels **Dorfromantik** (Pegasus). Ziel ist eine Nextcloud-App, die im Heimnetz (von außen per VPN) läuft und aufs Handy als PWA kommt. Kein App-Store, keine Accounts.

**Stand: 0.1.0** – Nextcloud-App mit PWA für Basisspiel und Sakura: Kampagnenverwaltung, Wertungsblätter, Fortschrittsbaum und Erfolge. Einrichtung in der eigenen Nextcloud: [INSTALL.md](INSTALL.md). Auf echten Handys und auf dem Heimserver noch nicht geprüft.

## Schnellstart

Voraussetzung: Node.js ≥ 20. Rechenlogik, Tests und Prototyp haben keine Abhängigkeiten, `npm install` ist nicht nötig. Die Nextcloud-App baut und testet ihr mit Docker (siehe [INSTALL.md](INSTALL.md)).

```bash
npm test     # Unit-Tests (node:test)
npm start    # Prototyp unter http://localhost:8080/web/

docker compose up -d --wait   # Nextcloud mit der App unter http://localhost:8081
npm run test:integration      # Integrationstests gegen diesen Container
```

## Aufbau

```
src/core/        Rechenlogik ohne UI, voll getestet
  highscore.js   Highscoreliste, Abrunden auf Zeile, Kreuze
  scoresheet.js  Wertungsblatt: Felder, Summen S1–S3, Ergebnis, Prüfung
  unlocks.js     Wirkung von Freischaltungen ab der Folgepartie
  achievements.js Erfolgskarten der Schachteln, Prüfung am Partieende
  campaign.js    "Eure Ergebnisse", Kreuze gesamt, Spielnummern; computeCampaign rechnet alles aus den Rohdaten
  progressTree.js Fortschrittsbaum: Pfadlogik (Gabelungen, Überspringen, Restfelder, Verfall)
  graph-basis.json Graph des Basisspiels (Sechsecke, Abschnitte, Herz-Kreise, Positionen für die Zeichnung)
test/            Tests je Modul
nextcloud-app/   Nextcloud-App: PHP-Backend (lib/), Vue-Oberfläche (src/), PWA (pwa/, img/)
integration/     Integrationstests gegen den Nextcloud-Container
nextcloud/       Einrichtung des Entwicklungs-Containers
web/             Prototyp der Oberfläche (HTML/CSS/JS, ES-Module)
scripts/serve.js Minimaler statischer Server für den Prototyp
docs/            Spezifikation, Anforderungen, Entscheidungen (entscheidungen.md hat Vorrang)
```

Grundsatz: Gespeichert werden nur Rohdaten (Wertungsblätter und Entscheidungen der Spieler). Alles Abgeleitete wird daraus neu berechnet.

## Prototyp ausprobieren

- Werte in B–E eintragen, Summen und Ergebnis rechnen sich live.
- „Wertung speichern“ fragt nach, ob alles eingetragen ist, trägt das Ergebnis unter „Eure Ergebnisse“ ein und legt das nächste Blatt an.
- Rechts der Fortschrittsbaum: Nach dem Speichern kreuzt die App Kreise aus und fragt an Gabelungen, wie es weitergeht. Erreichte Sechsecke tragen sich unter „Eure Erfolge“ ein, ebenso erfüllte Karten der Schachteln. Ein Bonus mit Spielnummer N ist ab Spiel N+1 freigespielt. Nur Fahnenfest trägst du selbst ein.
- Die Demo-Kampagne liegt im `localStorage` des Browsers, und zwar nur als Rohdaten (Blätter, Entscheidungen, manuelle Erfüllungen). Alte Demodaten aus 0.1 werden übernommen, die Wege im Baum musst du neu wählen.

## Nächste Schritte

Siehe `CLAUDE.md`, Abschnitt „Roadmap“.
