<template>
  <div class="page-container animate-fade">
    <!-- Header Principal -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Vencimientos de Productos</h2>
        <p class="page-description">Supervisa los lotes de piezas con vencimientos más cercanos y gestiona el stock crítico.</p>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- VISTA 1: CRONOGRAMA DE VENCIMIENTOS Y AUDITORÍA GUIADA -->
    <div v-if="!auditActive && !showReport">
      
      <!-- Buscador de Vencimientos -->
      <div class="card mb-4">
        <div class="card-header">Buscador de Vencimientos</div>
        <div class="card-body" style="padding: 0.75rem;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Buscar por Producto (Código / Nombre)</label>
            <div style="display: flex; align-items: center; background: var(--bg-window); padding: 0.25rem 0.5rem; border: 1.5px solid var(--bevel-dark);">
              <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); margin-right: 0.4rem; font-size: 1rem;"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Ej: jamón, 1001..." 
                style="border: none; outline: none; background: transparent; width: 100%; color: var(--text-primary); font-size: 0.88rem; font-weight: 600;"
              />
              <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
                <i class="ph ph-x-circle" style="font-size: 1rem;"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Listado de Vencimientos -->
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button 
              v-if="!loading && filteredVencimientos.length > 0"
              class="btn btn-secondary" 
              style="height: 28px; font-size: 0.8rem; display: flex; align-items: center; gap: 0.25rem; padding: 0 0.55rem; background: #1f7244; color: white; border: 1px solid #165230;" 
              @click="exportToExcel"
            >
            Exportar
            </button>
                      <button 
            class="btn btn-primary" 
            @click="iniciarAuditoriaCompleta"
            :disabled="loading"
                          style="height: 28px; font-size: 0.8rem; display: flex; align-items: center; gap: 0.25rem; padding: 0 0.55rem; background: #1f7244; color: white; border: 1px solid #165230;" 

          >
          Auditar
          </button>
          </div>
        </div>
        
        <div class="table-container">
          <table v-if="!loading && filteredVencimientos.length > 0" class="vencimientos-table access-table">
            <thead>
              <tr>
                <!-- Columna 1: Código / Cod. -->
                <th>
                  <span class="d-none-mobile">Código</span>
                  <span class="d-only-mobile">Cod.</span>
                </th>
                
                <!-- Columna 2: Nombre de Producto / Nombre -->
                <th>
                  <span class="d-none-mobile">Nombre de Producto</span>
                  <span class="d-only-mobile">Nombre</span>
                </th>
                
                <!-- Columna 3: Vencimiento / Venc. (dd-mm) -->
                <th class="text-center">
                  <span class="d-none-mobile">Vencimiento</span>
                  <span class="d-only-mobile">Venc.</span>
                </th>
                
                <!-- Columna 4: Días Restantes (Solo Desktop) -->
                <th class="text-center d-none-mobile">Días Restantes</th>
                
                <!-- Columna 5: Piezas / Pzas. -->
                <th class="text-right">
                  <span class="d-none-mobile">Piezas</span>
                  <span class="d-only-mobile">Pzas.</span>
                </th>
                
                <!-- Columnas 6 a 9: Solo Desktop -->
                <th class="text-right d-none-mobile">Peso Unitario</th>
                <th class="text-right d-none-mobile">Kilos Est. Expira</th>
                <th class="text-right d-none-mobile">Stock Kilos Total</th>
                <th class="text-center d-none-mobile">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in filteredVencimientos" :key="v.id">
                <!-- 1. Código -->
                <td><strong>{{ v.codigo_producto }}</strong></td>
                
                <!-- 2. Nombre -->
                <td>{{ v.producto?.nombre || 'Producto Desconocido' }}</td>
                
                <!-- 3. Vencimiento (dd-mm) -->
                <td class="text-center" style="font-family: monospace; font-weight: bold;">
                  {{ formatDateDDMM(v.vencimiento) }}
                </td>
                
                <!-- 4. Días Restantes (Solo Desktop) -->
                <td class="text-center d-none-mobile">
                  <span :class="['days-remaining', getDaysRemaining(v.vencimiento).class]">
                    {{ getDaysRemaining(v.vencimiento).text }}
                  </span>
                </td>
                
                <!-- 5. Piezas -->
                <td class="text-right font-bold" style="font-family: monospace;">
                  {{ v.piezas }}
                </td>
                
                <!-- 6. Peso Unitario (Solo Desktop) -->
                <td class="text-right d-none-mobile" style="color: var(--text-muted);">
                  {{ v.producto?.peso_x_pieza ? `${parseFloat(v.producto.peso_x_pieza).toFixed(3)} kg` : '-' }}
                </td>
                
                <!-- 7. Kilos Est. Expira (Solo Desktop) -->
                <td class="text-right font-bold d-none-mobile" style="color: var(--accent-danger); font-family: monospace;">
                  {{ calcularKilosEst(v).toFixed(3) }} kg
                </td>
                
                <!-- 8. Stock Kilos Total (Solo Desktop) -->
                <td class="text-right d-none-mobile" style="font-family: monospace;">
                  {{ v.producto?.kilos_block ? `${parseFloat(v.producto.kilos_block).toFixed(3)} kg` : '0.000 kg' }}
                </td>
                
                <!-- 9. Estado (Solo Desktop) -->
                <td class="text-center d-none-mobile">
                  <span :class="['status-tag', getDaysRemaining(v.vencimiento).class]">
                    {{ getDaysRemaining(v.vencimiento).label }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Cargando -->
          <div v-if="loading" class="loading-state">
            <i class="ph ph-spinner spinner icon-xl"></i>
            Obteniendo cronograma de vencimientos...
          </div>

          <!-- Vacío -->
          <div v-if="!loading && filteredVencimientos.length === 0" class="empty-state">
            <i class="ph ph-calendar-x icon-xl"></i>
            No se encontraron lotes de vencimiento que coincidan con la búsqueda.
          </div>
        </div>
      </div>
    </div>

    <!-- VISTA 2: AUDITORÍA GUIADA INTEGRADA -->
    <div v-else-if="auditActive" class="animate-fade">
      <!-- Encabezado de Auditoría (Con 'Agregar otro producto' y 'Cancelar auditoría' juntos a la derecha) -->
      <div style="background: white; border: 1.5px solid var(--bevel-dark); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; border-left: 4px solid var(--accent-primary);">
        <!-- Acciones Superiores: "Agregar otro producto" + "Cancelar auditoría" juntas -->
        <div style="display: flex; width: 100%; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; align-items: center;">

        </div>
      </div>

      <!-- Panel Agregar Otro Producto (Modal o Card Flotante Elegante) -->
      <Teleport to="body">
        <div v-if="showAddProductPanel" class="win-dialog-overlay" @mousedown.self="showAddProductPanel = false; productSearchQuery = ''">
          <div class="win-dialog animate-fade" style="max-width: 540px; width: 95vw;">
            <div class="win-dialog-titlebar" style="background: #0f172a; color: white;">
              <span class="win-dialog-titlebar-text" style="font-weight: 800; font-size: 0.95rem; color: white; display: flex; align-items: center; gap: 0.4rem;">
                <i class="ph ph-plus-circle" style="color: var(--accent-primary);"></i> Agregar Producto a Auditoría
              </span>
              <button class="win-dialog-close" style="color: white;" @click="showAddProductPanel = false; productSearchQuery = ''">
                <i class="ph ph-x"></i>
              </button>
            </div>
            
            <div class="win-dialog-body" style="padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
              <label class="form-label" style="font-weight: bold; margin-bottom: 0;">Buscar en Catálogo General</label>
              
              <!-- Buscador con Ícono Integrado -->
              <div style="display: flex; align-items: center; background: white; padding: 0.35rem 0.65rem; border: 2px solid var(--accent-primary); height: 42px;">
                <i class="ph ph-magnifying-glass" style="color: var(--accent-primary); font-size: 1.2rem; margin-right: 0.5rem;"></i>
                <input 
                  type="text" 
                  v-model="productSearchQuery" 
                  placeholder="Escriba código o nombre del producto..." 
                  style="border: none; outline: none; background: transparent; width: 100%; color: var(--text-primary); font-size: 0.92rem; font-weight: 600;"
                  ref="searchInputRef"
                  autofocus
                />
                <button 
                  v-if="productSearchQuery" 
                  @click="productSearchQuery = ''" 
                  style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 0.2rem;"
                >
                  <i class="ph ph-x-circle" style="font-size: 1.1rem;"></i>
                </button>
              </div>

              <!-- Resultados de Búsqueda con Filas Holgadas -->
              <div v-if="catalogueSearchResults.length > 0" class="search-results-list-popup">
                <div 
                  v-for="p in catalogueSearchResults" 
                  :key="p.codigo" 
                  class="search-result-card-row" 
                  @click="agregarProductoAlControl(p)"
                >
                  <div style="display: flex; flex-direction: column; gap: 0.15rem; flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                      <span class="code-badge">{{ p.codigo }}</span>
                      <span style="font-size: 0.88rem; font-weight: bold; color: var(--text-primary);">{{ p.nombre }}</span>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">
                      Peso x pieza: {{ p.peso_x_pieza ? `${p.peso_x_pieza} kg` : 'Sin peso' }}
                    </span>
                  </div>
                  <button type="button" class="btn btn-secondary btn-xs" style="height: 28px; padding: 0 0.55rem; font-size: 0.78rem; font-weight: bold; white-space: nowrap;">
                    <i class="ph ph-plus" style="color: var(--accent-primary);"></i> Añadir
                  </button>
                </div>
              </div>

              <!-- Estado Inicial y Vacío -->
              <div v-else-if="productSearchQuery.trim() === ''" class="text-center text-xs text-muted p-3" style="background: var(--bg-window); border: 1px dashed var(--bevel-dark);">
                <i class="ph ph-magnifying-glass" style="font-size: 1.5rem; display: block; margin-bottom: 0.3rem; color: var(--text-muted);"></i>
                Escriba el código o nombre para buscar productos del catálogo no incluidos aún en la auditoría.
              </div>

              <div v-else class="text-center text-xs text-muted p-3" style="background: var(--bg-window); border: 1px dashed var(--bevel-dark);">
                <i class="ph ph-warning-circle" style="font-size: 1.5rem; display: block; margin-bottom: 0.3rem; color: var(--accent-orange);"></i>
                No se encontraron productos no auditados con el término "{{ productSearchQuery }}".
              </div>
            </div>

            <div class="win-dialog-footer">
              <button class="win-dialog-btn" @click="showAddProductPanel = false; productSearchQuery = ''">Cerrar</button>
            </div>
          </div>
        </div>
      </Teleport>

      <form @submit.prevent="nextStep" style="display: flex; flex-direction: column; gap: 0.7rem;">
        <!-- Card de Información del Producto Actual (Limpia sin el botón secundario) -->
        <div class="card" style="display: flex;align-items: center; padding: 1rem; justify-content: space-around; background: var(--bg-window); border: 2px solid var(--accent-primary);">
          <h3 style="margin: 0.2rem 0; font-size: 1 rem; font-weight: 850; color: var(--text-primary);">
            {{ currentProduct.codigo }} - {{ currentProduct.nombre }}
          </h3>
                      <!-- Botón verde "+" únicamente -->
            <button 
              type="button" 
              class="btn" 
              style="font-size: 0.80rem; width: 30px; height: 15px; padding: 0; background: var(--accent-primary); border-color: var(--accent-primary-hover); color: white; display: inline-flex; align-items: center; justify-content: center;"
              @click="addLote"
              title="Añadir lote"
            >
              +
            </button>
        </div>

        <!-- Tabla de Ajuste de Lotes -->
        <div class="card mb-3" style="padding: 1rem;">
          <div style="font-size: 0.9rem; font-weight: bold; margin-bottom: 0.75rem; color: var(--text-primary); display: flex; justify-content: space-between; align-items: center;">
            

          </div>

          <div class="table-container" style="width: 100%;">
            <table class="access-table" style="width: 100%;">
              <thead>
                <tr>
                  <th style="min-width: 160px;">Fecha Vencimiento *</th>
                  <th style="width: 160px;" class="text-center">Cantidad Piezas *</th>
                  <th style="width: 140px;" class="text-right">Kilos Est. (kg)</th>
                  <th style="width: 80px;" class="text-center">Quitar</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(lote, idx) in auditData[currentProduct.codigo]" :key="idx">
                  <td>
                    <input 
                      type="date" 
                      v-model="lote.vencimiento" 
                      class="form-control" 
                      required 
                      style="height: 36px; font-size: 0.88rem; font-weight: 600;" 
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      v-model.number="lote.piezas" 
                      class="form-control text-center" 
                      required 
                      min="0" 
                      style="height: 36px; font-size: 0.95rem; font-weight: bold;" 
                    />
                  </td>
                  <td class="text-right fw-bold text-green" style="vertical-align: middle; font-family: monospace;">
                    {{ ((lote.piezas || 0) * parseFloat(currentProduct.peso_x_pieza || 0)).toFixed(3) }} kg
                  </td>
                  <td class="text-center">
                    <button 
                      type="button" 
                      class="btn btn-danger" 
                      style="padding: 0.25rem 0.5rem; height: 32px;" 
                      @click="removeLote(idx)"
                    >
                      <i class="ph ph-trash" style="font-size: 1rem;"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="!auditData[currentProduct.codigo] || auditData[currentProduct.codigo].length === 0">
                  <td colspan="4" class="text-center text-muted" style="padding: 1.5rem;">
                    No hay lotes registrados para este producto. Presiona el botón verde "+" para añadir un lote.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Navegación Inferior (Sin el botón 'Cancelar auditoría' redundante) -->
        <div style="display: flex; gap: 0.5rem; justify-content: space-around; align-items: center; flex-wrap: wrap; background: var(--bg-window); padding: 0.85rem; border: 1.5px solid var(--bevel-dark);">
          
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="showAddProductPanel = !showAddProductPanel"
            style="font-size: 0.8rem; height: 34px;"
          >
            Agregar otro producto
          </button>
          
          <button 
            class="btn btn-danger" 
            style="height: 34px; font-size: 0.8rem;" 
            @click="solicitarCancelarAuditoria"
          >
          Cancelar auditoría
          </button>
          
        </div>
                <div style="display: flex; gap: 0.5rem; justify-content: space-around; align-items: center; flex-wrap: wrap; background: var(--bg-window); padding: 0.85rem; border: 1.5px solid var(--bevel-dark);">

          
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="prevStep" 
            :disabled="currentStepIndex === 0"
          >
            <i class="ph ph-arrow-left"></i> Anterior
          </button>

          <button 
            type="button" 
            class="btn btn-secondary" 
            style="background: #14532d; color: white; border-color: #14532d;" 
            @click="finalizarAuditoria"
          >
            Finalizar Asistente
          </button>

          <button 
            type="submit" 
            class="btn btn-primary"
          >
            {{ currentStepIndex < auditList.length - 1 ? 'Siguiente' : 'Finalizar' }} <i class="ph ph-arrow-right"></i>
          </button>
        </div>
      </form>
    </div>

    <!-- VISTA 3: REPORTE CONSOLIDADO DE DIFERENCIAS -->
    
    

    <div v-else-if="showReport" class="card animate-fade" style="width: 100%;">
      <div class="modal-footer" style="padding: 1rem; border-top: 2px solid var(--bevel-dark); display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button 
          class="btn btn-secondary" 
          @click="descartarReporte"
          :disabled="saving"
        >
          Descartar Auditoría
        </button>
        <button 
          v-if="consolidadoReport.length > 0"
          class="btn btn-primary" 
          @click="guardarAuditoriaEnBBDD"
          :disabled="saving"
        >
          <i class="ph ph-spinner spinner" v-if="saving"></i>
          <i class="ph ph-floppy-disk" v-else></i>
          {{ saving ? 'Guardando Ajustes...' : 'Guardar y Aplicar en Base de Datos' }}
        </button>
        <button 
          v-else
          class="btn btn-secondary"
          @click="showReport = false"
        >
          Volver al Listado
        </button>
      </div>
         <table v-if="consolidadoReport.length > 0"  style="width: 100%;" class="access-table">
            <thead>
              <tr>
                <th >Código</th>
                <th>Descripción</th>
                <th >Orig.</th>
                <th >Audit.</th>
                <th >Dif</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in consolidadoReport" :key="item.codigo">
                <td class="font-bold"><strong>{{ item.codigo }}</strong></td>
                <td>{{ item.nombre }}</td>
                <td class="text-center">{{ item.piezasOriginales }}</td>
                <td class="text-center font-bold text-blue">{{ item.piezasAuditadas }}</td>
                <td class="text-center" :class="getDeltaClass(item.deltaPiezas)">
                  {{ item.deltaPiezas > 0 ? '+' : '' }}{{ item.deltaPiezas }}
                </td>

              </tr>
            </tbody>
          </table>

          <div v-else class="empty-state">
            <i class="ph ph-check-circle text-green icon-xl"></i>
            Auditoría completada sin cambios detectados en las piezas o lotes.
          </div>
    </div>

    <!-- MODAL DE CONFIRMACIÓN PARA CANCELAR AUDITORÍA -->
    <Teleport to="body">
      <div v-if="showConfirmCancelModal" class="win-dialog-overlay" @mousedown.self="showConfirmCancelModal = false">
        <div class="win-dialog" style="max-width: 440px;">
          <div class="win-dialog-titlebar">
            <span class="win-dialog-titlebar-text">Cancelar Auditoría</span>
            <button class="win-dialog-close" @click="showConfirmCancelModal = false"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body" style="padding: 1.25rem;">
            <i class="ph ph-warning-circle win-dialog-icon text-red" style="font-size: 2.2rem;"></i>
            <p class="win-dialog-msg" style="margin-top: 0.5rem; line-height: 1.5; font-size: 0.9rem;">
              ¿Estás seguro de que deseas cancelar la auditoría actual?<br><br>Se perderán los recuentos temporales realizados.
            </p>
          </div>
          <div class="win-dialog-footer">
            <button class="win-dialog-btn win-dialog-btn-ok" @click="confirmarCancelarAuditoria">Sí, Cancelar</button>
            <button class="win-dialog-btn" @click="showConfirmCancelModal = false">No, Continuar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'

const vencimientos = ref([])
const productos = ref([])
const loading = ref(true)
const searchQuery = ref('')
const alert = ref({ show: false, message: '', type: 'success' })

// Estado de la Auditoría Guiada
const auditActive = ref(false)
const auditList = ref([])
const currentStepIndex = ref(0)
const auditData = ref({})
const showReport = ref(false)
const saving = ref(false)

const showConfirmCancelModal = ref(false)
const showAddProductPanel = ref(false)
const productSearchQuery = ref('')

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 4000)
}

