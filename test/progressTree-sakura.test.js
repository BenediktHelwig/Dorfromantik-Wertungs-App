// Pfadlogik Sakura: docs/fortschrittsbaum-sakura.md, docs/entscheidungen.md (Schritt 3, Punkte 6–8).
// Meist mit einem kleinen Probegraphen, damit jede Regel einzeln prüfbar ist; am Ende der echte Graph.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAKURA_GRAPH, walkTrack } from '../src/core/sakura/progressTree.js';
import { optionFor } from './helpers/sakura.js';

/**
 * S – a – F ⟨x1..xN | y1..yM⟩ J – z – E(nd). Felder: a, F, x*, y*, J, z (S und E sind es nicht).
 * Die beiden Zweige müssen gleich lang sein (x = y), wie im echten Graphen; die Laufrichtung ergibt sich
 * aus dem Abstand von der Wurzel.
 */
function probe({ x = 2, y = 2 } = {}) {
  const nodes = [
    { id: 'S', type: 'start' }, { id: 'a', type: 'circle' }, { id: 'F', type: 'hex' },
    { id: 'J', type: 'hex' }, { id: 'z', type: 'circle' }, { id: 'E', type: 'bigstar' },
  ];
  const edges = [];
  const link = (a, b) => edges.push({ a, b, track: 'path' });
  const chain = (from, prefix, n, to) => {
    let prev = from;
    for (let i = 1; i <= n; i += 1) {
      nodes.push({ id: `${prefix}${i}`, type: 'circle' });
      link(prev, `${prefix}${i}`);
      prev = `${prefix}${i}`;
    }
    link(prev, to);
  };
  link('S', 'a');
  link('a', 'F');
  chain('F', 'x', x, 'J');
  chain('F', 'y', y, 'J');
  link('J', 'z');
  link('z', 'E');
  return { nodes, edges };
}

/**
 * Zwei Gabelungen hintereinander: S – a – F1 ⟨x1 | y1⟩ J1 – b – F2 ⟨u1 | v1⟩ J2 – z – E.
 * Gewählt wird x1 und u1; y1 und v1 bleiben offen (zwei Restfeld-Zweige).
 */
function twoForks() {
  const nodes = ['S', 'a', 'F1', 'x1', 'y1', 'J1', 'b', 'F2', 'u1', 'v1', 'J2', 'z', 'E']
    .map((id) => ({ id, type: id === 'S' ? 'start' : id === 'E' ? 'bigstar' : 'circle' }));
  const pairs = [['S', 'a'], ['a', 'F1'], ['F1', 'x1'], ['F1', 'y1'], ['x1', 'J1'], ['y1', 'J1'], ['J1', 'b'], ['b', 'F2'],
    ['F2', 'u1'], ['F2', 'v1'], ['u1', 'J2'], ['v1', 'J2'], ['J2', 'z'], ['z', 'E']];
  return { nodes, edges: pairs.map(([a, b]) => ({ a, b, track: 'path' })) };
}
const viaXU = [{ at: 'F1', toward: 'x1' }, { at: 'F2', toward: 'u1' }];

const walk = (graph, games, decisions = [], track = 'path') => walkTrack({ graph, track, games, decisions });
const one = (crosses, gameNumber = 1) => [{ gameNumber, crosses }];
const keys = (r) => [...r.crossed.keys()].sort();
const viaX = [{ at: 'F', toward: 'x1' }];
const real = (crosses, decisions = [], track = 'path') => walk(SAKURA_GRAPH, one(crosses), decisions, track);

test('Jedes Feld kostet 1 Kreuz, auch Sechsecke; ein Feld gilt erst als erreicht, wenn es selbst ausgekreuzt ist', () => {
  const g = probe();
  assert.deepEqual(keys(walk(g, one(1))), ['a']);
  assert.deepEqual(keys(walk(g, one(2))), ['F', 'a']);
});

test('Gabelung: die Frage kommt erst bei Bedarf, nicht wenn die Kreuze genau am Sechseck enden', () => {
  const g = probe();
  const exact = walk(g, one(2));
  assert.equal(exact.pending, null);
  assert.equal(exact.position.node, 'F');
  const more = walk(g, one(3));
  assert.equal(more.pending.kind, 'fork');
  assert.equal(more.pending.at, 'F');
  assert.equal(more.pending.gameNumber, 1);
  assert.equal(more.pending.remaining, 1);
  assert.deepEqual(more.pending.options.map((o) => o.toward).sort(), ['x1', 'y1']);
});

