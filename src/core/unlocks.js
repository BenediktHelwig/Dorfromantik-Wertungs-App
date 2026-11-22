// Freischaltungen ("Eure Erfolge") und ihre Wirkung auf das Wertungsblatt.

/**
 * Freigeschaltetes wirkt ab der Folgepartie: Ein Bonus ist im Wertungsblatt
 * von Spiel N aktiv, wenn seine Spielnummer kleiner als N ist.
 * (Für Goldenes Herz bestätigt, allgemein noch von Benedikt zu bestätigen.)
 *
 * @param {Record<string, number|null|undefined>} unlockGames id -> Spielnummer der Freischaltung
 * @param {number} gameNumber Spielnummer des aktuellen Wertungsblatts
 * @returns {string[]} ids der aktiven Boni
 */
export function activeBonusIds(unlockGames, gameNumber) {
  return Object.entries(unlockGames)
    .filter(([, game]) => Number.isInteger(game) && game < gameNumber)
    .map(([id]) => id);
}

export const GOLDEN_HEART_THRESHOLD = 18;

/**
 * Automatismus Goldenes Herz: Hat "Goldenes Herz" ein Kreuz (Karte erhalten),
 * noch keine Spielnummer, und stehen bei "Rote Herzen" mindestens 18 Punkte,
 * wird die aktuelle Spielnummer eingetragen. Danach ist der Effekt verbraucht.
 *
 * @param {{ hasCard: boolean, unlockedInGame: number|null, roteHerzenPoints: number, gameNumber: number }} p
 * @returns {number|null} einzutragende Spielnummer oder null
 */
export function goldenHeartUnlock({ hasCard, unlockedInGame, roteHerzenPoints, gameNumber }) {
  if (!hasCard || Number.isInteger(unlockedInGame)) return null;
  return roteHerzenPoints >= GOLDEN_HEART_THRESHOLD ? gameNumber : null;
}
