<script setup>
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'

const stats = [
  { label: 'Pedidos Hoy', value: '24', icon: '🛒', color: '#E66B1E' },
  { label: 'Completados', value: '18', icon: '✅', color: '#28A745' },
  { label: 'Pendientes', value: '6', icon: '⏳', color: '#DC3545' }
]
</script>

<template>
  <div class="dashboard-view">
    <header class="view-header">
      <h2>Dashboard</h2>
      <p>Resumen de actividad</p>
    </header>

    <div class="stats-grid">
      <BaseCard v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" :style="{ backgroundColor: stat.color + '20', color: stat.color }">
            {{ stat.icon }}
          </div>
          <div class="stat-info">
            <span class="stat-label">{{ stat.label }}</span>
            <span class="stat-value">{{ stat.value }}</span>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseCard>
      <template #header>
        <h3>Acciones Rápidas</h3>
      </template>
      <div class="quick-actions">
        <BaseButton fullWidth>Nuevo Envasado</BaseButton>
        <BaseButton variant="secondary" fullWidth>Ver Inventario</BaseButton>
      </div>
    </BaseCard>

    <BaseCard>
      <template #header>
        <h3>Actividad Reciente</h3>
      </template>
      <ul class="activity-list">
        <li v-for="i in 3" :key="i" class="activity-item">
          <div class="activity-dot"></div>
          <div class="activity-text">
            <strong>Pedido #{{ 1000 + i }}</strong>
            <span>Envasado completado hace 10 min</span>
          </div>
        </li>
      </ul>
    </BaseCard>
  </div>
</template>

<style scoped>
.dashboard-view {
  padding-bottom: 40px;
}

.view-header {
  margin-bottom: var(--space-lg);
}

.view-header h2 {
  margin-bottom: 4px;
}

.view-header p {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.stat-card {
  margin-bottom: 0; /* Override default card margin */
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  border: 2px solid var(--color-border);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 800;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.activity-list {
  list-style: none;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #F0F0F0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--color-primary);
  margin-top: 6px;
  border: 1px solid var(--color-border);
}

.activity-text {
  display: flex;
  flex-direction: column;
}

.activity-text strong {
  font-size: 0.9rem;
}

.activity-text span {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
