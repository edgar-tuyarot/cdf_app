<template>
  <div class="page-container animate-fade" style="padding: 1rem; max-width: 1400px; margin: 0 auto; font-family: 'Nunito', sans-serif;">
    
    <!-- Encabezado de la Página -->
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h2 class="page-title" style="margin: 0; font-size: 1.4rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
          <i class="ph ph-truck-trailer" style="color: #ef4444; font-size: 1.6rem;"></i>
          Historial de Órdenes de Egreso / Despachos (Block WMS)
        </h2>
        <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
          Consulte las salidas, despachos y egresos de mercancía realizados por rango de fechas y tipo de comprobante.
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
        <button 
          v-if="reportData && (reportData.ordenes?.length > 0 || reportData.productosConsolidados?.length > 0)" 
          class="win-dialog-btn win-dialog-btn-ok" 
          @click="exportarExcel"
          style="display: flex; align-items: center; gap: 0.35rem; font-weight: 800;"
        >
          <i class="ph ph-file-xls"></i> Exportar a Excel
        </button>
      </div>
    </div>

    <!-- Panel de Filtros por Rango de Fecha, Tipo de Comprobante y Site -->
    <div class="card" style="padding: 1.25rem; border: 2px solid var(--bevel-dark); background: var(--bg-window); margin-bottom: 1.25rem;">
      <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.35rem;">
        <i class="ph ph-calendar"></i> Filtros de Consulta de Egresos
      </div>

      <form @submit.prevent="consultarEgresos" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; align-items: flex-end;">
        
        <!-- Fecha Desde -->
        <div>
          <label style="font-size: 0.82rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.35rem;">
            Fecha Desde *
          </label>
          <input 
            type="date" 
            v-model="fechaDesde" 
            class="form-control" 
            style="font-size: 0.9rem; font-weight: bold; height: 38px; border: 1.5px solid var(--bevel-dark);"
            :disabled="loading"
            required
          />
        </div>

        <!-- Fecha Hasta -->
        <div>
          <label style="font-size: 0.82rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.35rem;">
            Fecha Hasta *
          </label>
          <input 
            type="date" 
            v-model="fechaHasta" 
            class="form-control" 
            style="font-size: 0.9rem; font-weight: bold; height: 38px; border: 1.5px solid var(--bevel-dark);"
            :disabled="loading"
            required
          />
        </div>

        <!-- Selector de Tipo de Comprobante (WHERE SQL) -->
        <div>
          <label style="font-size: 0.82rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.35rem;">
            Tipo de Operación / Documento
          </label>
          <select 
            v-model="selectedTipoComprobante" 
            class="form-control" 
            style="font-size: 0.88rem; font-weight: bold; height: 38px; border: 1.5px solid var(--bevel-dark);"
            :disabled="loading"
          >
            <option value="TODOS">📋 Todos los Egresos / Operaciones</option>
            <option value="Despacho">🚚 Despachos a Sucursal / CD</option>
            <option value="Movimiento Masivo">📦 Movimiento Masivo Ubicaciones</option>
            <option value="Ajuste">⚙️ Ajustes de Inventario / Salida</option>
          </select>
        </div>

        <!-- Selector de Site / Depósito -->
        <div>
          <label style="font-size: 0.82rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.35rem;">
            Depósito / Site WMS
          </label>
          <select 
            v-model="selectedSiteId" 
            class="form-control" 
            style="font-size: 0.88rem; font-weight: bold; height: 38px; border: 1.5px solid var(--bevel-dark);"
            :disabled="loading"
          >
            <option v-for="s in sites" :key="s.siteId" :value="s.siteId">
              🏢 {{ s.nombre }}
            </option>
          </select>
        </div>

        <!-- Botón Consultar -->
        <div>
          <button 
            type="submit" 
            class="win-dialog-btn win-dialog-btn-ok" 
            :disabled="loading"
            style="width: 100%; height: 38px; font-weight: 800; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; background: #ef4444; border-color: #dc2626; color: #fff;"
          >
            <i class="ph ph-magnifying-glass" v-if="!loading"></i>
            <i class="ph ph-spinner spinner" v-else></i>
            Consultar Egresos
          </button>
        </div>

      </form>
    </div>

    <!-- Indicador de Carga -->
    <div v-if="loading" style="text-align: center; padding: 3rem; background: var(--bg-window); border: 2px solid var(--bevel-dark); margin-bottom: 1.25rem;">
      <i class="ph ph-spinner spinner" style="font-size: 3rem; color: #ef4444; margin-bottom: 0.75rem;"></i>
      <h3 style="margin: 0; font-size: 1.1rem; font-weight: bold; color: var(--text-primary);">Consultando órdenes de egreso en Block WMS...</h3>
      <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-muted);">
        Buscando registros desde {{ formatDateDisplay(fechaDesde) }} hasta {{ formatDateDisplay(fechaHasta) }}
      </p>
    </div>

    <!-- Mensaje de Error -->
    <div v-else-if="errorMessage" class="card" style="padding: 1.25rem; border: 2px solid #ef4444; background: #fef2f2; margin-bottom: 1.25rem; color: #991b1b;">
      <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 800; font-size: 1rem; margin-bottom: 0.35rem;">
        <i class="ph ph-warning-circle" style="font-size: 1.4rem;"></i> Error al consultar Block WMS
      </div>
      <p style="margin: 0; font-size: 0.9rem;">{{ errorMessage }}</p>
    </div>

    <!-- Estado Inicial: Búsqueda Bajo Demanda -->
    <div v-else-if="!reportData" style="text-align: center; padding: 3.5rem 1.5rem; background: var(--bg-window); border: 2px solid var(--bevel-dark); margin-bottom: 1.25rem;">
      <i class="ph ph-magnifying-glass-plus" style="font-size: 3.5rem; color: #ef4444; margin-bottom: 0.85rem; opacity: 0.7;"></i>
      <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--text-primary);">Búsqueda Bajo Demanda</h3>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: var(--text-secondary); max-width: 600px; margin-left: auto; margin-right: auto;">
        Ajuste el rango de fechas, seleccione los filtros deseados y presione el botón <strong style="color: #ef4444;">"Consultar Egresos"</strong> para iniciar la búsqueda en Block WMS.
      </p>
    </div>

    <!-- Contenido de Resultados -->
    <template v-else-if="reportData">

      <!-- Tarjetas Resumen KPI -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem;">
        
        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block;">
            Órdenes de Egreso
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: #ef4444;">
            {{ reportData.totalOrdenes || 0 }} órdenes
          </span>
        </div>

        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block;">
            Productos Distintos Egresados
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: #8b5cf6;">
            {{ reportData.totalProductosDistintos || 0 }} SKUs
          </span>
        </div>

        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block;">
            Total Kilos Despachados
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: #dc2626;">
            {{ (reportData.totalGeneralKilos || 0).toFixed(3) }} kg
          </span>
        </div>
      </div>

      <!-- Barra de Modos y Búsqueda -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.75rem;">
        
        <!-- Botones de Modo: Por Órdenes vs Todos los Productos -->
        <div style="display: flex; gap: 0.5rem;">
          <button 
            type="button" 
            class="win-dialog-btn" 
            :class="{ 'win-dialog-btn-ok': modoVista === 'ORDENES' }"
            @click="modoVista = 'ORDENES'"
            style="font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;"
          >
            <i class="ph ph-receipt"></i> Ver por Órdenes de Egreso ({{ reportData.ordenes?.length || 0 }})
          </button>

          <button 
            type="button" 
            class="win-dialog-btn" 
            :class="{ 'win-dialog-btn-ok': modoVista === 'PRODUCTOS' }"
            @click="modoVista = 'PRODUCTOS'"
            style="font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;"
          >
            <i class="ph ph-package"></i> Mostrar Todos los Productos ({{ reportData.productosConsolidados?.length || 0 }})
          </button>
        </div>

        <!-- Filtro rápido en tabla -->
        <div style="width: 260px;">
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="Filtrar en tabla..." 
            class="form-control" 
            style="font-size: 0.85rem; font-weight: 600; height: 34px; border: 1.5px solid var(--bevel-dark);"
          />
        </div>
      </div>

      <!-- MODO 1: TABLA DE ÓRDENES DE EGRESO -->
      <div v-if="modoVista === 'ORDENES'" class="table-container" style="border: 2px solid var(--bevel-dark); background: var(--bg-window); overflow-x: auto;">
        <table class="win-table" style="width: 100%; border-collapse: collapse; font-family: 'Nunito', sans-serif;">
          <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--bevel-dark); font-size: 0.82rem; text-transform: uppercase;">
              <th style="padding: 0.65rem 0.85rem; text-align: center; width: 11%;">Nº Orden</th>
              <th style="padding: 0.65rem 0.85rem; text-align: center; width: 11%;">Fecha Cierre</th>
              <th style="padding: 0.65rem 0.85rem; text-align: left; width: 22%;">Destino / Entidad</th>
              <th style="padding: 0.65rem 0.85rem; text-align: left; width: 20%;">Comprobante / Documento</th>
              <th style="padding: 0.65rem 0.85rem; text-align: left; width: 14%;">Operación</th>
              <th style="padding: 0.65rem 0.85rem; text-align: left; width: 12%;">Operador</th>
              <th style="padding: 0.65rem 0.85rem; text-align: right; width: 10%;">Despachado</th>
              <th style="padding: 0.65rem 0.85rem; text-align: center; width: 6%;">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="o in filteredOrdenes" 
              :key="o.orden"
              @click="verDetalleOrden(o)"
              style="border-bottom: 1.5px solid var(--bevel-dark); font-size: 0.9rem; cursor: pointer;"
              class="row-hover"
            >
              <!-- Nº Orden -->
              <td style="padding: 0.65rem 0.85rem; text-align: center; font-family: monospace; font-weight: 800; color: #ef4444; font-size: 0.95rem;">
                {{ o.orden }}
              </td>

              <!-- Fecha -->
              <td style="padding: 0.65rem 0.85rem; text-align: center; font-weight: 700; color: var(--text-primary);">
                {{ o.fechaCierre }}
              </td>

              <!-- Destino -->
              <td style="padding: 0.65rem 0.85rem; font-weight: 800; color: var(--text-primary);">
                <i class="ph ph-map-pin" style="color: #ef4444; margin-right: 0.35rem;"></i>
                {{ o.destino }}
              </td>

              <!-- Documento -->
              <td style="padding: 0.65rem 0.85rem; font-size: 0.85rem; color: var(--text-secondary);">
                {{ o.documento }}
              </td>

              <!-- Operación -->
              <td style="padding: 0.65rem 0.85rem; font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">
                {{ o.operacion }}
              </td>

              <!-- Operador -->
              <td style="padding: 0.65rem 0.85rem; font-size: 0.85rem; color: var(--text-secondary);">
                {{ o.operador }}
              </td>

              <!-- Kilos Despachados -->
              <td style="padding: 0.65rem 0.85rem; text-align: right; font-weight: 800; color: #dc2626; font-size: 0.95rem;">
                {{ o.totalKilosDespachados.toFixed(3) }} kg
                <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">{{ o.totalItemsCount }} ítem(s)</div>
              </td>

              <!-- Botón Ver Detalle -->
              <td style="padding: 0.65rem 0.85rem; text-align: center;">
                <button 
                  type="button" 
                  class="win-dialog-btn" 
                  @click.stop="verDetalleOrden(o)"
                  style="font-size: 0.78rem; font-weight: 800; padding: 0.2rem 0.5rem;"
                >
                  <i class="ph ph-eye"></i> Detalle
                </button>
              </td>
            </tr>

            <tr v-if="filteredOrdenes.length === 0">
              <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                <i class="ph ph-truck-trailer" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; opacity: 0.4;"></i>
                No se encontraron órdenes de egreso en el rango de fechas seleccionado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODO 2: TABLA DE TODOS LOS PRODUCTOS DESPACHADOS -->
      <div v-else-if="modoVista === 'PRODUCTOS'" class="table-container" style="border: 2px solid var(--bevel-dark); background: var(--bg-window); overflow-x: auto;">
        <table class="win-table" style="width: 100%; border-collapse: collapse; font-family: 'Nunito', sans-serif;">
          <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--bevel-dark); font-size: 0.82rem; text-transform: uppercase;">
              <th style="padding: 0.65rem 0.85rem; text-align: center; width: 15%;">Código SKU</th>
              <th style="padding: 0.65rem 0.85rem; text-align: left; width: 50%;">Producto / Descripción</th>
              <th style="padding: 0.65rem 0.85rem; text-align: center; width: 15%;">Cant. Órdenes</th>
              <th style="padding: 0.65rem 0.85rem; text-align: right; width: 20%;">Total Despachado (kg)</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="p in filteredProductos" 
              :key="p.codigo"
              style="border-bottom: 1.5px solid var(--bevel-dark); font-size: 0.9rem;"
            >
              <!-- Código SKU -->
              <td style="padding: 0.65rem 0.85rem; text-align: center; font-family: monospace; font-weight: 800; color: #ef4444; font-size: 0.95rem;">
                {{ p.codigo }}
              </td>

              <!-- Nombre -->
              <td style="padding: 0.65rem 0.85rem; font-weight: 700; color: var(--text-primary);">
                {{ p.producto }}
              </td>

              <!-- Cantidad de Órdenes -->
              <td style="padding: 0.65rem 0.85rem; text-align: center; font-weight: 800; color: var(--text-secondary);">
                {{ p.cantOrdenes }} orden(es)
              </td>

              <!-- Total Despachado -->
              <td style="padding: 0.65rem 0.85rem; text-align: right; font-weight: 800; font-size: 1rem; color: #dc2626;">
                {{ p.totalDespachado.toFixed(3) }} kg
              </td>
            </tr>

            <tr v-if="filteredProductos.length === 0">
              <td colspan="4" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                <i class="ph ph-package" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; opacity: 0.4;"></i>
                No se encontraron productos en el rango de fechas seleccionado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </template>

    <!-- MODAL: DETALLE DE LA ÓRDEN SELECCIONADA -->
    <div v-if="selectedOrdenModal" class="modal-backdrop" @click.self="selectedOrdenModal = null" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
      <div class="modal-card" style="background: var(--bg-window); border: 2px solid var(--bevel-dark); max-width: 950px; width: 100%; max-height: 90vh; display: flex; flex-direction: column;">
        
        <!-- Modal Header -->
        <div style="padding: 1rem 1.25rem; border-bottom: 2px solid var(--bevel-dark); background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <i class="ph ph-truck-trailer" style="color: #ef4444;"></i>
              Detalle de Orden de Egreso Nº {{ selectedOrdenModal.orden }}
            </h3>
            <span style="font-size: 0.82rem; color: var(--text-secondary); font-weight: 600;">
              Fecha Cierre: {{ selectedOrdenModal.fechaCierre }} | Destino: {{ selectedOrdenModal.destino }}
            </span>
          </div>

          <button type="button" class="win-dialog-btn" @click="selectedOrdenModal = null" style="padding: 0.2rem 0.5rem;">
            <i class="ph ph-x" style="font-size: 1.2rem;"></i>
          </button>
        </div>

        <!-- Modal Body: Información de Cabecera e Ítems -->
        <div style="padding: 1.25rem; overflow-y: auto; flex: 1;">
          
          <!-- Banner de éxito tras impacto -->
          <div v-if="recortesSuccessMsg" style="padding: 0.75rem 1rem; border: 2px solid #16a34a; background: #f0fdf4; color: #15803d; font-weight: 800; font-size: 0.9rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; border-radius: 4px;">
            <i class="ph ph-check-circle" style="font-size: 1.3rem;"></i>
            {{ recortesSuccessMsg }}
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; background: var(--bg-secondary); padding: 0.85rem; border: 1.5px solid var(--bevel-dark); margin-bottom: 1.25rem; font-size: 0.85rem;">
            <div><strong>Comprobante:</strong> {{ selectedOrdenModal.documento }}</div>
            <div><strong>Operación:</strong> {{ selectedOrdenModal.operacion }}</div>
            <div><strong>Operador:</strong> {{ selectedOrdenModal.operador }}</div>
            <div><strong>Total Kilos Despachados:</strong> <span style="color: #dc2626; font-weight: 800;">{{ selectedOrdenModal.totalKilosDespachados.toFixed(3) }} kg</span></div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h4 style="font-size: 0.95rem; font-weight: 800; margin: 0; color: var(--text-primary);">
              Productos Despachados en esta Orden ({{ selectedOrdenModal.items.length }}):
            </h4>
            <span style="font-size: 0.82rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 0.2rem 0.6rem; border-radius: 4px; border: 1px solid #bae6fd;">
              Seleccionados: {{ selectedItemIds.length }} / {{ selectedOrdenModal.items.length }} ({{ selectedKilosTotal.toFixed(3) }} kg)
            </span>
          </div>

          <div style="border: 1.5px solid var(--bevel-dark); overflow-x: auto;">
            <table class="win-table" style="width: 100%; border-collapse: collapse; font-family: 'Nunito', sans-serif; font-size: 0.88rem;">
              <thead>
                <tr style="background: var(--bg-secondary); border-bottom: 1.5px solid var(--bevel-dark); font-size: 0.78rem; text-transform: uppercase;">
                  <th style="padding: 0.5rem; text-align: center; width: 6%;">
                    <input 
                      type="checkbox" 
                      :checked="isAllSelected" 
                      @change="toggleSelectAll"
                      style="cursor: pointer; width: 16px; height: 16px;"
                      title="Seleccionar / Deseleccionar todos"
                    />
                  </th>
                  <th style="padding: 0.5rem 0.75rem; text-align: center; width: 12%;">Código SKU</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: left; width: 36%;">Producto / Descripción</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: center; width: 12%;">Lote</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: right; width: 17%;">Despachado (kg)</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: left; width: 17%;">Ubicación Origen</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedOrdenModal.items" :key="item.id" style="border-bottom: 1px solid var(--bevel-dark);">
                  <td style="padding: 0.5rem; text-align: center;">
                    <input 
                      type="checkbox" 
                      :value="item.id" 
                      v-model="selectedItemIds"
                      style="cursor: pointer; width: 16px; height: 16px;"
                    />
                  </td>
                  <td style="padding: 0.5rem 0.75rem; text-align: center; font-family: monospace; font-weight: 800; color: #ef4444;">
                    {{ item.codigo }}
                  </td>
                  <td style="padding: 0.5rem 0.75rem; font-weight: 700;">
                    {{ item.producto }}
                  </td>
                  <td style="padding: 0.5rem 0.75rem; text-align: center; font-family: monospace; font-size: 0.82rem;">
                    {{ item.lote || '-' }}
                  </td>
                  <td style="padding: 0.5rem 0.75rem; text-align: right; font-weight: 800; color: #dc2626;">
                    {{ item.despachada.toFixed(3) }} kg
                  </td>
                  <td style="padding: 0.5rem 0.75rem; font-size: 0.82rem; color: var(--text-secondary);">
                    {{ item.ubicacion }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        <!-- Modal Footer con botones para Sumar Ingreso o Decomiso en Egresos -->
        <div style="padding: 0.85rem 1.25rem; border-top: 2px solid var(--bevel-dark); background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <!-- Botón Sumar como Ingreso / Recorte -->
            <button 
              type="button" 
              class="btn"
              style="background: var(--accent-primary); color: #ffffff; border: 1.5px solid var(--bevel-dark); font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.9rem; border-radius: 4px; cursor: pointer; box-shadow: var(--raised-shadow);"
              @click="impactarSeleccion(selectedOrdenModal, 'recorte')"
              :disabled="loadingImpacto || selectedItemIds.length === 0"
            >
              <i class="ph ph-spinner spinner" v-if="loadingImpacto"></i>
              <i class="ph ph-scissors" v-else></i>
              📥 Sumar Selección a Ingreso ({{ selectedKilosTotal.toFixed(3) }} kg)
            </button>

            <!-- Botón Sumar como Decomiso -->
            <button 
              type="button" 
              class="btn"
              style="background: var(--accent-danger); color: #ffffff; border: 1.5px solid var(--bevel-dark); font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.9rem; border-radius: 4px; cursor: pointer; box-shadow: var(--raised-shadow);"
              @click="impactarSeleccion(selectedOrdenModal, 'decomiso')"
              :disabled="loadingImpacto || selectedItemIds.length === 0"
            >
              <i class="ph ph-spinner spinner" v-if="loadingImpacto"></i>
              <i class="ph ph-trash" v-else></i>
              🗑️ Sumar Selección a Decomiso ({{ selectedKilosTotal.toFixed(3) }} kg)
            </button>

            <!-- Botón Vincular a Pedido de Sucursal -->
            <button 
              type="button" 
              class="btn"
              style="background: #0284c7; color: #ffffff; border: 1.5px solid var(--bevel-dark); font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.9rem; border-radius: 4px; cursor: pointer; box-shadow: var(--raised-shadow);"
              @click="abrirModalVincularAPedido(selectedOrdenModal)"
            >
              <i class="ph ph-link"></i>
              🔗 Vincular a Pedido
            </button>
          </div>

          <button 
            type="button" 
            class="btn"
            style="background: var(--bg-window); color: var(--text-primary); border: 1.5px solid var(--bevel-dark); font-weight: 800; font-size: 0.85rem; padding: 0.45rem 0.9rem; border-radius: 4px; cursor: pointer;" 
            @click="selectedOrdenModal = null"
          >
            Cerrar Detalle
          </button>
        </div>

      </div>
    </div>

    <!-- MODAL SELECCIONAR PEDIDO PARA VINCULAR (DESDE EGRESOS HISTORIAL) -->
    <div v-if="showModalVincularPedido" class="modal-backdrop" @click.self="showModalVincularPedido = false" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;">
      <div class="modal-card" style="background: var(--bg-window); border: 3px solid var(--bevel-dark); max-width: 700px; width: 100%; max-height: 85vh; display: flex; flex-direction: column;">
        <div style="padding: 0.85rem 1.25rem; background: #0284c7; color: white; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 1.05rem; font-weight: 800; display: flex; align-items: center; gap: 0.4rem;">
            <i class="ph ph-link"></i> Vincular Egreso #{{ ordenParaVincular?.orden }} a un Pedido
          </h3>
          <button @click="showModalVincularPedido = false" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">
            <i class="ph ph-x"></i>
          </button>
        </div>

        <div style="padding: 1rem 1.25rem; background: var(--bg-secondary); border-bottom: 1.5px solid var(--bevel-light); font-size: 0.85rem;">
          <strong>Destino Egreso:</strong> {{ ordenParaVincular?.destino }} | 
          <strong>Total Kilos:</strong> {{ (ordenParaVincular?.totalKilosDespachados || 0).toFixed(3) }} kg
        </div>

        <div style="padding: 1rem; overflow-y: auto; flex: 1;">
          <div v-if="loadingPedidosCandidatos" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <i class="ph ph-spinner spinner" style="font-size: 2rem; color: #0284c7; margin-bottom: 0.5rem;"></i>
            <div>Cargando pedidos disponibles...</div>
          </div>

          <div v-else-if="pedidosCandidatos.length === 0" style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.88rem;">
            No se encontraron pedidos recientes para vincular.
          </div>

          <div v-else style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div 
              v-for="p in pedidosCandidatos" 
              :key="p.id"
              style="padding: 0.75rem 1rem; border: 1.5px solid var(--bevel-dark); background: var(--bg-window); border-radius: 4px; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;"
            >
              <div>
                <div style="font-weight: 800; font-size: 0.95rem; color: #0284c7; font-family: monospace;">
                  {{ p.codigo }}
                </div>
                <div style="font-size: 0.82rem; color: var(--text-primary); margin-top: 2px;">
                  <strong>Sucursal:</strong> {{ p.sucursal || '-' }} | <strong>Fecha:</strong> {{ p.fecha }} | <strong>Estado:</strong> {{ p.estado }}
                </div>
                <div v-if="p.wms_orden_egreso" style="font-size: 0.75rem; color: #d97706; font-weight: bold; margin-top: 2px;">
                  ⚠️ Ya vinculado a Block #{{ p.wms_orden_egreso }} (se reemplazará)
                </div>
              </div>

              <button 
                type="button" 
                class="btn btn-primary"
                style="padding: 0.4rem 0.9rem; font-weight: 800; font-size: 0.82rem; white-space: nowrap;"
                :disabled="vinculandoPedidoId === p.id"
                @click="confirmarVinculacionDesdeEgreso(p)"
              >
                <i class="ph ph-spinner spinner" v-if="vinculandoPedidoId === p.id"></i>
                <i class="ph ph-link" v-else></i>
                Vincular
              </button>
            </div>
          </div>
        </div>

        <div style="padding: 0.75rem 1.25rem; background: var(--bg-secondary); border-top: 1.5px solid var(--bevel-dark); text-align: right;">
          <button type="button" class="btn" style="background: var(--bg-window); border: 1.5px solid var(--bevel-dark); font-weight: 800; padding: 0.35rem 0.85rem;" @click="showModalVincularPedido = false">
            Cerrar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'

const fechaDesde = ref('')
const fechaHasta = ref('')
const selectedSiteId = ref('194326')
const selectedTipoComprobante = ref('TODOS')
const sites = ref([
  { siteId: '194326', nombre: '26 - Distribución. Fiambrería Chaco' }
])

const loading = ref(false)
const errorMessage = ref('')
const reportData = ref(null)
const modoVista = ref('ORDENES') // 'ORDENES' | 'PRODUCTOS'
const searchTerm = ref('')
const selectedOrdenModal = ref(null)

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return dateStr
}

