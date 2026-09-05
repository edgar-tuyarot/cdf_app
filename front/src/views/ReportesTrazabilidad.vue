<template>
  <div class="page-container animate-fade">
    <!-- Header de la Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-line-segments text-blue"></i> Trazabilidad e Historial de Producto
        </h2>
        <p class="page-description">Consulta la evolución temporal del stock y el historial completo de movimientos para cualquier producto del catálogo.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-secondary" @click="exportToExcel" :disabled="loading || !selectedProduct || filteredLogs.length === 0">
          <i class="ph ph-file-xls text-green"></i> Exportar Excel
        </button>
        <button class="btn btn-primary" @click="fetchInitialData" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Panel de Selección de Producto, Unidad de Medida y Fechas -->
    <div class="card mb-4" style="padding: 1rem; background: var(--bg-window); border: 1.5px solid var(--bevel-dark);">
      <div style="font-weight: 850; font-size: 0.82rem; margin-bottom: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
        <i class="ph ph-funnel" style="color: var(--accent-primary);"></i> Controles de Consulta
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: end;">
        
        <!-- Selector de Producto (Buscador / Autocomplete) -->
        <div class="form-group" style="margin-bottom: 0; grid-column: span 2;">
          <label class="form-label" style="font-weight: bold;">Seleccionar Producto *</label>
          <div style="position: relative; display: flex; align-items: center;">
            <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.75rem; color: var(--text-muted); font-size: 1.1rem; pointer-events: none;"></i>
            <input 
              type="text" 
              v-model="productSearchText" 
              list="catalog-products-list-trazabilidad" 
              @input="handleProductSelect" 
              class="form-control" 
              placeholder="Buscar por código o nombre de producto..." 
              style="padding-left: 2.3rem; height: 40px; font-weight: 600; font-size: 0.9rem;"
            />
            <button 
              v-if="productSearchText" 
              @click="clearProductSelection" 
              style="position: absolute; right: 0.6rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;"
            >
              <i class="ph ph-x-circle" style="font-size: 1.1rem;"></i>
            </button>
          </div>
          <datalist id="catalog-products-list-trazabilidad">
            <option v-for="p in productos" :key="p.codigo" :value="p.codigo">
              {{ p.nombre }}
            </option>
          </datalist>
        </div>

        <!-- Selector de Producto (Buscador / Autocomplete) -->
        <div class="form-group" style="margin-bottom: 0; grid-column: span 2;">
          <label class="form-label" style="font-weight: bold;">Seleccionar Producto *</label>
          <div style="position: relative; display: flex; align-items: center;">
            <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.75rem; color: var(--text-muted); font-size: 1.1rem; pointer-events: none;"></i>
            <input 
              type="text" 
              v-model="productSearchText" 
              list="catalog-products-list-trazabilidad" 
              @input="handleProductSelect" 
              class="form-control" 
              placeholder="Buscar por código o nombre de producto..." 
              style="padding-left: 2.3rem; height: 40px; font-weight: 600; font-size: 0.9rem;"
            />
            <button 
              v-if="productSearchText" 
              @click="clearProductSelection" 
              style="position: absolute; right: 0.6rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;"
            >
              <i class="ph ph-x-circle" style="font-size: 1.1rem;"></i>
            </button>
          </div>
          <datalist id="catalog-products-list-trazabilidad">
            <option v-for="p in productos" :key="p.codigo" :value="p.codigo">
              {{ p.nombre }}
            </option>
          </datalist>
        </div>

        <!-- Filtros de Fechas -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Fecha Desde</label>
          <input type="date" v-model="filters.startDate" class="form-control" style="height: 38px;" />
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Fecha Hasta</label>
          <input type="date" v-model="filters.endDate" class="form-control" style="height: 38px;" />
        </div>

      </div>
    </div>

    <!-- Si NO hay producto seleccionado -->
    <div v-if="!selectedProduct" class="card text-center p-5 animate-fade mb-4">
      <i class="ph ph-line-segments text-blue icon-xl mb-2" style="font-size: 3rem;"></i>
      <h3 class="font-bold text-lg mb-1">Selecciona un producto para ver su trazabilidad</h3>
      <p class="text-muted text-xs">Usa el buscador superior para elegir cualquier producto del catálogo y auditar su evolución temporal.</p>
    </div>

    <!-- PANTALLA PRINCIPAL CON DATOS DEL PRODUCTO SELECCIONADO -->
    <div v-else class="animate-fade">
      
      <!-- Ficha del Producto Seleccionado -->
      <div class="card mb-4" style="padding: 1rem; background: var(--bg-secondary); border: 2px solid var(--accent-primary);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <span class="badge code-badge mb-1" style="font-size: 0.85rem; padding: 0.2rem 0.5rem;">CÓDIGO: {{ selectedProduct.codigo }}</span>
            <h3 style="margin: 0.2rem 0; font-size: 1.3rem; font-weight: 850; color: var(--text-primary);">
              {{ selectedProduct.nombre }}
            </h3>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.82rem; margin-top: 0.4rem; color: var(--text-secondary);">
              <span>⚖️ Stock Total: <strong>{{ stockKilosTotal.toFixed(3) }} kg</strong></span>
              <span>⚖️ Peso x pieza: <strong>{{ pesoXPieza > 0 ? `${pesoXPieza.toFixed(3)} kg` : 'Sin peso asignado (0.000 kg)' }}</strong></span>
            </div>
          </div>
          
          <div style="text-align: right;" class="d-none-mobile">
            <span class="text-xs text-muted block uppercase font-bold">Unidad de Medida:</span>
            <span class="badge" style="background: var(--accent-primary); color: white; font-size: 0.85rem; font-weight: bold; margin-top: 0.2rem;">
              Kilogramos (kg)
            </span>
          </div>
        </div>
      </div>

      <!-- Tarjetas KPI -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
        <div class="status-card info">
          <div class="status-card-body">
            <div class="status-card-info">
              <span class="status-card-title">Total Ingresos</span>
              <span class="status-card-value text-blue">
                +{{ kpis.totalIngresos.toFixed(3) }} kg
              </span>
              <span class="status-card-desc">Proveedores / Producción</span>
            </div>
            <i class="ph ph-arrow-down-left status-card-icon"></i>
          </div>
        </div>

        <div class="status-card critical">
          <div class="status-card-body">
            <div class="status-card-info">
              <span class="status-card-title">Total Egresos</span>
              <span class="status-card-value text-red">
                -{{ kpis.totalEgresos.toFixed(3) }} kg
              </span>
              <span class="status-card-desc">Pedidos / Descartes</span>
            </div>
            <i class="ph ph-arrow-up-right status-card-icon"></i>
          </div>
        </div>

        <div class="status-card success">
          <div class="status-card-body">
            <div class="status-card-info">
              <span class="status-card-title">Variación Neta</span>
              <span :class="['status-card-value', kpis.variacionNeta >= 0 ? 'text-green' : 'text-red']">
                {{ kpis.variacionNeta >= 0 ? '+' : '' }}{{ kpis.variacionNeta.toFixed(3) }} kg
              </span>
              <span class="status-card-desc">Período consultado</span>
            </div>
            <i class="ph ph-scales status-card-icon"></i>
          </div>
        </div>

        <div class="status-card warning">
          <div class="status-card-body">
            <div class="status-card-info">
              <span class="status-card-title">Total Movimientos</span>
              <span class="status-card-value text-amber">{{ filteredLogs.length }}</span>
              <span class="status-card-desc">Registros trazables</span>
            </div>
            <i class="ph ph-list-numbers status-card-icon"></i>
          </div>
        </div>
      </div>

      <!-- GRÁFICO DE LÍNEA: EVOLUCIÓN TEMPORAL DEL STOCK -->
      <div class="card mb-4">
        <div class="card-header" style="background: #0f172a; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span class="card-title" style="color: white; font-weight: bold;">
            <i class="ph ph-chart-line-up" style="margin-right: 0.4rem; color: #60a5fa;"></i> Evolución del Stock en Kilogramos (kg)
          </span>
          <span class="text-xs" style="color: #94a3b8; font-weight: bold;">
            Trazabilidad por Peso Total
          </span>
        </div>
        <div class="card-body" style="padding: 1rem;">
          <div style="position: relative; height: 320px; width: 100%;" class="no-print">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- TABLA DETALLADA DE MOVIMIENTOS -->
      <div class="card">
        <div class="card-header" style="background: #0f172a; color: white; display: flex; justify-content: space-between; align-items: center;">
          <span class="card-title" style="color: white;">
            Historial Completo de Movimientos ({{ filteredLogs.length }} registros)
          </span>
          <span class="text-xs" style="color: #94a3b8;">
            Orden cronológico
          </span>
        </div>

        <div class="table-container">
          <table v-if="filteredLogs.length > 0" class="access-table">
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

          <div v-else class="empty-state">
            <i class="ph ph-clock-counter-clockwise icon-xl"></i>
            No se registraron movimientos para este producto en el rango de fechas seleccionado.
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
const productos = ref([])
const rawLogs = ref([])
const snapshots = ref([])
const loading = ref(true)
const productSearchText = ref('')
const selectedProduct = ref(null)

