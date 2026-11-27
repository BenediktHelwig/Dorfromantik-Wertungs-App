<script setup>
// Fortschrittsbaum des Basisspiels als Zeichnung, samt den Fragen an Gabelungen und bei Restlichen Feldern.
import { computed } from 'vue';
import { BASIS_GRAPH as GRAPH, circleId } from '../../../../src/core/progressTree.js';
import { NODE_LABELS } from '../labels.js';

const props = defineProps({
  tree: { type: Object, required: true },
  readOnly: { type: Boolean, required: true },
  busy: { type: Boolean, required: true },
});
const emit = defineEmits(['decide']);

const labelOf = (id) => NODE_LABELS.get(id) ?? id;
const NODES = new Map([[GRAPH.start.id, GRAPH.start], ...GRAPH.hexagons.map((h) => [h.id, h])]);
const HEX_POINTS = [[-52, 0], [-36, -22], [36, -22], [52, 0], [36, 22], [-36, 22]];
const pointsOf = (h) => HEX_POINTS.map(([dx, dy]) => `${h.x + dx},${h.y + dy}`).join(' ');

const edges = GRAPH.sections.map((s) => ({ id: s.id, a: NODES.get(s.from), b: NODES.get(s.to) }));

const circles = computed(() => {
  const { crossed, position } = props.tree;
  const marker = position.section ? circleId(position.section, position.next) : null;
  return GRAPH.sections.flatMap((s) => {
    const a = NODES.get(s.from);
    const b = NODES.get(s.to);
    return Array.from({ length: s.circles }, (_, index) => {
      const i = index + 1;
      const t = i / (s.circles + 1);
      const id = circleId(s.id, i);
      const game = crossed.get(id);
      return {
        id, game, title: `${s.id} #${i}${game !== undefined ? ` (Spiel ${game})` : ''}`,
        cx: a.x + (b.x - a.x) * t, cy: a.y + (b.y - a.y) * t,
        heart: s.heart === i, crossed: game !== undefined, next: id === marker,
      };
    });
  });
});

const summary = computed(() => {
  const total = GRAPH.sections.reduce((n, s) => n + s.circles, 0);
  const { crossed, reached, expired } = props.tree;
  return `${crossed.size} von ${total} Kreisen ausgekreuzt, ${reached.size} von ${GRAPH.hexagons.length} Sechsecken erreicht`
    + (expired ? `, ${expired} Kreuz(e) verfallen` : '');
});

const question = computed(() => {
  const { pending } = props.tree;
  if (!pending || props.readOnly) return null;
  const fork = pending.kind === 'fork';
  return {
    rejected: Boolean(pending.rejected),
    text: fork
      ? `Spiel ${pending.gameNumber}: ${pending.remaining} Kreuz(e) offen. Wie geht es nach „${labelOf(pending.at)}“ weiter?`
      : `Spiel ${pending.gameNumber}: Alles freigespielt, ${pending.remaining} Kreuz(e) übrig. Restliche Felder füllen (nur Optik) oder verfallen lassen?`,
    options: [
      ...pending.options.map((o) => ({
        label: fork ? `Richtung ${labelOf(o.toward)}` : `${labelOf(o.at)} → ${labelOf(o.toward)}`,
        decision: { at: o.at, toward: o.toward },
      })),
      ...(pending.kind === 'leftover' ? [{ label: 'Kreuze verfallen lassen', decision: { skip: true } }] : []),
    ],
  };
});
</script>

<template>
  <section>
    <h2>Fortschrittsbaum</h2>
    <p class="hint">{{ summary }}</p>
    <div v-if="question" class="question" data-test="question">
      <p v-if="question.rejected" class="errors">Die gespeicherte Entscheidung passt nicht mehr zum Pfad, bitte neu wählen.</p>
      <p>{{ question.text }}</p>
      <button v-for="option in question.options" :key="option.label" type="button" :disabled="busy" @click="emit('decide', option.decision)">
        {{ option.label }}
      </button>
    </div>
    <svg viewBox="0 0 520 1010" class="tree" role="img" aria-label="Fortschrittsbaum">
      <line v-for="e in edges" :key="e.id" :x1="e.a.x" :y1="e.a.y" :x2="e.b.x" :y2="e.b.y" class="edge" />
      <template v-for="c in circles" :key="c.id">
        <circle :cx="c.cx" :cy="c.cy" :r="c.heart ? 8 : 6" class="circle" :class="{ crossed: c.crossed, heart: c.heart, next: c.next }">
          <title>{{ c.title }}</title>
        </circle>
        <text v-if="c.heart" :x="c.cx" :y="c.cy + 4" class="heart-mark">♥</text>
      </template>
      <text :x="GRAPH.start.x" :y="GRAPH.start.y + 4" class="hex-label start">{{ GRAPH.start.label }}</text>
      <g v-for="h in GRAPH.hexagons" :key="h.id" class="hex" :class="{ reached: tree.reached.has(h.id), here: tree.position.node === h.id }">
        <title>{{ tree.reached.has(h.id) ? `${h.label}: erreicht in Spiel ${tree.reached.get(h.id)}` : `${h.label}: noch nicht erreicht` }}</title>
        <polygon :points="pointsOf(h)" />
        <text :x="h.x" :y="h.y + 4" class="hex-label">{{ h.label }}</text>
      </g>
    </svg>
  </section>
</template>
