// Lebenszyklus einer Sakura-Kampagne: Variante bei der Anlage, Blütensammler, Partieende-Eintrag.
// Regeln: docs/app-anforderungen.md (Variante Sakura), docs/entscheidungen.md (Schritt 2 und 3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScoresheet } from '../src/core/scoresheet.js';
import { createSakuraSheet } from '../src/core/sakura/scoresheet.js';
import { computeSakuraCampaign } from '../src/core/sakura/campaign.js';
import {
  startCampaign, createNextSheet, addSheet, addDecision, chooseCollector, setGameEnd,
  canEndCampaign, endCampaign, campaignOverview,
} from '../src/core/campaigns.js';
import { optionFor } from './helpers/sakura.js';

const PLAYERS = 'Anna, Ben';

function sheet(gameNumber, points = 0, fn = () => {}) {
  const s = createSakuraSheet({ gameNumber, date: '2026-11-23' });
  s.players = PLAYERS;
  s.orders.kirschbaum = points;
  fn(s);
  return s;
}

const start = (points = 410) => startCampaign({ id: 's1', date: '2026-11-20', variant: 'sakura', firstSheet: sheet(1, points) });
const answer = (c, name) => {
  const { pending } = computeSakuraCampaign(c);
  return addDecision(c, optionFor(pending.options, name));
};
/** Spiel 1 mit 15 Kreuzen, Zweig See: Öffnet Box 3 ist erreicht, die Blütensammler-Wahl steht offen. */
const atBoxThree = () => answer(start(), 'See');

test('Die Variante wird bei der Anlage gewählt und mit der Kampagne gespeichert, sonst nur Rohdaten', () => {
  const c = start();
  assert.equal(c.variant, 'sakura');
  assert.deepEqual(Object.keys(c).sort(),
    ['collector', 'decisions', 'endDate', 'gameEnds', 'id', 'manualUnlocks', 'sheets', 'startDate', 'variant']);
  assert.equal(c.collector, null);
  assert.deepEqual(c.gameEnds, {});
});

test('Ohne Variante entsteht eine Basisspiel-Kampagne wie bisher', () => {
  const first = createScoresheet({ gameNumber: 1, date: '2026-11-20' });
  first.players = PLAYERS;
  const c = startCampaign({ id: 'b', date: '2026-11-20', firstSheet: first });
  assert.ok(!('variant' in c));
  assert.equal(createNextSheet(c, '2026-11-21').bonuses.roteHerzen.unlocked, false);
});

test('Das nächste Wertungsblatt ist ein Sakura-Blatt mit den freigespielten Spalten und Einträgen', () => {
  const next = createNextSheet(atBoxThree(), '2026-11-21');
  assert.equal(next.gameNumber, 2);
  assert.equal(next.players, PLAYERS);
  assert.equal(next.columns.rundum, true);
  assert.equal(next.columns.sieben, false);
  assert.equal(next.bonuses.kirschblueten.unlocked, true);
  assert.equal(next.bonuses.tempel.unlocked, false);
  assert.ok('sieben' in next.orders);
});

test('Sakura-Kampagne: Mitspielende ab Spiel 2 fest, nächste Spielnummer erwartet', () => {
  const c = atBoxThree();
  assert.throws(() => addSheet(c, sheet(3)), /Spielnummer 2/);
  const other = sheet(2);
  other.players = 'Clara';
  assert.throws(() => addSheet(c, other), /Mitspielende/);
  assert.equal(addSheet(c, sheet(2)).sheets.length, 2);
});

test('Gabelungs-Entscheidung: die Spur wird aus der offenen Frage übernommen', () => {
  const c = answer(start(), 'See');
  assert.equal(c.decisions.length, 1);
  assert.equal(c.decisions[0].track, 'path');
  assert.equal(c.decisions[0].at, 'Box2');
});

test('Eine nicht mehr passende Entscheidung wird ersetzt, nicht angehängt', () => {
  const bad = { ...start(), decisions: [{ track: 'path', at: 'Box2', toward: 'Start' }] };
  const fixed = answer(bad, 'Kreuzung');
  assert.equal(fixed.decisions.length, 1);
  assert.notEqual(fixed.decisions[0].toward, 'Start');
});

