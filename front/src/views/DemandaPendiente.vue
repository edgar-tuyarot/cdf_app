<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Demanda de Pedidos Pendientes</h2>
        <p class="page-description">
          Visualiza la suma consolidada de todas las piezas y fracciones (unidades) demandadas en los pedidos que se encuentran en estado <strong>Pendiente</strong>.
        </p>
      </div>
      <div class="header-actions mt-2">
        <button class="btn btn-secondary" @click="fetchData" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Tarjetas de Resumen Rápido -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div class="card" style="background-color: var(--bg-secondary); border-top: 4px solid var(--accent-primary);">
        <div class="card-body" style="padding: 1rem; display: flex; align-items: center; gap: 1rem;">
          <div style="background: var(--bg-window); padding: 8px; border-radius: 4px; box-shadow: var(--inset-shadow);">
            <i class="ph ph-package" style="font-size: 1.8rem; color: var(--accent-primary);"></i>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Productos Requeridos</div>
            <div style="font-size: 1.5rem; font-weight: bold; font-family: monospace;">{{ items.length }} tipos</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Productos distintos demandados</div>
          </div>
        </div>
      </div>

      <div class="card" style="background-color: var(--bg-secondary); border-top: 4px solid #e67e22;">
        <div class="card-body" style="padding: 1rem; display: flex; align-items: center; gap: 1rem;">
          <div style="background: var(--bg-window); padding: 8px; border-radius: 4px; box-shadow: var(--inset-shadow);">
            <i class="ph ph-hash" style="font-size: 1.8rem; color: #e67e22;"></i>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Piezas Pendientes</div>
            <div style="font-size: 1.5rem; font-weight: bold; font-family: monospace; color: #e67e22;">{{ Math.round(totalPiezas) }}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Suma acumulada de piezas en block</div>
          </div>
        </div>
      </div>

      <div class="card" style="background-color: var(--bg-secondary); border-top: 4px solid #1e6ec8;">
        <div class="card-body" style="padding: 1rem; display: flex; align-items: center; gap: 1rem;">
          <div style="background: var(--bg-window); padding: 8px; border-radius: 4px; box-shadow: var(--inset-shadow);">
            <i class="ph ph-article" style="font-size: 1.8rem; color: #1e6ec8;"></i>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Fracciones Pendientes</div>
            <div style="font-size: 1.5rem; font-weight: bold; font-family: monospace; color: #1e6ec8;">{{ Math.round(totalFracciones) }}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Suma acumulada de porciones/fracciones</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla Unificada -->
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background-color: #0b5394; color: white;">
        <span class="card-title"><i class="ph ph-clipboard-text" style="margin-right: 0.4rem;"></i>Consolidado de Demanda Pendiente</span>
        
        <!-- Controles Derecha -->
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <!-- Buscador -->
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.9rem;"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar código o nombre..." 
              style="border: none; outline: none; font-size: 0.8rem; background: transparent; width: 180px; color: var(--text-primary);"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;" title="Limpiar búsqueda">
              <i class="ph ph-x-circle"></i>
            </button>
          </div>

          <button class="btn btn-secondary btn-sm" @click="exportCSV" :disabled="filteredAndSorted.length === 0" style="height: 26px; font-size: 0.8rem; padding: 0 0.5rem; display: flex; align-items: center; gap: 0.2rem; background: var(--bg-window); color: var(--text-primary); border: 1px solid var(--bevel-dark);">
            <i class="ph ph-file-csv"></i> Exportar CSV
          </button>
        </div>
      </div>
      
      <div class="table-container">
        <table v-if="!loading && filteredAndSorted.length > 0">
          <thead>
            <tr>
              <th @click="sortBy('codigo_producto')" class="sortable" style="width: 120px;">
                Código <i v-if="sortKey === 'codigo_producto'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('producto_nombre')" class="sortable">
                Nombre del Producto <i v-if="sortKey === 'producto_nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('total_piezas_pedidas')" class="sortable text-right" style="width: 180px;">
                Piezas Requeridas <i v-if="sortKey === 'total_piezas_pedidas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('total_fracciones_pedidas')" class="sortable text-right" style="width: 180px;">
                Fracciones Requeridas <i v-if="sortKey === 'total_fracciones_pedidas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredAndSorted" :key="row.codigo_producto">
              <td>
                <span class="fw-bold font-mono text-xs" style="background: var(--bg-secondary); padding: 1px 5px; border: 1px solid var(--bevel-dark); border-radius: 2px;">
                  {{ row.codigo_producto }}
                </span>
              </td>
              <td class="fw-bold">{{ row.producto_nombre }}</td>
              <td class="text-right font-mono fw-bold text-orange" style="font-size: 0.95rem;">
                {{ Math.round(row.total_piezas_pedidas) }}
              </td>
              <td class="text-right font-mono fw-bold text-blue" style="font-size: 0.95rem;">
                {{ Math.round(row.total_fracciones_pedidas) }}
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Estado Vacío -->
        <div v-else-if="!loading && filteredAndSorted.length === 0" class="empty-state">
          <i class="ph ph-shopping-cart icon-xl text-muted"></i>
          No se registran demandas en pedidos pendientes de procesamiento.
        </div>
      </div>
    </div>

    <!-- Cargando -->
    <div v-if="loading" class="loading-state card mt-4">
      <i class="ph ph-spinner spinner icon-xl"></i>
      Consolidando pedidos en estado pendiente...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const items = ref([])
