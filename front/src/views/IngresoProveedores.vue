<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Ingreso desde Proveedores</h2>
        <p class="page-description">Registra el alta directa de piezas recibidas de proveedores con sus fechas de vencimiento correspondientes para sumarlas al stock.</p>
      </div>
      <div class="header-actions mt-2">
        <button class="btn btn-secondary" @click="fetchInitialData" :disabled="loadingIngresos || loadingProducts">
          <i class="ph ph-spinner spinner" v-if="loadingIngresos || loadingProducts"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      <div class="alert-icon">
        <i class="ph ph-info" v-if="alert.type === 'info'"></i>
        <i class="ph ph-check-circle" v-if="alert.type === 'success'"></i>
        <i class="ph ph-warning-circle" v-if="alert.type === 'error'"></i>
      </div>
      <div class="alert-message">
        {{ alert.message }}
      </div>
      <button class="alert-close" @click="alert.show = false">
        <i class="ph ph-x"></i>
      </button>
    </div>

    <!-- Layout Grid: Formulario (izq/arriba en pantallas grandes) e Historial -->
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      
      <!-- FORMULARIO DE ALTA -->
      <div class="card">
        <div class="card-header" style="background-color: #0b5394;">
          <span class="card-title" style="color: white; font-weight: bold;">Formulario de Ingreso de Mercadería</span>
        </div>
        <div class="card-body">
          <form @submit.prevent="submitProveedorForm">
            <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
              
              <!-- Proveedor y Fecha Vencimiento -->
              <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; flex-wrap: wrap;">
                  <div class="form-group">
                    <label class="form-label">Proveedor / Fabricante *</label>
                    <div style="position: relative; display: flex; align-items: center;">
                      <i class="ph ph-truck" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
                      <input 
                        type="text" 
                        v-model="form.proveedor" 
                        class="form-control" 
                        placeholder="Ej: Lácteos La Serenísima, Paladini..." 
                        required 
                        style="padding-left: 2rem; height: 34px;"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Fecha de Vencimiento *</label>
                    <input 
                      type="date" 
                      v-model="form.vencimiento" 
                      class="form-control" 
                      required 
                      style="height: 34px;"
                    />
                  </div>
                </div>
              </div>

              <!-- Producto Searchable Datalist -->
              <div class="form-group">
                <label class="form-label">Producto *</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
                  <input 
                    type="text" 
                    v-model="productSearchInput" 
                    list="catalog-products-list" 
                    @input="handleProductInput" 
                    class="form-control" 
                    placeholder="Escribe código o nombre del producto para buscar..." 
                    required 
                    style="padding-left: 2rem; height: 34px;"
                  />
                </div>
                <datalist id="catalog-products-list">
                  <option 
                    v-for="p in catalogProducts" 
                    :key="p.codigo" 
                    :value="p.codigo"
                  >
                    {{ p.nombre }}
                  </option>
                </datalist>
                
                <!-- Vista previa del producto seleccionado -->
                <div 
                  v-if="selectedProduct" 
                  class="selected-product-badge mt-2 animate-fade"
                  style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background-color: var(--accent-success-light); border: 1px solid var(--accent-success); color: var(--text-primary); font-size: 0.85rem;"
                >
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="ph ph-circle-wavy-check text-green" style="font-size: 1.1rem;"></i>
                    <span>
                      Seleccionado: <strong>{{ selectedProduct.nombre }}</strong>
                    </span>
                  </div>
                  <div style="display: flex; gap: 0.75rem; font-size: 0.8rem; font-weight: bold; background: var(--bg-window); padding: 2px 6px; box-shadow: var(--inset-shadow);">
                    <span>Peso unitario: {{ parseFloat(selectedProduct.peso_x_pieza).toFixed(3) }} kg</span>
                    <span>|</span>
                    <span>Stock actual: {{ selectedProduct.cantidad_piezas }} piezas</span>
                  </div>
                </div>
              </div>

              <!-- Fila: Cantidad Piezas e Indicador Peso Calculado -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: end;">
                <div class="form-group">
                  <label class="form-label">Cantidad de Piezas a Ingresar *</label>
                  <input 
                    type="number" 
                    min="1" 
                    step="1" 
                    v-model.number="form.piezas" 
                    class="form-control text-right font-mono text-xl" 
                    required 
                    style="font-weight: bold; height: 40px; padding-right: 1rem;"
                  />
                </div>

                <!-- Vista de Peso Estimado Recibido -->
                <div class="form-group">
                  <label class="form-label text-muted">Peso Total Calculado (Estimado)</label>
                  <div 
                    class="form-control text-right font-mono text-xl" 
                    style="background-color: var(--bg-secondary); border: 1px solid var(--bevel-dark); box-shadow: var(--inset-shadow); font-weight: bold; height: 40px; display: flex; align-items: center; justify-content: flex-end; padding-right: 1rem; color: #0b5394;"
                  >
                    {{ calculatedWeight.toFixed(3) }} kg
                  </div>
                </div>
              </div>

              <!-- Botón Registrar -->
              <div style="margin-top: 0.5rem; display: flex; justify-content: flex-end;">
                <button 
                  type="submit" 
                  class="btn btn-primary btn-lg" 
                  style="width: 100%; height: 42px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: bold; font-size: 0.95rem; background-color: var(--accent-success); border-color: var(--accent-success-hover);"
                  :disabled="submitting || !form.codigo"
                >
                  <i class="ph ph-spinner spinner" v-if="submitting"></i>
                  <i class="ph ph-floppy-disk" v-else></i>
                  {{ submitting ? 'Registrando Ingreso...' : 'Registrar Ingreso de Proveedor' }}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>

      <!-- HISTORIAL PERSISTENTE DE INGRESOS -->
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background-color: #38761d;">
          <span class="card-title" style="color: white; font-weight: bold;">Registro Histórico de Ingresos de Proveedores</span>
          
          <!-- Filtro de Búsqueda Rápida -->
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar por proveedor o producto..." 
              style="border: none; outline: none; font-size: 0.85rem; background: transparent; width: 200px; color: var(--text-primary);"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
              <i class="ph ph-x-circle"></i>
            </button>
          </div>
        </div>

        <div class="table-container" style="max-height: 480px; overflow-y: auto;">
          <table v-if="!loadingIngresos && filteredAndSortedIngresos.length > 0">
            <thead>
              <tr>
                <th @click="sortBy('id')" class="sortable" style="width: 70px;">ID <i v-if="sortKey === 'id'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('fecha')" class="sortable">Fecha/Hora <i v-if="sortKey === 'fecha'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('proveedor')" class="sortable">Proveedor <i v-if="sortKey === 'proveedor'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th>Producto</th>
                <th @click="sortBy('piezas')" class="sortable text-right">Piezas <i v-if="sortKey === 'piezas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('peso_calculado')" class="sortable text-right">Peso Estimado <i v-if="sortKey === 'peso_calculado'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('vencimiento')" class="sortable">Vencimiento <i v-if="sortKey === 'vencimiento'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ing in filteredAndSortedIngresos" :key="ing.id">
                <td><strong>{{ ing.id }}</strong></td>
                <td><span class="font-mono text-xs">{{ formatDateTime(ing.fecha) }}</span></td>
                <td class="fw-bold">{{ ing.proveedor }}</td>
                <td>
                  <span class="fw-bold text-xs" style="background: var(--bg-secondary); padding: 1px 4px; border: 1px solid var(--bevel-dark); border-radius: 2px;">
                    {{ ing.codigo_producto }}
                  </span>
                  <div style="font-size: 0.8rem; margin-top: 2px;">{{ ing.Producto?.nombre || 'Desconocido' }}</div>
                </td>
                <td class="text-right fw-bold font-mono">{{ ing.piezas }} pz</td>
                <td class="text-right fw-bold font-mono text-blue">{{ parseFloat(ing.peso_calculado).toFixed(3) }} kg</td>
                <td>
                  <span :class="['vencimiento-badge font-mono', getVencimientoClass(ing.vencimiento)]">
                    {{ formatDate(ing.vencimiento) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Cargando -->
          <div v-if="loadingIngresos" class="loading-state">
            <i class="ph ph-spinner spinner icon-xl"></i>
            Cargando historial de ingresos...
          </div>

          <!-- Listado Vacío -->
          <div v-if="!loadingIngresos && filteredAndSortedIngresos.length === 0" class="empty-state">
            <i class="ph ph-truck icon-xl text-muted"></i>
            No se encontraron ingresos registrados en el historial.
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Estado
const catalogProducts = ref([])
const ingresos = ref([])
const loadingProducts = ref(false)
const loadingIngresos = ref(false)
const submitting = ref(false)

const productSearchInput = ref('')
const selectedProduct = ref(null)

const form = ref({
  proveedor: '',
  codigo: '',
  piezas: 1,
  vencimiento: ''
})

const alert = ref({ show: false, message: '', type: 'info' })
const searchQuery = ref('')
const sortKey = ref('id')
const sortOrder = ref(-1) // Más reciente primero

// Reactivo: Peso calculado estimado
const calculatedWeight = computed(() => {
  if (!selectedProduct.value) return 0
  const pesoPieza = parseFloat(selectedProduct.value.peso_x_pieza) || 0
  const cantidad = parseInt(form.value.piezas, 10) || 0
  return pesoPieza * cantidad
})

// Acciones de Autocompletado de Producto
const handleProductInput = () => {
  const code = productSearchInput.value.trim()
  const found = catalogProducts.value.find(p => p.codigo === code)
  if (found) {
    selectedProduct.value = found
    form.value.codigo = found.codigo
  } else {
    selectedProduct.value = null
    form.value.codigo = ''
  }
}

// Carga Inicial
const fetchInitialData = async () => {
  loadingProducts.value = true
  loadingIngresos.value = true
  try {
    // 1. Catálogo
    const resProd = await fetch('/api/productos')
    if (resProd.ok) {
      catalogProducts.value = await resProd.json()
    } else {
      showAlert('Error al cargar catálogo de productos', 'error')
    }

    // 2. Historial de Ingresos
    await fetchIngresosHistory()
  } catch (error) {
    console.error('Error fetching data:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loadingProducts.value = false
    loadingIngresos.value = false
  }
}

// Obtener Historial
const fetchIngresosHistory = async () => {
  loadingIngresos.value = true
  try {
    const res = await fetch('/api/productos/ingresos-proveedores')
    if (res.ok) {
      ingresos.value = await res.json()
    } else {
      showAlert('Error al cargar historial de ingresos', 'error')
    }
  } catch (error) {
    console.error('Error fetching ingresos:', error)
  } finally {
    loadingIngresos.value = false
  }
}

// Envío del Formulario
const submitProveedorForm = async () => {
  if (!form.value.codigo || !form.value.vencimiento || form.value.piezas <= 0) {
    showAlert('Por favor complete todos los campos obligatorios.', 'error')
    return
  }

  submitting.value = true
  try {
    const res = await fetch('/api/productos/ingresar-proveedor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: form.value.codigo,
        piezas: form.value.piezas,
        vencimiento: form.value.vencimiento,
        proveedor: form.value.proveedor
      })
    })

    const data = await res.json()

    if (res.ok) {
      showAlert(`Ingreso registrado con éxito: se sumaron ${form.value.piezas} piezas (${calculatedWeight.value.toFixed(3)} kg) al stock de ${selectedProduct.value.nombre}.`, 'success')
      
      // Limpiamos campos específicos del formulario
      // Conservamos 'proveedor' por comodidad de cargas múltiples
      form.value.codigo = ''
      form.value.piezas = 1
      form.value.vencimiento = ''
      productSearchInput.value = ''
      selectedProduct.value = null

      // Refrescar historial e info de productos
      fetchInitialData()
    } else {
      showAlert(data.error || 'Error al procesar el ingreso de proveedor.', 'error')
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    showAlert('Error de red al intentar comunicarse con el servidor.', 'error')
  } finally {
    submitting.value = false
  }
}

// Alertas
const showAlert = (message, type = 'success') => {
  alert.value = { show: true, message, type }
  // Desvanecer alertas cortas que no sean errores graves
  if (type !== 'error') {
    setTimeout(() => {
      alert.value.show = false
    }, 4500)
  }
}

// Formateadores de fecha
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

// Determinar el estilo de la fecha de vencimiento cargada en el log
const getVencimientoClass = (vencimientoStr) => {
  if (!vencimientoStr) return ''
  const venc = new Date(vencimientoStr)
  const hoy = new Date()
  hoy.setHours(0,0,0,0)
  venc.setHours(0,0,0,0)
  
  const diffDays = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 7) return 'critical'
  if (diffDays <= 30) return 'warning'
  return 'safe'
}

