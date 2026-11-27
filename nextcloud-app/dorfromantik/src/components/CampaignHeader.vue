<script setup>
import { campaignName } from '../../../../src/core/campaigns.js';
import { today } from '../util.js';

const props = defineProps({
  campaign: { type: Object, default: null },
  title: { type: String, required: true },
  variantLabel: { type: String, required: true },
  readOnly: { type: Boolean, required: true },
  canEnd: { type: Boolean, required: true },
  endHint: { type: String, default: '' },
  busy: { type: Boolean, required: true },
});
const emit = defineEmits(['back', 'end', 'remove']);

function end() {
  if (confirm('Kampagne beenden? Bist du sicher? Danach kann sie nur noch angesehen und gelöscht werden.')) emit('end');
}
function remove() {
  if (confirm('Kampagne wirklich löschen? Bist du sicher? Das lässt sich nicht rückgängig machen.')) emit('remove', props.campaign.id);
}
</script>

<template>
  <header>
    <button type="button" class="back" @click="emit('back')">← Kampagnen</button>
    <h1>{{ campaign ? campaignName(campaign) : 'Neue Kampagne' }} · {{ title }}</h1>
    <p class="meta">Kampagne gespielt von {{ campaign ? campaign.startDate : today() }} bis {{ campaign?.endDate ?? '…' }} · {{ variantLabel }}</p>
    <template v-if="campaign">
      <p class="actions">
        <button v-if="!readOnly" type="button" data-test="end" :disabled="!canEnd || busy" @click="end">Kampagne beenden</button>
        <button type="button" :disabled="busy" @click="remove">Kampagne löschen</button>
      </p>
      <p v-if="endHint" class="hint">{{ endHint }}</p>
    </template>
  </header>
</template>
