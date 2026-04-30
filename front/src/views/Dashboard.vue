<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.rol?.toLowerCase() === 'admin')
const isLoading = ref(false)

// ─── ESTADO OPERARIO ─────────────────────────────────────────────
const historial = ref([])
const expandedRows = ref(new Set())

const toggleRow = (id) => {
  if (expandedRows.value.has(id)) expandedRows.value.delete(id)
  else expandedRows.value.add(id)
}

const totalBolsitas = computed(() =>
  historial.value.reduce((sum, item) => sum + (Number(item.cantidad_bolsitas) || 0), 0)
)

const produccionPorProceso = computed(() => {
  const counts = { Feteado: 0, Envasado: 0 }
  historial.value.forEach(item => {
    if (counts[item.tipo_proceso] !== undefined) {
      counts[item.tipo_proceso] += Number(item.cantidad_bolsitas) || 0
    }
  })
  return counts
})

// ─── ESTADO ADMIN ────────────────────────────────────────────────
const produccionDia    = ref({ feteados: [], envasados: [] })
const produccionOperador = ref([])
const mermasStock      = ref({ decomiso: [], picadas: [] })
const produccionSemanal = ref([])
const stockAFetear      = ref([])

const filteredStockAFetear = computed(() => 
  stockAFetear.value.filter(item => (Number(item.cantidad) || 0) > 0)
)

const totalStockAFetearKg = computed(() =>
  filteredStockAFetear.value.reduce((acc, item) => acc + (Number(item.peso) || 0), 0)
)

const totalOperadores = computed(() => {
  return produccionOperador.value.reduce((acc, op) => ({
    feteadoKg: acc.feteadoKg + (Number(op.total_feteado_kilos) || 0),
    feteadoBols: acc.feteadoBols + (Number(op.total_feteado_bolsitas) || 0),
    envasadoBols: acc.envasadoBols + (Number(op.total_envasado_bolsitas) || 0)
  }), { feteadoKg: 0, feteadoBols: 0, envasadoBols: 0 })
})

// KPIs Admin
const adminTotalFeteadoKg  = computed(() =>
  produccionDia.value.feteados.reduce((acc, c) => acc + (Number(c.peso_feteado) || 0), 0)
)
const adminTotalFeteadoBolsitas = computed(() =>
  produccionDia.value.feteados.reduce((acc, c) => acc + (Number(c.cantidad_bolsitas) || 0), 0)
)
const adminTotalEnvasado = computed(() =>
  produccionDia.value.envasados.reduce((acc, c) => acc + (Number(c.cantidad_bolsitas) || 0), 0)
)
const adminTotalDecomiso = computed(() =>
  mermasStock.value.decomiso.reduce((acc, c) => acc + (Number(c.peso) || 0), 0)
)
const adminTotalPicadas  = computed(() =>
  mermasStock.value.picadas.reduce((acc, c) => acc + (Number(c.peso) || 0), 0)
)

// ─── SEMANAL ─────────────────────────────────────────
const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

// ─── CARGA DE DATOS ──────────────────────────────────────────────
const cargarDatosAdmin = async () => {
  const [resDia, resOp, resMermas, resSemanal, resStock] = await Promise.all([
    fetch('/api/dashboard/produccion-dia'),
    fetch('/api/dashboard/produccion-operador'),
    fetch('/api/dashboard/mermas-stock'),
    fetch('/api/dashboard/produccion-semanal'),
    fetch('/api/feteado/stock-a-fetear')
  ])
  if (resDia.ok)     produccionDia.value     = await resDia.json()
  if (resOp.ok)      produccionOperador.value = await resOp.json()
  if (resMermas.ok)  mermasStock.value        = await resMermas.json()
  if (resSemanal.ok) produccionSemanal.value  = await resSemanal.json()
  if (resStock.ok)   stockAFetear.value       = await resStock.json()
}