const fetchVencimientos = async () => {
  loading.value = true
  try {
    const [resVenc, resProd] = await Promise.all([
      fetch('/api/productos/vencimientos-cercanos'),
      fetch('/api/productos')
    ])
    if (resVenc.ok) {
      vencimientos.value = await resVenc.json()
    }
    if (resProd.ok) {
      productos.value = await resProd.json()
    }
  } catch (error) {
    console.error('Error al obtener datos:', error)
  } finally {
    loading.value = false
  }
}

// Productos aptos para auditar (solo los productos que SÍ tienen un código de fraccionado relacionado)
const productosAuditables = computed(() => {
  return productos.value.filter(p => p.codigo_fraccionado && String(p.codigo_fraccionado).trim() !== '')
})

// Productos con vencimientos activos para la auditoría (con fraccionado relacionado)
const productosConVencimientos = computed(() => {
  return productosAuditables.value.filter(p => p.vencimientosList && p.vencimientosList.length > 0)
})

// Iniciar auditoría completa de todos los productos (solo los que tienen código fraccionado)
const iniciarAuditoriaCompleta = () => {
  const list = productosConVencimientos.value.length > 0 ? productosConVencimientos.value : productosAuditables.value
  if (list.length === 0) {
    showAlert('No hay productos con fraccionado relacionado para auditar.', 'error')
    return
  }

  auditList.value = list
  currentStepIndex.value = 0
  
  const data = {}
  list.forEach(p => {
    const vList = p.vencimientosList || []
    data[p.codigo] = vList.map(v => ({
      id: v.id,
      vencimiento: v.vencimiento ? v.vencimiento.split('T')[0] : '',
      piezas: parseInt(v.piezas, 10) || 0
    }))
  })
  
  auditData.value = data
  auditActive.value = true
  showReport.value = false
}

