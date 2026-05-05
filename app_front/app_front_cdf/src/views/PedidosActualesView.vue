<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const pedidos = ref([])
const isLoading = ref(true)
const error = ref('')
const expandedPedido = ref(null)

// Estado de preparación
const preparandoItem = ref(null) // { pedidoId, item }
const pesoReal = ref('')
const cantidadReal = ref('')
const isSubmittingPrep = ref(false)
const itemsPreparados = ref({}) // { pedidoId: [ { itemId, productoCodigo, cantidad, cantidad_pedida, pesoReal, estado } ] }

// Estado de edición de item preparado
const editandoItem = ref(null) // { pedidoId, productoCodigo, itemId }
const editCantidad = ref('')
const editPeso = ref('')
const isSubmittingEdit = ref(false)

// Estado de agregar item extra
const agregandoItem = ref(null) // pedidoId
const nuevoItemCodigo = ref('')
const nuevoItemFraccion = ref('')
const handleRowClick = (pedidoId, item) => {
  const isPrep = isItemPreparado(pedidoId, item.productoCodigo)
  if (isPrep) {
    if (isEditandoEsteItem(pedidoId, item.productoCodigo)) {
      cancelarEdicion()
    } else {
      iniciarEdicion(pedidoId, item.productoCodigo)
    }
  } else {
    if (isPreparandoEsteItem(pedidoId, item)) {
      cancelarPreparacion()
    } else {
      iniciarPreparacion(pedidoId, item)
    }
  }
}

const fetchPedidos = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/pedidos')
    if (!res.ok) throw new Error('Error al cargar pedidos')
    pedidos.value = await res.json()
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchPedidos()
  // Pre-cargar items preparados de todos los pedidos
  for (const pedido of pedidos.value) {
    await fetchItemsPreparados(pedido.id)
  }
})

const fetchItemsPreparados = async (pedidoId) => {
  try {
    const res = await fetch(`/api/pedidos/${pedidoId}/items-preparados`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        itemsPreparados.value[pedidoId] = data
      }
    }
  } catch (err) {
    console.error(`Error cargando items preparados del pedido ${pedidoId}:`, err)
  }
}

const toggleExpand = async (id) => {
  expandedPedido.value = expandedPedido.value === id ? null : id
  // Al cerrar, cancelar cualquier preparación en curso
  if (expandedPedido.value !== id) {
    cancelarPreparacion()
  } else {
    // Al abrir, cargar items preparados
    await fetchItemsPreparados(id)
  }
}

const formatFecha = (fecha) => {
  if (!fecha) return '—'
  try {
    const d = new Date(fecha)
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return fecha
  }
}

// Resumen calculado desde items reales
const getResumen = (pedido) => {
  const items = pedido.items || []
  const totalItems = items.length
  const totalFeteado = items
    .filter(i => i.tipo === 'FETEADO')
    .reduce((s, i) => s + (i.cantidad || 0), 0)
  const totalPiezas = items
    .filter(i => i.tipo === 'PIEZA')
    .reduce((s, i) => s + (i.cantidad || 0), 0)
  return { totalItems, totalFeteado, totalPiezas }
}

const estadoClass = (estado) => {
  if (!estado) return ''
  const e = estado.toUpperCase()
  if (e === 'CANCELADO') return 'estado-cancelado'
  if (e === 'PENDIENTE') return 'estado-pendiente'
  if (e === 'PREPARANDO') return 'estado-preparando'
  if (e === 'COMPLETADO' || e === 'ENTREGADO') return 'estado-completado'
  return 'estado-default'
}

// Preparación de items
const iniciarPreparacion = (pedidoId, item) => {
  preparandoItem.value = { pedidoId, item }
  cantidadReal.value = item.cantidad // Pre-fill con la cantidad pedida
  pesoReal.value = ''
}

const cancelarPreparacion = () => {
  preparandoItem.value = null
  cantidadReal.value = ''
  pesoReal.value = ''
}

const isItemPreparado = (pedidoId, productoCodigo) => {
  const lista = itemsPreparados.value[pedidoId] || []
  return lista.some(i => i.productoCodigo === productoCodigo)
}

