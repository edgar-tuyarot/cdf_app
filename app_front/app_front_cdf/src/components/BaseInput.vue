<template>
  <div class="base-input-container">
    <label v-if="label" class="base-label">{{ label }}</label>
    <input 
      :type="type" 
      :placeholder="placeholder"
      :value="modelValue"
      :list="list"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
      class="base-input"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  placeholder: String,
  list: String,
  disabled: Boolean,
  type: {
    type: String,
    default: 'text'
  }
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.base-input-container {
  margin-bottom: var(--space-md);
  width: 100%;
}

.base-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 6px;
  padding-left: 4px;
}

.base-input {
  width: 100%;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border);
  background-color: white;
  font-size: 1rem;
  transition: all 0.2s ease;
  outline: none;
}

.base-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(230, 107, 30, 0.1);
}

.base-input:disabled {
  background-color: #F5F5F5;
  border-color: #E0E0E0;
  color: #9E9E9E;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
