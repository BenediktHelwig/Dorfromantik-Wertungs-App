<script setup>
defineProps({
  overview: { type: Object, required: true },
  loaded: { type: Boolean, required: true },
  busy: { type: Boolean, required: true },
  homeUrl: { type: String, required: true },
});
const emit = defineEmits(['open', 'create', 'remove']);

function confirmRemove(entry) {
  if (confirm(`Kampagne „${entry.name}“ wirklich löschen? Bist du sicher? Das lässt sich nicht rückgängig machen.`)) {
    emit('remove', entry.id);
  }
}
const groups = [
  { key: 'running', title: 'Laufende Kampagnen', open: 'Fortsetzen', none: 'Keine laufende Kampagne.' },
  { key: 'finished', title: 'Beendete Kampagnen', open: 'Ansehen', none: 'Keine beendete Kampagne.' },
];
</script>

<template>
  <header>
    <h1>Dorfromantik – Kampagnen</h1>
    <p class="meta">Basisspiel und Sakura · <a :href="homeUrl">zurück zur Nextcloud</a></p>
  </header>
  <p v-if="!loaded" class="hint">Kampagnen werden von der Nextcloud geladen …</p>
  <template v-else>
    <section class="start-actions">
      <button type="button" data-test="new-basis" @click="emit('create', 'basis')">Neue Kampagne starten (Basisspiel)</button>
      <button type="button" data-test="new-sakura" @click="emit('create', 'sakura')">Neue Kampagne starten (Sakura)</button>
    </section>
    <section v-for="group in groups" :key="group.key">
      <h2>{{ group.title }}</h2>
      <p v-if="group.key === 'finished'" class="hint">Nur ansehen oder löschen.</p>
      <div class="campaigns">
        <p v-if="overview[group.key].length === 0" class="hint">{{ group.none }}</p>
        <div v-for="entry in overview[group.key]" :key="entry.id" class="campaign-card">
          <span>
            {{ entry.name }}{{ entry.variant === 'sakura' ? ' · Sakura' : '' }} · {{ entry.startDate }}{{ entry.endDate ? ` bis ${entry.endDate}` : '' }}
            · {{ entry.games }} Spiel{{ entry.games === 1 ? '' : 'e' }}
          </span>
          <button type="button" data-test="open" @click="emit('open', entry.id)">{{ group.open }}</button>
          <button type="button" :disabled="busy" @click="confirmRemove(entry)">Löschen</button>
        </div>
      </div>
    </section>
  </template>
</template>
