<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Reporte de Producción</h2>
        <p class="page-description">Consulta estadísticas consolidadas de producción diaria, semanal, mensual y el ranking de productos procesados.</p>
      </div>
      <div class="header-actions mt-2 no-print">
        <button class="btn btn-secondary mr-2" @click="exportToCSV" :disabled="loading">
          <i class="ph ph-file-csv"></i> Exportar a CSV
        </button>
        <button class="btn btn-secondary mr-2" @click="printReport" :disabled="loading">
          <i class="ph ph-printer"></i> Imprimir Reporte
        </button>
        <button class="btn btn-primary" @click="fetchData" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
        </button>
      </div>
    </div>

    <!-- Pestañas (Tabs) Estilo Windows 98 -->
    <div class="tabs no-print">
      <button 
        type="button" 
        :class="['tab-btn', activeTab === 'diario' ? 'active' : '']"
        @click="switchTab('diario')"
      >
        <i class="ph ph-calendar"></i> Diario por Colaborador
      </button>
      <button 
        type="button" 
        :class="['tab-btn', activeTab === 'semanal' ? 'active' : '']"
        @click="switchTab('semanal')"
      >
        <i class="ph ph-calendar-blank"></i> Consolidado Semanal
      </button>
      <button 
        type="button" 
        :class="['tab-btn', activeTab === 'mensual' ? 'active' : '']"
        @click="switchTab('mensual')"
      >
        <i class="ph ph-calendar-x"></i> Consolidado Mensual
      </button>
      <button 
        type="button" 
        :class="['tab-btn', activeTab === 'top-productos' ? 'active' : '']"
        @click="switchTab('top-productos')"
      >
        <i class="ph ph-crown"></i> Productos más Procesados
      </button>
    </div>

    <!-- Panel de Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">{{ alert.message }}</div>

    <!-- ============================================== -->
    <!-- TAB CONTENIDO: DIARIO                          -->
    <!-- ============================================== -->
    <div v-if="activeTab === 'diario'" class="card">
      <div class="card-header no-print" style="background-color: var(--accent-primary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="card-title">Producción Diaria por Colaborador</span>
        <!-- Filtro Fecha -->
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label class="form-label" style="color: white; margin: 0; font-size: 0.75rem;">Fecha:</label>
          <input 
            type="date" 
            v-model="diarioFecha" 
            class="form-control" 
            style="height: 26px; font-size: 0.8rem; padding: 0 0.25rem; width: 130px; background-color: white;"
            @change="fetchData"
          />
        </div>
      </div>
      
      <!-- Encabezado de Impresión -->
      <div class="only-print print-header">
        <h3>REPORTE DE PRODUCCIÓN DIARIA - {{ formatDate(diarioFecha) }}</h3>
        <p>Generado el {{ new Date().toLocaleString() }}</p>
      </div>

      <div class="table-container">
        <table v-if="!loading && diarioData.length > 0">
          <thead>
            <tr>
              <th class="no-print" style="width: 40px;"></th>
              <th @click="sortBy('nombre')" class="sortable">Colaborador <i v-if="sortKey === 'nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_piezas')" class="sortable text-right">Total Piezas <i v-if="sortKey === 'total_piezas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_peso_bruto')" class="sortable text-right">Peso Bruto (kg) <i v-if="sortKey === 'total_peso_bruto'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_recorte')" class="sortable text-right">Recorte (kg) <i v-if="sortKey === 'total_recorte'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_decomiso')" class="sortable text-right">Decomiso (kg) <i v-if="sortKey === 'total_decomiso'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th class="text-right">Peso Neto (kg)</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="c in sortedDiarioData" :key="c.colaborador_id">
              <!-- Fila Principal Colaborador -->
              <tr>
                <td class="text-center no-print">
                  <button 
                    class="btn btn-secondary icon-btn-expand"
                    @click="toggleRow(c.colaborador_id)"
                    style="width: 22px; height: 22px; padding: 0; min-height: auto;"
                  >
                    <i class="ph" :class="isRowExpanded(c.colaborador_id) ? 'ph-minus-square' : 'ph-plus-square'"></i>
                  </button>
                </td>
                <td><strong>{{ c.nombre }}</strong></td>
                <td class="text-right fw-bold">{{ c.total_piezas }}</td>
                <td class="text-right text-blue fw-bold">{{ c.total_peso_bruto.toFixed(3) }} kg</td>
                <td class="text-right text-orange">{{ c.total_recorte.toFixed(3) }} kg</td>
                <td class="text-right text-red">{{ c.total_decomiso.toFixed(3) }} kg</td>
                <td class="text-right text-green fw-bold">
                  {{ (c.total_peso_bruto - c.total_recorte - c.total_decomiso).toFixed(3) }} kg
                </td>
              </tr>
              <!-- Desglose de Productos (Fila de detalle desplegable) -->
              <tr v-if="isRowExpanded(c.colaborador_id) || isPrinting" class="expanded-row-details">
                <td class="no-print"></td>
                <td colspan="6" style="padding: 0.5rem 1rem; background-color: #f7f6f2;">
                  <div class="detail-container card" style="margin: 0; background-color: #ffffff;">
                    <div class="card-header" style="background-color: var(--accent-primary-hover); color: white; padding: 0.15rem 0.5rem; font-size: 0.72rem;">
                      Desglose de Productos Procesados - {{ c.nombre }}
                    </div>
                    <table style="width: 100%; border: none;">
                      <thead>
                        <tr style="background-color: var(--bg-primary);">
                          <th style="color: var(--text-primary); background: transparent; font-size: 0.7rem; padding: 0.15rem 0.3rem;">Código</th>
                          <th style="color: var(--text-primary); background: transparent; font-size: 0.7rem; padding: 0.15rem 0.3rem;">Producto</th>
                          <th style="color: var(--text-primary); background: transparent; font-size: 0.7rem; padding: 0.15rem 0.3rem;">Proceso</th>
                          <th class="text-right" style="color: var(--text-primary); background: transparent; font-size: 0.7rem; padding: 0.15rem 0.3rem;">Piezas</th>
                          <th class="text-right" style="color: var(--text-primary); background: transparent; font-size: 0.7rem; padding: 0.15rem 0.3rem;">Peso Bruto</th>
                          <th class="text-right" style="color: var(--text-primary); background: transparent; font-size: 0.7rem; padding: 0.15rem 0.3rem;">Recorte</th>
                          <th class="text-right" style="color: var(--text-primary); background: transparent; font-size: 0.7rem; padding: 0.15rem 0.3rem;">Decomiso</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="d in c.detalles" :key="`${d.codigo}-${d.proceso}`" style="background-color: white;">
                          <td><strong>{{ d.codigo }}</strong></td>
                          <td>{{ d.nombre }}</td>
                          <td><span class="badge badge-primary" style="font-size: 0.65rem; padding: 0.1rem 0.3rem;">{{ d.proceso }}</span></td>
                          <td class="text-right">{{ d.piezas }}</td>
                          <td class="text-right text-blue">{{ d.peso_bruto.toFixed(3) }} kg</td>
                          <td class="text-right text-orange">{{ d.recorte.toFixed(3) }} kg</td>
                          <td class="text-right text-red">{{ d.decomiso.toFixed(3) }} kg</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!-- Sin resultados -->
        <div v-else-if="!loading" class="empty-state">
          <i class="ph ph-calendar-x icon-xl"></i>
          No hay datos de producción registrados para el {{ formatDate(diarioFecha) }}.
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAB CONTENIDO: SEMANAL                         -->
    <!-- ============================================== -->
    <div v-if="activeTab === 'semanal'" class="card">
      <div class="card-header no-print" style="background-color: var(--accent-primary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="card-title">Estadísticas de Producción Semanal por Colaborador</span>
        <!-- Filtro Año -->
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label class="form-label" style="color: white; margin: 0; font-size: 0.75rem;">Año:</label>
          <select 
            v-model="semanalAnio" 
            class="form-control" 
            style="height: 26px; font-size: 0.8rem; padding: 0 0.25rem; width: 100px; background-color: white;"
            @change="fetchData"
          >
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>

      <!-- Encabezado de Impresión -->
      <div class="only-print print-header">
        <h3>REPORTE DE PRODUCCIÓN SEMANAL - AÑO {{ semanalAnio }}</h3>
        <p>Generado el {{ new Date().toLocaleString() }}</p>
      </div>

      <div class="table-container">
        <table v-if="!loading && semanalData.length > 0">
          <thead>
            <tr>
              <th @click="sortBy('semana')" class="sortable">Semana <i v-if="sortKey === 'semana'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th>Rango de Fechas</th>
              <th @click="sortBy('colaborador_nombre')" class="sortable">Colaborador <i v-if="sortKey === 'colaborador_nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_piezas')" class="sortable text-right">Total Piezas <i v-if="sortKey === 'total_piezas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_peso_bruto')" class="sortable text-right">Peso Bruto (kg) <i v-if="sortKey === 'total_peso_bruto'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_recorte')" class="sortable text-right">Recorte (kg) <i v-if="sortKey === 'total_recorte'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_decomiso')" class="sortable text-right">Decomiso (kg) <i v-if="sortKey === 'total_decomiso'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th class="text-right">Peso Neto (kg)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in sortedSemanalData" :key="`${w.semana}-${w.colaborador_id}`">
              <td><strong>Semana {{ w.semana }}</strong></td>
              <td class="text-muted" style="font-size: 0.78rem;">{{ w.rango_fechas }}</td>
              <td><strong>{{ w.colaborador_nombre || 'Sin Nombre' }}</strong></td>
              <td class="text-right fw-bold">{{ w.total_piezas }}</td>
              <td class="text-right text-blue fw-bold">{{ w.total_peso_bruto.toFixed(3) }} kg</td>
              <td class="text-right text-orange">{{ w.total_recorte.toFixed(3) }} kg</td>
              <td class="text-right text-red">{{ w.total_decomiso.toFixed(3) }} kg</td>
              <td class="text-right text-green fw-bold">
                {{ (w.total_peso_bruto - w.total_recorte - w.total_decomiso).toFixed(3) }} kg
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Sin resultados -->
        <div v-else-if="!loading" class="empty-state">
          <i class="ph ph-calendar-x icon-xl"></i>
          No hay datos de producción semanal registrados para el año {{ semanalAnio }}.
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAB CONTENIDO: MENSUAL                         -->
    <!-- ============================================== -->
    <div v-if="activeTab === 'mensual'" class="card">
      <div class="card-header no-print" style="background-color: var(--accent-primary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="card-title">Estadísticas de Producción Mensual por Colaborador</span>
        <!-- Filtro Año -->
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label class="form-label" style="color: white; margin: 0; font-size: 0.75rem;">Año:</label>
          <select 
            v-model="mensualAnio" 
            class="form-control" 
            style="height: 26px; font-size: 0.8rem; padding: 0 0.25rem; width: 100px; background-color: white;"
            @change="fetchData"
          >
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>

      <!-- Encabezado de Impresión -->
      <div class="only-print print-header">
        <h3>REPORTE DE PRODUCCIÓN MENSUAL - AÑO {{ mensualAnio }}</h3>
        <p>Generado el {{ new Date().toLocaleString() }}</p>
      </div>

      <div class="table-container">
        <table v-if="!loading && mensualData.length > 0">
          <thead>
            <tr>
              <th @click="sortBy('mes')" class="sortable">Mes <i v-if="sortKey === 'mes'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('colaborador_nombre')" class="sortable">Colaborador <i v-if="sortKey === 'colaborador_nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_piezas')" class="sortable text-right">Total Piezas <i v-if="sortKey === 'total_piezas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_peso_bruto')" class="sortable text-right">Peso Bruto (kg) <i v-if="sortKey === 'total_peso_bruto'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_recorte')" class="sortable text-right">Recorte (kg) <i v-if="sortKey === 'total_recorte'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_decomiso')" class="sortable text-right">Decomiso (kg) <i v-if="sortKey === 'total_decomiso'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th class="text-right">Peso Neto (kg)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in sortedMensualData" :key="`${m.mes}-${m.colaborador_id}`">
              <td><strong>{{ m.mes_nombre }} {{ m.anio }}</strong></td>
              <td><strong>{{ m.colaborador_nombre || 'Sin Nombre' }}</strong></td>
              <td class="text-right fw-bold">{{ m.total_piezas }}</td>
              <td class="text-right text-blue fw-bold">{{ m.total_peso_bruto.toFixed(3) }} kg</td>
              <td class="text-right text-orange">{{ m.total_recorte.toFixed(3) }} kg</td>
              <td class="text-right text-red">{{ m.total_decomiso.toFixed(3) }} kg</td>
              <td class="text-right text-green fw-bold">
                {{ (m.total_peso_bruto - m.total_recorte - m.total_decomiso).toFixed(3) }} kg
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Sin resultados -->
        <div v-else-if="!loading" class="empty-state">
          <i class="ph ph-calendar-x icon-xl"></i>
          No hay datos de producción mensual registrados para el año {{ mensualAnio }}.
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAB CONTENIDO: TOP PRODUCTOS                   -->
    <!-- ============================================== -->
    <div v-if="activeTab === 'top-productos'" class="card">
      <div class="card-header no-print" style="background-color: var(--accent-primary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="card-title">Ranking de Productos Más Procesados</span>
        
        <!-- Filtros Combinados de Mes y Año -->
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.25rem;">
            <label class="form-label" style="color: white; margin: 0; font-size: 0.75rem;">Año:</label>
            <select 
              v-model="topAnio" 
              class="form-control" 
              style="height: 26px; font-size: 0.8rem; padding: 0 0.25rem; width: 80px; background-color: white;"
              @change="fetchData"
            >
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div style="display: flex; align-items: center; gap: 0.25rem;">
            <label class="form-label" style="color: white; margin: 0; font-size: 0.75rem;">Mes:</label>
            <select 
              v-model="topMes" 
              class="form-control" 
              style="height: 26px; font-size: 0.8rem; padding: 0 0.25rem; width: 110px; background-color: white;"
              @change="fetchData"
            >
              <option :value="null">Todo el Año</option>
              <option v-for="(name, idx) in monthNames" :key="idx" :value="idx + 1">{{ name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Encabezado de Impresión -->
      <div class="only-print print-header">
        <h3>RANKING DE PRODUCTOS MÁS PROCESADOS - {{ topMes ? monthNames[topMes - 1].toUpperCase() + ' ' : '' }}{{ topAnio }}</h3>
        <p>Generado el {{ new Date().toLocaleString() }}</p>
      </div>

      <div class="table-container">
        <table v-if="!loading && topData.length > 0">
          <thead>
            <tr>
              <th style="width: 50px;" class="text-center">Puesto</th>
              <th @click="sortBy('producto_codigo')" class="sortable">Código <i v-if="sortKey === 'producto_codigo'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('producto_nombre')" class="sortable">Producto <i v-if="sortKey === 'producto_nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th v-if="!topMes" @click="sortBy('mes')" class="sortable">Mes <i v-if="sortKey === 'mes'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_piezas')" class="sortable text-right">Piezas <i v-if="sortKey === 'total_piezas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th @click="sortBy('total_peso_bruto')" class="sortable text-right">Peso Bruto <i v-if="sortKey === 'total_peso_bruto'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              <th class="no-print" style="min-width: 150px;">Distribución del Peso</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, index) in sortedTopData" :key="`${p.producto_codigo}-${p.mes}`">
              <td class="text-center">
                <span :class="['badge-rank', index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other']">
                  {{ index + 1 }}
                </span>
              </td>
              <td><strong>{{ p.producto_codigo }}</strong></td>
              <td><strong>{{ p.producto_nombre || 'Queso Desconocido' }}</strong></td>
              <td v-if="!topMes"><span class="badge badge-primary">{{ p.mes_nombre }}</span></td>
              <td class="text-right">{{ p.total_piezas }}</td>
              <td class="text-right text-blue fw-bold">{{ p.total_peso_bruto.toFixed(3) }} kg</td>
              <!-- Barra de Distribución estilo Retro -->
              <td class="no-print" style="vertical-align: middle;">
                <div class="retro-progress-container" :title="`Porcentaje de peso: ${getWeightPercentage(p.total_peso_bruto).toFixed(1)}%`">
                  <div 
                    class="retro-progress-bar" 
                    :style="{ width: `${getWeightPercentage(p.total_peso_bruto)}%` }"
                  ></div>
                  <span class="retro-progress-text">{{ getWeightPercentage(p.total_peso_bruto).toFixed(1) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Sin resultados -->
        <div v-else-if="!loading" class="empty-state">
          <i class="ph ph-package icon-xl"></i>
          No hay datos de productos procesados en el período seleccionado.
        </div>
      </div>
    </div>

    <!-- Cargando -->
    <div v-if="loading" class="loading-state card mt-4 no-print">
      <i class="ph ph-spinner spinner icon-xl"></i>
      Cargando informe de producción...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const activeTab = ref('diario')
const loading = ref(false)
const alert = ref({ show: false, message: '', type: 'success' })

// Formatos de fecha y filtros
const getTodayString = () => new Date().toISOString().split('T')[0]
const diarioFecha = ref(getTodayString())
const semanalAnio = ref(new Date().getFullYear())
const mensualAnio = ref(new Date().getFullYear())
const topAnio = ref(new Date().getFullYear())
const topMes = ref(new Date().getMonth() + 1) // Mes actual

// Disponibilidad de años para filtrar
const availableYears = [2025, 2026, 2027, 2028]
const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Datos de la API
const diarioData = ref([])
const semanalData = ref([])
const mensualData = ref([])
const topData = ref([])

// Filas expandidas del reporte diario
const expandedRows = ref([])

// Ordenamiento
const sortKey = ref('total_peso_bruto')
const sortOrder = ref(-1) // -1 es desc, 1 es asc

const toggleRow = (id) => {
  const index = expandedRows.value.indexOf(id)
  if (index > -1) {
    expandedRows.value.splice(index, 1)
  } else {
    expandedRows.value.push(id)
  }
}

const isRowExpanded = (id) => expandedRows.value.includes(id)

const switchTab = (tab) => {
  activeTab.value = tab
  expandedRows.value = []
  
  // Ajustar la clave de ordenamiento por defecto
  if (tab === 'diario') {
    sortKey.value = 'total_peso_bruto'
    sortOrder.value = -1
  } else if (tab === 'semanal') {
    sortKey.value = 'semana'
    sortOrder.value = -1
  } else if (tab === 'mensual') {
    sortKey.value = 'mes'
    sortOrder.value = -1
  } else if (tab === 'top-productos') {
    sortKey.value = 'total_peso_bruto'
    sortOrder.value = -1
  }
  
  fetchData()
}

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3000)
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value *= -1
  } else {
    sortKey.value = key
    sortOrder.value = -1 // Mayor a menor por defecto
  }
}

// Cargar datos del tab activo
const fetchData = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'diario') {
      const res = await fetch(`/api/reportes/diaria?fecha=${diarioFecha.value}`)
      if (!res.ok) throw new Error('Error al obtener datos diarios')
      diarioData.value = await res.json()
    } else if (activeTab.value === 'semanal') {
      const res = await fetch(`/api/reportes/semanal?year=${semanalAnio.value}`)
      if (!res.ok) throw new Error('Error al obtener datos semanales')
      semanalData.value = await res.json()
    } else if (activeTab.value === 'mensual') {
      const res = await fetch(`/api/reportes/mensual?year=${mensualAnio.value}`)
      if (!res.ok) throw new Error('Error al obtener datos mensuales')
      mensualData.value = await res.json()
    } else if (activeTab.value === 'top-productos') {
      let url = `/api/reportes/productos-mas-procesados?year=${topAnio.value}`
      if (topMes.value) {
        url += `&month=${topMes.value}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error al obtener ranking de productos')
      topData.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching reports:', error)
    showAlert('Error de conexión con el servidor al cargar los reportes', 'error')
  } finally {
    loading.value = false
  }
}

// Cómputos para ordenamiento en memoria
const sortedDiarioData = computed(() => {
  return [...diarioData.value].sort((a, b) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]
    if (typeof valA === 'string') {
      return valA.localeCompare(valB) * sortOrder.value
    }
    return (valA - valB) * sortOrder.value
  })
})

const sortedSemanalData = computed(() => {
  return [...semanalData.value].sort((a, b) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]
    if (sortKey.value === 'colaborador_nombre') {
      return (valA || '').localeCompare(valB || '') * sortOrder.value
    }
    return (valA - valB) * sortOrder.value
  })
})

const sortedMensualData = computed(() => {
  return [...mensualData.value].sort((a, b) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]
    if (sortKey.value === 'colaborador_nombre') {
      return (valA || '').localeCompare(valB || '') * sortOrder.value
    }
    return (valA - valB) * sortOrder.value
  })
})

const sortedTopData = computed(() => {
  return [...topData.value].sort((a, b) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]
    if (sortKey.value === 'producto_nombre' || sortKey.value === 'producto_codigo') {
      return (valA || '').localeCompare(valB || '') * sortOrder.value
    }
    return (valA - valB) * sortOrder.value
  })
})

// Porcentaje del peso bruto máximo para la barra de distribución
const maxWeight = computed(() => {
  if (topData.value.length === 0) return 1
  return Math.max(...topData.value.map(p => p.total_peso_bruto))
})

const getWeightPercentage = (weight) => {
  if (maxWeight.value === 0) return 0
  return (weight / maxWeight.value) * 100
}

// Formateadores
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

// Variable para controlar el despliegue completo en la impresión
const isPrinting = ref(false)

const printReport = () => {
  isPrinting.value = true
  setTimeout(() => {
    window.print()
    isPrinting.value = false
  }, 300)
}

// Exportar datos a CSV
const exportToCSV = () => {
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF"
  let fileName = `reporte_${activeTab.value}`

  if (activeTab.value === 'diario') {
    csvContent += "Colaborador;Total Piezas;Peso Bruto (kg);Recorte (kg);Decomiso (kg);Peso Neto (kg)\n"
    diarioData.value.forEach(row => {
      const neto = row.total_peso_bruto - row.total_recorte - row.total_decomiso
      csvContent += `"${row.nombre}";${row.total_piezas};${row.total_peso_bruto.toFixed(3)};${row.total_recorte.toFixed(3)};${row.total_decomiso.toFixed(3)};${neto.toFixed(3)}\n`
    })
    fileName += `_${diarioFecha.value}`
  } else if (activeTab.value === 'semanal') {
    csvContent += "Semana;Rango Fechas;Colaborador;Total Piezas;Peso Bruto (kg);Recorte (kg);Decomiso (kg);Peso Neto (kg)\n"
    semanalData.value.forEach(row => {
      const neto = row.total_peso_bruto - row.total_recorte - row.total_decomiso
      csvContent += `"${row.semana}";"${row.rango_fechas}";"${row.colaborador_nombre}";${row.total_piezas};${row.total_peso_bruto.toFixed(3)};${row.total_recorte.toFixed(3)};${row.total_decomiso.toFixed(3)};${neto.toFixed(3)}\n`
    })
    fileName += `_${semanalAnio.value}`
  } else if (activeTab.value === 'mensual') {
    csvContent += "Mes;Año;Colaborador;Total Piezas;Peso Bruto (kg);Recorte (kg);Decomiso (kg);Peso Neto (kg)\n"
    mensualData.value.forEach(row => {
      const neto = row.total_peso_bruto - row.total_recorte - row.total_decomiso
      csvContent += `"${row.mes_nombre}";${row.anio};"${row.colaborador_nombre}";${row.total_piezas};${row.total_peso_bruto.toFixed(3)};${row.total_recorte.toFixed(3)};${row.total_decomiso.toFixed(3)};${neto.toFixed(3)}\n`
    })
    fileName += `_${mensualAnio.value}`
  } else if (activeTab.value === 'top-productos') {
    csvContent += "Puesto;Código;Producto;Mes;Piezas;Peso Bruto (kg)\n"
    sortedTopData.value.forEach((row, idx) => {
      csvContent += `${idx + 1};"${row.producto_codigo}";"${row.producto_nombre}";"${row.mes_nombre}";${row.total_piezas};${row.total_peso_bruto.toFixed(3)}\n`
    })
    fileName += `_${topAnio.value}_${topMes.value || 'completo'}`
  }

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `${fileName}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* Pestañas (Tabs) Estilo Retro */
.tabs {
  display: flex;
  border-bottom: 2px solid var(--bevel-dark);
  margin-bottom: 1rem;
}

.tab-btn {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--bevel-dark);
  border-bottom: none;
  background: var(--bg-secondary);
  color: var(--text-muted);
  cursor: pointer;
  font-weight: bold;
  font-size: 0.8rem;
  margin-right: 2px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: var(--bg-window);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--bg-window) !important;
  color: var(--text-primary) !important;
  border-color: var(--bevel-dark) var(--bevel-dark) transparent var(--bevel-dark);
  box-shadow: 1px -1px 0 var(--bevel-light) inset;
  margin-bottom: -1px;
  padding-top: 0.45rem;
  z-index: 2;
}

