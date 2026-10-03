<script setup lang="ts">
import { ref } from 'vue'

const copied = ref(false)

const copyMarkdown = () => {
  if (typeof window === 'undefined') return
  
  // Extract text or copy URL
  const content = document.querySelector('.vp-doc')?.textContent || document.body.textContent || ''
  navigator.clipboard.writeText(content).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  })
}
</script>

<template>
  <button 
    @click="copyMarkdown"
    class="cb-copy-page-btn"
    :class="{ 'is-copied': copied }"
    title="Copy page contents"
  >
    <svg v-if="!copied" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
    <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>{{ copied ? 'Copied!' : 'Copy Page' }}</span>
  </button>
</template>

<style scoped>
.cb-copy-page-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  background: rgba(20, 184, 166, 0.08);
  border: 1px solid rgba(20, 184, 166, 0.25);
  color: var(--vp-c-text-1);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cb-copy-page-btn:hover {
  background: rgba(20, 184, 166, 0.15);
  border-color: rgba(20, 184, 166, 0.5);
  color: #14b8a6;
  transform: translateY(-1px);
}

.cb-copy-page-btn.is-copied {
  border-color: rgba(16, 185, 129, 0.5);
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}
</style>
