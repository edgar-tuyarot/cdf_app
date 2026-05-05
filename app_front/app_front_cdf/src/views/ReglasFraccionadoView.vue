<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseSelect from '../components/BaseSelect.vue'
import BaseCheckbox from '../components/BaseCheckbox.vue'

const fraccionados = ref([])
const productos = ref([])
const proveedores = ref([])
const isLoading = ref(true)
const error = ref('')

const isEditing = ref(false)
const showModal = ref(false)
const showProductModal = ref(false)

const form = ref({
  id: null,
  codigoProductoOriginal: '',
  codigoProducto: ''
})

const productForm = ref({
  codigo: '',
  nombre: '',
  picable: false,
  feteable: false,
  kilosPorBolsita: '',
  proveedorId: ''
})

const fetchInitialData = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const [fracRes, prodRes, provRes] = await Promise.all([
      fetch('/api/fraccionados'),
      fetch('/api/productos'),
      fetch('/api/proveedores')
    ])
    
    if (!fracRes.ok || !prodRes.ok) throw new Error('Error al cargar datos')
    
    fraccionados.value = await fracRes.json()
    productos.value = await prodRes.json()
    
    if (provRes.ok) {
      const provData = await provRes.json()
      proveedores.value = provData.map(p => ({ value: p.id, label: p.nombre }))
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchInitialData)

const getProductName = (codigo) => {
  const p = productos.value.find(p => p.codigo === codigo)
  return p ? p.nombre : 'Producto no encontrado'
}

const productosOptions = computed(() => {
  return productos.value.map(p => ({
    value: p.codigo,
    label: `${p.codigo} - ${p.nombre}`
  }))
})

const openNewModal = () => {
  form.value = { id: null, codigoProductoOriginal: '', codigoProducto: '' }
  isEditing.value = false
  showModal.value = true
}

const editRule = (rule) => {
  form.value = { ...rule }
  isEditing.value = true
  showModal.value = true
}

const deleteRule = async (id) => {
  if (!confirm('¿Estás seguro de eliminar esta regla?')) return
  try {
    const res = await fetch(`/api/fraccionados/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error al eliminar')
    await fetchInitialData()
  } catch (err) {
    alert(err.message)
  }
}

const checkProductAndSave = async () => {
  // Check if new product exists
  const exists = productos.value.some(p => p.codigo === form.value.codigoProducto)
  if (!exists) {
    productForm.value.codigo = form.value.codigoProducto
    showProductModal.value = true
    return
  }
  
  saveRule()
}

const saveRule = async () => {
  try {
    const method = isEditing.value ? 'PUT' : 'POST'
    const url = isEditing.value ? `/api/fraccionados/${form.value.id}` : '/api/fraccionados'
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    
    if (!res.ok) throw new Error('Error al guardar la regla')
    
    showModal.value = false
    await fetchInitialData()
  } catch (err) {
    alert(err.message)
  }
}

const createProduct = async () => {
  try {
    const response = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...productForm.value,
        kilosPorBolsita: parseFloat(productForm.value.kilosPorBolsita) || 0,
        proveedorId: Number(productForm.value.proveedorId)
      })
    })

    if (!response.ok) throw new Error('Error al dar de alta el producto')

    showProductModal.value = false
    await fetchInitialData() // refresh products
    
    // Continue saving the rule
    await saveRule()
  } catch (err) {
    alert(err.message)
  }
}

const closeAllModals = () => {
  showModal.value = false
  showProductModal.value = false
}

</script>

<template>
  <div class="reglas-view">
    <header class="view-header">
      <div class="header-main">
        <div>
          <h2>Reglas de Fraccionado</h2>
          <p>Gestionar las reglas de conversión de productos</p>
        </div>
        <BaseButton @click="openNewModal">Nueva Regla</BaseButton>
      </div>
    </header>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando reglas...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <BaseButton @click="fetchInitialData">Reintentar</BaseButton>
    </div>

    <div v-else class="table-wrapper">
      <table class="modern-table">
        <thead>
          <tr>
            <th>Producto Original</th>
            <th>Producto Nuevo (Fraccionado)</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in fraccionados" :key="r.id">
            <td>
              <strong>{{ r.codigoProductoOriginal }}</strong> - {{ getProductName(r.codigoProductoOriginal) }}
            </td>
            <td>
              <strong>{{ r.codigoProducto }}</strong> - {{ getProductName(r.codigoProducto) }}
            </td>
            <td class="text-right actions-cell">
              <BaseButton variant="minimal" size="small" @click="editRule(r)">Editar</BaseButton>
              <BaseButton variant="minimal" size="small" @click="deleteRule(r.id)" class="text-danger">Eliminar</BaseButton>
            </td>
          </tr>
          <tr v-if="fraccionados.length === 0">
            <td colspan="3" class="empty-state">No hay reglas de fraccionamiento configuradas.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Regla -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeAllModals">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Editar Regla' : 'Nueva Regla' }}</h3>
        
        <form @submit.prevent="checkProductAndSave" class="modal-form">
          <BaseSelect 
            v-model="form.codigoProductoOriginal"
            label="Producto Original *"
            :options="productosOptions"
            required
          />
          
          <div class="input-group">
            <BaseInput 
              v-model="form.codigoProducto"
              label="Código Nuevo (Fraccionado) *"
              placeholder="Ej: 8011"
              required
            />
            <p class="help-text">Si ingresas un código que no existe, se te pedirá crearlo.</p>
          </div>

          <div class="modal-actions">
            <BaseButton type="button" variant="secondary" @click="showModal = false">Cancelar</BaseButton>
            <BaseButton type="submit">Continuar</BaseButton>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Nuevo Producto -->
    <div v-if="showProductModal" class="modal-overlay" @click.self="showProductModal = false">
      <div class="modal-content">
        <h3>El producto no existe</h3>
        <p class="subtitle">Completa los datos para dar de alta el producto <strong>{{ productForm.codigo }}</strong></p>
        
        <form @submit.prevent="createProduct" class="modal-form">
          <BaseInput 
            v-model="productForm.nombre" 
            label="Nombre del Producto *" 
            required
          />
          <BaseSelect 
            v-model="productForm.proveedorId" 
            label="Proveedor *" 
            :options="proveedores"
            required
          />
          <div class="checkbox-group">
            <BaseCheckbox v-model="productForm.picable" label="¿Es picable?" />
            <BaseCheckbox v-model="productForm.feteable" label="¿Es feteable?" />
          </div>
          <BaseInput 
            v-model="productForm.kilosPorBolsita" 
            label="Kilos por Bolsita *" 
            type="number" step="0.001" required
          />
          <div class="modal-actions">
            <BaseButton type="button" variant="secondary" @click="showProductModal = false">Cancelar</BaseButton>
            <BaseButton type="submit">Crear Producto y Guardar Regla</BaseButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-header {
  margin-bottom: var(--space-lg);
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-wrapper {
  overflow-x: auto;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table th {
  text-align: left;
  padding: 16px;
  background: #FAFAFA;
  border-bottom: 2px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modern-table td {
  padding: 16px;
  border-bottom: 1px solid #EEE;
}

.text-right { text-align: right; }
.text-danger { color: #D32F2F !important; }

.actions-cell {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 32px !important;
  color: var(--color-text-muted);
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
  color: var(--color-text-muted);
}

.spinner {
  width: 40px; height: 40px;
  border: 4px solid #EEE;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: var(--radius-md);
  padding: 24px;
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--color-text);
}

.subtitle {
  margin-top: -8px;
  margin-bottom: 16px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  margin-bottom: 0;
}

.help-text {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.checkbox-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
</style>
