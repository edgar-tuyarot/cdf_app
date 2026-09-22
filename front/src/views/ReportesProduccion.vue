<template>
  <div class="page-container animate-fade">
    <!-- Header de la Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-chart-line text-green"></i> Reporte Producción
        </h2>
        <p class="page-description">Ranking y estadísticas del volumen procesado, recortes y mermas por producto en la planta de producción.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-secondary" @click="exportToExcel" :disabled="loading || rankedProducts.length === 0">
          <i class="ph ph-file-xls text-green"></i> Exportar Excel
        </button>
        <button class="btn btn-primary" @click="fetchData" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
        </button>
      </div>
    </div>

    <!-- Alerta -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Panel de Filtros -->
    <div class="card mb-4" style="padding: 0.85rem 1rem; background: var(--bg-window); border: 1px solid var(--bevel-light);">
      <div style="font-weight: 700; font-size: 0.82rem; margin-bottom: 0.6rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
        <i class="ph ph-funnel" style="color: var(--accent-primary);"></i> Filtros del Reporte
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; align-items: end;">
        <!-- Fecha Desde -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Fecha Desde</label>
          <input type="date" v-model="filters.startDate" class="form-control" />
        </div>

        <!-- Fecha Hasta -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Fecha Hasta</label>
          <input type="date" v-model="filters.endDate" class="form-control" />
        </div>



        <!-- Búsqueda por Producto/Código -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Buscar Producto / Código</label>
          <input type="text" v-model="filters.search" placeholder="Buscar por código o nombre..." class="form-control" />
        </div>

        <!-- Botón Resetear -->
        <div>
          <button class="btn btn-secondary" @click="resetFilters" style="width: 100%; height: 36px;">
            <i class="ph ph-arrow-counter-clockwise"></i> Limpiar Filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Indicadores de Producción -->
    <div class="mb-4" style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center; padding: 0.75rem 1rem; background: var(--bg-window); border: 1px solid var(--bevel-light); border-radius: 4px; font-size: 0.9rem;">
      <span><strong>Total Kilos Fraccionados:</strong> {{ metrics.totalPesoBruto }} kg</span>
      <span><strong>Producto #1:</strong> {{ metrics.topProductoNombre }} ({{ metrics.topProductoKg }} kg)</span>
      <span><strong>Recortes Generados:</strong> {{ metrics.totalRecortes }} kg</span>
      <span><strong>Decomisos (Mermas):</strong> {{ metrics.totalDecomisos }} kg</span>
    </div>

    <!-- Gráfico Horizontal: Top Productos Más Fraccionados (Chart.js) -->
    <div class="card mb-4">
      <div class="card-header" style="background: #047857; color: white; display: flex; justify-content: space-between; align-items: center;">
        <span class="card-title" style="color: white; font-weight: bold;">
          <i class="ph ph-chart-bar" style="margin-right: 0.4rem;"></i> Gráfico: Top 10 Productos Más Fraccionados en Planta (Kilogramos Procesados)
        </span>
        <span class="text-xs" style="color: #a7f3d0 !important; font-weight: bold;">
          Total Variedad: {{ rankedProducts.length }} productos
        </span>
      </div>

      <div class="card-body" style="padding: 1.25rem;">
        <div style="position: relative; height: 360px; width: 100%;" class="no-print">
          <canvas ref="topProductsChartCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Tabla Ranking de Productos Más Fraccionados -->
    <div class="card">
      <div class="card-header" style="background: #0f172a; color: white; display: flex; justify-content: space-between; align-items: center;">
        <span class="card-title" style="color: white;">
          Ranking de Productos Más Fraccionados ({{ rankedProducts.length }})
        </span>
        <span class="text-xs text-muted" style="color: #cbd5e1 !important;">
          Total Kg Procesados: <strong>{{ metrics.totalPesoBruto }} kg</strong>
        </span>
      </div>

      <div class="table-container">
        <table class="access-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 50px;">#</th>
              <th>Código Insumo</th>
              <th>Producto / Insumo</th>
              <th class="text-right">Procesos</th>
              <th class="text-right">Kg Brutos Procesados</th>
              <th class="text-right">Recortes (kg)</th>
              <th class="text-right">Decomisos (kg)</th>
              <th class="text-right">Kg Netos Resultantes</th>
              <th class="text-center">% Participación</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in rankedProducts" :key="item.codigo">
              <td class="text-center">
                <span :class="['badge', idx === 0 ? 'badge-warning' : (idx === 1 ? 'badge-primary' : (idx === 2 ? 'badge-info' : 'badge-secondary'))]" style="font-weight: 800;">
                  #{{ idx + 1 }}
                </span>
              </td>
              <td><strong>{{ item.codigo }}</strong></td>
              <td>{{ item.nombre }}</td>
              <td class="text-right">{{ item.operacionesCount }}</td>
              <td class="text-right fw-bold text-green" style="font-size: 0.9rem;">
                {{ item.pesoBruto.toFixed(3) }} kg
              </td>
              <td class="text-right text-muted">{{ item.recorte.toFixed(3) }}</td>
              <td class="text-right text-red">{{ item.decomiso.toFixed(3) }}</td>
              <td class="text-right fw-bold text-blue">{{ item.pesoNeto.toFixed(3) }} kg</td>
              <td class="text-center">
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
                  <div style="width: 60px; height: 6px; background: var(--bevel-dark); overflow: hidden;">
                    <div 
                      :style="{ width: Math.min(item.pctTotal, 100) + '%', background: '#047857' }" 
                      style="height: 100%;"
                    ></div>
                  </div>
                  <span style="font-size: 0.75rem; font-weight: 800; color: #047857;">
                    {{ item.pctTotal }}%
                  </span>
                </div>
              </td>
            </tr>
            <tr v-if="rankedProducts.length === 0">
              <td colspan="9" class="text-center text-muted" style="padding: 2rem;">
                <i class="ph ph-magnifying-glass" style="font-size: 1.8rem; margin-bottom: 0.5rem; display: block;"></i>
                No se encontraron registros de producción para los filtros seleccionados.
              </td>
            </tr>
          </tbody>
          <tfoot v-if="rankedProducts.length > 0">
            <tr style="background: #e2e8f0; font-weight: 800;">
              <td colspan="3" class="text-right">TOTALES GENERALES:</td>
              <td class="text-right">{{ metrics.totalProcesos }}</td>
              <td class="text-right text-green" style="font-size: 0.95rem;">{{ metrics.totalPesoBruto }} kg</td>
              <td class="text-right text-muted">{{ metrics.totalRecortes }} kg</td>
              <td class="text-right text-red">{{ metrics.totalDecomisos }} kg</td>
              <td class="text-right text-blue">{{ metrics.totalPesoNeto }} kg</td>
              <td class="text-center">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as XLSX from 'xlsx'