const loading = ref(true)
const searchQuery = ref('')
const sortKey = ref('codigo_producto')
const sortOrder = ref(1)
const alert = ref({ show: false, message: '', type: 'success' })

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3000)
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value *= -1
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/pedidos/demanda-pendiente')
    if (!res.ok) {
      throw new Error('Error al obtener datos de la API')
    }
    items.value = await res.json()
  } catch (error) {
    console.error('Error fetching data:', error)
    showAlert('Error de conexión al obtener datos de pedidos pendientes.', 'error')
  } finally {
    loading.value = false
  }
}

// Totales de Resumen
const totalPiezas = computed(() => {
  return items.value.reduce((acc, row) => acc + parseFloat(row.total_piezas_pedidas || 0), 0)
})

const totalFracciones = computed(() => {
  return items.value.reduce((acc, row) => acc + parseFloat(row.total_fracciones_pedidas || 0), 0)
})

// Filtrado y Ordenamiento
const filteredAndSorted = computed(() => {
  let result = [...items.value]

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(row => 
      row.codigo_producto.toLowerCase().includes(q) ||
      (row.producto_nombre && row.producto_nombre.toLowerCase().includes(q))
    )
  }

  if (sortKey.value) {
    result.sort((a, b) => {
      const valA = a[sortKey.value]
      const valB = b[sortKey.value]

      const isNumeric = !isNaN(parseFloat(valA)) && isFinite(valA) && !isNaN(parseFloat(valB)) && isFinite(valB)
      if (isNumeric) {
        return (parseFloat(valA) - parseFloat(valB)) * sortOrder.value
      } else {
        return valA.toString().localeCompare(valB.toString()) * sortOrder.value
      }
    })
  }

  return result
})

// Exportar CSV
const exportCSV = () => {
  if (filteredAndSorted.value.length === 0) return

  let csvContent = '\uFEFF' // BOM para Excel
  csvContent += 'Código Producto;Producto;Piezas Requeridas;Fracciones Requeridas\n'

  filteredAndSorted.value.forEach(row => {
    csvContent += `"${row.codigo_producto}";"${row.producto_nombre}";${row.total_piezas_pedidas};${row.total_fracciones_pedidas}\n`
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  
  const dateStr = new Date().toISOString().split('T')[0]
  link.setAttribute('download', `Consolidado_Demanda_Pendiente_${dateStr}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
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
</style>
