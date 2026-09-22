<template>
  <div class="page-container animate-fade">
    <!-- Header de la Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-chart-line-up text-blue"></i> Proyección & Días de Stock
        </h2>
        <p class="page-description">
          Estima los días y semanas de cobertura según el ritmo de demanda del último mes y el stock disponible en CDF.
        </p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-secondary" @click="exportToExcel" :disabled="loading || !proyeccionFiltered.length">
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

    <!-- Barra de Configuración y Filtros de Proyección -->
    <div class="card mb-4" style="padding: 0.85rem 1rem; background: var(--bg-window); border: 1px solid var(--bevel-light);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        
        <!-- Buscador por SKU o Nombre -->
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; max-width: 420px;">
          <i class="ph ph-magnifying-glass" style="color: var(--text-secondary);"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar por código o descripción de producto..." 
            class="form-control" 
            style="height: 32px; font-size: 0.82rem;"
          />
          <button v-if="searchQuery" class="btn-icon" @click="searchQuery = ''" title="Limpiar filtro">
            <i class="ph ph-x-circle"></i>
          </button>
        </div>

        <!-- Opciones de Vista y Filtros -->
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <!-- Modo de Vista: Consolidado Madres vs Todos -->
          <div class="view-mode-group">
            <button 
              type="button" 
              class="view-mode-btn" 
              :class="{ active: modoAgrupacion === 'madres' }"
              @click="modoAgrupacion = 'madres'"
              title="Consolida el despacho y stock de los productos fraccionados en su producto madre (recomendado para compras)"
            >
              <i class="ph ph-crown"></i> Consolidado Madres
            </button>
            <button 
              type="button" 
              class="view-mode-btn" 
              :class="{ active: modoAgrupacion === 'todos' }"
              @click="modoAgrupacion = 'todos'"
              title="Muestra todos los artículos por separado"
            >
              <i class="ph ph-list-dashes"></i> Todos los SKUs
            </button>
          </div>

          <!-- Base de Demanda Fija: Último Mes -->
          <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; background: var(--bg-window); padding: 4px 9px; border-radius: 4px; border: 1px solid var(--bevel-light);">
            <i class="ph ph-calendar-check text-blue" style="font-size: 1rem;"></i>
            <span style="color: var(--text-secondary); font-weight: 600;">Ritmo de Demanda:</span>
            <span style="font-weight: 700; color: var(--accent-primary);" title="Calculado sobre la demanda de los últimos 30 días">
              Último Mes ({{ ventanaMesLabel }})
            </span>
          </div>

          <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; margin: 0; cursor: pointer;">
            <input type="checkbox" v-model="soloConMovimiento" />
            <span>Ver solo con despacho en el mes</span>
          </label>
        </div>

      </div>
    </div>

    <!-- Indicadores de Cobertura y Riesgo -->
    <div class="mb-4" style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center; padding: 0.75rem 1rem; background: var(--bg-window); border: 1px solid var(--bevel-light); border-radius: 4px; font-size: 0.9rem;">
      <span class="cursor-pointer" @click="toggleFiltroRiesgo('critico')" title="Click para filtrar críticos">
        <strong>Críticos (&lt; 4 días):</strong> {{ metricasRiesgo.criticos }}
      </span>
      <span class="cursor-pointer" @click="toggleFiltroRiesgo('bajo')" title="Click para filtrar bajos">
        <strong>Bajos (4 a 7 días):</strong> {{ metricasRiesgo.bajos }}
      </span>
      <span class="cursor-pointer" @click="toggleFiltroRiesgo('optimo')" title="Click para filtrar óptimos">
        <strong>Óptimos (8 a 21 días):</strong> {{ metricasRiesgo.optimos }}
      </span>
      <span class="cursor-pointer" @click="toggleFiltroRiesgo('holgado')" title="Click para filtrar holgados">
        <strong>Holgados (&gt; 21 días):</strong> {{ metricasRiesgo.holgados }}
      </span>
      <span>
        <strong>Stock CDF Total:</strong> {{ totalStockCDF.toFixed(1) }} kg
      </span>
    </div>

    <!-- Barra de Filtro Rápido Activo -->
    <div v-if="filtroRiesgo !== 'todos'" class="mb-3" style="display: flex; align-items: center; gap: 0.5rem;">
      <span style="font-size: 0.85rem; color: var(--text-secondary);">Filtrando por:</span>
      <span class="badge" :class="badgeClassForRiesgo(filtroRiesgo)">
        {{ labelForRiesgo(filtroRiesgo) }}
      </span>
      <button class="btn btn-secondary btn-sm" @click="filtroRiesgo = 'todos'" style="font-size: 0.75rem; padding: 2px 8px;">
        <i class="ph ph-x"></i> Quitar filtro
      </button>
    </div>

    <!-- TABLA DE PROYECCIÓN DE STOCK -->
    <div class="card" style="margin-bottom: 0;">
      <div class="card-header" style="background-color: #2b5797; color: white; padding: 0.65rem 1rem; display: flex; justify-content: space-between; align-items: center;">
        <span class="card-title" style="color: white; font-weight: bold; margin: 0; font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
          <i class="ph ph-hourglass-high" style="font-size: 1.2rem;"></i>
          Estimación de Cobertura según Ritmo del Último Mes ({{ proyeccionFiltered.length }})
          <span v-if="modoAgrupacion === 'madres'" style="font-size: 0.8rem; opacity: 0.9; font-weight: normal;">
            • Vista Consolidada Madres
          </span>
        </span>
        <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 3px; font-weight: bold;">
          Demanda Base: Últimos 30 días ({{ ventanaMesLabel }})
        </span>
      </div>

      <div class="table-container" style="max-height: calc(100vh - 350px); overflow-y: auto;">
        <table class="access-table" style="width: 100%; font-size: 0.85rem;">
          <thead>
            <tr style="background: var(--bg-window);">
              <th style="width: 105px;">Código SKU</th>
              <th>Descripción del Producto</th>
              <th class="text-right" style="width: 145px;">Despacho Mes / Sem.</th>
              <th class="text-right" style="width: 110px;">Ritmo Diario</th>
              <th class="text-right" style="width: 135px;">Stock CDF</th>
              <th style="width: 165px;" class="text-center">Cobertura Estimada</th>
              <th class="text-center" style="width: 90px;">Semanas</th>
              <th class="text-center" style="width: 110px;">Agotamiento Est.</th>
              <th class="text-center" style="width: 145px;">Semáforo / Estado</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="item in proyeccionFiltered" :key="'proy-' + item.codigo">
              <!-- Fila Principal del Producto -->
              <tr :class="{ 'row-mother-expanded': item.es_madre && isExpanded(item.codigo) }">
                <td>
                  <div style="display: flex; align-items: center; gap: 0.35rem;">
                    <button 
                      v-if="item.es_madre && item.derivado_info" 
                      type="button"
                      class="btn-expand" 
                      @click.stop="toggleExpandMother(item.codigo)"
                      :title="isExpanded(item.codigo) ? 'Ocultar producto fraccionado' : 'Ver producto fraccionado derivado'"
                    >
                      <i :class="['ph', isExpanded(item.codigo) ? 'ph-minus' : 'ph-plus']"></i>
                    </button>
                    <span class="font-mono fw-bold" style="color: var(--accent-primary);">{{ item.codigo }}</span>
                  </div>
                </td>
                
                <td>
                  <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                    <span class="fw-bold" style="color: var(--text-primary);">{{ item.nombre }}</span>
                    <span v-if="item.es_madre" class="badge-tag-madre" :title="'Consolida con fraccionado SKU ' + item.codigo_fraccionado">
                      <i class="ph ph-crown"></i> Madre (↳ {{ item.codigo_fraccionado }})
                    </span>
                    <span v-else-if="item.es_derivado" class="badge-tag-derivado" :title="'Derivado de horma madre SKU ' + item.codigo_madre">
                      <i class="ph ph-arrow-elbow-down-right"></i> Derivado de {{ item.codigo_madre }}
                    </span>
                  </div>
                </td>

                <!-- Despacho Último Mes & Promedio Semanal -->
                <td class="text-right font-mono">
                  <div class="fw-bold text-blue" title="Kilos totales despachados en los últimos 30 días">
                    {{ (item.despacho_mes_kg || item.despacho_semanal_kg).toFixed(1) }} kg <span style="font-size: 0.7rem; color: var(--text-secondary);">/mes</span>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-primary);" title="Equivalente promedio semanal">
                    ~{{ (item.despacho_semanal_promedio_kg || item.despacho_semanal_kg).toFixed(1) }} kg/sem
                  </div>
                  <div v-if="item.es_madre && item.despacho_mes_derivados_kg > 0" class="breakdown-text" title="Desglose mes: horma entera + fraccionado">
                    {{ (item.despacho_mes_propio_kg || 0).toFixed(0) }}h + {{ (item.despacho_mes_derivados_kg || 0).toFixed(0) }}f
                  </div>
                </td>

                <!-- Ritmo Diario -->
                <td class="text-right font-mono text-secondary">
                  {{ item.ritmo_diario_kg.toFixed(2) }} kg/d
                </td>

                <!-- Stock Actual CDF -->
                <td class="text-right font-mono" :style="{ color: item.stock_actual <= 0 ? 'red' : 'inherit' }">
                  <div class="fw-bold">
                    {{ item.stock_actual.toFixed(1) }} kg
                  </div>
                  <div v-if="item.es_madre && item.stock_derivados_kg > 0" class="breakdown-text" title="Desglose stock: horma entera + fraccionado">
                    {{ (item.stock_propio_kg || 0).toFixed(0) }}h + {{ (item.stock_derivados_kg || 0).toFixed(0) }}f
                  </div>
                </td>

                <!-- Cobertura Estimada (Días y Mini Barra) -->
                <td class="text-center">
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <span class="font-mono fw-bold" :style="{ color: getColorForRiesgo(item.nivel_riesgo) }">
                      {{ item.dias_label }}
                    </span>
                    <div class="mini-progress-track" v-if="isFinite(item.dias_cobertura) && item.dias_cobertura > 0">
                      <div 
                        class="mini-progress-fill" 
                        :style="{ 
                          width: Math.min(100, (item.dias_cobertura / 30) * 100) + '%',
                          backgroundColor: getColorForRiesgo(item.nivel_riesgo) 
                        }"
                      ></div>
                    </div>
                  </div>
                </td>

                <!-- Semanas -->
                <td class="text-center font-mono text-secondary">
                  {{ item.semanas_label }}
                </td>

                <!-- Fecha Estimada de Agotamiento -->
                <td class="text-center font-mono" style="font-size: 0.8rem;">
                  <span :class="{ 'text-danger fw-bold': item.nivel_riesgo === 'critico' }">
                    {{ item.fecha_agotamiento_label }}
                  </span>
                </td>

                <!-- Semáforo / Badge de Estado -->
                <td class="text-center">
                  <span class="coverage-badge" :style="{ backgroundColor: getColorForRiesgo(item.nivel_riesgo) }">
                    <i :class="['ph', getIconForRiesgo(item.nivel_riesgo)]"></i>
                    {{ item.estado_label }}
                  </span>
                </td>
              </tr>

              <!-- Sub-fila Desplegada del Producto Fraccionado Derivado (Hijo) -->
              <tr v-if="item.es_madre && item.derivado_info && isExpanded(item.codigo)" class="child-subrow">
                <td style="padding-left: 2rem;">
                  <span class="font-mono text-secondary" style="font-size: 0.8rem;">
                    ↳ {{ item.derivado_info.codigo }}
                  </span>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <span style="font-size: 0.82rem; color: var(--text-secondary);">
                      {{ item.derivado_info.nombre }}
                    </span>
                    <span class="badge-tag-derivado" style="font-size: 0.65rem;">
                      Fraccionado Derivado
                    </span>
                  </div>
                </td>
                <td class="text-right font-mono" style="font-size: 0.8rem; color: var(--text-secondary);">
                  {{ (item.despacho_mes_derivados_kg || 0).toFixed(1) }} kg <span style="font-size: 0.65rem;">/mes</span>
                </td>
                <td class="text-right font-mono" style="font-size: 0.8rem; color: var(--text-secondary);">
                  {{ ((item.despacho_mes_derivados_kg || 0) / (ventanaMes.diasOperativos || 26)).toFixed(2) }} kg/d
                </td>
                <td class="text-right font-mono" style="font-size: 0.8rem; color: var(--text-secondary);">
                  {{ (item.stock_derivados_kg || 0).toFixed(1) }} kg
                </td>
                <td colspan="4" style="font-size: 0.78rem; color: var(--text-secondary); font-style: italic;">
                  Consolidado en la familia del SKU {{ item.codigo }}
                </td>
              </tr>
            </template>

            <tr v-if="loading">
              <td colspan="9" class="text-center p-4">
                <i class="ph ph-spinner spinner icon-xl"></i><br>
                <span style="font-size: 0.85rem; color: var(--text-secondary);">Calculando proyección de stock y días de cobertura...</span>
              </td>
            </tr>

            <tr v-if="!loading && proyeccionFiltered.length === 0">
              <td colspan="9" class="text-center p-4 text-muted">
                <i class="ph ph-calendar-x icon-xl mb-2" style="font-size: 2.2rem; opacity: 0.4;"></i><br>
                <span>No se encontraron productos para los criterios de búsqueda y filtros seleccionados.</span>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="proyeccionFiltered.length > 0">
            <tr style="background: var(--bg-secondary); font-weight: bold; font-size: 0.85rem;">
              <td colspan="2" class="text-right">TOTALES FILTRADOS:</td>
              <td class="text-right font-mono text-blue">{{ totalDespachoMesFiltradoKg.toFixed(1) }} kg/mes</td>
              <td class="text-right font-mono">{{ totalRitmoDiarioFiltradoKg.toFixed(2) }} kg/d</td>
              <td class="text-right font-mono fw-bold">{{ totalStockFiltradoKg.toFixed(1) }} kg</td>
              <td colspan="4" class="text-center font-mono" style="color: var(--accent-primary);">
                Promedio de Cobertura Ponderada: {{ coberturaPromedioPonderada }} días
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'

