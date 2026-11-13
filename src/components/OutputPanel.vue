<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ busy: boolean; errors: string[] }>()

const PREVIEW_WORDS = 20000

const hasWords = ref(false)
const truncated = ref(false)
const words = ref([])
</script>

<template>
  <section class="main-section" aria-labelledby="output-heading" :aria-busy="busy">
    <header class="section-head row-head">
      <h2 id="output-heading">Output</h2>
      <div class="actions">
        <button type="button" class="btn subtle" :disabled="!hasWords">Select All</button>
        <button type="button" class="btn subtle" :disabled="!hasWords">Copy</button>
        <button type="button" class="btn subtle" :disabled="!hasWords">Download</button>
      </div>
    </header>
    <p v-if="truncated && words" class="hint output-truncated" role="note">
      Showing the first {{ PREVIEW_WORDS.toLocaleString() }} of
      {{ words.length.toLocaleString() }} words. Copy and Download include all of them.
    </p>
    <textarea
      class="input mono output"
      readonly
      spellcheck="false"
      placeholder="Generated words appear here."
      aria-label="Generated words"
    />
    <p v-if="busy" class="hint stats" role="status">Generating&hellip;</p>
    <dl v-else-if="words && errors.length === 0" class="stats">
      <div>
        <!-- add functionality to pluralize only as needed -->
        <dt>Words</dt>
        <!-- number of words -->
        <dd></dd>
      </div>
      <div>
        <dt>Filtered Out</dt>
        <!-- number filtered out -->
        <dd></dd>
      </div>
      <div>
        <dt>Time</dt>
        <!-- seconds -->
        <dd></dd>
      </div>
      <div>
        <dt>Max. Unique Words</dt>
        <!-- max number of unique words -->
        <dd></dd>
      </div>
    </dl>
  </section>
</template>
