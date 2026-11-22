// Prototyp der Wertungsmaske (Basisspiel). Keine Abhängigkeiten, nur Browser-APIs.
// Die Rechenlogik liegt in src/core und ist dort getestet.

import {
  ORDER_TYPES, FLAG_TYPES, LONGEST_TYPES, TYPE_LABELS, BONUSES,
  createScoresheet, computeTotals, validateScoresheet,
} from '../src/core/scoresheet.js';
import { highscoreRow } from '../src/core/highscore.js';
import { activeBonusIds } from '../src/core/unlocks.js';
import { ACHIEVEMENTS, evaluateAchievements } from '../src/core/achievements.js';
import { campaignResults, nextGameNumber } from '../src/core/campaign.js';

const STORAGE_KEY = 'dorfromantik-demo-kampagne';
const emptyCampaign = () => ({ sheets: [], unlocks: {}, received: [] });

function loadCampaign() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored ? { ...emptyCampaign(), ...stored } : emptyCampaign();
  } catch {
    return emptyCampaign();
  }
}

function saveCampaign() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaign));
  } catch {
    // Speicher nicht verfügbar: Daten bleiben nur bis zum Neuladen erhalten.
  }
}

let campaign = loadCampaign();
let sheet;

const $ = (sel) => document.querySelector(sel);
const today = () => new Date().toISOString().slice(0, 10);

function numberField(label, value, onInput, disabled = false) {
  const wrapper = document.createElement('label');
  wrapper.textContent = label;
  const input = document.createElement('input');
  // 0 als leeres Feld mit Platzhalter zeigen, damit man nicht "010" tippt.
  Object.assign(input, { type: 'number', min: 0, step: 1, inputMode: 'numeric', placeholder: '0', value: value === 0 ? '' : value, disabled });
  input.addEventListener('input', () => {
    onInput(input.value === '' ? 0 : Number(input.value));
    update();
  });
  wrapper.append(input);
  return wrapper;
}

function newSheet() {
  const gameNumber = nextGameNumber(campaign.sheets);
  sheet = createScoresheet({
    gameNumber,
    date: today(),
    unlockedBonusIds: activeBonusIds(campaign.unlocks, gameNumber),
  });
  renderSheet();
}

function renderSheet() {
  $('#game-number').textContent = `Spiel ${sheet.gameNumber}`;
  $('#game-date').textContent = sheet.date;
  $('#sheet').players.value = sheet.players;

  $('#orders').replaceChildren(...ORDER_TYPES.map((t) =>
    numberField(TYPE_LABELS[t], sheet.orders[t], (v) => { sheet.orders[t] = v; })));
  $('#flags').replaceChildren(...FLAG_TYPES.map((t) =>
    numberField(`Fahnen ${TYPE_LABELS[t]}`, sheet.flags[t], (v) => { sheet.flags[t] = v; })));
  $('#longest').replaceChildren(...LONGEST_TYPES.map((t) =>
    numberField(`Längstes ${TYPE_LABELS[t]}`, sheet.longest[t], (v) => { sheet.longest[t] = v; })));

  renderBonuses();
}

// Nur Bereich E neu aufbauen, damit Eingaben und Fokus in B–D erhalten bleiben.
function renderBonuses() {
  $('#bonuses').replaceChildren(...BONUSES.map(({ id, label, hint }) => {
    const bonus = sheet.bonuses[id];
    const row = document.createElement('div');
    row.className = bonus.unlocked ? 'bonus' : 'bonus locked';
    const check = document.createElement('input');
    Object.assign(check, { type: 'checkbox', checked: bonus.unlocked, disabled: true, title: 'freigespielt' });
    const field = numberField(`${label} (${hint})`, bonus.points, (v) => { bonus.points = v; }, !bonus.unlocked);
    row.append(check, field);
    return row;
  }));
  update();
}

function update() {
  const { s1, s2, s3, total } = computeTotals(sheet);
  $('#s1').value = s1;
  $('#s2').value = s2;
  $('#s3').value = s3;
  $('#total').value = total;
  const errors = validateScoresheet(sheet);
  $('#errors').replaceChildren(...errors.map((e) => Object.assign(document.createElement('li'), { textContent: e })));
  if (errors.length === 0) {
    const row = highscoreRow(total);
    $('#row-info').textContent = `Zeile ${row.min}${row.title ? ` (${row.title})` : ''} → ${row.crosses} Kreuz(e) im Fortschrittsbaum`;
  } else {
    $('#row-info').textContent = '';
  }
}

