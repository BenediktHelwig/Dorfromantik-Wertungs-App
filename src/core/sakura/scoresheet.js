// Wertungsblatt der Variante Sakura: Felder, Summen, Prüfung.
// Spezifikation: docs/wertungsblatt-sakura.md, docs/entscheidungen.md (Schritt 3, Punkte 3 und 10).
//
// Der Spieler trägt alle Zellen von Hand ein, die App rechnet die Summen. Freigespielte Einträge und die
// Spalten Rundum und 7er-Aufträge sind erst ab der Partie nach ihrer Freischaltung offen (campaign.js
// bestimmt das beim Nachrechnen, das gespeicherte Häkchen wird nicht gelesen).

/** Spalten der Zeile "Aufträge" (Spalte 7 "7er-Aufträge" hat keine Fahnenzelle). */
export const ORDER_COLUMNS = Object.freeze(['kirschbaum', 'reis', 'dorf', 'strasse', 'fluss', 'rundum', 'sieben']);
/** Zeile "Fahnen": Straße und Fluss = längste, Rundum = Bonus für längste Straße/Fluss (+2 / +4). */
export const FLAG_COLUMNS = Object.freeze(['kirschbaum', 'reis', 'dorf', 'strasse', 'fluss', 'rundum']);

export const COLUMN_LABELS = Object.freeze({
  kirschbaum: 'Kirschbaum',
  reis: 'Reisfeld',
  dorf: 'Dorf',
  strasse: 'Straße',
  fluss: 'Fluss',
  rundum: 'Rundum',
  sieben: '7er-Aufträge',
});

/** Spalten, die erst freigeschaltet werden müssen: Rundum (Box 1) und 7er-Aufträge (Box 5). */
export const LOCKABLE_COLUMNS = Object.freeze(['rundum', 'sieben']);

/** Höchstens so viele Kirschblüten werden pro Partie gesammelt. */
export const MAX_BLOSSOMS = 50;

/**
 * Freigespielt-Einträge (14). Die id entspricht der Erfolgskarte in "Eure Erfolge".
 * @type {readonly {id: string, label: string, hint: string}[]}
 */
export const SAKURA_BONUSES = Object.freeze([
  { id: 'kirschblueten', label: 'Kirschblüten (gesammelt)', hint: '1 je Blüte, max. 50' },
  { id: 'tempel', label: 'Tempel', hint: 'passend umschlossen = 6' },
  { id: 'heisseQuellen', label: 'Heiße Quellen', hint: 'abgeschlossen = 3, 3 je Rundumauftrag' },
  { id: 'bruecken', label: 'Brücken', hint: 'längster Fluss = 5 je Brücke' },
  { id: 'tore', label: 'Tore', hint: 'längste Straße = 5 je Tor' },
  { id: 'einsiedler', label: 'Einsiedler', hint: '3 je freier Kante' },
  { id: 'sternwarte', label: 'Sternwarte', hint: '3 je abgeschlossenem Fahnengebiet' },
  { id: 'kartograph', label: 'Kartograph', hint: 'Blickrichtung = 2 je Auftrag' },
  { id: 'sumoringer', label: 'Sumoringer', hint: '1 je passender Kante' },
  { id: 'moossammlerin', label: 'Moossammlerin', hint: '1 je passender Kante' },
  { id: 'reisbaeuerin', label: 'Reisbäuerin', hint: '1 je passender Kante' },
  { id: 'schiffAnlegestelle', label: 'Schiff-Anlegestelle', hint: '1 je Plättchen dazwischen' },
  { id: 'ochsenkarrenHandelsposten', label: 'Ochsenkarren-Handelsposten', hint: '1 je Plättchen dazwischen' },
  { id: 'poet', label: 'Poet', hint: '3 je Wiesenkante' },
]);

const zeroMap = (keys) => Object.fromEntries(keys.map((k) => [k, 0]));

/**
 * Neues, leeres Wertungsblatt.
 * @param {{ gameNumber: number, date: string, unlockedBonusIds?: Iterable<string>,
 *   unlockedColumns?: Iterable<'rundum'|'sieben'> }} opts
 */
