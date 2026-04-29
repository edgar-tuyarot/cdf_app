<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWinDialog } from '../composables/useWinDialog'

const { winConfirm } = useWinDialog()

const activeTab = ref('listado') // 'listado', 'importar', 'demanda'
const pedidos = ref([])
const sucursales = ref([])
const isLoading = ref(false)
const expandedRows = ref(new Set())

// Filtros
const filterId = ref('')
const filterSucursal = ref('')
const filterFecha = ref('')

// Demanda Global
const demandaTotal = ref([])
const isLoadingDemanda = ref(false)
const sortKey = ref('nombre')
const sortOrder = ref(1) // 1 asc, -1 desc

// Estado Modal Picking
const showModalPicking = ref(false)
const pedidoEnPicking = ref(null)
const itemsPicking = ref([])

const abrirPicking = (pedido) => {
  pedidoEnPicking.value = pedido
  itemsPicking.value = pedido.ItemPedidos.map((item) => ({
    ...item,
    registrado: false,
  }))
  showModalPicking.value = true
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value *= -1
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

const demandaOrdenada = computed(() => {
  return [...demandaTotal.value].sort((a, b) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]
    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()

    if (valA < valB) return -1 * sortOrder.value
    if (valA > valB) return 1 * sortOrder.value
    return 0
  })
})

const cargarDemanda = async () => {
  isLoadingDemanda.value = true
  try {
    const res = await fetch('/api/pedidos/calculo-stock')
    if (res.ok) {
      const data = await res.json()
      demandaTotal.value = data.total || []
    }
  } catch (error) {
    console.error('Error cargando demanda global:', error)
  } finally {
    isLoadingDemanda.value = false
  }
}

// Para el Detalle de Pedido
const pedidoDetalle = ref(null)
const preparacionesDetalle = ref([]) // preparaciones asociadas al pedidoDetalle
const modoPreparando = ref(false)
const itemsPreparando = ref([])
const isSavingEstado = ref(false)

// Modal de item
const itemModal = ref(null) // item actualmente abierto en el modal
const modalPesoPiezas = ref('')
const modalPesoBolsitas = ref('')
const modalCantBolsas = ref('')
const modalTab = ref('piezas') // 'piezas' | 'fraccionados'

const abrirModalItem = (item) => {
  itemModal.value = item
  modalPesoPiezas.value = item.pesoPiezasEnviadas ?? ''
  modalPesoBolsitas.value = item.pesoBolsitasEnviadas ?? ''
  modalCantBolsas.value = item.cantidadBolsas ?? ''
  modalTab.value = 'piezas'
}

const cerrarModalItem = () => {
  itemModal.value = null
}

const isSavingItem = ref(false)

const confirmarModalItem = async () => {
  if (!itemModal.value) return
  isSavingItem.value = true

  try {
    const payload = {
      codigo_de_pedido: pedidoDetalle.value.id_pedido,
      codigo_producto: itemModal.value.Producto?.codigo_interno,
      cantidad_piezas_pedida: Number(
        itemModal.value.cantidad_piezas ?? itemModal.value.cantidad ?? 0,
      ),
      cantidad_fracciones_pedidas: Number(
        itemModal.value.cantidad_fraccionado ?? itemModal.value.cantidad_feteados ?? 0,
      ),
      peso_piezas_preparadas: Number(modalPesoPiezas.value) || 0,
      peso_fracciones_preparadas: Number(modalPesoBolsitas.value) || 0,
      cantidad_bolsitas_preparadas: Number(modalCantBolsas.value) || 0,
    }

    let url = '/api/preparacion-pedidos'
    let method = 'POST'

    // Si ya existe un ID de preparación guardado previamente, es una actualización
    if (itemModal.value.preparacion_id) {
      url = `/api/preparacion-pedidos/${itemModal.value.preparacion_id}`
      method = 'PUT'
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) throw new Error('Error al guardar la preparación')

    // Si la API devuelve un JSON, lo intentamos parsear para obtener el ID en caso de POST
    const text = await res.text()
    if (text) {
      const data = JSON.parse(text)
      if (method === 'POST' && data && data.id) {
        itemModal.value.preparacion_id = data.id
      }
    }

    itemModal.value.pesoPiezasEnviadas = modalPesoPiezas.value
    itemModal.value.pesoBolsitasEnviadas = modalPesoBolsitas.value
    itemModal.value.cantidadBolsas = modalCantBolsas.value
    itemModal.value.confirmado = true
    cerrarModalItem()
  } catch (error) {
    console.error(error)
    mostrarMensaje('error', 'Error al guardar la preparación del item.')
  } finally {
    isSavingItem.value = false
  }
}

const reEditarItem = (item) => {
  item.confirmado = false
  abrirModalItem(item)
}

// JSON resultante de todos los items confirmados
const payloadPreparacion = computed(() => ({
  pedido_id: pedidoDetalle.value?.id_pedido,
  items: itemsPreparando.value
    .filter((i) => i.confirmado)
    .map((i) => ({
      item_id: i.id,
      codigo: i.Producto?.codigo_interno,
      peso_piezas_enviadas: Number(i.pesoPiezasEnviadas) || 0,
      peso_bolsitas_enviadas: Number(i.pesoBolsitasEnviadas) || 0,
      cantidad_bolsas: Number(i.cantidadBolsas) || 0,
    })),
}))

