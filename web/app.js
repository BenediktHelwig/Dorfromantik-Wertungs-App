// Prototyp der Wertungsmaske (Basisspiel). Keine Abhängigkeiten, nur Browser-APIs.
// Die Rechenlogik liegt in src/core und ist dort getestet. Gespeichert werden nur Rohdaten
// (Wertungsblätter, Entscheidungen im Fortschrittsbaum, manuelle Erfüllungen), alles andere
// berechnet computeCampaign bei jeder Änderung neu.

import {
  ORDER_TYPES, FLAG_TYPES, LONGEST_TYPES, TYPE_LABELS, BONUSES,
  createScoresheet, computeTotals, validateScoresheet,
} from '../src/core/scoresheet.js';
import { highscoreRow } from '../src/core/highscore.js';
import { activeBonusIds } from '../src/core/unlocks.js';
import { ACHIEVEMENTS } from '../src/core/achievements.js';
import { computeCampaign } from '../src/core/campaign.js';
import { BASIS_GRAPH as GRAPH, circleId } from '../src/core/progressTree.js';

const STORAGE_KEY = 'dorfromantik-demo-kampagne-v2';
const OLD_STORAGE_KEY = 'dorfromantik-demo-kampagne'; // Prototyp 0.1: speicherte auch Abgeleitetes
const emptyCampaign = () => ({ sheets: [], decisions: [], manualUnlocks: {}, manualReceived: [] });

function loadCampaign() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored) return { ...emptyCampaign(), ...stored };
    // Übernahme aus 0.1: Blätter und manuelle Erfüllungen bleiben, Abgeleitetes wird neu berechnet.
    const old = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY));
    if (old) {
      const manualUnlocks = old.unlocks?.fahnenfest ? { fahnenfest: old.unlocks.fahnenfest } : {};
      return { ...emptyCampaign(), sheets: old.sheets ?? [], manualUnlocks };
    }
  } catch {
    // unlesbare Daten: neu anfangen
  }
  return emptyCampaign();
}

function saveCampaign() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaign));
  } catch {
    // Speicher nicht verfügbar: Daten bleiben nur bis zum Neuladen erhalten.
  }
}

let campaign = loadCampaign();
let computed = computeCampaign(campaign);
let sheet;

const $ = (sel) => document.querySelector(sel);
const today = () => new Date().toISOString().slice(0, 10);
const recompute = () => { computed = computeCampaign(campaign); };
const validate = () => validateScoresheet(sheet, { hearts: computed.hearts[sheet.gameNumber] });

const NODE_LABELS = new Map([[GRAPH.start.id, GRAPH.start.label], ...GRAPH.hexagons.map((h) => [h.id, h.label])]);
const labelOf = (id) => NODE_LABELS.get(id) ?? id;

function numberField(label, value, onInput, disabled = false, event = 'input') {
  const wrapper = document.createElement('label');
  wrapper.textContent = label;
  const input = document.createElement('input');
  // 0 als leeres Feld mit Platzhalter zeigen, damit man nicht "010" tippt.
  Object.assign(input, { type: 'number', min: 0, step: 1, inputMode: 'numeric', placeholder: '0', value: value === 0 ? '' : value, disabled });
  input.addEventListener(event, () => onInput(input.value === '' ? 0 : Number(input.value)));
  wrapper.append(input);
  return wrapper;
}

function newSheet() {
  const gameNumber = computed.nextGameNumber;
  sheet = createScoresheet({
    gameNumber,
    date: today(),
    unlockedBonusIds: activeBonusIds(computed.unlockGames, gameNumber),
  });
  renderSheet();
}

function renderSheet() {
  $('#game-number').textContent = `Spiel ${sheet.gameNumber}`;
  $('#game-date').textContent = sheet.date;
  $('#sheet').players.value = sheet.players;

  const field = (label, obj, key) => numberField(label, obj[key], (v) => { obj[key] = v; update(); });
  $('#orders').replaceChildren(...ORDER_TYPES.map((t) => field(TYPE_LABELS[t], sheet.orders, t)));
  $('#flags').replaceChildren(...FLAG_TYPES.map((t) => field(`Fahnen ${TYPE_LABELS[t]}`, sheet.flags, t)));
  $('#longest').replaceChildren(...LONGEST_TYPES.map((t) => field(`Längstes ${TYPE_LABELS[t]}`, sheet.longest, t)));

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
    const field = numberField(`${label} (${hint})`, bonus.points, (v) => { bonus.points = v; update(); }, !bonus.unlocked);
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
  const errors = validate();
  $('#errors').replaceChildren(...errors.map((e) => Object.assign(document.createElement('li'), { textContent: e })));
  if (errors.length === 0) {
    const row = highscoreRow(total);
    $('#row-info').textContent = `Zeile ${row.min}${row.title ? ` (${row.title})` : ''} → ${row.crosses} Kreuz(e) im Fortschrittsbaum`;
  } else {
    $('#row-info').textContent = '';
  }
}

