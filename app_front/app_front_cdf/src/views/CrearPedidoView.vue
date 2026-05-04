<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseSelect from '../components/BaseSelect.vue'

const router = useRouter()

// --- Estado ---
const sucursalId = ref('')
const sucursales = ref([])
const productos = ref([])
const itemsPedido = ref([])
const isSubmitting = ref(false)
const message = ref({ text: '', type: '' })

// Buscador de producto
const productoBusqueda = ref('')
const cantidadFraccion = ref('')
const cantidadPiezas = ref('')

// --- Fetch Data ---
const fetchSucursales = async () => {
  try {
    const res = await fetch('/api/sucursales')
    if (res.ok) {
      const data = await res.json()
      sucursales.value = data.map(s => ({ value: s.id, label: s.nombre }))
    }
  } catch (err) {
    console.error('Error al cargar sucursales:', err)
  }
}

const fetchProductos = async () => {
  try {
    const res = await fetch('/api/productos')
    if (res.ok) {
      productos.value = await res.json()
    }
  } catch (err) {
    console.error('Error al cargar productos:', err)
  }
}

onMounted(() => {
  fetchSucursales()
  fetchProductos()
})

// --- Producto seleccionado (resuelto desde datalist) ---
const productoSeleccionado = computed(() => {
  if (!productoBusqueda.value) return null
  const query = productoBusqueda.value.trim()
  return productos.value.find(
    p => p.codigo === query || p.codigo === query.split(' - ')[0]
  ) || null
})

// --- Agregar producto al pedido ---
const agregarProducto = () => {
  if (!productoSeleccionado.value) {
    message.value = { text: 'Selecciona un producto válido.', type: 'error' }
    return
  }

  const fraccion = parseInt(cantidadFraccion.value) || 0
  const piezas = parseInt(cantidadPiezas.value) || 0

  if (fraccion <= 0 && piezas <= 0) {
    message.value = { text: 'Ingresa al menos una cantidad.', type: 'error' }
    return
  }

  // Si ya existe, actualizar cantidades
  const existente = itemsPedido.value.find(
    i => i.codigo === productoSeleccionado.value.codigo
  )

  if (existente) {
    existente.cantidad_fraccion += fraccion
    existente.cantidad_piezas += piezas
  } else {
    itemsPedido.value.push({
      codigo: productoSeleccionado.value.codigo,
      nombre: productoSeleccionado.value.nombre,
      cantidad_fraccion: fraccion,
      cantidad_piezas: piezas
    })
  }

  // Limpiar formulario
  productoBusqueda.value = ''
  cantidadFraccion.value = ''
  cantidadPiezas.value = ''
  message.value = { text: '', type: '' }
}

// --- Quitar producto ---
const quitarProducto = (index) => {
  itemsPedido.value.splice(index, 1)
}

// --- JSON final ---
const pedidoJSON = computed(() => {
  const hoy = new Date()
  const fecha = hoy.getFullYear() + '-' +
    String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
    String(hoy.getDate()).padStart(2, '0')

  return {
    sucursalId: Number(sucursalId.value),
    fecha,
    items: itemsPedido.value.map(i => ({
      codigo: i.codigo,
      cantidad_fraccion: i.cantidad_fraccion,
      cantidad_piezas: i.cantidad_piezas
    }))
  }
})

// --- Totales ---
const totalItems = computed(() => itemsPedido.value.length)
const totalFracciones = computed(() =>
  itemsPedido.value.reduce((sum, i) => sum + i.cantidad_fraccion, 0)
)
const totalPiezas = computed(() =>
  itemsPedido.value.reduce((sum, i) => sum + i.cantidad_piezas, 0)
)

