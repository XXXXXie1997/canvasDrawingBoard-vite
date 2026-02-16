<template>
  <svg viewBox="0 0 24 24" :width="size" :height="size">
    <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ size?: number }>();
</script>
