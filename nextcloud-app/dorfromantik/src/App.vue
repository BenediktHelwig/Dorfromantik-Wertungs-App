<script setup>
// Rahmen der App: lädt die Kampagnen vom Server und speichert Änderungen. Gehalten werden nur Rohdaten,
// alles andere rechnet der Kern in den Ansichten neu. Eine Änderung gilt erst, wenn der Server sie angenommen hat.
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { campaignOverview, isSakura } from '../../../src/core/campaigns.js';
import StartScreen from './components/StartScreen.vue';
import BasisCampaign from './components/BasisCampaign.vue';
import SakuraCampaign from './components/SakuraCampaign.vue';
import { newId } from './util.js';

const props = defineProps({
  api: { type: Object, required: true },
  homeUrl: { type: String, required: true },
});

const campaigns = shallowRef([]);
const loaded = ref(false);
const busy = ref(false);
const error = ref('');
const online = ref(navigator.onLine);
/** null = Startbildschirm; sonst { key, id, variant, newId } */
const screen = ref(null);

const current = computed(() => campaigns.value.find((c) => c.id === screen.value?.id) ?? null);
const overview = computed(() => campaignOverview(campaigns.value));

async function load() {
  error.value = '';
  try {
    campaigns.value = await props.api.list();
    loaded.value = true;
  } catch (e) {
    loaded.value = false;
    error.value = e.message;
  }
}

/** Führt eine Anfrage aus; währenddessen wird keine zweite angenommen. @returns {Promise<boolean>} Erfolg */
async function run(action) {
  if (busy.value) return false;
  busy.value = true;
  error.value = '';
  try {
    await action();
    return true;
  } catch (e) {
    error.value = e.message;
    return false;
  } finally {
    busy.value = false;
  }
}

const save = (next) => run(async () => {
  await props.api.save(next);
  campaigns.value = [...campaigns.value.filter((c) => c.id !== next.id), next];
  if (screen.value && screen.value.id === null) screen.value = { ...screen.value, id: next.id };
});

async function remove(id) {
  const done = await run(async () => {
    await props.api.remove(id);
    campaigns.value = campaigns.value.filter((c) => c.id !== id);
  });
  if (done) screen.value = null;
}

function open(id) {
  const campaign = campaigns.value.find((c) => c.id === id);
  error.value = '';
  screen.value = { key: id, id, variant: isSakura(campaign) ? 'sakura' : 'basis', newId: null };
}

/** Neue Kampagne: entsteht erst mit dem ersten gespeicherten Blatt. Die Id steht schon fest, damit ein
 *  wiederholtes Speichern nach einem Verbindungsfehler keine zweite Kampagne anlegt. */
function create(variant) {
  const id = newId();
  error.value = '';
  screen.value = { key: id, id: null, variant, newId: id };
}

function back() {
  screen.value = null;
  load();
}

const setOnline = () => { online.value = navigator.onLine; };
onMounted(() => {
  window.addEventListener('online', setOnline);
  window.addEventListener('offline', setOnline);
  load();
});
onUnmounted(() => {
  window.removeEventListener('online', setOnline);
  window.removeEventListener('offline', setOnline);
});
</script>

<template>
  <div class="app">
    <p v-if="!online" class="banner" role="alert">Keine Verbindung zur Nextcloud</p>
    <div v-if="error" class="banner" role="alert">
      <span>{{ error }}</span>
      <button v-if="!loaded" type="button" @click="load">Erneut versuchen</button>
      <button v-else type="button" @click="error = ''">Schließen</button>
    </div>

    <StartScreen
      v-if="!screen" :overview="overview" :loaded="loaded" :busy="busy" :home-url="homeUrl"
      @open="open" @create="create" @remove="remove"
    />
    <component
      :is="screen.variant === 'sakura' ? SakuraCampaign : BasisCampaign"
      v-else :key="screen.key" :campaign="current" :new-campaign-id="screen.newId" :save="save" :busy="busy"
      @back="back" @remove="remove"
    />
  </div>
</template>
