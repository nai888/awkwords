<script setup lang="ts">
import { useTheme } from './composables/useTheme'

const logoUrl = `${import.meta.env.BASE_URL}favicon.svg`
const { label: themeLabel, cycle: cycleTheme } = useTheme()
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
          <button type="button" class="btn subtle">Open</button>
          <button type="button" class="btn subtle">Save</button>
          <button type="button" class="btn subtle">Share</button>
          <button type="button" class="btn subtle" @click="cycleTheme">
            {{ themeLabel }} Theme
          </button>
          <button type="button" class="btn subtle">Help</button>
        </nav>
      </div>
    </header>
    <main class="layout">
      <div class="content"></div>
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

<style scoped></style>
