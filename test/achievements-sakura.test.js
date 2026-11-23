// Erfolgsliste Sakura: docs/freischaltregeln-sakura.md, docs/entscheidungen.md (Schritt 3, Punkt 2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAKURA_ACHIEVEMENTS, COLLECTORS, taskGap } from '../src/core/sakura/achievements.js';
import { SAKURA_GRAPH } from '../src/core/sakura/progressTree.js';
import { SAKURA_BONUSES, createSakuraSheet } from '../src/core/sakura/scoresheet.js';

const byId = (id) => SAKURA_ACHIEVEMENTS.find((a) => a.id === id);
const sheetWith = (fn) => {
  const s = createSakuraSheet({
    gameNumber: 9, date: '2026-11-23',
    unlockedBonusIds: SAKURA_BONUSES.map((b) => b.id), unlockedColumns: ['rundum', 'sieben'],
  });
  fn(s);
  return s;
};

const KINDS = {
  direct: ['rundumauftraege', 'kirschblueten'],
  node: [
    'strassenkreuzung', 'see', 'bruecken', 'einsiedler', 'fujiyama', 'heisseQuellen', 'kalligraph', 'kartograph',
    'kontor', 'sternwarte', 'tempel', 'tore', 'geschenk', 'moossammlerin', 'reisbaeuerin', 'reiskuchen',
    'sumoringer', 'teemeisterin', 'umtrunk',
  ],
  auto: [
    'lagerhaus', 'gourmet', 'haendler', 'koiKennerin', 'pilger', 'vogelfreundin', 'dekretDesKaisers', 'daimyo',
    'kleineWolken', 'poet',
  ],
  confirm: ['meisterpruefung', 'ochsenkarrenHandelsposten', 'schiffAnlegestelle'],
  manual: ['sackgasse', 'staudamm', 'badendeAffen', 'dorfUndReis', 'kirschbaumUndDorf', 'reisUndKirschbaum', 'bunteFahne'],
};

test('Die Erfolgsliste hat die 41 Einträge des Kampagnenbogens', () => {
  assert.equal(SAKURA_ACHIEVEMENTS.length, 41);
  assert.equal(new Set(SAKURA_ACHIEVEMENTS.map((a) => a.id)).size, 41);
  assert.deepEqual(SAKURA_ACHIEVEMENTS.map((a) => a.label).sort((a, b) => a.localeCompare(b, 'de')), [
    'Badende Affen', 'Brücken', 'Bunte Fahne', 'Daimyo', 'Dekret des Kaisers', 'Dorf & Reis', 'Einsiedler', 'Fujiyama',
    'Geschenk', 'Gourmet', 'Händler', 'Heiße Quellen', 'Kalligraph', 'Kartograph', 'Kirschbaum & Dorf', 'Kirschblüten',
    'Kleine Wolken', 'Koi-Kennerin', 'Kontor', 'Lagerhaus', 'Meisterprüfung', 'Moossammlerin',
    'Ochsenkarren und Handelsposten', 'Pilger', 'Poet', 'Reis & Kirschbaum', 'Reisbäuerin', 'Reiskuchen',
    'Rundumaufträge', 'Sackgasse', 'Schiff und Anlegestelle', 'See', 'Staudamm', 'Sternwarte', 'Straßenkreuzung',
    'Sumoringer', 'Teemeisterin', 'Tempel', 'Tore', 'Umtrunk', 'Vogelfreundin',
  ]);
});

test('Art der Freischaltung je Karte laut Freischaltregeln (direkt, Feld auf dem Bogen, auto, teil-auto, manuell)', () => {
  for (const [kind, ids] of Object.entries(KINDS)) {
    for (const id of ids) assert.equal(byId(id)?.kind, kind, id);
  }
  assert.equal(Object.values(KINDS).flat().length, 41);
});

test('Jede Karte gehört zu der Box der Freischaltregeln', () => {
  const boxes = {
    1: ['rundumauftraege', 'lagerhaus'],
    2: ['sackgasse', 'staudamm', 'strassenkreuzung', 'see'],
    3: ['kirschblueten', 'meisterpruefung', 'gourmet', 'haendler', 'koiKennerin', 'pilger', 'vogelfreundin', 'teemeisterin',
      'geschenk', 'moossammlerin', 'reisbaeuerin', 'reiskuchen', 'sumoringer', 'umtrunk'],
    4: ['badendeAffen', 'bruecken', 'einsiedler', 'fujiyama', 'heisseQuellen', 'kalligraph', 'kartograph', 'kontor',
      'sternwarte', 'tempel', 'tore'],
    5: ['dekretDesKaisers', 'dorfUndReis', 'kirschbaumUndDorf', 'reisUndKirschbaum'],
    6: ['bunteFahne', 'daimyo', 'kleineWolken', 'ochsenkarrenHandelsposten', 'poet', 'schiffAnlegestelle'],
  };
  for (const [box, ids] of Object.entries(boxes)) for (const id of ids) assert.equal(byId(id).box, Number(box), id);
});

