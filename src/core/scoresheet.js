// Wertungsblatt des Basisspiels: Felder, Summen, Prüfung.
// Spezifikation: docs/spezifikation-basis.md

/** Landschaftstypen der Aufträge (B1–B5). */
export const ORDER_TYPES = Object.freeze(['wald', 'getreide', 'dorf', 'gleis', 'fluss']);
/** Fahnen (C1–C3). */
export const FLAG_TYPES = Object.freeze(['wald', 'getreide', 'dorf']);
/** Längstes Gleis / längster Fluss (D1, D2). */
export const LONGEST_TYPES = Object.freeze(['gleis', 'fluss']);

export const TYPE_LABELS = Object.freeze({
  wald: 'Wald',
  getreide: 'Getreide',
  dorf: 'Dorf',
  gleis: 'Gleis',
  fluss: 'Fluss',
});

/**
 * Freigespielt-Boni (Bereich E). Die id entspricht dem Eintrag in "Eure Erfolge".
 * @type {readonly {id: string, label: string, hint: string}[]}
 */
export const BONUSES = Object.freeze([
  { id: 'roteHerzen', label: 'Rote Herzen', hint: '1 je passender Kante' },
  { id: 'zirkus', label: 'Zirkus', hint: 'umschlossen = 10' },
  { id: 'bahnwaerter', label: 'Bahnwärter', hint: '2 je Bahnübergang' },
  { id: 'schaeferin', label: 'Schäferin', hint: '1 je Schaf' },
  { id: 'huegel', label: 'Hügel', hint: 'Abstand 2: 2 je Auftrag' },
  { id: 'baustelle', label: 'Baustelle', hint: 'je Gebiet mit 7+ = 7' },
  { id: 'ballonStartplatz', label: 'Ballon-Startplatz', hint: '2 je Entfernung' },
  { id: 'goldenesHerz', label: 'Goldenes Herz', hint: '2 je passender Kante' },
  { id: 'waldhuette', label: 'Waldhütte', hint: 'Waldaufträge auf dem Plättchen' },
  { id: 'erntefest', label: 'Erntefest', hint: 'Getreideaufträge auf dem Plättchen' },
  { id: 'wachturm', label: 'Wachturm', hint: 'Dorfaufträge auf dem Plättchen' },
  { id: 'lokomotive', label: 'Lokomotive', hint: 'Gleisaufträge auf dem Plättchen' },
  { id: 'schiff', label: 'Schiff', hint: 'Flussaufträge auf dem Plättchen' },
  { id: 'bahnhof', label: 'Bahnhof', hint: 'beendet: 1 je Plättchen' },
  { id: 'hafen', label: 'Hafen', hint: 'beendet: 1 je Plättchen' },
]);

const zeroMap = (keys) => Object.fromEntries(keys.map((k) => [k, 0]));

/**
 * Neues, leeres Wertungsblatt.
 * @param {{ gameNumber: number, date: string, unlockedBonusIds?: Iterable<string> }} opts
 */
export function createScoresheet({ gameNumber, date, unlockedBonusIds = [] }) {
  const unlocked = new Set(unlockedBonusIds);
  return {
    gameNumber,
    date,
    players: '',
    orders: zeroMap(ORDER_TYPES),
    flags: zeroMap(FLAG_TYPES),
    longest: zeroMap(LONGEST_TYPES),
    bonuses: Object.fromEntries(
      BONUSES.map((b) => [b.id, { unlocked: unlocked.has(b.id), points: 0 }]),
    ),
  };
}

const sum = (values) => values.reduce((a, b) => a + b, 0);

/**
 * Summen S1 (Aufträge), S2 (Fahnen + längste), S3 (Boni) und Ergebnis H.
 * Punkte nicht freigespielter Boni zählen nicht.
 */
export function computeTotals(sheet) {
  const s1 = sum(ORDER_TYPES.map((t) => sheet.orders[t]));
  const s2 = sum(FLAG_TYPES.map((t) => sheet.flags[t])) + sum(LONGEST_TYPES.map((t) => sheet.longest[t]));
  const s3 = sum(Object.values(sheet.bonuses).filter((b) => b.unlocked).map((b) => b.points));
  return { s1, s2, s3, total: s1 + s2 + s3 };
}

const isCount = (v) => Number.isInteger(v) && v >= 0;

/**
 * Prüft ein Wertungsblatt. Gibt eine Liste von Fehlermeldungen zurück (leer = gültig).
 * @returns {string[]}
 */
export function validateScoresheet(sheet) {
  const errors = [];
  const check = (value, label) => {
    if (!isCount(value)) errors.push(`${label}: ganze Zahl ≥ 0 erwartet`);
  };
  ORDER_TYPES.forEach((t) => check(sheet.orders[t], `Aufträge ${TYPE_LABELS[t]}`));
  FLAG_TYPES.forEach((t) => check(sheet.flags[t], `Fahnen ${TYPE_LABELS[t]}`));
  LONGEST_TYPES.forEach((t) => check(sheet.longest[t], `Längstes ${TYPE_LABELS[t]}`));
  BONUSES.forEach(({ id, label }) => {
    const bonus = sheet.bonuses[id];
    check(bonus.points, label);
    if (!bonus.unlocked && bonus.points !== 0) {
      errors.push(`${label}: noch nicht freigespielt, Punkte müssen 0 sein`);
    }
  });
  return errors;
}
