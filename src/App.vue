<script setup lang="ts">
const logoUrl = `${import.meta.env.BASE_URL}favicon.svg`
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <img :src="logoUrl" alt="" width="28" height="28" />
        <h1>Awkwords</h1>
      </div>
    </header>
  </div>
</template>

<style scoped></style>
