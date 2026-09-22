<template>
  <div class="page-container animate-fade">
    <!-- Header de la Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-chart-line text-green"></i> Reporte de pedidos
        </h2>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-secondary" @click="exportToExcel" :disabled="loading || sortedItems.length === 0">
          <i class="ph ph-file-xls text-green"></i> Exportar Excel
        </button>
        <button class="btn btn-primary" @click="fetchData" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
        </button>
      </div>
    </div>

    <!-- Alerta -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Panel de Filtros -->
    <div class="card mb-4" style="padding: 0.85rem 1rem; background: var(--bg-window); border: 1px solid var(--bevel-light);">
      <div style="font-weight: 700; font-size: 0.82rem; margin-bottom: 0.6rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
        <i class="ph ph-funnel" style="color: var(--accent-primary);"></i> Filtros de Selección
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; align-items: end;">
        <!-- Fecha Desde -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Fecha Desde</label>
          <input type="date" v-model="filters.startDate" class="form-control" />
        </div>

        <!-- Fecha Hasta -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Fecha Hasta</label>
          <input type="date" v-model="filters.endDate" class="form-control" />
        </div>

        <!-- Sucursal -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Sucursal</label>
          <select v-model="filters.sucursal" class="form-control">
            <option value="">Todas las Sucursales</option>
            <option v-for="suc in sucursales" :key="suc.id" :value="suc.sucursal">
              {{ suc.sucursal }}
            </option>
          </select>
        </div>

        <!-- Producto -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Producto</label>
          <select v-model="filters.productoCodigo" class="form-control">
            <option value="">Todos los Productos</option>
            <option v-for="prod in availableProducts" :key="prod.codigo" :value="prod.codigo">
              {{ prod.codigo }} - {{ prod.nombre }}
            </option>
          </select>
        </div>

        <!-- Botón Resetear -->
        <div>
          <button class="btn btn-secondary" @click="resetFilters" style="width: 100%; height: 36px;">
            <i class="ph ph-arrow-counter-clockwise"></i> Limpiar Filtros
          </button>
        </div>
      </div>
    </div>

    <!-- GRÁFICO LINEAL DE PEDIDOS (EJE Y: KG, EJE X: FECHAS) -->
    <div class="card mb-4">
      <div class="card-header" style="background: #0f172a; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="card-title" style="color: white; font-weight: bold;">
          <i class="ph ph-chart-line-up" style="margin-right: 0.4rem; color: #60a5fa;"></i> Evolución de Pedidos (Kg) por Fecha
        </span>
        <div style="display: flex; gap: 1.25rem; font-size: 0.85rem;" class="text-xs">
          <span>Pedido: <strong style="color: #93c5fd;">{{ metrics.totalKgSolicitadosNeto }} kg</strong></span>
          <span>Enviado: <strong style="color: #6ee7b7;">{{ metrics.totalKgEnviados }} kg</strong></span>
        </div>
      </div>
      <div class="card-body" style="padding: 1.25rem;">
        <div style="position: relative; height: 350px; width: 100%;" class="no-print">
          <canvas ref="chartUnifiedCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Tabla Detallada de Pedidos Agrupados por Pedido con Subtotales y Desplegable -->
    <div class="card">
      <div class="card-header" style="background: #0f172a; color: white; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="card-title" style="color: white;">
            Listado Detallado ({{ metrics.ordersCount }} pedidos / {{ sortedItems.length }} ítems)
          </span>
          <div style="display: flex; gap: 0.35rem;" class="no-print">
            <button class="btn btn-secondary text-xs" @click="expandAllOrders" style="padding: 0.2rem 0.5rem; height: 26px; font-size: 0.75rem;">
              <i class="ph ph-arrows-out-line"></i> Expandir Todos
            </button>
            <button class="btn btn-secondary text-xs" @click="collapseAllOrders" style="padding: 0.2rem 0.5rem; height: 26px; font-size: 0.75rem;">
              <i class="ph ph-arrows-in-line"></i> Contraer Todos
            </button>
          </div>
        </div>
        <div style="display: flex; gap: 1rem; font-size: 0.82rem;" class="text-xs">
          <span>Kg Pedidos Netos: <strong style="color: #93c5fd;">{{ metrics.totalKgSolicitadosNeto }} kg</strong></span>
          <span>Kg Enviados: <strong style="color: #6ee7b7;">{{ metrics.totalKgEnviados }} kg</strong></span>
          <span>Balance Neto: <strong style="color: #fca5a5;">{{ metrics.totalBalance }} kg</strong></span>
        </div>
      </div>

      <div class="table-container">
        <table class="access-table">
          <thead>
            <tr>
              <!-- Cabeceras sin flechas de ordenamiento -->
              <th @click="setSort('fecha')" class="sortable-header">Fecha</th>
              <th @click="setSort('sucursal')" class="sortable-header">Sucursal</th>
              <th @click="setSort('codigoProducto')" class="sortable-header">Cod.</th>
              <th @click="setSort('nombreProducto')" class="sortable-header">Producto</th>
              <th @click="setSort('piezasPedidas')" class="text-center sortable-header">Pzas</th>
              <th @click="setSort('fraccionesPedidas')" class="text-center sortable-header">Fracs</th>
              <th @click="setSort('pesoXPieza')" class="text-right sortable-header">Kg x Pza</th>
              <th @click="setSort('kgXBolsita')" class="text-right sortable-header">Kg x Frac</th>
              <th @click="setSort('kgSolicitados')" class="text-right sortable-header">Kg Pedido</th>
              <th @click="setSort('kgEnviados')" class="text-right sortable-header">Kg Enviado</th>
              <th @click="setSort('balance')" class="text-right sortable-header">Balance</th>
              <th @click="setSort('estadoArmado')" class="text-center sortable-header">Estado</th>
            </tr>
          </thead>

          <!-- Iteración por Pedido Agrupado -->
          <tbody v-for="group in groupedOrders" :key="group.codigoPedido">
            <!-- Fila Clicable de Encabezado de Pedido (Contraer / Desplegar) -->
            <tr 
              @click="toggleOrderExpand(group.codigoPedido)" 
              style="background: #1e293b; color: white; font-weight: bold; cursor: pointer; user-select: none;"
              title="Clic para desplegar o contraer este pedido"
            >
              <td colspan="12" style="padding: 0.55rem 0.85rem; border-top: 2px solid var(--bevel-dark);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="display: flex; align-items: center; gap: 0.5rem;">
                    <i 
                      class="ph" 
                      :class="isOrderExpanded(group.codigoPedido) ? 'ph-caret-down text-blue' : 'ph-caret-right text-blue'" 
                      style="font-size: 1.1rem; transition: transform 0.2s ease;"
                    ></i>
                    <i class="ph ph-receipt" style="color: #60a5fa; font-size: 1rem;"></i>
                    PEDIDO: <strong style="color: #60a5fa;">{{ group.codigoPedido }}</strong> — {{ group.sucursal }} — {{ formatDate(group.fecha) }}
                  </span>
                  <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="text-xs" style="color: #93c5fd !important; font-size: 0.78rem;">
                      Pedido: <strong>{{ group.totalKgSolicitados.toFixed(3) }} kg</strong> | Enviado: <strong>{{ group.totalKgEnviados.toFixed(3) }} kg</strong>
                    </span>
                    <span class="badge badge-secondary" style="font-size: 0.72rem; font-weight: bold;">
                      {{ group.items.length }} ítems
                    </span>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Renderizado de los Ítems y Subtotal solo si está desplegado -->
            <template v-if="isOrderExpanded(group.codigoPedido)">
              <!-- Filas de Ítems del Pedido -->
              <tr v-for="(item, idx) in group.items" :key="idx">
                <td><strong>{{ formatDate(item.fecha) }}</strong></td>
                <td>{{ item.sucursal }}</td>
                <td><strong>{{ item.codigoProducto }}</strong></td>
                <td>{{ item.nombreProducto }}</td>
                <td class="text-center ">{{ item.piezasPedidas }}</td>
                <td class="text-center ">{{ item.fraccionesPedidas }}</td>
                <td class="text-right text-muted ">
                  {{ item.pesoXPieza > 0 ? `${item.pesoXPieza.toFixed(3)} kg` : '-' }}
                </td>
                <td class="text-right text-muted ">
                  {{ item.kgXBolsita > 0 ? `${item.kgXBolsita.toFixed(3)} kg` : '-' }}
                </td>
                <td class="text-right  text-blue" style="font-size: 0.9rem;">
                  {{ item.kgSolicitados.toFixed(3) }} kg
                </td>
                <td class="text-right " :class="item.kgEnviados > 0 ? 'text-green' : 'text-muted'" style="font-size: 0.9rem;">
                  {{ item.kgEnviados > 0 ? `${item.kgEnviados.toFixed(3)} kg` : '0.000 kg' }}
                </td>
                <!-- Balance = Pedido - Enviado -->
                <td class="text-right " :class="item.balance > 0.001 ? 'text-red' : (item.balance < -0.001 ? 'text-green' : 'text-muted')" style="font-size: 0.9rem;">
                  {{ item.balance > 0 ? `${item.balance.toFixed(3)} kg` : `${(item.balance.toFixed(3))*(-1)} kg` }}
                </td>
                <td class="text-center">
                  <p v-if="item.esSinStock" style="font-size: 0.8rem; color: red;" wrap-content="false">
                    Sin stock
                  </p>
                  <p v-else-if="item.esNoEnvia" style="font-size: 0.8rem; color: orange;" wrap-content="false">
                    No se envió
                  </p>
                <p v-else-if="item.kgEnviados > 0" style="font-size: 0.8rem; color: green;" wrap-content="false">
                    Enviado
                  </p>
                  <p v-else style="font-size: 0.8rem; color: red;" wrap-content="false">
                    No Despachado
                  </p>
                </td>
              </tr>

              <!-- Fila de SUBTOTAL por Pedido -->
              <tr style="background: #f1f5f9; font-weight: 800; border-bottom: 2px solid #cbd5e1; font-size: 0.85rem;">
                <td colspan="4" class="text-right" style="color: #475569; letter-spacing: 0.02em;">
                  SUBTOTAL PEDIDO {{ group.codigoPedido }}:
                </td>
                <td class="text-center text-secondary">{{ group.totalPiezas }}</td>
                <td class="text-center text-secondary">{{ group.totalFracciones }}</td>
                <td></td>
                <td></td>
                <td class="text-right text-blue">{{ group.totalKgSolicitados.toFixed(3) }} kg</td>
                <td class="text-right text-green">{{ group.totalKgEnviados.toFixed(3) }} kg</td>
                <td class="text-right" :class="group.totalBalance > 0.001 ? 'text-red' : (group.totalBalance < -0.001 ? 'text-blue' : 'text-muted')">
                  {{ group.totalBalance > 0 ? `+${group.totalBalance.toFixed(3)} kg` : `${group.totalBalance.toFixed(3)} kg` }}
                </td>
                <td></td>
              </tr>
            </template>
          </tbody>

          <!-- Mensaje cuando no hay registros -->
          <tbody v-if="groupedOrders.length === 0">
            <tr>
              <td colspan="12" class="text-center text-muted" style="padding: 2rem;">
                <i class="ph ph-magnifying-glass" style="font-size: 1.8rem; margin-bottom: 0.5rem; display: block;"></i>
                No se encontraron registros de pedidos para los filtros seleccionados.
              </td>
            </tr>
          </tbody>

          <!-- Totales Generales de la Tabla -->
          <tfoot v-if="groupedOrders.length > 0">
            <tr style="background: #e2e8f0; font-weight: 800; font-size: 0.9rem;">
              <td colspan="8" class="text-right">TOTALES GENERALES:</td>
              <td class="text-right text-blue" style="font-size: 0.95rem;">{{ metrics.totalKgSolicitadosNeto }} kg</td>
              <td class="text-right text-green" style="font-size: 0.95rem;">{{ metrics.totalKgEnviados }} kg</td>
              <td class="text-right text-red" style="font-size: 0.95rem;">{{ metrics.totalBalance }} kg</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as XLSX from 'xlsx'
