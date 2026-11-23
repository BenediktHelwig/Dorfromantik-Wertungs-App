// Kirschblüten: Ausgabe-Budget und Eintrag am Partieende.
// Regeln: docs/freischaltregeln-sakura.md (Kirschblüten, Ablauf am Partieende), docs/entscheidungen.md (Schritt 3).
//
// Die gesammelten Blüten (Wertungsblatt) zählen vollständig als Punkte und bleiben unverändert. Daneben legt die App
// ein Ausgabe-Budget mit demselben Wert an; alle Ausgaben werden davon abgezogen, ein Rest verfällt am Partieende.
// Gespeichert wird nur der Eintrag des Spielers (`entry`), die Kosten rechnet evaluateGameEnd jedes Mal neu.
//
//   entry = { kalligraph?: { surrounded, extra, paid }, stars?, bigStar?, fills?: [id], confirmed?: [id],
//             flips?: [id], freeSpend? }

import { SAKURA_ACHIEVEMENTS, taskGap } from './achievements.js';

export const BLOSSOM_COSTS = Object.freeze({ masterExam: 10, flip: 5, kalligraphField: 10, bigStar: 30 });

/** Wiederverwendbare *-Karten (Geschenk, Reiskuchen, Umtrunk). */
export const STAR_CARDS = Object.freeze(['geschenk', 'reiskuchen', 'umtrunk']);

const labelOf = (id) => SAKURA_ACHIEVEMENTS.find((a) => a.id === id)?.label ?? id;

/** Ausgabe-Budget einer Partie: der Wert "Kirschblüten (gesammelt)", wenn die Karte Kirschblüten freigespielt ist. */
export function blossomBudget(sheet) {
  const bonus = sheet.bonuses.kirschblueten;
  return bonus.unlocked ? bonus.points : 0;
}

/**
 * Wertet den Eintrag am Partieende aus. Karten ohne Ausgabe (Punkte reichen) werden immer eingetragen; alles,
 * was Blüten kostet, zählt nur, wenn der ganze Eintrag gültig ist (Summe ≤ Budget, Regeln der Karten).
 *
 * @param {{ sheet: object, received: Set<string>, unlockGames: Record<string, number|undefined>, entry?: object,
 *   flippable?: Set<string>, kalligraphActive?: boolean }} input
 *   received = für diese Partie erhaltene Karten, flippable = umdrehbare *-Karten, kalligraphActive = Kalligraph
 *   ist seit einer früheren Partie freigeschaltet
 * @returns {{ budget: number, spent: number, errors: string[], fulfilled: string[], circleCrosses: number,
 *   starCrosses: number, bigStar: boolean, flipped: string[] }}
 */
export function evaluateGameEnd({ sheet, received, unlockGames, entry = {}, flippable = new Set(), kalligraphActive = false }) {
  const budget = blossomBudget(sheet);
  const errors = [];
  let spent = 0;

  // Karten mit Aufgabe.
  const free = [];
  const paid = [];
  for (const card of SAKURA_ACHIEVEMENTS.filter((a) => a.kind === 'auto' || a.kind === 'confirm')) {
    if (!received.has(card.id) || Number.isInteger(unlockGames[card.id])) continue;
    const confirmed = card.kind === 'auto' || (entry.confirmed ?? []).includes(card.id);
    const gap = taskGap(card.id, sheet);
    const master = card.id === 'meisterpruefung' ? BLOSSOM_COSTS.masterExam : 0;
    if (gap === 0 && confirmed) {
      if (master > 0) { spent += master; paid.push(card.id); } else free.push(card.id);
    } else if ((entry.fills ?? []).includes(card.id) && confirmed) {
      if (gap === null) errors.push(`${card.label}: hat schon mehr Punkte als verlangt, lässt sich nicht auffüllen`);
      else { spent += gap + master; paid.push(card.id); }
    }
  }

  // Kalligraph: 1 freies Zusatzfeld, je 10 Blüten 1 weiteres, alles auf dem Kreispfad.
  const kalligraph = entry.kalligraph ?? {};
  const extra = kalligraph.extra ? 1 : 0;
  const fields = kalligraph.paid ?? 0;
  if (extra + fields > 0) {
    if (!kalligraphActive) errors.push('Kalligraph: noch nicht freigeschaltet');
    else if (!kalligraph.surrounded) errors.push('Kalligraph: Felder nur, wenn er komplett von Plättchen umgeben ist');
  }
  spent += fields * BLOSSOM_COSTS.kalligraphField;

  const stars = entry.stars ?? 0;
  spent += stars;
  if (entry.bigStar) spent += BLOSSOM_COSTS.bigStar;

  const flips = entry.flips ?? [];
  for (const id of flips) {
    if (!flippable.has(id)) errors.push(`${labelOf(id)}: kann nicht umgedreht werden`);
  }
  spent += flips.length * BLOSSOM_COSTS.flip;

  spent += entry.freeSpend ?? 0;

  if (spent > budget) errors.push(`Ausgabe-Budget überschritten: ${spent} von ${budget} Blüten`);

  if (errors.length > 0) {
    return { budget, spent, errors, fulfilled: free, circleCrosses: 0, starCrosses: 0, bigStar: false, flipped: [] };
  }
  return {
    budget, spent, errors, fulfilled: [...free, ...paid], circleCrosses: extra + fields,
    starCrosses: stars, bigStar: Boolean(entry.bigStar), flipped: [...flips],
  };
}

/**
 * Stand der *-Karten vor einer Partie (Entscheidung 3 und 9, Schritt 3): Eine Karte ist ab der Partie nach ihrer
 * Freischaltung einsetzbar. In Partie N eingesetzt ist sie verbraucht; umdrehen (5 Blüten) geht frühestens in
 * einer späteren Partie M, danach ist sie ab M+1 wieder einsetzbar.
 *
 * @param {{ unlockGames: Record<string, number|undefined>,
 *   history: { gameNumber: number, activated?: string[], flips?: string[] }[], gameNumber: number }} input
 * @returns {{ activatable: Set<string>, flippable: Set<string> }}
 */
export function starCardState({ unlockGames, history, gameNumber }) {
  const earlier = history.filter((h) => h.gameNumber < gameNumber).sort((a, b) => a.gameNumber - b.gameNumber);
  const activatable = new Set();
  const flippable = new Set();
  for (const id of STAR_CARDS) {
    let used = false;
    for (const h of earlier) {
      if ((h.flips ?? []).includes(id)) used = false;
      if ((h.activated ?? []).includes(id)) used = true;
    }
    if (used) flippable.add(id);
    else if (Number.isInteger(unlockGames[id]) && unlockGames[id] < gameNumber) activatable.add(id);
  }
  return { activatable, flippable };
}
