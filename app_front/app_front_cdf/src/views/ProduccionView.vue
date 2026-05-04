<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'

// Estado global y de navegación
const activeTab = ref('existencias') // existencias, productos, fraccionar, envasar
const isLoading = ref(false)
const searchQuery = ref('')
const expandedRow = ref(null)

// Datos
const productos = ref([])
const existencias = ref([])
const productosFraccionados = ref([]) // Para la pestaña de Envasar
const error = ref('')

// Estados para formularios de operación
const operationCodigo = ref('')
const operationStock = ref(null)
const isSearchingOperation = ref(false)
const isSubmittingOperation = ref(false)
const operationForm = ref({
  cantidad: '', // Piezas a fraccionar
  pesoBruto: '',
  fracciones: '',
  decomiso: '',
  recorte: '',
  peso: '' // Este será el peso fraccionados calculado para Fraccionar, o manual para Envasar
})

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

// Fetch de Productos Fraccionados (para Envasar)
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
  if (activeTab.value === 'envasar' || activeTab.value === 'fraccionar') await fetchProductosFraccionados()
  isLoading.value = false
}

// Lógica de Operaciones (Fetear/Envasar)
const seleccionarProductoParaOperacion = (item) => {
  operationCodigo.value = item.codigo
  operationStock.value = {
    nombre: item.nombre,
    piezas: item.existencia_feteados || 0,
    kilos: item.existencia_posible || 0,
    ubicacionNombre: 'Fraccionado'
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
        operationStock.value = { ...foundExistencia }
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

const submitOperacion = async () => {
  isSubmittingOperation.value = true
  const tipo = activeTab.value === 'fraccionar' ? 'Fraccionado' : 'Envasado'
  
  // Mock de registro
  setTimeout(async () => {
    console.log(`${tipo} registrado`, {
      codigo: operationCodigo.value,
      ...operationForm.value
    })
    alert(`${tipo} registrado con éxito`)
    
    // Limpiar y refrescar
    isSubmittingOperation.value = false
    operationStock.value = null
    operationCodigo.value = ''
    operationForm.value = { 
      cantidad: '', 
      pesoBruto: '', 
      fracciones: '', 
      decomiso: '', 
      recorte: '', 
      peso: '' 
    }
    await refreshData()
  }, 1000)
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

    <!-- Pestañas (Tabs) -->
    <div class="tabs-container">
      <div class="tabs-row">
        <button 
          class="tab-btn" 
          :class="{ 'active': activeTab === 'existencias' }"
          @click="activeTab = 'existencias'; expandedRow = null"
        >
          <span class="material-icons">inventory</span> Existencias
        </button>
        <button 
          class="tab-btn" 
          :class="{ 'active': activeTab === 'productos' }"
          @click="activeTab = 'productos'; expandedRow = null"
        >
          <span class="material-icons">category</span> Productos
        </button>
      </div>
      <div class="tabs-row second-row">
        <button 
          class="tab-btn" 
          :class="{ 'active': activeTab === 'fraccionar' }"
          @click="activeTab = 'fraccionar'; operationStock = null; operationCodigo = ''; fetchProductosFraccionados()"
        >
          <span class="material-icons">content_cut</span> Fraccionar
        </button>
        <button 
          class="tab-btn" 
          :class="{ 'active': activeTab === 'envasar' }"
          @click="activeTab = 'envasar'; operationStock = null; operationCodigo = ''; fetchProductosFraccionados()"
        >
          <span class="material-icons">inventory_2</span> Envasar
        </button>
      </div>
    </div>

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
                    <span class="value">{{ item.feteados.toFixed(2) }}</span>
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

    <!-- Vistas de Operación (Fetear / Envasar) -->
    <template v-else>
      <div class="operation-container fade-in">
        <BaseCard>
          <template #header>
            <div class="op-header">
              <span class="material-icons">{{ activeTab === 'fraccionar' ? 'content_cut' : 'inventory_2' }}</span>
              <h3>Registrar {{ activeTab === 'fraccionar' ? 'Fraccionado' : 'Envasado' }}</h3>
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

          <!-- Lista de productos fraccionados disponibles (Solo en pestañas Fraccionar y Envasar) -->
          <div v-if="(activeTab === 'envasar' || activeTab === 'fraccionar') && !operationStock && productosFraccionados.length > 0" class="fraccionados-list">
            <p class="list-title">Productos disponibles para {{ activeTab }}:</p>
            <div v-for="item in productosFraccionados" :key="item.codigo" 
                 class="fraccionado-item-mini" @click="seleccionarProductoParaOperacion(item)">
              <div class="fraccionado-main">
                <span class="fraccionado-code">{{ item.codigo }}</span>
                <span class="fraccionado-name">{{ item.nombre }}</span>
              </div>
              <div class="fraccionado-badges">
                <span v-if="activeTab === 'fraccionar'" class="badge pos">{{ Math.floor(item.existencia_posible) }} u (Posible)</span>
                <span v-if="activeTab === 'envasar'" class="badge fet">{{ item.existencia_feteados }} u (Fraccionados)</span>
              </div>
            </div>
          </div>

          <Transition name="expand">
            <div v-if="operationStock" class="op-info-box">
              <div class="op-info-main">
                <strong>{{ operationStock.nombre }}</strong>
                <span class="op-badge">{{ operationStock.ubicacionNombre }}</span>
              </div>
              <div class="op-stats-row">
                <!-- Para Fraccionar: Mostrar lo posible -->
                <div v-if="activeTab === 'fraccionar'" class="op-stat">
                  <span class="lbl">Posible a Fraccionar</span>
                  <span class="val">{{ Math.floor(operationStock.kilos) }} u</span>
                </div>
                
                <!-- Para Envasar: Mostrar lo fraccionado existente -->
                <div v-if="activeTab === 'envasar'" class="op-stat">
                  <span class="lbl">Fraccionados Listos</span>
                  <span class="val">{{ operationStock.piezas }} u</span>
                </div>
              </div>
            </div>
          </Transition>

          <form v-if="operationStock" @submit.prevent="submitOperacion" class="op-form">
            <div class="op-form-grid" :class="{ 'frac-grid': activeTab === 'fraccionar' }">
              <!-- Campos comunes o específicos según pestaña -->
              <BaseInput 
                v-model="operationForm.cantidad" 
                :label="activeTab === 'fraccionar' ? 'Piezas a Fraccionar' : 'Cant. a Envasar'" 
                type="number"
                required
              />
              
              <template v-if="activeTab === 'fraccionar'">
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
              </template>

              <template v-else>
                <BaseInput 
                  v-model="operationForm.peso" 
                  label="Peso Resultante (KG)" 
                  type="number" 
                  step="0.001"
                  required
                />
              </template>
            </div>
            <BaseButton variant="primary" fullWidth :disabled="isSubmittingOperation">
              <span class="material-icons">save</span> 
              {{ isSubmittingOperation ? 'Procesando...' : 'Confirmar Registro' }}
            </BaseButton>
          </form>
        </BaseCard>
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

/* Tabs */
.tabs-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: #EEE;
  padding: 4px;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
  border: 2px solid var(--color-border);
}

.tabs-row {
  display: flex;
  gap: 4px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border: none;
  background: none;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  cursor: pointer;
}

.tab-btn.active {
  background-color: white;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.second-row .tab-btn.active {
  color: var(--color-secondary);
}

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
.content-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
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
</style>
