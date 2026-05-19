<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Ingreso de Recortes</h2>
        <p class="page-description">Registra ingresos de recortes y mermas por sucursal de forma masiva para actualizar el stock.</p>
      </div>
    </div>

    <!-- Mensajes de Estado -->
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

    <div class="grid-layout">
      <!-- Formulario de Registro (Izquierda) -->
      <div class="card">
        <div class="card-header" style="background-color: #0b5394;">
          <span class="card-title" style="color: white; font-weight: bold;">Formulario de Ingreso</span>
        </div>
        <div class="card-body">
          <form @submit.prevent="addItemToList">
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              
              <!-- Fila 1: Sucursal y Fecha -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Sucursal / Origen *</label>
                  <select 
                    v-model="form.id_sucursal" 
                    class="form-control" 
                    required 
                    style="height: 34px; padding: 0 0.5rem;"
                  >
                    <option :value="null" disabled>Seleccione Sucursal</option>
                    <option v-for="suc in sucursales" :key="suc.id" :value="suc.id">
                      {{ suc.sucursal }} {{ suc.numero ? `(${suc.numero})` : '' }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Fecha de Ingreso *</label>
                  <input 
                    type="date" 
                    v-model="form.fecha" 
                    class="form-control" 
                    required 
                    style="height: 34px;"
                  />
                </div>
              </div>

              <!-- Fila 2: Producto Searchable Datalist -->
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
                >
                  <i class="ph ph-circle-wavy-check text-green" style="font-size: 1rem;"></i>
                  <span>
                    Seleccionado: <strong>{{ selectedProduct.nombre }}</strong> (Código: <strong>{{ selectedProduct.codigo }}</strong>)
                  </span>
                </div>
              </div>

              <!-- Fila 3: Peso (kg) -->
              <div class="form-group">
                <label class="form-label">Peso del Recorte (kg) *</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <input 
                    type="number" 
                    step="0.001" 
                    min="0.001" 
                    v-model.number="form.peso" 
                    class="form-control text-right font-mono text-xl" 
                    placeholder="0,000" 
                    required 
                    style="padding-right: 2.5rem; font-weight: bold; height: 40px;"
                  />
                  <span style="position: absolute; right: 0.8rem; font-weight: bold; color: var(--text-muted);">kg</span>
                </div>
              </div>

              <!-- Botón Agregar a la lista temporal -->
              <div style="margin-top: 0.5rem; display: flex; justify-content: flex-end;">
                <button 
                  type="submit" 
                  class="btn btn-secondary btn-lg" 
                  style="width: 100%; height: 42px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: bold; font-size: 0.95rem; border: 1px dashed #0b5394; color: #0b5394; background-color: rgba(11, 83, 148, 0.05);"
                >
                  <i class="ph ph-plus-circle"></i>
                  Agregar a la Lista de Envíos
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>

      <!-- Sección Derecha: Lote a enviar e Historial de la sesión -->
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        
        <!-- Lista de Ingresos Preparados (Lote temporal) -->
        <div class="card">
          <div class="card-header" style="background-color: var(--color-primary, #2b3e50); display: flex; justify-content: space-between; align-items: center;">
            <span class="card-title" style="color: white; font-weight: bold;">Lote Preparado (Pendiente de Guardar)</span>
            <span class="badge" style="background-color: white; color: var(--color-primary, #2b3e50); font-weight: bold;">
              {{ pendingList.length }} ítems
            </span>
          </div>
          <div class="table-container" style="max-height: 250px; overflow-y: auto;">
            <table>
              <thead>
                <tr>
                  <th style="font-size: 0.75rem;">Sucursal</th>
                  <th style="font-size: 0.75rem;">Producto</th>
                  <th style="font-size: 0.75rem; text-align: right;">Peso</th>
                  <th style="font-size: 0.75rem; text-align: center; width: 60px;">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in pendingList" :key="index" class="animate-fade">
                  <td style="font-size: 0.75rem;">{{ item.sucursal_nombre }}</td>
                  <td style="font-size: 0.75rem; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <strong>{{ item.id_producto }}</strong> - {{ item.producto_nombre }}
                  </td>
                  <td style="font-size: 0.75rem; text-align: right;" class="fw-bold">
                    {{ item.peso_recorte.toFixed(3) }} kg
                  </td>
                  <td style="font-size: 0.75rem; text-align: center;">
                    <button class="btn-icon btn-delete" style="padding: 2px;" @click="removeItemFromList(index)" title="Quitar">
                      <i class="ph ph-minus-circle" style="font-size: 1.1rem; color: #cc0000;"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="pendingList.length === 0">
                  <td colspan="4" class="empty-state" style="padding: 2.5rem 1rem;">
                    <i class="ph ph-list-plus icon-xl mb-2" style="color: var(--text-muted); opacity: 0.6;"></i>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">No hay registros en el lote. Completa el formulario y agrégalos.</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-if="pendingList.length > 0" class="card-footer" style="padding: 0.75rem 1rem; background-color: var(--bg-secondary); border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
            <button 
              class="btn btn-primary" 
              @click="submitBatch" 
              :disabled="saving"
              style="height: 38px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: bold; width: 100%;"
            >
              <i class="ph ph-spinner spinner" v-if="saving"></i>
              <i class="ph ph-cloud-arrow-up" v-else></i>
              {{ saving ? 'Guardando Lote...' : 'Confirmar e Ingresar Lote Completo' }}
            </button>
          </div>
        </div>

        <!-- Historial General de Ingresos -->
        <div class="card">
          <div class="card-header" style="background-color: var(--color-primary, #2b3e50); display: flex; justify-content: space-between; align-items: center;">
            <span class="card-title" style="color: white; font-weight: bold;">Historial de Ingresos de Recortes</span>
            <button class="btn btn-secondary btn-sm" @click="fetchIngresosHistory" :disabled="loadingHistory" style="height: 24px; padding: 0 0.5rem; font-size: 0.7rem; border-color: rgba(255,255,255,0.3); color: white; background: rgba(255,255,255,0.1);">
              <i class="ph ph-spinner spinner" v-if="loadingHistory"></i>
              <i class="ph ph-arrows-clockwise" v-else></i>
            </button>
          </div>
          <div class="table-container" style="max-height: 280px; overflow-y: auto;">
            <table>
              <thead>
                <tr>
                  <th style="font-size: 0.75rem;">Fecha</th>
                  <th style="font-size: 0.75rem;">Sucursal</th>
                  <th style="font-size: 0.75rem;">Producto</th>
                  <th style="font-size: 0.75rem; text-align: right;">Peso</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in historyList" :key="item.id || index" class="animate-fade">
                  <td style="font-size: 0.75rem;">{{ formatDate(item.fecha) }}</td>
                  <td style="font-size: 0.75rem;">
                    {{ item.Sucursal ? `${item.Sucursal.sucursal} ${item.Sucursal.numero ? `(${item.Sucursal.numero})` : ''}` : 'Desconocido' }}
                  </td>
                  <td style="font-size: 0.75rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="item.Producto ? item.Producto.nombre : ''">
                    <strong>{{ item.id_producto }}</strong> - {{ item.Producto ? item.Producto.nombre : 'Desconocido' }}
                  </td>
                  <td style="font-size: 0.75rem; text-align: right;" class="text-red fw-bold">
                    {{ parseFloat(item.peso_recorte).toFixed(3) }} kg
                  </td>
                </tr>
                <tr v-if="historyList.length === 0">
                  <td colspan="4" class="empty-state" style="padding: 2.5rem 1rem;">
                    <i class="ph ph-clock-counter-clockwise icon-xl mb-2" style="color: var(--text-muted); opacity: 0.6;"></i>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">No hay ingresos de recortes registrados en el historial.</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Estado del formulario
const form = ref({
  id_sucursal: null,
  fecha: new Date().toISOString().split('T')[0],
  codigo: '',
  peso: null
})

const productSearchInput = ref('')
const selectedProduct = ref(null)

// Catálogos e Historiales
const catalogProducts = ref([])
const sucursales = ref([])
const pendingList = ref([])
const historyList = ref([])
const loadingHistory = ref(false)

const saving = ref(false)
const alert = ref({ show: false, message: '', type: 'success' })

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 5000)
}

