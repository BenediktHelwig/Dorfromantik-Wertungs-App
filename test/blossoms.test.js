// Kirschblüten: Ausgabe-Budget und Eintrag am Partieende.
// Regeln: docs/freischaltregeln-sakura.md (Kirschblüten), docs/entscheidungen.md (Schritt 3, Punkte 4, 5, 9).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_BLOSSOMS, SAKURA_BONUSES, createSakuraSheet } from '../src/core/sakura/scoresheet.js';
import { BLOSSOM_COSTS, blossomBudget, evaluateGameEnd, starCardState } from '../src/core/sakura/blossoms.js';

const ALL = SAKURA_BONUSES.map((b) => b.id);

/** Offenes Blatt mit `blossoms` gesammelten Blüten. */
function sheetOf(blossoms, fn = () => {}) {
  const s = createSakuraSheet({ gameNumber: 5, date: '2026-11-23', unlockedBonusIds: ALL, unlockedColumns: ['rundum', 'sieben'] });
  s.bonuses.kirschblueten.points = blossoms;
  fn(s);
  return s;
}

/** Wertet einen Eintrag am Partieende aus. */
function evaluate({ blossoms = 0, set, received = [], unlockGames = {}, entry = {}, flippable = [], kalligraphActive = false }) {
  return evaluateGameEnd({
    sheet: sheetOf(blossoms, set), received: new Set(received), unlockGames, entry,
    flippable: new Set(flippable), kalligraphActive,
  });
}

test('Die Kosten laut Regel: Meisterprüfung 10, Umdrehen 5, Kalligraph je Feld 10, Stern 30 = 30', () => {
  assert.deepEqual(BLOSSOM_COSTS, { masterExam: 10, flip: 5, kalligraphField: 10, bigStar: 30 });
  assert.equal(MAX_BLOSSOMS, 50);
});

test('Das Ausgabe-Budget ist so groß wie der Wert „Kirschblüten (gesammelt)“', () => {
  assert.equal(blossomBudget(sheetOf(37)), 37);
  assert.equal(blossomBudget(sheetOf(0)), 0);
});

test('Ohne freigeschaltete Kirschblüten gibt es kein Budget', () => {
  const s = createSakuraSheet({ gameNumber: 1, date: '2026-11-23' });
  s.bonuses.kirschblueten.points = 20;
  assert.equal(blossomBudget(s), 0);
});

test('Eine erreichte Aufgabe wird ohne Ausgabe eingetragen', () => {
  const r = evaluate({ received: ['lagerhaus'], set: (s) => { s.orders.rundum = 18; } });
  assert.deepEqual(r.fulfilled, ['lagerhaus']);
  assert.equal(r.spent, 0);
  assert.deepEqual(r.errors, []);
});

test('Nur erhaltene und noch nicht erfüllte Karten werden geprüft', () => {
  const set = (s) => { s.orders.rundum = 18; };
  assert.deepEqual(evaluate({ set }).fulfilled, []);
  assert.deepEqual(evaluate({ set, received: ['lagerhaus'], unlockGames: { lagerhaus: 3 } }).fulfilled, []);
});

test('Blüten füllen fehlende Punkte nur auf, wenn der Spieler es wählt (1 Blüte = 1 Punkt)', () => {
  const set = (s) => { s.orders.rundum = 15; };
  assert.deepEqual(evaluate({ blossoms: 5, set, received: ['lagerhaus'] }).fulfilled, []);
  const r = evaluate({ blossoms: 5, set, received: ['lagerhaus'], entry: { fills: ['lagerhaus'] } });
  assert.deepEqual(r.fulfilled, ['lagerhaus']);
  assert.equal(r.spent, 3);
  assert.deepEqual(r.errors, []);
});

test('Auffüllen über das Budget hinaus ist ein Fehler und erfüllt die Karte nicht', () => {
  const r = evaluate({
    blossoms: 5, set: (s) => { s.orders.rundum = 10; }, received: ['lagerhaus'], entry: { fills: ['lagerhaus'] },
  });
  assert.match(r.errors.join('\n'), /Budget/);
  assert.deepEqual(r.fulfilled, []);
});