const estadoColor = (estado) => {
  const map = {
    Confirmado: 'badge-primary',
    Preparando: 'badge-warning',
    Preparado: 'badge-info',
    Completo: 'badge-success',
    Enviado: 'badge-dark',
    Despachado: 'badge-dark',
  }
  return map[estado] || 'badge-primary'
}

const esPendiente = (estado) => ['Confirmado', 'Pendiente', 'Nuevo'].includes(estado)

const esCompleto = (estado) => estado === 'Completo'

const esPreparado = (estado) => estado === 'Preparado'

const toggleRow = (id) => {
  if (expandedRows.value.has(id)) expandedRows.value.delete(id)
  else expandedRows.value.add(id)
}

const cargarPedidos = async () => {
  isLoading.value = true
  try {
    const res = await fetch('/api/pedidos')
    if (res.ok) pedidos.value = await res.json()
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const pedidosFiltrados = computed(() => {
  return pedidos.value.filter((p) => {
    const matchId = p.id_pedido.toLowerCase().includes(filterId.value.toLowerCase())
    const matchSuc = filterSucursal.value ? p.Sucursal?.nombre === filterSucursal.value : true
    const matchFecha = filterFecha.value ? p.fecha_pedido.includes(filterFecha.value) : true
    return matchId && matchSuc && matchFecha
  })
})

const verDetalle = async (pedido) => {
  pedidoDetalle.value = pedido
  preparacionesDetalle.value = []
  try {
    const res = await fetch(`/api/preparacion-pedidos/pedido/${pedido.id_pedido}`)
    if (res.ok) {
      preparacionesDetalle.value = await res.json()
    }
  } catch (error) {
    console.error('Error cargando preparaciones del pedido', error)
  }
}

const volverAlListado = () => {
  pedidoDetalle.value = null
  preparacionesDetalle.value = []
  modoPreparando.value = false
  itemsPreparando.value = []
  itemModal.value = null
}

const volverAlDetalle = () => {
  modoPreparando.value = false
  itemModal.value = null
}

// --- PREPARAR PEDIDO (cambia estado a Preparando y abre vista de prep. mixeando con datos previos) ---
const prepararPedido = async () => {
  isSavingEstado.value = true
  try {
    // 1. Obtener preparaciones previas de la BBDD (ya cargadas en verDetalle)
    let prepPrevias = preparacionesDetalle.value || []

    // 2. Cambiar estado a Preparando (TODO: endpoint de pedido para actualizar el estado a nivel pedido)
    if (pedidoDetalle.value.estado !== 'Preparando') {
      pedidoDetalle.value.estado = 'Preparando'
    }

    // 3. Mixear los items del pedido con las preparaciones guardadas
    itemsPreparando.value = pedidoDetalle.value.ItemPedidos.map((item) => {
      const codigoProd = item.Producto?.codigo_interno
      const prep = prepPrevias.find((p) => String(p.codigo_producto) === String(codigoProd))

      if (prep) {
        return {
          ...item,
          preparacion_id: prep.id,
          pesoPiezasEnviadas: prep.peso_piezas_preparadas,
          pesoBolsitasEnviadas: prep.peso_fracciones_preparadas,
          cantidadBolsas: prep.cantidad_bolsitas_preparadas,
          confirmado: true,
        }
      }

      // Si no hay preparación previa, el item arranca vacío
      return {
        ...item,
        pesoPiezasEnviadas: '',
        pesoBolsitasEnviadas: '',
        cantidadBolsas: '',
        confirmado: false,
      }
    })

    modoPreparando.value = true
  } catch (error) {
    console.error(error)
    mostrarMensaje('error', 'Error al cargar preparaciones previas.')
  } finally {
    isSavingEstado.value = false
  }
}

// --- FINALIZAR PREPARACIÓN (cambia estado a Preparado) ---
const finalizarPreparacion = async () => {
  if (!window.confirm('¿Confirmás que terminaste de preparar este pedido?')) return

  isSavingEstado.value = true
  try {
    const res = await fetch(`/api/pedidos/${pedidoDetalle.value.id_pedido}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'Preparado' }),
    })
    if (res.ok) {
      pedidoDetalle.value.estado = 'Preparado'
      mostrarMensaje('success', 'Pedido marcado como Preparado.')
      modoPreparando.value = false
      cargarPedidos()
    } else {
      mostrarMensaje('error', 'Error al cambiar el estado del pedido.')
    }
  } catch (error) {
    console.error(error)
    mostrarMensaje('error', 'Error de red al finalizar preparación.')
  } finally {
    isSavingEstado.value = false
  }
}

// --- ENVIAR PEDIDO (cambia estado a Enviado) ---
const enviarPedido = async () => {
  if (!window.confirm('¿Confirmás que el pedido está listo para enviar?')) return

  isSavingEstado.value = true
  try {
    const res = await fetch(`/api/pedidos/${pedidoDetalle.value.id_pedido}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'Enviado' }),
    })
    if (res.ok) {
      pedidoDetalle.value.estado = 'Enviado'
      mostrarMensaje('success', 'Pedido marcado como Enviado.')
      cargarPedidos()
    } else {
      mostrarMensaje('error', 'Error al cambiar el estado del pedido.')
    }
  } catch (error) {
    console.error(error)
    mostrarMensaje('error', 'Error de red al enviar pedido.')
  } finally {
    isSavingEstado.value = false
  }
}

