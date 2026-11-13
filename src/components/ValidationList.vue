<script setup lang="ts">
import type { Issue } from '../engine'

defineProps<{ errors: Issue[]; warnings: string[] }>()
</script>

<template>
  <div v-if="errors.length > 0 || warnings.length > 0" class="messages">
    <ul v-if="errors.length > 0" class="message-list error" role="alert">
      <li v-for="issue in errors" :key="issue.kind + issue.message">
        <strong>Error:</strong> {{ issue.message }}
      </li>
    </ul>
    <ul v-if="warnings.length > 0" class="message-list warning">
      <li v-for="warning in warnings" :key="warning"><strong>Note:</strong> {{ warning }}</li>
    </ul>
  </div>
</template>
