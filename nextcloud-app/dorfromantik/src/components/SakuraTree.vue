<script setup>
// Fortschrittsbaum Sakura (Kreispfad und Blütenpfad) als Zeichnung.
import { computed } from 'vue';
import { SAKURA_GRAPH } from '../../../../src/core/sakura/progressTree.js';

const props = defineProps({ result: { type: Object, required: true } });

const NODES = new Map(SAKURA_GRAPH.nodes.map((n) => [n.id, n]));
const edges = SAKURA_GRAPH.edges.map((e) => ({ key: `${e.a}-${e.b}`, a: NODES.get(e.a), b: NODES.get(e.b) }));
const xs = SAKURA_GRAPH.nodes.map((n) => n.x);
const ys = SAKURA_GRAPH.nodes.map((n) => n.y);
const pad = 70;
const [x0, y0] = [Math.min(...xs) - pad, Math.min(...ys) - pad];
const viewBox = `${x0} ${y0} ${Math.max(...xs) - x0 + pad} ${Math.max(...ys) - y0 + pad}`;

const fields = computed(() => {
  const crossed = new Map([...props.result.trees.path.crossed, ...props.result.trees.star.crossed]);
  return SAKURA_GRAPH.nodes.map((n) => {
    const game = n.id === 'Blüte30' ? props.result.bigStarGame : crossed.get(n.id);
    const done = game !== null && game !== undefined;
    const named = !['circle', 'star'].includes(n.type);
    return { ...n, done, named, title: `${n.label ?? n.id}${done ? ` (Spiel ${game})` : ''}` };
  });
});

const summary = computed(() => {
  const { path, star } = props.result.trees;
  const ended = (t) => (t.ended ? ', Ende erreicht' : '');
  return `Kreispfad: ${path.crossed.size} Felder${ended(path)}${path.expired ? `, ${path.expired} Kreuz(e) verfallen` : ''}`
    + ` · Blütenpfad: ${star.crossed.size} Felder${ended(star)}`;
});
</script>

<template>
  <section>
    <h2>Fortschrittsbaum</h2>
    <p class="hint">{{ summary }}</p>
    <svg :viewBox="viewBox" class="tree" role="img" aria-label="Fortschrittsbaum Sakura">
      <line v-for="e in edges" :key="e.key" :x1="e.a.x" :y1="e.a.y" :x2="e.b.x" :y2="e.b.y" class="edge" />
      <template v-for="n in fields" :key="n.id">
        <rect v-if="n.named" :x="n.x - 13" :y="n.y - 13" width="26" height="26" :rx="n.type === 'hex' ? 13 : 3" class="circle" :class="{ crossed: n.done }">
          <title>{{ n.title }}</title>
        </rect>
        <circle v-else :cx="n.x" :cy="n.y" r="7" class="circle" :class="{ crossed: n.done, blossom: n.type === 'star' }">
          <title>{{ n.title }}</title>
        </circle>
        <text v-if="n.named" :x="n.x + 18" :y="n.y + 5" class="hex-label sk-label">{{ n.label ?? n.id }}</text>
      </template>
    </svg>
  </section>
</template>
