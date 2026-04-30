<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const isLoading = ref(false)

// ─── ESTADO ──────────────────────────────────────────────────────
const feteadoDiaRaw = ref([])   // Respuesta cruda del endpoint (anidada)
const feteadoSemanal = ref([])
const repositores = ref([])
const selectedRepositor = ref('todos')

// ─── HELPERS ─────────────────────────────────────────────────────
const startsWithRepo = (name) => {
  if (!name) return false
  return name.toString().startsWith('Repo-')
}

// Aplanar la estructura anidada { feteador, productos: [...] }
const flattenDia = (rawData) => {
  const rows = []
  rawData.forEach(entry => {
    if (!startsWithRepo(entry.feteador)) return
    ;(entry.productos || []).forEach(p => {
      rows.push({
        feteador: entry.feteador,
        codigo: p.codigo,
        producto: p.producto,
        peso_feteado: p.peso_feteado,
        cantidad_bolsitas: p.cantidad_bolsitas
      })
    })
  })
  return rows
}

// ─── COMPUTADOS ──────────────────────────────────────────────────
const filteredDia = computed(() => {
  const data = flattenDia(feteadoDiaRaw.value)
  if (selectedRepositor.value === 'todos') return data
  return data.filter(f => f.feteador === selectedRepositor.value)
})

const filteredSemanal = computed(() => {
  return feteadoSemanal.value.filter(s => startsWithRepo(s.operador))
})

// Mensual = misma estructura que día (por ahora usa los mismos datos)
const filteredMensual = computed(() => {
  const data = flattenDia(feteadoDiaRaw.value)
  if (selectedRepositor.value === 'todos') return data
  return data.filter(f => f.feteador === selectedRepositor.value)
})

