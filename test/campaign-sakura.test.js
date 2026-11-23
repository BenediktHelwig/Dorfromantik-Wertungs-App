// Kampagnenblatt Sakura aus Rohdaten: docs/freischaltregeln-sakura.md, docs/fortschrittsbaum-sakura.md,
// docs/entscheidungen.md (Schritt 3). Alles wird aus Wertungsblättern, Entscheidungen, Blüten-Einträgen und
// manuellen Erfüllungen neu berechnet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSakuraSheet } from '../src/core/sakura/scoresheet.js';
import { COLLECTORS } from '../src/core/sakura/achievements.js';
import { computeSakuraCampaign } from '../src/core/sakura/campaign.js';
import { optionFor } from './helpers/sakura.js';

const PLAYERS = 'Anna, Ben';

function sheet(gameNumber, points = 0, fn = () => {}) {
  const s = createSakuraSheet({ gameNumber, date: `2026-11-${10 + gameNumber}` });
  s.players = PLAYERS;
  s.orders.kirschbaum = points;
  fn(s);
  return s;
}

const raw = (sheets, extra = {}) => ({ sheets, decisions: [], collector: null, gameEnds: {}, manualUnlocks: {}, ...extra });

/** Beantwortet die offenen Baum-Fragen der Reihe nach mit den benannten Zielen. */
function decide(data, ...names) {
  let current = data;
  for (const name of names) {
    const { pending } = computeSakuraCampaign(current);
    assert.ok(pending && pending.options, `Frage erwartet vor „${name}“`);
    current = { ...current, decisions: [...current.decisions, { ...optionFor(pending.options, name), track: pending.track }] };
  }
  return current;
}

const gamesOf = (computed, track) => [...computed.trees[track].crossed.values()];

/** Spiel 1: 15 Kreuze bis Öffnet Box 3 über den See-Zweig (Box 1 im 2., Box 2 im 6., See im 10. Feld). */
const boxThree = (more = []) => decide(raw([sheet(1, 410), ...more]), 'See');

test('Eure Ergebnisse: Zeilen und Kreuze nach der Highscoreliste Sakura', () => {
  const c = computeSakuraCampaign(raw([sheet(1, 410), sheet(2, 128)]));
  assert.equal(c.rows.length, 41);
  assert.deepEqual(c.rows.find((r) => r.min === 410).gameNumbers, [1]);
  assert.deepEqual(c.rows.find((r) => r.min === 120).gameNumbers, [2]);
  assert.equal(c.totalCrosses, 17);
  assert.equal(c.nextGameNumber, 3);
});

test('Box 1, 2 und 3 öffnen sich über den Kreispfad; die Freischaltungen gelten ab der Folgepartie', () => {
  const c = computeSakuraCampaign(boxThree([sheet(2, 100)]));
  assert.deepEqual(c.boxGames, { 1: 1, 2: 1, 3: 1 });
  assert.equal(c.unlockGames.rundumauftraege, 1);
  assert.equal(c.unlockGames.kirschblueten, 1);
  assert.equal(c.sheets[0].columns.rundum, false, 'Spiel 1 selbst noch nicht');
  assert.equal(c.sheets[1].columns.rundum, true);
  assert.equal(c.sheets[1].columns.sieben, false);
  assert.equal(c.sheets[0].bonuses.kirschblueten.unlocked, false);
  assert.equal(c.sheets[1].bonuses.kirschblueten.unlocked, true);
});

test('Die Freischaltung eines Blattes wird immer neu berechnet, nicht aus dem gespeicherten Blatt gelesen', () => {
  const forged = createSakuraSheet({ gameNumber: 2, date: '2026-11-12', unlockedBonusIds: ['kirschblueten'], unlockedColumns: ['rundum', 'sieben'] });
  forged.players = PLAYERS;
  const c = computeSakuraCampaign(raw([sheet(1, 200), forged]));
  assert.equal(c.sheets[1].bonuses.kirschblueten.unlocked, false, 'Box 3 ist noch nicht erreicht');
  assert.equal(c.sheets[1].columns.rundum, true, 'Box 1 ist erreicht');
  assert.equal(c.sheets[1].columns.sieben, false);
});

test('Felder des Kreispfads schalten ihre Karte frei: Pfad-N (See) mit Spielnummer, Wirkung ab der Folgepartie', () => {
  const c = computeSakuraCampaign(boxThree());
  assert.equal(c.unlockGames.see, 1);
  assert.equal(c.unlockGames.strassenkreuzung, undefined);
  assert.ok(c.received.has('see'));
  assert.ok(!c.received.has('strassenkreuzung'));
});

test('Die Boxen geben ihre Karten: Box 1 Lagerhaus, Box 2 Sackgasse und Staudamm, Box 3 Meisterprüfung', () => {
  const c = computeSakuraCampaign(boxThree());
  for (const id of ['rundumauftraege', 'lagerhaus', 'sackgasse', 'staudamm', 'kirschblueten', 'meisterpruefung']) {
    assert.ok(c.received.has(id), id);
  }
  assert.ok(!c.received.has('dekretDesKaisers'));
});

