import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeBonusIds } from '../src/core/unlocks.js';

test('Freigeschaltetes wirkt erst ab der Folgepartie', () => {
  const unlocks = { zirkus: 2, hafen: 3, schiff: null };
  assert.deepEqual(activeBonusIds(unlocks, 3), ['zirkus']);
  assert.deepEqual(activeBonusIds(unlocks, 4).sort(), ['hafen', 'zirkus']);
  assert.deepEqual(activeBonusIds(unlocks, 2), []);
});
