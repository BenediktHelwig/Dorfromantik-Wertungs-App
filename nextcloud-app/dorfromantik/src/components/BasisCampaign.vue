<script setup>
// Kampagne im Basisspiel: Wertungsblatt, Baum, Ergebnisse und Erfolge. Gerechnet wird nur im Kern.
import { computed, ref, watch } from 'vue';
import {
  ORDER_TYPES, FLAG_TYPES, LONGEST_TYPES, TYPE_LABELS, BONUSES, createScoresheet, computeTotals, validateScoresheet,
} from '../../../../src/core/scoresheet.js';
import { highscoreRow } from '../../../../src/core/highscore.js';
import { activeBonusIds } from '../../../../src/core/unlocks.js';
import { ACHIEVEMENTS } from '../../../../src/core/achievements.js';
import { computeCampaign } from '../../../../src/core/campaign.js';
import {
  startCampaign, createNextSheet, addSheet, addDecision, setManualUnlock, canEndCampaign, endCampaign, isFinished,
} from '../../../../src/core/campaigns.js';
import CampaignHeader from './CampaignHeader.vue';
import NumberField from './NumberField.vue';
import ResultsTable from './ResultsTable.vue';
import BasisTree from './BasisTree.vue';
import BasisAchievements from './BasisAchievements.vue';
import { NODE_LABELS } from '../labels.js';
import { plain, today } from '../util.js';

const props = defineProps({
  campaign: { type: Object, default: null },
  newCampaignId: { type: String, default: null },
  save: { type: Function, required: true },
  busy: { type: Boolean, required: true },
});
const emit = defineEmits(['back', 'remove']);

const NO_DATA = { sheets: [], decisions: [], manualUnlocks: {}, manualReceived: [] };
const result = computed(() => computeCampaign(props.campaign ?? NO_DATA));
const readOnly = computed(() => props.campaign !== null && isFinished(props.campaign));
const canEnd = computed(() => props.campaign !== null && canEndCampaign(props.campaign));
const sheet = ref(null);
const lastUnlocks = ref('');
const revision = ref(0);

// Neues Blatt nach jedem Speichern; sonst nur den Freigespielt-Stand anpassen und die Eingaben behalten.
watch(() => props.campaign, () => {
  if (readOnly.value) {
    sheet.value = null;
  } else if (!sheet.value || sheet.value.gameNumber !== result.value.nextGameNumber) {
    sheet.value = props.campaign
      ? createNextSheet(props.campaign, today())
      : createScoresheet({ gameNumber: 1, date: today() });
  } else {
    const active = new Set(activeBonusIds(result.value.unlockGames, sheet.value.gameNumber));
    for (const [id, bonus] of Object.entries(sheet.value.bonuses)) {
      bonus.unlocked = active.has(id);
      if (!bonus.unlocked) bonus.points = 0;
    }
  }
}, { immediate: true });

const totals = computed(() => (sheet.value ? computeTotals(sheet.value) : null));
const errors = computed(() => {
  if (!sheet.value) return [];
  const list = validateScoresheet(sheet.value, { hearts: result.value.hearts[sheet.value.gameNumber] });
  if (!props.campaign && sheet.value.players.trim() === '') list.unshift('Mitspielende: bitte eintragen, sie geben der Kampagne den Namen');
  return list;
});
const rowInfo = computed(() => {
  if (!totals.value || errors.value.length > 0) return '';
  const row = highscoreRow(totals.value.total);
  return `Zeile ${row.min}${row.title ? ` (${row.title})` : ''} → ${row.crosses} Kreuz(e) im Fortschrittsbaum`;
});

async function persist(next) {
  const done = await props.save(next);
  revision.value += 1;
  return done;
}

async function submit() {
  if (props.busy || errors.value.length > 0 || !confirm('Ist alles eingetragen?')) return;
  const finished = plain(sheet.value);
  // Die Kampagne entsteht mit dem ersten gespeicherten Blatt; gespeicherte Blätter werden nicht mehr geändert.
  const next = props.campaign
    ? addSheet(props.campaign, finished)
    : startCampaign({ id: props.newCampaignId, date: today(), firstSheet: finished });
  if (!await persist(next)) return;
  const unlockedNow = Object.entries(computeCampaign(next).unlockGames)
    .filter(([, game]) => game === finished.gameNumber)
    .map(([id]) => ACHIEVEMENTS.find((a) => a.id === id)?.label ?? NODE_LABELS.get(id) ?? id);
  lastUnlocks.value = unlockedNow.length ? `Freigeschaltet in Spiel ${finished.gameNumber}: ${unlockedNow.join(', ')}` : '';
}

