<script setup lang="ts">
defineProps<{
  title: string
  number?: number | string
}>()
</script>

<template>
  <div class="cb-step">
    <div class="cb-step-indicator">
      <span class="cb-step-number">{{ number }}</span>
    </div>
    <div class="cb-step-content">
      <h3 class="cb-step-title">{{ title }}</h3>
      <div class="cb-step-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cb-step {
  display: flex;
  gap: 1.25rem;
  position: relative;
  z-index: 1;
}

.cb-step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--vp-c-bg);
  border: 2px solid #14b8a6;
  color: #14b8a6;
  font-weight: 800;
  font-size: 0.9rem;
  flex-shrink: 0;
  box-shadow: 0 0 15px rgba(20, 184, 166, 0.35);
}

.cb-step-content {
  flex-grow: 1;
  padding-top: 0.25rem;
}

.cb-step-title {
  margin: 0 0 0.5rem 0 !important;
  font-size: 1.15rem !important;
  font-weight: 700 !important;
  color: var(--vp-c-text-1);
}

.cb-step-body {
  color: var(--vp-c-text-2);
}

.cb-step-body :deep(p:first-child) {
  margin-top: 0;
}
</style>