const cargarDatosOperario = async () => {
  const res = await fetch(`/api/produccion/usuario/${authStore.user.usuario}`)
  if (res.ok) historial.value = await res.json()
}

const cargarDatos = async () => {
  if (!authStore.user?.usuario) return
  isLoading.value = true
  try {
    if (isAdmin.value) await cargarDatosAdmin()
    else               await cargarDatosOperario()
  } catch (e) {
    console.error('Error cargando dashboard:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(cargarDatos)
</script>

<template>
  <div class="page-container animate-fade">

    <!-- Encabezado -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h1 class="welcome-title">
          {{ isAdmin ? 'Panel de Control' : `¡Hola, ${authStore.user?.usuario}!` }}
        </h1>
        <p class="welcome-subtitle">
          {{ isAdmin ? 'Resumen de producción del día y la semana.' : 'Tu resumen de producción acumulada.' }}
        </p>
      </div>
      <button class="icon-btn" @click="cargarDatos" :disabled="isLoading" title="Actualizar">
        <i class="ph ph-arrows-clockwise" :class="{ spinner: isLoading }"></i>
      </button>
    </div>

    <!-- ══════════════ VISTA ADMIN ══════════════ -->
    <template v-if="isAdmin">

      <!-- KPIs -->
      <div class="kpi-grid mt-4">
        <div class="kpi-card kpi-green">
          <i class="ph ph-knife kpi-icon"></i>
          <div>
            <span class="kpi-label">Feteado hoy</span>
            <span class="kpi-value">{{ adminTotalFeteadoKg.toFixed(2) }} <small>Kg</small></span>
          </div>
        </div>
        <div class="kpi-card kpi-blue">
          <i class="ph ph-stack kpi-icon"></i>
          <div>
            <span class="kpi-label">Bolsitas feteadas hoy</span>
            <span class="kpi-value">{{ adminTotalFeteadoBolsitas }} <small>unid.</small></span>
          </div>
        </div>
        <div class="kpi-card kpi-red">
          <i class="ph ph-warning kpi-icon"></i>
          <div>
            <span class="kpi-label">Decomiso (stock)</span>
            <span class="kpi-value">{{ adminTotalDecomiso.toFixed(2) }} <small>Kg</small></span>
          </div>
        </div>
        <div class="kpi-card kpi-orange">
          <i class="ph ph-funnel kpi-icon"></i>
          <div>
            <span class="kpi-label">Picadas (stock)</span>
            <span class="kpi-value">{{ adminTotalPicadas.toFixed(2) }} <small>Kg</small></span>
          </div>
        </div>
      </div>

      <!-- ── Producción del Día ── -->
      <div class="tables-row mt-4">
        <!-- Feteados del día -->
        <div class="card section-card">
          <div class="card-header border-bottom pb-2 mb-2">
            <h3 class="card-title"><i class="ph ph-knife text-green mr-1"></i>Feteado del día</h3>
          </div>
          <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
          <table v-else-if="produccionDia.feteados.length" class="data-table">
            <thead>
              <tr><th>Código</th><th>Producto</th><th class="text-right">Kg</th><th class="text-right">Bolsitas</th></tr>
            </thead>
            <tbody>
              <tr v-for="f in produccionDia.feteados" :key="f.codigo">
                <td class="code-cell">{{ f.codigo }}</td>
                <td>{{ f.producto }}</td>
                <td class="text-right fw-bold text-green">{{ Number(f.peso_feteado).toFixed(2) }}</td>
                <td class="text-right fw-bold text-accent">{{ f.cantidad_bolsitas }}</td>
              </tr>
            </tbody>
            <tfoot class="total-row">
              <tr>
                <td colspan="2" class="fw-bold">TOTALES</td>
                <td class="text-right fw-bold text-green">{{ adminTotalFeteadoKg.toFixed(2) }}</td>
                <td class="text-right fw-bold text-accent">{{ adminTotalFeteadoBolsitas }}</td>
              </tr>
            </tfoot>
          </table>
          <div v-else class="empty-mini">Sin registros hoy</div>
        </div>

        <!-- Stock a Fetear (MEDIO) -->
        <div class="card section-card">
          <div class="card-header border-bottom pb-2 mb-2">
            <h3 class="card-title"><i class="ph ph-package text-accent mr-1"></i>Stock a Fetear</h3>
          </div>
          <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
          <table v-else-if="filteredStockAFetear.length" class="data-table">
            <thead>
              <tr><th>Código</th><th>Producto</th><th class="text-right">Kg</th></tr>
            </thead>
            <tbody>
              <tr v-for="s in filteredStockAFetear" :key="s.id">
                <td class="code-cell">{{ s.codigo }}</td>
                <td class="truncate-text" :title="s.Producto?.descripcion">{{ s.Producto?.descripcion || '—' }}</td>
                <td class="text-right fw-bold text-green">{{ Number(s.peso).toFixed(2) }}</td>
              </tr>
            </tbody>
            <tfoot class="total-row">
              <tr>
                <td colspan="2" class="fw-bold">TOTAL</td>
                <td class="text-right fw-bold text-green">{{ totalStockAFetearKg.toFixed(2) }}</td>
              </tr>
            </tfoot>
          </table>
          <div v-else class="empty-mini">Sin stock a fetear</div>
        </div>

        <!-- Envasados del día -->
        <div class="card section-card">
          <div class="card-header border-bottom pb-2 mb-2">
            <h3 class="card-title"><i class="ph ph-package text-blue mr-1"></i>Envasado del día</h3>
          </div>
          <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
          <table v-else-if="produccionDia.envasados.length" class="data-table">
            <thead>
              <tr><th>Código</th><th>Producto</th><th class="text-right">Unid.</th></tr>
            </thead>
            <tbody>
              <tr v-for="e in produccionDia.envasados" :key="e.codigo">
                <td class="code-cell">{{ e.codigo }}</td>
                <td>{{ e.producto }}</td>
                <td class="text-right fw-bold text-blue">{{ e.cantidad_bolsitas }}</td>
              </tr>
            </tbody>
            <tfoot class="total-row">
              <tr>
                <td colspan="2" class="fw-bold">TOTAL</td>
                <td class="text-right fw-bold text-blue">{{ adminTotalEnvasado }}</td>
              </tr>
            </tfoot>
          </table>
          <div v-else class="empty-mini">Sin registros hoy</div>
        </div>
      </div>

      <!-- ── Operadores + Mermas ── -->
      <div class="tables-row mt-4">
        <!-- Rendimiento de operadores -->
        <div class="card section-card">
          <div class="card-header border-bottom pb-2 mb-2">
            <h3 class="card-title"><i class="ph ph-users text-accent mr-1"></i>Rendimiento de operadores (hoy)</h3>
          </div>
          <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
          <table v-else-if="produccionOperador.length" class="data-table">
            <thead>
              <tr>
                <th>Operador</th>
                <th class="text-right">Feteado (Kg)</th>
                <th class="text-right">Feteado (Bolsitas)</th>
                <th class="text-right">Envasado (Bolsitas)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="op in produccionOperador" :key="op.nombre">
                <td class="fw-bold">{{ op.nombre }}</td>
                <td class="text-right text-green">{{ Number(op.total_feteado_kilos).toFixed(2) }}</td>
                <td class="text-right text-accent">{{ op.total_feteado_bolsitas }}</td>
                <td class="text-right text-blue">{{ op.total_envasado_bolsitas }}</td>
              </tr>
            </tbody>
            <tfoot class="total-row">
              <tr>
                <td class="fw-bold">TOTALES</td>
                <td class="text-right fw-bold text-green">{{ totalOperadores.feteadoKg.toFixed(2) }}</td>
                <td class="text-right fw-bold text-accent">{{ totalOperadores.feteadoBols }}</td>
                <td class="text-right fw-bold text-blue">{{ totalOperadores.envasadoBols }}</td>
              </tr>
            </tfoot>
          </table>
          <div v-else class="empty-mini">Sin datos de operadores hoy</div>
        </div>

        <!-- Mermas: decomiso y picadas -->
        <div class="mermas-row" style="display: flex; gap: 1rem;">
          <!-- Decomiso -->
          <div class="card section-card" style="flex: 1;">
            <div class="card-header border-bottom pb-2 mb-2">
              <h3 class="card-title"><i class="ph ph-warning-circle text-red mr-1"></i>Decomiso (stock)</h3>
            </div>
            <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
            <table v-else-if="mermasStock.decomiso.length" class="data-table mb-3">
              <thead><tr><th>Código</th><th>Producto</th><th class="text-right">Kg</th></tr></thead>
              <tbody>
                <tr v-for="d in mermasStock.decomiso.slice(0, 5)" :key="d.codigo">
                  <td class="code-cell">{{ d.codigo }}</td>
                  <td>{{ d.nombre }}</td>
                  <td class="text-right fw-bold text-red">{{ Number(d.peso).toFixed(2) }}</td>
                </tr>
              </tbody>
              <tfoot class="total-row">
                <tr>
                  <td colspan="2" class="fw-bold">TOTAL</td>
                  <td class="text-right fw-bold text-red">{{ adminTotalDecomiso.toFixed(2) }}</td>
                </tr>
              </tfoot>
            </table>
            <div v-else class="empty-mini mb-3">Sin decomiso</div>
          </div>
          <!-- Picadas -->
          <div class="card section-card" style="flex: 1;">
            <div class="card-header border-bottom pb-2 mb-2">
              <h3 class="card-title"><i class="ph ph-funnel text-orange mr-1"></i>Picadas (stock)</h3>
            </div>
            <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
            <table v-else-if="mermasStock.picadas.length" class="data-table">
              <thead><tr><th>Código</th><th>Producto</th><th class="text-right">Kg</th></tr></thead>
              <tbody>
                <tr v-for="p in mermasStock.picadas.slice(0, 5)" :key="p.codigo">
                  <td class="code-cell">{{ p.codigo }}</td>
                  <td>{{ p.nombre }}</td>
                  <td class="text-right fw-bold text-orange">{{ Number(p.peso).toFixed(2) }}</td>
                </tr>
              </tbody>
              <tfoot class="total-row">
                <tr>
                  <td colspan="2" class="fw-bold">TOTAL</td>
                  <td class="text-right fw-bold text-orange">{{ adminTotalPicadas.toFixed(2) }}</td>
                </tr>
              </tfoot>
            </table>
            <div v-else class="empty-mini">Sin picadas</div>
          </div>
        </div>
      </div>

      <!-- ── Producción Semanal (Tabla) ── -->
      <div class="card mt-4">
        <div class="card-header border-bottom pb-2 mb-3">
          <h3 class="card-title"><i class="ph ph-calendar-blank text-green mr-1"></i>Rendimiento semanal por operador (Lunes–Sábado)</h3>
        </div>
        <div v-if="isLoading" class="loading-state"><i class="ph ph-spinner spinner icon-xl"></i></div>
        <div class="table-responsive" v-else-if="produccionSemanal.length">
          <table class="data-table">
            <thead>
              <tr>
                <th>Operador</th>
                <th v-for="dia in DIAS" :key="dia" class="text-center">{{ dia }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="op in produccionSemanal" :key="op.operador">
                <td class="fw-bold">{{ op.operador }}</td>
                <td v-for="dia in DIAS" :key="dia" class="text-center">
                  <div v-if="op.dias[dia] && (op.dias[dia].feteado_kilos > 0 || op.dias[dia].feteado_bolsitas > 0 || op.dias[dia].envasado_bolsitas > 0)">
                    <div style="display: flex; flex-direction: column; gap: 2px; align-items: center;">
                      <div style="background: #f3f3f3; border-radius: 4px; padding: 2px 6px; font-size: 0.78em; color: #222; font-weight: 700; min-width: 60px;">
                        {{ Number((op.dias[dia].feteado_kilos || 0) + (op.dias[dia].envasado_kilos || 0)).toFixed(2) }} Kg
                      </div>
                      <div style="background: #e0e0e0; border-radius: 4px; padding: 2px 6px; font-size: 0.78em; color: #222; font-weight: 700; min-width: 60px;">
                        {{ (op.dias[dia].feteado_bolsitas || 0) + (op.dias[dia].envasado_bolsitas || 0) }} unid.
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">
          <i class="ph ph-table icon-xl"></i>
          <p>Sin datos para la semana actual</p>
        </div>
      </div>

    </template>

    <!-- ══════════════ VISTA OPERARIO ══════════════ -->
    <template v-else>
      <div class="stats-grid mt-4">
        <div class="card stat-card">
          <span class="stat-label">Total Producido</span>
          <span class="stat-value">{{ totalBolsitas }}</span>
          <span class="stat-unit">unidades</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">Feteado</span>
          <span class="stat-value">{{ produccionPorProceso.Feteado }}</span>
          <span class="stat-unit">unidades</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">Envasado</span>
          <span class="stat-value">{{ produccionPorProceso.Envasado }}</span>
          <span class="stat-unit">unidades</span>
        </div>
      </div>

      <div class="card mt-4 no-padding-mobile">
        <div class="card-header responsive-card-header">
          <h3 class="card-title">Mi Actividad Reciente</h3>
        </div>
        <div class="table-container">
          <div v-if="isLoading" class="loading-state">
            <i class="ph ph-spinner spinner icon-xl"></i>
            <p>Cargando...</p>
          </div>
          <table v-else-if="historial.length" class="responsive-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th class="text-right">Bolsitas</th>
                <th class="d-none-mobile text-center">Proceso</th>
                <th class="d-none-mobile">Fecha</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="item in historial" :key="item.id_produccion">
                <tr @click="toggleRow(item.id_produccion)" :class="{ 'row-expanded': expandedRows.has(item.id_produccion) }">
                  <td>
                    <div class="prod-cell">
                      <span class="fw-bold">{{ item.Producto?.descripcion }}</span>
                      <span class="d-only-mobile text-xs text-muted">{{ item.fecha?.split('T')[0] }}</span>
                    </div>
                  </td>
                  <td class="text-right fw-bold text-blue">{{ item.cantidad_bolsitas }}</td>
                  <td class="d-none-mobile text-center">
                    <span class="badge" :class="item.tipo_proceso === 'Feteado' ? 'badge-primary' : 'badge-warning'">
                      {{ item.tipo_proceso }}
                    </span>
                  </td>
                  <td class="d-none-mobile text-muted text-sm">{{ item.fecha?.split('T')[0] }}</td>
                </tr>
                <tr v-if="expandedRows.has(item.id_produccion)" class="detail-row d-only-mobile">
                  <td colspan="2">
                    <div class="detail-content animate-slide-down">
                      <div class="detail-mini-grid">
                        <div><span class="label">Proceso</span><span class="value">{{ item.tipo_proceso }}</span></div>
                        <div><span class="label">Fecha</span><span class="value">{{ item.fecha?.split('T')[0] }}</span></div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <i class="ph ph-tray icon-xl"></i>
            <p>No hay registros para mostrar.</p>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<style scoped>
/* ─── Layout base ─────────────────────────────────── */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.5rem 0 0.75rem;
}
.welcome-title   { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
.welcome-subtitle { color: var(--text-muted); font-size: 0.78rem; margin-top: 0.1rem; }

/* ─── KPIs ────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
}
.kpi-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.04);
}
.kpi-icon { font-size: 1.6rem; opacity: 0.85; }
.kpi-label { display: block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
.kpi-value { font-size: 1.5rem; font-weight: 800; line-height: 1.1; color: var(--text-primary); }
.kpi-value small { font-size: 0.7rem; font-weight: 600; color: var(--text-muted); }

.kpi-green  { background: #f0fdf4; border-color: #bbf7d0; }
.kpi-blue   { background: #eff6ff; border-color: #bfdbfe; }
.kpi-red    { background: #fef2f2; border-color: #fecaca; }
.kpi-orange { background: #fffbeb; border-color: #fde68a; }

/* ─── Sección de tablas en fila ────────────────────── */
.tables-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
.section-card { padding: 0.85rem !important; }

/* ─── Tabla de datos ─────────────────────────────── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.data-table th {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #b0b0b0; /* Más claro que --text-muted */
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid var(--bg-tertiary);
  text-align: left;
}
.data-table td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--bg-tertiary);
  vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--bg-secondary); }

