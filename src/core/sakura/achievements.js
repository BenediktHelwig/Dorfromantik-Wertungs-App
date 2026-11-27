// Erfolgsliste Sakura ("Eure Erfolge", 41 Einträge wie auf dem Kampagnenbogen).
// Quelle: docs/freischaltregeln-sakura.md, docs/entscheidungen.md (Schritt 3, Punkt 2).
//
// Art der Freischaltung (kind):
//   direct  – kommt direkt mit dem Öffnen der Box (Rundumaufträge, Kirschblüten)
//   node    – Feld mit dem Namen der Karte auf dem Bogen (Pfad-N auf dem Kreispfad, Pfad-K auf dem Blütenpfad):
//             Kreuz und Spielnummer, sobald das Feld ausgekreuzt ist
//   auto    – die App prüft das Wertungsblatt am Partieende und trägt die Spielnummer selbst ein
//   confirm – teil-auto: die App prüft den Zahlenteil, der Spieler bestätigt den Rest
//   manual  – der Spieler bestätigt selbst ("Erfüllt")
// Die Karte wird frei, sobald sie erhalten ist (siehe OPENED_WITH_BOX in campaign.js); die Aufgabe wird erst ab
// der Partie nach dem Erhalt geprüft.

import { computeSakuraTotals, columnTotal } from './scoresheet.js';

/** @typedef {{ id: string, label: string, box: number, kind: 'direct'|'node'|'auto'|'confirm'|'manual', node?: string, condition: string }} SakuraAchievement */

