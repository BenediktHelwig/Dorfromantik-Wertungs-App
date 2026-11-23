# Schritt 2 – Basisspiel vollständig (Kampagnenverwaltung)

## Context
Schritt 1 (Fortschrittsbaum, PR #1) ist fertig. Der Prototyp kennt bisher genau eine Demo-Kampagne
im Browser-Speicher. Schritt 2 bringt den Lebenszyklus mehrerer Kampagnen: Startbildschirm, anlegen,
fortsetzen, beenden, schreibgeschützt ansehen, löschen. Die Logik liegt im reinen Kern
(`src/core`), der Prototyp in `web/` bekommt nur die Oberfläche dazu.

Branch: `feat/base-game-complete` von `feat/progress-tree-base`; PR mit Basis `feat/progress-tree-base`.

## Entscheidungen von Benedikt (23.11.2026) → `docs/entscheidungen.md`
1. **Keine Korrektur gespeicherter Wertungsblätter.** Ersetzt den Abschnitt „Nachträgliche Korrektur
   geschlossener Wertungsblätter (erlaubt)“ in `app-anforderungen.md` und das Abnahmekriterium
   „Korrektur … mit Warnung“ aus STEPS.md. Einzige Absicherung: Rückfrage „Ist alles eingetragen?“.
   Rohdaten-Prinzip bleibt. Der Hinweis „Warnung vor dem Speichern folgt in Schritt 2“ im Abschnitt
   Wegelogik ist damit hinfällig (neuer Eintrag verweist darauf; Altes wird nicht gelöscht, nur ergänzt).
2. **Kampagne entsteht mit dem ersten gespeicherten Wertungsblatt.** „Neue Kampagne starten“ öffnet
   ein leeres Blatt (Spiel 1); erst „Speichern“ legt die Kampagne an. Beginn = Datum des Anlegens.
3. **Kampagnenname = „Mitspielende“ aus Spiel 1.** Ab Spiel 2 wird das Feld fest übernommen und ist nicht
   änderbar. (Auslegung: In Spiel 1 ist das Feld Pflicht, sonst hätte die Kampagne keinen Namen.)
4. **Löschen:** laufende und beendete Kampagnen, immer mit Sicherheitsabfrage.
5. **Beenden** mit „Bist du sicher?“, setzt Enddatum; gesperrt, solange im Baum eine Frage offen ist.
   Danach schreibgeschützt: kein Blatt, keine Gabelungsentscheidung, kein Fahnenfest-Eintrag.

## Kern: neues Modul `src/core/campaigns.js` (rein, unveränderlich, Datum/Id als Parameter)
Gespeicherte Kampagne (nur Rohdaten): `{ id, startDate, endDate|null, sheets, decisions, manualUnlocks, manualReceived }`.
- `startCampaign({ id, date, firstSheet })` – Blatt muss Spielnummer 1 und nicht-leere Mitspielende haben.
- `campaignName(c)` – `sheets[0].players` (abgeleitet, nicht doppelt gespeichert).
- `createNextSheet(c, date)` – nutzt `createScoresheet`, `computeCampaign(...).nextGameNumber`,
  `activeBonusIds`; Mitspielende = Kampagnenname.
- `addSheet(c, sheet)` – nur laufend; Spielnummer = nächste; Mitspielende = Name; vorhandene
  Spielnummer wird nie überschrieben (keine Korrektur).
- `addDecision(c, decision)` / `setManualUnlock(c, id, game|null)` – nur laufend (übernimmt die
  Ersetzungslogik für `pending.rejected` aus `web/app.js` `decide`).
- `canEndCampaign(c)` – laufend und `computeCampaign(c).tree.pending === null`.
- `endCampaign(c, date)` – wirft, wenn beendet oder Frage offen.
- `isFinished(c)`, `deleteCampaign(list, id)`.
- `campaignOverview(list)` – `{ running, finished }` je mit `id, name, startDate, endDate, games`,
  neueste zuerst; beendete getrennt.
Wiederverwendung: `computeCampaign`, `nextGameNumber` (`campaign.js`), `createScoresheet`
(`scoresheet.js`), `activeBonusIds` (`unlocks.js`). `computeCampaign` bleibt unverändert.

## Tests zuerst: `test/campaigns.test.js` (ein Test je Regel)
- Kampagne entsteht erst mit dem ersten Wertungsblatt; Spielnummer 1, Beginn = übergebenes Datum
- Ohne Mitspielende in Spiel 1 wird keine Kampagne angelegt
- Name der Kampagne = Mitspielende aus Spiel 1; neues Blatt ab Spiel 2 trägt sie fest
- Blatt mit anderen Mitspielenden ab Spiel 2 wird abgelehnt
- Fortlaufende Spielnummer; falsche oder schon vergebene Spielnummer wird abgelehnt (keine Korrektur)
- Neues Blatt hat die freigespielten Boni angehakt (über `createNextSheet`)
- Kampagne beenden setzt das Enddatum; zweimal beenden wirft
- Beenden gesperrt, solange eine Gabelungsfrage offen ist; nach der Antwort möglich
- Beendete Kampagne ist schreibgeschützt: `addSheet`, `addDecision`, `setManualUnlock` werfen
- Abgelehnte Entscheidung wird ersetzt, sonst angehängt
- Übersicht trennt laufende und beendete, zeigt Namen, Beginn/Ende und Anzahl Spiele
- Laufende und beendete Kampagnen lassen sich löschen, andere bleiben
- Rohdaten: gespeicherte Kampagne hat nur die Rohdaten-Schlüssel; Eingaben werden nicht verändert
- Ergebnisse einer Kampagne = `computeCampaign` ihrer Rohdaten (Baum, Einträge unverändert zu Schritt 1)

## Prototyp `web/`
- `index.html`: Startbildschirm (Button „Neue Kampagne starten“, Liste laufend, Liste beendet) und
  Kampagnenansicht (bestehende Wertungsmaske + Kampagnenblatt), Kopf mit „Kampagne gespielt von … bis …“,
  Buttons „Zurück“, „Kampagne beenden“, „Kampagne löschen“. Demo-Reset-Button entfällt.
- `app.js`: Speicher-Key `dorfromantik-kampagnen-v3` = `{ campaigns: [...] }`; Übernahme der v2-Demo
  (falls Blätter vorhanden) als laufende Kampagne mit Beginn = Datum von Spiel 1. Alle Änderungen über
  die Kernfunktionen. Neue Kampagne: Blatt Spiel 1 ohne gespeicherte Kampagne, Speichern →
  `startCampaign`. Ab Spiel 2 Mitspielende-Feld gesperrt. Beendet: kein Formular, keine Fragen-Buttons,
  Fahnenfest nur Anzeige. „Kampagne beenden“ deaktiviert mit Hinweis, solange eine Frage offen ist.
- `style.css`: nur das Nötige.

## Dokumentation
`docs/entscheidungen.md` (Einträge oben), Projekt-`CLAUDE.md` „Stand“ und Roadmap Schritt 2
(ohne Korrektur), Kopfkommentar in `campaigns.js`. Anforderungsdocs bleiben unangetastet.

## Ablauf und Commits
1. Branch, `.agents/plans/step-2.md`
2. **red**: `test/campaigns.test.js` plus `campaigns.js` mit Exporten, die „nicht implementiert“
   werfen, damit die Tests an fehlendem Verhalten scheitern, nicht am Import; `npm test` → neue Tests rot
3. **green**: `campaigns.js` implementieren, `web/` umbauen; `npm test` grün
4. **docs**: entscheidungen.md, CLAUDE.md
5. Review durch `reviewer`, ggf. `fix per review`
6. Push, PR (`gh pr create --base feat/progress-tree-base --body-file .agents/pull-request-step-2.md`),
   progress.md, Plan löschen

## Verifikation
- `npm test` (alle alten und neuen Tests grün)
- `npm start`, http://localhost:8080/web/: neue Kampagne anlegen (Name aus Spiel 1), zweite Kampagne,
  Wechsel über den Startbildschirm, Gabelungsfrage → Beenden gesperrt, beantworten → beenden,
  beendete nur ansehen, beide löschen, Neuladen behält alles