// Unidad de Medida fija en Kilos
const unitMode = ref('kilos')

// Chart.js Canvas & Instance
const chartCanvas = ref(null)
let chartInstance = null

const alert = ref({ show: false, message: '', type: 'success' })

const filters = ref({
  startDate: '',
  endDate: ''
})

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3500)
}

const unitSuffix = computed(() => 'kg')

const pesoXPieza = computed(() => {
  if (!selectedProduct.value) return 0
  return parseFloat(selectedProduct.value.peso_pieza) || 0
})

const stockPiezasTotal = computed(() => {
  if (!selectedProduct.value) return 0
  if (selectedProduct.value.vencimientosList) {
    return selectedProduct.value.vencimientosList.reduce((sum, v) => sum + (parseInt(v.piezas, 10) || 0), 0)
  }
  return 0
})

const stockKilosTotal = computed(() => {
  if (!selectedProduct.value) return 0
  const realStock = parseFloat(selectedProduct.value.stock) || 0
  if (realStock > 0) return realStock
  const kilosBlock = parseFloat(selectedProduct.value.kilos_block) || 0
  if (kilosBlock > 0) return kilosBlock
  return stockPiezasTotal.value * pesoXPieza.value
})

// Cargar catálogo de productos, movimientos y snapshots de stock
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

    // Auto-seleccionar primer producto si no hay uno seleccionado
    if (!selectedProduct.value && productos.value.length > 0) {
      selectProduct(productos.value[0])
    } else if (selectedProduct.value) {
      // Refrescar objeto seleccionado
      const updated = productos.value.find(p => p.codigo === selectedProduct.value.codigo)
      if (updated) selectedProduct.value = updated
    }

    await nextTick()
    renderChart()
  } catch (error) {
    console.error('Error al cargar datos:', error)
    showAlert('Error al conectar con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

const handleProductSelect = () => {
  const query = productSearchText.value.trim().toLowerCase()
  const found = productos.value.find(p => p.codigo.toLowerCase() === query || p.nombre.toLowerCase() === query)
  if (found) {
    selectProduct(found)
  }
}

const selectProduct = (prod) => {
  selectedProduct.value = prod
  productSearchText.value = `${prod.codigo} - ${prod.nombre}`
  nextTick(() => {
    renderChart()
  })
}

const clearProductSelection = () => {
  selectedProduct.value = null
  productSearchText.value = ''
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

// Cálculo exacto de kilos por movimiento usando el peso del producto
const calcularKilosLog = (log) => {
  if (log.isTodayCurrentStock || log.isSnapshot) return 0
  const kilosExplicit = parseFloat(log.stock !== undefined && log.stock !== null ? log.stock : (log.kilos_calculado || log.kilos || log.peso)) || 0
  if (kilosExplicit !== 0) return kilosExplicit
  const pzas = parseFloat(log.cantidad_piezas) || 0
  return pzas * pesoXPieza.value
}

// Filtrado de logs por producto seleccionado, snapshot y rango de fechas
const filteredLogs = computed(() => {
  if (!selectedProduct.value) return []
  const code = selectedProduct.value.codigo

  // Buscar el snapshot del 12/08 o más cercano
  const productSnaps = snapshots.value.filter(s => s.codigo_producto === code)
  productSnaps.sort((a, b) => new Date(b.fecha_corte) - new Date(a.fecha_corte))
  const latestSnap = productSnaps.length > 0 ? productSnaps[0] : null

  let list = rawLogs.value.filter(log => log.codigo_producto === code)

  if (latestSnap) {
    // Tomar sólo movimientos posteriores a la fecha del snapshot
    const snapDate = new Date(latestSnap.fecha_corte)
    list = list.filter(log => new Date(log.fecha) >= snapDate)
  }

  if (filters.value.endDate) {
    const endStr = `${filters.value.endDate}T23:59:59`
    list = list.filter(log => log.fecha <= endStr)
  }

  // Ordenar cronológicamente ascendente
  list.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  let resultList = []
  let runningBalance = 0

  if (latestSnap) {
    runningBalance = parseFloat(latestSnap.stock_kilos) || 0
    const snapshotEntry = {
      id: `snapshot-${latestSnap.id}`,
      fecha: latestSnap.fecha_corte,
      tipo_movimiento: 'SNAPSHOT_INICIAL',
      concepto: latestSnap.observaciones || 'Inventario Inicial Auditado 12/08/2026',
      cantidad_piezas: 0,
      stock: 0,
      isSnapshot: true,
      balanceAcumulado: runningBalance
    }
    resultList.push(snapshotEntry)
  } else {
    // Si no hay snapshot, usar recalculado con Stock Actual de referencia
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

  // Filtrar por fecha desde si se ha especificado un rango
  if (filters.value.startDate) {
    resultList = resultList.filter(log => log.fecha >= filters.value.startDate)
  }

  // Punto del día de hoy con el Stock Actual de referencia
  const now = new Date()
  const todayEntry = {
    id: `current-stock-${code}-${now.getTime()}`,
    fecha: now.toISOString(),
    tipo_movimiento: 'STOCK_ACTUAL',
    concepto: 'Estado de Stock Físico Actual en Depósito',
    cantidad_piezas: 0,
    kilos_calculado: 0,
    isTodayCurrentStock: true,
    balanceAcumulado: stockKilosTotal.value
  }

  if (!filters.value.endDate || new Date(filters.value.endDate) >= now) {
    resultList.push(todayEntry)
  }

  return resultList
})

// Métricas KPI
const kpis = computed(() => {
  let totalIngresos = 0
  let totalEgresos = 0

  filteredLogs.value.forEach(log => {
    const val = calcularKilosLog(log)
    if (val > 0) {
      totalIngresos += val
    } else {
      totalEgresos += Math.abs(val)
    }
  })

  return {
    totalIngresos,
    totalEgresos,
    variacionNeta: totalIngresos - totalEgresos
  }
})

// Renderizado del Gráfico de Evolución de Stock con Chart.js
const renderChart = async () => {
  await nextTick()
  if (!chartCanvas.value || !selectedProduct.value) return
  if (chartInstance) chartInstance.destroy()

  const logs = filteredLogs.value
  const labels = logs.map(log => formatDateShort(log.fecha))
  const dataValues = logs.map(log => Number(log.balanceAcumulado.toFixed(3)))

  const ctx = chartCanvas.value.getContext('2d')
  const labelSerie = 'Stock en Kilos (kg)'

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['Sin datos'],
      datasets: [{
        label: labelSerie,
        data: dataValues.length > 0 ? dataValues : [0],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.08)',
        borderWidth: 3,
        fill: true,
        tension: 0.25,
        pointBackgroundColor: '#0284c7',
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
            label: (context) => {
              return `${context.dataset.label}: ${context.raw} kg`
            }
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

// Watcher para re-renderizar gráfico al cambiar fechas
watch(() => [filters.value.startDate, filters.value.endDate], () => {
  nextTick(() => renderChart())
})

// Formateos y clases auxiliares
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
  if (tipo === 'SNAPSHOT_INICIAL') return 'badge-info'
  if (tipo === 'STOCK_ACTUAL') return 'badge-info'
  if (tipo === 'INGRESO_PROVEEDOR') return 'badge-success'
  if (tipo === 'PEDIDO_ENVIADO') return 'badge-primary'
  if (tipo === 'DECOMISO') return 'badge-danger'
  if (tipo === 'PROCESO' || tipo === 'CONVERSION') return 'badge-warning'
  return 'badge-secondary'
}

const getDeltaClass = (val) => {
  if (val > 0) return 'text-green font-bold'
  if (val < 0) return 'text-red font-bold'
  return 'text-muted'
}

// Exportar trazabilidad a Excel (Strictly Kilos)
const exportToExcel = () => {
  if (!selectedProduct.value || filteredLogs.value.length === 0) return

  const prod = selectedProduct.value
  const dataToExport = filteredLogs.value.map(log => ({
    'Código Producto': prod.codigo,
    'Nombre Producto': prod.nombre,
    'Fecha y Hora': formatDateTime(log.fecha),
    'Tipo Movimiento': getTipoLabel(log.tipo_movimiento),
    'Concepto / Detalle': log.concepto || log.detalle || '-',
    'Variación (kg)': parseFloat(calcularKilosLog(log).toFixed(3)),
    'Stock Acumulado (kg)': parseFloat(log.balanceAcumulado.toFixed(3))
  }))

  const worksheet = XLSX.utils.json_to_sheet(dataToExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trazabilidad Kilos')

  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 45 },
    { wch: 16 },
    { wch: 20 }
  ]

  XLSX.writeFile(workbook, `Trazabilidad_Kilos_${prod.codigo}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

onMounted(() => {
  fetchInitialData()
})
</script>

<style scoped>
.unit-toggle-group {
  display: flex;
  background: var(--bg-primary);
  border: 1.5px solid var(--bevel-dark);
  padding: 2px;
  height: 38px;
  box-sizing: border-box;
}

.unit-toggle-btn {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  transition: all 0.15s ease;
}

.unit-toggle-btn.active {
  background: var(--accent-primary);
  color: white;
  box-shadow: var(--raised-shadow);
}

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
