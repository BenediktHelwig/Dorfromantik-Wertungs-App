// Ablaufregeln der Nextcloud-Oberfläche, die im Prototyp nur in web/sakura.js standen:
// Speichersperre bei offener Blütensammler-Wahl und der Eintrag am Partieende.
// Regeln: docs/entscheidungen.md (Schritt 3, Auslegung "Partieende-Eintrag" und "Blütensammler").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScoresheet } from '../src/core/scoresheet.js';
import { createSakuraSheet } from '../src/core/sakura/scoresheet.js';
import { computeSakuraCampaign } from '../src/core/sakura/campaign.js';
import {
  startCampaign, createNextSheet, addSheet, addDecision, chooseCollector, setGameEnd, endCampaign,
} from '../src/core/campaigns.js';
import { canSaveSheet, pendingGameEnd } from '../nextcloud-app/dorfromantik/src/flow.js';
import { optionFor } from './helpers/sakura.js';

const PLAYERS = 'Anna, Ben';

function sheet(gameNumber, points) {
  const s = createSakuraSheet({ gameNumber, date: '2026-11-25' });
  s.players = PLAYERS;
  s.orders.kirschbaum = points;
  return s;
}

const start = (points = 410) => startCampaign({ id: 's1', date: '2026-11-20', variant: 'sakura', firstSheet: sheet(1, points) });
const answer = (c, name) => addDecision(c, optionFor(computeSakuraCampaign(c).pending.options, name));
/** Spiel 1 erreicht Öffnet Box 3: Die Blütensammler-Wahl steht offen. */
const atBoxThree = () => answer(start(), 'See');

/** Kampagne mit gewähltem Blütensammler und einer zweiten Partie, in der Kirschblüten gesammelt wurden. */
function withBlossoms() {
  const [first] = computeSakuraCampaign(atBoxThree()).pending.options;
  const chosen = chooseCollector(atBoxThree(), first);
  const next = createNextSheet(chosen, '2026-11-25');
  next.bonuses.kirschblueten.points = 12;
  return addSheet(chosen, next);
}

const basis = () => {
  const first = createScoresheet({ gameNumber: 1, date: '2026-11-20' });
  first.players = PLAYERS;
  return startCampaign({ id: 'b1', date: '2026-11-20', firstSheet: first });
};

test('Solange die Wahl des Blütensammlers offen ist, kann kein weiteres Blatt gespeichert werden', () => {
  const open = atBoxThree();
  assert.equal(computeSakuraCampaign(open).collectorOpen, true);
  assert.equal(canSaveSheet(open), false);
});

test('Nach der Wahl des Blütensammlers kann wieder gespeichert werden', () => {
  const [first] = computeSakuraCampaign(atBoxThree()).pending.options;
  assert.equal(canSaveSheet(chooseCollector(atBoxThree(), first)), true);
});

test('Eine neue Kampagne und ein laufendes Basisspiel können speichern, eine beendete Kampagne nicht', () => {
  assert.equal(canSaveSheet(null), true);
  assert.equal(canSaveSheet(basis()), true);
  assert.equal(canSaveSheet(endCampaign(basis(), '2026-11-25')), false);
});

test('Nach einem Blatt mit Kirschblüten ist der Eintrag am Partieende offen', () => {
  const end = pendingGameEnd(withBlossoms());
  assert.equal(end?.gameNumber, 2);
  assert.ok(end.received.has('kirschblueten'), 'erhaltene Karten vor der Partie');
  assert.ok(end.flippable instanceof Set);
});

test('Solange der Eintrag am Partieende offen ist, wird kein weiteres Blatt gespeichert', () => {
  assert.equal(canSaveSheet(withBlossoms()), false);
});

test('Wird die Kampagne vor dem Eintrag geschlossen, fragt die App beim Öffnen erneut', () => {
  const reopened = JSON.parse(JSON.stringify(withBlossoms()));
  assert.equal(pendingGameEnd(reopened)?.gameNumber, 2);
});

test('Nach "Nichts eintragen" (leerer Eintrag) wird nicht erneut gefragt', () => {
  const done = setGameEnd(withBlossoms(), 2, {});
  assert.equal(pendingGameEnd(done), null);
  assert.equal(canSaveSheet(done), true);
});

test('Ohne Anlass (keine Blüten, kein Kalligraph, keine Bestätigung) gibt es keinen Dialog', () => {
  assert.equal(pendingGameEnd(start(0)), null);
});

test('Beim Basisspiel, bei neuen und bei beendeten Kampagnen gibt es keinen Dialog', () => {
  assert.equal(pendingGameEnd(null), null);
  assert.equal(pendingGameEnd(basis()), null);
  assert.equal(pendingGameEnd({ ...withBlossoms(), endDate: '2026-11-26' }), null);
});
