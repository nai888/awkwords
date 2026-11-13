<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  MAX_WEIGHT,
  canEditWeights,
  clampWeight,
  setAllWeights,
  setOptionWeight,
  splitOptions,
} from '../engine'
import { useSettings } from '../composables/useSettings'

type Target = { kind: 'pattern' } | { kind: 'row'; id: number }

const { state } = useSettings()

const dialog = ref<HTMLDialogElement | null>(null)
const target = ref<Target>({ kind: 'pattern' })

function open(t: Target): void {
  target.value = t
  dialog.value?.showModal()
}

function close(): void {
  dialog.value?.close()
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === dialog.value) close()
}

defineExpose({ open })

const row = computed(() =>
  target.value.kind === 'row'
    ? state.rows.find((r) => r.id === (target.value as { id: number }).id)
    : undefined,
)

const title = computed(() => {
  if (target.value.kind === 'pattern') return 'Weights: main pattern'
  return row.value?.name ? `Weights: subpattern ${row.value.name}` : 'Weights: subpattern'
})

const source = computed<string>({
  get: () => (target.value.kind === 'pattern' ? state.pattern : (row.value?.content ?? '')),
  set: (value) => {
    if (target.value.kind === 'pattern') {
      state.pattern = value
    } else if (row.value) {
      row.value.content = value
    }
  },
})

const editable = computed(() => canEditWeights(source.value))
const options = computed(() => splitOptions(source.value))
const total = computed(() => options.value.reduce((sum, o) => sum + o.weight, 0))
const anyWeighted = computed(() => options.value.some((o) => o.weight !== 1))

const percent = (weight: number): string => {
  const p = (weight / total.value) * 100
  return `${p >= 10 || Number.isInteger(p) ? p.toFixed(0) : p.toFixed(1)}%`
}

function setWeight(index: number, weight: number): void {
  source.value = setOptionWeight(source.value, index, weight)
}

function onTyped(index: number, event: Event): void {
  const input = event.target as HTMLInputElement
  const n = parseInt(input.value, 10)
  setWeight(index, clampWeight(n))
  input.value = String(clampWeight(n)) // show the clamped value even if the weight itself didn't change
}

function resetAll(): void {
  source.value = setAllWeights(source.value, 1)
}
</script>

<template>
  <dialog
    ref="dialog"
    class="help weights"
    aria-labelledby="weights-title"
    @click="onBackdropClick"
  >
    <article class="help-body">
      <header class="help-head">
        <h2 id="weights-title">{{ title }}</h2>
        <button type="button" class="btn icon" aria-label="Close" @click="close">&#x2715;</button>
      </header>

      <p v-if="!editable" class="notice warning-note">
        This pattern has unmatched brackets or quotes. Fix those in the field first; then you can
        edit weights here.
      </p>
      <p v-else-if="options.length < 2" class="hint">
        Weights decide how likely each option is, so they need at least two options separated by
        <code>/</code>. This only has one.
      </p>
      <template v-else>
        <p class="hint">
          An option&rsquo;s chance is its weight divided by the total. Changes are written straight
          into the pattern (<code>*N</code> after an option). Options inside <code>[ ]</code> or
          <code>( )</code> groups need to be edited in the field itself.
        </p>
        <ul class="weight-list">
          <li v-for="(o, i) in options" :key="i" class="weight-row">
            <code class="weight-text" :title="o.text">{{ o.text || '(empty)' }}</code>
            <div class="stepper">
              <button
                type="button"
                class="btn icon"
                :disabled="o.weight <= 1"
                :aria-label="`Decrease weight of ${o.text || 'empty option'}`"
                @click="setWeight(i, o.weight - 1)"
              >
                &#x2212;
              </button>
              <input
                class="input weight-input"
                type="number"
                inputmode="numeric"
                min="1"
                :name="`option ${i + 1}`"
                :max="MAX_WEIGHT"
                :value="o.weight"
                :aria-label="`Weight of ${o.text || 'empty option'}`"
                @change="onTyped(i, $event)"
              />
              <button
                type="button"
                class="btn icon"
                :disabled="o.weight >= MAX_WEIGHT"
                :aria-label="`Increase weight of ${o.text || 'empty option'}`"
                @click="setWeight(i, o.weight + 1)"
              >
                +
              </button>
            </div>
            <div class="bar" role="img" :aria-label="`${percent(o.weight)} chance`">
              <span class="bar-fill" :style="{ width: `${(o.weight / total) * 100}%` }" />
            </div>
            <span class="pct">{{ percent(o.weight) }}</span>
          </li>
        </ul>
        <div class="dialog-actions">
          <button type="button" class="btn subtle" :disabled="!anyWeighted" @click="resetAll">
            Reset all to 1
          </button>
          <button type="button" class="btn primary" @click="close">Done</button>
        </div>
      </template>
    </article>
  </dialog>
</template>
