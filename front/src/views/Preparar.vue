<template>
  <div class="page-container animate-fade">
    <!-- Encabezado de la Vista -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Preparar</h2>
        <p class="page-description">Selecciona un pedido pendiente para ver sus ítems y registrar lo que se envía de cada uno.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem;">
        <button class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.25rem;" @click="fetchPedidos" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Lista
        </button>
      </div>
    </div>

    <!-- Mensajes de Alerta -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Master-Detail Layout -->
    <div class="master-detail-container" style="display: flex; gap: 1.5rem; width: 100%; align-items: flex-start;">
      
      <!-- COLUMNA MASTER: Lista de Pedidos Pendientes -->
      <div 
        class="card master-column" 
        :class="{ 'hidden-mobile': selectedPedido && showMobileDetail }"
        style="flex: 1 1 35%; max-width: 450px; display: flex; flex-direction: column; overflow: hidden;"
      >
        <div class="card-header" style="display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span class="card-title" style="margin: 0; font-weight: bold;">Pedidos Pendientes ({{ pendingPedidos.length }})</span>
          </div>
          <!-- Buscador de pedidos -->
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.25rem 0.5rem; box-shadow: var(--inset-shadow); border-radius: 4px; border: 1px solid var(--bevel-light); width: 100%;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.85rem;"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar por código, sucursal..." 
              style="border: none; outline: none; font-size: 0.85rem; background: transparent; width: 100%; color: var(--text-primary);"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
              <i class="ph ph-x-circle" style="font-size: 1rem;"></i>
            </button>
          </div>
        </div>

        <!-- Lista con scroll -->
        <div class="list-container" style="max-height: calc(100vh - 280px); overflow-y: auto; padding: 0.5rem;">
          <div v-if="loading" style="display: flex; justify-content: center; align-items: center; padding: 2rem; flex-direction: column; gap: 0.5rem; color: var(--text-secondary);">
            <i class="ph ph-spinner spinner" style="font-size: 1.5rem;"></i>
            <span>Cargando pedidos...</span>
          </div>
          <div v-else-if="filteredPendingPedidos.length === 0" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
            <i class="ph ph-shopping-cart" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
            <span>No hay pedidos pendientes que coincidan con la búsqueda.</span>
          </div>
          <div v-else style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div 
              v-for="p in filteredPendingPedidos" 
              :key="p.id"
              class="pedido-item"
              :class="{ 'selected': selectedPedido?.id === p.id }"
              @click="selectPedido(p)"
              style="padding: 0.75rem; border-radius: 6px; border: 1px solid var(--bevel-dark); background: var(--bg-secondary); cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; gap: 0.35rem;"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 0.9rem; color: var(--text-primary);">{{ p.codigo }}</strong>
                <span class="badge badge-warning" style="font-size: 0.68rem; padding: 2px 6px; border-radius: 3px;">{{ p.estado }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-secondary);">
                <span>Sucursal: <strong style="color: var(--text-primary);">{{ p.sucursal || '-' }}</strong></span>
                <span>{{ formatDate(p.fecha) }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; border-top: 1px dotted var(--bevel-light); padding-top: 0.35rem; margin-top: 0.15rem;">
                <span style="color: var(--text-secondary);">Ítems: <strong style="color: var(--text-primary);">{{ p.items ? p.items.length : 0 }}</strong></span>
                
                <!-- Barra de Progreso -->
                <div style="display: flex; flex-direction: column; gap: 0.15rem; width: 110px; align-items: flex-end;">
                  <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.68rem; font-weight: bold; color: var(--text-secondary); line-height: 1;">
                    <span>Listo:</span>
                    <span :style="{ color: getPedidoProgreso(p) === 100 ? 'var(--accent-success)' : 'var(--text-primary)' }">
                      {{ getPedidoProgreso(p) }}%
                    </span>
                  </div>
                  <div style="width: 100%; height: 5px; background-color: var(--bevel-dark); border-radius: 3px; overflow: hidden; border: 1px solid var(--bevel-light);">
                    <div 
                      :style="{ 
                        width: getPedidoProgreso(p) + '%', 
                        backgroundColor: getPedidoProgreso(p) === 100 ? 'var(--accent-success)' : 'var(--accent-primary)' 
                      }" 
                      style="height: 100%; transition: width 0.3s ease; border-radius: 3px;"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COLUMNA DETAIL: Detalle del Pedido Elegido -->
      <div 
        class="card detail-column"
        :class="{ 'hidden-mobile': !selectedPedido || !showMobileDetail }"
        style="flex: 1 1 65%; display: flex; flex-direction: column; overflow: hidden; min-height: 400px;"
      >
        <div v-if="selectedPedido" style="display: flex; flex-direction: column; height: 100%;">
          
          <!-- Detalle - Cabecera -->
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <button 
                class="btn btn-secondary mobile-only-btn" 
                style="padding: 0.25rem 0.5rem; font-size: 0.78rem; display: flex; align-items: center; gap: 0.25rem;"
                @click="showMobileDetail = false"
              >
                <i class="ph ph-arrow-left"></i> Volver
              </button>
              <span class="card-title" style="margin: 0; font-weight: bold;">Detalle Pedido: {{ selectedPedido.codigo }}</span>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; font-size: 0.78rem;">
              <span style="color: var(--text-secondary);">Sucursal: <strong style="color: var(--text-primary);">{{ selectedPedido.sucursal || '-' }}</strong></span>
              <span style="color: var(--bevel-dark);">|</span>
              <span style="color: var(--text-secondary);">Fecha: <strong style="color: var(--text-primary);">{{ formatDate(selectedPedido.fecha) }}</strong></span>
              <span style="color: var(--bevel-dark);">|</span>
              <button 
                class="btn btn-secondary" 
                style="padding: 0.25rem 0.5rem; font-size: 0.75rem; height: 26px; display: inline-flex; align-items: center; gap: 0.25rem;"
                @click="printPedido(selectedPedido)"
              >
                <i class="ph ph-printer"></i> Imprimir
              </button>
              <button 
                class="btn btn-primary" 
                style="padding: 0.25rem 0.5rem; font-size: 0.75rem; height: 26px; display: inline-flex; align-items: center; gap: 0.25rem; background-color: #1a7f37; border-color: #15652c;"
                @click="confirmarPedido"
                :disabled="confirming"
              >
                <i class="ph ph-spinner spinner" v-if="confirming"></i>
                <i class="ph ph-check-circle" v-else></i> Confirmar
              </button>
            </div>
          </div>

          <!-- Detalle - Tabla de Productos -->
          <div class="table-container" style="max-height: calc(100vh - 280px); overflow-y: auto; flex-grow: 1;">
            <div v-if="loadingDetail" style="display: flex; justify-content: center; align-items: center; padding: 4rem; flex-direction: column; gap: 0.5rem; color: var(--text-secondary);">
              <i class="ph ph-spinner spinner" style="font-size: 1.8rem;"></i>
              <span>Cargando productos del pedido...</span>
            </div>
            <table v-else style="width: 100%;">
              <thead>
                <tr>
                  <th style="width: 90px; text-align: left;">Código</th>
                  <th style="text-align: left;">Producto</th>
                  <th style="width: 70px; text-align: right; color: #cbd5e1 !important;">Pzas</th>
                  <th style="width: 90px; text-align: right; color: #cbd5e1 !important;">Fracc</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="item in selectedPedido.items" :key="item.codigo_producto">
                  <!-- Fila Principal del Producto -->
                  <tr 
                    @click="toggleEditItem(item)"
                    style="border-bottom: 1px solid var(--bevel-light); cursor: pointer; transition: background-color 0.15s ease;"
                    :class="['order-row', getItemRowClass(item)]"
                  >
                    <td style="padding: 0.5rem; font-family: monospace; font-weight: bold; color: var(--text-primary);">{{ item.codigo_producto }}</td>
                    <td style="padding: 0.5rem; color: var(--text-primary);">
                      {{ item.Producto?.nombre || `PRODUCTO SIN DESCRIPCIÓN (${item.codigo_producto})` }}
                    </td>
                    <!-- Pzas Pedidas -->
                    <td style="padding: 0.5rem; text-align: right; font-weight: bold; color: var(--text-primary);">
                      {{ item.pieza > 0 ? item.pieza : '-' }}
                    </td>
                    <!-- Fracc Pedida (kg) -->
                    <td style="padding: 0.5rem; text-align: right; font-weight: bold; color: var(--text-primary);">
                      {{ parseFloat(item.fraccion || 0) > 0 ? parseFloat(item.fraccion).toFixed(3) : '-' }}
                    </td>
                  </tr>

                  <!-- Fila Colapsable / Mini Card de Carga de Envío -->
                  <tr v-if="selectedItemCode === item.codigo_producto" :key="'edit-' + item.codigo_producto">
                    <td colspan="4" style="padding: 0.5rem; background-color: var(--bg-secondary);" @click.stop>
                      <div class="item-prep-dropdown" style="padding: 0.75rem; border: 1px solid var(--bevel-dark); border-radius: 4px; background: var(--bg-window); display: flex; flex-direction: column; gap: 0.75rem;">
                                         <!-- Título (Solo el nombre del producto) -->
                        <div style="border-bottom: 1px solid var(--bevel-light); padding-bottom: 0.4rem; margin-bottom: 0.3rem;">
                          <h4 style="font-size: 0.92rem; font-weight: bold; color: var(--text-primary); margin: 0; line-height: 1.35;">
                            {{ item.Producto?.nombre || item.codigo_producto }}
                          </h4>
                        </div>

                        <!-- Formulario de Inputs -->
                        <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end;">
                          
                          <!-- Piezas a enviar -->
                          <div v-if="item.pieza > 0" class="form-group" style="margin-bottom: 0; width: 130px;">
                            <label style="font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 0.25rem; color: var(--text-muted);">Piezas a enviar</label>
                            <input 
                              type="number" 
                              v-model.number="itemForm.piezas" 
                              min="0" 
                              class="form-control mobile-input" 
                            />
                          </div>

                          <!-- Kg a enviar -->
                          <div class="form-group" style="margin-bottom: 0; width: 140px;">
                            <label style="font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 0.25rem; color: var(--text-muted);">Kg a enviar</label>
                            <!-- Si es un item fraccionado, vinculamos a fraccion -->
                            <input 
                              v-if="parseFloat(item.fraccion || 0) > 0"
                              type="number" 
                              step="0.001" 
                              v-model.number="itemForm.fraccion" 
                              min="0" 
                              class="form-control mobile-input" 
                            />
                            <!-- Si no es fraccionado, vinculamos a peso -->
                            <input 
                              v-else
                              type="number" 
                              step="0.001" 
                              v-model.number="itemForm.peso" 
                              min="0" 
                              class="form-control mobile-input" 
                            />
                          </div>

                          <!-- Checkboxes especiales -->
                          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; margin-top: 0.5rem;">
                            <label class="mobile-checkbox-label">
                              <input type="checkbox" v-model="itemForm.sin_stock" /> S/S (Sin Stock)
                            </label>
                            <label class="mobile-checkbox-label">
                              <input type="checkbox" v-model="itemForm.no_envia" /> N/E (No Envía)
                            </label>
                          </div>

                          <!-- Botón Grabar y Cancelar -->
                          <div style="margin-left: auto; display: flex; gap: 0.5rem; width: 100%; justify-content: flex-end; margin-top: 0.5rem; border-top: 1px solid var(--bevel-light); padding-top: 0.5rem;">
                            <button class="btn btn-secondary mobile-btn" @click.stop="selectedItemCode = ''">
                              <i class="ph ph-x"></i> Cancelar
                            </button>
                            <button class="btn btn-primary mobile-btn" style="background-color: #1a7f37; border-color: #15652c;" @click.stop="grabarItem(item)" :disabled="savingItem">
                              <i class="ph ph-spinner spinner" v-if="savingItem"></i>
                              <i class="ph ph-floppy-disk" v-else></i> Grabar
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
                <tr v-if="!selectedPedido.items || selectedPedido.items.length === 0">
                  <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    Este pedido no contiene productos.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        <!-- Placeholder cuando no hay ningún pedido seleccionado -->
        <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex-grow: 1; padding: 3rem; text-align: center; color: var(--text-muted);">
          <i class="ph ph-package" style="font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.35; color: var(--text-primary);"></i>
          <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-weight: bold;">Ningún Pedido Seleccionado</h3>
          <p style="margin: 0; font-size: 0.85rem; max-width: 320px; line-height: 1.4;">
            Selecciona un pedido pendiente de la columna de la izquierda para ver su contenido y comenzar la preparación.
          </p>
        </div>
      </div>

    </div>
  </div>

  <!-- Contenedor exclusivo para impresión física / PDF -->
  <div v-if="activePrintPedido" class="print-only-container" style="display: none;">
    <div class="print-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-family: monospace; font-weight: bold; margin: 0; font-size: 24px; color: black;">CDF GESTIÓN</h1>
          <p style="font-family: monospace; font-size: 0.75rem; margin: 2px 0 0 0; color: black;">Control de Distribución y Fraccionamiento</p>
        </div>
        <div style="text-align: right; font-family: monospace;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold; color: black;">REMITO DE PREPARACIÓN</h2>
          <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: black;">Documento de Uso Interno</p>
        </div>
      </div>
      
      <div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-family: monospace; font-size: 0.85rem; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 0.5rem 0; color: black;">
        <div>
          <strong>Código Pedido:</strong> {{ activePrintPedido.codigo }}<br>
          <strong>Sucursal Destino:</strong> {{ activePrintPedido.sucursal || 'Sin sucursal asignada' }}
        </div>
        <div style="text-align: right;">
          <strong>Fecha Emisión:</strong> {{ formatDate(activePrintPedido.fecha) }}<br>
          <strong>Estado Pedido:</strong> {{ activePrintPedido.estado }}
        </div>
      </div>
    </div>
    
    <table class="print-table" style="width: 100%; border-collapse: collapse; font-family: monospace; margin-top: 1rem; color: black;">
      <thead>
        <tr style="background-color: #f2f2f2; border-bottom: 2px solid #000;">
          <th style="border: 1px solid #000; text-align: left; width: 15%; padding: 4px;">Código</th>
          <th style="border: 1px solid #000; text-align: left; width: 45%; padding: 4px;">Nombre</th>
          <th style="border: 1px solid #000; text-align: right; width: 20%; padding: 4px;">Peso</th>
          <th style="border: 1px solid #000; text-align: right; width: 20%; padding: 4px;">Piezas</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in activePrintPedido.items" :key="item.id" style="border-bottom: 1px solid #000;">
          <td style="border: 1px solid #000; padding: 4px;">
            <strong>{{ item.codigo_producto }}</strong>
          </td>
          <td style="border: 1px solid #000; padding: 4px;">
            {{ item.Producto?.nombre || 'Producto sin nombre cargado' }}
          </td>
          <!-- Peso (desde pedido_armado_items) -->
          <td style="border: 1px solid #000; text-align: right; font-weight: bold; padding: 4px;">
            {{ getPrintArmadoPeso(item.codigo_producto) }}
          </td>
          <!-- Piezas (desde pedido_armado_items) -->
          <td style="border: 1px solid #000; text-align: right; font-weight: bold; padding: 4px;">
            {{ getPrintArmadoPiezas(item.codigo_producto) }}
          </td>
        </tr>
        <tr v-if="!activePrintPedido.items || activePrintPedido.items.length === 0">
          <td colspan="4" style="border: 1px solid #000; padding: 12px; text-align: center; font-size: 0.8rem; color: #555;">
            No hay productos registrados en este pedido.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const pedidos = ref([])