import Chart from 'chart.js/auto'
import { formatDateDisplay as formatDate } from '../utils/dateFormat'

const loading = ref(false)
const pedidos = ref([])
const sucursales = ref([])
const productosList = ref([])
const productosFullMap = ref({})

const chartUnifiedCanvas = ref(null)
let chartUnifiedInstance = null

const sortKey = ref('fecha')
const sortOrder = ref('desc')

// Conjunto de IDs de pedidos expandidos (por defecto vacío = todos contraídos)
const expandedOrders = ref(new Set())

const alert = ref({
  show: false,
  message: '',
  type: 'success'
})

const filters = ref({
  startDate: '',
  endDate: '',
  sucursal: '',
  productoCodigo: ''
})

const showAlert = (message, type = 'success') => {
  alert.value = { show: true, message, type }
  setTimeout(() => {
    alert.value.show = false
  }, 4000)
}

// Extractor robusto de fecha YYYY-MM-DD sin desfasaje horario
const parseDateToYYYYMMDD = (dateStr) => {
  if (!dateStr) return ''
  const str = String(dateStr).trim()
  
  const matchISO = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (matchISO) {
    return `${matchISO[1]}-${matchISO[2]}-${matchISO[3]}`
  }

  const matchLat = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (matchLat) {
    return `${matchLat[3]}-${matchLat[2]}-${matchLat[1]}`
  }

  try {
    const d = new Date(str)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (e) {
    return ''
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const [pedRes, sucRes, prodRes] = await Promise.all([
      fetch('/api/pedidos'),
      fetch('/api/sucursales'),
      fetch('/api/productos')
    ])

    if (pedRes.ok) {
      pedidos.value = await pedRes.json()
    }
    if (sucRes.ok) {
      sucursales.value = await sucRes.json()
    }
    if (prodRes.ok) {
      const prods = await prodRes.json()
      productosList.value = prods
      const fMap = {}
      prods.forEach(p => {
        fMap[p.codigo] = p
      })
      productosFullMap.value = fMap
    }

    await nextTick()
    renderChart()
  } catch (err) {
    console.error('Error cargando datos del reporte:', err)
    showAlert('Error al conectar con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const resetFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    sucursal: '',
    productoCodigo: ''
  }
}

const setSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'desc'
  }
}

