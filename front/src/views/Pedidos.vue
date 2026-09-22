<template>
  <div class="page-container animate-fade">
    
    <!-- PESTAÑAS PRINCIPALES DE NAVEGACIÓN -->
    <div v-if="!selectedPedido" class="card-tabs no-print mb-3" style="display: flex; gap: 0.25rem; position: relative; z-index: 2;">
      <button 
        :class="['btn', activeMainTab === 'pedidos' ? 'btn-primary' : 'btn-secondary']" 
        @click="activeMainTab = 'pedidos'"
        style="padding: 0.5rem 1rem; font-weight: bold; display: flex; align-items: center; gap: 0.4rem;"
      >
        <i class="ph ph-shopping-cart"></i> Gestión de Pedidos
      </button>
      <button 
        :class="['btn', activeMainTab === 'detalles' ? 'btn-primary' : 'btn-secondary']" 
        @click="activeMainTab = 'detalles'"
        style="padding: 0.5rem 1rem; font-weight: bold; display: flex; align-items: center; gap: 0.4rem;"
      >
        <i class="ph ph-table"></i> Detalles Requeridos (Matriz)
      </button>
    </div>

    <!-- VISTA 1: LISTADO PRINCIPAL DE PEDIDOS (Cuando NO hay un pedido seleccionado) -->
    <div v-if="!selectedPedido && activeMainTab === 'pedidos'">
      <!-- Header de Página -->
      <div class="page-header">
        <div class="header-content">
          <h2 class="page-title"><i class="ph ph-shopping-cart"></i> Gestión de Pedidos</h2>
          <p class="page-description">Consulta el listado completo de pedidos de sucursales, controla su preparación y consulta los remitos de envío.</p>
        </div>
        <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-secondary" @click="fetchPedidos" :disabled="loading" style="display: flex; align-items: center; gap: 0.35rem;">
            <i class="ph ph-spinner spinner" v-if="loading"></i>
            <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
          </button>
        </div>
      </div>

      <!-- Alertas -->
      <div v-if="alert.show" :class="['alert-box mb-4', alert.type]" style="margin-bottom: 1rem;">
        {{ alert.message }}
      </div>

      <!-- GRID DE DOS COLUMNAS: HISTORIAL DE PEDIDOS (IZQ) Y ALERTA DE STOCK (DER) -->
      <div :style="{ display: 'grid', gridTemplateColumns: productosConDeficit.length > 0 ? '1.1fr 0.9fr' : '1fr', gap: '1rem', alignItems: 'start' }">
        
        <!-- COLUMNA 1: HISTORIAL DE PEDIDOS -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background-color: #0b5394; padding: 0.6rem 0.85rem;">
            <span class="card-title" style="color: white; font-weight: bold; margin: 0; font-size: 0.9rem;">
              Historial de Pedidos ({{ filteredAndSortedPedidos.length }})
            </span>
            
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <!-- Filtro por Estado -->
              <select 
                v-model="statusFilter" 
                class="form-control" 
                style="height: 28px; font-size: 0.78rem; padding: 0 0.4rem; width: 145px; background: var(--bg-window); color: var(--text-primary); border: none;"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Preparando">En Preparación</option>
                <option value="Listo">Listos para Enviar</option>
                <option value="Enviado">Enviados</option>
                <option value="Completado">Completados</option>
                <option value="Vinculados">🔗 Con Egreso Block</option>
                <option value="NoVinculados">Sin Egreso Block</option>
              </select>

              <!-- Buscador Predictivo -->
              <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.15rem 0.4rem; border-radius: 0; height: 28px; width: 180px;">
                <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  placeholder="Buscar sucursal u orden..." 
                  style="border: none; outline: none; font-size: 0.78rem; background: transparent; width: 100%; color: var(--text-primary);"
                />
                <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
                  <i class="ph ph-x-circle"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Tabla de Historial: Fecha | Destino | % Completo | Estado | Egreso Block -->
          <div class="table-container" style="max-height: calc(100vh - 250px); overflow-y: auto;">
            <table class="access-table" style="width: 100%; font-size: 0.82rem;">
              <thead>
                <tr>
                  <th @click="sortBy('fecha')" class="sortable">Fecha <i v-if="sortKey === 'fecha'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                  <th @click="sortBy('sucursal')" class="sortable">Destino <i v-if="sortKey === 'sucursal'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                  <th @click="sortBy('porcentaje')" class="sortable text-center">% Completo <i v-if="sortKey === 'porcentaje'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                  <th @click="sortBy('estado')" class="sortable text-center">Estado <i v-if="sortKey === 'estado'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                  <th @click="sortBy('wms_orden_egreso')" class="sortable text-center">Egreso Block <i v-if="sortKey === 'wms_orden_egreso'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="p in filteredAndSortedPedidos" 
                  :key="p.id" 
                  class="clickable-row" 
                  @click="selectPedido(p)" 
                  style="cursor: pointer;"
                >
                  <td>{{ formatDate(p.fecha) }}</td>
                  <td>
                    <span class="fw-bold" style="color: var(--text-primary);">{{ p.sucursal || '-' }}</span>
                  </td>
                  <td class="text-center font-mono fw-bold">
                    <span :style="{ color: getPedidoPorcentajeCompleto(p) === 100 ? 'var(--accent-success)' : (getPedidoPorcentajeCompleto(p) > 0 ? '#2563eb' : 'var(--text-muted)') }">
                      {{ getPedidoPorcentajeCompleto(p) }}%
                    </span>
                  </td>
                  <td class="text-center">
                    <span :style="getEstadoTextStyle(p.estado)">{{ p.estado }}</span>
                  </td>
                  <td class="text-center" style="white-space: nowrap;">
                    <span 
                      v-if="p.wms_orden_egreso" 
                      class="badge" 
                      style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-family: monospace; font-size: 0.74rem; display: inline-flex; align-items: center; gap: 0.3rem; padding: 2px 7px; border-radius: 4px; font-weight: 700;"
                      :title="`Orden Block: #${p.wms_orden_egreso} ${p.wms_documento ? '| Remito: ' + p.wms_documento : ''} | Despachado: ${parseFloat(p.wms_despachado_kg || 0).toFixed(3)} kg`"
                    >
                      <i class="ph ph-link-simple" style="font-size: 0.82rem;"></i>
                      #{{ p.wms_orden_egreso }}
                      <span v-if="p.wms_despachado_kg && parseFloat(p.wms_despachado_kg) > 0" style="font-size: 0.68rem; opacity: 0.85; font-weight: normal;">
                        ({{ parseFloat(p.wms_despachado_kg).toFixed(1) }} kg)
                      </span>
                    </span>
                    <span v-else style="color: var(--text-muted); font-size: 0.8rem; opacity: 0.5;">
                      —
                    </span>
                  </td>
                </tr>

                <!-- Estado de Carga -->
                <tr v-if="loading">
                  <td colspan="5" class="text-center p-4">
                    <i class="ph ph-spinner spinner icon-xl"></i><br>
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">Cargando listado de pedidos...</span>
                  </td>
                </tr>

                <!-- Lista Vacía -->
                <tr v-if="!loading && filteredAndSortedPedidos.length === 0">
                  <td colspan="5" class="text-center p-4 text-muted">
                    <i class="ph ph-shopping-cart icon-xl mb-2" style="font-size: 2rem; opacity: 0.5;"></i><br>
                    <span>No se encontraron pedidos con el criterio de búsqueda seleccionado.</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- COLUMNA 2: TABLA DE ALERTAS DE STOCK (DEMANDA TOTAL VS STOCK CD) -->
        <div v-if="productosConDeficit.length > 0" class="card" style="border: 1px solid var(--accent-danger); background: var(--bg-secondary); margin-bottom: 0;">
          <div class="card-header" style="background-color: #991b1b; color: white; padding: 0.6rem 0.85rem; display: flex; justify-content: space-between; align-items: center;">
            <span class="card-title" style="color: white; font-weight: bold; margin: 0; font-size: 0.88rem; display: flex; align-items: center; gap: 0.4rem;">
              <i class="ph ph-warning-circle" style="font-size: 1.1rem;"></i>
              Alerta de Stock CD Insuficiente ({{ productosConDeficit.length }})
            </span>
            <span style="font-size: 0.72rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 2px; font-weight: bold;">
              Pedidos Activos
            </span>
          </div>

          <div class="table-container" style="max-height: calc(100vh - 250px); overflow-y: auto;">
            <table class="access-table" style="width: 100%; font-size: 0.82rem;">
              <thead>
                <tr style="background: var(--bg-window);">
                  <th style="width: 80px;">Código</th>
                  <th>Producto</th>
                  <th class="text-right" style="color: var(--accent-danger);">Total a Enviar</th>
                  <th class="text-right" style="color: var(--accent-orange);">Stock CD</th>
                  <th class="text-right" style="color: var(--accent-danger);">Déficit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in productosConDeficit" :key="p.codigo">
                  <td><strong class="font-mono">{{ p.codigo }}</strong></td>
                  <td class="fw-bold">{{ p.nombre }}</td>
                  <td class="text-right font-mono fw-bold text-red">{{ p.totalAEnviar.toFixed(2) }}</td>
                  <td class="text-right font-mono fw-bold" :style="{ color: p.stockCD <= 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }">
                    {{ p.stockCD.toFixed(2) }}
                  </td>
                  <td class="text-right font-mono fw-bold text-red">
                    +{{ (p.totalAEnviar - p.stockCD).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    <!-- VISTA 2: DETALLE COMPLETO DEL PEDIDO (PÁGINA DEDICADA) -->
    <div v-else-if="selectedPedido" class="animate-fade">
      <!-- Encabezado de la vista con Botón de Regreso -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button class="btn btn-secondary" @click="volverALaLista" style="display: flex; align-items: center; gap: 0.4rem; font-weight: bold; font-size: 0.85rem; padding: 0.4rem 0.8rem; background: var(--bg-window);">
            <i class="ph ph-arrow-left" style="font-size: 1.1rem; color: var(--accent-primary);"></i> Volver a Pedidos
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.25rem; font-weight: bold; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <span>{{ selectedPedido.sucursal || 'Sin Sucursal' }}</span>
              <span style="color: var(--text-muted); font-weight: normal;">|</span>
              <span>{{ formatDateDayMonth(selectedPedido.fecha) }}</span>
              <span style="color: var(--text-muted); font-weight: normal;">|</span>
              <span :style="getEstadoTextStyle(selectedPedido.estado)">{{ selectedPedido.estado }}</span>
            </h2>
          </div>
        </div>

        <!-- Acciones Destacadas Superior -->
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <!-- Botón Vincular / Estado Egreso Block WMS -->
          <button 
            v-if="!selectedPedido.wms_orden_egreso"
            type="button" 
            class="btn btn-secondary" 
            style="display: flex; align-items: center; gap: 0.35rem; font-weight: 700; background: #fef2f2; border-color: #ef4444; color: #dc2626;"
            @click="openVincularModal(selectedPedido)"
            title="Vincular con una orden de egreso / despacho de Block WMS"
          >
            <i class="ph ph-link" style="font-size: 1.1rem;"></i> Vincular Egreso Block
          </button>
          <div 
            v-else 
            style="display: flex; align-items: center; gap: 0.35rem; background: #f0fdf4; border: 1.5px solid #16a34a; border-radius: 4px; padding: 0.25rem 0.6rem;"
          >
            <span style="font-size: 0.8rem; font-weight: 800; color: #15803d; display: flex; align-items: center; gap: 0.3rem;" :title="'Documento: ' + (selectedPedido.wms_documento || 'S/N')">
              <i class="ph ph-link-simple" style="font-size: 1.1rem;"></i> Block #{{ selectedPedido.wms_orden_egreso }} ({{ parseFloat(selectedPedido.wms_despachado_kg || 0).toFixed(3) }} kg)
            </span>
            <button 
              type="button" 
              class="btn btn-sm btn-secondary" 
              style="padding: 1px 5px; font-size: 0.72rem; color: #dc2626; border-color: #f87171;" 
              @click="desvincularEgreso(selectedPedido)" 
              title="Desvincular egreso de Block"
            >
              <i class="ph ph-x"></i>
            </button>
          </div>

          <button 
            v-if="selectedPedido.estado === 'Pendiente' || selectedPedido.estado === 'Procesando'"
            type="button" 
            class="btn btn-success" 
            style="display: flex; align-items: center; gap: 0.35rem; font-weight: 600;"
            @click="openConfirmEnvioModal"
          >
            <i class="ph ph-check-circle" style="font-size: 1.1rem;"></i> Confirmar Preparación
          </button>

          <button 
            v-if="selectedPedido.estado === 'Listo'"
            type="button" 
            class="btn btn-success" 
            style="display: flex; align-items: center; gap: 0.35rem; font-weight: 600;"
            @click="marcarComoEnviado(selectedPedido)"
            :disabled="markingEnviado"
          >
            <i class="ph ph-spinner spinner" v-if="markingEnviado"></i>
            <i class="ph ph-truck" v-else style="font-size: 1.1rem;"></i>
            {{ markingEnviado ? 'Actualizando...' : 'Entregar / Enviar' }}
          </button>

          <button class="btn btn-secondary" @click="openControlModal(selectedPedido)" style="display: flex; align-items: center; gap: 0.3rem;">
            <i class="ph ph-check-square" style="font-size: 1rem; color: var(--accent-primary);"></i> Control de Piezas
          </button>
          <button class="btn btn-secondary" @click="openBarcodesModalForPedido(selectedPedido)" title="Ver Códigos de Barra de los productos de este pedido" style="display: flex; align-items: center; gap: 0.35rem; font-weight: 700; background: var(--bg-window);">
            <i class="ph ph-barcode" style="font-size: 1.1rem; color: #0284c7;"></i> Códigos de Barra
          </button>
          <button class="btn btn-secondary" @click="printPedidoPdf(selectedPedido)" title="Generar PDF con Código, Nombre, Kilos y Código de Barras" style="display: flex; align-items: center; gap: 0.35rem; font-weight: 700; background: #ef4444; color: #fff; border-color: #dc2626;">
            <i class="ph ph-file-pdf" style="font-size: 1.1rem;"></i> Generar PDF (Barras)
          </button>
          <button class="btn btn-secondary" @click="printPedido(selectedPedido)" title="Imprimir Remito de Preparación" style="display: flex; align-items: center; gap: 0.35rem; font-weight: 600;">
            <i class="ph ph-printer" style="font-size: 1.1rem; color: #0b5394;"></i> Imprimir Remito
          </button>
          <button class="btn btn-secondary" @click="openEditModal(selectedPedido)" title="Modificar Datos y Productos del Pedido" style="display: flex; align-items: center; gap: 0.35rem; font-weight: 600;">
            <i class="ph ph-pencil-simple" style="font-size: 1.1rem; color: var(--accent-primary);"></i> Modificar
          </button>
          <button class="btn btn-secondary text-red" @click="confirmDeletePedido(selectedPedido)" title="Borrar Pedido Definitivamente" style="display: flex; align-items: center; gap: 0.35rem; font-weight: 600;">
            <i class="ph ph-trash" style="font-size: 1.1rem;"></i> Borrar
          </button>
        </div>
      </div>

      <!-- Alertas -->
      <div v-if="alert.show" :class="['alert-box mb-4', alert.type]" style="margin-bottom: 1rem;">
        {{ alert.message }}
      </div>

      <!-- Card Principal de Detalle -->
      <div class="card" style="padding: 1.25rem;">
        
        <!-- MODO DETALLE READ-ONLY -->
        <div v-if="!isEditingMode" style="display: flex; flex-direction: column; gap: 1.25rem;">

          <!-- Barra de Sub-pestañas: Preparación vs Conciliación Block -->
          <div style="display: flex; gap: 0.35rem; border-bottom: 2px solid var(--bevel-dark); padding-bottom: 0.65rem; margin-bottom: 0.25rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <button 
                type="button" 
                :class="['btn', subTabPedido === 'preparacion' ? 'btn-primary' : 'btn-secondary']"
                @click="subTabPedido = 'preparacion'"
                style="font-size: 0.84rem; font-weight: 800; padding: 0.4rem 0.85rem; display: flex; align-items: center; gap: 0.35rem;"
              >
                <i class="ph ph-package"></i> Preparación del Pedido
              </button>

              <button 
                type="button" 
                :class="['btn', subTabPedido === 'conciliacion' ? 'btn-primary' : 'btn-secondary']"
                @click="cambiarASubTabConciliacion"
                style="font-size: 0.84rem; font-weight: 800; padding: 0.4rem 0.85rem; display: flex; align-items: center; gap: 0.35rem;"
              >
                <i class="ph ph-git-diff"></i> Conciliación Block WMS
                <span 
                  v-if="selectedPedido.wms_orden_egreso" 
                  class="badge badge-success" 
                  style="font-size: 0.68rem; padding: 1px 6px; border-radius: 4px;"
                >
                  Vinculado (#{{ selectedPedido.wms_orden_egreso }})
                </span>
                <span 
                  v-else 
                  class="badge badge-secondary" 
                  style="font-size: 0.68rem; padding: 1px 6px; border-radius: 4px; opacity: 0.85;"
                >
                  Sin vincular
                </span>
              </button>
            </div>

            <!-- Acciones de Conciliación si está activa -->
            <div v-if="subTabPedido === 'conciliacion' && selectedPedido.wms_orden_egreso" style="display: flex; gap: 0.4rem; align-items: center;">
              <button 
                type="button" 
                class="btn btn-secondary btn-sm"
                @click="exportarConciliacionExcel"
                style="display: flex; align-items: center; gap: 0.3rem; font-weight: 700; font-size: 0.78rem;"
              >
                <i class="ph ph-file-xls text-green"></i> Exportar Excel
              </button>
              <button 
                type="button" 
                class="btn btn-secondary btn-sm"
                @click="fetchConciliacion(selectedPedido)"
                :disabled="loadingConciliacion"
                style="display: flex; align-items: center; gap: 0.3rem; font-weight: 700; font-size: 0.78rem;"
              >
                <i class="ph ph-spinner spinner" v-if="loadingConciliacion"></i>
                <i class="ph ph-arrows-clockwise" v-else></i> Refrescar
              </button>
            </div>
          </div>

          <!-- SUB-VISTA 1: TABLAS LADO A LADO (PREPARACIÓN) -->
          <div v-if="subTabPedido === 'preparacion'" :style="{ display: 'grid', gridTemplateColumns: itemsNoEnviados.length > 0 ? '1fr 1fr' : '1fr', gap: '1rem', alignItems: 'start' }">
            
            <!-- Ítems Enviados -->
            <div>
              <h3 style="font-size: 0.9rem; font-weight: bold; margin-bottom: 0.5rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
                <i class="ph ph-check-circle text-green" style="font-size: 1.1rem;"></i> Ítems Enviados ({{ itemsEnviados.length }})
              </h3>
              <div class="table-container">
                <table class="access-table compact-items-table" style="width: 100%; font-size: 0.78rem;">
                  <thead>
                    <tr>
                      <th style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Código</th>
                      <th style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Producto</th>
                      <th class="text-right" style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Pzas Ped.</th>
                      <th class="text-right" style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Frac Ped.</th>
                      <th class="text-right" style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Pzas Env.</th>
                      <th class="text-right" style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Frac Env.</th>
                      <th class="text-right" style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Peso Env.</th>
                      <th class="text-right" style="color: var(--accent-orange); padding: 0.25rem 0.35rem; font-size: 0.75rem;">Stk CD</th>
                      <th class="text-center" style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in itemsEnviados" :key="item.id">
                      <td style="padding: 0.25rem 0.35rem;"><strong>{{ item.codigo_producto }}</strong></td>
                      <td style="padding: 0.25rem 0.35rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="item.Producto?.nombre">{{ item.Producto?.nombre || 'Sin nombre' }}</td>
                      <td class="text-right" style="padding: 0.25rem 0.35rem;">{{ item.pieza || 0 }}</td>
                      <td class="text-right" style="padding: 0.25rem 0.35rem;">{{ parseFloat(item.fraccion || 0).toFixed(3) }}</td>
                      <td class="text-right fw-bold text-green" style="padding: 0.25rem 0.35rem;">{{ item.cantidad_enviada || 0 }}</td>
                      <td class="text-right fw-bold text-green" style="padding: 0.25rem 0.35rem;">{{ parseFloat(item.fraccion_enviada || 0).toFixed(3) }}</td>
                      <td class="text-right fw-bold text-green" style="padding: 0.25rem 0.35rem;">{{ item.peso_enviado ? parseFloat(item.peso_enviado).toFixed(3) + ' kg' : '-' }}</td>
                      <td class="text-right font-mono fw-bold" style="padding: 0.25rem 0.35rem;">
                        <span :style="{ color: getStockCD(item) <= 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }">
                          {{ formatStockVal(getStockCD(item)) }}
                        </span>
                      </td>
                      <td class="text-center" style="padding: 0.25rem 0.35rem;">
                        <span class="badge badge-success" style="font-size: 0.68rem; padding: 1px 5px;">Enviado</span>
                      </td>
                    </tr>
                    <tr v-if="itemsEnviados.length === 0">
                      <td colspan="9" class="text-center text-muted" style="padding: 1rem;">
                        Ningún producto enviado en este pedido.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Ítems No Enviados -->
            <div v-if="itemsNoEnviados.length > 0">
              <h3 style="font-size: 0.9rem; font-weight: bold; margin-bottom: 0.5rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
                <i class="ph ph-minus-circle text-muted" style="font-size: 1.1rem;"></i> Ítems No Enviados ({{ itemsNoEnviados.length }})
              </h3>
              <div class="table-container">
                <table class="access-table compact-items-table" style="width: 100%; font-size: 0.78rem;">
                  <thead>
                    <tr>
                      <th style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Código</th>
                      <th style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Producto</th>
                      <th class="text-right" style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Pzas Ped.</th>
                      <th class="text-right" style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Frac Ped.</th>
                      <th class="text-right" style="color: var(--accent-orange); padding: 0.25rem 0.35rem; font-size: 0.75rem;">Stk CD</th>
                      <th class="text-center" style="padding: 0.25rem 0.35rem; font-size: 0.75rem;">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in itemsNoEnviados" :key="item.id" style="opacity: 0.85;">
                      <td style="padding: 0.25rem 0.35rem;"><strong>{{ item.codigo_producto }}</strong></td>
                      <td style="padding: 0.25rem 0.35rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="item.Producto?.nombre">{{ item.Producto?.nombre || 'Sin nombre' }}</td>
                      <td class="text-right" style="padding: 0.25rem 0.35rem;">{{ item.pieza || 0 }}</td>
                      <td class="text-right" style="padding: 0.25rem 0.35rem;">{{ parseFloat(item.fraccion || 0).toFixed(3) }}</td>
                      <td class="text-right font-mono fw-bold" style="padding: 0.25rem 0.35rem;">
                        <span :style="{ color: getStockCD(item) <= 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }">
                          {{ formatStockVal(getStockCD(item)) }}
                        </span>
                      </td>
                      <td class="text-center" style="padding: 0.25rem 0.35rem;">
                        <span v-if="item.no_envia" class="badge badge-secondary" style="font-size: 0.68rem; padding: 1px 5px;">No Envía</span>
                        <span v-else class="badge badge-danger" style="font-size: 0.68rem; padding: 1px 5px;">Sin Stock</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <!-- SUB-VISTA 2: CONCILIACIÓN CON EGRESO BLOCK WMS -->
          <div v-else-if="subTabPedido === 'conciliacion'" style="display: flex; flex-direction: column; gap: 1rem;">
            
            <!-- CASO 1: NO VINCULADO -->
            <div v-if="!selectedPedido.wms_orden_egreso" style="text-align: center; padding: 3rem 1.5rem; background: var(--bg-secondary); border: 2px dashed var(--bevel-dark); border-radius: 6px;">
              <i class="ph ph-link-break" style="font-size: 3.5rem; color: #ef4444; margin-bottom: 0.75rem; opacity: 0.8; display: block;"></i>
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">
                Pedido sin Egreso de Block Vinculado
              </h3>
              <p style="margin: 0.5rem auto 1.25rem auto; font-size: 0.88rem; color: var(--text-secondary); max-width: 520px;">
                Para conciliar lo solicitado y preparado contra lo despachado en depósito, vincula este pedido con la orden de egreso finalizada en Block WMS.
              </p>
              <button 
                type="button" 
                class="btn btn-primary" 
                style="padding: 0.55rem 1.4rem; font-weight: 800; font-size: 0.9rem; background: #ef4444; border-color: #dc2626; color: #fff; display: inline-flex; align-items: center; gap: 0.45rem;"
                @click="openVincularModal(selectedPedido)"
              >
                <i class="ph ph-link"></i> Vincular Egreso de Block Manualmente
              </button>
            </div>

            <!-- CASO 2: VINCULADO -->
            <div v-else style="display: flex; flex-direction: column; gap: 1rem;">
              
              <!-- Tarjeta Resumen del Egreso Vinculado -->
              <div style="background: var(--bg-secondary); border: 1.5px solid var(--bevel-dark); padding: 0.85rem 1.15rem; border-radius: 4px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; align-items: center;">
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 800; display: block;">Nº Orden Block</span>
                  <span style="font-size: 1.1rem; font-weight: 900; font-family: monospace; color: #ef4444;">
                    #{{ selectedPedido.wms_orden_egreso }}
                  </span>
                </div>
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 800; display: block;">Documento / Remito</span>
                  <span style="font-size: 0.92rem; font-weight: 800; color: var(--text-primary);">
                    {{ selectedPedido.wms_documento || 'Sin comprobante' }}
                  </span>
                </div>
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 800; display: block;">Fecha Cierre Block</span>
                  <span style="font-size: 0.92rem; font-weight: 800; color: var(--text-primary);">
                    {{ selectedPedido.wms_fecha_egreso || '-' }}
                  </span>
                </div>
                <div>
                  <span style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 800; display: block;">Total Despachado Block</span>
                  <span style="font-size: 1.1rem; font-weight: 900; color: #dc2626;">
                    {{ (parseFloat(selectedPedido.wms_despachado_kg || 0)).toFixed(3) }} kg
                  </span>
                </div>
                <div style="text-align: right;">
                  <button 
                    type="button" 
                    class="btn btn-secondary btn-sm"
                    style="font-size: 0.78rem; font-weight: 800; color: #dc2626; border-color: #fca5a5;"
                    @click="desvincularEgreso(selectedPedido)"
                    title="Desasociar este egreso del pedido"
                  >
                    <i class="ph ph-link-break"></i> Desvincular
                  </button>
                </div>
              </div>

              <!-- Loader de Conciliación -->
              <div v-if="loadingConciliacion" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="ph ph-spinner spinner" style="font-size: 2rem; color: #ef4444; margin-bottom: 0.5rem;"></i>
                <div>Calculando conciliación de productos...</div>
              </div>

              <!-- Tabla de Conciliación: cod | nombre | pedido | preparado kg | enviado kg | diferencia | estado -->
              <div v-else class="table-container" style="border: 1.5px solid var(--bevel-dark); background: var(--bg-window); overflow-x: auto;">
                <table class="access-table" style="width: 100%; font-size: 0.82rem; border-collapse: collapse;">
                  <thead>
                    <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--bevel-dark); font-size: 0.76rem; text-transform: uppercase;">
                      <th style="padding: 0.55rem 0.65rem; text-align: center; width: 9%;">Cód</th>
                      <th style="padding: 0.55rem 0.65rem; text-align: left; width: 29%;">Nombre</th>
                      <th style="padding: 0.55rem 0.65rem; text-align: right; width: 14%;">Pedido</th>
                      <th style="padding: 0.55rem 0.65rem; text-align: right; width: 14%; color: #15803d;">Preparado kg</th>
                      <th style="padding: 0.55rem 0.65rem; text-align: right; width: 14%; color: #dc2626;">Enviado kg</th>
                      <th style="padding: 0.55rem 0.65rem; text-align: right; width: 10%;">Diferencia</th>
                      <th style="padding: 0.55rem 0.65rem; text-align: center; width: 10%;">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      v-for="item in listaConciliacion" 
                      :key="item.codigo"
                      :style="getConciliacionRowStyle(item)"
                      style="border-bottom: 1px solid var(--bevel-light);"
                    >
                      <!-- Cód -->
                      <td style="padding: 0.45rem 0.65rem; text-align: center; font-family: monospace; font-weight: 800; color: #ef4444;">
                        {{ item.codigo }}
                      </td>
                      <!-- Nombre -->
                      <td style="padding: 0.45rem 0.65rem; font-weight: 700; color: var(--text-primary);">
                        {{ item.nombre }}
                      </td>
                      <!-- Pedido -->
                      <td style="padding: 0.45rem 0.65rem; text-align: right; font-weight: 700;">
                        {{ item.pedido_display !== '-' ? item.pedido_display : '-' }}
                      </td>
                      <!-- Preparado kg -->
                      <td style="padding: 0.45rem 0.65rem; text-align: right; font-weight: 800; color: #15803d;">
                        <template v-if="item.preparado_kg > 0">
                          {{ item.preparado_kg.toFixed(3) }} kg
                          <span v-if="item.preparado_piezas > 0" style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal; display: block;">
                            ({{ item.preparado_piezas }} pz{{ item.preparado_piezas > 1 ? 's' : '' }})
                          </span>
                        </template>
                        <span v-else-if="item.no_envia" class="badge badge-secondary" style="font-size: 0.68rem;">No Envía</span>
                        <span v-else-if="item.sin_stock" class="badge badge-danger" style="font-size: 0.68rem;">Sin Stock</span>
                        <span v-else style="color: var(--text-muted);">-</span>
                      </td>
                      <!-- Enviado kg (Block) -->
                      <td style="padding: 0.45rem 0.65rem; text-align: right; font-weight: 800; color: #dc2626; font-size: 0.9rem;">
                        <template v-if="item.enviado_kg > 0">
                          {{ item.enviado_kg.toFixed(3) }} kg
                        </template>
                        <span v-else style="color: #b91c1c; font-weight: 800;">0.000 kg</span>
                      </td>
                      <!-- Diferencia -->
                      <td style="padding: 0.45rem 0.65rem; text-align: right; font-weight: 800; font-family: monospace;">
                        <span 
                          :style="{
                            color: Math.abs(item.diferencia_kg) < 0.005 ? '#15803d' : (item.diferencia_kg > 0 ? '#0284c7' : '#dc2626')
                          }"
                        >
                          {{ item.diferencia_kg > 0 ? '+' : '' }}{{ item.diferencia_kg.toFixed(3) }} kg
                        </span>
                      </td>
                      <!-- Estado / Badge -->
                      <td style="padding: 0.45rem 0.65rem; text-align: center;">
                        <span v-if="item.estado_conciliacion === 'COINCIDE'" class="badge badge-success" style="font-size: 0.68rem; padding: 2px 6px;">
                          Coincide
                        </span>
                        <span v-else-if="item.estado_conciliacion === 'DIFERENCIA'" class="badge badge-warning" style="font-size: 0.68rem; padding: 2px 6px;">
                          Desvío
                        </span>
                        <span v-else-if="item.estado_conciliacion === 'FALTANTE_BLOCK'" class="badge badge-danger" style="font-size: 0.68rem; padding: 2px 6px;">
                          Faltante Block
                        </span>
                        <span v-else-if="item.estado_conciliacion === 'EXTRA_BLOCK'" class="badge badge-info" style="font-size: 0.68rem; padding: 2px 6px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">
                          Extra en Block
                        </span>
                      </td>
                    </tr>
                    <tr v-if="listaConciliacion.length === 0">
                      <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        No hay productos para conciliar.
                      </td>
                    </tr>
                  </tbody>
                  <!-- Footer con Totales -->
                  <tfoot v-if="listaConciliacion.length > 0" style="background: var(--bg-secondary); border-top: 2.5px solid var(--bevel-dark); font-weight: 800;">
                    <tr>
                      <td colspan="3" style="padding: 0.65rem; text-align: right; text-transform: uppercase; font-size: 0.78rem;">
                        Totales Consolidados:
                      </td>
                      <td style="padding: 0.65rem; text-align: right; color: #15803d; font-size: 0.95rem;">
                        {{ totalPreparadoConciliacion.toFixed(3) }} kg
                      </td>
                      <td style="padding: 0.65rem; text-align: right; color: #dc2626; font-size: 0.95rem;">
                        {{ totalEnviadoConciliacion.toFixed(3) }} kg
                      </td>
                      <td style="padding: 0.65rem; text-align: right; font-family: monospace; font-size: 0.95rem;" :style="{ color: Math.abs(diferenciaNetaConciliacion) > 0.05 ? '#dc2626' : '#15803d' }">
                        {{ diferenciaNetaConciliacion > 0 ? '+' : '' }}{{ diferenciaNetaConciliacion.toFixed(3) }} kg
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

            </div>

          </div>
        </div>

        <!-- MODO EDICIÓN EN PÁGINA COMPLETA -->
        <div v-else>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--bevel-light);">
            <h3 style="margin: 0; font-size: 1.1rem; font-weight: bold; color: var(--accent-primary);">
              Modificando: {{ editForm.sucursal || 'Sin Sucursal' }} | {{ formatDateDayMonth(editForm.fecha) }} | {{ editForm.estado }}
            </h3>
            <button class="btn btn-secondary btn-sm" @click="isEditingMode = false">Cancelar Edición</button>
          </div>

          <form @submit.prevent="saveEditPedido">
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              
              <!-- Metadatos de la Orden -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Código de Pedido</label>
                  <input type="text" v-model="editForm.codigo" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Sucursal</label>
                  <input type="text" v-model="editForm.sucursal" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha</label>
                  <input type="date" v-model="editForm.fecha" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select v-model="editForm.estado" class="form-control" required>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Preparando">Preparando</option>
                    <option value="Listo">Listo</option>
                    <option value="Completado">Completado</option>
                    <option value="Enviado">Enviado</option>
                  </select>
                </div>
              </div>

              <!-- Formulario Agregar Producto al Pedido (AHORA ARRIBA DE TODO) -->
              <div class="card" style="border: 1.5px solid var(--bevel-dark); padding: 0.75rem; background: var(--bg-secondary);">
                <div style="font-size: 0.85rem; font-weight: bold; margin-bottom: 0.4rem; color: var(--accent-primary); display: flex; align-items: center; gap: 0.35rem;">
                  <i class="ph ph-plus-circle" style="font-size: 1.1rem;"></i> Agregar Producto al Pedido
                </div>
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.5rem; align-items: end;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Buscar Producto *</label>
                    <input 
                      type="text"
                      list="catalog-products-list-edit"
                      v-model="editProductSearchInput"
                      @input="handleEditProductInput"
                      class="form-control" 
                      placeholder="Escribe código o nombre de producto..."
                      style="font-size: 0.8rem; height: 32px;"
                    />
                    <datalist id="catalog-products-list-edit">
                      <option v-for="prod in catalogProducts" :key="prod.codigo" :value="prod.codigo">{{ prod.nombre }}</option>
                    </datalist>
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Piezas</label>
                    <input type="number" v-model.number="newProductPiece" placeholder="Pzs" min="0" class="form-control" style="font-size: 0.8rem; height: 32px; text-align: right;" />
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Fracción (Kg)</label>
                    <input type="number" step="0.001" v-model.number="newProductFraccion" placeholder="Kg Frac" min="0" class="form-control" style="font-size: 0.8rem; height: 32px; text-align: right;" />
                  </div>
                  <button type="button" class="btn btn-primary" style="height: 32px; padding: 0 1rem; font-weight: bold;" @click="addEditItem">
                    <i class="ph ph-plus"></i> Añadir
                  </button>
                </div>
              </div>

              <!-- Tabla de Ítems a Editar -->
              <div class="card" style="background: var(--bg-secondary); border: 1.5px solid var(--bevel-dark); padding: 0.75rem;">
                <div style="font-size: 0.85rem; font-weight: bold; margin-bottom: 0.5rem; color: var(--text-primary);">
                  Productos en el Pedido ({{ editForm.items.length }})
                </div>
                <div class="table-container" style="max-height: 350px; overflow-y: auto;">
                  <table class="access-table compact-items-table" style="width: 100%; font-size: 0.8rem;">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th class="text-right" style="width: 75px;">Ped. Pzs</th>
                        <th class="text-right" style="width: 80px;">Ped. Frac</th>
                        <th class="text-right" style="width: 85px; color: var(--accent-orange);">Stock CD</th>
                        <th class="text-right" style="width: 75px;">Env. Pzs</th>
                        <th class="text-right" style="width: 80px;">Env. Frac</th>
                        <th class="text-right" style="width: 90px;">Env. Kg</th>
                        <th class="text-center" style="width: 40px;">X</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in editForm.items" :key="idx">
                        <td><strong>{{ item.codigo_producto }}</strong></td>
                        <td>{{ item.Producto?.nombre || '-' }}</td>
                        <td><input type="number" min="0" v-model.number="item.pieza" class="form-control text-right" style="height: 26px;" /></td>
                        <td><input type="number" step="0.001" min="0" v-model.number="item.fraccion" class="form-control text-right" style="height: 26px;" /></td>
                        <td class="text-right font-mono fw-bold">
                          <span :style="{ color: getStockCD(item) <= 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }">
                            {{ formatStockVal(getStockCD(item)) }}
                          </span>
                        </td>
                        <td><input type="number" min="0" v-model.number="item.cantidad_enviada" class="form-control text-right" style="height: 26px;" /></td>
                        <td><input type="number" step="0.001" min="0" v-model.number="item.fraccion_enviada" class="form-control text-right" style="height: 26px;" /></td>
                        <td><input type="number" step="0.001" min="0" v-model.number="item.peso_enviado" class="form-control text-right" style="height: 26px;" /></td>
                        <td class="text-center">
                          <button type="button" class="btn-icon text-red" @click="removeEditItem(idx)"><i class="ph ph-trash"></i></button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
                <button type="button" class="btn btn-secondary" @click="isEditingMode = false">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="savingEdit">
                  <i class="ph ph-spinner spinner" v-if="savingEdit"></i>
                  <i class="ph ph-floppy-disk" v-else></i> Guardar Cambios
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>

    <!-- Modal de Carga Masiva (Excel) -->
    <Teleport to="body">
      <div v-if="showUploadModal" class="modal-overlay" @mousedown.self="showUploadModal = false">
        <div class="modal-card" style="max-width: 500px; width: 95%;">
          <div class="modal-header">
            <h3 class="modal-title">Carga Masiva de Pedidos (Excel)</h3>
            <button class="icon-btn" @click="showUploadModal = false"><i class="ph ph-x"></i></button>
          </div>
          
          <div class="modal-body" style="padding: 1rem; display: flex; flex-direction: column; gap: 1rem;">
            <p class="text-xs text-muted" style="line-height: 1.4; margin-bottom: 0.5rem;">
              Selecciona un archivo de planilla Excel (<strong>.xlsx</strong> o <strong>.xls</strong>). El sistema agrupará automáticamente los productos bajo sus respectivos códigos de pedido y omitirá de forma segura los pedidos ya registrados en la base de datos para evitar duplicaciones.
            </p>

            <!-- Dropzone para Excel -->
            <div class="file-dropzone" @click="triggerFileInput" style="margin-bottom: 0.5rem; cursor: pointer; border: 2px dashed var(--bevel-dark); padding: 1.5rem; text-align: center; border-radius: 0; background: var(--bg-secondary);">
              <input 
                type="file" 
                ref="fileInput" 
                @change="onFileSelected" 
                accept=".xlsx, .xls" 
                style="display: none;" 
              />
              <i class="ph ph-file-xls text-blue" style="font-size: 2.5rem; margin-bottom: 0.5rem;"></i>
              <div class="fw-bold" style="font-size: 0.85rem; color: var(--text-primary);">
                {{ selectedFile ? selectedFile.name : 'Haz clic para seleccionar archivo' }}
              </div>
              <span class="text-xs text-muted mt-1" v-if="!selectedFile">
                Soporta planillas .xlsx y .xls
              </span>
              <span class="text-xs text-green fw-bold mt-1" v-else>
                {{ (selectedFile.size / 1024).toFixed(1) }} KB - Listo para subir
              </span>
            </div>

            <!-- Resultado de la Importación -->
            <div v-if="uploadResult" class="card" style="box-shadow: var(--inset-shadow); background: var(--bg-secondary); border-color: var(--bevel-dark);">
              <div class="card-header" style="background-color: var(--bevel-dark); padding: 0.2rem 0.5rem; display: flex; justify-content: space-between;">
                <span style="font-size: 0.75rem; font-weight: bold; color: var(--text-primary);">Resultado de Importación</span>
                <button @click="uploadResult = null" style="background: none; border: none; color: var(--text-primary); cursor: pointer; font-size: 0.7rem;"><i class="ph ph-x"></i></button>
              </div>
              <div class="p-3 text-xs" style="line-height: 1.5; color: var(--text-primary);">
                <div class="fw-bold mb-2 text-blue">{{ uploadResult.mensaje }}</div>
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.25rem; border-top: 1px solid var(--bevel-light); padding-top: 0.25rem;">
                  <span>Pedidos Nuevos Registrados:</span>
                  <span class="fw-bold text-green">{{ uploadResult.pedidosRegistrados }}</span>
                  <span>Pedidos Duplicados (Omitidos):</span>
                  <span class="fw-bold text-orange">{{ uploadResult.pedidosOmitidos }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end; padding: 0.75rem 1rem;">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="showUploadModal = false; clearFileSelection()" 
              :disabled="uploading"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              :disabled="!selectedFile || uploading" 
              @click="uploadFile"
            >
              <i class="ph ph-spinner spinner" v-if="uploading"></i>
              <i class="ph ph-upload-simple" v-else></i>
              {{ uploading ? 'Subiendo...' : 'Subir y Procesar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal de Alta de Pedido -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @mousedown.self="showCreateModal = false">
        <div class="modal-card" style="max-width: 700px; width: 95%;">
          <div class="modal-header">
            <h3 class="modal-title">Registrar Nuevo Pedido</h3>
            <button class="icon-btn" @click="showCreateModal = false"><i class="ph ph-x"></i></button>
          </div>
          
          <form @submit.prevent="saveCreatePedido">
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto; padding: 1rem;">
              
              <!-- Metadatos de la Orden -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; border-bottom: 2px solid var(--bevel-light); padding-bottom: 1rem;">
                <div class="form-group">
                  <label class="form-label">Código de Pedido *</label>
                  <input type="text" v-model="createForm.codigo" class="form-control" placeholder="Ej: PED-001" required />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Sucursal</label>
                  <input type="text" v-model="createForm.sucursal" class="form-control" placeholder="Ej: Sucursal Centro" />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Fecha</label>
                  <input type="date" v-model="createForm.fecha" class="form-control" required />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select v-model="createForm.estado" class="form-control" required style="height: 30px;">
                    <option value="Pendiente">Pendiente</option>
                    <option value="Procesando">Procesando</option>
                    <option value="Completado">Completado</option>
                  </select>
                </div>
              </div>

              <!-- Listado dinámico de Ítems -->
              <div class="card mb-3" style="box-shadow: var(--inset-shadow); background: var(--bg-secondary); border: 1px solid var(--bevel-dark);">
                <div class="card-header" style="background-color: var(--bevel-dark); padding: 0.3rem 0.5rem;">
                  <span style="font-size: 0.8rem; font-weight: bold; color: var(--text-primary);">Productos en este Pedido ({{ createForm.items.length }})</span>
                </div>
                
                <div style="padding: 0.5rem; max-height: 220px; overflow-y: auto;">
                  <table class="access-table" style="width: 100%;">
                    <thead>
                      <tr>
                        <th style="font-size: 0.75rem;">Cód. Producto</th>
                        <th style="font-size: 0.75rem;">Descripción</th>
                        <th style="font-size: 0.75rem; width: 80px;" class="text-right">Piezas</th>
                        <th style="font-size: 0.75rem; width: 110px;" class="text-right">Fracción</th>
                        <th style="font-size: 0.75rem; width: 50px;" class="text-center">Quitar</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in createForm.items" :key="idx">
                        <td style="font-size: 0.75rem;">
                          <strong>{{ item.codigo_producto }}</strong>
                        </td>
                        <td style="font-size: 0.75rem; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="item.Producto?.nombre">
                          {{ item.Producto?.nombre || 'Sin nombre' }}
                        </td>
                        <td style="font-size: 0.75rem;" class="text-right">
                          <input 
                            type="number" 
                            v-model.number="item.pieza" 
                            min="0"
                            class="form-control text-right" 
                            style="height: 24px; font-size: 0.75rem;" 
                          />
                        </td>
                        <td style="font-size: 0.75rem;" class="text-right">
                          <input 
                            type="number" 
                            step="0.001" 
                            v-model.number="item.fraccion" 
                            min="0"
                            class="form-control text-right" 
                            style="height: 24px; font-size: 0.75rem;" 
                          />
                        </td>
                        <td style="font-size: 0.75rem;" class="text-center">
                          <button type="button" class="btn-icon text-red" style="padding: 0.1rem 0.3rem;" @click="removeCreateItem(idx)">
                            <i class="ph ph-trash"></i>
                          </button>
                        </td>
                      </tr>
                      
                      <tr v-if="createForm.items.length === 0">
                        <td colspan="5" class="text-center text-muted" style="padding: 1rem; font-size: 0.75rem;">
                          No hay productos en esta orden. Añade un producto usando el formulario de abajo.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Formulario de Agregar Nuevo Ítem -->
              <div class="card" style="border: 1px solid var(--bevel-light); padding: 0.5rem;">
                <div style="font-size: 0.75rem; font-weight: bold; margin-bottom: 0.4rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.25rem;">
                  <i class="ph ph-plus-circle"></i> Agregar Producto a la Orden
                </div>
                
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.5rem; align-items: end;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.7rem; margin-bottom: 0.15rem;">Producto *</label>
                    <input 
                      type="text"
                      list="catalog-products-list-create"
                      v-model="createProductSearchInput"
                      @input="handleCreateProductInput"
                      class="form-control" 
                      placeholder="Escribe código o nombre..."
                      style="font-size: 0.75rem; height: 26px; padding: 0 0.25rem;"
                    />
                    <datalist id="catalog-products-list-create">
                      <option v-for="prod in catalogProducts" :key="prod.codigo" :value="prod.codigo">
                        {{ prod.nombre }}
                      </option>
                    </datalist>
                  </div>
                  
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.7rem; margin-bottom: 0.15rem;">Piezas</label>
                    <input 
                      type="number" 
                      v-model.number="newCreateProductPiece" 
                      min="0"
                      class="form-control" 
                      style="font-size: 0.75rem; height: 26px; padding: 0 0.25rem;" 
                    />
                  </div>
                  
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.7rem; margin-bottom: 0.15rem;">Fracción</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      v-model.number="newCreateProductFraccion" 
                      min="0"
                      class="form-control" 
                      style="font-size: 0.75rem; height: 26px; padding: 0 0.25rem;" 
                    />
                  </div>
                  
                  <button type="button" class="btn btn-secondary" style="height: 26px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; padding: 0 0.5rem;" @click="addCreateItem">
                    <i class="ph ph-plus"></i> Añadir
                  </button>
                </div>
              </div>

            </div>
            
            <div class="modal-footer" style="padding: 0.75rem 1rem;">
              <button type="button" class="btn btn-secondary" @click="showCreateModal = false">
                <i class="ph ph-x"></i> Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="savingCreate">
                <i class="ph ph-spinner spinner" v-if="savingCreate"></i>
                <i class="ph ph-floppy-disk" v-else></i> 
                {{ savingCreate ? 'Registrando...' : 'Registrar Pedido' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal Confirmación Eliminar Pedido -->
    <Teleport to="body">
      <div v-if="pedidoToDelete" class="win-dialog-overlay" @mousedown.self="pedidoToDelete = null">
        <div class="win-dialog">
          <div class="win-dialog-titlebar">
            <span class="win-dialog-titlebar-text">Confirmar Eliminación</span>
            <button class="win-dialog-close" @click="pedidoToDelete = null"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body">
            <i class="ph ph-warning-circle win-dialog-icon text-red"></i>
            <p class="win-dialog-msg">
              ¿Estás seguro de que deseas eliminar por completo el pedido <strong>{{ pedidoToDelete.codigo }}</strong>?<br><br>Esta acción eliminará de forma irreversible el pedido y todos sus productos vinculados.
            </p>
          </div>
          <div class="win-dialog-footer">
            <button class="win-dialog-btn win-dialog-btn-ok" @click="deletePedido">Sí</button>
            <button class="win-dialog-btn" @click="pedidoToDelete = null">No</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Confirmación Envío Pedido -->
    <Teleport to="body">
      <div v-if="showConfirmEnvioModal" class="win-dialog-overlay" @mousedown.self="showConfirmEnvioModal = false">
        <div class="win-dialog" style="max-width: 520px;">
          <div class="win-dialog-titlebar">
            <span class="win-dialog-titlebar-text">Confirmar Envío del Pedido</span>
            <button class="win-dialog-close" @click="showConfirmEnvioModal = false"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body" style="padding: 1rem;">
            <i class="ph ph-truck win-dialog-icon" style="color: #1a7f37; font-size: 2rem;"></i>
            <p class="win-dialog-msg" style="margin-top: 0.5rem; line-height: 1.5;">
              ¿Estás seguro de confirmar el envío del pedido <strong>{{ editForm.codigo }}</strong>?<br><br>
              Se descontará del stock los siguientes pesos enviados:
            </p>
            <div style="max-height: 200px; overflow-y: auto; margin-top: 0.5rem;">
              <table style="width: 100%; font-size: 0.75rem; border-collapse: collapse;">
                <thead>
                  <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--bevel-dark);">
                    <th style="text-align: left; padding: 0.3rem 0.5rem; color: var(--text-primary);">Código</th>
                    <th style="text-align: left; padding: 0.3rem 0.5rem; color: var(--text-primary);">Producto</th>
                    <th style="text-align: right; padding: 0.3rem 0.5rem; color: var(--text-primary);">Peso Env. (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in itemsConPeso" :key="item.codigo_producto" style="border-bottom: 1px solid var(--bevel-light);">
                    <td style="padding: 0.3rem 0.5rem; color: var(--text-primary);"><strong>{{ item.codigo_producto }}</strong></td>
                    <td style="padding: 0.3rem 0.5rem; color: var(--text-primary);">{{ item.Producto?.nombre || '-' }}</td>
                    <td style="padding: 0.3rem 0.5rem; text-align: right; font-weight: bold; color: var(--text-primary);">{{ parseFloat(item.peso_enviado).toFixed(3) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="itemsConPeso.length === 0" style="margin-top: 0.5rem; padding: 0.75rem; background: var(--bg-secondary); text-align: center; font-size: 0.8rem; color: var(--text-secondary); border: 1px solid var(--bevel-light);">
              <i class="ph ph-warning-circle" style="font-size: 1.2rem; color: var(--accent-orange);"></i><br>
              No hay items con peso enviado > 0. Completa la columna "Peso Env.(kg)" antes de confirmar.
            </div>

            <!-- Advertencia Informativa de Stock Negativo (NO bloqueante) -->
            <div v-if="itemsConStockNegativo.length > 0" style="margin-top: 0.5rem; padding: 0.6rem 0.75rem; background: #fff5f5; border: 1px solid #f87171; border-radius: 0; font-size: 0.78rem;">
              <div style="font-weight: bold; color: #991b1b; display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.25rem;">
                <i class="ph ph-warning-circle" style="font-size: 1.1rem; color: #dc2626;"></i>
                Atención: {{ itemsConStockNegativo.length }} producto(s) quedará(n) con stock negativo en CD:
              </div>
              <ul style="margin: 0.2rem 0 0 1.2rem; padding: 0; color: #7f1d1d; line-height: 1.3;">
                <li v-for="item in itemsConStockNegativo" :key="item.codigo_producto">
                  <strong>{{ item.codigo_producto }}</strong> ({{ item.Producto?.nombre || '-' }}): Stock actual {{ getStockCD(item).toFixed(2) }} kg, Descontando {{ parseFloat(item.peso_enviado).toFixed(2) }} kg
                </li>
              </ul>
            </div>

            <div v-if="confirmError" class="alert-box error" style="margin-top: 0.75rem; font-size: 0.8rem;">
              {{ confirmError }}
            </div>
          </div>
          <div class="win-dialog-footer">
            <button 
              class="win-dialog-btn win-dialog-btn-ok" 
              :disabled="itemsConPeso.length === 0 || confirmingPedido" 
              @click="confirmarPedido"
            >
              <i class="ph ph-spinner spinner" v-if="confirmingPedido" style="margin-right: 0.25rem;"></i>
              {{ confirmingPedido ? 'Procesando...' : 'Sí, Confirmar Envío' }}
            </button>
            <button class="win-dialog-btn" @click="showConfirmEnvioModal = false">Cancelar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Control de Ítems Enviados -->
    <Teleport to="body">
      <div v-if="showControlModal" class="win-dialog-overlay" @mousedown.self="closeControlModal">
        <div class="win-dialog" style="max-width: 480px; width: 95%;">
          <div class="win-dialog-titlebar">
            <span class="win-dialog-titlebar-text">Pre Despacho</span>
            <button class="win-dialog-close" @click="closeControlModal"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body" style="padding: 1.25rem;">
            <!-- Barra de Progreso y Porcentaje -->
            
            <!-- Card del Ítem Actual -->
            <div v-if="currentControlItem" class="card" style="padding: 1.25rem; border: 2px solid var(--bevel-dark); background: var(--bg-window); min-height: 140px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h4 style="margin: 0 0 0.6rem 0; font-size: 1rem; font-weight: bold; color: var(--text-secondary); line-height: 1.3;">
                  {{ currentControlItem.Producto?.nombre || 'Sin nombre' }}
                </h4>

                <!-- Bloque de Código de Barras (Número e Imagen SVG) -->
                <div style="background: #ffffff; border: 1.5px solid var(--bevel-dark); padding: 0.6rem; margin-bottom: 0.85rem; text-align: center; border-radius: 0;">
                  <div style="font-size: 0.85rem; font-weight: 800; font-family: monospace; color: var(--text-secondary); margin-bottom: 0.25rem; letter-spacing: 0.5px;">
                    <i class="ph ph-barcode" style="font-size: 1.1rem; margin-right: 0.25rem; vertical-align: middle; color: var(--accent-primary);"></i>
                    CÓDIGO BARRAS: {{ currentControlItem.codigo_producto }}
                  </div>
                  
                  <div 
                    v-html="generateBarcodeSVG(currentControlItem.codigo_producto)" 
                    style="margin-top: 0.35rem; display: flex; justify-content: center;"
                  ></div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 2px solid var(--bevel-dark); padding: 0.75rem 1rem; border-radius: 0; box-shadow: var(--inset-shadow); margin-bottom: 0.75rem;">
                  <div>
                    <span style="font-size: 0.75rem; color: var(--text-muted); display: block; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Código Interno</span>
                    <span style="font-size: 1.8rem; font-weight: 800; color: var(--accent-primary);">
                      {{ currentControlItem.codigo_producto }}
                    </span>
                  </div>
                  <div style="text-align: right;">
                    <span style="font-size: 0.75rem; color: var(--text-muted); display: block; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Peso / Frac</span>
                    <span style="font-size: 1.8rem; font-weight: 800; color: #1a7f37;">
                      {{ parseFloat(currentControlWeight).toFixed(3) }} kg
                    </span>
                  </div>

                </div>
              </div>
              
            </div>
            
            <!-- Estado Finalizado -->
            <div v-else class="card" style="padding: 1.5rem; border: 2px solid var(--bevel-dark); background: var(--bg-window); text-align: center;">
              <i class="ph ph-check-circle" style="font-size: 3rem; color: #1a7f37; margin-bottom: 0.5rem;"></i>
              <h4 style="margin: 0 0 0.5rem 0; font-size: 1.15rem; font-weight: bold; color: var(--text-primary);">
                Control Completado
              </h4>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">
                Se han verificado todos los ítems con peso en este pedido de forma exitosa.
              </p>
            </div>
            <div style="margin-bottom: 1.25rem;">
              <div style="width: 100%; height: 16px; background: var(--bg-secondary); border: 2px solid var(--bevel-dark); padding: 1px; box-shadow: var(--inset-shadow); box-sizing: border-box; position: relative;">
                <div :style="{ width: controlProgressPercentage + '%' }" style="height: 100%; background: #1a7f37; transition: width 0.2s ease;"></div>
              </div>
            </div>
          </div>
          
          <div class="win-dialog-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem;">
            <div>
              <button 
                v-if="currentControlIndex > 0" 
                class="win-dialog-btn" 
                @click="prevControlItem"
              >
                <i class="ph ph-arrow-left" style="margin-right: 0.25rem;"></i> Anterior
              </button>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button 
                v-if="currentControlItem"
                ref="btnNextControl"
                class="win-dialog-btn win-dialog-btn-ok" 
                @click="nextControlItem"
              >
                Siguiente <i class="ph ph-arrow-right" style="margin-left: 0.25rem;"></i>
              </button>
              <button 
                v-else
                ref="btnFinishControl"
                class="win-dialog-btn win-dialog-btn-ok" 
                @click="closeControlModal"
              >
                Finalizar
              </button>
              <button class="win-dialog-btn" @click="closeControlModal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL XL DE CÓDIGOS DE BARRA PARA PEDIDOS -->
    <Teleport to="body">
      <div v-if="showBarcodeModal" class="win-dialog-overlay" style="display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div class="win-dialog" style="width: 850px; max-width: 95vw; background: var(--bg-window); border: 3px solid var(--bevel-dark); box-shadow: var(--window-shadow);">
          
          <!-- Header del Modal -->
          <div class="win-dialog-header" style="background: #0b5394; color: white; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
              <i class="ph ph-barcode" style="font-size: 1.4rem;"></i>
              Código de Barras - Pedido Nº {{ selectedPedidoForBarcodes?.codigo || selectedPedidoForBarcodes?.id }}
            </span>
            <button @click="showBarcodeModal = false" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.3rem; display: flex; align-items: center;">
              <i class="ph ph-x"></i>
            </button>
          </div>

          <!-- Subheader Info + Paginador -->
          <div style="padding: 0.75rem 1.25rem; background: var(--bg-secondary); border-bottom: 1.5px solid var(--bevel-light); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div style="font-size: 0.88rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <div>
                <strong>Sucursal:</strong> {{ selectedPedidoForBarcodes?.sucursal || '-' }}
                <span v-if="selectedPedidoForBarcodes?.fecha" style="margin-left: 0.75rem;">
                  <strong>Fecha:</strong> {{ formatDate(selectedPedidoForBarcodes.fecha) }}
                </span>
              </div>
              <span style="font-size: 0.76rem; color: var(--text-secondary); background: var(--bg-window); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--bevel-dark); font-weight: bold;">
                <i class="ph ph-keyboard" style="margin-right: 3px;"></i> Teclas ← / → para navegar
              </span>
            </div>
            
            <!-- Contador y Controles de Navegación -->
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <button 
                class="win-dialog-btn" 
                @click="prevBarcode" 
                :disabled="barcodeItems.length <= 1"
                style="padding: 3px 10px; font-weight: 800; font-size: 0.85rem;"
                title="Ver producto anterior (Tecla Flecha Izquierda)"
              >
                <i class="ph ph-caret-left"></i> Anterior
              </button>

              <span style="font-weight: 900; font-size: 0.9rem; color: #0284c7; background: #e0f2fe; padding: 3px 12px; border-radius: 12px; border: 1px solid #bae6fd;">
                {{ currentBarcodeIndex + 1 }} de {{ barcodeItems.length }}
              </span>

              <button 
                class="win-dialog-btn" 
                @click="nextBarcode" 
                :disabled="barcodeItems.length <= 1"
                style="padding: 3px 10px; font-weight: 800; font-size: 0.85rem;"
                title="Ver producto siguiente (Tecla Flecha Derecha)"
              >
                Siguiente <i class="ph ph-caret-right"></i>
              </button>
            </div>
          </div>

          <!-- Cuerpo del Modal (Tarjeta XL Clickeable) -->
          <div style="padding: 1.5rem; text-align: center;">
            <div 
              v-if="currentBarcodeItem" 
              @click="nextBarcode"
              style="background: #ffffff; border: 3px solid #0284c7; border-radius: 10px; padding: 1.75rem 1.5rem; cursor: pointer; user-select: none; transition: transform 0.1s, box-shadow 0.1s; box-shadow: 0 4px 12px rgba(0,0,0,0.1); position: relative;"
              title="¡Haz clic aquí para avanzar al siguiente producto!"
            >
              <!-- Indicator Badge -->
              <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #0284c7; color: white; padding: 2px 14px; border-radius: 12px; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.05em; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                <i class="ph ph-hand-pointing" style="margin-right: 4px;"></i> HAZ CLIC PARA VER EL SIGUIENTE
              </div>

              <!-- Código del Producto (Code 128) -->
              <div style="display: flex; justify-content: center; align-items: center; gap: 1.5rem; flex-wrap: wrap; margin-top: 0.25rem;">
                <div style="font-size: 1.15rem; font-weight: 900; color: #475569; letter-spacing: 0.05em; text-transform: uppercase;">
                  CÓDIGO PRODUCTO: <span style="color: #0284c7; font-family: monospace; font-size: 1.4rem;">{{ currentBarcodeItem.codigo }}</span>
                </div>
              </div>

              <!-- Nombre del Producto -->
              <div style="font-size: 1.4rem; font-weight: 900; color: #0f172a; margin: 0.5rem 0 1.25rem 0; line-height: 1.2;">
                {{ currentBarcodeItem.nombre }}
              </div>

              <!-- Código de Barras SVG Gigante -->
              <div style="background: #ffffff; padding: 1.25rem 1rem; border: 2.5px dashed #0284c7; border-radius: 10px; margin: 0 auto 1.25rem auto; max-width: 700px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div v-html="generateBarcodeSVG(currentBarcodeItem.codigo, { scale: 4, height: 110, fontSize: 22, maxWidth: '650px' })"></div>
              </div>

              <!-- Cantidad Pedida -->
              <div style="font-size: 1.1rem; font-weight: 900; color: #d97706; background: #fffbe6; padding: 0.4rem 1rem; border-radius: 6px; display: inline-block; border: 1px solid #fef08a;">
                Cantidad Pedida: {{ currentBarcodeItem.cantidadDisplay }}
              </div>
            </div>
          </div>

          <!-- Footer del Modal -->
          <div class="win-dialog-footer" style="padding: 0.85rem 1.25rem; background: var(--bg-secondary); border-top: 1.5px solid var(--bevel-dark); display: flex; justify-content: space-between; align-items: center;">
            <button class="win-dialog-btn" @click="imprimirCodigosModal" style="display: flex; align-items: center; gap: 0.35rem; font-weight: 800;">
              <i class="ph ph-printer" style="font-size: 1.2rem; color: #0284c7;"></i> Imprimir Todos los Códigos
            </button>
            
            <button class="win-dialog-btn win-dialog-btn-ok" @click="showBarcodeModal = false" style="font-weight: 800; padding: 6px 20px;">
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- MODAL DE VINCULACIÓN MANUAL CON EGRESO BLOCK WMS -->
    <Teleport to="body">
      <div v-if="showVincularModal" class="win-dialog-overlay" style="display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
        <div class="win-dialog" style="width: 780px; max-width: 95vw; background: var(--bg-window); border: 3px solid var(--bevel-dark); box-shadow: var(--window-shadow); display: flex; flex-direction: column; max-height: 90vh;">
          
          <!-- Header -->
          <div class="win-dialog-header" style="background: #ef4444; color: white; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; font-size: 1.05rem; display: flex; align-items: center; gap: 0.4rem;">
              <i class="ph ph-link" style="font-size: 1.3rem;"></i>
              Vincular Egreso de Block WMS al Pedido
            </span>
            <button @click="showVincularModal = false" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center;">
              <i class="ph ph-x"></i>
            </button>
          </div>

          <!-- Info del Pedido actual -->
          <div style="background: var(--bg-secondary); padding: 0.75rem 1.25rem; border-bottom: 1.5px solid var(--bevel-light); font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <strong>Pedido:</strong> <span style="font-family: monospace; font-weight: bold; color: #ef4444;">{{ selectedPedido?.codigo }}</span>
              <span style="margin-left: 1rem;"><strong>Sucursal:</strong> {{ selectedPedido?.sucursal || '-' }}</span>
            </div>
            <div>
              <strong>Fecha Pedido:</strong> {{ formatDate(selectedPedido?.fecha) }}
            </div>
          </div>

          <!-- Contenido del Modal -->
          <div style="padding: 1.25rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1rem;">
            
            <!-- Entrada Directa del Nº de Orden o Remito -->
            <div class="card" style="padding: 1rem; border: 1.5px solid var(--bevel-dark); background: var(--bg-window);">
              <label style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary); display: block; margin-bottom: 0.35rem;">
                Nº de Orden de Egreso o Documento en Block WMS *
              </label>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input 
                  type="text" 
                  v-model="vincularOrdenInput" 
                  placeholder="Ej: 10542 o R-0001-00045678..." 
                  class="form-control" 
                  style="font-size: 0.95rem; font-weight: bold; height: 38px;"
                  @keydown.enter.prevent="ejecutarBusquedaBlock"
                />
                <button 
                  type="button" 
                  class="btn btn-secondary" 
                  style="height: 38px; padding: 0 1rem; font-weight: 800; display: flex; align-items: center; gap: 0.35rem; white-space: nowrap;"
                  @click="ejecutarBusquedaBlock"
                  :disabled="loadingBusquedaBlock"
                >
                  <i class="ph ph-spinner spinner" v-if="loadingBusquedaBlock"></i>
                  <i class="ph ph-magnifying-glass" v-else></i>
                  Buscar en Block
                </button>
              </div>
              <small style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.35rem; display: block;">
                Puedes tipear directamente el número de orden de egreso de Block y vincular, o presionar "Buscar en Block" para consultar las órdenes disponibles.
              </small>
            </div>

            <!-- Filtros rápidos para buscar egresos de Block si el usuario no recuerda el número exacto -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--bevel-light); padding: 0.75rem 1rem;">
              <div style="font-size: 0.78rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
                <span><i class="ph ph-calendar"></i> Búsqueda por Rango de Fechas en Block</span>
                <span style="font-weight: normal; text-transform: none; font-size: 0.75rem;">Site: {{ vincularSiteId }}</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem; align-items: flex-end;">
                <div>
                  <label style="font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 2px;">Desde</label>
                  <input type="date" v-model="vincularFechaDesde" class="form-control" style="height: 30px; font-size: 0.8rem;" />
                </div>
                <div>
                  <label style="font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 2px;">Hasta</label>
                  <input type="date" v-model="vincularFechaHasta" class="form-control" style="height: 30px; font-size: 0.8rem;" />
                </div>
                <button 
                  type="button" 
                  class="btn btn-secondary" 
                  style="height: 30px; padding: 0 0.75rem; font-size: 0.8rem; font-weight: bold; display: flex; align-items: center; gap: 0.25rem;"
                  @click="consultarEgresosBlockParaVincular"
                  :disabled="loadingBusquedaBlock"
                >
                  <i class="ph ph-spinner spinner" v-if="loadingBusquedaBlock"></i>
                  <i class="ph ph-list-magnifying-glass" v-else></i> Listar
                </button>
              </div>
            </div>

            <!-- Lista de Egresos Encontrados en Block -->
            <div v-if="vincularOrdenesList.length > 0" style="border: 1.5px solid var(--bevel-dark); max-height: 220px; overflow-y: auto;">
              <table class="access-table" style="width: 100%; font-size: 0.78rem; border-collapse: collapse;">
                <thead>
                  <tr style="background: var(--bg-secondary); border-bottom: 1.5px solid var(--bevel-dark); position: sticky; top: 0; z-index: 1;">
                    <th style="padding: 0.4rem 0.5rem; text-align: center; width: 15%;">Nº Orden</th>
                    <th style="padding: 0.4rem 0.5rem; text-align: left; width: 28%;">Destino / Entidad</th>
                    <th style="padding: 0.4rem 0.5rem; text-align: left; width: 25%;">Documento</th>
                    <th style="padding: 0.4rem 0.5rem; text-align: center; width: 14%;">Fecha</th>
                    <th style="padding: 0.4rem 0.5rem; text-align: right; width: 18%;">Total kg</th>
                    <th style="padding: 0.4rem 0.5rem; text-align: center; width: 10%;">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="o in vincularOrdenesList" 
                    :key="o.orden"
                    :style="{ background: vincularOrdenInput === o.orden ? '#fef2f2' : 'transparent' }"
                    style="border-bottom: 1px solid var(--bevel-light); cursor: pointer;"
                    @click="seleccionarOrdenParaVincular(o)"
                  >
                    <td style="padding: 0.4rem 0.5rem; text-align: center; font-family: monospace; font-weight: bold; color: #ef4444;">
                      {{ o.orden }}
                    </td>
                    <td style="padding: 0.4rem 0.5rem; font-weight: 700;">{{ o.destino }}</td>
                    <td style="padding: 0.4rem 0.5rem;">{{ o.documento }}</td>
                    <td style="padding: 0.4rem 0.5rem; text-align: center;">{{ o.fechaCierre }}</td>
                    <td style="padding: 0.4rem 0.5rem; text-align: right; font-weight: bold; color: #dc2626;">
                      {{ (o.totalKilosDespachados || 0).toFixed(3) }} kg
                    </td>
                    <td style="padding: 0.4rem 0.5rem; text-align: center;">
                      <button 
                        type="button" 
                        class="btn btn-sm"
                        :class="vincularOrdenInput === o.orden ? 'btn-primary' : 'btn-secondary'"
                        style="padding: 2px 8px; font-size: 0.72rem; font-weight: bold;"
                        @click.stop="seleccionarOrdenParaVincular(o)"
                      >
                        {{ vincularOrdenInput === o.orden ? '✓ Elegida' : 'Elegir' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else-if="busquedaRealizada && !loadingBusquedaBlock" style="text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.82rem;">
              No se encontraron órdenes de egreso con los filtros ingresados.
            </div>

            <!-- Orden Seleccionada Info Preview -->
            <div v-if="ordenSeleccionadaObj" style="padding: 0.75rem 1rem; background: #f0fdf4; border: 1.5px solid #16a34a; border-radius: 4px; color: #15803d; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>Orden Seleccionada: #{{ ordenSeleccionadaObj.orden }}</strong><br>
                <span>Destino: {{ ordenSeleccionadaObj.destino }} | Kilos: {{ (ordenSeleccionadaObj.totalKilosDespachados || 0).toFixed(3) }} kg ({{ ordenSeleccionadaObj.items?.length || 0 }} productos)</span>
              </div>
              <span class="badge badge-success" style="font-size: 0.75rem; padding: 3px 8px;">Lista para vincular</span>
            </div>

          </div>

          <!-- Footer -->
          <div class="win-dialog-footer" style="padding: 0.85rem 1.25rem; background: var(--bg-secondary); border-top: 1.5px solid var(--bevel-dark); display: flex; justify-content: space-between; align-items: center;">
            <button type="button" class="win-dialog-btn" @click="showVincularModal = false">
              Cancelar
            </button>
            <button 
              type="button" 
              class="win-dialog-btn win-dialog-btn-ok" 
              style="background: #16a34a; border-color: #15803d; color: #fff; font-weight: 800; display: flex; align-items: center; gap: 0.35rem;"
              :disabled="!vincularOrdenInput || savingVinculacion"
              @click="guardarVinculacionManual"
            >
              <i class="ph ph-spinner spinner" v-if="savingVinculacion"></i>
              <i class="ph ph-link" v-else></i>
              Confirmar Vinculación
            </button>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- Contenedor exclusivo para impresión física / PDF -->
    <div v-if="activePrintPedido" class="print-only-container" style="display: none;">
      <div class="print-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="font-family: monospace; font-weight: bold; margin: 0; font-size: 24px; color: black;">CDF GESTIÓN</h1>
            <p style="font-family: monospace; font-size: 0.75rem; margin: 2px 0 0 0; color: black;">Control de Distribución y Fraccionamiento</p>
          </div>
          <div style="text-align: right; font-family: monospace;">
            <h2 style="margin: 0; font-size: 18px; font-weight: bold; color: black;">REMITO DE PREPARACIÓN</h2>
            <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: black;">Documento de Uso Interno</p>
          </div>
        </div>
        
        <div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-family: monospace; font-size: 0.85rem; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 0.5rem 0; color: black;">
          <div>
            <strong>Código Pedido:</strong> {{ activePrintPedido.codigo }}<br>
            <strong>Sucursal Destino:</strong> {{ activePrintPedido.sucursal || 'Sin sucursal asignada' }}
          </div>
          <div style="text-align: right;">
            <strong>Fecha Emisión:</strong> {{ formatDate(activePrintPedido.fecha) }}<br>
            <strong>Estado Pedido:</strong> {{ activePrintPedido.estado }}
          </div>
        </div>
      </div>
      
      <table class="print-table" style="width: 100%; border-collapse: collapse; font-family: monospace; margin-top: 1rem; color: black;">
        <thead>
          <tr style="background-color: #f2f2f2; border-bottom: 2px solid #000;">
            <th style="border: 1px solid #000; text-align: left; width: 15%; padding: 4px;">Código</th>
            <th style="border: 1px solid #000; text-align: left; width: 45%; padding: 4px;">Nombre</th>
            <th style="border: 1px solid #000; text-align: right; width: 20%; padding: 4px;">Peso</th>
            <th style="border: 1px solid #000; text-align: right; width: 20%; padding: 4px;">Piezas</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in activePrintPedido.items" :key="item.id" style="border-bottom: 1px solid #000;">
            <td style="border: 1px solid #000; padding: 4px;">
              <strong>{{ item.codigo_producto }}</strong>
            </td>
            <td style="border: 1px solid #000; padding: 4px;">
              {{ item.Producto?.nombre || 'Producto sin nombre cargado' }}
            </td>
            <td style="border: 1px solid #000; text-align: right; font-weight: bold; padding: 4px;">
              {{ getPrintArmadoPeso(item.codigo_producto) }}
            </td>
            <td style="border: 1px solid #000; text-align: right; font-weight: bold; padding: 4px;">
              {{ getPrintArmadoPiezas(item.codigo_producto) }}
            </td>
          </tr>
          <tr v-if="!activePrintPedido.items || activePrintPedido.items.length === 0">
            <td colspan="4" style="border: 1px solid #000; padding: 12px; text-align: center; font-size: 0.8rem; color: #555;">
              No hay productos registrados en este pedido.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

    <!-- VISTA 2: DETALLES REQUERIDOS (MATRIZ POR SUCURSALES Y PRODUCTOS) -->
    <div v-if="!selectedPedido && activeMainTab === 'detalles'" class="animate-fade">
      
      <!-- Header de la Vista -->
      <div class="page-header">
        <div class="header-content">
          <h2 class="page-title"><i class="ph ph-table text-blue"></i> Detalles Requeridos</h2>
          <p class="page-description">Matriz consolidada de cantidades solicitadas por sucursal en pedidos Pendientes o En Preparación.</p>
        </div>
        <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-secondary" @click="exportarDetallesRequeridosExcel" :disabled="matrizDetallesRequeridos.length === 0" style="display: flex; align-items: center; gap: 0.35rem;">
            <i class="ph ph-file-xls text-green" style="font-size: 1.1rem;"></i> Exportar Excel
          </button>
          <button class="btn btn-secondary" @click="fetchPedidos" :disabled="loading" style="display: flex; align-items: center; gap: 0.35rem;">
            <i class="ph ph-spinner spinner" v-if="loading"></i>
            <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
          </button>
        </div>
      </div>

      <!-- Tarjetas de Resumen KPI -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
        <div class="status-card info">
          <div class="status-card-body">
            <div class="status-card-info">
              <span class="status-card-title">Productos Requeridos</span>
              <span class="status-card-value text-blue">{{ matrizDetallesRequeridos.length }}</span>
            </div>
            <i class="ph ph-package status-card-icon"></i>
          </div>
        </div>

        <div class="status-card warning">
          <div class="status-card-body">
            <div class="status-card-info">
              <span class="status-card-title">Sucursales Solicitantes</span>
              <span class="status-card-value text-orange">{{ sucursalesRequeridas.length }}</span>
            </div>
            <i class="ph ph-storefront status-card-icon"></i>
          </div>
        </div>

        <div class="status-card success">
          <div class="status-card-body">
            <div class="status-card-info">
              <span class="status-card-title">Total Solicitado</span>
              <span class="status-card-value text-green">{{ totalesPorSucursal.granTotal.toFixed(3) }}</span>
            </div>
            <i class="ph ph-scales status-card-icon"></i>
          </div>
        </div>
      </div>

      <!-- Tabla Matriz en Card -->
      <div class="card" style="padding: 0; border: 2px solid var(--bevel-dark); background: var(--bg-window); overflow: hidden;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background-color: #0b5394; padding: 0.6rem 0.85rem;">
          <span class="card-title" style="color: white; font-weight: bold; margin: 0; font-size: 0.9rem;">
            Cantidades Pedidas por Sucursal (Pedidos Pendientes y En Preparación)
          </span>

          <!-- Buscador Predictivo -->
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.15rem 0.4rem; height: 28px; width: 220px;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
            <input 
              type="text" 
              v-model="searchQueryDetalles" 
              placeholder="Buscar producto o código..." 
              style="border: none; outline: none; font-size: 0.78rem; background: transparent; width: 100%; color: var(--text-primary);"
            />
            <button v-if="searchQueryDetalles" @click="searchQueryDetalles = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
              <i class="ph ph-x-circle"></i>
            </button>
          </div>
        </div>

        <!-- Tabla Matriz Requeridos -->
        <div class="table-container" style="max-height: calc(100vh - 280px); overflow-x: auto; overflow-y: auto;">
          <table class="access-table" style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
            <thead>
              <tr style="background: var(--bg-secondary); position: sticky; top: 0; z-index: 2; border-bottom: 2px solid var(--bevel-dark);">
                <th style="padding: 10px 12px; text-align: center; font-weight: 900; width: 90px; border-right: 1px solid var(--bevel-dark);">Cod</th>
                <th style="padding: 10px 12px; text-align: left; font-weight: 900; min-width: 220px; border-right: 1.5px solid var(--bevel-dark);">Nombre</th>
                
                <!-- Columnas por Cada Sucursal -->
                <th 
                  v-for="suc in sucursalesRequeridas" 
                  :key="suc" 
                  style="padding: 10px 12px; text-align: right; font-weight: 800; min-width: 110px; background: #e0f2fe; color: #0369a1; border-right: 1px solid var(--bevel-light);"
                >
                  {{ suc }}
                </th>

                <!-- Columna Total Horizontal -->
                <th style="padding: 10px 12px; text-align: right; font-weight: 900; width: 120px; background: #dcfce7; color: #15803d; border-left: 2px solid var(--bevel-dark);">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(row, idx) in matrizDetallesRequeridos" 
                :key="row.codigo"
                :style="{ background: idx % 2 === 0 ? 'var(--bg-window)' : 'var(--bg-secondary)' }"
                style="border-bottom: 1px solid var(--bevel-light);"
              >
                <td style="padding: 8px 12px; text-align: center; font-weight: 900; font-family: monospace; border-right: 1px solid var(--bevel-dark);">
                  {{ row.codigo }}
                </td>
                <td style="padding: 8px 12px; font-weight: 700; color: var(--text-primary); border-right: 1.5px solid var(--bevel-dark);">
                  {{ row.nombre }}
                </td>

                <!-- Celdas por Sucursal -->
                <td 
                  v-for="suc in sucursalesRequeridas" 
                  :key="suc"
                  style="padding: 8px 12px; text-align: right; font-weight: 700; border-right: 1px solid var(--bevel-light);"
                  :style="{ color: row.sucursales[suc] > 0 ? '#0284c7' : 'var(--text-muted)' }"
                >
                  {{ row.sucursales[suc] > 0 ? row.sucursales[suc].toFixed(3) : '-' }}
                </td>

                <!-- Total Fila -->
                <td style="padding: 8px 12px; text-align: right; font-weight: 900; color: #16a34a; background: rgba(22, 163, 74, 0.05); border-left: 2px solid var(--bevel-dark);">
                  {{ row.total.toFixed(3) }}
                </td>
              </tr>

              <!-- Estado Vacío -->
              <tr v-if="matrizDetallesRequeridos.length === 0">
                <td :colspan="sucursalesRequeridas.length + 3" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                  <i class="ph ph-info" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
                  No se encontraron pedidos en estado 'Pendiente' o 'En preparación' para generar la matriz de detalles requeridos.
                </td>
              </tr>
            </tbody>

            <!-- Footer con Totales Verticales -->
            <tfoot v-if="matrizDetallesRequeridos.length > 0" style="position: sticky; bottom: 0; z-index: 2; background: var(--bg-secondary); border-top: 2.5px solid var(--bevel-dark);">
              <tr style="font-weight: 900;">
                <td style="padding: 10px 12px; text-align: center; border-right: 1px solid var(--bevel-dark);">TOTALES</td>
                <td style="padding: 10px 12px; text-align: left; border-right: 1.5px solid var(--bevel-dark);">Resumen acumulado por columna</td>
                
                <!-- Totales por Sucursal -->
                <td 
                  v-for="suc in sucursalesRequeridas" 
                  :key="suc"
                  style="padding: 10px 12px; text-align: right; color: #0284c7; border-right: 1px solid var(--bevel-light);"
                >
                  {{ (totalesPorSucursal.sucursales[suc] || 0).toFixed(3) }}
                </td>

                <!-- Gran Total -->
                <td style="padding: 10px 12px; text-align: right; color: #16a34a; background: #dcfce7; border-left: 2px solid var(--bevel-dark);">
                  {{ totalesPorSucursal.granTotal.toFixed(3) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useWinDialog } from '../composables/useWinDialog'
import { calcularPiezasProducto } from '../utils/calculoPiezas'
import * as XLSX from 'xlsx'

const authStore = useAuthStore()
const { winConfirm } = useWinDialog()

// Pestaña activa principal
const activeMainTab = ref('pedidos') // 'pedidos' | 'detalles'
const searchQueryDetalles = ref('')

// Pedidos filtrados para Detalles Requeridos (solo Pendiente o Preparando/En preparación)
const pedidosRequeridos = computed(() => {
  return pedidos.value.filter(p => {
    const est = (p.estado || '').toLowerCase()
    return est.includes('pendien') || est.includes('prepar')
  })
})

// Lista única de sucursales que tienen pedidos requeridos
const sucursalesRequeridas = computed(() => {
  const set = new Set()
  pedidosRequeridos.value.forEach(p => {
    if (p.sucursal && p.sucursal.trim()) {
      set.add(p.sucursal.trim())
    }
  })
  return Array.from(set).sort()
})

// Matriz consolidada: Producto x Sucursales
const matrizDetallesRequeridos = computed(() => {
  const mapProd = new Map()

  pedidosRequeridos.value.forEach(p => {
    const sucName = (p.sucursal || 'Sin Sucursal').trim()
    const items = p.items || []

    items.forEach(item => {
      const cod = String(item.codigo_producto || item.Producto?.codigo || '-').trim()
      if (!cod || cod === '-') return

      const nom = item.Producto?.nombre || item.nombre || 'Desconocido'
      
      const cantFrac = parseFloat(item.fraccion || 0)
      const cantPieza = parseFloat(item.pieza || 0)
      const cantEnviada = parseFloat(item.peso_enviado || item.fraccion_enviada || 0)
      const cantReq = cantFrac > 0 ? cantFrac : (cantPieza > 0 ? cantPieza : cantEnviada)

      if (!mapProd.has(cod)) {
        mapProd.set(cod, {
          codigo: cod,
          nombre: nom,
          sucursales: {},
          total: 0
        })
      }

      const prodRow = mapProd.get(cod)
      if (!prodRow.sucursales[sucName]) {
        prodRow.sucursales[sucName] = 0
      }
      prodRow.sucursales[sucName] += cantReq
      prodRow.total += cantReq
    })
  })

  let list = Array.from(mapProd.values())

  if (searchQueryDetalles.value.trim()) {
    const q = searchQueryDetalles.value.trim().toLowerCase()
    list = list.filter(r => r.codigo.toLowerCase().includes(q) || r.nombre.toLowerCase().includes(q))
  }

  list.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }))

  return list
})

// Totales verticales por sucursal y gran total acumulado
const totalesPorSucursal = computed(() => {
  const totMap = {}
  let granTotal = 0

  sucursalesRequeridas.value.forEach(suc => {
    totMap[suc] = 0
  })

  matrizDetallesRequeridos.value.forEach(row => {
    sucursalesRequeridas.value.forEach(suc => {
      const cant = row.sucursales[suc] || 0
      totMap[suc] += cant
    })
    granTotal += row.total
  })

  return {
    sucursales: totMap,
    granTotal
  }
})

// Exportar matriz Detalles Requeridos a Excel
const exportarDetallesRequeridosExcel = () => {
  if (matrizDetallesRequeridos.value.length === 0) return

  const sucs = sucursalesRequeridas.value

  const dataExport = matrizDetallesRequeridos.value.map(row => {
    const obj = {
      'Cod': row.codigo,
      'Nombre': row.nombre
    }
    sucs.forEach(suc => {
      obj[suc] = row.sucursales[suc] ? parseFloat(row.sucursales[suc].toFixed(3)) : 0
    })
    obj['TOTAL'] = parseFloat(row.total.toFixed(3))
    return obj
  })

  // Fila resumen de totales
  const totObj = {
    'Cod': 'TOTALES',
    'Nombre': 'Totales Generales'
  }
  sucs.forEach(suc => {
    totObj[suc] = parseFloat((totalesPorSucursal.value.sucursales[suc] || 0).toFixed(3))
  })
  totObj['TOTAL'] = parseFloat(totalesPorSucursal.value.granTotal.toFixed(3))
  dataExport.push(totObj)

  const worksheet = XLSX.utils.json_to_sheet(dataExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalles Requeridos')

  const fileName = `Detalles_Requeridos_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

// Estado para Modal de Códigos de Barra
const showBarcodeModal = ref(false)
const selectedPedidoForBarcodes = ref(null)
const barcodeItems = ref([])
const currentBarcodeIndex = ref(0)

const currentBarcodeItem = computed(() => {
  if (!barcodeItems.value || barcodeItems.value.length === 0) return null
  return barcodeItems.value[currentBarcodeIndex.value] || barcodeItems.value[0]
})

const nextBarcode = () => {
  if (!barcodeItems.value || barcodeItems.value.length === 0) return
  currentBarcodeIndex.value = (currentBarcodeIndex.value + 1) % barcodeItems.value.length
}

const prevBarcode = () => {
  if (!barcodeItems.value || barcodeItems.value.length === 0) return
  currentBarcodeIndex.value = (currentBarcodeIndex.value - 1 + barcodeItems.value.length) % barcodeItems.value.length
}

const handleKeyDown = (e) => {
  if (!showBarcodeModal.value) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    nextBarcode()
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    prevBarcode()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    showBarcodeModal.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const formatCantidadItemDisplay = (item) => {
  const pzas = parseInt(item.pieza || item.cantidad_enviada || 0, 10)
  const frac = parseFloat(item.fraccion || item.fraccion_enviada || 0)
  const peso = parseFloat(item.peso || item.peso_enviado || 0)
  const pesoPieza = parseFloat(item.Producto?.peso_pieza || 0)

  let partes = []

  // Si hay peso grabado explícito o enviado
  if (peso > 0) {
    partes.push(`${peso.toFixed(3)} kg`)
  } else if (frac > 0) {
    partes.push(`${frac.toFixed(3)} kg`)
  } else if (pzas > 0 && pesoPieza > 0) {
    partes.push(`${(pzas * pesoPieza).toFixed(3)} kg`)
  }

  // Agregar detalle de piezas/fracciones si existen
  if (pzas > 0 && frac > 0) {
    partes.push(`(${pzas} P y ${Math.round(frac)} F)`)
  } else if (pzas > 0) {
    partes.push(`(${pzas} Pzs)`)
  } else if (frac > 0 && peso === 0) {
    partes.push(`(${frac.toFixed(3)} Frac)`)
  }

  if (partes.length > 0) {
    return partes.join(' ')
  }
  return '-'
}

const openBarcodesModalForPedido = (pedido) => {
  if (!pedido || !pedido.items || pedido.items.length === 0) {
    showAlert('El pedido seleccionado no posee ítems.', 'error')
    return
  }
  selectedPedidoForBarcodes.value = pedido
  currentBarcodeIndex.value = 0

  const mapProds = new Map()
  pedido.items.forEach(it => {
    const cod = String(it.codigo_producto || it.Producto?.codigo || '-').trim()
    if (!cod || cod === '-') return
    const nom = it.Producto?.nombre || it.nombre || cod
    const cantDisp = formatCantidadItemDisplay(it)

    if (!mapProds.has(cod)) {
      mapProds.set(cod, {
        codigo: cod,
        nombre: nom,
        cantidadDisplay: cantDisp
      })
    }
  })

  barcodeItems.value = Array.from(mapProds.values())
  showBarcodeModal.value = true
}

const imprimirCodigosModal = () => {
  if (!barcodeItems.value || barcodeItems.value.length === 0) return

  const win = window.open('', '_blank', 'width=1000,height=750')
  if (!win) return

  const codigoPedido = selectedPedidoForBarcodes.value?.codigo || selectedPedidoForBarcodes.value?.id || 'S/N'
  const sucursal = selectedPedidoForBarcodes.value?.sucursal || '-'

  const itemsHtml = barcodeItems.value.map(it => {
    const svgCode = generateBarcodeSVG(it.codigo, { scale: 1.5, height: 40 })
    return `
      <div style="border: 1.5px solid #000; padding: 6px 4px; text-align: center; page-break-inside: avoid; border-radius: 4px; background: #fff; display: flex; flex-direction: column; justify-content: space-between; min-height: 100px;">
        <div style="font-size: 10px; font-weight: bold; font-family: monospace; color: #000;">CÓD: ${it.codigo}</div>
        <div style="font-size: 11px; font-weight: bold; font-family: sans-serif; margin: 2px 0; color: #000; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${it.nombre}">${it.nombre}</div>
        <div style="margin: 2px 0;">${svgCode}</div>
        <div style="font-size: 10px; font-weight: bold; font-family: monospace; color: #d97706;">CANTIDAD: ${it.cantidadDisplay}</div>
      </div>
    `
  }).join('')

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Códigos de Barra - Pedido ${codigoPedido}</title>
        <style>
          @page { size: A4; margin: 8mm; }
          * { box-sizing: border-box; }
          body { font-family: sans-serif; padding: 10px; color: #000; background: #fff; margin: 0; }
          .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 6px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
          @media print {
            body { padding: 0; }
            .header { margin-bottom: 8px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h3 style="margin: 0; font-size: 16px;">PEDIDO Nº ${codigoPedido}</h3>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Sucursal Destino: ${sucursal}</p>
        </div>
        <div class="grid">
          ${itemsHtml}
        </div>
        <script>
          window.onload = function() { window.print(); }
        <\/script>
      </body>
    </html>
  `)
  win.document.close()
}

// Generador SVG de Código de Barras Code 128 (Usando únicamente el Código del Producto)
const generateBarcodeSVG = (text, options = {}) => {
  if (!text) return ''
  const str = String(text).trim()
  if (!str) return ''
  
  const patterns = [
    "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
    "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
    "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
    "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
    "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
    "231131","213113","213311","213131","311123","311321","331121","312113","332111","332111",
    "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
    "112412","122114","122411","142112","142211","241211","221114","411112","411211","211142",
    "211241","211421","231112","112142","112241","114122","114221","124112","124211","411221",
    "421121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
    "114131","311141","411131","211412","211214","211232","2331112"
  ]

  let codeBuffer = [104]
  let checkSum = 104

  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i)
    let code = charCode - 32
    if (code < 0 || code > 95) code = 0
    codeBuffer.push(code)
    checkSum += code * (i + 1)
  }

  const checksumVal = checkSum % 103
  codeBuffer.push(checksumVal)
  codeBuffer.push(106)

  let bars = ""
  for (let i = 0; i < codeBuffer.length; i++) {
    bars += patterns[codeBuffer[i]]
  }

  const scale = options.scale || 3.5
  const height = options.height || 95
  const fontSize = options.fontSize || 20
  const quietZone = 20

  let x = quietZone
  let rects = ""
  let isBar = true

  for (let i = 0; i < bars.length; i++) {
    const width = parseInt(bars[i], 10) * scale
    if (isBar) {
      rects += `<rect x="${x}" y="4" width="${width}" height="${height}" fill="#000000"/>`
    }
    x += width
    isBar = !isBar
  }

  const totalWidth = x + quietZone
  const svgHeight = height + fontSize + 15

  const showText = options.showText !== false
  const textHtml = showText ? `<text x="${totalWidth / 2}" y="${height + fontSize + 8}" font-family="monospace" font-size="${fontSize}" font-weight="900" text-anchor="middle" fill="#000000">${str}</text>` : ''

  const maxWidthCss = options.maxWidth || '100%'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${svgHeight}" style="width: 100%; max-width: ${maxWidthCss}; height: auto; display: block; margin: 0 auto;">
    <rect width="100%" height="100%" fill="#ffffff"/>
    ${rects}
    ${textHtml}
  </svg>`
}

// Estados reactivos
const pedidos = ref([])
const selectedPedido = ref(null)
const showDetailModal = ref(false)
const statusFilter = ref('Todos')

// Estados para Conciliación y Vinculación con Block WMS
const subTabPedido = ref('preparacion') // 'preparacion' | 'conciliacion'
const conciliacionData = ref([])
const loadingConciliacion = ref(false)
const showVincularModal = ref(false)
const vincularOrdenInput = ref('')
const vincularSiteId = ref('194326')
const vincularFechaDesde = ref('')
const vincularFechaHasta = ref('')
const vincularOrdenesList = ref([])
const ordenSeleccionadaObj = ref(null)
const loadingBusquedaBlock = ref(false)
const busquedaRealizada = ref(false)
const savingVinculacion = ref(false)

const cambiarASubTabConciliacion = () => {
  subTabPedido.value = 'conciliacion'
  if (selectedPedido.value && selectedPedido.value.wms_orden_egreso) {
    fetchConciliacion(selectedPedido.value)
  }
}

// Matriz de conciliación calculada reactivamente
const listaConciliacion = computed(() => {
  if (conciliacionData.value && conciliacionData.value.length > 0) {
    return conciliacionData.value
  }

  // Fallback si el pedido ya tiene wms_datos_items
  if (!selectedPedido.value) return []
  let itemsBlock = selectedPedido.value.wms_datos_items
  if (typeof itemsBlock === 'string') {
    try {
      itemsBlock = JSON.parse(itemsBlock)
    } catch (e) {
      itemsBlock = []
    }
  }
  if (!Array.isArray(itemsBlock)) itemsBlock = []
  if (itemsBlock.length === 0 && (!selectedPedido.value.items || selectedPedido.value.items.length === 0)) return []

  const blockMap = new Map()
  for (const bi of itemsBlock) {
    const c = String(bi.codigo || bi.codigo_productos || '').trim().toUpperCase()
    if (!c) continue
    if (!blockMap.has(c)) {
      blockMap.set(c, {
        codigo: c,
        nombre: String(bi.producto || bi.nombre || '').trim(),
        lotes: [],
        despachada: 0,
        ubicaciones: new Set()
      })
    }
    const bObj = blockMap.get(c)
    bObj.despachada += parseFloat(bi.despachada || bi.cantidad_actual || 0)
    if (bi.lote && !bObj.lotes.includes(bi.lote)) bObj.lotes.push(bi.lote)
    if (bi.ubicacion) bObj.ubicaciones.add(bi.ubicacion)
  }

  const result = []
  const processedBlockCodes = new Set()

  const pedItems = selectedPedido.value.items || []
  for (const pi of pedItems) {
    const codigo = String(pi.codigo_producto || '').trim().toUpperCase()
    
    // Buscar coincidencia exacta o sin ceros
    let blockData = blockMap.get(codigo)
    if (!blockData) {
      const unpadded = codigo.replace(/^0+/, '')
      if (unpadded) {
        blockData = blockMap.get(unpadded)
        if (!blockData) {
          for (const [k, v] of blockMap.entries()) {
            if (k.replace(/^0+/, '') === unpadded) {
              blockData = v
              break
            }
          }
        }
      }
    }

    if (blockData) {
      processedBlockCodes.add(blockData.codigo)
    }
    processedBlockCodes.add(codigo)

    const enviadoKg = blockData ? parseFloat(blockData.despachada.toFixed(3)) : 0
    const preparadoKg = parseFloat(pi.peso_enviado || 0)
    const pzasPed = parseInt(pi.pieza || 0, 10)
    const fracPed = parseFloat(pi.fraccion || 0)
    const pzasEnv = parseInt(pi.cantidad_enviada || 0, 10)
    const fracEnv = parseFloat(pi.fraccion_enviada || 0)

    const diffKg = parseFloat((enviadoKg - preparadoKg).toFixed(3))
    let estado = 'COINCIDE'

    if (enviadoKg === 0 && (preparadoKg > 0 || pzasPed > 0 || fracPed > 0)) {
      estado = 'FALTANTE_BLOCK'
    } else if (Math.abs(diffKg) > 0.05) {
      estado = 'DIFERENCIA'
    }

    result.push({
      codigo,
      nombre: pi.Producto?.nombre || blockData?.nombre || 'Producto sin nombre',
      pedido_piezas: pzasPed,
      pedido_fraccion: fracPed,
      pedido_display: pzasPed > 0 ? `${pzasPed} pz${pzasPed > 1 ? 's' : ''}` : (fracPed > 0 ? `${fracPed.toFixed(3)} kg` : '-'),
      preparado_piezas: pzasEnv,
      preparado_fraccion: fracEnv,
      preparado_kg: preparadoKg,
      no_envia: !!pi.no_envia,
      sin_stock: !!pi.sin_stock,
      enviado_kg: enviadoKg,
      lotes: blockData ? blockData.lotes.join(', ') : '',
      ubicaciones: blockData ? Array.from(blockData.ubicaciones).join(', ') : '',
      diferencia_kg: diffKg,
      estado_conciliacion: estado
    })
  }

  for (const [c, bObj] of blockMap.entries()) {
    if (!processedBlockCodes.has(c)) {
      result.push({
        codigo: c,
        nombre: bObj.nombre || 'Producto Extra en Block',
        pedido_piezas: 0,
        pedido_fraccion: 0,
        pedido_display: '-',
        preparado_piezas: 0,
        preparado_fraccion: 0,
        preparado_kg: 0,
        no_envia: false,
        sin_stock: false,
        enviado_kg: parseFloat(bObj.despachada.toFixed(3)),
        diferencia_kg: parseFloat(bObj.despachada.toFixed(3)),
        estado_conciliacion: 'EXTRA_BLOCK'
      })
    }
  }

  return result
})

const totalPreparadoConciliacion = computed(() => {
  return listaConciliacion.value.reduce((acc, i) => acc + (i.preparado_kg || 0), 0)
})

const totalEnviadoConciliacion = computed(() => {
  return listaConciliacion.value.reduce((acc, i) => acc + (i.enviado_kg || 0), 0)
})

const diferenciaNetaConciliacion = computed(() => {
  return parseFloat((totalEnviadoConciliacion.value - totalPreparadoConciliacion.value).toFixed(3))
})

const getConciliacionRowStyle = (item) => {
  if (item.estado_conciliacion === 'FALTANTE_BLOCK') {
    return { background: '#fef2f2' }
  }
  if (item.estado_conciliacion === 'EXTRA_BLOCK') {
    return { background: '#f0f9ff' }
  }
  if (item.estado_conciliacion === 'DIFERENCIA') {
    return { background: '#fffbeb' }
  }
  return {}
}

const openVincularModal = (pedido) => {
  if (!pedido) return
  vincularOrdenInput.value = pedido.wms_orden_egreso || ''
  ordenSeleccionadaObj.value = null
  vincularOrdenesList.value = []
  busquedaRealizada.value = false

  const d = pedido.fecha ? String(pedido.fecha).split('T')[0] : new Date().toISOString().split('T')[0]
  vincularFechaDesde.value = d
  vincularFechaHasta.value = d

  showVincularModal.value = true
}

const seleccionarOrdenParaVincular = (orden) => {
  ordenSeleccionadaObj.value = orden
  vincularOrdenInput.value = orden.orden
}

const ejecutarBusquedaBlock = async () => {
  consultarEgresosBlockParaVincular()
}

const consultarEgresosBlockParaVincular = async () => {
  loadingBusquedaBlock.value = true
  busquedaRealizada.value = true
  vincularOrdenesList.value = []

  try {
    const params = new URLSearchParams()
    if (vincularSiteId.value) params.append('siteId', vincularSiteId.value)
    if (vincularFechaDesde.value) params.append('fechaDesde', vincularFechaDesde.value)
    if (vincularFechaHasta.value) params.append('fechaHasta', vincularFechaHasta.value)
    params.append('tipoComprobante', 'TODOS')

    const res = await fetch(`/api/wms/ordenes-egreso?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      if (data.ok && Array.isArray(data.ordenes)) {
        let filtradas = data.ordenes
        if (vincularOrdenInput.value.trim()) {
          const q = vincularOrdenInput.value.trim().toUpperCase()
          filtradas = filtradas.filter(o => 
            String(o.orden).toUpperCase().includes(q) ||
            String(o.documento || '').toUpperCase().includes(q) ||
            String(o.destino || '').toUpperCase().includes(q)
          )
        }
        vincularOrdenesList.value = filtradas
      }
    }
  } catch (error) {
    console.error('Error al consultar egresos de Block:', error)
  } finally {
    loadingBusquedaBlock.value = false
  }
}

const guardarVinculacionManual = async () => {
  if (!selectedPedido.value) return
  if (!vincularOrdenInput.value.trim()) {
    showAlert('Ingresa o selecciona un número de orden de Block.', 'error')
    return
  }

  savingVinculacion.value = true
  try {
    const payload = {
      ordenCodigo: vincularOrdenInput.value.trim(),
      siteId: vincularSiteId.value
    }
    if (ordenSeleccionadaObj.value) {
      payload.ordenData = ordenSeleccionadaObj.value
    }

    const res = await fetch(`/api/pedidos/${selectedPedido.value.id}/vincular-egreso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (res.ok) {
      selectedPedido.value.wms_orden_egreso = data.pedido.wms_orden_egreso
      selectedPedido.value.wms_documento = data.pedido.wms_documento
      selectedPedido.value.wms_fecha_egreso = data.pedido.wms_fecha_egreso
      selectedPedido.value.wms_despachado_kg = data.pedido.wms_despachado_kg
      selectedPedido.value.wms_datos_items = data.pedido.wms_datos_items

      conciliacionData.value = data.conciliacion || []
      showVincularModal.value = false
      subTabPedido.value = 'conciliacion'
      showAlert('Egreso de Block vinculado correctamente al pedido.')
      fetchPedidos()
    } else {
      showAlert(data.error || 'Error al vincular el egreso de Block.', 'error')
    }
  } catch (error) {
    console.error('Error al guardar vinculación:', error)
    showAlert('Error de conexión al vincular egreso.', 'error')
  } finally {
    savingVinculacion.value = false
  }
}

const desvincularEgreso = async (pedido) => {
  if (!pedido) return
  if (!await winConfirm(`¿Deseas desvincular la orden de egreso de Block #${pedido.wms_orden_egreso} de este pedido?`, 'Confirmar Desvinculación')) {
    return
  }

  try {
    const res = await fetch(`/api/pedidos/${pedido.id}/desvincular-egreso`, {
      method: 'DELETE'
    })
    const data = await res.json()
    if (res.ok) {
      pedido.wms_orden_egreso = null
      pedido.wms_documento = null
      pedido.wms_fecha_egreso = null
      pedido.wms_despachado_kg = null
      pedido.wms_datos_items = null
      conciliacionData.value = []
      showAlert('Egreso desvinculado del pedido.')
      fetchPedidos()
    } else {
      showAlert(data.error || 'Error al desvincular egreso.', 'error')
    }
  } catch (error) {
    console.error('Error al desvincular:', error)
    showAlert('Error de conexión al desvincular.', 'error')
  }
}

const fetchConciliacion = async (pedido) => {
  if (!pedido || !pedido.id) return
  loadingConciliacion.value = true
  try {
    const res = await fetch(`/api/pedidos/${pedido.id}/conciliacion`)
    if (res.ok) {
      const data = await res.json()
      conciliacionData.value = data.conciliacion || []
    }
  } catch (error) {
    console.error('Error al consultar conciliación:', error)
  } finally {
    loadingConciliacion.value = false
  }
}

const exportarConciliacionExcel = () => {
  if (listaConciliacion.value.length === 0) return
  const ped = selectedPedido.value
  const dataExport = listaConciliacion.value.map(it => ({
    'Cód SKU': it.codigo,
    'Producto': it.nombre,
    'Pedido': it.pedido_display,
    'Preparado (kg)': parseFloat((it.preparado_kg || 0).toFixed(3)),
    'Enviado Block (kg)': parseFloat((it.enviado_kg || 0).toFixed(3)),
    'Diferencia (kg)': parseFloat((it.diferencia_kg || 0).toFixed(3)),
    'Estado': it.estado_conciliacion === 'COINCIDE' ? 'Coincide' :
              (it.estado_conciliacion === 'DIFERENCIA' ? 'Desvío' :
              (it.estado_conciliacion === 'FALTANTE_BLOCK' ? 'Faltante en Block' : 'Extra en Block'))
  }))

  dataExport.push({
    'Cód SKU': 'TOTALES',
    'Producto': 'Resumen General',
    'Pedido': '-',
    'Preparado (kg)': parseFloat(totalPreparadoConciliacion.value.toFixed(3)),
    'Enviado Block (kg)': parseFloat(totalEnviadoConciliacion.value.toFixed(3)),
    'Diferencia (kg)': parseFloat(diferenciaNetaConciliacion.value.toFixed(3)),
    'Estado': Math.abs(diferenciaNetaConciliacion.value) <= 0.05 ? 'OK' : 'Diferencia Global'
  })

  const ws = XLSX.utils.json_to_sheet(dataExport)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Conciliación')

  const fileName = `Conciliacion_${ped?.codigo || 'Pedido'}_Block_${ped?.wms_orden_egreso || 'SN'}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// Consulta de Stock por Ubicación / Sucursal Destino (Usando el ID de BBDD MariaDB de Sucursal)
const sucursalStockMap = ref({})
const loadingSucursalStock = ref(false)
const listSucursales = ref([])

const normalizeText = (str) => {
  return String(str || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

const fetchSucursalStockForPedido = async (pedido) => {
  if (!pedido) {
    sucursalStockMap.value = {}
    return
  }

  loadingSucursalStock.value = true
  sucursalStockMap.value = {}

  try {
    // 1. Cargar lista de sucursales de MariaDB desde /api/sucursales si no está en memoria
    if (listSucursales.value.length === 0) {
      try {
        const sRes = await fetch('/api/sucursales')
        if (sRes.ok) {
          listSucursales.value = await sRes.json()
        }
      } catch (e) {}
    }

    // 2. Determinar la sucursal del pedido y sus datos de coincidencia
    const rawSucVal = String(pedido.sucursal || '').trim()
    const normRawSucVal = normalizeText(rawSucVal)

    const foundSuc = listSucursales.value.find(s => 
      String(s.id) === rawSucVal || 
      String(s.numero) === rawSucVal ||
      normalizeText(s.sucursal) === normRawSucVal ||
      (s.Ubicacion && normalizeText(s.Ubicacion.nombre) === normRawSucVal)
    )

    const normFoundName = foundSuc ? normalizeText(foundSuc.sucursal) : ''
    const normFoundUbi = (foundSuc && foundSuc.Ubicacion) ? normalizeText(foundSuc.Ubicacion.nombre) : ''
    const numPadded = foundSuc && foundSuc.numero ? String(foundSuc.numero).padStart(2, '0') : ''
    const siteIdStr = foundSuc ? String(foundSuc.id) : ''

    console.log(`[Pedidos] Consultando stock WMS para sucursal: val="${rawSucVal}", foundName="${normFoundName}", foundUbi="${normFoundUbi}", num="${numPadded}"`)

    // 3. Consultar stock invocando el endpoint POST /api/wms/stock-sucursales
    const res = await fetch('/api/wms/stock-sucursales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigoProducto: ''
      })
    })

    if (res.ok) {
      const data = await res.json()
      if (data.ok && Array.isArray(data.items)) {
        const map = {}
        data.items.forEach(i => {
          const normSiteStr = normalizeText(i.sucursal)

          const isMatch = (normRawSucVal && (normSiteStr.includes(normRawSucVal) || normRawSucVal.includes(normSiteStr))) ||
                          (normFoundName && (normSiteStr.includes(normFoundName) || normFoundName.includes(normSiteStr))) ||
                          (normFoundUbi && (normSiteStr.includes(normFoundUbi) || normFoundUbi.includes(normSiteStr))) ||
                          (numPadded && normSiteStr.includes(numPadded)) ||
                          (siteIdStr && normSiteStr.includes(siteIdStr))

          if (isMatch && i.codigo) {
            const rawCode = String(i.codigo).trim()
            const unpaddedCode = rawCode.replace(/^0+/, '')
            const stockVal = parseFloat(i.stock) || 0

            map[rawCode] = stockVal
            if (unpaddedCode) {
              map[unpaddedCode] = stockVal
            }
          }
        })
        console.log('[Pedidos] sucursalStockMap final:', map)
        sucursalStockMap.value = map
      }
    }
  } catch (err) {
    console.error('Error al consultar stock con ID de sucursal MariaDB:', err)
  } finally {
    loadingSucursalStock.value = false
  }
}

const getSucursalStockForItem = (item) => {
  if (!item) return 0.00
  const code = String(item.codigo_producto || item.codigo || '').trim()
  if (!code) return 0.00
  const codeUnpadded = code.replace(/^0+/, '')

  if (sucursalStockMap.value[code] !== undefined) {
    return sucursalStockMap.value[code]
  }
  if (sucursalStockMap.value[codeUnpadded] !== undefined) {
    return sucursalStockMap.value[codeUnpadded]
  }
  return 0.00
}

const formatStockVal = (val) => {
  if (val === undefined || val === null) return '0.00'
  const num = parseFloat(val)
  return isNaN(num) ? '0.00' : num.toFixed(2)
}

const getStockCD = (item) => {
  if (!item) return 0.00
  if (item.Producto && item.Producto.stock !== undefined && item.Producto.stock !== null) {
    return parseFloat(item.Producto.stock)
  }
  const code = item.codigo_producto || item.codigo
  if (code && catalogProducts.value.length > 0) {
    const found = catalogProducts.value.find(p => p.codigo === code)
    if (found && found.stock !== undefined && found.stock !== null) {
      return parseFloat(found.stock)
    }
  }
  return 0.00
}

const getStockColor = (val) => {
  if (val === undefined || val === null) return 'var(--text-muted)'
  const num = parseFloat(val || 0)
  return num <= 0 ? 'var(--accent-danger)' : 'var(--accent-success)'
}

const selectPedido = (p) => {
  selectedPedido.value = p
  isEditingMode.value = false
  subTabPedido.value = 'preparacion'
  conciliacionData.value = []
  fetchSucursalStockForPedido(p)
  if (p && p.wms_orden_egreso) {
    fetchConciliacion(p)
  }
}

const volverALaLista = () => {
  selectedPedido.value = null
  isEditingMode.value = false
}

const loading = ref(false)
const uploading = ref(false)
const selectedFile = ref(null)
const uploadResult = ref(null)
const showUploadModal = ref(false)
const expandedPedidos = ref({})
const alert = ref({ show: false, message: '', type: 'success' })

const fileInput = ref(null)

// Estados para el Modal de Control de Ítems
const showControlModal = ref(false)
const controlItems = ref([])
const currentControlIndex = ref(0)
const btnNextControl = ref(null)
const btnFinishControl = ref(null)

const currentControlItem = computed(() => {
  return controlItems.value[currentControlIndex.value] || null
})

const controlCheckedCount = computed(() => {
  return currentControlIndex.value
})

const controlProgressPercentage = computed(() => {
  if (controlItems.value.length === 0) return 0
  return Math.round((currentControlIndex.value / controlItems.value.length) * 100)
})

const currentControlWeight = computed(() => {
  if (!currentControlItem.value) return 0
  const p = parseFloat(currentControlItem.value.peso_enviado || 0)
  const f = parseFloat(currentControlItem.value.fraccion_enviada || 0)
  return p > 0 ? p : f
})

// Estados reactivos para la Edición de Pedidos
const catalogProducts = ref([])
const isEditingMode = ref(false)
const editingPedido = ref(null)
const editForm = ref({
  id: null,
  codigo: '',
  sucursal: '',
  fecha: '',
  estado: 'Pendiente',
  items: []
})

// Variables para agregar productos en el modal de edición
const selectedProductCode = ref('')
const newProductPiece = ref(0)
const newProductFraccion = ref(0)

const editProductSearchInput = ref('')
const selectedEditProduct = ref(null)

const handleEditProductInput = () => {
  const code = editProductSearchInput.value.trim()
  const found = catalogProducts.value.find(p => p.codigo === code)
  if (found) {
    selectedEditProduct.value = found
    selectedProductCode.value = found.codigo
  } else {
    selectedEditProduct.value = null
    selectedProductCode.value = ''
  }
}

const pedidoToDelete = ref(null)

// Estados reactivos para la Creación de Pedidos
const showCreateModal = ref(false)
const createForm = ref({
  codigo: '',
  sucursal: '',
  fecha: '',
  state: 'Pendiente',
  items: []
})
const selectedCreateProductCode = ref('')
const newCreateProductPiece = ref(0)
const newCreateProductFraccion = ref(0)

const createProductSearchInput = ref('')
const selectedCreateProduct = ref(null)

const handleCreateProductInput = () => {
  const code = createProductSearchInput.value.trim()
  const found = catalogProducts.value.find(p => p.codigo === code)
  if (found) {
    selectedCreateProduct.value = found
    selectedCreateProductCode.value = found.codigo
  } else {
    selectedCreateProduct.value = null
    selectedCreateProductCode.value = ''
  }
}

// Búsqueda y Ordenación
const searchQuery = ref('')
const sortKey = ref('fecha')
const sortOrder = ref(-1) // Más recientes primero por defecto

// Mensajes interactivos
const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 4000)
}

// Cargar pedidos desde API
const fetchPedidos = async () => {
  loading.value = true
  try {
    let url = '/api/pedidos'
    const userRole = authStore.user?.rol?.toLowerCase() || ''
    if (userRole === 'sucursal' && authStore.user?.usuario) {
      url += `?sucursal=${encodeURIComponent(authStore.user.usuario)}`
    }
    const res = await fetch(url)
    if (res.ok) {
      pedidos.value = await res.json()
      if (selectedPedido.value) {
        const found = pedidos.value.find(p => p.id === selectedPedido.value.id)
        selectedPedido.value = found || null
        if (selectedPedido.value) {
          fetchSucursalStockForPedido(selectedPedido.value)
        }
      }
    } else {
      showAlert('Error al descargar listado de pedidos', 'error')
    }
  } catch (error) {
    console.error('Error fetching pedidos:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

// Abrir Selector de Archivos al hacer click en la zona de drop
const triggerFileInput = () => {
  fileInput.value.click()
}

// Archivo Seleccionado
const onFileSelected = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  // Validar extensión
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext !== 'xlsx' && ext !== 'xls') {
    showAlert('Por favor, selecciona únicamente archivos Excel (.xlsx o .xls)', 'error')
    clearFileSelection()
    return
  }

  selectedFile.value = file
}

const clearFileSelection = () => {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// Subida de Archivo Excel FormData
const uploadFile = async () => {
  if (!selectedFile.value) return

  uploading.value = true
  uploadResult.value = null
  
  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const res = await fetch('/api/pedidos/upload', {
      method: 'POST',
      body: formData // El navegador asigna el boundary y content-type multipart/form-data solo
    })

    const dataRes = await res.json()

    if (res.ok) {
      uploadResult.value = {
        mensaje: dataRes.mensaje || 'Carga completada con éxito.',
        pedidosRegistrados: dataRes.pedidosRegistrados ?? 0,
        pedidosOmitidos: dataRes.pedidosOmitidos ?? 0
      }
      
      showAlert('Planilla Excel cargada y procesada correctamente')
      clearFileSelection()
      fetchPedidos() // Recargar historial de pedidos
    } else {
      showAlert(dataRes.error || dataRes.mensaje || 'Ocurrió un error al procesar el Excel', 'error')
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    showAlert('Error de red o conexión al subir el archivo', 'error')
  } finally {
    uploading.value = false
  }
}

// Expandir o Contraer items de Pedidos
const togglePedidoExpand = (id) => {
  expandedPedidos.value[id] = !expandedPedidos.value[id]
}

const activePrintPedido = ref(null)

const getPrintArmadoItem = (codigo_producto) => {
  if (!activePrintPedido.value || !activePrintPedido.value.ArmadoItems) return null
  return activePrintPedido.value.ArmadoItems.find(a => a.codigo_producto === codigo_producto)
}

const getPrintArmadoPeso = (codigo_producto) => {
  const arm = getPrintArmadoItem(codigo_producto)
  if (!arm) return '-'
  if (arm.sin_stock) return 'S/S'
  if (arm.no_envia) return 'N/E'
  const totalPeso = parseFloat(arm.peso || 0) + parseFloat(arm.fraccion || 0)
  return totalPeso > 0 ? totalPeso.toFixed(3) + ' kg' : '-'
}

const getPrintArmadoPiezas = (codigo_producto) => {
  const arm = getPrintArmadoItem(codigo_producto)
  if (!arm) return '-'
  if (arm.sin_stock) return 'S/S'
  if (arm.no_envia) return 'N/E'
  return arm.piezas > 0 ? arm.piezas : '-'
}

const generateCode128SVG = (text, options = {}) => {
  const str = String(text || '').trim()
  if (!str) return ''

  const patterns = [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
    "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
    "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
    "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
    "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
    "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
    "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
    "112412", "122114", "122411", "142112", "142411", "241211", "221114", "411122", "411221", "421112",
    "421221", "212141", "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113",
    "411311", "113141", "114131", "311141", "411131", "211412", "211214", "211232", "233111"
  ]
  const startB = 104
  const stopPattern = "2331112"

  const codes = [startB]
  let checksum = startB

  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i)
    let val = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0
    codes.push(val)
    checksum += val * (i + 1)
  }

  const checkVal = checksum % 103
  codes.push(checkVal)

  const quietZoneModules = 10
  const moduleWidth = options.moduleWidth || 1.8
  const barHeight = options.height || 45

  let rects = []
  let x = quietZoneModules * moduleWidth

  const renderPattern = (patStr) => {
    let isBar = true
    for (let j = 0; j < patStr.length; j++) {
      const w = parseInt(patStr[j], 10) * moduleWidth
      if (isBar) {
        rects.push(`<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${barHeight}" fill="#000000"/>`)
      }
      x += w
      isBar = !isBar
    }
  }

  for (const c of codes) {
    if (patterns[c]) renderPattern(patterns[c])
  }
  renderPattern(stopPattern)

  x += quietZoneModules * moduleWidth

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${x.toFixed(0)}" height="${barHeight + 20}" viewBox="0 0 ${x.toFixed(0)} ${barHeight + 20}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <g>${rects.join('')}</g>
    <text x="${(x / 2).toFixed(2)}" y="${barHeight + 14}" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle" fill="#000000">${str}</text>
  </svg>`
}

const printPedidoPdf = (pedido) => {
  if (!pedido || !pedido.items || pedido.items.length === 0) {
    showAlert('El pedido no contiene ítems para generar el PDF.', 'error')
    return
  }

  // Filtrar únicamente los productos que tengan peso o cantidad enviada cargada (> 0) y no tengan no_envia / sin_stock
  const itemsEnviadosFilter = pedido.items.filter(item => {
    if (item.no_envia || item.sin_stock) return false
    const peso = parseFloat(item.peso_enviado || 0)
    const frac = parseFloat(item.fraccion_enviada || 0)
    const pzas = parseInt(item.cantidad_enviada || 0, 10)
    return peso > 0 || frac > 0 || pzas > 0
  })

  if (itemsEnviadosFilter.length === 0) {
    showAlert('El pedido no posee ningún producto con peso/cantidad enviada cargada para generar etiquetas PDF.', 'error')
    return
  }

  const win = window.open('', '_blank', 'width=950,height=800')
  if (!win) {
    showAlert('Por favor permita las ventanas emergentes (pop-ups) en el navegador para ver el PDF.', 'error')
    return
  }

  const sucursal = pedido.sucursal || 'Sin Sucursal'
  const fechaStr = formatDate(pedido.fecha)
  const codigoPedido = pedido.codigo || 'S/N'

  const itemsHtml = itemsEnviadosFilter.map(item => {
    const cod = item.codigo_producto || '-'
    const nombre = item.Producto?.nombre || item.codigo_producto || 'Sin descripción'
    const barCodeText = item.codigo_producto || cod
    
    const pesoVal = parseFloat(item.peso_enviado || 0)
    const fracVal = parseFloat(item.fraccion_enviada || 0)
    const pzasVal = parseInt(item.cantidad_enviada || 0, 10)
    const kilosFinal = pesoVal > 0 ? pesoVal : fracVal
    
    let kilosDisplay = kilosFinal > 0 ? `${kilosFinal.toFixed(3)} kg` : (pzasVal > 0 ? `${pzasVal} pz` : '0.000 kg')

    const svgBarcode = generateBarcodeSVG(barCodeText, { scale: 1.6, height: 38 })

    return `
      <div class="product-card">
        <div class="product-header">
          <span class="product-code">CÓD: ${cod}</span>
          <span class="product-kilos">${kilosDisplay}</span>
        </div>
        <div class="product-name">${nombre}</div>
        <div class="barcode-container">
          ${svgBarcode}
        </div>
      </div>
    `
  }).join('')

  const fullContent = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    `<title>Etiquetas PDF - Pedido ${codigoPedido} (${sucursal})</title>`,
    '<style>',
    '@page { size: A4; margin: 8mm; }',
    '* { box-sizing: border-box; }',
    'body { font-family: "Nunito", Arial, sans-serif; margin: 0; padding: 10px; color: #0f172a; background: #ffffff; }',
    '.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }',
    '.title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }',
    '.subtitle { font-size: 12px; color: #64748b; margin-top: 2px; font-weight: 600; }',
    '.meta-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 4px; font-size: 12px; display: flex; gap: 20px; margin-bottom: 12px; }',
    '.meta-item strong { color: #0f172a; }',
    '.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }',
    '.product-card { border: 1.5px solid #0f172a; border-radius: 4px; padding: 6px 8px; background: #ffffff; page-break-inside: avoid; display: flex; flex-direction: column; justify-content: space-between; min-height: 110px; }',
    '.product-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 4px; }',
    '.product-code { font-weight: 800; font-size: 11px; color: #ef4444; font-family: monospace; }',
    '.product-kilos { font-weight: 800; font-size: 12px; color: #16a34a; background: #f0fdf4; padding: 1px 6px; border-radius: 3px; border: 1px solid #bbf7d0; }',
    '.product-name { font-weight: 700; font-size: 11px; color: #0f172a; margin-bottom: 4px; line-height: 1.2; }',
    '.barcode-container { text-align: center; margin-top: auto; padding-top: 2px; }',
    '.barcode-container svg { max-width: 100%; height: auto; }',
    '.btn-print { padding: 6px 14px; background: #ef4444; color: white; border: none; border-radius: 4px; font-weight: 800; cursor: pointer; font-size: 13px; }',
    '@media print { body { padding: 0; } .no-print { display: none !important; } }',
    '</style>',
    '</head>',
    '<body>',
    '<div class="header">',
    '<div>',
    '<h1 class="title">REMITO / ETIQUETAS CON CÓDIGO DE BARRAS</h1>',
    `<div class="subtitle">Orden de Pedido Nº ${codigoPedido} — Sucursal ${sucursal}</div>`,
    '</div>',
    '<div class="no-print">',
    '<button class="btn-print" onclick="window.print()">📄 Imprimir / Guardar como PDF</button>',
    '</div>',
    '</div>',
    '<div class="meta-box">',
    `<div class="meta-item"><strong>Sucursal Destino:</strong> ${sucursal}</div>`,
    `<div class="meta-item"><strong>Fecha Emisión:</strong> ${fechaStr}</div>`,
    `<div class="meta-item"><strong>Total Ítems Enviados:</strong> ${itemsEnviadosFilter.length}</div>`,
    '</div>',
    `<div class="grid">${itemsHtml}</div>`,
    '<' + 'script>',
    'window.onload = () => { setTimeout(() => { window.print(); }, 300); };',
    '<' + '/script>',
    '</body>',
    '</html>'
  ].join('\n')

  win.document.write(fullContent)
  win.document.close()
}

const printPedido = (pedido) => {
  activePrintPedido.value = pedido
  setTimeout(() => {
    window.print()
  }, 100)
}

// Auxiliares
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

const formatDateDayMonth = (dateStr) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}`
  }
  return dateStr
}

