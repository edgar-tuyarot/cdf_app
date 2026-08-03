<template>
  <div class="page-container animate-fade">
    <!-- Encabezado de Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Historial de Movimientos de Stock</h2>
        <p class="page-description">
          Auditoría en tiempo real de todos los ingresos, egresos, transformaciones y ajustes de stock de cada producto.
        </p>
      </div>
      <div class="header-actions mt-2 no-print">
        <button class="btn btn-secondary mr-2" @click="exportToCSV" :disabled="loading">
          <i class="ph ph-file-csv"></i> Exportar CSV
        </button>
        <button class="btn btn-primary" @click="fetchLogs" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Historial
        </button>
      </div>
    </div>

    <!-- Tarjetas de Resumen de Auditoría (Estilo Windows 98) -->
    <div class="summary-cards mb-4 no-print">
      <!-- Tarjeta 1: Total Movimientos -->
      <div class="card summary-card">
        <div class="card-header summary-header-blue">
          <i class="ph ph-list-numbers"></i> Movimientos
        </div>
        <div class="summary-body">
          <div class="summary-value">{{ filteredLogs.length }}</div>
          <div class="summary-label">Registros Filtrados</div>
        </div>
      </div>

      <!-- Tarjeta 2: Piezas Ingresadas -->
      <div class="card summary-card">
        <div class="card-header summary-header-green">
          <i class="ph ph-plus-circle"></i> Piezas Sumadas
        </div>
        <div class="summary-body">
          <div class="summary-value text-success">+{{ stats.addedPieces }}</div>
          <div class="summary-label">Total Piezas Ingresadas</div>
        </div>
      </div>

      <!-- Tarjeta 3: Kilos Block Sumados -->
      <div class="card summary-card">
        <div class="card-header summary-header-green">
          <i class="ph ph-scales"></i> Kilos Block Sumados
        </div>
        <div class="summary-body">
          <div class="summary-value text-success">+{{ stats.addedKilosBlock.toFixed(2).replace('.', ',') }} kg</div>
          <div class="summary-label">Total Kilos Block Sumados</div>
        </div>
      </div>

      <!-- Tarjeta 4: Decomisos/Mermas registradas -->
      <div class="card summary-card">
        <div class="card-header summary-header-red">
          <i class="ph ph-trash"></i> Kilos Decomisados
        </div>
        <div class="summary-body">
          <div class="summary-value text-danger">{{ stats.totalDecomiso.toFixed(2).replace('.', ',') }} kg</div>
          <div class="summary-label">Total Mermas / Decomisos</div>
        </div>
      </div>
    </div>

    <!-- Panel de Control y Filtros (Panel Relieve) -->
    <div class="card mb-4 no-print">
      <div class="card-header" style="background-color: var(--accent-primary); color: white;">
        <span class="card-title">Panel de Control y Búsqueda</span>
      </div>
      <div class="p-4 filters-grid">
        <!-- Buscador -->
        <div class="form-group search-group">
          <label class="form-label">Buscar por Producto</label>
          <div class="input-with-icon">
            <i class="ph ph-magnifying-glass"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar por código o nombre..." 
              class="form-control"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn" title="Limpiar búsqueda">
              <i class="ph ph-x-circle"></i>
            </button>
          </div>
        </div>

        <!-- Selector de Origen / Tipo de Movimiento -->
        <div class="form-group">
          <label class="form-label">Tipo de Movimiento</label>
          <select v-model="filterType" class="form-control" style="height: 32px; padding: 0 0.5rem; background-color: white;">
            <option value="ALL">🔍 Todos los movimientos</option>
            <option value="INGRESO_PROVEEDOR">🚚 Ingresos de Proveedores</option>
            <option value="PROCESO">🔄 Procesos de Feteado/Fraccionado</option>
            <option value="CONVERSION">🧪 Conversiones internas</option>
            <option value="PEDIDO_ENVIADO">📦 Descuentos por Pedido</option>
            <option value="AJUSTE_DIRECTO">⚙️ Ajustes Manuales</option>
            <option value="PRODUCTO_CREADO">➕ Altas de Catálogo</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tabla Principal de Movimientos -->
    <div class="card">
      <div class="card-header font-bold" style="background-color: #0b5394; color: white;">
        <span class="card-title">Registro de Auditoría de Stock</span>
      </div>

      <div class="table-container" style="overflow-x: auto; max-height: 550px; overflow-y: auto;">
        <table v-if="!loading && filteredLogs.length > 0">
          <thead>
            <tr>
              <th @click="sortBy('fecha')" class="sortable text-center" style="width: 130px;">
                Fecha <i v-if="sortKey === 'fecha'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('codigo_producto')" class="sortable text-center" style="width: 80px;">
                Código <i v-if="sortKey === 'codigo_producto'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('Producto.nombre')" class="sortable" style="min-width: 150px;">
                Producto <i v-if="sortKey === 'Producto.nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('tipo_movimiento')" class="sortable text-center" style="width: 120px;">
                Tipo Mov. <i v-if="sortKey === 'tipo_movimiento'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th style="min-width: 180px;">Concepto / Detalle</th>
              <th @click="sortBy('cantidad_piezas')" class="sortable text-right" style="width: 80px;">
                Pzas <i v-if="sortKey === 'cantidad_piezas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kilos_block')" class="sortable text-right" style="width: 95px;">
                Kg Block <i v-if="sortKey === 'kilos_block'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kilos_calculado')" class="sortable text-right" style="width: 95px;">
                Kg Calc. <i v-if="sortKey === 'kilos_calculado'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kg_fraccionados')" class="sortable text-right" style="width: 95px;">
                Kg Frac. <i v-if="sortKey === 'kg_fraccionados'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kg_recorte')" class="sortable text-right" style="width: 95px;">
                Kg Recorte <i v-if="sortKey === 'kg_recorte'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kg_decomiso')" class="sortable text-right" style="width: 95px;">
                Kg Decomiso <i v-if="sortKey === 'kg_decomiso'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('usuario')" class="sortable text-center" style="width: 100px;">
                Operario <i v-if="sortKey === 'usuario'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log.id">
              <!-- Fecha -->
              <td class="text-center font-mono text-xs">
                {{ formatDateTime(log.fecha) }}
              </td>

              <!-- Código -->
              <td class="text-center font-bold">
                {{ log.codigo_producto }}
              </td>

              <!-- Producto -->
              <td class="product-name">
                {{ log.Producto?.nombre || 'Producto Autocreado' }}
              </td>

              <!-- Tipo Movimiento Badge -->
              <td class="text-center">
                <span :class="['badge', getBadgeClass(log.tipo_movimiento)]">
                  {{ formatMovType(log.tipo_movimiento) }}
                </span>
              </td>

              <!-- Concepto -->
              <td class="text-xs" style="line-height: 1.35;">
                {{ log.concepto }}
              </td>

              <!-- Delta Piezas -->
              <td class="text-right font-bold" :class="getColorClass(log.cantidad_piezas)">
                {{ formatNumber(log.cantidad_piezas, true, 0) }}
              </td>

              <!-- Delta Kilos Block -->
              <td class="text-right font-semibold" :class="getColorClass(log.kilos_block)">
                {{ formatNumber(log.kilos_block, true, 3) }}
              </td>

              <!-- Delta Kilos Calculado -->
              <td class="text-right font-semibold" :class="getColorClass(log.kilos_calculado)">
                {{ formatNumber(log.kilos_calculado, true, 3) }}
              </td>

              <!-- Delta Kg Fraccionados -->
              <td class="text-right font-semibold" :class="getColorClass(log.kg_fraccionados)">
                {{ formatNumber(log.kg_fraccionados, true, 3) }}
              </td>

              <!-- Delta Kg Recorte -->
              <td class="text-right font-semibold" :class="getColorClass(log.kg_recorte)">
                {{ formatNumber(log.kg_recorte, true, 3) }}
              </td>

              <!-- Delta Kg Decomiso -->
              <td class="text-right font-semibold" :class="getColorClass(log.kg_decomiso)">
                {{ formatNumber(log.kg_decomiso, true, 3) }}
              </td>

              <!-- Usuario -->
              <td class="text-center text-xs font-semibold text-muted">
                {{ log.usuario || 'Sistema' }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Sin resultados -->
        <div v-else-if="!loading && filteredLogs.length === 0" class="empty-state">
          <i class="ph ph-magnifying-glass icon-xl" v-if="searchQuery"></i>
          <i class="ph ph-file-text icon-xl" v-else></i>
          {{ searchQuery ? 'No se encontraron movimientos que coincidan con la búsqueda.' : 'No hay movimientos de stock registrados para mostrar.' }}
        </div>
      </div>
    </div>

    <!-- Pantalla de Carga -->
    <div v-if="loading" class="loading-state card mt-4">
      <i class="ph ph-spinner spinner icon-xl"></i>
      Cargando historial de auditoría de stock...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const rawLogs = ref([])
const searchQuery = ref('')
const filterType = ref('ALL')
const sortKey = ref('fecha')
const sortOrder = ref(-1) // Mayor a menor (fecha más reciente primero)
const loading = ref(true)

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/productos/movimientos-stock')
    if (!res.ok) {
      throw new Error('Error al obtener movimientos del servidor')
    }
    rawLogs.value = await res.json()
  } catch (error) {
    console.error('Error fetching logs:', error)
  } finally {
    loading.value = false
  }
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value *= -1
  } else {
    sortKey.value = key
    sortOrder.value = -1 // Mayor a menor por defecto
  }
}