// Funciones para contraer y desplegar pedidos (por defecto todos contraídos)
const toggleOrderExpand = (codigoPedido) => {
  if (expandedOrders.value.has(codigoPedido)) {
    expandedOrders.value.delete(codigoPedido)
  } else {
    expandedOrders.value.add(codigoPedido)
  }
}

const isOrderExpanded = (codigoPedido) => {
  return expandedOrders.value.has(codigoPedido)
}

const expandAllOrders = () => {
  groupedOrders.value.forEach(g => {
    expandedOrders.value.add(g.codigoPedido)
  })
}

const collapseAllOrders = () => {
  expandedOrders.value.clear()
}

// Desglosar cada pedido con cálculo de balance = kgSolicitados - kgEnviados
const allItems = computed(() => {
  const list = []
  pedidos.value.forEach(ped => {
    const fechaISO = parseDateToYYYYMMDD(ped.fecha)
    const sucursal = ped.sucursal || 'Sin Sucursal'
    const codigoPedido = ped.codigo || '-'

    const armadoMap = {}
    if (ped.ArmadoItems && Array.isArray(ped.ArmadoItems)) {
      ped.ArmadoItems.forEach(arm => {
        armadoMap[arm.codigo_producto] = arm
      })
    }

    if (ped.items && Array.isArray(ped.items)) {
      ped.items.forEach(it => {
        const code = it.codigo_producto
        const arm = armadoMap[code]

        const prodObj = productosFullMap.value[code] || it.Producto
        
        let pesoXPieza = 0
        if (prodObj && prodObj.peso_pieza && parseFloat(prodObj.peso_pieza) > 0) {
          pesoXPieza = parseFloat(prodObj.peso_pieza)
        } else if (it.Producto && it.Producto.peso_pieza && parseFloat(it.Producto.peso_pieza) > 0) {
          pesoXPieza = parseFloat(it.Producto.peso_pieza)
        } else {
          pesoXPieza = 1
        }

        let kgXBolsita = 0
        if (prodObj && prodObj.peso_fraccion && parseFloat(prodObj.peso_fraccion) > 0) {
          kgXBolsita = parseFloat(prodObj.peso_fraccion)
        } else if (it.Producto && it.Producto.peso_fraccion && parseFloat(it.Producto.peso_fraccion) > 0) {
          kgXBolsita = parseFloat(it.Producto.peso_fraccion)
        } else {
          kgXBolsita = pesoXPieza
        }

        const piezasPedidas = Number(it.pieza || 0)
        const fraccionesPedidas = Number(it.fraccion || 0)

        // FÓRMULA DE CONVERSIÓN: (piezas * peso_pieza) + (fracciones * peso_fraccion)
        const kgPiezas = piezasPedidas * pesoXPieza
        const kgFracciones = fraccionesPedidas * kgXBolsita
        const kgSolicitados = kgPiezas + kgFracciones

        // Lo Enviado (Kg Real de peso_enviado)
        let kgEnviados = 0
        let estadoArmado = 'Pendiente'
        let esSinStock = Boolean(it.sin_stock || (arm && arm.sin_stock))
        let esNoEnvia = Boolean(it.no_envia || (arm && arm.no_envia))

        if (esSinStock) {
          estadoArmado = 'Sin Stock'
          kgEnviados = 0
        } else if (esNoEnvia) {
          estadoArmado = 'No Envía'
          kgEnviados = 0
        } else if (it.peso_enviado > 0) {
          kgEnviados = Number(it.peso_enviado)
          estadoArmado = 'Enviado'
        } else if (arm && (Number(arm.peso || 0) + Number(arm.fraccion || 0)) > 0) {
          kgEnviados = Number(arm.peso || 0) + Number(arm.fraccion || 0)
          estadoArmado = 'Enviado'
        } else {
          kgEnviados = 0
          estadoArmado = 'No Despachado'
        }

        const balance = kgSolicitados - kgEnviados

        list.push({
          fecha: fechaISO,
          codigoPedido,
          sucursal,
          codigoProducto: code,
          nombreProducto: it.Producto?.nombre || prodObj?.nombre || 'Insumo N/A',
          piezasPedidas,
          fraccionesPedidas,
          pesoXPieza,
          kgXBolsita,
          kgSolicitados,
          kgEnviados,
          balance,
          estadoArmado,
          esSinStock,
          esNoEnvia
        })
      })
    }
  })
  return list
})

