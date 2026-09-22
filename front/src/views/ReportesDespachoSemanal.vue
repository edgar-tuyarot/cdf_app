<template>
  <div class="page-container animate-fade">
    <!-- Header de la Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-truck-trailer text-blue"></i> Reporte de Despacho Semanal
        </h2>
        <p class="page-description">
          Consulta los despachos semanales de Lunes a Sábado por producto y volumen entregado a sucursales.
        </p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-secondary" @click="exportToExcel" :disabled="loading || !enviadosFiltered.length">
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

    <!-- Control de Navegación por Semanas (Lunes a Sábado) -->
    <div class="card mb-4" style="padding: 0.85rem 1rem; background: var(--bg-window); border: 1px solid var(--bevel-light);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        
        <!-- Botonera Rápida de Semanas -->
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-secondary" @click="changeWeek(-1)" :disabled="loading">
            <i class="ph ph-caret-left"></i> Semana Anterior
          </button>
          <button class="btn btn-secondary" @click="setTodayWeek" :disabled="loading">
            <i class="ph ph-calendar"></i> Semana Actual
          </button>
          <button class="btn btn-secondary" @click="changeWeek(1)" :disabled="loading">
            Semana Siguiente <i class="ph ph-caret-right"></i>
          </button>
        </div>

        <!-- Selector de Fecha Base (Lunes) y Rango -->
        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <div class="form-group" style="margin-bottom: 0; display: flex; align-items: center; gap: 0.5rem;">
            <label class="form-label" style="margin-bottom: 0; white-space: nowrap;">Seleccionar Fecha:</label>
            <input type="date" v-model="selectedDateInput" @change="onDatePickerChange" class="form-control" style="width: 155px; height: 32px;" />
          </div>
          <div style="background: var(--bg-secondary); padding: 0.3rem 0.8rem; border-radius: 4px; border: 1px solid var(--bevel-dark); font-size: 0.85rem; font-weight: 700; color: var(--accent-primary);">
            <i class="ph ph-calendar-check" style="margin-right: 0.3rem;"></i>
            {{ dateRangeLabel }}
          </div>
        </div>

      </div>

      <!-- Buscador -->
      <div style="margin-top: 0.85rem; border-top: 1px solid var(--bevel-light); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; max-width: 450px;">
          <i class="ph ph-magnifying-glass" style="color: var(--text-secondary);"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar por código o descripción de producto..." 
            class="form-control" 
            style="height: 30px; font-size: 0.82rem;"
          />
          <button v-if="searchQuery" class="btn-icon" @click="searchQuery = ''" title="Limpiar filtro">
            <i class="ph ph-x-circle"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Indicadores de Despacho Semanal -->
    <div class="mb-4" style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center; padding: 0.75rem 1rem; background: var(--bg-window); border: 1px solid var(--bevel-light); border-radius: 4px; font-size: 0.9rem;">
      <span><strong>Total Kilos Enviados:</strong> {{ totalEnviadoFiltrado.toFixed(2) }} kg</span>
      <span><strong>Piezas / Unidades Enviadas:</strong> {{ totalPiezasEnviadas }} u.</span>
      <span><strong>Variedad de Productos:</strong> {{ enviadosFiltered.length }} SKUs</span>
    </div>

    <!-- TABLA DE PRODUCTOS ENVIADOS EN LA SEMANA -->
    <div class="card" style="margin-bottom: 0;">
      <div class="card-header" style="background-color: #1e6ec8; color: white; padding: 0.65rem 1rem; display: flex; justify-content: space-between; align-items: center;">
        <span class="card-title" style="color: white; font-weight: bold; margin: 0; font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
          <i class="ph ph-truck-trailer" style="font-size: 1.2rem;"></i>
          Productos Enviados en la Semana ({{ enviadosFiltered.length }})
        </span>
        <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 3px; font-weight: bold;">
          Lunes a Sábado
        </span>
      </div>

      <div class="table-container" style="max-height: calc(100vh - 330px); overflow-y: auto;">
        <table class="access-table" style="width: 100%; font-size: 0.85rem;">
          <thead>
            <tr style="background: var(--bg-window);">
              <th style="width: 100px;">Código SKU</th>
              <th>Descripción del Producto</th>
              <th class="text-center" style="width: 130px;">Piezas / Fracc.</th>
              <th class="text-center" style="width: 120px;">Cant. Pedidos</th>
              <th class="text-right" style="width: 140px;">Stock CDF (kg)</th>
              <th class="text-right" style="width: 150px; color: #1e6ec8;">Total Kilos (kg)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in enviadosFiltered" :key="'env-' + item.codigo">
              <td class="font-mono fw-bold" style="color: var(--accent-primary);">{{ item.codigo }}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                  <span class="fw-bold" style="color: var(--text-primary);">{{ item.nombre }}</span>
                  <span v-if="item.es_madre" class="badge-tag-madre" :title="'Producto Madre (se transforma en ' + item.codigo_fraccionado + ')'">
                    <i class="ph ph-crown"></i> Madre (↳ {{ item.codigo_fraccionado }})
                  </span>
                  <span v-else-if="item.es_derivado" class="badge-tag-derivado" :title="'Producto Fraccionado derivado de ' + item.codigo_madre">
                    <i class="ph ph-arrow-elbow-down-right"></i> Derivado de {{ item.codigo_madre }}
                  </span>
                </div>
              </td>
              <td class="text-center font-mono fw-bold">{{ item.piezas || Math.round(item.fracciones) }} u.</td>
              <td class="text-center font-mono">{{ item.total_pedidos }} pedido(s)</td>
              <td class="text-right font-mono" :style="{ color: item.stock_actual <= 0 ? 'red' : 'inherit' }">
                {{ Number(item.stock_actual || 0).toFixed(2) }} kg
              </td>
              <td class="text-right font-mono fw-bold text-blue" style="font-size: 0.95rem;">
                {{ item.peso_total.toFixed(2) }} kg
              </td>
            </tr>

            <tr v-if="loading">
              <td colspan="6" class="text-center p-4">
                <i class="ph ph-spinner spinner icon-xl"></i><br>
                <span style="font-size: 0.85rem; color: var(--text-secondary);">Cargando reporte de envíos...</span>
              </td>
            </tr>

            <tr v-if="!loading && enviadosFiltered.length === 0">
              <td colspan="6" class="text-center p-4 text-muted">
                <i class="ph ph-truck icon-xl mb-2" style="font-size: 2.2rem; opacity: 0.4;"></i><br>
                <span>No se registraron envíos en el rango de fechas seleccionado.</span>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="enviadosFiltered.length > 0">
            <tr style="background: var(--bg-secondary); font-weight: bold; font-size: 0.9rem;">
              <td colspan="2" class="text-right">TOTAL GENERAL ENVIADO:</td>
              <td class="text-center font-mono">{{ totalPiezasEnviadas }} u.</td>
              <td class="text-center font-mono">-</td>
              <td class="text-right font-mono">-</td>
              <td class="text-right font-mono text-blue fw-bold" style="font-size: 1rem;">
                {{ totalEnviadoFiltrado.toFixed(2) }} kg
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
const enviados = ref([])
const searchQuery = ref('')

