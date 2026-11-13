<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ busy: boolean }>()

const count = ref(1000)
const canGenerate = ref(true)
</script>

<template>
  <section class="main-section options" aria-label="Generation Options">
    <button v-if="busy" type="button" class="btn">Cancel</button>
    <button
      v-else
      type="button"
      class="btn primary"
      :disabled="!canGenerate"
      title="Generate (Ctrl/⌘ + Enter)"
    >
      Generate
    </button>
    <label class="field">
      <span>Words</span>
      <input
        :value="count"
        class="input count"
        type="number"
        inputmode="numeric"
        min="1"
        max="1000000"
        step="1"
      />
    </label>
    <label class="checkbox">
      <input type="checkbox" />
      <span>New line each</span>
    </label>
    <label class="checkbox">
      <input type="checkbox" />
      <span>Filter duplicates</span>
    </label>
  </section>
</template>
