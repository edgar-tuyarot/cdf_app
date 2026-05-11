<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const procesos = ref([])
const isLoading = ref(true)
const errorMsg = ref('')
const currentPeriod = ref('dia')

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
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const startOfWeek = new Date(new Date().setDate(diff))
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  return date >= startOfWeek && date <= endOfWeek
}

const isInCurrentMonth = (date) => {
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

// Filtrar solo procesos del usuario logueado
const misProcesos = computed(() => {
  const username = authStore.user?.usuario
  if (!username) return []
  return procesos.value.filter(p => p.detalles?.usuario === username)
})

const filteredProcesos = computed(() => {
  let result = [...misProcesos.value]
  const now = new Date()

  if (currentPeriod.value === 'dia') {
    result = result.filter(p => isSameDay(new Date(p.fecha), now))
  } else if (currentPeriod.value === 'semana') {
    result = result.filter(p => isInCurrentWeek(new Date(p.fecha)))
  } else if (currentPeriod.value === 'mes') {
    result = result.filter(p => isInCurrentMonth(new Date(p.fecha)))
  }

  result.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  return result
})

const stats = computed(() => {
  const list = filteredProcesos.value
  const fracList = list.filter(p => p.detalles?.tipo === 'FRACCIONADO')
  const envList = list.filter(p => p.detalles?.tipo === 'ENVASADO')

  const totalKgFrac = fracList.reduce((sum, p) => sum + (Number(p.detalles?.resultado_cantidad_kilos) || Number(p.detalles?.cantidad_kilos) || 0), 0)
  const totalUdsFrac = fracList.reduce((sum, p) => sum + (Number(p.detalles?.resultado_cantidad) || 0), 0)
  const totalKgEnv = envList.reduce((sum, p) => sum + (Number(p.detalles?.resultado_cantidad_kilos) || Number(p.detalles?.cantidad_kilos) || 0), 0)
  const totalUdsEnv = envList.reduce((sum, p) => sum + (Number(p.detalles?.resultado_cantidad) || 0), 0)

  return {
    count: list.length,
    kgFrac: totalKgFrac.toFixed(2),
    udsFrac: totalUdsFrac.toFixed(0),
    kgEnv: totalKgEnv.toFixed(2),
    udsEnv: totalUdsEnv.toFixed(0)
  }
})

const weeklyBreakdown = computed(() => {
  if (currentPeriod.value !== 'semana') return []
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const breakdown = days.map(name => ({ name, fracUds: 0, fracKg: 0, envUds: 0, envKg: 0 }))

  for (const p of filteredProcesos.value) {
    if (!p.fecha) continue
    const date = new Date(p.fecha)
    const dayOfWeek = date.getDay()
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      const idx = dayOfWeek - 1
      const tipo = p.detalles?.tipo
      const kg = Number(p.detalles?.resultado_cantidad_kilos) || Number(p.detalles?.cantidad_kilos) || 0
      const uds = Number(p.detalles?.resultado_cantidad) || 0
      if (tipo === 'FRACCIONADO') { breakdown[idx].fracUds += uds; breakdown[idx].fracKg += kg }
      else if (tipo === 'ENVASADO') { breakdown[idx].envUds += uds; breakdown[idx].envKg += kg }
    }
  }
  return breakdown
})

const expandedRow = ref(null)
const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

onMounted(fetchProcesos)
</script>

