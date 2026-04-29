<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const productos = ref([])
const historial = ref([])
const productoBuscado = ref('')
const expandedRows = ref(new Set())

const nuevoRegistro = ref({
  fecha: new Date().toISOString().split('T')[0],
  id_colaborador: authStore.user?.id || '', // Automático del usuario logueado
  id_producto: '',
  cantidad_bolsitas: '',
  tipo_proceso: 'Feteado'
})

const isLoading = ref(false)
const isSubmitting = ref(false)
const mensaje = ref({ tipo: '', texto: '' })

const toggleRow = (id) => {
  if (expandedRows.value.has(id)) expandedRows.value.delete(id)
  else expandedRows.value.add(id)
}

const mostrarMensaje = (tipo, texto) => {
  mensaje.value = { tipo, texto }
  setTimeout(() => { mensaje.value = { tipo: '', texto: '' } }, 5000)
}

const cargarCatalogos = async () => {
  isLoading.value = true
  try {
    const [resP, resH] = await Promise.all([
      fetch('/api/productos').catch(() => ({ ok: false })),
      fetch('/api/produccion').catch(() => ({ ok: false }))
    ])
    if (resP.ok) productos.value = await resP.json()
    if (resH.ok) historial.value = await resH.json()
  } finally {
    isLoading.value = false
  }
}

const onProductoSelect = () => {
  const selected = productos.value.find(p => `[${p.codigo_interno}] ${p.descripcion}` === productoBuscado.value)
  nuevoRegistro.value.id_producto = selected ? selected.id_producto : ''
}

