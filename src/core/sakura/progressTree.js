// Fortschrittsbaum Sakura: Pfadlogik für Kreispfad ("path") und Blütenpfad ("star").
// Regeln: docs/fortschrittsbaum-sakura.md, docs/entscheidungen.md (Schritt 3, Punkte 6 bis 8).
//
// Anders als im Basisspiel ist der Graph knotenbasiert (graph-sakura.json): Kreise, Sterne, Sechsecke und
// Quadrate sind gleichermaßen Felder und kosten je 1 Kreuz. Ein Feld gilt erst als erreicht, wenn es selbst
// ausgekreuzt ist. Jede Spur läuft linear von ihrer Wurzel (Start bzw. Öffnet Box 3) bis vor Stern 30; Stern 30
// ist kein Feld der Spuren (er wird nur mit 30 Blüten auf einmal gesetzt).
//
//  - Laufrichtung = wachsender Abstand von der Wurzel. An einer Gabelung wählt der Spieler das erste Feld
//    des Zweigs (Entscheidung), Zusammenführungen laufen automatisch weiter.
//  - Die Frage kommt erst bei Bedarf: enden die Kreuze genau am Sechseck, fragt die App erst in der Folgepartie.
//  - Pfadende = letztes Feld vor Stern 30 ausgekreuzt. Danach "Restliche Felder" (beide Spuren, Entscheidung 11
//    und 12): Der Spieler wählt einen noch offenen Zweig, die App kreuzt ihn in Laufrichtung bis zur
//    Zusammenführung. Eingang ist nur das erste Feld nach der Gabelung, nie von der Zusammenführung her.
//    Bei genau einer Möglichkeit geht es ohne Frage weiter. Kreuze verfallen erst, wenn alle Felder
//    ausgekreuzt sind.
//
// Gespeichert werden nur die Entscheidungen des Spielers; alles andere rechnet walkTrack neu.

import SAKURA_GRAPH from '../graph-sakura.json' with { type: 'json' };

export { SAKURA_GRAPH };

/**
 * @typedef {{ id: string, type: string, label?: string, lock?: number|null, x?: number, y?: number }} GraphNode
 * @typedef {{ a: string, b: string, track: 'path'|'star' }} GraphEdge
 * @typedef {{ nodes: GraphNode[], edges: GraphEdge[] }} SakuraGraph
 * @typedef {{ at: string, toward: string }} Decision
 *   Wahl des ersten Feldes `toward` nach dem Feld `at` (Gabelung) bzw. bei "Restliche Felder" eines freien
 *   Feldes neben dem ausgekreuzten Feld `at`.
 */

/**
 * Form einer Spur: Wurzel, Ende, Felder (nach Abstand geordnet) und die Folgefelder je Knoten.
 * @param {SakuraGraph} graph
 * @param {'path'|'star'} track
 */
export function trackInfo(graph, track) {
  const root = track === 'star' ? 'Box3' : graph.nodes.find((n) => n.type === 'start').id;
  const end = graph.nodes.find((n) => n.type === 'bigstar').id;
  const adjacent = new Map();
  for (const e of graph.edges.filter((x) => x.track === track)) {
    for (const [x, y] of [[e.a, e.b], [e.b, e.a]]) adjacent.set(x, [...(adjacent.get(x) ?? []), y]);
  }
  const dist = new Map([[root, 0]]);
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    for (const next of adjacent.get(node) ?? []) {
      if (!dist.has(next)) {
        dist.set(next, dist.get(node) + 1);
        queue.push(next);
      }
    }
  }
  const forward = new Map();
  for (const [node, d] of dist) {
    forward.set(node, (adjacent.get(node) ?? []).filter((n) => dist.get(n) === d + 1 && n !== end).sort());
  }
  const fields = [...dist.keys()].filter((id) => id !== root && id !== end).sort((a, b) => dist.get(a) - dist.get(b) || a.localeCompare(b));
  return { root, end, fields, forward, adjacent, dist };
}

