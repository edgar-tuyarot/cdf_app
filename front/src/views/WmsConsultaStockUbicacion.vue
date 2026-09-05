<template>
  <div class="page-container animate-fade" style="padding: 1rem; max-width: 1400px; margin: 0 auto;">
    
    <!-- Encabezado de la Pantalla -->
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h2 class="page-title" style="margin: 0; font-size: 1.4rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
          <i class="ph ph-buildings" style="color: var(--accent-primary); font-size: 1.6rem;"></i>
          Stock Sucursales (Block WMS)
        </h2>
        <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
          Consulte el stock físico consolidado de un producto específico en todas las sucursales y depósitos.
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <button 
          v-if="reportData && reportData.items && reportData.items.length > 0" 
          class="win-dialog-btn win-dialog-btn-ok" 
          @click="exportarExcel"
          style="display: flex; align-items: center; gap: 0.35rem; font-weight: 800;"
        >
          <i class="ph ph-file-xls"></i> Exportar a Excel
        </button>
      </div>
    </div>

    <!-- Formulario de Consulta por Código de Producto -->
    <div class="card" style="padding: 1.25rem; border: 2px solid var(--bevel-dark); background: var(--bg-window); margin-bottom: 1.25rem;">
      <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.35rem;">
        <i class="ph ph-magnifying-glass"></i> Ingrese el producto a consultar
      </div>

      <form @submit.prevent="consultarStockSucursales" style="display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 280px;">
          <label style="font-size: 0.82rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.35rem;">
            Código de Producto / SKU o Nombre del Producto *
          </label>
          <div style="position: relative; display: flex; align-items: center;">
            <input 
              type="text" 
              v-model="codigoProducto" 
              placeholder="Ej: 1218, 1866, Muzzarella..." 
              class="form-control" 
              style="font-size: 0.95rem; font-weight: bold; height: 40px; border: 1.5px solid var(--bevel-dark);"
              :disabled="loading"
              ref="inputCodigo"
              autofocus
            />
            <button 
              v-if="codigoProducto" 
              type="button" 
              @click="limpiarBusqueda" 
              style="position: absolute; right: 0.6rem; background: none; border: none; cursor: pointer; color: var(--text-muted);"
            >
              <i class="ph ph-x-circle" style="font-size: 1.2rem;"></i>
            </button>
          </div>
        </div>

        <div style="width: 200px;">
          <button 
            type="submit" 
            class="win-dialog-btn win-dialog-btn-ok" 
            :disabled="loading"
            style="width: 100%; height: 40px; font-weight: 800; font-size: 0.92rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem;"
          >
            <i class="ph ph-magnifying-glass" v-if="!loading"></i>
            <i class="ph ph-spinner spinner" v-else></i>
            Buscar en Sucursales
          </button>
        </div>
      </form>
    </div>

    <!-- Indicador de Carga -->
    <div v-if="loading" style="text-align: center; padding: 3rem; background: var(--bg-window); border: 2px solid var(--bevel-dark); margin-bottom: 1.25rem;">
      <i class="ph ph-spinner spinner" style="font-size: 3rem; color: var(--accent-primary); margin-bottom: 0.75rem;"></i>
      <h3 style="margin: 0; font-size: 1.1rem; font-weight: bold; color: var(--text-primary);">Buscando "{{ codigoProducto }}" en todas las sucursales...</h3>
      <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-muted);">
        Ejecutando consolidado de existencias en Block WMS
      </p>
    </div>

    <!-- Mensaje de Error -->
    <div v-else-if="errorMessage" class="card" style="padding: 1.25rem; border: 2px solid #ef4444; background: #fef2f2; margin-bottom: 1.25rem; color: #991b1b;">
      <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 800; font-size: 1rem; margin-bottom: 0.35rem;">
        <i class="ph ph-warning-circle" style="font-size: 1.4rem;"></i> Atencion
      </div>
      <p style="margin: 0; font-size: 0.9rem;">{{ errorMessage }}</p>
    </div>

    <!-- Resultados -->
    <template v-else-if="reportData">
      
      <!-- Resumen KPI -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem;">
        
        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block;">
            Sucursales con Existencias
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: var(--accent-primary);">
            {{ reportData.totalSucursales || 0 }} depósitos
          </span>
        </div>

        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block;">
            Stock Total Consolidado
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: #16a34a;">
            {{ (reportData.totalStock || 0).toFixed(3) }} kg / un
          </span>
        </div>
      </div>

      <!-- Filtro Rápido en Pantalla -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
        <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-secondary);">
          Mostrando {{ filteredItems.length }} registros de sucursales
        </div>
        <div style="width: 260px;">
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="Filtrar sucursal..." 
            class="form-control" 
            style="font-size: 0.85rem; font-weight: 600; height: 34px; border: 1.5px solid var(--bevel-dark);"
          />
        </div>
      </div>

      <!-- Tabla Principal: Sucursal, Código, Nombre y Stock -->
      <div class="table-container" style="border: 2px solid var(--bevel-dark); background: var(--bg-window); overflow-x: auto;">
        <table class="win-table" style="width: 100%; border-collapse: collapse; font-family: 'Nunito', sans-serif;">
          <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--bevel-dark); font-size: 0.82rem; text-transform: uppercase;">
              <th style="padding: 0.65rem 0.85rem; text-align: left; width: 35%;">Sucursal</th>
              <th style="padding: 0.65rem 0.85rem; text-align: center; width: 15%;">Código</th>
              <th style="padding: 0.65rem 0.85rem; text-align: left; width: 35%;">Nombre</th>
              <th style="padding: 0.65rem 0.85rem; text-align: right; width: 15%;">Stock</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in filteredItems" 
              :key="item.id"
              style="border-bottom: 1.5px solid var(--bevel-dark); font-size: 0.9rem;"
            >
              <!-- 1. Sucursal -->
              <td style="padding: 0.65rem 0.85rem; font-weight: 800; color: var(--text-primary);">
                <i class="ph ph-storefront" style="color: var(--accent-primary); margin-right: 0.35rem;"></i>
                {{ item.sucursal }}
              </td>

              <!-- 2. Código -->
              <td style="padding: 0.65rem 0.85rem; text-align: center; font-family: monospace; font-weight: 800; color: var(--accent-primary); font-size: 0.95rem;">
                {{ item.codigo }}
              </td>

              <!-- 3. Nombre -->
              <td style="padding: 0.65rem 0.85rem; font-weight: 700; color: var(--text-primary);">
                {{ item.nombre }}
              </td>

              <!-- 4. Stock -->
              <td style="padding: 0.65rem 0.85rem; text-align: right; font-weight: 800; font-size: 1rem; color: #16a34a;">
                {{ item.stock.toFixed(3) }}
              </td>
            </tr>

            <tr v-if="filteredItems.length === 0">
              <td colspan="4" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                <i class="ph ph-package" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; opacity: 0.4;"></i>
                No se encontraron existencias en sucursales para el producto "{{ codigoProducto }}".
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Estado Inicial sin búsqueda -->
    <div v-else-if="!reportData && !loading" class="card p-5 text-center" style="border: 2px solid var(--bevel-dark); background: var(--bg-window); padding: 3rem 1.5rem;">
      <i class="ph ph-magnifying-glass" style="font-size: 3rem; color: var(--text-muted); opacity: 0.5;"></i>
      <h3 style="margin: 0.75rem 0 0.25rem 0; font-weight: 800; color: var(--text-primary);">Ingrese un Producto para Consultar</h3>
      <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">
        Escriba el código de producto (SKU) o nombre en el campo superior y presione <strong>"Buscar en Sucursales"</strong> para ver el stock por depósito.
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