const getEstadoTextStyle = (estado) => {
  if (estado === 'Pendiente') return { color: '#d97706', fontWeight: 'bold' }
  if (estado === 'Preparando' || estado === 'Procesando' || estado === 'Armando') return { color: '#2563eb', fontWeight: 'bold' }
  if (estado === 'Listo') return { color: '#0284c7', fontWeight: 'bold' }
  if (estado === 'Enviado') return { color: '#16a34a', fontWeight: 'bold' }
  if (estado === 'Completado') return { color: '#15803d', fontWeight: 'bold' }
  return { color: 'var(--text-secondary)', fontWeight: 'bold' }
}

const getPedidoPorcentajeCompleto = (p) => {
  if (!p) return 0
  if (p.estado === 'Enviado' || p.estado === 'Completado') return 100
  if (!p.items || p.items.length === 0) return 0

  let totalReq = 0
  let totalEnv = 0

  p.items.forEach(item => {
    const pzasReq = parseFloat(item.pieza || 0)
    const fracReq = parseFloat(item.fraccion || 0)
    const pzasEnv = parseFloat(item.cantidad_enviada || 0)
    const fracEnv = parseFloat(item.fraccion_enviada || 0)
    const pesoEnv = parseFloat(item.peso_enviado || 0)

    const pesoPieza = parseFloat(item.Producto?.peso_pieza || 0)
    const pesoFrac = parseFloat(item.Producto?.peso_fraccion || 0)

    let req = 0
    if (pesoPieza > 0 || pesoFrac > 0) {
      req = (pzasReq * (pesoPieza > 0 ? pesoPieza : 1)) + (fracReq * (pesoFrac > 0 ? pesoFrac : 1))
    } else {
      req = pzasReq + fracReq
    }

    if (req <= 0) req = 1

    let env = 0
    if (pesoEnv > 0) {
      env = pesoEnv
    } else if (pzasEnv > 0 || fracEnv > 0) {
      if (pesoPieza > 0 || pesoFrac > 0) {
        env = (pzasEnv * (pesoPieza > 0 ? pesoPieza : 1)) + (fracEnv * (pesoFrac > 0 ? pesoFrac : 1))
      } else {
        env = pzasEnv + fracEnv
      }
    } else if (item.no_envia || item.sin_stock) {
      env = req
    }

    totalReq += req
    totalEnv += Math.min(env, req)
  })

  if (totalReq <= 0) return 0
  const pct = Math.round((totalEnv / totalReq) * 100)
  return Math.min(100, Math.max(0, pct))
}

