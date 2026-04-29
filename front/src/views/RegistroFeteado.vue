<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useWinDialog } from '../composables/useWinDialog'

const { winConfirm } = useWinDialog()

const authStore = useAuthStore()
const productos = ref([])
const historial = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const mensaje = ref({ tipo: '', texto: '' })

// Formulario con la nueva estructura
const form = ref({
  codigo_producto: '',
  peso_bruto: '',
  peso_decomiso: 0,
  peso_recorte: 0,
  cantidad_bolsitas: '',
  cantidad_piezas: '',
})

const pesoFeteadoCalculado = computed(() => {
  const bruto = Number(form.value.peso_bruto) || 0
  const decomiso = Number(form.value.peso_decomiso) || 0
  const recorte = Number(form.value.peso_recorte) || 0
  return Math.max(0, bruto - decomiso - recorte).toFixed(3)
})

const mostrarMensaje = (tipo, texto) => {
  mensaje.value = { tipo, texto }
  setTimeout(() => {
    mensaje.value = { tipo: '', texto: '' }
  }, 5000)
}

const cargarProductos = async () => {
  isLoading.value = true
  try {
    const res = await fetch('/api/productos/stock-total')
    if (res.ok) {
      productos.value = await res.json()
    }
  } catch (error) {
    console.error('Error al cargar productos:', error)
  } finally {
    isLoading.value = false
  }
}

const cargarHistorial = async () => {
  try {
    const res = await fetch('/api/feteado/produccion')
    if (res.ok) {
      const data = await res.json()
      // Filtrar para mostrar solo los registros del usuario actual
      historial.value = data.filter((h) => h.feteador === authStore.user?.usuario)
    }
  } catch (error) {
    console.error('Error al cargar historial:', error)
  }
}

