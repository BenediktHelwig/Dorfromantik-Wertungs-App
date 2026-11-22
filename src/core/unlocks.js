// Wirkung von Freischaltungen ("Eure Erfolge") auf das Wertungsblatt.

/**
 * Eine Erfolgskarte wird immer erst am Ende einer Partie freigeschaltet,
 * die Wirkung gilt ab der nächsten Partie (bestätigt 22.11.2026).
 * Ein Bonus ist also im Wertungsblatt von Spiel N aktiv, wenn seine Spielnummer kleiner als N ist.
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
