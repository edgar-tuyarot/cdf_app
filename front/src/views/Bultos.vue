<template>
  <div class="page-container animate-fade">
    <!-- Encabezado de Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title"><i class="ph ph-box-multiple"></i> Gestión de Bultos</h2>
        <p class="page-description">Define configuraciones de empaque (cajas, cajones) con pesos y cantidades fijas por proveedor.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem;">
        <button class="btn btn-secondary" @click="fetchData" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar
        </button>
        <button class="btn btn-primary" @click="openModal()">
          <i class="ph ph-plus"></i> Nuevo Bulto
        </button>
      </div>
    </div>

    <!-- Mensajes de Estado -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
      <button class="alert-close" @click="alert.show = false"><i class="ph ph-x"></i></button>
    </div>

    <!-- Buscador y Tabla de Bultos -->
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="card-title">Listado de Bultos Activos</span>
        <div style="position: relative; display: flex; align-items: center; width: 280px;">
          <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar por nombre o producto..." 
            class="form-control" 
            style="padding-left: 2rem; height: 28px; font-size: 0.8rem;"
          />
        </div>
      </div>

      <div class="table-container" style="max-height: 520px; overflow-y: auto;">
        <table v-if="!loading && filteredBultos.length > 0" class="access-table">
          <thead>
            <tr>
              <th style="width: 60px;">ID</th>
              <th>Nombre del Bulto</th>
              <th>Producto Asociado</th>
              <th>Proveedor</th>
              <th class="text-right" style="width: 120px;">Peso Caja (Ref.)</th>
              <th class="text-right" style="width: 120px;">Caja Vacía (Tara)</th>
              <th class="text-right" style="width: 110px;">Cant. Piezas</th>
              <th class="text-center" style="width: 120px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in filteredBultos" :key="b.id">
              <td><strong>#{{ b.id }}</strong></td>
              <td>{{ b.nombre }}</td>
              <td>
                <span class="badge" style="background-color: var(--accent-primary-light); color: var(--accent-primary); border: 1px solid var(--accent-primary); font-family: monospace; font-size: 0.72rem; padding: 1px 4px; margin-right: 4px;">
                  {{ b.codigo_producto }}
                </span>
                {{ b.Producto?.nombre || 'Producto desconocido' }}
              </td>
              <td>
                <span class="badge" style="background-color: var(--bevel-dark); color: var(--text-primary); font-size: 0.72rem; padding: 1px 5px;">
                  <i class="ph ph-handshake" style="font-size: 0.75rem;"></i> {{ b.Proveedor?.nombre || 'Sin Proveedor' }}
                </span>
              </td>
              <td class="text-right"><strong>{{ parseFloat(b.peso_caja).toFixed(3) }} kg</strong></td>
              <td class="text-right" style="color: var(--accent-error);">{{ parseFloat(b.peso_caja_vacia || 0).toFixed(3) }} kg</td>
              <td class="text-right">{{ b.cantidad_piezas }} ud</td>
              <td class="text-center">
                <div style="display: flex; gap: 0.25rem; justify-content: center;">
                  <button class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size: 0.72rem;" @click="openModal(b)">
                    Editar
                  </button>
                  <button class="btn btn-danger btn-sm" style="padding: 2px 6px; font-size: 0.72rem; background: var(--accent-error); border-color: var(--accent-error); color: white;" @click="confirmDelete(b)">
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Sin Resultados -->
        <div v-else-if="!loading" class="loading-state padding-lg text-center">
          <i class="ph ph-box-multiple icon-xl text-muted"></i>
          <p class="text-xs text-muted mt-2">No se encontraron bultos configurados.</p>
        </div>

        <!-- Cargando -->
        <div v-else class="loading-state padding-lg text-center">
          <i class="ph ph-spinner spinner icon-xl text-primary"></i>
          <p class="text-xs text-muted mt-2">Cargando bultos...</p>
        </div>
      </div>
    </div>

    <!-- MODAL DE CREACIÓN / EDICIÓN -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @mousedown.self="closeModal">
        <div class="modal-card" style="max-width: 480px; width: 95vw;">
          <div class="modal-header">
            <h3 class="modal-title">{{ isEditing ? 'Editar Bulto' : 'Nuevo Bulto' }}</h3>
            <button class="icon-btn" @click="closeModal"><i class="ph ph-x"></i></button>
          </div>
          <form @submit.prevent="saveBulto">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem;">
              
              <div class="form-group">
                <label class="form-label">Nombre / Descripción del Bulto *</label>
                <input 
                  type="text" 
                  v-model="form.nombre" 
                  class="form-control" 
                  placeholder="Ej: Caja 4 hormas Gouda" 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Proveedor *</label>
                <select v-model="form.id_proveedor" class="form-control" required style="height: 34px;">
                  <option value="" disabled>Seleccione proveedor...</option>
                  <option v-for="prov in proveedores" :key="prov.id" :value="prov.id">
                    {{ prov.nombre }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Producto Asociado *</label>
                <select v-model="form.codigo_producto" class="form-control" required style="height: 34px;">
                  <option value="" disabled>Seleccione producto...</option>
                  <option v-for="prod in productos" :key="prod.codigo" :value="prod.codigo">
                    [{{ prod.codigo }}] - {{ prod.nombre }}
                  </option>
                </select>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <div class="form-group">
                  <label class="form-label">Peso Caja Llena (Ref. kg)</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    v-model.number="form.peso_caja" 
                    class="form-control" 
                    placeholder="20.000" 
                    min="0"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Caja de Cartón Vacía (Tara kg) *</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    v-model.number="form.peso_caja_vacia" 
                    class="form-control" 
                    placeholder="0.500" 
                    min="0"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Piezas en la Caja *</label>
                <input 
                  type="number" 
                  v-model.number="form.cantidad_piezas" 
                  class="form-control" 
                  placeholder="4" 
                  min="1"
                  required 
                />
              </div>

            </div>
            <div class="modal-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end; width: 100%;">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <i class="ph ph-spinner spinner" v-if="saving"></i>
                <i class="ph ph-floppy-disk" v-else></i> Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal Confirmación Eliminar -->
    <Teleport to="body">
      <div v-if="itemToDelete" class="win-dialog-overlay" @mousedown.self="itemToDelete = null">
        <div class="win-dialog" style="max-width: 380px;">
          <div class="win-dialog-titlebar">Eliminar Bulto</div>
          <div class="win-dialog-body" style="padding: 1rem;">
            ¿Estás seguro de que deseas eliminar la configuración del bulto <strong>{{ itemToDelete.nombre }}</strong>?<br><br>
            Dejará de aparecer en la lista para altas rápidas de mercadería.
          </div>
          <div class="win-dialog-footer">
            <button class="btn btn-secondary btn-sm" @click="itemToDelete = null">Cancelar</button>
            <button class="btn btn-danger btn-sm" style="background: var(--accent-error); border-color: var(--accent-error); color: white;" @click="deleteBulto">Confirmar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const bultos = ref([])
const productos = ref([])
const proveedores = ref([])

const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const itemToDelete = ref(null)

const searchQuery = ref('')
const alert = ref({ show: false, message: '', type: 'success' })

const form = ref({
  id: null,
  nombre: '',
  codigo_producto: '',
  id_proveedor: '',
  peso_caja: '',
  peso_caja_vacia: '',
  cantidad_piezas: ''
})

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => {
    alert.value.show = false
  }, 4000)
}