const currentProduct = computed(() => {
  if (auditList.value.length === 0) return null
  return auditList.value[currentStepIndex.value]
})

const catalogueSearchResults = computed(() => {
  const query = productSearchQuery.value.trim().toLowerCase()
  if (!query) return []
  const existingCodes = new Set(auditList.value.map(p => p.codigo))
  return productosAuditables.value.filter(p => 
    !existingCodes.has(p.codigo) && 
    (p.codigo.toLowerCase().includes(query) || p.nombre.toLowerCase().includes(query))
  ).slice(0, 10)
})

const agregarProductoAlControl = (prod) => {
  auditList.value.push(prod)
  auditData.value[prod.codigo] = []
  currentStepIndex.value = auditList.value.length - 1
  productSearchQuery.value = ''
  showAddProductPanel.value = false
  showAlert(`Producto ${prod.codigo} - ${prod.nombre} agregado a la auditoría.`)
}

const addLote = () => {
  const code = currentProduct.value.codigo
  if (!auditData.value[code]) {
    auditData.value[code] = []
  }
  const defDate = new Date()
  defDate.setDate(defDate.getDate() + 30)
  const yyyy = defDate.getFullYear()
  const mm = String(defDate.getMonth() + 1).padStart(2, '0')
  const dd = String(defDate.getDate()).padStart(2, '0')
  
  auditData.value[code].push({
    vencimiento: `${yyyy}-${mm}-${dd}`,
    piezas: 1
  })
}