// Buscador predictivo reactivo
const filteredAndSortedPedidos = computed(() => {
  let result = [...pedidos.value]

  // Si el rol es Sucursal, forzar que solo vea sus propios pedidos
  const userRole = authStore.user?.rol?.toLowerCase() || ''
  if (userRole === 'sucursal' && authStore.user?.usuario) {
    const sucursalName = authStore.user.usuario.toLowerCase()
    result = result.filter(p => p.sucursal && p.sucursal.toLowerCase() === sucursalName)
  }

  // Filtrar por estado o vinculación si no es Todos
  if (statusFilter.value && statusFilter.value !== 'Todos') {
    if (statusFilter.value === 'Vinculados') {
      result = result.filter(p => !!p.wms_orden_egreso)
    } else if (statusFilter.value === 'NoVinculados') {
      result = result.filter(p => !p.wms_orden_egreso)
    } else {
      result = result.filter(p => p.estado === statusFilter.value)
    }
  }

  // Búsqueda interactiva (busca en código de pedido, sucursal, orden de egreso block, remito o productos)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => {
      const codeMatch = p.codigo ? p.codigo.toLowerCase().includes(query) : false
      const sucursalMatch = p.sucursal ? p.sucursal.toLowerCase().includes(query) : false
      const statusMatch = p.estado ? p.estado.toLowerCase().includes(query) : false
      const wmsMatch = p.wms_orden_egreso ? String(p.wms_orden_egreso).toLowerCase().includes(query) : false
      const docMatch = p.wms_documento ? String(p.wms_documento).toLowerCase().includes(query) : false
      const itemMatch = p.items ? p.items.some(item => 
        item.codigo_producto.toLowerCase().includes(query) || 
        (item.Producto?.nombre && item.Producto.nombre.toLowerCase().includes(query))
      ) : false

      return codeMatch || sucursalMatch || statusMatch || wmsMatch || docMatch || itemMatch
    })
  }

  // Ordenación interactiva
  if (sortKey.value) {
    result.sort((a, b) => {
      if (sortKey.value === 'porcentaje') {
        const pctA = getPedidoPorcentajeCompleto(a)
        const pctB = getPedidoPorcentajeCompleto(b)
        return (pctA - pctB) * sortOrder.value
      }

      let valA = a[sortKey.value]
      let valB = b[sortKey.value]

      if (valA === undefined || valA === null) valA = ''
      if (valB === undefined || valB === null) valB = ''

      const isNumeric = !isNaN(parseFloat(valA)) && isFinite(valA) && !isNaN(parseFloat(valB)) && isFinite(valB)

      if (isNumeric) {
        return (parseFloat(valA) - parseFloat(valB)) * sortOrder.value
      } else {
        return valA.toString().localeCompare(valB.toString(), undefined, { numeric: true }) * sortOrder.value
      }
    })
  }

  return result
})

