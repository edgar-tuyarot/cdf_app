<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Demanda de Pedidos Pendientes</h2>
        <p class="page-description">
          Visualiza la suma consolidada de todas las piezas y fracciones (unidades) demandadas en todos los pedidos activos (excluyendo pedidos en estado Enviado).
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
          <div style="background: var(--bg-window); padding: 8px; border-radius: 0; box-shadow: var(--inset-shadow);">
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
          <div style="background: var(--bg-window); padding: 8px; border-radius: 0; box-shadow: var(--inset-shadow);">
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
          <div style="background: var(--bg-window); padding: 8px; border-radius: 0; box-shadow: var(--inset-shadow);">
            <i class="ph ph-article" style="font-size: 1.8rem; color: #1e6ec8;"></i>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Fracciones Pendientes</div>
            <div style="font-size: 1.5rem; font-weight: bold; font-family: monospace; color: #1e6ec8;">{{ Math.round(totalFracciones) }}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Suma acumulada de porciones/fracciones</div>
          </div>
        </div>
      </div>

      <div class="card" style="background-color: var(--bg-secondary); border-top: 4px solid #0284c7;">
        <div class="card-body" style="padding: 1rem; display: flex; align-items: center; gap: 1rem;">
          <div style="background: var(--bg-window); padding: 8px; border-radius: 0; box-shadow: var(--inset-shadow);">
            <i class="ph ph-scales" style="font-size: 1.8rem; color: #0284c7;"></i>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Total Requerido</div>
            <div style="font-size: 1.5rem; font-weight: bold; font-family: monospace; color: #0284c7;">{{ totalRequeridoGeneral.toFixed(2) }} kg</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Suma acumulada de kg demandados</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla Unificada -->
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background-color: #0b5394; color: white;">
        <span class="card-title"><i class="ph ph-clipboard-text" style="margin-right: 0.4rem;"></i>Consolidado de Demanda Pendiente</span>
        
        <!-- Controles Derecha -->
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <!-- Toggle Incluir Conversiones -->
          <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; cursor: pointer; color: white; user-select: none; background: rgba(255,255,255,0.12); padding: 0.15rem 0.5rem; border-radius: 4px;">
            <input type="checkbox" v-model="incluirConversiones" style="cursor: pointer;" />
            <span>Sumar Conversiones Pendientes en Límite</span>
          </label>

          <!-- Buscador -->
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.9rem;"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar código o nombre..." 
              style="border: none; outline: none; font-size: 0.8rem; background: transparent; width: 170px; color: var(--text-primary);"
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
      
      <div class="table-container table-compact">
        <table v-if="!loading && filteredAndSorted.length > 0">
          <thead>
            <tr>
              <th @click="sortBy('codigo_producto')" class="sortable col-hide-mobile" style="width: 80px;">
                Código <i v-if="sortKey === 'codigo_producto'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('producto_nombre')" class="sortable">
                Nombre del Producto <i v-if="sortKey === 'producto_nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('total_piezas_pedidas')" class="sortable text-right col-hide-mobile" style="width: 95px;">
                Pzas Req <i v-if="sortKey === 'total_piezas_pedidas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('total_fracciones_pedidas')" class="sortable text-right col-hide-mobile" style="width: 95px;">
                Fracc Req <i v-if="sortKey === 'total_fracciones_pedidas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('total_requerido')" class="sortable text-right col-hide-mobile" style="width: 100px; color: var(--accent-primary);">
                Total Req <i v-if="sortKey === 'total_requerido'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('stock')" class="sortable text-right col-hide-mobile" style="width: 95px;">
                Stock Físico <i v-if="sortKey === 'stock'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th class="text-right col-hide-mobile" style="width: 100px; color: #0284c7;">
                A Convertir
              </th>
              <th @click="sortBy('stock_proyectado')" class="sortable text-right col-hide-mobile" style="width: 105px; color: #16a34a;">
                Stk Proyectado <i v-if="sortKey === 'stock_proyectado'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('limite')" class="sortable text-right" style="width: 105px;">
                Límite <i v-if="sortKey === 'limite'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredAndSorted" :key="row.codigo_producto">
              <td class="col-hide-mobile">
                <strong class="font-mono" style="font-size: 0.8rem;">{{ row.codigo_producto }}</strong>
              </td>
              <td class="fw-bold" style="font-size: 0.82rem;">
                {{ row.producto_nombre }}
                <div class="show-mobile-only text-muted font-mono" style="font-size: 0.72rem; font-weight: normal; margin-top: 2px;">
                  Cod: {{ row.codigo_producto }}
                  <span v-if="getNetoAConvertir(row.codigo_producto) !== 0" :style="{ color: getNetoAConvertir(row.codigo_producto) > 0 ? '#16a34a' : '#d97706' }" style="margin-left: 4px; font-weight: bold;">
                    ({{ getNetoAConvertir(row.codigo_producto) > 0 ? '+' : '' }}{{ getNetoAConvertir(row.codigo_producto).toFixed(2) }} kg conv.)
                  </span>
                </div>
              </td>
              <td class="text-right font-mono fw-bold text-orange col-hide-mobile" style="font-size: 0.82rem;">
                <template v-if="parseFloat(row.peso_pieza || 0) > 0">
                  {{ getKilosPiezas(row).toFixed(2) }} kg
                  <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: normal; line-height: 1.1; margin-top: 1px;">
                    {{ Math.round(row.total_piezas_pedidas) }} pzas × {{ parseFloat(row.peso_pieza).toFixed(3) }} kg
                  </div>
                </template>
                <template v-else>
                  {{ Math.round(row.total_piezas_pedidas) }}
                </template>
              </td>
              <td class="text-right font-mono fw-bold text-blue col-hide-mobile" style="font-size: 0.82rem;">
                <template v-if="parseFloat(row.peso_fraccion || 0) > 0">
                  {{ getKilosFracciones(row).toFixed(2) }} kg
                  <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: normal; line-height: 1.1; margin-top: 1px;">
                    {{ Math.round(row.total_fracciones_pedidas) }} u. × {{ parseFloat(row.peso_fraccion).toFixed(3) }} kg
                  </div>
                </template>
                <template v-else>
                  {{ Math.round(row.total_fracciones_pedidas) }}
                </template>
              </td>
              <td class="text-right font-mono fw-bold col-hide-mobile" style="font-size: 0.85rem; color: #0284c7;">
                {{ getTotalRequerido(row).toFixed(2) }} kg
              </td>
              <td class="text-right font-mono fw-bold col-hide-mobile" style="font-size: 0.82rem;" :style="{ color: parseFloat(row.stock || 0) <= 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }">
                {{ parseFloat(row.stock || 0).toFixed(2) }}
              </td>
              <!-- Columna A Convertir -->
              <td class="text-right font-mono fw-bold col-hide-mobile" style="font-size: 0.82rem;">
                <span v-if="getNetoAConvertir(row.codigo_producto) !== 0" :style="{ color: getNetoAConvertir(row.codigo_producto) > 0 ? '#16a34a' : '#d97706' }">
                  {{ getNetoAConvertir(row.codigo_producto) > 0 ? '+' : '' }}{{ getNetoAConvertir(row.codigo_producto).toFixed(2) }} kg
                </span>
                <span v-else class="text-muted" style="font-weight: normal;">-</span>
              </td>
              <!-- Columna Stock Proyectado -->
              <td class="text-right font-mono fw-bold col-hide-mobile" style="font-size: 0.85rem; color: #16a34a;">
                {{ getStockProyectado(row).toFixed(2) }}
              </td>
              <!-- Columna Límite -->
              <td class="text-right font-mono fw-bold" style="font-size: 0.85rem;" :style="{ color: getLimite(row) >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }">
                {{ getLimite(row).toFixed(2) }}
                <div v-if="incluirConversiones && getNetoAConvertir(row.codigo_producto) !== 0" style="font-size: 0.65rem; color: var(--text-muted); font-weight: normal; line-height: 1.1; margin-top: 1px;">
                  (S/Conv: {{ getLimiteFisico(row).toFixed(2) }})
                </div>
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
const fraccionados = ref([])
const incluirConversiones = ref(true) // Toggle para considerar conversiones configuradas
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
    const [resDemanda, resFrac] = await Promise.all([
      fetch('/api/pedidos/demanda-pendiente'),
      fetch('/api/fraccionados')
    ])
    if (resDemanda.ok) {
      items.value = await resDemanda.json()
    } else {
      throw new Error('Error al obtener datos de demanda')
    }
    if (resFrac.ok) {
      fraccionados.value = await resFrac.json()
    }
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