const loading = ref(false)
const modoAgrupacion = ref('madres') // 'madres' (consolidado por madre) | 'todos' (plano)
const expandedMothers = ref(new Set())

const proyeccion = ref([])
const ventanaMes = ref({ startDate: '', endDate: '', diasOperativos: 26 })
const searchQuery = ref('')
const soloConMovimiento = ref(false)
const filtroRiesgo = ref('todos') // 'todos', 'critico', 'bajo', 'optimo', 'holgado', 'sin_rotacion', 'sin_stock'

const alert = ref({
  show: false,
  message: '',
  type: 'success'
})

const showAlert = (message, type = 'success') => {
  alert.value = { show: true, message, type }
  setTimeout(() => {
    alert.value.show = false
  }, 4000)
}

// Control de filas expandidas
const toggleExpandMother = (codigo) => {
  if (expandedMothers.value.has(codigo)) {
    expandedMothers.value.delete(codigo)
  } else {
    expandedMothers.value.add(codigo)
  }
}

const isExpanded = (codigo) => expandedMothers.value.has(codigo)

// Formatear Date object a YYYY-MM-DD
const formatDateObj = (d) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Formatear YYYY-MM-DD a DD/MM/YYYY
const formatLatAmDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

const ventanaMesLabel = computed(() => {
  if (!ventanaMes.value.startDate || !ventanaMes.value.endDate) return 'Últimos 30 días'
  return `${formatLatAmDate(ventanaMes.value.startDate)} al ${formatLatAmDate(ventanaMes.value.endDate)}`
})

