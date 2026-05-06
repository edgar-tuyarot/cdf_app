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
const currentPeriod = ref('dia') // dia, semana, mes, operador, todos
const selectedColaborador = ref('')
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
  return d.toLocaleString('es-AR', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  })
}

const isSameDay = (d1, d2) => 
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate()

const isInCurrentWeek = (date) => {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Lunes
  const startOfWeek = new Date(new Date().setDate(diff))
  startOfWeek.setHours(0,0,0,0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6) // Domingo (o +4 para Viernes)
  endOfWeek.setHours(23,59,59,999)
  return date >= startOfWeek && date <= endOfWeek
}

const isInCurrentMonth = (date) => {
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

const filteredProcesos = computed(() => {
  let result = [...procesos.value]
  const now = new Date()

  // Filtro Temporal
  if (currentPeriod.value === 'dia') {
    result = result.filter(p => isSameDay(new Date(p.fecha), now))
  } else if (currentPeriod.value === 'semana') {
    result = result.filter(p => isInCurrentWeek(new Date(p.fecha)))
  } else if (currentPeriod.value === 'mes') {
    result = result.filter(p => isInCurrentMonth(new Date(p.fecha)))
  } else if (currentPeriod.value === 'operador') {
    result = result.filter(p => isInCurrentMonth(new Date(p.fecha)))
    if (selectedColaborador.value) {
      result = result.filter(p => p.detalles?.usuario === selectedColaborador.value)
    }
  }

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
    } else if (sortKey.value === 'usuario') {
      valA = (a.detalles?.usuario || '').toLowerCase()
      valB = (b.detalles?.usuario || '').toLowerCase()
    }

    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })

  return result
})

// Métricas del periodo filtrado
const stats = computed(() => {
  const list = filteredProcesos.value
  const users = new Set(list.map(p => p.detalles?.usuario).filter(Boolean))
  
  const fracList = list.filter(p => p.detalles?.tipo === 'FRACCIONADO')
  const envList = list.filter(p => p.detalles?.tipo === 'ENVASADO')

  const totalKgFrac = fracList.reduce((sum, p) => sum + (Number(p.detalles?.resultado_cantidad_kilos) || Number(p.detalles?.cantidad_kilos) || 0), 0)
  const totalUdsFrac = fracList.reduce((sum, p) => sum + (Number(p.detalles?.resultado_cantidad) || 0), 0)
    
  const totalKgEnv = envList.reduce((sum, p) => sum + (Number(p.detalles?.resultado_cantidad_kilos) || Number(p.detalles?.cantidad_kilos) || 0), 0)
  const totalUdsEnv = envList.reduce((sum, p) => sum + (Number(p.detalles?.resultado_cantidad) || 0), 0)

  return {
    count: list.length,
    users: users.size,
    kgFrac: totalKgFrac.toFixed(2),
    udsFrac: totalUdsFrac.toFixed(0),
    kgEnv: totalKgEnv.toFixed(2),
    udsEnv: totalUdsEnv.toFixed(0)
  }
})

// Desglose semanal (Lunes a Sábado)
const weeklyBreakdown = computed(() => {
  if (!['semana', 'operador'].includes(currentPeriod.value)) return []
  
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const breakdown = days.map(name => ({ name, fracUds: 0, fracKg: 0, envUds: 0, envKg: 0 }))
  
  for (const p of filteredProcesos.value) {
    if (!p.fecha) continue
    const date = new Date(p.fecha)
    const dayOfWeek = date.getDay()
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      const idx = dayOfWeek - 1 // 1 (Mon) -> 0
      const tipo = p.detalles?.tipo
      const kg = Number(p.detalles?.resultado_cantidad_kilos) || Number(p.detalles?.cantidad_kilos) || 0
      const uds = Number(p.detalles?.resultado_cantidad) || 0
      
      if (tipo === 'FRACCIONADO') {
        breakdown[idx].fracUds += uds
        breakdown[idx].fracKg += kg
      } else if (tipo === 'ENVASADO') {
        breakdown[idx].envUds += uds
        breakdown[idx].envKg += kg
      }
    }
  }
  
  return breakdown
})

