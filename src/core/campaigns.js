// Lebenszyklus der Kampagnen: anlegen, fortsetzen, beenden, ansehen, löschen.
// Regeln: docs/entscheidungen.md (23.11.2026, Schritt 2).
//
// Eine gespeicherte Kampagne enthält nur Rohdaten (Rohdaten-Prinzip):
//   { id, startDate, endDate, sheets, decisions, manualUnlocks, manualReceived }
// Der Name der Kampagne ist abgeleitet: die Mitspielenden aus Spiel 1. Ergebnisse, Baum und Einträge
// berechnet computeCampaign (campaign.js) aus diesen Rohdaten. Alle Funktionen sind rein und geben eine
// neue Kampagne zurück, die Eingaben bleiben unverändert. Datum und Id kommen vom Aufrufer.
//
// Gespeicherte Wertungsblätter werden nicht korrigiert (Entscheidung 23.11.2026): addSheet fügt nur
// an, eine vergebene Spielnummer wird nie überschrieben.

import { createScoresheet } from './scoresheet.js';
import { computeCampaign } from './campaign.js';
import { activeBonusIds } from './unlocks.js';

/** @typedef {ReturnType<typeof startCampaign>} Campaign */

const trimmed = (players) => String(players ?? '').trim();

/** Neue Kampagne mit dem ersten Wertungsblatt (Spiel 1, Mitspielende Pflicht). Beginn = `date`. */
export function startCampaign({ id, date, firstSheet }) {
  if (firstSheet.gameNumber !== 1) throw new Error('Das erste Wertungsblatt hat die Spielnummer 1');
  if (trimmed(firstSheet.players) === '') throw new Error('Mitspielende fehlen: Sie geben der Kampagne den Namen');
  return {
    id,
    startDate: date,
    endDate: null,
    sheets: [{ ...firstSheet, players: trimmed(firstSheet.players) }],
    decisions: [],
    manualUnlocks: {},
    manualReceived: [],
  };
}

export const isFinished = (campaign) => campaign.endDate !== null;

/** Name der Kampagne = Mitspielende aus Spiel 1. */
export const campaignName = (campaign) => campaign.sheets[0].players;

function assertRunning(campaign) {
  if (isFinished(campaign)) throw new Error('Die Kampagne ist beendet und schreibgeschützt');
}

/** Leeres Wertungsblatt für die nächste Partie: Spielnummer, Datum, Mitspielende und freigespielte Boni. */
export function createNextSheet(campaign, date) {
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
  const expected = computeCampaign(campaign).nextGameNumber;
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
  const { pending } = computeCampaign(campaign).tree;
  const decisions = [...campaign.decisions];
  const at = pending?.rejected ? decisions.indexOf(pending.rejected) : -1;
  if (at >= 0) decisions[at] = decision;
  else decisions.push(decision);
  return { ...campaign, decisions };
}

/** Setzt die vom Spieler bestätigte Erfüllung (z. B. Fahnenfest) auf eine Spielnummer, `null` entfernt sie. */
export function setManualUnlock(campaign, id, gameNumber) {
  assertRunning(campaign);
  const { [id]: _removed, ...rest } = campaign.manualUnlocks;
  return { ...campaign, manualUnlocks: gameNumber === null ? rest : { ...rest, [id]: gameNumber } };
}

/** Beenden ist möglich, solange die Kampagne läuft und im Baum keine Frage offen ist. */
export const canEndCampaign = (campaign) => !isFinished(campaign) && computeCampaign(campaign).tree.pending === null;

/** Beendet die Kampagne: Enddatum = `date`, danach nur noch ansehen und löschen. */
export function endCampaign(campaign, date) {
  assertRunning(campaign);
  if (!canEndCampaign(campaign)) throw new Error('Im Fortschrittsbaum ist noch eine Frage offen, bitte erst beantworten');
  return { ...campaign, endDate: date };
}

export const deleteCampaign = (campaigns, id) => campaigns.filter((c) => c.id !== id);

/** Startbildschirm: laufende und beendete Kampagnen getrennt, jüngste zuerst. */
export function campaignOverview(campaigns) {
  const entry = (c) => ({ id: c.id, name: campaignName(c), startDate: c.startDate, endDate: c.endDate, games: c.sheets.length });
  const newestFirst = (a, b) => b.startDate.localeCompare(a.startDate);
  const pick = (finished) => campaigns.filter((c) => isFinished(c) === finished).map(entry).sort(newestFirst);
  return { running: pick(false), finished: pick(true) };
}

// Stubs Schritt 3 (red)
export const chooseCollector = () => { throw new Error('nicht implementiert'); };
export const setGameEnd = () => { throw new Error('nicht implementiert'); };
