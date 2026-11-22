import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScoresheet, computeTotals, validateScoresheet, BONUSES } from '../src/core/scoresheet.js';

const filledSheet = () => {
  const sheet = createScoresheet({ gameNumber: 3, date: '2026-11-22', unlockedBonusIds: ['zirkus'] });
  Object.assign(sheet.orders, { wald: 12, getreide: 8, dorf: 5, gleis: 4, fluss: 6 }); // S1 = 35
  Object.assign(sheet.flags, { wald: 20, getreide: 9, dorf: 7 }); // 36
  Object.assign(sheet.longest, { gleis: 11, fluss: 13 }); // 24 -> S2 = 60
  sheet.bonuses.zirkus.points = 10; // S3 = 10
  return sheet;
};

test('neues Blatt: alles 0, freigespielte Boni markiert', () => {
  const sheet = createScoresheet({ gameNumber: 1, date: '2026-11-22', unlockedBonusIds: ['zirkus'] });
  assert.equal(Object.keys(sheet.bonuses).length, BONUSES.length);
  assert.equal(sheet.bonuses.zirkus.unlocked, true);
  assert.equal(sheet.bonuses.hafen.unlocked, false);
  assert.deepEqual(computeTotals(sheet), { s1: 0, s2: 0, s3: 0, total: 0 });
});

test('berechnet S1, S2, S3 und Ergebnis', () => {
  assert.deepEqual(computeTotals(filledSheet()), { s1: 35, s2: 60, s3: 10, total: 105 });
});

test('Punkte nicht freigespielter Boni zählen nicht', () => {
  const sheet = filledSheet();
  sheet.bonuses.hafen.points = 7;
  assert.equal(computeTotals(sheet).s3, 10);
});

test('gültiges Blatt hat keine Fehler', () => {
  assert.deepEqual(validateScoresheet(filledSheet()), []);
});

test('meldet negative, gebrochene und gesperrte Werte', () => {
  const sheet = filledSheet();
  sheet.orders.wald = -1;
  sheet.flags.dorf = 2.5;
  sheet.bonuses.hafen.points = 3;
  const errors = validateScoresheet(sheet);
  assert.equal(errors.length, 3);
  assert.match(errors.join('\n'), /Aufträge Wald/);
  assert.match(errors.join('\n'), /Fahnen Dorf/);
  assert.match(errors.join('\n'), /Hafen: noch nicht freigespielt/);
});
