// Kampagnenblatt der Variante Sakura: alles wird aus den Rohdaten neu berechnet (Rohdaten-Prinzip).
// Regeln: docs/freischaltregeln-sakura.md, docs/fortschrittsbaum-sakura.md, docs/entscheidungen.md (Schritt 3).
//
// Rohdaten: Wertungsblätter, Entscheidungen im Baum (mit Spur), Wahl des Blütensammlers, Partieende-Einträge
// (Blüten-Ausgaben, Kalligraph, Bestätigungen) und manuelle Erfüllungen. Die Partien werden in Spielreihenfolge
// nachgespielt; alles, was in Partie N geschieht, wirkt ab Partie N+1 (Entscheidung 3).

import { HIGHSCORE_SAKURA, highscoreRow } from '../highscore.js';
import { SAKURA_GRAPH, walkTrack } from './progressTree.js';
import { SAKURA_ACHIEVEMENTS, COLLECTORS } from './achievements.js';
import { SAKURA_BONUSES, LOCKABLE_COLUMNS, computeSakuraTotals } from './scoresheet.js';
import { evaluateGameEnd, starCardState } from './blossoms.js';

/** Karten, die mit dem Öffnen einer Box erhalten werden. Box 4 ist nur Aufbewahrung (Inhalt über den Bogen). */
export const OPENED_WITH_BOX = Object.freeze({
  1: ['rundumauftraege', 'lagerhaus'],
  2: ['sackgasse', 'staudamm'],
  3: ['kirschblueten', 'meisterpruefung'],
  5: ['dekretDesKaisers', 'dorfUndReis', 'kirschbaumUndDorf', 'reisUndKirschbaum'],
  6: ['bunteFahne', 'daimyo', 'kleineWolken', 'ochsenkarrenHandelsposten', 'poet', 'schiffAnlegestelle'],
});

const NODE_CARDS = SAKURA_ACHIEVEMENTS.filter((a) => a.kind === 'node');
const MANUAL_CARDS = new Set(SAKURA_ACHIEVEMENTS.filter((a) => a.kind === 'manual').map((a) => a.id));
const BOX_NODES = Object.freeze({ Box1: 1, Box2: 2, Box3: 3 });

/**
 * @param {{ sheets: object[], decisions?: object[], collector?: string|null, gameEnds?: Record<number, object>,
 *   manualUnlocks?: Record<string, number>, graph?: import('./progressTree.js').SakuraGraph }} raw
 *   decisions = { track: 'path'|'star', at, toward }, manualUnlocks = vom Spieler bestätigte Erfüllungen (id -> Spielnummer)
 */