export function createSakuraSheet({ gameNumber, date, unlockedBonusIds = [], unlockedColumns = [] }) {
  const unlocked = new Set(unlockedBonusIds);
  const columns = new Set(unlockedColumns);
  return {
    gameNumber,
    date,
    players: '',
    orders: zeroMap(ORDER_COLUMNS),
    flags: zeroMap(FLAG_COLUMNS),
    columns: Object.fromEntries(LOCKABLE_COLUMNS.map((c) => [c, columns.has(c)])),
    bonuses: Object.fromEntries(SAKURA_BONUSES.map((b) => [b.id, { unlocked: unlocked.has(b.id), points: 0 }])),
    activated: [], // in dieser Partie eingesetzte *-Karten (Geschenk, Reiskuchen, Umtrunk)
  };
}

const sum = (values) => values.reduce((a, b) => a + b, 0);
const open = (sheet, column) => !LOCKABLE_COLUMNS.includes(column) || sheet.columns[column] === true;

/**
 * Summen S1 (Aufträge), S2 (Fahnen), S3 (Freigespielt inkl. Kirschblüten) und Ergebnis.
 * Punkte nicht freigespielter Einträge und gesperrter Spalten zählen nicht.
 */
export function computeSakuraTotals(sheet) {
  const s1 = sum(ORDER_COLUMNS.filter((c) => open(sheet, c)).map((c) => sheet.orders[c]));
  const s2 = sum(FLAG_COLUMNS.filter((c) => open(sheet, c)).map((c) => sheet.flags[c]));
  const s3 = sum(Object.values(sheet.bonuses).filter((b) => b.unlocked).map((b) => b.points));
  return { s1, s2, s3, total: s1 + s2 + s3 };
}

/** Aufträge plus Fahne einer Spalte (für die Blütensammler: Dorf, Straße, Fluss, Kirschbaum, Reis). */
export const columnTotal = (sheet, column) => sheet.orders[column] + sheet.flags[column];

const isCount = (v) => Number.isInteger(v) && v >= 0;

/**
 * Prüft ein Wertungsblatt. Gibt eine Liste von Fehlermeldungen zurück (leer = gültig).
 * @param {object} sheet
 * @param {{ activatable?: Set<string> }} [context] activatable = einsetzbare *-Karten dieser Partie
 * @returns {string[]}
 */
export function validateSakuraSheet(sheet, { activatable } = {}) {
  const errors = [];
  const check = (value, label) => {
    if (!isCount(value)) errors.push(`${label}: ganze Zahl ≥ 0 erwartet`);
  };
  ORDER_COLUMNS.forEach((c) => check(sheet.orders[c], `Aufträge ${COLUMN_LABELS[c]}`));
  FLAG_COLUMNS.forEach((c) => check(sheet.flags[c], `Fahnen ${COLUMN_LABELS[c]}`));
  for (const column of LOCKABLE_COLUMNS) {
    const used = sheet.orders[column] !== 0 || (column in sheet.flags && sheet.flags[column] !== 0);
    if (!open(sheet, column) && used) errors.push(`${COLUMN_LABELS[column]}: noch nicht freigespielt, Felder müssen 0 sein`);
  }
  for (const { id, label } of SAKURA_BONUSES) {
    const bonus = sheet.bonuses[id];
    check(bonus.points, label);
    if (!bonus.unlocked && bonus.points !== 0) errors.push(`${label}: noch nicht freigespielt, Punkte müssen 0 sein`);
  }
  if (sheet.bonuses.kirschblueten.points > MAX_BLOSSOMS) {
    errors.push(`Kirschblüten (gesammelt): höchstens ${MAX_BLOSSOMS} pro Partie`);
  }
  if (activatable) {
    for (const id of sheet.activated ?? []) {
      if (!activatable.has(id)) errors.push(`${STAR_CARD_LABELS[id] ?? id}: kann in dieser Partie nicht eingesetzt werden`);
    }
  }
  return errors;
}

const STAR_CARD_LABELS = Object.freeze({ geschenk: 'Geschenk', reiskuchen: 'Reiskuchen', umtrunk: 'Umtrunk' });