const startDate = ref('')
const endDate = ref('')
const selectedDateInput = ref('')

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

// Calcular rango Lunes a Sábado a partir de una fecha dada
const calculateMondayToSaturdayRange = (baseDate) => {
  const d = new Date(baseDate)
  const day = d.getDay() // 0: Sun, 1: Mon, ..., 6: Sat
  const distToMon = day === 0 ? -6 : 1 - day
  
  const monday = new Date(d)
  monday.setDate(d.getDate() + distToMon)

  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)

  return {
    start: formatDateObj(monday),
    end: formatDateObj(saturday)
  }
}

// Inicializar rango de semana actual
const setTodayWeek = () => {
  const today = new Date()
  selectedDateInput.value = formatDateObj(today)
  const range = calculateMondayToSaturdayRange(today)
  startDate.value = range.start
  endDate.value = range.end
  fetchData()
}

// Al cambiar la fecha en el date picker
const onDatePickerChange = () => {
  if (!selectedDateInput.value) return
  const parts = selectedDateInput.value.split('-')
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  const range = calculateMondayToSaturdayRange(d)
  startDate.value = range.start
  endDate.value = range.end
  fetchData()
}

// Avanzar o retroceder semanas (weeksDelta: -1 o 1)
const changeWeek = (weeksDelta) => {
  const parts = startDate.value.split('-')
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  d.setDate(d.getDate() + (weeksDelta * 7))
  
  selectedDateInput.value = formatDateObj(d)
  const range = calculateMondayToSaturdayRange(d)
  startDate.value = range.start
  endDate.value = range.end
  fetchData()
}

