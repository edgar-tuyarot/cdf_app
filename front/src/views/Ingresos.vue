<template>
  <div class="page-container animate-fade">
    <!-- CABECERA DE LA PÁGINA -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Ingreso de Mercadería</h2>
        <p class="page-description">Carga de mercadería indexada con bultos y descuento automático de tara por caja vacía.</p>
      </div>

    </div>

    <!-- ALERTAS -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      <div class="alert-icon">
        <i class="ph ph-info" v-if="alert.type === 'info'"></i>
        <i class="ph ph-check-circle" v-if="alert.type === 'success'"></i>
        <i class="ph ph-warning-circle" v-if="alert.type === 'error'"></i>
      </div>
      <div class="alert-message">
        {{ alert.message }}
      </div>
      <button class="alert-close" @click="alert.show = false">
        <i class="ph ph-x"></i>
      </button>
    </div>

    <!-- TARJETA PRINCIPAL DE INGRESO -->
    <div class="card">


      <div class="card-body">
        
        <!-- SELECTOR FUERA DE LA TABLA: PROVEEDOR O SUCURSAL (CON ANCHO ACOTADO) -->
        <div class="header-selector-box mb-4" style="background: var(--bg-window); padding: 0.85rem 1rem; border-radius: 0; border: 1px solid var(--bevel-light);">
          <div v-if="tipoIngreso === 'lote_proveedor'" class="form-group" style="margin: 0;">
            <label class="form-label" style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary);">
            Proveedor:
            </label>
            <div style="position: relative; display: flex; align-items: center; margin-top: 0.25rem; max-width: 180px;">
              <select 
                v-model="selectedProveedorId" 
                class="form-control" 
                style="height: 26px; font-weight: 700; font-size: 0.8rem;"
                :disabled="itemsConfirmados.length > 0"
                @change="onProveedorChange"
              >
                <option 
                  v-for="prov in proveedores" 
                  :key="prov.id" 
                  :value="prov.id"
                >
                  {{prov.nombre}}
                </option>
              </select>
            </div>
          </div>


        </div>

        <!-- GRILLA DINÁMICA DE ARMAADO DE FILAS -->
        <div v-if="selectedProveedorId">
          <div class="table-header-info mb-2" style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="font-size: 0.95rem; font-weight: 700; margin: 0;">
              <i class="ph ph-list-plus text-green"></i> Filas Ingresadas ({{ itemsConfirmados.length }})
            </h4>
          </div>

          <div class="table-container" style="max-height: 550px; overflow-y: auto; border: 1px solid var(--bevel-dark); border-radius: 0;">
            <table class="access-table" style="width: 100%; border-collapse: collapse;">
              <thead style="position: sticky; top: 0; z-index: 20; background: var(--bg-window);">
                <tr>
                  <th style="width: 110px;">Código</th>
                  <th style="min-width: 220px;">Nombre del Producto</th>
                  <th style="width: 75px;" class="text-right">Cajas</th>
                  <th style="width: 140px;" class="text-center">Peso Caja</th>
                  <th style="width: 110px;" class="text-right">Peso Bruto</th>
                  <th style="width: 130px;" class="text-center">Vencimiento</th>
                  <th style="width: 110px;" class="text-right">Peso Neto</th>
                  <th style="width: 90px;" class="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                <!-- FILAS CONFIRMADAS EN LA GRILLA -->
                <tr 
                  v-for="(item, idx) in itemsConfirmados" 
                  :key="item.id"
                  class="confirmed-row"
                  style="background-color: var(--bg-secondary);"
                >
                  <td style="font-weight: 800; font-family: monospace; color: var(--text-primary);">
                    {{ item.codigo }}
                  </td>
                  <td>
                    <div style="font-weight: 700; font-size: 0.85rem;">{{ item.nombre }}</div>
                  </td>
                  <td class="text-right fw-bold">{{ item.cajas }}</td>
                  <td class="text-center fw-bold" style="color: var(--accent-error);">
                    {{ ((item.cajas || 0) * (item.tara_unidad || 0)).toFixed(3) }} kg
                  </td>
                  <td class="text-right fw-bold text-muted">
                    {{ parseFloat(item.peso_bruto).toFixed(3) }} kg
                  </td>
                  <td class="text-center">
                    <span class="badge-date">{{ item.vencimiento }}</span>
                  </td>
                  <td class="text-right fw-bold text-green">
                    {{ parseFloat(item.peso_neto).toFixed(3) }} kg
                  </td>
                  <td class="text-center">
                    <button class="btn-icon text-red" title="Eliminar fila" @click="eliminarFilaConfirmada(idx)">
                      <i class="ph ph-trash"></i>
                    </button>
                  </td>
                </tr>

                <!-- FILA ACTIVA BORRADOR (SE EDITA Y SE CONFIRMA CON ENTER) -->
                <tr class="active-draft-row" style="background-color: #ffffff; border-top: 2px solid var(--accent-primary);">
                  <!-- Código -->
                  <td style="padding: 4px;">
                    <input 
                      type="text" 
                      ref="codigoInputRef"
                      v-model="draftRow.codigo" 
                      list="grid-productos-list"
                      @input="onDraftCodigoInput"
                      @keydown.enter.prevent="onCodigoEnter"
                      class="grid-input font-mono" 
                      placeholder="Código..."
                      style="width: 100%; font-weight: 700;"
                    />
                    <datalist id="grid-productos-list">
                      <option 
                        v-for="p in productosFiltrados" 
                        :key="p.codigo" 
                        :value="p.codigo"
                      >
                        {{ p.nombre }}
                      </option>
                    </datalist>
                  </td>

                  <!-- Nombre del Producto -->
                  <td style="padding: 4px; vertical-align: middle;">
                    <div v-if="draftSelectedProduct">
                      <span class="fw-bold" style="font-size: 0.85rem; color: var(--text-primary);">
                        {{ draftSelectedProduct.nombre }}
                      </span>
                    </div>
                    <span v-else class="text-xs text-muted" style="font-style: italic;">
                      Ingrese un código de producto...
                    </span>
                  </td>

                  <!-- Cajas -->
                  <td style="padding: 4px;">
                    <input 
                      type="number" 
                      min="0" 
                      ref="cajasInputRef"
                      v-model.number="draftRow.cajas" 
                      @input="onDraftCajasInput"
                      @keydown.enter.prevent="onCajasEnter"
                      class="grid-input text-right fw-bold" 
                      style="width: 100%;"
                    />
                  </td>

                  <!-- Peso Caja (Solamente el peso de la caja vacía multiplicado por la cantidad, o el botón para agregar una) -->
                  <td style="padding: 4px; text-align: center; vertical-align: middle;">
                    <template v-if="draftSelectedProduct">
                      <!-- Si el producto TIENE bulto relacionado -->
                      <div v-if="draftBultoList.length > 0" class="fw-bold" style="font-size: 0.85rem; color: var(--accent-error);">
                        {{ ((draftRow.cajas || 0) * (draftSelectedBulto?.peso_caja_vacia || 0)).toFixed(3) }} kg
                      </div>

                      <!-- Si el producto NO TIENE bulto relacionado -->
                      <div v-else>
                        <button 
                          type="button" 
                          class="btn btn-sm" 
                          style="background: #2563eb; color: white; border: none; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.5rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.25rem;"
                          @click="abrirCrearBultoInline"
                        >
                          <i class="ph ph-plus-circle"></i> + Agregar Bulto
                        </button>
                      </div>
                    </template>
                    <span v-else class="text-xs text-muted">-</span>
                  </td>

                  <!-- Peso Bruto -->
                  <td style="padding: 4px;">
                    <input 
                      type="number" 
                      step="0.001" 
                      min="0" 
                      ref="pesoInputRef"
                      v-model.number="draftRow.peso" 
                      @input="onDraftPesoInput"
                      @keydown.enter.prevent="onPesoEnter"
                      class="grid-input text-right fw-bold text-muted" 
                      placeholder="0.000"
                      style="width: 100%;"
                    />
                  </td>

                  <!-- Vencimiento -->
                  <td style="padding: 4px;">
                    <input 
                      type="date" 
                      ref="vencimientoInputRef"
                      v-model="draftRow.vencimiento" 
                      @keydown.enter.prevent="confirmarFilaDraft"
                      class="grid-input" 
                      style="width: 100%; font-size: 0.82rem;"
                    />
                  </td>

                  <!-- Peso Neto Calculado (Descuento Tara) -->
                  <td style="padding: 4px; vertical-align: middle;" class="text-right fw-bold text-green">
                    {{ draftPesoNetoCalculado.toFixed(3) }} kg
                  </td>

                  <!-- Acción Confirmar -->
                  <td class="text-center" style="padding: 4px;">
                    <button 
                      class="btn btn-sm btn-primary" 
                      style="padding: 0.35rem 0.5rem; font-size: 0.78rem; font-weight: 700; width: 100%;"
                      @click="confirmarFilaDraft"
                      title="Confirmar Fila (Enter)"
                    >
                      <i class="ph ph-plus"></i> Agregar
                    </button>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          <!-- BARRA INFERIOR DE TOTALES Y BOTÓN DE FINALIZAR LOTE -->
          <div 
            v-if="itemsConfirmados.length > 0" 
            class="summary-footer-bar mt-3 animate-fade"
            style="display: flex; justify-content: space-between; align-items: center; background: var(--text-primary); color: white; padding: 0.85rem 1.25rem; border-radius: 0;"
          >
            <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
              <div>
                <span class="text-xs text-muted" style="display: block;">FILAS CARGADAS</span>
                <strong style="font-size: 1.1rem;">{{ itemsConfirmados.length }} Filas</strong>
              </div>
              <div style="border-left: 1px solid rgba(255,255,255,0.2); padding-left: 1.5rem;">
                <span class="text-xs text-muted" style="display: block;">TOTAL CAJAS</span>
                <strong style="font-size: 1.1rem; color: #6ee7b7;">{{ totalCajasConfirmadas }} Cajas</strong>
              </div>
              <div style="border-left: 1px solid rgba(255,255,255,0.2); padding-left: 1.5rem;">
                <span class="text-xs text-muted" style="display: block;">TOTAL PIEZAS</span>
                <strong style="font-size: 1.1rem; color: #93c5fd;">{{ totalPiezasConfirmadas }} Piezas</strong>
              </div>
              <div style="border-left: 1px solid rgba(255,255,255,0.2); padding-left: 1.5rem;">
                <span class="text-xs text-muted" style="display: block;">PESO NETO A INVENTARIAR</span>
                <strong style="font-size: 1.1rem; color: #fde047;">{{ totalPesoNetoConfirmado.toFixed(3) }} kg</strong>
              </div>
            </div>

            <button 
              class="btn btn-success btn-lg" 
              style="font-weight: 800; font-size: 1rem; padding: 0.6rem 1.4rem;"
              @click="abrirModalFinalizar"
            >
              <i class="ph ph-check-square me-1"></i> Finalizar e Ingresar Stock
            </button>
          </div>

        </div>

        <!-- MENSAJE INICIAL SI NO HA SELECCIONADO PROVEEDOR -->
        <div v-else class="empty-state p-5 text-center">
          <i class="ph ph-handshake icon-xl text-muted mb-2" style="font-size: 2.5rem;"></i>
          <h4 style="font-weight: 700;">Seleccione un Proveedor para habilitar la Grilla de Ingreso</h4>
          <p class="text-muted">Elija la marca en el selector para comenzar a cargar productos en la tabla.</p>
        </div>

      </div>
    </div>



    <!-- MODAL CREAR BULTO INLINE (SIN SALIR DEL MENÚ DE INGRESO) -->
    <Teleport to="body">
      <div v-if="showCreateBultoModal" class="modal-overlay" @mousedown.self="showCreateBultoModal = false">
        <div class="modal-card" style="max-width: 500px;">
          <div class="modal-header" style="background-color: var(--accent-info);">
            <h3 class="modal-title" style="color: white; font-weight: bold;">
              <i class="ph ph-package me-1"></i> Nuevo Formato de Bulto / Caja
            </h3>
            <button class="icon-btn" style="color: white;" @click="showCreateBultoModal = false"><i class="ph ph-x"></i></button>
          </div>

          <form @submit.prevent="submitCrearBultoInline">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 0.85rem;">
              
              <div class="info-badge p-2 mb-2" style="background: var(--accent-info-light); border-radius: 0; font-size: 0.82rem;">
                Configurando bulto para <strong>{{ newBultoForm.codigo_producto }}</strong> con proveedor <strong>{{ getProveedorNombre(newBultoForm.id_proveedor) }}</strong>.
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight: 700;">Nombre del Formato de Bulto *</label>
                <input 
                  type="text" 
                  v-model="newBultoForm.nombre" 
                  class="form-control" 
                  placeholder="Ej: Caja x 12 piezas, Bulto Primario..." 
                  required 
                />
              </div>

              <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700;">Piezas por Caja *</label>
                  <input 
                    type="number" 
                    min="1" 
                    v-model.number="newBultoForm.cantidad_piezas" 
                    class="form-control fw-bold" 
                    required 
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" style="font-weight: 700;">Peso Estimado Caja Llena (kg)</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    min="0" 
                    v-model.number="newBultoForm.peso_caja" 
                    class="form-control" 
                    placeholder="0.000" 
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--accent-danger);">Peso Caja Vacía / Tara a Descontar (kg) *</label>
                <input 
                  type="number" 
                  step="0.001" 
                  min="0" 
                  v-model.number="newBultoForm.peso_caja_vacia" 
                  class="form-control fw-bold text-red" 
                  placeholder="0.450" 
                  required 
                />
                <span class="text-xs text-muted mt-1" style="display: block;">
                  Este peso se descontará automáticamente de la balanza por cada caja ingresada.
                </span>
              </div>

            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showCreateBultoModal = false">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submittingBulto">
                <i class="ph ph-spinner spinner" v-if="submittingBulto"></i>
                <i class="ph ph-floppy-disk" v-else></i>
                Guardar Formato Bulto
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL FINALIZAR INGRESO (CON N° DE FACTURA Y AGRUPACIÓN DE CÓDIGOS REPETIDOS) -->
    <Teleport to="body">
      <div v-if="showFinishModal" class="modal-overlay" @mousedown.self="showFinishModal = false">
        <div class="modal-card" style="max-width: 650px;">
          <div class="modal-header" style="background-color: var(--accent-success);">
            <h3 class="modal-title" style="color: white; font-weight: bold;">
              <i class="ph ph-check-square me-1"></i> Confirmar Ingreso de Mercadería (Factura)
            </h3>
            <button class="icon-btn" style="color: white;" @click="showFinishModal = false"><i class="ph ph-x"></i></button>
          </div>

          <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
            
            <div class="summary-card p-3" style="background: var(--bg-secondary); border-radius: 0; border: 1px solid var(--bevel-light);">
              <div><strong>Proveedor:</strong> {{ getProveedorNombre(selectedProveedorId) }}</div>
              <div><strong>Lote Consolidado:</strong> {{ itemsAgrupados.length }} productos únicos (de {{ itemsConfirmados.length }} filas cargadas)</div>
              <div><strong>Piezas Totales:</strong> {{ totalPiezasConfirmadas }} pzs</div>
              <div><strong>Peso Neto Total:</strong> {{ totalPesoNetoConfirmado.toFixed(3) }} kg</div>
            </div>

            <!-- TABLA CONSOLIDADA (CÓDIGOS REPETIDOS AGRUPADOS) -->
            <div class="table-container" style="max-height: 220px; overflow-y: auto; border: 1px solid var(--bevel-dark);">
              <table class="access-table" style="width: 100%;">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th class="text-right">Cajas</th>
                    <th class="text-right">Piezas</th>
                    <th class="text-right">Peso Neto Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in itemsAgrupados" :key="item.codigo">
                    <td><strong>{{ item.codigo }}</strong></td>
                    <td>{{ item.nombre }}</td>
                    <td class="text-right fw-bold">{{ item.cajas }}</td>
                    <td class="text-right fw-bold text-blue">{{ item.piezas }}</td>
                    <td class="text-right fw-bold text-green">{{ parseFloat(item.peso_neto).toFixed(3) }} kg</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- NÚMERO DE FACTURA / REMITO -->
            <div v-if="tipoIngreso === 'lote_proveedor'" class="form-group">
              <label class="form-label" style="font-weight: 700;">Número de Factura / Remito *</label>
              <input 
                type="text" 
                ref="invoiceInputRef"
                v-model="nroFactura" 
                class="form-control fw-bold" 
                placeholder="Ej: F-0001-0004512" 
                required 
              />
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showFinishModal = false">
              Volver a la Grilla
            </button>
            <button class="btn btn-primary" @click="submitBatchIngreso" :disabled="submittingBatch">
              <i class="ph ph-spinner spinner" v-if="submittingBatch"></i>
              <i class="ph ph-floppy-disk" v-else></i>
              {{ submittingBatch ? 'Guardando en BD...' : 'Confirmar e Ingresar a BD' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// Control de Pestañas Principales y Historial
const activeTab = ref('cargar') // 'cargar' | 'historial'
const historialIngresos = ref([])
const searchHistorialQuery = ref('')
const filterOrigenHistorial = ref('ALL') // 'ALL' | 'PROVEEDOR' | 'SUCURSAL'

// Datos maestros
const proveedores = ref([])
const productos = ref([])
const bultos = ref([])
const sucursales = ref([])

const loadingData = ref(false)
const submittingBatch = ref(false)
const submittingBulto = ref(false)

// Configuración de Ingreso
const tipoIngreso = ref('lote_proveedor')
const selectedProveedorId = ref('')
const selectedSucursalId = ref('')

// Filas ya confirmadas en la grilla
const itemsConfirmados = ref([])

// Fecha de Vencimiento
const getTodayString = () => new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
const lastVencimiento = ref(getTodayString())

// Fila Borrador Activa (La que se edita en la parte inferior de la tabla)
const defaultDraftRow = () => ({
  id: null,
  codigo: '',
  bulto_id: '',
  cajas: 1,
  piezas: 1,
  vencimiento: lastVencimiento.value,
  peso: 0
})

const draftRow = ref(defaultDraftRow())

// Modal Inline Crear Bulto
const showCreateBultoModal = ref(false)
const newBultoForm = ref({
  nombre: '',
  codigo_producto: '',
  id_proveedor: '',
  peso_caja: 0,
  peso_caja_vacia: 0,
  cantidad_piezas: 1
})

// Referencias a inputs
const codigoInputRef = ref(null)
const cajasInputRef = ref(null)
const piezasInputRef = ref(null)
const vencimientoInputRef = ref(null)
const pesoInputRef = ref(null)
const invoiceInputRef = ref(null)

// Modal Finalizar
const showFinishModal = ref(false)
const nroFactura = ref('')

// Alertas
const alert = ref({ show: false, message: '', type: 'success' })
const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3500)
}

