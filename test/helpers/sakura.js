// Hilfen für die Sakura-Tests (kein Test selbst).
import { SAKURA_GRAPH } from '../../src/core/sakura/progressTree.js';

const adjacency = new Map();
for (const e of SAKURA_GRAPH.edges) {
  for (const [x, y] of [[e.a, e.b], [e.b, e.a]]) adjacency.set(x, [...(adjacency.get(x) ?? []), y]);
}
const typeOf = new Map(SAKURA_GRAPH.nodes.map((n) => [n.id, n.type]));

/** Name des ersten benannten Feldes (kein Kreis/Stern), wenn man von `at` aus über `toward` läuft. */
export function firstNamedAfter(at, toward) {
  let prev = at;
  let cur = toward;
  while (typeOf.get(cur) === 'circle' || typeOf.get(cur) === 'star') {
    const next = adjacency.get(cur).find((n) => n !== prev);
    prev = cur;
    cur = next;
  }
  return cur;
}

/** Die Wahl (Option einer Frage), die zum benannten Feld `name` führt. */
export const optionFor = (options, name) => options.find((o) => firstNamedAfter(o.at, o.toward) === name);