const getItemPreparado = (pedidoId, productoCodigo) => {
  const lista = itemsPreparados.value[pedidoId] || []
  return lista.find(i => i.productoCodigo === productoCodigo) || null
}

const getItemCumplimiento = (pedidoId, productoCodigo) => {
  const prep = getItemPreparado(pedidoId, productoCodigo)
  if (!prep || !prep.cantidad_pedida) return 0
  return Math.min(Math.round((prep.cantidad / prep.cantidad_pedida) * 100), 100)
}

const getCumplimientoPedido = (pedido) => {
  const lista = itemsPreparados.value[pedido.id] || []
  if (lista.length === 0) return 0
  const items = pedido.items || []
  if (items.length === 0) return 0
  
  let totalPedido = 0
  let totalPreparado = 0
  
  for (const item of items) {
    totalPedido += item.cantidad || 0
    const prep = lista.find(p => p.productoCodigo === item.productoCodigo)
    if (prep) {
      totalPreparado += Math.min(prep.cantidad, item.cantidad)
    }
  }
  
  if (totalPedido === 0) return 0
  return Math.min(Math.round((totalPreparado / totalPedido) * 100), 100)
}

const isPreparandoEsteItem = (pedidoId, item) => {
  return preparandoItem.value?.pedidoId === pedidoId && 
         preparandoItem.value?.item?.productoCodigo === item.productoCodigo
}

const confirmarItem = async () => {
  if (!preparandoItem.value || !pesoReal.value || !cantidadReal.value) return
  
  isSubmittingPrep.value = true
  const { pedidoId, item } = preparandoItem.value

  try {
    const payload = {
      productoCodigo: item.productoCodigo,
      estado: item.tipo || 'FETEADO',
      cantidad: parseInt(cantidadReal.value) || 0,
      pesoReal: parseFloat(pesoReal.value) || 0
    }

    const response = await fetch(`/api/pedidos/${pedidoId}/preparar-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Error al preparar item')
    }

    // Guardar datos de preparación del response
    const responseData = await response.json()
    if (Array.isArray(responseData)) {
      itemsPreparados.value[pedidoId] = responseData
    } else {
      // Si no devuelve array, marcar manualmente
      if (!itemsPreparados.value[pedidoId]) {
        itemsPreparados.value[pedidoId] = []
      }
      itemsPreparados.value[pedidoId].push({
        productoCodigo: item.productoCodigo,
        estado: item.tipo || 'FETEADO',
        cantidad: parseInt(cantidadReal.value) || 0,
        pesoReal: parseFloat(pesoReal.value) || 0,
        cantidad_pedida: item.cantidad
      })
    }
    cancelarPreparacion()
    
    // Refrescar pedidos para actualizar estados
    await fetchPedidos()
    // Re-expandir el pedido actual
    expandedPedido.value = pedidoId

  } catch (err) {
    console.error('Error al preparar item:', err)
    alert(`Error: ${err.message}`)
  } finally {
    isSubmittingPrep.value = false
  }
}

// Conteo de items preparados por pedido
const itemsPreparadosCount = (pedido) => {
  const lista = itemsPreparados.value[pedido.id] || []
  return lista.length
}

// --- EDITAR ITEM PREPARADO ---
const iniciarEdicion = (pedidoId, productoCodigo) => {
  const prep = getItemPreparado(pedidoId, productoCodigo)
  if (!prep) return
  editandoItem.value = { pedidoId, productoCodigo, itemId: prep.itemId }
  editCantidad.value = prep.cantidad
  editPeso.value = prep.pesoReal
  // Cerrar formulario de preparar si hay uno abierto
  cancelarPreparacion()
}

const cancelarEdicion = () => {
  editandoItem.value = null
  editCantidad.value = ''
  editPeso.value = ''
}

const isEditandoEsteItem = (pedidoId, productoCodigo) => {
  return editandoItem.value?.pedidoId === pedidoId &&
         editandoItem.value?.productoCodigo === productoCodigo
}

const submitEditItem = async () => {
  if (!editandoItem.value || !editCantidad.value || !editPeso.value) return
  isSubmittingEdit.value = true
  const { pedidoId, itemId } = editandoItem.value

  try {
    const payload = {
      cantidad: parseInt(editCantidad.value) || 0,
      pesoReal: parseFloat(editPeso.value) || 0
    }

    const response = await fetch(`/api/pedidos/items-preparados/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Error al editar item')
    }

    const responseData = await response.json()
    if (Array.isArray(responseData)) {
      itemsPreparados.value[pedidoId] = responseData
    }
    cancelarEdicion()
    await fetchPedidos()
    expandedPedido.value = pedidoId
  } catch (err) {
    console.error('Error al editar item:', err)
    alert(`Error: ${err.message}`)
  } finally {
    isSubmittingEdit.value = false
  }
}