const itemsEnviados = computed(() => {
  if (!selectedPedido.value) return []
  return (selectedPedido.value.items || []).filter(item => {
    const pzas = parseInt(item.cantidad_enviada, 10) || 0
    const frac = parseFloat(item.fraccion_enviada) || 0
    const peso = parseFloat(item.peso_enviado) || 0
    return pzas > 0 || frac > 0 || peso > 0
  })
})

const itemsNoEnviados = computed(() => {
  if (!selectedPedido.value) return []
  return (selectedPedido.value.items || []).filter(item => {
    const pzas = parseInt(item.cantidad_enviada, 10) || 0
    const frac = parseFloat(item.fraccion_enviada) || 0
    const peso = parseFloat(item.peso_enviado) || 0
    return pzas === 0 && frac === 0 && peso === 0
  })
})

// Productos con demanda total mayor al stock CD (en todos los pedidos activos excepto enviados y completados, solo con peso asignado)
const productosConDeficit = computed(() => {
  const map = {}

  pedidos.value.forEach(p => {
    // Consideramos todos los pedidos activos (excluyendo Enviado y Completado)
    if (!['Enviado', 'Completado'].includes(p.estado) && Array.isArray(p.items)) {
      p.items.forEach(item => {
        const code = item.codigo_producto
        if (!code) return

        const pesoEnviado = parseFloat(item.peso_enviado || 0)

        // Si no se asignó peso (peso_enviado <= 0), omitir
        if (pesoEnviado <= 0) return

        if (!map[code]) {
          map[code] = {
            codigo: code,
            nombre: item.Producto?.nombre || 'Sin nombre',
            totalAEnviar: 0,
            stockCD: getStockCD(item)
          }
        }
        map[code].totalAEnviar += pesoEnviado
      })
    }
  })

  return Object.values(map)
    .filter(p => p.totalAEnviar > p.stockCD)
    .sort((a, b) => (b.totalAEnviar - b.stockCD) - (a.totalAEnviar - a.stockCD))
})

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

