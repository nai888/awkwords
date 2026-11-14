<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSettings } from '../composables/useSettings'
import type { Row } from '../composables/useSettings'
import { isSubpatternName } from '../engine'
import HighlightedInput from './HighlightedInput.vue'
import WeightsDialog from './WeightsDialog.vue'

const { state, canAddRow, addRow, removeRow, normalizeName } = useSettings()

const weights = ref<InstanceType<typeof WeightsDialog> | null>(null)

/** Letters that currently have a subpattern, used to flag undefined capitals. */
const definedLetters = computed<Set<string>>(() => {
  return new Set(state.rows.map((r) => r.name).filter(isSubpatternName))
})

function onNameInput(row: Row, event: Event): void {
  const input = event.target as HTMLInputElement
  row.name = normalizeName(input.value)
  input.value = row.name
}
</script>

<template>
  <section class="main-section" aria-labelledby="subpatterns-heading">
    <header class="section-head">
      <h2 id="subpatterns-heading">Subpatterns</h2>
      <p class="hint">
        Name a fragment with a capital letter, then use that letter in any pattern.
      </p>
    </header>
    <ul class="rows">
      <li v-for="(row, index) in state.rows" :key="row.id" class="row">
        <input
          class="input mono name"
          type="text"
          :name="`row ${index + 1} name`"
          maxlength="1"
          autocomplete="off"
          spellcheck="false"
          placeholder="A"
          :value="row.name"
          :aria-label="`Letter for subpattern ${index + 1}`"
          @input="onNameInput(row, $event)"
        />
        <span class="equals" aria-hidden="true">=</span>
        <HighlightedInput
          v-model="row.content"
          class="grow"
          placeholder="a/i/u"
          :index="index"
          :defined="definedLetters"
          :ariaLabel="`Pattern for subpattern ${row.name || index + 1}`"
        />
        <button
          type="button"
          class="btn icon subtle"
          title="Edit option weights"
          :aria-label="`Edit weights for subpattern ${row.name || index + 1}`"
          @click="weights?.open({ kind: 'row', id: row.id })"
        >
          &#x2696;
        </button>
        <button
          type="button"
          class="btn icon subtle"
          :aria-label="`Remove subpattern ${row.name || index + 1}`"
          @click="removeRow(row.id)"
        >
          &#x2715;
        </button>
      </li>
    </ul>
    <button type="button" class="btn subtle" :disabled="!canAddRow" @click="addRow">
      + Add Subpattern
    </button>
  </section>
  <section class="main-section" aria-labelledby="pattern-heading">
    <header class="section-head">
      <h2 id="pattern-heading">Pattern</h2>
      <p class="hint">
        Use <code>/</code> to choose, <code>[ ]</code> to group, <code>( )</code> to make optional,
        <code>*x</code> for weights, <code>^y</code> to filter, and <code>"&hellip;"</code> to
        escape.
      </p>
    </header>
    <div class="row">
      <HighlightedInput
        v-model="state.pattern"
        class="grow"
        large
        placeholder="CV(N)"
        ariaLabel="Main pattern"
        :defined="definedLetters"
      />
      <button
        type="button"
        class="btn icon subtle"
        title="Edit option weights"
        aria-label="`Edit weights for subpattern`"
        @click="weights?.open({ kind: 'pattern' })"
      >
        &#x2696;
      </button>
    </div>
  </section>
  <WeightsDialog ref="weights" />
</template>
