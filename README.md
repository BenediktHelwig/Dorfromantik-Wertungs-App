# Dorfromantik – Wertung und Kampagne

Familien-App zur Wertung von Kampagnen des Brettspiels **Dorfromantik** (Pegasus). Ziel ist eine Nextcloud-App, die im Heimnetz (von außen per VPN) läuft und aufs Handy als PWA kommt. Kein App-Store, keine Accounts.

**Stand: Prototyp 0.1** – Wertungsmaske des Basisspiels mit getesteter Rechenlogik. Noch ohne Fortschrittsbaum, Nextcloud und Variante Sakura.

## Schnellstart

Voraussetzung: Node.js ≥ 20. Es gibt keine Abhängigkeiten, `npm install` ist nicht nötig.

```bash
npm test     # Unit-Tests (node:test)
npm start    # Prototyp unter http://localhost:8080/web/
```

## Aufbau

```
src/core/        Rechenlogik ohne UI, voll getestet
  highscore.js   Highscoreliste, Abrunden auf Zeile, Kreuze
  scoresheet.js  Wertungsblatt: Felder, Summen S1–S3, Ergebnis, Prüfung
  unlocks.js     Wirkung von Freischaltungen, Automatismus Goldenes Herz
  campaign.js    "Eure Ergebnisse", Kreuze gesamt, Spielnummern
test/            Tests je Modul
web/             Prototyp der Wertungsmaske (HTML/CSS/JS, ES-Module)
scripts/serve.js Minimaler statischer Server für den Prototyp
docs/            Spezifikation
```

Grundsatz: Gespeichert werden nur Rohdaten (Wertungsblätter und Entscheidungen der Spieler). Alles Abgeleitete wird daraus neu berechnet. So bleiben nachträgliche Korrekturen einfach.

## Prototyp ausprobieren

- Werte in B–E eintragen, Summen und Ergebnis rechnen sich live.
- „Wertung speichern“ fragt nach, ob alles eingetragen ist, trägt das Ergebnis unter „Eure Ergebnisse“ ein und legt das nächste Blatt an.
- Rechts unter „Eure Erfolge (Testdaten)“ lassen sich Freischaltungen simulieren. Ein Bonus mit Spielnummer N ist ab Spiel N+1 im Wertungsblatt freigespielt.
- Die Demo-Kampagne liegt im `localStorage` des Browsers.

## Nächste Schritte

Siehe `CLAUDE.md`, Abschnitt „Roadmap“.
