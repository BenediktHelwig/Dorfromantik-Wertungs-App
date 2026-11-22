// Erfolgskarten aus den Schachteln (Bereich "Schachteln" in "Eure Erfolge").
// Quelle: Basisspiel_Freischaltregeln.md (Benedikt, 22.11.2026).
//
// Ablauf: Das Kreuz (Karte erhalten) setzt der Spieler. Die Spielnummer
// (Aufgabe erfüllt) wird am Partieende gesetzt:
//   auto    – die App prüft das Wertungsblatt und trägt sie selbst ein
//   confirm – die App erkennt eine wahrscheinliche Erfüllung und fragt nach
//   manual  – der Spieler bestätigt selbst ("Erfüllt"/"Nicht erfüllt")
//   board   – wird über das Kampagnenblatt freigeschaltet (Fortschrittsbaum)
// Freischaltung immer erst am Partieende, die Wirkung gilt ab der nächsten Partie.

import { computeTotals } from './scoresheet.js';

const total = (sheet) => computeTotals(sheet).total;
const ordersOnly = (sheet) => computeTotals(sheet).s1; // Aufträge ohne Punkte durch Sonderplättchen
const bonusPoints = (sheet, id) => (sheet.bonuses[id]?.unlocked ? sheet.bonuses[id].points : 0);

/**
 * @typedef {{ id: string, label: string, box: number, kind: 'auto'|'confirm'|'manual'|'board',
 *   condition: string, check?: (sheet: object) => boolean }} Achievement
 */

/** @type {readonly Achievement[]} */
export const ACHIEVEMENTS = Object.freeze([
  // Schachtel 1
  { id: 'roteHerzen', label: 'Rote Herzen', box: 1, kind: 'board',
    condition: 'Freigespielt mit Schachtel 1 (Kampagnenblatt)' },
  { id: 'herzenswuensche', label: 'Herzenswünsche', box: 1, kind: 'confirm',
    condition: 'Am Partieende 6 P durch 1 Herz',
    check: (s) => bonusPoints(s, 'roteHerzen') >= 6 },
  // Schachtel 2
  { id: 'aufErfolgsspur', label: 'Auf Erfolgsspur', box: 2, kind: 'auto',
    condition: '≥200 P', check: (s) => total(s) >= 200 },
  // Schachtel 4: ≥30 P durch Aufträge der jeweiligen Art
  { id: 'erntefest', label: 'Erntefest', box: 4, kind: 'auto',
    condition: '≥30 P durch Getreideaufträge', check: (s) => s.orders.getreide >= 30 },
  { id: 'lokomotive', label: 'Lokomotive', box: 4, kind: 'auto',
    condition: '≥30 P durch Gleisaufträge', check: (s) => s.orders.gleis >= 30 },
  { id: 'schiff', label: 'Schiff', box: 4, kind: 'auto',
    condition: '≥30 P durch Flussaufträge', check: (s) => s.orders.fluss >= 30 },
  { id: 'wachturm', label: 'Wachturm', box: 4, kind: 'auto',
    condition: '≥30 P durch Dorfaufträge', check: (s) => s.orders.dorf >= 30 },
  { id: 'waldhuette', label: 'Waldhütte', box: 4, kind: 'auto',
    condition: '≥30 P durch Waldaufträge', check: (s) => s.orders.wald >= 30 },
  // Schachtel 5
  { id: 'bahnhof', label: 'Bahnhof', box: 5, kind: 'auto',
    condition: '≥180 P + Gleis aus ≥12 Plättchen',
    check: (s) => total(s) >= 180 && s.longest.gleis >= 12 },
  { id: 'ballonStartplatz', label: 'Ballon-Startplatz', box: 5, kind: 'auto',
    condition: '≥300 P', check: (s) => total(s) >= 300 },
  { id: 'baustelle', label: 'Baustelle', box: 5, kind: 'auto',
    condition: '≥157 P durch Aufträge (ohne P durch Sonderplättchen)',
    check: (s) => ordersOnly(s) >= 157 },
  { id: 'fahnenfest', label: 'Fahnenfest', box: 5, kind: 'manual',
    condition: '≥40 P durch ein Gebiet mit 3 Fahnen' },
  { id: 'goldenesHerz', label: 'Goldenes Herz', box: 5, kind: 'auto',
    condition: '≥18 P durch rote Herzen', check: (s) => bonusPoints(s, 'roteHerzen') >= 18 },
  { id: 'hafen', label: 'Hafen', box: 5, kind: 'auto',
    condition: '≥180 P + Fluss aus ≥12 Plättchen',
    check: (s) => total(s) >= 180 && s.longest.fluss >= 12 },
]);

/**
 * Prüft am Partieende, welche erhaltenen, noch nicht erfüllten Erfolgskarten
 * das Wertungsblatt erfüllt.
 *
 * @param {object} sheet Wertungsblatt der gerade beendeten Partie
 * @param {{ received: Iterable<string>, unlockGames: Record<string, number|null|undefined> }} state
 *   received = ids mit Kreuz (Karte erhalten), unlockGames = id -> eingetragene Spielnummer
 * @returns {{ auto: string[], confirm: string[] }} auto = sofort eintragen, confirm = Spieler fragen
 */
export function evaluateAchievements(sheet, { received, unlockGames }) {
  const has = new Set(received);
  const open = ACHIEVEMENTS.filter((a) =>
    has.has(a.id) && !Number.isInteger(unlockGames[a.id]) && typeof a.check === 'function' && a.check(sheet));
  return {
    auto: open.filter((a) => a.kind === 'auto').map((a) => a.id),
    confirm: open.filter((a) => a.kind === 'confirm').map((a) => a.id),
  };
}