// Cargar Datos Iniciales y Historial
const fetchInitialData = async () => {
  loadingData.value = true
  try {
    const [resProv, resProd, resBultos, resSuc, resHistProv, resHistSuc] = await Promise.all([
      fetch('/api/proveedores'),
      fetch('/api/productos'),
      fetch('/api/bultos'),
      fetch('/api/sucursales'),
      fetch('/api/productos/ingresos-proveedores'),
      fetch('/api/ingreso-sucursales')
    ])

    if (resProv.ok) proveedores.value = await resProv.json()
    if (resProd.ok) productos.value = await resProd.json()
    if (resBultos.ok) bultos.value = await resBultos.json()
    if (resSuc.ok) sucursales.value = await resSuc.json()

    let itemsProv = []
    let itemsSuc = []
    if (resHistProv.ok) itemsProv = await resHistProv.json()
    if (resHistSuc.ok) itemsSuc = await resHistSuc.json()

    // Normalizar ingresos de proveedores
    const mappedProv = itemsProv.map(i => ({
      id: `prov-${i.id}`,
      originalId: i.id,
      origenTipo: 'PROVEEDOR',
      origenNombre: i.Proveedor ? i.Proveedor.nombre : 'Proveedor s/d',
      factura: i.nro_factura || 'Sin comprobante',
      codigo_producto: i.codigo_producto || (i.Producto ? i.Producto.codigo : '-'),
      producto_nombre: i.Producto ? i.Producto.nombre : 'Producto s/d',
      bulto_nombre: i.Bulto ? i.Bulto.nombre : (i.cantidad_bultos ? `${i.cantidad_bultos} bulto(s)` : 'Piezas sueltas'),
      cajas: i.cantidad_bultos || 0,
      piezas: i.piezas || 0,
      peso: parseFloat(i.peso_calculado || 0),
      vencimiento: i.vencimiento || '-',
      fecha: i.fecha || i.createdAt
    }))

    // Normalizar ingresos de sucursales
    const mappedSuc = itemsSuc.map(i => ({
      id: `suc-${i.id}`,
      originalId: i.id,
      origenTipo: 'SUCURSAL',
      origenNombre: i.Sucursal ? `${i.Sucursal.sucursal}` : 'Sucursal s/d',
      factura: 'Traspaso/Devolución',
      codigo_producto: i.codigo_producto || (i.Producto ? i.Producto.codigo : '-'),
      producto_nombre: i.Producto ? i.Producto.nombre : 'Producto s/d',
      bulto_nombre: 'Piezas sueltas',
      cajas: 0,
      piezas: i.piezas || 0,
      peso: parseFloat(i.peso || 0),
      vencimiento: i.vencimiento || '-',
      fecha: i.fecha || i.createdAt
    }))

    // Combinar y ordenar desc por fecha
    historialIngresos.value = [...mappedProv, ...mappedSuc].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  } catch (error) {
    console.error('Error fetching initial data:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loadingData.value = false
  }
}

// Filtros y Métricas del Historial
const historialFiltrado = computed(() => {
  let list = historialIngresos.value

  if (filterOrigenHistorial.value !== 'ALL') {
    list = list.filter(i => i.origenTipo === filterOrigenHistorial.value)
  }

  const query = searchHistorialQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter(i => 
      (i.producto_nombre && i.producto_nombre.toLowerCase().includes(query)) ||
      (i.codigo_producto && i.codigo_producto.toLowerCase().includes(query)) ||
      (i.factura && i.factura.toLowerCase().includes(query)) ||
      (i.origenNombre && i.origenNombre.toLowerCase().includes(query)) ||
      (i.bulto_nombre && i.bulto_nombre.toLowerCase().includes(query))
    )
  }

  return list
})

