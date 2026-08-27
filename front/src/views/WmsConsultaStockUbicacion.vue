<template>
  <div class="page-container animate-fade">
    <!-- Encabezado -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-buildings"></i> Consulta de Stock por Ubicación / Sucursal WMS
        </h2>
        <p class="page-description">
          Consulte el inventario y las existencias físicas en tiempo real de cualquier sucursal o depósito registrado en BlockWMS.
        </p>
      </div>
      <div class="header-actions">
        <button 
          class="btn btn-secondary" 
          style="background: #1a7f37; color: #fff; border: 1px solid #15692e; display: flex; align-items: center; gap: 0.3rem;"
          @click="exportToExcel"
          :disabled="loadingStock || !stockReport || filteredProductos.length === 0"
        >
          <i class="ph ph-file-xls"></i> Exportar a Excel
        </button>
      </div>
    </div>

    <!-- Barra de Selección de Ubicación y Filtros -->
    <div class="card mb-4">
      <div class="card-body" style="padding: 1rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; align-items: flex-end;">
          
          <!-- Selector de Ubicación / Site -->
          <div class="form-group mb-0">
            <label class="form-label-compact">
              <i class="ph ph-map-pin"></i> Seleccionar Ubicación / Depósito BlockWMS *
            </label>
            <div style="position: relative;">
              <select 
                v-model="selectedSiteId" 
                @change="cargarStockSite" 
                class="form-control-compact"
                style="height: 38px; font-weight: bold; font-size: 0.95rem; background-color: var(--bg-window); color: var(--text-primary);"
                :disabled="loadingSites || loadingStock"
              >
                <option value="" disabled>-- Seleccione una Ubicación --</option>
                <option v-for="s in sites" :key="s.siteId" :value="s.siteId">
                  🏢 {{ s.nombre }} {{ s.razonSocial && s.razonSocial !== s.nombre ? `(${s.razonSocial})` : '' }} [ID: {{ s.siteId }}]
                </option>
              </select>
            </div>
          </div>

          <!-- Buscador de Productos -->
          <div class="form-group mb-0">
            <label class="form-label-compact">
              <i class="ph ph-magnifying-glass"></i> Buscar en la Ubicación
            </label>
            <div style="position: relative; display: flex; align-items: center;">
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Código SKU o Nombre de producto..." 
                class="form-control-compact"
                style="height: 38px; padding-right: 2rem;"
                :disabled="!selectedSiteId || loadingStock"
              />
              <button 
                v-if="searchQuery" 
                @click="searchQuery = ''" 
                style="position: absolute; right: 0.5rem; background: none; border: none; cursor: pointer; color: var(--text-muted);"
              >
                <i class="ph ph-x-circle"></i>
              </button>
            </div>
          </div>

          <!-- Botón de Recargar -->
          <div>
            <button 
              class="btn btn-primary" 
              style="height: 38px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.3rem;"
              @click="cargarStockSite"
              :disabled="!selectedSiteId || loadingStock"
            >
              <i class="ph ph-spinner spinner" v-if="loadingStock"></i>
              <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Inventario
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- Indicador de Carga -->
    <div v-if="loadingStock" class="card p-5 text-center mb-4">
      <i class="ph ph-spinner spinner" style="font-size: 2.5rem; color: var(--accent-primary);"></i>
      <p class="mt-3 text-muted" style="font-weight: bold;">Consultando inventario en tiempo real para la ubicación seleccionada...</p>
    </div>

    <!-- Tarjetas Resumen -->
    <div v-if="stockReport && !loadingStock" class="grid-cards mb-4" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
      <div class="card p-3" style="border-left: 4px solid #0284c7;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">Ubicación Consultada</div>
        <div style="font-size: 1.1rem; font-weight: bold; color: var(--text-primary);" class="mt-1">
          {{ selectedSiteNombre }}
        </div>
      </div>

      <div class="card p-3" style="border-left: 4px solid #16a34a;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">Total SKUs con Stock</div>
        <div style="font-size: 1.4rem; font-weight: bold; color: #16a34a;" class="mt-1">
          {{ stockReport.totalSkus || 0 }} productos
        </div>
      </div>

      <div class="card p-3" style="border-left: 4px solid #8b5cf6;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">Total Acumulado en Ubicación</div>
        <div style="font-size: 1.4rem; font-weight: bold; color: #8b5cf6;" class="mt-1">
          {{ formatNumber(stockReport.totalKilos) }} kg / un
        </div>
      </div>
    </div>

    <!-- Tabla de Existencias -->
    <div v-if="stockReport && !loadingStock" class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
        <span class="card-title">
          Existencias Físicas en {{ selectedSiteNombre }} ({{ filteredProductos.length }} de {{ stockReport.totalSkus }})
        </span>
      </div>

      <div class="card-body p-0">
        <div style="overflow-x: auto;">
          <table class="table table-striped table-hover mb-0" style="font-size: 0.9rem;">
            <thead>
              <tr style="background-color: var(--bg-secondary);">
                <th style="width: 15%;">Código SKU</th>
                <th style="width: 50%;">Producto / Descripción BlockWMS</th>
                <th style="width: 15%;">ID Pres.</th>
                <th style="width: 20%; text-align: right;">Stock Físico Real</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredProductos" :key="p.codigo">
                <td>
                  <span class="badge badge-secondary" style="font-family: monospace; font-size: 0.9rem; font-weight: bold;">
                    {{ p.codigo }}
                  </span>
                </td>
                <td>
                  <strong>{{ p.nombre }}</strong>
                </td>
                <td>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">
                    {{ p.id_productos_presentaciones || '-' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <span 
                    class="badge" 
                    style="font-size: 0.95rem; font-weight: bold; padding: 0.3rem 0.6rem;"
                    :style="p.stockFisico > 0 ? 'background-color: #dcfce7; color: #15803d; border: 1px solid #86efac;' : 'background-color: #f1f5f9; color: #64748b;'"
                  >
                    {{ formatNumber(p.stockFisico) }} kg/un
                  </span>
                </td>
              </tr>
              <tr v-if="filteredProductos.length === 0">
                <td colspan="4" class="text-center text-muted py-4">
                  <i class="ph ph-circle-wavy-warning" style="font-size: 1.5rem;"></i><br>
                  No se encontraron productos que coincidan con la búsqueda.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Estado Inicial Sin Selección -->
    <div v-if="!selectedSiteId && !loadingStock" class="card p-5 text-center">
      <i class="ph ph-buildings" style="font-size: 3rem; color: var(--text-muted);"></i>
      <h3 class="mt-3" style="font-weight: bold; color: var(--text-primary);">Seleccione una Ubicación</h3>
      <p class="text-muted">Elija un depósito o sucursal del selector superior para consultar el inventario físico en tiempo real.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'

const sites = ref([])
const selectedSiteId = ref('')
const loadingSites = ref(false)
const loadingStock = ref(false)
const stockReport = ref(null)
const searchQuery = ref('')

const selectedSiteNombre = computed(() => {
  const found = sites.value.find(s => s.siteId === selectedSiteId.value)
  return found ? found.nombre : selectedSiteId.value
})

const filteredProductos = computed(() => {
  if (!stockReport.value || !stockReport.value.productos) return []
  let list = stockReport.value.productos

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(p => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
  }

  return list
})

const formatNumber = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0.00'
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(val)
}

const getWmsHeaders = () => {
  const savedSession = localStorage.getItem('wms_session')
  if (!savedSession) return {}
  try {
    const sess = JSON.parse(savedSession)
    if (sess.sessionId) {
      return {
        'X-WMS-Session-Id': sess.sessionId,
        'X-WMS-Site-Id': sess.siteId || '194326',
        'X-WMS-Host': sess.host || 'http://192.168.10.2'
      }
    }
  } catch (e) {}
  return {}
}

const cargarSites = async () => {
  loadingSites.value = true
  try {
    const res = await fetch('/api/wms/sites', { headers: getWmsHeaders() })
    const data = await res.json()
    if (data.ok && data.sites) {
      sites.value = data.sites
      // Si existe DEPOT 026 (194326), seleccionarla por defecto
      const defaultSite = sites.value.find(s => s.siteId === '194326') || sites.value[0]
      if (defaultSite) {
        selectedSiteId.value = defaultSite.siteId
        await cargarStockSite()
      }
    }
  } catch (err) {
    console.error('Error al cargar sites de WMS:', err)
  } finally {
    loadingSites.value = false
  }
}

const cargarStockSite = async () => {
  if (!selectedSiteId.value) return
  loadingStock.value = true
  stockReport.value = null
  try {
    const res = await fetch(`/api/wms/stock-site/${selectedSiteId.value}`, { headers: getWmsHeaders() })
    const data = await res.json()
    if (data.ok) {
      stockReport.value = data
    } else {
      throw new Error(data.error || 'Error al consultar stock.')
    }
  } catch (err) {
    console.error('Error al cargar stock del site:', err)
  } finally {
    loadingStock.value = false
  }
}

const exportToExcel = () => {
  if (!stockReport.value || filteredProductos.value.length === 0) return

  const rows = filteredProductos.value.map(p => ({
    'Código SKU': p.codigo,
    'Descripción / Producto': p.nombre,
    'ID Presentación': p.id_productos_presentaciones,
    'Stock Físico (kg/un)': p.stockFisico
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Ubicación')

  const filename = `Stock_WMS_${selectedSiteNombre.value.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, filename)
}

onMounted(() => {
  cargarSites()
})
</script>

<style scoped>
.form-label-compact {
  font-size: 0.82rem;
  font-weight: bold;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
  display: block;
}
.form-control-compact {
  width: 100%;
  padding: 0.35rem 0.6rem;
  font-size: 0.88rem;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 4px;
}
</style>