const totalRequeridoGeneral = computed(() => {
  return items.value.reduce((acc, row) => acc + getTotalRequerido(row), 0)
})

// Helpers para cálculos por producto
const getKilosPiezas = (row) => {
  const pzas = parseFloat(row.total_piezas_pedidas || 0)
  const peso = parseFloat(row.peso_pieza || 0)
  return peso > 0 ? pzas * peso : pzas
}

const getKilosFracciones = (row) => {
  const frac = parseFloat(row.total_fracciones_pedidas || 0)
  const peso = parseFloat(row.peso_fraccion || 0)
  return peso > 0 ? frac * peso : frac
}

const getTotalRequerido = (row) => {
  return getKilosPiezas(row) + getKilosFracciones(row)
}

// CÁLCULO DE CONVERSIONES CONFIGURADAS (PLANTILLA)
const getKilosAConvertirDestino = (cod) => {
  if (!cod || !fraccionados.value.length) return 0
  return fraccionados.value
    .filter(f => f.codigo_fraccionado === cod)
    .reduce((sum, f) => sum + (parseFloat(f.peso_a_fraccionar) || 0), 0)
}

const getKilosAConvertirOrigen = (cod) => {
  if (!cod || !fraccionados.value.length) return 0
  return fraccionados.value
    .filter(f => f.codigo_producto_original === cod)
    .reduce((sum, f) => sum + (parseFloat(f.peso_a_descontar) || 0), 0)
}

