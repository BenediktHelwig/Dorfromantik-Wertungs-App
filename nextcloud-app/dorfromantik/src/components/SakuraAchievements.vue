<script setup>
// "Eure Erfolge" bei Sakura, nach Boxen. Handkarten wählt der Spieler als "erfüllt in Spiel".
import { SAKURA_ACHIEVEMENTS } from '../../../../src/core/sakura/achievements.js';

const props = defineProps({
  result: { type: Object, required: true },
  collector: { type: String, default: null },
  editable: { type: Boolean, required: true },
  revision: { type: Number, required: true },
});
const emit = defineEmits(['manual']);

const BOXES = [1, 2, 3, 4, 5, 6];
const cardsOf = (box) => SAKURA_ACHIEVEMENTS.filter((a) => a.box === box);
const labelOf = (id) => SAKURA_ACHIEVEMENTS.find((a) => a.id === id)?.label ?? id;
const received = (a) => props.result.received.has(a.id) || Number.isInteger(props.result.unlockGames[a.id]);
const choose = (id, value) => emit('manual', id, value === '' ? null : Number(value));
</script>

<template>
  <section>
    <h2>Eure Erfolge</h2>
    <p class="hint">
      Häkchen = Karte erhalten. Zahl = Spielnummer der Freischaltung, wirkt ab dem nächsten Spiel. Fahrt mit der Maus über einen
      Eintrag für die Aufgabe. Bei Karten mit Auswahlfeld prüft die App die Aufgabe nicht selbst: Wählt die Partie, in der ihr sie
      erfüllt habt.
    </p>
    <template v-for="box in BOXES" :key="box">
      <h3>Box {{ box }}{{ box === 4 ? ' (Aufbewahrung, Inhalt über den Bogen)' : '' }}</h3>
      <div class="unlocks">
        <div v-for="a in cardsOf(box)" :key="a.id" class="unlock" :title="a.condition">
          <input type="checkbox" :checked="received(a)" disabled>
          <label v-if="a.kind === 'manual'">
            {{ a.label }}: erfüllt in Spiel
            <select
              :key="revision" :value="String(result.unlockGames[a.id] ?? '')"
              :disabled="!editable || result.manualOptions[a.id].length === 0" @change="choose(a.id, $event.target.value)"
            >
              <option value="">–</option>
              <option v-for="n in result.manualOptions[a.id]" :key="n" :value="String(n)">Spiel {{ n }}</option>
            </select>
            <span v-if="received(a) && result.manualOptions[a.id].length === 0" class="hint">erst nach einer weiteren gespeicherten Partie</span>
          </label>
          <template v-else>
            <span class="entry">{{ a.label }}</span>
            <span class="game">{{ result.unlockGames[a.id] ?? '–' }}</span>
          </template>
        </div>
      </div>
    </template>
    <p v-if="collector && !result.collectorOpen" class="hint">Blütensammler: {{ labelOf(collector) }}</p>
  </section>
</template>
