<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const codigo = ref('')
const stockDisponible = ref(null)
const isLoadingStock = ref(false)
const isSubmitting = ref(false)
const mensaje = ref({ tipo: '', texto: '' })
const stockAFetear = ref([])

const cargarStockAFetear = async () => {
  try {
    const res = await fetch('/api/feteado/stock-a-fetear')
    if (res.ok) {
      const data = await res.json()
      stockAFetear.value = data.filter(s => s.cantidad > 0)
    }
  } catch (error) {
    console.error('Error al cargar stock a fetear:', error)
  }
}

onMounted(() => {
  cargarStockAFetear()
})

const form = ref({
  cantidad: '',
  peso: ''
})

const mostrarMensaje = (tipo, texto) => {
  mensaje.value = { tipo, texto }
  setTimeout(() => { mensaje.value = { tipo: '', texto: '' } }, 5000)
}

const buscarStock = async () => {
  if (!codigo.value) return
  
  isLoadingStock.value = true
  stockDisponible.value = null
  
  try {
    const res = await fetch(`/api/feteado/stock-a-fetear/${codigo.value}`)
    if (res.ok) {
      stockDisponible.value = await res.json()
    } else {
      mostrarMensaje('error', 'Producto no encontrado en stock a fetear.')
    }
  } catch (error) {
    console.error("Error al buscar stock:", error)
    mostrarMensaje('error', 'Error al conectar con el servidor.')
  } finally {
    isLoadingStock.value = false
  }
}

// Observar el código para buscar automáticamente cuando tenga una longitud razonable o al perder el foco
// Pero mejor lo hacemos con un botón o al presionar Enter para mayor control
const handleKeydown = (e) => {
  if (e.key === 'Enter') buscarStock()
}

const canEnvasar = computed(() => {
  return stockDisponible.value && stockDisponible.value.cantidad > 0
})

