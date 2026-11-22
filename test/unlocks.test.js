import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeBonusIds, goldenHeartUnlock } from '../src/core/unlocks.js';

test('Freigeschaltetes wirkt erst ab der Folgepartie', () => {
  const unlocks = { zirkus: 2, hafen: 3, schiff: null };
  assert.deepEqual(activeBonusIds(unlocks, 3), ['zirkus']);
  assert.deepEqual(activeBonusIds(unlocks, 4).sort(), ['hafen', 'zirkus']);
  assert.deepEqual(activeBonusIds(unlocks, 2), []);
});

test('Goldenes Herz: erstmals 18 Punkte mit Karte -> aktuelle Spielnummer', () => {
  assert.equal(goldenHeartUnlock({ hasCard: true, unlockedInGame: null, roteHerzenPoints: 18, gameNumber: 7 }), 7);
});

test('Goldenes Herz: unter 18 Punkten nichts', () => {
  assert.equal(goldenHeartUnlock({ hasCard: true, unlockedInGame: null, roteHerzenPoints: 17, gameNumber: 7 }), null);
});

test('Goldenes Herz: ohne Karte nichts', () => {
  assert.equal(goldenHeartUnlock({ hasCard: false, unlockedInGame: null, roteHerzenPoints: 30, gameNumber: 7 }), null);
});

test('Goldenes Herz: nur einmal, danach verbraucht', () => {
  assert.equal(goldenHeartUnlock({ hasCard: true, unlockedInGame: 4, roteHerzenPoints: 25, gameNumber: 7 }), null);
});
