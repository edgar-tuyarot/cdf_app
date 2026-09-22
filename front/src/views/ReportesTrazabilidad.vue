<template>
  <div class="page-container animate-fade">
    <!-- Header de la Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-line-segments text-blue"></i> Trazabilidad e Historial de Producto
        </h2>
        <p class="page-description">Consulta la evolución temporal del stock y el historial completo de movimientos de cualquier producto.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-secondary" @click="exportToExcel" :disabled="loading || (!selectedProduct && !productSearchText) || filteredLogs.length === 0">
          <i class="ph ph-file-xls text-green"></i> Exportar Excel
        </button>
        <button class="btn btn-primary" @click="handleConsultar" :disabled="loading || loadingBlockWms">
          <i class="ph ph-spinner spinner" v-if="loading || loadingBlockWms"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Selector de Origen de Datos (BlockWMS vs Interno CDF) -->
    <div class="mb-3" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
      <button 
        :class="['btn', sourceMode === 'blockwms' ? 'btn-primary' : 'btn-secondary']"
        @click="setSourceMode('blockwms')"
        style="font-weight: 800; border-radius: 4px; padding: 0.5rem 1rem;"
      >
        <i class="ph ph-database"></i> Trazabilidad Directa BlockWMS
      </button>
      <button 
        :class="['btn', sourceMode === 'cdf' ? 'btn-primary' : 'btn-secondary']"
        @click="setSourceMode('cdf')"
        style="font-weight: 800; border-radius: 4px; padding: 0.5rem 1rem;"
      >
        <i class="ph ph-clock-counter-clockwise"></i> Trazabilidad Interna (CDF Gestiones)
      </button>
    </div>

    <!-- Contenedor Lado a Lado: Parámetros de Consulta (Filtros) + Ficha del Producto Seleccionado -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; align-items: stretch;">
      
      <!-- Card 1: Parámetros de Consulta (Filtros) -->
      <div class="card" style="padding: 1.25rem; background: var(--bg-window); border: 1.5px solid var(--bevel-dark); margin-bottom: 0;">
        <div style="font-weight: 850; font-size: 0.82rem; margin-bottom: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
          <i class="ph ph-funnel" style="color: var(--accent-primary);"></i> Parámetros de Consulta
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          
          <!-- Fila 1: Selector de Producto -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: bold; font-size: 0.85rem;">Seleccionar Producto *</label>
            <div style="position: relative; display: flex; align-items: center;">
              <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.75rem; color: var(--text-muted); font-size: 1.1rem; pointer-events: none;"></i>
              <input 
                type="text" 
                v-model="productSearchText" 
                list="catalog-products-list-trazabilidad" 
                @input="handleProductSelect" 
                class="form-control" 
                placeholder="Escribe código (Ej: 1137) o busca por nombre..." 
                style="padding-left: 2.3rem; height: 38px; font-weight: 700; font-size: 0.88rem;"
              />
              <button 
                v-if="productSearchText" 
                @click="clearProductSelection" 
                style="position: absolute; right: 0.6rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;"
                title="Limpiar campo"
              >
                <i class="ph ph-x-circle" style="font-size: 1.1rem;"></i>
              </button>
            </div>
            <datalist id="catalog-products-list-trazabilidad">
              <option v-for="p in productos" :key="p.codigo" :value="p.codigo">
                {{ p.codigo }} - {{ p.nombre }}
              </option>
            </datalist>
          </div>

          <!-- Fila 2: Fechas Desde y Hasta + Botón Consultar con Timer -->
          <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.75rem; align-items: end;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: bold; font-size: 0.8rem;">Fecha Desde</label>
              <input type="date" v-model="filters.startDate" class="form-control" style="height: 38px; font-size: 0.85rem;" />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: bold; font-size: 0.8rem;">Fecha Hasta</label>
              <input type="date" v-model="filters.endDate" class="form-control" style="height: 38px; font-size: 0.85rem;" />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <button 
                class="btn btn-primary" 
                @click="handleConsultar" 
                :disabled="loading || loadingBlockWms"
                style="height: 38px; min-width: 140px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0 0.8rem;"
              >
                <i class="ph ph-spinner spinner" v-if="loading || loadingBlockWms"></i>
                <i class="ph ph-magnifying-glass" v-else></i>
                <span>Consultar</span>
                <span v-if="elapsedTime > 0" style="font-family: monospace; font-size: 0.82rem; opacity: 0.95; background: rgba(0,0,0,0.25); padding: 0.1rem 0.35rem; border-radius: 3px; margin-left: 0.1rem;">
                  {{ formattedTimer }}s
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Card 2: Ficha del Producto Seleccionado (Al lado de los Filtros) -->
      <div class="card" style="padding: 1.25rem; background: var(--bg-secondary); border: 2px solid var(--accent-primary); margin-bottom: 0; display: flex; flex-direction: column; justify-content: center;">
        <template v-if="getActiveProductCode()">
          <div style="display: flex; flex-direction: column; gap: 0.35rem;">
            <div>
              <span class="badge code-badge" style="font-size: 0.82rem; padding: 0.2rem 0.55rem; font-weight: 800;">
                CÓDIGO: {{ getActiveProductCode() }}
              </span>
            </div>
            <h3 style="margin: 0.15rem 0; font-size: 1.2rem; font-weight: 850; color: var(--text-primary); line-height: 1.3;">
              {{ getActiveProductName() }}
            </h3>
            <div style="font-size: 0.82rem; color: var(--text-secondary); font-weight: 600; display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem;">
              <i class="ph ph-calendar-blank" style="color: var(--accent-primary);"></i>
              <span>Rango Consultado: <strong>{{ formatDateDisplay(filters.startDate) }} al {{ formatDateDisplay(filters.endDate) }}</strong></span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem;">
              Fuente: <strong style="color: var(--accent-primary);">{{ sourceMode === 'blockwms' ? 'BlockWMS (SQL Directo)' : 'CDF Local' }}</strong>
            </div>
          </div>
        </template>
        <template v-else>
          <div style="text-align: center; color: var(--text-muted); padding: 0.75rem 0;">
            <i class="ph ph-info" style="font-size: 2.2rem; opacity: 0.5; color: var(--accent-primary);"></i>
            <h4 style="margin: 0.4rem 0 0.2rem 0; font-size: 0.95rem; font-weight: 700; color: var(--text-secondary);">Ficha de Producto</h4>
            <p style="margin: 0; font-size: 0.8rem;">Selecciona un producto y presiona "Consultar" para ver los detalles.</p>
          </div>
        </template>
      </div>

    </div>

    <!-- Si NO hay producto seleccionado ni texto -->
    <div v-if="!getActiveProductCode()" class="card text-center p-5 animate-fade mb-4">
      <i class="ph ph-line-segments text-blue icon-xl mb-2" style="font-size: 3rem;"></i>
      <h3 class="font-bold text-lg mb-1">Ingresa un código de producto para ver su trazabilidad</h3>
      <p class="text-muted text-xs">Escribe el código exacto (ej. 1137) o selecciona una opción del menú emergente y presiona "Consultar".</p>
    </div>

    <!-- PANTALLA PRINCIPAL CON DATOS DEL PRODUCTO SELECCIONADO -->
    <div v-else class="animate-fade">

      <!-- GRÁFICO DE LÍNEA: EVOLUCIÓN TEMPORAL DEL STOCK -->
      <div class="card mb-4">
        <div class="card-header" style="background: #0f172a; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span class="card-title" style="color: white; font-weight: bold;">
            <i class="ph ph-chart-line-up" style="margin-right: 0.4rem; color: #60a5fa;"></i> Evolución del Stock en Kilogramos (kg)
          </span>
          <span class="text-xs" style="color: #94a3b8; font-weight: bold;">
            Histórico por Operación
          </span>
        </div>
        <div class="card-body" style="padding: 1rem;">
          <div style="position: relative; height: 340px; width: 100%;" class="no-print">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- TABLA DETALLADA DE MOVIMIENTOS BLOCKWMS O INTERNOS -->
      <div class="card">
        <div class="card-header" style="background: #0f172a; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span class="card-title" style="color: white; display: flex; align-items: center; gap: 0.4rem;">
            <i class="ph ph-list-dashes"></i> Historial de Operaciones Trazables ({{ tableSearchQuery ? `${filteredLogs.length} de ${currentLogs.length}` : currentLogs.length }} registros)
          </span>
          <span class="text-xs" style="color: #94a3b8;">
            {{ sourceMode === 'blockwms' ? 'Fuente: BlockWMS' : 'Fuente: CDF Local' }}
          </span>
        </div>

        <!-- Buscador para filtrar la tabla -->
        <div v-if="currentLogs.length > 0" style="padding: 0.65rem 1rem; background: var(--bg-window); border-bottom: 1px solid var(--bevel-light); display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <div style="position: relative; display: flex; align-items: center; flex: 1; max-width: 480px;">
            <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.75rem; color: var(--text-muted); font-size: 1rem; pointer-events: none;"></i>
            <input 
              type="text" 
              v-model="tableSearchQuery" 
              placeholder="Buscar en la tabla (orden, ERP, sucursal, lote, ubicación, tipo...)" 
              class="form-control" 
              style="padding-left: 2.2rem; height: 34px; font-size: 0.82rem;"
            />
            <button 
              v-if="tableSearchQuery" 
              @click="tableSearchQuery = ''" 
              style="position: absolute; right: 0.6rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;"
              title="Limpiar búsqueda"
            >
              <i class="ph ph-x-circle" style="font-size: 1rem;"></i>
            </button>
          </div>
          <div style="font-size: 0.82rem; color: var(--text-secondary);">
            <span v-if="tableSearchQuery">
              Mostrando <strong>{{ filteredLogs.length }}</strong> de <strong>{{ currentLogs.length }}</strong> movimientos
            </span>
            <span v-else>
              Total: <strong>{{ currentLogs.length }}</strong> movimientos
            </span>
          </div>
        </div>

        <div class="table-container">
          <!-- VISTA DE TABLA BLOCK WMS -->
          <table v-if="sourceMode === 'blockwms' && filteredLogs.length > 0" class="access-table">
            <thead>
              <tr>
                <th style="width: 110px;" class="text-center">Fecha</th>
                <th style="width: 100px;" class="text-center">Tipo</th>
                <th style="width: 130px;">Operación</th>
                <th style="width: 120px;">Orden / ERP</th>
                <th>Entidad / Sucursal</th>
                <th>Ubicación Origen / Destino</th>
                <th style="width: 100px;" class="text-center">Lote / Venc.</th>
                <th style="width: 120px;" class="text-right">Afectación</th>
                <th style="width: 130px;" class="text-right">Stock Línea</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in filteredLogs" :key="log.id || log.rowNumber">
                <td class="text-center font-mono text-xs font-bold">{{ log.fecha }}</td>
                <td class="text-center">
                  <span :class="['type-badge', getBlockTipoClass(log.tipo)]">
                    {{ log.tipo }}
                  </span>
                </td>
                <td class="text-xs font-bold">{{ log.operacion }}</td>
                <td class="text-xs font-mono">
                  <div>{{ log.codigo_orden || '-' }}</div>
                  <div v-if="log.codigo_orden_erp" style="font-size: 0.7rem; color: var(--text-muted);">ERP: {{ log.codigo_orden_erp }}</div>
                </td>
                <td class="text-xs">
                  <strong>{{ log.entidad_nombre || log.entidad_codigo || '-' }}</strong>
                </td>
                <td class="text-xs font-mono" style="font-size: 0.75rem;">
                  <div><span style="color: #64748b;">Orig:</span> {{ log.ubicacion_origen }}</div>
                  <div v-if="log.ubicacion_destino !== '-'"><span style="color: #64748b;">Dest:</span> {{ log.ubicacion_destino }}</div>
                </td>
                <td class="text-center text-xs">
                  <div>Lote: <strong>{{ log.lote }}</strong></div>
                  <div v-if="log.fecha_vencimiento !== '-'" style="font-size: 0.7rem; color: #d97706;">Venc: {{ log.fecha_vencimiento }}</div>
                </td>
                <td class="text-right font-mono font-bold" :class="getDeltaClass(log.tipo === 'EGRESO' ? -log.cantidad_egreso : log.cantidad_ingreso)">
                  <span v-if="log.tipo === 'INGRESO'" style="color: #16a34a;">+{{ log.cantidad_ingreso.toFixed(3) }} kg</span>
                  <span v-else-if="log.tipo === 'EGRESO'" style="color: #dc2626;">-{{ log.cantidad_egreso.toFixed(3) }} kg</span>
                  <span v-else style="color: #0284c7;">{{ log.cantidad_afectada.toFixed(3) }} kg</span>
                </td>
                <td class="text-right font-mono font-bold text-blue" style="font-size: 0.9rem;">
                  {{ log.stock_acumulado.toFixed(3) }} kg
                </td>
              </tr>
            </tbody>
          </table>

          <!-- VISTA DE TABLA LOCAL CDF -->
          <table v-else-if="sourceMode === 'cdf' && filteredLogs.length > 0" class="access-table">
            <thead>
              <tr>
                <th style="width: 140px;" class="text-center">Fecha y Hora</th>
                <th style="width: 130px;" class="text-center">Tipo</th>
                <th>Concepto / Detalle</th>
                <th style="width: 140px;" class="text-right">Variación (kg)</th>
                <th style="width: 140px;" class="text-right">Stock Acum. (kg)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in filteredLogs" :key="log.id">
                <td class="text-center font-mono text-xs">{{ formatDateTime(log.fecha) }}</td>
                <td class="text-center">
                  <span :class="['type-badge', getTipoClass(log.tipo_movimiento)]">
                    {{ getTipoLabel(log.tipo_movimiento) }}
                  </span>
                </td>
                <td class="text-xs">{{ log.concepto || log.detalle || '-' }}</td>
                <td class="text-right font-mono font-bold" :class="getDeltaClass(calcularKilosLog(log))">
                  {{ calcularKilosLog(log) > 0 ? '+' : '' }}{{ calcularKilosLog(log).toFixed(3) }} kg
                </td>
                <td class="text-right font-mono font-bold text-blue">
                  {{ log.balanceAcumulado.toFixed(3) }} kg
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Estado vacío por búsqueda -->
          <div v-else-if="currentLogs.length > 0 && filteredLogs.length === 0" class="empty-state" style="padding: 2.5rem; text-align: center;">
            <i class="ph ph-magnifying-glass icon-xl" style="font-size: 2.2rem; opacity: 0.4;"></i>
            <p style="margin-top: 0.5rem; font-weight: bold;">No se encontraron operaciones que coincidan con "{{ tableSearchQuery }}".</p>
            <button class="btn btn-secondary btn-sm mt-2" @click="tableSearchQuery = ''">
              <i class="ph ph-arrow-counter-clockwise"></i> Limpiar filtro de búsqueda
            </button>
          </div>

          <!-- Estado vacío original -->
          <div v-else class="empty-state" style="padding: 3rem; text-align: center;">
            <i class="ph ph-clock-counter-clockwise icon-xl" style="font-size: 2.5rem; opacity: 0.4;"></i>
            <p style="margin-top: 0.5rem; font-weight: bold;">No se registraron movimientos para este producto en el rango de fechas seleccionado.</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import * as XLSX from 'xlsx'