test('Ohne Box 3 gibt es keine Frage nach dem Blütensammler', () => {
  assert.equal(computeSakuraCampaign(raw([sheet(1, 200)])).pending, null);
});

test('Blütensammler: mit Öffnet Box 3 steht die Wahl offen, danach ist die gewählte Karte erhalten', () => {
  const asked = computeSakuraCampaign(boxThree());
  assert.equal(asked.pending.kind, 'collector');
  assert.deepEqual([...asked.pending.options].sort(), [...COLLECTORS].sort());
  const chosen = computeSakuraCampaign({ ...boxThree(), collector: 'gourmet' });
  assert.equal(chosen.pending, null);
  assert.ok(chosen.received.has('gourmet'));
  assert.ok(!chosen.received.has('pilger'));
});

test('Lagerhaus: wird am Partieende automatisch erfüllt, wenn die Zelle Rundum ≥18 hat', () => {
  const data = { ...boxThree([sheet(2, 0, (s) => { s.orders.rundum = 18; })]), collector: 'gourmet' };
  assert.equal(computeSakuraCampaign(data).unlockGames.lagerhaus, 2);
  const short = { ...boxThree([sheet(2, 0, (s) => { s.orders.rundum = 17; })]), collector: 'gourmet' };
  assert.equal(computeSakuraCampaign(short).unlockGames.lagerhaus, undefined);
});

test('Meisterprüfung: Gesamtsumme ≥250 und bestätigt (10 Blüten) erfüllt sie und öffnet Box 5', () => {
  const second = sheet(2, 240, (s) => { s.bonuses.kirschblueten.points = 10; });
  const data = { ...boxThree([second]), collector: 'gourmet', gameEnds: { 2: { confirmed: ['meisterpruefung'] } } };
  const c = computeSakuraCampaign(data);
  assert.equal(c.gameEndResults[2].spent, 10);
  assert.deepEqual(c.gameEndResults[2].errors, []);
  assert.equal(c.unlockGames.meisterpruefung, 2);
  assert.equal(c.boxGames[5], 2);
  for (const id of ['dekretDesKaisers', 'dorfUndReis', 'kirschbaumUndDorf', 'reisUndKirschbaum']) assert.ok(c.received.has(id), id);
  assert.ok(!c.received.has('daimyo'));
  const unconfirmed = computeSakuraCampaign({ ...data, gameEnds: {} });
  assert.equal(unconfirmed.unlockGames.meisterpruefung, undefined);
  assert.equal(unconfirmed.boxGames[5], undefined);
});

test('Heiße Quellen geben Badende Affen; ist die Karte manuell erfüllt, öffnet sich Box 6', () => {
  const games = [sheet(1, 500), sheet(2, 500), sheet(3, 100)];
  const data = {
    ...decide(raw(games), 'See', 'Brücken'), collector: 'gourmet', manualUnlocks: { badendeAffen: 3, sackgasse: 2 },
  };
  const c = computeSakuraCampaign(data);
  assert.equal(c.unlockGames.heisseQuellen, 2);
  assert.equal(c.unlockGames.badendeAffen, 3);
  assert.equal(c.unlockGames.sackgasse, 2);
  assert.equal(c.boxGames[6], 3);
  assert.equal(c.nextGameNumber, 4);
  for (const id of ['bunteFahne', 'daimyo', 'kleineWolken', 'ochsenkarrenHandelsposten', 'poet', 'schiffAnlegestelle']) {
    assert.ok(c.received.has(id), id);
  }
});

test('Eine manuelle Erfüllung zählt erst ab der Partie nach Erhalt der Karte', () => {
  const games = [sheet(1, 500), sheet(2, 500), sheet(3, 100)];
  const data = { ...decide(raw(games), 'See', 'Brücken'), collector: 'gourmet', manualUnlocks: { badendeAffen: 2 } };
  const c = computeSakuraCampaign(data);
  assert.equal(c.unlockGames.badendeAffen, undefined);
  assert.equal(c.boxGames[6], undefined);
});

test('Kalligraph: 1 freies Feld und je 10 Blüten 1 weiteres, alles auf dem Kreispfad (20 Blüten = 3 Kreuze)', () => {
  const games = [sheet(1, 500), sheet(2, 500), sheet(3, 500), sheet(4, 80, (s) => { s.bonuses.kirschblueten.points = 20; })];
  const base = { ...decide(raw(games), 'See', 'Brücken'), collector: 'gourmet' };
  const plain = computeSakuraCampaign(base);
  assert.equal(plain.unlockGames.kalligraph, 3);
  assert.equal(gamesOf(plain, 'path').filter((g) => g === 4).length, 1);
  const data = { ...base, gameEnds: { 4: { kalligraph: { surrounded: true, extra: true, paid: 2 } } } };
  const c = computeSakuraCampaign(data);
  assert.deepEqual(c.gameEndResults[4].errors, []);
  assert.equal(c.gameEndResults[4].spent, 20);
  assert.equal(gamesOf(c, 'path').filter((g) => g === 4).length, 4);
  assert.equal(gamesOf(c, 'star').length, 0, 'keine Blütenfelder');
});