test('Auffüllen gilt für jede Karte mit Punktewert, hier ein Blütensammler (Gourmet 45: Dorf Aufträge + Fahne)', () => {
  const r = evaluate({
    blossoms: 5, set: (s) => { s.orders.dorf = 35; s.flags.dorf = 5; }, received: ['gourmet'], entry: { fills: ['gourmet'] },
  });
  assert.deepEqual(r.fulfilled, ['gourmet']);
  assert.equal(r.spent, 5);
});

test('Ein nicht gewählter Blütensammler wird nicht geprüft', () => {
  const r = evaluate({ set: (s) => { s.orders.kirschbaum = 60; }, received: ['gourmet'] });
  assert.ok(!r.fulfilled.includes('pilger'));
});

test('Poet: bis genau 18 auffüllen; über 18 Punkten mit Tempeln gibt es nichts aufzufüllen', () => {
  const r = evaluate({ blossoms: 3, set: (s) => { s.bonuses.tempel.points = 15; }, received: ['poet'], entry: { fills: ['poet'] } });
  assert.deepEqual(r.fulfilled, ['poet']);
  assert.equal(r.spent, 3);
  const over = evaluate({ blossoms: 3, set: (s) => { s.bonuses.tempel.points = 19; }, received: ['poet'], entry: { fills: ['poet'] } });
  assert.match(over.errors.join('\n'), /Poet/);
});

test('Meisterprüfung: Gesamtsumme ≥250, der Spieler bestätigt, 10 Blüten werden abgezogen', () => {
  const set = (s) => { s.orders.kirschbaum = 240; };
  assert.deepEqual(evaluate({ blossoms: 10, set, received: ['meisterpruefung'] }).fulfilled, []);
  const r = evaluate({ blossoms: 10, set, received: ['meisterpruefung'], entry: { confirmed: ['meisterpruefung'] } });
  assert.deepEqual(r.fulfilled, ['meisterpruefung']);
  assert.equal(r.spent, 10);
  const poor = evaluate({ blossoms: 9, set: (s) => { s.orders.kirschbaum = 250; }, received: ['meisterpruefung'], entry: { confirmed: ['meisterpruefung'] } });
  assert.match(poor.errors.join('\n'), /Budget/);
  assert.deepEqual(poor.fulfilled, []);
});

test('Meisterprüfung mit Auffüllen: fehlende Punkte plus 10 Blüten', () => {
  const r = evaluate({
    blossoms: 30, set: (s) => { s.orders.kirschbaum = 210; }, received: ['meisterpruefung'],
    entry: { confirmed: ['meisterpruefung'], fills: ['meisterpruefung'] },
  });
  assert.deepEqual(r.fulfilled, ['meisterpruefung']);
  assert.equal(r.spent, 20); // Gesamtsumme 240 (Blüten zählen als Punkte): 10 fehlen, dazu 10 für die Prüfung
});

test('Teil-auto (Ochsenkarren, Schiff): der Zahlenteil allein genügt nicht, der Spieler muss bestätigen', () => {
  const set = (s) => { s.orders.kirschbaum = 300; };
  assert.deepEqual(evaluate({ set, received: ['ochsenkarrenHandelsposten'] }).fulfilled, []);
  const r = evaluate({ set, received: ['ochsenkarrenHandelsposten'], entry: { confirmed: ['ochsenkarrenHandelsposten'] } });
  assert.deepEqual(r.fulfilled, ['ochsenkarrenHandelsposten']);
  assert.equal(r.spent, 0);
});

test('Blütenpfad: 1 Blüte je Stern', () => {
  const r = evaluate({ blossoms: 8, entry: { stars: 5 } });
  assert.equal(r.starCrosses, 5);
  assert.equal(r.spent, 5);
});

test('Stern 30 kostet 30 Blüten auf einmal', () => {
  const r = evaluate({ blossoms: 30, entry: { bigStar: true } });
  assert.equal(r.bigStar, true);
  assert.equal(r.spent, 30);
  assert.match(evaluate({ blossoms: 29, entry: { bigStar: true } }).errors.join('\n'), /Budget/);
  assert.equal(evaluate({ blossoms: 35, entry: { stars: 3, bigStar: true } }).spent, 33);
});

test('Eine *-Karte umdrehen kostet 5 Blüten und geht nur für eingesetzte Karten', () => {
  const r = evaluate({ blossoms: 5, entry: { flips: ['geschenk'] }, flippable: ['geschenk'] });
  assert.deepEqual(r.flipped, ['geschenk']);
  assert.equal(r.spent, 5);
  assert.match(evaluate({ blossoms: 5, entry: { flips: ['umtrunk'] }, flippable: ['geschenk'] }).errors.join('\n'), /Umtrunk/);
});