/** @type {readonly SakuraAchievement[]} */
export const SAKURA_ACHIEVEMENTS = Object.freeze([
  // Box 1
  { id: 'rundumauftraege', label: 'Rundumaufträge', box: 1, kind: 'direct', condition: 'Freischaltung mit Box 1' },
  { id: 'lagerhaus', label: 'Lagerhaus', box: 1, kind: 'auto', condition: '≥4 Rundumaufträge: Zelle Rundum der Zeile Aufträge ≥18 P' },
  // Box 2
  { id: 'sackgasse', label: 'Sackgasse', box: 2, kind: 'manual', condition: 'Straße ≥8 Plättchen, an beiden Enden abgeschlossen' },
  { id: 'staudamm', label: 'Staudamm', box: 2, kind: 'manual', condition: 'Fluss ≥8 Plättchen, an beiden Enden abgeschlossen' },
  { id: 'strassenkreuzung', label: 'Straßenkreuzung', box: 2, kind: 'node', node: 'Kreuzung', condition: 'Feld „Kreuzung“ ausgekreuzt' },
  { id: 'see', label: 'See', box: 2, kind: 'node', node: 'See', condition: 'Feld „See“ ausgekreuzt' },
  // Box 3
  { id: 'kirschblueten', label: 'Kirschblüten', box: 3, kind: 'direct', condition: 'Freischaltung mit Box 3, berechtigt zu einem Blütensammler' },
  { id: 'meisterpruefung', label: 'Meisterprüfung', box: 3, kind: 'confirm', condition: 'Gesamtsumme ≥250 und 10 Blüten (bestätigen)' },
  { id: 'gourmet', label: 'Gourmet', box: 3, kind: 'auto', condition: '≥45 P Dorf: Aufträge + Fahne' },
  { id: 'haendler', label: 'Händler', box: 3, kind: 'auto', condition: '≥40 P Straße: Aufträge + längste Straße' },
  { id: 'koiKennerin', label: 'Koi-Kennerin', box: 3, kind: 'auto', condition: '≥40 P Fluss: Aufträge + längster Fluss' },
  { id: 'pilger', label: 'Pilger', box: 3, kind: 'auto', condition: '≥45 P Kirschbaum: Aufträge + Fahne' },
  { id: 'vogelfreundin', label: 'Vogelfreundin', box: 3, kind: 'auto', condition: '≥45 P Reis: Aufträge + Fahne' },
  { id: 'teemeisterin', label: 'Teemeisterin', box: 3, kind: 'node', node: 'Teemeisterin', condition: 'Feld auf dem Blütenpfad ausgekreuzt' },
  { id: 'geschenk', label: 'Geschenk', box: 3, kind: 'node', node: 'Geschenk', condition: 'Feld auf dem Blütenpfad ausgekreuzt (*)' },
  { id: 'moossammlerin', label: 'Moossammlerin', box: 3, kind: 'node', node: 'Moossammlerin', condition: 'Feld auf dem Blütenpfad ausgekreuzt' },
  { id: 'reisbaeuerin', label: 'Reisbäuerin', box: 3, kind: 'node', node: 'Reisbäuerin', condition: 'Feld auf dem Blütenpfad ausgekreuzt' },
  { id: 'reiskuchen', label: 'Reiskuchen', box: 3, kind: 'node', node: 'Reiskuchen', condition: 'Feld auf dem Blütenpfad ausgekreuzt (*)' },
  { id: 'sumoringer', label: 'Sumoringer', box: 3, kind: 'node', node: 'Sumoringer', condition: 'Feld auf dem Blütenpfad ausgekreuzt' },
  { id: 'umtrunk', label: 'Umtrunk', box: 3, kind: 'node', node: 'Umtrunk', condition: 'Feld auf dem Blütenpfad ausgekreuzt (*)' },
  // Box 4 (nur Aufbewahrung, der Inhalt kommt über den Bogen)
  { id: 'badendeAffen', label: 'Badende Affen', box: 4, kind: 'manual', condition: '≥6 P durch abgeschlossene Heiße Quellen (ohne angrenzende Rundumaufträge)' },
  { id: 'bruecken', label: 'Brücken', box: 4, kind: 'node', node: 'Brücken', condition: 'Feld „Brücken“ ausgekreuzt' },
  { id: 'einsiedler', label: 'Einsiedler', box: 4, kind: 'node', node: 'Einsiedler', condition: 'Feld „Einsiedler“ ausgekreuzt' },
  { id: 'fujiyama', label: 'Fujiyama', box: 4, kind: 'node', node: 'Fujiyama', condition: 'Feld „Fujiyama“ ausgekreuzt' },
  { id: 'heisseQuellen', label: 'Heiße Quellen', box: 4, kind: 'node', node: 'HeisseQuellen', condition: 'Feld „Heiße Quellen“ ausgekreuzt' },
  { id: 'kalligraph', label: 'Kalligraph', box: 4, kind: 'node', node: 'Kalligraph', condition: 'Feld „Kalligraph“ ausgekreuzt' },
  { id: 'kartograph', label: 'Kartograph', box: 4, kind: 'node', node: 'Kartograph', condition: 'Feld „Kartograph“ ausgekreuzt' },
  { id: 'kontor', label: 'Kontor', box: 4, kind: 'node', node: 'Kontor', condition: 'Feld „Kontor“ ausgekreuzt' },
  { id: 'sternwarte', label: 'Sternwarte', box: 4, kind: 'node', node: 'Sternwarte', condition: 'Feld „Sternwarte“ ausgekreuzt' },
  { id: 'tempel', label: 'Tempel', box: 4, kind: 'node', node: 'Tempel', condition: 'Feld „Tempel“ ausgekreuzt' },
  { id: 'tore', label: 'Tore', box: 4, kind: 'node', node: 'Tore', condition: 'Feld „Tore“ ausgekreuzt' },
  // Box 5 (öffnet sich mit der Meisterprüfung)
  { id: 'dekretDesKaisers', label: 'Dekret des Kaisers', box: 5, kind: 'auto', condition: '≥12 P mit Tempeln' },
  { id: 'dorfUndReis', label: 'Dorf & Reis', box: 5, kind: 'manual', condition: 'Am Partieende ≥5 abgeschlossene Dorfgebiete aus je ≥2 Plättchen' },
  { id: 'kirschbaumUndDorf', label: 'Kirschbaum & Dorf', box: 5, kind: 'manual', condition: 'Am Partieende ≥5 abgeschlossene Kirschbaumgebiete aus je ≥2 Plättchen' },
  { id: 'reisUndKirschbaum', label: 'Reis & Kirschbaum', box: 5, kind: 'manual', condition: 'Am Partieende ≥5 abgeschlossene Reisgebiete aus je ≥2 Plättchen' },
  // Box 6 (öffnet sich mit Badende Affen)
  { id: 'bunteFahne', label: 'Bunte Fahne', box: 6, kind: 'manual', condition: '≥30 P durch ein abgeschlossenes Fahnengebiet' },
  { id: 'daimyo', label: 'Daimyo', box: 6, kind: 'auto', condition: '≥169 P durch Aufträge (ganze Zeile, inkl. Rundum und 7er)' },
  { id: 'kleineWolken', label: 'Kleine Wolken', box: 6, kind: 'auto', condition: 'Gesamtsumme ≥300' },
  { id: 'ochsenkarrenHandelsposten', label: 'Ochsenkarren und Handelsposten', box: 6, kind: 'confirm', condition: 'Gesamtsumme ≥300 und Straße ≥12 Plättchen (bestätigen)' },
  { id: 'poet', label: 'Poet', box: 6, kind: 'auto', condition: 'Genau 18 P mit Tempeln' },
  { id: 'schiffAnlegestelle', label: 'Schiff und Anlegestelle', box: 6, kind: 'confirm', condition: 'Gesamtsumme ≥200 und Fluss ≥12 Plättchen (bestätigen)' },
]);