const historialStats = computed(() => {
  const list = historialFiltrado.value
  const totalRegistros = list.length
  const totalCajas = list.reduce((acc, i) => acc + (parseInt(i.cajas, 10) || 0), 0)
  const totalPiezas = list.reduce((acc, i) => acc + (parseInt(i.piezas, 10) || 0), 0)
  const totalKilos = list.reduce((acc, i) => acc + (parseFloat(i.peso) || 0), 0)

  return { totalRegistros, totalCajas, totalPiezas, totalKilos }
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return dateStr
  }
}

onMounted(() => {
  fetchInitialData()
})

// Productos del proveedor activo
const productosFiltrados = computed(() => {
  if (!selectedProveedorId.value) return productos.value
  return productos.value.filter(p => p.proveedor_id === selectedProveedorId.value)
})

// Producto seleccionado en el borrador activo
const draftSelectedProduct = computed(() => {
  const code = draftRow.value.codigo.trim()
  if (!code) return null
  return productosFiltrados.value.find(p => p.codigo.toLowerCase() === code.toLowerCase())
})

// Bultos del producto y proveedor activo
const draftBultoList = computed(() => {
  if (!draftSelectedProduct.value || !selectedProveedorId.value) return []
  return bultos.value.filter(b => 
    b.codigo_producto === draftSelectedProduct.value.codigo && 
    b.id_proveedor === selectedProveedorId.value && 
    b.activo
  )
})