// Cargar catálogo de productos
const fetchCatalogProducts = async () => {
  try {
    const res = await fetch('/api/productos')
    if (res.ok) {
      catalogProducts.value = await res.json()
      
    }
  } catch (error) {
    console.error('Error fetching catalog products:', error)
  }
}

// Obtener stock actual de un producto para mostrar en la tabla
const getStockActual = (codigo) => {
  const prod = catalogProducts.value.find(p => p.codigo === codigo)
  if (prod) {
    return parseFloat(prod.stock || 0).toFixed(3)
  }
  return '-'
}

// Métodos para la Creación de Pedidos
const openCreateModal = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  
  createForm.value = {
    codigo: `PED-${year}${month}${day}-${hours}${minutes}`,
    sucursal: '',
    fecha: `${year}-${month}-${day}`,
    estado: 'Pendiente',
    items: []
  }
  
  selectedCreateProductCode.value = ''
  createProductSearchInput.value = ''
  selectedCreateProduct.value = null
  newCreateProductPiece.value = 0
  newCreateProductFraccion.value = 0
  
  showCreateModal.value = true
  
  if (catalogProducts.value.length === 0) {
    fetchCatalogProducts()
  }
}

const removeCreateItem = (idx) => {
  createForm.value.items.splice(idx, 1)
}

