<script setup lang="ts">
import { version as VERSION } from '../package.json'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import HelpDialog from './components/HelpDialog.vue'
import OptionsBar from './components/OptionsBar.vue'
import OutputPanel from './components/OutputPanel.vue'
import PatternEditor from './components/PatternEditor.vue'
import ValidationList from './components/ValidationList.vue'
import { useGenerator } from './composables/useGenerator'
import { useSettings } from './composables/useSettings'
import { useTheme } from './composables/useTheme'
import { DEFAULT_FILENAME, FILE_EXTENSION, serializeSettings } from './engine'
import { copyText, downloadText, readSettingsFile } from './io/io'
import { buildShareUrl } from './io/share'

const { state, validation, toConfig, applyConfig } = useSettings()
const { result, busy, run, cancel } = useGenerator()

const help = ref<InstanceType<typeof HelpDialog> | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const logoUrl = `${import.meta.env.BASE_URL}favicon.svg`
const { label: themeLabel, cycle: cycleTheme } = useTheme()

const status = ref('')
const displayStatus = ref('')
// toast message
let statusTimer: ReturnType<typeof setTimeout> | undefined
let statusTextTimer: ReturnType<typeof setTimeout> | undefined
function notify(message: string): void {
  displayStatus.value = 'display-status'
  status.value = message
  clearTimeout(statusTimer)
  clearTimeout(statusTextTimer)
  statusTimer = setTimeout(() => (displayStatus.value = ''), 3250)
  statusTextTimer = setTimeout(() => (status.value = ''), 3500)
}

const canGenerate = computed(() => validation.value.ok && state.pattern !== '')
let loadedName = ''

function generateWords(): void {
  if (!canGenerate.value || busy.value) return
  run(toConfig())
}

// Messages shown under the editor: live validation problems, plus warnings from the last run.
const shownWarnings = computed(() =>
  validation.value.warnings.length > 0 ? validation.value.warnings : (result.value?.warnings ?? []),
)

function saveFile(): void {
  downloadText(loadedName || DEFAULT_FILENAME, serializeSettings(toConfig()))
  notify('Settings saved')
}

function openFilePicker(): void {
  fileInput.value?.click()
}

async function onFileChosen(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  try {
    applyConfig(await readSettingsFile(file))
    loadedName = file.name // saving again reuses the opened file's name
    notify(`Loaded ${file.name}`)
  } catch (error) {
    notify(error instanceof Error ? error.message : 'Could not read that file')
  } finally {
    input.value = '' // allow choosing the same file again
  }
}

async function share(): Promise<void> {
  const url = buildShareUrl(toConfig(), location.href)
  notify((await copyText(url)) ? 'Share link copied' : 'Could not copy the link')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    generateWords()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="content">
        <div class="brand">
          <img :src="logoUrl" alt="" width="28" height="28" />
          <h1>Awkwords</h1>
        </div>
        <nav class="toolbar" aria-label="Tools">
          <button type="button" class="btn subtle" @click="openFilePicker">Open</button>
          <button type="button" class="btn subtle" @click="saveFile">Save</button>
          <button type="button" class="btn subtle" @click="share">Share</button>
          <button type="button" class="btn subtle" @click="cycleTheme">
            {{ themeLabel }} Theme
          </button>
          <button type="button" class="btn subtle" @click="help?.open()">Help</button>
        </nav>
      </div>
      <input
        ref="fileInput"
        type="file"
        class="visually-hidden"
        :accept="`${FILE_EXTENSION},.txt,text/plain`"
        tabindex="-1"
        aria-hidden="true"
        @change="onFileChosen"
      />
    </header>
    <main class="layout">
      <div class="content">
        <PatternEditor />
        <ValidationList :errors="validation.errors" :warnings="shownWarnings" />
        <OptionsBar
          :busy="busy"
          :can-generate="canGenerate"
          @generate="generateWords"
          @cancel="cancel"
        />
        <OutputPanel
          :result="result"
          :busy="busy"
          :new-line-each="state.newLineEach"
          @notify="notify"
        />
      </div>
    </main>
    <StatusMessage :status="status" :displayStatus="displayStatus" />
    <footer class="footer">
      <div class="content">
        <p class="footer-text">
          Awkwords by Petr Mejzlík. Ported to Vue by Ian Cook. Version {{ VERSION }}.
          <a href="https://github.com/nai888/awkwords" target="_blank" rel="noreferrer noopener"
            >View on GitHub</a
          >.
        </p>
      </div>
    </footer>
    <HelpDialog ref="help" />
  </div>
</template>