// Bulto actualmente seleccionado en el borrador (si Cajas >= 1)
const draftSelectedBulto = computed(() => {
  if (draftRow.value.cajas === 0 || !draftRow.value.bulto_id) return null
  return bultos.value.find(b => b.id === parseInt(draftRow.value.bulto_id, 10)) || null
})

// PESO NETO CALCULADO DEL BORRADOR (DESCUENTO DE TARA SI CAJAS >= 1)
const draftPesoNetoCalculado = computed(() => {
  const valPesoBruto = parseFloat(draftRow.value.peso) || 0
  const numCajas = parseInt(draftRow.value.cajas, 10) || 0
  
  if (numCajas === 0 || !draftSelectedBulto.value) {
    // Si Cajas = 0, es modo piezas sueltas sin descuento de tara
    return valPesoBruto
  }

  const taraUnidad = parseFloat(draftSelectedBulto.value.peso_caja_vacia) || 0
  const taraTotal = numCajas * taraUnidad
  return Math.max(0, valPesoBruto - taraTotal)
})

// Al cambiar el código de producto en la fila borrador
const onDraftCodigoInput = () => {
  const prod = draftSelectedProduct.value
  if (prod) {
    const bList = draftBultoList.value
    if (bList.length > 0) {
      draftRow.value.bulto_id = bList[0].id
      draftRow.value.piezas = (draftRow.value.cajas || 1) * bList[0].cantidad_piezas
      if (!draftRow.value.peso || draftRow.value.peso === 0) {
        draftRow.value.peso = parseFloat(bList[0].peso_caja) || 0
      }
    } else {
      draftRow.value.bulto_id = ''
      draftRow.value.piezas = 1
    }
  }
}