const addCreateItem = () => {
  if (!selectedCreateProductCode.value) {
    showAlert('Por favor, selecciona un producto para agregar', 'error')
    return
  }

  const existingItemIndex = createForm.value.items.findIndex(
    item => item.codigo_producto === selectedCreateProductCode.value
  )

  if (existingItemIndex !== -1) {
    createForm.value.items[existingItemIndex].pieza += newCreateProductPiece.value || 0
    createForm.value.items[existingItemIndex].fraccion += newCreateProductFraccion.value || 0
  } else {
    const prodInfo = catalogProducts.value.find(p => p.codigo === selectedCreateProductCode.value)
    createForm.value.items.push({
      codigo_producto: selectedCreateProductCode.value,
      pieza: newCreateProductPiece.value || 0,
      fraccion: newCreateProductFraccion.value || 0,
      Producto: {
        nombre: prodInfo ? prodInfo.nombre : 'Producto Agregado'
      }
    })
  }

  // Reiniciar
  selectedCreateProductCode.value = ''
  createProductSearchInput.value = ''
  selectedCreateProduct.value = null
  newCreateProductPiece.value = 0
  newCreateProductFraccion.value = 0
}

const savingCreate = ref(false)

const saveCreatePedido = async () => {
  if (!createForm.value.codigo) {
    showAlert('El código del pedido es obligatorio.', 'error')
    return
  }

  savingCreate.value = true
  try {
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigo: createForm.value.codigo,
        sucursal: createForm.value.sucursal,
        fecha: createForm.value.fecha || new Date(),
        estado: createForm.value.estado || 'Pendiente',
        items: createForm.value.items.map(item => ({
          codigo_producto: item.codigo_producto,
          pieza: item.pieza || 0,
          fraccion: item.fraccion || 0,
          peso_enviado: 0,
          cantidad_enviada: 0,
          fraccion_enviada: 0
        }))
      })
    })

    const data = await res.json()
    if (res.ok) {
      showAlert('Pedido registrado exitosamente')
      showCreateModal.value = false
      fetchPedidos()
    } else {
      showAlert(data.error || 'Error al crear el pedido', 'error')
    }
  } catch (error) {
    console.error('Error saving create:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    savingCreate.value = false
  }
}

