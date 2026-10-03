<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{
  title: string
  href?: string
  icon?: string
  tag?: string
}>()

const isExternal = computed(() => props.href && /^https?:\/\//.test(props.href))

// Internal links must be base-prefixed (site deploys under VITEPRESS_BASE, e.g. /ShellGuard/).
// Raw HTML href bindings are NOT auto-rewritten by VitePress — only theme-config and
// markdown links are. Without this, every Card 404s on the deployed site.
const normalizedHref = computed(() => {
  if (!props.href || isExternal.value || props.href.startsWith('#')) return props.href
  return withBase(props.href)
})
</script>

<template>
  <component
    :is="href ? 'a' : 'div'"
    :href="normalizedHref"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noreferrer noopener' : undefined"
    class="cb-card"
    :class="{ 'is-link': !!href }"
  >
    <div class="cb-card-header">
      <div class="cb-card-icon-wrap" v-if="icon || $slots.icon">
        <slot name="icon">
          <!-- Fallback or emoji icon -->
          <span class="cb-card-icon">{{ icon }}</span>
        </slot>
      </div>
      <div class="cb-card-title-wrap">
        <h4 class="cb-card-title">{{ title }}</h4>
        <span v-if="tag" class="cb-card-tag">{{ tag }}</span>
      </div>
    </div>
    <div class="cb-card-body">
      <slot />
    </div>
    <div v-if="href" class="cb-card-arrow">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </div>
  </component>
</template>

<style scoped>
.cb-card {
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 1.25rem;
  border-radius: 14px;
  background: var(--cb-card-bg, rgba(15, 23, 42, 0.6));
  border: 1px solid var(--cb-card-border, rgba(20, 184, 166, 0.15));
  backdrop-filter: blur(12px);
  text-decoration: none !important;
  color: inherit;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.cb-card.is-link {
  cursor: pointer;
}

.cb-card.is-link:hover {
  border-color: rgba(20, 184, 166, 0.45);
  background: var(--cb-card-hover-bg, rgba(20, 184, 166, 0.05));
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(20, 184, 166, 0.12), 0 0 1px 1px rgba(20, 184, 166, 0.2);
}

.cb-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.cb-card-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(20, 184, 166, 0.12);
  border: 1px solid rgba(20, 184, 166, 0.25);
  color: #14b8a6;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.cb-card-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-grow: 1;
}

.cb-card-title {
  margin: 0 !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  color: var(--vp-c-text-1);
  line-height: 1.3;
}

.cb-card-tag {
  font-size: 0.65rem;
  font-weight: 700;
  font-family: monospace;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.cb-card-body {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.cb-card-body :deep(p) {
  margin: 0;
}

.cb-card-arrow {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  color: var(--vp-c-text-3);
  transition: all 0.2s ease;
  opacity: 0.5;
}

.cb-card:hover .cb-card-arrow {
  color: #14b8a6;
  transform: translateX(3px);
  opacity: 1;
}
</style>