const eliminarRegistro = async (id) => {
  if (!await winConfirm('¿Estás seguro de eliminar este registro?', 'Eliminar Registro')) return

  try {
    const res = await fetch(`/api/feteado/produccion/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      mostrarMensaje('success', 'Registro eliminado.')
      cargarHistorial()
    } else {
      mostrarMensaje('error', 'No se pudo eliminar el registro.')
    }
  } catch (error) {
    mostrarMensaje('error', 'Error al conectar con el servidor.')
  }
}

// Lógica de producto seleccionado para mostrar descripción al lado del código
const productoSeleccionado = computed(() => {
  return productos.value.find((p) => p.codigo_interno === form.value.codigo_producto)
})

const registrarFeteado = async () => {
  if (!form.value.codigo_producto || !form.value.peso_bruto || !form.value.cantidad_bolsitas) {
    return mostrarMensaje('error', 'Por favor, complete los campos obligatorios.')
  }

  isSubmitting.value = true
  try {
    const payload = {
      codigo_producto: form.value.codigo_producto,
      peso_bruto: Number(form.value.peso_bruto),
      peso_decomiso: Number(form.value.peso_decomiso || 0),
      peso_recorte: Number(form.value.peso_recorte || 0),
      peso_feteado: Number(pesoFeteadoCalculado.value),
      cantidad_bolsitas: parseInt(form.value.cantidad_bolsitas),
      feteador: authStore.user?.usuario || 'Sin usuario',
    }

    const res = await fetch('/api/feteado/produccion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      // 1. Actualizar el stock a fetear (sumar peso y cantidad)
      await fetch('/api/feteado/stock-a-fetear', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: payload.codigo_producto,
          peso: payload.peso_feteado,
          cantidad: payload.cantidad_bolsitas,
        }),
      }).catch((err) => console.error('Error stock a fetear:', err))

      // 2. Si hay recorte, enviar a Picada (suma stock)
      if (payload.peso_recorte > 0) {
        await fetch('/api/feteado/stock-a-picada', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: payload.codigo_producto,
            peso: payload.peso_recorte,
          }),
        }).catch((err) => console.error('Error stock a picada:', err))
      }

      // 3. Si hay decomiso, enviar a Decomiso (nuevo registro)
      if (payload.peso_decomiso > 0) {
        await fetch('/api/feteado/stock-a-decomiso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: payload.codigo_producto,
            peso: payload.peso_decomiso,
            motivo: 'Feteado',
          }),
        }).catch((err) => console.error('Error stock a decomiso:', err))
      }

      // 4. Descontar el peso bruto del stock principal de kilos
      await fetch('/api/stock-kilos/restar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo_producto: payload.codigo_producto,
          kilos_a_descontar: payload.peso_bruto
        })
      }).catch((err) => console.error('Error descontando stock kilos:', err))

      // 5. Descontar cantidad de piezas si se especificó
      if (form.value.cantidad_piezas && Number(form.value.cantidad_piezas) > 0) {
        await fetch('/api/piezas/restar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: payload.codigo_producto,
            cantidad: Number(form.value.cantidad_piezas)
          })
        }).catch((err) => console.error('Error descontando piezas:', err))
      }

      mostrarMensaje('success', 'Registro exitoso: Producción, Picada, Decomiso y Stock actualizados.')
      // Limpiar formulario
      form.value = {
        codigo_producto: '',
        peso_bruto: '',
        peso_decomiso: 0,
        peso_recorte: 0,
        cantidad_bolsitas: '',
        cantidad_piezas: '',
      }
      cargarHistorial()
    } else {
      const errorData = await res.json().catch(() => ({}))
      mostrarMensaje('error', errorData.message || 'Error al registrar el feteado.')
    }
  } catch (error) {
    mostrarMensaje('error', 'Error de red.')
  } finally {
    isSubmitting.value = false
  }
}


onMounted(() => {
  cargarProductos()
  cargarHistorial()
})
</script>

<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Fraccionado</h2>
        <p class="page-description">Registro de pesaje y mermas de feteado.</p>
      </div>
    </div>

    <div class="feteado-layout">
      <!-- FORMULARIO DE FRACCIONADO -->
      <div class="card form-card no-padding-mobile">
        <div class="card-header responsive-card-header">
          <h3 class="card-title">Cargar Pesajes</h3>
          <div class="user-info-tag"><i class="ph ph-user"></i> {{ authStore.user?.usuario }}</div>
        </div>

        <form @submit.prevent="registrarFeteado" class="p-4">
          <div class="form-grid">
            <!-- Selección de Producto -->
            <div class="form-row-mobile">
              <div class="form-group flex-1">
                <label class="form-label">Código de Producto</label>
                <div class="input-with-desc">
                  <input
                    list="prod-codes"
                    class="form-control text-lg fw-bold"
                    v-model="form.codigo_producto"
                    placeholder="Ej: 3102"
                    required
                  />
                  <datalist id="prod-codes">
                    <option v-for="p in productos" :key="p.codigo_interno" :value="p.codigo_interno">
                      {{ p.descripcion }}
                    </option>
                  </datalist>
                  <div v-if="productoSeleccionado" class="selected-prod-name animate-slide-down">
                    {{ productoSeleccionado.descripcion }}
                  </div>
                </div>
              </div>

              <!-- Cantidad Piezas a Convertir -->
              <div class="form-group flex-1">
                <label class="form-label text-blue">Cant. Piezas (Convertidas)</label>
                <input
                  type="number"
                  class="form-control text-lg"
                  v-model="form.cantidad_piezas"
                  placeholder="0"
                />
              </div>
            </div>

            <!-- Pesajes Principales -->
            <div class="form-row-mobile">
              <div class="form-group flex-1">
                <label class="form-label">Peso Bruto (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  class="form-control text-xl"
                  v-model="form.peso_bruto"
                  placeholder="0.000"
                  required
                />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Cant. Bolsitas</label>
                <input
                  type="number"
                  class="form-control text-xl"
                  v-model="form.cantidad_bolsitas"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <!-- Mermas -->
            <div class="form-row-mobile">
              <div class="form-group flex-1">
                <label class="form-label">Decomiso (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  class="form-control text-xl"
                  v-model="form.peso_decomiso"
                  placeholder="0.000"
                />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Recorte (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  class="form-control text-xl"
                  v-model="form.peso_recorte"
                  placeholder="0.000"
                />
              </div>
            </div>

            <!-- Peso Feteado Resultante -->
            <div class="form-group">
              <label class="form-label">Peso Feteado Resultante (kg)</label>
              <input
                type="text"
                class="form-control text-xl text-green bg-muted"
                :value="pesoFeteadoCalculado"
                readonly
              />
            </div>
          </div>

          <div v-if="mensaje.texto" class="alert-box mb-4" :class="mensaje.tipo">
            {{ mensaje.texto }}
          </div>

          <button type="submit" class="btn btn-primary w-full btn-lg mt-6" :disabled="isSubmitting">
            <i class="ph" :class="isSubmitting ? 'ph-spinner spinner' : 'ph-check-circle'"></i>
            {{ isSubmitting ? 'Registrando...' : 'Confirmar y Guardar' }}
          </button>
        </form>
      </div>

      <!-- HISTORIAL RECIENTE -->
      <div class="card history-card no-padding-mobile">
        <div class="card-header responsive-card-header">
          <h3 class="card-title">Mis últimos registros</h3>
          <button class="icon-btn" @click="cargarHistorial">
            <i class="ph ph-arrows-clockwise"></i>
          </button>
        </div>
        <div class="table-container">
          <table class="responsive-table">
            <thead>
              <tr>
                <th>Cód. Prod.</th>
                <th class="text-right">Peso Feteado</th>
                <th class="text-right">Bolsitas</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in historial.slice(0, 10)" :key="h.id_feteado">
                <td>
                  <div class="history-main">
                    <span class="fw-bold">{{ h.codigo_producto }}</span>
                    <span class="text-xs text-muted">{{ h.feteador }}</span>
                  </div>
                </td>
                <td class="text-right fw-bold text-blue">{{ h.peso_feteado }} kg</td>
                <td class="text-right">{{ h.cantidad_bolsitas }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feteado-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .feteado-layout {
    display: grid;
    grid-template-columns: 480px 1fr;
    gap: 1.25rem;
    align-items: start;
  }
}

.user-info-tag {
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 0.15rem 0.6rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.selected-prod-name {
  margin-top: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--accent-primary-light);
  border-left: 3px solid var(--accent-primary);
  font-size: 0.8rem;
  color: var(--accent-primary);
  font-weight: 600;
}

.text-xl {
  font-size: 1.35rem;
  height: 48px;
  text-align: center;
  font-weight: 800;
}
.text-lg {
  font-size: 1.1rem;
  height: 44px;
}
.text-green {
  color: var(--accent-success);
}
.bg-muted {
  background: var(--bg-primary) !important;
  color: var(--text-muted);
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-row-mobile {
  display: flex;
  gap: 0.75rem;
}
.flex-1 {
  flex: 1;
}

.history-main {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.btn-delete {
  background: none;
  border: none;
  color: var(--accent-danger);
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  font-size: 0.9rem;
  box-shadow: var(--raised-shadow);
  background: var(--bg-secondary);
}
.btn-delete:active {
  box-shadow: var(--inset-shadow);
}

@media (max-width: 640px) {
  .form-row-mobile {
    flex-direction: row;
  }
}


</style>
