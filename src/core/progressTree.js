// Fortschrittsbaum des Basisspiels: Pfadlogik.
// Regeln: docs/app-anforderungen.md ("Wegelogik"), docs/fortschrittsbaum.md, docs/entscheidungen.md.
//
// Der Spieler läuft einen Pfad durch den Baum. Nach jeder Partie kreuzt die App so viele Kreise aus,
// wie die Highscoreliste angibt, und folgt dabei dem Pfad:
//  - Sechsecke kosten nichts. Ein Sechseck ist erreicht, sobald ein Nachbarkreis ausgekreuzt ist.
//  - Hat ein Sechseck nur einen Ausgang (ohne den Weg, auf dem man kam), geht es automatisch weiter.
//    Bei mehreren Ausgängen wählt der Spieler den ersten Kreis nach dem Sechseck (= Entscheidung).
//  - Bereits ausgekreuzte Kreise werden ohne Kosten übersprungen, solange nicht alle 14 Sechsecke
//    erreicht sind. Der Pfad endet nicht an der Wolke.
//  - Sind alle Sechsecke erreicht, läuft der Pfad nur noch über freie Kreise (1 Kreuz je Kreis). Gibt es
//    in Laufrichtung keinen, wählt der Spieler einen freien Abschnitt ("Restliche Felder") oder lässt
//    die Kreuze verfallen. Das schaltet nichts mehr frei.
//  - Sind alle Kreise ausgekreuzt, verfallen übrige Kreuze.
//
// Gespeichert werden nur die Entscheidungen des Spielers; alles andere rechnet walkTree neu.

import BASIS_GRAPH from './graph-basis.json' with { type: 'json' };

export { BASIS_GRAPH };

/**
 * @typedef {{ id: string, label?: string, kind: 'box'|'achievement', box?: number, x?: number, y?: number }} Hexagon
 * @typedef {{ id: string, from: string, to: string, circles: number, heart?: number }} Section
 *   Kreise werden ab `from` mit 1 beginnend gezählt, `heart` ist die Nummer des Herz-Kreises.
 * @typedef {{ start: { id: string }, hexagons: Hexagon[], sections: Section[] }} Graph
 * @typedef {{ at: string, toward: string } | { skip: true }} Decision
 *   Wahl des ersten Kreises nach dem Sechseck `at` in Richtung `toward`, oder (nur bei
 *   "Restliche Felder") die Kreuze der Partie verfallen lassen.
 */

/** Id eines Kreises: "<Abschnitt>#<Nummer>". */
export const circleId = (sectionId, n) => `${sectionId}#${n}`;

/** @param {Graph} [graph] @returns {string[]} */
export function circleIds(graph = BASIS_GRAPH) {
  return graph.sections.flatMap((s) => Array.from({ length: s.circles }, (_, i) => circleId(s.id, i + 1)));
}

/**
 * Läuft den Pfad über alle Partien und berechnet den Baum.
 *
 * Fehlt an einer Gabelung (oder bei "Restliche Felder") eine gültige Entscheidung, hält die Berechnung
 * an: `pending` beschreibt die Frage, spätere Partien werden erst danach ausgewertet. Die App rät nie.
 *
 * @param {{ graph?: Graph, games: { gameNumber: number, crosses: number }[], decisions?: Decision[] }} input
 * @returns {{
 *   crossed: Map<string, number>, reached: Map<string, number>, heartGames: number[],
 *   position: { node: string, via: string|null } | { section: string, next: number, toward: string },
 *   pending: null | { kind: 'fork'|'leftover', gameNumber: number, at: string, remaining: number,
 *     options: { at: string, toward: string }[], rejected?: Decision },
 *   expired: number, allUnlocked: boolean, allCrossed: boolean }}
 */
