<script setup>
import { ref, computed, onMounted } from 'vue'

const piezas = ref([])
const isLoading = ref(false)
const searchQuery = ref('')
const mensaje = ref({ tipo: '', texto: '' })

// Modal de edición
const showModal = ref(false)
const piezaEditar = ref(null)
const editCantidad = ref(0)
const editVencimiento = ref('')
const isSaving = ref(false)

const mostrarMensaje = (tipo, texto) => {
  mensaje.value = { tipo, texto }
  setTimeout(() => { mensaje.value = { tipo: '', texto: '' } }, 4000)
}

const cargarPiezas = async () => {
  isLoading.value = true
  try {
    const res = await fetch('/api/piezas')
    if (res.ok) {
      piezas.value = await res.json()
    } else {
      mostrarMensaje('error', 'Error al cargar el stock de piezas.')
    }
  } catch (error) {
    mostrarMensaje('error', 'Error de red al cargar piezas.')
    console.error('Error al cargar piezas:', error)
  } finally {
    isLoading.value = false
  }
}

const piezasFiltradas = computed(() => {
  if (!searchQuery.value.trim()) return piezas.value
  const q = searchQuery.value.toLowerCase()
  return piezas.value.filter(p =>
    p.codigo?.toLowerCase().includes(q) ||
    p.descripcion?.toLowerCase().includes(q)
  )
})

