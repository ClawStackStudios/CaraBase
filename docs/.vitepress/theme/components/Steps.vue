<template>
  <div class="cb-steps">
    <slot />
  </div>
</template>

<style scoped>
.cb-steps {
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
}

.cb-steps::before {
  content: '';
  position: absolute;
  top: 1.5rem;
  bottom: 1.5rem;
  left: 17px;
  width: 2px;
  background: linear-gradient(to bottom, #14b8a6, #06b6d4);
  opacity: 0.3;
}
</style>