// --- AGREGAR ITEM EXTRA AL PEDIDO ---
const iniciarAgregarItem = (pedidoId) => {
  agregandoItem.value = pedidoId
  nuevoItemCodigo.value = ''
  nuevoItemFraccion.value = ''
  nuevoItemPiezas.value = ''
}

const cancelarAgregarItem = () => {
  agregandoItem.value = null
  nuevoItemCodigo.value = ''
  nuevoItemFraccion.value = ''
  nuevoItemPiezas.value = ''
}

const submitAgregarItem = async () => {
  if (!agregandoItem.value || !nuevoItemCodigo.value) return
  if (!nuevoItemFraccion.value && !nuevoItemPiezas.value) {
    alert('Ingrese cantidad de fracciones o piezas')
    return
  }
  isSubmittingAgregar.value = true

  try {
    const payload = {
      codigo: nuevoItemCodigo.value,
      cantidad_fraccion: parseInt(nuevoItemFraccion.value) || 0,
      cantidad_piezas: parseInt(nuevoItemPiezas.value) || 0
    }

    const response = await fetch(`/api/pedidos/${agregandoItem.value}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Error al agregar item')
    }

    const pedidoId = agregandoItem.value
    cancelarAgregarItem()
    await fetchPedidos()
    expandedPedido.value = pedidoId
  } catch (err) {
    console.error('Error al agregar item:', err)
    alert(`Error: ${err.message}`)
  } finally {
    isSubmittingAgregar.value = false
  }
}
</script>

<template>
  <div class="pedidos-actuales-view">
    <header class="view-header">
      <div class="header-content">
        <h2>Pedidos Actuales</h2>
        <p>Listado de pedidos · Preparación de despacho</p>
      </div>
      <button class="refresh-btn" @click="fetchPedidos" :disabled="isLoading">
        <span class="material-icons" :class="{ 'spinning': isLoading }">refresh</span>
      </button>
    </header>

    <!-- Error -->
    <div v-if="error" class="alert error">
      <span class="material-icons">error_outline</span> {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <span class="material-icons spinning">sync</span>
      <p>Cargando pedidos...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="pedidos.length === 0" class="empty-state">
      <span class="material-icons empty-icon">inbox</span>
      <p>No hay pedidos registrados.</p>
    </div>

    <!-- Lista de Pedidos -->
    <div v-else class="pedidos-list">
      <div
        v-for="pedido in pedidos"
        :key="pedido.id"
        class="pedido-card"
        :class="{ 
          expanded: expandedPedido === pedido.id,
          'card-preparando': pedido.estado?.toUpperCase() === 'PREPARANDO'
        }"
      >
        <!-- Header del pedido -->
        <div class="pedido-header" @click="toggleExpand(pedido.id)">
          <div class="pedido-info">
            <div class="pedido-top-row">
              <span class="pedido-id">#{{ pedido.id }}</span>
              <span class="pedido-fecha">{{ formatFecha(pedido.fecha) }}</span>
              <span v-if="pedido.estado" :class="['estado-badge', estadoClass(pedido.estado)]">
                {{ pedido.estado }}
              </span>
            </div>
            <span class="pedido-sucursal">{{ pedido.sucursal?.nombre || '—' }}</span>
          </div>
          <div class="pedido-meta">
            <div class="meta-chips">
              <span class="chip" v-if="getResumen(pedido).totalFeteado > 0">
                {{ getResumen(pedido).totalFeteado }} fet.
              </span>
              <span class="chip" v-if="getResumen(pedido).totalPiezas > 0">
                {{ getResumen(pedido).totalPiezas }} pzas.
              </span>
              <span class="chip items-chip">
                {{ getResumen(pedido).totalItems }} ítem{{ getResumen(pedido).totalItems !== 1 ? 's' : '' }}
              </span>
              <span v-if="itemsPreparadosCount(pedido) > 0" class="chip prep-chip">
                {{ getCumplimientoPedido(pedido) }}%
              </span>
            </div>
            <span class="expand-arrow" :class="{ rotated: expandedPedido === pedido.id }">▼</span>
          </div>
        </div>

        <!-- Detalle expandido -->
        <div v-if="expandedPedido === pedido.id" class="pedido-detail">
          <div class="items-list">
            <div
              v-for="item in (pedido.items || [])"
              :key="item.id"
              <div
                class="item-row"
                :class="{ 
                  'item-is-prepared': isItemPreparado(pedido.id, item.productoCodigo),
                  'item-is-pending': !isItemPreparado(pedido.id, item.productoCodigo),
                  'item-activo': isPreparandoEsteItem(pedido.id, item) || isEditandoEsteItem(pedido.id, item.productoCodigo)
                }"
              >
                <!-- Info del item (reducida) -->
                <div class="item-main" @click="handleRowClick(pedido.id, item)" style="cursor: pointer;">
                  <div class="item-left">
                    <div class="item-info">
                      <span class="item-nombre" style="font-size: 1.05rem; font-weight: 700;">{{ item.productoNombre }}</span>
                    </div>
                  </div>
                  <div class="item-right">
                    <span v-if="isItemPreparado(pedido.id, item.productoCodigo)" class="item-cantidad" style="font-weight: 800;">
                      {{ getItemPreparado(pedido.id, item.productoCodigo)?.cantidad }}/{{ item.cantidad }}
                    </span>
                    <span v-else class="item-cantidad" style="font-weight: 800; font-size: 1.15rem;">
                      {{ item.cantidad }}
                    </span>
                    <span v-if="isItemPreparado(pedido.id, item.productoCodigo)" 
                      :class="['cumpl-badge', getItemCumplimiento(pedido.id, item.productoCodigo) >= 100 ? 'cumpl-ok' : 'cumpl-parcial']"
                    >
                      {{ getItemCumplimiento(pedido.id, item.productoCodigo) }}%
                    </span>
                  </div>
                </div>

                <!-- Detalles y formulario expandidos -->
                <Transition name="expand">
                  <div v-if="isPreparandoEsteItem(pedido.id, item) || isEditandoEsteItem(pedido.id, item.productoCodigo)" class="item-expanded-full-width" @click.stop>
                    
                    <!-- Formulario de preparación inline -->
                    <div v-if="isPreparandoEsteItem(pedido.id, item)" class="prep-form subtle-form-full">
                      <table class="subtle-table">
                        <tr>
                          <td class="t-label" style="width:30%">CÓDIGO</td>
                          <td class="t-label" style="width:35%">TIPO</td>
                          <td class="t-label" style="width:35%">PEDIDO</td>
                        </tr>
                        <tr>
                          <td class="t-val">{{ item.productoCodigo }}</td>
                          <td class="t-val">{{ item.tipo }}</td>
                          <td class="t-val">{{ item.cantidad }}</td>
                        </tr>
                        <tr>
                          <td class="t-label spacer-top" colspan="2">Cant. {{ item.tipo === 'FETEADO' ? 'Fracciones' : 'Piezas' }}</td>
                          <td class="t-label spacer-top">Peso Real (KG)</td>
                        </tr>
                        <tr>
                          <td colspan="2">
                            <input v-model="cantidadReal" type="number" class="t-input" placeholder="Ej: 20" required />
                          </td>
                          <td>
                            <input v-model="pesoReal" type="number" step="0.001" class="t-input" placeholder="Ej: 1.250" required />
                          </td>
                        </tr>
                      </table>

                      <div class="prep-actions centered-actions">
                        <button type="button" class="cancel-btn" @click.stop="cancelarPreparacion">
                          Cancelar
                        </button>
                        <button 
                          class="confirm-btn" 
                          :disabled="isSubmittingPrep || !pesoReal || !cantidadReal"
                          @click.stop="confirmarItem"
                        >
                          <span class="material-icons">{{ isSubmittingPrep ? 'sync' : 'check' }}</span>
                          {{ isSubmittingPrep ? 'Enviando...' : 'Confirmar' }}
                        </button>
                      </div>
                    </div>

                    <!-- Formulario de edición de item preparado -->
                    <div v-if="isEditandoEsteItem(pedido.id, item.productoCodigo)" class="prep-form subtle-form-full edit-form">
                      <table class="subtle-table">
                        <tr>
                          <td class="t-label" style="width:30%">CÓDIGO</td>
                          <td class="t-label" style="width:35%">PREPARADO</td>
                          <td class="t-label" style="width:35%">PEDIDO</td>
                        </tr>
                        <tr>
                          <td class="t-val">{{ item.productoCodigo }}</td>
                          <td class="t-val">{{ getItemPreparado(pedido.id, item.productoCodigo)?.cantidad }}</td>
                          <td class="t-val">{{ item.cantidad }}</td>
                        </tr>
                        <tr>
                          <td class="t-label spacer-top" colspan="2">Cant. {{ item.tipo === 'FETEADO' ? 'Fracciones' : 'Piezas' }}</td>
                          <td class="t-label spacer-top">Peso Real (KG)</td>
                        </tr>
                        <tr>
                          <td colspan="2">
                            <input v-model="editCantidad" type="number" class="t-input" required />
                          </td>
                          <td>
                            <input v-model="editPeso" type="number" step="0.001" class="t-input" required />
                          </td>
                        </tr>
                      </table>

                      <div class="prep-actions centered-actions">
                        <button type="button" class="cancel-btn" @click.stop="cancelarEdicion">
                          Cancelar
                        </button>
                        <button 
                          class="confirm-btn edit-confirm"
                          :disabled="isSubmittingEdit || !editCantidad || !editPeso"
                          @click.stop="submitEditItem"
                        >
                          <span class="material-icons">{{ isSubmittingEdit ? 'sync' : 'save' }}</span>
                          {{ isSubmittingEdit ? 'Guardando...' : 'Guardar' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
          </div>

          <div class="detail-footer">
            <div class="detail-totals">
              <span>{{ getResumen(pedido).totalItems }} productos</span>
              <span v-if="getResumen(pedido).totalFeteado > 0">· {{ getResumen(pedido).totalFeteado }} feteado</span>
              <span v-if="getResumen(pedido).totalPiezas > 0">· {{ getResumen(pedido).totalPiezas }} piezas</span>
            </div>
            <div v-if="itemsPreparadosCount(pedido) > 0" class="progress-section">
              <div class="progress-header">
                <span class="progress-label">Cumplimiento</span>
                <span class="progress-pct" :class="{ 'pct-full': getCumplimientoPedido(pedido) >= 100 }">
                  {{ getCumplimientoPedido(pedido) }}%
                </span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :class="{ 'fill-full': getCumplimientoPedido(pedido) >= 100 }"
                  :style="{ width: getCumplimientoPedido(pedido) + '%' }"
                ></div>
              </div>
              <span class="progress-detail">
                {{ itemsPreparadosCount(pedido) }}/{{ getResumen(pedido).totalItems }} items preparados
              </span>
            </div>
            <!-- Botón y formulario para agregar item extra -->
            <div class="add-item-section">
              <button v-if="agregandoItem !== pedido.id" class="add-item-btn" @click.stop="iniciarAgregarItem(pedido.id)">
                <span class="material-icons">add_circle_outline</span>
                Agregar producto
              </button>
              <div v-else class="add-item-form">
                <div class="add-item-header">
                  <span class="material-icons">add_shopping_cart</span>
                  <span>Agregar producto al pedido</span>
                </div>
                <div class="add-item-fields">
                  <BaseInput 
                    v-model="nuevoItemCodigo" 
                    label="Código Producto" 
                    placeholder="Ej: 8010"
                    required
                    class="prep-input"
                  />
                  <BaseInput 
                    v-model="nuevoItemFraccion" 
                    label="Cant. Fracciones" 
                    type="number" 
                    placeholder="0"
                    class="prep-input"
                  />
                  <BaseInput 
                    v-model="nuevoItemPiezas" 
                    label="Cant. Piezas" 
                    type="number" 
                    placeholder="0"
                    class="prep-input"
                  />
                </div>
                <div class="prep-actions">
                  <button type="button" class="cancel-btn" @click.stop="cancelarAgregarItem">
                    Cancelar
                  </button>
                  <button 
                    class="confirm-btn"
                    :disabled="isSubmittingAgregar || !nuevoItemCodigo || (!nuevoItemFraccion && !nuevoItemPiezas)"
                    @click.stop="submitAgregarItem"
                  >
                    <span class="material-icons">{{ isSubmittingAgregar ? 'sync' : 'add' }}</span>
                    {{ isSubmittingAgregar ? 'Agregando...' : 'Agregar' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pedidos-actuales-view {
  max-width: 700px;
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
  font-size: 0.85rem;
  font-weight: 600;
}

.refresh-btn {
  background: white;
  border: 2px solid var(--color-border);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-primary);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.refresh-btn:hover {
  background-color: #F0F0F0;
}

/* Loading */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: var(--color-text-muted);
  gap: 12px;
}

.loading-state .material-icons, .empty-state .material-icons {
  font-size: 2.5rem;
  opacity: 0.4;
}

/* Alert */
.alert {
  padding: 12px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.alert.error {
  background-color: #FFEBEE;
  color: #C62828;
  border: 1px solid #FFCDD2;
}

/* Pedidos list */
.pedidos-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pedido-card {
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all 0.2s ease;
}

.pedido-card.expanded {
  border-color: var(--color-secondary);
}

.pedido-card.card-preparando {
  border-left: 4px solid #FF9800;
}

.pedido-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.pedido-header:hover {
  background-color: #FAFAFA;
}

.pedido-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pedido-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pedido-id {
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--color-secondary);
}

.pedido-fecha {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.pedido-sucursal {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
}

.pedido-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.meta-chips {
  display: flex;
  gap: 6px;
}

.chip {
  background-color: #F0F4F8;
  border: 1px solid var(--color-border);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.items-chip {
  background-color: #E8EAF6;
  color: #3949AB;
}

.prep-chip {
  background-color: #E8F5E9;
  color: #2E7D32;
  border-color: #C8E6C9;
}

.expand-arrow {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  transition: transform 0.2s ease;
}

.expand-arrow.rotated {
  transform: rotate(180deg);
}

/* Detail */
.pedido-detail {
  border-top: 1px solid var(--color-border);
  background-color: #FAFAFA;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Items list */
.items-list {
  display: flex;
  flex-direction: column;
}

.item-row {
  border-bottom: 1px solid #EEEEEE;
  transition: background-color 0.2s ease;
}

.item-row:last-child {
  border-bottom: none;
}

.item-row.item-preparado {
  background-color: #F1F8F1;
}

.item-row.item-activo {
  background-color: #FFF8E1;
}

.item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  gap: 10px;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.check-icon {
  color: #2E7D32;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.pending-icon {
  color: #BDBDBD;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.item-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-badge {
  background-color: var(--color-secondary);
  color: white;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 700;
  font-size: 0.78rem;
  white-space: nowrap;
}

.item-nombre {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
  word-break: break-word;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.item-cantidad {
  font-weight: 900;
  font-size: 0.95rem;
  color: var(--color-text);
  white-space: nowrap;
}

.prep-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.prep-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

/* Formulario de preparación */
.prep-form {
  padding: 0 16px 14px;
  animation: fadeSlide 0.2s ease;
}

@keyframes fadeSlide {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.prep-form-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: white;
  border: 2px solid var(--color-border);
  border-bottom: none;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.prep-form-header .material-icons {
  font-size: 1.1rem;
  color: var(--color-primary);
}

.prep-form-row {
  background: white;
  border: 2px solid var(--color-border);
  border-top: 1px solid #EEE;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prep-info-chips {
  display: flex;
  gap: 10px;
}

.prep-chip-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.plbl {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.pval {
  font-size: 0.9rem;
  font-weight: 800;
}

.inputs-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.prep-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.cancel-btn {
  background: none;
  border: 2px solid var(--color-border);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background-color: #F0F0F0;
}

.confirm-btn {
  background: #2E7D32;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.confirm-btn:hover:not(:disabled) {
  background: #1B5E20;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-btn .material-icons {
  font-size: 1rem;
}

/* Totals & Progress */
.detail-footer {
  border-top: 1px solid var(--color-border);
  padding: 12px 16px;
}

.detail-totals {
  display: flex;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.progress-pct {
  font-size: 0.85rem;
  font-weight: 900;
  color: #E65100;
}

.progress-pct.pct-full {
  color: #2E7D32;
}

.progress-bar {
  height: 8px;
  background-color: #EEEEEE;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF9800, #F57C00);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-fill.fill-full {
  background: linear-gradient(90deg, #66BB6A, #2E7D32);
}

.progress-detail {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

/* Cumplimiento per-item badge */
.cumpl-badge {
  font-size: 0.82rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
}

.cumpl-ok {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.cumpl-parcial {
  background-color: #FFF3E0;
  color: #E65100;
}

/* Estado badges */
.estado-badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.estado-cancelado {
  background-color: #FFEBEE;
  color: #C62828;
}

.estado-pendiente {
  background-color: #FFF3E0;
  color: #E65100;
}

.estado-preparando {
  background-color: #FFF8E1;
  color: #F57F17;
  border: 1px solid #FFE082;
}

.estado-completado {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.estado-default {
  background-color: #F5F5F5;
  color: var(--color-text-muted);
}

/* Tipo badges */
.tipo-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
}

.tipo-fet {
  background-color: #F3E5F5;
  color: #7B1FA2;
}

.tipo-pieza {
  background-color: #E3F2FD;
  color: #1565C0;
}

/* Spinning animation */
.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Expand transition */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Responsive */
@media (max-width: 480px) {
  .meta-chips {
    display: none;
  }

  .prep-btn {
    padding: 6px 10px;
    font-size: 0.72rem;
  }

  .prep-actions {
    flex-wrap: wrap;
  }

  .add-item-fields {
    grid-template-columns: 1fr !important;
  }
}

/* Edit form */
.edit-form .prep-form-header {
  border-color: #42A5F5;
}

.edit-form .prep-form-header .material-icons {
  color: #1565C0;
}

.edit-confirm {
  background: #1565C0 !important;
}

.edit-confirm:hover:not(:disabled) {
  background: #0D47A1 !important;
}

/* Edit hint on cumpl-badge */
.cumpl-badge {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: all 0.15s ease;
}

.cumpl-badge:hover {
  opacity: 0.85;
  transform: scale(1.05);
}

.edit-hint {
  font-size: 0.85rem;
  opacity: 0.6;
  margin-left: 2px;
}

/* Add item section */
.add-item-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
}

.add-item-btn {
  background: none;
  border: 2px dashed var(--color-border);
  width: 100%;
  padding: 10px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-item-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: #F5F5FF;
}

.add-item-form {
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  animation: fadeSlide 0.2s ease;
}

.add-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #F5F5F5;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-text);
}

.add-item-header .material-icons {
  color: var(--color-primary);
  font-size: 1.1rem;
}

.add-item-fields {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  padding: 12px;
}

/* Expanded styles and row states */
.item-is-prepared {
  background-color: #F1F8E9;
  border-bottom: 1px solid #C8E6C9;
}

.item-is-pending {
  background-color: #FFFFFF;
  border-bottom: 1px solid #F0F0F0;
}

.item-expanded-full-width {
  width: 100%;
  border-top: 1px dashed var(--color-border);
}

.subtle-form-full {
  background-color: transparent;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

.subtle-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  table-layout: fixed;
}

.subtle-table td {
  padding: 4px 4px 4px 0;
  border: none;
  vertical-align: middle;
}

.t-label {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  font-weight: 700;
  text-transform: uppercase;
}

.spacer-top {
  padding-top: 14px !important;
}

.t-val {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-text);
}

.t-input {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  background-color: white;
}

.t-input:focus {
  border-color: var(--color-primary);
}

.centered-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
}
</style>
