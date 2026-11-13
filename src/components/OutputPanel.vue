<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatBigInt, formatOutput } from '../engine'
import type { GenerateResult } from '../engine'
import { copyText, downloadText } from '../io/io'

const PREVIEW_WORDS = 20000

const props = defineProps<{
  result: GenerateResult | null
  busy: boolean
  newLineEach: boolean
}>()

const emit = defineEmits<{ notify: [message: string] }>()

const output = ref<HTMLTextAreaElement | null>(null)

const hasWords = computed(() => (props.result?.words.length ?? 0) > 0)

const truncated = computed(() => (props.result?.words.length ?? 0) > PREVIEW_WORDS)

const shownText = computed(() =>
  props.result ? formatOutput(props.result.words.slice(0, PREVIEW_WORDS), props.newLineEach) : '',
)

/** The full output, built only when needed. */
function fullText(): string {
  return props.result ? formatOutput(props.result.words, props.newLineEach) : ''
}

async function copy(): Promise<void> {
  if (!hasWords.value) return
  emit(
    'notify',
    (await copyText(fullText()))
      ? 'Copied to clipboard'
      : 'Copy failed — select the text and copy it manually',
  )
}

function download(): void {
  if (!hasWords.value) return
  downloadText('awkwords-words.txt', fullText() + '\n')
  emit('notify', 'Downloaded awkwords-words.txt')
}

function selectAll(): void {
  output.value?.focus()
  output.value?.select()
}
</script>

<template>
  <section class="main-section" aria-labelledby="output-heading" :aria-busy="busy">
    <header class="section-head row-head">
      <h2 id="output-heading">Output</h2>
      <div class="actions">
        <button type="button" class="btn subtle" :disabled="!hasWords" @click="selectAll">
          Select All
        </button>
        <button type="button" class="btn subtle" :disabled="!hasWords" @click="copy">Copy</button>
        <button type="button" class="btn subtle" :disabled="!hasWords" @click="download">
          Download
        </button>
      </div>
    </header>
    <p v-if="truncated && result" class="hint output-truncated" role="note">
      Showing the first {{ PREVIEW_WORDS.toLocaleString() }} of
      {{ result.words.length.toLocaleString() }} words. Copy and Download include all of them.
    </p>
    <textarea
      ref="output"
      class="input mono output"
      readonly
      spellcheck="false"
      :value="shownText"
      :wrap="newLineEach ? 'off' : 'soft'"
      placeholder="Generated words appear here."
      aria-label="Generated words"
    />
    <p v-if="busy" class="hint stats" role="status">Generating&hellip;</p>
    <dl v-else-if="result && result.errors.length === 0" class="stats">
      <div>
        <dt>{{ result.printed === 1 ? 'Word' : 'Words' }}</dt>
        <dd>{{ result.printed.toLocaleString() }}</dd>
      </div>
      <div>
        <dt>Filtered out</dt>
        <dd>{{ result.dropped.toLocaleString() }}</dd>
        <dd v-if="result.dropped > 0" class="sub">
          <template v-if="result.filtered"
            >{{ result.filtered.toLocaleString() }} by pattern filters</template
          >
          <template v-if="result.filtered && result.duplicates">, </template>
          <template v-if="result.duplicates">
            {{ result.duplicates.toLocaleString() }}
            {{ result.duplicates === 1 ? 'duplicate' : 'duplicates' }}
          </template>
        </dd>
      </div>
      <div>
        <dt>Time</dt>
        <dd>{{ (result.ms / 1000).toFixed(3) }} seconds</dd>
      </div>
      <div>
        <dt>Max. different words</dt>
        <dd :title="result.possibilities.toString()">{{ formatBigInt(result.possibilities) }}</dd>
      </div>
    </dl>
  </section>
</template>
