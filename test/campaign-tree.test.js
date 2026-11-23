// Kampagne aus Rohdaten: Fortschrittsbaum, Einträge in "Eure Erfolge", rote Herzen.
// Rohdaten = Wertungsblätter + Entscheidungen des Spielers + manuelle Erfüllungen. Alles andere wird berechnet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScoresheet } from '../src/core/scoresheet.js';
import { activeBonusIds } from '../src/core/unlocks.js';
import { receivedAchievements } from '../src/core/achievements.js';
import { computeCampaign, campaignResults } from '../src/core/campaign.js';

const go = (at, toward) => ({ at, toward });

// Wertungsblatt mit genau `points` Punkten (alles in Waldaufträgen); Kreuze: 130 → 4, 200 → 7, 400 → 15.
function sheet(gameNumber, points, { unlocked = [], bonuses = {} } = {}) {
  const s = createScoresheet({ gameNumber, date: '2026-11-23', unlockedBonusIds: unlocked });
  s.orders.wald = points;
  for (const [id, p] of Object.entries(bonuses)) s.bonuses[id].points = p;
  return s;
}
const snapshot = (raw) => JSON.parse(JSON.stringify(raw));

test('Erreichtes Erfolgskarten-Sechseck trägt die Spielnummer der Partie ein (Bereich Kampagnenblatt)', () => {
  const c = computeCampaign({
    sheets: [sheet(1, 130), sheet(2, 200)],
    decisions: [go('box2', 'lagerhaus')],
  });
  assert.equal(c.tree.reached.get('lagerhaus'), 2);
  assert.equal(c.unlockGames.lagerhaus, 2);
  assert.equal(c.unlockGames.roteHerzen, 1); // Öffnet Schachtel 1
});

test('Ein über den Baum freigeschalteter Bonus wirkt erst ab der Folgepartie', () => {
  const c = computeCampaign({
    sheets: [sheet(1, 130), sheet(2, 200)],
    decisions: [go('box2', 'zirkus')],
  });
  assert.equal(c.unlockGames.zirkus, 2);
  assert.ok(!activeBonusIds(c.unlockGames, 2).includes('zirkus'));
  assert.ok(activeBonusIds(c.unlockGames, 3).includes('zirkus'));
});

test('Schachtel 1 über den Baum: Karten Rote Herzen und Herzenswünsche sind ab der Folgepartie erhalten', () => {
  assert.deepEqual([...receivedAchievements([], {}, 1, { 1: 1 })], []);
  assert.deepEqual([...receivedAchievements([], {}, 2, { 1: 1 })].sort(), ['herzenswuensche', 'roteHerzen']);
  assert.deepEqual([...receivedAchievements([], {}, 4, { 2: 3 })], ['aufErfolgsspur']);
  assert.deepEqual([...receivedAchievements([], {}, 3, { 2: 3 })], []);
});

test('Nach Schachtel 1 und 2 sind deren Karten erhalten, ohne dass der Spieler etwas ankreuzt', () => {
  const afterBox1 = computeCampaign({ sheets: [sheet(1, 130)] });
  assert.deepEqual([...afterBox1.received].sort(), ['herzenswuensche', 'roteHerzen']);
  const afterBox2 = computeCampaign({ sheets: [sheet(1, 130), sheet(2, 200)], decisions: [go('box2', 'lagerhaus')] });
  assert.ok(afterBox2.received.has('aufErfolgsspur'));
});

test('Auf Erfolgsspur: 200 P in der Partie, in der Schachtel 2 öffnet, erfüllen die Karte noch nicht', () => {
  const decisions = [go('box2', 'lagerhaus'), go('lagerhaus', 'getreidetunnel')];
  const early = computeCampaign({ sheets: [sheet(1, 130), sheet(2, 200)], decisions });
  assert.equal(early.unlockGames.aufErfolgsspur, undefined);
  const later = computeCampaign({ sheets: [sheet(1, 130), sheet(2, 200), sheet(3, 200)], decisions });
  assert.equal(later.unlockGames.aufErfolgsspur, 3);
});