// --- DESPACHAR PEDIDO (POST /api/pedidos/:id/despachar) ---
const despacharPedido = async () => {
  if (!window.confirm('¿Confirmás el despacho del pedido? Esto descontará el stock y lo marcará como Despachado.')) return

  isSavingEstado.value = true
  try {
    const res = await fetch(`/api/pedidos/${pedidoDetalle.value.id_pedido}/despachar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      pedidoDetalle.value.estado = 'Despachado'
      mostrarMensaje('success', '¡Pedido despachado! Stock descontado correctamente.')
      cargarPedidos()
    } else {
      const data = await res.json().catch(() => ({}))
      mostrarMensaje('error', data.message || 'Error al despachar el pedido.')
    }
  } catch (error) {
    console.error(error)
    mostrarMensaje('error', 'Error de red al despachar el pedido.')
  } finally {
    isSavingEstado.value = false
  }
}

// Upload Excel
const archivoExcel = ref(null)
const isUploading = ref(false)
const uploadResult = ref(null)
const mensaje = ref({ tipo: '', texto: '' })

const mostrarMensaje = (tipo, texto) => {
  mensaje.value = { tipo, texto }
  setTimeout(() => {
    mensaje.value = { tipo: '', texto: '' }
  }, 6000)
}

const onFileChange = (e) => {
  archivoExcel.value = e.target.files[0] || null
  uploadResult.value = null
}

const subir_excel = async () => {
  console.log('Iniciando subida de Excel...');
  if (!archivoExcel.value) {
    mostrarMensaje('error', 'Seleccione un archivo .xlsx primero.')
    return
  }

  // Usamos confirm nativo para asegurar que se muestre y no bloquee el flujo
  const confirmado = window.confirm('Esto BORRARÁ todos los pedidos existentes y los reemplazará con los del Excel. ¿Continuar?')
  
  if (!confirmado) return


  isUploading.value = true
  uploadResult.value = null

  const formData = new FormData()
  formData.append('archivo', archivoExcel.value)

  try {
    const res = await fetch('/api/pedidos/cargar-excel', {
      method: 'POST',
      body: formData,
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Error al procesar el Excel.')
    }

    const data = await res.json()
    uploadResult.value = data.resumen
    mostrarMensaje('success', data.mensaje || 'Excel procesado correctamente.')
    archivoExcel.value = null
    
    // Limpiar el input file
    const fileInput = document.getElementById('excel-input')
    if (fileInput) fileInput.value = ''
    
    // Recargar los pedidos
    await cargarPedidos()
  } catch (error) {
    console.error('Error en subir_excel:', error)
    mostrarMensaje('error', error.message || 'Error de red al subir el archivo.')
  } finally {
    isUploading.value = false
  }
}


onMounted(() => {
  cargarPedidos()
  cargarDemanda()
})
</script>

<template>
  <div class="page-container animate-fade">
    <!-- Tabs Móvil (Scroll horizontal) -->
    <div class="tabs-scroll no-print">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'demanda' }"
        @click="activeTab = 'demanda'"
      >
        <i class="ph ph-chart-bar"></i> Demanda Global
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'listado' }"
        @click="activeTab = 'listado'"
      >
        <i class="ph ph-list"></i> Listado
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'importar' }"
        @click="activeTab = 'importar'"
      >
        <i class="ph ph-upload"></i> Cargar
      </button>
    </div>

    <!-- VISTA: DEMANDA GLOBAL -->
    <div v-if="activeTab === 'demanda'" class="demanda-view">
      <div class="card">
        <div class="card-header responsive-card-header">
          <h3 class="card-title">Demanda vs Stock Real</h3>
          <button
            class="icon-btn"
            @click="cargarDemanda"
            :disabled="isLoadingDemanda"
            title="Actualizar"
          >
            <i
              class="ph"
              :class="isLoadingDemanda ? 'ph-spinner spinner' : 'ph-arrows-clockwise'"
            ></i>
          </button>
        </div>
        <div class="table-container">
          <table class="responsive-table">
            <thead>
              <tr>
                <th style="width: 55%; cursor: pointer" @click="sortBy('nombre')">
                  Producto
                  <i
                    class="ph"
                    :class="
                      sortKey === 'nombre'
                        ? sortOrder === 1
                          ? 'ph-caret-up'
                          : 'ph-caret-down'
                        : 'ph-arrows-down-up'
                    "
                  ></i>
                </th>
                <th class="text-right" style="cursor: pointer" @click="sortBy('pedido_total')">
                  Total
                  <i
                    class="ph"
                    :class="
                      sortKey === 'pedido_total'
                        ? sortOrder === 1
                          ? 'ph-caret-up'
                          : 'ph-caret-down'
                        : 'ph-arrows-down-up'
                    "
                  ></i>
                </th>
                <th class="text-right" style="cursor: pointer" @click="sortBy('stock_actual')">
                  Stock
                  <i
                    class="ph"
                    :class="
                      sortKey === 'stock_actual'
                        ? sortOrder === 1
                          ? 'ph-caret-up'
                          : 'ph-caret-down'
                        : 'ph-arrows-down-up'
                    "
                  ></i>
                </th>
                <th class="text-right" style="cursor: pointer" @click="sortBy('diferencia')">
                  Dif.
                  <i
                    class="ph"
                    :class="
                      sortKey === 'diferencia'
                        ? sortOrder === 1
                          ? 'ph-caret-up'
                          : 'ph-caret-down'
                        : 'ph-arrows-down-up'
                    "
                  ></i>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="demandaTotal.length === 0">
                <td colspan="4" class="text-center text-muted" style="padding: 2rem">
                  <span v-if="isLoadingDemanda">Cargando datos...</span>
                  <span v-else>No hay datos de demanda.</span>
                </td>
              </tr>
              <tr v-for="d in demandaOrdenada" :key="d.codigo">
                <td>
                  <div style="display: flex; flex-direction: column">
                    <span class="fw-bold text-sm">{{ (d.nombre || '-').slice(5) }}</span>
                    <span class="text-xs text-muted">Cód: {{ d.codigo }}</span>
                  </div>
                </td>
                <td class="text-right fw-bold text-blue">{{ d.pedido_total }}</td>
                <td class="text-right fw-bold" style="color: var(--accent-success)">
                  {{ d.stock_actual }}
                </td>
                <td
                  class="text-right fw-bold"
                  :style="{
                    color: d.diferencia < 0 ? 'var(--accent-danger)' : 'var(--accent-success)',
                  }"
                >
                  {{ d.diferencia }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- VISTA: LISTADO DE CONSULTA -->
    <div v-if="activeTab === 'listado'" class="list-view">
      <!-- ===== Sub-vista: PREPARANDO ===== -->
      <div v-if="pedidoDetalle && modoPreparando" class="prep-view">
        <div class="card">
          <div class="card-header">
            <button class="back-link" @click="volverAlDetalle">&larr; Volver</button>
            <h3 class="card-title">Preparando &mdash; {{ pedidoDetalle.Sucursal?.nombre }}</h3>
          </div>
        </div>

        <!-- Progreso -->
        <div class="prep-progress mt-2">
          <span class="prep-prog-text">
            {{ itemsPreparando.filter((i) => i.confirmado).length }} /
            {{ itemsPreparando.length }} confirmados
          </span>
          <div class="prep-prog-bar">
            <div
              class="prep-prog-fill"
              :style="{
                width:
                  (itemsPreparando.length
                    ? (itemsPreparando.filter((i) => i.confirmado).length /
                        itemsPreparando.length) *
                      100
                    : 0) + '%',
              }"
            ></div>
          </div>
        </div>

        <!-- Tabla items -->
        <div class="card mt-2">
          <div class="card-header">
            <h3 class="card-title">Items a preparar</h3>
            <span class="result-count">{{ itemsPreparando.length }} productos</span>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-right">Piezas</th>
                  <th class="text-right">Fracc</th>
                  <th class="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in itemsPreparando"
                  :key="item.id"
                  @click="item.confirmado ? reEditarItem(item) : abrirModalItem(item)"
                  style="cursor: pointer"
                  :class="item.confirmado ? 'text-done' : ''"
                >
                  <td>
                    <div style="display: flex; flex-direction: column">
                      <span class="fw-bold text-sm">{{
                        (item.Producto?.descripcion || '-').slice(5)
                      }}</span>
                      <span class="text-xs" :class="item.confirmado ? '' : 'text-muted'">{{
                        item.Producto?.codigo_interno
                      }}</span>
                    </div>
                  </td>
                  <td class="text-right fw-bold">
                    {{
                      item.confirmado && item.pesoPiezasEnviadas !== ''
                        ? item.pesoPiezasEnviadas
                        : '-'
                    }}
                  </td>
                  <td class="text-right fw-bold">
                    {{
                      item.confirmado && item.pesoBolsitasEnviadas !== ''
                        ? item.pesoBolsitasEnviadas
                        : '-'
                    }}
                  </td>
                  <td class="text-center">
                    <i
                      v-if="item.confirmado"
                      class="ph ph-check-circle"
                      style="font-size: 1.1rem"
                    ></i>
                    <i
                      v-else
                      class="ph ph-pencil-simple"
                      style="color: var(--text-muted); font-size: 0.9rem"
                    ></i>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Botones finales -->
        <div class="prep-actions mt-2">
          <button class="btn btn-outline" @click="volverAlDetalle">Cancelar</button>
          <button
            class="btn btn-primary"
            :disabled="isSavingEstado || itemsPreparando.filter((i) => i.confirmado).length === 0"
            @click="finalizarPreparacion"
          >
            {{ isSavingEstado ? 'Guardando...' : 'Confirmar preparación' }}
          </button>
        </div>
      </div>

      <!-- ===== Sub-vista: DETALLE ===== -->
      <div v-else-if="pedidoDetalle" class="detail-view">
        <div class="card">
          <div class="card-header">
            <button class="back-link" @click="volverAlListado">&larr; Volver</button>
            <h3 class="card-title">
              Pedido #{{ pedidoDetalle.id_pedido.split('-')[1] || pedidoDetalle.id_pedido }}
            </h3>
          </div>
          <div class="p-4">
            <!-- Info del pedido -->
            <div class="pedido-info-grid">
              <div class="info-item">
                <span class="info-label">Sucursal</span>
                <span class="info-value">{{ pedidoDetalle.Sucursal?.nombre || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha</span>
                <span class="info-value">{{
                  pedidoDetalle.fecha_pedido?.split('T')[0] || '-'
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Estado</span>
                <span class="info-value">
                  <span class="badge text-xs" :class="estadoColor(pedidoDetalle.estado)">{{
                    pedidoDetalle.estado
                  }}</span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Items</span>
                <span class="info-value fw-bold">{{ pedidoDetalle.ItemPedidos?.length || 0 }}</span>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="accion-bar mt-2">
              <!-- Estado: Pendiente/Confirmado → Preparar -->
              <button
                v-if="esPendiente(pedidoDetalle.estado) || pedidoDetalle.estado === 'Preparando'"
                class="btn btn-primary"
                @click="prepararPedido"
                :disabled="isSavingEstado"
              >
                <i class="ph ph-package"></i>
                {{
                  isSavingEstado
                    ? 'Procesando...'
                    : pedidoDetalle.estado === 'Preparando'
                      ? 'Continuar preparación'
                      : 'Preparar pedido'
                }}
              </button>

              <button
                v-if="esPendiente(pedidoDetalle.estado) || pedidoDetalle.estado === 'Preparando'"
                class="btn btn-outline"
                @click="abrirPicking(pedidoDetalle)"
              >
                <i class="ph ph-hand-pointing"></i>
                Picking Móvil
              </button>

              <!-- Estado: Preparado → Despachar -->
              <button
                v-if="esPreparado(pedidoDetalle.estado)"
                class="btn btn-success"
                @click="despacharPedido"
                :disabled="isSavingEstado"
              >
                <i class="ph ph-truck"></i>
                {{ isSavingEstado ? 'Despachando...' : 'Despachar pedido' }}
              </button>

              <!-- Estado: Completo (legacy) → Enviar -->
              <button
                v-if="esCompleto(pedidoDetalle.estado)"
                class="btn btn-success"
                @click="enviarPedido"
                :disabled="isSavingEstado"
              >
                <i class="ph ph-paper-plane-tilt"></i>
                {{ isSavingEstado ? 'Procesando...' : 'Enviar pedido' }}
              </button>

              <span
                v-if="pedidoDetalle.estado === 'Enviado' || pedidoDetalle.estado === 'Despachado'"
                class="badge badge-dark"
                style="padding: 0.4rem 0.75rem"
              >
                <i class="ph ph-check-circle"></i> {{ pedidoDetalle.estado }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tabla de items -->
        <div class="card mt-2">
          <div class="card-header responsive-card-header">
            <h3 class="card-title">Detalle de Productos</h3>
            <span class="result-count">{{ pedidoDetalle.ItemPedidos?.length || 0 }} productos</span>
          </div>
          <div class="table-container">
            <table class="responsive-table">
              <thead>
                <tr>
                  <th>Cód.</th>
                  <th>Producto</th>
                  <th class="text-right">Kg Pzas</th>
                  <th class="text-right">Kg Frac.</th>
                  <th class="text-right">Unid.</th>
                  <th class="text-right">Total kg</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in pedidoDetalle.ItemPedidos" :key="item.id">
                  <td class="fw-bold text-muted text-sm">
                    {{ item.Producto?.codigo_interno || '-' }}
                  </td>
                  <td>
                    <span class="fw-bold text-sm">{{
                      (item.Producto?.descripcion || '-').slice(5)
                    }}</span>
                  </td>
                  <td class="text-right">
                    <span
                      class="fw-bold"
                      :class="
                        preparacionesDetalle.find(
                          (p) =>
                            String(p.codigo_producto) === String(item.Producto?.codigo_interno),
                        )?.peso_piezas_preparadas > 0
                          ? 'text-blue'
                          : 'text-muted'
                      "
                    >
                      {{
                        preparacionesDetalle.find(
                          (p) =>
                            String(p.codigo_producto) === String(item.Producto?.codigo_interno),
                        )?.peso_piezas_preparadas ?? '-'
                      }}
                    </span>
                  </td>
                  <td class="text-right">
                    <span
                      class="fw-bold"
                      :class="
                        preparacionesDetalle.find(
                          (p) =>
                            String(p.codigo_producto) === String(item.Producto?.codigo_interno),
                        )?.peso_fracciones_preparadas > 0
                          ? 'text-blue'
                          : 'text-muted'
                      "
                    >
                      {{
                        preparacionesDetalle.find(
                          (p) =>
                            String(p.codigo_producto) === String(item.Producto?.codigo_interno),
                        )?.peso_fracciones_preparadas ?? '-'
                      }}
                    </span>
                  </td>
                  <td class="text-right">
                    <span
                      class="fw-bold"
                      :class="
                        preparacionesDetalle.find(
                          (p) =>
                            String(p.codigo_producto) === String(item.Producto?.codigo_interno),
                        )?.cantidad_bolsitas_preparadas > 0
                          ? 'text-blue'
                          : 'text-muted'
                      "
                    >
                      {{
                        preparacionesDetalle.find(
                          (p) =>
                            String(p.codigo_producto) === String(item.Producto?.codigo_interno),
                        )?.cantidad_bolsitas_preparadas ?? '-'
                      }}
                    </span>
                  </td>
                  <td class="text-right">
                    <span
                      class="fw-bold"
                      style="color: var(--accent-success)"
                      v-if="
                        preparacionesDetalle.find(
                          (p) =>
                            String(p.codigo_producto) === String(item.Producto?.codigo_interno),
                        )
                      "
                    >
                      {{
                        (
                          Number(
                            preparacionesDetalle.find(
                              (p) =>
                                String(p.codigo_producto) === String(item.Producto?.codigo_interno),
                            )?.peso_piezas_preparadas || 0,
                          ) +
                          Number(
                            preparacionesDetalle.find(
                              (p) =>
                                String(p.codigo_producto) === String(item.Producto?.codigo_interno),
                            )?.peso_fracciones_preparadas || 0,
                          )
                        ).toFixed(3)
                      }}
                      kg
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="preparacionesDetalle.length > 0">
                <tr
                  style="border-top: 2px solid var(--bevel-dark); background: var(--bg-secondary)"
                >
                  <td colspan="2" class="fw-bold text-sm" style="padding: 0.4rem 0.5rem">
                    TOTAL DESPACHO
                  </td>
                  <td class="text-right fw-bold text-blue" style="padding: 0.4rem 0.5rem">
                    {{
                      preparacionesDetalle
                        .reduce((acc, p) => acc + Number(p.peso_piezas_preparadas || 0), 0)
                        .toFixed(3)
                    }}
                    kg
                  </td>
                  <td class="text-right fw-bold text-blue" style="padding: 0.4rem 0.5rem">
                    {{
                      preparacionesDetalle
                        .reduce((acc, p) => acc + Number(p.peso_fracciones_preparadas || 0), 0)
                        .toFixed(3)
                    }}
                    kg
                  </td>
                  <td
                    class="text-right fw-bold"
                    style="color: var(--accent-primary); padding: 0.4rem 0.5rem"
                  >
                    {{
                      preparacionesDetalle.reduce(
                        (acc, p) => acc + Number(p.cantidad_bolsitas_preparadas || 0),
                        0,
                      )
                    }}
                    unid.
                  </td>
                  <td
                    class="text-right fw-bold"
                    style="color: var(--accent-success); padding: 0.4rem 0.5rem"
                  >
                    {{
                      preparacionesDetalle
                        .reduce(
                          (acc, p) =>
                            acc +
                            Number(p.peso_piezas_preparadas || 0) +
                            Number(p.peso_fracciones_preparadas || 0),
                          0,
                        )
                        .toFixed(3)
                    }}
                    kg
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- ===== Sub-vista: LISTADO ===== -->
      <div v-else>
        <div class="card no-padding-mobile">
          <div class="table-container">
            <table class="responsive-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Sucursal</th>
                  <th class="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in pedidosFiltrados"
                  :key="p.id_pedido"
                  @click="verDetalle(p)"
                  style="cursor: pointer"
                >
                  <td class="text-sm text-muted">{{ p.fecha_pedido?.split('T')[0] || '-' }}</td>
                  <td class="fw-bold">{{ p.Sucursal?.nombre }}</td>
                  <td class="text-center">
                    <span class="badge text-xs" :class="estadoColor(p.estado)">{{ p.estado }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- VISTA: CARGAR EXCEL -->
    <div v-if="activeTab === 'importar'" class="import-view">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Cargar Pedidos desde Excel</h3>
        </div>
        <div class="p-4">
          <!-- Mensaje -->
          <div
            v-if="mensaje.texto"
            class="alert-box"
            :class="mensaje.tipo"
            style="margin-bottom: 0.5rem"
          >
            {{ mensaje.texto }}
          </div>

          <!-- Advertencia -->
          <div class="alert-box warning" style="margin-bottom: 0.6rem">
            ⚠ Al cargar un nuevo Excel, se BORRARÁN todos los pedidos e items existentes en la base
            de datos y se reemplazarán por los del archivo.
          </div>

          <!-- Selector de archivo -->
          <div class="form-group">
            <label class="form-label">Archivo Excel (.xlsx)</label>
            <input
              id="excel-input"
              type="file"
              accept=".xlsx,.xls"
              class="form-control file-input"
              @change="onFileChange"
            />
          </div>

          <p v-if="archivoExcel" class="file-name">
            Archivo seleccionado: <strong>{{ archivoExcel.name }}</strong> ({{
              (archivoExcel.size / 1024).toFixed(1)
            }}
            KB)
          </p>

          <!-- Botón subir -->
          <button
            class="btn btn-primary"
            style="margin-top: 0.5rem"
            @click="subir_excel"
            :disabled="!archivoExcel || isUploading"
          >
            {{ isUploading ? 'Procesando...' : 'Subir y Procesar Excel' }}
          </button>

          <!-- Resultado -->
          <div v-if="uploadResult" class="result-box">
            <div class="result-title">Resultado del procesamiento:</div>
            <table class="result-table">
              <tr>
                <td>Pedidos creados</td>
                <td class="text-right fw-bold text-blue">{{ uploadResult.pedidos_creados }}</td>
              </tr>
              <tr>
                <td>Items creados</td>
                <td class="text-right fw-bold text-blue">{{ uploadResult.items_creados }}</td>
              </tr>
              <tr>
                <td>Items ignorados (SKU no encontrado)</td>
                <td
                  class="text-right fw-bold"
                  :class="
                    uploadResult.items_ignorados_sku_no_encontrado > 0 ? 'text-red' : 'text-muted'
                  "
                >
                  {{ uploadResult.items_ignorados_sku_no_encontrado }}
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE PICKING (OPTIMIZADO MÓVIL) -->
    <div v-if="showModalPicking && pedidoEnPicking" class="modal-overlay-fullscreen">
      <div class="picking-container">
        <div class="picking-header">
          <button @click="showModalPicking = false" class="back-btn">
            <i class="ph ph-arrow-left"></i>
          </button>
          <div class="header-info">
            <h3>Preparando #{{ pedidoEnPicking.id_pedido.split('-')[1] }}</h3>
            <p>{{ pedidoEnPicking.Sucursal?.nombre }}</p>
          </div>
        </div>

        <div class="picking-body">
          <div
            v-for="(item, idx) in itemsPicking"
            :key="idx"
            class="picking-item-card"
            :class="{ done: item.registrado }"
          >
            <div class="item-main">
              <div class="item-name">{{ item.Producto?.descripcion }}</div>
              <div class="item-qty">{{ item.cantidad }} {{ item.Producto?.unidad }}</div>
            </div>

            <div class="item-inputs" v-if="!item.registrado">
              <div class="weight-grid">
                <div v-for="n in item.cantidad" :key="n" class="weight-input-group">
                  <label>Pesa {{ n }}</label>
                  <input type="number" step="0.01" class="form-control" placeholder="0.00" />
                </div>
              </div>
              <button class="btn btn-success w-full mt-3" @click="item.registrado = true">
                <i class="ph ph-check"></i> Confirmar Ítem
              </button>
            </div>

            <div class="item-status-done" v-else>
              <i class="ph ph-check-circle"></i> LISTO
              <button class="btn-text" @click="item.registrado = false">Editar</button>
            </div>
          </div>
        </div>

        <div class="picking-footer">
          <button class="btn btn-primary w-full btn-lg" @click="showModalPicking = false">
            Finalizar Pedido
          </button>
        </div>
      </div>
    </div>
    <!-- MODAL ITEM PREPARACION — Teleport to body para evitar overflow:hidden del layout -->
    <Teleport to="body">
      <div v-if="itemModal" class="modal-overlay" @click.self="cerrarModalItem">
        <div class="modal-card animate-slide-in">
          <div class="modal-header">
            <span class="modal-title">{{ (itemModal.Producto?.descripcion || '').slice(5) }}</span>
            <button class="icon-btn" @click="cerrarModalItem"><i class="ph ph-x"></i></button>
          </div>
          <div class="modal-body">
            <p class="text-xs text-muted" style="margin-bottom: 0.5rem">
              Cód: {{ itemModal.Producto?.codigo_interno }}
            </p>

            <!-- Pestañas estilo Windows Forms -->
            <div class="modal-tabs">
              <button
                class="modal-tab"
                :class="{ active: modalTab === 'piezas' }"
                @click="modalTab = 'piezas'"
              >
                Piezas
              </button>
              <button
                class="modal-tab"
                :class="{ active: modalTab === 'fraccionados' }"
                @click="modalTab = 'fraccionados'"
              >
                Fraccionados
              </button>
            </div>
            <div class="modal-tab-panel">
              <!-- Panel Piezas -->
              <div v-if="modalTab === 'piezas'">
                <div class="prep-field-row">
                  <span class="prep-label">Piezas pedidas</span>
                  <span class="fw-bold text-blue">{{
                    itemModal.cantidad_piezas ?? itemModal.cantidad ?? 0
                  }}</span>
                </div>
                <div class="prep-field-row">
                  <span class="prep-label">Kg piezas enviadas</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    class="prep-modal-input"
                    v-model="modalPesoPiezas"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <!-- Panel Fraccionados -->
              <div v-if="modalTab === 'fraccionados'">
                <div class="prep-field-row">
                  <span class="prep-label">Bolsitas pedidas</span>
                  <span class="fw-bold text-orange">
                    {{
                      (itemModal.cantidad_fraccionado ?? itemModal.cantidad_feteados) != null
                        ? Math.floor(itemModal.cantidad_fraccionado ?? itemModal.cantidad_feteados)
                        : 0
                    }}
                  </span>
                </div>
                <div class="prep-field-row">
                  <span class="prep-label">Kg bolsitas enviadas</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    class="prep-modal-input"
                    v-model="modalPesoBolsitas"
                    placeholder="0.00"
                  />
                </div>
                <div class="prep-field-row">
                  <span class="prep-label">Cantidad de bolsas</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    class="prep-modal-input"
                    v-model="modalCantBolsas"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="cerrarModalItem">Cancelar</button>
            <button class="btn btn-primary" :disabled="isSavingItem" @click="confirmarModalItem">
              {{ isSavingItem ? 'Guardando...' : 'Confirmar ✔' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Tabs */
.tabs-scroll {
  display: flex;
  overflow-x: auto;
  gap: 2px;
  padding-bottom: 0.4rem;
  scrollbar-width: none;
}
.tabs-scroll::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  flex: 0 0 auto;
  padding: 0.3rem 0.75rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  border: none;
  box-shadow: var(--raised-shadow);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.tab-btn.active {
  background: var(--accent-primary);
  color: white;
  box-shadow: var(--inset-shadow);
}

/* Monitor Grid */
.monitor-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 1024px) {
  .monitor-grid {
    flex-direction: row;
  }
  .monitor-col {
    flex: 1;
  }
}

.col-header {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.order-cards {
  display: grid;
  gap: 0.4rem;
}
.order-card {
  background: var(--bg-secondary);
  padding: 0.5rem;
  border: 1px solid var(--bg-tertiary);
  box-shadow: var(--raised-shadow);
  cursor: pointer;
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.2rem;
}
.order-id {
  font-weight: 800;
  color: var(--accent-primary);
  font-size: 0.85rem;
}
.order-date {
  font-size: 0.7rem;
  color: var(--text-muted);
}
.order-suc {
  font-weight: 600;
  font-size: 0.82rem;
  margin-bottom: 0.25rem;
}
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Table details */
.id-cell {
  display: flex;
  flex-direction: column;
}
.row-expanded td {
  background: var(--accent-primary-light) !important;
}
.detail-row td {
  padding: 0 !important;
}
.detail-content {
  padding: 0.5rem;
  background: #e8e5dc;
  border-bottom: 1px solid var(--bg-tertiary);
}
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.item-mini {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  padding: 0.2rem 0;
  border-bottom: 1px dotted var(--bg-tertiary);
}
.detail-actions {
  margin-top: 0.4rem;
}

/* Upload / Importar */
.file-input {
  height: auto;
  padding: 0.3rem;
  font-size: 0.82rem;
}

.file-name {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.3rem;
}

.result-box {
  margin-top: 0.6rem;
  padding: 0.5rem;
  background: var(--accent-primary-light);
  border: 1px solid var(--accent-primary);
  border-left: 4px solid var(--accent-primary);
}

.result-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent-primary);
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}

.result-table {
  width: 100%;
  background: transparent;
  font-size: 0.82rem;
}

.result-table td {
  padding: 0.15rem 0.3rem;
  border: none;
}

/* Fullscreen Picking */
.modal-overlay-fullscreen {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.picking-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.picking-header {
  padding: 0.5rem;
  background: var(--accent-primary);
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.picking-header h3 {
  font-size: 0.85rem;
  font-weight: 700;
}
.picking-header p {
  font-size: 0.72rem;
  opacity: 0.8;
}

.back-btn {
  background: none;
  color: white;
  font-size: 1.2rem;
  border: none;
  cursor: pointer;
}
.picking-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.picking-item-card {
  background: var(--bg-secondary);
  padding: 0.6rem;
  border: 1px solid var(--bg-tertiary);
  box-shadow: var(--raised-shadow);
}

.picking-item-card.done {
  border-color: var(--accent-success);
  opacity: 0.7;
}

.item-main {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.item-name {
  font-weight: 700;
  font-size: 0.85rem;
}
.item-qty {
  color: var(--accent-warning);
  font-weight: 800;
  font-size: 0.85rem;
}

.weight-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}
.weight-input-group label {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-bottom: 0.1rem;
  display: block;
  text-transform: uppercase;
}

.item-status-done {
  color: var(--accent-success);
  font-weight: 800;
  font-size: 0.82rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.btn-text {
  background: none;
  border: none;
  color: var(--accent-primary);
  font-weight: 600;
  font-size: 0.78rem;
  cursor: pointer;
  text-decoration: underline;
}

.picking-footer {
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--bg-tertiary);
}

/* Utilities */
.w-full {
  width: 100%;
  display: flex;
}
.btn-lg {
  height: 44px;
  font-size: 0.9rem;
}
.mt-3 {
  margin-top: 0.5rem;
}
.d-none-mobile {
  display: none;
}
.d-only-mobile {
  display: block;
}
.btn-success {
  background: var(--accent-success);
  color: white;
}

@media (min-width: 768px) {
  .d-none-mobile {
    display: block;
  }
  .d-only-mobile {
    display: none !important;
  }
}

.animate-slide-in {
  animation: fadeIn 0.15s ease-out;
}
.animate-slide-down {
  animation: fadeIn 0.15s ease-out;
}

/* Detalle de pedido */
.back-link {
  background: none;
  border: none;
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  margin-right: 0.5rem;
}

.pedido-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.info-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-value {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.text-orange {
  color: var(--accent-warning);
}

/* Botones de acción */
.accion-bar {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.btn-success {
  background: var(--accent-success);
  color: white;
}
.btn-success:hover {
  background: #1b5e20;
}

/* Badges de estado */
.badge-warning {
  background: var(--accent-warning);
  color: white;
}
.badge-success {
  background: var(--accent-success);
  color: white;
}
.badge-dark {
  background: #444;
  color: white;
}

/* Vista de preparación */
.prep-actions {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
}

/* Progreso */
.prep-progress {
  background: var(--bg-secondary);
  border: 1px solid var(--bg-tertiary);
  padding: 0.4rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  box-shadow: var(--raised-shadow);
}

.prep-prog-text {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
}

.prep-prog-bar {
  height: 6px;
  background: var(--bg-tertiary);
  width: 100%;
}

.prep-prog-fill {
  height: 100%;
  background: var(--accent-success);
  transition: width 0.3s ease;
}

/* Fila confirmada (texto verde) */
.text-done td,
.text-done span,
.text-done i {
  color: #1b5e20 !important;
  font-weight: 700;
}

.prep-info-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.prep-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.prep-label {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.prep-val {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.prep-field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0;
  border-bottom: 1px dotted var(--bg-tertiary);
}

.prep-input {
  width: 90px;
  height: 30px;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
}

.prep-btn-row {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-sm {
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  height: 28px;
}

.result-count {
  font-size: 0.72rem;
  color: var(--text-on-accent);
  opacity: 0.8;
}
</style>