// Al cambiar número de cajas en la fila borrador
const onDraftCajasInput = () => {
  const numCajas = parseInt(draftRow.value.cajas, 10) || 0
  if (numCajas === 0) {
    // Modo piezas sueltas
    draftRow.value.bulto_id = ''
  } else if (draftBultoList.value.length > 0) {
    if (!draftRow.value.bulto_id) {
      draftRow.value.bulto_id = draftBultoList.value[0].id
    }
    const b = draftSelectedBulto.value || draftBultoList.value[0]
    draftRow.value.piezas = numCajas * b.cantidad_piezas
    if (!draftRow.value.peso || draftRow.value.peso === 0) {
      draftRow.value.peso = numCajas * (parseFloat(b.peso_caja) || 0)
    }
  }
}

// Al cambiar de bulto en la fila borrador
const onDraftBultoChange = () => {
  const b = draftSelectedBulto.value
  const numCajas = parseInt(draftRow.value.cajas, 10) || 1
  if (b) {
    draftRow.value.piezas = numCajas * b.cantidad_piezas
    if (!draftRow.value.peso || draftRow.value.peso === 0) {
      draftRow.value.peso = numCajas * (parseFloat(b.peso_caja) || 0)
    }
  }
}

// CREAR BULTO INLINE SIN SALIR
const abrirCrearBultoInline = () => {
  if (!draftSelectedProduct.value || !selectedProveedorId.value) {
    showAlert('Seleccione primero un producto de la lista.', 'error')
    return
  }

  newBultoForm.value = {
    nombre: `Caja ${draftSelectedProduct.value.nombre.slice(0, 20)}`,
    codigo_producto: draftSelectedProduct.value.codigo,
    id_proveedor: selectedProveedorId.value,
    peso_caja: draftRow.value.peso || 15.000,
    peso_caja_vacia: 0.450,
    cantidad_piezas: 12
  }
  showCreateBultoModal.value = true
}

