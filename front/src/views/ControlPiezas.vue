<script setup>
import { ref, computed, onMounted } from 'vue'

// Estados principales
const productos = ref([])
const loading = ref(true)
const alert = ref({ show: false, message: '', type: 'success' })

// Estado de la Auditoría Guiada
const auditActive = ref(false)
const auditList = ref([]) // Lista de productos que se van a auditar
const currentStepIndex = ref(0) // Índice del producto actual en la auditoría
const auditData = ref({}) // Mapa de { [codigo_producto]: [lotes] }
const showReport = ref(false) // Muestra el reporte consolidado al finalizar
const saving = ref(false)

// Filtros
const searchQuery = ref('')

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 4000)
}

// Cargar datos iniciales
const fetchProductos = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/productos')
    if (res.ok) {
      productos.value = await res.json()
    } else {
      showAlert('Error al obtener el catálogo de productos', 'error')
    }
  } catch (error) {
    console.error('Error fetching productos:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProductos()
})

// Computed para filtrar productos con vencimientos activos en la tabla principal
const productosConVencimientos = computed(() => {
  return productos.value.filter(p => p.vencimientosList && p.vencimientosList.length > 0)
})

// Filtrar según query de búsqueda
const filteredProductos = computed(() => {
  let result = [...productosConVencimientos.value]
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(p => 
      p.codigo.toLowerCase().includes(q) || 
      p.nombre.toLowerCase().includes(q)
    )
  }
  return result
})

// Obtener el producto actual en la auditoría guiada
const currentProduct = computed(() => {
  if (auditList.value.length === 0) return null
  return auditList.value[currentStepIndex.value]
})

// Iniciar la auditoría guiada para todos los productos
const iniciarAuditoriaCompleta = () => {
  const list = productosConVencimientos.value
  if (list.length === 0) {
    showAlert('No hay productos con vencimientos activos en el stock para auditar.', 'error')
    return
  }

  auditList.value = list
  currentStepIndex.value = 0
  
  // Clonar los vencimientos de cada producto a nuestro estado local de auditoría
  const data = {}
  list.forEach(p => {
    data[p.codigo] = p.vencimientosList.map(v => ({
      id: v.id,
      vencimiento: v.vencimiento ? v.vencimiento.split('T')[0] : '',
      piezas: parseInt(v.piezas, 10) || 0
    }))
  })
  
  auditData.value = data
  auditActive.value = true
  showReport.value = false
}

// Iniciar auditoría individual para un producto específico
const iniciarAuditoriaIndividual = (prod) => {
  auditList.value = [prod]
  currentStepIndex.value = 0
  
  auditData.value = {
    [prod.codigo]: prod.vencimientosList.map(v => ({
      id: v.id,
      vencimiento: v.vencimiento ? v.vencimiento.split('T')[0] : '',
      piezas: parseInt(v.piezas, 10) || 0
    }))
  }
  
  auditActive.value = true
  showReport.value = false
}

// Agregar Producto al Control que no esté en la lista original
const showAddProductPanel = ref(false)
const productSearchQuery = ref('')

