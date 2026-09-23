<template>
  <div class="page-container animate-fade">
    <!-- Header de la Página -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title" style="display: flex; align-items: center; gap: 0.5rem;">
          <i class="ph ph-trend-up text-blue"></i>
          Proyección de Stock - Próximo Despacho
          <span style="font-size: 0.72rem; padding: 2px 7px; background: rgba(37, 99, 235, 0.12); color: #1e6ec8; border-radius: 4px; font-weight: 800; border: 1px solid rgba(37, 99, 235, 0.25);">
            DEV / PRUEBA
          </span>
        </h2>
        <p class="page-description">
          Determina si el stock actual alcanza para el próximo despacho a las 6 sucursales, utilizando el promedio de los últimos 4 pedidos históricos del mismo día de la semana.
        </p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
        <button class="btn btn-secondary" @click="exportToExcel" :disabled="loading || !productosFiltrados.length">
          <i class="ph ph-file-xls text-green"></i> Exportar Excel
        </button>
        <button class="btn btn-primary" @click="fetchData" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar
        </button>
      </div>
    </div>

    <!-- Barra de Selección de Próximo Despacho e Info de Fechas Históricas -->
    <div class="card mb-4" style="padding: 0.9rem 1.1rem; background: var(--bg-window); border: 1.5px solid var(--bevel-light);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        
        <!-- Selector de Día Objetivo -->
        <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary);">
            Día de Despacho Objetivo:
          </span>
          <div class="btn-group" style="display: flex; gap: 0.35rem;">
            <button 
              :class="['btn btn-sm', diaSeleccionado === 'auto' ? 'btn-primary' : 'btn-secondary']"
              @click="setDiaDespacho('auto')"
              :disabled="loading"
            >
              <i class="ph ph-magic-wand"></i>
              Auto (Próximo: {{ despachoInfo.diaNombre || '...' }})
            </button>
            <button 
              :class="['btn btn-sm', diaSeleccionado === 'miercoles' ? 'btn-primary' : 'btn-secondary']"
              @click="setDiaDespacho('miercoles')"
              :disabled="loading"
            >
              <i class="ph ph-calendar"></i>
              Miércoles
            </button>
            <button 
              :class="['btn btn-sm', diaSeleccionado === 'sabado' ? 'btn-primary' : 'btn-secondary']"
              @click="setDiaDespacho('sabado')"
              :disabled="loading"
            >
              <i class="ph ph-calendar"></i>
              Sábado
            </button>
          </div>
        </div>

        <!-- Indicador de Próximo Despacho Detectado -->
        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; background: rgba(30, 110, 200, 0.08); padding: 5px 12px; border-radius: 4px; border: 1px solid rgba(30, 110, 200, 0.2); color: #1e6ec8;">
          <i class="ph ph-clock-countdown" style="font-size: 1.1rem;"></i>
          <span>Evaluando Despacho: <strong>{{ despachoInfo.diaNombre }}</strong></span>
        </div>

      </div>

      <!-- Banner de Fechas Históricas Utilizadas en el Cálculo -->
      <div v-if="fechasHistoricas.length > 0" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--bevel-light); display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-secondary); flex-wrap: wrap;">
        <i class="ph ph-info" style="color: #1e6ec8; font-size: 1rem;"></i>
        <span><strong>Fechas de pedidos analizadas (últimos {{ fechasHistoricas.length }} despachos equivalentes):</strong></span>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          <span 
            v-for="(f, idx) in fechasHistoricas" 
            :key="idx"
            style="background: var(--bg-secondary); padding: 2px 7px; border-radius: 3px; font-weight: 700; border: 1px solid var(--bevel-dark); font-size: 0.76rem;"
          >
            #{{ idx + 1 }} {{ formatearFecha(f.fecha) }}
          </span>
        </div>
      </div>

      <!-- Banner de Pedidos Reales Pendientes Detectados -->
      <div v-if="resumen.totalPedidosPendientes > 0" style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px dotted var(--bevel-light); display: flex; align-items: center; gap: 0.6rem; font-size: 0.8rem; flex-wrap: wrap;">
        <i class="ph ph-package" style="color: #0284c7; font-size: 1.1rem;"></i>
        <span><strong>Pedidos pendientes / preparando detectados ({{ resumen.totalPedidosPendientes }}):</strong></span>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          <span 
            v-for="ped in resumen.pedidosPendientesInfo" 
            :key="ped.id"
            style="background: rgba(2, 132, 199, 0.08); padding: 2px 8px; border-radius: 3px; font-weight: 700; border: 1px solid rgba(2, 132, 199, 0.25); color: #0284c7; font-size: 0.76rem;"
          >
            {{ ped.codigo }} - {{ ped.sucursal }} ({{ ped.estado }})
          </span>
        </div>
      </div>
      <div v-else style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px dotted var(--bevel-light); font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem;">
        <i class="ph ph-info" style="font-size: 1rem;"></i>
        <span>No se registran pedidos en estado Pendiente o Preparando en este momento.</span>
      </div>
    </div>

    <!-- Indicadores Sobrios de Resumen -->
    <div class="mb-4" style="display: flex; flex-wrap: wrap; gap: 1.1rem; align-items: center; padding: 0.75rem 1rem; background: var(--bg-window); border: 1px solid var(--bevel-light); border-radius: 4px; font-size: 0.88rem;">
      <span><strong>Total Productos:</strong> {{ resumen.totalProductos }}</span>
      <span style="color: var(--text-muted);">|</span>
      <span style="color: #059669;"><strong>Con Stock Suficiente (OK):</strong> {{ resumen.productosOK }}</span>
      <span style="color: var(--text-muted);">|</span>
      <span style="color: #b45309;"><strong>A Fraccionar:</strong> {{ resumen.productosFaltaFraccionar || 0 }}</span>
      <span style="color: var(--text-muted);">|</span>
      <span style="color: #475569;"><strong>No Pedidos (Frac):</strong> {{ resumen.productosNoPedido || 0 }}</span>
      <span style="color: var(--text-muted);">|</span>
      <span style="color: #dc2626;"><strong>En Faltante:</strong> {{ resumen.productosFaltante }}</span>
      <span style="color: var(--text-muted);">|</span>
      <span style="color: #0f172a;"><strong>Sin Stock:</strong> {{ resumen.productosSinStock || 0 }}</span>
      <span style="color: var(--text-muted);">|</span>
      <span style="color: #0284c7;"><strong>Con Pedido Real:</strong> {{ resumen.productosConPedidoReal || 0 }} ({{ resumen.totalKgPedidosPendientes ? resumen.totalKgPedidosPendientes.toFixed(1) : '0.0' }} kg)</span>
      <span style="color: var(--text-muted);">|</span>
      <span><strong>Consumo Proyectado:</strong> {{ resumen.totalConsumoEsperadoKg ? resumen.totalConsumoEsperadoKg.toFixed(1) : '0.0' }} kg</span>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="card mb-3" style="padding: 0.75rem 1rem; background: var(--bg-window); border: 1px solid var(--bevel-light);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        
        <!-- Pestañas de Filtro por Estado -->
        <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
          <button 
            :class="['btn btn-sm', estadoFiltro === 'todos' ? 'btn-primary' : 'btn-secondary']"
            @click="estadoFiltro = 'todos'"
          >
            Todos ({{ productos.length }})
          </button>
          <button 
            :class="['btn btn-sm', estadoFiltro === 'fraccionar' ? 'btn-primary' : 'btn-secondary']"
            @click="estadoFiltro = 'fraccionar'"
            style="border-color: rgba(217, 119, 6, 0.4);"
          >
            🟡 A Fraccionar ({{ resumen.productosFaltaFraccionar || 0 }})
          </button>
          <button 
            :class="['btn btn-sm', estadoFiltro === 'no_pedido' ? 'btn-primary' : 'btn-secondary']"
            @click="estadoFiltro = 'no_pedido'"
            style="border-color: rgba(100, 116, 139, 0.4);"
          >
            ⚪ No Pedidos ({{ resumen.productosNoPedido || 0 }})
          </button>
          <button 
            :class="['btn btn-sm', estadoFiltro === 'faltantes' ? 'btn-primary' : 'btn-secondary']"
            @click="estadoFiltro = 'faltantes'"
            style="border-color: rgba(220, 38, 38, 0.4);"
          >
            🔴 Faltantes ({{ resumen.productosFaltante }})
          </button>
          <button 
            :class="['btn btn-sm', estadoFiltro === 'sin_stock' ? 'btn-primary' : 'btn-secondary']"
            @click="estadoFiltro = 'sin_stock'"
            style="border-color: rgba(15, 23, 42, 0.4);"
          >
            ⚫ Sin Stock ({{ resumen.productosSinStock || 0 }})
          </button>
          <button 
            :class="['btn btn-sm', estadoFiltro === 'ok' ? 'btn-primary' : 'btn-secondary']"
            @click="estadoFiltro = 'ok'"
            style="border-color: rgba(5, 150, 105, 0.4);"
          >
            🟢 Con Stock OK ({{ resumen.productosOK }})
          </button>
          <button 
            :class="['btn btn-sm', estadoFiltro === 'con_pedido' ? 'btn-primary' : 'btn-secondary']"
            @click="estadoFiltro = 'con_pedido'"
            style="border-color: rgba(2, 132, 199, 0.4);"
          >
            📦 Con Pedido Real ({{ resumen.productosConPedidoReal || 0 }})
          </button>
          <button 
            :class="['btn btn-sm', estadoFiltro === 'sin_historial' ? 'btn-primary' : 'btn-secondary']"
            @click="estadoFiltro = 'sin_historial'"
          >
            Sin Historial ({{ resumen.productosSinHistorial }})
          </button>
        </div>

        <!-- Buscador Predictivo -->
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; max-width: 400px;">
          <i class="ph ph-magnifying-glass" style="color: var(--text-secondary);"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar por código o nombre de producto..." 
            class="form-control" 
            style="height: 32px; font-size: 0.82rem;"
          />
          <button v-if="searchQuery" class="btn-icon" @click="searchQuery = ''" title="Limpiar filtro">
            <i class="ph ph-x-circle"></i>
          </button>
        </div>

      </div>

      <!-- Opciones secundarias -->
      <div style="margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px solid var(--bevel-light); display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary);">
        <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; user-select: none;">
          <input type="checkbox" v-model="ocultarSinMovimiento" />
          <span>Ocultar artículos sin demanda ni stock (0 kg)</span>
        </label>
        <div>
          <button class="btn btn-sm btn-secondary" @click="toggleExpandAll" style="font-size: 0.74rem; padding: 2px 7px;">
            {{ expandidos.size > 0 ? 'Contraer Todos' : 'Expandir Sucursales' }}
          </button>
        </div>
      </div>
    </div>

    <!-- TABLA PRINCIPAL DE PROYECCIÓN -->
    <div class="card" style="margin-bottom: 0;">
      <div class="card-header" style="background-color: #1e6ec8; color: white; padding: 0.65rem 1rem; display: flex; justify-content: space-between; align-items: center;">
        <span class="card-title" style="color: white; font-weight: bold; margin: 0; font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
          <i class="ph ph-chart-bar" style="font-size: 1.2rem;"></i>
          Proyección de Stock y Demanda para el Próximo {{ despachoInfo.diaNombre }} ({{ productosFiltrados.length }})
        </span>
        <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 3px;">
          Calculado sobre 6 Sucursales
        </span>
      </div>

      <div class="table-container" style="max-height: calc(100vh - 310px); overflow-y: auto;">
        <table class="access-table table-compact">
          <thead>
            <tr style="background: var(--bg-window);">
              <th style="width: 30px; text-align: center;"></th>
              <th style="width: 58px; text-align: center;">Código</th>
              <th>Producto</th>
              <th style="width: 78px; text-align: center;">Despacho</th>
              <th style="width: 86px; text-align: right;">Proyectado</th>
              <th style="width: 95px; text-align: right; background: rgba(2, 132, 199, 0.05); color: #0284c7;">Pedido Real</th>
              <th style="width: 82px; text-align: right;">Stock Actual</th>
              <th style="width: 88px; text-align: right; background: rgba(217, 119, 6, 0.04);">Stock Madre</th>
              <th style="width: 78px; text-align: right;">Diferencia</th>
              <th style="width: 78px; text-align: right;">Faltante</th>
              <th style="width: 105px; text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="11" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="ph ph-spinner spinner" style="font-size: 1.4rem; display: block; margin-bottom: 0.4rem;"></i>
                Calculando consumos históricos y proyectando stock...
              </td>
            </tr>
            <tr v-else-if="productosFiltrados.length === 0">
              <td colspan="11" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="ph ph-info" style="font-size: 1.4rem; display: block; margin-bottom: 0.4rem;"></i>
                No se encontraron productos que coincidan con los filtros aplicados.
              </td>
            </tr>
            <template v-else v-for="item in productosFiltrados" :key="item.codigo">
              <!-- Fila Principal del Producto -->
              <tr 
                :style="{
                  backgroundColor: item.estado === 'FALTA_FRACCIONAR' ? 'rgba(217, 119, 6, 0.05)' :
                                   item.estado === 'FALTANTE' ? 'rgba(239, 68, 68, 0.05)' : 
                                   item.estado === 'SIN_STOCK' ? 'rgba(15, 23, 42, 0.05)' : 'transparent',
                  fontWeight: (item.estado === 'FALTA_FRACCIONAR' || item.estado === 'FALTANTE' || item.estado === 'SIN_STOCK') ? '600' : 'normal'
                }"
              >
                <td style="text-align: center; cursor: pointer; padding: 2px !important;" @click="toggleExpand(item.codigo)" title="Ver detalle por sucursal y pedidos pendientes">
                  <i :class="['ph', isExpanded(item.codigo) ? 'ph-caret-down' : 'ph-caret-right']" style="font-size: 0.9rem; color: var(--accent-primary);"></i>
                </td>
                <td style="text-align: center; font-weight: 700; color: var(--text-secondary); font-size: 0.76rem;">
                  {{ item.codigo }}
                </td>
                <td class="col-producto">
                  <div style="font-weight: 700; display: flex; align-items: center; gap: 0.35rem; line-height: 1.15;">
                    <span>{{ item.nombre }}</span>
                    <span v-if="item.activo === false" style="font-size: 0.62rem; padding: 0 4px; background: rgba(100, 116, 139, 0.15); color: #64748b; border-radius: 2px; font-weight: 700;">
                      Inactivo
                    </span>
                  </div>
                </td>
                <td style="text-align: center;">
                  <span style="display: inline-block; padding: 1px 5px; background: rgba(30, 110, 200, 0.08); border-radius: 3px; font-weight: 700; font-size: 0.74rem; color: #1e6ec8;">
                    {{ item.proximoDespacho }}
                  </span>
                </td>
                <!-- Consumo Proyectado Histórico -->
                <td style="text-align: right; font-weight: 700;">
                  {{ item.consumoEsperado.toFixed(1) }} kg
                </td>
                <!-- Pedido Real Pendiente -->
                <td style="text-align: right; background: rgba(2, 132, 199, 0.02);">
                  <div v-if="item.pedidoPendienteKg > 0" style="line-height: 1.15;">
                    <span style="font-weight: 800; color: #0284c7;">{{ item.pedidoPendienteKg.toFixed(1) }} kg</span>
                    <span v-if="item.pedidoPendientePiezas > 0 || item.pedidoPendienteFracciones > 0" style="font-size: 0.67rem; color: var(--text-muted); display: block;">
                      {{ item.pedidoPendientePiezas ? item.pedidoPendientePiezas + 'pz' : '' }}{{ item.pedidoPendientePiezas && item.pedidoPendienteFracciones ? ' ' : '' }}{{ item.pedidoPendienteFracciones ? item.pedidoPendienteFracciones + 'fr' : '' }}
                    </span>
                  </div>
                  <span v-else-if="item.consumoEsperado > 0" style="display: inline-block; font-size: 0.68rem; color: #ea580c; font-weight: 700; background: rgba(234, 88, 12, 0.08); padding: 0 4px; border-radius: 2px;">
                    No pedido
                  </span>
                  <span v-else style="color: var(--text-muted); font-size: 0.72rem;">—</span>
                </td>
                <!-- Stock Actual Depósito -->
                <td style="text-align: right; font-weight: 600;">
                  {{ item.stockActual.toFixed(1) }} kg
                </td>
                <!-- Stock Horma Madre -->
                <td style="text-align: right; background: rgba(217, 119, 6, 0.02);">
                  <div v-if="item.tieneMadre && item.madre" style="line-height: 1.15;">
                    <span 
                      style="font-weight: 700;"
                      :style="{ color: item.madre.stock >= item.faltante ? '#b45309' : '#dc2626' }"
                      :title="`Horma Madre: ${item.madre.codigo} - ${item.madre.nombre}`"
                    >
                      {{ item.madre.stock.toFixed(1) }} kg
                    </span>
                    <span style="font-size: 0.66rem; color: var(--text-muted); display: block;">
                      Madre: {{ item.madre.codigo }}
                    </span>
                  </div>
                  <span v-else style="color: var(--text-muted); font-size: 0.8rem;">-</span>
                </td>
                <td style="text-align: right; font-weight: 700;" :class="item.diferencia < 0 ? 'text-red' : (item.diferencia > 0 ? 'text-green' : 'text-muted')">
                  {{ item.diferencia > 0 ? '+' : '' }}{{ item.diferencia.toFixed(1) }} kg
                </td>
                <td style="text-align: right; font-weight: 800;">
                  <span v-if="item.faltante > 0" :style="{
                    background: item.estado === 'FALTA_FRACCIONAR' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(220, 38, 38, 0.1)',
                    color: item.estado === 'FALTA_FRACCIONAR' ? '#b45309' : '#dc2626',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '0.74rem'
                  }">
                    -{{ item.faltante.toFixed(1) }} kg
                  </span>
                  <span v-else style="color: var(--text-muted); font-weight: normal; font-size: 0.72rem;">—</span>
                </td>
                <td style="text-align: center;">
                  <span :class="['badge', getBadgeClass(item.estado)]">
                    {{ getEstadoLabel(item.estado) }}
                  </span>
                </td>
              </tr>

              <!-- Sub-Fila Desplegable con Detalle de Pedidos Pendientes Reales y de Historial -->
              <tr v-if="isExpanded(item.codigo)" style="background: var(--bg-secondary);">
                <td colspan="11" style="padding: 0.4rem 0.6rem !important;">
                  <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                    
                    <!-- 1. Pedidos Reales Pendientes Actuales -->
                    <div style="border: 1.5px solid rgba(2, 132, 199, 0.35); border-radius: 4px; padding: 0.4rem 0.6rem; background: var(--bg-window);">
                      <div style="font-weight: 800; font-size: 0.78rem; margin-bottom: 0.3rem; color: #0284c7; display: flex; justify-content: space-between; align-items: center;">
                        <span style="display: flex; align-items: center; gap: 0.35rem;">
                          <i class="ph ph-package" style="font-size: 0.95rem;"></i>
                          Pedidos Reales Pendientes / Preparando de este Producto ({{ item.desglosePedidosPendientes.length }})
                        </span>
                        <span style="font-size: 0.74rem; font-weight: 800; background: rgba(2, 132, 199, 0.1); padding: 1px 6px; border-radius: 3px;">
                          Total Pedido Actual: {{ item.pedidoPendienteKg.toFixed(2) }} kg
                        </span>
                      </div>

                      <div v-if="item.desglosePedidosPendientes && item.desglosePedidosPendientes.length > 0">
                        <table style="width: 100%; font-size: 0.78rem; border-collapse: collapse;">
                          <thead>
                            <tr style="border-bottom: 1px solid var(--bevel-light); text-align: left; color: var(--text-muted);">
                              <th style="padding: 3px 6px;">Sucursal</th>
                              <th style="padding: 3px 6px;">Nº Pedido</th>
                              <th style="padding: 3px 6px;">Fecha Pedido</th>
                              <th style="padding: 3px 6px;">Estado Pedido</th>
                              <th style="padding: 3px 6px; text-align: center;">Piezas</th>
                              <th style="padding: 3px 6px; text-align: center;">Fracciones</th>
                              <th style="padding: 3px 6px; text-align: right; font-weight: bold; color: var(--text-primary);">Kg Estimados</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="ped in item.desglosePedidosPendientes" :key="ped.idPedido" style="border-bottom: 1px dotted var(--bevel-light);">
                              <td style="padding: 3px 6px; font-weight: 700;">{{ ped.sucursal }}</td>
                              <td style="padding: 3px 6px; color: var(--text-secondary); font-family: monospace;">{{ ped.codigoPedido }}</td>
                              <td style="padding: 3px 6px; color: var(--text-secondary);">{{ formatearFecha(ped.fecha) }}</td>
                              <td style="padding: 3px 6px;">
                                <span class="badge badge-warning" style="font-size: 0.68rem; padding: 1px 5px;">{{ ped.estado }}</span>
                              </td>
                              <td style="padding: 3px 6px; text-align: center;">{{ ped.piezas || '-' }}</td>
                              <td style="padding: 3px 6px; text-align: center;">{{ ped.fracciones || '-' }}</td>
                              <td style="padding: 3px 6px; text-align: right; font-weight: 800; color: #0284c7;">{{ ped.kgEstimado.toFixed(2) }} kg</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div v-else style="font-size: 0.76rem; padding: 0.2rem 0;">
                        <span v-if="item.consumoEsperado > 0" style="color: #ea580c; font-weight: 600; display: flex; align-items: center; gap: 0.35rem;">
                          <i class="ph ph-warning-circle"></i>
                          Ninguna sucursal solicitó este producto en los pedidos pendientes actuales. Demanda real = 0.00 kg.
                        </span>
                        <span v-else style="color: var(--text-muted);">
                          Sin pedidos pendientes de sucursales para este producto.
                        </span>
                      </div>
                    </div>

                    <!-- 2. Historial de los 4 Despachos Anteriores -->
                    <div style="border: 1px solid var(--bevel-dark); border-radius: 4px; padding: 0.6rem 0.8rem; background: var(--bg-window);">
                      <div style="font-weight: 800; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
                        <span>
                          <i class="ph ph-storefront" style="color: var(--accent-primary);"></i>
                          Desglose Histórico por Sucursal (Últimos 4 despachos de {{ despachoInfo.diaNombre }})
                        </span>
                        <span style="font-weight: normal; color: var(--text-muted); font-size: 0.75rem;">
                          Fórmula: Suma de promedios individuales = {{ item.consumoEsperado.toFixed(3) }} kg
                        </span>
                      </div>

                      <table style="width: 100%; font-size: 0.78rem; border-collapse: collapse;">
                        <thead>
                          <tr style="border-bottom: 1px solid var(--bevel-light); text-align: left; color: var(--text-muted);">
                            <th style="padding: 4px 6px;">Sucursal</th>
                            <th style="padding: 4px 6px; text-align: center;">Envíos Históricos Considerados</th>
                            <th style="padding: 4px 6px; text-align: right;">Total Enviado (kg)</th>
                            <th style="padding: 4px 6px; text-align: right; font-weight: bold; color: var(--text-primary);">Promedio Sucursal (kg)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr 
                            v-for="suc in sucursales" 
                            :key="suc"
                            style="border-bottom: 1px dotted var(--bevel-light);"
                          >
                            <td style="padding: 4px 6px; font-weight: 700;">
                              {{ suc }}
                            </td>
                            <td style="padding: 4px 6px; text-align: center;">
                              <span v-if="item.desgloseSucursales[suc] && item.desgloseSucursales[suc].cantRegistros > 0">
                                {{ item.desgloseSucursales[suc].cantRegistros }} de {{ fechasHistoricas.length }} despachos
                                <span style="color: var(--text-muted); font-size: 0.72rem;">
                                  ({{ item.desgloseSucursales[suc].envios.map(e => Number(e.peso).toFixed(1) + ' kg').join(', ') }})
                                </span>
                              </span>
                              <span v-else style="color: var(--text-muted);">
                                Sin despachos registrados (0 kg)
                              </span>
                            </td>
                            <td style="padding: 4px 6px; text-align: right;">
                              {{ item.desgloseSucursales[suc] ? item.desgloseSucursales[suc].sumaKg.toFixed(2) : '0.00' }} kg
                            </td>
                            <td style="padding: 4px 6px; text-align: right; font-weight: 800; color: #1e6ec8;">
                              {{ item.desgloseSucursales[suc] ? item.desgloseSucursales[suc].promedioKg.toFixed(2) : '0.00' }} kg
                            </td>
                          </tr>
                        </tbody>
                      </table>

                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'