test('Blütensammler wählen: nur bei offener Frage, nur aus den fünf Karten', () => {
  assert.throws(() => chooseCollector(start(), 'gourmet'), /Blütensammler/);
  const c = atBoxThree();
  assert.throws(() => chooseCollector(c, 'teemeisterin'), /Blütensammler/);
  assert.throws(() => chooseCollector(c, 'nichts'), /Blütensammler/);
  const chosen = chooseCollector(c, 'pilger');
  assert.equal(chosen.collector, 'pilger');
  assert.equal(c.collector, null, 'Eingabe bleibt unverändert');
  assert.throws(() => chooseCollector(chosen, 'gourmet'), /Blütensammler/);
});

test('Partieende-Eintrag: wird nur für das zuletzt gespeicherte Blatt und nur einmal gespeichert', () => {
  const c = chooseCollector(atBoxThree(), 'gourmet');
  const two = addSheet(c, sheet(2, 0, (s) => { s.bonuses.kirschblueten.points = 10; }));
  assert.throws(() => setGameEnd(two, 1, { stars: 1 }), /Spiel 2/);
  const saved = setGameEnd(two, 2, { stars: 4 });
  assert.deepEqual(saved.gameEnds, { 2: { stars: 4 } });
  assert.throws(() => setGameEnd(saved, 2, { stars: 5 }), /schon/);
});

test('Partieende-Eintrag: ungültige Ausgaben (über dem Budget) werden abgelehnt und nicht gespeichert', () => {
  const c = chooseCollector(atBoxThree(), 'gourmet');
  const two = addSheet(c, sheet(2, 0, (s) => { s.bonuses.kirschblueten.points = 3; }));
  assert.throws(() => setGameEnd(two, 2, { stars: 4 }), /Budget/);
  assert.deepEqual(two.gameEnds, {});
});

test('Partieende-Eintrag: gespeichert wird der Eintrag des Spielers, nichts Abgeleitetes', () => {
  const c = chooseCollector(atBoxThree(), 'gourmet');
  const two = addSheet(c, sheet(2, 0, (s) => { s.bonuses.kirschblueten.points = 10; }));
  const saved = setGameEnd(two, 2, { stars: 4, freeSpend: 1 });
  assert.deepEqual(Object.keys(saved.gameEnds[2]).sort(), ['freeSpend', 'stars']);
  assert.deepEqual(Object.keys(saved).sort(), Object.keys(two).sort());
});

test('Beenden ist gesperrt, solange eine Frage offen ist (Gabelung oder Blütensammler), danach möglich', () => {
  const fork = start();
  assert.equal(canEndCampaign(fork), false);
  assert.throws(() => endCampaign(fork, '2026-11-30'), /Frage/);
  const collector = atBoxThree();
  assert.equal(canEndCampaign(collector), false);
  const ready = chooseCollector(collector, 'gourmet');
  assert.equal(canEndCampaign(ready), true);
  const ended = endCampaign(ready, '2026-11-30');
  assert.equal(ended.endDate, '2026-11-30');
});

test('Eine beendete Sakura-Kampagne ist schreibgeschützt', () => {
  const ended = endCampaign(chooseCollector(atBoxThree(), 'gourmet'), '2026-11-30');
  assert.throws(() => addSheet(ended, sheet(2)), /schreibgeschützt/);
  assert.throws(() => setGameEnd(ended, 1, {}), /schreibgeschützt/);
  assert.throws(() => chooseCollector(ended, 'pilger'), /schreibgeschützt/);
});

test('Der Startbildschirm kennt die Variante der Sakura-Kampagne; Basis-Einträge bleiben unverändert', () => {
  const { running } = campaignOverview([start()]);
  assert.deepEqual(running, [{ id: 's1', name: PLAYERS, startDate: '2026-11-20', endDate: null, games: 1, variant: 'sakura' }]);
});
