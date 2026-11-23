// Pfadlogik des Fortschrittsbaums (Basisspiel).
// Regeln: docs/app-anforderungen.md "Wegelogik", docs/fortschrittsbaum.md, docs/entscheidungen.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { walkTree } from '../src/core/progressTree.js';

// Kreis-ids: "<Abschnitt>#<Nummer>", Abschnitt "<von>-<nach>", Nummer ab dem ersten Endpunkt gezählt.
const games = (...crosses) => crosses.map((n, i) => ({ gameNumber: i + 1, crosses: n }));
const go = (at, toward) => ({ at, toward });
const walk = (g, decisions = []) => walkTree({ games: g, decisions });
const towards = (pending) => pending.options.map((o) => o.toward).sort();

// Benedikts Beispielroute (app-anforderungen.md): Wanderer → Schachtel 1 → Schachtel 2 → Lagerhaus →
// Getreidetunnel → Dorftunnel → Waldtunnel → Wolke → Hügel → Schäferin → Bahnwärter → Zirkus →
// Damhirsch → Burg → Bauernhof → Wolke. 113 Kreuze; Schachtel 2–Zirkus und Lagerhaus–Bahnwärter bleiben frei.
const ROUTE_BENEDIKT = [
  go('box2', 'lagerhaus'), go('lagerhaus', 'getreidetunnel'), go('wolke', 'huegel'),
  go('bahnwaerter', 'zirkus'), go('zirkus', 'damhirsch'),
];
// Gegenrichtung: Zirkus → Damhirsch → Burg → Bauernhof → Wolke → Waldtunnel → Dorftunnel →
// Getreidetunnel → Lagerhaus → Bahnwärter → Schäferin → Hügel → Wolke. Ebenfalls 113 Kreuze.
const ROUTE_REVERSED = [
  go('box2', 'zirkus'), go('zirkus', 'damhirsch'), go('wolke', 'waldtunnel'),
  go('lagerhaus', 'bahnwaerter'), go('bahnwaerter', 'schaeferin'),
];

test('Beispiel der Anleitung: Spiel 1 (4 Kreuze) öffnet Schachtel 1, Spiel 2 (5) Schachtel 2, dann 2 Kreise Richtung Lagerhaus', () => {
  const r = walk(games(4, 5), [go('box2', 'lagerhaus')]);
  assert.equal(r.reached.get('box1'), 1);
  assert.equal(r.reached.get('box2'), 2);
  assert.equal(r.reached.has('lagerhaus'), false);
  assert.equal(r.crossed.size, 9);
  assert.equal(r.crossed.get('box2-lagerhaus#1'), 2);
  assert.equal(r.crossed.get('box2-lagerhaus#2'), 2);
  assert.equal(r.crossed.has('box2-lagerhaus#3'), false);
  assert.equal(r.pending, null);
  assert.deepEqual(r.position, { section: 'box2-lagerhaus', next: 3, toward: 'lagerhaus' });
});

test('Vor der ersten Partie steht der Pfad beim Wanderer', () => {
  const r = walk([]);
  assert.equal(r.crossed.size, 0);
  assert.equal(r.reached.size, 0);
  assert.deepEqual(r.position, { node: 'start', via: null });
});

test('Sechsecke kosten keinen Kreis und gelten als erreicht, sobald ein Nachbarkreis ausgekreuzt ist', () => {
  const r = walk(games(2));
  assert.equal(r.crossed.size, 2);
  assert.equal(r.reached.get('box1'), 1);
  assert.equal(r.reached.has('box2'), false);
});

test('Das Sechseck ist erreicht, der Kreis dahinter muss nicht ausgekreuzt werden', () => {
  const r = walk(games(7));
  assert.equal(r.crossed.size, 7);
  assert.equal(r.reached.get('box2'), 1);
  assert.equal(r.crossed.has('box2-lagerhaus#1'), false);
  assert.equal(r.crossed.has('box2-zirkus#1'), false);
  assert.deepEqual(r.position, { node: 'box2', via: 'box1-box2' });
});

test('Sechsecke mit nur einem Ausgang werden automatisch durchlaufen', () => {
  const r = walk(games(3));
  assert.equal(r.crossed.get('box1-box2#1'), 1);
  assert.equal(r.pending, null);
});

test('Gabelung ohne Entscheidung: die App fragt und kreuzt nichts, die Kreuze bleiben offen', () => {
  const r = walk(games(8));
  assert.equal(r.crossed.size, 7);
  assert.equal(r.expired, 0);
  assert.equal(r.pending.kind, 'fork');
  assert.equal(r.pending.gameNumber, 1);
  assert.equal(r.pending.at, 'box2');
  assert.equal(r.pending.remaining, 1);
  assert.deepEqual(towards(r.pending), ['lagerhaus', 'zirkus']);
});