const catalogueSearchResults = computed(() => {
  const query = productSearchQuery.value.trim().toLowerCase()
  if (!query) return []
  
  const existingCodes = new Set(auditList.value.map(p => p.codigo))
  
  return productos.value.filter(p => 
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
  showAlert(`Producto ${prod.codigo} - ${prod.nombre} agregado al control.`)
}

// Operaciones en los lotes del producto actual en el asistente
const addLote = () => {
  const code = currentProduct.value.codigo
  if (!auditData.value[code]) {
    auditData.value[code] = []
  }
  // Fecha por defecto: hoy + 30 días
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

// Avanzar en el asistente
const nextStep = () => {
  // Validaciones del paso actual
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

// Retroceder en el asistente (opcional para usabilidad premium)
const prevStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
  }
}

const finalizarAuditoria = () => {
  auditActive.value = false
  showReport.value = true
  showAlert('Asistente finalizado. Por favor, revise el reporte de diferencias antes de guardar.')
}

const cancelarAuditoria = () => {
  if (confirm('¿Estás seguro de que deseas cancelar la auditoría actual? Se perderán los ajustes temporales.')) {
    auditActive.value = false
    auditList.value = []
    auditData.value = {}
    showReport.value = false
  }
}

// Reporte de diferencias acumuladas
const consolidadoReport = computed(() => {
  const list = []
  
  // Recorremos los productos auditados
  for (const code of Object.keys(auditData.value)) {
    const originalProd = productos.value.find(p => p.codigo === code)
    if (!originalProd) continue

    const originalPieces = originalProd.vencimientosList.reduce((sum, v) => sum + (parseInt(v.piezas, 10) || 0), 0)
    const auditedLotes = auditData.value[code] || []
    const auditedPieces = auditedLotes.reduce((sum, l) => sum + (parseInt(l.piezas, 10) || 0), 0)
    
    const deltaPiezas = auditedPieces - originalPieces
    const pesoXPieza = parseFloat(originalProd.peso_x_pieza) || 0
    const deltaKilos = deltaPiezas * pesoXPieza

    // Solo incluimos en el reporte aquellos que tuvieron cambios reales
    const lotesOriginalesStr = JSON.stringify(originalProd.vencimientosList.map(v => ({ date: v.vencimiento.split('T')[0], piezas: v.piezas })).sort((a,b) => a.date.localeCompare(b.date)))
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

// Enviar auditoría consolidada al backend
const guardarAuditoriaEnBBDD = async () => {
  if (consolidadoReport.value.length === 0) {
    showAlert('No se registraron cambios en la auditoría para guardar.', 'error')
    return
  }

  saving.value = true
  try {
    // Formatear payload para el backend
    const payload = {
      auditorias: consolidadoReport.value.map(item => ({
        codigo_producto: item.codigo,
        lotes: item.lotes
      }))
    }

    const res = await fetch('/api/productos/control-piezas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      const dataRes = await res.json()
      showAlert(dataRes.mensaje || 'Auditoría guardada y stock ajustado exitosamente.')
      showReport.value = false
      auditData.value = {}
      auditList.value = []
      await fetchProductos() // Recargar datos frescos del servidor
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
  if (confirm('¿Deseas descartar este reporte y limpiar los ajustes de la auditoría?')) {
    showReport.value = false
    auditData.value = {}
    auditList.value = []
  }
}

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
</script>

<template>
  <div class="control-piezas-container">
    <!-- Encabezado de Página -->
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">Control de Piezas (Auditoría Guiada)</h2>
        <p class="page-description">Realiza el recuento de piezas y vencimientos de forma secuencial y ajusta el stock físico.</p>
      </div>
      <div>
        <button 
          v-if="!auditActive && !showReport"
          class="btn btn-primary animate-pulse" 
          @click="iniciarAuditoriaCompleta"
          :disabled="loading"
        >
          <i class="ph ph-play-circle"></i> Iniciar Auditoría Guiada
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- PANTALLA PRINCIPAL: LISTADO DE PRODUCTOS CON PIEZAS -->
    <div v-if="!auditActive && !showReport" class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="card-title" style="color: white; font-weight: bold;">Productos con Vencimientos Activos</span>
        <div style="position: relative; display: flex; align-items: center; width: 260px;">
          <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            class="form-control" 
            placeholder="Buscar por código o nombre..." 
            style="padding-left: 2rem; height: 32px;"
          />
        </div>
      </div>

      <div class="card-body p-0">
        <!-- Cargando -->
        <div v-if="loading" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando catálogo e inventario...
        </div>

        <!-- Tabla -->
        <table v-else-if="filteredProductos.length > 0">
          <thead>
            <tr>
              <th style="width: 100px;">Código</th>
              <th>Descripción</th>
              <th style="width: 130px; text-align: center;">Total Piezas</th>
              <th>Lotes y Vencimientos Vigentes</th>
              <th style="width: 150px; text-align: center;">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProductos" :key="p.codigo">
              <td class="font-bold">{{ p.codigo }}</td>
              <td>{{ p.nombre }}</td>
              <td style="text-align: center;" class="font-bold text-blue">
                {{ p.vencimientosList.reduce((sum, v) => sum + (parseInt(v.piezas, 10) || 0), 0) }} pcs
              </td>
              <td>
                <div class="flex-lotes-tags">
                  <span 
                    v-for="v in p.vencimientosList" 
                    :key="v.id" 
                    class="lote-tag"
                  >
                    📅 {{ v.vencimiento.split('T')[0] }} ({{ v.piezas }} uds)
                  </span>
                </div>
              </td>
              <td style="text-align: center;">
                <button 
                  class="btn btn-secondary btn-xs" 
                  @click="iniciarAuditoriaIndividual(p)"
                >
                  <i class="ph ph-barcode"></i> Auditar Lotes
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Vacío -->
        <div v-else class="empty-state">
          <i class="ph ph-barcode icon-xl"></i>
          No hay productos con vencimientos activos para mostrar.
        </div>
      </div>
    </div>

    <!-- PANTALLA PRINCIPAL: REPORTE CONSOLIDADO DE DIFERENCIAS -->
    <div v-if="!auditActive && showReport" class="card animate-fade">
      <div class="card-header" style="background-color: var(--accent-success);">
        <span class="card-title" style="color: white; font-weight: bold;">
          Reporte de Auditoría de Piezas y Ajustes Calculados
        </span>
      </div>
      <div class="card-body p-0">
        <div style="padding: 1rem; background-color: var(--bg-secondary); border-bottom: 2px dashed var(--bevel-dark); font-size: 0.85rem; color: var(--text-secondary);">
          📝 A continuación se presentan las variaciones físicas detectadas durante la auditoría. Si confirmas, se actualizarán los lotes correspondientes y se aplicará la diferencia en kilos al stock del depósito (siempre que el producto tenga peso por pieza asignado).
        </div>

        <table v-if="consolidadoReport.length > 0">
          <thead>
            <tr>
              <th style="width: 100px;">Código</th>
              <th>Descripción</th>
              <th style="width: 130px; text-align: center;">Piezas Originales</th>
              <th style="width: 130px; text-align: center;">Piezas Auditadas</th>
              <th style="width: 120px; text-align: center;">Diferencia Piezas</th>
              <th style="width: 160px; text-align: right;">Ajuste Stock Kilos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in consolidadoReport" :key="item.codigo">
              <td class="font-bold">{{ item.codigo }}</td>
              <td>{{ item.nombre }}</td>
              <td style="text-align: center;">{{ item.piezasOriginales }} uds</td>
              <td style="text-align: center;" class="font-bold text-blue">{{ item.piezasAuditadas }} uds</td>
              <td style="text-align: center;" :class="getDeltaClass(item.deltaPiezas)">
                {{ item.deltaPiezas > 0 ? '+' : '' }}{{ item.deltaPiezas }} uds
              </td>
              <td style="text-align: right;" :class="getDeltaClass(item.deltaKilos)">
                {{ item.pesoXPieza > 0 ? formatWeight(item.deltaKilos) : 'N/A (Sin peso x pieza)' }}
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          <i class="ph ph-check-circle text-green icon-xl"></i>
          Auditoría completada sin cambios detectados en las piezas o lotes.
        </div>
      </div>
      
      <div class="modal-footer" style="padding: 1rem; border-top: 2px solid var(--bevel-dark);">
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
    </div>

    <!-- MODAL DEL ASISTENTE: AUDITORÍA GUIADA PASO A PASO -->
    <Teleport to="body">
      <div v-if="auditActive" class="modal-overlay">
        <div class="modal-card-audit">
          <div class="modal-header" style="background-color: var(--accent-orange);">
            <h3 class="modal-title" style="color: white; font-weight: bold;">
              Asistente de Auditoría: Producto {{ currentStepIndex + 1 }} de {{ auditList.length }}
            </h3>
            <button class="icon-btn" style="color: white;" @click="cancelarAuditoria"><i class="ph ph-x"></i></button>
          </div>
          
          <form @submit.prevent="nextStep" style="display: flex; flex-direction: column; overflow: hidden; flex: 1;">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 0.75rem;">
              
              <!-- Info del Producto Actual -->
              <div class="audit-product-card">
                <span class="text-xs text-muted block uppercase font-bold">Auditar Producto:</span>
                <h4 class="font-bold text-lg" style="margin: 0.15rem 0;">{{ currentProduct.codigo }} - {{ currentProduct.nombre }}</h4>
                <div class="flex-lotes-tags mt-1" style="font-size: 0.75rem;">
                  <span>⚖️ Peso x pieza: <strong>{{ currentProduct.peso_x_pieza ? currentProduct.peso_x_pieza + ' kg' : 'Sin peso' }}</strong></span>
                </div>
              </div>

              <!-- Buscador/Añadidor de Productos al Vuelo -->
              <div class="add-product-container">
                <div v-if="!showAddProductPanel" style="display: flex; justify-content: flex-end;">
                  <button 
                    type="button" 
                    class="btn btn-secondary btn-xs" 
                    @click="showAddProductPanel = true"
                    style="font-size: 0.7rem; background: var(--bg-secondary); border: 1px dashed var(--bevel-dark); cursor: pointer;"
                  >
                    <i class="ph ph-plus-circle"></i> + Agregar Otro Producto al Control
                  </button>
                </div>
                
                <div v-else class="card p-2 animate-fade" style="background: var(--bg-primary); border: 1px solid var(--bevel-dark); margin-bottom: 0.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                    <span class="font-bold text-xs" style="color: var(--text-primary); text-transform: uppercase;">Buscar en Catálogo</span>
                    <button type="button" class="btn btn-danger btn-xs" style="padding: 0.1rem 0.25rem;" @click="showAddProductPanel = false; productSearchQuery = ''">
                      <i class="ph ph-x"></i>
                    </button>
                  </div>
                  
                  <input 
                    type="text" 
                    v-model="productSearchQuery" 
                    class="form-control mb-2" 
                    placeholder="Escriba código o nombre..." 
                    style="height: 30px; font-size: 0.8rem;" 
                  />
                  
                  <div v-if="catalogueSearchResults.length > 0" class="search-results-list">
                    <button 
                      v-for="p in catalogueSearchResults" 
                      :key="p.codigo" 
                      type="button"
                      class="search-result-row" 
                      @click="agregarProductoAlControl(p)"
                    >
                      <strong>{{ p.codigo }}</strong> - {{ p.nombre }}
                    </button>
                  </div>
                  <div v-else-if="productSearchQuery.trim() !== ''" class="text-center text-xs text-muted p-1">
                    No se encontraron productos coincidentes no incluidos.
                  </div>
                </div>
              </div>

              <!-- Tabla de lotes y piezas -->
              <div class="modal-section" style="flex: 1; overflow-y: auto;">
                <span class="modal-section-title">Ajuste de Lotes de Vencimiento</span>
                
                <table class="compact-table mb-2">
                  <thead>
                    <tr>
                      <th>Vencimiento *</th>
                      <th style="width: 140px; text-align: center;">Cantidad Piezas *</th>
                      <th style="width: 60px; text-align: center;">Quitar</th>
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
                          style="height: 30px; font-size: 0.8rem;" 
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          v-model.number="lote.piezas" 
                          class="form-control" 
                          required 
                          min="0" 
                          style="height: 30px; font-size: 0.8rem; text-align: center;" 
                        />
                      </td>
                      <td style="text-align: center;">
                        <button 
                          type="button" 
                          class="btn btn-danger btn-xs" 
                          style="padding: 0.25rem 0.4rem;" 
                          @click="removeLote(idx)"
                        >
                          <i class="ph ph-trash" style="font-size: 0.95rem;"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <button 
                  type="button" 
                  class="btn btn-secondary btn-xs" 
                  style="align-self: flex-start; background: #e2e8f0; border-color: #cbd5e1; color: var(--text-primary);" 
                  @click="addLote"
                >
                  <i class="ph ph-plus-circle"></i> + Agregar Lote
                </button>
              </div>

            </div>

            <!-- Navegación del Asistente -->
            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-secondary" 
                style="margin-right: auto;" 
                @click="cancelarAuditoria"
              >
                Cancelar Control
              </button>
              
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
                style="background: var(--accent-success); border-color: var(--accent-success); color: white;" 
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
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.control-piezas-container {
  padding: 0.5rem;
}

.flex-lotes-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.lote-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.45rem;
  background-color: var(--bg-primary);
  border: 1px solid var(--bevel-dark);
  border-radius: 4px;
  font-size: 0.72rem;
  color: var(--text-primary);
  font-weight: 600;
}

.audit-product-card {
  padding: 0.75rem;
  background-color: var(--accent-primary-light);
  border: 2px solid var(--accent-primary);
  border-radius: var(--border-radius-md);
  margin-bottom: 0.25rem;
}

.compact-table {
  width: 100%;
  border-collapse: collapse;
}

.compact-table th {
  font-size: 0.72rem;
  font-weight: bold;
  text-transform: uppercase;
  color: var(--text-secondary);
  border-bottom: 1.5px solid var(--bevel-dark);
  padding: 0.35rem;
  background-color: var(--bg-secondary);
}

.compact-table td {
  padding: 0.25rem;
  border-bottom: 1px dashed var(--bevel-dark);
  vertical-align: middle;
}

/* Buscador de productos inline en modal */
.search-results-list {
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid var(--bevel-dark);
  background: white;
  display: flex;
  flex-direction: column;
}

.search-result-row {
  width: 100%;
  text-align: left;
  padding: 0.4rem 0.5rem;
  background: white;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--text-primary);
}

.search-result-row:hover {
  background: var(--accent-primary-light);
  color: var(--accent-primary);
  font-weight: bold;
}

/* --- MOBILE FIRST MODAL CARD STYLES --- */
.modal-card-audit {
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100vh;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border: 2px solid var(--bevel-darker);
  overflow: hidden;
}

/* inputs más cómodos en táctil por defecto (mobile-first) */
.compact-table td input {
  font-size: 0.95rem;
  height: 38px;
  padding: 0.3rem 0.5rem;
}

@media (min-width: 600px) {
  .modal-card-audit {
    width: 95vw;
    max-width: 600px;
    height: auto;
    max-height: 88vh;
    border-radius: 12px;
  }

  .compact-table td input {
    font-size: 0.8rem;
    height: 30px;
    padding: 0.2rem 0.4rem;
  }
}
</style>