const getNetoAConvertir = (cod) => {
  const ing = getKilosAConvertirDestino(cod)
  const desc = getKilosAConvertirOrigen(cod)
  return ing - desc
}

const getStockProyectado = (row) => {
  const stockFisico = parseFloat(row.stock || 0)
  const netoConv = getNetoAConvertir(row.codigo_producto)
  return stockFisico + netoConv
}

const getLimiteFisico = (row) => {
  const totalReq = getTotalRequerido(row)
  const stock = parseFloat(row.stock || 0)
  return stock - totalReq
}

const getLimiteProyectado = (row) => {
  const totalReq = getTotalRequerido(row)
  const stockProj = getStockProyectado(row)
  return stockProj - totalReq
}

const getLimite = (row) => {
  return incluirConversiones.value ? getLimiteProyectado(row) : getLimiteFisico(row)
}

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
      let valA = a[sortKey.value]
      let valB = b[sortKey.value]

      if (sortKey.value === 'total_piezas_pedidas') {
        valA = getKilosPiezas(a)
        valB = getKilosPiezas(b)
      } else if (sortKey.value === 'total_fracciones_pedidas') {
        valA = getKilosFracciones(a)
        valB = getKilosFracciones(b)
      } else if (sortKey.value === 'total_requerido') {
        valA = getTotalRequerido(a)
        valB = getTotalRequerido(b)
      } else if (sortKey.value === 'stock_proyectado') {
        valA = getStockProyectado(a)
        valB = getStockProyectado(b)
      } else if (sortKey.value === 'limite') {
        valA = getLimite(a)
        valB = getLimite(b)
      }

      const isNumeric = !isNaN(parseFloat(valA)) && isFinite(valA) && !isNaN(parseFloat(valB)) && isFinite(valB)
      if (isNumeric) {
        return (parseFloat(valA) - parseFloat(valB)) * sortOrder.value
      } else {
        return (valA || '').toString().localeCompare((valB || '').toString()) * sortOrder.value
      }
    })
  }

  return result
})

// Exportar CSV
const exportCSV = () => {
  if (filteredAndSorted.value.length === 0) return

  let csvContent = '\uFEFF' // BOM para Excel
  csvContent += 'Código Producto;Producto;Piezas (Cant);Piezas Requeridas (Kg);Fracciones (Cant);Fracciones Requeridas (Kg);Total Requerido (Kg);Stock Físico;Neto A Convertir (Kg);Stock Proyectado (Kg);Límite (Faltante/Excedente)\n'

  filteredAndSorted.value.forEach(row => {
    const kgPzas = getKilosPiezas(row).toFixed(2)
    const kgFrac = getKilosFracciones(row).toFixed(2)
    const totalReq = getTotalRequerido(row).toFixed(2)
    const stockFisico = parseFloat(row.stock || 0).toFixed(2)
    const netoConv = getNetoAConvertir(row.codigo_producto).toFixed(2)
    const stockProj = getStockProyectado(row).toFixed(2)
    const limite = getLimite(row).toFixed(2)
    csvContent += `"${row.codigo_producto}";"${row.producto_nombre}";${row.total_piezas_pedidas};${kgPzas};${row.total_fracciones_pedidas};${kgFrac};${totalReq};${stockFisico};${netoConv};${stockProj};${limite}\n`
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
.table-compact table {
  width: 100%;
  border-collapse: collapse;
}

.table-compact th {
  padding: 0.35rem 0.5rem;
  font-size: 0.78rem;
  white-space: nowrap;
}

.table-compact td {
  padding: 0.25rem 0.5rem;
  vertical-align: middle;
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

/* Reglas responsivas para celulares (pantallas pequeñas <= 768px) */
@media (max-width: 768px) {
  .col-hide-mobile {
    display: none !important;
  }
  .show-mobile-only {
    display: block !important;
  }
}

@media (min-width: 769px) {
  .show-mobile-only {
    display: none !important;
  }
}
</style>
