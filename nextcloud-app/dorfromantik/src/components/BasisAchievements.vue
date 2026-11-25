<script setup>
// "Eure Erfolge" im Basisspiel: Schachteln, Kampagnenblatt, Herz-Kreise. Nur Fahnenfest trägt der Spieler ein.
import { computed } from 'vue';
import { ACHIEVEMENTS } from '../../../../src/core/achievements.js';
import { BASIS_GRAPH as GRAPH } from '../../../../src/core/progressTree.js';
import NumberField from './NumberField.vue';

const props = defineProps({
  computedCampaign: { type: Object, required: true },
  editable: { type: Boolean, required: true },
  lastUnlocks: { type: String, default: '' },
  /** Ändert sich nach jedem Speicherversuch, damit Felder wieder den gespeicherten Stand zeigen. */
  revision: { type: Number, required: true },
});
const emit = defineEmits(['manual']);

const boardCards = GRAPH.hexagons.filter((h) => h.kind === 'achievement');
const hearts = computed(() => {
  const games = [...props.computedCampaign.tree.heartGames].sort((a, b) => a - b);
  return [0, 1, 2].map((i) => games[i]);
});
</script>

<template>
  <section>
    <h2>Eure Erfolge</h2>
    <p class="hint">
      Häkchen = Karte erhalten. Zahl = Spielnummer der Freischaltung, wirkt ab dem nächsten Spiel. Alles wird aus den
      Wertungsblättern und dem Fortschrittsbaum berechnet; nur Fahnenfest tragt ihr selbst ein.
    </p>
    <p class="notice">{{ lastUnlocks }}</p>
    <h3>Schachteln</h3>
    <div class="unlocks">
      <div v-for="a in ACHIEVEMENTS" :key="a.id" class="unlock" :title="a.condition">
        <input type="checkbox" :checked="computedCampaign.received.has(a.id)" disabled>
        <NumberField
          v-if="a.kind === 'manual'" :key="`${a.id}-${revision}`" :label="`${a.label} (S${a.box})`" :value="computedCampaign.unlockGames[a.id] ?? ''"
          :disabled="!editable" commit-on="change" @update="(v) => emit('manual', a.id, v > 0 ? v : null)"
        />
        <template v-else>
          <span class="entry">{{ a.label }} (S{{ a.box }})</span>
          <span class="game">{{ computedCampaign.unlockGames[a.id] ?? '–' }}</span>
        </template>
      </div>
    </div>
    <h3>Kampagnenblatt</h3>
    <div class="unlocks">
      <div v-for="h in boardCards" :key="h.id" class="unlock">
        <input type="checkbox" :checked="computedCampaign.tree.reached.has(h.id)" disabled>
        <span class="entry">{{ h.label }}</span>
        <span class="game">{{ computedCampaign.unlockGames[h.id] ?? '–' }}</span>
      </div>
    </div>
    <h3>Herz-Kreise</h3>
    <p class="hint">Spielnummer, in der der Kreis ausgekreuzt wurde. Zählt erst, wenn Herzenswünsche erfüllt ist.</p>
    <div class="unlocks">
      <div v-for="(game, i) in hearts" :key="i" class="unlock">
        <input type="checkbox" :checked="game !== undefined" disabled>
        <span class="entry">Herz-Kreis {{ i + 1 }}</span>
        <span class="game">{{ game ?? '–' }}</span>
      </div>
    </div>
  </section>
</template>