const loading = ref(false)
const loadingDetail = ref(false)
const savingItem = ref(false)
const searchQuery = ref('')
const selectedPedido = ref(null)
const showMobileDetail = ref(false)
const activePrintPedido = ref(null)
const confirming = ref(false)

const catalogProducts = ref([])
const armadoItems = ref([])

// Item editando
const selectedItemCode = ref('')
const itemForm = ref({
  piezas: 0,
  peso: 0,
  fraccion: 0,
  sin_stock: false,
  no_envia: false
})

const alert = ref({
  show: false,
  message: '',
  type: 'success'
})

// Mostrar alerta interactiva
const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => {
    alert.value.show = false
  }, 4000)
}

// Obtener porcentaje de progreso de preparación del pedido
const getPedidoProgreso = (pedido) => {
  if (!pedido || !pedido.items || pedido.items.length === 0) return 0
  const total = pedido.items.length
  
  const count = pedido.items.filter(item => {
    const arm = pedido.ArmadoItems && pedido.ArmadoItems.find(a => a.codigo_producto === item.codigo_producto)
    if (!arm) return false
    return !!(arm.piezas > 0 || parseFloat(arm.peso) > 0 || parseFloat(arm.fraccion) > 0 || arm.no_envia || arm.sin_stock)
  }).length
  
  return Math.round((count / total) * 100)
}

