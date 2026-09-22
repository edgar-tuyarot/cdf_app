<template>
  <div class="page-container animate-fade">
    <!-- Header de la Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-scales text-blue"></i> Comparaciones de Variabilidad
        </h2>
        <p class="page-description">
          Seguimiento y comparación de ajustes y variabilidad de stock entre dos códigos de producto en BlockWMS.
        </p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-secondary" @click="exportToExcel" :disabled="loading || filteredItems.length === 0">
          <i class="ph ph-file-xls text-green"></i> Exportar Excel
        </button>
        <button class="btn btn-primary" @click="ejecutarComparacion" :disabled="loading || !codigo1 || !codigo2">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Panel de Parámetros de Comparación -->
    <div class="card mb-4" style="padding: 1.25rem; background: var(--bg-window); border: 1.5px solid var(--bevel-dark);">
      <div style="font-weight: 850; font-size: 0.82rem; margin-bottom: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
        <i class="ph ph-funnel" style="color: var(--accent-primary);"></i> Parámetros de Comparación
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; align-items: end;">
        
        <!-- Código Producto 1 -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-weight: bold; font-size: 0.85rem;">
            Producto 1 (Código o Nombre) *
          </label>
          <div style="position: relative; display: flex; align-items: center;">
            <i class="ph ph-tag" style="position: absolute; left: 0.75rem; color: var(--accent-primary); font-size: 1.1rem; pointer-events: none;"></i>
            <input 
              type="text" 
              v-model="productSearchText1" 
              list="catalog-products-list-comp1" 
              @input="handleProductSelect1" 
              class="form-control" 
              placeholder="Ej: 1137 o descripción..." 
              style="padding-left: 2.3rem; height: 38px; font-weight: 700; font-size: 0.88rem;"
            />
            <button 
              v-if="productSearchText1" 
              @click="clearProduct1" 
              style="position: absolute; right: 0.6rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;"
              title="Limpiar"
            >
              <i class="ph ph-x-circle" style="font-size: 1.1rem;"></i>
            </button>
          </div>
          <datalist id="catalog-products-list-comp1">
            <option v-for="p in productos" :key="'p1-' + p.codigo" :value="p.codigo">
              {{ p.codigo }} - {{ p.nombre }}
            </option>
          </datalist>
          <div v-if="product1Name" style="font-size: 0.76rem; color: var(--accent-primary); font-weight: 600; margin-top: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            {{ product1Name }}
          </div>
        </div>

        <!-- Código Producto 2 -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-weight: bold; font-size: 0.85rem;">
            Producto 2 (Código o Nombre) *
          </label>
          <div style="position: relative; display: flex; align-items: center;">
            <i class="ph ph-tag" style="position: absolute; left: 0.75rem; color: #e67e22; font-size: 1.1rem; pointer-events: none;"></i>
            <input 
              type="text" 
              v-model="productSearchText2" 
              list="catalog-products-list-comp2" 
              @input="handleProductSelect2" 
              class="form-control" 
              placeholder="Ej: 1138 o descripción..." 
              style="padding-left: 2.3rem; height: 38px; font-weight: 700; font-size: 0.88rem;"
            />
            <button 
              v-if="productSearchText2" 
              @click="clearProduct2" 
              style="position: absolute; right: 0.6rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;"
              title="Limpiar"
            >
              <i class="ph ph-x-circle" style="font-size: 1.1rem;"></i>
            </button>
          </div>
          <datalist id="catalog-products-list-comp2">
            <option v-for="p in productos" :key="'p2-' + p.codigo" :value="p.codigo">
              {{ p.codigo }} - {{ p.nombre }}
            </option>
          </datalist>
          <div v-if="product2Name" style="font-size: 0.76rem; color: #e67e22; font-weight: 600; margin-top: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            {{ product2Name }}
          </div>
        </div>

        <!-- Fechas Desde / Hasta -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-weight: bold; font-size: 0.85rem;">Fecha Desde</label>
          <input type="date" v-model="fechaDesde" class="form-control" style="height: 38px; font-size: 0.85rem;" />
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-weight: bold; font-size: 0.85rem;">Fecha Hasta</label>
          <input type="date" v-model="fechaHasta" class="form-control" style="height: 38px; font-size: 0.85rem;" />
        </div>

        <!-- Opciones y Botón Consultar -->
        <div style="display: flex; flex-direction: column; gap: 0.4rem; justify-content: flex-end;">
          <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; font-weight: 700; cursor: pointer; user-select: none;">
            <input type="checkbox" v-model="soloAjustes" style="cursor: pointer;" />
            <span>Solo Ajustes de Inventario</span>
          </label>
          
          <button 
            class="btn btn-primary" 
            @click="ejecutarComparacion" 
            :disabled="loading || !codigo1 || !codigo2"
            style="height: 38px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.4rem;"
          >
            <i class="ph ph-spinner spinner" v-if="loading"></i>
            <i class="ph ph-scales" v-else></i>
            <span>Comparar Variabilidad</span>
            <span v-if="elapsedTime > 0" style="font-family: monospace; font-size: 0.8rem; background: rgba(0,0,0,0.25); padding: 0.1rem 0.35rem; border-radius: 3px;">
              {{ formattedTimer }}s
            </span>
          </button>
        </div>

      </div>

      <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.65rem; border-top: 1px dashed var(--bevel-light); padding-top: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
        <i class="ph ph-info" style="color: var(--accent-primary);"></i>
        <span>Sugerencia: BlockWMS realiza un cálculo histórico completo en su base de datos. Para mayor velocidad, se recomienda consultar rangos de 7 a 14 días.</span>
      </div>
    </div>

    <!-- Banner de Carga Activa con Cronómetro -->
    <div v-if="loading" class="alert-box info mb-4" style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.88rem;">
      <i class="ph ph-spinner spinner" style="font-size: 1.2rem;"></i>
      <span>Consultando trazabilidad y calculando ajustes en BlockWMS... Tiempo transcurrido: <strong>{{ formattedTimer }}s</strong></span>
    </div>

    <!-- Indicadores Sobrios de Variabilidad (Sin cards ni colores llamativos) -->
    <div v-if="metricas1 && metricas2" class="mb-4" style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center; padding: 0.75rem 1rem; background: var(--bg-window); border: 1px solid var(--bevel-light); border-radius: 4px; font-size: 0.88rem;">
      <span>
        <strong>[Cód {{ codigo1 }}] Ajustes:</strong> 
        {{ metricas1.cantAjustes }} reg. | Neto: {{ metricas1.kilosNetos > 0 ? '+' : '' }}{{ metricas1.kilosNetos }} kg (Stock WMS: {{ metricas1.stockActual }} kg)
      </span>
      <span style="color: var(--text-muted);">|</span>
      <span>
        <strong>[Cód {{ codigo2 }}] Ajustes:</strong> 
        {{ metricas2.cantAjustes }} reg. | Neto: {{ metricas2.kilosNetos > 0 ? '+' : '' }}{{ metricas2.kilosNetos }} kg (Stock WMS: {{ metricas2.stockActual }} kg)
      </span>
      <span style="color: var(--text-muted);">|</span>
      <span>
        <strong>Brecha Neta (1 - 2):</strong> 
        {{ brechaKilosNetos > 0 ? '+' : '' }}{{ brechaKilosNetos }} kg
      </span>
    </div>

    <!-- Gráfico Comparativo de Variabilidad (Chart.js) -->
    <div v-show="itemsCombinados.length > 0" class="card mb-4" style="padding: 1.25rem; background: var(--bg-window); border: 1.5px solid var(--bevel-dark);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
        <div style="font-weight: 850; font-size: 0.88rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
          <i class="ph ph-chart-line" style="color: var(--accent-primary);"></i>
          Evolución Comparativa de Ajustes en el Tiempo (kg)
        </div>
        <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.82rem; font-weight: 700;">
          <span style="display: flex; align-items: center; gap: 0.35rem;">
            <span style="display: inline-block; width: 12px; height: 12px; background: #1e6ec8; border-radius: 2px;"></span>
            {{ codigo1 }} {{ product1Name ? '- ' + product1Name : '' }}
          </span>
          <span style="display: flex; align-items: center; gap: 0.35rem;">
            <span style="display: inline-block; width: 12px; height: 12px; background: #e67e22; border-radius: 2px;"></span>
            {{ codigo2 }} {{ product2Name ? '- ' + product2Name : '' }}
          </span>
        </div>
      </div>
      <div style="position: relative; height: 280px; width: 100%;">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>

    <!-- Barra de Filtros de la Tabla -->
    <div v-if="itemsCombinados.length > 0" class="card mb-3" style="padding: 0.75rem 1rem; background: var(--bg-window); border: 1px solid var(--bevel-light);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        
        <!-- Pestañas de Filtro Rápido -->
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          <button 
            :class="['btn btn-sm', filterTab === 'todos' ? 'btn-primary' : 'btn-secondary']"
            @click="filterTab = 'todos'"
          >
            Todos ({{ itemsCombinados.length }})
          </button>
          <button 
            :class="['btn btn-sm', filterTab === 'cod1' ? 'btn-primary' : 'btn-secondary']"
            @click="filterTab = 'cod1'"
          >
            Solo Cód {{ codigo1 }} ({{ items1.length }})
          </button>
          <button 
            :class="['btn btn-sm', filterTab === 'cod2' ? 'btn-primary' : 'btn-secondary']"
            @click="filterTab = 'cod2'"
          >
            Solo Cód {{ codigo2 }} ({{ items2.length }})
          </button>
        </div>

        <!-- Buscador Predictivo en Tiempo Real -->
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; max-width: 400px;">
          <i class="ph ph-magnifying-glass" style="color: var(--text-secondary);"></i>
          <input 
            type="text" 
            v-model="tableSearchQuery" 
            placeholder="Buscar por lote, sucursal, documento, operación..." 
            class="form-control" 
            style="height: 32px; font-size: 0.82rem;"
          />
          <button v-if="tableSearchQuery" class="btn-icon" @click="tableSearchQuery = ''" title="Limpiar filtro">
            <i class="ph ph-x-circle"></i>
          </button>
        </div>

      </div>
    </div>

    <!-- Tabla Unificada de Seguimiento y Ajustes -->
    <div class="card" style="margin-bottom: 0;">
      <div class="card-header" style="background-color: #1e6ec8; color: white; padding: 0.65rem 1rem; display: flex; justify-content: space-between; align-items: center;">
        <span class="card-title" style="color: white; font-weight: bold; margin: 0; font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
          <i class="ph ph-list-numbers" style="font-size: 1.2rem;"></i>
          Historial y Ajustes Comparados ({{ filteredItems.length }})
        </span>
        <span v-if="filteredItems.length !== itemsCombinados.length" style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 3px;">
          Filtrados de {{ itemsCombinados.length }} totales
        </span>
      </div>

      <div class="table-container" style="max-height: calc(100vh - 360px); overflow-y: auto;">
        <table class="access-table" style="width: 100%; font-size: 0.84rem;">
          <thead>
            <tr style="background: var(--bg-window);">
              <th style="width: 110px;">Fecha</th>
              <th style="width: 90px; text-align: center;">Código</th>
              <th>Producto</th>
              <th>Operación / Documento</th>
              <th style="width: 95px; text-align: center;">Tipo</th>
              <th style="width: 100px; text-align: right;">Variación (kg)</th>
              <th style="width: 110px; text-align: right;">Stock WMS (kg)</th>
              <th style="width: 120px;">Lote / Vencimiento</th>
              <th style="width: 140px;">Entidad / Sucursal</th>
              <th style="width: 100px;">Ubicación</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                <i class="ph ph-spinner spinner" style="font-size: 1.6rem; display: block; margin-bottom: 0.5rem;"></i>
                Consultando datos en BlockWMS...
              </td>
            </tr>
            <tr v-else-if="filteredItems.length === 0">
              <td colspan="10" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                <i class="ph ph-info" style="font-size: 1.6rem; display: block; margin-bottom: 0.5rem;"></i>
                <span v-if="itemsCombinados.length === 0 && !hasSearched">
                  Selecciona ambos códigos y presiona "Comparar Variabilidad" para consultar.
                </span>
                <span v-else-if="itemsCombinados.length === 0">
                  No se encontraron movimientos ni ajustes en BlockWMS para los códigos y fechas seleccionadas.
                </span>
                <span v-else>
                  No hay registros que coincidan con la búsqueda "{{ tableSearchQuery }}".
                </span>
              </td>
            </tr>
            <tr 
              v-else 
              v-for="(item, idx) in filteredItems" 
              :key="'item-' + idx + '-' + item.id"
              :style="{ backgroundColor: item.codigo_comparacion === 'codigo1' ? 'rgba(30, 110, 200, 0.03)' : 'rgba(230, 126, 34, 0.03)' }"
            >
              <td>{{ item.fecha }}</td>
              <td style="text-align: center;">
                <span 
                  :style="{
                    display: 'inline-block',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontWeight: '800',
                    fontSize: '0.78rem',
                    background: item.codigo_comparacion === 'codigo1' ? 'rgba(30, 110, 200, 0.15)' : 'rgba(230, 126, 34, 0.15)',
                    color: item.codigo_comparacion === 'codigo1' ? '#1e6ec8' : '#d35400'
                  }"
                >
                  {{ item.producto_codigo }}
                </span>
              </td>
              <td style="font-weight: 600;">
                {{ item.producto_nombre || (item.codigo_comparacion === 'codigo1' ? product1Name : product2Name) || '-' }}
              </td>
              <td>
                <div style="font-weight: 600;">{{ item.operacion || item.documento || '-' }}</div>
                <div v-if="item.codigo_orden || item.codigo_orden_erp" style="font-size: 0.73rem; color: var(--text-muted);">
                  Doc: {{ item.codigo_orden || item.codigo_orden_erp }}
                </div>
              </td>
              <td style="text-align: center;">
                <span :class="['badge', getBadgeClass(item.tipo)]">
                  {{ item.tipo }}
                </span>
              </td>
              <td style="text-align: right; font-weight: 700;" :class="getDeltaClass(getItemDelta(item))">
                {{ getItemDelta(item) > 0 ? '+' : '' }}{{ getItemDelta(item).toFixed(2) }}
              </td>
              <td style="text-align: right; font-weight: 600;">
                {{ item.stock_acumulado !== undefined && item.stock_acumulado !== null ? Number(item.stock_acumulado).toFixed(2) : '-' }}
              </td>
              <td style="font-size: 0.78rem;">
                <div v-if="item.lote"><strong>L:</strong> {{ item.lote }}</div>
                <div v-if="item.fecha_vencimiento" style="color: var(--text-muted);">
                  <strong>V:</strong> {{ item.fecha_vencimiento }}
                </div>
                <span v-if="!item.lote && !item.fecha_vencimiento">-</span>
              </td>
              <td style="font-size: 0.78rem;">
                {{ item.entidad_nombre || item.entidad_codigo || '-' }}
              </td>
              <td style="font-size: 0.78rem;">
                {{ item.ubicacion_destino || item.ubicacion_origen || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as XLSX from 'xlsx'
import Chart from 'chart.js/auto'
import { useVariabilidadStore } from '../stores/variabilidad'

const variabilidadStore = useVariabilidadStore()

// Estado
const productos = ref([])
const soloAjustes = ref(variabilidadStore.soloAjustes !== false)
const tableSearchQuery = ref('')
const filterTab = ref('todos') // 'todos' | 'cod1' | 'cod2'

// Parámetros de formulario
const productSearchText1 = ref(variabilidadStore.codigo1 || '')
const productSearchText2 = ref(variabilidadStore.codigo2 || '')
const codigo1 = ref(variabilidadStore.codigo1 || '')
const codigo2 = ref(variabilidadStore.codigo2 || '')
const fechaDesde = ref(variabilidadStore.fechaDesde || '')
const fechaHasta = ref(variabilidadStore.fechaHasta || '')

// Estado conectado al Store Global (Persistente en segundo plano)
const loading = computed(() => variabilidadStore.loading)
const hasSearched = computed(() => variabilidadStore.hasSearched)
const formattedTimer = computed(() => variabilidadStore.formattedTimer)
const metricas1 = computed(() => variabilidadStore.metricas1)
const metricas2 = computed(() => variabilidadStore.metricas2)
const brechaKilosNetos = computed(() => variabilidadStore.brechaKilosNetos)
const items1 = computed(() => variabilidadStore.items1)
const items2 = computed(() => variabilidadStore.items2)
const itemsCombinados = computed(() => variabilidadStore.itemsCombinados)

// Canvas y Chart instance
const chartCanvas = ref(null)
let chartInstance = null

// Alertas
const alert = ref({ show: false, message: '', type: 'info' })
const showAlert = (message, type = 'info') => {
  alert.value = { show: true, message, type }
  setTimeout(() => { alert.value.show = false }, 6000)
}


// Inicialización de fechas (7 días por defecto para consultas ágiles en BlockWMS)
const setDefaultDates = () => {
  const hoy = new Date()
  const yyyy = hoy.getFullYear()
  const mm = String(hoy.getMonth() + 1).padStart(2, '0')
  const dd = String(hoy.getDate()).padStart(2, '0')
  fechaHasta.value = `${yyyy}-${mm}-${dd}`

  // 7 días atrás
  const desde = new Date()
  desde.setDate(desde.getDate() - 7)
  const dY = desde.getFullYear()
  const dM = String(desde.getMonth() + 1).padStart(2, '0')
  const dD = String(desde.getDate()).padStart(2, '0')
  fechaDesde.value = `${dY}-${dM}-${dD}`
}

// Cargar catálogo de productos local
const fetchProductos = async () => {
  try {
    const res = await fetch('/api/productos')
    if (res.ok) {
      productos.value = await res.json()
    }
  } catch (e) {
    console.error('Error cargando productos:', e)
  }
}

// Nombres de productos seleccionados
const product1Name = computed(() => {
  if (metricas1.value && metricas1.value.nombreProducto) return metricas1.value.nombreProducto
  const found = productos.value.find(p => String(p.codigo).trim() === String(codigo1.value).trim())
  return found ? found.nombre : ''
})

const product2Name = computed(() => {
  if (metricas2.value && metricas2.value.nombreProducto) return metricas2.value.nombreProducto
  const found = productos.value.find(p => String(p.codigo).trim() === String(codigo2.value).trim())
  return found ? found.nombre : ''
})

// Handlers de selección de productos
const handleProductSelect1 = () => {
  const query = productSearchText1.value.trim()
  const foundByCode = productos.value.find(p => String(p.codigo).trim() === query)
  if (foundByCode) {
    codigo1.value = String(foundByCode.codigo).trim()
    return
  }
  const foundByName = productos.value.find(p => p.nombre.toLowerCase().includes(query.toLowerCase()))
  if (foundByName && query.length >= 3) {
    codigo1.value = String(foundByName.codigo).trim()
    return
  }
  codigo1.value = query
}

const clearProduct1 = () => {
  productSearchText1.value = ''
  codigo1.value = ''
}

const handleProductSelect2 = () => {
  const query = productSearchText2.value.trim()
  const foundByCode = productos.value.find(p => String(p.codigo).trim() === query)
  if (foundByCode) {
    codigo2.value = String(foundByCode.codigo).trim()
    return
  }
  const foundByName = productos.value.find(p => p.nombre.toLowerCase().includes(query.toLowerCase()))
  if (foundByName && query.length >= 3) {
    codigo2.value = String(foundByName.codigo).trim()
    return
  }
  codigo2.value = query
}

const clearProduct2 = () => {
  productSearchText2.value = ''
  codigo2.value = ''
}

// Cálculo de delta para un item
const getItemDelta = (item) => {
  if (item.tipo === 'INGRESO') return Number(item.cantidad_ingreso || item.cantidad_afectada || 0)
  if (item.tipo === 'EGRESO') return -Number(item.cantidad_egreso || item.cantidad_afectada || 0)
  return Number(item.cantidad_afectada || 0)
}

const getBadgeClass = (tipo) => {
  if (tipo === 'INGRESO') return 'badge-success'
  if (tipo === 'EGRESO') return 'badge-danger'
  return 'badge-info'
}

const getDeltaClass = (val) => {
  if (val > 0) return 'text-green'
  if (val < 0) return 'text-red'
  return 'text-muted'
}

// Consultar Comparación de Variabilidad
const ejecutarComparacion = async () => {
  if (!codigo1.value || !codigo2.value) {
    showAlert('Debes seleccionar o ingresar ambos códigos de producto.', 'warning')
    return
  }

  const ok = await variabilidadStore.ejecutarComparacion({
    c1: codigo1.value,
    c2: codigo2.value,
    fDesde: fechaDesde.value,
    fHasta: fechaHasta.value,
    ajustes: soloAjustes.value
  })

  if (!ok && variabilidadStore.error) {
    showAlert(variabilidadStore.error, 'danger')
  } else if (ok) {
    await nextTick()
    renderChart()
  }
}


// Filtro en tiempo real de la tabla
const filteredItems = computed(() => {
  let list = itemsCombinados.value

  if (filterTab.value === 'cod1') {
    list = list.filter(item => item.codigo_comparacion === 'codigo1')
  } else if (filterTab.value === 'cod2') {
    list = list.filter(item => item.codigo_comparacion === 'codigo2')
  }

  const q = tableSearchQuery.value.trim().toLowerCase()
  if (!q) return list

  return list.filter(it => {
    const cod = String(it.producto_codigo || '').toLowerCase()
    const nom = String(it.producto_nombre || '').toLowerCase()
    const op = String(it.operacion || '').toLowerCase()
    const doc = String(it.documento || '').toLowerCase()
    const lote = String(it.lote || '').toLowerCase()
    const ent = String(it.entidad_nombre || it.entidad_codigo || '').toLowerCase()
    const ubi = String(it.ubicacion_destino || it.ubicacion_origen || '').toLowerCase()
    const ord = String(it.codigo_orden || it.codigo_orden_erp || '').toLowerCase()
    return cod.includes(q) || nom.includes(q) || op.includes(q) || doc.includes(q) || lote.includes(q) || ent.includes(q) || ubi.includes(q) || ord.includes(q)
  })
})

// Gráfico con Chart.js
const renderChart = () => {
  if (!chartCanvas.value) return
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  // Agrupar items por fecha para ambos productos
  const fechasMap = new Map()

  itemsCombinados.value.forEach(item => {
    const f = item.fecha || 'Sin fecha'
    if (!fechasMap.has(f)) {
      fechasMap.set(f, { fecha: f, cod1Delta: 0, cod2Delta: 0 })
    }
    const entry = fechasMap.get(f)
    const delta = getItemDelta(item)
    if (item.codigo_comparacion === 'codigo1') {
      entry.cod1Delta += delta
    } else {
      entry.cod2Delta += delta
    }
  })

  const sortedPoints = Array.from(fechasMap.values())
  const labels = sortedPoints.map(p => p.fecha)
  const dataCod1 = sortedPoints.map(p => Number(p.cod1Delta.toFixed(2)))
  const dataCod2 = sortedPoints.map(p => Number(p.cod2Delta.toFixed(2)))

  const ctx = chartCanvas.value.getContext('2d')
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: `[Cód ${codigo1.value}] ${product1Name.value || ''}`,
          data: dataCod1,
          borderColor: '#1e6ec8',
          backgroundColor: 'rgba(30, 110, 200, 0.1)',
          borderWidth: 2.5,
          tension: 0.2,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: `[Cód ${codigo2.value}] ${product2Name.value || ''}`,
          data: dataCod2,
          borderColor: '#e67e22',
          backgroundColor: 'rgba(230, 126, 34, 0.1)',
          borderWidth: 2.5,
          tension: 0.2,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 12, weight: 'bold' }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = context.parsed.y
              return ` ${context.dataset.label}: ${val > 0 ? '+' : ''}${val} kg`
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        },
        y: {
          title: {
            display: true,
            text: 'Variación de Kilos (kg)',
            font: { weight: 'bold' }
          },
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: { font: { size: 11 } }
        }
      }
    }
  })
}

