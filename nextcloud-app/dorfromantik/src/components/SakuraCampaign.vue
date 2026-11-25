<script setup>
// Sakura-Kampagne. Gerechnet wird im Kern; Speichersperre und Partieende-Frage kommen aus flow.js.
import { computed, ref, watch } from 'vue';
import {
  ORDER_COLUMNS, FLAG_COLUMNS, COLUMN_LABELS, SAKURA_BONUSES, createSakuraSheet, computeSakuraTotals, validateSakuraSheet,
} from '../../../../src/core/sakura/scoresheet.js';
import { SAKURA_ACHIEVEMENTS } from '../../../../src/core/sakura/achievements.js';
import { computeSakuraCampaign } from '../../../../src/core/sakura/campaign.js';
import { STAR_CARDS } from '../../../../src/core/sakura/blossoms.js';
import { HIGHSCORE_SAKURA, highscoreRow } from '../../../../src/core/highscore.js';
import {
  startCampaign, createNextSheet, addSheet, addDecision, chooseCollector, setManualUnlock, canEndCampaign,
  endCampaign, isFinished,
} from '../../../../src/core/campaigns.js';
import { canSaveSheet, pendingGameEnd } from '../flow.js';
import CampaignHeader from './CampaignHeader.vue';
import NumberField from './NumberField.vue';
import ResultsTable from './ResultsTable.vue';
import SakuraTree from './SakuraTree.vue';
import SakuraQuestions from './SakuraQuestions.vue';
import SakuraAchievements from './SakuraAchievements.vue';
import GameEndDialog from './GameEndDialog.vue';
import { plain, today } from '../util.js';

const props = defineProps({
  campaign: { type: Object, default: null },
  newCampaignId: { type: String, default: null },
  save: { type: Function, required: true },
  busy: { type: Boolean, required: true },
});
const emit = defineEmits(['back', 'remove']);

const NO_DATA = { sheets: [], decisions: [], collector: null, gameEnds: {}, manualUnlocks: {} };
const result = computed(() => computeSakuraCampaign(props.campaign ?? NO_DATA));
const readOnly = computed(() => props.campaign !== null && isFinished(props.campaign));
const ending = computed(() => pendingGameEnd(props.campaign));
const canEnd = computed(() => props.campaign !== null && ending.value === null && canEndCampaign(props.campaign));
const maySave = computed(() => canSaveSheet(props.campaign));
const sheet = ref(null);
const revision = ref(0);

// Neues Blatt nach jedem Speichern; sonst nur die Freigaben anpassen und die Eingaben behalten.
watch(() => props.campaign, () => {
  if (readOnly.value) {
    sheet.value = null;
  } else if (!sheet.value || sheet.value.gameNumber !== result.value.nextGameNumber) {
    sheet.value = props.campaign
      ? createNextSheet(props.campaign, today())
      : createSakuraSheet({ gameNumber: 1, date: today() });
  } else {
    syncSheet();
  }
}, { immediate: true });

/** Eine Antwort kann Spalten und Einträge des offenen Blatts verändern: Freigabe neu setzen, Eingaben behalten. */
function syncSheet() {
  const open = props.campaign ? result.value.unlockedForNext : { bonusIds: [], columns: [] };
  for (const [id, bonus] of Object.entries(sheet.value.bonuses)) {
    bonus.unlocked = open.bonusIds.includes(id);
    if (!bonus.unlocked) bonus.points = 0;
  }
  for (const column of Object.keys(sheet.value.columns)) {
    sheet.value.columns[column] = open.columns.includes(column);
    if (!sheet.value.columns[column]) {
      sheet.value.orders[column] = 0;
      if (column in sheet.value.flags) sheet.value.flags[column] = 0;
    }
  }
}

const closed = (column) => column in sheet.value.columns && !sheet.value.columns[column];
const totals = computed(() => (sheet.value ? computeSakuraTotals(sheet.value) : null));
const errors = computed(() => {
  if (!sheet.value) return [];
  const list = validateSakuraSheet(sheet.value, { activatable: result.value.activatable[sheet.value.gameNumber] });
  if (!props.campaign && sheet.value.players.trim() === '') list.unshift('Mitspielende: bitte eintragen, sie geben der Kampagne den Namen');
  return list;
});
const rowInfo = computed(() => {
  if (!totals.value || errors.value.length > 0) return '';
  const row = highscoreRow(totals.value.total, HIGHSCORE_SAKURA);
  return `Zeile ${row.min}${row.title ? ` (${row.title})` : ''} → ${row.crosses} Kreuz(e) auf dem Kreispfad`;
});
const starCards = computed(() => {
  const usable = result.value.activatable[sheet.value?.gameNumber] ?? new Set();
  return STAR_CARDS.filter((id) => usable.has(id) || sheet.value?.activated.includes(id))
    .map((id) => ({ id, label: SAKURA_ACHIEVEMENTS.find((a) => a.id === id).label }));
});
function activate(id, on) {
  sheet.value.activated = on ? [...sheet.value.activated, id] : sheet.value.activated.filter((x) => x !== id);
}

