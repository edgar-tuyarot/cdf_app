<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import { useAuthStore } from '../stores/auth'

// Estado global y de navegación
const route = useRoute()
const authStore = useAuthStore()
const activeTab = computed(() => route.query.tab || 'existencias')
const isLoading = ref(false)
const searchQuery = ref('')
const expandedRow = ref(null)

// Datos
const productos = ref([])
const existencias = ref([])
const productosFraccionados = ref([]) // Para la pestaña de Fraccionar
const error = ref('')

// Estados para formulario de Fraccionar
const operationCodigo = ref('')
const operationStock = ref(null)
const isSearchingOperation = ref(false)
const isSubmittingOperation = ref(false)
const operationForm = ref({
  cantidad: '',
  pesoBruto: '',
  fracciones: '',
  decomiso: '',
  recorte: '',
  peso: ''
})

// Estados para Envasar
const selectedEnvasar = ref(null)
const isSubmittingEnvasado = ref(false)
const envasarForm = ref({
  cantidad: '',
  peso: ''
})
const envasarSearchQuery = ref('')

// Cálculo de Peso Fraccionado (Bruto - Recorte - Decomiso)
const pesoFraccionadosCalculado = computed(() => {
  if (activeTab.value !== 'fraccionar') return operationForm.value.peso
  const bruto = parseFloat(operationForm.value.pesoBruto) || 0
  const rec = parseFloat(operationForm.value.recorte) || 0
  const dec = parseFloat(operationForm.value.decomiso) || 0
  return (bruto - (rec + dec)).toFixed(3)
})

// Fetch de Productos
const fetchProductos = async () => {
  try {
    const response = await fetch('/api/productos')
    if (response.ok) productos.value = await response.json()
  } catch (err) { console.error('Error productos:', err) }
}

// Fetch de Existencias
const fetchExistencias = async () => {
  try {
    const res = await fetch('/api/existencias/summary')
    if (res.ok) existencias.value = await res.json()
  } catch (err) { console.error('Error existencias:', err) }
}

// Fetch de Productos Fraccionados (para Fraccionar)
const fetchProductosFraccionados = async () => {
  try {
    isLoading.value = true
    const res = await fetch('/api/productos/feteados')
    if (res.ok) productosFraccionados.value = await res.json()
  } catch (err) { 
    console.error('Error productos fraccionados:', err) 
  } finally {
    isLoading.value = false
  }
}

const refreshData = async () => {
  isLoading.value = true
  error.value = ''
  await Promise.all([fetchProductos(), fetchExistencias()])
  if (activeTab.value === 'fraccionar') await fetchProductosFraccionados()
  isLoading.value = false
}

// Existencias con feteados > 0 (para envasar)
const existenciasConFeteados = computed(() => {
  let result = existencias.value.filter(e => (e.feteados || 0) > 0)
  if (envasarSearchQuery.value) {
    const q = envasarSearchQuery.value.toLowerCase()
    result = result.filter(e =>
      e.codigo_producto.toLowerCase().includes(q) ||
      e.nombre.toLowerCase().includes(q)
    )
  }
  return result
})

const seleccionarParaEnvasar = (item) => {
  selectedEnvasar.value = {
    codigo: item.codigo_producto,
    nombre: item.nombre,
    feteados: item.feteados || 0,
    ubicacionId: item.ubicacionId || item.ubicacion_id || 1,
    ubicacionNombre: item.ubicacionNombre || '—'
  }
  envasarForm.value = { cantidad: '', peso: '' }
}

const cancelarEnvasar = () => {
  selectedEnvasar.value = null
  envasarForm.value = { cantidad: '', peso: '' }
}

const submitEnvasado = async () => {
  isSubmittingEnvasado.value = true
  try {
    const payload = {
      codigo: selectedEnvasar.value.codigo,
      ubicacionId: selectedEnvasar.value.ubicacionId,
      usuarioId: authStore.user?.id || 1,
      cantidad: parseInt(envasarForm.value.cantidad) || 0,
      peso: parseFloat(envasarForm.value.peso) || 0
    }

    const response = await fetch('/api/procesos/envasar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Error al registrar envasado')
    }

    alert('Envasado registrado con éxito')
    selectedEnvasar.value = null
    envasarForm.value = { cantidad: '', peso: '' }
    await refreshData()
  } catch (err) {
    console.error('Error al registrar envasado:', err)
    alert(`Error: ${err.message}`)
  } finally {
    isSubmittingEnvasado.value = false
  }
}

