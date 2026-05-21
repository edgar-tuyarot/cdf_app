<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Vencimientos de Productos</h2>
        <p class="page-description">Supervisa los lotes de piezas con vencimientos más cercanos y gestiona el stock crítico.</p>
      </div>
    </div>

    <!-- Filtros de búsqueda y estado -->
    <div class="card mb-4">
      <div class="card-header">Filtros de Búsqueda</div>
      <div class="card-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 0.75rem;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Buscar por Producto (Código / Nombre)</label>
          <div style="display: flex; align-items: center; background: var(--bg-window); padding: 0.2rem 0.4rem; box-shadow: var(--inset-shadow); border: 1px solid var(--bevel-dark);">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); margin-right: 0.4rem;"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Ej: jamon, 1001..." 
              style="border: none; outline: none; background: transparent; width: 100%; color: var(--text-primary); font-size: 0.85rem;"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted);">
              <i class="ph ph-x-circle"></i>
            </button>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Estado de Vencimiento</label>
          <select v-model="statusFilter" class="form-control" style="height: 32px; font-size: 0.85rem;">
            <option value="all">Todos los Estados</option>
            <option value="expired">Vencidos</option>
            <option value="today">Vencen Hoy</option>
            <option value="critical">Crítico (≤ 7 días)</option>
            <option value="approaching">Próximo (≤ 30 días)</option>
            <option value="safe">Seguro (> 30 días)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Listado de Vencimientos -->
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <span class="card-title">Cronograma de Vencimientos Activos</span>
        <span class="badge-total" v-if="!loading">
          {{ filteredVencimientos.length }} lotes encontrados
        </span>
      </div>
      
      <div class="table-container">
        <table v-if="!loading && filteredVencimientos.length > 0">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre de Producto</th>
              <th class="text-center">Vencimiento</th>
              <th class="text-center">Días Restantes</th>
              <th class="text-right">Piezas</th>
              <th class="text-right">Peso Unitario</th>
              <th class="text-right">Kilos Est. Expira</th>
              <th class="text-right">Stock Kilos Total (Block)</th>
              <th class="text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in filteredVencimientos" :key="v.id">
              <td><strong>{{ v.codigo_producto }}</strong></td>
              <td>{{ v.producto?.nombre || 'Producto Desconocido' }}</td>
              <td class="text-center" style="font-family: monospace; font-weight: bold;">
                {{ v.vencimiento }}
              </td>
              <td class="text-center">
                <span :class="['days-remaining', getDaysRemaining(v.vencimiento).class]">
                  {{ getDaysRemaining(v.vencimiento).text }}
                </span>
              </td>
              <td class="text-center font-bold" style="font-family: monospace;">
                {{ v.piezas }}
              </td>
              <td class="text-right" style="color: var(--text-muted);">
                {{ v.producto?.peso_x_pieza ? `${parseFloat(v.producto.peso_x_pieza).toFixed(3)} kg` : '-' }}
              </td>
              <td class="text-right font-bold" style="color: var(--accent-danger); font-family: monospace;">
                {{ calcularKilosEst(v).toFixed(3) }} kg
              </td>
              <td class="text-right" style="font-family: monospace;">
                {{ v.producto?.kilos_block ? `${parseFloat(v.producto.kilos_block).toFixed(3)} kg` : '0.000 kg' }}
              </td>
              <td class="text-center">
                <span :class="['status-tag', getDaysRemaining(v.vencimiento).class]">
                  {{ getDaysRemaining(v.vencimiento).label }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Cargando -->
        <div v-if="loading" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Obteniendo cronograma de vencimientos...
        </div>

        <!-- Vacío -->
        <div v-if="!loading && filteredVencimientos.length === 0" class="empty-state">
          <i class="ph ph-calendar-x icon-xl"></i>
          No se encontraron lotes de vencimiento que coincidan con los filtros.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const vencimientos = ref([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('all')

const fetchVencimientos = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/productos/vencimientos-cercanos')
    if (res.ok) {
      vencimientos.value = await res.json()
    } else {
      console.error('Error al obtener vencimientos cercanos')
    }
  } catch (error) {
    console.error('Error de conexión:', error)
  } finally {
    loading.value = false
  }
}

const calcularKilosEst = (v) => {
  const piezas = parseInt(v.piezas, 10) || 0
  const peso = parseFloat(v.producto?.peso_x_pieza) || 0
  return piezas * peso
}

const getDaysRemaining = (vencimientoDate) => {
  if (!vencimientoDate) return { text: '-', class: 'status-safe', label: 'Seguro', days: 999 }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = new Date(vencimientoDate + 'T00:00:00')
  target.setHours(0, 0, 0, 0)
  
  const diffTime = target - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays)
    return {
      text: `Hace ${absDays} ${absDays === 1 ? 'día' : 'días'}`,
      class: 'status-expired',
      label: 'Vencido',
      days: diffDays
    }
  } else if (diffDays === 0) {
    return {
      text: '¡Vence Hoy!',
      class: 'status-today',
      label: 'Hoy',
      days: diffDays
    }
  } else if (diffDays <= 7) {
    return {
      text: `${diffDays} ${diffDays === 1 ? 'día' : 'días'}`,
      class: 'status-warning',
      label: 'Crítico',
      days: diffDays
    }
  } else if (diffDays <= 30) {
    return {
      text: `${diffDays} días`,
      class: 'status-approaching',
      label: 'Próximo',
      days: diffDays
    }
  } else {
    return {
      text: `${diffDays} días`,
      class: 'status-safe',
      label: 'Seguro',
      days: diffDays
    }
  }
}