<template>
  <div class="dash-colab">
    <header class="view-header">
      <div>
        <h2>Mi Dashboard</h2>
        <p>Hola, <strong>{{ authStore.user?.usuario }}</strong> — Resumen de tu actividad</p>
      </div>
      <button class="refresh-btn" @click="fetchProcesos" :disabled="isLoading">
        <span class="material-icons" :class="{ spinning: isLoading }">refresh</span>
      </button>
    </header>

    <!-- Pestañas -->
    <div class="period-tabs">
      <button
        v-for="p in ['dia', 'semana', 'mes']"
        :key="p"
        :class="['tab-btn', { active: currentPeriod === p }]"
        @click="currentPeriod = p"
      >
        {{ p === 'dia' ? 'HOY' : p.toUpperCase() }}
      </button>
    </div>

    <div v-if="errorMsg" class="error-alert">{{ errorMsg }}</div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <div class="stat-card total">
        <span class="material-icons st-icon">assignment</span>
        <div class="st-info">
          <span class="st-label">Procesos</span>
          <span class="st-value">{{ stats.count }}</span>
        </div>
      </div>
      <div class="stat-card frac">
        <span class="material-icons st-icon">content_cut</span>
        <div class="st-info">
          <span class="st-label">Fraccionado</span>
          <span class="st-value">{{ stats.udsFrac }} <small>uds</small></span>
          <span class="st-sub">{{ stats.kgFrac }} kg</span>
        </div>
      </div>
      <div class="stat-card env">
        <span class="material-icons st-icon">inventory_2</span>
        <div class="st-info">
          <span class="st-label">Envasado</span>
          <span class="st-value">{{ stats.udsEnv }} <small>uds</small></span>
          <span class="st-sub">{{ stats.kgEnv }} kg</span>
        </div>
      </div>
    </div>

    <!-- Tabla Semanal -->
    <div v-if="currentPeriod === 'semana' && weeklyBreakdown.length" class="weekly-card">
      <h4 class="section-title">Desglose Semanal</h4>
      <div class="table-scroll">
        <table class="mini-table">
          <thead>
            <tr>
              <th></th>
              <th colspan="2" class="txt-center th-group">FRACCIONADO</th>
              <th colspan="2" class="txt-center th-group">ENVASADO</th>
            </tr>
            <tr>
              <th>Día</th>
              <th class="txt-right">Uds</th>
              <th class="txt-right">Kg</th>
              <th class="txt-right">Uds</th>
              <th class="txt-right">Kg</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in weeklyBreakdown" :key="day.name">
              <td class="bold">{{ day.name }}</td>
              <td class="txt-right">{{ day.fracUds || '—' }}</td>
              <td class="txt-right color-sec">{{ day.fracKg ? day.fracKg.toFixed(1) : '—' }}</td>
              <td class="txt-right">{{ day.envUds || '—' }}</td>
              <td class="txt-right color-sec">{{ day.envKg ? day.envKg.toFixed(1) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Lista de Procesos -->
    <div class="procesos-section">
      <h4 class="section-title">Mis Procesos</h4>

      <div v-if="isLoading && procesos.length === 0" class="loading-state">
        <span class="material-icons spinning">sync</span>
        <p>Cargando...</p>
      </div>

      <div v-else-if="filteredProcesos.length === 0" class="empty-state">
        <span class="material-icons">inbox</span>
        <p>No tenés procesos registrados en este periodo.</p>
      </div>

      <div v-else class="proc-list">
        <div
          v-for="p in filteredProcesos"
          :key="p.proceso_id"
          class="proc-card"
          @click="toggleRow(p.proceso_id)"
        >
          <div class="proc-header">
            <div class="proc-left">
              <span :class="['t-badge', p.detalles?.tipo?.toLowerCase()]">
                {{ p.detalles?.tipo === 'FRACCIONADO' ? 'FRAC' : 'ENV' }}
              </span>
              <strong>{{ p.detalles?.producto_nombre }}</strong>
              <span class="proc-code">{{ p.detalles?.producto_codigo }}</span>
            </div>
            <div class="proc-right">
              <span class="proc-kg">
                {{ (Number(p.detalles?.resultado_cantidad_kilos) || Number(p.detalles?.cantidad_kilos) || 0).toFixed(2) }} kg
              </span>
              <span class="material-icons expand-arrow" :class="{ rotated: expandedRow === p.proceso_id }">expand_more</span>
            </div>
          </div>
          <Transition name="expand">
            <div v-if="expandedRow === p.proceso_id" class="proc-body">
              <div class="detail-grid">
                <div class="d-item"><span>Fecha:</span> {{ formatFecha(p.fecha) }}</div>
                <div class="d-item"><span>Piezas:</span> {{ p.detalles?.cantidad_piezas || '—' }}</div>
                <div class="d-item"><span>Resultado:</span> {{ p.detalles?.resultado_cantidad || '—' }} uds</div>
                <div class="d-item">
                  <span>Descarte:</span>
                  {{ ((Number(p.detalles?.cantidad_recorte) || 0) + (Number(p.detalles?.cantidad_decomiso) || 0)).toFixed(3) }} kg
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash-colab { padding-bottom: 50px; }

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 12px;
}
.view-header h2 { font-size: 1.6rem; color: var(--color-text); margin-bottom: 2px; }
.view-header p { color: var(--color-text-muted); font-size: 0.9rem; font-weight: 600; }

.refresh-btn {
  background: none;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.refresh-btn:hover { background-color: #F0F0F0; }

.period-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 1.5rem;
  background: #eee;
  padding: 4px;
  border-radius: 6px;
  width: 100%;
}
.tab-btn {
  flex: 1;
  padding: 10px 12px;
  border-radius: 4px;
  border: none;
  background: transparent;
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
  color: #757575;
  transition: all 0.2s;
  text-align: center;
}
.tab-btn.active {
  background: white;
  color: var(--color-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.error-alert {
  background-color: #FFEBEE;
  color: #C62828;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 2px solid #EF9A9A;
  margin-bottom: var(--space-md);
  text-align: center;
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 1.5rem;
}
.stat-card {
  background: white;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 12px;
}
.st-icon { font-size: 1.8rem; color: var(--color-text-muted); flex-shrink: 0; }
.stat-card.frac .st-icon { color: #1565C0; }
.stat-card.env .st-icon { color: #E65100; }
.stat-card.total .st-icon { color: var(--color-primary); }
.st-info { display: flex; flex-direction: column; min-width: 0; }
.st-label { font-size: 0.65rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; }
.st-value { font-size: 1.3rem; font-weight: 900; color: var(--color-text); line-height: 1.2; }
.st-value small { font-size: 0.7rem; color: var(--color-text-muted); font-weight: 600; }
.st-sub { font-size: 0.8rem; color: var(--color-secondary); font-weight: 700; }

/* Weekly Card */
.weekly-card {
  background: white;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  padding: 12px;
  margin-bottom: 1.5rem;
}
.section-title {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -4px;
  padding: 0 4px;
}
.mini-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.mini-table th {
  background: #FAFAFA;
  padding: 6px 5px;
  text-align: left;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.mini-table td {
  padding: 7px 5px;
  border-bottom: 1px solid #f5f5f5;
  white-space: nowrap;
}
.th-group { border-bottom: 1px solid #eee !important; font-size: 0.55rem !important; }
.txt-right { text-align: right !important; }
.txt-center { text-align: center !important; }
.bold { font-weight: 800; }
.color-sec { color: var(--color-secondary); }

/* Process List */
.procesos-section { margin-top: 0.5rem; }
.proc-list { display: flex; flex-direction: column; gap: 10px; }
.proc-card {
  background: white;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  padding: 12px 14px;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}
.proc-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.proc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.proc-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
  flex: 1;
}
.proc-left strong {
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.proc-code { font-family: monospace; font-size: 0.7rem; color: #999; }
.proc-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.proc-kg { font-weight: 900; font-size: 0.9rem; white-space: nowrap; }
.expand-arrow { transition: transform 0.2s; color: #bbb; font-size: 1.2rem; }
.expand-arrow.rotated { transform: rotate(180deg); }

.proc-body { margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.d-item { font-size: 0.8rem; font-weight: 600; word-break: break-word; }
.d-item span { color: #999; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; margin-right: 4px; }

.t-badge { padding: 2px 6px; border-radius: 4px; font-size: 0.6rem; font-weight: 800; flex-shrink: 0; }
.t-badge.fraccionado { background: #E3F2FD; color: #1565C0; }
.t-badge.envasado { background: #FFF3E0; color: #E65100; }

.loading-state, .empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
}
.loading-state .material-icons, .empty-state .material-icons { font-size: 2.5rem; margin-bottom: 8px; }
.empty-state p { font-size: 0.9rem; }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.expand-enter-active, .expand-leave-active { transition: all 0.3s ease-out; max-height: 200px; overflow: hidden; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; }

/* ── Tablet and up ── */
@media (min-width: 600px) {
  .period-tabs { width: fit-content; gap: 8px; }
  .tab-btn { flex: none; padding: 8px 28px; }

  .stats-row { grid-template-columns: repeat(3, 1fr); }

  .weekly-card { padding: 16px; }
  .mini-table { font-size: 0.85rem; }
  .mini-table th { padding: 8px; font-size: 0.7rem; }
  .mini-table td { padding: 8px; }

  .proc-card { padding: 14px 16px; }
  .proc-left strong { font-size: 0.9rem; }
  .proc-kg { font-size: 1rem; }
}

/* ── Desktop ── */
@media (min-width: 1024px) {
  .view-header h2 { font-size: 1.8rem; }
  .stat-card { padding: 16px 20px; }
  .st-icon { font-size: 2rem; }
  .st-value { font-size: 1.5rem; }
}
</style>