// Abrir modal de edición
const openEditModal = (pedido) => {
  editingPedido.value = pedido
  
  // Clonación profunda de los items para no mutar el estado principal
  const clonedItems = (pedido.items || []).map(item => ({
    id: item.id,
    id_pedido: item.id_pedido,
    codigo_producto: item.codigo_producto,
    pieza: item.pieza || 0,
    fraccion: item.fraccion || 0,
    peso_enviado: item.peso_enviado || 0,
    cantidad_enviada: item.cantidad_enviada || 0,
    fraccion_enviada: item.fraccion_enviada || 0,
    Producto: item.Producto ? { ...item.Producto } : null
  }))

  editForm.value = {
    id: pedido.id,
    codigo: pedido.codigo,
    sucursal: pedido.sucursal || '',
    fecha: pedido.fecha ? pedido.fecha.split('T')[0] : '',
    estado: pedido.estado || 'Pendiente',
    items: clonedItems
  }

  selectedProductCode.value = ''
  editProductSearchInput.value = ''
  selectedEditProduct.value = null
  newProductPiece.value = 0
  newProductFraccion.value = 0

  isEditingMode.value = true
  
  if (catalogProducts.value.length === 0) {
    fetchCatalogProducts()
  }
}

// Quitar un item de la edición
const removeEditItem = (idx) => {
  editForm.value.items.splice(idx, 1)
}