.code-cell  { font-family: monospace; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
.text-green { color: #16a34a; }
.text-blue  { color: #2563eb; }
.text-red   { color: #dc2626; }
.text-orange { color: #d97706; }
.text-accent { color: var(--accent-primary); }

.total-row td {
  background: var(--bg-tertiary);
  border-top: 2px solid var(--bg-tertiary);
  border-bottom: none !important;
  color: var(--text-primary);
  font-size: 0.85rem;
}

.truncate-text {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.merma-subtitle {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  margin: 0.5rem 0 0.25rem;
}
.mb-3 { margin-bottom: 0.75rem; }

/* ─── Tabla responsive ─────────────────────────────── */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}
.text-center { text-align: center !important; }
.text-xs { font-size: 0.65rem; }
.mt-1 { margin-top: 0.25rem; }

/* ─── Estados ────────────────────────────────────── */
.mini-loading { padding: 1.5rem; text-align: center; color: var(--text-muted); }
.empty-mini   { padding: 0.75rem 0.5rem; font-size: 0.78rem; color: var(--text-muted); font-style: italic; }
.loading-state, .empty-state {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* ─── Utilidades ─────────────────────────────────── */
.border-bottom { border-bottom: 1px solid var(--bg-tertiary); }
.pb-2 { padding-bottom: 0.5rem; }
.mb-2 { margin-bottom: 0.75rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mr-1 { margin-right: 0.35rem; }
.fw-bold { font-weight: 700; }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ─── Vista Operario ─────────────────────────────── */
.stats-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.stat-card   { padding: 0.6rem 0.75rem !important; display: flex; flex-direction: column; gap: 0.15rem; border-left: 3px solid var(--accent-primary); }
.stat-label  { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
.stat-value  { font-size: 1.6rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
.stat-unit   { font-size: 0.68rem; color: var(--text-muted); font-weight: 600; }

.prod-cell { display: flex; flex-direction: column; }
.responsive-table tr { cursor: pointer; }
.row-expanded { background: var(--accent-primary-light) !important; }
.detail-row td { padding: 0 !important; }
.detail-content { padding: 0.6rem 0.75rem; background: #e8e5dc; border-bottom: 1px solid var(--bg-tertiary); }
.detail-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.detail-mini-grid .label { display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
.detail-mini-grid .value { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }

.d-none-mobile { display: none; }
.d-only-mobile { display: block; }

/* ─── Responsive ─────────────────────────────────── */
@media (min-width: 640px) {
  .kpi-grid    { grid-template-columns: repeat(4, 1fr); }
}
@media (min-width: 1024px) {
  .tables-row  { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 768px) {
  .d-none-mobile { display: table-cell; }
  .d-only-mobile { display: none !important; }
  .responsive-table tr { cursor: default; }
}
</style>