// Lógica de Operaciones (Fetear/Envasar)
const seleccionarProductoParaOperacion = (item) => {
  operationCodigo.value = item.codigo
  operationStock.value = {
    nombre: item.nombre,
    piezas: item.existencia_feteados || 0,
    kilos: item.existencia_posible || 0,
    ubicacionId: item.ubicacionId || item.ubicacion_id || 1,
    ubicacionNombre: item.ubicacionNombre || 'Fraccionado'
  }
}

const buscarStockOperacion = async () => {
  if (!operationCodigo.value) return
  isSearchingOperation.value = true
  
  // Usamos los productos del endpoint de feteados para ambas operaciones
  const found = productosFraccionados.value.find(p => p.codigo === operationCodigo.value)
  if (found) {
    seleccionarProductoParaOperacion(found)
  } else {
    // Si no está en el resumen de fraccionados, intentamos buscar en existencias generales para Fraccionar
    if (activeTab.value === 'fraccionar') {
      const foundExistencia = existencias.value.find(e => e.codigo_producto === operationCodigo.value)
      if (foundExistencia) {
        operationStock.value = { 
          ...foundExistencia,
          ubicacionId: foundExistencia.ubicacionId || foundExistencia.ubicacion_id || 1
        }
      } else {
        alert('Producto no encontrado')
        operationStock.value = null
      }
    } else {
      alert('Producto no encontrado para envasar')
      operationStock.value = null
    }
  }
  isSearchingOperation.value = false
}

const submitFraccionado = async () => {
  isSubmittingOperation.value = true
  try {
    const payload = {
      codigo: operationCodigo.value,
      ubicacionId: operationStock.value?.ubicacionId || 1,
      usuarioId: authStore.user?.id || 1,
      recortes: parseFloat(operationForm.value.recorte) || 0,
      decomisos: parseFloat(operationForm.value.decomiso) || 0,
      fracciones: parseInt(operationForm.value.fracciones) || 0,
      piezas_utilizadas: parseInt(operationForm.value.cantidad) || 0,
      peso_consumido: parseFloat(operationForm.value.pesoBruto) || 0
    }

    const response = await fetch('/api/procesos/fraccionar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Error al registrar fraccionado')
    }

    alert('Fraccionado registrado con éxito')
    operationStock.value = null
    operationCodigo.value = ''
    operationForm.value = { cantidad: '', pesoBruto: '', fracciones: '', decomiso: '', recorte: '', peso: '' }
    await refreshData()
  } catch (err) {
    console.error('Error al registrar fraccionado:', err)
    alert(`Error: ${err.message}`)
  } finally {
    isSubmittingOperation.value = false
  }
}

// Filtrado
const filteredProductos = computed(() => {
  if (!searchQuery.value) return productos.value
  const q = searchQuery.value.toLowerCase()
  return productos.value.filter(p => 
    p.codigo.toLowerCase().includes(q) || 
    p.nombre.toLowerCase().includes(q)
  )
})

const filteredExistencias = computed(() => {
  if (!searchQuery.value) return existencias.value
  const q = searchQuery.value.toLowerCase()
  return existencias.value.filter(e => 
    e.codigo_producto.toLowerCase().includes(q) || 
    e.nombre.toLowerCase().includes(q)
  )
})

const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

// Watch tab changes to load data when navigating via sidebar
watch(() => route.query.tab, (newTab) => {
  expandedRow.value = null
  if (newTab === 'fraccionar') {
    operationStock.value = null
    operationCodigo.value = ''
    fetchProductosFraccionados()
  }
  if (newTab === 'envasar') {
    selectedEnvasar.value = null
    envasarForm.value = { cantidad: '', peso: '' }
    envasarSearchQuery.value = ''
    fetchExistencias()
  }
})

onMounted(refreshData)
</script>

