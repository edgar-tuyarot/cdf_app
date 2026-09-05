<template>
  <div class="page-container" style="padding: 1rem; max-width: 1400px; margin: 0 auto;">
    
    <!-- Encabezado de la Pantalla -->
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h2 class="page-title" style="margin: 0; font-size: 1.4rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
          <i class="ph ph-warning-octagon" style="color: var(--accent-primary); font-size: 1.6rem;"></i>
          Diferencias en Órdenes de Ingreso (Block WMS)
        </h2>
        <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
          Reporte de Recepción / Diferencias de Proveedores (<code style="background: var(--bg-secondary); padding: 2px 6px; font-weight: bold;">repoordenesingresodiferencias</code>)
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <button 
          class="win-dialog-btn" 
          @click="consultarReporte" 
          :disabled="loading"
          style="font-weight: 800; display: flex; align-items: center; gap: 0.35rem;"
        >
          <i class="ph ph-arrows-clockwise" :class="{ spinner: loading }"></i>
          {{ loading ? 'Consultando Block...' : 'Actualizar Consulta' }}
        </button>
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

    <!-- Panel de Filtros -->
    <div class="card" style="padding: 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window); margin-bottom: 1.25rem;">
      <div style="font-size: 0.82rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.35rem;">
        <i class="ph ph-funnel"></i> Filtros de Búsqueda WMS
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.85rem; align-items: end;">
        <!-- Fecha Cierre Desde -->
        <div>
          <label style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">
            Fecha Cierre Desde
          </label>
          <input 
            type="date" 
            v-model="filtros.fechaCierreDesde" 
            class="form-control" 
            style="font-size: 0.88rem; font-weight: bold; height: 36px; border: 1.5px solid var(--bevel-dark);"
          />
        </div>

        <!-- Fecha Cierre Hasta -->
        <div>
          <label style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">
            Fecha Cierre Hasta
          </label>
          <input 
            type="date" 
            v-model="filtros.fechaCierreHasta" 
            class="form-control" 
            style="font-size: 0.88rem; font-weight: bold; height: 36px; border: 1.5px solid var(--bevel-dark);"
          />
        </div>

        <!-- Orden ERP -->
        <div>
          <label style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">
            Nº Orden (Doc)
          </label>
          <input 
            type="text" 
            v-model="filtros.codigoOrdenes" 
            placeholder="Ej: 300752" 
            class="form-control" 
            style="font-size: 0.88rem; font-weight: bold; height: 36px; border: 1.5px solid var(--bevel-dark);"
            @keyup.enter="consultarReporte"
          />
        </div>

        <!-- Proveedor -->
        <div>
          <label style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">
            Proveedor
          </label>
          <input 
            type="text" 
            v-model="filtros.codigoProveedor" 
            placeholder="Ej: Paladini / Depot" 
            class="form-control" 
            style="font-size: 0.88rem; font-weight: bold; height: 36px; border: 1.5px solid var(--bevel-dark);"
            @keyup.enter="consultarReporte"
          />
        </div>

        <!-- Producto -->
        <div>
          <label style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">
            Producto / SKU
          </label>
          <input 
            type="text" 
            v-model="filtros.codigoProducto" 
            placeholder="Ej: 1218" 
            class="form-control" 
            style="font-size: 0.88rem; font-weight: bold; height: 36px; border: 1.5px solid var(--bevel-dark);"
            @keyup.enter="consultarReporte"
          />
        </div>

        <!-- Filtro Diferencias -->
        <div>
          <label style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">
            Diferencias
          </label>
          <select 
            v-model="filtros.diferencia" 
            class="form-control" 
            style="font-size: 0.88rem; font-weight: bold; height: 36px; border: 1.5px solid var(--bevel-dark);"
            @change="consultarReporte"
          >
            <option value="-1">Todos los Registros</option>
            <option value="1">Solo con Diferencia (Sí)</option>
            <option value="0">Sin Diferencia (No)</option>
          </select>
        </div>

        <!-- Botón de Ejecución -->
        <div>
          <button 
            class="win-dialog-btn win-dialog-btn-ok" 
            @click="consultarReporte" 
            :disabled="loading"
            style="width: 100%; height: 36px; font-weight: 800; font-size: 0.9rem;"
          >
            <i class="ph ph-magnifying-glass" v-if="!loading"></i>
            <i class="ph ph-spinner spinner" v-else></i>
            Buscar en Block
          </button>
        </div>
      </div>
    </div>

    <!-- Indicador de Carga -->
    <div v-if="loading" style="text-align: center; padding: 3rem; background: var(--bg-window); border: 2px solid var(--bevel-dark); margin-bottom: 1.25rem;">
      <i class="ph ph-spinner spinner" style="font-size: 3rem; color: var(--accent-primary); margin-bottom: 0.75rem;"></i>
      <h3 style="margin: 0; font-size: 1.1rem; font-weight: bold; color: var(--text-primary);">Conectando con Block WMS...</h3>
      <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-muted);">
        Ejecutando consulta <code style="font-weight: bold;">view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos</code>
      </p>
    </div>

    <!-- Error al Conectar -->
    <div v-else-if="errorMessage" class="card" style="padding: 1.25rem; border: 2px solid #ef4444; background: #fef2f2; margin-bottom: 1.25rem; color: #991b1b;">
      <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 800; font-size: 1rem; margin-bottom: 0.35rem;">
        <i class="ph ph-warning-circle" style="font-size: 1.4rem;"></i> Error de Consulta Block WMS
      </div>
      <p style="margin: 0; font-size: 0.9rem;">{{ errorMessage }}</p>
      <button class="win-dialog-btn" @click="consultarReporte" style="margin-top: 0.75rem; font-weight: bold;">
        Reintentar Consulta
      </button>
    </div>

    <!-- Resultados -->
    <template v-else-if="reportData">
      
      <!-- Tarjetas de Resumen KPI -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem;">
        
        <!-- Total Registros -->
        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block;">
            Total Registros
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary);">
            {{ reportData.totalItems || 0 }}
          </span>
        </div>

        <!-- Con Diferencia -->
        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: #fef2f2;">
          <span style="font-size: 0.75rem; color: #991b1b; text-transform: uppercase; font-weight: 800; display: block;">
            Con Diferencia
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: #dc2626;">
            {{ reportData.conDiferenciaCount || 0 }}
          </span>
        </div>

        <!-- Total Esperado -->
        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block;">
            Total Esperado (kg)
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: #0284c7;">
            {{ (reportData.resumen?.totalEsperada || 0).toFixed(3) }}
          </span>
        </div>

        <!-- Total Recibido -->
        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block;">
            Total Recibido (kg)
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: #16a34a;">
            {{ (reportData.resumen?.totalRecibida || 0).toFixed(3) }}
          </span>
        </div>

        <!-- Diferencia Neta -->
        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark);" :style="{ background: (reportData.resumen?.totalDiferencia || 0) < 0 ? '#fef2f2' : '#f0fdf4' }">
          <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; display: block;" :style="{ color: (reportData.resumen?.totalDiferencia || 0) < 0 ? '#991b1b' : '#166534' }">
            Diferencia Neta
          </span>
          <span style="font-size: 1.6rem; font-weight: 800;" :style="{ color: (reportData.resumen?.totalDiferencia || 0) < 0 ? '#dc2626' : '#16a34a' }">
            {{ (reportData.resumen?.totalDiferencia || 0) > 0 ? '+' : '' }}{{ (reportData.resumen?.totalDiferencia || 0).toFixed(3) }}
          </span>
        </div>
      </div>

      <!-- Control de Modo de Visualización y Buscador -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.75rem;">
        
        <!-- Toggle Modo Vista -->
        <div style="display: flex; gap: 0.25rem; background: var(--bg-secondary); padding: 4px; border: 2px solid var(--bevel-dark);">
          <button 
            class="win-dialog-btn" 
            :style="{ background: modoAgrupado === false ? 'var(--accent-primary)' : 'transparent', color: modoAgrupado === false ? '#fff' : 'var(--text-primary)', fontWeight: 'bold' }"
            @click="modoAgrupado = false"
          >
            <i class="ph ph-list-bullets"></i> Vista Detallada (Por Orden)
          </button>
          <button 
            class="win-dialog-btn" 
            :style="{ background: modoAgrupado === true ? 'var(--accent-primary)' : 'transparent', color: modoAgrupado === true ? '#fff' : 'var(--text-primary)', fontWeight: 'bold' }"
            @click="modoAgrupado = true"
          >
            <i class="ph ph-squares-four"></i> Agrupado por Código (SKU)
          </button>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-secondary);">
            Mostrando {{ displayRows.length }} {{ modoAgrupado ? 'productos agrupados' : 'registros' }}
          </div>
          <div style="width: 260px;">
            <input 
              type="text" 
              v-model="searchTerm" 
              placeholder="Filtrar en pantalla..." 
              class="form-control" 
              style="font-size: 0.85rem; font-weight: 600; height: 34px; border: 1.5px solid var(--bevel-dark);"
            />
          </div>
        </div>
      </div>

      <!-- TABLA VISTA DETALLADA -->
      <div v-if="!modoAgrupado" class="table-container" style="border: 2px solid var(--bevel-dark); background: var(--bg-window); overflow-x: auto;">
        <table class="win-table" style="width: 100%; border-collapse: collapse; font-family: 'Nunito', sans-serif;">
          <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--bevel-dark); font-size: 0.8rem; text-transform: uppercase;">
              <th style="padding: 0.6rem 0.75rem; text-align: center; width: 60px;">Nº</th>
              <th style="padding: 0.6rem 0.75rem; text-align: left; width: 110px;">Orden</th>
              <th style="padding: 0.6rem 0.75rem; text-align: left;">Proveedor</th>
              <th style="padding: 0.6rem 0.75rem; text-align: center; width: 100px;">Código</th>
              <th style="padding: 0.6rem 0.75rem; text-align: left;">Producto</th>
              <th style="padding: 0.6rem 0.75rem; text-align: center; width: 90px;">Lote</th>
              <th style="padding: 0.6rem 0.75rem; text-align: right; width: 110px;">Esperada</th>
              <th style="padding: 0.6rem 0.75rem; text-align: right; width: 110px;">Recibida</th>
              <th style="padding: 0.6rem 0.75rem; text-align: right; width: 110px;">Diferencia</th>
              <th style="padding: 0.6rem 0.75rem; text-align: center; width: 110px;">Fecha Cierre</th>
              <th style="padding: 0.6rem 0.75rem; text-align: center; width: 120px;">Operador</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in displayRows" 
              :key="item.id"
              style="border-bottom: 1.5px solid var(--bevel-dark); font-size: 0.85rem;"
              :style="{ background: Math.abs(item.diferencia) > 0.001 ? (item.diferencia < 0 ? '#fff5f5' : '#f0fdf4') : 'transparent' }"
            >
              <td style="padding: 0.55rem 0.75rem; text-align: center; color: var(--text-muted); font-weight: bold;">
                {{ item.id }}
              </td>
              <td style="padding: 0.55rem 0.75rem; font-family: monospace; font-weight: 800; color: var(--accent-primary);">
                {{ item.orden }}
              </td>
              <td style="padding: 0.55rem 0.75rem; font-weight: 700; color: var(--text-primary);">
                {{ item.proveedor }}
              </td>
              <td style="padding: 0.55rem 0.75rem; text-align: center; font-family: monospace; font-weight: bold; color: var(--text-secondary);">
                {{ item.codigoProducto }}
              </td>
              <td style="padding: 0.55rem 0.75rem; font-weight: 700; color: var(--text-primary);">
                {{ item.producto }}
              </td>
              <td style="padding: 0.55rem 0.75rem; text-align: center; font-family: monospace; font-weight: bold; color: var(--text-secondary);">
                {{ item.lote }}
              </td>
              <td style="padding: 0.55rem 0.75rem; text-align: right; font-weight: 800; color: #0284c7;">
                {{ item.cantidadEsperada.toFixed(3) }}
              </td>
              <td style="padding: 0.55rem 0.75rem; text-align: right; font-weight: 800; color: #16a34a;">
                {{ item.cantidadRecibida.toFixed(3) }}
              </td>
              <td 
                style="padding: 0.55rem 0.75rem; text-align: right; font-weight: 800;"
                :style="{ color: item.diferencia < 0 ? '#dc2626' : (item.diferencia > 0 ? '#16a34a' : 'var(--text-muted)') }"
              >
                {{ item.diferencia > 0 ? '+' : '' }}{{ item.diferencia.toFixed(3) }}
              </td>
              <td style="padding: 0.55rem 0.75rem; text-align: center; font-weight: bold; color: var(--text-secondary); font-size: 0.8rem;">
                {{ item.fechaCierre }}
              </td>
              <td style="padding: 0.55rem 0.75rem; text-align: center; font-weight: bold; color: var(--text-secondary); font-size: 0.8rem;">
                {{ item.operador }}
              </td>
            </tr>

            <tr v-if="displayRows.length === 0">
              <td colspan="11" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                <i class="ph ph-package" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; opacity: 0.4;"></i>
                No se encontraron registros de diferencias para los filtros seleccionados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TABLA VISTA AGRUPADA POR CÓDIGO -->
      <div v-else class="table-container" style="border: 2px solid var(--bevel-dark); background: var(--bg-window); overflow-x: auto;">
        <table class="win-table" style="width: 100%; border-collapse: collapse; font-family: 'Nunito', sans-serif;">
          <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--bevel-dark); font-size: 0.8rem; text-transform: uppercase;">
              <th style="padding: 0.6rem 0.75rem; text-align: center; width: 60px;">Nº</th>
              <th style="padding: 0.6rem 0.75rem; text-align: center; width: 120px;">Código SKU</th>
              <th style="padding: 0.6rem 0.75rem; text-align: left;">Nombre del Producto</th>
              <th style="padding: 0.6rem 0.75rem; text-align: center; width: 100px;">Órdenes</th>
              <th style="padding: 0.6rem 0.75rem; text-align: right; width: 140px;">Total Esperado (kg)</th>
              <th style="padding: 0.6rem 0.75rem; text-align: right; width: 140px;">Total Recibido (kg)</th>
              <th style="padding: 0.6rem 0.75rem; text-align: right; width: 140px;">Diferencia Neta (kg)</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(grp, idx) in displayRows" 
              :key="grp.codigoProducto"
              style="border-bottom: 1.5px solid var(--bevel-dark); font-size: 0.88rem;"
              :style="{ background: Math.abs(grp.diferencia) > 0.001 ? (grp.diferencia < 0 ? '#fff5f5' : '#f0fdf4') : 'transparent' }"
            >
              <td style="padding: 0.6rem 0.75rem; text-align: center; color: var(--text-muted); font-weight: bold;">
                {{ idx + 1 }}
              </td>
              <td style="padding: 0.6rem 0.75rem; text-align: center; font-family: monospace; font-weight: 800; color: var(--accent-primary); font-size: 0.95rem;">
                {{ grp.codigoProducto }}
              </td>
              <td style="padding: 0.6rem 0.75rem; font-weight: 700; color: var(--text-primary);">
                {{ grp.producto }}
              </td>
              <td style="padding: 0.6rem 0.75rem; text-align: center; font-weight: bold; color: var(--text-secondary);">
                <span style="background: var(--bg-secondary); padding: 2px 8px; border: 1px solid var(--bevel-dark);">
                  {{ grp.cantidadOrdenes }}
                </span>
              </td>
              <td style="padding: 0.6rem 0.75rem; text-align: right; font-weight: 800; color: #0284c7;">
                {{ grp.cantidadEsperada.toFixed(3) }}
              </td>
              <td style="padding: 0.6rem 0.75rem; text-align: right; font-weight: 800; color: #16a34a;">
                {{ grp.cantidadRecibida.toFixed(3) }}
              </td>
              <td 
                style="padding: 0.6rem 0.75rem; text-align: right; font-weight: 800; font-size: 0.95rem;"
                :style="{ color: grp.diferencia < 0 ? '#dc2626' : (grp.diferencia > 0 ? '#16a34a' : 'var(--text-muted)') }"
              >
                {{ grp.diferencia > 0 ? '+' : '' }}{{ grp.diferencia.toFixed(3) }}
              </td>
            </tr>

            <tr v-if="displayRows.length === 0">
              <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                <i class="ph ph-package" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; opacity: 0.4;"></i>
                No se encontraron registros de productos agrupados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'

