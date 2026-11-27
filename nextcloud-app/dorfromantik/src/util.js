// Kleine Helfer der Oberfläche.

/** Lokales Datum (toISOString liefert UTC und wäre kurz nach Mitternacht noch der Vortag). */
export const today = () => new Date().toLocaleDateString('sv-SE');

/** crypto.randomUUID gibt es nur mit HTTPS, deshalb mit Ersatz. */
export const newId = () => (globalThis.crypto?.randomUUID?.() ?? `k${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** Reine Kopie ohne Vue-Proxys: So gehen Rohdaten in den Kern und zum Server. */
export const plain = (value) => JSON.parse(JSON.stringify(value));
