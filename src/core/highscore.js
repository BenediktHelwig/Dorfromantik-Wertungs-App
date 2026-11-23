// Highscoreliste des Basisspiels (Kampagnenblatt).
// Ergebnis wird auf die nächstniedrigere Zeile abgerundet, z. B. 128 -> 120.
// Die drei leeren Zeilen über "Kaiserin" sind 500/600/700 (fest, je 15 Kreuze).

/** @typedef {{ min: number, title: string|null, crosses: number }} HighscoreRow */

/** @type {readonly HighscoreRow[]} absteigend sortiert */
export const HIGHSCORE_BASIS = Object.freeze([
  { min: 700, title: null, crosses: 15 },
  { min: 600, title: null, crosses: 15 },
  { min: 500, title: null, crosses: 15 },
  { min: 400, title: 'Kaiserin', crosses: 15 },
  { min: 375, title: 'Kronprinz', crosses: 15 },
  { min: 350, title: 'Baronin', crosses: 15 },
  { min: 340, title: 'Magnat', crosses: 14 },
  { min: 330, title: 'Ratsherrin', crosses: 14 },
  { min: 320, title: 'Bürgermeister', crosses: 13 },
  { min: 310, title: 'Fabrikantin', crosses: 13 },
  { min: 300, title: 'Ballonfahrer', crosses: 12 },
  { min: 290, title: 'Diplomatin', crosses: 12 },
  { min: 280, title: 'Ärztin', crosses: 11 },
  { min: 270, title: 'Astronom', crosses: 11 },
  { min: 260, title: 'Erfinder', crosses: 10 },
  { min: 250, title: 'Architektin', crosses: 10 },
  { min: 240, title: 'Kaufmann', crosses: 9 },
  { min: 230, title: 'Fotografin', crosses: 9 },
  { min: 220, title: 'Bahnhofsvorsteher', crosses: 8 },
  { min: 210, title: 'Hafenmeisterin', crosses: 8 },
  { min: 200, title: 'Kapitän', crosses: 7 },
  { min: 190, title: 'Zirkusdirektorin', crosses: 7 },
  { min: 180, title: 'Lokführer', crosses: 6 },
  { min: 170, title: 'Bäuerin', crosses: 6 },
  { min: 160, title: 'Förster', crosses: 5 },
  { min: 150, title: 'Wirtin', crosses: 5 },
  { min: 140, title: 'Künstlerin', crosses: 4 },
  { min: 130, title: 'Nachtwächter', crosses: 4 },
  { min: 120, title: 'Kutscher', crosses: 3 },
  { min: 110, title: 'Fischerin', crosses: 3 },
  { min: 100, title: 'Zeitungsjunge', crosses: 2 },
  { min: 0, title: 'Vagabund', crosses: 1 },
]);

/**
 * Zeile der Highscoreliste für ein Ergebnis (abgerundet).
 * @param {number} total Gesamtergebnis (>= 0)
 * @returns {HighscoreRow}
 */
export function highscoreRow(total) {
  if (!Number.isInteger(total) || total < 0) {
    throw new RangeError(`Ungültiges Ergebnis: ${total}`);
  }
  return HIGHSCORE_BASIS.find((row) => total >= row.min);
}

/** Highscoreliste Sakura (Entscheidung 23.11.2026, Schritt 3). */
export const HIGHSCORE_SAKURA = Object.freeze([]);
