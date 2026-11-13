<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { tokenize } from '../engine'

/**
 * A single-line text input with syntax colouring. The real <input> sits on top
 * with transparent text (so typing, selection and the caret behave natively);
 * a coloured copy of the text is drawn underneath and kept scrolled in sync.
 */
const props = defineProps<{
  /** Letters that have a subpattern; other capitals are flagged. */
  defined: Set<string>
  index?: number
  ariaLabel: string
  placeholder?: string
  large?: boolean
}>()

const model = defineModel()

const emit = defineEmits<{ 'update:model': [value: string] }>()

const input = ref<HTMLInputElement | null>(null)
const layer = ref<HTMLElement | null>(null)

const tokens = computed(() => tokenize(model.value as string, props.defined))

function sync(): void {
  if (input.value && layer.value) {
    layer.value.scrollLeft = input.value.scrollLeft
  }
}

function syncSoon(): void {
  // the input scrolls to the caret after the event has been handled
  void nextTick(() => {
    return requestAnimationFrame(sync)
  })
}

function onInput(event: Event): void {
  emit('update:model', (event.target as HTMLInputElement).value)
  syncSoon()
}

const inputName = props.index === undefined ? 'pattern' : `row ${props.index + 1}`
</script>

<template>
  <div class="hl-wrap" :class="{ large }">
    <div ref="layer" class="hl-layer" aria-hidden="true">
      <span class="hl-text mono">
        <span v-for="(t, i) in tokens" :key="i" :class="`tok-${t.kind}`">{{ t.text }}</span>
      </span>
    </div>
    <input
      ref="input"
      class="hl-input mono"
      type="text"
      :name="inputName"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      :value="model"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      @input="onInput"
      @scroll="sync"
      @keyup="syncSoon"
      @focus="syncSoon"
      @select="syncSoon"
      @mouseup="syncSoon"
    />
  </div>
</template>
