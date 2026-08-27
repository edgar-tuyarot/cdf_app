<template>
  <div class="page-container animate-fade">
    <!-- CABECERA DE LA PÁGINA -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Historial de Ingresos de Mercadería</h2>
        <p class="page-description">Consulta y auditoría de todos los ingresos de mercadería cargados desde proveedores y sucursales.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-primary" @click="$router.push('/ingresos')">
          <i class="ph ph-plus-circle"></i> Cargar Nuevo Ingreso
        </button>
        <button class="btn btn-secondary" @click="fetchHistorialData" :disabled="loadingData">
          <i class="ph ph-spinner spinner" v-if="loadingData"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Historial
        </button>
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

    <!-- CARD PRINCIPAL DE BÚSQUEDA Y FILTROS -->
    <div class="card mb-4" style="padding: 0.85rem 1rem; background: var(--bg-window); border-radius: 0; border: 1px solid var(--bevel-light);">
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; justify-content: space-between;">
        <!-- Buscador -->
        <div style="position: relative; flex: 1; min-width: 260px;">
          <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1.1rem; pointer-events: none;"></i>
          <input 
            type="text" 
            v-model="searchHistorialQuery" 
            class="form-control" 
            placeholder="Buscar por producto, código, comprobante o proveedor..." 
            style="padding-left: 2.3rem; height: 36px; font-weight: 600;"
          />
          <button 
            v-if="searchHistorialQuery" 
            @click="searchHistorialQuery = ''" 
            style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted);"
          >
            <i class="ph ph-x-circle"></i>
          </button>
        </div>

        <!-- Selector de Origen -->

      </div>
    </div>

    <!-- TABLA LIBRE COMPLETA (SIN BARRA DE DESPLAZAMIENTO INTERNA) -->
    <div class="table-header-info mb-2" style="display: flex; justify-content: space-between; align-items: center;">
      <h4 style="font-size: 0.95rem; font-weight: 700; margin: 0;">
        <i class="ph ph-list-checks text-accent"></i> Historial Detallado de Ingresos ({{ historialFiltrado.length }})
      </h4>
      <span class="text-xs text-muted fw-bold">
        Mostrando {{ historialFiltrado.length }} de {{ historialIngresos.length }} registros
      </span>
    </div>

    <div class="table-container" style="border: 1px solid var(--bevel-dark); border-radius: 0;">
      <table class="access-table" style="width: 100%; border-collapse: collapse;">
        <thead style="background: var(--bg-window);">
          <tr>
            <th style="width: 150px;">Fecha</th>
            <th style="min-width: 180px;">Proveedor</th>
            <th style="width: 130px;">Comprobante</th>
            <th style="width: 100px;">Código</th>
            <th style="min-width: 220px;">Producto</th>
            <th style="width: 70px;" class="text-right">Cajas</th>
            <th style="width: 80px;" class="text-right">Piezas</th>
            <th style="width: 110px;" class="text-right">Kg</th>
            <th style="width: 140px;">Venc.</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loadingData">
            <td colspan="10" class="text-center p-4">
              <i class="ph ph-spinner spinner icon-lg text-muted"></i>
              <p class="text-muted mt-2">Cargando historial de ingresos...</p>
            </td>
          </tr>
          <tr v-else-if="historialFiltrado.length === 0">
            <td colspan="10" class="text-center p-5">
              <i class="ph ph-receipt icon-xl text-muted mb-2" style="font-size: 2.2rem;"></i>
              <h5 class="fw-bold text-muted mb-1">No se encontraron ingresos de mercadería</h5>
              <p class="text-xs text-muted mb-0">Pruebe modificando los términos de búsqueda o filtros seleccionados.</p>
            </td>
          </tr>
          <tr v-else v-for="item in historialFiltrado" :key="item.id" class="confirmed-row">
            <td style="font-size: 0.82rem; font-family: monospace; white-space: nowrap;">
              {{ formatDate(item.fecha) }}
            </td>
            <td style="font-size: 0.82rem; font-family: monospace; white-space: nowrap;">
              {{ item.origenNombre }}
            </td>
            <td style="font-size: 0.82rem; font-family: monospace; white-space: nowrap;">
              {{ item.factura }}
            </td>
            <td style="font-size: 0.82rem; font-family: monospace; white-space: nowrap;">
              {{ item.codigo_producto }}
            </td>
             <td style="font-size: 0.82rem; font-family: monospace; white-space: nowrap;">
              {{ item.producto_nombre }}
            </td>
            <td class="text-right fw-bold">{{ item.cajas }}</td>
            <td class="text-right fw-bold text-blue">{{ item.piezas }}</td>
            <td class="text-right fw-bold text-green">
              {{ item.peso.toFixed(3) }} kg
            </td>
            <td style="font-size: 0.82rem; font-family: monospace; white-space: nowrap;">
              {{ formatVencimientoDate(item.vencimiento) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const historialIngresos = ref([])
const loadingData = ref(false)
const searchHistorialQuery = ref('')
const filterOrigenHistorial = ref('ALL') // 'ALL' | 'PROVEEDOR' | 'SUCURSAL'

// Alertas
const alert = ref({ show: false, message: '', type: 'success' })
const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3500)
}

// Cargar Historial
const fetchHistorialData = async () => {
  loadingData.value = true
  try {
    const [resHistProv, resHistSuc] = await Promise.all([
      fetch('/api/productos/ingresos-proveedores'),
      fetch('/api/ingresos-sucursales')
    ])

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
    console.error('Error fetching historial:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loadingData.value = false
  }
}

// Filtros
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

const formatVencimientoDate = (dateStr) => {
  if (!dateStr || dateStr === '-') return '-'
  try {
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-')
      return `${day}-${month}-${year}`
    }
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
      const [year, month, day] = dateStr.substring(0, 10).split('-')
      return `${day}-${month}-${year}`
    }
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  } catch (e) {
    return dateStr
  }
}

onMounted(() => {
  fetchHistorialData()
})
</script>

<style scoped>
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
</style>
