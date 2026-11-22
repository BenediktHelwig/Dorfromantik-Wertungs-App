import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScoresheet } from '../src/core/scoresheet.js';
import { ACHIEVEMENTS, evaluateAchievements, receivedAchievements, availableHearts } from '../src/core/achievements.js';

const ALL = ACHIEVEMENTS.map((a) => a.id);
const sheet = (setup = {}) => {
  const s = createScoresheet({ gameNumber: 5, date: '2026-11-22', unlockedBonusIds: setup.unlocked ?? [] });
  Object.assign(s.orders, setup.orders);
  Object.assign(s.flags, setup.flags);
  Object.assign(s.longest, setup.longest);
  for (const [id, points] of Object.entries(setup.bonuses ?? {})) s.bonuses[id].points = points;
  return s;
};
const evaluate = (s, received = ALL, unlockGames = {}) => evaluateAchievements(s, { received, unlockGames });

test('14 Einträge im Bereich Schachteln', () => {
  assert.equal(ACHIEVEMENTS.length, 14);
});

test('leeres Blatt erfüllt nichts', () => {
  assert.deepEqual(evaluate(sheet()), { auto: [], confirm: [] });
});

test('Auf Erfolgsspur ab 200 Punkten', () => {
  assert.ok(!evaluate(sheet({ orders: { wald: 199 } })).auto.includes('aufErfolgsspur'));
  assert.ok(evaluate(sheet({ orders: { wald: 200 } })).auto.includes('aufErfolgsspur'));
});

test('Schachtel 4: ≥30 P durch Aufträge der jeweiligen Art', () => {
  const { auto } = evaluate(sheet({ orders: { wald: 30, getreide: 29, dorf: 31, gleis: 0, fluss: 45 } }));
  assert.deepEqual(auto.filter((id) => ['erntefest', 'lokomotive', 'schiff', 'wachturm', 'waldhuette'].includes(id)).sort(),
    ['schiff', 'wachturm', 'waldhuette']);
});

test('Bahnhof/Hafen: 180 Punkte und längstes Gleis/Fluss ≥12', () => {
  const base = { orders: { wald: 160 } };
  assert.deepEqual(evaluate(sheet({ ...base, longest: { gleis: 12, fluss: 11 } })).auto.filter((id) => ['bahnhof', 'hafen'].includes(id)), ['bahnhof']);
  assert.deepEqual(evaluate(sheet({ orders: { wald: 150 }, longest: { gleis: 12, fluss: 12 } })).auto.filter((id) => ['bahnhof', 'hafen'].includes(id)), []);
});

test('Baustelle zählt nur Aufträge (S1), keine Sonderplättchen-Punkte', () => {
  const nearly = sheet({ orders: { wald: 150 }, unlocked: ['waldhuette'], bonuses: { waldhuette: 20 } });
  assert.ok(!evaluate(nearly).auto.includes('baustelle'));
  assert.ok(evaluate(sheet({ orders: { wald: 100, dorf: 57 } })).auto.includes('baustelle'));
});

test('Ballon-Startplatz ab 300 Punkten', () => {
  assert.ok(evaluate(sheet({ orders: { wald: 200 }, flags: { wald: 100 } })).auto.includes('ballonStartplatz'));
});

test('Goldenes Herz: ≥18 P mit roten Herzen, nur wenn Rote Herzen freigespielt', () => {
  assert.ok(evaluate(sheet({ unlocked: ['roteHerzen'], bonuses: { roteHerzen: 18 } })).auto.includes('goldenesHerz'));
  assert.ok(!evaluate(sheet({ unlocked: ['roteHerzen'], bonuses: { roteHerzen: 17 } })).auto.includes('goldenesHerz'));
  assert.ok(!evaluate(sheet({ bonuses: { roteHerzen: 18 } })).auto.includes('goldenesHerz'));
});

test('Herzenswünsche: 6 P mit dem einen Herz', () => {
  assert.ok(evaluate(sheet({ unlocked: ['roteHerzen'], bonuses: { roteHerzen: 6 } })).auto.includes('herzenswuensche'));
  assert.ok(!evaluate(sheet({ unlocked: ['roteHerzen'], bonuses: { roteHerzen: 5 } })).auto.includes('herzenswuensche'));
});

test('Herzenswünsche öffnet Schachtel 4, Auf Erfolgsspur Schachtel 5 – ab der nächsten Partie', () => {
  const box4 = ['erntefest', 'lokomotive', 'schiff', 'wachturm', 'waldhuette'];
  const box5 = ['bahnhof', 'ballonStartplatz', 'baustelle', 'fahnenfest', 'goldenesHerz', 'hafen'];
  assert.deepEqual([...receivedAchievements([], { herzenswuensche: 3 }, 3)], []);
  assert.deepEqual([...receivedAchievements([], { herzenswuensche: 3 }, 4)].sort(), box4.sort());
  assert.deepEqual([...receivedAchievements([], { aufErfolgsspur: 2 }, 5)].sort(), box5.sort());
});

test('Karten aus Schachtel 4 werden ohne manuelles Kreuz geprüft, wenn Herzenswünsche erfüllt ist', () => {
  const s = sheet({ orders: { getreide: 30 } }); // Spiel 5
  assert.deepEqual(evaluate(s, [], { herzenswuensche: 4 }).auto, ['erntefest']);
  assert.deepEqual(evaluate(s, [], { herzenswuensche: 5 }).auto, []);
});

test('verfügbare rote Herzen', () => {
  const base = { roteHerzen: 1 };
  assert.equal(availableHearts({ unlockGames: {}, gameNumber: 5 }), 0);
  assert.equal(availableHearts({ unlockGames: { roteHerzen: 5 }, gameNumber: 5 }), 0);
  assert.equal(availableHearts({ unlockGames: base, gameNumber: 2 }), 1);
  // Herz-Kreise zählen erst, wenn Herzenswünsche erfüllt ist
  assert.equal(availableHearts({ unlockGames: base, boardHeartGames: [3], gameNumber: 6 }), 1);
  assert.equal(availableHearts({ unlockGames: { ...base, herzenswuensche: 4 }, boardHeartGames: [3, 6, null], gameNumber: 6 }), 2);
  assert.equal(availableHearts({ unlockGames: { ...base, herzenswuensche: 4 }, boardHeartGames: [3, 6, 7], gameNumber: 9 }), 4);
});

test('Fahnenfest ist manuell und wird nie automatisch gesetzt', () => {
  const result = evaluate(sheet({ flags: { wald: 200 }, orders: { wald: 200 } }));
  assert.ok(![...result.auto, ...result.confirm].includes('fahnenfest'));
});

test('ohne Kreuz (Karte nicht erhalten) keine Freischaltung', () => {
  assert.deepEqual(evaluate(sheet({ orders: { wald: 300 } }), ['hafen']).auto, []);
});

test('bereits erfüllte Karten werden nicht erneut gesetzt', () => {
  const result = evaluate(sheet({ orders: { wald: 300 } }), ALL, { aufErfolgsspur: 2, ballonStartplatz: 3 });
  assert.ok(!result.auto.includes('aufErfolgsspur'));
  assert.ok(!result.auto.includes('ballonStartplatz'));
});
