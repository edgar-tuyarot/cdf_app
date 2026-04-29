<script setup>
import { ref, onMounted, computed } from 'vue'

// --- ESTADO ---
const ingresos = ref([])
const productos = ref([])
const isLoading = ref(false)
const showForm = ref(false)
const isSubmitting = ref(false)
const mensaje = ref({ tipo: '', texto: '' })

// Para el buscador de productos (datalist)
const productoBuscado = ref('')
const inputProducto = ref(null)

const nuevoIngreso = ref({
  fecha: new Date().toISOString().slice(0, 19).replace('T', ' '),
  proveedor: '',
  nro_factura: '',
  id_producto_proveedor: '',
  id_producto: '',
  kilos_totales: '',
  bultos: '',
  vencimiento: ''
})

const limpiarTodo = () => {
  nuevoIngreso.value = {
    fecha: new Date().toISOString().slice(0, 19).replace('T', ' '),
    proveedor: '',
    nro_factura: '',
    id_producto_proveedor: '',
    id_producto: '',
    kilos_totales: '',
    bultos: '',
    vencimiento: ''
  }
  productoBuscado.value = ''
}

// --- MÉTODOS ---
const mostrarMensaje = (tipo, texto) => {
  mensaje.value = { tipo, texto }
  setTimeout(() => { mensaje.value = { tipo: '', texto: '' } }, 4000)
}

const cargarDatos = async () => {
  isLoading.value = true
  try {
    const [resIngresos, resProductos] = await Promise.all([
      fetch('/api/ingresos').catch(() => ({ ok: false })),
      fetch('/api/productos').catch(() => ({ ok: false }))
    ])
    
    if (resIngresos.ok) ingresos.value = await resIngresos.json()
    if (resProductos.ok) productos.value = await resProductos.json()
  } catch (error) {
    console.error("Error al cargar datos:", error)
  } finally {
    isLoading.value = false
  }
}

const onProductoSelect = () => {
  const selected = productos.value.find(p => `[${p.codigo_interno}] ${p.descripcion}` === productoBuscado.value)
  if (selected) {
    nuevoIngreso.value.id_producto = selected.id_producto
  } else {
    nuevoIngreso.value.id_producto = ''
  }
}

