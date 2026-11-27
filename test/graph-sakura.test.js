// Graph Sakura (docs/fortschrittsbaum-sakura.md, src/core/graph-sakura.json): Form der beiden Spuren.
// Kreispfad = Spur "path" (Start → Stern 30), Blütenpfad = Spur "star" (Öffnet Box 3 → Stern 30).
// Hinweis: fortschrittsbaum-sakura.md zählt "123 Felder" – darin stecken 3 Sechsecke und 4 Quadrate des
// Blütenpfads. Auf dem Kreispfad liegen 116 Felder (gemessen am Graphen).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAKURA_GRAPH, trackInfo } from '../src/core/sakura/progressTree.js';
import { firstNamedAfter } from './helpers/sakura.js';

const path = () => trackInfo(SAKURA_GRAPH, 'path');
const star = () => trackInfo(SAKURA_GRAPH, 'star');
const typeOf = (id) => SAKURA_GRAPH.nodes.find((n) => n.id === id).type;

test('Der Graph hat 212 Knoten und 215 Kanten, jeder Kreis und Stern genau 2 Nachbarn', () => {
  assert.equal(SAKURA_GRAPH.nodes.length, 212);
  assert.equal(SAKURA_GRAPH.edges.length, 215);
  const degree = new Map();
  for (const e of SAKURA_GRAPH.edges) for (const id of [e.a, e.b]) degree.set(id, (degree.get(id) ?? 0) + 1);
  for (const n of SAKURA_GRAPH.nodes.filter((x) => x.type === 'circle' || x.type === 'star')) {
    assert.equal(degree.get(n.id), 2, n.id);
  }
});

test('Kreispfad: Wurzel Start, Ende Stern 30, 116 Felder (97 Kreise, 8 Sechsecke, 11 Quadrate)', () => {
  const t = path();
  assert.equal(t.root, 'Start');
  assert.equal(t.end, 'Blüte30');
  assert.equal(t.fields.length, 116);
  assert.ok(!t.fields.includes('Start') && !t.fields.includes('Blüte30'));
  const count = (ty) => t.fields.filter((id) => typeOf(id) === ty).length;
  assert.deepEqual(
    { circle: count('circle'), hex: count('hex'), box: count('box'), card: count('card'), plus: count('plus') },
    { circle: 97, hex: 8, box: 3, card: 4, plus: 4 },
  );
});

test('Blütenpfad: Wurzel Öffnet Box 3, Ende Stern 30, 94 Felder (87 Sterne und 7 benannte Felder)', () => {
  const t = star();
  assert.equal(t.root, 'Box3');
  assert.equal(t.end, 'Blüte30');
  assert.equal(t.fields.length, 94);
  for (const id of ['Teemeisterin', 'Moossammlerin', 'Reisbäuerin', 'Sumoringer', 'Reiskuchen', 'Umtrunk', 'Geschenk']) {
    assert.ok(t.fields.includes(id), id);
  }
});

test('Gabelungen: Kreispfad an Box 2 und Heiße Quellen, Blütenpfad an der Moossammlerin', () => {
  const forks = (t) => [...t.forward].filter(([, next]) => next.length > 1).map(([id]) => id).sort();
  assert.deepEqual(forks(path()), ['Box2', 'HeisseQuellen']);
  assert.deepEqual(forks(star()), ['Moossammlerin']);
  assert.equal(path().forward.get('Start').length, 1);
});

test('Die Zweige jeder Gabelung führen zu den erwarteten Feldern', () => {
  const named = (t, at) => t.forward.get(at).map((to) => firstNamedAfter(at, to)).sort();
  assert.deepEqual(named(path(), 'Box2'), ['Kreuzung', 'See']);
  assert.deepEqual(named(path(), 'HeisseQuellen'), ['Brücken', 'Tore']);
  assert.deepEqual(named(star(), 'Moossammlerin'), ['Reisbäuerin', 'Sumoringer']);
});

test('Die beiden Zweige jeder Gabelung sind gleich lang', () => {
  const branchLength = (t, to) => {
    let count = 0;
    let cur = to;
    // Der Zweig endet am Knoten, in den zwei Wege münden.
    while ([...t.forward.values()].filter((next) => next.includes(cur)).length < 2) {
      count += 1;
      [cur] = t.forward.get(cur);
    }
    return count;
  };
  for (const [t, at] of [[path(), 'Box2'], [path(), 'HeisseQuellen'], [star(), 'Moossammlerin']]) {
    const [a, b] = t.forward.get(at).map((to) => branchLength(t, to));
    assert.equal(a, b, at);
  }
});

test('Öffnet Box 1, 2 und 3 tragen die Schloss-Zahlen 1, 2 und 3', () => {
  const lock = (id) => SAKURA_GRAPH.nodes.find((n) => n.id === id).lock;
  assert.deepEqual(['Box1', 'Box2', 'Box3'].map(lock), [1, 2, 3]);
});
