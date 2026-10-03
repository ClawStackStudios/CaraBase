<script setup lang="ts">
defineProps<{
  cols?: number | string
}>()
</script>

<template>
  <div 
    class="cb-card-grid"
    :class="{
      'cols-1': cols === 1 || cols === '1',
      'cols-2': !cols || cols === 2 || cols === '2',
      'cols-3': cols === 3 || cols === '3',
      'cols-4': cols === 4 || cols === '4',
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.cb-card-grid {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}

.cb-card-grid.cols-1 {
  grid-template-columns: 1fr;
}

.cb-card-grid.cols-2 {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.cb-card-grid.cols-3 {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.cb-card-grid.cols-4 {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
</style>
