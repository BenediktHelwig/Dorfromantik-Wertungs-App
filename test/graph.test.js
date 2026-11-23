// Graph des Fortschrittsbaums (Basisspiel). Quelle: docs/fortschrittsbaum.md, Wertungsblock-Diagramm.drawio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASIS_GRAPH as g, circleIds } from '../src/core/progressTree.js';

const ACHIEVEMENT_HEXAGONS = [
  'bahnwaerter', 'bauernhof', 'burg', 'damhirsch', 'dorftunnel', 'getreidetunnel',
  'huegel', 'lagerhaus', 'schaeferin', 'waldtunnel', 'wolke', 'zirkus',
];
const pair = (a, b) => [a, b].sort().join('+');

test('14 Sechsecke: Öffnet Schachtel 1, Öffnet Schachtel 2 und 12 Erfolgskarten', () => {
  assert.equal(g.hexagons.length, 14);
  const boxes = g.hexagons.filter((h) => h.kind === 'box').map((h) => h.box).sort();
  assert.deepEqual(boxes, [1, 2]);
  const cards = g.hexagons.filter((h) => h.kind === 'achievement').map((h) => h.id).sort();
  assert.deepEqual(cards, ACHIEVEMENT_HEXAGONS);
});

test('123 Kreise mit eindeutigen ids', () => {
  const ids = circleIds(g);
  assert.equal(ids.length, 123);
  assert.equal(new Set(ids).size, 123);
});

test('Strecken: Anzahl Kreise zwischen den Endpunkten laut fortschrittsbaum.md', () => {
  const expected = {
    [pair('start', 'box1')]: 2,
    [pair('box1', 'box2')]: 5,
    [pair('box2', 'lagerhaus')]: 4,
    [pair('box2', 'zirkus')]: 4,
    [pair('lagerhaus', 'getreidetunnel')]: 6,
    [pair('lagerhaus', 'bahnwaerter')]: 6,
    [pair('zirkus', 'bahnwaerter')]: 6,
    [pair('zirkus', 'damhirsch')]: 6,
    [pair('getreidetunnel', 'dorftunnel')]: 8,
    [pair('bahnwaerter', 'schaeferin')]: 8,
    [pair('damhirsch', 'burg')]: 8,
    [pair('dorftunnel', 'waldtunnel')]: 10,
    [pair('schaeferin', 'huegel')]: 10,
    [pair('burg', 'bauernhof')]: 10,
    [pair('waldtunnel', 'wolke')]: 10,
    [pair('huegel', 'wolke')]: 10,
    [pair('bauernhof', 'wolke')]: 10,
  };
  const actual = Object.fromEntries(g.sections.map((s) => [pair(s.from, s.to), s.circles]));
  assert.deepEqual(actual, expected);
});

test('Anschlüsse: Schachtel 2, Lagerhaus, Zirkus, Bahnwärter und Wolke haben 3, Start 1, alle anderen 2', () => {
  const degree = new Map();
  for (const s of g.sections) {
    for (const node of [s.from, s.to]) degree.set(node, (degree.get(node) ?? 0) + 1);
  }
  const three = ['box2', 'lagerhaus', 'zirkus', 'bahnwaerter', 'wolke'];
  for (const [node, d] of degree) {
    const want = node === 'start' ? 1 : three.includes(node) ? 3 : 2;
    assert.equal(d, want, `${node} hat ${d} Anschlüsse`);
  }
  assert.equal(degree.size, 15);
});

test('der Graph ist zusammenhängend, Start ist der Wanderer', () => {
  assert.equal(g.start.id, 'start');
  const seen = new Set(['start']);
  const queue = ['start'];
  while (queue.length) {
    const node = queue.shift();
    for (const s of g.sections) {
      for (const [a, b] of [[s.from, s.to], [s.to, s.from]]) {
        if (a === node && !seen.has(b)) { seen.add(b); queue.push(b); }
      }
    }
  }
  assert.equal(seen.size, 15);
});

test('3 Herz-Kreise, je der vierte Kreis ab Getreidetunnel, Bahnwärter und Damhirsch (3 davor, 4 danach)', () => {
  const hearts = g.sections.filter((s) => s.heart !== undefined);
  assert.deepEqual(hearts.map((s) => s.from).sort(), ['bahnwaerter', 'damhirsch', 'getreidetunnel']);
  for (const s of hearts) {
    assert.equal(s.circles, 8);
    assert.equal(s.heart, 4);
  }
});