// Catálogo dinámico de productos
const availableProducts = computed(() => {
  const map = {}
  productosList.value.forEach(p => {
    map[p.codigo] = p.nombre
  })
  allItems.value.forEach(it => {
    if (it.codigoProducto && !map[it.codigoProducto]) {
      map[it.codigoProducto] = it.nombreProducto
    }
  })
  return Object.keys(map).map(code => ({
    codigo: code,
    nombre: map[code]
  })).sort((a, b) => a.nombre.localeCompare(b.nombre))
})

// Filtrado de ítems
const filteredItems = computed(() => {
  const startDateStr = parseDateToYYYYMMDD(filters.value.startDate)
  const endDateStr = parseDateToYYYYMMDD(filters.value.endDate)

  return allItems.value.filter(item => {
    if (filters.value.sucursal && item.sucursal !== filters.value.sucursal) {
      return false
    }

    if (filters.value.productoCodigo && item.codigoProducto !== filters.value.productoCodigo) {
      return false
    }

    if (startDateStr && item.fecha < startDateStr) {
      return false
    }

    if (endDateStr && item.fecha > endDateStr) {
      return false
    }

    return true
  })
})

// Ordenamiento dinámico por la cabecera seleccionada
const sortedItems = computed(() => {
  const items = [...filteredItems.value]
  const key = sortKey.value
  const order = sortOrder.value === 'asc' ? 1 : -1

  return items.sort((a, b) => {
    let valA = a[key]
    let valB = b[key]

    if (valA === undefined || valA === null) valA = ''
    if (valB === undefined || valB === null) valB = ''

    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * order
    }

    return String(valA).localeCompare(String(valB), 'es', { numeric: true }) * order
  })
})