const dateRangeLabel = computed(() => {
  if (!startDate.value || !endDate.value) return ''
  return `Lunes ${formatLatAmDate(startDate.value)} - Sábado ${formatLatAmDate(endDate.value)}`
})

// Cargar datos del servidor
const fetchData = async () => {
  if (!startDate.value || !endDate.value) return
  loading.value = true
  try {
    const url = `/api/reportes/semanal?startDate=${startDate.value}&endDate=${endDate.value}`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      enviados.value = data.enviados || []
    } else {
      showAlert('Error al obtener reporte semanal de envíos', 'error')
    }
  } catch (error) {
    console.error('Error fetching reporte semanal de envíos:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

// Cálculos de productos filtrados
const enviadosFiltered = computed(() => {
  if (!searchQuery.value.trim()) return enviados.value
  const q = searchQuery.value.toLowerCase().trim()
  return enviados.value.filter(item => 
    item.codigo.toLowerCase().includes(q) || 
    (item.nombre && item.nombre.toLowerCase().includes(q))
  )
})

const totalEnviadoFiltrado = computed(() => {
  return enviadosFiltered.value.reduce((acc, curr) => acc + (curr.peso_total || 0), 0)
})

const totalPiezasEnviadas = computed(() => {
  return enviadosFiltered.value.reduce((acc, curr) => acc + (curr.piezas || Math.round(curr.fracciones || 0)), 0)
})

// Exportar a Excel
const exportToExcel = () => {
  try {
    const wb = XLSX.utils.book_new()

    const dataEnv = enviadosFiltered.value.map(item => ({
      'Código SKU': item.codigo,
      'Descripción del Producto': item.nombre,
      'Rol': item.es_madre ? 'Madre' : (item.es_derivado ? 'Derivado' : 'Estándar'),
      'Cód. Vinculado': item.es_madre ? item.codigo_fraccionado : (item.es_derivado ? item.codigo_madre : '—'),
      'Piezas / Unidades': item.piezas || Math.round(item.fracciones || 0),
      'Cantidad de Pedidos': item.total_pedidos,
      'Stock CDF (kg)': Number(item.stock_actual || 0).toFixed(2),
      'Total Kilos Enviados Semana (kg)': item.peso_total.toFixed(2),
      'Total Consolidado Familia Semana (kg)': item.despacho_consolidado_kg ? item.despacho_consolidado_kg.toFixed(2) : item.peso_total.toFixed(2)
    }))
    const wsEnv = XLSX.utils.json_to_sheet(dataEnv)
    XLSX.utils.book_append_sheet(wb, wsEnv, 'Envíos Semanales')

    const filename = `Reporte_Despacho_Semanal_${startDate.value}_al_${endDate.value}.xlsx`
    XLSX.writeFile(wb, filename)
    showAlert('Planilla Excel de Despacho Semanal descargada con éxito', 'success')
  } catch (error) {
    console.error('Error al exportar Excel:', error)
    showAlert('Error al generar planilla Excel', 'error')
  }
}

onMounted(() => {
  setTodayWeek()
})
</script>

<style scoped>
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
</style>