const submitCrearBultoInline = async () => {
  if (!newBultoForm.value.nombre || !newBultoForm.value.cantidad_piezas) {
    showAlert('Complete todos los campos requeridos del bulto.', 'error')
    return
  }

  submittingBulto.value = true
  try {
    const res = await fetch('/api/bultos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBultoForm.value)
    })

    const data = await res.json()

    if (res.ok) {
      showAlert('¡Formato de bulto creado exitosamente!', 'success')
      bultos.value.unshift(data)
      draftRow.value.bulto_id = data.id
      onDraftBultoChange()
      showCreateBultoModal.value = false
    } else {
      showAlert(data.error || 'Error al crear el bulto', 'error')
    }
  } catch (error) {
    console.error('Error al crear bulto inline:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    submittingBulto.value = false
  }
}

// AL CAMBIAR PESO (KILOS): CALCULAR AUTOMÁTICAMENTE PIEZAS ESTIMADAS
const onDraftPesoInput = () => {
  const prod = draftSelectedProduct.value
  const pesoVal = parseFloat(draftRow.value.peso) || 0
  const numCajas = parseInt(draftRow.value.cajas, 10) || 0

  if (numCajas > 0 && draftSelectedBulto.value) {
    draftRow.value.piezas = numCajas * draftSelectedBulto.value.cantidad_piezas
    return
  }

  if (prod && pesoVal > 0 && parseFloat(prod.peso_pieza) > 0) {
    const pxp = parseFloat(prod.peso_pieza)
    draftRow.value.piezas = pesoVal < pxp ? 0 : Math.round(pesoVal / pxp)
  } else if (!draftRow.value.piezas || draftRow.value.piezas <= 0) {
    draftRow.value.piezas = 0
  }
}

