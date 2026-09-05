<template>
  <div class="page-container animate-fade">
    <!-- Encabezado Dinámico de la Vista (Reemplaza 'Preparar' por la sucursal cuando un pedido está seleccionado) -->
    <div class="page-header mb-3">
      <div class="header-content">
        <h2 class="page-title" style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin: 0;">
          {{ selectedPedido && showMobileDetail ? selectedPedido.sucursal : 'Pedidos' }}
        </h2>
        <p class="page-description" style="font-size: 0.88rem; margin-top: 0.2rem; color: var(--text-muted); font-weight: 600;">
          <template v-if="selectedPedido && showMobileDetail">
            Fecha del pedido: {{ formatDate(selectedPedido.fecha) }}
          </template>

        </p>
      </div>

      <div class="header-actions" style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.4rem;">
        <template v-if="selectedPedido && showMobileDetail">
          <button 
            class="btn btn-secondary" 
            style="padding: 0.4rem 0.85rem; font-weight: 700; font-size: 0.84rem; display: flex; align-items: center; gap: 0.35rem;"
            @click="showMobileDetail = false; selectedPedido = null"
          >
            <i class="ph ph-arrow-left"></i> 
          </button>
          <button 
            class="btn btn-primary" 
            style="padding: 0.4rem 1.1rem; font-weight: 800; font-size: 0.88rem; background-color: #16a34a; border-color: #15803d; display: flex; align-items: center; gap: 0.35rem;"
            @click="confirmarPedido"
            :disabled="confirming"
          >
            <i class="ph ph-spinner spinner" v-if="confirming"></i>
            <i class="ph ph-check-circle" v-else></i>
          </button>
        </template>
        <template v-else>
          <button class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.25rem;" @click="fetchPedidos" :disabled="loading">
            <i class="ph ph-spinner spinner" v-if="loading"></i>
            <i class="ph ph-arrows-clockwise" v-else></i> 
          </button>
        </template>
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
            <span class="card-title" style="margin: 0; font-weight: bold;">Pedidos por Preparar ({{ pendingPedidos.length }})</span>
          </div>
          <!-- Buscador de pedidos -->
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.25rem 0.5rem; box-shadow: var(--inset-shadow); border-radius: 0; border: 1px solid var(--bevel-light); width: 100%;">
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
            <span>No hay pedidos pendientes o en preparación.</span>
          </div>
          <div v-else style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div 
              v-for="p in filteredPendingPedidos" 
              :key="p.id"
              class="pedido-item"
              :class="{ 'selected': selectedPedido?.id === p.id }"
              @click="selectPedido(p)"
              style="padding: 0.75rem; border-radius: 0; border: 1px solid var(--bevel-dark); background: var(--bg-secondary); cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; gap: 0.35rem;"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 0.9rem; color: var(--text-primary);">{{ p.codigo }}</strong>
                <span class="badge" :class="p.estado === 'Preparando' ? 'badge-primary' : 'badge-warning'" style="font-size: 0.68rem; padding: 2px 6px; border-radius: 0;">{{ p.estado }}</span>
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
                  <div style="width: 100%; height: 5px; background-color: var(--bevel-dark); border-radius: 0; overflow: hidden; border: 1px solid var(--bevel-light);">
                    <div 
                      :style="{ 
                        width: getPedidoProgreso(p) + '%', 
                        backgroundColor: getPedidoProgreso(p) === 100 ? 'var(--accent-success)' : 'var(--accent-primary)' 
                      }" 
                      style="height: 100%; transition: width 0.3s ease; border-radius: 0;"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COLUMNA DETAIL: Tabla de Productos Ubicada Directamente sobre el Contenedor Principal -->
      <div 
        class="detail-column"
        :class="{ 'hidden-mobile': !selectedPedido || !showMobileDetail }"
        style="flex: 1 1 65%; display: flex; flex-direction: column; width: 100%;"
      >
        <div v-if="selectedPedido" style="display: flex; flex-direction: column; width: 100%;">
          
          <!-- Tabla Directa sin Contenedores de Tarjetas Anidadas -->
          <div class="table-container" style="border: 1.5px solid var(--bevel-dark); border-radius: 0; background: var(--bg-window); width: 100%;">
            <div v-if="loadingDetail" style="display: flex; justify-content: center; align-items: center; padding: 4rem; flex-direction: column; gap: 0.5rem; color: var(--text-secondary);">
              <i class="ph ph-spinner spinner" style="font-size: 1.8rem;"></i>
              <span>Cargando productos del pedido...</span>
            </div>
            
            <table v-else style="width: 100%;">
              <thead>
                <tr>
                  <th style="width: 75px; text-align: center;">Cod</th>
                  <th style="text-align: left;">Producto</th>
                  <th style="width: 110px; text-align: right;">Pedido</th>
                  <th style="width: 110px; text-align: right;">Enviado</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="item in selectedPedido.items" 
                  :key="item.codigo_producto"
                  @click="openItemModal(item)"
                  style="border-bottom: 1.5px solid var(--bevel-dark); cursor: pointer; transition: background-color 0.15s ease;"
                  :class="['order-row', getItemRowClass(item)]"
                  title="Presione para cargar la cantidad enviada"
                >
                  <td style="padding: 0.5rem; font-family: monospace; font-weight: bold; color: var(--text-primary); text-align: center;">
                    {{ item.codigo_producto }}
                  </td>
                  <td style="padding: 0.5rem; color: var(--text-primary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="item.Producto?.nombre">
                    {{ formatNombreProducto(item.Producto?.nombre || item.codigo_producto) }}
                  </td>
                  <!-- Solicitado (Texto con azul para pz y amarillo/ámbar para fracc, sin badges) -->
                  <td style="padding: 0.5rem; text-align: right; font-weight: 800;">
                    <span v-if="item.pieza > 0" style="color: #2563eb;">
                      {{ item.pieza }} P
                    </span>
                    <span v-if="item.pieza > 0 && parseFloat(item.fraccion || 0) > 0" style="color: var(--text-muted); margin: 0 2px;"> y </span>
                    <span v-if="parseFloat(item.fraccion || 0) > 0" style="color: #d97706;">
                      {{ Math.round(parseFloat(item.fraccion)) }} F
                    </span>
                    <span v-if="!(item.pieza > 0) && !(parseFloat(item.fraccion || 0) > 0) && parseFloat(item.peso || 0) > 0" style="color: var(--text-secondary);">
                      {{ parseFloat(item.peso).toFixed(3) }} kg
                    </span>
                    <span v-if="!(item.pieza > 0) && !(parseFloat(item.fraccion || 0) > 0) && !(parseFloat(item.peso || 0) > 0)" style="color: var(--text-muted);">
                      -
                    </span>
                  </td>
                  <!-- Enviado (Kilos cargados) -->
                  <td style="padding: 0.5rem; text-align: right; font-weight: 800;" :class="getEnviadoClass(item.codigo_producto)">
                    {{ getEnviadoDisplay(item.codigo_producto) }}
                  </td>
                </tr>

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
        <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; text-align: center; color: var(--text-muted); background: var(--bg-window); border: 1px solid var(--bevel-dark);">
          <i class="ph ph-package" style="font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.35; color: var(--text-primary);"></i>
          <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-weight: bold;">Ningún Pedido Seleccionado</h3>
          <p style="margin: 0; font-size: 0.85rem; max-width: 320px; line-height: 1.4;">
            Selecciona un pedido pendiente de la lista para ver sus productos y comenzar la preparación.
          </p>
        </div>
      </div>

    </div>
  </div>

  <!-- MODAL POPUP VISTA ADICIONAL PARA CARGAR CANTIDAD DE KILOS A ENVIAR -->
  <Teleport to="body">
    <div v-if="activeModalItem" class="win-dialog-overlay" @mousedown.self="activeModalItem = null">
      <div class="win-dialog" style="max-width: 460px; width: 98%;">
        
        <!-- Header del Modal -->
        <div class="win-dialog-titlebar" style="display: flex; justify-content: space-between; align-items: center; background: #15803d; color: white; padding: 0.75rem 1rem;">
          <span class="win-dialog-titlebar-text" style="font-weight: bold; font-size: 0.95rem;">
            Cargar Cantidad a Enviar
          </span>
          <button class="win-dialog-close" @click="activeModalItem = null" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">
            <i class="ph ph-x"></i>
          </button>
        </div>

        <!-- Cuerpo del Modal -->
        <div class="win-dialog-body" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; background: var(--bg-secondary);">
          
          <!-- Detalle del Producto -->
          <div style="background: var(--bg-window); padding: 0.85rem; border: 1.5px solid var(--bevel-dark);">
            <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 700; margin-bottom: 0.2rem;">Producto</span>
            <h4 style="margin: 0; font-size: 1rem; font-weight: 800; color: var(--text-primary); line-height: 1.35;">
              [{{ activeModalItem.codigo_producto }}] {{ activeModalItem.Producto?.nombre || activeModalItem.codigo_producto }}
            </h4>
          </div>

          <!-- Label Informativo de la Cantidad Solicitada por el Cliente -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f2f2f2; padding: 0.75rem 0.9rem; border: 1.5px solid #000;">
            <span style="font-size: 0.85rem; font-weight: 700; color: #000;">Pedido:</span>
            <div style="font-size: 1.05rem; font-weight: 800; display: flex; gap: 0.35rem; align-items: center;">
              <span v-if="activeModalItem.pieza > 0" style="color: #000;">
                {{ activeModalItem.pieza }} pz
              </span>
              <span v-if="activeModalItem.pieza > 0 && parseFloat(activeModalItem.fraccion || 0) > 0" style="color: #64748b;">/</span>
              <span v-if="parseFloat(activeModalItem.fraccion || 0) > 0" style="color: #d97706;">
                {{ Math.round(parseFloat(activeModalItem.fraccion)) }} fracc
              </span>
              <span v-if="!(activeModalItem.pieza > 0) && !(parseFloat(activeModalItem.fraccion || 0) > 0) && parseFloat(activeModalItem.peso || 0) > 0" style="color: #0284c7;">
                {{ parseFloat(activeModalItem.peso).toFixed(3) }} kg
              </span>
            </div>
          </div>

          <!-- Único Input Editable: Kilos a enviar -->
          <div v-if="!itemForm.sin_stock && !itemForm.no_envia" class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 0.85rem; font-weight: 800; display: block; margin-bottom: 0.35rem; color: var(--text-primary); text-transform: uppercase;">
              Se envia
            </label>
            <div style="position: relative; display: flex; align-items: center;">
              <input 
                type="number" 
                step="0.001" 
                min="0" 
                v-model.number="itemForm.kilos" 
                class="form-control" 
                placeholder="Ej: 12.500" 
                style="height: 46px; font-size: 1.2rem; font-weight: 800; padding-right: 3.2rem; text-align: right; border: 2px solid var(--bevel-dark);"
                
              />
              <span style="position: absolute; right: 0.85rem; font-weight: 800; color: var(--text-muted); font-size: 0.95rem; pointer-events: none;">kg</span>
            </div>
          </div>

          <!-- Checkboxes de Excepción S/S y N/E -->
          <div style="display: flex; gap: 0.75rem; align-items: center; margin-top: 0.25rem;">
            <label class="mobile-checkbox-label" style="flex: 1; justify-content: center; padding: 0.6rem;">
              <input type="checkbox" v-model="itemForm.sin_stock" @change="handleSinStockChange" />
              <strong>S/S (Sin Stock)</strong>
            </label>
            <label class="mobile-checkbox-label" style="flex: 1; justify-content: center; padding: 0.6rem;">
              <input type="checkbox" v-model="itemForm.no_envia" @change="handleNoEnviaChange" />
              <strong>N/E (No Envía)</strong>
            </label>
          </div>

        </div>

        <!-- Footer del Modal -->
        <div class="win-dialog-footer" style="padding: 0.85rem 1.25rem; background: var(--bg-window); border-top: 1px solid var(--bevel-dark); display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button class="btn btn-secondary" @click="activeModalItem = null" style="height: 40px; padding: 0 1.25rem; font-weight: 700;">
            Cancelar
          </button>
          <button 
            class="btn btn-primary" 
            style="height: 40px; padding: 0 1.5rem; font-weight: 800; background-color: #16a34a; border-color: #15803d;" 
            @click="grabarItem(activeModalItem)" 
            :disabled="savingItem"
          >
            <i class="ph ph-spinner spinner" v-if="savingItem"></i>
            <i class="ph ph-floppy-disk" v-else></i> Grabar
          </button>
        </div>

      </div>
    </div>
  </Teleport>

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
import { useWinDialog } from '../composables/useWinDialog'