import Chart from 'chart.js/auto'

// Estado principal
const sourceMode = ref('blockwms') // 'blockwms' | 'cdf'
const productos = ref([])
const rawLogs = ref([])
const snapshots = ref([])
const blockLogs = ref([])
const loading = ref(false)
const loadingBlockWms = ref(false)
const productSearchText = ref('')
const selectedProduct = ref(null)
const tableSearchQuery = ref('')

// Cronómetro de Alta Precisión (00.00 - Segundos y Centésimas)
const elapsedTime = ref(0)
let timerInterval = null

const startTimer = () => {
  elapsedTime.value = 0
  const startTime = performance.now()
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    elapsedTime.value = performance.now() - startTime
  }, 10)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const formattedTimer = computed(() => {
  const msTotal = Math.floor(elapsedTime.value)
  const sec = Math.floor(msTotal / 1000)
  const centis = Math.floor((msTotal % 1000) / 10)

  const sStr = String(sec).padStart(2, '0')
  const cStr = String(centis).padStart(2, '0')

  return `${sStr}.${cStr}`
})

// Chart.js Canvas & Instance
const chartCanvas = ref(null)
let chartInstance = null

const alert = ref({ show: false, message: '', type: 'success' })

// Formatear rango de fechas inicial (últimos 7 días por defecto para consultas rápidas)
const dHasta = new Date()
const dDesde = new Date()
dDesde.setDate(dDesde.getDate() - 7)