const removeLote = (index) => {
  const code = currentProduct.value.codigo
  auditData.value[code].splice(index, 1)
}

const nextStep = () => {
  const code = currentProduct.value.codigo
  const lotes = auditData.value[code] || []
  for (const l of lotes) {
    if (!l.vencimiento) {
      showAlert('Todos los lotes agregados deben tener una fecha de vencimiento.', 'error')
      return
    }
    if (l.piezas === null || l.piezas === undefined || l.piezas < 0) {
      showAlert('La cantidad de piezas no puede ser vacía o negativa.', 'error')
      return
    }
  }

  if (currentStepIndex.value < auditList.value.length - 1) {
    currentStepIndex.value++
  } else {
    finalizarAuditoria()
  }
}

const prevStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
  }
}

const finalizarAuditoria = () => {
  auditActive.value = false
  showReport.value = true
  showAlert('Auditoría finalizada. Revisa las diferencias calculadas antes de guardar.')
}

const solicitarCancelarAuditoria = () => {
  showConfirmCancelModal.value = true
}

const confirmarCancelarAuditoria = () => {
  showConfirmCancelModal.value = false
  auditActive.value = false
  auditList.value = []
  auditData.value = {}
  showReport.value = false
}

const consolidadoReport = computed(() => {
  const list = []
  for (const code of Object.keys(auditData.value)) {
    const originalProd = productos.value.find(p => p.codigo === code)
    if (!originalProd) continue

    const originalPieces = (originalProd.vencimientosList || []).reduce((sum, v) => sum + (parseInt(v.piezas, 10) || 0), 0)
    const auditedLotes = auditData.value[code] || []
    const auditedPieces = auditedLotes.reduce((sum, l) => sum + (parseInt(l.piezas, 10) || 0), 0)
    
    const deltaPiezas = auditedPieces - originalPieces
    const pesoXPieza = parseFloat(originalProd.peso_x_pieza) || 0
    const deltaKilos = deltaPiezas * pesoXPieza

    const lotesOriginalesStr = JSON.stringify((originalProd.vencimientosList || []).map(v => ({ date: v.vencimiento.split('T')[0], piezas: v.piezas })).sort((a,b) => a.date.localeCompare(b.date)))
    const lotesAuditadosStr = JSON.stringify(auditedLotes.map(l => ({ date: l.vencimiento, piezas: l.piezas })).sort((a,b) => a.date.localeCompare(b.date)))

    if (deltaPiezas !== 0 || lotesOriginalesStr !== lotesAuditadosStr) {
      list.push({
        codigo: originalProd.codigo,
        nombre: originalProd.nombre,
        piezasOriginales: originalPieces,
        piezasAuditadas: auditedPieces,
        deltaPiezas,
        deltaKilos,
        pesoXPieza,
        lotes: auditedLotes
      })
    }
  }
  return list
})

