import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScoresheet } from '../src/core/scoresheet.js';
import { campaignResults, nextGameNumber } from '../src/core/campaign.js';

const sheetWithTotal = (gameNumber, total) => {
  const sheet = createScoresheet({ gameNumber, date: '2026-11-22' });
  sheet.orders.wald = total;
  return sheet;
};

test('trägt Spielnummern in die abgerundete Zeile ein, mehrere pro Zeile möglich', () => {
  const { rows } = campaignResults([sheetWithTotal(1, 128), sheetWithTotal(2, 125), sheetWithTotal(3, 512)]);
  assert.deepEqual(rows.find((r) => r.min === 120).gameNumbers, [1, 2]);
  assert.deepEqual(rows.find((r) => r.min === 500).gameNumbers, [3]);
});

test('summiert die Kreuze über alle Partien', () => {
  // 128 -> 3, 95 -> 1, 260 -> 10
  const { totalCrosses } = campaignResults([sheetWithTotal(1, 128), sheetWithTotal(2, 95), sheetWithTotal(3, 260)]);
  assert.equal(totalCrosses, 14);
});

test('Korrektur eines Blatts verschiebt die Spielnummer (Neuberechnung)', () => {
  const sheets = [sheetWithTotal(1, 128)];
  sheets[0].orders.wald = 141;
  const { rows } = campaignResults(sheets);
  assert.deepEqual(rows.find((r) => r.min === 120).gameNumbers, []);
  assert.deepEqual(rows.find((r) => r.min === 140).gameNumbers, [1]);
});

test('Spielnummer ist fortlaufend', () => {
  assert.equal(nextGameNumber([]), 1);
  assert.equal(nextGameNumber([sheetWithTotal(1, 0), sheetWithTotal(2, 0)]), 3);
});