const registrarIngreso = async () => {
  isSubmitting.value = true
  try {
    const res = await fetch('/api/ingresos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...nuevoIngreso.value,
        id_producto: Number(nuevoIngreso.value.id_producto),
        kilos_totales: Number(nuevoIngreso.value.kilos_totales),
        bultos: Number(nuevoIngreso.value.bultos)
      })
    })

    const data = await res.json()

    if (res.ok) {
      mostrarMensaje('success', `Producto [${nuevoIngreso.value.id_producto_proveedor}] registrado con éxito.`)
      
      // SOLO RESETEAMOS LOS CAMPOS DEL PRODUCTO, MANTENEMOS CABECERA (Sticky)
      nuevoIngreso.value.id_producto_proveedor = ''
      nuevoIngreso.value.id_producto = ''
      nuevoIngreso.value.kilos_totales = ''
      nuevoIngreso.value.bultos = ''
      
      productoBuscado.value = ''
      cargarDatos()

      // Ponemos el foco de vuelta en el buscador para ingreso rápido
      setTimeout(() => {
        if (inputProducto.value) inputProducto.value.focus()
      }, 100)
    } else {
      mostrarMensaje('error', data.error || 'Error al registrar el ingreso.')
    }
  } catch (error) {
    console.error(error)
    mostrarMensaje('error', 'Error de red al intentar registrar.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  cargarDatos()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Ingreso Proveedores</h2>
        <p class="page-description">Recepción de mercadería de proveedores y control de stock inicial.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showForm = !showForm">
          <i :class="showForm ? 'ph-x' : 'ph-plus'"></i>
          {{ showForm ? 'Cancelar' : 'Nuevo Ingreso' }}
        </button>
      </div>
    </div>

    <!-- Mensajes -->
    <div v-if="mensaje.texto" class="alert" :class="mensaje.tipo === 'success' ? 'alert-success' : 'alert-danger'">
      <i :class="mensaje.tipo === 'success' ? 'ph-check-circle' : 'ph-warning-circle'"></i>
      {{ mensaje.texto }}
    </div>

    <!-- Formulario de Ingreso -->
    <div v-if="showForm" class="card form-card mb-6">
      <div class="card-header">
        <h3 class="card-title">Registrar Ingreso de Mercadería</h3>
        <button class="btn btn-outline btn-sm" @click="limpiarTodo">
          <i class="ph-broom"></i> Nueva Factura (Limpiar todo)
        </button>
      </div>
      <form @submit.prevent="registrarIngreso" class="p-4">
        <!-- Cabecera de la Factura (Sticky) -->
        <div class="form-section-title">Datos de la Factura / Remito</div>
        <div class="form-grid header-grid mb-6">
          <div class="form-group">
            <label class="form-label">Fecha y Hora</label>
            <input type="text" class="form-control" v-model="nuevoIngreso.fecha" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Proveedor</label>
            <input type="text" class="form-control" v-model="nuevoIngreso.proveedor" placeholder="Ej: CAGNOLI" required>
          </div>

          <div class="form-group">
            <label class="form-label">Nro Factura / Remito</label>
            <input type="text" class="form-control" v-model="nuevoIngreso.nro_factura" placeholder="Ej: RE-001-000456" required>
          </div>
        </div>

        <hr class="form-divider mb-6">

        <!-- Datos del Producto (Se limpian tras cada registro) -->
        <div class="form-section-title">Detalle del Producto</div>
        <div class="form-grid">
          <div class="form-group span-2">
            <label class="form-label">Nuestro Producto (Buscador)</label>
            <input 
              ref="inputProducto"
              list="productos-list" 
              class="form-control highlight-input" 
              v-model="productoBuscado" 
              @input="onProductoSelect" 
              placeholder="Escribe para buscar nuestro producto..." 
              required
            >
            <datalist id="productos-list">
              <option v-for="prod in productos" :key="prod.id_producto" :value="`[${prod.codigo_interno}] ${prod.descripcion}`"></option>
            </datalist>
            <input type="hidden" v-model="nuevoIngreso.id_producto" required>
          </div>

          <div class="form-group">
            <label class="form-label">Cód. Prov. (Barras/Interno)</label>
            <input type="text" class="form-control" v-model="nuevoIngreso.id_producto_proveedor" placeholder="Ej: 9988" required>
          </div>

          <div class="form-group">
            <label class="form-label">Kilos Totales</label>
            <input type="number" step="0.01" class="form-control" v-model="nuevoIngreso.kilos_totales" placeholder="0.00" required>
          </div>

          <div class="form-group">
            <label class="form-label">Bultos</label>
            <input type="number" class="form-control" v-model="nuevoIngreso.bultos" placeholder="Cant. bultos" required>
          </div>

          <div class="form-group">
            <label class="form-label">Vencimiento</label>
            <input type="date" class="form-control" v-model="nuevoIngreso.vencimiento" required>
          </div>
        </div>

        <div class="form-actions mt-6">
          <button type="submit" class="btn btn-primary btn-block" :disabled="isSubmitting">
            <i v-if="isSubmitting" class="ph-spinner spinner"></i>
            <i v-else class="ph-floppy-disk"></i>
            {{ isSubmitting ? 'Registrando...' : 'Confirmar Ingreso de Mercadería' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Listado Reciente -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Últimos Ingresos Registrados</h3>
      </div>
      <div class="table-container">
        <div v-if="isLoading" class="loading-state">Cargando...</div>
        <table v-else>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Factura</th>
              <th>Producto</th>
              <th class="text-right">Kilos</th>
              <th class="text-right">Bultos</th>
              <th>Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ingreso in ingresos" :key="ingreso.id_ingreso">
              <td class="text-sm">{{ ingreso.fecha }}</td>
              <td class="fw-medium">{{ ingreso.proveedor }}</td>
              <td class="text-sm text-muted">{{ ingreso.nro_factura }}</td>
              <td>
                <div class="fw-medium">{{ ingreso.Producto?.descripcion || 'Producto #' + ingreso.id_producto }}</div>
                <div class="text-xs text-muted">Ref: {{ ingreso.id_producto_proveedor }}</div>
              </td>
              <td class="text-right fw-medium text-blue">{{ ingreso.kilos_totales }} kg</td>
              <td class="text-right">{{ ingreso.bultos }}</td>
              <td class="text-sm">{{ ingreso.vencimiento }}</td>
            </tr>
            <tr v-if="ingresos.length === 0 && !isLoading">
              <td colspan="7" class="text-center text-muted py-8">No se han registrado ingresos aún.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
}

.header-grid {
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--glass-border);
}

.form-section-title {
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-primary);
  font-weight: 600;
  margin-bottom: 1rem;
}

.form-divider {
  border: 0;
  border-top: 1px solid var(--glass-border);
}

.highlight-input {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.span-2 {
  grid-column: span 2;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.alert-success { background-color: rgba(16, 185, 129, 0.1); color: var(--accent-success); border: 1px solid rgba(16, 185, 129, 0.2); }
.alert-danger { background-color: rgba(239, 68, 68, 0.1); color: var(--accent-danger); border: 1px solid rgba(239, 68, 68, 0.2); }

.mb-6 { margin-bottom: 1.5rem; }
.mt-6 { margin-top: 1.5rem; }
.p-4 { padding: 1.25rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }

.btn-block { width: 100%; padding: 0.75rem; font-size: 1rem; }

.fw-medium { font-weight: 500; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.text-muted { color: var(--text-muted); }
.text-blue { color: var(--accent-primary); }
.text-right { text-align: right; }
.text-center { text-align: center; }

.loading-state {
  padding: 3rem;
  text-align: center;
  color: var(--text-muted);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .span-2 {
    grid-column: span 1;
  }
}
</style>