<template>
  <div class="produccion-view">
    <header class="mobile-view-header">
      <div class="title-section">
        <h1>Producción</h1>
        <p>Panel de Colaborador</p>
      </div>
      <button class="refresh-circle-btn" @click="refreshData" :disabled="isLoading">
        <span class="material-icons" :class="{ 'spinning': isLoading }">refresh</span>
      </button>
    </header>

    <!-- Contenido según pestaña -->
    
    <!-- Vistas de Consulta (Existencias / Productos) -->
    <template v-if="activeTab === 'existencias' || activeTab === 'productos'">
      <!-- Barra de Búsqueda -->
      <div class="search-section">
        <div class="search-wrapper">
          <span class="material-icons search-icon">search</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar..." 
            class="custom-search-input"
          >
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>

      <div class="content-scroll-area">
        <!-- TAB EXISTENCIAS -->
        <div v-if="activeTab === 'existencias'" class="list-fade-in">
          <div v-if="filteredExistencias.length === 0 && !isLoading" class="empty-state">
            <span class="material-icons">sentiment_dissatisfied</span>
            <p>No se encontraron existencias</p>
          </div>

          <div v-for="item in filteredExistencias" :key="item.codigo_producto + item.ubicacionNombre" 
               class="mobile-card" :class="{ 'expanded': expandedRow === (item.codigo_producto + item.ubicacionNombre) }"
               @click="toggleRow(item.codigo_producto + item.ubicacionNombre)">
            <div class="card-main">
              <div class="card-info">
                <span class="code-badge">{{ item.codigo_producto }}</span>
                <h3 class="product-name">{{ item.nombre }}</h3>
              </div>
              <div class="card-stats">
                <div class="stat">
                  <span class="stat-value">{{ item.kilos.toFixed(2) }}</span>
                  <span class="stat-label">KG</span>
                </div>
                <span class="material-icons chevron">expand_more</span>
              </div>
            </div>
            
            <Transition name="expand">
              <div v-if="expandedRow === (item.codigo_producto + item.ubicacionNombre)" class="card-details">
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">Ubicación</span>
                    <span class="value-badge">{{ item.ubicacionNombre }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Piezas</span>
                    <span class="value">{{ item.piezas }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Fraccionados</span>
                    <span class="value">{{ (item.feteados || 0).toFixed(0) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Envasados</span>
                    <span class="value">{{ (item.envasados || 0).toFixed(0) }}</span>
                  </div>
                  <div v-if="item.recortes" class="detail-item">
                    <span class="label">Recortes</span>
                    <span class="value">{{ item.recortes.toFixed(3) }} kg</span>
                  </div>
                  <div v-if="item.decomisados" class="detail-item">
                    <span class="label">Decomisados</span>
                    <span class="value warn-value">{{ item.decomisados.toFixed(3) }} kg</span>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- TAB PRODUCTOS -->
        <div v-if="activeTab === 'productos'" class="list-fade-in">
          <div v-if="filteredProductos.length === 0 && !isLoading" class="empty-state">
            <span class="material-icons">sentiment_dissatisfied</span>
            <p>No se encontraron productos</p>
          </div>

          <div v-for="p in filteredProductos" :key="p.codigo" 
               class="mobile-card" :class="{ 'expanded': expandedRow === p.codigo }"
               @click="toggleRow(p.codigo)">
            <div class="card-main">
              <div class="card-info">
                <span class="code-badge blue">{{ p.codigo }}</span>
                <h3 class="product-name">{{ p.nombre }}</h3>
              </div>
              <div class="card-stats">
                <span class="material-icons chevron">expand_more</span>
              </div>
            </div>
            
            <Transition name="expand">
              <div v-if="expandedRow === p.codigo" class="card-details">
                <div class="detail-list">
                  <div class="detail-row">
                    <span>Peso por bolsa:</span>
                    <strong>{{ p.pesoPorBolsita?.toFixed(2) }} KG</strong>
                  </div>
                  <div class="detail-row">
                    <span>¿Se fracciona?:</span>
                    <span :class="['status-pill', p.feteable ? 'yes' : 'no']">
                      {{ p.feteable ? 'SÍ' : 'NO' }}
                    </span>
                  </div>
                  <div class="detail-row">
                    <span>¿Deja recorte?:</span>
                    <span :class="['status-pill', p.picable ? 'yes' : 'no']">
                      {{ p.picable ? 'SÍ' : 'NO' }}
                    </span>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </template>

    <!-- Vista de Fraccionar -->
    <template v-if="activeTab === 'fraccionar'">
      <div class="operation-container fade-in">
        <BaseCard>
          <template #header>
            <div class="op-header">
              <span class="material-icons">content_cut</span>
              <h3>Registrar Fraccionado</h3>
            </div>
          </template>

          <div class="op-search-row">
            <BaseInput 
              v-model="operationCodigo" 
              label="Código de Producto" 
              placeholder="Ej: 8010" 
              class="op-input"
              @keyup.enter="buscarStockOperacion"
            />
            <button class="search-btn-sq" @click="buscarStockOperacion" :disabled="isSearchingOperation">
              <span class="material-icons">{{ isSearchingOperation ? 'sync' : 'search' }}</span>
            </button>
          </div>


          <Transition name="expand">
            <div v-if="operationStock" class="op-info-box">
              <div class="op-info-main">
                <strong>{{ operationStock.nombre }}</strong>
                <span class="op-badge">{{ operationStock.ubicacionNombre }}</span>
              </div>
              <div class="op-stats-row">
                <div class="op-stat">
                  <span class="lbl">Posible a Fraccionar</span>
                  <span class="val">{{ Math.floor(operationStock.kilos) }} u</span>
                </div>
              </div>
            </div>
          </Transition>

          <form v-if="operationStock" @submit.prevent="submitFraccionado" class="op-form">
            <div class="op-form-grid frac-grid">
              <BaseInput 
                v-model="operationForm.cantidad" 
                label="Piezas a Fraccionar" 
                type="number"
                required
              />
              <BaseInput 
                v-model="operationForm.pesoBruto" 
                label="Peso Bruto (KG)" 
                type="number" 
                step="0.001"
                required
              />
              <BaseInput 
                v-model="operationForm.fracciones" 
                label="Fracciones (Bolsitas)" 
                type="number" 
                required
              />
              <BaseInput 
                v-model="operationForm.recorte" 
                label="Recorte (KG)" 
                type="number" 
                step="0.001"
              />
              <BaseInput 
                v-model="operationForm.decomiso" 
                label="Decomiso (KG)" 
                type="number" 
                step="0.001"
              />
              <div class="calculated-field">
                <span class="lbl">Peso Fraccionados</span>
                <span class="val">{{ pesoFraccionadosCalculado }} KG</span>
              </div>
            </div>
            <BaseButton variant="primary" fullWidth :disabled="isSubmittingOperation">
              <span class="material-icons">save</span> 
              {{ isSubmittingOperation ? 'Procesando...' : 'Confirmar Fraccionado' }}
            </BaseButton>
          </form>
        </BaseCard>
      </div>
    </template>

    <!-- Vista de Envasar -->
    <template v-if="activeTab === 'envasar'">
      <div class="operation-container fade-in">
        <!-- Si no hay producto seleccionado, mostrar lista -->
        <template v-if="!selectedEnvasar">
          <div class="search-section">
            <div class="search-wrapper">
              <span class="material-icons search-icon">search</span>
              <input 
                v-model="envasarSearchQuery" 
                type="text" 
                placeholder="Buscar producto..." 
                class="custom-search-input"
              >
              <button v-if="envasarSearchQuery" @click="envasarSearchQuery = ''" class="clear-btn">
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>

          <div v-if="existenciasConFeteados.length === 0 && !isLoading" class="empty-state">
            <span class="material-icons">inventory_2</span>
            <p>No hay productos con fraccionados disponibles para envasar.</p>
          </div>

          <div class="content-scroll-area">
            <div v-for="item in existenciasConFeteados" :key="item.codigo_producto + item.ubicacionNombre"
                 class="mobile-card envasar-card"
                 @click="seleccionarParaEnvasar(item)">
              <div class="card-main">
                <div class="card-info">
                  <span class="code-badge">{{ item.codigo_producto }}</span>
                  <h3 class="product-name">{{ item.nombre }}</h3>
                </div>
                <div class="card-stats">
                  <div class="stat">
                    <span class="stat-value">{{ (item.feteados || 0).toFixed(0) }}</span>
                    <span class="stat-label">FRACC</span>
                  </div>
                  <span class="material-icons chevron">chevron_right</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Producto seleccionado: formulario de envasado -->
        <template v-else>
          <BaseCard>
            <template #header>
              <div class="op-header">
                <span class="material-icons">inventory_2</span>
                <h3>Registrar Envasado</h3>
              </div>
            </template>

            <div class="op-info-box">
              <div class="op-info-main">
                <strong>{{ selectedEnvasar.nombre }}</strong>
                <span class="op-badge">{{ selectedEnvasar.ubicacionNombre }}</span>
              </div>
              <div class="op-stats-row">
                <div class="op-stat">
                  <span class="lbl">Código</span>
                  <span class="val">{{ selectedEnvasar.codigo }}</span>
                </div>
                <div class="op-stat">
                  <span class="lbl">Fraccionados disponibles</span>
                  <span class="val">{{ selectedEnvasar.feteados }}</span>
                </div>
              </div>
            </div>

            <form @submit.prevent="submitEnvasado" class="op-form">
              <div class="op-form-grid">
                <BaseInput 
                  v-model="envasarForm.cantidad" 
                  label="Cantidad a Envasar" 
                  type="number"
                  placeholder="Ej: 15"
                  required
                />
                <BaseInput 
                  v-model="envasarForm.peso" 
                  label="Peso Total (KG)" 
                  type="number" 
                  step="0.001"
                  placeholder="Ej: 3.500"
                  required
                />
              </div>
              <div class="envasar-actions">
                <BaseButton variant="minimal" type="button" @click="cancelarEnvasar">
                  Cancelar
                </BaseButton>
                <BaseButton variant="primary" fullWidth :disabled="isSubmittingEnvasado">
                  <span class="material-icons">save</span> 
                  {{ isSubmittingEnvasado ? 'Procesando...' : 'Confirmar Envasado' }}
                </BaseButton>
              </div>
            </form>
          </BaseCard>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.produccion-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  max-width: 600px;
  margin: 0 auto;
}

.mobile-view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.title-section h1 {
  margin-bottom: 0;
  font-size: 1.8rem;
  color: var(--color-secondary);
}

.title-section p {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.refresh-circle-btn {
  background: white;
  border: 2px solid var(--color-border);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  color: var(--color-primary);
}

.refresh-circle-btn:active {
  transform: scale(0.95);
  background-color: #F0F0F0;
}

/* Tabs removed - navigation moved to sidebar */

/* Operation Section */
.op-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.op-header h3 { margin-bottom: 0; }

.op-search-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: var(--space-md);
}

.op-input { flex: 1; margin-bottom: 0 !important; }

.search-btn-sq {
  width: 48px;
  height: 48px;
  background-color: var(--color-secondary);
  color: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.op-info-box {
  background-color: #F0F4F8;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: var(--space-md);
}

.op-info-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.op-badge {
  background-color: var(--color-secondary);
  color: white;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
}

.op-stats-row {
  display: flex;
  gap: 20px;
}

.op-stat {
  display: flex;
  flex-direction: column;
}

.op-stat .lbl { font-size: 0.7rem; color: var(--color-text-muted); font-weight: 600; }
.op-stat .val { font-size: 1rem; font-weight: 800; }

.op-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: var(--space-md);
}

.frac-grid {
  grid-template-columns: 1fr 1fr;
}

.calculated-field {
  grid-column: span 2;
  background-color: #E3F2FD;
  border: 2px solid var(--color-secondary);
  border-radius: var(--radius-md);
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.calculated-field .lbl {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-secondary);
}

.calculated-field .val {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--color-secondary);
}

/* Fraccionados List Mini */
.fraccionados-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.list-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.fraccionado-item-mini {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background-color: #FAFAFA;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.fraccionado-item-mini:hover {
  border-color: var(--color-secondary);
  background-color: #F0F4F8;
}

.fraccionado-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fraccionado-code {
  font-weight: 800;
  color: var(--color-secondary);
  font-size: 0.9rem;
}

.fraccionado-name {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fraccionado-badges {
  display: flex;
  gap: 8px;
}

.fraccionado-badges .badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
}

.badge.pos { background-color: #E3F2FD; color: #1565C0; }
.badge.fet { background-color: #F3E5F5; color: #7B1FA2; }

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  height: 48px;
}

.search-icon {
  color: var(--color-text-muted);
  margin-right: 8px;
}

.custom-search-input {
  border: none;
  background: none;
  width: 100%;
  height: 100%;
  outline: none;
  font-size: 1rem;
  font-weight: 600;
}

.clear-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
}

/* Cards */
.search-section {
  margin-top: var(--space-md);
}

.content-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
  margin-top: var(--space-md);
}

.mobile-card {
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.mobile-card:active {
  background-color: #FAFAFA;
}

.card-main {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.code-badge {
  background-color: var(--color-primary);
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
  border: 1px solid var(--color-border);
}

.code-badge.blue {
  background-color: var(--color-secondary);
}

.product-name {
  font-size: 1rem;
  margin: 0;
  color: var(--color-secondary);
}

.card-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text);
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.chevron {
  color: var(--color-text-muted);
  transition: transform 0.3s ease;
}

.mobile-card.expanded .chevron {
  transform: rotate(180deg);
}

/* Details */
.card-details {
  background-color: #F8F9FA;
  border-top: 1px dashed #DDD;
  padding: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item .label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.detail-item .value {
  font-size: 0.95rem;
  font-weight: 700;
}

.value-badge {
  background-color: var(--color-secondary);
  color: white;
  font-size: 0.8rem;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 700;
  width: fit-content;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.status-pill {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 20px;
}

.status-pill.yes { background-color: #E8F5E9; color: #2E7D32; border: 1px solid #2E7D32; }
.status-pill.no { background-color: #FFEBEE; color: #C62828; border: 1px solid #C62828; }

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}

.empty-state .material-icons {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.3;
}

/* Animations */
.list-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinning {
  animation: spin 1s linear infinite;
}

.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 200px;
}

.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.warn-value {
  color: #C62828;
}

/* Envasar tab styles */
.envasar-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.envasar-card:hover {
  border-color: var(--color-secondary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.envasar-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: var(--space-sm);
}

.envasar-actions > *:last-child {
  flex: 1;
}
</style>
