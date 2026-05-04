<template>
  <button 
    :class="['base-button', variant, size, { 'full-width': fullWidth }]" 
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary' // 'primary', 'secondary', 'outline', 'minimal'
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'medium' // 'small', 'medium', 'large'
  }
})
defineEmits(['click'])
</script>

<style scoped>
.base-button {
  padding: 14px 24px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.base-button.primary {
  background-color: var(--color-primary);
  color: white;
}

.base-button.primary:active {
  transform: scale(0.98);
  filter: brightness(0.9);
}

.base-button.secondary {
  background-color: var(--color-secondary);
  color: white;
}

.base-button.outline {
  background-color: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}

.base-button.minimal {
  background-color: transparent;
  border: 1px solid #000;
  color: #000;
  font-weight: 600;
  border-radius: var(--radius-sm);
}

.base-button.minimal:hover:not(:disabled) {
  background-color: #f5f5f5;
}

.base-button.minimal:disabled {
  border-color: #ccc;
  color: #ccc;
}

.base-button.small {
  padding: 8px 16px;
  font-size: 0.85rem;
}

.base-button.large {
  padding: 18px 32px;
  font-size: 1.1rem;
}

.full-width {
  width: 100%;
}
</style>