// Estadísticas filtradas superiores
const stats = computed(() => {
  let addedPieces = 0
  let addedKilosBlock = 0
  let totalDecomiso = 0

  filteredLogs.value.forEach(log => {
    const pz = parseInt(log.cantidad_piezas) || 0
    const bl = parseFloat(log.kilos_block) || 0
    const dec = parseFloat(log.kg_decomiso) || 0

    if (pz > 0) addedPieces += pz
    if (bl > 0) addedKilosBlock += bl
    if (dec > 0) totalDecomiso += dec
  })

  return {
    addedPieces,
    addedKilosBlock,
    totalDecomiso
  }
})

// Procesar búsqueda, filtros y ordenamientos
const filteredLogs = computed(() => {
  let result = [...rawLogs.value]

  // 1. Filtrar por Tipo de Movimiento
  if (filterType.value !== 'ALL') {
    result = result.filter(log => log.tipo_movimiento === filterType.value)
  }

  // 2. Filtrar por Búsqueda de Producto
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(log => 
      log.codigo_producto.toLowerCase().includes(q) ||
      (log.Producto?.nombre && log.Producto.nombre.toLowerCase().includes(q))
    )
  }

  // 3. Ordenar dinámicamente
  if (sortKey.value) {
    result.sort((a, b) => {
      let valA = a
      let valB = b
      
      // Manejar claves anidadas como Producto.nombre
      if (sortKey.value.includes('.')) {
        const parts = sortKey.value.split('.')
        valA = a[parts[0]]?.[parts[1]]
        valB = b[parts[0]]?.[parts[1]]
      } else {
        valA = a[sortKey.value]
        valB = b[sortKey.value]
      }

      if (valA === undefined || valA === null) valA = sortKey.value === 'fecha' ? '' : 0
      if (valB === undefined || valB === null) valB = sortKey.value === 'fecha' ? '' : 0

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * sortOrder.value
      }
      return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * sortOrder.value
    })
  }

  return result
})