// Estado
const loading = ref(false)
const diaSeleccionado = ref('auto')
const despachoInfo = ref({ dia: 'miercoles', diaNombre: 'Miércoles', fechaEstimada: null })
const fechasHistoricas = ref([])
const sucursales = ref([])
const resumen = ref({
  totalProductos: 0,
  productosOK: 0,
  productosFaltaFraccionar: 0,
  productosFaltante: 0,
  productosSinStock: 0,
  productosJusto: 0,
  productosSinHistorial: 0,
  totalPedidosPendientes: 0,
  pedidosPendientesInfo: [],
  sucursalesConPedidosPendientes: [],
  productosConPedidoReal: 0,
  productosProyectadosSinPedido: 0,
  totalKgPedidosPendientes: 0,
  totalConsumoEsperadoKg: 0,
  totalFaltanteKg: 0
})
const productos = ref([])

// Filtros locales
const searchQuery = ref('')
const estadoFiltro = ref('todos') // 'todos' | 'con_pedido' | 'proyectados_sin_pedido' | 'fraccionar' | 'faltantes' | 'sin_stock' | 'ok' | 'sin_historial'
const ocultarSinMovimiento = ref(true)
const expandidos = ref(new Set())

const toggleExpand = (codigo) => {
  if (expandidos.value.has(codigo)) {
    expandidos.value.delete(codigo)
  } else {
    expandidos.value.add(codigo)
  }
}

