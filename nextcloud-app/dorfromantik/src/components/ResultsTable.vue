<script setup>
defineProps({
  rows: { type: Array, required: true },
  totalCrosses: { type: Number, required: true },
});
</script>

<template>
  <section>
    <h2>Eure Ergebnisse</h2>
    <p>Kreuze gesamt: <strong>{{ totalCrosses }}</strong></p>
    <table>
      <thead><tr><th>Zeile</th><th>Titel</th><th>Kreuze</th><th>Spiele</th></tr></thead>
      <tbody>
        <tr v-for="row in rows" :key="row.min">
          <td>{{ row.min }}</td><td>{{ row.title ?? '' }}</td><td>{{ row.crosses }}</td><td>{{ row.gameNumbers.join(', ') }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