// Helpers de formato y estilo
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatNumber = (val, showSign = true, decimals = 3) => {
  const num = parseFloat(val) || 0
  if (num === 0) return '-'
  
  let formatted = Math.abs(num).toFixed(decimals).replace('.', ',')
  if (showSign) {
    formatted = (num > 0 ? '+' : '-') + formatted
  }
  return formatted
}

const getColorClass = (val) => {
  const num = parseFloat(val) || 0
  if (num > 0) return 'text-success'
  if (num < 0) return 'text-orange-dark'
  return 'text-muted'
}

const formatMovType = (type) => {
  const map = {
    'INGRESO_PROVEEDOR': 'PROVEEDOR',
    'PROCESO': 'PROCESO',
    'CONVERSION': 'CONVERSIÓN',
    'PEDIDO_ENVIADO': 'PEDIDO',
    'AJUSTE_DIRECTO': 'AJUSTE',
    'PRODUCTO_CREADO': 'NUEVO'
  }
  return map[type] || type
}

const getBadgeClass = (type) => {
  const map = {
    'INGRESO_PROVEEDOR': 'badge-success',
    'PROCESO': 'badge-primary',
    'CONVERSION': 'badge-warning',
    'PEDIDO_ENVIADO': 'badge-danger',
    'AJUSTE_DIRECTO': 'badge-dark-retro',
    'PRODUCTO_CREADO': 'badge-info-retro'
  }
  return map[type] || 'badge-secondary'
}