const { winConfirm } = useWinDialog()

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

// Item modal para cargar envío
const activeModalItem = ref(null)
const itemForm = ref({
  kilos: 0,
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
      // Si el pedido seleccionado ya no está en preparación (pasó a Listo, Enviado, etc.), deseleccionarlo
      if (selectedPedido.value) {
        const found = pedidos.value.find(p => p.id === selectedPedido.value.id)
        if (!found || !['Pendiente', 'Preparando', 'Procesando', 'Armando'].includes(found.estado)) {
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

// Filtrar pedidos en estado "Pendiente" y "Preparando"
const pendingPedidos = computed(() => {
  return pedidos.value.filter(p => ['Pendiente', 'Preparando', 'Procesando', 'Armando'].includes(p.estado))
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
  activeModalItem.value = null
  showMobileDetail.value = true
  await fetchPedidoDetalle(pedido.id)
}

// Obtener item de armado si ya está cargado
const getArmadoItem = (codigo_producto) => {
  return armadoItems.value.find(a => a.codigo_producto === codigo_producto)
}

// Truncar nombre del producto a un máximo de 24 caracteres agregando ".."
const formatNombreProducto = (nombre) => {
  if (!nombre) return '-'
  const str = String(nombre).trim()
  return str.length > 24 ? str.substring(0, 24) + '..' : str
}

// Formatear texto informativo de lo solicitado por el cliente (solo texto plano)
const getSolicitadoDisplay = (item) => {
  if (!item) return '-'
  const parts = []
  if (item.pieza > 0) {
    parts.push(`${item.pieza} pz`)
  }
  if (parseFloat(item.fraccion || 0) > 0) {
    parts.push(`${Math.round(parseFloat(item.fraccion))} fracc`)
  }
  if (parts.length > 0) {
    return parts.join(' / ')
  }
  if (parseFloat(item.peso || 0) > 0) {
    return `${parseFloat(item.peso).toFixed(3)} kg`
  }
  return '-'
}

// Formatear texto de lo efectivamente cargado para enviar
const getEnviadoDisplay = (codigo_producto) => {
  const arm = getArmadoItem(codigo_producto)
  if (!arm) return 'Pendiente'
  if (arm.sin_stock) return 'S/S'
  if (arm.no_envia) return 'N/E'
  const totalPeso = parseFloat(arm.peso || 0) + parseFloat(arm.fraccion || 0)
  return totalPeso > 0 ? `${totalPeso.toFixed(3)} kg` : '0.000 kg'
}

// Obtener clase CSS para destacar el estado del envío en la columna Enviado
const getEnviadoClass = (codigo_producto) => {
  const arm = getArmadoItem(codigo_producto)
  if (!arm) return 'text-muted'
  if (arm.sin_stock) return 'text-danger'
  if (arm.no_envia) return 'text-secondary'
  const totalPeso = parseFloat(arm.peso || 0) + parseFloat(arm.fraccion || 0)
  return totalPeso > 0 ? 'text-success' : 'text-muted'
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

// Control de cambios en checkboxes de exclusión
const handleSinStockChange = () => {
  if (itemForm.value.sin_stock) {
    itemForm.value.no_envia = false
  }
}

const handleNoEnviaChange = () => {
  if (itemForm.value.no_envia) {
    itemForm.value.sin_stock = false
  }
}

// Abrir el modal de carga para el producto seleccionado
const openItemModal = (item) => {
  activeModalItem.value = item
  const arm = getArmadoItem(item.codigo_producto)
  if (arm) {
    const totalCargado = parseFloat(arm.peso || 0) + parseFloat(arm.fraccion || 0)
    itemForm.value = {
      kilos: totalCargado > 0 ? totalCargado : '',
      sin_stock: !!arm.sin_stock,
      no_envia: !!arm.no_envia
    }
  } else {
    itemForm.value = {
      kilos: '',
      sin_stock: false,
      no_envia: false
    }
  }
}

// Grabar el envío de un producto específico en el pedido de armado
const grabarItem = async (item) => {
  if (!item) return
  savingItem.value = true
  try {
    const isSpecial = itemForm.value.no_envia || itemForm.value.sin_stock
    const kilosVal = isSpecial ? 0 : (parseFloat(itemForm.value.kilos) || 0)
    const esFraccionado = parseFloat(item.fraccion || 0) > 0

    const body = {
      codigo_producto: item.codigo_producto,
      piezas: 0,
      peso: esFraccionado ? 0 : kilosVal,
      fraccion: esFraccionado ? kilosVal : 0,
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
      showAlert('Cantidad enviada cargada correctamente.')
      activeModalItem.value = null
      await fetchPedidoDetalle(selectedPedido.value.id)
      
      const pIndex = pedidos.value.findIndex(p => p.id === selectedPedido.value.id)
      if (pIndex !== -1) {
        pedidos.value[pIndex].ArmadoItems = [...armadoItems.value]
      }
    } else {
      const data = await res.json()
      showAlert(data.error || 'Error al grabar la cantidad enviada.', 'error')
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
    if (!await winConfirm(`Hay ${itemsSinPreparar.length} productos sin preparar en la lista. Si deseas continuar, estos se marcarán como "No Envía". ¿Confirmar?`, 'Productos Sin Preparar')) {
      return
    }
  } else {
    if (!await winConfirm('¿Estás seguro de confirmar este pedido? Se guardarán los datos y el pedido pasará a estado "Listo".', 'Confirmar Pedido')) {
      return
    }
  }

  confirming.value = true
  try {
    const itemsPayload = selectedPedido.value.items.map(item => {
      const arm = armadoItems.value.find(a => a.codigo_producto === item.codigo_producto)
      const hasValues = arm && ((parseInt(arm.piezas) || 0) > 0 || (parseFloat(arm.peso) || 0) > 0 || (parseFloat(arm.fraccion) || 0) > 0)
      const isSpecial = arm && (arm.sin_stock || arm.no_envia)
      const isNoEnvia = arm ? !!arm.no_envia : (!hasValues && !isSpecial)
      return {
        codigo: item.codigo_producto,
        peso: (arm && !isSpecial) ? parseFloat(arm.peso || 0) : 0,
        piezas: (arm && !isSpecial) ? parseInt(arm.piezas || 0, 10) : 0,
        fraccion: (arm && !isSpecial) ? parseFloat(arm.fraccion || 0) : 0,
        sinStock: arm ? !!arm.sin_stock : false,
        noEnvia: isNoEnvia
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
      showAlert('Pedido guardado exitosamente en estado "Listo".')
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
  border-radius: 0 !important;
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
  border-radius: 0;
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
  border-radius: 0 !important;
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