// Cargar pedidos desde la API
const fetchPedidos = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/pedidos')
    if (res.ok) {
      pedidos.value = await res.json()
      // Si el pedido seleccionado ya no está pendiente, deseleccionarlo
      if (selectedPedido.value) {
        const found = pedidos.value.find(p => p.id === selectedPedido.value.id)
        if (!found || found.estado !== 'Pendiente') {
          selectedPedido.value = null
          showMobileDetail.value = false
          armadoItems.value = []
        }
      }
    } else {
      showAlert('Error al descargar listado de pedidos', 'error')
    }
  } catch (error) {
    console.error('Error fetching pedidos:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

// Cargar catálogo de productos (para mostrar el stock)
const fetchCatalogProducts = async () => {
  try {
    const res = await fetch('/api/productos')
    if (res.ok) {
      catalogProducts.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching catalog products:', error)
  }
}

// Cargar los detalles frescos de un pedido específico y su armado
const fetchPedidoDetalle = async (id) => {
  loadingDetail.value = true
  try {
    const [resPedido, resArmado] = await Promise.all([
      fetch(`/api/pedidos/${id}`),
      fetch(`/api/pedidos/${id}/armado`)
    ])
    if (resPedido.ok && resArmado.ok) {
      selectedPedido.value = await resPedido.json()
      armadoItems.value = await resArmado.json()
    } else {
      showAlert('Error al descargar detalles o armado del pedido', 'error')
    }
  } catch (error) {
    console.error('Error fetching pedido detalle:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loadingDetail.value = false
  }
}

// Filtrar pedidos en estado "Pendiente"
const pendingPedidos = computed(() => {
  return pedidos.value.filter(p => p.estado === 'Pendiente')
})

// Filtrar por campo de búsqueda
const filteredPendingPedidos = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return pendingPedidos.value

  return pendingPedidos.value.filter(p => {
    const codigoMatch = p.codigo?.toLowerCase().includes(query)
    const sucursalMatch = p.sucursal?.toLowerCase().includes(query)
    return codigoMatch || sucursalMatch
  })
})

// Seleccionar un pedido para ver detalle
const selectPedido = async (pedido) => {
  selectedItemCode.value = ''
  showMobileDetail.value = true
  await fetchPedidoDetalle(pedido.id)
}

// Obtener item de armado si ya está cargado
const getArmadoItem = (codigo_producto) => {
  return armadoItems.value.find(a => a.codigo_producto === codigo_producto)
}

// Pzas ya armadas (desde pedido_armado_items)
const getArmadoPzas = (codigo_producto) => {
  const arm = getArmadoItem(codigo_producto)
  if (!arm || arm.no_envia || arm.sin_stock) return '-'
  return arm.piezas > 0 ? arm.piezas : '-'
}

// Peso ya armado (desde pedido_armado_items)
const getArmadoPeso = (codigo_producto) => {
  const arm = getArmadoItem(codigo_producto)
  if (!arm || arm.no_envia || arm.sin_stock) return '-'
  const totalPeso = parseFloat(arm.peso || 0) + parseFloat(arm.fraccion || 0)
  return totalPeso > 0 ? totalPeso.toFixed(3) + ' kg' : '-'
}

// Comprobar si un ítem está cargado / completado (para pintar de verde)
const isItemCargado = (codigo_producto) => {
  const arm = getArmadoItem(codigo_producto)
  if (!arm) return false
  return !!(arm.piezas > 0 || parseFloat(arm.peso) > 0 || parseFloat(arm.fraccion) > 0 || arm.no_envia || arm.sin_stock)
}

// Obtener clase de fila según su estado
const getItemRowClass = (item) => {
  const arm = getArmadoItem(item.codigo_producto)
  if (!arm) return ''
  
  if (arm.sin_stock) {
    return 'row-sin-stock'
  }
  if (arm.no_envia) {
    return 'row-no-envia'
  }
  if (arm.piezas > 0 || parseFloat(arm.peso) > 0 || parseFloat(arm.fraccion) > 0) {
    return 'row-cargado'
  }
  
  return ''
}

// Obtener el estado legible de un ítem
const getEstadoItem = (codigo_producto) => {
  const arm = getArmadoItem(codigo_producto)
  if (!arm) return 'Pendiente'
  if (arm.sin_stock) return 'Sin Stock'
  if (arm.no_envia) return 'No Envía'
  return 'Cargado'
}

// Alternar la edición del producto clicado en la tabla
const toggleEditItem = (item) => {
  if (selectedItemCode.value === item.codigo_producto) {
    selectedItemCode.value = ''
    return
  }
  
  selectedItemCode.value = item.codigo_producto
  
  const arm = getArmadoItem(item.codigo_producto)
  if (arm) {
    itemForm.value = {
      piezas: arm.piezas || 0,
      peso: parseFloat(arm.peso) || 0,
      fraccion: parseFloat(arm.fraccion) || 0,
      sin_stock: !!arm.sin_stock,
      no_envia: !!arm.no_envia
    }
  } else {
    itemForm.value = {
      piezas: item.pieza || 0,
      peso: 0,
      fraccion: parseFloat(item.fraccion || 0) > 0 ? parseFloat(item.fraccion) : 0,
      sin_stock: false,
      no_envia: false
    }
  }
}

// Grabar el envío de un producto específico en la tabla de armado
const grabarItem = async (item) => {
  savingItem.value = true
  try {
    const body = {
      codigo_producto: item.codigo_producto,
      piezas: itemForm.value.piezas,
      peso: itemForm.value.peso,
      fraccion: itemForm.value.fraccion,
      no_envia: itemForm.value.no_envia,
      sin_stock: itemForm.value.sin_stock
    }

    const res = await fetch(`/api/pedidos/${selectedPedido.value.id}/armado`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      showAlert('Carga de armado grabada correctamente.')
      selectedItemCode.value = ''
      // Recargar detalles para refrescar y pintar de verde
      await fetchPedidoDetalle(selectedPedido.value.id)
      
      // Actualizar también los ArmadoItems en la lista maestra pedidos.value para refrescar la barrita de progreso
      const pIndex = pedidos.value.findIndex(p => p.id === selectedPedido.value.id)
      if (pIndex !== -1) {
        pedidos.value[pIndex].ArmadoItems = [...armadoItems.value]
      }
    } else {
      const data = await res.json()
      showAlert(data.error || 'Error al grabar el armado.', 'error')
    }
  } catch (error) {
    console.error('Error al grabar armado del pedido:', error)
    showAlert('Error de red al guardar los cambios.', 'error')
  } finally {
    savingItem.value = false
  }
}

// Obtener stock actual de un producto del catálogo
const getStockActual = (codigo) => {
  const prod = catalogProducts.value.find(p => p.codigo === codigo)
  if (prod) {
    return parseFloat(prod.stock || 0).toFixed(3)
  }
  return '0.000'
}

// Formatear fechas (DD/MM/YYYY)
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

const getPrintArmadoItem = (codigo_producto) => {
  if (!activePrintPedido.value || !activePrintPedido.value.ArmadoItems) return null
  return activePrintPedido.value.ArmadoItems.find(a => a.codigo_producto === codigo_producto)
}

const getPrintArmadoPeso = (codigo_producto) => {
  const arm = getPrintArmadoItem(codigo_producto)
  if (!arm) return '-'
  if (arm.sin_stock) return 'S/S'
  if (arm.no_envia) return 'N/E'
  const totalPeso = parseFloat(arm.peso || 0) + parseFloat(arm.fraccion || 0)
  return totalPeso > 0 ? totalPeso.toFixed(3) + ' kg' : '-'
}

const getPrintArmadoPiezas = (codigo_producto) => {
  const arm = getPrintArmadoItem(codigo_producto)
  if (!arm) return '-'
  if (arm.sin_stock) return 'S/S'
  if (arm.no_envia) return 'N/E'
  return arm.piezas > 0 ? arm.piezas : '-'
}

const printPedido = (pedido) => {
  if (pedido.id === selectedPedido.value?.id) {
    pedido.ArmadoItems = [...armadoItems.value]
  }
  activePrintPedido.value = pedido
  setTimeout(() => {
    window.print()
  }, 100)
}

const confirmarPedido = async () => {
  if (!selectedPedido.value) return

  // Check if some items are completely unprepared
  const itemsSinPreparar = selectedPedido.value.items.filter(item => {
    const arm = armadoItems.value.find(a => a.codigo_producto === item.codigo_producto)
    if (!arm) return true
    const hasValues = (parseInt(arm.piezas) || 0) > 0 || (parseFloat(arm.peso) || 0) > 0 || (parseFloat(arm.fraccion) || 0) > 0
    const isSpecial = arm.sin_stock || arm.no_envia
    return !hasValues && !isSpecial
  })

  if (itemsSinPreparar.length > 0) {
    if (!confirm(`Hay ${itemsSinPreparar.length} productos sin preparar en la lista. Si deseas continuar, estos se marcarán como "No Envía". ¿Confirmar?`)) {
      return
    }
  } else {
    if (!confirm('¿Estás seguro de confirmar este pedido? Se descontarán las piezas y pesos del stock siguiendo la regla FIFO.')) {
      return
    }
  }

  confirming.value = true
  try {
    const itemsPayload = selectedPedido.value.items.map(item => {
      const arm = armadoItems.value.find(a => a.codigo_producto === item.codigo_producto)
      const isSpecial = arm && (arm.sin_stock || arm.no_envia)
      return {
        codigo: item.codigo_producto,
        peso: (arm && !isSpecial) ? parseFloat(arm.peso || 0) : 0,
        piezas: (arm && !isSpecial) ? parseInt(arm.piezas || 0, 10) : 0,
        fraccion: (arm && !isSpecial) ? parseFloat(arm.fraccion || 0) : 0,
        sinStock: arm ? !!arm.sin_stock : false
      }
    })

    // Get current user name from storage
    const userString = localStorage.getItem('usuario') || sessionStorage.getItem('usuario')
    let userName = 'Sistema'
    if (userString) {
      try {
        const u = JSON.parse(userString)
        if (u && u.nombre) userName = u.nombre
      } catch (e) {
        if (typeof userString === 'string') userName = userString
      }
    }

    const res = await fetch(`/api/pedidos/${selectedPedido.value.id}/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: itemsPayload,
        usuario: userName
      })
    })

    const data = await res.json()
    if (res.ok) {
      showAlert('Pedido confirmado y stock descontado exitosamente (FIFO).')
      selectedPedido.value = null
      showMobileDetail.value = false
      fetchPedidos()
    } else {
      if (data.productos_sin_stock && data.productos_sin_stock.length > 0) {
        const detalles = data.productos_sin_stock.map(p => 
          `${p.codigo} (${p.nombre}): stock ${p.stock_actual} kg, solicitado ${p.peso_solicitado} kg`
        ).join(' | ')
        showAlert(`${data.error} Detalles: ${detalles}`, 'error')
      } else {
        showAlert(data.error || 'Error al confirmar el pedido.', 'error')
      }
    }
  } catch (error) {
    console.error('Error al confirmar pedido:', error)
    showAlert('Error de conexión con el servidor.', 'error')
  } finally {
    confirming.value = false
  }
}

onMounted(() => {
  fetchPedidos()
  fetchCatalogProducts()
})
</script>

<style scoped>
/* Color overrides for tds inside customized rows to bypass main.css rules */
.order-row.row-cargado td {
  background-color: rgba(34, 197, 94, 0.15) !important;
}
.order-row.row-sin-stock td {
  background-color: rgba(239, 68, 68, 0.15) !important;
}
.order-row.row-no-envia td {
  background-color: rgba(148, 163, 184, 0.25) !important;
}

/* Transición suave al cambiar de color en hover */
.pedido-item {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.pedido-item:hover {
  border-color: var(--accent-primary) !important;
  background-color: var(--bg-window) !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.pedido-item.selected {
  border-color: var(--accent-primary) !important;
  background-color: rgba(26, 127, 55, 0.05) !important;
  border-left: 3px solid var(--accent-primary) !important;
}

/* Hover de filas */
.order-row:hover td {
  background-color: #a7f3d0 !important;
}

/* Soporte responsive master-detail */
.mobile-only-btn {
  display: none;
}

@media (max-width: 768px) {
  .master-detail-container {
    flex-direction: column;
    gap: 0 !important;
  }
  
  .master-column, .detail-column {
    max-width: 100% !important;
    width: 100% !important;
    flex: 1 1 100% !important;
  }
  
  .hidden-mobile {
    display: none !important;
  }
  
  .mobile-only-btn {
    display: flex !important;
  }
}

/* Mobile optimized inputs and buttons in details card */
.mobile-input {
  height: 38px !important;
  font-size: 0.95rem !important;
  padding: 6px 10px !important;
  border-radius: 6px !important;
  border: 1.5px solid var(--bevel-dark) !important;
}

.mobile-checkbox-label {
  font-size: 0.85rem !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  cursor: pointer;
  padding: 6px 10px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--bevel-light);
  border-radius: 6px;
  user-select: none;
  margin: 0 !important;
}

.mobile-checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.mobile-btn {
  height: 38px !important;
  font-size: 0.85rem !important;
  padding: 0 1.25rem !important;
  border-radius: 6px !important;
}
</style>

<style>
/* Estilos globales exclusivos para impresión en remito (evita sobreposición) */
@media print {
  html, body, #app {
    height: auto !important;
    overflow: visible !important;
    position: static !important;
    background: white !important;
    color: black !important;
  }

  /* Ocultar elementos de interfaz en pantalla */
  .no-print,
  .page-container,
  .master-detail-container,
  .master-column,
  .detail-column,
  .page-header,
  .alert-box,
  .win-dialog-overlay,
  aside,
  header,
  div[class^="alert-"],
  button {
    display: none !important;
  }
  
  /* Habilitar contenedor de impresión */
  .print-only-container {
    display: block !important;
    visibility: visible !important;
    position: static !important;
    width: 100% !important;
    height: auto !important;
    background: white !important;
    color: black !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .print-table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin-top: 1rem !important;
  }

  .print-table th,
  .print-table td {
    border: 1px solid #000000 !important;
    padding: 3px 5px !important;
    font-size: 8.5pt !important;
    line-height: 1.15 !important;
    color: black !important;
  }

  .print-table th {
    background-color: #f2f2f2 !important;
    color: black !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-weight: bold !important;
  }
}
</style>