test('Kalligraph: in der Partie der Freischaltung selbst gibt es das Zusatzfeld noch nicht (Wirkung ab N+1)', () => {
  const games = [sheet(1, 500), sheet(2, 500), sheet(3, 500)];
  const data = {
    ...decide(raw(games), 'See', 'Brücken'), collector: 'gourmet',
    gameEnds: { 3: { kalligraph: { surrounded: true, extra: true } } },
  };
  const c = computeSakuraCampaign(data);
  assert.match(c.gameEndResults[3].errors.join('\n'), /Kalligraph/);
  assert.equal(gamesOf(c, 'path').filter((g) => g === 3).length, 16);
});

test('Blütenpfad: 1 Blüte je Stern, die Kreuze setzt die App automatisch', () => {
  const second = sheet(2, 40, (s) => { s.bonuses.kirschblueten.points = 10; });
  const data = { ...boxThree([second]), collector: 'gourmet', gameEnds: { 2: { stars: 5 } } };
  const c = computeSakuraCampaign(data);
  assert.equal(c.gameEndResults[2].spent, 5);
  assert.equal(c.trees.star.crossed.size, 5);
  assert.deepEqual(gamesOf(c, 'star'), [2, 2, 2, 2, 2]);
});

test('Blütenpfad: mehr Sterne als Budget sind ungültig und werden nicht gesetzt', () => {
  const second = sheet(2, 40, (s) => { s.bonuses.kirschblueten.points = 4; });
  const data = { ...boxThree([second]), collector: 'gourmet', gameEnds: { 2: { stars: 5 } } };
  const c = computeSakuraCampaign(data);
  assert.match(c.gameEndResults[2].errors.join('\n'), /Budget/);
  assert.equal(c.trees.star.crossed.size, 0);
});

test('Blütenpfad: an der Moossammlerin fragt die App nach dem Zweig', () => {
  const second = sheet(2, 0, (s) => { s.bonuses.kirschblueten.points = 50; });
  const data = { ...boxThree([second]), collector: 'gourmet', gameEnds: { 2: { stars: 18 } } };
  const c = computeSakuraCampaign(data);
  assert.equal(c.pending.kind, 'fork');
  assert.equal(c.pending.track, 'star');
  assert.equal(c.pending.at, 'Moossammlerin');
});

test('Stern 30: 30 Blüten auf einmal, aber erst wenn der Blütenpfad bis davor ausgekreuzt ist', () => {
  const tooEarly = sheet(2, 0, (s) => { s.bonuses.kirschblueten.points = 50; });
  const early = computeSakuraCampaign({ ...boxThree([tooEarly]), collector: 'gourmet', gameEnds: { 2: { bigStar: true } } });
  assert.match(early.gameEndResults[2].errors.join('\n'), /Stern 30/);
  assert.equal(early.bigStarGame, null);

  const games = [sheet(2, 0, (s) => { s.bonuses.kirschblueten.points = 50; }), sheet(3, 0, (s) => { s.bonuses.kirschblueten.points = 42; })];
  const data = {
    ...boxThree(games), collector: 'gourmet',
    gameEnds: { 2: { stars: 50 }, 3: { stars: 12, bigStar: true } },
  };
  const c = computeSakuraCampaign(decide(data, 'Reisbäuerin'));
  assert.equal(c.trees.star.ended, true);
  assert.equal(c.trees.star.crossed.size, 62);
  assert.deepEqual(c.gameEndResults[3].errors, []);
  assert.equal(c.gameEndResults[3].spent, 42);
  assert.equal(c.bigStarGame, 3);
});

test('Felder des Blütenpfads (Pfad-K) schalten ihre Karte frei', () => {
  const second = sheet(2, 0, (s) => { s.bonuses.kirschblueten.points = 50; });
  const data = { ...boxThree([second]), collector: 'gourmet', gameEnds: { 2: { stars: 17 } } };
  const c = computeSakuraCampaign(data);
  assert.equal(c.unlockGames.teemeisterin, 2);
  assert.equal(c.unlockGames.moossammlerin, 2);
  assert.equal(c.unlockGames.geschenk, undefined);
});

test('Alles wird allein aus den Rohdaten berechnet: gleiches Ergebnis, Eingabe bleibt unverändert', () => {
  const data = { ...boxThree([sheet(2, 128)]), collector: 'gourmet' };
  const frozen = structuredClone(data);
  const a = computeSakuraCampaign(data);
  const b = computeSakuraCampaign(structuredClone(data));
  assert.deepEqual(a.rows, b.rows);
  assert.deepEqual(a.unlockGames, b.unlockGames);
  assert.deepEqual(data, frozen);
});