const guardarAuditoriaEnBBDD = async () => {
  if (consolidadoReport.value.length === 0) {
    showAlert('No se registraron cambios en la auditoría para guardar.', 'error')
    return
  }

  saving.value = true
  try {
    const payload = {
      auditorias: consolidadoReport.value.map(item => ({
        codigo_producto: item.codigo,
        lotes: item.lotes
      }))
    }

    const res = await fetch('/api/productos/control-piezas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      const dataRes = await res.json()
      showAlert(dataRes.mensaje || 'Auditoría guardada y stock ajustado exitosamente.')
      showReport.value = false
      auditData.value = {}
      auditList.value = []
      await fetchVencimientos()
    } else {
      const err = await res.json()
      showAlert(err.error || 'Ocurrió un error al guardar la auditoría.', 'error')
    }
  } catch (error) {
    console.error('Error saving audit:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    saving.value = false
  }
}

const descartarReporte = () => {
  showReport.value = false
  auditData.value = {}
  auditList.value = []
}

// Formateador de fecha dd-mm
const formatDateDDMM = (dateStr) => {
  if (!dateStr) return '-'
  const match = String(dateStr).trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return `${match[3]}-${match[2]}`
  }
  return dateStr
}

const calcularKilosEst = (v) => {
  if (!v) return 0
  const pesoReal = parseFloat(v.peso) || 0
  if (pesoReal > 0) return pesoReal

  const piezas = parseInt(v.piezas, 10) || 0
  const pesoUnidad = parseFloat(v.producto?.peso_x_pieza) || 0
  return piezas * pesoUnidad
}

