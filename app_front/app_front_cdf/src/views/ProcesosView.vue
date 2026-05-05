<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'

const procesos = ref([])
const isLoading = ref(true)
const errorMsg = ref('')
const searchQuery = ref('')
const filterTipo = ref('todos') // todos, FRACCIONADO, ENVASADO
const sortKey = ref('fecha')
const sortOrder = ref('desc')
const expandedRow = ref(null)

const fetchProcesos = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch('/api/procesos')
    if (res.ok) {
      procesos.value = await res.json()
    } else {
      errorMsg.value = 'Error al cargar los procesos.'
    }
  } catch (error) {
    errorMsg.value = 'Error de conexión con el servidor.'
  } finally {
    isLoading.value = false
  }
}

const formatFecha = (fecha) => {
  if (!fecha) return '—'
  const d = new Date(fecha)
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const anio = d.getFullYear()
  const hora = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dia}/${mes}/${anio} ${hora}:${min}`
}

const formatFechaCorta = (fecha) => {
  if (!fecha) return '—'
  const d = new Date(fecha)
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const hora = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dia}/${mes} ${hora}:${min}`
}

const filteredProcesos = computed(() => {
  let result = [...procesos.value]

  // Filtro por tipo
  if (filterTipo.value !== 'todos') {
    result = result.filter(p => p.detalles?.tipo === filterTipo.value)
  }

  // Búsqueda
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      (p.detalles?.producto_codigo || '').toLowerCase().includes(q) ||
      (p.detalles?.producto_nombre || '').toLowerCase().includes(q) ||
      (p.detalles?.usuario || '').toLowerCase().includes(q)
    )
  }

  // Ordenamiento
  result.sort((a, b) => {
    let valA, valB
    if (sortKey.value === 'fecha') {
      valA = new Date(a.fecha || 0).getTime()
      valB = new Date(b.fecha || 0).getTime()
    } else if (sortKey.value === 'codigo') {
      valA = (a.detalles?.producto_codigo || '').toLowerCase()
      valB = (b.detalles?.producto_codigo || '').toLowerCase()
    } else if (sortKey.value === 'nombre') {
      valA = (a.detalles?.producto_nombre || '').toLowerCase()
      valB = (b.detalles?.producto_nombre || '').toLowerCase()
    } else if (sortKey.value === 'tipo') {
      valA = (a.detalles?.tipo || '').toLowerCase()
      valB = (b.detalles?.tipo || '').toLowerCase()
    }

    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })

  return result
})

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = key === 'fecha' ? 'desc' : 'asc'
  }
}

const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

const totalFraccionados = computed(() =>
  procesos.value.filter(p => p.detalles?.tipo === 'FRACCIONADO').length
)
const totalEnvasados = computed(() =>
  procesos.value.filter(p => p.detalles?.tipo === 'ENVASADO').length
)

onMounted(fetchProcesos)
</script>

