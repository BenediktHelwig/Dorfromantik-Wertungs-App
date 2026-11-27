// Namen der Felder im Fortschrittsbaum des Basisspiels.
import { BASIS_GRAPH } from '../../../src/core/progressTree.js';

export const NODE_LABELS = new Map([
  [BASIS_GRAPH.start.id, BASIS_GRAPH.start.label],
  ...BASIS_GRAPH.hexagons.map((h) => [h.id, h.label]),
]);