const getDaysRemaining = (vencimientoDate) => {
  if (!vencimientoDate) return { text: '-', class: 'status-safe', label: 'Seguro', days: 999 }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = new Date(vencimientoDate + 'T00:00:00')
  target.setHours(0, 0, 0, 0)
  
  const diffTime = target - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays)
    return {
      text: `Hace ${absDays} ${absDays === 1 ? 'día' : 'días'}`,
      class: 'status-expired',
      label: 'Vencido',
      days: diffDays
    }
  } else if (diffDays === 0) {
    return {
      text: '¡Vence Hoy!',
      class: 'status-today',
      label: 'Hoy',
      days: diffDays
    }
  } else if (diffDays <= 7) {
    return {
      text: `${diffDays} ${diffDays === 1 ? 'día' : 'días'}`,
      class: 'status-warning',
      label: 'Crítico',
      days: diffDays
    }
  } else if (diffDays <= 30) {
    return {
      text: `${diffDays} días`,
      class: 'status-approaching',
      label: 'Próximo',
      days: diffDays
    }
  } else {
    return {
      text: `${diffDays} días`,
      class: 'status-safe',
      label: 'Seguro',
      days: diffDays
    }
  }
}

const filteredVencimientos = computed(() => {
  let result = [...vencimientos.value]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(v => {
      const codigoMatch = v.codigo_producto ? v.codigo_producto.toLowerCase().includes(query) : false
      const nombreMatch = v.producto?.nombre ? v.producto.nombre.toLowerCase().includes(query) : false
      return codigoMatch || nombreMatch
    })
  }

  return result
})