test('Herz-Kreise zählen erst nach Herzenswünsche und ab der Partie danach als verfügbare Herzen', () => {
  const c = computeCampaign({
    sheets: [
      sheet(1, 130),
      sheet(2, 120, { unlocked: ['roteHerzen'], bonuses: { roteHerzen: 6 } }), // Herzenswünsche: 6 P durch 1 Herz
      sheet(3, 400), // 15 Kreuze: Schachtel 2 → Lagerhaus → Getreidetunnel → Herz-Kreis
    ],
    decisions: [go('box2', 'lagerhaus'), go('lagerhaus', 'getreidetunnel')],
  });
  assert.equal(c.unlockGames.herzenswuensche, 2);
  assert.deepEqual(c.tree.heartGames, [3]);
  assert.deepEqual(c.hearts, { 1: 0, 2: 1, 3: 1, 4: 2 });
});

test('Neuberechnung: weniger Punkte in einem Blatt, dann entfallen Sechseck und Eintrag', () => {
  const raw = {
    sheets: [sheet(1, 130), sheet(2, 200)],
    decisions: [go('box2', 'lagerhaus')],
  };
  assert.equal(computeCampaign(raw).unlockGames.lagerhaus, 2);

  const corrected = { ...raw, sheets: [sheet(1, 130), sheet(2, 100)] }; // 2 statt 7 Kreuze
  const c = computeCampaign(corrected);
  assert.equal(c.tree.reached.has('box2'), false);
  assert.equal(c.unlockGames.lagerhaus, undefined);
  assert.equal(c.unlockGames.roteHerzen, 1);
});

test('Neuberechnung: unter 18 P bei Rote Herzen entfällt die automatische Spielnummer bei Goldenes Herz', () => {
  const decisions = [go('box2', 'lagerhaus'), go('lagerhaus', 'getreidetunnel')];
  const withHearts = (points) => [
    sheet(1, 130),
    sheet(2, 200),
    sheet(3, 200), // erfüllt Auf Erfolgsspur, öffnet damit Schachtel 5
    sheet(4, 100, { unlocked: ['roteHerzen'], bonuses: { roteHerzen: points } }),
  ];
  assert.equal(computeCampaign({ sheets: withHearts(18), decisions }).unlockGames.goldenesHerz, 4);
  assert.equal(computeCampaign({ sheets: withHearts(17), decisions }).unlockGames.goldenesHerz, undefined);
});

test('Manuelle Erfüllungen bleiben erhalten (Fahnenfest)', () => {
  const c = computeCampaign({ sheets: [sheet(1, 130)], manualUnlocks: { fahnenfest: 1 } });
  assert.equal(c.unlockGames.fahnenfest, 1);
});

test('Eure Ergebnisse stammen weiterhin aus den Wertungsblättern', () => {
  const sheets = [sheet(1, 130), sheet(2, 200)];
  const c = computeCampaign({ sheets, decisions: [go('box2', 'lagerhaus')] });
  assert.deepEqual(c.rows, campaignResults(sheets).rows);
  assert.equal(c.totalCrosses, 11);
  assert.equal(c.nextGameNumber, 3);
});

test('Die Berechnung verändert die Rohdaten nicht und ist wiederholbar', () => {
  const raw = {
    sheets: [sheet(1, 130), sheet(2, 200)],
    decisions: [go('box2', 'lagerhaus')],
    manualUnlocks: { fahnenfest: 2 },
  };
  const before = snapshot(raw);
  const a = computeCampaign(raw);
  const b = computeCampaign(raw);
  assert.deepEqual(snapshot(raw), before);
  assert.deepEqual(a.unlockGames, b.unlockGames);
  assert.deepEqual(a.hearts, b.hearts);
});