<template>
  <div class="procesos-view">
    <header class="view-header">
      <div>
        <h2>Historial de Procesos</h2>
        <p>Registro de fraccionados y envasados</p>
      </div>
      <button class="refresh-btn" @click="fetchProcesos" :disabled="isLoading">
        <span class="material-icons" :class="{ 'spinning': isLoading }">refresh</span>
      </button>
    </header>

    <!-- Stats rápidos -->
    <div class="stats-row">
      <div class="stat-chip">
        <span class="stat-number">{{ procesos.length }}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-chip frac">
        <span class="stat-number">{{ totalFraccionados }}</span>
        <span class="stat-label">Fraccionados</span>
      </div>
      <div class="stat-chip env">
        <span class="stat-number">{{ totalEnvasados }}</span>
        <span class="stat-label">Envasados</span>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="search-wrapper">
        <span class="material-icons search-icon">search</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por código, nombre o usuario..."
          class="search-input"
        >
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="filter-chips">
        <button
          :class="['chip', { active: filterTipo === 'todos' }]"
          @click="filterTipo = 'todos'"
        >Todos</button>
        <button
          :class="['chip', 'chip-frac', { active: filterTipo === 'FRACCIONADO' }]"
          @click="filterTipo = 'FRACCIONADO'"
        >Fraccionados</button>
        <button
          :class="['chip', 'chip-env', { active: filterTipo === 'ENVASADO' }]"
          @click="filterTipo = 'ENVASADO'"
        >Envasados</button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="errorMsg" class="error-alert">
      <span class="material-icons">error_outline</span>
      {{ errorMsg }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <span class="material-icons spinning">sync</span>
      <p>Cargando procesos...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredProcesos.length === 0" class="empty-state">
      <span class="material-icons">inbox</span>
      <p v-if="searchQuery || filterTipo !== 'todos'">No se encontraron procesos con los filtros actuales.</p>
      <p v-else>No hay procesos registrados aún.</p>
    </div>

    <!-- Desktop Table -->
    <div v-else class="table-container desktop-only">
      <table class="modern-table">
        <thead>
          <tr>
            <th @click="sortBy('fecha')" class="sortable">
              Fecha <span v-if="sortKey === 'fecha'" class="sort-arrow">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th @click="sortBy('tipo')" class="sortable">
              Tipo <span v-if="sortKey === 'tipo'" class="sort-arrow">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th @click="sortBy('codigo')" class="sortable">
              Código <span v-if="sortKey === 'codigo'" class="sort-arrow">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th @click="sortBy('nombre')" class="sortable">
              Producto <span v-if="sortKey === 'nombre'" class="sort-arrow">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th class="text-right">Piezas</th>
            <th class="text-right">Resultado</th>
            <th class="text-right">Recorte</th>
            <th class="text-right">Decomiso</th>
            <th>Usuario</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredProcesos" :key="p.proceso_id">
            <td class="fecha-cell">{{ formatFecha(p.fecha) }}</td>
            <td>
              <span :class="['type-badge', p.detalles?.tipo === 'FRACCIONADO' ? 'frac' : 'env']">
                {{ p.detalles?.tipo === 'FRACCIONADO' ? 'Fracc.' : 'Env.' }}
              </span>
            </td>
            <td><strong>{{ p.detalles?.producto_codigo }}</strong></td>
            <td>{{ p.detalles?.producto_nombre }}</td>
            <td class="text-right">{{ p.detalles?.cantidad_piezas != null ? Number(p.detalles.cantidad_piezas).toFixed(0) : '—' }}</td>
            <td class="text-right"><strong>{{ p.detalles?.resultado_cantidad != null ? Number(p.detalles.resultado_cantidad).toFixed(0) : '—' }}</strong></td>
            <td class="text-right">{{ p.detalles?.cantidad_recorte ? Number(p.detalles.cantidad_recorte).toFixed(3) : '—' }}</td>
            <td class="text-right">{{ p.detalles?.cantidad_decomiso ? Number(p.detalles.cantidad_decomiso).toFixed(3) : '—' }}</td>
            <td class="user-cell">{{ p.detalles?.usuario || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div v-if="!isLoading && filteredProcesos.length > 0" class="mobile-cards mobile-only">
      <div
        v-for="p in filteredProcesos"
        :key="'m-' + p.proceso_id"
        class="process-card"
        :class="{ 'expanded': expandedRow === p.proceso_id }"
        @click="toggleRow(p.proceso_id)"
      >
        <div class="card-top">
          <div class="card-left">
            <span :class="['type-badge', p.detalles?.tipo === 'FRACCIONADO' ? 'frac' : 'env']">
              {{ p.detalles?.tipo === 'FRACCIONADO' ? 'Fracc.' : 'Env.' }}
            </span>
            <div class="card-product">
              <strong>{{ p.detalles?.producto_codigo }}</strong>
              <span class="product-name">{{ p.detalles?.producto_nombre }}</span>
            </div>
          </div>
          <div class="card-right">
            <span class="result-value">{{ p.detalles?.resultado_cantidad != null ? Number(p.detalles.resultado_cantidad).toFixed(0) : '—' }}</span>
            <span class="result-label">uds</span>
            <span class="material-icons chevron" :class="{ 'rotated': expandedRow === p.proceso_id }">expand_more</span>
          </div>
        </div>

        <Transition name="expand">
          <div v-if="expandedRow === p.proceso_id" class="card-details">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="dlabel">Fecha</span>
                <span class="dvalue">{{ formatFecha(p.fecha) }}</span>
              </div>
              <div class="detail-item">
                <span class="dlabel">Usuario</span>
                <span class="dvalue">{{ p.detalles?.usuario || '—' }}</span>
              </div>
              <div class="detail-item">
                <span class="dlabel">Piezas</span>
                <span class="dvalue">{{ p.detalles?.cantidad_piezas != null ? Number(p.detalles.cantidad_piezas).toFixed(0) : '—' }}</span>
              </div>
              <div class="detail-item">
                <span class="dlabel">Kg consumidos</span>
                <span class="dvalue">{{ p.detalles?.cantidad_kilos != null ? Number(p.detalles.cantidad_kilos).toFixed(3) : '—' }}</span>
              </div>
              <div v-if="p.detalles?.cantidad_recorte" class="detail-item">
                <span class="dlabel">Recorte</span>
                <span class="dvalue">{{ Number(p.detalles.cantidad_recorte).toFixed(3) }} kg</span>
              </div>
              <div v-if="p.detalles?.cantidad_decomiso" class="detail-item">
                <span class="dlabel">Decomiso</span>
                <span class="dvalue warn">{{ Number(p.detalles.cantidad_decomiso).toFixed(3) }} kg</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Counter -->
    <div v-if="!isLoading && filteredProcesos.length > 0" class="results-count">
      Mostrando {{ filteredProcesos.length }} de {{ procesos.length }} procesos
    </div>
  </div>
</template>

<style scoped>
.procesos-view {
  padding-bottom: 40px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-md);
}

.view-header h2 {
  margin-bottom: 2px;
}

.view-header p {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 600;
}

.refresh-btn {
  background: white;
  border: 2px solid var(--color-border);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-primary);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.refresh-btn:hover {
  background-color: #F0F0F0;
}

/* Stats */
.stats-row {
  display: flex;
  gap: 10px;
  margin-bottom: var(--space-md);
}

.stat-chip {
  flex: 1;
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-chip.frac {
  border-left: 3px solid var(--color-primary);
}

.stat-chip.env {
  border-left: 3px solid var(--color-secondary);
}

.stat-number {
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--color-text);
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Filters */
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: var(--space-md);
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  height: 44px;
}

.search-icon {
  color: var(--color-text-muted);
  margin-right: 8px;
  font-size: 1.2rem;
}

.search-input {
  border: none;
  background: none;
  width: 100%;
  height: 100%;
  outline: none;
  font-size: 0.9rem;
  font-weight: 600;
}

.clear-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
}

.filter-chips {
  display: flex;
  gap: 8px;
}

.chip {
  padding: 6px 14px;
  border-radius: 20px;
  border: 2px solid var(--color-border);
  background: white;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text-muted);
}

