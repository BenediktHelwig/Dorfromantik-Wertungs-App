// Wertungsblatt Sakura: docs/wertungsblatt-sakura.md, docs/entscheidungen.md (Schritt 3, Punkte 3 und 10).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ORDER_COLUMNS, FLAG_COLUMNS, SAKURA_BONUSES, MAX_BLOSSOMS,
  createSakuraSheet, computeSakuraTotals, validateSakuraSheet, columnTotal,
} from '../src/core/sakura/scoresheet.js';

const ALL_BONUSES = SAKURA_BONUSES.map((b) => b.id);
const fresh = (opts = {}) => createSakuraSheet({ gameNumber: 3, date: '2026-11-23', ...opts });
const open = () => fresh({ unlockedBonusIds: ALL_BONUSES, unlockedColumns: ['rundum', 'sieben'] });

test('Spalten des Blatts: Kirschbaum, Reisfeld, Dorf, Straße, Fluss, Rundum und 7er-Aufträge', () => {
  assert.deepEqual(ORDER_COLUMNS, ['kirschbaum', 'reis', 'dorf', 'strasse', 'fluss', 'rundum', 'sieben']);
});

test('Fahnen: Kirschbaum, Reisfeld, Dorf, längste Straße, längster Fluss und Rundum-Bonus; die Zelle der 7er-Spalte entfällt', () => {
  assert.deepEqual(FLAG_COLUMNS, ['kirschbaum', 'reis', 'dorf', 'strasse', 'fluss', 'rundum']);
  assert.deepEqual(Object.keys(fresh().flags), FLAG_COLUMNS);
});

test('Freigespielt hat 14 Einträge, der erste sind die gesammelten Kirschblüten', () => {
  assert.deepEqual(ALL_BONUSES, [
    'kirschblueten', 'tempel', 'heisseQuellen', 'bruecken', 'tore', 'einsiedler', 'sternwarte',
    'kartograph', 'sumoringer', 'moossammlerin', 'reisbaeuerin',
    'schiffAnlegestelle', 'ochsenkarrenHandelsposten', 'poet',
  ]);
});

test('Ein neues Blatt trägt Spielnummer und Datum, ist leer und hat nur die übergebenen Einträge und Spalten offen', () => {
  const s = fresh({ unlockedBonusIds: ['tempel'], unlockedColumns: ['rundum'] });
  assert.equal(s.gameNumber, 3);
  assert.equal(s.date, '2026-11-23');
  assert.equal(computeSakuraTotals(s).total, 0);
  assert.equal(s.bonuses.tempel.unlocked, true);
  assert.equal(s.bonuses.poet.unlocked, false);
  assert.deepEqual(s.columns, { rundum: true, sieben: false });
  assert.deepEqual(s.activated, []);
});

test('Summen: Aufträge (S1), Fahnen (S2), Freigespielt (S3) und Ergebnis', () => {
  const s = open();
  s.orders.kirschbaum = 10; s.orders.rundum = 18; s.orders.sieben = 7;
  s.flags.dorf = 5; s.flags.strasse = 12; s.flags.rundum = 4;
  s.bonuses.tempel.points = 6; s.bonuses.poet.points = 3;
  assert.deepEqual(computeSakuraTotals(s), { s1: 35, s2: 21, s3: 9, total: 65 });
});

test('Gesammelte Kirschblüten zählen vollständig als Punkte', () => {
  const s = open();
  s.bonuses.kirschblueten.points = 37;
  assert.equal(computeSakuraTotals(s).total, 37);
});

test('Punkte nicht freigespielter Einträge zählen nicht', () => {
  const s = fresh({ unlockedBonusIds: ['tempel'] });
  s.bonuses.tempel.points = 6;
  s.bonuses.poet.points = 9;
  assert.equal(computeSakuraTotals(s).s3, 6);
});

test('Punkte einer noch gesperrten Spalte (Rundum, 7er) zählen nicht', () => {
  const s = fresh();
  s.orders.rundum = 8; s.orders.sieben = 7; s.flags.rundum = 2; s.orders.dorf = 1;
  assert.deepEqual(computeSakuraTotals(s), { s1: 1, s2: 0, s3: 0, total: 1 });
});

test('Spaltensumme für die Blütensammler: Aufträge plus Fahne (bzw. längste Straße/Fluss)', () => {
  const s = open();
  s.orders.dorf = 30; s.flags.dorf = 15; s.orders.strasse = 20; s.flags.strasse = 12;
  assert.equal(columnTotal(s, 'dorf'), 45);
  assert.equal(columnTotal(s, 'strasse'), 32);
});

test('Ein gültiges Blatt hat keine Fehler', () => {
  assert.deepEqual(validateSakuraSheet(open()), []);
});

test('Eingaben müssen ganze Zahlen ≥ 0 sein', () => {
  for (const bad of [-1, 1.5, NaN]) {
    const s = open();
    s.orders.reis = bad;
    assert.equal(validateSakuraSheet(s).length, 1, String(bad));
  }
});

test('Kirschblüten: höchstens 50 pro Partie', () => {
  const s = open();
  s.bonuses.kirschblueten.points = MAX_BLOSSOMS;
  assert.deepEqual(validateSakuraSheet(s), []);
  s.bonuses.kirschblueten.points = MAX_BLOSSOMS + 1;
  assert.match(validateSakuraSheet(s).join('\n'), /Kirschblüten/);
});

test('Nicht freigespielte Einträge müssen 0 sein', () => {
  const s = fresh();
  s.bonuses.tempel.points = 3;
  assert.match(validateSakuraSheet(s).join('\n'), /Tempel.*nicht freigespielt/);
});

test('Rundum und 7er-Aufträge sind vor der Freischaltung gesperrt und müssen 0 sein', () => {
  const s = fresh();
  s.orders.rundum = 4;
  assert.match(validateSakuraSheet(s).join('\n'), /Rundum/);
  const t = fresh();
  t.orders.sieben = 7;
  assert.match(validateSakuraSheet(t).join('\n'), /7er/);
  const f = fresh();
  f.flags.rundum = 2;
  assert.match(validateSakuraSheet(f).join('\n'), /Rundum/);
});

test('Rundum ist ohne 7er-Aufträge offen, wenn nur Box 1 geöffnet ist', () => {
  const s = fresh({ unlockedColumns: ['rundum'] });
  s.orders.rundum = 5; s.flags.rundum = 2;
  assert.deepEqual(validateSakuraSheet(s), []);
});

test('*-Karten dürfen nur eingesetzt werden, wenn sie einsetzbar sind', () => {
  const s = open();
  s.activated = ['geschenk'];
  assert.match(validateSakuraSheet(s, { activatable: new Set() }).join('\n'), /Geschenk/);
  assert.deepEqual(validateSakuraSheet(s, { activatable: new Set(['geschenk']) }), []);
});