const cargarSites = async () => {
  try {
    const cfgRes = await fetch('/api/wms/config')
    if (cfgRes.ok) {
      const cfg = await cfgRes.json()
      if (cfg && cfg.siteId) {
        selectedSiteId.value = String(cfg.siteId)
      }
    }

    const res = await fetch('/api/wms/sites')
    const data = await res.json()
    if (data.ok && data.sites && data.sites.length > 0) {
      sites.value = data.sites
    }
  } catch (err) {
    console.error('Error al cargar sites:', err)
  }
}

const consultarEgresos = async () => {
  if (!fechaDesde.value || !fechaHasta.value) {
    errorMessage.value = 'Por favor seleccione las fechas de inicio y fin.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  reportData.value = null
  selectedOrdenModal.value = null

  try {
    const res = await fetch('/api/wms/ordenes-egreso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        siteId: selectedSiteId.value,
        fechaDesde: fechaDesde.value,
        fechaHasta: fechaHasta.value,
        tipoComprobante: selectedTipoComprobante.value
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Error ${res.status} al consultar órdenes de egreso`)
    }

    const data = await res.json()
    reportData.value = data
  } catch (err) {
    console.error('Error al consultar órdenes de egreso:', err)
    errorMessage.value = err.message || 'Error al conectar con Block WMS.'
  } finally {
    loading.value = false
  }
}

const loadingImpacto = ref(false)
const recortesSuccessMsg = ref('')
const selectedItemIds = ref([])

const showModalVincularPedido = ref(false)
const ordenParaVincular = ref(null)
const loadingPedidosCandidatos = ref(false)
const pedidosCandidatos = ref([])
const vinculandoPedidoId = ref(null)

const abrirModalVincularAPedido = async (orden) => {
  if (!orden) return
  ordenParaVincular.value = orden
  showModalVincularPedido.value = true
  loadingPedidosCandidatos.value = true
  pedidosCandidatos.value = []

  try {
    const res = await fetch('/api/pedidos')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        pedidosCandidatos.value = data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 30)
      }
    }
  } catch (err) {
    console.error('Error al cargar pedidos candidatos:', err)
  } finally {
    loadingPedidosCandidatos.value = false
  }
}

const confirmarVinculacionDesdeEgreso = async (pedido) => {
  if (!pedido || !ordenParaVincular.value) return
  vinculandoPedidoId.value = pedido.id

  try {
    const res = await fetch(`/api/pedidos/${pedido.id}/vincular-egreso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ordenCodigo: ordenParaVincular.value.orden,
        ordenData: ordenParaVincular.value,
        siteId: selectedSiteId.value
      })
    })

    const data = await res.json()
    if (res.ok) {
      recortesSuccessMsg.value = `¡Egreso #${ordenParaVincular.value.orden} vinculado exitosamente al Pedido ${pedido.codigo}!`
      showModalVincularPedido.value = false
      setTimeout(() => { recortesSuccessMsg.value = '' }, 6000)
    } else {
      alert(data.error || 'Error al vincular con el pedido')
    }
  } catch (err) {
    console.error('Error al vincular egreso a pedido:', err)
    alert('Error de conexión al vincular')
  } finally {
    vinculandoPedidoId.value = null
  }
}