const formatFecha = (fechaStr) => {
  if (!fechaStr) return '-'
  const d = new Date(fechaStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

const abrirEditar = (pieza) => {
  piezaEditar.value = pieza
  editCantidad.value = pieza.cantidad
  editVencimiento.value = pieza.vencimiento || ''
  showModal.value = true
}

const confirmarEdicion = async () => {
  if (!piezaEditar.value) return
  isSaving.value = true

  const cantidadActual = Number(piezaEditar.value.cantidad)
  const cantidadNueva = Number(editCantidad.value)
  const diff = cantidadNueva - cantidadActual

  if (diff === 0 && editVencimiento.value === (piezaEditar.value.vencimiento || '')) {
    showModal.value = false
    isSaving.value = false
    return
  }

  const endpoint = diff >= 0 ? '/api/piezas/sumar' : '/api/piezas/restar'
  const payload = {
    codigo: piezaEditar.value.codigo,
    cantidad: Math.abs(diff) || 0,
    vencimiento: editVencimiento.value
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      mostrarMensaje('success', 'Registro actualizado correctamente.')
      showModal.value = false
      cargarPiezas()
    } else {
      mostrarMensaje('error', 'Error al actualizar el registro.')
    }
  } catch {
    mostrarMensaje('error', 'Error de red al guardar.')
  } finally {
    isSaving.value = false
  }
}

onMounted(cargarPiezas)
</script>

<template>
  <div class="page-container animate-fade">

    <!-- Encabezado -->
    <div class="page-header responsive-header">
      <div class="header-content">
        <h2 class="page-title">Stock de Piezas</h2>
        <p class="page-description">Inventario de piezas por código.</p>
      </div>
      <button class="btn btn-secondary" @click="cargarPiezas" :disabled="isLoading">
        <i class="ph ph-arrows-clockwise" :class="{ spinner: isLoading }"></i>
        <span>Actualizar</span>
      </button>
    </div>

    <!-- Mensaje -->
    <div v-if="mensaje.texto" class="alert-box mt-2" :class="mensaje.tipo">
      {{ mensaje.texto }}
    </div>

    <!-- Card principal -->
    <div class="card mt-4">
      <!-- Barra de búsqueda -->
      <div class="card-header responsive-card-header">
        <div class="search-wrapper">
          <i class="ph ph-magnifying-glass search-icon"></i>
          <input
            type="text"
            class="form-control"
            placeholder="Buscar por código o descripción..."
            v-model="searchQuery"
          />
        </div>
        <span class="result-count">{{ piezasFiltradas.length }} registro(s)</span>
      </div>

      <!-- Tabla -->
      <div class="table-container">
        <div v-if="isLoading" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          <p>Cargando inventario...</p>
        </div>

        <table v-else-if="piezasFiltradas.length > 0">
          <thead>
            <tr>
              <th>Cód.</th>
              <th>Descripción</th>
              <th class="text-right">Cant.</th>
              <th class="text-center">Vencimiento</th>
              <th class="d-none-mobile">Actualizado</th>
              <th class="text-center">Acc.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in piezasFiltradas" :key="p.id">
              <td class="text-muted text-xs fw-bold" style="white-space:nowrap">{{ p.codigo }}</td>
              <td class="text-sm">{{ (p.descripcion || '-').slice(5) }}</td>
              <td class="text-right fw-bold text-blue">{{ p.cantidad }}</td>
              <td class="text-center text-sm">
                <span v-if="p.vencimiento" class="badge badge-warning">{{ p.vencimiento }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="d-none-mobile text-muted text-sm">{{ formatFecha(p.fecha_ultimo_registro) }}</td>
              <td class="text-center">
                <button class="btn-edit" @click="abrirEditar(p)" title="Editar">
                  <i class="ph ph-pencil-simple"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          <i class="ph ph-tray icon-xl"></i>
          <p>No hay registros{{ searchQuery ? ' que coincidan con la búsqueda' : '' }}.</p>
        </div>
      </div>
    </div>

    <!-- Modal Editar Cantidad -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-card animate-fade">

        <div class="modal-titlebar">
          <span><i class="ph ph-pencil-simple"></i> Editar Cantidad</span>
          <button class="modal-close" @click="showModal = false">✕</button>
        </div>

        <div class="modal-body">
          <p class="prod-name">{{ piezaEditar?.descripcion }}</p>
          <p class="prod-code">Código: <strong>{{ piezaEditar?.codigo }}</strong></p>
          <hr class="divider">
          <div class="form-group">
            <label class="form-label">Cantidad</label>
            <input
              type="number"
              min="0"
              class="form-control text-center"
              style="font-size:1.3rem; font-weight:800; height:44px;"
              v-model="editCantidad"
            />
          </div>
          <div class="form-group" style="margin-top:0.6rem">
            <label class="form-label">Vencimiento (DD-MM-AA)</label>
            <input
              type="text"
              class="form-control"
              placeholder="Ej: 26-04-25"
              v-model="editVencimiento"
              maxlength="8"
            />
          </div>
          <p class="hint-text">
            Actual: <strong>{{ piezaEditar?.cantidad }}</strong> unidades
            <span v-if="piezaEditar?.vencimiento"> · Vence: <strong>{{ piezaEditar?.vencimiento }}</strong></span>
          </p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal = false" :disabled="isSaving">Cancelar</button>
          <button class="btn btn-primary" @click="confirmarEdicion" :disabled="isSaving">
            {{ isSaving ? 'Guardando...' : 'Confirmar' }}
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.responsive-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

/* Buscador */
.search-wrapper {
  position: relative;
  flex: 1;
  max-width: 360px;
}

.search-icon {
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 0.85rem;
  pointer-events: none;
}

.search-wrapper .form-control {
  padding-left: 1.75rem;
  height: 28px;
  font-size: 0.82rem;
  background: var(--bg-window);
}

.result-count {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
  align-self: center;
  font-weight: 600;
}

/* Botón editar compacto */
.btn-edit {
  background: var(--bg-secondary);
  border: none;
  box-shadow: var(--raised-shadow);
  color: var(--accent-primary);
  width: 26px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-edit:active {
  box-shadow: var(--inset-shadow);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  background: var(--bg-secondary);
  box-shadow: var(--raised-shadow), 4px 4px 12px rgba(0,0,0,0.4);
  width: 100%;
  max-width: 360px;
  border: 1px solid var(--bevel-dark);
}

.modal-titlebar {
  background: linear-gradient(to right, #0b5394, #1e6ec8);
  color: white;
  padding: 0.4rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
  font-weight: 700;
}

.modal-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
}

.modal-body {
  padding: 0.75rem;
}

.prod-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.15rem;
}

.prod-code {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.6rem;
}

.divider {
  border: none;
  border-top: 1px solid var(--bevel-dark);
  border-bottom: 1px solid var(--bevel-light);
  margin-bottom: 0.75rem;
}

.hint-text {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

.text-center { text-align: center; }

.modal-footer {
  padding: 0.5rem 0.75rem;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  border-top: 1px solid var(--bg-tertiary);
  background: var(--bg-primary);
}

/* Responsive helpers */
.d-none-mobile { display: none; }

@media (min-width: 768px) {
  .d-none-mobile { display: table-cell; }
}
</style>
