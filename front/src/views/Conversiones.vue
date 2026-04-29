<script setup>
import { ref, onMounted } from 'vue'
import { useWinDialog } from '../composables/useWinDialog'

const { winConfirm } = useWinDialog()

const activeTab = ref('picadas') // 'picadas' or 'decomisos'
const isLoading = ref(false)
const mensaje = ref({ tipo: '', texto: '' })

const picadas = ref([])
const decomisos = ref([])

const edicion = ref({
  tipo: '', // 'picada' o 'decomiso'
  id: null,
  peso: 0,
  codigo: '',
  motivo: ''
})

const iniciarEdicion = (tipo, item) => {
  edicion.value = {
    tipo,
    id: item.id,
    peso: Number(item.peso) || 0,
    codigo: item.codigo || '',
    motivo: item.motivo || ''
  }
}

const cancelarEdicion = () => {
  edicion.value = { tipo: '', id: null, peso: 0, codigo: '', motivo: '' }
}

const guardarEdicion = async () => {
  const { tipo, id, peso, codigo, motivo } = edicion.value
  const endpoint = tipo === 'picada' ? `/api/feteado/stock-a-picada/${id}` : `/api/feteado/stock-a-decomiso/${id}`
  
  const body = tipo === 'picada' ? { peso } : { codigo, peso, motivo }

  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (res.ok) {
      mostrarMensaje('success', 'Registro actualizado correctamente.')
      if (tipo === 'picada') cargarPicadas()
      else cargarDecomisos()
      cancelarEdicion()
    } else {
      mostrarMensaje('error', 'Error al actualizar el registro.')
    }
  } catch (error) {
    mostrarMensaje('error', 'Error de red.')
  }
}

const mostrarMensaje = (tipo, texto) => {
  mensaje.value = { tipo, texto }
  setTimeout(() => {
    mensaje.value = { tipo: '', texto: '' }
  }, 5000)
}