export function walkTree({ graph = BASIS_GRAPH, games, decisions = [] }) {
  const sections = new Map(graph.sections.map((s) => [s.id, s]));
  const hexIds = new Set(graph.hexagons.map((h) => h.id));
  const startId = graph.start.id;
  const incident = new Map();
  for (const s of graph.sections) {
    for (const node of [s.from, s.to]) incident.set(node, [...(incident.get(node) ?? []), s]);
  }
  const total = graph.sections.reduce((sum, s) => sum + s.circles, 0);

  const crossed = new Map();
  const reached = new Map();
  const heartGames = [];
  let cursor = { node: startId, via: null }; // am Sechseck/Start, oder { section, dir, next, toward } im Abschnitt
  let expired = 0;
  let pending = null;
  let used = 0; // verbrauchte Entscheidungen

  const allUnlocked = () => reached.size === hexIds.size;
  const otherEnd = (s, node) => (node === s.from ? s.to : s.from);
  const entryOf = (s, node) => (node === s.from
    ? { dir: 1, next: 1, toward: s.to }
    : { dir: -1, next: s.circles, toward: s.from });
  const firstIsFree = (s, node) => !crossed.has(circleId(s.id, entryOf(s, node).next));
  const optionsAt = (node, via) => {
    let secs = incident.get(node).filter((s) => node === startId || s.id !== via);
    if (allUnlocked()) secs = secs.filter((s) => firstIsFree(s, node));
    return secs.map((s) => ({ at: node, toward: otherEnd(s, node) }));
  };
  const leftoverOptions = () => graph.hexagons.flatMap((h) =>
    incident.get(h.id).filter((s) => firstIsFree(s, h.id)).map((s) => ({ at: h.id, toward: otherEnd(s, h.id) })));
  const enter = (at, toward) => {
    const s = incident.get(at).find((sec) => otherEnd(sec, at) === toward);
    cursor = { section: s.id, ...entryOf(s, at) };
  };
  const isOption = (d, options) => !d.skip && options.some((o) => o.at === d.at && o.toward === d.toward);

  const ask = (kind, gameNumber, left, options) => {
    const d = decisions[used];
    pending = { kind, gameNumber, at: cursor.node ?? cursor.toward, remaining: left, options };
    if (d) pending.rejected = d;
  };

  const sorted = [...games].sort((a, b) => a.gameNumber - b.gameNumber);
  let guard = 0;
  games: for (const { gameNumber, crosses } of sorted) {
    let left = crosses;
    while (left > 0) {
      if (++guard > 100000) throw new Error('walkTree: Endlosschleife');
      if (crossed.size === total) { expired += left; break; }

      // Keine Wahl möglich: Restliche Felder (nur wenn alles freigespielt ist).
      const leftover = () => {
        const options = leftoverOptions();
        const d = decisions[used];
        if (d?.skip) { used += 1; expired += left; left = 0; return true; }
        if (d && isOption(d, options)) { used += 1; enter(d.at, d.toward); return true; }
        ask('leftover', gameNumber, left, options);
        return false;
      };

      if (cursor.node !== undefined) {
        const options = optionsAt(cursor.node, cursor.via);
        if (options.length === 0) {
          if (!leftover()) break games;
        } else if (options.length === 1) {
          enter(options[0].at, options[0].toward);
        } else {
          const d = decisions[used];
          if (d && isOption(d, options)) {
            used += 1;
            enter(d.at, d.toward);
          } else {
            ask('fork', gameNumber, left, options);
            break games;
          }
        }
        continue;
      }

      const s = sections.get(cursor.section);
      const id = circleId(s.id, cursor.next);
      if (crossed.has(id)) {
        // Ausgekreuzte Kreise kosten nichts, solange noch etwas freizuspielen ist.
        if (allUnlocked()) {
          if (!leftover()) break games;
          continue;
        }
      } else {
        crossed.set(id, gameNumber);
        left -= 1;
        if (s.heart === cursor.next) heartGames.push(gameNumber);
        if (cursor.next === 1 && hexIds.has(s.from) && !reached.has(s.from)) reached.set(s.from, gameNumber);
        if (cursor.next === s.circles && hexIds.has(s.to) && !reached.has(s.to)) reached.set(s.to, gameNumber);
      }
      const next = cursor.next + cursor.dir;
      cursor = next < 1 || next > s.circles
        ? { node: cursor.toward, via: s.id }
        : { ...cursor, next };
    }
  }

  const position = cursor.node !== undefined
    ? { node: cursor.node, via: cursor.via }
    : { section: cursor.section, next: cursor.next, toward: cursor.toward };
  return {
    crossed, reached, heartGames, position, pending, expired,
    allUnlocked: allUnlocked(), allCrossed: crossed.size === total,
  };
}