// --- Imprimir ---
const imprimirPedido = () => {
  const sucursalNombre = sucursales.value.find(
    s => s.value === Number(sucursalId.value)
  )?.label || 'Sin seleccionar'

  const hoy = new Date().toLocaleDateString('es-AR')

  let html = `
    <html><head><title>Pedido - ${sucursalNombre}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #222; }
      h1 { font-size: 1.4rem; margin-bottom: 4px; }
      .meta { color: #666; font-size: 0.9rem; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 0.85rem; }
      th { background: #f5f5f5; font-weight: 700; }
      .totals { margin-top: 16px; font-weight: 700; font-size: 0.95rem; }
    </style></head><body>
    <h1>Pedido — ${sucursalNombre}</h1>
    <p class="meta">Fecha: ${hoy} · ${totalItems.value} productos</p>
    <table>
      <thead><tr><th>Código</th><th>Producto</th><th>Fracción</th><th>Piezas</th></tr></thead>
      <tbody>
  `

  itemsPedido.value.forEach(i => {
    html += `<tr><td>${i.codigo}</td><td>${i.nombre}</td><td>${i.cantidad_fraccion}</td><td>${i.cantidad_piezas}</td></tr>`
  })

  html += `
      </tbody>
    </table>
    <p class="totals">Total Fracciones: ${totalFracciones.value} · Total Piezas: ${totalPiezas.value}</p>
    </body></html>
  `

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

// --- Enviar Pedido ---
const enviarPedido = async () => {
  if (!sucursalId.value) {
    message.value = { text: 'Selecciona una sucursal.', type: 'error' }
    return
  }
  if (itemsPedido.value.length === 0) {
    message.value = { text: 'Agrega al menos un producto.', type: 'error' }
    return
  }

  isSubmitting.value = true
  message.value = { text: '', type: '' }

  try {
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoJSON.value)
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || 'Error al enviar el pedido.')
    }

    message.value = { text: 'Pedido registrado con éxito.', type: 'success' }
    // Limpiar después de éxito
    itemsPedido.value = []
    sucursalId.value = ''
  } catch (err) {
    message.value = { text: err.message || 'Error de conexión.', type: 'error' }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="crear-pedido-view">
    <header class="view-header">
      <div class="header-content">
        <h2>Crear Pedido</h2>
        <p>Arma el pedido seleccionando productos</p>
      </div>
      <div class="header-actions">
        <BaseButton
          v-if="itemsPedido.length > 0"
          variant="minimal"
          size="small"
          @click="imprimirPedido"
        >
          Imprimir
        </BaseButton>
      </div>
    </header>

    <!-- Selección de Sucursal -->
    <BaseCard class="section-card">
      <template #header>
        <h3>Sucursal</h3>
      </template>
      <BaseSelect
        v-model="sucursalId"
        label="Sucursal de destino"
        placeholder="Selecciona una sucursal"
        :options="sucursales"
        required
      />
    </BaseCard>

    <!-- Agregar Productos -->
    <BaseCard class="section-card">
      <template #header>
        <h3>Agregar Producto</h3>
      </template>

      <div class="add-product-form">
        <div class="search-field">
          <BaseInput
            v-model="productoBusqueda"
            label="Buscar producto"
            placeholder="Código o nombre..."
            list="productos-pedido-list"
          />
          <datalist id="productos-pedido-list">
            <option
              v-for="p in productos"
              :key="p.codigo"
              :value="p.codigo"
            >
              {{ p.codigo }} - {{ p.nombre }}
            </option>
          </datalist>
        </div>

        <!-- Info del producto encontrado -->
        <div v-if="productoSeleccionado" class="producto-found">
          <span class="found-badge">{{ productoSeleccionado.codigo }}</span>
          <span class="found-name">{{ productoSeleccionado.nombre }}</span>
        </div>

        <div class="qty-row">
          <BaseInput
            v-model="cantidadFraccion"
            label="Cant. Fracción"
            type="number"
            placeholder="0"
          />
          <BaseInput
            v-model="cantidadPiezas"
            label="Cant. Piezas"
            type="number"
            placeholder="0"
          />
        </div>

        <BaseButton
          variant="primary"
          fullWidth
          @click="agregarProducto"
        >
          Agregar al Pedido
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Mensaje de estado -->
    <div v-if="message.text" :class="['alert', message.type]">
      {{ message.text }}
    </div>

    <!-- Lista de productos del pedido -->
    <BaseCard v-if="itemsPedido.length > 0" class="section-card">
      <template #header>
        <div class="list-header">
          <h3>Productos del Pedido</h3>
          <span class="item-count">{{ totalItems }}</span>
        </div>
      </template>

      <div class="pedido-list">
        <div
          v-for="(item, index) in itemsPedido"
          :key="item.codigo"
          class="pedido-item"
        >
          <div class="item-main">
            <div class="item-info">
              <span class="item-code">{{ item.codigo }}</span>
              <span class="item-name">{{ item.nombre }}</span>
            </div>
            <button class="remove-btn" @click="quitarProducto(index)">×</button>
          </div>
          <div class="item-quantities">
            <div class="qty-chip" v-if="item.cantidad_fraccion > 0">
              <span class="qty-label">Fracción</span>
              <span class="qty-value">{{ item.cantidad_fraccion }}</span>
            </div>
            <div class="qty-chip" v-if="item.cantidad_piezas > 0">
              <span class="qty-label">Piezas</span>
              <span class="qty-value">{{ item.cantidad_piezas }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen / Totales -->
      <div class="totals-bar">
        <div class="total-item">
          <span class="total-label">Fracciones</span>
          <span class="total-value">{{ totalFracciones }}</span>
        </div>
        <div class="total-item">
          <span class="total-label">Piezas</span>
          <span class="total-value">{{ totalPiezas }}</span>
        </div>
      </div>
    </BaseCard>

    <!-- Vacío -->
    <div v-if="itemsPedido.length === 0" class="empty-state">
      <span class="empty-icon">📋</span>
      <p>Aún no agregaste productos al pedido.</p>
    </div>

    <!-- Botón de envío -->
    <div v-if="itemsPedido.length > 0" class="submit-section">
      <BaseButton
        variant="primary"
        fullWidth
        :disabled="isSubmitting || !sucursalId"
        @click="enviarPedido"
      >
        {{ isSubmitting ? 'Enviando...' : 'Confirmar Pedido' }}
      </BaseButton>
    </div>

    <!-- Debug JSON (solo desarrollo) -->
    <details v-if="itemsPedido.length > 0" class="debug-json">
      <summary>Ver JSON del pedido</summary>
      <pre>{{ JSON.stringify(pedidoJSON, null, 2) }}</pre>
    </details>
  </div>
</template>

<style scoped>
.crear-pedido-view {
  max-width: 600px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-lg);
  gap: var(--space-md);
}

.header-content h2 {
  margin-bottom: 2px;
}

.header-content p {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.header-actions {
  flex-shrink: 0;
  padding-top: 4px;
}

.section-card {
  margin-bottom: var(--space-md);
}

/* --- Formulario agregar producto --- */
.add-product-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.search-field {
  position: relative;
}

.producto-found {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background-color: #F0F7FF;
  border: 1px solid #B3D4FC;
  border-radius: var(--radius-sm);
}

.found-badge {
  background-color: var(--color-secondary);
  color: white;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
}

.found-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.qty-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

/* --- Lista de pedido --- */
.list-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-count {
  background-color: var(--color-primary);
  color: white;
  font-size: 0.75rem;
  font-weight: 800;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.pedido-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pedido-item {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: #FAFAFA;
  transition: all 0.2s ease;
}

.pedido-item:hover {
  border-color: var(--color-secondary);
}

.item-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-code {
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--color-secondary);
}

.item-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.remove-btn {
  background: none;
  border: 1px solid #ddd;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-btn:hover {
  background-color: #FFEBEE;
  color: #D32F2F;
  border-color: #FFCDD2;
}

.item-quantities {
  display: flex;
  gap: 8px;
}

.qty-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background-color: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.qty-label {
  color: var(--color-text-muted);
  font-weight: 600;
}

.qty-value {
  font-weight: 800;
  color: var(--color-text);
}

/* --- Totales --- */
.totals-bar {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.total-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.total-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.total-value {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--color-text);
}

/* --- Estados --- */
.alert {
  padding: 12px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: var(--space-md);
}

.alert.success {
  background-color: #E8F5E9;
  color: #2E7D32;
  border: 1px solid #C8E6C9;
}

.alert.error {
  background-color: #FFEBEE;
  color: #C62828;
  border: 1px solid #FFCDD2;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl);
  color: var(--color-text-muted);
  text-align: center;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: var(--space-sm);
}

.submit-section {
  margin-top: var(--space-md);
  margin-bottom: var(--space-md);
}

/* --- Debug --- */
.debug-json {
  margin-top: var(--space-sm);
  padding: 12px;
  background-color: #F5F5F5;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.debug-json summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.debug-json pre {
  margin-top: 8px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--color-text);
}
</style>
