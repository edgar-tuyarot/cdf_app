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

    <!-- Búsqueda Fija y Filtro Simplificado -->
    <div class="card mb-4 no-print" style="padding: 0.85rem 1rem; background: var(--bg-window); border-radius: 0; border: 1px solid var(--bevel-light);">
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; justify-content: space-between;">
        <!-- Buscador de Producto -->
        <div style="position: relative; flex: 1; min-width: 260px;">
          <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1.1rem; pointer-events: none;"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            class="form-control" 
            placeholder="Buscar por código o nombre de producto..." 
            style="padding-left: 2.3rem; height: 36px; font-weight: 600;"
          />
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted);"
          >
            <i class="ph ph-x-circle"></i>
          </button>
        </div>

        <!-- Selector de Tipo de Movimiento -->
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="text-xs fw-bold text-muted">Tipo:</span>
          <select v-model="filterType" class="form-control" style="height: 36px; padding: 0 0.75rem; font-weight: 600; background-color: white; border-radius: 0;">
            <option value="ALL">🔍 Todos los movimientos</option>
            <option value="INGRESO_PROVEEDOR">🚚 Ingresos de Proveedores</option>
            <option value="PROCESO">🔄 Procesos de Feteado/Fraccionado</option>
            <option value="CONVERSION">🧪 Conversiones internas</option>
            <option value="DECOMISO">🗑️ Decomisos y Descartes</option>
            <option value="PEDIDO_ENVIADO">📦 Descuentos por Pedido</option>
            <option value="AJUSTE_DIRECTO">⚙️ Ajustes Manuales</option>
            <option value="PRODUCTO_CREADO">➕ Altas de Catálogo</option>
          </select>
        </div>
      </div>
    </div>

    <!-- TABLA LIBRE DE AUDITORÍA (SIN CONTENEDOR DE CARD Y SIN SCROLLBARS INTERNOS) -->
    <div class="table-header-info mb-2" style="display: flex; justify-content: space-between; align-items: center;">
      <h4 style="font-size: 0.95rem; font-weight: 700; margin: 0;">
        <i class="ph ph-list-checks text-accent"></i> Registro de Auditoría de Stock ({{ filteredLogs.length }})
      </h4>
      <span class="text-xs text-muted fw-bold">
        Mostrando {{ filteredLogs.length }} de {{ rawLogs.length }} movimientos
      </span>
    </div>

    <div class="table-container" style="border: 1px solid var(--bevel-dark); border-radius: 0;">
        <table v-if="!loading && filteredLogs.length > 0">
          <thead>
            <tr>
              <th @click="sortBy('fecha')" class="sortable text-center" style="width: 140px;">
                Fecha <i v-if="sortKey === 'fecha'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('codigo_producto')" class="sortable text-center" style="width: 100px;">
                Código <i v-if="sortKey === 'codigo_producto'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('Producto.nombre')" class="sortable" style="min-width: 200px;">
                Producto <i v-if="sortKey === 'Producto.nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('tipo_movimiento')" class="sortable text-center" style="width: 140px;">
                Tipo Movimiento <i v-if="sortKey === 'tipo_movimiento'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('kilos_calculado')" class="sortable text-right" style="width: 130px;">
                Kilos <i v-if="sortKey === 'kilos_calculado'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="log in filteredLogs" 
              :key="log.id" 
              @click="selectedLog = log" 
              style="cursor: pointer;"
              title="Haga clic para ver el detalle de este movimiento"
            >
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

              <!-- Tipo Movimiento (Texto Plano) -->
              <td class="text-center font-bold text-xs" style="color: var(--text-primary);">
                {{ formatMovType(log.tipo_movimiento) }}
              </td>

              <!-- Cantidad (Kilos Movimiento) -->
              <td class="text-right font-semibold" :class="getColorClass(log.kilos_calculado || log.stock)">
                {{ formatNumber(log.kilos_calculado || log.stock, true, 3) }} kg
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

    <!-- Pantalla de Carga -->
    <div v-if="loading" class="loading-state card mt-4">
      <i class="ph ph-spinner spinner icon-xl"></i>
      Cargando historial de auditoría de stock...
    </div>

    <!-- MODAL POPUP PARA VER DETALLE DEL MOVIMIENTO -->
    <Teleport to="body">
      <div v-if="selectedLog" class="win-dialog-overlay" @mousedown.self="selectedLog = null">
        <div class="win-dialog" style="max-width: 500px; width: 90%;">
          <div class="win-dialog-titlebar" style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 0.6rem 0.85rem;">
            <span class="win-dialog-titlebar-text" style="font-weight: bold; font-size: 0.9rem;">
              Detalle de Movimiento #{{ selectedLog.id }}
            </span>
            <button class="win-dialog-close" @click="selectedLog = null" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.1rem;">
              <i class="ph ph-x"></i>
            </button>
          </div>

          <div class="win-dialog-body" style="padding: 1rem; display: flex; flex-direction: column; gap: 0.85rem; background: var(--bg-secondary);">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: var(--bg-window); padding: 0.75rem; border: 1px solid var(--bevel-dark);">
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: bold;">Fecha / Hora</span>
                <span style="font-weight: bold; font-size: 0.85rem;">{{ formatDateTime(selectedLog.fecha) }}</span>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: bold;">Tipo Movimiento</span>
                <span style="font-weight: bold; font-size: 0.85rem;">{{ formatMovType(selectedLog.tipo_movimiento) }}</span>
              </div>
            </div>

            <div style="background: var(--bg-window); padding: 0.75rem; border: 1px solid var(--bevel-dark);">
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: bold;">Producto</span>
              <span style="font-weight: bold; font-size: 0.9rem;">
                [{{ selectedLog.codigo_producto }}] {{ selectedLog.Producto?.nombre || 'Desconocido' }}
              </span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: var(--bg-window); padding: 0.75rem; border: 1px solid var(--bevel-dark);">
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: bold;">Variación Kilos</span>
                <span :class="['font-semibold', getColorClass(selectedLog.kilos_calculado || selectedLog.stock)]" style="font-size: 1rem; font-weight: 800;">
                  {{ formatNumber(selectedLog.kilos_calculado || selectedLog.stock, true, 3) }} kg
                </span>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: bold;">Usuario Registró</span>
                <span style="font-weight: bold; font-size: 0.85rem;">{{ selectedLog.usuario || 'Sistema' }}</span>
              </div>
            </div>

            <div style="background: white; padding: 0.85rem; border: 1.5px solid var(--bevel-dark);">
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: bold; margin-bottom: 0.35rem;">Concepto / Detalle Completo</span>
              <p style="margin: 0; font-size: 0.88rem; font-weight: 600; color: var(--text-primary); line-height: 1.45; white-space: pre-wrap; word-break: break-word;">
                {{ selectedLog.concepto || 'Sin detalle de concepto registrado' }}
              </p>
            </div>

          </div>

          <div class="win-dialog-footer" style="padding: 0.65rem 1rem; background: var(--bg-window); border-top: 1px solid var(--bevel-dark); display: flex; justify-content: flex-end;">
            <button class="btn btn-secondary" @click="selectedLog = null" style="padding: 0.4rem 1.25rem;">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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
const selectedLog = ref(null)

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
    'DECOMISO': 'DECOMISO',
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
    'DECOMISO': 'badge-danger',
    'PEDIDO_ENVIADO': 'badge-danger',
    'AJUSTE_DIRECTO': 'badge-dark-retro',
    'PRODUCTO_CREADO': 'badge-info-retro'
  }
  return map[type] || 'badge-secondary'
}

// Exportar a CSV
const exportToCSV = () => {
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF"
  csvContent += "Fecha;Codigo;Producto;Tipo Movimiento;Concepto;Kilos\n"
  
  filteredLogs.value.forEach(log => {
    const pName = log.Producto?.nombre || 'Autocreado'
    const formattedDate = formatDateTime(log.fecha)
    const kgMov = log.kilos_calculado || log.stock || 0
    csvContent += `"${formattedDate}";"${log.codigo_producto}";"${pName}";"${log.tipo_movimiento}";"${log.concepto}";${kgMov}\n`
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