.chip.active {
  background-color: var(--color-text);
  color: white;
  border-color: var(--color-text);
}

.chip-frac.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.chip-env.active {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
}

/* Error */
.error-alert {
  background-color: #FFEBEE;
  color: #C62828;
  padding: 14px;
  border-radius: var(--radius-md);
  border: 2px solid #EF9A9A;
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Loading / Empty */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--color-text-muted);
  gap: 12px;
}

.loading-state .material-icons, .empty-state .material-icons {
  font-size: 2.5rem;
  opacity: 0.4;
}

.loading-state p, .empty-state p {
  font-size: 0.9rem;
  font-weight: 600;
}

/* Type badges */
.type-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.type-badge.frac {
  background-color: #E3F2FD;
  color: #1565C0;
  border: 1px solid #BBDEFB;
}

.type-badge.env {
  background-color: #FFF3E0;
  color: #E65100;
  border: 1px solid #FFE0B2;
}

/* Desktop Table */
.table-container {
  overflow-x: auto;
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.modern-table th {
  text-align: left;
  padding: 12px 10px;
  background-color: #FAFAFA;
  color: var(--color-text-muted);
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 2px solid var(--color-border);
  white-space: nowrap;
}

.modern-table td {
  padding: 11px 10px;
  border-bottom: 1px solid #F0F0F0;
}

.modern-table tbody tr:hover {
  background-color: #FAFAFA;
}

.modern-table tbody tr:last-child td {
  border-bottom: none;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: #F0F0F0 !important;
}

.sort-arrow {
  font-size: 0.7rem;
  margin-left: 2px;
}

.fecha-cell {
  white-space: nowrap;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.user-cell {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.text-right {
  text-align: right !important;
}

/* Mobile Cards */
.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.process-card {
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  cursor: pointer;
}

.process-card:active {
  background-color: #FAFAFA;
}

.card-top {
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.card-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.card-product {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.card-product strong {
  font-size: 0.85rem;
}

.product-name {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.card-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.result-value {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--color-text);
}

.result-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.chevron {
  color: var(--color-text-muted);
  font-size: 1.2rem;
  transition: transform 0.2s ease;
  margin-left: 4px;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.card-details {
  padding: 0 14px 14px;
  border-top: 1px solid #F0F0F0;
  padding-top: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.dlabel {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.dvalue {
  font-size: 0.88rem;
  font-weight: 700;
}

.dvalue.warn {
  color: #C62828;
}

/* Results count */
.results-count {
  text-align: center;
  padding: 16px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

/* Responsive */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: flex !important;
  }
}

/* Spinning animation */
.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Expand transition */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease-out;
  max-height: 300px;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