test('Enden die Kreuze genau an der Gabelung, wird erst in der nächsten Partie gefragt', () => {
  assert.equal(walk(games(7)).pending, null);
  const r = walk(games(7, 1));
  assert.equal(r.pending.kind, 'fork');
  assert.equal(r.pending.gameNumber, 2);
});

test('Am nächsten Sechseck mit mehreren Ausgängen wird erneut gewählt, der Rückweg ist keine Option', () => {
  const r = walk(games(12), [go('box2', 'lagerhaus')]);
  assert.equal(r.reached.get('lagerhaus'), 1);
  assert.equal(r.crossed.size, 11);
  assert.equal(r.pending.at, 'lagerhaus');
  assert.deepEqual(towards(r.pending), ['bahnwaerter', 'getreidetunnel']);
});

test('Gabelung: beide Zweige sind wählbar', () => {
  const left = walk(games(11), [go('box2', 'lagerhaus')]);
  assert.equal(left.crossed.get('box2-lagerhaus#4'), 1);
  assert.equal(left.crossed.has('box2-zirkus#1'), false);
  assert.equal(left.reached.has('lagerhaus'), true);

  const right = walk(games(11), [go('box2', 'zirkus')]);
  assert.equal(right.crossed.get('box2-zirkus#4'), 1);
  assert.equal(right.crossed.has('box2-lagerhaus#1'), false);
  assert.equal(right.reached.has('zirkus'), true);
});

test('Die Kreuze mehrerer Partien addieren sich', () => {
  const split = walk(games(2, 2));
  const once = walk(games(4));
  assert.deepEqual([...split.crossed.keys()].sort(), [...once.crossed.keys()].sort());
  assert.equal(split.crossed.get('start-box1#1'), 1);
  assert.equal(split.crossed.get('box1-box2#1'), 2);
});

test('Ausgekreuzte Felder kosten nichts und werden nicht doppelt ausgekreuzt (Rundtour)', () => {
  // Schachtel 2 → Lagerhaus → Bahnwärter → Zirkus → Schachtel 2 → Lagerhaus (4 Kreise ohne Kosten) → Getreidetunnel
  const decisions = [
    go('box2', 'lagerhaus'), go('lagerhaus', 'bahnwaerter'), go('bahnwaerter', 'zirkus'),
    go('zirkus', 'box2'), go('box2', 'lagerhaus'), go('lagerhaus', 'getreidetunnel'),
  ];
  const r = walk(games(30), decisions);
  // 7 + 4 + 6 + 6 + 4 = 27 Kreuze für die Runde, dann 3 neue Kreise; die 4 Kreise Schachtel 2–Lagerhaus kosten nicht erneut.
  assert.equal(r.crossed.size, 30);
  assert.equal(r.crossed.get('lagerhaus-getreidetunnel#3'), 1);
  assert.equal(r.crossed.has('lagerhaus-getreidetunnel#4'), false);
  assert.equal(r.pending, null);
  assert.deepEqual(r.position, { section: 'lagerhaus-getreidetunnel', next: 4, toward: 'getreidetunnel' });
});

test('Der Pfad endet nicht an der Wolke: dort wird weitergewählt (kein Rückweg)', () => {
  const r = walk(games(46), ROUTE_BENEDIKT.slice(0, 2));
  assert.equal(r.reached.get('wolke'), 1);
  assert.equal(r.crossed.size, 45);
  assert.equal(r.pending.kind, 'fork');
  assert.equal(r.pending.at, 'wolke');
  assert.deepEqual(towards(r.pending), ['bauernhof', 'huegel']);
});

test('Benedikts Beispielroute: alles freigespielt, übersprungene Abschnitte bleiben unausgekreuzt', () => {
  const r = walk(games(113), ROUTE_BENEDIKT);
  assert.equal(r.reached.size, 14);
  assert.equal(r.allUnlocked, true);
  assert.equal(r.allCrossed, false);
  assert.equal(r.crossed.size, 113);
  assert.equal(r.pending, null);
  assert.equal(r.expired, 0);
  for (const id of r.crossed.keys()) {
    assert.ok(!id.startsWith('box2-zirkus#') && !id.startsWith('lagerhaus-bahnwaerter#'), `${id} wurde ausgekreuzt`);
  }
  assert.deepEqual(r.position, { node: 'wolke', via: 'bauernhof-wolke' });
});

test('Gegenrichtung: ebenfalls alles freigespielt, andere Abschnitte bleiben frei', () => {
  const r = walk(games(113), ROUTE_REVERSED);
  assert.equal(r.reached.size, 14);
  assert.equal(r.allUnlocked, true);
  assert.equal(r.crossed.size, 113);
  for (const id of r.crossed.keys()) {
    assert.ok(!id.startsWith('box2-lagerhaus#') && !id.startsWith('zirkus-bahnwaerter#'), `${id} wurde ausgekreuzt`);
  }
});

