<script setup lang="ts">
defineProps<{ status: string; displayStatus: string }>()
</script>

<template>
  <section class="main-section status" role="alert" aria-label="Notification">
    <div class="toast" :class="displayStatus">
      <p>{{ status }}</p>
    </div>
  </section>
</template>