const filteredVencimientos = computed(() => {
  let result = [...vencimientos.value]

  // Filtro de Texto
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(v => {
      const codigoMatch = v.codigo_producto ? v.codigo_producto.toLowerCase().includes(query) : false
      const nombreMatch = v.producto?.nombre ? v.producto.nombre.toLowerCase().includes(query) : false
      return codigoMatch || nombreMatch
    })
  }

  // Filtro de Estado
  if (statusFilter.value !== 'all') {
    result = result.filter(v => {
      const info = getDaysRemaining(v.vencimiento)
      if (statusFilter.value === 'expired') return info.days < 0
      if (statusFilter.value === 'today') return info.days === 0
      if (statusFilter.value === 'critical') return info.days > 0 && info.days <= 7
      if (statusFilter.value === 'approaching') return info.days > 0 && info.days <= 30
      if (statusFilter.value === 'safe') return info.days > 30
      return true
    })
  }

  return result
})

onMounted(() => {
  fetchVencimientos()
})
</script>

<style scoped>
.font-bold {
  font-weight: 700;
}

.badge-total {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: var(--accent-primary);
  color: white;
  border: 1px solid var(--accent-primary-hover);
  box-shadow: var(--inset-shadow);
  text-transform: uppercase;
  font-weight: bold;
}

/* Vintage Days remaining tag */
.days-remaining {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-family: monospace;
  font-weight: bold;
  border-radius: 2px;
}

/* Retro status tag style */
.status-tag {
  display: inline-block;
  padding: 1px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  box-shadow: var(--inset-shadow);
  border-radius: 2px;
}

/* Color palettes following retro harmonized scheme */
.status-expired {
  background: #ffebe9 !important;
  color: #c9241b !important;
  border: 1px solid #ff8885 !important;
}

.status-today {
  background: #ffe8cc !important;
  color: #d97706 !important;
  border: 1px solid #f59e0b !important;
  animation: pulse-border 1.5s infinite;
}

.status-warning {
  background: #fffbeb !important;
  color: #b45309 !important;
  border: 1px solid #f59e0b !important;
}

.status-approaching {
  background: #eff6ff !important;
  color: #1d4ed8 !important;
  border: 1px solid #3b82f6 !important;
}

.status-safe {
  background: #f0fdf4 !important;
  color: #15803d !important;
  border: 1px solid #22c55e !important;
}

@keyframes pulse-border {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}
</style>