const todayStr = new Date().toISOString().split('T')[0]

const filtros = ref({
  fechaCierreDesde: todayStr,
  fechaCierreHasta: todayStr,
  codigoOrdenes: '',
  codigoProveedor: '',
  codigoProducto: '',
  diferencia: '-1',
  lote: ''
})

const loading = ref(false)
const errorMessage = ref('')
const reportData = ref(null)
const searchTerm = ref('')
const modoAgrupado = ref(false)

const consultarReporte = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await fetch('/api/wms/reporte-diferencias-ingreso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filtros.value)
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Error ${res.status} al consultar Block WMS`)
    }

    const data = await res.json()
    reportData.value = data
  } catch (err) {
    console.error('Error al consultar reporte de diferencias WMS:', err)
    errorMessage.value = err.message || 'Error al conectar con Block WMS.'
  } finally {
    loading.value = false
  }
}

// Filtrado detallado en pantalla
const filteredItems = computed(() => {
  if (!reportData.value || !reportData.value.items) return []
  if (!searchTerm.value.trim()) return reportData.value.items

  const q = searchTerm.value.trim().toLowerCase()
  return reportData.value.items.filter(i => 
    String(i.orden).toLowerCase().includes(q) ||
    String(i.proveedor).toLowerCase().includes(q) ||
    String(i.producto).toLowerCase().includes(q) ||
    String(i.codigoProducto).toLowerCase().includes(q) ||
    String(i.lote).toLowerCase().includes(q) ||
    String(i.operador).toLowerCase().includes(q)
  )
})

// Agrupamiento por código de producto (SKU)
const groupedItems = computed(() => {
  const map = new Map()

  for (const item of filteredItems.value) {
    const key = item.codigoProducto || 'SIN_CODIGO'
    if (!map.has(key)) {
      map.set(key, {
        codigoProducto: key,
        producto: item.producto || 'Producto sin nombre',
        cantidadOrdenes: 0,
        cantidadEsperada: 0,
        cantidadRecibida: 0,
        diferencia: 0
      })
    }

    const grp = map.get(key)
    grp.cantidadOrdenes += 1
    grp.cantidadEsperada += item.cantidadEsperada
    grp.cantidadRecibida += item.cantidadRecibida
    grp.diferencia += item.diferencia
  }

  return Array.from(map.values()).map(g => ({
    ...g,
    cantidadEsperada: parseFloat(g.cantidadEsperada.toFixed(3)),
    cantidadRecibida: parseFloat(g.cantidadRecibida.toFixed(3)),
    diferencia: parseFloat(g.diferencia.toFixed(3))
  }))
})

// Filas a mostrar según el modo activo
const displayRows = computed(() => {
  return modoAgrupado.value ? groupedItems.value : filteredItems.value
})

const exportarExcel = () => {
  if (!reportData.value || !reportData.value.items || reportData.value.items.length === 0) return

  let rows = []
  let sheetName = ''

  if (modoAgrupado.value) {
    sheetName = 'Diferencias Agrupadas x Código'
    rows = groupedItems.value.map((g, idx) => ({
      'Nº': idx + 1,
      'Código SKU': g.codigoProducto,
      'Producto': g.producto,
      'Cantidad Órdenes': g.cantidadOrdenes,
      'Total Esperado (kg)': g.cantidadEsperada,
      'Total Recibido (kg)': g.cantidadRecibida,
      'Diferencia Neta (kg)': g.diferencia
    }))
  } else {
    sheetName = 'Diferencias Ingreso Detalle'
    rows = filteredItems.value.map(i => ({
      'Nº': i.id,
      'Orden': i.orden,
      'Proveedor': i.proveedor,
      'Código SKU': i.codigoProducto,
      'Producto': i.producto,
      'Lote': i.lote,
      'Cant. Esperada (kg)': i.cantidadEsperada,
      'Cant. Recibida (kg)': i.cantidadRecibida,
      'Diferencia (kg)': i.diferencia,
      'Fecha Cierre': i.fechaCierre,
      'Operador': i.operador
    }))
  }

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `Reporte_Diferencias_Ingreso_${filtros.value.fechaCierreDesde}_${filtros.value.fechaCierreHasta}.xlsx`)
}

onMounted(() => {
  consultarReporte()
})
</script>

<style scoped>
.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