test('Die gewählte Richtung wird beibehalten, die App kreuzt automatisch weiter', () => {
  const r = walk(probe(), one(5), viaX);
  assert.deepEqual(keys(r), ['F', 'J', 'a', 'x1', 'x2']);
  assert.equal(r.pending, null);
});

test('Zusammenführung läuft automatisch weiter; ist der gewählte Weg ausgekreuzt, ist das Pfadende erreicht', () => {
  const r = walk(probe(), one(6), viaX);
  assert.ok(r.crossed.has('z'));
  assert.equal(r.ended, true);
  assert.equal(r.pending, null);
  assert.equal(r.allCrossed, false);
});

test('Das Ende des Pfads ist erst nach dem letzten Feld erreicht', () => {
  assert.equal(walk(probe(), one(5), viaX).ended, false);
});

test('Nach dem Pfadende fragt die App („Restliche Felder“), wenn es mindestens zwei offene Zweige gibt', () => {
  const r = walk(twoForks(), one(10), viaXU);
  assert.equal(r.ended, true);
  assert.equal(r.pending.kind, 'leftover');
  assert.equal(r.pending.remaining, 1);
  assert.deepEqual(r.pending.options.map((o) => o.toward).sort(), ['v1', 'y1']);
});

test('Restliche Felder laufen nur in Laufrichtung: Eingang ist das erste Feld nach der Gabelung, nie von der Zusammenführung her', () => {
  const r = walk(twoForks(), one(10), viaXU);
  assert.deepEqual(r.pending.options.map((o) => [o.at, o.toward]).sort(), [['F1', 'y1'], ['F2', 'v1']]);
  const single = walk(probe(), one(8), viaX); // ein offener Zweig: y1 wird ohne Frage genommen, y2 folgt in Laufrichtung
  assert.ok(single.crossed.has('y1'));
  assert.ok(single.crossed.has('y2'));
  assert.equal(single.crossed.get('y1'), 1);
});

test('Restliche Felder: der Zweig wird in Laufrichtung gefüllt und endet an der Zusammenführung', () => {
  const r = walk(twoForks(), one(10), [...viaXU, { at: 'F2', toward: 'v1' }]);
  assert.ok(r.crossed.has('v1'));
  assert.ok(!r.crossed.has('y1'));
  assert.equal(r.pending, null);
  assert.equal(r.crossed.size, 10);
});

test('Restliche Felder: der gewählte Abschnitt wird gefüllt, ausgekreuzte Felder werden nicht doppelt gekreuzt', () => {
  const r = walk(probe(), one(9), [...viaX, { at: 'F', toward: 'y1' }]);
  assert.equal(r.crossed.size, 8);
  assert.equal(r.allCrossed, true);
  assert.equal(r.crossed.get('y1'), 1);
  assert.equal(r.pending, null);
  assert.equal(r.expired, 1);
});

test('Restliche Felder: bei genau einer freien Möglichkeit geht es ohne Frage weiter', () => {
  const r = walk(probe({ x: 1, y: 1 }), one(6), viaX);
  assert.ok(r.crossed.has('y1'));
  assert.equal(r.pending, null);
});

test('Restliche Felder: es gibt kein „Verfallen lassen“, solange noch ein Feld frei ist', () => {
  const r = walk(twoForks(), one(10), [...viaXU, { skip: true }]);
  assert.equal(r.pending.kind, 'leftover');
  assert.deepEqual(r.pending.rejected, { skip: true });
});

test('Sind alle Felder ausgekreuzt, verfallen übrige Kreuze ohne Frage', () => {
  const r = walk(probe({ x: 1, y: 1 }), one(20), viaX);
  assert.equal(r.crossed.size, 6);
  assert.equal(r.expired, 14);
  assert.equal(r.allCrossed, true);
  assert.equal(r.pending, null);
});

test('Ohne Entscheidung wird nichts geraten: spätere Partien werden erst nach der Antwort ausgewertet', () => {
  const r = walk(probe(), [{ gameNumber: 1, crosses: 3 }, { gameNumber: 2, crosses: 4 }]);
  assert.deepEqual(keys(r), ['F', 'a']);
  assert.equal(r.pending.gameNumber, 1);
});