/**
 * Läuft eine Spur über alle Partien und berechnet den Stand.
 *
 * Fehlt an einer Gabelung (oder bei "Restliche Felder") eine gültige Entscheidung, hält die Berechnung
 * an: `pending` beschreibt die Frage, spätere Partien werden erst danach ausgewertet. Die App rät nie.
 *
 * @param {{ graph?: SakuraGraph, track: 'path'|'star', games: { gameNumber: number, crosses: number }[],
 *   decisions?: Decision[] }} input
 * @returns {{
 *   crossed: Map<string, number>, position: { node: string },
 *   pending: null | { kind: 'fork'|'leftover', track: string, gameNumber: number, at: string, remaining: number,
 *     options: Decision[], rejected?: object },
 *   expired: number, ended: boolean, allCrossed: boolean }}
 */
export function walkTrack({ graph = SAKURA_GRAPH, track, games, decisions = [] }) {
  const { root, fields, forward } = trackInfo(graph, track);
  const isField = new Set(fields);
  const total = fields.length;

  const crossed = new Map();
  let cursor = root;
  let leftover = false; // Pfadende erreicht, es gelten die "Restlichen Felder"
  let chain = false; // im Restfeld-Abschnitt: der Cursor liegt auf einem eben gekreuzten freien Feld
  let expired = 0;
  let pending = null;
  let used = 0; // verbrauchte Entscheidungen

  // Restliche Felder laufen nur in Laufrichtung: freie Folgefelder des Cursors bzw. eines ausgekreuzten Feldes.
  const freeAhead = (node) => (forward.get(node) ?? []).filter((n) => !crossed.has(n));
  const frontier = () => {
    const options = new Map();
    for (const node of [root, ...crossed.keys()]) {
      for (const toward of freeAhead(node)) if (!options.has(toward) || node < options.get(toward).at) options.set(toward, { at: node, toward });
    }
    return [...options.values()].sort((a, b) => a.toward.localeCompare(b.toward));
  };
  const matches = (d, options) => d && !d.skip && options.some((o) => o.toward === d.toward
    && (o.at === d.at || (forward.get(d.at) ?? []).includes(o.toward)));
  const ask = (kind, gameNumber, left, options) => {
    pending = { kind, track, gameNumber, at: cursor, remaining: left, options };
    if (decisions[used]) pending.rejected = decisions[used];
  };

  const sorted = [...games].sort((a, b) => a.gameNumber - b.gameNumber);
  let guard = 0;
  games: for (const { gameNumber, crosses } of sorted) {
    let left = crosses;
    const step = (field) => {
      if (!crossed.has(field)) {
        crossed.set(field, gameNumber);
        left -= 1;
      }
      cursor = field;
    };
    while (left > 0) {
      if (++guard > 100000) throw new Error('walkTrack: Endlosschleife');
      if (crossed.size === total) { expired += left; break; }

      if (!leftover) {
        const options = forward.get(cursor);
        if (options.length === 0) {
          leftover = true;
        } else if (options.length === 1) {
          step(options[0]);
        } else {
          const d = decisions[used];
          if (d && !d.skip && d.at === cursor && options.includes(d.toward)) {
            used += 1;
            step(d.toward);
          } else {
            ask('fork', gameNumber, left, options.map((toward) => ({ at: cursor, toward })));
            break games;
          }
        }
        continue;
      }

      // Restliche Felder: erst dem freien Abschnitt weiter folgen, sonst ein freies Feld neben einem ausgekreuzten wählen.
      const next = chain ? freeAhead(cursor) : [];
      let options = next.map((toward) => ({ at: cursor, toward }));
      if (options.length === 0) {
        chain = false;
        options = frontier();
      }
      if (options.length === 0) { expired += left; break; }
      if (options.length === 1) {
        step(options[0].toward);
        chain = true;
        continue;
      }
      const d = decisions[used];
      if (matches(d, options)) {
        used += 1;
        step(d.toward);
        chain = true;
      } else {
        ask('leftover', gameNumber, left, options);
        break games;
      }
    }
  }

  return {
    crossed, position: { node: cursor }, pending, expired,
    ended: leftover || forward.get(cursor).length === 0, allCrossed: crossed.size === total,
  };
}
