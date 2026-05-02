<template>
  <div class="modificar-producto-view">
    <header class="view-header">
      <h2>Modificar Producto</h2>
      <p>Actualizar información de productos existentes</p>
    </header>

    <BaseCard>
      <div class="placeholder-content">
        <span class="icon">✏️</span>
        <p>Próximamente: Buscador de productos para edición.</p>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import BaseCard from '../components/BaseCard.vue'
</script>

<style scoped>
.view-header {
  margin-bottom: var(--space-lg);
}
.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  color: var(--color-text-muted);
  text-align: center;
}
.icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
}
</style>
