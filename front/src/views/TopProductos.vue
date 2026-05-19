<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Promedio de Fracción Pedida</h2>
        <p class="page-description">Visualiza el promedio redondeado (mayor) de la fracción pedida por producto, consolidado en una sola tabla.</p>
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

    <!-- Tabla Unificada (Pivoteada) -->
    <div class="card mt-4">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background-color: #0b5394; color: white;">
        <span class="card-title">Matriz de Productos por Sucursal</span>
        
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
      </div>
      
      <div class="table-container" style="overflow-x: auto;">
        <table v-if="!loading && filteredData.length > 0">
          <thead>
            <tr>
              <th @click="sortBy('codigo_producto')" class="sortable" style="min-width: 80px;">
                Código <i v-if="sortKey === 'codigo_producto'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('nombre')" class="sortable" style="min-width: 250px;">
                Nombre del Producto <i v-if="sortKey === 'nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th v-for="sucursal in columnsSucursales" :key="sucursal" @click="sortBy(sucursal)" class="sortable text-center" style="white-space: nowrap;">
                {{ sucursal }} <i v-if="sortKey === sucursal" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
              <th @click="sortBy('total_fila')" class="sortable text-center" style="white-space: nowrap; min-width: 100px;">
                Total <i v-if="sortKey === 'total_fila'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prod in filteredData" :key="prod.codigo_producto">
              <td><strong>{{ prod.codigo_producto }}</strong></td>
              <td style="white-space: nowrap;">{{ prod.nombre }}</td>
              <td v-for="sucursal in columnsSucursales" :key="sucursal" class="text-center">
                <span v-if="prod[sucursal] !== undefined" class="fw-bold text-primary">{{ prod[sucursal] }}</span>
                <span v-else class="text-muted" style="color: #aaa;">-</span>
              </td>
              <td class="text-center fw-bold">
                {{ prod.total_fila }}
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Estado Vacío o Sin Resultados de Búsqueda -->
        <div v-else-if="!loading && filteredData.length === 0" class="empty-state">
          <i class="ph ph-magnifying-glass icon-xl" v-if="searchQuery"></i>
          <i class="ph ph-package icon-xl" v-else></i>
          {{ searchQuery ? 'No se encontraron productos que coincidan con la búsqueda.' : 'No hay datos de productos registrados.' }}
        </div>
      </div>
    </div>

    <!-- Cargando -->
    <div v-if="loading" class="loading-state card mt-4">
      <i class="ph ph-spinner spinner icon-xl"></i>
      Cargando matriz de sucursales...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const columnsSucursales = ref([])
const pivotedData = ref([])
const searchQuery = ref('')
const sortKey = ref('total_fila') // Ordenar por total por defecto
const sortOrder = ref(-1) // De mayor a menor
const loading = ref(true)
const alert = ref({ show: false, message: '', type: 'success' })

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3000)
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value *= -1 // Alternar asc/desc
  } else {
    sortKey.value = key
    sortOrder.value = -1 // Por defecto ordenar desc cuando se elige nueva columna
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/pedidos/promedio-sucursal')
    if (!res.ok) {
      throw new Error('Error al obtener datos de la API')
    }
    const data = await res.json()
    
    const branchSet = new Set()
    const productMap = {}

    // Transformar los datos anidados en una estructura pivotada
    data.forEach(sucursalObj => {
      const sucursalName = sucursalObj.sucursal
      branchSet.add(sucursalName)

      sucursalObj.productos.forEach(prod => {
        if (!productMap[prod.codigo_producto]) {
          productMap[prod.codigo_producto] = {
            codigo_producto: prod.codigo_producto,
            nombre: prod.nombre,
            total_fila: 0
          }
        }
        // Asignar el valor de la métrica a la columna (propiedad) correspondiente de esta sucursal
        productMap[prod.codigo_producto][sucursalName] = prod.mayor_fraccion_pedida
        // Sumar al total general de la fila
        productMap[prod.codigo_producto].total_fila += prod.mayor_fraccion_pedida
      })
    })

    // Ordenar las sucursales alfabéticamente para las columnas
    columnsSucursales.value = Array.from(branchSet).sort()
    
    // Convertir el mapa de productos a un array (el ordenamiento se hace en el computed)
    pivotedData.value = Object.values(productMap)

  } catch (error) {
    console.error('Error fetching data:', error)
    showAlert('Error de conexión al procesar los datos', 'error')
  } finally {
    loading.value = false
  }
}

const filteredData = computed(() => {
  let result = pivotedData.value
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(item => 
      item.codigo_producto.toLowerCase().includes(q) || 
      (item.nombre && item.nombre.toLowerCase().includes(q))
    )
  }

  if (sortKey.value) {
    result.sort((a, b) => {
      let valA = a[sortKey.value]
      let valB = b[sortKey.value]

      if (valA === undefined) valA = 0
      if (valB === undefined) valB = 0

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * sortOrder.value
      }
      return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * sortOrder.value
    })
  }

  return result
})

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
  background-color: rgba(255, 255, 255, 0.1);
}
th i {
  margin-left: 0.25rem;
  font-size: 0.8rem;
  vertical-align: middle;
}
</style>
