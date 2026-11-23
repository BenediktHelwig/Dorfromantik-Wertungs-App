// Prototyp-Oberfläche der Variante Sakura (nur zum Ausprobieren, wird später durch die Nextcloud-Oberfläche ersetzt).
// Keine Abhängigkeiten, nur Browser-APIs. Die Rechenlogik liegt in src/core/sakura und ist dort getestet.
// Gespeichert werden nur Rohdaten (Wertungsblätter, Entscheidungen, Blütensammler, Partieende-Einträge,
// manuelle Erfüllungen); alles andere berechnet computeSakuraCampaign bei jeder Änderung neu.

import {
  ORDER_COLUMNS, FLAG_COLUMNS, COLUMN_LABELS, SAKURA_BONUSES,
  createSakuraSheet, computeSakuraTotals, validateSakuraSheet,
} from '../src/core/sakura/scoresheet.js';
import { SAKURA_ACHIEVEMENTS, taskGap } from '../src/core/sakura/achievements.js';
import { SAKURA_GRAPH } from '../src/core/sakura/progressTree.js';
import { computeSakuraCampaign } from '../src/core/sakura/campaign.js';
import { blossomBudget, STAR_CARDS } from '../src/core/sakura/blossoms.js';
import { HIGHSCORE_SAKURA, highscoreRow } from '../src/core/highscore.js';
import {
  startCampaign, campaignName, createNextSheet, addSheet, addDecision, chooseCollector, setGameEnd,
  setManualUnlock, canEndCampaign, endCampaign, isFinished,
} from '../src/core/campaigns.js';

const NO_DATA = { sheets: [], decisions: [], collector: null, gameEnds: {}, manualUnlocks: {} };
const SVG = 'http://www.w3.org/2000/svg';
const NODES = new Map(SAKURA_GRAPH.nodes.map((n) => [n.id, n]));
const ADJACENT = new Map();
for (const e of SAKURA_GRAPH.edges) {
  for (const [x, y] of [[e.a, e.b], [e.b, e.a]]) ADJACENT.set(x, [...(ADJACENT.get(x) ?? []), y]);
}
const LABEL = new Map(SAKURA_ACHIEVEMENTS.map((a) => [a.id, a.label]));