const filters = ref({
  startDate: dDesde.toISOString().slice(0, 10),
  endDate: dHasta.toISOString().slice(0, 10)
})

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 5000)
}

// Extracción limpia y segura del código de producto buscado
const getActiveProductCode = () => {
  if (selectedProduct.value) return String(selectedProduct.value.codigo).trim()
  const raw = String(productSearchText.value || '').trim()
  if (!raw) return ''

  // Si contiene el delimitador ' - ', extraer sólo el código inicial
  if (raw.includes(' - ')) {
    return raw.split(' - ')[0].trim()
  }

  // Buscar coincidencia exacta con un producto del catálogo local
  const found = productos.value.find(p => String(p.codigo).trim().toLowerCase() === raw.toLowerCase())
  if (found) return String(found.codigo).trim()

  // Si no hay coincidencia, usar la entrada limpia tal como la ingresó el usuario (ej: 1137)
  return raw
}

// Nombre legible del producto activo
const getActiveProductName = () => {
  if (selectedProduct.value) return selectedProduct.value.nombre
  const code = getActiveProductCode()
  if (code) {
    const found = productos.value.find(p => String(p.codigo).trim().toLowerCase() === code.toLowerCase())
    if (found) return found.nombre
  }
  const raw = String(productSearchText.value || '').trim()
  if (raw.includes(' - ')) {
    return raw.split(' - ').slice(1).join(' - ').trim()
  }
  return raw || 'Producto Desconocido'
}

