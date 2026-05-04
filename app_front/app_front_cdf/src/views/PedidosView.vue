<template>
  <div class="pedidos-view">
    <header class="view-header">
      <h2>Pedidos</h2>
      <p>{{ currentTabTitle }}</p>
    </header>

    <BaseCard>
      <div class="placeholder-content">
        <span class="material-icons icon">shopping_cart</span>
        <h3>Sección en Desarrollo</h3>
        <p>Estamos trabajando en la funcionalidad de <strong>{{ currentTabTitle }}</strong>.</p>
        <BaseButton @click="$router.push('/')" variant="minimal" size="small">
          Volver al Dashboard
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'

const route = useRoute()

const currentTabTitle = computed(() => {
  if (route.path.includes('actuales')) return 'Pedidos Actuales'
  if (route.path.includes('historial')) return 'Historial de Pedidos'
  if (route.path.includes('nuevo')) return 'Crear Pedido'
  return 'Gestión de Pedidos'
})
</script>

<style scoped>
.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  text-align: center;
  color: var(--color-text-muted);
}

.icon {
  font-size: 4rem;
  margin-bottom: var(--space-md);
  color: var(--color-border);
}

h3 {
  margin-bottom: var(--space-xs);
  color: var(--color-text);
}

p {
  margin-bottom: var(--space-md);
}
</style>