// Exportar a Excel
const exportToExcel = () => {
  if (filteredItems.value.length === 0) return

  const dataToExport = filteredItems.value.map(item => ({
    'Código Comparación': item.codigo_comparacion === 'codigo1' ? 'Producto 1' : 'Producto 2',
    'Código Producto': item.producto_codigo,
    'Nombre Producto': item.producto_nombre || (item.codigo_comparacion === 'codigo1' ? product1Name.value : product2Name.value),
    'Fecha': item.fecha,
    'Operación': item.operacion || item.documento,
    'Tipo': item.tipo,
    'Variación (kg)': getItemDelta(item),
    'Stock Acumulado WMS (kg)': item.stock_acumulado !== undefined ? item.stock_acumulado : '',
    'Lote': item.lote || '',
    'Vencimiento': item.fecha_vencimiento || '',
    'Entidad / Sucursal': item.entidad_nombre || item.entidad_codigo || '',
    'Ubicación Origen': item.ubicacion_origen || '',
    'Ubicación Destino': item.ubicacion_destino || '',
    'Documento / Orden': item.codigo_orden || item.codigo_orden_erp || ''
  }))

  const worksheet = XLSX.utils.json_to_sheet(dataToExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Comparación Variabilidad')

  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 30 },
    { wch: 12 },
    { wch: 25 },
    { wch: 10 },
    { wch: 15 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 }
  ]

  const fileName = `Comparacion_Variabilidad_${codigo1.value}_vs_${codigo2.value}_${fechaDesde.value}_al_${fechaHasta.value}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

onMounted(async () => {
  if (!fechaDesde.value || !fechaHasta.value) {
    setDefaultDates()
  }
  await fetchProductos()

  // Si ya había una consulta completada en segundo plano, dibujamos el gráfico de inmediato
  if (itemsCombinados.value.length > 0) {
    await nextTick()
    renderChart()
  }
})

// Si la consulta en segundo plano termina mientras el usuario está viendo la pantalla
watch(() => variabilidadStore.itemsCombinados, async (newItems) => {
  if (newItems && newItems.length > 0) {
    await nextTick()
    renderChart()
  }
})
</script>


<style scoped>
.text-green {
  color: var(--accent-success, #10b981);
}
.text-red {
  color: var(--accent-danger, #ef4444);
}
.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