// Búsqueda y Ordenación Reactiva
const filteredAndSortedIngresos = computed(() => {
  let result = [...ingresos.value]

  // Buscar
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(ing => {
      const idMatch = ing.id ? ing.id.toString().includes(query) : false
      const provMatch = ing.proveedor ? ing.proveedor.toLowerCase().includes(query) : false
      const codeMatch = ing.codigo_producto ? ing.codigo_producto.toLowerCase().includes(query) : false
      const nameMatch = ing.Producto?.nombre ? ing.Producto.nombre.toLowerCase().includes(query) : false
      return idMatch || provMatch || codeMatch || nameMatch
    })
  }

  // Ordenar
  if (sortKey.value) {
    result.sort((a, b) => {
      let valA = a[sortKey.value]
      let valB = b[sortKey.value]

      if (valA === undefined || valA === null) valA = ''
      if (valB === undefined || valB === null) valB = ''

      const isNumeric = !isNaN(parseFloat(valA)) && isFinite(valA) && !isNaN(parseFloat(valB)) && isFinite(valB)

      if (isNumeric) {
        return (parseFloat(valA) - parseFloat(valB)) * sortOrder.value
      } else {
        return valA.toString().localeCompare(valB.toString(), undefined, { numeric: true }) * sortOrder.value
      }
    })
  }

  return result
})

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

// Ciclo de Vida
onMounted(() => {
  fetchInitialData()
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

/* Estilos de vencimiento en el log histórico */
.vencimiento-badge {
  display: inline-block;
  padding: 2px 6px;
  font-weight: bold;
  font-size: 0.8rem;
  border-radius: 2px;
  border: 1px solid var(--bevel-dark);
}

.vencimiento-badge.expired {
  background-color: rgba(204, 0, 0, 0.1);
  color: #cc0000;
  border-color: #cc0000;
}

.vencimiento-badge.critical {
  background-color: rgba(255, 153, 0, 0.1);
  color: #e67e22;
  border-color: #e67e22;
}

.vencimiento-badge.warning {
  background-color: rgba(30, 110, 200, 0.1);
  color: #1e6ec8;
  border-color: #1e6ec8;
}

.vencimiento-badge.safe {
  background-color: rgba(56, 118, 29, 0.1);
  color: #38761d;
  border-color: #38761d;
}
</style>
