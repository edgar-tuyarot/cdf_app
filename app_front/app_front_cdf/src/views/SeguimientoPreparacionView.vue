<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import BaseCard from '../components/BaseCard.vue'

const pedidos = ref([])
const itemsPreparados = ref({}) // { pedidoId: [items] }
const isLoading = ref(true)
const error = ref('')
const expandedPedido = ref(null)
const autoRefreshInterval = ref(null)

const fetchPedidos = async () => {
  try {
    const res = await fetch('/api/pedidos')
    if (!res.ok) throw new Error('Error al cargar pedidos')
    const data = await res.json()
    
    // Solo mostramos pedidos que no estén cancelados ni entregados para el monitoreo activo
    pedidos.value = data.filter(p => p.estado !== 'CANCELADO' && p.estado !== 'ENTREGADO')
      .sort((a, b) => {
        if (a.estado === 'PREPARANDO' && b.estado !== 'PREPARANDO') return -1
        if (a.estado !== 'PREPARANDO' && b.estado === 'PREPARANDO') return 1
        return b.id - a.id
      })
      
    // Si hay un pedido expandido, refrescamos sus items automáticamente
    if (expandedPedido.value) {
      await fetchItemsPreparados(expandedPedido.value)
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const fetchItemsPreparados = async (pedidoId) => {
  try {
    const res = await fetch(`/api/pedidos/${pedidoId}/items-preparados`)
    if (res.ok) {
      itemsPreparados.value[pedidoId] = await res.json()
    }
  } catch (err) {
    console.error(`Error cargando items del pedido ${pedidoId}:`, err)
  }
}

const toggleExpand = async (pedidoId) => {
  if (expandedPedido.value === pedidoId) {
    expandedPedido.value = null
  } else {
    expandedPedido.value = pedidoId
    await fetchItemsPreparados(pedidoId)
  }
}

const getCumplimiento = (pedido) => {
  const lista = itemsPreparados.value[pedido.id] || []
  if (lista.length === 0) return 0
  const items = pedido.items || []
  let totalPedido = 0
  let totalPrep = 0
  for (const item of items) {
    totalPedido += (item.cantidad || 0)
    const prep = lista.find(p => p.productoCodigo === item.productoCodigo)
    if (prep) {
      totalPrep += Math.min(prep.cantidad, item.cantidad)
    }
  }
  return totalPedido === 0 ? 0 : Math.round((totalPrep / totalPedido) * 100)
}

const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-AR') : '—'

onMounted(() => {
  fetchPedidos()
  // Auto-refresh cada 30 segundos
  autoRefreshInterval.value = setInterval(fetchPedidos, 30000)
})

onUnmounted(() => {
  if (autoRefreshInterval.value) clearInterval(autoRefreshInterval.value)
})
</script>

<template>
  <div class="seguimiento-view">
    <header class="view-header">
      <div class="header-text">
        <h2>Monitoreo de Preparación</h2>
        <p>Seguimiento en tiempo real del armado de pedidos en planta</p>
      </div>
      <div class="header-actions">
        <span class="refresh-timer" v-if="!isLoading">Auto-refresh activo (30s)</span>
        <button class="btn-refresh" @click="fetchPedidos" :disabled="isLoading">
          <span class="material-icons" :class="{ 'spinning': isLoading }">refresh</span>
        </button>
      </div>
    </header>

    <div v-if="isLoading && pedidos.length === 0" class="loading-container">
      <span class="material-icons spinning">sync</span>
      <p>Cargando información en tiempo real...</p>
    </div>

    <div v-else-if="error" class="error-card">
      <span class="material-icons">error_outline</span>
      <p>{{ error }}</p>
      <button @click="fetchPedidos">Reintentar</button>
    </div>
    
    <div v-else class="monitor-grid">
      <div 
        v-for="pedido in pedidos" 
        :key="pedido.id" 
        class="monitor-card" 
        :class="{ 
          'status-preparando': pedido.estado === 'PREPARANDO',
          'is-expanded': expandedPedido === pedido.id 
        }"
      >
        <div class="card-main" @click="toggleExpand(pedido.id)">
          <div class="card-info">
            <div class="id-row">
              <span class="pedido-id">PEDIDO #{{ pedido.id }}</span>
              <span class="pedido-estado" :class="pedido.estado?.toLowerCase()">
                {{ pedido.estado }}
              </span>
            </div>
            <h3 class="sucursal-name">{{ pedido.sucursal?.nombre || 'Sin Sucursal' }}</h3>
            <span class="pedido-fecha">{{ formatFecha(pedido.fecha) }}</span>
          </div>

          <div class="card-progress-section">
            <div class="progress-labels">
              <span class="prep-label">Progreso</span>
              <span class="prep-pct">{{ getCumplimiento(pedido) }}%</span>
            </div>
            <div class="progress-track">
              <div 
                class="progress-bar" 
                :class="{ 'complete': getCumplimiento(pedido) >= 100 }"
                :style="{ width: getCumplimiento(pedido) + '%' }"
              ></div>
            </div>
          </div>

          <div class="card-arrow">
            <span class="material-icons">{{ expandedPedido === pedido.id ? 'expand_less' : 'expand_more' }}</span>
          </div>
        </div>

        <Transition name="expand">
          <div v-if="expandedPedido === pedido.id" class="card-detail">
            <div class="detail-header">
              <h4>Detalle de Carga</h4>
            </div>
            <table class="detail-table">
              <thead>
                <tr>
                  <th>PRODUCTO</th>
                  <th class="txt-center">PEDIDO</th>
                  <th class="txt-center">CARGADO</th>
                  <th class="txt-right">PESO REAL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in (pedido.items || [])" :key="item.id">
                  <td class="prod-name">{{ item.productoNombre }}</td>
                  <td class="txt-center bold">{{ item.cantidad }}</td>
                  <td class="txt-center">
                    <span class="cargado-badge" :class="{ 'done': (itemsPreparados[pedido.id]?.find(p => p.productoCodigo === item.productoCodigo)?.cantidad || 0) >= item.cantidad }">
                      {{ itemsPreparados[pedido.id]?.find(p => p.productoCodigo === item.productoCodigo)?.cantidad || 0 }}
                    </span>
                  </td>
                  <td class="txt-right peso-val">
                    {{ itemsPreparados[pedido.id]?.find(p => p.productoCodigo === item.productoCodigo)?.pesoReal?.toFixed(3) || '—' }} <small>kg</small>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Transition>
      </div>
    </div>

    <div v-if="!isLoading && pedidos.length === 0" class="empty-state">
      <span class="material-icons">inventory</span>
      <h3>No hay pedidos activos</h3>
      <p>Todos los pedidos han sido completados o no hay nuevos pedidos registrados.</p>
    </div>
  </div>
</template>

<style scoped>
.seguimiento-view {
  padding: 10px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header-text h2 {
  font-size: 1.8rem;
  color: var(--color-text);
  margin-bottom: 0.2rem;
}

.header-text p {
  color: var(--color-text-muted);
  font-weight: 500;
}

.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.refresh-timer {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.btn-refresh {
  background: white;
  border: 1px solid var(--color-border);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-primary);
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.btn-refresh:hover {
  background: #f0f0f0;
  transform: rotate(30deg);
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

@media (max-width: 480px) {
  .monitor-grid {
    grid-template-columns: 1fr;
  }
}

.monitor-card {
  background: white;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.monitor-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-sm);
}

.monitor-card.status-preparando {
  border-top: 4px solid #FF9800;
}

.card-main {
  padding: 20px;
  cursor: pointer;
  display: grid;
  grid-template-columns: 1fr 120px 40px;
  align-items: center;
  gap: 20px;
}

.id-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 4px;
}

.pedido-id {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-text-muted);
}

.pedido-estado {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.pedido-estado.preparando { background: #FFF3E0; color: #E65100; }
.pedido-estado.pendiente { background: #F5F5F5; color: #757575; }
.pedido-estado.completado { background: #E8F5E9; color: #2E7D32; }

.sucursal-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 2px;
}

.pedido-fecha {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.prep-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.prep-pct {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--color-primary);
}

.progress-track {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #4facfe);
  transition: width 0.8s cubic-bezier(0.17, 0.67, 0.83, 0.67);
}

.progress-bar.complete {
  background: linear-gradient(90deg, #66BB6A, #43A047);
}

.card-arrow {
  color: var(--color-text-muted);
  text-align: right;
}

.card-detail {
  background: #FAFAFA;
  border-top: 1px solid var(--color-border);
  padding: 20px;
}

.detail-header h4 {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table th {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-text-muted);
  padding: 8px;
  border-bottom: 2px solid #eee;
  text-align: left;
}

.detail-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

.prod-name {
  font-weight: 700;
  color: var(--color-text);
}

.bold { font-weight: 800; }
.txt-center { text-align: center; }
.txt-right { text-align: right; }

.cargado-badge {
  background: #eee;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #757575;
}

.cargado-badge.done {
  background: #E8F5E9;
  color: #2E7D32;
}

.peso-val {
  font-weight: 800;
  color: var(--color-secondary);
}

.loading-container, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  color: var(--color-text-muted);
  text-align: center;
}

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from {transform:rotate(0deg);} to {transform:rotate(360deg);} }

/* Transitions */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
  max-height: 800px;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