export function computeSakuraCampaign({
  sheets, decisions = [], collector = null, gameEnds = {}, manualUnlocks = {}, graph = SAKURA_GRAPH,
}) {
  const ordered = [...sheets].sort((a, b) => a.gameNumber - b.gameNumber);
  const trackDecisions = (track) => decisions.filter((d) => (d.track ?? 'path') === track);
  const walk = (track, games) => walkTrack({ graph, track, games, decisions: trackDecisions(track) });

  const unlockGames = {}; // Karte -> Spielnummer der Freischaltung ("Krone")
  const boxGames = {}; // Box -> Spielnummer, in der sie geöffnet wurde
  const pathGames = [];
  const starGames = [];
  const history = []; // eingesetzte und umgedrehte *-Karten je Partie
  const normalized = [];
  const gameEndResults = {};
  const activatable = {};
  const flippable = {};
  let bigStarGame = null;
  let trees = { path: walk('path', []), star: walk('star', []) };

  const before = (game, n) => Number.isInteger(game) && game < n;
  const receivedAt = (n) => {
    const received = new Set();
    for (const [box, ids] of Object.entries(OPENED_WITH_BOX)) if (before(boxGames[box], n)) ids.forEach((id) => received.add(id));
    for (const card of NODE_CARDS) if (before(unlockGames[card.id], n)) received.add(card.id);
    if (before(unlockGames.heisseQuellen, n)) received.add('badendeAffen');
    if (collector && before(boxGames[3], n)) received.add(collector);
    return received;
  };
  const columnsAt = (n) => ({ rundum: before(boxGames[1], n), sieben: before(boxGames[5], n) });
  const unlockedBonusIdsAt = (n) => SAKURA_BONUSES.map((b) => b.id).filter((id) => before(unlockGames[id], n));

  for (const sheet of ordered) {
    const n = sheet.gameNumber;
    const columns = columnsAt(n);
    const active = new Set(unlockedBonusIdsAt(n));
    const norm = {
      ...sheet,
      columns,
      bonuses: Object.fromEntries(SAKURA_BONUSES.map(({ id }) => [id, { points: 0, ...sheet.bonuses?.[id], unlocked: active.has(id) }])),
    };
    normalized.push(norm);
    const crosses = highscoreRow(computeSakuraTotals(norm).total, HIGHSCORE_SAKURA).crosses;

    // Partieende-Eintrag (Blüten, Kalligraph, Bestätigungen), geprüft gegen den Stand vor dieser Partie.
    const cards = starCardState({ unlockGames, history, gameNumber: n });
    activatable[n] = cards.activatable;
    flippable[n] = cards.flippable;
    const entry = gameEnds[n] ?? {};
    const context = {
      sheet: norm, received: receivedAt(n), unlockGames, flippable: cards.flippable,
      kalligraphActive: before(unlockGames.kalligraph, n),
    };
    let result = evaluateGameEnd({ ...context, entry });
    if (result.errors.length === 0 && result.bigStar) {
      const errors = [];
      if (bigStarGame !== null) errors.push('Stern 30 ist schon ausgekreuzt');
      else if (!walk('star', [...starGames, { gameNumber: n, crosses: result.starCrosses }]).ended) {
        errors.push('Stern 30: der Blütenpfad muss erst bis davor ausgekreuzt sein');
      }
      if (errors.length > 0) result = { ...result, errors };
    }
    // Ein ungültiger Eintrag zählt nicht (nur Karten ohne Ausgabe werden trotzdem eingetragen).
    const applied = result.errors.length > 0 ? evaluateGameEnd({ ...context, entry: {} }) : result;
    gameEndResults[n] = result;

    pathGames.push({ gameNumber: n, crosses: crosses + applied.circleCrosses });
    if (applied.starCrosses > 0) starGames.push({ gameNumber: n, crosses: applied.starCrosses });
    if (applied.bigStar) bigStarGame = n;
    history.push({ gameNumber: n, activated: sheet.activated ?? [], flips: applied.flipped });

    // Baum und Freischaltungen nach dieser Partie.
    trees = { path: walk('path', pathGames), star: walk('star', starGames) };
    for (const track of ['path', 'star']) {
      for (const [node, game] of trees[track].crossed) {
        if (node in BOX_NODES) boxGames[BOX_NODES[node]] = game;
        const card = NODE_CARDS.find((a) => a.node === node);
        if (card) unlockGames[card.id] = game;
      }
    }
    if (boxGames[1] !== undefined) unlockGames.rundumauftraege = boxGames[1];
    if (boxGames[3] !== undefined) unlockGames.kirschblueten = boxGames[3];
    for (const id of applied.fulfilled) unlockGames[id] ??= n;
    const received = receivedAt(n);
    for (const [id, game] of Object.entries(manualUnlocks)) {
      if (game === n && MANUAL_CARDS.has(id) && received.has(id)) unlockGames[id] ??= n;
    }
    if (unlockGames.meisterpruefung !== undefined) boxGames[5] = unlockGames.meisterpruefung;
    if (unlockGames.badendeAffen !== undefined) boxGames[6] = unlockGames.badendeAffen;
  }

  // Zeilen von "Eure Ergebnisse"
  const byRow = new Map(HIGHSCORE_SAKURA.map((row) => [row.min, []]));
  let totalCrosses = 0;
  for (const sheet of normalized) {
    const row = highscoreRow(computeSakuraTotals(sheet).total, HIGHSCORE_SAKURA);
    byRow.get(row.min).push(sheet.gameNumber);
    totalCrosses += row.crosses;
  }
  const next = ordered.reduce((max, s) => Math.max(max, s.gameNumber), 0) + 1;
  const nextCards = starCardState({ unlockGames, history, gameNumber: next });
  activatable[next] = nextCards.activatable;
  flippable[next] = nextCards.flippable;

  const collectorOpen = boxGames[3] !== undefined && !collector;
  const treePending = trees.path.pending ?? trees.star.pending;
  const pending = treePending ?? (collectorOpen
    ? { kind: 'collector', gameNumber: boxGames[3], options: [...COLLECTORS] }
    : null);

  return {
    rows: HIGHSCORE_SAKURA.map((row) => ({ ...row, gameNumbers: byRow.get(row.min) })),
    totalCrosses,
    nextGameNumber: next,
    sheets: normalized,
    trees,
    unlockGames,
    boxGames,
    received: receivedAt(next),
    unlockedForNext: { bonusIds: unlockedBonusIdsAt(next), columns: LOCKABLE_COLUMNS.filter((c) => columnsAt(next)[c]) },
    gameEndResults,
    activatable,
    flippable,
    bigStarGame,
    collectorOpen,
    pending,
  };
}
