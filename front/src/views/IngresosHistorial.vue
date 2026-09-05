<template>
  <div class="page-container animate-fade" style="padding: 1rem; max-width: 1400px; margin: 0 auto;">
    
    <!-- Encabezado de la Página -->
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h2 class="page-title" style="margin: 0; font-size: 1.4rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
          <i class="ph ph-receipt" style="color: var(--accent-primary); font-size: 1.6rem;"></i>
          {{ pageTitle }}
        </h2>
        <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
          {{ pageDescription }}
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

        <button 
          class="win-dialog-btn" 
          @click="$router.push('/ingresos')"
          style="display: flex; align-items: center; gap: 0.35rem; font-weight: bold;"
        >
          <i class="ph ph-plus-circle"></i> Cargar Nuevo Ingreso
        </button>
      </div>
    </div>

    <!-- Panel de Filtros por Rango de Fecha, Tipo de Comprobante y Site -->
    <div class="card" style="padding: 1.25rem; border: 2px solid var(--bevel-dark); background: var(--bg-window); margin-bottom: 1.25rem;">
      <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.35rem;">
        <i class="ph ph-calendar"></i> Filtros de Consulta de Ingresos
      </div>

      <form @submit.prevent="consultarIngresos" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; align-items: flex-end;">
        
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

        <!-- Selector de Tipo de Comprobante (WHERE SQL) - Oculto cuando está fijado por la subruta -->
        <div v-if="!isFixedTipoComprobante">
          <label style="font-size: 0.82rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.35rem;">
            Tipo Comprobante (WHERE)
          </label>
          <select 
            v-model="selectedTipoComprobante" 
            class="form-control" 
            style="font-size: 0.88rem; font-weight: bold; height: 38px; border: 1.5px solid var(--bevel-dark);"
            :disabled="loading"
          >
            <option value="TODOS">📋 Todos los Comprobantes</option>
            <option value="26_IN_PT_SU_TR">🚚 Transferencia desde CD (26_IN_PT_SU_TR)</option>
            <option value="26_IN_PT_SU_ED">🏢 Directo de Proveedor (26_IN_PT_SU_ED)</option>
            <option value="26_IN_PT_CM_PR">🔄 Cambios de Prov en Suc (26_IN_PT_CM_PR)</option>
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
            style="width: 100%; height: 38px; font-weight: 800; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem;"
          >
            <i class="ph ph-magnifying-glass" v-if="!loading"></i>
            <i class="ph ph-spinner spinner" v-else></i>
            Consultar Ingresos
          </button>
        </div>

      </form>
    </div>

    <!-- Indicador de Carga -->
    <div v-if="loading" style="text-align: center; padding: 3rem; background: var(--bg-window); border: 2px solid var(--bevel-dark); margin-bottom: 1.25rem;">
      <i class="ph ph-spinner spinner" style="font-size: 3rem; color: var(--accent-primary); margin-bottom: 0.75rem;"></i>
      <h3 style="margin: 0; font-size: 1.1rem; font-weight: bold; color: var(--text-primary);">Consultando órdenes de ingreso en Block WMS...</h3>
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
      <i class="ph ph-magnifying-glass-plus" style="font-size: 3.5rem; color: #16a34a; margin-bottom: 0.85rem; opacity: 0.7;"></i>
      <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--text-primary);">Búsqueda Bajo Demanda</h3>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: var(--text-secondary); max-width: 600px; margin-left: auto; margin-right: auto;">
        Ajuste el rango de fechas, seleccione los filtros deseados y presione el botón <strong style="color: #16a34a;">"Consultar Ingresos"</strong> para iniciar la búsqueda en Block WMS.
      </p>
    </div>

    <!-- Contenido de Resultados -->
    <template v-else-if="reportData">

      <!-- Tarjetas Resumen KPI -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem;">
        
        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block;">
            Órdenes de Ingreso
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: var(--accent-primary);">
            {{ reportData.totalOrdenes || 0 }} órdenes
          </span>
        </div>

        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block;">
            Recortes Ya Cargados
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: #16a34a;">
            {{ totalOrdenesRecorteCargadas }} órdenes
          </span>
        </div>

        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block;">
            Recortes Pendientes
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: #d97706;">
            {{ totalOrdenesRecortePendientes }} órdenes
          </span>
        </div>

        <div class="card" style="padding: 0.85rem 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block;">
            Total Kilos Recibidos
          </span>
          <span style="font-size: 1.6rem; font-weight: 800; color: #0284c7;">
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
            <i class="ph ph-receipt"></i> Ver por Órdenes de Ingreso ({{ reportData.ordenes?.length || 0 }})
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

      <!-- MODO 1: TABLA DE ÓRDENES DE INGRESO (DESKTOP) -->
      <div v-if="modoVista === 'ORDENES'" class="desktop-only-table table-container" style="border: 2px solid var(--bevel-dark); background: var(--bg-window); overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%;">
        <table class="win-table" style="min-width: 900px; width: 100%; border-collapse: collapse; font-family: 'Nunito', sans-serif;">
          <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--bevel-dark); font-size: 0.82rem; text-transform: uppercase;">
              <th style="padding: 0.65rem 0.85rem; text-align: center; width: 11%; white-space: nowrap;">Nº Orden</th>
              <th style="padding: 0.65rem 0.85rem; text-align: center; width: 11%; white-space: nowrap;">Fecha Cierre</th>
              <th style="padding: 0.65rem 0.85rem; text-align: left; width: 20%;">Origen / Proveedor</th>
              <th style="padding: 0.65rem 0.85rem; text-align: left; width: 18%;">Tipo Comprobante</th>
              <th style="padding: 0.65rem 0.85rem; text-align: left; width: 14%;">Operador</th>
              <th style="padding: 0.65rem 0.85rem; text-align: center; width: 12%; white-space: nowrap;">{{ columnaEstadoTitulo }}</th>
              <th style="padding: 0.65rem 0.85rem; text-align: right; width: 10%; white-space: nowrap;">Recibido</th>
              <th style="padding: 0.65rem 0.85rem; text-align: center; width: 6%; white-space: nowrap;">Acción</th>
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
              <td style="padding: 0.65rem 0.85rem; text-align: center; font-family: monospace; font-weight: 800; color: var(--accent-primary); font-size: 0.95rem;">
                {{ o.orden }}
              </td>

              <!-- Fecha -->
              <td style="padding: 0.65rem 0.85rem; text-align: center; font-weight: 700; color: var(--text-primary);">
                {{ o.fechaCierre }}
              </td>

              <!-- Proveedor -->
              <td style="padding: 0.65rem 0.85rem; font-weight: 800; color: var(--text-primary);">
                <i class="ph ph-truck" style="color: var(--accent-primary); margin-right: 0.35rem;"></i>
                {{ o.proveedor }}
              </td>

              <!-- Documento -->
              <td style="padding: 0.65rem 0.85rem; font-size: 0.85rem; color: var(--text-secondary);">
                {{ o.documento }}
              </td>

              <!-- Operador -->
              <td style="padding: 0.65rem 0.85rem; font-size: 0.85rem; color: var(--text-secondary);">
                {{ o.operador }}
              </td>

              <!-- ESTADO (LED CUADRADO SIMULADO) -->
              <td style="padding: 0.65rem 0.85rem; text-align: center; vertical-align: middle;">
                <div 
                  :style="{
                    width: '18px',
                    height: '18px',
                    borderRadius: '3px',
                    margin: '0 auto',
                    backgroundColor: o.recortesImpactados ? '#22c55e' : '#ef4444',
                    border: o.recortesImpactados ? '1.5px solid #16a34a' : '1.5px solid #dc2626',
                    boxShadow: o.recortesImpactados ? '0 0 8px rgba(34, 197, 94, 0.75)' : '0 0 8px rgba(239, 68, 68, 0.75)',
                    transition: 'all 0.2s ease'
                  }"
                  :title="getColumnaTitulo(o) + ': ' + (o.recortesImpactados ? 'Cargado' : 'Pendiente')"
                ></div>
              </td>

              <!-- Kilos Recibidos -->
              <td style="padding: 0.65rem 0.85rem; text-align: right; font-weight: 800; color: #16a34a; font-size: 0.95rem;">
                {{ o.totalKilosRecibidos.toFixed(3) }} kg
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
                <i class="ph ph-receipt" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; opacity: 0.4;"></i>
                No se encontraron órdenes de ingreso en el rango de fechas seleccionado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODO 1: TARJETAS ÓRDENES (MÓVIL) -->
      <div v-if="modoVista === 'ORDENES'" class="mobile-only-cards">
        <div 
          v-for="o in filteredOrdenes" 
          :key="'mob-ord-' + o.orden"
          class="mobile-card"
          @click="verDetalleOrden(o)"
        >
          <div class="mobile-card-header">
            <span class="mobile-badge-ord">Nº {{ o.orden }}</span>
            <span class="mobile-badge-status" :class="o.recortesImpactados ? 'status-ok' : 'status-pending'">
              {{ o.recortesImpactados ? '✅ Cargado' : '⏳ Pendiente' }}
            </span>
          </div>

          <div class="mobile-card-title">
            <i class="ph ph-truck" style="color: var(--accent-primary);"></i>
            {{ o.proveedor }}
          </div>

          <div class="mobile-card-grid">
            <div><strong>Fecha:</strong> {{ o.fechaCierre }}</div>
            <div><strong>Comprobante:</strong> {{ o.documento }}</div>
            <div><strong>Operador:</strong> {{ o.operador }}</div>
            <div>
              <strong>Recibido:</strong> 
              <strong style="color: #16a34a; font-size: 0.95rem; margin-left: 0.25rem;">{{ o.totalKilosRecibidos.toFixed(3) }} kg</strong> 
              <small style="color: var(--text-muted); margin-left: 0.25rem;">({{ o.totalItemsCount }} ítems)</small>
            </div>
          </div>

          <button 
            type="button" 
            class="win-dialog-btn mobile-card-btn"
            @click.stop="verDetalleOrden(o)"
          >
            <i class="ph ph-eye"></i> Ver Detalle / Registrar Vencimientos
          </button>
        </div>

        <div v-if="filteredOrdenes.length === 0" style="text-align: center; padding: 2rem; background: var(--bg-window); border: 2px solid var(--bevel-dark); border-radius: 6px;">
          <i class="ph ph-receipt" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; opacity: 0.4;"></i>
          No se encontraron órdenes de ingreso.
        </div>
      </div>

      <!-- MODO 2: TABLA DE TODOS LOS PRODUCTOS INGRESADOS (DESKTOP) -->
      <div v-else-if="modoVista === 'PRODUCTOS'" class="desktop-only-table table-container" style="border: 2px solid var(--bevel-dark); background: var(--bg-window); overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%;">
        <table class="win-table" style="min-width: 700px; width: 100%; border-collapse: collapse; font-family: 'Nunito', sans-serif;">
          <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--bevel-dark); font-size: 0.82rem; text-transform: uppercase;">
              <th style="padding: 0.65rem 0.85rem; text-align: center; width: 15%; white-space: nowrap;">Código SKU</th>
              <th style="padding: 0.65rem 0.85rem; text-align: left; width: 50%;">Producto / Descripción</th>
              <th style="padding: 0.65rem 0.85rem; text-align: center; width: 15%; white-space: nowrap;">Cant. Órdenes</th>
              <th style="padding: 0.65rem 0.85rem; text-align: right; width: 20%; white-space: nowrap;">Total Recibido (kg)</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="p in filteredProductos" 
              :key="p.codigo"
              style="border-bottom: 1.5px solid var(--bevel-dark); font-size: 0.9rem;"
            >
              <!-- Código SKU -->
              <td style="padding: 0.65rem 0.85rem; text-align: center; font-family: monospace; font-weight: 800; color: var(--accent-primary); font-size: 0.95rem;">
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

              <!-- Total Recibido -->
              <td style="padding: 0.65rem 0.85rem; text-align: right; font-weight: 800; font-size: 1rem; color: #16a34a;">
                {{ p.totalRecibido.toFixed(3) }} kg
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

      <!-- MODO 2: TARJETAS PRODUCTOS (MÓVIL) -->
      <div v-else-if="modoVista === 'PRODUCTOS'" class="mobile-only-cards">
        <div v-for="p in filteredProductos" :key="'mob-prod-' + p.codigo" class="mobile-card">
          <div class="mobile-card-header">
            <span class="mobile-badge-sku">SKU {{ p.codigo }}</span>
            <span class="mobile-badge-status status-ok">{{ p.cantOrdenes }} orden(es)</span>
          </div>
          <div class="mobile-card-title">{{ p.producto }}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
            <span style="font-size: 0.85rem; color: var(--text-secondary);">Total Recibido:</span>
            <strong style="color: #16a34a; font-size: 1rem;">{{ p.totalRecibido.toFixed(3) }} kg</strong>
          </div>
        </div>

        <div v-if="filteredProductos.length === 0" style="text-align: center; padding: 2rem; background: var(--bg-window); border: 2px solid var(--bevel-dark); border-radius: 6px;">
          <i class="ph ph-package" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; opacity: 0.4;"></i>
          No se encontraron productos.
        </div>
      </div>

    </template>

    <!-- MODAL: DETALLE DE LA ÓRDEN SELECCIONADA -->
    <div v-if="selectedOrdenModal" class="modal-backdrop" @click.self="selectedOrdenModal = null" style="position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 0.5rem;">
      <div class="modal-card" style="background: var(--bg-window); border: 2px solid var(--bevel-dark); max-width: 1050px; width: 100%; max-height: 94vh; display: flex; flex-direction: column; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); overflow: hidden;">
        
        <!-- Modal Header -->
        <div style="padding: 0.85rem 1.25rem; border-bottom: 2px solid var(--bevel-dark); background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <i class="ph ph-receipt" style="color: var(--accent-primary);"></i>
              Detalle de Orden de Ingreso Nº {{ selectedOrdenModal.orden }}
            </h3>
            <span style="font-size: 0.82rem; color: var(--text-secondary); font-weight: 600;">
              Fecha Cierre: {{ selectedOrdenModal.fechaCierre }} | Origen: {{ selectedOrdenModal.proveedor }}
            </span>
          </div>

          <button type="button" class="win-dialog-btn" @click="selectedOrdenModal = null" style="padding: 0.25rem 0.6rem; font-weight: bold;">
            <i class="ph ph-x" style="font-size: 1.2rem;"></i>
          </button>
        </div>

        <!-- Modal Body: Información de Cabecera e Ítems -->
        <div style="padding: 1rem 1.25rem; overflow-y: auto; flex: 1;">
          
          <!-- Banner de estado del recorte / vencimiento en la orden -->
          <div 
            v-if="selectedOrdenModal.recortesImpactados" 
            style="padding: 0.65rem 1rem; border: 1.5px solid #86efac; background: #f0fdf4; color: #15803d; font-weight: 800; font-size: 0.85rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; border-radius: 4px;"
          >
            <span style="display: flex; align-items: center; gap: 0.4rem;">
              <i class="ph ph-check-circle" style="font-size: 1.2rem;"></i>
              Estado {{ getColumnaTitulo(selectedOrdenModal) }}: Registrado / Cargado en la base de datos local.
            </span>
            <span style="background: #16a34a; color: #fff; padding: 0.15rem 0.5rem; border-radius: 3px; font-size: 0.75rem;">
              ✅ Cargado
            </span>
          </div>

          <div 
            v-else 
            style="padding: 0.65rem 1rem; border: 1.5px solid #fde68a; background: #fffbeb; color: #b45309; font-weight: 800; font-size: 0.85rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; border-radius: 4px;"
          >
            <span style="display: flex; align-items: center; gap: 0.4rem;">
              <i class="ph ph-clock" style="font-size: 1.2rem;"></i>
              Estado {{ getColumnaTitulo(selectedOrdenModal) }}: Pendiente (Aún no se registraron los {{ getColumnaTitulo(selectedOrdenModal).toLowerCase() }} en la BBDD local).
            </span>
            <span style="background: #d97706; color: #fff; padding: 0.15rem 0.5rem; border-radius: 3px; font-size: 0.75rem;">
              ⏳ Pendiente
            </span>
          </div>

          <!-- Banner de éxito tras click -->
          <div v-if="recortesSuccessMsg" style="padding: 0.75rem 1rem; border: 2px solid #16a34a; background: #f0fdf4; color: #15803d; font-weight: 800; font-size: 0.9rem; margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.5rem; border-radius: 4px;">
            <i class="ph ph-check-circle" style="font-size: 1.3rem;"></i>
            {{ recortesSuccessMsg }}
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; background: var(--bg-secondary); padding: 0.85rem; border: 1.5px solid var(--bevel-dark); margin-bottom: 1rem; font-size: 0.85rem; border-radius: 4px;">
            <div><strong>Comprobante:</strong> {{ selectedOrdenModal.documento }}</div>
            <div><strong>Operador:</strong> {{ selectedOrdenModal.operador }}</div>
            <div><strong>Total Kilos:</strong> <span style="color: #16a34a; font-weight: 800;">{{ selectedOrdenModal.totalKilosRecibidos.toFixed(3) }} kg</span></div>
            <div><strong>Cant. Ítems:</strong> {{ selectedOrdenModal.totalItemsCount }} productos</div>
          </div>

          <!-- Barra de Control Masivo de Vencimiento y Resumen de Selección -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.65rem;">
            <h4 style="font-size: 0.95rem; font-weight: 800; margin: 0; color: var(--text-primary);">
              Productos Ingresados en esta Orden ({{ selectedOrdenModal.items.length }}):
            </h4>

            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <!-- Control Masivo de Vencimiento -->
              <div style="display: flex; align-items: center; gap: 0.4rem; background: var(--bg-secondary); padding: 0.35rem 0.65rem; border: 1.5px solid var(--bevel-dark); border-radius: 4px; font-size: 0.8rem; flex-wrap: wrap;">
                <strong style="color: var(--text-primary); display: flex; align-items: center; gap: 0.3rem;">
                  <i class="ph ph-calendar-plus" style="color: #0284c7; font-size: 1.05rem;"></i> Vencimiento Masivo:
                </strong>
                <input 
                  type="date" 
                  v-model="batchVencimientoFecha" 
                  class="win-input" 
                  style="padding: 2px 6px; font-size: 0.8rem; font-weight: 700; font-family: sans-serif;" 
                />
                <button 
                  type="button" 
                  class="win-dialog-btn" 
                  @click="aplicarVencimientoMasivo" 
                  :disabled="selectedItemIds.length === 0 || !batchVencimientoFecha" 
                  style="padding: 4px 10px; font-weight: 800; font-size: 0.76rem; background: #0284c7; color: #fff;"
                  title="Aplicar esta fecha de vencimiento a los productos seleccionados"
                >
                  Aplicar a Seleccionados ({{ selectedItemIds.length }})
                </button>
              </div>

              <span style="font-size: 0.82rem; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 0.25rem 0.65rem; border-radius: 4px; border: 1px solid #bae6fd; white-space: nowrap;">
                Seleccionados: {{ selectedItemIds.length }} / {{ selectedOrdenModal.items.length }} ({{ selectedKilosTotal.toFixed(3) }} kg)
              </span>
            </div>
          </div>

          <!-- TABLA MODAL (DESKTOP) -->
          <div class="desktop-only-table" style="border: 1.5px solid var(--bevel-dark); overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; border-radius: 4px;">
            <table class="win-table" style="min-width: 820px; width: 100%; border-collapse: collapse; font-family: 'Nunito', sans-serif; font-size: 0.88rem;">
              <thead>
                <tr style="background: var(--bg-secondary); border-bottom: 1.5px solid var(--bevel-dark); font-size: 0.78rem; text-transform: uppercase;">
                  <th style="padding: 0.5rem; text-align: center; width: 45px;">
                    <input 
                      type="checkbox" 
                      :checked="isAllSelected" 
                      @change="toggleSelectAll"
                      style="cursor: pointer; width: 16px; height: 16px;"
                      title="Seleccionar / Deseleccionar todos"
                    />
                  </th>
                  <th style="padding: 0.5rem 0.75rem; text-align: center; width: 110px; white-space: nowrap;">Código SKU</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: left; min-width: 200px;">Producto / Descripción</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: center; width: 110px; white-space: nowrap;">Lote</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: center; width: 160px; white-space: nowrap;">Vencimiento</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: right; width: 120px; white-space: nowrap;">Recibido (kg)</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: left; width: 120px;">Ubicación</th>
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
                  <td style="padding: 0.5rem 0.75rem; text-align: center; font-family: monospace; font-weight: 800; color: var(--accent-primary); white-space: nowrap;">
                    {{ item.codigo }}
                  </td>
                  <td style="padding: 0.5rem 0.75rem; font-weight: 700;">
                    {{ item.producto }}
                  </td>
                  <td style="padding: 0.5rem 0.75rem; text-align: center; font-family: monospace; font-size: 0.82rem; white-space: nowrap;">
                    <span v-if="item.lote && item.lote !== '-'" style="font-weight: 800; color: #475569;">
                      {{ item.lote }}
                    </span>
                    <span v-else-if="item.vencimiento" style="font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; border: 1px solid #bae6fd;">
                      {{ generarLoteVencimiento(item.vencimiento) }}
                    </span>
                    <span v-else style="color: var(--text-secondary);">-</span>
                  </td>
                  <td style="padding: 0.4rem 0.5rem; text-align: center;">
                    <input 
                      type="date" 
                      v-model="item.vencimiento" 
                      class="win-input" 
                      style="padding: 3px 6px; font-size: 0.82rem; font-weight: 700; border: 1.5px solid var(--bevel-dark); border-radius: 4px; width: 140px; background: #fff;" 
                      title="Seleccionar fecha de vencimiento"
                    />
                  </td>
                  <td style="padding: 0.5rem 0.75rem; text-align: right; font-weight: 800; color: #16a34a; white-space: nowrap;">
                    {{ item.recibida.toFixed(3) }} kg
                  </td>
                  <td style="padding: 0.5rem 0.75rem; font-size: 0.82rem; color: var(--text-secondary);">
                    {{ item.ubicacion }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- TARJETAS MODAL ÍTEMS (MÓVIL) -->
          <div class="mobile-only-cards">
            <div 
              v-for="item in selectedOrdenModal.items" 
              :key="'mob-item-' + item.id"
              class="mobile-modal-item-card"
              :class="{ selected: selectedItemIds.includes(item.id) }"
            >
              <div class="mobile-modal-item-top">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input 
                    type="checkbox" 
                    :value="item.id" 
                    v-model="selectedItemIds" 
                    style="width: 20px; height: 20px; cursor: pointer;" 
                  />
                  <span style="font-family: monospace; font-weight: 800; color: var(--accent-primary); font-size: 0.9rem;">
                    SKU {{ item.codigo }}
                  </span>
                </label>
                <strong style="color: #16a34a; font-size: 0.95rem;">{{ item.recibida.toFixed(3) }} kg</strong>
              </div>

              <div style="font-weight: 700; font-size: 0.9rem; margin: 0.4rem 0; color: var(--text-primary);">
                {{ item.producto }}
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                <span>Lote: <strong>{{ item.lote && item.lote !== '-' ? item.lote : (item.vencimiento ? generarLoteVencimiento(item.vencimiento) : '-') }}</strong></span>
                <span>Ubicación: <strong>{{ item.ubicacion }}</strong></span>
              </div>

              <div style="margin-top: 0.5rem; background: var(--bg-secondary); padding: 0.5rem; border: 1.5px solid var(--bevel-dark); border-radius: 4px;">
                <label style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">
                  📅 Fecha de Vencimiento:
                </label>
                <input 
                  type="date" 
                  v-model="item.vencimiento" 
                  class="win-input" 
                  style="width: 100%; height: 38px; font-size: 0.9rem; font-weight: 800; padding: 0.25rem 0.5rem; border: 1.5px solid var(--bevel-dark); border-radius: 4px; background: #fff;" 
                />
              </div>
            </div>
          </div>

        </div>

        <!-- Modal Footer con botones para Sumar Ingreso o Decomiso -->
        <div style="padding: 0.85rem 1.25rem; border-top: 2px solid var(--bevel-dark); background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <!-- Botón Registrar Vencimientos: visible para órdenes 26_IN_PT_SU_ED / Proveedores (cuando NO es TR) -->
            <button 
              v-if="!isOrdenTR"
              type="button" 
              class="win-dialog-btn"
              style="background: #16a34a; color: #fff; border: 1px solid #15803d; font-weight: 800; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.85rem;"
              @click="registrarVencimientos(selectedOrdenModal)"
              :disabled="loadingVencimientos || selectedItemIds.length === 0"
              title="Registrar los vencimientos de los productos seleccionados en la base de datos local"
            >
              <i class="ph ph-spinner spinner" v-if="loadingVencimientos"></i>
              <i class="ph ph-calendar-check" v-else></i>
              📅 Registrar Vencimientos ({{ selectedItemIds.length }})
            </button>

            <!-- Botón Imprimir PDF: Ocultado temporalmente -->
            <button 
              v-if="false"
              type="button" 
              class="win-dialog-btn"
              style="background: #0284c7; color: #fff; border: 1px solid #0369a1; font-weight: 800; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.85rem;"
              @click="imprimirPdfOrden(selectedOrdenModal)"
              title="Imprimir comprobante PDF de la orden de ingreso"
            >
              <i class="ph ph-printer" style="font-size: 1.1rem;"></i>
              🖨️ Imprimir PDF
            </button>

            <!-- Botón Sumar a Recortes: visible únicamente para órdenes 26_IN_PT_SU_TR / Transferencias entre sucursales -->
            <button 
              v-if="isOrdenTR"
              type="button" 
              class="win-dialog-btn"
              style="background: #0284c7; color: #fff; border: 1px solid #0369a1; font-weight: 800; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.85rem;"
              @click="impactarSeleccion(selectedOrdenModal, 'recorte')"
              :disabled="loadingRecortes || selectedItemIds.length === 0"
            >
              <i class="ph ph-spinner spinner" v-if="loadingRecortes"></i>
              <i class="ph ph-scissors" v-else></i>
              📥 Sumar Selección a Recortes ({{ selectedKilosTotal.toFixed(3) }} kg)
            </button>
          </div>

          <button type="button" class="win-dialog-btn win-dialog-btn-ok" @click="selectedOrdenModal = null" style="font-weight: 800;">
            Cerrar Detalle
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as XLSX from 'xlsx'

const route = useRoute()

const isFixedTipoComprobante = computed(() => Boolean(route.meta?.tipoComprobante))

const pageTitle = computed(() => {
  if (route.meta?.titulo) return route.meta.titulo
  if (route.meta?.tipoComprobante === '26_IN_PT_SU_TR') return 'Ingresos Finalizados - Transferencias'
  if (route.meta?.tipoComprobante === '26_IN_PT_SU_ED') return 'Ingresos Finalizados - Proveedores'
  return 'Ingresos Finalizados (Block WMS)'
})

const pageDescription = computed(() => {
  if (route.meta?.tipoComprobante === '26_IN_PT_SU_TR') {
    return 'Consulte las órdenes de ingreso recibidas por transferencias desde CD (26_IN_PT_SU_TR).'
  }
  if (route.meta?.tipoComprobante === '26_IN_PT_SU_ED') {
    return 'Consulte las órdenes de ingreso recibidas directo de proveedor (26_IN_PT_SU_ED).'
  }
  return 'Consulte las órdenes de ingreso recibidas por rango de fechas.'
})

const fechaDesde = ref('')
const fechaHasta = ref('')
const selectedSiteId = ref('194326')
const selectedTipoComprobante = ref(route.meta?.tipoComprobante || 'TODOS')
const loading = ref(false)
const errorMessage = ref('')
const reportData = ref(null)
const modoVista = ref('ORDENES') // 'ORDENES' | 'PRODUCTOS'
const searchTerm = ref('')
const selectedOrdenModal = ref(null)

watch(() => route.meta?.tipoComprobante, (newTipo) => {
  if (newTipo) {
    selectedTipoComprobante.value = newTipo
  } else {
    selectedTipoComprobante.value = 'TODOS'
  }
  if (reportData.value) {
    consultarIngresos()
  }
}, { immediate: true })

const sites = ref([
  { siteId: '194326', nombre: '26 - Distribución. Fiambrería Chaco' }
])

const loadingRecortes = ref(false)
const loadingVencimientos = ref(false)
const recortesSuccessMsg = ref('')

const totalOrdenesRecorteCargadas = computed(() => {
  if (!reportData.value || !reportData.value.ordenes) return 0
  return reportData.value.ordenes.filter(o => o.recortesImpactados).length
})

const totalOrdenesRecortePendientes = computed(() => {
  if (!reportData.value || !reportData.value.ordenes) return 0
  return reportData.value.ordenes.filter(o => !o.recortesImpactados).length
})

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

const consultarIngresos = async () => {
  if (!fechaDesde.value || !fechaHasta.value) {
    errorMessage.value = 'Por favor seleccione las fechas de inicio y fin.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  reportData.value = null
  selectedOrdenModal.value = null
  recortesSuccessMsg.value = ''

  try {
    const res = await fetch('/api/wms/ordenes-ingreso', {
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
      throw new Error(err.error || `Error ${res.status} al consultar órdenes de ingreso`)
    }

    const data = await res.json()
    reportData.value = data
  } catch (err) {
    console.error('Error al consultar órdenes de ingreso:', err)
    errorMessage.value = err.message || 'Error al conectar con Block WMS.'
  } finally {
    loading.value = false
  }
}

const selectedItemIds = ref([])
const batchVencimientoFecha = ref('')

const getColumnaTitulo = (orden) => {
  if (!orden) return 'Recortes'
  const doc = String(orden.documento || '').toUpperCase()
  const ord = String(orden.orden || '').toUpperCase()
  const isTR = doc.includes('26_IN_PT_SU_TR') || doc.includes('_TR') || ord.includes('_TR') || doc.includes('TRANSFERENCIA')
  return isTR ? 'Recortes' : 'Vencimientos'
}

const isOrdenTR = computed(() => {
  return getColumnaTitulo(selectedOrdenModal.value) === 'Recortes'
})

const columnaEstadoTitulo = computed(() => {
  if (selectedTipoComprobante.value === '26_IN_PT_SU_TR') return 'RECORTES'
  if (selectedTipoComprobante.value === '26_IN_PT_SU_ED') return 'VENCIMIENTOS'
  return 'RECORTES / VENCIMIENTOS'
})

const generarLoteVencimiento = (fechaStr) => {
  if (!fechaStr) return '-'
  const clean = String(fechaStr).replace(/\D/g, '')
  return clean ? `V-${clean}` : '-'
}

const aplicarVencimientoMasivo = () => {
  if (!batchVencimientoFecha.value) {
    alert('Por favor seleccione una fecha de vencimiento.')
    return
  }
  if (!selectedOrdenModal.value || !selectedOrdenModal.value.items) return

  selectedOrdenModal.value.items.forEach(item => {
    if (selectedItemIds.value.includes(item.id)) {
      item.vencimiento = batchVencimientoFecha.value
    }
  })
}

const verDetalleOrden = (orden) => {
  selectedOrdenModal.value = orden
  recortesSuccessMsg.value = ''
  batchVencimientoFecha.value = ''
  if (orden && orden.items) {
    orden.items.forEach(i => {
      if (!i.vencimiento) i.vencimiento = ''
    })
    selectedItemIds.value = orden.items.map(i => i.id)
  } else {
    selectedItemIds.value = []
  }
}

const isAllSelected = computed(() => {
  if (!selectedOrdenModal.value || !selectedOrdenModal.value.items.length) return false
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
    .reduce((acc, i) => acc + (parseFloat(i.recibida) || 0), 0)
})

const impactarSeleccion = async (orden, destino) => {
  if (!orden || !selectedItemIds.value || selectedItemIds.value.length === 0) {
    alert('Por favor seleccione al menos un producto para impactar.')
    return
  }

  const itemsSeleccionados = orden.items
    .filter(i => selectedItemIds.value.includes(i.id))
    .map(i => ({
      ...i,
      vencimiento: i.vencimiento || null,
      loteVencimiento: (i.lote && i.lote !== '-') ? i.lote : generarLoteVencimiento(i.vencimiento)
    }))

  if (itemsSeleccionados.length === 0) return

  const esDecomiso = destino === 'decomiso'
  const destinoEtiqueta = esDecomiso ? 'DECOMISO' : 'INGRESO (RECORTE)'
  const kilosKgs = selectedKilosTotal.value.toFixed(3)

  if (!confirm(`¿Está seguro de sumar los ${kilosKgs} kg de los ${itemsSeleccionados.length} producto(s) seleccionados como ${destinoEtiqueta}?`)) {
    return
  }

  loadingRecortes.value = true
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

    orden.recortesImpactados = true
    recortesSuccessMsg.value = data.mensaje
  } catch (err) {
    console.error('Error al sumar selección:', err)
    alert(`Error: ${err.message}`)
  } finally {
    loadingRecortes.value = false
  }
}

const registrarVencimientos = async (orden) => {
  if (!orden || !selectedItemIds.value || selectedItemIds.value.length === 0) {
    alert('Por favor seleccione al menos un producto para registrar vencimiento.')
    return
  }

  const itemsSeleccionados = orden.items
    .filter(i => selectedItemIds.value.includes(i.id))
    .map(i => ({
      ...i,
      vencimiento: i.vencimiento || null,
      loteVencimiento: (i.lote && i.lote !== '-') ? i.lote : generarLoteVencimiento(i.vencimiento)
    }))

  const conVencimiento = itemsSeleccionados.filter(i => i.vencimiento && i.vencimiento !== '-')
  if (conVencimiento.length === 0) {
    alert('Ninguno de los productos seleccionados tiene fecha de vencimiento ingresada. Por favor seleccione o asigne una fecha.')
    return
  }

  if (!confirm(`¿Desea guardar los vencimientos de los ${conVencimiento.length} producto(s) seleccionados en la base de datos local?`)) {
    return
  }

  loadingVencimientos.value = true
  recortesSuccessMsg.value = ''

  try {
    const res = await fetch('/api/wms/registrar-vencimientos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orden: orden.orden,
        items: conVencimiento
      })
    })

    const data = await res.json()
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Error al guardar vencimientos en la base de datos.')
    }

    recortesSuccessMsg.value = data.mensaje
  } catch (err) {
    console.error('Error al registrar vencimientos:', err)
    alert(`Error: ${err.message}`)
  } finally {
    loadingVencimientos.value = false
  }
}