// Agrupamiento por Pedido con Subtotales por cada Pedido
const groupedOrders = computed(() => {
  const groups = []
  const orderMap = {}

  sortedItems.value.forEach(item => {
    const key = item.codigoPedido || 'Sin Código'
    if (!orderMap[key]) {
      orderMap[key] = {
        codigoPedido: key,
        fecha: item.fecha,
        sucursal: item.sucursal,
        items: [],
        totalPiezas: 0,
        totalFracciones: 0,
        totalKgSolicitados: 0,
        totalKgEnviados: 0,
        totalBalance: 0
      }
      groups.push(orderMap[key])
    }

    orderMap[key].items.push(item)
    orderMap[key].totalPiezas += item.piezasPedidas
    orderMap[key].totalFracciones += item.fraccionesPedidas
    orderMap[key].totalKgSolicitados += item.kgSolicitados
    orderMap[key].totalKgEnviados += item.kgEnviados
    orderMap[key].totalBalance += item.balance
  })

  return groups
})

// Agrupamiento unificado por fecha para las 3 series (Línea Azul: Pedidos Netos descontando Sin Stock)
const unifiedChartData = computed(() => {
  const mapPedidosNetos = {}
  const mapEnviados = {}
  const mapSinStock = {}
  const allDatesSet = new Set()

  filteredItems.value.forEach(it => {
    if (!it.fecha) return
    allDatesSet.add(it.fecha)

    if (!mapPedidosNetos[it.fecha]) mapPedidosNetos[it.fecha] = 0
    if (!mapEnviados[it.fecha]) mapEnviados[it.fecha] = 0
    if (!mapSinStock[it.fecha]) mapSinStock[it.fecha] = 0

    // Si NO es sin stock, se suma a la línea azul de Pedidos Netos
    if (!it.esSinStock) {
      mapPedidosNetos[it.fecha] += it.kgSolicitados
    }

    // Línea Verde: Enviados
    mapEnviados[it.fecha] += it.kgEnviados

    // Línea Roja: Sin Stock
    if (it.esSinStock) {
      mapSinStock[it.fecha] += it.kgSolicitados
    }
  })

  const dates = Array.from(allDatesSet).sort()
  const valuesPedidosNetos = dates.map(d => Number((mapPedidosNetos[d] || 0).toFixed(3)))
  const valuesEnviados = dates.map(d => Number((mapEnviados[d] || 0).toFixed(3)))
  const valuesSinStock = dates.map(d => Number((mapSinStock[d] || 0).toFixed(3)))

  return { dates, valuesPedidos: valuesPedidosNetos, valuesEnviados, valuesSinStock }
})