const codigoProducto = ref('')
const loading = ref(false)
const errorMessage = ref('')
const reportData = ref(null)
const searchTerm = ref('')
const inputCodigo = ref(null)

const consultarStockSucursales = async () => {
  if (!codigoProducto.value.trim()) {
    errorMessage.value = 'Por favor, ingrese un código de producto (SKU) o nombre para realizar la búsqueda.'
    reportData.value = null
    return
  }

  loading.value = true
  errorMessage.value = ''
  reportData.value = null

  try {
    const res = await fetch('/api/wms/stock-sucursales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigoProducto: codigoProducto.value.trim()
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Error ${res.status} al consultar Block WMS`)
    }

    const data = await res.json()
    reportData.value = data
  } catch (err) {
    console.error('Error al consultar stock por sucursales:', err)
    errorMessage.value = err.message || 'Error al conectar con Block WMS.'
  } finally {
    loading.value = false
  }
}

const limpiarBusqueda = () => {
  codigoProducto.value = ''
  reportData.value = null
  errorMessage.value = ''
  searchTerm.value = ''
}

const filteredItems = computed(() => {
  if (!reportData.value || !reportData.value.items) return []
  if (!searchTerm.value.trim()) return reportData.value.items

  const q = searchTerm.value.trim().toLowerCase()
  return reportData.value.items.filter(i => 
    String(i.sucursal).toLowerCase().includes(q) ||
    String(i.codigo).toLowerCase().includes(q) ||
    String(i.nombre).toLowerCase().includes(q)
  )
})

const exportarExcel = () => {
  if (!reportData.value || !reportData.value.items || reportData.value.items.length === 0) return

  const rows = filteredItems.value.map(i => ({
    'Sucursal': i.sucursal,
    'Código': i.codigo,
    'Nombre': i.nombre,
    'Stock (kg/un)': i.stock
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Stock Sucursales')
  XLSX.writeFile(wb, `Stock_Sucursales_${codigoProducto.value.trim()}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
</script>

<style scoped>
.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