// Exportar a CSV
const exportToCSV = () => {
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF"
  csvContent += "Fecha;Codigo;Producto;Tipo Movimiento;Concepto;Piezas;Kg Block;Kg Calculado;Kg Fraccionados;Kg Recorte;Kg Decomiso;Operario\n"
  
  filteredLogs.value.forEach(log => {
    const pName = log.Producto?.nombre || 'Autocreado'
    const formattedDate = formatDateTime(log.fecha)
    csvContent += `"${formattedDate}";"${log.codigo_producto}";"${pName}";"${log.tipo_movimiento}";"${log.concepto}";${log.cantidad_piezas};${log.kilos_block};${log.kilos_calculado};${log.kg_fraccionados};${log.kg_recorte};${log.kg_decomiso};"${log.usuario || 'Sistema'}"\n`
  })

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `auditoria_stock_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
/* Grid de Tarjetas de Resumen */
.summary-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(4, 1fr);
  }
}

.summary-card {
  margin-bottom: 0;
}

.summary-body {
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 60px;
  background-color: var(--bg-window);
  box-shadow: var(--inset-shadow);
}

.summary-value {
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.2;
}

.summary-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-top: 0.1rem;
}

/* Colores de cabeceras de resumen */
.summary-header-blue {
  background: linear-gradient(to right, #0b5394, #1e6ec8) !important;
  color: white !important;
}

.summary-header-green {
  background: linear-gradient(to right, #2e7d32, #4caf50) !important;
  color: white !important;
}

.summary-header-red {
  background: linear-gradient(to right, #b02020, #d32f2f) !important;
  color: white !important;
}

/* Grid de Filtros */
.filters-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  background-color: var(--bg-secondary);
}

@media (min-width: 768px) {
  .filters-grid {
    grid-template-columns: 2fr 1fr;
    align-items: end;
  }
}

.search-group {
  margin-bottom: 0;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-icon i {
  position: absolute;
  left: 8px;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.input-with-icon .form-control {
  padding-left: 28px;
  padding-right: 28px;
}

.clear-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  display: flex;
  align-items: center;
}

.clear-btn:hover {
  color: var(--text-primary);
}

/* Colores e Indicadores de Variación */
.text-success {
  color: #1a7f37 !important;
}

.text-orange-dark {
  color: #b05500 !important;
}

/* Badges de estilo retro */
.badge-dark-retro {
  background-color: #e0e0e0;
  color: #333333;
  border: 1px solid #999999;
}

.badge-info-retro {
  background-color: #d9edf7;
  color: #31708f;
  border: 1px solid #bce8f1;
}

.badge-warning {
  background-color: #fcf8e3;
  color: #8a6d3b;
  border: 1px solid #faebcc;
}

th.sortable {
  cursor: pointer;
  user-select: none;
}

th.sortable:hover {
  background-color: rgba(255, 255, 255, 0.15) !important;
}

th i {
  margin-left: 0.25rem;
  font-size: 0.8rem;
  vertical-align: middle;
}

.mr-2 {
  margin-right: 0.5rem;
}
</style>