// NAVEGACIÓN CON TECLADO (ENTER)
const onCodigoEnter = () => {
  if (!draftSelectedProduct.value) {
    showAlert('Código de producto no válido o no pertenece a este proveedor.', 'error')
    return
  }
  pesoInputRef.value?.focus()
}

const onCajasEnter = () => {
  pesoInputRef.value?.focus()
}

const onPiezasEnter = () => {
  pesoInputRef.value?.focus()
}

const onPesoEnter = () => {
  onDraftPesoInput()
  vencimientoInputRef.value?.focus()
}

const onVencimientoEnter = () => {
  confirmarFilaDraft()
}

// CONFIRMAR FILA DRAFT E INGRESAR A LA GRILLA
const confirmarFilaDraft = () => {
  if (!draftSelectedProduct.value) {
    showAlert('Seleccione o ingrese un código de producto válido.', 'error')
    codigoInputRef.value?.focus()
    return
  }

  const valPesoBruto = parseFloat(draftRow.value.peso) || 0
  const valCajas = parseInt(draftRow.value.cajas, 10) || 0

  if (valPesoBruto <= 0) {
    showAlert('Ingrese el peso de la balanza.', 'error')
    pesoInputRef.value?.focus()
    return
  }

  const p = draftSelectedProduct.value
  let valPiezas = parseInt(draftRow.value.piezas, 10) || 0

  if (valPiezas <= 0) {
    if (p && parseFloat(p.peso_pieza) > 0) {
      const pxp = parseFloat(p.peso_pieza)
      valPiezas = valPesoBruto < pxp ? 0 : Math.round(valPesoBruto / pxp)
    } else {
      valPiezas = 0
    }
  }

  if (!draftRow.value.vencimiento) {
    showAlert('Seleccione la fecha de vencimiento.', 'error')
    vencimientoInputRef.value?.focus()
    return
  }

  const b = draftSelectedBulto.value
  const numCajas = valCajas
  const taraUnidad = (numCajas > 0 && b) ? (parseFloat(b.peso_caja_vacia) || 0) : 0
  const valPesoNeto = draftPesoNetoCalculado.value

  // Agregar a items confirmados
  itemsConfirmados.value.push({
    id: Date.now() + Math.random(),
    codigo: p.codigo,
    nombre: p.nombre,
    tipo: numCajas > 0 && b ? 'bulto' : 'unidad',
    bulto_id: numCajas > 0 && b ? b.id : null,
    bulto_nombre: numCajas > 0 && b ? b.nombre : null,
    cajas: numCajas,
    piezas: valPiezas,
    peso_bruto: valPesoBruto,
    peso_neto: valPesoNeto,
    tara_unidad: taraUnidad,
    vencimiento: draftRow.value.vencimiento
  })

  // Retener última fecha de vencimiento ingresada
  lastVencimiento.value = draftRow.value.vencimiento

  // Resetear fila borrador
  draftRow.value = defaultDraftRow()

  // Enfocar nuevamente en el campo código de la nueva fila
  nextTick(() => {
    codigoInputRef.value?.focus()
  })
}

// Eliminar fila confirmada
const eliminarFilaConfirmada = (index) => {
  itemsConfirmados.value.splice(index, 1)
}

// Totales de la Grilla
const totalCajasConfirmadas = computed(() => {
  return itemsConfirmados.value.reduce((acc, i) => acc + i.cajas, 0)
})

const totalPiezasConfirmadas = computed(() => {
  return itemsConfirmados.value.reduce((acc, i) => acc + i.piezas, 0)
})

const totalPesoNetoConfirmado = computed(() => {
  return itemsConfirmados.value.reduce((acc, i) => acc + parseFloat(i.peso_neto || 0), 0)
})

// AGRUPACIÓN Y CONSOLIDACIÓN DE CÓDIGOS REPETIDOS
const itemsAgrupados = computed(() => {
  const map = {}
  for (const item of itemsConfirmados.value) {
    if (!map[item.codigo]) {
      map[item.codigo] = {
        codigo: item.codigo,
        nombre: item.nombre,
        tipo: item.tipo,
        bulto_id: item.bulto_id,
        cajas: 0,
        piezas: 0,
        peso_bruto: 0,
        peso_neto: 0,
        vencimiento: item.vencimiento
      }
    }
    map[item.codigo].cajas += item.cajas
    map[item.codigo].piezas += item.piezas
    map[item.codigo].peso_bruto += parseFloat(item.peso_bruto || 0)
    map[item.codigo].peso_neto += parseFloat(item.peso_neto || 0)
  }
  return Object.values(map)
})

