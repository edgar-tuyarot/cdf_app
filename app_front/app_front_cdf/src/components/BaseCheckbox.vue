<template>
  <div class="base-checkbox-container" @click="toggle">
    <div class="checkbox-wrapper">
      <input 
        type="checkbox" 
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
        class="hidden-checkbox"
      />
      <div class="styled-checkbox" :class="{ 'is-checked': modelValue }">
        <span v-if="modelValue" class="check-icon">✓</span>
      </div>
    </div>
    <label v-if="label" class="base-label">{{ label }}</label>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  label: String
})
const emit = defineEmits(['update:modelValue'])

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>

<style scoped>
.base-checkbox-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: var(--space-md);
  cursor: pointer;
  user-select: none;
  padding: 8px 4px;
}

.checkbox-wrapper {
  position: relative;
  width: 24px;
  height: 24px;
}

.hidden-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.styled-checkbox {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border);
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.styled-checkbox.is-checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.check-icon {
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
}

.base-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
}

.base-checkbox-container:hover .styled-checkbox {
  border-color: var(--color-primary);
}
</style>