// ─── CARGA DE DATOS ──────────────────────────────────────────────
const cargarDatos = async () => {
  isLoading.value = true
  try {
    const [resDia, resSemanal] = await Promise.all([
      fetch('/api/dashboard/feteado-dia-por-feteador'),
      fetch('/api/dashboard/produccion-semanal')
    ])

    if (resDia.ok) {
      const data = await resDia.json()
      feteadoDiaRaw.value = data || []
      const nombres = new Set()
      feteadoDiaRaw.value.forEach(entry => {
        if (startsWithRepo(entry.feteador)) nombres.add(entry.feteador)
      })
      repositores.value = Array.from(nombres).map(n => ({ usuario: n, nombre: n }))
    }

    if (resSemanal.ok) feteadoSemanal.value = await resSemanal.json()

  } catch (e) {
    console.error('Error cargando datos de feteado externo:', e)
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
        <h1 class="welcome-title">Control de Feteado Externo</h1>
        <p class="welcome-subtitle">Registro y seguimiento de repositores externos.</p>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="selectedRepositor" class="filter-select">
          <option value="todos">Todos los Repositores</option>
          <option v-for="rep in repositores" :key="rep.usuario" :value="rep.nombre">
            {{ rep.nombre }}
          </option>
        </select>
        <button class="icon-btn" @click="cargarDatos" :disabled="isLoading">
          <i class="ph ph-arrows-clockwise" :class="{ spinner: isLoading }"></i>
        </button>
      </div>
    </div>

    <!-- ── Dashboad del Día ── -->
    <div class="card section-card mt-4">
      <div class="card-header border-bottom pb-2 mb-3 flex justify-between items-center">
        <h3 class="card-title">
          <i class="ph ph-calendar-check text-green mr-1"></i> Feteado del Día
        </h3>
        <span class="text-xs font-bold text-muted uppercase">Hoy: {{ new Date().toLocaleDateString() }}</span>
      </div>

      <div v-if="isLoading" class="loading-state">
        <i class="ph ph-spinner spinner icon-xl"></i>
      </div>

      <div v-else-if="filteredDia.length" class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Repositor</th>
              <th>Código</th>
              <th>Producto</th>
              <th class="text-right">Kilos</th>
              <th class="text-right">Bolsitas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(f, i) in filteredDia" :key="f.codigo + '-' + i">
              <td class="fw-bold">{{ f.feteador }}</td>
              <td class="code-cell">{{ f.codigo }}</td>
              <td>{{ f.producto }}</td>
              <td class="text-right fw-bold text-green">{{ Number(f.peso_feteado).toFixed(2) }} Kg</td>
              <td class="text-right fw-bold text-accent">{{ f.cantidad_bolsitas }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <i class="ph ph-tray icon-xl"></i>
        <p>No hay registros para el día de hoy.</p>
      </div>
    </div>

    <!-- ── Acumulado Semanal (Lunes a Sábado) ── -->
    <div class="card section-card mt-4">
      <div class="card-header border-bottom pb-2 mb-3">
        <h3 class="card-title">
          <i class="ph ph-chart-bar text-blue mr-1"></i> Acumulado Semanal (Bolsitas)
        </h3>
      </div>

      <div class="table-responsive">
        <table class="data-table table-fixed-weekly">
          <thead>
            <tr>
              <th style="width: 200px;">Repositor</th>
              <th class="text-center">Lun</th>
              <th class="text-center">Mar</th>
              <th class="text-center">Mié</th>
              <th class="text-center">Jue</th>
              <th class="text-center">Vie</th>
              <th class="text-center">Sáb</th>
              <th class="text-right" style="width: 120px;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in filteredSemanal" :key="s.operador">
              <td class="fw-bold truncate" :title="s.operador">{{ s.operador }}</td>
              <td class="text-center">{{ s.dias?.Lunes?.feteado_bolsitas || 0 }}</td>
              <td class="text-center">{{ s.dias?.Martes?.feteado_bolsitas || 0 }}</td>
              <td class="text-center">{{ s.dias?.Miercoles?.feteado_bolsitas || 0 }}</td>
              <td class="text-center">{{ s.dias?.Jueves?.feteado_bolsitas || 0 }}</td>
              <td class="text-center">{{ s.dias?.Viernes?.feteado_bolsitas || 0 }}</td>
              <td class="text-center">{{ s.dias?.Sabado?.feteado_bolsitas || 0 }}</td>
              <td class="text-right fw-bold text-blue">
                {{ Object.values(s.dias || {}).reduce((acc, d) => acc + (d.feteado_bolsitas || 0), 0) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Acumulado Mensual Unified ── -->
    <div class="card section-card mt-4 mb-8">
      <div class="card-header border-bottom pb-2 mb-3">
        <h3 class="card-title">
          <i class="ph ph-trend-up text-orange mr-1"></i> Acumulado Mensual Unificado
        </h3>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Repositor</th>
              <th>Código</th>
              <th>Producto</th>
              <th class="text-right">Kilos</th>
              <th class="text-right">Bolsitas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(m, i) in filteredMensual" :key="m.codigo + '-' + i">
              <td class="fw-bold">{{ m.feteador }}</td>
              <td class="code-cell">{{ m.codigo }}</td>
              <td>{{ m.producto }}</td>
              <td class="text-right fw-bold text-green">{{ Number(m.peso_feteado).toFixed(2) }} Kg</td>
              <td class="text-right fw-bold text-accent">{{ m.cantidad_bolsitas }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Reutilizamos estilos del dashboard */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0 0.75rem;
}
.welcome-title { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
.welcome-subtitle { color: var(--text-muted); font-size: 0.78rem; margin-top: 0.1rem; }

.filter-select {
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--bg-tertiary);
  background: var(--bg-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  outline: none;
}

.section-card { padding: 0.85rem !important; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.data-table th {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #999;
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid var(--bg-tertiary);
  text-align: left;
}
.data-table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--bg-tertiary);
  vertical-align: middle;
}
.data-table tr:hover td { background: rgba(0,0,0,0.02); }

.code-cell {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 700;
}

.text-green { color: #16a34a; }
.text-blue { color: #2563eb; }
.text-orange { color: #d97706; }
.text-accent { color: var(--accent-primary); }
.text-muted { color: #666; }
.fw-bold { font-weight: 700; }

.badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}
.badge-primary { background: var(--accent-primary-light); color: var(--accent-primary); }

.loading-state, .empty-state {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.table-fixed-weekly {
  table-layout: fixed;
}
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-center { text-align: center !important; }
.text-right { text-align: right !important; }

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.mb-8 { margin-bottom: 2rem; }
</style>