/** Die fünf Blütensammler zur Auswahl (die Teemeisterin ist nur über den Blütenpfad zu haben). */
export const COLLECTORS = Object.freeze(['gourmet', 'haendler', 'koiKennerin', 'pilger', 'vogelfreundin']);

const tempelPoints = (sheet) => (sheet.bonuses.tempel.unlocked ? sheet.bonuses.tempel.points : 0);
const missing = (needed, value) => Math.max(0, needed - value);

/**
 * Aufgaben mit Punktewert: fehlende Punkte aus dem Wertungsblatt (0 = erfüllt, `null` = nicht mehr
 * auffüllbar). Mit Blüten lässt sich die Lücke 1:1 schließen.
 * @type {Record<string, (sheet: object) => number|null>}
 */
const TASKS = {
  lagerhaus: (s) => missing(18, s.orders.rundum), // Zelle Rundum der Zeile Aufträge, ohne Boni für längste Straße/Fluss
  gourmet: (s) => missing(45, columnTotal(s, 'dorf')),
  haendler: (s) => missing(40, columnTotal(s, 'strasse')),
  koiKennerin: (s) => missing(40, columnTotal(s, 'fluss')),
  pilger: (s) => missing(45, columnTotal(s, 'kirschbaum')),
  vogelfreundin: (s) => missing(45, columnTotal(s, 'reis')),
  meisterpruefung: (s) => missing(250, computeSakuraTotals(s).total),
  dekretDesKaisers: (s) => missing(12, tempelPoints(s)),
  daimyo: (s) => missing(169, computeSakuraTotals(s).s1),
  kleineWolken: (s) => missing(300, computeSakuraTotals(s).total),
  ochsenkarrenHandelsposten: (s) => missing(300, computeSakuraTotals(s).total),
  schiffAnlegestelle: (s) => missing(200, computeSakuraTotals(s).total),
  poet: (s) => (tempelPoints(s) > 18 ? null : 18 - tempelPoints(s)), // genau 18
};

/**
 * Fehlende Punkte der Aufgabe einer Karte.
 * @returns {number|null|undefined} 0 = erfüllt, null = nicht mehr auffüllbar, undefined = keine Punkteaufgabe
 */
export function taskGap(id, sheet) {
  return TASKS[id]?.(sheet);
}
