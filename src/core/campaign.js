// Kampagnenblatt: "Eure Ergebnisse" und Kreuze für den Fortschrittsbaum.
// Alles wird aus den gespeicherten Wertungsblättern neu berechnet (Rohdaten-Prinzip).

import { HIGHSCORE_BASIS, highscoreRow } from './highscore.js';
import { computeTotals } from './scoresheet.js';

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

/** Stub (red-Phase): Verhalten folgt im green-Commit. */
export function computeCampaign() {
  throw new Error('computeCampaign: noch nicht implementiert');
}