function unlockRow(id, label, { receivable = false, title = '' } = {}) {
  const row = document.createElement('div');
  row.className = 'unlock';
  row.title = title;
  if (receivable) {
    const check = document.createElement('input');
    Object.assign(check, { type: 'checkbox', checked: campaign.received.includes(id), title: 'Karte erhalten' });
    check.addEventListener('change', () => {
      campaign.received = check.checked
        ? [...new Set([...campaign.received, id])]
        : campaign.received.filter((r) => r !== id);
      saveCampaign();
    });
    row.append(check);
  }
  const field = numberField(label, campaign.unlocks[id] ?? '', (v) => {
    campaign.unlocks[id] = v > 0 ? v : null;
    saveCampaign();
  });
  field.querySelector('input').addEventListener('change', refreshUnlocked);
  row.append(field);
  return row;
}

function renderCampaign() {
  const { rows, totalCrosses } = campaignResults(campaign.sheets);
  $('#crosses').textContent = totalCrosses;
  $('#results tbody').replaceChildren(...rows.map((r) => {
    const tr = document.createElement('tr');
    for (const text of [r.min, r.title ?? '', r.crosses, r.gameNumbers.join(', ')]) {
      tr.append(Object.assign(document.createElement('td'), { textContent: text }));
    }
    return tr;
  }));

  $('#unlocks-boxes').replaceChildren(...ACHIEVEMENTS.map((a) =>
    unlockRow(a.id, `${a.label} (S${a.box})`, { receivable: a.kind !== 'board', title: a.condition })));
  const achievementIds = new Set(ACHIEVEMENTS.map((a) => a.id));
  $('#unlocks-board').replaceChildren(...BONUSES.filter((b) => !achievementIds.has(b.id)).map((b) =>
    unlockRow(b.id, b.label)));
}

// Testdaten geändert: Freigespielt-Status des offenen Blatts anpassen, Eingaben behalten.
function refreshUnlocked() {
  const active = new Set(activeBonusIds(campaign.unlocks, sheet.gameNumber));
  for (const [id, bonus] of Object.entries(sheet.bonuses)) {
    bonus.unlocked = active.has(id);
    if (!bonus.unlocked) bonus.points = 0;
  }
  renderBonuses();
}

$('#sheet').players.addEventListener('input', (e) => { sheet.players = e.target.value; });

$('#sheet').addEventListener('submit', (e) => {
  e.preventDefault();
  if (validateScoresheet(sheet).length > 0) return;
  if (!confirm('Ist alles eingetragen?')) return;

  // Erfolgskarten werden am Partieende freigeschaltet, Wirkung ab der nächsten Partie.
  const finished = sheet;
  const { auto, confirm: toConfirm } = evaluateAchievements(finished, {
    received: campaign.received,
    unlockGames: campaign.unlocks,
  });
  const byId = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
  for (const id of auto) campaign.unlocks[id] = finished.gameNumber;
  for (const id of toConfirm) {
    if (confirm(`${byId[id].label}: ${byId[id].condition}. Erfüllt?`)) campaign.unlocks[id] = finished.gameNumber;
  }
  const unlockedNow = [...auto, ...toConfirm].filter((id) => campaign.unlocks[id] === finished.gameNumber);

  campaign.sheets.push(finished);
  saveCampaign();
  renderCampaign();
  newSheet();
  $('#last-unlocks').textContent = unlockedNow.length
    ? `Freigeschaltet in Spiel ${finished.gameNumber}: ${unlockedNow.map((id) => byId[id].label).join(', ')}`
    : '';
});

$('#reset').addEventListener('click', () => {
  if (!confirm('Demo-Kampagne wirklich löschen?')) return;
  campaign = emptyCampaign();
  saveCampaign();
  renderCampaign();
  newSheet();
  $('#last-unlocks').textContent = '';
});

renderCampaign();
newSheet();