// ---- Fortschrittsbaum (SVG) ----

const SVG = 'http://www.w3.org/2000/svg';
function svgEl(name, attrs = {}, text) {
  const el = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text !== undefined) el.textContent = text;
  return el;
}

function renderTree() {
  const { tree } = computed;
  const nodes = new Map([[GRAPH.start.id, GRAPH.start], ...GRAPH.hexagons.map((h) => [h.id, h])]);
  const svg = svgEl('svg', { viewBox: '0 0 520 1010', class: 'tree', role: 'img', 'aria-label': 'Fortschrittsbaum' });

  const marker = tree.position.section
    ? circleId(tree.position.section, tree.position.next)
    : null;

  for (const s of GRAPH.sections) {
    const a = nodes.get(s.from);
    const b = nodes.get(s.to);
    svg.append(svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'edge' }));
    for (let i = 1; i <= s.circles; i += 1) {
      const t = i / (s.circles + 1);
      const id = circleId(s.id, i);
      const game = tree.crossed.get(id);
      const cx = a.x + (b.x - a.x) * t;
      const cy = a.y + (b.y - a.y) * t;
      const circle = svgEl('circle', {
        cx, cy, r: s.heart === i ? 8 : 6,
        class: `circle${game !== undefined ? ' crossed' : ''}${s.heart === i ? ' heart' : ''}${id === marker ? ' next' : ''}`,
      });
      circle.append(svgEl('title', {}, `${s.id} #${i}${game !== undefined ? ` (Spiel ${game})` : ''}`));
      svg.append(circle);
      if (s.heart === i) svg.append(svgEl('text', { x: cx, y: cy + 4, class: 'heart-mark' }, '♥'));
    }
  }

  svg.append(svgEl('text', { x: GRAPH.start.x, y: GRAPH.start.y + 4, class: 'hex-label start' }, GRAPH.start.label));
  for (const h of GRAPH.hexagons) {
    const game = tree.reached.get(h.id);
    const atNode = tree.position.node === h.id;
    const g = svgEl('g', { class: `hex${game !== undefined ? ' reached' : ''}${atNode ? ' here' : ''}` });
    g.append(svgEl('polygon', {
      points: [[-52, 0], [-36, -22], [36, -22], [52, 0], [36, 22], [-36, 22]]
        .map(([dx, dy]) => `${h.x + dx},${h.y + dy}`).join(' '),
    }));
    g.append(svgEl('text', { x: h.x, y: h.y + 4, class: 'hex-label' }, h.label));
    g.append(svgEl('title', {}, game !== undefined ? `${h.label}: erreicht in Spiel ${game}` : `${h.label}: noch nicht erreicht`));
    svg.append(g);
  }
  $('#tree').replaceChildren(svg);

  const done = tree.crossed.size;
  const total = GRAPH.sections.reduce((n, s) => n + s.circles, 0);
  $('#tree-summary').textContent =
    `${done} von ${total} Kreisen ausgekreuzt, ${tree.reached.size} von ${GRAPH.hexagons.length} Sechsecken erreicht`
    + (tree.expired ? `, ${tree.expired} Kreuz(e) verfallen` : '');
  renderQuestion();
}

function decide(decision) {
  const { pending } = computed.tree;
  if (pending.rejected) campaign.decisions[campaign.decisions.indexOf(pending.rejected)] = decision;
  else campaign.decisions.push(decision);
  saveCampaign();
  renderAll();
}

function renderQuestion() {
  const { pending } = computed.tree;
  const box = $('#tree-question');
  if (!pending) { box.replaceChildren(); return; }
  const text = document.createElement('p');
  text.textContent = pending.kind === 'fork'
    ? `Spiel ${pending.gameNumber}: ${pending.remaining} Kreuz(e) offen. Wie geht es nach „${labelOf(pending.at)}“ weiter?`
    : `Spiel ${pending.gameNumber}: Alles freigespielt, ${pending.remaining} Kreuz(e) übrig. Restliche Felder füllen (nur Optik) oder verfallen lassen?`;
  const buttons = pending.options.map((o) => Object.assign(document.createElement('button'), {
    type: 'button',
    textContent: pending.kind === 'fork' ? `Richtung ${labelOf(o.toward)}` : `${labelOf(o.at)} → ${labelOf(o.toward)}`,
    onclick: () => decide({ at: o.at, toward: o.toward }),
  }));
  if (pending.kind === 'leftover') {
    buttons.push(Object.assign(document.createElement('button'), {
      type: 'button', textContent: 'Kreuze verfallen lassen', onclick: () => decide({ skip: true }),
    }));
  }
  const rejected = pending.rejected
    ? [Object.assign(document.createElement('p'), { className: 'errors', textContent: 'Die gespeicherte Entscheidung passt nicht mehr zum Pfad, bitte neu wählen.' })]
    : [];
  box.replaceChildren(...rejected, text, ...buttons);
}