const verDetalleOrden = (orden) => {
  selectedOrdenModal.value = orden
  recortesSuccessMsg.value = ''
  if (orden && orden.items) {
    selectedItemIds.value = orden.items.map(i => i.id)
  } else {
    selectedItemIds.value = []
  }
}

const isAllSelected = computed(() => {
  if (!selectedOrdenModal.value || !selectedOrdenModal.value.items || !selectedOrdenModal.value.items.length) return false
  return selectedItemIds.value.length === selectedOrdenModal.value.items.length
})

const toggleSelectAll = () => {
  if (!selectedOrdenModal.value) return
  if (isAllSelected.value) {
    selectedItemIds.value = []
  } else {
    selectedItemIds.value = selectedOrdenModal.value.items.map(i => i.id)
  }
}

const selectedKilosTotal = computed(() => {
  if (!selectedOrdenModal.value || !selectedOrdenModal.value.items) return 0
  return selectedOrdenModal.value.items
    .filter(i => selectedItemIds.value.includes(i.id))
    .reduce((acc, i) => acc + (parseFloat(i.despachada || i.recibida) || 0), 0)
})

const impactarSeleccion = async (orden, destino) => {
  if (!orden || !selectedItemIds.value || selectedItemIds.value.length === 0) {
    alert('Por favor seleccione al menos un producto para sumar.')
    return
  }

  const itemsSeleccionados = orden.items.filter(i => selectedItemIds.value.includes(i.id))
  if (itemsSeleccionados.length === 0) return

  const esDecomiso = destino === 'decomiso'
  const destinoEtiqueta = esDecomiso ? 'DECOMISO' : 'PICADAS'
  const kilosKgs = selectedKilosTotal.value.toFixed(3)

  if (!confirm(`¿Está seguro de sumar los ${kilosKgs} kg de los ${itemsSeleccionados.length} producto(s) seleccionados para ${destinoEtiqueta}?`)) {
    return
  }

  loadingImpacto.value = true
  recortesSuccessMsg.value = ''

  try {
    const res = await fetch('/api/wms/impactar-recortes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orden: orden.orden,
        items: itemsSeleccionados,
        destino
      })
    })

    const data = await res.json()
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Error al actualizar el stock en la base de datos.')
    }

    recortesSuccessMsg.value = data.mensaje
  } catch (err) {
    console.error('Error al sumar selección:', err)
    alert(`Error: ${err.message}`)
  } finally {
    loadingImpacto.value = false
  }
}