test('Karten mit Feld auf dem Bogen nennen den Knoten des Graphen', () => {
  const nodes = new Set(SAKURA_GRAPH.nodes.map((n) => n.id));
  for (const id of KINDS.node) assert.ok(nodes.has(byId(id).node), id);
  assert.equal(byId('strassenkreuzung').node, 'Kreuzung');
  assert.equal(byId('heisseQuellen').node, 'HeisseQuellen');
});

test('Die fünf Blütensammler zur Auswahl; die Teemeisterin gehört nicht dazu', () => {
  assert.deepEqual([...COLLECTORS].sort(), ['gourmet', 'haendler', 'koiKennerin', 'pilger', 'vogelfreundin']);
  assert.ok(!COLLECTORS.includes('teemeisterin'));
});

// Schwellen: je (gap bei Schwelle−1) = 1 und (gap bei Schwelle) = 0

const THRESHOLDS = [
  ['lagerhaus', 18, (s, v) => { s.orders.rundum = v; }],
  ['gourmet', 45, (s, v) => { s.orders.dorf = v - 5; s.flags.dorf = 5; }],
  ['haendler', 40, (s, v) => { s.orders.strasse = v - 12; s.flags.strasse = 12; }],
  ['koiKennerin', 40, (s, v) => { s.orders.fluss = v - 12; s.flags.fluss = 12; }],
  ['pilger', 45, (s, v) => { s.orders.kirschbaum = v - 6; s.flags.kirschbaum = 6; }],
  ['vogelfreundin', 45, (s, v) => { s.orders.reis = v - 6; s.flags.reis = 6; }],
  ['meisterpruefung', 250, (s, v) => { s.orders.kirschbaum = v; }],
  ['dekretDesKaisers', 12, (s, v) => { s.bonuses.tempel.points = v; }],
  ['daimyo', 169, (s, v) => { s.orders.kirschbaum = v - 18; s.orders.rundum = 10; s.orders.sieben = 8; }],
  ['kleineWolken', 300, (s, v) => { s.orders.kirschbaum = v; }],
  ['ochsenkarrenHandelsposten', 300, (s, v) => { s.orders.kirschbaum = v; }],
  ['schiffAnlegestelle', 200, (s, v) => { s.orders.kirschbaum = v; }],
];

for (const [id, min, set] of THRESHOLDS) {
  test(`Aufgabe ${id}: erfüllt ab ${min} Punkten, darunter fehlen genau die übrigen Punkte`, () => {
    assert.equal(taskGap(id, sheetWith((s) => set(s, min))), 0);
    assert.equal(taskGap(id, sheetWith((s) => set(s, min - 1))), 1);
  });
}

test('Lagerhaus zählt nur die Zelle Rundum der Zeile Aufträge, nicht den Bonus für längste Straße/Fluss', () => {
  assert.equal(taskGap('lagerhaus', sheetWith((s) => { s.orders.rundum = 14; s.flags.rundum = 4; })), 4);
});

test('Daimyo zählt die ganze Zeile Aufträge, keine Fahnen', () => {
  assert.equal(taskGap('daimyo', sheetWith((s) => { s.orders.kirschbaum = 100; s.flags.kirschbaum = 100; })), 69);
});

test('Gesamtsumme zählt die gesammelten Kirschblüten mit', () => {
  assert.equal(taskGap('kleineWolken', sheetWith((s) => { s.orders.reis = 250; s.bonuses.kirschblueten.points = 50; })), 0);
});

test('Poet: genau 18 Punkte mit Tempeln; darüber lässt sich die Karte nicht mehr erfüllen', () => {
  const tempel = (v) => sheetWith((s) => { s.bonuses.tempel.points = v; });
  assert.equal(taskGap('poet', tempel(18)), 0);
  assert.equal(taskGap('poet', tempel(17)), 1);
  assert.equal(taskGap('poet', tempel(19)), null);
});

test('Karten ohne Punkteaufgabe (manuell, direkt, Feld auf dem Bogen) haben keine Lücke', () => {
  for (const id of [...KINDS.manual, ...KINDS.direct, ...KINDS.node]) {
    assert.equal(taskGap(id, sheetWith(() => {})), undefined, id);
  }
});
