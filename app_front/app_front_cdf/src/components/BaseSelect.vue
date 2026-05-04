<template>
  <div class="base-select-container">
    <label v-if="label" class="base-label">{{ label }}</label>
    <div class="select-wrapper">
      <select 
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        class="base-select"
        :required="required"
      >
        <option v-if="placeholder" value="" disabled selected>{{ placeholder }}</option>
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <span class="chevron">▼</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  placeholder: String,
  options: {
    type: Array,
    required: true
  },
  required: {
    type: Boolean,
    default: false
  }
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.base-select-container {
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

.select-wrapper {
  position: relative;
  width: 100%;
}

.base-select {
  width: 100%;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border);
  background-color: white;
  font-size: 1rem;
  appearance: none;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.base-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(230, 107, 30, 0.1);
}

.chevron {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 0.7rem;
  color: var(--color-text-muted);
}
</style>