// Desglose mensual (Día por día)
const monthlyBreakdown = computed(() => {
  if (!['mes', 'operador'].includes(currentPeriod.value)) return []
  
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  
  const breakdown = []
  for (let i = 1; i <= lastDay; i++) {
    breakdown.push({
      day: i,
      label: `${i.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}`,
      fracUds: 0,
      fracKg: 0,
      envUds: 0,
      envKg: 0
    })
  }
  
  for (const p of filteredProcesos.value) {
    if (!p.fecha) continue
    const date = new Date(p.fecha)
    const day = date.getDate()
    const tipo = p.detalles?.tipo
    const kg = Number(p.detalles?.resultado_cantidad_kilos) || Number(p.detalles?.cantidad_kilos) || 0
    const uds = Number(p.detalles?.resultado_cantidad) || 0
    
    if (day >= 1 && day <= lastDay) {
      const idx = day - 1
      if (tipo === 'FRACCIONADO') {
        breakdown[idx].fracUds += uds
        breakdown[idx].fracKg += kg
      } else if (tipo === 'ENVASADO') {
        breakdown[idx].envUds += uds
        breakdown[idx].envKg += kg
      }
    }
  }
  return breakdown
})

const listaColaboradores = computed(() => {
  const users = procesos.value.map(p => p.detalles?.usuario).filter(Boolean)
  return [...new Set(users)].sort()
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

onMounted(fetchProcesos)
</script>

<template>
  <div class="procesos-view">
    <header class="view-header">
      <div>
        <h2>Reportes de Producción</h2>
        <p>Monitoreo discriminado de procesos y operarios</p>
      </div>
      <button class="refresh-btn" @click="fetchProcesos" :disabled="isLoading">
        <span class="material-icons" :class="{ 'spinning': isLoading }">refresh</span>
      </button>
    </header>

    <!-- Pestañas de Periodo -->
    <div class="period-tabs">
      <button 
        v-for="p in ['dia', 'semana', 'mes', 'operador', 'todos']" 
        :key="p"
        :class="['tab-btn', { active: currentPeriod === p }]"
        @click="currentPeriod = p"
      >
        {{ p === 'operador' ? 'POR COLABORADOR' : (p === 'todos' ? 'HISTORIAL' : p.toUpperCase()) }}
      </button>
    </div>

    <!-- Selector de Colaborador (Solo en modo operador) -->
    <div v-if="currentPeriod === 'operador'" class="operador-filter-bar">
      <label>Seleccionar Colaborador:</label>
      <select v-model="selectedColaborador" class="colab-select">
        <option value="">— Todos los colaboradores —</option>
        <option v-for="user in listaColaboradores" :key="user" :value="user">{{ user }}</option>
      </select>
    </div>

    <!-- Barra de Búsqueda Global -->
    <div v-if="['dia', 'todos', 'operador'].includes(currentPeriod)" class="filters-container search-only">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input type="text" v-model="searchQuery" placeholder="Buscar por producto, código u operario...">
      </div>
      <div v-if="['dia', 'todos'].includes(currentPeriod)" class="type-filters">
        <button 
          v-for="t in ['todos', 'FRACCIONADO', 'ENVASADO']" 
          :key="t"
          :class="['filter-btn', { active: filterTipo === t }]"
          @click="filterTipo = t"
        >
          {{ t === 'todos' ? 'Todos' : (t === 'FRACCIONADO' ? 'Fraccionado' : 'Envasado') }}
        </button>
      </div>
    </div>

    <!-- Contenedor Superior (Dashboard) -->
    <div v-if="currentPeriod !== 'todos'" class="dashboard-top" :class="{ 'side-by-side': ['semana', 'mes', 'operador'].includes(currentPeriod) }">
      
      <!-- Tabla Resumen Semanal -->
      <div v-if="['semana', 'operador'].includes(currentPeriod)" class="weekly-summary-wrapper">
        <h4 class="weekly-title">Producción Semanal</h4>
        <table class="report-table weekly-table">
          <thead>
            <tr class="th-group-row">
              <th rowspan="2" class="txt-left border-b" style="width: 80px"></th>
              <th colspan="2" class="txt-center th-group">FRACCIONADO</th>
              <th colspan="2" class="txt-center th-group">ENVASADO</th>
            </tr>
            <tr class="sub-th-row">
              <th class="txt-right sub-th">Uds</th>
              <th class="txt-right sub-th">Kg</th>
              <th class="txt-right sub-th">Uds</th>
              <th class="txt-right sub-th">Kg</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in weeklyBreakdown" :key="day.name">
              <td class="bold txt-left" style="font-size: 0.75rem">{{ day.name }}</td>
              <td class="txt-right">{{ day.fracUds || '—' }}</td>
              <td class="txt-right color-sec">{{ day.fracKg ? day.fracKg.toFixed(1) : '—' }}</td>
              <td class="txt-right">{{ day.envUds || '—' }}</td>
              <td class="txt-right color-sec">{{ day.envKg ? day.envKg.toFixed(1) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabla Resumen Mensual (Agregada) -->
      <div v-if="currentPeriod === 'mes'" class="weekly-summary-wrapper monthly-scroll">
        <h4 class="weekly-title">Resumen Diario del Mes</h4>
        <table class="report-table weekly-table">
          <thead>
            <tr class="th-group-row">
              <th rowspan="2" class="txt-left border-b" style="width: 60px">FECHA</th>
              <th colspan="2" class="txt-center th-group">FRACCIONADO</th>
              <th colspan="2" class="txt-center th-group">ENVASADO</th>
            </tr>
            <tr class="sub-th-row">
              <th class="txt-right sub-th">Uds</th>
              <th class="txt-right sub-th">Kg</th>
              <th class="txt-right sub-th">Uds</th>
              <th class="txt-right sub-th">Kg</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in monthlyBreakdown" :key="day.day">
              <td class="bold txt-left" style="font-size: 0.7rem">{{ day.label }}</td>
              <td class="txt-right">{{ day.fracUds || '—' }}</td>
              <td class="txt-right color-sec">{{ day.fracKg ? day.fracKg.toFixed(1) : '—' }}</td>
              <td class="txt-right">{{ day.envUds || '—' }}</td>
              <td class="txt-right color-sec">{{ day.envKg ? day.envKg.toFixed(1) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Stats del Periodo (Lado Derecho si es semana, o Grid arriba si no) -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="st-label">Procesos</span>
          <span class="st-value">{{ stats.count }}</span>
        </div>
        <div class="stat-card frac">
          <span class="st-label">Fraccionado</span>
          <div class="st-multi-val">
            <span class="st-value">{{ stats.udsFrac }} <small>uds</small></span>
            <span class="st-sub">{{ stats.kgFrac }} kg</span>
          </div>
        </div>
        <div class="stat-card env">
          <span class="st-label">Envasado</span>
          <div class="st-multi-val">
            <span class="st-value">{{ stats.udsEnv }} <small>uds</small></span>
            <span class="st-sub">{{ stats.kgEnv }} kg</span>
          </div>
        </div>
        <div class="stat-card users">
          <span class="st-label">Operarios</span>
          <span class="st-value">{{ stats.users }}</span>
        </div>
      </div>
    </div>

    <!-- Tabla Detallada (Solo en Historial y Día) -->
    <div v-if="['dia', 'todos'].includes(currentPeriod)" class="detailed-table-section">
      <div v-if="isLoading && procesos.length === 0" class="loading-state">
        <span class="material-icons spinning">sync</span>
        <p>Cargando información...</p>
      </div>

      <div v-else-if="filteredProcesos.length === 0" class="empty-state">
        <span class="material-icons">inbox</span>
        <p>No se encontraron registros.</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="report-table">
          <thead>
            <tr>
              <th @click="sortBy('fecha')">FECHA</th>
              <th>OPERARIO</th>
              <th>TIPO</th>
              <th @click="sortBy('codigo')">CÓDIGO</th>
              <th>PRODUCTO</th>
              <th class="txt-right">PIEZAS</th>
              <th class="txt-right">RESULTADO</th>
              <th class="txt-right">KILOS</th>
              <th class="txt-right">DESCARTE</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProcesos" :key="p.proceso_id">
              <td class="f-date">{{ formatFecha(p.fecha) }}</td>
              <td class="f-user">{{ p.detalles?.usuario }}</td>
              <td>
                <span :class="['t-badge', p.detalles?.tipo?.toLowerCase()]">
                  {{ p.detalles?.tipo === 'FRACCIONADO' ? 'FRAC' : 'ENV' }}
                </span>
              </td>
              <td class="f-code">{{ p.detalles?.producto_codigo }}</td>
              <td class="f-name">{{ p.detalles?.producto_nombre }}</td>
              <td class="txt-right">{{ p.detalles?.cantidad_piezas || '—' }}</td>
              <td class="txt-right bold">{{ p.detalles?.resultado_cantidad || '—' }}</td>
              <td class="txt-right bold color-sec">
                {{ (Number(p.detalles?.resultado_cantidad_kilos) || Number(p.detalles?.cantidad_kilos) || 0).toFixed(3) }}
              </td>
              <td class="txt-right color-err">
                {{ ((Number(p.detalles?.cantidad_recorte) || 0) + (Number(p.detalles?.cantidad_decomiso) || 0)).toFixed(3) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="['dia', 'todos'].includes(currentPeriod)" class="mobile-only-cards">
      <div v-for="p in filteredProcesos" :key="'m'+p.proceso_id" class="m-card" @click="toggleRow(p.proceso_id)">
        <div class="m-card-header">
          <div class="m-left">
             <span :class="['t-badge', p.detalles?.tipo?.toLowerCase()]">{{ p.detalles?.tipo === 'FRACCIONADO' ? 'FRAC' : 'ENV' }}</span>
             <strong>{{ p.detalles?.producto_nombre }}</strong>
          </div>
          <div class="m-right">
            <span class="m-kilos">{{ (Number(p.detalles?.resultado_cantidad_kilos) || Number(p.detalles?.cantidad_kilos) || 0).toFixed(2) }} kg</span>
            <span class="material-icons" :class="{ 'rotated': expandedRow === p.proceso_id }">expand_more</span>
          </div>
        </div>
        <Transition name="expand">
          <div v-if="expandedRow === p.proceso_id" class="m-card-body">
            <div class="m-grid">
              <div class="m-item"><span>Operario:</span> {{ p.detalles?.usuario }}</div>
              <div class="m-item"><span>Fecha:</span> {{ formatFecha(p.fecha) }}</div>
              <div class="m-item"><span>Piezas:</span> {{ p.detalles?.cantidad_piezas }}</div>
              <div class="m-item"><span>Resultado:</span> {{ p.detalles?.resultado_cantidad }} uds</div>
              <div class="m-item"><span>Descarte:</span> {{ ((Number(p.detalles?.cantidad_recorte) || 0) + (Number(p.detalles?.cantidad_decomiso) || 0)).toFixed(3) }} kg</div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.procesos-view { padding-bottom: 50px; }
.view-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.view-header h2 { font-size: 1.8rem; color: var(--color-text); margin-bottom: 2px; }
.view-header p { color: var(--color-text-muted); font-size: 0.9rem; font-weight: 600; }

.period-tabs { display: flex; gap: 8px; margin-bottom: 1.5rem; background: #eee; padding: 4px; border-radius: 6px; align-self: flex-start; width: fit-content; }
.tab-btn { padding: 8px 24px; border-radius: 4px; border: none; background: transparent; font-weight: 800; font-size: 0.8rem; cursor: pointer; color: #757575; transition: all 0.2s; }
.tab-btn.active { background: white; color: var(--color-primary); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.dashboard-top { display: flex; flex-direction: column; gap: 20px; margin-bottom: 2rem; }
.dashboard-top.side-by-side { flex-direction: row; align-items: flex-start; }

.operador-filter-bar { background: #fff; padding: 16px; border-radius: 6px; border: 1px solid var(--color-border); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 15px; }
.operador-filter-bar label { font-size: 0.85rem; font-weight: 800; color: var(--color-text); text-transform: uppercase; }
.colab-select { flex: 1; max-width: 400px; padding: 10px 16px; border-radius: 6px; border: 1px solid var(--color-border); background: #fdfdfd; font-weight: 700; font-size: 1rem; color: var(--color-text); outline: none; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 12px center; background-size: 16px; transition: all 0.2s; }
.colab-select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1); }
.colab-select:hover { background-color: #fff; border-color: #ccc; }

.monthly-scroll { max-height: 400px; overflow-y: auto; }
.monthly-scroll::-webkit-scrollbar { width: 4px; }
.monthly-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; flex: 1; }
.side-by-side .stats-grid { grid-template-columns: 1fr; max-width: 250px; }

.stat-card { background: white; padding: 12px 16px; border-radius: 6px; border: 1px solid var(--color-border); display: flex; flex-direction: column; height: fit-content; }
.st-label { font-size: 0.65rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 4px; }
.st-multi-val { display: flex; align-items: baseline; gap: 6px; }
.st-value { font-size: 1.4rem; font-weight: 900; color: var(--color-text); line-height: 1; }
.st-value small { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600; }
.st-sub { font-size: 0.85rem; color: var(--color-secondary); font-weight: 700; }

.filters-container { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 1.5rem; flex-wrap: wrap; }
.filters-container.search-only { margin-top: -0.5rem; margin-bottom: 2rem; }
.search-box { flex: 1; min-width: 300px; position: relative; display: flex; align-items: center; background: white; border: 1px solid var(--color-border); border-radius: 6px; padding: 0 12px; height: 40px; }
.search-box .material-icons { color: #bdbdbd; margin-right: 8px; font-size: 1.1rem; }
.search-box input { border: none; outline: none; width: 100%; font-size: 0.9rem; font-weight: 600; }
.type-filters { display: flex; gap: 8px; }
.filter-btn { padding: 6px 16px; border-radius: 4px; border: 1px solid var(--color-border); background: white; font-weight: 700; font-size: 0.85rem; cursor: pointer; color: var(--color-text-muted); }
.filter-btn.active { background: var(--color-text); color: white; border-color: var(--color-text); }

.weekly-summary-wrapper { background: white; border-radius: 6px; border: 1px solid var(--color-border); padding: 12px; flex: 2; min-width: 0; }
.weekly-title { font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
.weekly-table { margin-bottom: 0; width: 100%; table-layout: fixed; border: 1px solid #f9f9f9; }
.weekly-table thead th { border-bottom: none !important; }
.th-group { border-bottom: 1px solid #eee !important; color: var(--color-text-muted) !important; font-size: 0.6rem !important; padding: 8px 4px !important; }
.sub-th { font-size: 0.6rem !important; background: #fafafa !important; color: #999 !important; border-bottom: 1px solid #eee !important; padding: 6px 4px !important; }
.weekly-table td { padding: 8px 6px !important; font-size: 0.8rem; }
.border-b { border-bottom: 1px solid #eee !important; }

.table-wrapper { background: white; border-radius: 6px; border: 1px solid var(--color-border); overflow-x: auto; display: block; }
.report-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.report-table th { background: #FAFAFA; padding: 12px; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); cursor: pointer; }
.report-table td { padding: 12px; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
.f-date { color: #757575; font-size: 0.8rem; }
.f-user { font-weight: 700; color: var(--color-text); }
.f-code { font-family: monospace; font-weight: 800; color: #333; }
.f-name { color: #555; font-weight: 600; }
.txt-right { text-align: right !important; }
.txt-left { text-align: left !important; }
.txt-center { text-align: center !important; }
.bold { font-weight: 800; }
.color-sec { color: var(--color-secondary); }
.color-err { color: #D32F2F; }

.t-badge { padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 800; }
.t-badge.fraccionado { background: #E3F2FD; color: #1565C0; }
.t-badge.envasado { background: #FFF3E0; color: #E65100; }

.mobile-only-cards { display: none; flex-direction: column; gap: 12px; }
@media (max-width: 1024px) {
  .table-wrapper { display: none; }
  .mobile-only-cards { display: flex; }
}

.m-card { background: white; border-radius: 6px; border: 1px solid var(--color-border); padding: 16px; }
.m-card-header { display: flex; justify-content: space-between; align-items: center; }
.m-left { display: flex; flex-direction: column; gap: 4px; }
.m-right { display: flex; align-items: center; gap: 10px; }
.m-kilos { font-weight: 900; font-size: 1.1rem; }
.m-card-body { margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; }
.m-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.m-item { font-size: 0.8rem; font-weight: 600; }
.m-item span { color: #999; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; margin-right: 4px; }

.rotated { transform: rotate(180deg); transition: transform 0.2s; }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from {transform:rotate(0deg);} to {transform:rotate(360deg);} }
</style>

