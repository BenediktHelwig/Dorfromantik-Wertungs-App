import { test } from 'node:test';
import assert from 'node:assert/strict';
import { highscoreRow } from '../src/core/highscore.js';

test('rundet auf die nächstniedrigere Zeile ab', () => {
  assert.equal(highscoreRow(128).min, 120);
  assert.equal(highscoreRow(128).crosses, 3);
  assert.equal(highscoreRow(120).min, 120);
});

test('0–99 ist Vagabund mit 1 Kreuz', () => {
  assert.deepEqual(highscoreRow(0), { min: 0, title: 'Vagabund', crosses: 1 });
  assert.equal(highscoreRow(99).min, 0);
  assert.equal(highscoreRow(100).title, 'Zeitungsjunge');
});

test('Zwischenstufen oben: 375 und 350', () => {
  assert.equal(highscoreRow(374).min, 350);
  assert.equal(highscoreRow(399).min, 375);
});

test('Zusatzzeilen 500/600/700 geben 15 Kreuze', () => {
  assert.equal(highscoreRow(499).min, 400);
  assert.equal(highscoreRow(500).min, 500);
  assert.equal(highscoreRow(699).min, 600);
  assert.equal(highscoreRow(1000).min, 700);
  assert.equal(highscoreRow(1000).crosses, 15);
});

test('lehnt ungültige Ergebnisse ab', () => {
  assert.throws(() => highscoreRow(-1), RangeError);
  assert.throws(() => highscoreRow(1.5), RangeError);
});