const filteredOrdenes = computed(() => {
  if (!reportData.value || !reportData.value.ordenes) return []
  if (!searchTerm.value.trim()) return reportData.value.ordenes

  const q = searchTerm.value.trim().toLowerCase()
  return reportData.value.ordenes.filter(o => 
    String(o.orden).toLowerCase().includes(q) ||
    String(o.destino).toLowerCase().includes(q) ||
    String(o.documento).toLowerCase().includes(q) ||
    String(o.operacion).toLowerCase().includes(q) ||
    String(o.operador).toLowerCase().includes(q)
  )
})

const filteredProductos = computed(() => {
  if (!reportData.value || !reportData.value.productosConsolidados) return []
  if (!searchTerm.value.trim()) return reportData.value.productosConsolidados

  const q = searchTerm.value.trim().toLowerCase()
  return reportData.value.productosConsolidados.filter(p => 
    String(p.codigo).toLowerCase().includes(q) ||
    String(p.producto).toLowerCase().includes(q)
  )
})

const exportarExcel = () => {
  if (!reportData.value) return

  const workbook = XLSX.utils.book_new()

  if (modoVista.value === 'ORDENES') {
    const rows = filteredOrdenes.value.map(o => ({
      'Nº Orden': o.orden,
      'Fecha Cierre': o.fechaCierre,
      'Destino / Entidad': o.destino,
      'Comprobante': o.documento,
      'Operación': o.operacion,
      'Operador': o.operador,
      'Cant. Ítems': o.totalItemsCount,
      'Total Kilos Despachados (kg)': o.totalKilosDespachados
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, ws, 'Órdenes de Egreso')
  } else {
    const rows = filteredProductos.value.map(p => ({
      'Código SKU': p.codigo,
      'Producto / Descripción': p.producto,
      'Cant. Órdenes': p.cantOrdenes,
      'Total Despachado (kg)': p.totalDespachado
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, ws, 'Productos Despachados')
  }

  XLSX.writeFile(workbook, `Egresos_${selectedSiteId.value}_${fechaDesde.value}_al_${fechaHasta.value}.xlsx`)
}

onMounted(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  fechaDesde.value = `${year}-${month}-01`
  fechaHasta.value = `${year}-${month}-${day}`

  cargarSites()
})
</script>

<style scoped>
.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
.row-hover:hover {
  background-color: var(--bg-secondary) !important;
}
</style>
