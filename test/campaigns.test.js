// Lebenszyklus der Kampagnen (Schritt 2): anlegen, fortsetzen, beenden, ansehen, löschen.
// Regeln: docs/entscheidungen.md (23.11.2026, Schritt 2), docs/app-anforderungen.md (Startbildschirm,
// Kampagne beenden). Gespeichert werden nur Rohdaten, Ergebnisse berechnet computeCampaign neu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScoresheet } from '../src/core/scoresheet.js';
import { computeCampaign } from '../src/core/campaign.js';
import {
  startCampaign, campaignName, createNextSheet, addSheet, addDecision, setManualUnlock,
  canEndCampaign, endCampaign, isFinished, deleteCampaign, campaignOverview,
} from '../src/core/campaigns.js';

const PLAYERS = 'Anna, Ben';

function sheet(gameNumber, points, { players = PLAYERS, date = '2026-11-23' } = {}) {
  const s = createScoresheet({ gameNumber, date });
  s.players = players;
  s.orders.wald = points;
  return s;
}

const start = (id = 'k1', date = '2026-11-20', points = 130) =>
  startCampaign({ id, date, firstSheet: sheet(1, points) });

/** Zwei Partien à 4 Kreuze: Schachtel 2 ist erreicht, ein Kreuz übrig → offene Gabelungsfrage. */
function withOpenFork() {
  return addSheet(start(), sheet(2, 130));
}

const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    Object.values(o).forEach(deepFreeze);
  }
  return o;
};

// ---- Anlegen ----

test('Kampagne entsteht mit dem ersten Wertungsblatt: Spiel 1, Beginn = übergebenes Datum, noch nicht beendet', () => {
  const c = start('k1', '2026-11-20');
  assert.equal(c.id, 'k1');
  assert.equal(c.startDate, '2026-11-20');
  assert.equal(c.endDate, null);
  assert.equal(c.sheets.length, 1);
  assert.equal(c.sheets[0].gameNumber, 1);
  assert.equal(isFinished(c), false);
});

test('Ohne Mitspielende in Spiel 1 entsteht keine Kampagne (sie hätte keinen Namen)', () => {
  for (const players of ['', '   ']) {
    assert.throws(() => startCampaign({ id: 'k', date: '2026-11-20', firstSheet: sheet(1, 100, { players }) }), /Mitspielende/);
  }
});

test('Das erste Wertungsblatt einer Kampagne hat die Spielnummer 1', () => {
  assert.throws(() => startCampaign({ id: 'k', date: '2026-11-20', firstSheet: sheet(2, 100) }), /Spielnummer/);
});

test('Der Kampagnenname sind die Mitspielenden aus Spiel 1', () => {
  assert.equal(campaignName(start()), PLAYERS);
});

// ---- Weitere Wertungsblätter ----

test('Das nächste Wertungsblatt trägt die nächste Spielnummer, das Datum und die Mitspielenden aus Spiel 1', () => {
  const next = createNextSheet(start(), '2026-11-21');
  assert.equal(next.gameNumber, 2);
  assert.equal(next.date, '2026-11-21');
  assert.equal(next.players, PLAYERS);
});

test('Das nächste Wertungsblatt hat bereits freigespielte Boni angehakt', () => {
  // Spiel 1 (130 P = 4 Kreuze) erreicht Schachtel 1 → Rote Herzen gelten ab Spiel 2.
  const next = createNextSheet(start(), '2026-11-21');
  assert.equal(next.bonuses.roteHerzen.unlocked, true);
  assert.equal(next.bonuses.zirkus.unlocked, false);
});

test('addSheet hängt das Blatt an, die Eingabe bleibt unverändert', () => {
  const c = deepFreeze(start());
  const second = deepFreeze(sheet(2, 120));
  const updated = addSheet(c, second);
  assert.equal(updated.sheets.length, 2);
  assert.equal(c.sheets.length, 1);
});

test('Mitspielende sind ab Spiel 2 fest: ein Blatt mit anderen Namen wird abgelehnt', () => {
  assert.throws(() => addSheet(start(), sheet(2, 100, { players: 'Anna' })), /Mitspielende/);
});

test('Spielnummern sind fortlaufend, eine vergebene Nummer wird nie überschrieben (keine Korrektur)', () => {
  const c = start();
  assert.throws(() => addSheet(c, sheet(1, 200)), /Spielnummer/);
  assert.throws(() => addSheet(c, sheet(3, 100)), /Spielnummer/);
  assert.equal(c.sheets[0].orders.wald, 130);
});

// ---- Entscheidungen und manuelle Erfüllungen ----

test('Eine Entscheidung wird angehängt', () => {
  const c = addDecision(withOpenFork(), { at: 'box2', toward: 'lagerhaus' });
  assert.deepEqual(c.decisions, [{ at: 'box2', toward: 'lagerhaus' }]);
  assert.equal(computeCampaign(c).tree.pending, null);
});

test('Eine abgelehnte Entscheidung wird durch die neue ersetzt, nicht angehängt', () => {
  const broken = { ...withOpenFork(), decisions: [{ at: 'box2', toward: 'box1' }] };
  assert.ok(computeCampaign(broken).tree.pending.rejected);
  const c = addDecision(broken, { at: 'box2', toward: 'zirkus' });
  assert.deepEqual(c.decisions, [{ at: 'box2', toward: 'zirkus' }]);
});