const registrarEnvasado = async () => {
  if (!codigo.value || !form.value.cantidad || !form.value.peso) {
    return mostrarMensaje('error', 'Por favor, complete todos los campos.')
  }

  if (Number(form.value.cantidad) > stockDisponible.value.cantidad) {
    return mostrarMensaje('error', 'La cantidad no puede superar el stock disponible.')
  }

  isSubmitting.value = true
  try {
    const payload = {
      codigo: codigo.value,
      peso: Number(form.value.peso),
      envasador: authStore.user?.usuario,
      cantidad: Number(form.value.cantidad)
    }

    const res = await fetch('/api/feteado/stock-a-fetear/restar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      // Sumar al stock de productos envasados finales
      await fetch('/api/envasado/sumar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: payload.codigo,
          cantidad: payload.cantidad,
          peso: payload.peso
        })
      }).catch(err => console.error("Error al sumar stock de envasado:", err))

      mostrarMensaje('success', 'Envasado registrado y stock final actualizado.')
      // Resetear
      codigo.value = ''
      stockDisponible.value = null
      form.value = { cantidad: '', peso: '' }
      cargarStockAFetear()
    } else {
      const errorData = await res.json().catch(() => ({}))
      mostrarMensaje('error', errorData.message || 'Error al registrar el envasado.')
    }
  } catch (error) {
    mostrarMensaje('error', 'Error de red.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Envasado</h2>
        <p class="page-description">Registro de productos envasados y salida de stock.</p>
      </div>
    </div>

    <div class="envasado-layout">
      <div class="card form-card">
        <div class="card-header">
          <h3 class="card-title">Formulario de Envasado</h3>
          <div class="user-info-tag">
            <i class="ph ph-user"></i> {{ authStore.user?.usuario }}
          </div>
        </div>

        <div class="p-6">
          <!-- BUSQUEDA DE CODIGO -->
          <div class="form-group mb-6">
            <label class="form-label">Código de Producto</label>
            <div class="search-input-group">
              <input 
                type="text" 
                class="form-control text-lg fw-bold" 
                v-model="codigo" 
                @keydown="handleKeydown"
                placeholder="Ej: 8010"
                :disabled="isSubmitting"
              >
              <button class="btn btn-secondary search-btn" @click="buscarStock" :disabled="isLoadingStock || isSubmitting">
                <i class="ph" :class="isLoadingStock ? 'ph-spinner spinner' : 'ph-magnifying-glass'"></i>
              </button>
            </div>
          </div>

          <!-- INFORMACION DE STOCK -->
          <div v-if="stockDisponible" class="stock-info-box animate-slide-down" :class="{ 'no-stock': stockDisponible.cantidad <= 0 }">
            <div class="stock-stat">
              <span class="stat-label">Bolsitas Disponibles</span>
              <span class="stat-value">{{ stockDisponible.cantidad }}</span>
            </div>
            <div class="stock-stat">
              <span class="stat-label">Peso Total Disponible</span>
              <span class="stat-value">{{ stockDisponible.peso }} kg</span>
            </div>
          </div>

          <!-- FORMULARIO DE CARGA -->
          <form @submit.prevent="registrarEnvasado" class="mt-6" v-if="stockDisponible">
            <div class="form-grid" :class="{ 'disabled-overlay': !canEnvasar }">
              <div v-if="!canEnvasar" class="no-stock-msg">
                <i class="ph ph-warning-circle"></i> No hay stock disponible para este código.
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Cantidad a Envasar (Bolsitas)</label>
                  <input 
                    type="number" 
                    class="form-control text-xl" 
                    v-model="form.cantidad" 
                    placeholder="0" 
                    :disabled="!canEnvasar || isSubmitting"
                    required
                  >
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Peso Envasado (kg)</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    class="form-control text-xl text-blue" 
                    v-model="form.peso" 
                    placeholder="0.000" 
                    :disabled="!canEnvasar || isSubmitting"
                    required
                  >
                </div>
              </div>

              <div class="form-group mt-4">
                <label class="form-label">Envasador / Nombre</label>
                <input type="text" class="form-control bg-muted" :value="authStore.user?.usuario" readonly>
              </div>

              <div v-if="mensaje.texto" class="alert-box mt-4" :class="mensaje.tipo">
                {{ mensaje.texto }}
              </div>

              <button 
                type="submit" 
                class="btn btn-primary w-full btn-lg mt-6" 
                :disabled="!canEnvasar || isSubmitting"
              >
                <i class="ph" :class="isSubmitting ? 'ph-spinner spinner' : 'ph-check-circle'"></i>
                {{ isSubmitting ? 'Procesando...' : 'Confirmar Envasado' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- STOCK A FETEAR (Tabla lateral) -->
      <div class="card history-card no-padding-mobile">
        <div class="card-header responsive-card-header" style="justify-content: space-between;">
          <h3 class="card-title">Stock para Envasar</h3>
          <button class="icon-btn" @click="cargarStockAFetear" title="Actualizar">
            <i class="ph ph-arrows-clockwise"></i>
          </button>
        </div>
        <div class="table-container" style="max-height: 400px; overflow-y: auto;">
          <table class="responsive-table">
            <thead>
              <tr>
                <th>Cód. Prod.</th>
                <th class="text-right">Peso (kg)</th>
                <th class="text-right">Cant.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="stockAFetear.length === 0">
                <td colspan="3" class="text-center text-muted" style="padding: 1rem;">No hay stock pendiente.</td>
              </tr>
              <tr v-for="s in stockAFetear" :key="s.id">
                <td class="fw-bold">{{ s.codigo }}</td>
                <td class="text-right text-orange fw-bold">{{ s.peso }}</td>
                <td class="text-right">{{ s.cantidad }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.envasado-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .envasado-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 1.25rem;
  }
}

.search-input-group {
  display: flex;
  gap: 0.4rem;
}

.search-btn {
  width: 44px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.stock-info-box {
  display: flex;
  gap: 1rem;
  padding: 0.6rem 0.75rem;
  background: var(--accent-primary-light);
  border: 1px solid var(--accent-primary);
  border-left: 4px solid var(--accent-primary);
}

.stock-info-box.no-stock {
  background: #f8d7da;
  border-color: var(--accent-danger);
  border-left-color: var(--accent-danger);
}

.stock-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--accent-primary);
}

.no-stock .stat-value {
  color: var(--accent-danger);
}

.form-grid {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 0.75rem;
}

.flex-1 { flex: 1; }

.disabled-overlay {
  opacity: 0.55;
  pointer-events: none;
}

.no-stock-msg {
  background: #f8d7da;
  color: var(--accent-danger);
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--accent-danger);
  border-left: 4px solid var(--accent-danger);
  font-size: 0.82rem;
  font-weight: 600;
}

.text-xl {
  font-size: 1.35rem;
  height: 48px;
  text-align: center;
  font-weight: 800;
}

.bg-muted {
  background: var(--bg-primary) !important;
  color: var(--text-muted);
}



.icon-huge {
  font-size: 3rem;
  color: var(--accent-primary);
  opacity: 0.4;
  display: block;
}

@media (max-width: 640px) {
  .form-row { flex-direction: column; }
}
</style>