test('Eine gespeicherte Entscheidung, die nicht zu einer Option passt, kommt als rejected zurück', () => {
  const wrong = { at: 'F', toward: 'z' };
  const r = walk(probe(), one(3), [wrong]);
  assert.equal(r.pending.rejected, wrong);
  assert.equal(r.crossed.size, 2);
});

test('Die Kreuze werden den Partien zugeordnet (Spielnummer je Feld)', () => {
  const r = walk(probe(), [{ gameNumber: 1, crosses: 2 }, { gameNumber: 2, crosses: 2 }], viaX);
  assert.equal(r.crossed.get('a'), 1);
  assert.equal(r.crossed.get('F'), 1);
  assert.equal(r.crossed.get('x1'), 2);
  assert.equal(r.crossed.get('x2'), 2);
});

test('Die Partien werden nach Spielnummer geordnet ausgewertet', () => {
  const r = walk(probe(), [{ gameNumber: 2, crosses: 1 }, { gameNumber: 1, crosses: 1 }]);
  assert.equal(r.crossed.get('a'), 1);
  assert.equal(r.crossed.get('F'), 2);
});

// ---- Echter Graph ----

test('Echter Graph: Öffnet Box 2 ist das 6. Feld; die Frage nach der Zweigwahl kommt erst beim 7. Kreuz', () => {
  const six = real(6);
  assert.ok(six.crossed.has('Box1'));
  assert.ok(six.crossed.has('Box2'));
  assert.equal(six.pending, null);
  const seven = real(7);
  assert.equal(seven.pending.at, 'Box2');
  assert.ok(optionFor(seven.pending.options, 'See'));
  assert.ok(optionFor(seven.pending.options, 'Kreuzung'));
});

test('Echter Graph: der See-Zweig führt über Öffnet Box 3 automatisch zum Tempel', () => {
  const see = optionFor(real(7).pending.options, 'See');
  const r = real(20, [see]);
  assert.ok(r.crossed.has('See'));
  assert.ok(r.crossed.has('Box3'));
  assert.ok(r.crossed.has('Tempel'));
  assert.ok(!r.crossed.has('Kreuzung'));
  assert.equal(r.pending, null);
});

test('Echter Graph: nach Heiße Quellen wählt der Spieler zwischen Brücken und Tore', () => {
  const see = optionFor(real(7).pending.options, 'See');
  const exact = real(26, [see]);
  assert.ok(exact.crossed.has('HeisseQuellen'));
  assert.equal(exact.pending, null);
  const ask = real(27, [see]);
  assert.equal(ask.pending.at, 'HeisseQuellen');
  assert.ok(optionFor(ask.pending.options, 'Brücken'));
  assert.ok(optionFor(ask.pending.options, 'Tore'));
});

test('Echter Graph: Stern 30 wird auf dem Kreispfad nie durch Kreuze gesetzt', () => {
  assert.ok(!real(1000).crossed.has('Blüte30'));
});

test('Blütenpfad: Gabelung an der Moossammlerin, der gewählte Weg endet vor Stern 30', () => {
  const ask = real(18, [], 'star');
  assert.equal(ask.pending.at, 'Moossammlerin');
  const reis = optionFor(ask.pending.options, 'Reisbäuerin');
  const r = real(62, [reis], 'star');
  assert.ok(r.crossed.has('Umtrunk'));
  assert.ok(r.crossed.has('Geschenk'));
  assert.ok(!r.crossed.has('Sumoringer'));
  assert.ok(!r.crossed.has('Blüte30'));
  assert.equal(r.crossed.size, 62);
  assert.equal(r.ended, true);
  assert.equal(r.pending, null);
});

test('Blütenpfad: nach dem Ende gibt es Restliche Felder wie auf dem Kreispfad (Entscheidung 12), danach verfallen Blüten', () => {
  const reis = optionFor(real(18, [], 'star').pending.options, 'Reisbäuerin');
  const more = real(67, [reis], 'star'); // 62 + 5 in den anderen Zweig, nur ein Eingang, daher ohne Frage
  assert.equal(more.crossed.size, 67);
  assert.ok(!more.crossed.has('Sumoringer'));
  assert.equal(more.pending, null);
  assert.ok(real(72, [reis], 'star').crossed.has('Sumoringer'));
  const all = real(97, [reis], 'star');
  assert.equal(all.crossed.size, 94);
  assert.equal(all.allCrossed, true);
  assert.equal(all.expired, 3);
  assert.ok(!all.crossed.has('Blüte30'));
});
