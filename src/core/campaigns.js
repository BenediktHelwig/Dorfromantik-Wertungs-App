// Lebenszyklus der Kampagnen: anlegen, fortsetzen, beenden, ansehen, löschen.
// Regeln: docs/entscheidungen.md (23.11.2026, Schritt 2).
//
// Eine gespeicherte Kampagne enthält nur Rohdaten (Rohdaten-Prinzip):
//   Basisspiel: { id, startDate, endDate, sheets, decisions, manualUnlocks, manualReceived }
//   Sakura:     { id, variant: 'sakura', startDate, endDate, sheets, decisions, manualUnlocks, collector, gameEnds }
// Die Variante wird bei der Anlage gewählt; eine Kampagne ohne Feld "variant" ist ein Basisspiel (ältere Daten).
// Sie bestimmt Wertungsblatt, Graph, Highscoreliste und Erfolgsliste.
// Der Name der Kampagne ist abgeleitet: die Mitspielenden aus Spiel 1. Ergebnisse, Baum und Einträge
// berechnet computeCampaign (campaign.js) aus diesen Rohdaten. Alle Funktionen sind rein und geben eine
// neue Kampagne zurück, die Eingaben bleiben unverändert. Datum und Id kommen vom Aufrufer.
//
// Gespeicherte Wertungsblätter werden nicht korrigiert (Entscheidung 23.11.2026): addSheet fügt nur
// an, eine vergebene Spielnummer wird nie überschrieben.

import { createScoresheet } from './scoresheet.js';
import { computeCampaign } from './campaign.js';
import { activeBonusIds } from './unlocks.js';
import { createSakuraSheet } from './sakura/scoresheet.js';
import { computeSakuraCampaign } from './sakura/campaign.js';
import { COLLECTORS } from './sakura/achievements.js';

/** @typedef {ReturnType<typeof startCampaign>} Campaign */

const trimmed = (players) => String(players ?? '').trim();

export const isSakura = (campaign) => campaign.variant === 'sakura';

/** Berechnet die Kampagne nach ihrer Variante. */
const compute = (campaign) => (isSakura(campaign) ? computeSakuraCampaign(campaign) : computeCampaign(campaign));

/**
 * Neue Kampagne mit dem ersten Wertungsblatt (Spiel 1, Mitspielende Pflicht). Beginn = `date`.
 * @param {{ id: string, date: string, firstSheet: object, variant?: 'basis'|'sakura' }} input Standard: Basisspiel
 */
export function startCampaign({ id, date, firstSheet, variant = 'basis' }) {
  if (firstSheet.gameNumber !== 1) throw new Error('Das erste Wertungsblatt hat die Spielnummer 1');
  if (trimmed(firstSheet.players) === '') throw new Error('Mitspielende fehlen: Sie geben der Kampagne den Namen');
  const base = {
    id,
    startDate: date,
    endDate: null,
    sheets: [{ ...firstSheet, players: trimmed(firstSheet.players) }],
    decisions: [],
    manualUnlocks: {},
  };
  if (variant === 'sakura') return { ...base, variant, collector: null, gameEnds: {} };
  return { ...base, manualReceived: [] };
}

export const isFinished = (campaign) => campaign.endDate !== null;

/** Name der Kampagne = Mitspielende aus Spiel 1. */
export const campaignName = (campaign) => campaign.sheets[0].players;

function assertRunning(campaign) {
  if (isFinished(campaign)) throw new Error('Die Kampagne ist beendet und schreibgeschützt');
}

/** Leeres Wertungsblatt für die nächste Partie: Spielnummer, Datum, Mitspielende und freigespielte Boni. */
export function createNextSheet(campaign, date) {
  if (isSakura(campaign)) {
    const { nextGameNumber, unlockedForNext } = computeSakuraCampaign(campaign);
    const sheet = createSakuraSheet({
      gameNumber: nextGameNumber, date, unlockedBonusIds: unlockedForNext.bonusIds, unlockedColumns: unlockedForNext.columns,
    });
    return { ...sheet, players: campaignName(campaign) };
  }
  const { nextGameNumber, unlockGames } = computeCampaign(campaign);
  const sheet = createScoresheet({
    gameNumber: nextGameNumber,
    date,
    unlockedBonusIds: activeBonusIds(unlockGames, nextGameNumber),
  });
  return { ...sheet, players: campaignName(campaign) };
}

/** Hängt ein Wertungsblatt an. Keine Korrektur: nur die nächste Spielnummer, Mitspielende wie in Spiel 1. */
export function addSheet(campaign, sheet) {
  assertRunning(campaign);
  const expected = compute(campaign).nextGameNumber;
  if (sheet.gameNumber !== expected) throw new Error(`Spielnummer ${expected} erwartet, nicht ${sheet.gameNumber}`);
  if (sheet.players !== campaignName(campaign)) throw new Error('Mitspielende sind ab Spiel 2 fest und nicht änderbar');
  return { ...campaign, sheets: [...campaign.sheets, sheet] };
}

