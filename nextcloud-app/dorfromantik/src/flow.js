// Ablaufregeln der Oberfläche, die nicht im Kern liegen: Speichersperre und Eintrag am Partieende.
// Regeln: docs/entscheidungen.md (Schritt 3, "Partieende-Eintrag" und "Blütensammler").
// Rein und ohne DOM, getestet in test/nextcloud-flow.test.js. Alles wird aus den Rohdaten abgeleitet.

import { isFinished, isSakura } from '../../../src/core/campaigns.js';
import { computeSakuraCampaign } from '../../../src/core/sakura/campaign.js';
import { SAKURA_ACHIEVEMENTS } from '../../../src/core/sakura/achievements.js';
import { blossomBudget } from '../../../src/core/sakura/blossoms.js';

/**
 * Eintrag am Partieende, der für das zuletzt gespeicherte Blatt noch fehlt. Gefragt wird nur, wenn es etwas
 * einzutragen gibt (Blüten, Kalligraph, Bestätigungen). Solange kein Eintrag gespeichert ist (auch `{}`),
 * kommt die Frage beim Öffnen wieder.
 *
 * @param {object|null} campaign
 * @returns {{ gameNumber: number, received: Set<string>, flippable: Set<string> }|null}
 *   received und flippable = Stand vor dieser Partie
 */
export function pendingGameEnd(campaign) {
  if (!campaign || !isSakura(campaign) || isFinished(campaign)) return null;
  const last = Math.max(...campaign.sheets.map((s) => s.gameNumber));
  if (campaign.gameEnds[last]) return null;

  const computed = computeSakuraCampaign(campaign);
  const { [last]: _open, ...gameEnds } = campaign.gameEnds;
  const before = computeSakuraCampaign({ ...campaign, sheets: campaign.sheets.filter((s) => s.gameNumber < last), gameEnds });

  const sheet = computed.sheets.find((s) => s.gameNumber === last);
  const kalligraph = before.unlockGames.kalligraph;
  const needed = blossomBudget(sheet) > 0
    || (Number.isInteger(kalligraph) && kalligraph < last)
    || SAKURA_ACHIEVEMENTS.some((a) => a.kind === 'confirm' && before.received.has(a.id)
      && !Number.isInteger(computed.unlockGames[a.id]));
  return needed ? { gameNumber: last, received: before.received, flippable: before.flippable[last] } : null;
}

/**
 * Darf ein weiteres Wertungsblatt gespeichert werden? Nicht bei beendeter Kampagne, bei offenem Eintrag am
 * Partieende und solange die Wahl des Blütensammlers offen ist. Die Prüfung des Blatts selbst macht der Kern.
 *
 * @param {object|null} campaign null = neue Kampagne
 */
export function canSaveSheet(campaign) {
  if (!campaign) return true;
  if (isFinished(campaign)) return false;
  if (!isSakura(campaign)) return true;
  return !computeSakuraCampaign(campaign).collectorOpen && pendingGameEnd(campaign) === null;
}