const formatFecha = (fecha) => {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const cargarPicadas = async () => {
  isLoading.value = true
  try {
    const res = await fetch('/api/feteado/stock-a-picada')
    if (res.ok) {
      picadas.value = await res.json()
    }
  } catch (error) {
    console.error('Error al cargar picadas:', error)
    mostrarMensaje('error', 'Error al cargar los datos de picadas')
  } finally {
    isLoading.value = false
  }
}

const cargarDecomisos = async () => {
  isLoading.value = true
  try {
    const res = await fetch('/api/feteado/stock-a-decomiso')
    if (res.ok) {
      decomisos.value = await res.json()
    }
  } catch (error) {
    console.error('Error al cargar decomisos:', error)
    mostrarMensaje('error', 'Error al cargar los datos de decomisos')
  } finally {
    isLoading.value = false
  }
}

const eliminarPicada = async (id) => {
  if (!id) return
  if (!await winConfirm('¿Estás seguro de eliminar este registro de picada?', 'Eliminar Registro')) return
  try {
    const res = await fetch(`/api/feteado/stock-a-picada/${id}`, { method: 'DELETE' })
    if (res.ok) {
      mostrarMensaje('success', 'Registro eliminado correctamente.')
      cargarPicadas()
    } else {
      mostrarMensaje('error', 'No se pudo eliminar el registro.')
    }
  } catch (error) {
    mostrarMensaje('error', 'Error de red.')
  }
}

const eliminarDecomiso = async (id) => {
  if (!id) return
  if (!await winConfirm('¿Estás seguro de eliminar este registro de decomiso?', 'Eliminar Registro')) return
  try {
    const res = await fetch(`/api/feteado/stock-a-decomiso/${id}`, { method: 'DELETE' })
    if (res.ok) {
      mostrarMensaje('success', 'Registro eliminado correctamente.')
      cargarDecomisos()
    } else {
      mostrarMensaje('error', 'No se pudo eliminar el registro.')
    }
  } catch (error) {
    mostrarMensaje('error', 'Error de red.')
  }
}

const resetearPicadas = async () => {
  if (!await winConfirm('¿Estás seguro de resetear a 0 todos los registros de picadas?', 'Resetear Picadas')) return
  try {
    const res = await fetch('/api/feteado/stock-a-picada/resetear', { method: 'POST' })
    if (res.ok) {
      mostrarMensaje('success', 'Todos los registros de picadas se han reseteado a 0.')
      cargarPicadas()
    } else {
      mostrarMensaje('error', 'No se pudieron resetear los registros.')
    }
  } catch (error) {
    mostrarMensaje('error', 'Error de red.')
  }
}

const resetearDecomisos = async () => {
  if (!await winConfirm('¿Estás seguro de resetear a 0 todos los registros de decomisos?', 'Resetear Decomisos')) return
  try {
    const res = await fetch('/api/feteado/stock-a-decomiso/resetear', { method: 'POST' })
    if (res.ok) {
      mostrarMensaje('success', 'Todos los registros de decomisos se han reseteado a 0.')
      cargarDecomisos()
    } else {
      mostrarMensaje('error', 'No se pudieron resetear los registros.')
    }
  } catch (error) {
    mostrarMensaje('error', 'Error de red.')
  }
}

onMounted(() => {
  cargarPicadas()
  cargarDecomisos()
})
</script>

<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Conversiones</h2>
        <p class="page-description">Consulta de datos de Picadas y Decomisos.</p>
      </div>
    </div>

    <div v-if="mensaje.texto" class="alert-box mb-4" :class="mensaje.tipo">
      {{ mensaje.texto }}
    </div>

    <div class="tabs-container">
      <div class="tabs-header">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'picadas' }"
          @click="activeTab = 'picadas'"
        >
          <i class="ph ph-knife"></i> Picadas
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'decomisos' }"
          @click="activeTab = 'decomisos'"
        >
          <i class="ph ph-trash"></i> Decomisos
        </button>
      </div>

      <div class="tab-content card">
        <div v-if="isLoading" class="p-4 text-center text-muted">
          <i class="ph ph-spinner spinner text-2xl"></i> Cargando datos...
        </div>
        
        <div v-else-if="activeTab === 'picadas'">
          <div class="card-header responsive-card-header">
            <h3 class="card-title">Datos de Picadas</h3>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn" style="background: var(--accent-danger); color: white; padding: 0.3rem 0.6rem; border: none; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; box-shadow: var(--raised-shadow); font-weight: bold;" @click="resetearPicadas" title="Resetear a 0">
                <i class="ph ph-arrows-counter-clockwise"></i> Resetear a 0
              </button>
              <button class="icon-btn" @click="cargarPicadas">
                <i class="ph ph-arrows-clockwise"></i>
              </button>
            </div>
          </div>
          <div class="table-container">
            <table class="responsive-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th class="text-right">Peso (kg)</th>
                  <th>Motivo</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="picadas.length === 0">
                  <td colspan="5" class="text-center text-muted py-4">No hay datos de picadas</td>
                </tr>
                <tr v-for="item in picadas" :key="item.id">
                  <td class="fw-bold">{{ item.codigo }}</td>
                  <td>{{ item.nombre || '-' }}</td>
                  
                  <td class="text-right">
                    <div v-if="edicion.tipo === 'picada' && edicion.id === item.id" style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                      <input type="number" step="0.001" v-model="edicion.peso" class="form-control" style="width: 100px; height: 32px; font-size: 0.9rem;" />
                      <button class="btn btn-success" @click="guardarEdicion" style="padding: 0.2rem 0.5rem;"><i class="ph ph-check"></i></button>
                      <button class="btn btn-danger" @click="cancelarEdicion" style="padding: 0.2rem 0.5rem;"><i class="ph ph-x"></i></button>
                    </div>
                    <span v-else class="text-blue fw-bold">{{ item.peso }} kg</span>
                  </td>
                  
                  <td>{{ item.motivo || '-' }}</td>
                  
                  <td class="text-center">
                    <div style="display: flex; gap: 0.3rem; justify-content: center;">
                      <button v-if="edicion.id !== item.id" class="btn" style="background: var(--bg-secondary); border: none; padding: 0.3rem 0.5rem; box-shadow: var(--raised-shadow); cursor: pointer;" @click="iniciarEdicion('picada', item)" title="Editar">
                        <i class="ph ph-pencil-simple"></i>
                      </button>
                      <button class="btn-delete" @click="eliminarPicada(item.id)" title="Eliminar">
                        <i class="ph ph-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="activeTab === 'decomisos'">
          <div class="card-header responsive-card-header">
            <h3 class="card-title">Datos de Decomisos</h3>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn" style="background: var(--accent-danger); color: white; padding: 0.3rem 0.6rem; border: none; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; box-shadow: var(--raised-shadow); font-weight: bold;" @click="resetearDecomisos" title="Resetear a 0">
                <i class="ph ph-arrows-counter-clockwise"></i> Resetear a 0
              </button>
              <button class="icon-btn" @click="cargarDecomisos">
                <i class="ph ph-arrows-clockwise"></i>
              </button>
            </div>
          </div>
          <div class="table-container">
            <table class="responsive-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th class="text-right">Peso (kg)</th>
                  <th>Motivo</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="decomisos.length === 0">
                  <td colspan="5" class="text-center text-muted py-4">No hay datos de decomisos</td>
                </tr>
                <tr v-for="item in decomisos" :key="item.id">
                  <td class="fw-bold">{{ item.codigo }}</td>
                  <td>{{ item.nombre || '-' }}</td>
                  
                  <td class="text-right">
                    <div v-if="edicion.tipo === 'decomiso' && edicion.id === item.id" style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
                      <input type="number" step="0.001" v-model="edicion.peso" class="form-control" style="width: 100px; height: 32px; font-size: 0.9rem;" />
                    </div>
                    <span v-else class="text-red fw-bold">{{ item.peso }} kg</span>
                  </td>
                  
                  <td>
                    <div v-if="edicion.tipo === 'decomiso' && edicion.id === item.id">
                      <input type="text" v-model="edicion.motivo" class="form-control" style="width: 100%; height: 32px; font-size: 0.9rem;" placeholder="Motivo" />
                    </div>
                    <span v-else>{{ item.motivo || '-' }}</span>
                  </td>
                  
                  <td class="text-center">
                    <div style="display: flex; gap: 0.3rem; justify-content: center;">
                      <template v-if="edicion.tipo === 'decomiso' && edicion.id === item.id">
                        <button class="btn btn-success" @click="guardarEdicion" style="padding: 0.2rem 0.5rem;"><i class="ph ph-check"></i></button>
                        <button class="btn btn-danger" @click="cancelarEdicion" style="padding: 0.2rem 0.5rem;"><i class="ph ph-x"></i></button>
                      </template>
                      <button v-else class="btn" style="background: var(--bg-secondary); border: none; padding: 0.3rem 0.5rem; box-shadow: var(--raised-shadow); cursor: pointer;" @click="iniciarEdicion('decomiso', item)" title="Editar">
                        <i class="ph ph-pencil-simple"></i>
                      </button>
                      <button v-if="edicion.id !== item.id" class="btn-delete" @click="eliminarDecomiso(item.id)" title="Eliminar">
                        <i class="ph ph-trash"></i>
                      </button>
                    </div>
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

<style scoped>
.tabs-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tabs-header {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--bevel-dark);
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: none;
  box-shadow: var(--raised-shadow);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-btn.active {
  background: var(--accent-primary);
  color: white;
  box-shadow: var(--inset-shadow);
}

.tab-btn:active {
  box-shadow: var(--inset-shadow);
}

.tab-content {
  min-height: 200px;
}

.btn-delete {
  background: none;
  border: none;
  color: var(--accent-danger);
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  font-size: 1.1rem;
  border-radius: 4px;
}

.btn-delete:hover {
  background: rgba(204, 0, 0, 0.1);
}

.text-red {
  color: var(--accent-danger);
}
</style>