/**
 * Speichert eine Entscheidung im Fortschrittsbaum. Passt die zuletzt gespeicherte Entscheidung nicht
 * mehr zum Pfad (pending.rejected), wird sie ersetzt, sonst wird angehängt.
 */
export function addDecision(campaign, decision) {
  assertRunning(campaign);
  const sakura = isSakura(campaign);
  const pending = sakura ? computeSakuraCampaign(campaign).pending : computeCampaign(campaign).tree.pending;
  if (sakura && pending?.kind === 'collector') throw new Error('Zuerst den Blütensammler wählen');
  // Bei Sakura gehört die Entscheidung zu einer Spur (Kreispfad oder Blütenpfad): die der offenen Frage.
  const entry = sakura && pending ? { ...decision, track: pending.track } : decision;
  const decisions = [...campaign.decisions];
  const at = pending?.rejected ? decisions.indexOf(pending.rejected) : -1;
  if (at >= 0) decisions[at] = entry;
  else decisions.push(entry);
  return { ...campaign, decisions };
}

/** Wählt den Blütensammler (einer der fünf, nicht die Teemeisterin), sobald Öffnet Box 3 erreicht ist. */
export function chooseCollector(campaign, id) {
  assertRunning(campaign);
  if (!isSakura(campaign) || !computeSakuraCampaign(campaign).collectorOpen) {
    throw new Error('Es steht keine Wahl des Blütensammlers offen');
  }
  if (!COLLECTORS.includes(id)) throw new Error(`Blütensammler: ${id} steht nicht zur Auswahl`);
  return { ...campaign, collector: id };
}

/**
 * Speichert den Eintrag am Partieende (Kalligraph, Blüten-Ausgaben, Bestätigungen) für das zuletzt gespeicherte
 * Blatt, einmal. Ungültige Eintragungen (über dem Budget usw.) werden abgelehnt; gespeichert wird nur der Eintrag,
 * die Kosten rechnet computeSakuraCampaign jedes Mal neu.
 */
export function setGameEnd(campaign, gameNumber, entry) {
  assertRunning(campaign);
  if (!isSakura(campaign)) throw new Error('Einträge am Partieende gibt es nur bei Sakura');
  const last = campaign.sheets.reduce((max, s) => Math.max(max, s.gameNumber), 0);
  if (gameNumber !== last) throw new Error(`Der Eintrag gehört zum zuletzt gespeicherten Blatt, Spiel ${last}`);
  if (campaign.gameEnds[gameNumber]) throw new Error(`Für Spiel ${gameNumber} gibt es schon einen Eintrag`);
  const next = { ...campaign, gameEnds: { ...campaign.gameEnds, [gameNumber]: entry } };
  const { errors } = computeSakuraCampaign(next).gameEndResults[gameNumber];
  if (errors.length > 0) throw new Error(errors.join(' '));
  return next;
}

/** Setzt die vom Spieler bestätigte Erfüllung (z. B. Fahnenfest) auf eine Spielnummer, `null` entfernt sie. */
export function setManualUnlock(campaign, id, gameNumber) {
  assertRunning(campaign);
  const { [id]: _removed, ...rest } = campaign.manualUnlocks;
  return { ...campaign, manualUnlocks: gameNumber === null ? rest : { ...rest, [id]: gameNumber } };
}

/** Beenden ist möglich, solange die Kampagne läuft und im Baum keine Frage offen ist. */
export const canEndCampaign = (campaign) => {
  if (isFinished(campaign)) return false;
  return isSakura(campaign) ? computeSakuraCampaign(campaign).pending === null : computeCampaign(campaign).tree.pending === null;
};

/** Beendet die Kampagne: Enddatum = `date`, danach nur noch ansehen und löschen. */
export function endCampaign(campaign, date) {
  assertRunning(campaign);
  if (!canEndCampaign(campaign)) throw new Error('Im Fortschrittsbaum ist noch eine Frage offen, bitte erst beantworten');
  return { ...campaign, endDate: date };
}

export const deleteCampaign = (campaigns, id) => campaigns.filter((c) => c.id !== id);

/** Startbildschirm: laufende und beendete Kampagnen getrennt, jüngste zuerst. */
export function campaignOverview(campaigns) {
  const entry = (c) => ({
    id: c.id, name: campaignName(c), startDate: c.startDate, endDate: c.endDate, games: c.sheets.length,
    ...(isSakura(c) ? { variant: c.variant } : {}),
  });
  const newestFirst = (a, b) => b.startDate.localeCompare(a.startDate);
  const pick = (finished) => campaigns.filter((c) => isFinished(c) === finished).map(entry).sort(newestFirst);
  return { running: pick(false), finished: pick(true) };
}