const imprimirPdfOrden = (orden) => {
  if (!orden) return
  const ordenErpVal = orden.codigoOrdenErp || orden.documento || orden.orden || ''
  const url = `/api/wms/pdf-orden-wms?orden=${encodeURIComponent(ordenErpVal)}&siteId=${encodeURIComponent(selectedSiteId.value)}`
  window.open(url, '_blank')
}

const filteredOrdenes = computed(() => {
  if (!reportData.value || !reportData.value.ordenes) return []
  if (!searchTerm.value.trim()) return reportData.value.ordenes

  const q = searchTerm.value.trim().toLowerCase()
  return reportData.value.ordenes.filter(o => 
    String(o.orden).toLowerCase().includes(q) ||
    String(o.proveedor).toLowerCase().includes(q) ||
    String(o.documento).toLowerCase().includes(q) ||
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
      'Origen / Proveedor': o.proveedor,
      'Comprobante': o.documento,
      'Operador': o.operador,
      'Estado Recortes': o.recortesImpactados ? 'Cargado' : 'Pendiente',
      'Cant. Ítems': o.totalItemsCount,
      'Total Kilos Recibidos (kg)': o.totalKilosRecibidos
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, ws, 'Órdenes de Ingreso')
  } else {
    const rows = filteredProductos.value.map(p => ({
      'Código SKU': p.codigo,
      'Producto / Descripción': p.producto,
      'Cant. Órdenes': p.cantOrdenes,
      'Total Recibido (kg)': p.totalRecibido
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, ws, 'Productos Ingresados')
  }

  XLSX.writeFile(workbook, `Ingresos_${selectedSiteId.value}_${fechaDesde.value}_al_${fechaHasta.value}.xlsx`)
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

.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
}

.desktop-only-table {
  display: block;
}

.mobile-only-cards {
  display: none;
}

.mobile-card {
  background: var(--bg-window);
  border: 2px solid var(--bevel-dark);
  border-radius: 6px;
  padding: 0.85rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.mobile-card:active {
  transform: scale(0.99);
  border-color: #0284c7;
}

.mobile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.mobile-badge-ord, .mobile-badge-sku {
  font-family: monospace;
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--accent-primary);
  background: #e0f2fe;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #bae6fd;
}

.mobile-badge-status {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
}
.mobile-badge-status.status-ok {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}
.mobile-badge-status.status-pending {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

.mobile-card-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.mobile-card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 0.6rem 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--bevel-dark);
}

.mobile-card-btn {
  width: 100%;
  margin-top: 0.65rem;
  padding: 0.55rem;
  font-weight: 800;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: #0284c7;
  color: #fff;
  border-radius: 4px;
}

.mobile-modal-item-card {
  background: var(--bg-window);
  border: 1.5px solid var(--bevel-dark);
  border-radius: 6px;
  padding: 0.85rem;
  transition: all 0.15s ease;
}

.mobile-modal-item-card.selected {
  border-color: #0284c7;
  background: #f0f9ff;
}

.mobile-modal-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 768px) {
  .desktop-only-table {
    display: none !important;
  }
  .mobile-only-cards {
    display: flex !important;
    flex-direction: column;
    gap: 0.85rem;
    width: 100%;
  }
  .page-container {
    padding: 0.5rem !important;
  }
  .modal-backdrop {
    padding: 0.25rem !important;
  }
  .modal-card {
    max-height: 98vh !important;
    border-radius: 4px !important;
  }
}
</style>