th.sortable {
  cursor: pointer;
  user-select: none;
}

th.sortable:hover {
  background-color: var(--accent-primary-hover);
}

th i {
  margin-left: 0.25rem;
  font-size: 0.8rem;
  vertical-align: middle;
}

.mr-2 {
  margin-right: 0.5rem;
}

/* Detalles de fila */
.expanded-row-details td {
  border-bottom: 2px solid var(--bevel-dark);
}

.icon-btn-expand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 1px solid var(--bevel-dark);
  box-shadow: var(--raised-shadow);
  cursor: pointer;
}

.icon-btn-expand:active {
  box-shadow: var(--inset-shadow);
}

/* Estilos de Puestos */
.badge-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 50%;
  color: white;
}

.rank-1 {
  background-color: #d4af37; /* Oro */
  box-shadow: 0 0 4px rgba(212, 175, 55, 0.6);
}

.rank-2 {
  background-color: #c0c0c0; /* Plata */
}

.rank-3 {
  background-color: #cd7f32; /* Bronce */
}

.rank-other {
  background-color: var(--text-muted);
}

/* Barra de progreso retro */
.retro-progress-container {
  width: 100%;
  height: 20px;
  background: white;
  box-shadow: var(--inset-shadow);
  border: 1px solid var(--bevel-dark);
  position: relative;
  display: flex;
  align-items: center;
  padding: 1px;
}

.retro-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #0b5394 0%, #1e6ec8 100%);
}

.retro-progress-text {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.72rem;
  font-weight: bold;
  color: var(--text-primary);
  mix-blend-mode: difference;
}

/* Configuración de Impresión */
.only-print {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }
  
  .only-print {
    display: block !important;
  }
  
  .print-header {
    border-bottom: 2px solid black;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    text-align: center;
  }
  
  .card {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  
  table {
    border: 1px solid black !important;
  }
  
  th, td {
    border: 1px solid #ddd !important;
  }
  
  tr:nth-child(even) td {
    background-color: #f9f9f9 !important;
  }
}
</style>
