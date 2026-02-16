<template>
  <svg viewBox="0 0 24 24" :width="size" :height="size">
    <path d="M4 16 Q12 4 20 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ size?: number }>();
</script>