/** Kleine Hilfe zum Bauen von DOM-Knoten (Text nur als textContent). */
function el(tag, props = {}, ...kids) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids.filter((k) => k !== null && k !== undefined && k !== false));
  return node;
}
function svg(name, attrs = {}, text) {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Name des ersten benannten Feldes, wenn man von `at` über `toward` läuft (für die Fragen im Baum). */
function firstNamed(at, toward) {
  let prev = at;
  let cur = toward;
  while (['circle', 'star'].includes(NODES.get(cur).type)) {
    const next = ADJACENT.get(cur).find((n) => n !== prev);
    prev = cur;
    cur = next;
  }
  return NODES.get(cur).label ?? cur;
}

function numberField(label, value, onInput, { disabled = false, event = 'input' } = {}) {
  const input = el('input', { type: 'number', min: 0, step: 1, inputMode: 'numeric', placeholder: '0', value: value === 0 ? '' : value, disabled });
  input.addEventListener(event, () => onInput(input.value === '' ? 0 : Number(input.value)));
  return el('label', { textContent: label }, input);
}

function checkbox(label, checked, onChange, disabled = false) {
  const input = el('input', { type: 'checkbox', checked, disabled });
  input.addEventListener('change', () => onChange(input.checked));
  return el('label', { className: 'inline' }, input, label);
}

/**
 * Zeigt eine Sakura-Kampagne (oder, bei `campaign` = null, eine neue mit leerem Blatt für Spiel 1).
 * @param {HTMLElement} host Container des Bildschirms
 * @param {{ campaign: object|null, persist: (c: object) => void, back: () => void, remove: (id: string) => void,
 *   newId: () => string, today: () => string }} env
 */
export function openSakura(host, env) {
  let { campaign } = env;
  let computed = computeSakuraCampaign(campaign ?? NO_DATA);
  let sheet = null;
  let ending = null; // Partieende-Dialog: { gameNumber, received, draft }
  const readOnly = () => campaign !== null && isFinished(campaign);

  const commit = (next) => { campaign = next; env.persist(next); };
  const recompute = () => { computed = computeSakuraCampaign(campaign ?? NO_DATA); };

  function newSheet() {
    sheet = campaign
      ? createNextSheet(campaign, env.today())
      : createSakuraSheet({ gameNumber: 1, date: env.today() });
  }

  function renderAll() {
    recompute();
    if (!readOnly() && !ending) {
      if (!sheet) newSheet();
      else syncSheet();
    }
    host.replaceChildren(renderHeader(), el('main', {},
      el('div', {}, renderQuestions(), ending ? renderGameEnd() : null, !readOnly() && !ending ? renderSheet() : null),
      el('aside', {}, renderResults(), renderTree(), renderAchievements())));
    if (sheet && !ending && !readOnly()) update();
  }

  /** Eine Antwort kann Spalten und Einträge des offenen Blatts verändern: Freigabe neu setzen, Eingaben behalten. */
  function syncSheet() {
    const open = campaign ? computed.unlockedForNext : { bonusIds: [], columns: [] };
    for (const [id, bonus] of Object.entries(sheet.bonuses)) {
      bonus.unlocked = open.bonusIds.includes(id);
      if (!bonus.unlocked) bonus.points = 0;
    }
    for (const column of Object.keys(sheet.columns)) {
      sheet.columns[column] = open.columns.includes(column);
      if (!sheet.columns[column]) { sheet.orders[column] = 0; if (column in sheet.flags) sheet.flags[column] = 0; }
    }
  }

  function renderHeader() {
    const header = el('header', {},
      el('button', { type: 'button', textContent: '← Kampagnen', onclick: env.back }),
      el('h1', {}, `${campaign ? campaignName(campaign) : 'Neue Kampagne'} · ${readOnly() ? '(beendet, nur ansehen)' : `Wertungsblatt Spiel ${computed.nextGameNumber}`}`),
      el('p', { className: 'meta', textContent: `Kampagne gespielt von ${campaign ? campaign.startDate : env.today()} bis ${campaign?.endDate ?? '…'} · Sakura · Prototyp` }));
    if (campaign) {
      const canEnd = canEndCampaign(campaign);
      const end = el('button', {
        type: 'button', textContent: 'Kampagne beenden', hidden: readOnly(), disabled: !canEnd || ending !== null,
        onclick: () => {
          if (!confirm('Kampagne beenden? Bist du sicher? Danach kann sie nur noch angesehen und gelöscht werden.')) return;
          commit(endCampaign(campaign, env.today()));
          renderAll();
        },
      });
      const del = el('button', {
        type: 'button', textContent: 'Kampagne löschen',
        onclick: () => { if (confirm('Kampagne wirklich löschen? Bist du sicher? Das lässt sich nicht rückgängig machen.')) env.remove(campaign.id); },
      });
      header.append(el('p', { className: 'actions' }, end, del),
        el('p', { className: 'hint', textContent: !readOnly() && !canEnd && !ending ? 'Beenden geht erst, wenn die offene Frage beantwortet ist.' : '' }));
    }
    return header;
  }

  // ---- Fragen: Gabelung, Restfelder, Blütensammler ----

  function renderQuestions() {
    const { pending } = computed;
    const box = el('section', { className: 'question' });
    if (!pending || readOnly()) return box;
    if (pending.kind === 'collector') {
      box.append(el('p', { textContent: 'Kirschblüten sind freigeschaltet. Welchen Blütensammler wählst du?' }),
        ...pending.options.map((id) => el('button', {
          type: 'button', textContent: LABEL.get(id), title: SAKURA_ACHIEVEMENTS.find((a) => a.id === id).condition,
          onclick: () => { commit(chooseCollector(campaign, id)); renderAll(); },
        })));
      return box;
    }
    const track = pending.track === 'star' ? 'Blütenpfad' : 'Kreispfad';
    box.append(el('p', {
      textContent: pending.kind === 'fork'
        ? `${track}, Spiel ${pending.gameNumber}: ${pending.remaining} Kreuz(e) offen. Wie geht es nach „${NODES.get(pending.at).label ?? pending.at}“ weiter?`
        : `${track}, Spiel ${pending.gameNumber}: Pfadende erreicht, ${pending.remaining} Kreuz(e) übrig. In welchen freien Abschnitt?`,
    }));
    if (pending.rejected) box.prepend(el('p', { className: 'errors', textContent: 'Die gespeicherte Entscheidung passt nicht mehr zum Pfad, bitte neu wählen.' }));
    for (const option of pending.options) {
      box.append(el('button', {
        type: 'button', textContent: `Richtung ${firstNamed(option.at, option.toward)}`,
        onclick: () => { commit(addDecision(campaign, { at: option.at, toward: option.toward })); renderAll(); },
      }));
    }
    return box;
  }

  // ---- Wertungsblatt ----

  function renderSheet() {
    const form = el('form', { id: 'sakura-sheet', noValidate: true });
    const players = el('input', { type: 'text', autocomplete: 'off', value: sheet.players, disabled: campaign !== null });
    players.addEventListener('input', () => { sheet.players = players.value; });
    players.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); players.blur(); } });
    form.append(el('label', { className: 'players', textContent: 'Mitspielende' }, players,
      el('span', { className: 'hint', textContent: campaign ? 'ab Spiel 2 fest übernommen' : 'Pflicht, gibt der Kampagne den Namen' })));

    const field = (label, obj, key, disabled = false) => numberField(label, obj[key], (v) => { obj[key] = v; update(); }, { disabled });
    form.append(
      el('section', {}, el('h2', { textContent: 'Aufträge' }),
        el('div', { className: 'grid' }, ...ORDER_COLUMNS.map((c) => field(COLUMN_LABELS[c], sheet.orders, c, c in sheet.columns && !sheet.columns[c]))),
        el('p', { className: 'subtotal' }, 'S1 = ', el('output', { id: 'sk-s1', value: 0 }))),
      el('section', {}, el('h2', { textContent: 'Fahnen (Straße und Fluss: längste, Rundum: +2 / +4)' }),
        el('div', { className: 'grid' }, ...FLAG_COLUMNS.map((c) => field(COLUMN_LABELS[c], sheet.flags, c, c in sheet.columns && !sheet.columns[c]))),
        el('p', { className: 'subtotal' }, 'S2 = ', el('output', { id: 'sk-s2', value: 0 }))),
      el('section', {}, el('h2', { textContent: 'Freigespielt' }),
        el('div', { className: 'bonuses' }, ...SAKURA_BONUSES.map(({ id, label, hint }) => {
          const bonus = sheet.bonuses[id];
          return el('div', { className: bonus.unlocked ? 'bonus' : 'bonus locked' },
            el('input', { type: 'checkbox', checked: bonus.unlocked, disabled: true, title: 'freigespielt' }),
            numberField(`${label} (${hint})`, bonus.points, (v) => { bonus.points = v; update(); }, { disabled: !bonus.unlocked }));
        })),
        el('p', { className: 'subtotal' }, 'S3 = ', el('output', { id: 'sk-s3', value: 0 }))),
    );

    const usable = computed.activatable[sheet.gameNumber] ?? new Set();
    const cards = STAR_CARDS.filter((id) => usable.has(id) || sheet.activated.includes(id));
    if (cards.length > 0) {
      form.append(el('section', {}, el('h2', { textContent: '*-Karten in dieser Partie einsetzen' }),
        ...cards.map((id) => checkbox(LABEL.get(id), sheet.activated.includes(id), (on) => {
          sheet.activated = on ? [...sheet.activated, id] : sheet.activated.filter((x) => x !== id);
          update();
        }))));
    }

    form.append(el('section', { className: 'result' },
      el('p', {}, 'Ergebnis = ', el('output', { id: 'sk-total', value: 0 })),
      el('p', { id: 'sk-row' }), el('ul', { id: 'sk-errors', className: 'errors' }),
      el('button', { type: 'submit', textContent: 'Wertung speichern', disabled: computed.collectorOpen }),
      el('p', { className: 'hint', textContent: computed.collectorOpen ? 'Bitte zuerst den Blütensammler wählen.' : '' })));
    form.addEventListener('submit', (e) => { e.preventDefault(); save(); });
    return form;
  }

  function errors() {
    const list = validateSakuraSheet(sheet, { activatable: computed.activatable[sheet.gameNumber] });
    if (!campaign && sheet.players.trim() === '') list.unshift('Mitspielende: bitte eintragen, sie geben der Kampagne den Namen');
    return list;
  }

  function update() {
    const { s1, s2, s3, total } = computeSakuraTotals(sheet);
    host.querySelector('#sk-s1').value = s1;
    host.querySelector('#sk-s2').value = s2;
    host.querySelector('#sk-s3').value = s3;
    host.querySelector('#sk-total').value = total;
    const list = errors();
    host.querySelector('#sk-errors').replaceChildren(...list.map((text) => el('li', { textContent: text })));
    const row = highscoreRow(total, HIGHSCORE_SAKURA);
    host.querySelector('#sk-row').textContent = list.length === 0
      ? `Zeile ${row.min}${row.title ? ` (${row.title})` : ''} → ${row.crosses} Kreuz(e) auf dem Kreispfad` : '';
  }

  function save() {
    if (computed.collectorOpen || errors().length > 0 || !confirm('Ist alles eingetragen?')) return;
    const finished = sheet;
    const before = computed;
    commit(campaign
      ? addSheet(campaign, finished)
      : startCampaign({ id: env.newId(), date: env.today(), firstSheet: finished, variant: 'sakura' }));
    sheet = null;
    recompute();
    ending = endingFor(finished.gameNumber, before);
    renderAll();
  }

  /** Partieende-Dialog für ein Spiel, falls es etwas einzutragen gibt (Blüten, Kalligraph, Bestätigungen). */
  function endingFor(gameNumber, before) {
    const norm = computed.sheets.find((s) => s.gameNumber === gameNumber);
    const needsDialog = blossomBudget(norm) > 0
      || Number.isInteger(before.unlockGames.kalligraph) && before.unlockGames.kalligraph < gameNumber
      || SAKURA_ACHIEVEMENTS.some((a) => a.kind === 'confirm' && before.received.has(a.id) && !Number.isInteger(computed.unlockGames[a.id]));
    return needsDialog ? { gameNumber, received: before.received, flippable: before.flippable[gameNumber], draft: {} } : null;
  }

  // ---- Partieende: Kalligraph und Blüten-Dialog ----

  function renderGameEnd() {
    const { gameNumber, received, flippable, draft } = ending;
    const norm = computed.sheets.find((s) => s.gameNumber === gameNumber);
    const budget = blossomBudget(norm);
    const kalligraphActive = Number.isInteger(computed.unlockGames.kalligraph) && computed.unlockGames.kalligraph < gameNumber;
    const preview = () => computeSakuraCampaign({ ...campaign, gameEnds: { ...campaign.gameEnds, [gameNumber]: draft } }).gameEndResults[gameNumber];
    const section = el('section', { className: 'question' }, el('h2', { textContent: `Spiel ${gameNumber}: Partieende` }));
    const status = el('p', { className: 'hint' });
    const refresh = () => {
      const r = preview();
      status.replaceChildren(`Ausgabe-Budget: ${r.budget} Blüten, ausgegeben: ${r.spent}, Rest verfällt: ${Math.max(0, r.budget - r.spent)}`,
        ...r.errors.map((e) => el('div', { className: 'errors', textContent: e })));
      saveButton.disabled = r.errors.length > 0;
    };
    const set = (patch) => { Object.assign(draft, patch); refresh(); };
    const list = (key, id, on) => set({ [key]: on ? [...(draft[key] ?? []), id] : (draft[key] ?? []).filter((x) => x !== id) });

    if (kalligraphActive) {
      const k = () => draft.kalligraph ?? {};
      section.append(el('h3', { textContent: 'Kalligraph' }),
        checkbox('Der Kalligraph ist komplett von Plättchen umgeben', Boolean(k().surrounded), (on) => set({ kalligraph: { ...k(), surrounded: on } })),
        checkbox('1 zusätzliches Feld auf dem Kreispfad nutzen', Boolean(k().extra), (on) => set({ kalligraph: { ...k(), extra: on } })),
        numberField('Weitere Felder für je 10 Blüten', k().paid ?? 0, (v) => set({ kalligraph: { ...k(), paid: v } })));
    }
    if (budget > 0) {
      section.append(el('h3', { textContent: 'Kirschblüten ausgeben' }),
        numberField('Sterne auf dem Blütenpfad (1 Blüte je Stern)', draft.stars ?? 0, (v) => set({ stars: v })),
        checkbox('Stern 30 auskreuzen (30 Blüten auf einmal)', Boolean(draft.bigStar), (on) => set({ bigStar: on })),
        numberField('Freie Ausgabe (Sonderplättchen)', draft.freeSpend ?? 0, (v) => set({ freeSpend: v })));
    }
    const open = SAKURA_ACHIEVEMENTS.filter((a) => (a.kind === 'auto' || a.kind === 'confirm') && received.has(a.id)
      && !Number.isInteger(computed.unlockGames[a.id]));
    for (const a of open) {
      const gap = taskGap(a.id, norm);
      if (a.kind === 'confirm') section.append(checkbox(`${a.label}: erfüllt (${a.condition})`, (draft.confirmed ?? []).includes(a.id), (on) => list('confirmed', a.id, on)));
      if (budget > 0 && typeof gap === 'number' && gap > 0) {
        section.append(checkbox(`${a.label}: ${gap} fehlende Punkte mit Blüten auffüllen`, (draft.fills ?? []).includes(a.id), (on) => list('fills', a.id, on)));
      }
    }
    const flips = [...flippable];
    if (budget > 0 && flips.length > 0) {
      section.append(el('h3', { textContent: '*-Karten umdrehen (5 Blüten)' }),
        ...flips.map((id) => checkbox(LABEL.get(id), (draft.flips ?? []).includes(id), (on) => list('flips', id, on))));
    }
    const saveButton = el('button', { type: 'button', textContent: 'Eintrag speichern' });
    saveButton.addEventListener('click', () => {
      try { commit(setGameEnd(campaign, gameNumber, draft)); } catch (e) { alert(e.message); return; }
      ending = null;
      renderAll();
    });
    // "Nichts eintragen" speichert einen leeren Eintrag, damit der Dialog nicht bei jedem Öffnen wiederkommt.
    const skip = el('button', {
      type: 'button', textContent: 'Nichts eintragen, weiter',
      onclick: () => { commit(setGameEnd(campaign, gameNumber, {})); ending = null; renderAll(); },
    });
    section.append(status, saveButton, ' ', skip);
    refresh();
    return section;
  }

  // ---- Eure Ergebnisse, Baum, Erfolge ----

  function renderResults() {
    return el('section', {}, el('h2', { textContent: 'Eure Ergebnisse' }),
      el('p', {}, 'Kreuze gesamt: ', el('strong', { textContent: computed.totalCrosses })),
      el('table', {}, el('thead', {}, el('tr', {}, ...['Zeile', 'Titel', 'Kreuze', 'Spiele'].map((t) => el('th', { textContent: t })))),
        el('tbody', {}, ...computed.rows.map((r) => el('tr', {}, ...[r.min, r.title ?? '', r.crosses, r.gameNumbers.join(', ')].map((t) => el('td', { textContent: t })))))));
  }

  function renderTree() {
    const xs = SAKURA_GRAPH.nodes.map((n) => n.x);
    const ys = SAKURA_GRAPH.nodes.map((n) => n.y);
    const pad = 70;
    const [x0, y0] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
    const picture = svg('svg', {
      viewBox: `${x0} ${y0} ${Math.max(...xs) - x0 + pad} ${Math.max(...ys) - y0 + pad}`, class: 'tree', role: 'img', 'aria-label': 'Fortschrittsbaum Sakura',
    });
    for (const e of SAKURA_GRAPH.edges) {
      const [a, b] = [NODES.get(e.a), NODES.get(e.b)];
      picture.append(svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'edge' }));
    }
    const crossed = new Map([...computed.trees.path.crossed, ...computed.trees.star.crossed]);
    for (const n of SAKURA_GRAPH.nodes) {
      const game = n.id === 'Blüte30' ? computed.bigStarGame : crossed.get(n.id);
      const done = game !== null && game !== undefined;
      const named = !['circle', 'star'].includes(n.type);
      const shape = named || n.type === 'bigstar'
        ? svg('rect', { x: n.x - 13, y: n.y - 13, width: 26, height: 26, rx: n.type === 'hex' ? 13 : 3, class: `circle${done ? ' crossed' : ''}` })
        : svg('circle', { cx: n.x, cy: n.y, r: 7, class: `circle${done ? ' crossed' : ''}${n.type === 'star' ? ' blossom' : ''}` });
      shape.append(svg('title', {}, `${n.label ?? n.id}${done ? ` (Spiel ${game})` : ''}`));
      picture.append(shape);
      if (named || n.type === 'bigstar') picture.append(svg('text', { x: n.x + 18, y: n.y + 5, class: 'hex-label sk-label' }, n.label ?? n.id));
    }
    const ended = (t) => (t.ended ? ', Ende erreicht' : '');
    return el('section', {}, el('h2', { textContent: 'Fortschrittsbaum' }),
      el('p', { className: 'hint', textContent: `Kreispfad: ${computed.trees.path.crossed.size} Felder${ended(computed.trees.path)}${computed.trees.path.expired ? `, ${computed.trees.path.expired} Kreuz(e) verfallen` : ''} · Blütenpfad: ${computed.trees.star.crossed.size} Felder${ended(computed.trees.star)}` }),
      el('div', { id: 'sk-tree' }, picture));
  }

  function renderAchievements() {
    const received = (a) => computed.received.has(a.id) || Number.isInteger(computed.unlockGames[a.id]);
    const rows = (box) => SAKURA_ACHIEVEMENTS.filter((a) => a.box === box).map((a) => {
      const game = computed.unlockGames[a.id];
      const check = el('input', { type: 'checkbox', checked: received(a), disabled: true });
      if (a.kind === 'manual') {
        const input = numberField(a.label, game ?? '', (v) => { commit(setManualUnlock(campaign, a.id, v > 0 ? v : null)); renderAll(); },
          { disabled: readOnly() || !campaign || !received(a), event: 'change' });
        return el('div', { className: 'unlock', title: a.condition }, check, input);
      }
      return el('div', { className: 'unlock', title: a.condition }, check, el('span', { className: 'entry', textContent: a.label }),
        el('span', { className: 'game', textContent: game ?? '–' }));
    });
    return el('section', {}, el('h2', { textContent: 'Eure Erfolge' }),
      el('p', { className: 'hint', textContent: 'Häkchen = Karte erhalten. Zahl = Spielnummer der Freischaltung, wirkt ab dem nächsten Spiel. Fahrt mit der Maus über einen Eintrag für die Aufgabe. Badende Affen, Sackgasse usw. trägst du selbst ein.' }),
      ...[1, 2, 3, 4, 5, 6].flatMap((box) => [el('h3', { textContent: `Box ${box}${box === 4 ? ' (Aufbewahrung, Inhalt über den Bogen)' : ''}` }), el('div', { className: 'unlocks' }, ...rows(box))]),
      el('p', { className: 'hint', textContent: computed.collectorOpen || !campaign?.collector ? '' : `Blütensammler: ${LABEL.get(campaign.collector)}` }));
  }

  // Wurde die Kampagne vor dem Eintrag am Partieende geschlossen, fragt die Oberfläche erneut.
  if (campaign && !readOnly()) {
    const last = Math.max(...campaign.sheets.map((s) => s.gameNumber));
    if (!campaign.gameEnds[last]) {
      const { [last]: _open, ...gameEnds } = campaign.gameEnds;
      const before = computeSakuraCampaign({ ...campaign, sheets: campaign.sheets.filter((s) => s.gameNumber < last), gameEnds });
      ending = endingFor(last, before);
    }
  }
  renderAll();
}