// Métricas KPI
const metrics = computed(() => {
  const items = filteredItems.value
  let totalKgSolicitadosBruto = 0
  let totalKgSolicitadosNeto = 0
  let totalKgEnviados = 0
  let totalKgSinStock = 0
  let sinStockCount = 0
  let noEnviaCount = 0
  const uniqueOrders = new Set()
  const uniqueDays = new Set()

  items.forEach(it => {
    totalKgSolicitadosBruto += it.kgSolicitados
    if (it.esSinStock) {
      sinStockCount++
      totalKgSinStock += it.kgSolicitados
    } else {
      totalKgSolicitadosNeto += it.kgSolicitados
    }
    if (it.esNoEnvia) noEnviaCount++
    totalKgEnviados += it.kgEnviados
    uniqueOrders.add(it.codigoPedido)
    if (it.fecha) uniqueDays.add(it.fecha)
  })

  const ordersCount = uniqueOrders.size
  const daysCount = uniqueDays.size
  const itemsCount = items.length

  const totalBalance = (totalKgSolicitadosNeto - totalKgEnviados).toFixed(2)

  return {
    totalKgSolicitadosBruto: totalKgSolicitadosBruto.toFixed(2),
    totalKgSolicitadosNeto: totalKgSolicitadosNeto.toFixed(2),
    totalKgEnviados: totalKgEnviados.toFixed(2),
    totalKgSinStock: totalKgSinStock.toFixed(2),
    totalBalance,
    sinStockCount,
    noEnviaCount,
    ordersCount,
    daysCount,
    itemsCount
  }
})