test('Herz-Kreis: der vierte Kreis ab Getreidetunnel schaltet ein Herz in dieser Partie frei', () => {
  const route = ROUTE_BENEDIKT.slice(0, 2);
  assert.deepEqual(walk(games(20), route).heartGames, []);
  const r = walk(games(21), route);
  assert.equal(r.crossed.get('getreidetunnel-dorftunnel#4'), 1);
  assert.deepEqual(r.heartGames, [1]);
});

test('Wer alle Sechsecke erreicht und den Pfad zu Ende läuft, hat alle 3 Herz-Kreise ausgekreuzt (jede Route)', () => {
  assert.equal(walk(games(113), ROUTE_BENEDIKT).heartGames.length, 3);
  assert.equal(walk(games(113), ROUTE_REVERSED).heartGames.length, 3);
});

test('Herzen tragen die Spielnummer, in der der Kreis ausgekreuzt wurde', () => {
  const r = walk(games(21, 20, 72), ROUTE_BENEDIKT);
  assert.deepEqual(r.heartGames.slice().sort((a, b) => a - b), [1, 3, 3]);
});

test('Restliche Felder: ist alles freigespielt und kein freier Kreis in Laufrichtung, wählt der Spieler einen freien Abschnitt', () => {
  const r = walk(games(114), ROUTE_BENEDIKT);
  assert.equal(r.crossed.size, 113);
  assert.equal(r.pending.kind, 'leftover');
  assert.equal(r.pending.remaining, 1);
  const options = r.pending.options.map((o) => `${o.at}>${o.toward}`).sort();
  assert.deepEqual(options, ['bahnwaerter>lagerhaus', 'box2>zirkus', 'lagerhaus>bahnwaerter', 'zirkus>box2']);
});

test('Restliche Felder kosten 1 Kreuz pro Kreis und schalten nichts mehr frei', () => {
  const before = walk(games(113), ROUTE_BENEDIKT);
  const r = walk(games(114), [...ROUTE_BENEDIKT, go('box2', 'zirkus')]);
  assert.equal(r.crossed.size, 114);
  assert.equal(r.crossed.get('box2-zirkus#1'), 1);
  assert.equal(r.pending, null);
  assert.deepEqual([...r.reached], [...before.reached]);
});

test('Restliche Felder sind optional: der Spieler lässt die Kreuze verfallen', () => {
  const r = walk(games(114), [...ROUTE_BENEDIKT, { skip: true }]);
  assert.equal(r.crossed.size, 113);
  assert.equal(r.expired, 1);
  assert.equal(r.pending, null);
});

test('Sind alle 123 Kreise ausgekreuzt, verfallen übrige Kreuze ohne Frage', () => {
  const decisions = [...ROUTE_BENEDIKT, go('box2', 'zirkus'), go('lagerhaus', 'bahnwaerter')];
  const r = walk(games(113, 10, 5), decisions);
  assert.equal(r.crossed.size, 123);
  assert.equal(r.allCrossed, true);
  assert.equal(r.expired, 5);
  assert.equal(r.pending, null);
});

test('Ungültige Entscheidung: die App rät nicht, sondern fragt erneut und merkt sich die abgelehnte', () => {
  const wrongExit = walk(games(8), [go('box2', 'getreidetunnel')]);
  assert.equal(wrongExit.crossed.size, 7);
  assert.equal(wrongExit.pending.kind, 'fork');
  assert.deepEqual(wrongExit.pending.rejected, go('box2', 'getreidetunnel'));

  const wrongNode = walk(games(8), [go('zirkus', 'box2')]);
  assert.equal(wrongNode.pending.kind, 'fork');
  assert.deepEqual(wrongNode.pending.rejected, go('zirkus', 'box2'));

  const skipAtFork = walk(games(8), [{ skip: true }]);
  assert.equal(skipAtFork.pending.kind, 'fork');
  assert.equal(skipAtFork.expired, 0);
});

test('Solange eine Entscheidung fehlt, werden spätere Partien nicht ausgewertet', () => {
  const r = walk(games(8, 5));
  assert.equal(r.crossed.size, 7);
  assert.equal(r.reached.has('lagerhaus'), false);
});

test('Gleiche Rohdaten ergeben immer dasselbe Ergebnis', () => {
  const a = walk(games(21, 20, 72), ROUTE_BENEDIKT);
  const b = walk(games(21, 20, 72), ROUTE_BENEDIKT);
  assert.deepEqual([...a.crossed], [...b.crossed]);
  assert.deepEqual([...a.reached], [...b.reached]);
  assert.deepEqual(a.position, b.position);
  assert.deepEqual(a.heartGames, b.heartGames);
});