const isExpanded = (codigo) => expandidos.value.has(codigo)

const toggleExpandAll = () => {
  if (expandidos.value.size > 0) {
    expandidos.value.clear()
  } else {
    productosFiltrados.value.forEach(p => expandidos.value.add(p.codigo))
  }
}

const setDiaDespacho = (dia) => {
  diaSeleccionado.value = dia
  fetchData()
}

const formatearFecha = (fStr) => {
  if (!fStr) return ''
  const parts = fStr.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return fStr
}

const getBadgeClass = (estado) => {
  if (estado === 'FALTA_FRACCIONAR') return 'badge-fraccionar'
  if (estado === 'NO_PEDIDO') return 'badge-no-pedido'
  if (estado === 'FALTANTE') return 'badge-danger'
  if (estado === 'SIN_STOCK') return 'badge-dark'
  if (estado === 'JUSTO') return 'badge-warning'
  if (estado === 'OK' || estado === 'OK_SIN_HISTORIAL') return 'badge-success'
  return 'badge-muted'
}

const getEstadoLabel = (estado) => {
  if (estado === 'FALTA_FRACCIONAR') return 'A FRACCIONAR'
  if (estado === 'NO_PEDIDO') return 'NO PEDIDO'
  if (estado === 'FALTANTE') return 'FALTANTE'
  if (estado === 'SIN_STOCK') return 'SIN STOCK'
  if (estado === 'JUSTO') return 'JUSTO'
  if (estado === 'OK') return 'OK'
  if (estado === 'OK_SIN_HISTORIAL') return 'OK (Sin vtas)'
  return 'SIN HISTORIAL'
}

