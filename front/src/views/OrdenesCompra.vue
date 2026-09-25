<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useWinDialog } from '../composables/useWinDialog'

const { winAlert, winConfirm } = useWinDialog()

const ordenes = ref([])
const proveedores = ref([])
const productos = ref([])
const bultos = ref([])

const loading = ref(false)
const saving = ref(false)
const filterEstado = ref('')
const filterProveedor = ref('')

const alert = ref({ show: false, message: '', type: 'success' })
const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 4000)
}

// Modal Nueva Orden
const showCreateModal = ref(false)
const formProveedorId = ref('')
const formNumeroOrden = ref('')
const formFecha = ref(new Date().toISOString().slice(0, 10))
const formObservaciones = ref('')
const mostrarTodosProductos = ref(false)

// Buscador de productos con autocompletado
const productSearchText = ref('')
const isProductDropdownOpen = ref(false)

// Items en el formulario de la nueva orden
const selectedProducto = ref(null)
const selectedCajas = ref(0)
const selectedPiezas = ref(0)
const orderItems = ref([])

// Modal Detalle
const showDetailModal = ref(false)
const selectedOrden = ref(null)

// Cargar Datos Iniciales
const loadData = async () => {
  loading.value = true
  try {
    const [resOrdenes, resProv, resProd] = await Promise.all([
      fetch('/api/ordenes-compra'),
      fetch('/api/proveedores'),
      fetch('/api/productos')
    ])

    if (resOrdenes.ok) ordenes.value = await resOrdenes.json()
    if (resProv.ok) proveedores.value = await resProv.json()
    if (resProd.ok) productos.value = await resProd.json()
  } catch (error) {
    console.error('Error al cargar datos de órdenes de compra:', error)
    showAlert('Error al conectar con el servidor', 'danger')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// Helper: Piezas por bulto/caja según tabla de bultos
const getPiezasPorCaja = (codigo_producto) => {
  const b = bultos.value.find(b => b.codigo_producto === codigo_producto)
  return b && b.cantidad_piezas > 0 ? b.cantidad_piezas : 0
}

// Cálculo de piezas totales por ítem
const calcularTotalPiezas = (item) => {
  const pzsPorCaja = getPiezasPorCaja(item.codigo_producto)
  const cajas = parseFloat(item.cantidad_cajas) || 0
  const piezasSueltas = parseInt(item.cantidad_piezas, 10) || 0
  return Math.round((cajas * pzsPorCaja) + piezasSueltas)
}

// Cálculo de peso estimado por ítem
const calcularPesoEstimado = (item) => {
  const prod = productos.value.find(p => p.codigo === item.codigo_producto) || item.producto
  const b = bultos.value.find(b => b.codigo_producto === item.codigo_producto)
  const totalPzs = calcularTotalPiezas(item)
  
  if (prod && parseFloat(prod.peso_pieza) > 0) {
    const totalPeso = totalPzs * parseFloat(prod.peso_pieza)
    return totalPeso > 0 ? `${totalPeso.toFixed(2)} kg` : '-'
  }
  if (b && parseFloat(b.peso_caja) > 0) {
    const cajas = parseFloat(item.cantidad_cajas) || 0
    const piezasSueltas = parseInt(item.cantidad_piezas, 10) || 0
    const pesoPorPiezaCaja = b.cantidad_piezas > 0 ? (parseFloat(b.peso_caja) / b.cantidad_piezas) : 0
    const totalPeso = (cajas * parseFloat(b.peso_caja)) + (piezasSueltas * pesoPorPiezaCaja)
    return totalPeso > 0 ? `${totalPeso.toFixed(2)} kg` : '-'
  }
  return '-'
}

// Totales acumulados de una orden completa
const totalesOrden = (items) => {
  if (!items || items.length === 0) return { piezas: 0, peso: '-' }
  const totalPiezas = items.reduce((acc, item) => acc + calcularTotalPiezas(item), 0)
  
  let totalPesoKg = 0
  let tienePeso = false

  items.forEach(item => {
    const prod = productos.value.find(p => p.codigo === item.codigo_producto) || item.producto
    const b = bultos.value.find(b => b.codigo_producto === item.codigo_producto)
    const pzs = calcularTotalPiezas(item)

    if (prod && parseFloat(prod.peso_pieza) > 0) {
      totalPesoKg += pzs * parseFloat(prod.peso_pieza)
      tienePeso = true
    } else if (b && parseFloat(b.peso_caja) > 0) {
      const cajas = parseFloat(item.cantidad_cajas) || 0
      const piezasSueltas = parseInt(item.cantidad_piezas, 10) || 0
      const pesoPorPiezaCaja = b.cantidad_piezas > 0 ? (parseFloat(b.peso_caja) / b.cantidad_piezas) : 0
      totalPesoKg += (cajas * parseFloat(b.peso_caja)) + (piezasSueltas * pesoPorPiezaCaja)
      tienePeso = true
    }
  })

  return {
    piezas: totalPiezas,
    peso: tienePeso && totalPesoKg > 0 ? `${totalPesoKg.toFixed(2)} kg` : '-'
  }
}

// Filtrado de la lista principal de órdenes
const ordenesFiltradas = computed(() => {
  return ordenes.value.filter(o => {
    const matchEstado = !filterEstado.value || o.estado === filterEstado.value
    const matchProveedor = !filterProveedor.value || o.id_proveedor === parseInt(filterProveedor.value, 10)
    return matchEstado && matchProveedor
  })
})

// Productos disponibles para el formulario (INCLUYE INACTIVOS según requerimiento)
const productosDisponiblesForm = computed(() => {
  if (mostrarTodosProductos.value || !formProveedorId.value) {
    return productos.value
  }
  const provId = parseInt(formProveedorId.value, 10)
  return productos.value.filter(p => p.proveedor_id === provId)
})

// Filtro en tiempo real por búsqueda de texto (código o nombre)
const productosFiltradosBusqueda = computed(() => {
  const query = productSearchText.value.toLowerCase().trim()
  if (!query) return productosDisponiblesForm.value.slice(0, 30)
  return productosDisponiblesForm.value.filter(p => 
    p.codigo.toLowerCase().includes(query) || 
    p.nombre.toLowerCase().includes(query)
  ).slice(0, 30)
})

// Información de bulto/caja para el producto seleccionado actualmente en el modal
const bultoInfoSeleccionado = computed(() => {
  if (!selectedProducto.value) return null
  return bultos.value.find(b => b.codigo_producto === selectedProducto.value.codigo && b.activo)
})

// Sugerir número de orden automático
const sugerirNumeroOrden = () => {
  const count = ordenes.value.length + 1
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const numStr = String(count).padStart(4, '0')
  formNumeroOrden.value = `OC-${dateStr}-${numStr}`
}

// Abrir modal de creación
const openCreateModal = () => {
  formProveedorId.value = ''
  formFecha.value = new Date().toISOString().slice(0, 10)
  formObservaciones.value = ''
  orderItems.value = []
  selectedProducto.value = null
  productSearchText.value = ''
  selectedCajas.value = 0
  selectedPiezas.value = 0
  mostrarTodosProductos.value = false
  isProductDropdownOpen.value = false
  sugerirNumeroOrden()
  showCreateModal.value = true
}

// Al cambiar de proveedor en el formulario, limpiar selección actual de producto
watch(formProveedorId, () => {
  selectedProducto.value = null
  productSearchText.value = ''
})

// Seleccionar producto del desplegable de búsqueda
const selectProductoFromSearch = (prod) => {
  selectedProducto.value = prod
  productSearchText.value = `${prod.codigo} - ${prod.nombre}`
  isProductDropdownOpen.value = false
}

// Agregar un producto a la lista temporal de la orden
const addItemToOrder = async () => {
  if (!selectedProducto.value) {
    await winAlert('Seleccione un producto para agregar', 'warning')
    return
  }

  const cajas = parseFloat(selectedCajas.value) || 0
  const piezas = parseInt(selectedPiezas.value, 10) || 0

  if (cajas <= 0 && piezas <= 0) {
    await winAlert('Ingrese una cantidad de cajas o piezas válida', 'warning')
    return
  }

  // Verificar si ya está en la lista
  const index = orderItems.value.findIndex(item => item.codigo_producto === selectedProducto.value.codigo)
  if (index !== -1) {
    orderItems.value[index].cantidad_cajas += cajas
    orderItems.value[index].cantidad_piezas += piezas
  } else {
    orderItems.value.push({
      codigo_producto: selectedProducto.value.codigo,
      nombre: selectedProducto.value.nombre,
      cantidad_cajas: cajas,
      cantidad_piezas: piezas,
      producto: selectedProducto.value,
      bultoInfo: bultoInfoSeleccionado.value
    })
  }

  // Reset inputs de item
  selectedProducto.value = null
  productSearchText.value = ''
  selectedCajas.value = 0
  selectedPiezas.value = 0
}

// Remover item de la orden
const removeItemFromOrder = (index) => {
  orderItems.value.splice(index, 1)
}

// Guardar la orden de compra
const guardarOrden = async () => {
  if (!formProveedorId.value) {
    showAlert('Debe seleccionar un proveedor', 'warning')
    return
  }

  if (orderItems.value.length === 0) {
    showAlert('Agregue al menos un producto a la orden de compra', 'warning')
    return
  }

  saving.value = true
  try {
    const payload = {
      numero_orden: formNumeroOrden.value,
      id_proveedor: parseInt(formProveedorId.value, 10),
      fecha: formFecha.value,
      observaciones: formObservaciones.value,
      items: orderItems.value.map(i => ({
        codigo_producto: i.codigo_producto,
        cantidad_cajas: i.cantidad_cajas,
        cantidad_piezas: i.cantidad_piezas
      }))
    }

    const res = await fetch('/api/ordenes-compra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await res.json()

    if (res.ok) {
      showAlert(`Orden de compra ${data.numero_orden} registrada exitosamente`, 'success')
      showCreateModal.value = false
      await loadData()
    } else {
      showAlert(data.error || 'Error al guardar la orden de compra', 'danger')
    }
  } catch (error) {
    console.error('Error al guardar orden:', error)
    showAlert('Error de conexión con el servidor', 'danger')
  } finally {
    saving.value = false
  }
}

// Abrir detalle de la orden
const verDetalle = (orden) => {
  selectedOrden.value = orden
  showDetailModal.value = true
}

// Cambiar estado de una orden (Administrativo)
const cambiarEstadoOrden = async (orden, nuevoEstado) => {
  try {
    const res = await fetch(`/api/ordenes-compra/${orden.id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    })

    if (res.ok) {
      orden.estado = nuevoEstado
      if (selectedOrden.value && selectedOrden.value.id === orden.id) {
        selectedOrden.value.estado = nuevoEstado
      }
      showAlert(`Estado cambiado a ${nuevoEstado}`, 'success')
    } else {
      showAlert('Error al actualizar estado', 'danger')
    }
  } catch (error) {
    console.error('Error al cambiar estado:', error)
    showAlert('Error de servidor al cambiar estado', 'danger')
  }
}

// Eliminar orden
const eliminarOrden = async (orden) => {
  if (!await winConfirm(`¿Está seguro de eliminar la orden ${orden.numero_orden}?`, 'Eliminar Orden de Compra')) return

  try {
    const res = await fetch(`/api/ordenes-compra/${orden.id}`, { method: 'DELETE' })
    if (res.ok) {
      showAlert(`Orden ${orden.numero_orden} eliminada`, 'success')
      if (showDetailModal.value) showDetailModal.value = false
      await loadData()
    } else {
      showAlert('No se pudo eliminar la orden', 'danger')
    }
  } catch (error) {
    console.error('Error al eliminar orden:', error)
    showAlert('Error de servidor', 'danger')
  }
}

// Utilidad para formatear resumen de items
const resumenItems = (items) => {
  if (!items || items.length === 0) return 'Sin ítems'
  const totalCajas = items.reduce((acc, i) => acc + (parseFloat(i.cantidad_cajas) || 0), 0)
  const totalPiezas = items.reduce((acc, i) => acc + (parseInt(i.cantidad_piezas, 10) || 0), 0)
  
  let partes = []
  if (totalCajas > 0) partes.push(`${totalCajas} cj`)
  if (totalPiezas > 0) partes.push(`${totalPiezas} pzs sueltas`)
  return `${items.length} prod. (${partes.join(', ') || '0'})`
}

// Obtener clase badge para estado
const getBadgeClass = (estado) => {
  switch (estado) {
    case 'Recibida': return 'badge-success'
    case 'Cancelada': return 'badge-danger'
    case 'Pendiente': default: return 'badge-warning'
  }
}
</script>

<template>
  <div class="page-container animate-fade">
    <!-- Encabezado de Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title"><i class="ph ph-file-text"></i> Órdenes de Compra Pendientes</h2>
        <p class="page-description">Genera y administra las solicitudes de compra a proveedores.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="loadData" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar
        </button>
        <button class="btn btn-primary" @click="openCreateModal()">
          <i class="ph ph-plus"></i> Nueva Orden de Compra
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
      <button class="alert-close" @click="alert.show = false"><i class="ph ph-x"></i></button>
    </div>

    <!-- Card Principal con Filtros Integrados y Tabla Extendida -->
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <span class="card-title">Listado de Órdenes de Compra ({{ ordenesFiltradas.length }})</span>

        <!-- Filtros integrados en la cabecera -->
        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <label class="text-xs text-muted fw-bold"><i class="ph ph-funnel"></i> Estado:</label>
            <select v-model="filterEstado" class="form-control" style="height: 30px; padding: 2px 8px; font-size: 0.8rem; width: 140px;">
              <option value="">Todos</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Recibida">Recibidas</option>
              <option value="Cancelada">Canceladas</option>
            </select>
          </div>

          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <label class="text-xs text-muted fw-bold"><i class="ph ph-handshake"></i> Proveedor:</label>
            <select v-model="filterProveedor" class="form-control" style="height: 30px; padding: 2px 8px; font-size: 0.8rem; width: 180px;">
              <option value="">Todos los Proveedores</option>
              <option v-for="prov in proveedores" :key="prov.id" :value="prov.id">
                {{ prov.nombre }}
              </option>
            </select>
          </div>

          <button v-if="filterEstado || filterProveedor" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 0.75rem;" @click="filterEstado = ''; filterProveedor = ''">
            <i class="ph ph-x"></i> Limpiar
          </button>
        </div>
      </div>

      <div class="table-container" style="max-height: 650px; overflow-y: auto;">
        <table v-if="!loading && ordenesFiltradas.length > 0" class="access-table">
          <thead>
            <tr>
              <th style="width: 140px;">N° ORDEN</th>
              <th>PROVEEDOR</th>
              <th style="width: 110px;">FECHA</th>
              <th>RESUMEN PRODUCTOS</th>
              <th style="width: 120px;" class="text-center">TOTAL PIEZAS</th>
              <th style="width: 120px;" class="text-center">PESO EST.</th>
              <th style="width: 120px;" class="text-center">ESTADO</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="ord in ordenesFiltradas" 
              :key="ord.id" 
              class="clickable-row"
              @click="verDetalle(ord)"
              title="Haz clic para ver el detalle y opciones"
            >
              <td>
                <span class="badge" style="background-color: var(--bevel-dark); color: var(--text-primary); font-family: monospace; font-size: 0.75rem; padding: 2px 6px;">
                  {{ ord.numero_orden }}
                </span>
              </td>
              <td>
                <strong>{{ ord.proveedor ? ord.proveedor.nombre : 'Sin proveedor' }}</strong>
              </td>
              <td>{{ ord.fecha }}</td>
              <td>
                <span class="text-muted">{{ resumenItems(ord.items) }}</span>
              </td>
              <td class="text-center fw-bold">
                {{ totalesOrden(ord.items).piezas }} pzs
              </td>
              <td class="text-center fw-bold" style="color: var(--accent-info);">
                {{ totalesOrden(ord.items).peso }}
              </td>
              <td class="text-center">
                <span :class="['badge-status', getBadgeClass(ord.estado)]">
                  {{ ord.estado }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Sin Resultados -->
        <div v-else-if="!loading" class="loading-state padding-lg text-center">
          <i class="ph ph-file-x icon-xl text-muted"></i>
          <p class="text-xs text-muted mt-2">No se encontraron órdenes de compra registradas.</p>
        </div>

        <!-- Cargando -->
        <div v-else class="loading-state padding-lg text-center">
          <i class="ph ph-spinner spinner icon-xl text-primary"></i>
          <p class="text-xs text-muted mt-2">Cargando órdenes de compra...</p>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVA ORDEN DE COMPRA -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
      <div class="modal-box modal-lg animate-scale">
        <div class="modal-header">
          <h3 class="m-0"><i class="ph ph-plus-circle"></i> Nueva Orden de Compra</h3>
          <button class="btn-close" @click="showCreateModal = false"><i class="ph ph-x"></i></button>
        </div>

        <div class="modal-body">
          <!-- Formulario Datos Generales -->
          <div class="form-grid mb-4">
            <!-- N° Orden -->
            <div class="form-group">
              <label class="form-label mb-1">N° Orden de Compra <span class="text-danger">*</span></label>
              <div style="display: flex; gap: 0.5rem;">
                <input v-model="formNumeroOrden" type="text" class="form-control" placeholder="Ej: OC-202608-0001" />
                <button class="btn btn-secondary btn-sm" @click="sugerirNumeroOrden()" title="Re-generar número correlativo">
                  <i class="ph ph-arrows-clockwise"></i>
                </button>
              </div>
            </div>

            <!-- Proveedor -->
            <div class="form-group">
              <label class="form-label mb-1">Proveedor / Fabricante <span class="text-danger">*</span></label>
              <select v-model="formProveedorId" class="form-control">
                <option value="" disabled>Seleccione un proveedor</option>
                <option v-for="prov in proveedores" :key="prov.id" :value="prov.id">
                  {{ prov.nombre }}
                </option>
              </select>
            </div>

            <!-- Fecha -->
            <div class="form-group">
              <label class="form-label mb-1">Fecha de Orden</label>
              <input v-model="formFecha" type="date" class="form-control" />
            </div>

            <!-- Observaciones -->
            <div class="form-group full-width">
              <label class="form-label mb-1">Observaciones / Notas (opcional)</label>
              <input v-model="formObservaciones" type="text" class="form-control" placeholder="Instrucciones o nota sobre la entrega..." />
            </div>
          </div>

          <hr class="my-3" style="border-color: var(--bevel-light);" />

          <!-- SECCIÓN: AGREGAR PRODUCTOS A LA ORDEN -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h4 class="m-0" style="font-size: 0.95rem;"><i class="ph ph-package"></i> Agregar Productos a la Orden</h4>
            <label v-if="formProveedorId" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; cursor: pointer; color: var(--text-muted);">
              <input type="checkbox" v-model="mostrarTodosProductos" />
              <span>Mostrar todo el catálogo</span>
            </label>
          </div>

          <div v-if="!formProveedorId" class="alert-box info mb-3">
            <i class="ph ph-info me-2"></i> Seleccione un <strong>Proveedor</strong> arriba para habilitar la búsqueda de productos.
          </div>

          <!-- Cuadro de Búsqueda y Selección de Producto -->
          <div class="add-item-card mb-4" :class="{ disabled: !formProveedorId }">
            <div class="form-grid-items">
              <!-- Selector Buscable de Producto -->
              <div class="form-group flex-2 search-container">
                <label class="form-label mb-1">Buscar Producto (Código o Nombre)</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <input
                    type="text"
                    v-model="productSearchText"
                    class="form-control"
                    placeholder="Escriba para buscar producto..."
                    @focus="isProductDropdownOpen = true"
                    :disabled="!formProveedorId"
                  />
                  <button v-if="selectedProducto" class="btn-clear-search" @click="selectedProducto = null; productSearchText = ''">
                    <i class="ph ph-x"></i>
                  </button>
                </div>

                <!-- Desplegable con coincidencias -->
                <div v-if="isProductDropdownOpen && !selectedProducto" class="search-dropdown-menu">
                  <div
                    v-for="prod in productosFiltradosBusqueda"
                    :key="prod.codigo"
                    class="search-dropdown-item"
                    @click="selectProductoFromSearch(prod)"
                  >
                    <div class="item-main">
                      <span class="item-code">{{ prod.codigo }}</span>
                      <span class="item-name">{{ prod.nombre }}</span>
                      <span v-if="!prod.activo" class="badge-inactivo">Inactivo</span>
                    </div>
                    <div class="item-sub">
                      <span v-if="prod.peso_pieza">{{ prod.peso_pieza }} kg/pz</span>
                    </div>
                  </div>
                  <div v-if="productosFiltradosBusqueda.length === 0" class="search-dropdown-empty">
                    No se encontraron productos.
                  </div>
                </div>

                <span v-if="bultoInfoSeleccionado" class="text-help mt-1" style="color: var(--accent-primary);">
                  <i class="ph ph-box-arrow-down"></i> Caja/Bulto registrado: ~{{ bultoInfoSeleccionado.cantidad_piezas }} pzs/caja ({{ bultoInfoSeleccionado.peso_caja }} kg)
                </span>
                <span v-else-if="selectedProducto && selectedProducto.peso_pieza" class="text-help mt-1" style="color: var(--accent-info);">
                  <i class="ph ph-scales"></i> Peso promedio configurado: {{ selectedProducto.peso_pieza }} kg/pieza
                </span>
              </div>

              <!-- Cajas / Bultos -->
              <div class="form-group">
                <label class="form-label mb-1">Cajas / Bultos</label>
                <input 
                  v-model.number="selectedCajas" 
                  type="number" 
                  min="0" 
                  step="1" 
                  class="form-control" 
                  placeholder="0"
                  :disabled="!formProveedorId || !selectedProducto" 
                />
              </div>

              <!-- Piezas Sueltas -->
              <div class="form-group">
                <label class="form-label mb-1">Piezas Sueltas</label>
                <input 
                  v-model.number="selectedPiezas" 
                  type="number" 
                  min="0" 
                  step="1" 
                  class="form-control" 
                  placeholder="0"
                  :disabled="!formProveedorId || !selectedProducto" 
                />
              </div>

              <!-- Botón Agregar -->
              <div class="form-group flex-end">
                <button 
                  class="btn btn-primary w-100" 
                  @click="addItemToOrder()"
                  :disabled="!formProveedorId || !selectedProducto"
                >
                  <i class="ph ph-plus"></i> Agregar
                </button>
              </div>
            </div>
          </div>

          <!-- LISTA DE PRODUCTOS AGREGADOS A LA ORDEN -->
          <div class="mb-3">
            <h5 class="mb-2" style="font-size: 0.9rem;">Productos en la Orden ({{ orderItems.length }})</h5>
            <div class="table-container border rounded">
              <table class="access-table">
                <thead>
                  <tr>
                    <th style="width: 120px;">Código</th>
                    <th>Producto</th>
                    <th style="width: 110px;" class="text-center">Cajas/Bultos</th>
                    <th style="width: 100px;" class="text-center">Piezas</th>
                    <th style="width: 110px;" class="text-center">Total Piezas</th>
                    <th style="width: 110px;" class="text-center">Peso Est.</th>
                    <th style="width: 60px;" class="text-right">Quitar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in orderItems" :key="item.codigo_producto">
                    <td><span class="badge" style="font-family: monospace;">{{ item.codigo_producto }}</span></td>
                    <td>{{ item.nombre }}</td>
                    <td class="text-center">
                      <span class="badge" style="background: var(--accent-info-light); color: var(--accent-info);">{{ item.cantidad_cajas }} cj</span>
                    </td>
                    <td class="text-center">
                      <span class="badge" style="background: var(--accent-primary-light); color: var(--accent-primary-hover);">{{ item.cantidad_piezas }} pzs</span>
                    </td>
                    <td class="text-center fw-bold">
                      {{ calcularTotalPiezas(item) }} pzs
                    </td>
                    <td class="text-center fw-bold" style="color: var(--accent-info);">
                      {{ calcularPesoEstimado(item) }}
                    </td>
                    <td class="text-right">
                      <button class="btn btn-danger btn-sm" style="padding: 2px 6px;" @click="removeItemFromOrder(idx)" title="Eliminar ítem">
                        <i class="ph ph-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="orderItems.length === 0">
                    <td colspan="7" class="text-center text-muted py-4">
                      No se han agregado productos a la orden.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="guardarOrden()" :disabled="saving || orderItems.length === 0">
            <i v-if="saving" class="ph ph-spinner spinner"></i>
            <i v-else class="ph ph-check"></i>
            Guardar Orden de Compra
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE DE ORDEN CON ACCIONES -->
    <div v-if="showDetailModal && selectedOrden" class="modal-backdrop" @click.self="showDetailModal = false">
      <div class="modal-box modal-lg animate-scale">
        <div class="modal-header">
          <div>
            <h3 class="m-0"><i class="ph ph-file-text"></i> Detalle de Orden {{ selectedOrden.numero_orden }}</h3>
            <span :class="['badge-status mt-1', getBadgeClass(selectedOrden.estado)]">
              Estado Actual: {{ selectedOrden.estado }}
            </span>
          </div>
          <button class="btn-close" @click="showDetailModal = false"><i class="ph ph-x"></i></button>
        </div>

        <div class="modal-body">
          <div class="detail-info-grid mb-3">
            <div>
              <span class="info-label">Proveedor / Fabricante:</span>
              <span class="info-value"><strong>{{ selectedOrden.proveedor ? selectedOrden.proveedor.nombre : 'Sin especificar' }}</strong></span>
            </div>
            <div>
              <span class="info-label">Fecha de Emisión:</span>
              <span class="info-value">{{ selectedOrden.fecha }}</span>
            </div>
            <div class="full-width" v-if="selectedOrden.observaciones">
              <span class="info-label">Observaciones:</span>
              <span class="info-value">{{ selectedOrden.observaciones }}</span>
            </div>
          </div>

          <h4 class="mb-2" style="font-size: 0.95rem;"><i class="ph ph-package"></i> Productos Solicitados ({{ selectedOrden.items?.length || 0 }})</h4>
          <div class="table-container border rounded mb-3" style="max-height: 350px; overflow-y: auto;">
            <table class="access-table">
              <thead>
                <tr>
                  <th style="width: 130px;">Código</th>
                  <th>Producto</th>
                  <th style="width: 110px;" class="text-center">Cajas/Bultos</th>
                  <th style="width: 100px;" class="text-center">Piezas</th>
                  <th style="width: 110px;" class="text-center">Total Piezas</th>
                  <th style="width: 120px;" class="text-center">Peso Est.</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedOrden.items" :key="item.id">
                  <td><span class="badge" style="font-family: monospace;">{{ item.codigo_producto }}</span></td>
                  <td>{{ item.producto ? item.producto.nombre : 'Producto' }}</td>
                  <td class="text-center">
                    <span class="badge" style="background: var(--accent-info-light); color: var(--accent-info);">{{ item.cantidad_cajas }} cj</span>
                  </td>
                  <td class="text-center">
                    <span class="badge" style="background: var(--accent-primary-light); color: var(--accent-primary-hover);">{{ item.cantidad_piezas }} pzs</span>
                  </td>
                  <td class="text-center fw-bold">
                    {{ calcularTotalPiezas(item) }} pzs
                  </td>
                  <td class="text-center fw-bold" style="color: var(--accent-info);">
                    {{ calcularPesoEstimado(item) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Acciones de Estado dentro del Modal -->
          <div style="background: var(--bg-secondary); padding: 0.85rem; border-radius: 0; border: 1px solid var(--bevel-light); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <strong class="d-block" style="font-size: 0.85rem;">Cambiar Estado Administrativo</strong>
              <span class="text-muted text-xs">Actualiza el estado de la orden según el avance con el proveedor.</span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button 
                class="btn btn-warning btn-sm" 
                :disabled="selectedOrden.estado === 'Pendiente'"
                @click="cambiarEstadoOrden(selectedOrden, 'Pendiente')"
              >
                <i class="ph ph-clock"></i> Pendiente
              </button>
              <button 
                class="btn btn-primary btn-sm" 
                :disabled="selectedOrden.estado === 'Recibida'"
                @click="cambiarEstadoOrden(selectedOrden, 'Recibida')"
              >
                <i class="ph ph-check-circle"></i> Recibida
              </button>
              <button 
                class="btn btn-danger btn-sm" 
                :disabled="selectedOrden.estado === 'Cancelada'"
                @click="cambiarEstadoOrden(selectedOrden, 'Cancelada')"
              >
                <i class="ph ph-x-circle"></i> Cancelada
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: space-between;">
          <button class="btn btn-danger btn-sm" @click="eliminarOrden(selectedOrden)">
            <i class="ph ph-trash"></i> Eliminar Orden
          </button>
          <button class="btn btn-secondary" @click="showDetailModal = false">Cerrar</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.clickable-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.clickable-row:hover {
  background-color: var(--accent-primary-light, #d1fae5) !important;
}

.badge-status {
  padding: 0.25rem 0.6rem;
  border-radius: 0;
  font-size: 0.78rem;
  font-weight: 600;
  display: inline-block;
}

.badge-warning { background: var(--accent-warning-light); color: var(--accent-warning); }
.badge-success { background: var(--accent-success-light); color: var(--accent-success); }
.badge-danger { background: var(--accent-danger-light); color: var(--accent-danger); }

.badge-inactivo {
  background: var(--accent-danger-light);
  color: var(--accent-danger);
  font-size: 0.7rem;
  padding: 1px 4px;
  border-radius: 0;
  margin-left: 6px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-box {
  background: var(--bg-secondary);
  border-radius: 0;
  width: 100%;
  max-width: 950px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--raised-shadow);
  overflow: hidden;
}

.modal-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--bevel-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-window);
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 0.85rem 1.25rem;
  border-top: 1px solid var(--bevel-light);
  background: var(--bg-window);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.form-grid-items {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 0.75rem;
  align-items: flex-end;
}

.full-width {
  grid-column: 1 / -1;
}

.flex-2 { flex: 2; }
.flex-end { display: flex; align-items: flex-end; }

.add-item-card {
  background: var(--bg-window);
  border: 1px solid var(--bevel-light);
  border-radius: 0;
  padding: 1rem;
}

.add-item-card.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.search-container {
  position: relative;
}

.btn-clear-search {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}

.search-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  box-shadow: var(--raised-shadow);
  max-height: 220px;
  overflow-y: auto;
  z-index: 100;
  margin-top: 4px;
}

.search-dropdown-item {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--bevel-light);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-dropdown-item:hover {
  background: var(--accent-info-light);
}

.item-code {
  font-weight: bold;
  font-family: monospace;
  margin-right: 8px;
}

.item-name {
  color: var(--text-primary);
}

.search-dropdown-empty {
  padding: 0.85rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.text-help {
  font-size: 0.78rem;
  display: block;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  background: var(--bg-window);
  padding: 1rem;
  border-radius: 0;
  border: 1px solid var(--bevel-light);
}

.info-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  display: block;
}

.info-value {
  font-size: 0.95rem;
  color: var(--text-primary);
}
</style>
