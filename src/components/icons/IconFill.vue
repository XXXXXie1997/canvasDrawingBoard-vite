<template>
  <svg viewBox="0 0 24 24" :width="size" :height="size">
    <!-- 油漆桶图标 -->
    <path d="M19 11H5M19 11C20.1 11 21 11.9 21 13V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V13C3 11.9 3.9 11 5 11M19 11V9C19 7.9 18.1 7 17 7H7C5.9 7 5 7.9 5 9V11M12 3L8 7H16L12 3Z" 
      stroke="currentColor" 
      stroke-width="1.5" 
      fill="none" 
      stroke-linecap="round" 
      stroke-linejoin="round"/>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ size?: number }>();
</script>