// Cargar datos del servidor
const fetchData = async () => {
  loading.value = true
  try {
    const url = `/api/reportes/semanal`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      proyeccion.value = data.proyeccion || []
      if (data.ventanaMes) {
        ventanaMes.value = data.ventanaMes
      }
    } else {
      showAlert('Error al obtener proyección de stock', 'error')
    }
  } catch (error) {
    console.error('Error fetching proyeccion de stock:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

// ==================== CÁLCULOS DE PROYECCIÓN SOBRE ÚLTIMO MES ====================
const calcularFechaAgotamiento = (dias) => {
  if (!isFinite(dias) || dias <= 0 || dias > 365) return '—'
  const target = new Date()
  target.setDate(target.getDate() + Math.round(dias))
  return formatLatAmDate(formatDateObj(target))
}

const proyeccionCalculada = computed(() => {
  return proyeccion.value.map(item => {
    const ritmo = Number(item.ritmo_diario_kg) || 0
    const stock = Number(item.stock_actual) || 0
    const despachoMes = Number(item.despacho_mes_kg) || 0
    const despachoSemPromedio = Number(item.despacho_semanal_promedio_kg) || (ritmo * 6)

    let dias = 0
    let semanas = 0
    let nivel = 'optimo'
    let estadoLabel = 'Óptimo'
    let diasLabel = ''
    let semanasLabel = ''
    let fechaAgotamiento = '—'

    if (item.es_derivado && modoAgrupacion.value === 'todos') {
      estadoLabel = `Consolidado en ${item.codigo_madre}`
      nivel = 'holgado'
      dias = Infinity
      semanas = Infinity
      diasLabel = `En Madre (${item.codigo_madre})`
      semanasLabel = '—'
      fechaAgotamiento = '—'
    } else if (stock <= 0 && despachoMes > 0) {
      dias = 0
      semanas = 0
      nivel = 'critico'
      estadoLabel = 'Sin Stock'
      diasLabel = '0 días (Agotado)'
      semanasLabel = '0 sem'
      fechaAgotamiento = 'Inmediato'
    } else if (stock <= 0 && despachoMes === 0) {
      dias = 0
      semanas = 0
      nivel = 'sin_rotacion'
      estadoLabel = 'Sin Stock / Sin Giro'
      diasLabel = '0 días'
      semanasLabel = '0 sem'
      fechaAgotamiento = '—'
    } else if (ritmo === 0) {
      dias = Infinity
      semanas = Infinity
      nivel = 'sin_rotacion'
      estadoLabel = 'Sin Rotación'
      diasLabel = 'Sin salidas'
      semanasLabel = '—'
      fechaAgotamiento = '—'
    } else {
      dias = stock / ritmo
      semanas = dias / 6 // 6 días operativos por semana
      fechaAgotamiento = calcularFechaAgotamiento(dias)

      if (dias < 4) {
        nivel = 'critico'
        estadoLabel = 'Crítico (< 4d)'
      } else if (dias <= 7) {
        nivel = 'bajo'
        estadoLabel = 'Bajo (4-7d)'
      } else if (dias <= 21) {
        nivel = 'optimo'
        estadoLabel = 'Óptimo (8-21d)'
      } else {
        nivel = 'holgado'
        estadoLabel = 'Holgado (> 21d)'
      }

      diasLabel = `${dias.toFixed(1)} días`
      semanasLabel = `${semanas.toFixed(1)} sem`
    }

    return {
      ...item,
      stock_actual: stock,
      despacho_mes_kg: despachoMes,
      despacho_semanal_promedio_kg: despachoSemPromedio,
      ritmo_diario_kg: ritmo,
      dias_cobertura: dias,
      semanas_cobertura: semanas,
      nivel_riesgo: nivel,
      estado_label: estadoLabel,
      dias_label: diasLabel,
      semanas_label: semanasLabel,
      fecha_agotamiento_label: fechaAgotamiento
    }
  })
})

// Métricas de riesgo para KPIs
const metricasRiesgo = computed(() => {
  let criticos = 0
  let bajos = 0
  let optimos = 0
  let holgados = 0
  let sinRotacion = 0

  proyeccionCalculada.value.forEach(p => {
    if (modoAgrupacion.value === 'madres' && p.es_derivado) return

    if (p.nivel_riesgo === 'critico') criticos++
    else if (p.nivel_riesgo === 'bajo') bajos++
    else if (p.nivel_riesgo === 'optimo') optimos++
    else if (p.nivel_riesgo === 'holgado') holgados++
    else if (p.nivel_riesgo === 'sin_rotacion') sinRotacion++
  })

  return { criticos, bajos, optimos, holgados, sinRotacion }
})

const totalStockCDF = computed(() => {
  return proyeccion.value.reduce((acc, curr) => acc + (Number(curr.stock_actual) || 0), 0)
})

// Filtro de riesgo toggle
const toggleFiltroRiesgo = (tipo) => {
  if (filtroRiesgo.value === tipo) {
    filtroRiesgo.value = 'todos'
  } else {
    filtroRiesgo.value = tipo
  }
}

// Proyección filtrada
const proyeccionFiltered = computed(() => {
  let list = proyeccionCalculada.value

  if (modoAgrupacion.value === 'madres') {
    list = list.filter(item => !item.es_derivado)
  }

  if (soloConMovimiento.value) {
    list = list.filter(item => item.despacho_mes_kg > 0)
  }

  if (filtroRiesgo.value !== 'todos') {
    list = list.filter(item => item.nivel_riesgo === filtroRiesgo.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(item => 
      item.codigo.toLowerCase().includes(q) || 
      (item.nombre && item.nombre.toLowerCase().includes(q)) ||
      (item.codigo_fraccionado && item.codigo_fraccionado.toLowerCase().includes(q)) ||
      (item.codigo_madre && item.codigo_madre.toLowerCase().includes(q))
    )
  }

  return [...list].sort((a, b) => {
    if (isFinite(a.dias_cobertura) && isFinite(b.dias_cobertura)) {
      return a.dias_cobertura - b.dias_cobertura
    }
    if (isFinite(a.dias_cobertura)) return -1
    if (isFinite(b.dias_cobertura)) return 1
    return b.stock_actual - a.stock_actual
  })
})

const totalDespachoMesFiltradoKg = computed(() => {
  return proyeccionFiltered.value.reduce((acc, curr) => acc + (curr.despacho_mes_kg || 0), 0)
})

const totalRitmoDiarioFiltradoKg = computed(() => {
  return proyeccionFiltered.value.reduce((acc, curr) => acc + (curr.ritmo_diario_kg || 0), 0)
})

const totalStockFiltradoKg = computed(() => {
  return proyeccionFiltered.value.reduce((acc, curr) => acc + curr.stock_actual, 0)
})

const coberturaPromedioPonderada = computed(() => {
  const ritmoTotal = totalRitmoDiarioFiltradoKg.value
  if (ritmoTotal <= 0) return '—'
  return (totalStockFiltradoKg.value / ritmoTotal).toFixed(1)
})

// Helpers visuales de riesgo
const getColorForRiesgo = (nivel) => {
  switch (nivel) {
    case 'critico': return '#d9534f'
    case 'bajo': return '#e67e22'
    case 'optimo': return '#27ae60'
    case 'holgado': return '#2980b9'
    case 'sin_rotacion': return '#7f8c8d'
    default: return '#333'
  }
}

const getIconForRiesgo = (nivel) => {
  switch (nivel) {
    case 'critico': return 'ph-warning-octagon'
    case 'bajo': return 'ph-warning'
    case 'optimo': return 'ph-check-circle'
    case 'holgado': return 'ph-shield-check'
    case 'sin_rotacion': return 'ph-pause-circle'
    default: return 'ph-info'
  }
}

const badgeClassForRiesgo = (nivel) => {
  switch (nivel) {
    case 'critico': return 'badge-danger'
    case 'bajo': return 'badge-warning'
    case 'optimo': return 'badge-success'
    case 'holgado': return 'badge-info'
    default: return 'badge-secondary'
  }
}

const labelForRiesgo = (nivel) => {
  switch (nivel) {
    case 'critico': return '🚨 Críticos (< 4 días)'
    case 'bajo': return '⚠️ Bajos (4 a 7 días)'
    case 'optimo': return '✅ Óptimos (8 a 21 días)'
    case 'holgado': return '📦 Holgados (> 21 días)'
    case 'sin_rotacion': return '⚪ Sin rotación'
    default: return nivel
  }
}

// Exportar a Excel
const exportToExcel = () => {
  try {
    const wb = XLSX.utils.book_new()

    const dataProy = proyeccionFiltered.value.map(item => ({
      'Código SKU': item.codigo,
      'Descripción del Producto': item.nombre,
      'Rol': item.es_madre ? 'Madre' : (item.es_derivado ? 'Derivado' : 'Estándar'),
      'Cód. Vinculado': item.es_madre ? item.codigo_fraccionado : (item.es_derivado ? item.codigo_madre : '—'),
      'Despacho Mes (30d) Propio (kg)': item.despacho_mes_propio_kg ? item.despacho_mes_propio_kg.toFixed(2) : (item.despacho_mes_kg ? item.despacho_mes_kg.toFixed(2) : '0.00'),
      'Despacho Mes (30d) Fracc. (kg)': item.despacho_mes_derivados_kg ? item.despacho_mes_derivados_kg.toFixed(2) : '0.00',
      'Despacho Mes (30d) Total (kg)': (item.despacho_mes_kg || 0).toFixed(2),
      'Promedio Semanal Estimado (kg/sem)': (item.despacho_semanal_promedio_kg || 0).toFixed(2),
      'Ritmo Diario (kg/d)': item.ritmo_diario_kg.toFixed(2),
      'Stock Horma/Madre (kg)': item.stock_propio_kg ? item.stock_propio_kg.toFixed(2) : item.stock_actual.toFixed(2),
      'Stock Fracc. (kg)': item.stock_derivados_kg ? item.stock_derivados_kg.toFixed(2) : '0.00',
      'Stock Total CDF (kg)': item.stock_actual.toFixed(2),
      'Días Cobertura Est.': isFinite(item.dias_cobertura) ? Number(item.dias_cobertura.toFixed(1)) : 'Sin rotación',
      'Semanas Cobertura Est.': isFinite(item.semanas_cobertura) ? Number(item.semanas_cobertura.toFixed(1)) : '—',
      'Fecha Estimada Agotamiento': item.fecha_agotamiento_label,
      'Estado / Diagnóstico': item.estado_label
    }))
    const wsProy = XLSX.utils.json_to_sheet(dataProy)
    XLSX.utils.book_append_sheet(wb, wsProy, 'Proyección & Cobertura (Mes)')

    const filename = `Reporte_Proyeccion_Stock_Mes_${ventanaMes.value.startDate || 'inicio'}_al_${ventanaMes.value.endDate || 'fin'}.xlsx`
    XLSX.writeFile(wb, filename)
    showAlert('Planilla Excel con Proyección de Demanda Mensual descargada con éxito', 'success')
  } catch (error) {
    console.error('Error al exportar Excel:', error)
    showAlert('Error al generar planilla Excel', 'error')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.view-mode-group {
  display: inline-flex;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--bevel-dark);
  background: var(--bg-secondary);
}

.view-mode-btn {
  border: none;
  background: transparent;
  padding: 3px 9px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.15s ease, color 0.15s ease;
}

.view-mode-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
}

.view-mode-btn.active {
  background: var(--accent-primary);
  color: #ffffff;
}

.badge-tag-madre {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(142, 68, 173, 0.12);
  color: #8e44ad;
  border: 1px solid rgba(142, 68, 173, 0.35);
  padding: 1px 6px;
  border-radius: 4px;
}

.badge-tag-derivado {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(41, 128, 185, 0.1);
  color: #2980b9;
  border: 1px solid rgba(41, 128, 185, 0.3);
  padding: 1px 6px;
  border-radius: 4px;
}

.btn-expand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  border: 1px solid var(--bevel-dark);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
}

.btn-expand:hover {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
}

.child-subrow {
  background: rgba(0, 0, 0, 0.025);
  border-left: 3px solid #8e44ad;
}

.child-subrow td {
  padding-top: 0.4rem !important;
  padding-bottom: 0.4rem !important;
}

.row-mother-expanded {
  background: rgba(142, 68, 173, 0.04);
}

.breakdown-text {
  font-size: 0.7rem;
  color: var(--text-secondary);
  opacity: 0.85;
}

.cursor-pointer {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.cursor-pointer:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.mini-progress-track {
  width: 100%;
  height: 5px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.coverage-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 12px;
  color: #fff;
  font-weight: 700;
  font-size: 0.75rem;
  white-space: nowrap;
}

.badge-danger {
  background-color: #d9534f;
  color: #fff;
}

.badge-warning {
  background-color: #f0ad4e;
  color: #fff;
}

.badge-success {
  background-color: #5cb85c;
  color: #fff;
}

.badge-info {
  background-color: #17a2b8;
  color: #fff;
}

.badge-secondary {
  background-color: #6c757d;
  color: #fff;
}
</style>
