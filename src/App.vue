<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from './composables/useTheme'
import PatternEditor from './components/PatternEditor.vue'
import ValidationList from './components/ValidationList.vue'
import OptionsBar from './components/OptionsBar.vue'
import StatusMessage from './components/StatusMessage.vue'

const logoUrl = `${import.meta.env.BASE_URL}favicon.svg`
const { label: themeLabel, cycle: cycleTheme } = useTheme()

const errors: string[] = []
const warnings: string[] = []
const status = ref('')

// toast message
let statusTimer: ReturnType<typeof setTimeout> | undefined
function notify(message: string): void {
  status.value = message
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => (status.value = ''), 3000)
}

// temporary notification that a feature isn't yet implemented
function notImplemented(): void {
  notify('Sorry, this feature is not implemented yet.')
}
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
          <button type="button" class="btn subtle" disabled @click="notImplemented">Open</button>
          <button type="button" class="btn subtle" disabled @click="notImplemented">Save</button>
          <button type="button" class="btn subtle" @click="notImplemented">Share</button>
          <button type="button" class="btn subtle" @click="cycleTheme">
            {{ themeLabel }} Theme
          </button>
          <button type="button" class="btn subtle" disabled @click="notImplemented">Help</button>
        </nav>
      </div>
    </header>
    <main class="layout">
      <div class="content">
        <PatternEditor />
        <ValidationList :errors="errors" :warnings="warnings" />
        <OptionsBar />
        <StatusMessage :status="status" />
      </div>
    </main>
    <footer class="footer">
      <div class="content">
        <p class="footer-text">
          Awkwords by Petr Mejzlík. Ported to Vue by Ian Cook.
          <a href="https://github.com/nai888/awkwords" target="_blank" rel="noreferrer noopener"
            >View on GitHub</a
          >.
        </p>
      </div>
    </footer>
  </div>
</template>
