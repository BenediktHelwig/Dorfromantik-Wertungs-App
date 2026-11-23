// Highscoreliste Sakura (Entscheidung 23.11.2026, Schritt 3): Tabelle vom Bogen, abgerundet, ab 500 bleibt es in Zeile 500.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HIGHSCORE_BASIS, HIGHSCORE_SAKURA, highscoreRow } from '../src/core/highscore.js';

const row = (n) => highscoreRow(n, HIGHSCORE_SAKURA);

const TABLE = [
  [500, null, 16], [490, null, 16], [480, null, 16], [470, null, 16], [460, null, 16],
  [450, 'Kaiser', 16], [440, 'Kaiserin', 16], [430, 'Prinzessin', 15], [420, 'Prinz', 15], [410, 'Shogun', 15],
  [400, 'Priester', 14], [390, 'Präfektin', 14], [380, 'Samurai', 14], [370, 'Geisha', 13], [360, 'Ronin', 13],
  [350, 'Tempeldiener', 13], [340, 'Provinzbeamtin', 12], [330, 'Harfenspielerin', 12], [320, 'Wandermönch', 12],
  [310, 'Architektin', 11], [300, 'Teebäuerin', 11], [290, 'Algenzüchterin', 11], [280, 'Perlentaucher', 10],
  [270, 'Seidenweberin', 10], [260, 'Salzsieder', 9], [250, 'Waffenschmied', 9], [240, 'Tuschemalerin', 8],
  [230, 'Maskenschnitzerin', 8], [220, 'Origami-Künstlerin', 7], [210, 'Glockengießer', 7], [200, 'Tatamiflechterin', 6],
  [190, 'Zubermacher', 6], [180, 'Lastkahnkapitän', 5], [170, 'Feuerwerkerin', 5], [160, 'Tofuverkäuferin', 4],
  [150, 'Flötenspielerin', 4], [140, 'Rettichhändler', 3], [130, 'Bambusflößer', 3], [120, 'Puppenspielerin', 2],
  [110, 'Rikschafahrer', 2], [0, 'Lastenträger', 1],
];

test('Sakura: die Tabelle entspricht dem Kampagnenbogen (Punkte, Titel, Kreuze)', () => {
  assert.deepEqual(HIGHSCORE_SAKURA.map((r) => [r.min, r.title, r.crosses]), TABLE);
});

test('Sakura: 0 bis 109 Punkte gehören zur Zeile „0–100“ mit 1 Kreuz', () => {
  for (const n of [0, 100, 109]) assert.deepEqual([row(n).min, row(n).crosses], [0, 1]);
});

test('Sakura: das Ergebnis wird auf die nächstniedrigere Zeile abgerundet (128 → 120, 2 Kreuze)', () => {
  assert.equal(row(128).min, 120);
  assert.equal(row(128).title, 'Puppenspielerin');
  assert.equal(row(128).crosses, 2);
  assert.equal(row(255).min, 250);
});

test('Sakura: ab 500 bleibt das Ergebnis in Zeile 500 mit 16 Kreuzen (700 bleibt in 500)', () => {
  for (const n of [500, 599, 700, 1200]) assert.deepEqual([row(n).min, row(n).crosses], [500, 16]);
});

test('Sakura: keine leeren Zusatzzeilen über 500 (anders als im Basisspiel)', () => {
  assert.equal(HIGHSCORE_SAKURA[0].min, 500);
  assert.equal(HIGHSCORE_SAKURA.length, 41);
});

test('Sakura: ungültige Ergebnisse werden abgelehnt', () => {
  assert.throws(() => row(-1), RangeError);
  assert.throws(() => row(1.5), RangeError);
});

test('Basisspiel bleibt unverändert, wenn keine Tabelle übergeben wird', () => {
  assert.equal(highscoreRow(128).min, 120);
  assert.equal(highscoreRow(128).title, 'Kutscher');
  assert.equal(highscoreRow(700).min, 700);
  assert.equal(HIGHSCORE_BASIS.length, 32);
});
