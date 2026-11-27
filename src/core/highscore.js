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
 * @param {readonly HighscoreRow[]} [table] Liste der Variante, Standard: Basisspiel
 * @returns {HighscoreRow}
 */
export function highscoreRow(total, table = HIGHSCORE_BASIS) {
  if (!Number.isInteger(total) || total < 0) {
    throw new RangeError(`Ungültiges Ergebnis: ${total}`);
  }
  return table.find((row) => total >= row.min);
}

/**
 * Highscoreliste der Variante Sakura (Entscheidung 23.11.2026, Schritt 3), vom Kampagnenbogen.
 * Keine leeren Zusatzzeilen: ab 500 bleibt das Ergebnis in Zeile 500 (16 Kreuze).
 * @type {readonly HighscoreRow[]} absteigend sortiert
 */
export const HIGHSCORE_SAKURA = Object.freeze([
  { min: 500, title: null, crosses: 16 },
  { min: 490, title: null, crosses: 16 },
  { min: 480, title: null, crosses: 16 },
  { min: 470, title: null, crosses: 16 },
  { min: 460, title: null, crosses: 16 },
  { min: 450, title: 'Kaiser', crosses: 16 },
  { min: 440, title: 'Kaiserin', crosses: 16 },
  { min: 430, title: 'Prinzessin', crosses: 15 },
  { min: 420, title: 'Prinz', crosses: 15 },
  { min: 410, title: 'Shogun', crosses: 15 },
  { min: 400, title: 'Priester', crosses: 14 },
  { min: 390, title: 'Präfektin', crosses: 14 },
  { min: 380, title: 'Samurai', crosses: 14 },
  { min: 370, title: 'Geisha', crosses: 13 },
  { min: 360, title: 'Ronin', crosses: 13 },
  { min: 350, title: 'Tempeldiener', crosses: 13 },
  { min: 340, title: 'Provinzbeamtin', crosses: 12 },
  { min: 330, title: 'Harfenspielerin', crosses: 12 },
  { min: 320, title: 'Wandermönch', crosses: 12 },
  { min: 310, title: 'Architektin', crosses: 11 },
  { min: 300, title: 'Teebäuerin', crosses: 11 },
  { min: 290, title: 'Algenzüchterin', crosses: 11 },
  { min: 280, title: 'Perlentaucher', crosses: 10 },
  { min: 270, title: 'Seidenweberin', crosses: 10 },
  { min: 260, title: 'Salzsieder', crosses: 9 },
  { min: 250, title: 'Waffenschmied', crosses: 9 },
  { min: 240, title: 'Tuschemalerin', crosses: 8 },
  { min: 230, title: 'Maskenschnitzerin', crosses: 8 },
  { min: 220, title: 'Origami-Künstlerin', crosses: 7 },
  { min: 210, title: 'Glockengießer', crosses: 7 },
  { min: 200, title: 'Tatamiflechterin', crosses: 6 },
  { min: 190, title: 'Zubermacher', crosses: 6 },
  { min: 180, title: 'Lastkahnkapitän', crosses: 5 },
  { min: 170, title: 'Feuerwerkerin', crosses: 5 },
  { min: 160, title: 'Tofuverkäuferin', crosses: 4 },
  { min: 150, title: 'Flötenspielerin', crosses: 4 },
  { min: 140, title: 'Rettichhändler', crosses: 3 },
  { min: 130, title: 'Bambusflößer', crosses: 3 },
  { min: 120, title: 'Puppenspielerin', crosses: 2 },
  { min: 110, title: 'Rikschafahrer', crosses: 2 },
  { min: 0, title: 'Lastenträger', crosses: 1 },
]);
