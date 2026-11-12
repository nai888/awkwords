<script setup lang="ts">
defineProps<{ status: string }>()
</script>

<template>
  <section class="status" role="alert" aria-label="Notification">
    <div class="toast" v-if="status">
      <p>{{ status }}</p>
    </div>
  </section>
</template>
