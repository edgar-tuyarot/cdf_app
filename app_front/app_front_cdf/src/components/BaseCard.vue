<template>
  <div class="base-card">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.base-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  margin-bottom: var(--space-lg);
}

.card-header {
  padding: var(--space-lg) var(--space-lg) var(--space-md);
  border-bottom: 1px solid #F0F0F0;
}

.card-body {
  padding: var(--space-lg);
}

.card-footer {
  padding: var(--space-md) var(--space-lg);
  background-color: #FAFAFA;
  border-top: 1px solid #F0F0F0;
}
</style>