import Chart from 'chart.js/auto'
import { formatDateDisplay as formatDate } from '../utils/dateFormat'

const loading = ref(false)
const procesos = ref([])
const productosMap = ref({})
const colaboradoresMap = ref({})

const topProductsChartCanvas = ref(null)
let topProductsChartInstance = null

const alert = ref({
  show: false,
  message: '',
  type: 'success'
})

const filters = ref({
  startDate: '',
  endDate: '',
  proceso: 'Fraccionamiento',
  search: ''
})

const showAlert = (message, type = 'success') => {
  alert.value = { show: true, message, type }
  setTimeout(() => {
    alert.value.show = false
  }, 4000)
}

// Extractor de fecha YYYY-MM-DD sin desfasaje horario
const parseDateToYYYYMMDD = (dateStr) => {
  if (!dateStr) return ''
  const str = String(dateStr).trim()
  
  const matchISO = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (matchISO) {
    return `${matchISO[1]}-${matchISO[2]}-${matchISO[3]}`
  }

  const matchLat = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (matchLat) {
    return `${matchLat[3]}-${matchLat[2]}-${matchLat[1]}`
  }

  try {
    const d = new Date(str)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (e) {
    return ''
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const [procRes, prodRes, colabRes] = await Promise.all([
      fetch('/api/procesos'),
      fetch('/api/productos'),
      fetch('/api/colaboradores')
    ])

    if (procRes.ok) {
      procesos.value = await procRes.json()
    }
    
    if (prodRes.ok) {
      const prods = await prodRes.json()
      const pMap = {}
      prods.forEach(p => {
        pMap[p.codigo] = p.nombre
      })
      productosMap.value = pMap
    }

    if (colabRes.ok) {
      const colabs = await colabRes.json()
      const cMap = {}
      colabs.forEach(c => {
        cMap[c.id] = c.nombre
      })
      colaboradoresMap.value = cMap
    }

    await nextTick()
    renderChart()
  } catch (err) {
    console.error('Error cargando reporte de producción:', err)
    showAlert('Error al conectar con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const resetFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    proceso: '',
    search: ''
  }
}

const getProductoNombre = (proc) => {
  if (proc.Producto && proc.Producto.nombre) return proc.Producto.nombre
  if (productosMap.value[proc.codigo]) return productosMap.value[proc.codigo]
  return 'Insumo N/A'
}

// Filtrado de procesos
const filteredProcesos = computed(() => {
  const startDateStr = parseDateToYYYYMMDD(filters.value.startDate)
  const endDateStr = parseDateToYYYYMMDD(filters.value.endDate)

  return procesos.value.filter(proc => {
    if (filters.value.proceso && proc.proceso !== filters.value.proceso) {
      return false
    }

    if (filters.value.search) {
      const query = filters.value.search.toLowerCase()
      const prodName = getProductoNombre(proc).toLowerCase()
      const code = (proc.codigo || '').toLowerCase()
      if (!prodName.includes(query) && !code.includes(query)) {
        return false
      }
    }

    const procDateStr = parseDateToYYYYMMDD(proc.fecha)
    if (startDateStr && procDateStr < startDateStr) return false
    if (endDateStr && procDateStr > endDateStr) return false

    return true
  })
})

// Ranking de Productos Más Fraccionados en Planta
const rankedProducts = computed(() => {
  const map = {}
  let globalPesoBrutoSum = 0

  filteredProcesos.value.forEach(proc => {
    const code = proc.codigo || 'S/C'
    const name = getProductoNombre(proc)
    const pesoBruto = Number(proc.peso_bruto || 0)
    const recorte = Number(proc.recorte || 0)
    const decomiso = Number(proc.decomiso || 0)

    globalPesoBrutoSum += pesoBruto

    if (!map[code]) {
      map[code] = {
        codigo: code,
        nombre: name,
        operacionesCount: 0,
        pesoBruto: 0,
        recorte: 0,
        decomiso: 0
      }
    }

    map[code].operacionesCount++
    map[code].pesoBruto += pesoBruto
    map[code].recorte += recorte
    map[code].decomiso += decomiso
  })

  const result = Object.values(map).map(item => {
    const pesoNeto = Math.max(0, item.pesoBruto - item.recorte - item.decomiso)
    const pctTotal = globalPesoBrutoSum > 0 ? Number(((item.pesoBruto / globalPesoBrutoSum) * 100).toFixed(1)) : 0

    return {
      ...item,
      pesoNeto,
      pctTotal
    }
  })

  return result.sort((a, b) => b.pesoBruto - a.pesoBruto)
})

// Métricas KPI
const metrics = computed(() => {
  const list = filteredProcesos.value
  const ranking = rankedProducts.value

  let totalPesoBruto = 0
  let totalRecortes = 0
  let totalDecomisos = 0
  let totalPesoNeto = 0

  list.forEach(p => {
    const pb = Number(p.peso_bruto || 0)
    const rec = Number(p.recorte || 0)
    const dec = Number(p.decomiso || 0)

    totalPesoBruto += pb
    totalRecortes += rec
    totalDecomisos += dec
    totalPesoNeto += Math.max(0, pb - rec - dec)
  })

  const top1 = ranking.length > 0 ? ranking[0] : null

  return {
    totalProcesos: list.length,
    totalPesoBruto: totalPesoBruto.toFixed(2),
    totalRecortes: totalRecortes.toFixed(2),
    totalDecomisos: totalDecomisos.toFixed(2),
    totalPesoNeto: totalPesoNeto.toFixed(2),
    topProductoNombre: top1 ? top1.nombre : 'Sin datos',
    topProductoKg: top1 ? top1.pesoBruto.toFixed(2) : '0'
  }
})

// Renderizado del Gráfico Horizontal de Top Productos Más Fraccionados (Chart.js)
const renderChart = () => {
  if (!topProductsChartCanvas.value) return
  if (topProductsChartInstance) topProductsChartInstance.destroy()

  const top10 = rankedProducts.value.slice(0, 10)
  const labels = top10.map(p => p.nombre.length > 28 ? p.nombre.substring(0, 28) + '...' : p.nombre)
  const dataKg = top10.map(p => Number(p.pesoBruto.toFixed(2)))
  const dataRecortes = top10.map(p => Number((p.recorte).toFixed(2)))
  const dataDecomisos = top10.map(p => Number((p.decomiso).toFixed(2)))

  const ctx = topProductsChartCanvas.value.getContext('2d')
  topProductsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['Sin datos'],
      datasets: [
        {
          label: 'Kg procesados',
          data: labels.length > 0 ? dataKg : [0],
          backgroundColor: '#047857',
          borderColor: '#065f46',
          borderWidth: 1
        },
                {
          label: 'recorte',
          data: labels.length > 0 ? dataRecortes : [0],
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          borderWidth: 1
        },
        {
          label: 'decomiso',
          data: labels.length > 0 ? dataDecomisos : [0],
          backgroundColor: '#475569',
          borderColor: '#475569',
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { family: 'Inter', weight: 'bold', size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.x} kg`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: 'Kilogramos (Kg)', font: { family: 'Inter', weight: 'bold' } },
          grid: { color: '#cbd5e1' }
        },
        y: {
          grid: { display: true }
        }
      }
    }
  })
}

// Watcher para actualizar gráfico cuando cambia el ranking
watch([rankedProducts], async () => {
  await nextTick()
  renderChart()
})

const exportToExcel = () => {
  try {
    const dataToExport = rankedProducts.value.map((item, idx) => ({
      'Posición': `#${idx + 1}`,
      'Código Insumo': item.codigo,
      'Producto': item.nombre,
      'N° Operaciones': item.operacionesCount,
      'Kg Brutos Procesados': Number(item.pesoBruto.toFixed(3)),
      'Recorte (kg)': Number(item.recorte.toFixed(3)),
      'Decomiso (kg)': Number(item.decomiso.toFixed(3)),
      'Kg Netos Resultantes': Number(item.pesoNeto.toFixed(3)),
      '% Participación': `${item.pctTotal}%`
    }))

    dataToExport.push({
      'Posición': 'TOTALES GENERALES',
      'Código Insumo': '-',
      'Producto': '-',
      'N° Operaciones': metrics.value.totalProcesos,
      'Kg Brutos Procesados': Number(metrics.value.totalPesoBruto),
      'Recorte (kg)': Number(metrics.value.totalRecortes),
      'Decomiso (kg)': Number(metrics.value.totalDecomisos),
      'Kg Netos Resultantes': Number(metrics.value.totalPesoNeto),
      '% Participación': '100%'
    })

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Productos Fraccionados')
    XLSX.writeFile(workbook, `Ranking_Productos_Fraccionados_${new Date().toISOString().split('T')[0]}.xlsx`)
    showAlert('Ranking exportado a Excel con éxito')
  } catch (err) {
    console.error('Error al exportar Excel:', err)
    showAlert('Error al generar el archivo Excel', 'error')
  }
}

const printReport = () => {
  window.print()
}
</script>