const fetchData = async () => {
  loading.value = true
  try {
    const [resBultos, resProd, resProv] = await Promise.all([
      fetch('/api/bultos'),
      fetch('/api/productos'),
      fetch('/api/proveedores')
    ])

    if (resBultos.ok) bultos.value = await resBultos.json()
    if (resProd.ok) {
      // Excluir insumos y mantener ordenados
      const allProds = await resProd.json()
      productos.value = allProds
        .filter(p => !(p.codigo || '').toUpperCase().startsWith('INSU'))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    }
    if (resProv.ok) proveedores.value = await resProv.json()
  } catch (error) {
    console.error('Error fetching data:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

const filteredBultos = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return bultos.value

  return bultos.value.filter(b => {
    return b.nombre?.toLowerCase().includes(q) || 
           b.Producto?.nombre?.toLowerCase().includes(q) ||
           b.codigo_producto?.toLowerCase().includes(q) ||
           b.Proveedor?.nombre?.toLowerCase().includes(q)
  })
})

const openModal = (bulto = null) => {
  if (bulto) {
    isEditing.value = true
    form.value = {
      id: bulto.id,
      nombre: bulto.nombre,
      codigo_producto: bulto.codigo_producto,
      id_proveedor: bulto.id_proveedor,
      peso_caja: bulto.peso_caja,
      peso_caja_vacia: bulto.peso_caja_vacia,
      cantidad_piezas: bulto.cantidad_piezas
    }
  } else {
    isEditing.value = false
    form.value = {
      id: null,
      nombre: '',
      codigo_producto: '',
      id_proveedor: proveedores.value[0]?.id || '',
      peso_caja: '',
      peso_caja_vacia: '',
      cantidad_piezas: ''
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveBulto = async () => {
  if (!form.value.nombre || !form.value.codigo_producto || !form.value.id_proveedor || form.value.peso_caja_vacia === '' || form.value.cantidad_piezas <= 0) {
    showAlert('Complete todos los campos obligatorios.', 'error')
    return
  }

  saving.value = true
  try {
    const method = isEditing.value ? 'PUT' : 'POST'
    const url = isEditing.value ? `/api/bultos/${form.value.id}` : '/api/bultos'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    if (res.ok) {
      showAlert(`Bulto guardado correctamente.`, 'success')
      closeModal()
      fetchData()
    } else {
      const err = await res.json()
      showAlert(err.error || 'Error al guardar bulto.', 'error')
    }
  } catch (error) {
    console.error('Error saving bulto:', error)
    showAlert('Error de red al guardar bulto.', 'error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (bulto) => {
  itemToDelete.value = bulto
}

const deleteBulto = async () => {
  if (!itemToDelete.value) return

  try {
    const res = await fetch(`/api/bultos/${itemToDelete.value.id}`, {
      method: 'DELETE'
    })

    if (res.ok) {
      showAlert('Bulto eliminado con éxito.', 'success')
      itemToDelete.value = null
      fetchData()
    } else {
      showAlert('Error al eliminar bulto.', 'error')
    }
  } catch (error) {
    console.error('Error deleting bulto:', error)
    showAlert('Error de conexión al eliminar.', 'error')
  }
}

onMounted(() => {
  fetchData()
})
</script>