// ---- Eure Ergebnisse / Eure Erfolge ----

function entryRow(label, { checked, game, input, title = '' }) {
  const row = document.createElement('div');
  row.className = 'unlock';
  row.title = title;
  const check = Object.assign(document.createElement('input'), { type: 'checkbox', checked, disabled: true });
  const body = input ?? Object.assign(document.createElement('span'), { className: 'entry', textContent: label });
  const num = Object.assign(document.createElement('span'), { className: 'game', textContent: game ?? '–' });
  row.append(check, body, ...(input ? [] : [num]));
  return row;
}

function renderCampaign() {
  $('#crosses').textContent = computed.totalCrosses;
  $('#results tbody').replaceChildren(...computed.rows.map((r) => {
    const tr = document.createElement('tr');
    for (const text of [r.min, r.title ?? '', r.crosses, r.gameNumbers.join(', ')]) {
      tr.append(Object.assign(document.createElement('td'), { textContent: text }));
    }
    return tr;
  }));

  $('#unlocks-boxes').replaceChildren(...ACHIEVEMENTS.map((a) => {
    const checked = computed.received.has(a.id);
    if (a.kind !== 'manual') {
      return entryRow(`${a.label} (S${a.box})`, { checked, game: computed.unlockGames[a.id], title: a.condition });
    }
    // Manuell bestätigte Karte (Fahnenfest): der Spieler trägt die Spielnummer selbst ein.
    const input = numberField(`${a.label} (S${a.box})`, computed.unlockGames[a.id] ?? '', (v) => {
      if (v > 0) campaign.manualUnlocks[a.id] = v;
      else delete campaign.manualUnlocks[a.id];
      saveCampaign();
      renderAll();
    }, false, 'change');
    return entryRow(a.label, { checked, input, title: a.condition });
  }));

  $('#unlocks-board').replaceChildren(...GRAPH.hexagons.filter((h) => h.kind === 'achievement').map((h) =>
    entryRow(h.label, { checked: computed.tree.reached.has(h.id), game: computed.unlockGames[h.id] })));

  const hearts = [...computed.tree.heartGames].sort((a, b) => a - b);
  $('#unlocks-hearts').replaceChildren(...[0, 1, 2].map((i) =>
    entryRow(`Herz-Kreis ${i + 1}`, { checked: hearts[i] !== undefined, game: hearts[i] })));
}

function renderAll() {
  recompute();
  renderCampaign();
  renderTree();
  // Ein Bonus kann sich durch eine Korrektur ändern: Freigespielt-Status des offenen Blatts anpassen, Eingaben behalten.
  if (sheet) {
    const active = new Set(activeBonusIds(computed.unlockGames, sheet.gameNumber));
    for (const [id, bonus] of Object.entries(sheet.bonuses)) {
      bonus.unlocked = active.has(id);
      if (!bonus.unlocked) bonus.points = 0;
    }
    renderBonuses();
  }
}

$('#sheet').players.addEventListener('input', (e) => { sheet.players = e.target.value; });
// Enter im Namensfeld soll das Blatt nicht abschicken, sondern nur das Feld verlassen.
$('#sheet').players.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
});

$('#sheet').addEventListener('submit', (e) => {
  e.preventDefault();
  if (validate().length > 0) return;
  if (!confirm('Ist alles eingetragen?')) return;

  const finished = sheet;
  campaign.sheets.push(finished);
  saveCampaign();
  recompute();
  // Freischaltungen am Partieende (Baum und Erfolgskarten), Wirkung ab der nächsten Partie.
  const unlockedNow = Object.entries(computed.unlockGames)
    .filter(([, game]) => game === finished.gameNumber)
    .map(([id]) => ACHIEVEMENTS.find((a) => a.id === id)?.label ?? labelOf(id));
  sheet = undefined; // das gespeicherte Blatt darf nicht mehr angepasst werden
  renderAll();
  newSheet();
  $('#last-unlocks').textContent = unlockedNow.length
    ? `Freigeschaltet in Spiel ${finished.gameNumber}: ${unlockedNow.join(', ')}`
    : '';
});

$('#reset').addEventListener('click', () => {
  if (!confirm('Demo-Kampagne wirklich löschen?')) return;
  campaign = emptyCampaign();
  saveCampaign();
  sheet = undefined;
  renderAll();
  newSheet();
  $('#last-unlocks').textContent = '';
});

renderAll();
newSheet();