// Abrir modal de finalización
const abrirModalFinalizar = () => {
  if (itemsConfirmados.value.length === 0) {
    showAlert('No hay filas cargadas en la grilla.', 'error')
    return
  }
  nroFactura.value = ''
  showFinishModal.value = true
  nextTick(() => {
    invoiceInputRef.value?.focus()
  })
}

const getProveedorNombre = (id) => {
  const p = proveedores.value.find(prov => prov.id === parseInt(id, 10))
  return p ? p.nombre : 'No seleccionado'
}

const onProveedorChange = () => {
  draftRow.value = defaultDraftRow()
}

// ENVIAR LOTE DEFINITIVO AL BACKEND
const submitBatchIngreso = async () => {
  if (tipoIngreso.value === 'lote_proveedor') {
    if (!selectedProveedorId.value) {
      showAlert('Seleccione un proveedor.', 'error')
      return
    }
    if (!nroFactura.value.trim()) {
      showAlert('El número de factura es obligatorio.', 'error')
      return
    }
  }

  submittingBatch.value = true
  try {
    let payload = {}
    let endpoint = ''

    if (tipoIngreso.value === 'lote_proveedor') {
      endpoint = '/api/productos/ingresar-proveedor-lote'
      payload = {
        proveedor_id: selectedProveedorId.value,
        nro_factura: nroFactura.value.trim(),
        usuario: authStore.user?.nombre || 'Sistema',
        items: itemsConfirmados.value.map(item => ({
          codigo: item.codigo,
          tipo: item.tipo,
          bulto_id: item.bulto_id,
          cantidad_bultos: item.cajas,
          piezas: item.piezas,
          peso: item.peso_neto, // Enviar peso neto (con descuento de tara)
          vencimiento: item.vencimiento
        }))
      }
    } else {
      endpoint = '/api/productos/ingresar-sucursal'
      payload = {
        sucursal_id: selectedSucursalId.value,
        items: itemsConfirmados.value.map(item => ({
          codigo: item.codigo,
          piezas: item.piezas,
          peso: item.peso_neto,
          vencimiento: item.vencimiento
        }))
      }
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const dataRes = await res.json()

    if (res.ok) {
      showAlert(dataRes.mensaje || '¡Ingreso de mercadería registrado exitosamente!', 'success')
      itemsConfirmados.value = []
      showFinishModal.value = false
      selectedProveedorId.value = ''
      draftRow.value = defaultDraftRow()
      await fetchInitialData()
    } else {
      showAlert(dataRes.error || dataRes.mensaje || 'Error al guardar el ingreso', 'error')
    }
  } catch (error) {
    console.error('Error submitting batch:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    submittingBatch.value = false
  }
}
</script>

<style scoped>
.grid-input {
  padding: 0.35rem 0.55rem;
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  font-size: 0.9rem;
  background: #ffffff;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.grid-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.grid-input-sm {
  padding: 0.2rem 0.4rem;
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  background: #f8fafc;
}

.btn-inline-bulto {
  background: var(--accent-info-light);
  color: var(--accent-info);
  border: 1px solid var(--accent-info);
  border-radius: 0;
  padding: 0.15rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: background 0.15s;
}

.btn-inline-bulto:hover {
  background: var(--accent-info);
  color: white;
}

.confirmed-row:hover {
  background-color: var(--bevel-light) !important;
}

.badge-date {
  background: var(--bevel-dark);
  color: white;
  padding: 2px 6px;
  border-radius: 0;
  font-size: 0.78rem;
  font-family: monospace;
}

.badge-tag {
  color: white;
  padding: 2px 7px;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.badge-tag-prov {
  background-color: #2563eb;
}

.badge-tag-suc {
  background-color: #059669;
}

.nav-tabs-container {
  display: flex;
  gap: 0.35rem;
  border-bottom: 2px solid var(--bevel-dark, #cbd5e1);
  padding-left: 0.25rem;
}

.nav-tab-btn {
  background: var(--bg-window, #e2e8f0);
  color: var(--text-secondary, #64748b);
  border: 1px solid var(--bevel-dark, #cbd5e1);
  border-bottom: none;
  border-radius: 0;
  padding: 0.55rem 1.15rem;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  bottom: -2px;
  transition: all 0.15s ease-in-out;
}

.nav-tab-btn:hover {
  background: #f1f5f9;
  color: var(--text-primary, #0f172a);
}

.nav-tab-btn.active {
  background: #ffffff;
  color: var(--accent-primary, #0b5394);
  border-color: var(--accent-primary, #0b5394);
  border-bottom: 2px solid #ffffff;
  font-weight: 800;
  box-shadow: 0 -2px 5px rgba(0,0,0,0.06);
}

.nav-tab-badge {
  background: var(--accent-primary, #0b5394);
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 0;
  font-size: 0.76rem;
  font-weight: 800;
  transition: background 0.15s;
}

.nav-tab-btn.active .nav-tab-badge {
  background: #10b981;
  color: #ffffff;
}
</style>