// Cargar catálogo de productos
const fetchCatalogProducts = async () => {
  try {
    const res = await fetch('/api/productos')
    if (res.ok) {
      catalogProducts.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching catalog products:', error)
  }
}

// Cargar catálogo de sucursales
const fetchSucursales = async () => {
  try {
    const res = await fetch('/api/sucursales')
    if (res.ok) {
      sucursales.value = await res.json()
      if (sucursales.value.length > 0) {
        form.value.id_sucursal = sucursales.value[0].id
      }
    }
  } catch (error) {
    console.error('Error fetching sucursales:', error)
  }
}

// Escuchar cambios en la búsqueda del producto
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

// Agregar ítem actual a la lista temporal
const addItemToList = () => {
  if (!form.value.id_sucursal) {
    showAlert('Por favor, selecciona una sucursal de origen.', 'error')
    return
  }

  if (!form.value.codigo) {
    showAlert('Por favor, selecciona un producto válido del catálogo.', 'error')
    return
  }

  if (!form.value.peso || form.value.peso <= 0) {
    showAlert('El peso del recorte debe ser mayor a 0 kg.', 'error')
    return
  }

  const selectedSuc = sucursales.value.find(s => s.id === form.value.id_sucursal)
  const selectedProd = catalogProducts.value.find(p => p.codigo === form.value.codigo)

  // Agregar al lote
  pendingList.value.push({
    id_sucursal: form.value.id_sucursal,
    sucursal_nombre: selectedSuc ? `${selectedSuc.sucursal} ${selectedSuc.numero ? `(${selectedSuc.numero})` : ''}` : 'Desconocido',
    id_producto: form.value.codigo,
    producto_nombre: selectedProd ? selectedProd.nombre : 'Desconocido',
    peso_recorte: parseFloat(form.value.peso),
    fecha: form.value.fecha
  })

  // Limpiar campos de producto y peso para la siguiente carga, reteniendo sucursal y fecha
  form.value.peso = null
  form.value.codigo = ''
  productSearchInput.value = ''
  selectedProduct.value = null

  showAlert('Registro agregado al lote preparado.', 'info')
}

// Quitar un ítem de la lista temporal
const removeItemFromList = (index) => {
  pendingList.value.splice(index, 1)
  showAlert('Registro removido del lote.', 'info')
}

// Enviar todo el lote preparado al backend
const submitBatch = async () => {
  if (pendingList.value.length === 0) {
    showAlert('No hay registros en el lote para guardar.', 'error')
    return
  }

  saving.value = true
  try {
    const res = await fetch('/api/ingreso-recortes/masivo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pendingList.value)
    })

    const data = await res.json()

    if (res.ok) {
      showAlert(`Lote de recortes guardado con éxito. Se procesaron ${pendingList.value.length} registros y se actualizó el stock.`)
      
      // Limpiar lote
      pendingList.value = []
      
      // Cargar historial de base de datos actualizado
      await fetchIngresosHistory()
    } else {
      showAlert(data.error || 'Error al guardar el lote de recortes', 'error')
    }
  } catch (error) {
    console.error('Error saving batch of recortes:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    saving.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

const fetchIngresosHistory = async () => {
  loadingHistory.value = true
  try {
    const res = await fetch('/api/ingreso-recortes')
    if (res.ok) {
      historyList.value = await res.json()
    } else {
      console.error('Error al obtener el historial de recortes')
    }
  } catch (error) {
    console.error('Error fetching recortes history:', error)
  } finally {
    loadingHistory.value = false
  }
}

onMounted(() => {
  fetchCatalogProducts()
  fetchSucursales()
  fetchIngresosHistory()
})
</script>

<script>
export default {
  name: 'RecepcionRecortes'
}
</script>

<style scoped>
.grid-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .grid-layout {
    grid-template-columns: 5fr 6fr;
  }
}

.selected-product-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background-color: var(--accent-success-light);
  border: 1px solid var(--accent-success);
  font-size: 0.8rem;
  color: var(--text-primary);
  margin-top: 0.5rem;
}

.font-mono {
  font-family: 'Courier New', Courier, monospace;
}

.text-xl {
  font-size: 1.25rem;
}

.text-red {
  color: #cc0000;
}
</style>