test('Kalligraph: nur freigeschaltet und komplett umgeben; 1 freies Feld, je 10 Blüten 1 weiteres', () => {
  const kal = (k, blossoms = 20, kalligraphActive = true) => evaluate({ blossoms, entry: { kalligraph: k }, kalligraphActive });
  assert.equal(kal({ surrounded: true, extra: true }).circleCrosses, 1);
  assert.equal(kal({ surrounded: true, extra: true }).spent, 0);
  const paid = kal({ surrounded: true, extra: true, paid: 2 });
  assert.equal(paid.circleCrosses, 3);
  assert.equal(paid.spent, 20);
  assert.equal(kal({ surrounded: true, extra: false, paid: 1 }).circleCrosses, 1);
  assert.match(kal({ surrounded: false, extra: true }).errors.join('\n'), /Kalligraph/);
  assert.match(kal({ surrounded: true, extra: true }, 20, false).errors.join('\n'), /Kalligraph/);
  assert.match(kal({ surrounded: true, extra: true, paid: 3 }).errors.join('\n'), /Budget/);
});

test('Freie Ausgabe (Sonderplättchen) kostet den eingetragenen Betrag', () => {
  assert.equal(evaluate({ blossoms: 6, entry: { freeSpend: 4 } }).spent, 4);
});

test('Alle Ausgaben zusammen dürfen das Budget nicht übersteigen; ein Rest verfällt', () => {
  const r = evaluate({ blossoms: 10, entry: { stars: 8, freeSpend: 5 } });
  assert.match(r.errors.join('\n'), /Budget/);
  assert.equal(r.starCrosses, 0);
  const ok = evaluate({ blossoms: 10, entry: { stars: 3 } });
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.budget - ok.spent, 7);
});

test('Ohne gesammelte Blüten kann nichts ausgegeben werden', () => {
  assert.match(evaluate({ blossoms: 0, entry: { stars: 1 } }).errors.join('\n'), /Budget/);
});

// ---- *-Karten: einsetzen, verbraucht, umdrehen ----

const state = (unlockGames, history, gameNumber) => starCardState({ unlockGames, history, gameNumber });

test('*-Karte: einsetzbar ab der Partie nach der Freischaltung', () => {
  assert.ok(state({ geschenk: 2 }, [], 3).activatable.has('geschenk'));
  assert.ok(!state({ geschenk: 2 }, [], 2).activatable.has('geschenk'));
  assert.ok(!state({}, [], 3).activatable.has('geschenk'));
});

test('*-Karte: in Partie N eingesetzt ist sie verbraucht und erst ab Partie N+1 umdrehbar', () => {
  const history = [{ gameNumber: 3, activated: ['geschenk'], flips: [] }];
  assert.ok(!state({ geschenk: 2 }, history, 4).activatable.has('geschenk'));
  assert.ok(state({ geschenk: 2 }, history, 4).flippable.has('geschenk'));
  assert.ok(!state({ geschenk: 2 }, history, 3).flippable.has('geschenk'));
});

test('*-Karte: nach dem Umdrehen in Partie M ist sie ab M+1 wieder einsetzbar', () => {
  const history = [
    { gameNumber: 3, activated: ['geschenk'], flips: [] },
    { gameNumber: 5, activated: [], flips: ['geschenk'] },
  ];
  assert.ok(!state({ geschenk: 2 }, history, 5).activatable.has('geschenk'));
  assert.ok(state({ geschenk: 2 }, history, 6).activatable.has('geschenk'));
  assert.ok(!state({ geschenk: 2 }, history, 6).flippable.has('geschenk'));
});

test('*-Karte: nicht eingesetzte Karten sind nicht umdrehbar; die Regel gilt für Geschenk, Reiskuchen und Umtrunk', () => {
  const s = state({ geschenk: 1, reiskuchen: 1, umtrunk: 1, kontor: 1 }, [], 4);
  assert.deepEqual([...s.activatable].sort(), ['geschenk', 'reiskuchen', 'umtrunk']);
  assert.equal(s.flippable.size, 0);
});
