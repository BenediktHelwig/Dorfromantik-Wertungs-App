<script setup>
const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  disabled: { type: Boolean, default: false },
  /** 'input' = bei jedem Tastendruck melden, 'change' = erst beim Verlassen des Felds */
  commitOn: { type: String, default: 'input' },
});
const emit = defineEmits(['update']);

function report(event, type) {
  if (type !== props.commitOn) return;
  const text = event.target.value;
  emit('update', text === '' ? 0 : Number(text));
}
</script>

<template>
  <label>
    {{ label }}
    <!-- 0 als leeres Feld mit Platzhalter zeigen, damit man nicht "010" tippt. -->
    <input
      type="number" min="0" step="1" inputmode="numeric" placeholder="0" :value="value === 0 ? '' : value"
      :disabled="disabled" @input="report($event, 'input')" @change="report($event, 'change')"
    >
  </label>
</template>
