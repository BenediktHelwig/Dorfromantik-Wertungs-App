<script setup>
// Partieende: Kalligraph, Blüten-Ausgaben und Bestätigungen. Gespeichert wird nur der Eintrag, einmal.
import { computed, reactive } from 'vue';
import { SAKURA_ACHIEVEMENTS, taskGap } from '../../../../src/core/sakura/achievements.js';
import { computeSakuraCampaign } from '../../../../src/core/sakura/campaign.js';
import { blossomBudget } from '../../../../src/core/sakura/blossoms.js';
import { setGameEnd } from '../../../../src/core/campaigns.js';
import NumberField from './NumberField.vue';
import { plain } from '../util.js';

const props = defineProps({
  campaign: { type: Object, required: true },
  result: { type: Object, required: true },
  ending: { type: Object, required: true },
  busy: { type: Boolean, required: true },
});
const emit = defineEmits(['store']);

const draft = reactive({});
const gameNumber = props.ending.gameNumber;
const sheet = computed(() => props.result.sheets.find((s) => s.gameNumber === gameNumber));
const budget = computed(() => blossomBudget(sheet.value));
const kalligraphActive = computed(() => {
  const game = props.result.unlockGames.kalligraph;
  return Number.isInteger(game) && game < gameNumber;
});
const openCards = computed(() => SAKURA_ACHIEVEMENTS
  .filter((a) => (a.kind === 'auto' || a.kind === 'confirm') && props.ending.received.has(a.id)
    && !Number.isInteger(props.result.unlockGames[a.id]))
  .map((a) => ({ ...a, gap: taskGap(a.id, sheet.value) })));
const flips = computed(() => [...props.ending.flippable]
  .map((id) => ({ id, label: SAKURA_ACHIEVEMENTS.find((a) => a.id === id).label })));
const preview = computed(() => computeSakuraCampaign({
  ...props.campaign, gameEnds: { ...props.campaign.gameEnds, [gameNumber]: plain(draft) },
}).gameEndResults[gameNumber]);

const kalligraph = (patch) => { draft.kalligraph = { ...draft.kalligraph, ...patch }; };
const has = (key, id) => (draft[key] ?? []).includes(id);
const toggle = (key, id, on) => {
  draft[key] = on ? [...(draft[key] ?? []), id] : (draft[key] ?? []).filter((x) => x !== id);
};

// "Nichts eintragen" speichert einen leeren Eintrag, damit der Dialog nicht bei jedem Öffnen wiederkommt.
const store = (entry) => emit('store', setGameEnd(props.campaign, gameNumber, entry));
</script>

<template>
  <section class="question" data-test="game-end">
    <h2>Spiel {{ gameNumber }}: Partieende</h2>
    <template v-if="kalligraphActive">
      <h3>Kalligraph</h3>
      <label class="inline">
        <input type="checkbox" :checked="Boolean(draft.kalligraph?.surrounded)" @change="kalligraph({ surrounded: $event.target.checked })">
        Der Kalligraph ist komplett von Plättchen umgeben
      </label>
      <label class="inline">
        <input type="checkbox" :checked="Boolean(draft.kalligraph?.extra)" @change="kalligraph({ extra: $event.target.checked })">
        1 zusätzliches Feld auf dem Kreispfad nutzen
      </label>
      <NumberField label="Weitere Felder für je 10 Blüten" :value="draft.kalligraph?.paid ?? 0" @update="(v) => kalligraph({ paid: v })" />
    </template>
    <template v-if="budget > 0">
      <h3>Kirschblüten ausgeben</h3>
      <NumberField label="Sterne auf dem Blütenpfad (1 Blüte je Stern)" :value="draft.stars ?? 0" @update="(v) => draft.stars = v" />
      <label class="inline">
        <input type="checkbox" :checked="Boolean(draft.bigStar)" @change="draft.bigStar = $event.target.checked">
        Stern 30 auskreuzen (30 Blüten auf einmal)
      </label>
      <NumberField label="Freie Ausgabe (Sonderplättchen)" :value="draft.freeSpend ?? 0" @update="(v) => draft.freeSpend = v" />
    </template>
    <template v-for="a in openCards" :key="a.id">
      <label v-if="a.kind === 'confirm'" class="inline">
        <input type="checkbox" :checked="has('confirmed', a.id)" @change="toggle('confirmed', a.id, $event.target.checked)">
        {{ a.label }}: erfüllt ({{ a.condition }})
      </label>
      <label v-if="budget > 0 && typeof a.gap === 'number' && a.gap > 0" class="inline">
        <input type="checkbox" :checked="has('fills', a.id)" @change="toggle('fills', a.id, $event.target.checked)">
        {{ a.label }}: {{ a.gap }} fehlende Punkte mit Blüten auffüllen
      </label>
    </template>
    <template v-if="budget > 0 && flips.length > 0">
      <h3>*-Karten umdrehen (5 Blüten)</h3>
      <label v-for="f in flips" :key="f.id" class="inline">
        <input type="checkbox" :checked="has('flips', f.id)" @change="toggle('flips', f.id, $event.target.checked)">
        {{ f.label }}
      </label>
    </template>
    <div class="hint">
      Ausgabe-Budget: {{ preview.budget }} Blüten, ausgegeben: {{ preview.spent }}, Rest verfällt: {{ Math.max(0, preview.budget - preview.spent) }}
      <div v-for="e in preview.errors" :key="e" class="errors">{{ e }}</div>
    </div>
    <button type="button" data-test="store-game-end" :disabled="busy || preview.errors.length > 0" @click="store(plain(draft))">Eintrag speichern</button>
    <button type="button" data-test="skip-game-end" :disabled="busy" @click="store({})">Nichts eintragen, weiter</button>
  </section>
</template>