const setSourceMode = (mode) => {
  sourceMode.value = mode
}

// Cargar catálogo local y logs locales
const fetchInitialData = async () => {
  loading.value = true
  try {
    const resProd = await fetch('/api/productos')
    let resLogs = await fetch('/api/productos/movimientos-stock')
    if (!resLogs.ok) {
      resLogs = await fetch('/api/movimientos-stock')
    }
    const resSnaps = await fetch('/api/productos/snapshots')

    if (resProd.ok) productos.value = await resProd.json()
    if (resLogs.ok) rawLogs.value = await resLogs.json()
    if (resSnaps.ok) snapshots.value = await resSnaps.json()
  } catch (error) {
    console.error('Error al cargar catálogo inicial:', error)
  } finally {
    loading.value = false
  }
}

// Consultar Trazabilidad Directa en BlockWMS BBDD (SQL Server Stored Procedure)
const fetchBlockWmsTrazabilidad = async () => {
  const code = getActiveProductCode()
  if (!code) {
    showAlert('Ingresa o selecciona un código de producto válido.', 'warning')
    return
  }

  loadingBlockWms.value = true
  startTimer()
  try {
    const url = `/api/wms/trazabilidad-block?codigo_producto=${encodeURIComponent(code)}&fecha_desde=${encodeURIComponent(filters.value.startDate)}&fecha_hasta=${encodeURIComponent(filters.value.endDate)}`
    const res = await fetch(url)
    const data = await res.json()

    if (res.ok && data.ok) {
      blockLogs.value = data.items || []
      if (blockLogs.value.length > 0) {
        showAlert(`Trazabilidad obtenida de BlockWMS (${blockLogs.value.length} registros).`)
      } else {
        showAlert(`No se encontraron registros de trazabilidad en BlockWMS para el producto ${code} entre las fechas seleccionadas.`, 'warning')
      }
    } else {
      showAlert(data.error || 'Error al consultar trazabilidad en BlockWMS', 'error')
      blockLogs.value = []
    }
  } catch (err) {
    console.error('Error en fetchBlockWmsTrazabilidad:', err)
    showAlert('Error de conexión con el servidor backend/BlockWMS', 'error')
    blockLogs.value = []
  } finally {
    stopTimer()
    loadingBlockWms.value = false
    await nextTick()
    renderChart()
  }
}