const decide = (decision) => persist(addDecision(props.campaign, decision));
const manual = (id, game) => persist(setManualUnlock(props.campaign, id, game));
const end = () => persist(endCampaign(props.campaign, today()));
</script>

<template>
  <CampaignHeader
    :campaign="campaign" variant-label="Basisspiel" :read-only="readOnly" :can-end="canEnd" :busy="busy"
    :title="readOnly ? '(beendet, nur ansehen)' : `Wertungsblatt Spiel ${result.nextGameNumber}`"
    :end-hint="campaign && !readOnly && !canEnd ? 'Beenden geht erst, wenn die offene Frage im Fortschrittsbaum beantwortet ist.' : ''"
    @back="emit('back')" @end="end" @remove="(id) => emit('remove', id)"
  />
  <main>
    <div>
      <form v-if="sheet" novalidate data-test="sheet" @submit.prevent="submit">
        <p class="meta">Datum dieses Blatts: {{ sheet.date }}</p>
        <label class="players">
          Mitspielende
          <!-- Die Mitspielenden aus Spiel 1 geben der Kampagne den Namen und sind ab Spiel 2 fest. -->
          <input
            v-model="sheet.players" name="players" type="text" autocomplete="off" :disabled="campaign !== null"
            @keydown.enter.prevent="$event.target.blur()"
          >
          <span class="hint">{{ campaign ? 'ab Spiel 2 fest übernommen' : 'Pflicht, gibt der Kampagne den Namen' }}</span>
        </label>
        <section>
          <h2>Aufträge (B)</h2>
          <div class="grid">
            <NumberField v-for="t in ORDER_TYPES" :key="t" :label="TYPE_LABELS[t]" :value="sheet.orders[t]" @update="(v) => sheet.orders[t] = v" />
          </div>
          <p class="subtotal">S1 = <output>{{ totals.s1 }}</output></p>
        </section>
        <section>
          <h2>Fahnen (C) und Längste (D)</h2>
          <div class="grid">
            <NumberField v-for="t in FLAG_TYPES" :key="t" :label="`Fahnen ${TYPE_LABELS[t]}`" :value="sheet.flags[t]" @update="(v) => sheet.flags[t] = v" />
          </div>
          <div class="grid">
            <NumberField v-for="t in LONGEST_TYPES" :key="t" :label="`Längstes ${TYPE_LABELS[t]}`" :value="sheet.longest[t]" @update="(v) => sheet.longest[t] = v" />
          </div>
          <p class="subtotal">S2 = <output>{{ totals.s2 }}</output></p>
        </section>
        <section>
          <h2>Freigespielt (E)</h2>
          <div class="bonuses">
            <div v-for="b in BONUSES" :key="b.id" class="bonus" :class="{ locked: !sheet.bonuses[b.id].unlocked }">
              <input type="checkbox" :checked="sheet.bonuses[b.id].unlocked" disabled title="freigespielt">
              <NumberField
                :label="`${b.label} (${b.hint})`" :value="sheet.bonuses[b.id].points" :disabled="!sheet.bonuses[b.id].unlocked"
                @update="(v) => sheet.bonuses[b.id].points = v"
              />
            </div>
          </div>
          <p class="subtotal">S3 = <output>{{ totals.s3 }}</output></p>
        </section>
        <section class="result">
          <p>Ergebnis H = <output>{{ totals.total }}</output></p>
          <p>{{ rowInfo }}</p>
          <ul class="errors"><li v-for="e in errors" :key="e">{{ e }}</li></ul>
          <button type="submit" data-test="save-sheet" :disabled="busy">{{ busy ? 'Speichert …' : 'Wertung speichern' }}</button>
        </section>
      </form>
    </div>
    <aside>
      <ResultsTable :rows="result.rows" :total-crosses="result.totalCrosses" />
      <BasisTree :tree="result.tree" :read-only="readOnly" :busy="busy" @decide="decide" />
      <BasisAchievements
        :computed-campaign="result" :editable="campaign !== null && !readOnly && !busy" :last-unlocks="lastUnlocks"
        :revision="revision" @manual="manual"
      />
    </aside>
  </main>
</template>