// Agregar un item en la edición
const addEditItem = () => {
  if (!selectedProductCode.value) {
    showAlert('Por favor, selecciona un producto para agregar', 'error')
    return
  }

  // Verificar si ya existe en la lista de items del editForm
  const existingItemIndex = editForm.value.items.findIndex(
    item => item.codigo_producto === selectedProductCode.value
  )

  if (existingItemIndex !== -1) {
    editForm.value.items[existingItemIndex].pieza += newProductPiece.value || 0
    editForm.value.items[existingItemIndex].fraccion += newProductFraccion.value || 0
  } else {
    const prodInfo = catalogProducts.value.find(p => p.codigo === selectedProductCode.value)
    editForm.value.items.push({
      codigo_producto: selectedProductCode.value,
      pieza: newProductPiece.value || 0,
      fraccion: newProductFraccion.value || 0,
      peso_enviado: 0,
      cantidad_enviada: 0,
      fraccion_enviada: 0,
      Producto: {
        nombre: prodInfo ? prodInfo.nombre : 'Producto Agregado'
      }
    })
  }

  // Reiniciar campos
  selectedProductCode.value = ''
  editProductSearchInput.value = ''
  selectedEditProduct.value = null
  newProductPiece.value = 0
  newProductFraccion.value = 0
}

const savingEdit = ref(false)

// Guardar cambios del pedido editado
const saveEditPedido = async () => {
  savingEdit.value = true
  try {
    const res = await fetch(`/api/pedidos/${editForm.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigo: editForm.value.codigo,
        sucursal: editForm.value.sucursal,
        fecha: editForm.value.fecha || new Date(),
        estado: editForm.value.estado,
        items: editForm.value.items.map(item => ({
          codigo_producto: item.codigo_producto,
          pieza: item.pieza || 0,
          fraccion: item.fraccion || 0,
          peso_enviado: item.peso_enviado || 0,
          cantidad_enviada: item.cantidad_enviada || 0,
          fraccion_enviada: item.fraccion_enviada || 0
        }))
      })
    })

    const data = await res.json()
    if (res.ok) {
      showAlert('Pedido actualizado correctamente')
      isEditingMode.value = false
      fetchPedidos()
    } else {
      showAlert(data.error || 'Error al actualizar el pedido', 'error')
    }
  } catch (error) {
    console.error('Error saving edit:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    savingEdit.value = false
  }
}

// Confirmación para eliminar pedido
const confirmDeletePedido = (pedido) => {
  pedidoToDelete.value = pedido
}

// Eliminar pedido de forma permanente
const deletePedido = async () => {
  if (!pedidoToDelete.value) return
  
  try {
    const res = await fetch(`/api/pedidos/${pedidoToDelete.value.id}`, {
      method: 'DELETE'
    })
    
    const data = await res.json()
    if (res.ok) {
      showAlert('Pedido y productos asociados eliminados correctamente')
      showDetailModal.value = false
      selectedPedido.value = null
      fetchPedidos()
    } else {
      showAlert(data.error || 'Error al eliminar el pedido', 'error')
    }
  } catch (error) {
    console.error('Error deleting order:', error)
    showAlert('Error de conexión al eliminar', 'error')
  } finally {
    pedidoToDelete.value = null
  }
}

// Confirmar envío: descontar stock
const showConfirmEnvioModal = ref(false)

const openConfirmEnvioModal = () => {
  if (!selectedPedido.value) return
  editForm.value = {
    id: selectedPedido.value.id,
    codigo: selectedPedido.value.codigo,
    sucursal: selectedPedido.value.sucursal || '',
    fecha: selectedPedido.value.fecha || '',
    estado: selectedPedido.value.estado || 'Pendiente',
    items: (selectedPedido.value.items || []).map(item => ({
      id: item.id,
      id_pedido: item.id_pedido,
      codigo_producto: item.codigo_producto,
      pieza: item.pieza || 0,
      fraccion: item.fraccion || 0,
      peso_enviado: item.peso_enviado || 0,
      cantidad_enviada: item.cantidad_enviada || 0,
      fraccion_enviada: item.fraccion_enviada || 0,
      Producto: item.Producto ? { ...item.Producto } : null
    }))
  }
  showConfirmEnvioModal.value = true
}

const confirmingPedido = ref(false)
const confirmError = ref('')

// Items que tienen peso_enviado > 0
const itemsConPeso = computed(() => {
  return editForm.value.items.filter(item => parseFloat(item.peso_enviado) > 0)
})

// Items que quedarán con stock negativo en CD al enviar
const itemsConStockNegativo = computed(() => {
  return itemsConPeso.value.filter(item => {
    const pesoEnv = parseFloat(item.peso_enviado || 0)
    const stockCD = getStockCD(item)
    return pesoEnv > 0 && (stockCD - pesoEnv < 0 || stockCD <= 0)
  })
})

const confirmarPedido = async () => {
  confirmingPedido.value = true
  confirmError.value = ''

  try {
    const itemsPayload = itemsConPeso.value.map(item => ({
      codigo: item.codigo_producto,
      peso: parseFloat(item.peso_enviado)
    }))

    const res = await fetch(`/api/pedidos/${editForm.value.id}/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: itemsPayload })
    })

    const data = await res.json()

    if (res.ok) {
      showConfirmEnvioModal.value = false
      editForm.value.estado = 'Enviado'
      showAlert('Pedido confirmado y stock descontado exitosamente')
      isEditingMode.value = false
      fetchPedidos()
    } else {
      // Mostrar detalle de productos sin stock si viene
      if (data.productos_sin_stock && data.productos_sin_stock.length > 0) {
        const detalles = data.productos_sin_stock.map(p => 
          `${p.codigo} (${p.nombre}): stock ${p.stock_actual} kg, solicitado ${p.peso_solicitado} kg`
        ).join(' | ')
        confirmError.value = `${data.error} ${detalles}`
      } else {
        confirmError.value = data.error || 'Error al confirmar el pedido'
      }
    }
  } catch (error) {
    console.error('Error confirming order:', error)
    confirmError.value = 'Error de conexión con el servidor'
  } finally {
    confirmingPedido.value = false
  }
}

const markingEnviado = ref(false)

const marcarComoEnviado = async (pedido) => {
  if (!await winConfirm('¿Estás seguro de marcar este pedido como Enviado?', 'Confirmar Envío')) return
  
  markingEnviado.value = true
  try {
    const res = await fetch(`/api/pedidos/${pedido.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigo: pedido.codigo,
        sucursal: pedido.sucursal,
        fecha: pedido.fecha,
        estado: 'Enviado',
        items: (pedido.items || []).map(item => ({
          codigo_producto: item.codigo_producto,
          pieza: item.pieza || 0,
          fraccion: item.fraccion || 0,
          peso_enviado: item.peso_enviado || 0,
          cantidad_enviada: item.cantidad_enviada || 0,
          fraccion_enviada: item.fraccion_enviada || 0
        }))
      })
    })

    if (res.ok) {
      showAlert('El pedido ha sido marcado como Enviado.')
      if (selectedPedido.value && selectedPedido.value.id === pedido.id) {
        selectedPedido.value.estado = 'Enviado'
      }
      fetchPedidos()
    } else {
      showAlert('Error al actualizar el estado del pedido.', 'error')
    }
  } catch (error) {
    console.error('Error updating status:', error)
    showAlert('Error de conexión con el servidor.', 'error')
  } finally {
    markingEnviado.value = false
  }
}

// Funciones para el Control de Ítems
const openControlModal = (pedido) => {
  console.log('openControlModal clicked for order:', pedido)
  if (!pedido) {
    console.warn('openControlModal: no order provided')
    return
  }
  
  // Filtrar items: sólo los que tienen peso_enviado > 0 o fraccion_enviada > 0
  controlItems.value = (pedido.items || []).filter(item => {
    return parseFloat(item.peso_enviado || 0) > 0 || parseFloat(item.fraccion_enviada || 0) > 0
  })
  console.log('Filtered controlItems:', controlItems.value)

  if (controlItems.value.length === 0) {
    console.warn('openControlModal: no items with weight/fraction > 0')
    showAlert('El pedido no tiene ningún ítem con peso enviado o fracción registrada.', 'error')
    return
  }

  currentControlIndex.value = 0
  showControlModal.value = true
  
  window.addEventListener('keydown', handleControlKeyDown)
  focusNextButton()
}

const closeControlModal = () => {
  showControlModal.value = false
  window.removeEventListener('keydown', handleControlKeyDown)
}

const nextControlItem = () => {
  if (currentControlIndex.value < controlItems.value.length) {
    currentControlIndex.value++
    focusNextButton()
  }
}

const prevControlItem = () => {
  if (currentControlIndex.value > 0) {
    currentControlIndex.value--
    focusNextButton()
  }
}

const focusNextButton = () => {
  nextTick(() => {
    if (btnNextControl.value) {
      btnNextControl.value.focus()
    } else if (btnFinishControl.value) {
      btnFinishControl.value.focus()
    }
  })
}

const handleControlKeyDown = (e) => {
  if (!showControlModal.value) return
  
  // Esc para cerrar
  if (e.key === 'Escape') {
    closeControlModal()
    return
  }

  // Enter o Barra espaciadora para avanzar
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    if (currentControlIndex.value < controlItems.value.length) {
      nextControlItem()
    } else {
      closeControlModal()
    }
  }
}

onMounted(() => {
  fetchPedidos()
  fetchCatalogProducts()
})
</script>

<style scoped>
.pedidos-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  align-items: start;
}

@media (min-width: 992px) {
  .pedidos-grid {
    grid-template-columns: 4fr 8fr;
  }
}

.form-column {
  position: sticky;
  top: 0.5rem;
}

.list-column {
  min-height: 350px;
}

/* Dropzone de Carga de Archivos */
.file-dropzone {
  border: 2px dashed var(--bevel-dark);
  background: var(--bg-window);
  box-shadow: var(--inset-shadow);
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.file-dropzone:hover {
  background-color: var(--bg-secondary);
  border-color: var(--accent-primary-hover);
}

.bg-active-row {
  background-color: var(--bg-secondary) !important;
}

/* Cabeceras de tabla interactivas */
th.sortable {
  cursor: pointer;
  user-select: none;
}

th.sortable:hover {
  background-color: var(--accent-primary-hover);
}

th i {
  margin-left: 0.25rem;
  font-size: 0.8rem;
  vertical-align: middle;
}

.sub-table th {
  background-color: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
  font-weight: bold;
  border-bottom: 1px solid var(--bevel-dark);
  border-top: none;
}

.sub-table td {

}

.sub-table tr:hover {
  background-color: var(--bg-secondary) !important;
}

.text-xs {
  font-size: 0.75rem;
}

.text-blue {
  color: var(--accent-primary) !important;
}

.text-orange {
  color: var(--accent-orange) !important;
}

.text-green {
  color: var(--accent-success) !important;
}

/* Tabla compacta sin espacio desperdiciado */
.compact-items-table th,
.compact-items-table td {
  padding: 0.25rem 0.35rem !important;
  font-size: 0.78rem !important;
}

/* ============================================== */
/* ESTILOS EXCLUSIVOS PARA IMPRESIÓN (PDF/REMITO) */
/* ============================================== */
@media print {
  /* Reset document scrolling wrappers for multi-page prints */
  html, body, #app {
    height: auto !important;
    overflow: visible !important;
    position: static !important;
    background: white !important;
    color: black !important;
  }

  /* Ocultar elementos de interfaz en pantalla */
  .no-print,
  .page-container,
  .modal-overlay,
  .win-dialog-overlay,
  aside,
  header,
  div[class^="alert-"],
  button {
    display: none !important;
  }
  
  /* Habilitar contenedor de impresión */
  .print-only-container {
    display: block !important;
    visibility: visible !important;
    position: static !important;
    width: 100% !important;
    height: auto !important;
    background: white !important;
    color: black !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .print-table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin-top: 1rem !important;
  }

  .print-table th,
  .print-table td {
    border: 1px solid #000000 !important;
    padding: 3px 5px !important;
    font-size: 8.5pt !important;
    line-height: 1.15 !important;
    color: black !important;
  }

  .print-table th {
    background-color: #f2f2f2 !important;
    color: black !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-weight: bold !important;
  }
}
</style>