test('Eine manuelle Erfüllung (Fahnenfest) wird gesetzt und mit null wieder entfernt', () => {
  const set = setManualUnlock(start(), 'fahnenfest', 1);
  assert.deepEqual(set.manualUnlocks, { fahnenfest: 1 });
  assert.equal(computeCampaign(set).unlockGames.fahnenfest, 1);
  assert.deepEqual(setManualUnlock(set, 'fahnenfest', null).manualUnlocks, {});
});

// ---- Beenden ----

test('Kampagne beenden trägt das Enddatum ein', () => {
  const c = endCampaign(start(), '2026-12-01');
  assert.equal(c.endDate, '2026-12-01');
  assert.equal(isFinished(c), true);
});

test('Eine beendete Kampagne lässt sich nicht noch einmal beenden', () => {
  const c = endCampaign(start(), '2026-12-01');
  assert.throws(() => endCampaign(c, '2026-12-02'), /beendet/);
  assert.equal(canEndCampaign(c), false);
});

test('Beenden ist gesperrt, solange im Fortschrittsbaum eine Frage offen ist', () => {
  const c = withOpenFork();
  assert.ok(computeCampaign(c).tree.pending);
  assert.equal(canEndCampaign(c), false);
  assert.throws(() => endCampaign(c, '2026-12-01'), /Frage/);
});

test('Nach der Antwort auf die offene Frage lässt sich die Kampagne beenden', () => {
  const c = addDecision(withOpenFork(), { at: 'box2', toward: 'lagerhaus' });
  assert.equal(canEndCampaign(c), true);
  assert.equal(isFinished(endCampaign(c, '2026-12-01')), true);
});

test('Eine beendete Kampagne ist schreibgeschützt: Blatt, Entscheidung und manuelle Erfüllung werden abgelehnt', () => {
  const c = endCampaign(addDecision(withOpenFork(), { at: 'box2', toward: 'lagerhaus' }), '2026-12-01');
  assert.throws(() => addSheet(c, sheet(3, 100)), /beendet/);
  assert.throws(() => addDecision(c, { at: 'lagerhaus', toward: 'bahnwaerter' }), /beendet/);
  assert.throws(() => setManualUnlock(c, 'fahnenfest', 1), /beendet/);
});

test('Eine beendete Kampagne bleibt vollständig berechenbar (zum Ansehen)', () => {
  const c = endCampaign(start(), '2026-12-01');
  assert.equal(computeCampaign(c).totalCrosses, 4);
});

// ---- Übersicht und Löschen ----

test('Die Übersicht trennt laufende und beendete Kampagnen und zeigt Name, Beginn, Ende und Anzahl Spiele', () => {
  const running = addSheet(start('a', '2026-11-01'), sheet(2, 100));
  const finished = endCampaign(startCampaign({ id: 'b', date: '2026-11-05', firstSheet: sheet(1, 90, { players: 'Clara' }) }), '2026-11-10');
  const { running: r, finished: f } = campaignOverview([running, finished]);
  assert.deepEqual(r, [{ id: 'a', name: PLAYERS, startDate: '2026-11-01', endDate: null, games: 2 }]);
  assert.deepEqual(f, [{ id: 'b', name: 'Clara', startDate: '2026-11-05', endDate: '2026-11-10', games: 1 }]);
});

test('Die Übersicht nennt die jüngste Kampagne zuerst', () => {
  const list = [start('alt', '2026-10-01'), start('neu', '2026-11-15'), start('mitte', '2026-11-01')];
  assert.deepEqual(campaignOverview(list).running.map((k) => k.id), ['neu', 'mitte', 'alt']);
});

test('Laufende und beendete Kampagnen lassen sich löschen, die übrigen bleiben', () => {
  const list = [start('a'), endCampaign(start('b'), '2026-12-01'), start('c')];
  assert.deepEqual(deleteCampaign(list, 'a').map((c) => c.id), ['b', 'c']);
  assert.deepEqual(deleteCampaign(list, 'b').map((c) => c.id), ['a', 'c']);
  assert.equal(list.length, 3);
});

// ---- Rohdaten-Prinzip ----

test('Gespeichert werden nur Rohdaten, auch nach Beenden, Entscheidung und manueller Erfüllung', () => {
  const c = endCampaign(setManualUnlock(addDecision(withOpenFork(), { at: 'box2', toward: 'lagerhaus' }), 'fahnenfest', 2), '2026-12-01');
  assert.deepEqual(Object.keys(c).sort(), ['decisions', 'endDate', 'id', 'manualReceived', 'manualUnlocks', 'sheets', 'startDate']);
});

test('Ergebnisse, Baum und Einträge einer Kampagne rechnet computeCampaign aus ihren Rohdaten', () => {
  const c = withOpenFork();
  const computed = computeCampaign(c);
  assert.equal(computed.totalCrosses, 8);
  assert.equal(computed.nextGameNumber, 3);
  assert.equal(computed.unlockGames.roteHerzen, 1);
});
