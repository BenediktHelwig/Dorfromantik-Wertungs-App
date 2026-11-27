<script setup>
// Offene Frage bei Sakura: Gabelung, Restliche Felder oder die Wahl des Blütensammlers.
import { computed } from 'vue';
import { SAKURA_GRAPH } from '../../../../src/core/sakura/progressTree.js';
import { SAKURA_ACHIEVEMENTS } from '../../../../src/core/sakura/achievements.js';

const props = defineProps({
  pending: { type: Object, default: null },
  busy: { type: Boolean, required: true },
});
const emit = defineEmits(['collector', 'decide']);

const NODES = new Map(SAKURA_GRAPH.nodes.map((n) => [n.id, n]));
const ADJACENT = new Map();
for (const e of SAKURA_GRAPH.edges) {
  for (const [x, y] of [[e.a, e.b], [e.b, e.a]]) ADJACENT.set(x, [...(ADJACENT.get(x) ?? []), y]);
}
const CARDS = new Map(SAKURA_ACHIEVEMENTS.map((a) => [a.id, a]));

/** Name des ersten benannten Feldes, wenn man von `at` über `toward` läuft. */
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

const question = computed(() => {
  const { pending } = props;
  if (!pending) return null;
  if (pending.kind === 'collector') {
    return {
      text: 'Kirschblüten sind freigeschaltet. Welchen Blütensammler wählt ihr?',
      options: pending.options.map((id) => ({
        key: id, label: CARDS.get(id).label, title: CARDS.get(id).condition, answer: () => emit('collector', id),
      })),
    };
  }
  const track = pending.track === 'star' ? 'Blütenpfad' : 'Kreispfad';
  return {
    rejected: Boolean(pending.rejected),
    text: pending.kind === 'fork'
      ? `${track}, Spiel ${pending.gameNumber}: ${pending.remaining} Kreuz(e) offen. Wie geht es nach „${NODES.get(pending.at).label ?? pending.at}“ weiter?`
      : `${track}, Spiel ${pending.gameNumber}: Pfadende erreicht, ${pending.remaining} Kreuz(e) übrig. In welchen freien Abschnitt?`,
    options: pending.options.map((o) => ({
      key: `${o.at}-${o.toward}`, label: `Richtung ${firstNamed(o.at, o.toward)}`, title: '',
      answer: () => emit('decide', { at: o.at, toward: o.toward }),
    })),
  };
});
</script>

<template>
  <section v-if="question" class="question" data-test="question">
    <p v-if="question.rejected" class="errors">Die gespeicherte Entscheidung passt nicht mehr zum Pfad, bitte neu wählen.</p>
    <p>{{ question.text }}</p>
    <button v-for="o in question.options" :key="o.key" type="button" :title="o.title" :disabled="busy" @click="o.answer">{{ o.label }}</button>
  </section>
</template>