// Renderizado del Gráfico Lineal de Pedidos (Chart.js)
const renderChart = () => {
  if (!chartUnifiedCanvas.value) return
  if (chartUnifiedInstance) chartUnifiedInstance.destroy()

  const { dates, valuesPedidos, valuesEnviados, valuesSinStock } = unifiedChartData.value
  const formattedDates = dates.map(d => formatDate(d))
  const ctx = chartUnifiedCanvas.value.getContext('2d')

  chartUnifiedInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: formattedDates.length > 0 ? formattedDates : ['Sin datos'],
      datasets: [
        {
          label: 'Kg Pedidos',
          data: formattedDates.length > 0 ? valuesPedidos : [0],
          borderColor: 'rgb(37, 99, 235)',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.25,
          pointRadius: 4,
          pointBackgroundColor: '#1d4ed8',
          pointHoverRadius: 6
        },
        {
          label: 'Kg Enviados',
          data: formattedDates.length > 0 ? valuesEnviados : [0],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.25,
          pointRadius: 4,
          pointBackgroundColor: '#047857',
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
            font: { family: 'Inter', weight: 'bold', size: 12 },
            boxWidth: 16,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} kg`
          }
        }
      },
      scales: {
        x: {
          title: { 
            display: true, 
            text: 'Fechas', 
            font: { family: 'Inter', weight: 'bold', size: 12 },
            color: '#475569'
          },
          grid: { color: 'rgba(203, 213, 225, 0.5)' }
        },
        y: {
          beginAtZero: true,
          title: { 
            display: true, 
            text: 'Kilogramos (kg)', 
            font: { family: 'Inter', weight: 'bold', size: 12 },
            color: '#475569'
          },
          grid: { color: 'rgba(203, 213, 225, 0.5)' }
        }
      }
    }
  })
}

// Watcher para actualizar el gráfico unificado
watch([filteredItems], async () => {
  await nextTick()
  renderChart()
})

const exportToExcel = () => {
  try {
    const workbook = XLSX.utils.book_new()
    const exportData = []

    groupedOrders.value.forEach(group => {
      group.items.forEach(it => {
        exportData.push({
          'Código Pedido': group.codigoPedido,
          'Fecha': formatDate(it.fecha),
          'Sucursal': it.sucursal,
          'Cod.': it.codigoProducto,
          'Producto': it.nombreProducto,
          'Piezas': it.piezasPedidas,
          'Fracciones': it.fraccionesPedidas,
          'Kg x Pieza': Number(it.pesoXPieza.toFixed(3)),
          'Kg x Fracc': Number(it.kgXBolsita.toFixed(3)),
          'Kg Pedido': Number(it.kgSolicitados.toFixed(3)),
          'Kg Enviado': Number(it.kgEnviados.toFixed(3)),
          'Balance': Number(it.balance.toFixed(3)),
          'Estado': it.esSinStock ? 'Sin Stock (S/S)' : (it.esNoEnvia ? 'No Envía (N/E)' : (it.kgEnviados > 0 ? 'Enviado' : 'No Despachado'))
        })
      })

      // Fila Subtotal de Excel
      exportData.push({
        'Código Pedido': `SUBTOTAL ${group.codigoPedido}`,
        'Fecha': '-',
        'Sucursal': group.sucursal,
        'Cod.': '-',
        'Producto': `Subtotal (${group.items.length} ítems)`,
        'Piezas': group.totalPiezas,
        'Fracciones': group.totalFracciones,
        'Kg x Pieza': '-',
        'Kg x Fracc': '-',
        'Kg Pedido': Number(group.totalKgSolicitados.toFixed(3)),
        'Kg Enviado': Number(group.totalKgEnviados.toFixed(3)),
        'Balance': Number(group.totalBalance.toFixed(3)),
        'Estado': '-'
      })
    })

    // Totales Generales de Excel
    exportData.push({
      'Código Pedido': 'TOTALES GENERALES',
      'Fecha': '-',
      'Sucursal': '-',
      'Cod.': '-',
      'Producto': '-',
      'Piezas': '-',
      'Fracciones': '-',
      'Kg x Pieza': '-',
      'Kg x Fracc': '-',
      'Kg Pedido': Number(metrics.value.totalKgSolicitadosNeto),
      'Kg Enviado': Number(metrics.value.totalKgEnviados),
      'Balance': Number(metrics.value.totalBalance),
      'Estado': '-'
    })

    const sheet = XLSX.utils.json_to_sheet(exportData)
    XLSX.utils.book_append_sheet(workbook, sheet, 'Detalle Pedidos Agrupados')
    XLSX.writeFile(workbook, `Reporte_Detalle_Pedidos_${new Date().toISOString().split('T')[0]}.xlsx`)
    showAlert('Reporte agrupado exportado a Excel con éxito')
  } catch (err) {
    console.error('Error al exportar Excel:', err)
    showAlert('Error al generar el archivo Excel', 'error')
  }
}

const printReport = () => {
  window.print()
}
</script>

<style scoped>
.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}
.sortable-header:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