const formatWeight = (val) => {
  if (val === undefined || val === null) return '0.000 kg'
  const prefix = val > 0 ? '+' : ''
  return `${prefix}${val.toFixed(3)} kg`
}

const getDeltaClass = (val) => {
  if (val > 0) return 'text-green font-bold'
  if (val < 0) return 'text-red font-bold'
  return 'text-muted'
}

const exportToExcel = () => {
  if (filteredVencimientos.value.length === 0) return

  const dataToExport = filteredVencimientos.value.map(v => ({
    'Código Producto': v.codigo_producto,
    'Nombre del Producto': v.producto?.nombre || 'Desconocido',
    'Piezas': parseInt(v.piezas, 10) || 0,
    'Fecha de Vencimiento (dd-mm)': formatDateDDMM(v.vencimiento),
    'Fecha Completa': v.vencimiento,
    'Kilos Est. Expira (kg)': parseFloat(calcularKilosEst(v)).toFixed(3),
    'Estado': getDaysRemaining(v.vencimiento).label
  }))

  const worksheet = XLSX.utils.json_to_sheet(dataToExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vencimientos')

  const maxCodeLen = Math.max(...dataToExport.map(d => String(d['Código Producto']).length), 16)
  const maxNameLen = Math.max(...dataToExport.map(d => String(d['Nombre del Producto']).length), 26)
  worksheet['!cols'] = [
    { wch: maxCodeLen },
    { wch: maxNameLen },
    { wch: 10 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 12 }
  ]

  XLSX.writeFile(workbook, `Vencimientos_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

onMounted(() => {
  fetchVencimientos()
})
</script>

<style scoped>
.font-bold {
  font-weight: 700;
}

.badge-total {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: var(--accent-primary);
  color: white;
  border: 1px solid var(--accent-primary-hover);
  box-shadow: var(--inset-shadow);
  text-transform: uppercase;
  font-weight: bold;
}

.d-none-mobile {
  display: table-cell;
}
.d-only-mobile {
  display: none;
}

@media (max-width: 767px) {
  .d-none-mobile {
    display: none !important;
  }
  .d-only-mobile {
    display: inline-block !important;
  }
}

.days-remaining {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-family: monospace;
  font-weight: bold;
  border-radius: 0;
}

.status-tag {
  display: inline-block;
  padding: 1px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  box-shadow: var(--inset-shadow);
  border-radius: 0;
}

.status-expired {
  background: #ffebe9 !important;
  color: #c9241b !important;
  border: 1px solid #ff8885 !important;
}

.status-today {
  background: #ffe8cc !important;
  color: #d97706 !important;
  border: 1px solid #f59e0b !important;
  animation: pulse-border 1.5s infinite;
}

.status-warning {
  background: #fffbeb !important;
  color: #b45309 !important;
  border: 1px solid #f59e0b !important;
}

.status-approaching {
  background: #eff6ff !important;
  color: #1d4ed8 !important;
  border: 1px solid #3b82f6 !important;
}

.status-safe {
  background: #f0fdf4 !important;
  color: #15803d !important;
  border: 1px solid #22c55e !important;
}

@keyframes pulse-border {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

.search-results-list-popup {
  max-height: 240px;
  overflow-y: auto;
  border: 1.5px solid var(--bevel-dark);
  background: white;
  display: flex;
  flex-direction: column;
}

.search-result-card-row {
  width: 100%;
  padding: 0.65rem 0.85rem;
  background: white;
  border-bottom: 1px solid var(--bevel-dark);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  transition: background-color 0.15s ease;
}

.search-result-card-row:hover {
  background-color: var(--accent-primary-light, #f0f9ff);
}

.search-result-card-row:hover .code-badge {
  background-color: var(--accent-primary);
  color: white;
}

.code-badge {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  background-color: var(--bg-window);
  border: 1px solid var(--bevel-dark);
  font-family: monospace;
  font-weight: 800;
  font-size: 0.78rem;
  color: var(--text-primary);
  border-radius: 0;
}
</style>