const registrarProduccion = async () => {
  if (!nuevoRegistro.value.id_producto || !nuevoRegistro.value.cantidad_bolsitas) {
    return mostrarMensaje('error', 'Complete todos los campos correctamente.')
  }

  isSubmitting.value = true
  try {
    const res = await fetch('/api/produccion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...nuevoRegistro.value,
        id_colaborador: Number(authStore.user?.id),
        id_producto: Number(nuevoRegistro.value.id_producto),
        cantidad_bolsitas: Number(nuevoRegistro.value.cantidad_bolsitas)
      })
    })

    if (res.ok) {
      mostrarMensaje('success', 'Registro guardado exitosamente.')
      nuevoRegistro.value.id_producto = ''
      productoBuscado.value = ''
      nuevoRegistro.value.cantidad_bolsitas = ''
      const resH = await fetch('/api/produccion')
      if (resH.ok) historial.value = await resH.json()
    } else {
      mostrarMensaje('error', 'Error al guardar el registro.')
    }
  } catch (error) {
    mostrarMensaje('error', 'Error de red.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(cargarCatalogos)
</script>

<template>
  <div class="page-container animate-fade">
    <div class="page-header responsive-header">
      <div class="header-content">
        <h2 class="page-title">Carga de Producción</h2>
        <p class="page-description">Registra tu trabajo diario.</p>
      </div>
    </div>

    <div class="production-layout">
      <!-- FORMULARIO BLOQUEADO POR USUARIO -->
      <div class="card form-card no-padding-mobile">
        <div class="card-header responsive-card-header">
          <h3 class="card-title">Nuevo Registro</h3>
        </div>
        
        <form @submit.prevent="registrarProduccion" class="p-4">
          <div class="form-grid">
            <!-- Operario Fijo -->
            <div class="form-group">
              <label class="form-label">Operario (Sesión Actual)</label>
              <div class="input-readonly">
                <i class="ph ph-user-circle"></i>
                <span>{{ authStore.user?.usuario }}</span>
                <span class="badge badge-primary text-xs ml-auto">{{ authStore.user?.rol }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Fecha</label>
              <input type="date" class="form-control" v-model="nuevoRegistro.fecha" required>
            </div>

            <div class="form-group">
              <label class="form-label">Producto</label>
              <input 
                list="prod-list" 
                class="form-control" 
                v-model="productoBuscado" 
                @input="onProductoSelect" 
                placeholder="Buscar por nombre o código..."
                required
              >
              <datalist id="prod-list">
                <option v-for="p in productos" :key="p.id_producto" :value="`[${p.codigo_interno}] ${p.descripcion}`"></option>
              </datalist>
            </div>

            <div class="form-row-mobile">
              <div class="form-group flex-1">
                <label class="form-label">Proceso</label>
                <select class="form-control" v-model="nuevoRegistro.tipo_proceso">
                  <option value="Feteado">Feteado</option>
                  <option value="Envasado">Envasado</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Bolsitas</label>
                <input type="number" class="form-control" v-model="nuevoRegistro.cantidad_bolsitas" required placeholder="0">
              </div>
            </div>
          </div>

          <div v-if="mensaje.texto" class="alert-box mb-4" :class="mensaje.tipo">
            {{ mensaje.texto }}
          </div>

          <button type="submit" class="btn btn-primary w-full btn-lg mt-2" :disabled="isSubmitting">
            <i class="ph" :class="isSubmitting ? 'ph-spinner spinner' : 'ph-floppy-disk'"></i>
            {{ isSubmitting ? 'Guardar Registro' : 'Registrar Producción' }}
          </button>
        </form>
      </div>

      <!-- HISTORIAL -->
      <div class="card history-card no-padding-mobile mt-4">
        <div class="card-header responsive-card-header">
          <h3 class="card-title">Mis Registros del Día</h3>
          <button class="icon-btn" @click="cargarCatalogos"><i class="ph ph-arrows-clockwise"></i></button>
        </div>

        <div class="table-container">
          <table class="responsive-table">
            <thead>
              <tr>
                <th>Producto / Fecha</th>
                <th class="text-right">Cant.</th>
                <th class="d-none-mobile">Proceso</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="item in historial" :key="item.id_produccion">
                <!-- Solo mostramos los del usuario logueado para que vea SU historial -->
                <tr v-if="item.id_colaborador === authStore.user?.id" @click="toggleRow(item.id_produccion)" :class="{ 'row-expanded': expandedRows.has(item.id_produccion) }">
                  <td>
                    <div class="history-main">
                      <span class="fw-bold">{{ item.Producto?.descripcion }}</span>
                      <span class="text-xs text-muted">{{ item.fecha }}</span>
                    </div>
                  </td>
                  <td class="text-right">
                    <span class="fw-bold text-green">{{ item.cantidad_bolsitas }} un.</span>
                  </td>
                  <td class="d-none-mobile text-center">
                    <span class="badge" :class="item.tipo_proceso === 'Feteado' ? 'badge-primary' : 'badge-warning'">
                      {{ item.tipo_proceso }}
                    </span>
                  </td>
                </tr>

                <tr v-if="expandedRows.has(item.id_produccion)" class="detail-row d-only-mobile">
                  <td colspan="2">
                    <div class="detail-content animate-slide-down">
                      <div class="detail-grid-compact">
                        <div>
                          <span class="label">Proceso</span>
                          <span class="value">{{ item.tipo_proceso }}</span>
                        </div>
                        <div>
                          <span class="label">ID</span>
                          <span class="value">#{{ item.id_produccion }}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.production-layout { display: flex; flex-direction: column; gap: 1rem; }

@media (min-width: 1024px) {
  .production-layout { display: grid; grid-template-columns: 420px 1fr; gap: 2rem; align-items: start; }
}

.input-readonly {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed var(--glass-border);
  border-radius: var(--border-radius-md);
  color: var(--text-primary);
  font-weight: 600;
}

.input-readonly i { font-size: 1.5rem; color: var(--accent-primary); }

.ml-auto { margin-left: auto; }

.form-grid { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
.form-row-mobile { display: flex; gap: 1rem; }
.flex-1 { flex: 1; }

.history-main { display: flex; flex-direction: column; gap: 0.15rem; }
.responsive-table tr { cursor: pointer; }
.row-expanded { background: rgba(59, 130, 246, 0.05); }

.detail-row td { padding: 0 !important; }
.detail-content { padding: 1rem; background: rgba(15, 23, 42, 0.3); border-bottom: 1px solid var(--glass-border); }
.detail-grid-compact { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.detail-grid-compact .label { display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; }
.detail-grid-compact .value { font-size: 0.85rem; font-weight: 600; }

.p-4 { padding: 1.25rem; }
.btn-lg { height: 52px; }
.w-full { width: 100%; }

.d-none-mobile { display: none; }
.d-only-mobile { display: block; }

@media (min-width: 768px) {
  .d-none-mobile { display: table-cell; }
  .d-only-mobile { display: none !important; }
  .responsive-table tr { cursor: default; }
}
</style>
