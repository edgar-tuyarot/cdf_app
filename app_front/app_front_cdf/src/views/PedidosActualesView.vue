<script setup>
import { ref, onMounted } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'

const pedidos = ref([])
const isLoading = ref(true)
const error = ref('')
const expandedPedido = ref(null)

const fetchPedidos = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/pedidos')
    if (!res.ok) throw new Error('Error al cargar pedidos')
    pedidos.value = await res.json()
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchPedidos)

const toggleExpand = (id) => {
  expandedPedido.value = expandedPedido.value === id ? null : id
}

const formatFecha = (fecha) => {
  if (!fecha) return '—'
  try {
    const d = new Date(fecha)
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return fecha
  }
}

// Resumen calculado desde items reales
const getResumen = (pedido) => {
  const items = pedido.items || []
  const totalItems = items.length
  const totalFeteado = items
    .filter(i => i.tipo === 'FETEADO')
    .reduce((s, i) => s + (i.cantidad || 0), 0)
  const totalPiezas = items
    .filter(i => i.tipo === 'PIEZA')
    .reduce((s, i) => s + (i.cantidad || 0), 0)
  return { totalItems, totalFeteado, totalPiezas }
}

const estadoClass = (estado) => {
  if (!estado) return ''
  const e = estado.toUpperCase()
  if (e === 'CANCELADO') return 'estado-cancelado'
  if (e === 'PENDIENTE') return 'estado-pendiente'
  if (e === 'COMPLETADO' || e === 'ENTREGADO') return 'estado-completado'
  return 'estado-default'
}
</script>

<template>
  <div class="pedidos-actuales-view">
    <header class="view-header">
      <div class="header-content">
        <h2>Pedidos Actuales</h2>
        <p>Listado de pedidos registrados</p>
      </div>
      <BaseButton variant="minimal" size="small" @click="fetchPedidos" :disabled="isLoading">
        {{ isLoading ? '...' : 'Actualizar' }}
      </BaseButton>
    </header>

    <!-- Error -->
    <div v-if="error" class="alert error">
      ⚠️ {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando pedidos...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="pedidos.length === 0" class="empty-state">
      <span class="empty-icon">📋</span>
      <p>No hay pedidos registrados.</p>
      <BaseButton variant="minimal" size="small" @click="$router.push('/pedidos/nuevo')">
        Crear Pedido
      </BaseButton>
    </div>

    <!-- Lista de Pedidos -->
    <div v-else class="pedidos-list">
      <div
        v-for="pedido in pedidos"
        :key="pedido.id"
        class="pedido-card"
        :class="{ expanded: expandedPedido === pedido.id }"
      >
        <!-- Header del pedido -->
        <div class="pedido-header" @click="toggleExpand(pedido.id)">
          <div class="pedido-info">
            <div class="pedido-top-row">
              <span class="pedido-id">#{{ pedido.id }}</span>
              <span class="pedido-fecha">{{ formatFecha(pedido.fecha) }}</span>
              <span v-if="pedido.estado" :class="['estado-badge', estadoClass(pedido.estado)]">
                {{ pedido.estado }}
              </span>
            </div>
            <span class="pedido-sucursal">{{ pedido.sucursal?.nombre || '—' }}</span>
          </div>
          <div class="pedido-meta">
            <div class="meta-chips">
              <span class="chip" v-if="getResumen(pedido).totalFeteado > 0">
                {{ getResumen(pedido).totalFeteado }} fet.
              </span>
              <span class="chip" v-if="getResumen(pedido).totalPiezas > 0">
                {{ getResumen(pedido).totalPiezas }} pzas.
              </span>
              <span class="chip items-chip">
                {{ getResumen(pedido).totalItems }} ítem{{ getResumen(pedido).totalItems !== 1 ? 's' : '' }}
              </span>
            </div>
            <span class="expand-arrow" :class="{ rotated: expandedPedido === pedido.id }">▼</span>
          </div>
        </div>

        <!-- Detalle expandido -->
        <div v-if="expandedPedido === pedido.id" class="pedido-detail">
          <table class="detail-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in (pedido.items || [])" :key="item.id">
                <td>
                  <span class="code-badge">{{ item.productoCodigo }}</span>
                </td>
                <td class="prod-name">{{ item.productoNombre }}</td>
                <td class="qty-cell">{{ item.cantidad }}</td>
                <td>
                  <span :class="['tipo-badge', item.tipo === 'FETEADO' ? 'tipo-fet' : 'tipo-pieza']">
                    {{ item.tipo }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="detail-totals">
            <span>{{ getResumen(pedido).totalItems }} productos</span>
            <span v-if="getResumen(pedido).totalFeteado > 0">· {{ getResumen(pedido).totalFeteado }} feteado</span>
            <span v-if="getResumen(pedido).totalPiezas > 0">· {{ getResumen(pedido).totalPiezas }} piezas</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pedidos-actuales-view {
  max-width: 700px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-lg);
  gap: var(--space-md);
}

.header-content h2 {
  margin-bottom: 2px;
}

.header-content p {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl);
  color: var(--color-text-muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl);
  color: var(--color-text-muted);
  text-align: center;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: var(--space-sm);
}

/* Alert */
.alert {
  padding: 12px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: var(--space-md);
}

.alert.error {
  background-color: #FFEBEE;
  color: #C62828;
  border: 1px solid #FFCDD2;
}

/* Pedidos list */
.pedidos-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pedido-card {
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all 0.2s ease;
}

.pedido-card.expanded {
  border-color: var(--color-secondary);
}

.pedido-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.pedido-header:hover {
  background-color: #FAFAFA;
}

.pedido-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pedido-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pedido-id {
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--color-secondary);
}

.pedido-fecha {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.pedido-sucursal {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
}

.pedido-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.meta-chips {
  display: flex;
  gap: 6px;
}

.chip {
  background-color: #F0F4F8;
  border: 1px solid var(--color-border);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.expand-arrow {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  transition: transform 0.2s ease;
}

.expand-arrow.rotated {
  transform: rotate(180deg);
}

/* Detail */
.pedido-detail {
  border-top: 1px solid var(--color-border);
  padding: 12px 16px;
  background-color: #FAFAFA;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 500px; }
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.detail-table th {
  text-align: left;
  padding: 8px 10px;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #EEE;
}

.code-badge {
  background-color: var(--color-secondary);
  color: white;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 700;
  font-size: 0.8rem;
}

.prod-name {
  font-weight: 600;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-totals {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 480px) {
  .meta-chips {
    display: none;
  }

  .prod-name {
    max-width: 120px;
  }

  .detail-table th:nth-child(2),
  .detail-table td:nth-child(2) {
    max-width: 100px;
  }
}

/* Estado badges */
.estado-badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.estado-cancelado {
  background-color: #FFEBEE;
  color: #C62828;
}

.estado-pendiente {
  background-color: #FFF3E0;
  color: #E65100;
}

.estado-completado {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.estado-default {
  background-color: #F5F5F5;
  color: var(--color-text-muted);
}

/* Tipo badges */
.tipo-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.tipo-fet {
  background-color: #F3E5F5;
  color: #7B1FA2;
}

.tipo-pieza {
  background-color: #E3F2FD;
  color: #1565C0;
}

.qty-cell {
  font-weight: 800;
}

.items-chip {
  background-color: #E8EAF6;
  color: #3949AB;
}
</style>