// Fetch de datos desde el backend
const fetchData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (diaSeleccionado.value !== 'auto') {
      params.append('diaDespacho', diaSeleccionado.value)
    }

    const res = await fetch(`/api/reportes/proximo-despacho?${params.toString()}`)
    const data = await res.json()

    if (data.ok) {
      despachoInfo.value = data.despachoInfo
      fechasHistoricas.value = data.fechasHistoricas || []
      sucursales.value = data.sucursales || []
      resumen.value = data.resumen || {}
      productos.value = data.productos || []
    }
  } catch (error) {
    console.error('Error al cargar proyección de próximo despacho:', error)
  } finally {
    loading.value = false
  }
}

// Filtro computado
const productosFiltrados = computed(() => {
  let list = productos.value

  if (ocultarSinMovimiento.value) {
    list = list.filter(p => p.consumoEsperado > 0 || p.stockActual > 0 || p.pedidoPendienteKg > 0)
  }

  if (estadoFiltro.value === 'con_pedido') {
    list = list.filter(p => p.tienePedidoReal)
  } else if (estadoFiltro.value === 'no_pedido') {
    list = list.filter(p => p.estado === 'NO_PEDIDO')
  } else if (estadoFiltro.value === 'fraccionar') {
    list = list.filter(p => p.estado === 'FALTA_FRACCIONAR')
  } else if (estadoFiltro.value === 'faltantes') {
    list = list.filter(p => p.estado === 'FALTANTE')
  } else if (estadoFiltro.value === 'sin_stock') {
    list = list.filter(p => p.estado === 'SIN_STOCK')
  } else if (estadoFiltro.value === 'ok') {
    list = list.filter(p => p.estado === 'OK' || p.estado === 'OK_SIN_HISTORIAL')
  } else if (estadoFiltro.value === 'sin_historial') {
    list = list.filter(p => p.estado === 'SIN_HISTORIAL')
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list

  return list.filter(p => {
    const cod = String(p.codigo || '').toLowerCase()
    const nom = String(p.nombre || '').toLowerCase()
    return cod.includes(q) || nom.includes(q)
  })
})

// Exportar a Excel
const exportToExcel = () => {
  if (productosFiltrados.value.length === 0) return

  const dataToExport = productosFiltrados.value.map(item => {
    const row = {
      'Código': item.codigo,
      'Producto': item.nombre,
      'Tiene Madre (Derivado)': item.tieneMadre ? 'Sí' : 'No',
      'Código Madre': item.madre ? item.madre.codigo : '',
      'Nombre Madre': item.madre ? item.madre.nombre : '',
      'Stock Madre (kg)': item.madre ? item.madre.stock : '',
      'Próximo Despacho': item.proximoDespacho,
      'Consumo Proyectado (kg)': item.consumoEsperado,
      'Pedido Real Pendiente (kg)': item.pedidoPendienteKg,
      'Piezas Pedidas (pz)': item.pedidoPendientePiezas,
      'Fracciones Pedidas (fr)': item.pedidoPendienteFracciones,
      'Proyectado Sin Pedido Actual': item.proyectadoSinPedido ? 'SÍ' : 'NO',
      'Stock Actual (kg)': item.stockActual,
      'Diferencia (kg)': item.diferencia,
      'Faltante (kg)': item.faltante > 0 ? item.faltante : 0,
      'Estado': getEstadoLabel(item.estado)
    }

    // Agregar desglose de cada sucursal
    sucursales.value.forEach(suc => {
      const sucData = item.desgloseSucursales[suc]
      row[`Promedio ${suc} (kg)`] = sucData ? sucData.promedioKg : 0
    })

    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(dataToExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Proyección Despacho')

  const fileName = `Proyeccion_Stock_Despacho_${despachoInfo.value.diaNombre}_${new Date().toISOString().slice(0,10)}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* Estilos ultracompactos para la tabla de proyección */
.table-compact {
  width: 100% !important;
  border-collapse: collapse !important;
}

.table-compact th {
  padding: 4px 6px !important;
  font-size: 0.72rem !important;
  font-weight: 800 !important;
  line-height: 1.15 !important;
  letter-spacing: 0.02em;
  white-space: nowrap !important;
}

.table-compact td {
  padding: 3px 6px !important;
  font-size: 0.77rem !important;
  line-height: 1.2 !important;
  white-space: nowrap;
  vertical-align: middle !important;
}

.table-compact td.col-producto {
  white-space: normal !important;
  word-break: break-word;
  max-width: 320px;
}

.text-green {
  color: var(--accent-success, #059669);
}
.text-red {
  color: var(--accent-danger, #dc2626);
}
.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.badge-fraccionar {
  background: rgba(217, 119, 6, 0.14);
  color: #b45309;
  border: 1px solid rgba(217, 119, 6, 0.35);
  font-weight: 800;
  padding: 1px 5px !important;
  font-size: 0.68rem !important;
  border-radius: 3px;
}
.badge-danger {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.3);
  font-weight: 800;
  padding: 1px 5px !important;
  font-size: 0.68rem !important;
  border-radius: 3px;
}
.badge-dark {
  background: rgba(15, 23, 42, 0.12);
  color: #0f172a;
  border: 1px solid rgba(15, 23, 42, 0.35);
  font-weight: 800;
  padding: 1px 5px !important;
  font-size: 0.68rem !important;
  border-radius: 3px;
}
.badge-warning {
  background: rgba(217, 119, 6, 0.12);
  color: #d97706;
  border: 1px solid rgba(217, 119, 6, 0.3);
  font-weight: 800;
  padding: 1px 5px !important;
  font-size: 0.68rem !important;
  border-radius: 3px;
}
.badge-success {
  background: rgba(5, 150, 105, 0.12);
  color: #059669;
  border: 1px solid rgba(5, 150, 105, 0.3);
  font-weight: 800;
  padding: 1px 5px !important;
  font-size: 0.68rem !important;
  border-radius: 3px;
}
.badge-muted {
  background: rgba(100, 116, 139, 0.12);
  color: #64748b;
  border: 1px solid rgba(100, 116, 139, 0.3);
  font-weight: 700;
  padding: 1px 5px !important;
  font-size: 0.68rem !important;
  border-radius: 3px;
}
.badge-no-pedido {
  background: rgba(148, 163, 184, 0.14);
  color: #475569;
  border: 1px solid rgba(148, 163, 184, 0.35);
  font-weight: 700;
  padding: 1px 5px !important;
  font-size: 0.68rem !important;
  border-radius: 3px;
}
</style>
