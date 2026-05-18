<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Ingreso de Recortes</h2>
        <p class="page-description">Registra el ingreso manual de recortes y mermas por sucursal para actualizar el stock.</p>
      </div>
    </div>

    <!-- Mensajes de Estado (Estilo Ventana Clásica) -->
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
      <!-- Formulario de Registro -->
      <div class="card">
        <div class="card-header" style="background-color: #0b5394;">
          <span class="card-title" style="color: white; font-weight: bold;">Formulario de Ingreso</span>
        </div>
        <div class="card-body">
          <form @submit.prevent="handleSubmit">
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              
              <!-- Fila 1: Sucursal y Fecha -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Sucursal / Origen *</label>
                  <input 
                    type="text" 
                    v-model="form.sucursal" 
                    class="form-control" 
                    placeholder="Ej: Sucursal Centro" 
                    required 
                    style="height: 32px;"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Fecha de Ingreso *</label>
                  <input 
                    type="date" 
                    v-model="form.fecha" 
                    class="form-control" 
                    required 
                    style="height: 32px;"
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
                    style="padding-left: 2rem; height: 32px;"
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

              <!-- Botón Guardar -->
              <div style="margin-top: 0.5rem; display: flex; justify-content: flex-end;">
                <button 
                  type="submit" 
                  class="btn btn-primary btn-lg" 
                  :disabled="saving"
                  style="width: 100%; height: 42px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: bold; font-size: 0.95rem;"
                >
                  <i class="ph ph-spinner spinner" v-if="saving"></i>
                  <i class="ph ph-floppy-disk" v-else></i>
                  {{ saving ? 'Guardando Registro...' : 'Guardar y Dar de Alta' }}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>

      <!-- Resumen / Historial de ingresos de la sesión -->
      <div class="card">
        <div class="card-header" style="background-color: var(--bevel-dark);">
          <span class="card-title" style="color: white; font-weight: bold;">Ingresos Recientes (Esta Sesión)</span>
        </div>
        <div class="table-container" style="max-height: 320px; overflow-y: auto;">
          <table>
            <thead>
              <tr>
                <th style="font-size: 0.75rem;">Fecha</th>
                <th style="font-size: 0.75rem;">Sucursal</th>
                <th style="font-size: 0.75rem;">Producto</th>
                <th style="font-size: 0.75rem; text-align: right;">Peso Ingresado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in localHistory" :key="index" class="animate-fade">
                <td style="font-size: 0.75rem;">{{ item.fecha }}</td>
                <td style="font-size: 0.75rem;">{{ item.sucursal }}</td>
                <td style="font-size: 0.75rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <strong>{{ item.codigo }}</strong> - {{ item.nombre }}
                </td>
                <td style="font-size: 0.75rem; text-align: right;" class="text-red fw-bold">
                  {{ item.peso.toFixed(3) }} kg
                </td>
              </tr>
              <tr v-if="localHistory.length === 0">
                <td colspan="4" class="empty-state" style="padding: 2rem 1rem;">
                  <i class="ph ph-scissors icon-xl mb-2" style="color: var(--text-muted);"></i>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">No has ingresado recortes en esta sesión de trabajo.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Estado del formulario
const form = ref({
  sucursal: '',
  fecha: new Date().toISOString().split('T')[0],
  codigo: '',
  peso: null
})

const productSearchInput = ref('')
const selectedProduct = ref(null)
const catalogProducts = ref([])
const localHistory = ref([])

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

// Escuchar cambios en la búsqueda
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

// Enviar formulario al endpoint
const handleSubmit = async () => {
  if (!form.value.codigo) {
    showAlert('Por favor, selecciona un producto válido de la lista.', 'error')
    return
  }

  if (!form.value.peso || form.value.peso <= 0) {
    showAlert('El peso debe ser mayor a 0 kg.', 'error')
    return
  }

  saving.value = true
  try {
    const res = await fetch('/api/productos/ingresar-recorte', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigo: form.value.codigo,
        peso: parseFloat(form.value.peso),
        sucursal: form.value.sucursal,
        fecha: form.value.fecha
      })
    })

    const data = await res.json()

    if (res.ok) {
      showAlert(`Recorte registrado con éxito: se sumaron ${parseFloat(form.value.peso).toFixed(3)} kg a ${selectedProduct.value.nombre}.`)
      
      // Agregar al historial local de la sesión
      localHistory.value.unshift({
        fecha: form.value.fecha,
        sucursal: form.value.sucursal,
        codigo: form.value.codigo,
        nombre: selectedProduct.value.nombre,
        peso: parseFloat(form.value.peso)
      })

      // Reiniciar campos menos sucursal y fecha para mayor rapidez en cargas sucesivas
      form.value.peso = null
      form.value.codigo = ''
      productSearchInput.value = ''
      selectedProduct.value = null
    } else {
      showAlert(data.error || 'Error al registrar el recorte', 'error')
    }
  } catch (error) {
    console.error('Error saving recorte:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchCatalogProducts()
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
    grid-template-columns: 7fr 5fr;
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
