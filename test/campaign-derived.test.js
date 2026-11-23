// Das Häkchen "freigespielt" im Wertungsblatt ist abgeleitet (Review Schritt 1, Defekt 1):
// Die Kampagne rechnet es aus den Freischaltungen früherer Partien neu und verlässt sich nicht
// auf den gespeicherten Wert. Sonst hinge der Baum an einem Wert, den eine Korrektur verfälscht.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScoresheet } from '../src/core/scoresheet.js';
import { computeCampaign } from '../src/core/campaign.js';

function sheet(gameNumber, points, { unlocked = [], bonuses = {} } = {}) {
  const s = createScoresheet({ gameNumber, date: '2026-11-23', unlockedBonusIds: unlocked });
  s.orders.wald = points;
  for (const [id, p] of Object.entries(bonuses)) s.bonuses[id].points = p;
  return s;
}

test('Ein Bonus, der freigespielt ist, zählt auch bei falsch gespeichertem Häkchen', () => {
  // Spiel 1 öffnet Schachtel 1 (Rote Herzen ab Spiel 2). Das Häkchen in Spiel 2 fehlt im gespeicherten Blatt.
  const c = computeCampaign({
    sheets: [sheet(1, 130), sheet(2, 115, { bonuses: { roteHerzen: 6 } })],
  });
  assert.equal(c.unlockGames.herzenswuensche, 2); // 6 P durch das Herz zählen
  assert.equal(c.rows.find((r) => r.gameNumbers.includes(2)).min, 120); // 115 + 6 = 121, nicht 115 (Zeile 110)
});

test('Ein Bonus, der noch nicht freigespielt ist, zählt nicht, auch wenn das Häkchen gespeichert ist', () => {
  const stale = sheet(1, 130, { unlocked: ['roteHerzen'], bonuses: { roteHerzen: 50 } });
  const c = computeCampaign({ sheets: [stale] });
  assert.equal(c.totalCrosses, 4); // 130 P (Zeile 130), nicht 180 P (Zeile 180 = 6 Kreuze)
  assert.deepEqual(c.rows.find((r) => r.gameNumbers.includes(1)).min, 130);
});

test('Verschiebt eine Korrektur eine Freischaltung, zählen die Boni späterer Blätter danach nicht mehr', () => {
  const later = sheet(2, 100, { unlocked: ['roteHerzen'], bonuses: { roteHerzen: 20 } });
  const before = computeCampaign({ sheets: [sheet(1, 130), later] });
  assert.equal(before.unlockGames.roteHerzen, 1);
  assert.equal(before.rows.find((r) => r.gameNumbers.includes(2)).min, 120); // 100 + 20

  // Spiel 1 wird auf 50 P korrigiert: 1 Kreuz, Schachtel 1 öffnet erst in Spiel 2 (1 + 2 Kreuze), der Bonus
  // gilt also erst ab Spiel 3 und zählt in Spiel 2 nicht, obwohl das gespeicherte Häkchen gesetzt ist.
  const after = computeCampaign({ sheets: [sheet(1, 50), later] });
  assert.equal(after.unlockGames.roteHerzen, 2);
  assert.equal(after.rows.find((r) => r.gameNumbers.includes(2)).min, 100); // nur noch 100 P
});

test('Die gespeicherten Blätter werden dabei nicht verändert', () => {
  const stale = sheet(1, 130, { unlocked: ['roteHerzen'], bonuses: { roteHerzen: 50 } });
  const copy = JSON.parse(JSON.stringify(stale));
  computeCampaign({ sheets: [stale] });
  assert.deepEqual(stale, copy);
});