const endHint = computed(() => (props.campaign && !readOnly.value && !canEnd.value && !ending.value
  ? 'Beenden geht erst, wenn die offene Frage beantwortet ist.' : ''));

async function persist(next) {
  const done = await props.save(next);
  revision.value += 1;
  return done;
}

async function submit() {
  if (props.busy || !maySave.value || errors.value.length > 0 || !confirm('Ist alles eingetragen?')) return;
  const finished = plain(sheet.value);
  await persist(props.campaign
    ? addSheet(props.campaign, finished)
    : startCampaign({ id: props.newCampaignId, date: today(), firstSheet: finished, variant: 'sakura' }));
}

const decide = (decision) => persist(addDecision(props.campaign, decision));
const collector = (id) => persist(chooseCollector(props.campaign, id));
const manual = (id, game) => persist(setManualUnlock(props.campaign, id, game));
const end = () => persist(endCampaign(props.campaign, today()));
</script>

<template>
  <div class="sakura">
    <CampaignHeader
      :campaign="campaign" variant-label="Sakura" :read-only="readOnly" :can-end="canEnd" :busy="busy" :end-hint="endHint"
      :title="readOnly ? '(beendet, nur ansehen)' : `Wertungsblatt Spiel ${result.nextGameNumber}`"
      @back="emit('back')" @end="end" @remove="(id) => emit('remove', id)"
    />
    <main>
      <div>
        <SakuraQuestions v-if="!readOnly" :pending="result.pending" :busy="busy" @decide="decide" @collector="collector" />
        <GameEndDialog
          v-if="ending" :key="ending.gameNumber" :campaign="campaign" :result="result" :ending="ending" :busy="busy" @store="persist"
        />
        <form v-else-if="sheet" novalidate data-test="sheet" @submit.prevent="submit">
          <p class="meta">Datum dieses Blatts: {{ sheet.date }}</p>
          <label class="players">
            Mitspielende
            <input
              v-model="sheet.players" name="players" type="text" autocomplete="off" :disabled="campaign !== null"
              @keydown.enter.prevent="$event.target.blur()"
            >
            <span class="hint">{{ campaign ? 'ab Spiel 2 fest übernommen' : 'Pflicht, gibt der Kampagne den Namen' }}</span>
          </label>
          <section>
            <h2>Aufträge</h2>
            <div class="grid">
              <NumberField
                v-for="c in ORDER_COLUMNS" :key="c" :label="COLUMN_LABELS[c]" :value="sheet.orders[c]" :disabled="closed(c)"
                @update="(v) => sheet.orders[c] = v"
              />
            </div>
            <p class="subtotal">S1 = <output>{{ totals.s1 }}</output></p>
          </section>
          <section>
            <h2>Fahnen (Straße und Fluss: längste, Rundum: +2 / +4)</h2>
            <div class="grid">
              <NumberField
                v-for="c in FLAG_COLUMNS" :key="c" :label="COLUMN_LABELS[c]" :value="sheet.flags[c]" :disabled="closed(c)"
                @update="(v) => sheet.flags[c] = v"
              />
            </div>
            <p class="subtotal">S2 = <output>{{ totals.s2 }}</output></p>
          </section>
          <section>
            <h2>Freigespielt</h2>
            <div class="bonuses">
              <div v-for="b in SAKURA_BONUSES" :key="b.id" class="bonus" :class="{ locked: !sheet.bonuses[b.id].unlocked }">
                <input type="checkbox" :checked="sheet.bonuses[b.id].unlocked" disabled title="freigespielt">
                <NumberField
                  :label="`${b.label} (${b.hint})`" :value="sheet.bonuses[b.id].points" :disabled="!sheet.bonuses[b.id].unlocked"
                  @update="(v) => sheet.bonuses[b.id].points = v"
                />
              </div>
            </div>
            <p class="subtotal">S3 = <output>{{ totals.s3 }}</output></p>
          </section>
          <section v-if="starCards.length > 0">
            <h2>*-Karten in dieser Partie einsetzen</h2>
            <label v-for="card in starCards" :key="card.id" class="inline">
              <input type="checkbox" :checked="sheet.activated.includes(card.id)" @change="activate(card.id, $event.target.checked)">
              {{ card.label }}
            </label>
          </section>
          <section class="result">
            <p>Ergebnis = <output>{{ totals.total }}</output></p>
            <p>{{ rowInfo }}</p>
            <ul class="errors"><li v-for="e in errors" :key="e">{{ e }}</li></ul>
            <button type="submit" data-test="save-sheet" :disabled="busy || !maySave">{{ busy ? 'Speichert …' : 'Wertung speichern' }}</button>
            <p v-if="result.collectorOpen" class="hint">Bitte zuerst den Blütensammler wählen.</p>
          </section>
        </form>
      </div>
      <aside>
        <ResultsTable :rows="result.rows" :total-crosses="result.totalCrosses" />
        <SakuraTree :result="result" />
        <SakuraAchievements
          :result="result" :collector="campaign?.collector ?? null" :editable="campaign !== null && !readOnly && !busy"
          :revision="revision" @manual="manual"
        />
      </aside>
    </main>
  </div>
</template>
