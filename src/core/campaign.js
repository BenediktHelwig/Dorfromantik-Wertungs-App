// Kampagnenblatt: "Eure Ergebnisse" und Kreuze für den Fortschrittsbaum.
// Alles wird aus den gespeicherten Wertungsblättern neu berechnet (Rohdaten-Prinzip).

import { HIGHSCORE_BASIS, highscoreRow } from './highscore.js';
import { computeTotals } from './scoresheet.js';
import { evaluateAchievements, receivedAchievements, availableHearts } from './achievements.js';
import { activeBonusIds } from './unlocks.js';
import { BASIS_GRAPH, walkTree } from './progressTree.js';

/**
 * @param {object[]} sheets gespeicherte Wertungsblätter
 * @returns {{ rows: {min: number, title: string|null, crosses: number, gameNumbers: number[]}[], totalCrosses: number }}
 */
export function campaignResults(sheets) {
  const byRow = new Map(HIGHSCORE_BASIS.map((row) => [row.min, []]));
  let totalCrosses = 0;
  for (const sheet of [...sheets].sort((a, b) => a.gameNumber - b.gameNumber)) {
    const row = highscoreRow(computeTotals(sheet).total);
    byRow.get(row.min).push(sheet.gameNumber);
    totalCrosses += row.crosses;
  }
  return {
    rows: HIGHSCORE_BASIS.map((row) => ({ ...row, gameNumbers: byRow.get(row.min) })),
    totalCrosses,
  };
}

/** Nächste Spielnummer der Kampagne (fortlaufend). */
export function nextGameNumber(sheets) {
  return sheets.reduce((max, s) => Math.max(max, s.gameNumber), 0) + 1;
}

/**
 * Baum und Freischaltungen aus Wertungsblättern, deren Häkchen "freigespielt" schon stimmen.
 * Erreicht in Spiel N heißt: Eintrag mit Spielnummer N, Wirkung ab Spiel N+1. "Öffnet Schachtel 1"
 * trägt "Rote Herzen" ein, die Karten der Schachteln 1 und 2 gelten ab der Folgepartie. Danach werden die
 * Blätter in Spielreihenfolge nachgespielt: erfüllte Karten bekommen ihre Spielnummer (Prüfung am Partieende).
 */
function deriveUnlocks(ordered, { decisions, manualUnlocks, manualReceived, graph }) {
  const tree = walkTree({
    graph,
    decisions,
    games: ordered.map((s) => ({ gameNumber: s.gameNumber, crosses: highscoreRow(computeTotals(s).total).crosses })),
  });

  const unlockGames = {};
  const boxGames = {};
  for (const hexagon of graph.hexagons) {
    const game = tree.reached.get(hexagon.id);
    if (game === undefined) continue;
    if (hexagon.kind === 'box') {
      boxGames[hexagon.box] = game;
      if (hexagon.box === 1) unlockGames.roteHerzen = game; // Karte "Erfolg freigespielt" kommt mit Schachtel 1
    } else {
      unlockGames[hexagon.id] = game;
    }
  }
  Object.assign(unlockGames, manualUnlocks);

  for (const sheet of ordered) {
    const { auto } = evaluateAchievements(sheet, { received: manualReceived, unlockGames, boxGames });
    for (const id of auto) unlockGames[id] = sheet.gameNumber;
  }
  return { tree, unlockGames, boxGames };
}

/**
 * Berechnet die ganze Kampagne aus den Rohdaten (Rohdaten-Prinzip): Kreuze je Partie, Fortschrittsbaum,
 * Einträge in "Eure Erfolge" und verfügbare rote Herzen. Nichts davon wird gespeichert.
 *
 * Auch das Häkchen "freigespielt" der Boni in einem Wertungsblatt ist abgeleitet: Es wird je Partie aus den
 * Freischaltungen früherer Partien neu bestimmt (Bonus aktiv, wenn seine Spielnummer kleiner ist) und nicht
 * aus dem gespeicherten Blatt gelesen. So wirkt die Korrektur eines Blatts auf alles Spätere. Die übergebenen
 * Blätter werden nicht verändert.
 *
 * @param {{ sheets: object[], decisions?: import('./progressTree.js').Decision[],
 *   manualUnlocks?: Record<string, number>, manualReceived?: string[],
 *   graph?: import('./progressTree.js').Graph }} raw
 *   manualUnlocks = vom Spieler bestätigte Erfüllungen (z. B. Fahnenfest), manualReceived = von Hand gesetzte Kreuze
 */
export function computeCampaign({ sheets, decisions = [], manualUnlocks = {}, manualReceived = [], graph = BASIS_GRAPH }) {
  const options = { decisions, manualUnlocks, manualReceived, graph };
  const normalized = [];
  for (const sheet of [...sheets].sort((a, b) => a.gameNumber - b.gameNumber)) {
    const { unlockGames } = deriveUnlocks(normalized, options);
    const active = new Set(activeBonusIds(unlockGames, sheet.gameNumber));
    normalized.push({
      ...sheet,
      bonuses: Object.fromEntries(Object.entries(sheet.bonuses).map(([id, b]) => [id, { ...b, unlocked: active.has(id) }])),
    });
  }

  const { rows, totalCrosses } = campaignResults(normalized);
  const next = nextGameNumber(normalized);
  const { tree, unlockGames, boxGames } = deriveUnlocks(normalized, options);

  const hearts = {};
  for (const gameNumber of [...normalized.map((s) => s.gameNumber), next]) {
    hearts[gameNumber] = availableHearts({ unlockGames, boardHeartGames: tree.heartGames, gameNumber });
  }

  return {
    rows, totalCrosses, nextGameNumber: next, tree, unlockGames, hearts,
    received: receivedAchievements(manualReceived, unlockGames, next, boxGames),
  };
}
