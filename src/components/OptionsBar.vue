<script setup lang="ts">
import { useSettings } from '../composables/useSettings'

defineProps<{ busy: boolean; canGenerate: boolean }>()

const emit = defineEmits<{ generate: []; cancel: [] }>()

const { state } = useSettings()
</script>

<template>
  <section class="main-section options" aria-label="Generation Options">
    <button v-if="busy" type="button" class="btn" @click="emit('cancel')">Cancel</button>
    <button
      v-else
      type="button"
      class="btn primary"
      :disabled="!canGenerate"
      title="Generate (Ctrl/⌘ + Enter)"
      @click="emit('generate')"
    >
      Generate
    </button>
    <div class="spacer" />
    <label class="field">
      <span>Words</span>
      <input
        v-model.number="state.count"
        class="input count"
        type="number"
        inputmode="numeric"
        min="1"
        max="1000000"
        step="1"
      />
    </label>
    <label class="checkbox">
      <input v-model="state.newLineEach" type="checkbox" />
      <span>New line each</span>
    </label>
    <label class="checkbox">
      <input v-model="state.filterDuplicates" type="checkbox" />
      <span>Filter duplicates</span>
    </label>
  </section>
</template>
