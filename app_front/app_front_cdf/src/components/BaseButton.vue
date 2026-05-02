<template>
  <button 
    :class="['base-button', variant, { 'full-width': fullWidth }]" 
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary' // 'primary', 'secondary', 'outline'
  },
  fullWidth: {
    type: Boolean,
    default: false
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

.full-width {
  width: 100%;
}
</style>