const handleConsultar = () => {
  if (sourceMode.value === 'blockwms') {
    fetchBlockWmsTrazabilidad()
  } else {
    startTimer()
    nextTick(() => {
      renderChart()
      stopTimer()
    })
  }
}

// Manejador del input de búsqueda (NO sobreescribe el texto mientras el usuario escribe)
const handleProductSelect = () => {
  const query = String(productSearchText.value || '').trim()
  if (!query) {
    selectedProduct.value = null
    return
  }

  // Comprobar coincidencia exacta por código
  const foundByCode = productos.value.find(p => String(p.codigo).trim().toLowerCase() === query.toLowerCase())
  if (foundByCode) {
    selectedProduct.value = foundByCode
    return
  }

  // Comprobar coincidencia exacta por "codigo - nombre"
  const foundByFormatted = productos.value.find(p => `${p.codigo} - ${p.nombre}`.toLowerCase() === query.toLowerCase())
  if (foundByFormatted) {
    selectedProduct.value = foundByFormatted
    return
  }

  selectedProduct.value = null
}

const selectProduct = (prod) => {
  if (!prod) return
  selectedProduct.value = prod
  productSearchText.value = String(prod.codigo).trim()
}

const clearProductSelection = () => {
  selectedProduct.value = null
  productSearchText.value = ''
  tableSearchQuery.value = ''
  blockLogs.value = []
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

const pesoXPieza = computed(() => {
  if (!selectedProduct.value) return 0
  return parseFloat(selectedProduct.value.peso_pieza) || 0
})

const stockKilosTotal = computed(() => {
  if (!selectedProduct.value) return 0
  return parseFloat(selectedProduct.value.stock) || 0
})

const calcularKilosLog = (log) => {
  if (log.isTodayCurrentStock || log.isSnapshot) return 0
  const kilosExplicit = parseFloat(log.stock !== undefined && log.stock !== null ? log.stock : (log.kilos_calculado || log.kilos || log.peso)) || 0
  if (kilosExplicit !== 0) return kilosExplicit
  const pzas = parseFloat(log.cantidad_piezas) || 0
  return pzas * pesoXPieza.value
}

// Logs filtrados locales CDF
const cdfFilteredLogs = computed(() => {
  const code = getActiveProductCode()
  if (!code) return []

  const productSnaps = snapshots.value.filter(s => String(s.codigo_producto).trim() === code)
  productSnaps.sort((a, b) => new Date(b.fecha_corte) - new Date(a.fecha_corte))
  const latestSnap = productSnaps.length > 0 ? productSnaps[0] : null

  let list = rawLogs.value.filter(log => String(log.codigo_producto).trim() === code)

  if (latestSnap) {
    const snapDate = new Date(latestSnap.fecha_corte)
    list = list.filter(log => new Date(log.fecha) >= snapDate)
  }

  if (filters.value.endDate) {
    const endStr = `${filters.value.endDate}T23:59:59`
    list = list.filter(log => log.fecha <= endStr)
  }

  list.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  let resultList = []
  let runningBalance = 0

  if (latestSnap) {
    runningBalance = parseFloat(latestSnap.stock_kilos) || 0
    resultList.push({
      id: `snapshot-${latestSnap.id}`,
      fecha: latestSnap.fecha_corte,
      tipo_movimiento: 'SNAPSHOT_INICIAL',
      concepto: latestSnap.observaciones || 'Inventario Inicial Auditado',
      cantidad_piezas: 0,
      stock: 0,
      isSnapshot: true,
      balanceAcumulado: runningBalance
    })
  } else {
    const currentStock = stockKilosTotal.value
    const deltas = list.map(log => calcularKilosLog(log))
    const totalDeltas = deltas.reduce((sum, d) => sum + d, 0)
    runningBalance = currentStock - totalDeltas
  }

  list.forEach((log) => {
    runningBalance += calcularKilosLog(log)
    resultList.push({
      ...log,
      balanceAcumulado: runningBalance
    })
  })

  if (filters.value.startDate) {
    resultList = resultList.filter(log => log.fecha >= filters.value.startDate)
  }

  return resultList
})

// Selector unificado de logs para la vista activa
const currentLogs = computed(() => {
  if (sourceMode.value === 'blockwms') {
    return blockLogs.value
  }
  return cdfFilteredLogs.value
})

// Filtrado de la tabla según buscador
const filteredLogs = computed(() => {
  if (!tableSearchQuery.value.trim()) return currentLogs.value
  const q = tableSearchQuery.value.toLowerCase().trim()

  if (sourceMode.value === 'blockwms') {
    return currentLogs.value.filter(log => {
      return (
        (log.fecha && String(log.fecha).toLowerCase().includes(q)) ||
        (log.tipo && String(log.tipo).toLowerCase().includes(q)) ||
        (log.operacion && String(log.operacion).toLowerCase().includes(q)) ||
        (log.codigo_orden && String(log.codigo_orden).toLowerCase().includes(q)) ||
        (log.codigo_orden_erp && String(log.codigo_orden_erp).toLowerCase().includes(q)) ||
        (log.entidad_nombre && String(log.entidad_nombre).toLowerCase().includes(q)) ||
        (log.entidad_codigo && String(log.entidad_codigo).toLowerCase().includes(q)) ||
        (log.ubicacion_origen && String(log.ubicacion_origen).toLowerCase().includes(q)) ||
        (log.ubicacion_destino && String(log.ubicacion_destino).toLowerCase().includes(q)) ||
        (log.lote && String(log.lote).toLowerCase().includes(q)) ||
        (log.fecha_vencimiento && String(log.fecha_vencimiento).toLowerCase().includes(q))
      )
    })
  } else {
    return currentLogs.value.filter(log => {
      return (
        (log.fecha && String(log.fecha).toLowerCase().includes(q)) ||
        (log.tipo_movimiento && String(log.tipo_movimiento).toLowerCase().includes(q)) ||
        (getTipoLabel(log.tipo_movimiento) && getTipoLabel(log.tipo_movimiento).toLowerCase().includes(q)) ||
        (log.concepto && String(log.concepto).toLowerCase().includes(q)) ||
        (log.detalle && String(log.detalle).toLowerCase().includes(q))
      )
    })
  }
})

// Renderizado del Gráfico con Chart.js
const renderChart = async () => {
  await nextTick()
  if (!chartCanvas.value) return
  if (chartInstance) chartInstance.destroy()

  const logs = currentLogs.value
  let labels = []
  let dataValues = []

  if (sourceMode.value === 'blockwms') {
    labels = logs.map(log => log.fecha)
    dataValues = logs.map(log => Number(log.stock_acumulado.toFixed(3)))
  } else {
    labels = logs.map(log => formatDateShort(log.fecha))
    dataValues = logs.map(log => Number(log.balanceAcumulado.toFixed(3)))
  }

  const ctx = chartCanvas.value.getContext('2d')
  const labelSerie = sourceMode.value === 'blockwms' ? 'Stock Acumulado BlockWMS (kg)' : 'Stock Local CDF (kg)'

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['Sin datos'],
      datasets: [{
        label: labelSerie,
        data: dataValues.length > 0 ? dataValues : [0],
        borderColor: sourceMode.value === 'blockwms' ? '#0284c7' : '#16a34a',
        backgroundColor: sourceMode.value === 'blockwms' ? 'rgba(2, 132, 199, 0.08)' : 'rgba(22, 163, 74, 0.08)',
        borderWidth: 3,
        fill: true,
        tension: 0.2,
        pointBackgroundColor: sourceMode.value === 'blockwms' ? '#0284c7' : '#16a34a',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { font: { weight: 'bold' } }
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.raw} kg`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: '600' } }
        },
        y: {
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { font: { size: 11 } }
        }
      }
    }
  })
}

// Formatters auxiliares
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return dateStr
}

const formatDateTime = (str) => {
  if (!str) return '-'
  const d = new Date(str)
  if (isNaN(d.getTime())) return str
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

const formatDateShort = (str) => {
  if (!str) return ''
  const d = new Date(str)
  if (isNaN(d.getTime())) return str
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

const getTipoLabel = (tipo) => {
  if (tipo === 'SNAPSHOT_INICIAL') return 'Inventario Inicial'
  if (tipo === 'STOCK_ACTUAL') return 'Stock Actual'
  if (tipo === 'INGRESO_PROVEEDOR') return 'Ingreso'
  if (tipo === 'PEDIDO_ENVIADO') return 'Despacho'
  if (tipo === 'PROCESO') return 'Proceso'
  if (tipo === 'CONVERSION') return 'Conversión'
  if (tipo === 'DECOMISO') return 'Decomiso'
  if (tipo === 'AJUSTE_DIRECTO') return 'Ajuste Audit.'
  return tipo || 'Movimiento'
}

const getTipoClass = (tipo) => {
  if (tipo === 'SNAPSHOT_INICIAL' || tipo === 'STOCK_ACTUAL') return 'badge-info'
  if (tipo === 'INGRESO_PROVEEDOR') return 'badge-success'
  if (tipo === 'PEDIDO_ENVIADO') return 'badge-primary'
  if (tipo === 'DECOMISO') return 'badge-danger'
  if (tipo === 'PROCESO' || tipo === 'CONVERSION') return 'badge-warning'
  return 'badge-secondary'
}

const getBlockTipoClass = (tipo) => {
  if (tipo === 'INGRESO') return 'badge-success'
  if (tipo === 'EGRESO') return 'badge-danger'
  return 'badge-info'
}

const getDeltaClass = (val) => {
  if (val > 0) return 'text-green font-bold'
  if (val < 0) return 'text-red font-bold'
  return 'text-muted'
}

// Exportar trazabilidad a Excel
const exportToExcel = () => {
  const code = getActiveProductCode()
  const name = getActiveProductName()
  if (!code || filteredLogs.value.length === 0) return

  let dataToExport = []
  if (sourceMode.value === 'blockwms') {
    dataToExport = filteredLogs.value.map(log => ({
      'Código Producto': code,
      'Nombre Producto': name,
      'Fecha': log.fecha,
      'Tipo': log.tipo,
      'Operación': log.operacion,
      'Código Orden': log.codigo_orden,
      'Orden ERP': log.codigo_orden_erp,
      'Entidad / Sucursal': log.entidad_nombre || log.entidad_codigo,
      'Ubicación Origen': log.ubicacion_origen,
      'Ubicación Destino': log.ubicacion_destino,
      'Lote': log.lote,
      'Vencimiento': log.fecha_vencimiento,
      'Ingreso (kg)': log.cantidad_ingreso,
      'Egreso (kg)': log.cantidad_egreso,
      'Stock Acumulado WMS (kg)': log.stock_acumulado
    }))
  } else {
    dataToExport = filteredLogs.value.map(log => ({
      'Código Producto': code,
      'Nombre Producto': name,
      'Fecha y Hora': formatDateTime(log.fecha),
      'Tipo Movimiento': getTipoLabel(log.tipo_movimiento),
      'Concepto / Detalle': log.concepto || log.detalle || '-',
      'Variación (kg)': parseFloat(calcularKilosLog(log).toFixed(3)),
      'Stock Acumulado CDF (kg)': parseFloat(log.balanceAcumulado.toFixed(3))
    }))
  }

  const worksheet = XLSX.utils.json_to_sheet(dataToExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trazabilidad BlockWMS')

  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 25 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 }
  ]

  XLSX.writeFile(workbook, `Trazabilidad_${sourceMode.value.toUpperCase()}_${code}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

onMounted(async () => {
  await fetchInitialData()
})
</script>

<style scoped>
.type-badge {
  display: inline-block;
  padding: 0.15rem 0.45rem;
  font-size: 0.72rem;
  font-weight: bold;
  text-transform: uppercase;
  border-radius: 0;
}

.badge-info { background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; }
.badge-success { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
.badge-primary { background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }
.badge-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
.badge-warning { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
.badge-secondary { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
</style>
