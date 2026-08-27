<template>
  <div class="page-container animate-fade">
    
    <!-- VISTA 1: LISTADO PRINCIPAL DE PEDIDOS (Cuando NO hay un pedido seleccionado) -->
    <div v-if="!selectedPedido">
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
                style="height: 28px; font-size: 0.78rem; padding: 0 0.4rem; width: 130px; background: var(--bg-window); color: var(--text-primary); border: none;"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Preparando">En Preparación</option>
                <option value="Listo">Listos para Enviar</option>
                <option value="Enviado">Enviados</option>
                <option value="Completado">Completados</option>
              </select>

              <!-- Buscador Predictivo -->
              <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.15rem 0.4rem; border-radius: 0; height: 28px; width: 180px;">
                <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  placeholder="Buscar sucursal..." 
                  style="border: none; outline: none; font-size: 0.78rem; background: transparent; width: 100%; color: var(--text-primary);"
                />
                <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
                  <i class="ph ph-x-circle"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Tabla de Historial: Fecha | Destino | % Completo | Estado -->
          <div class="table-container" style="max-height: calc(100vh - 250px); overflow-y: auto;">
            <table class="access-table" style="width: 100%; font-size: 0.82rem;">
              <thead>
                <tr>
                  <th @click="sortBy('fecha')" class="sortable">Fecha <i v-if="sortKey === 'fecha'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                  <th @click="sortBy('sucursal')" class="sortable">Destino <i v-if="sortKey === 'sucursal'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                  <th @click="sortBy('porcentaje')" class="sortable text-center">% Completo <i v-if="sortKey === 'porcentaje'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                  <th @click="sortBy('estado')" class="sortable text-center">Estado <i v-if="sortKey === 'estado'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
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
                </tr>

                <!-- Estado de Carga -->
                <tr v-if="loading">
                  <td colspan="4" class="text-center p-4">
                    <i class="ph ph-spinner spinner icon-xl"></i><br>
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">Cargando listado de pedidos...</span>
                  </td>
                </tr>

                <!-- Lista Vacía -->
                <tr v-if="!loading && filteredAndSortedPedidos.length === 0">
                  <td colspan="4" class="text-center p-4 text-muted">
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
              Pedidos Pendientes
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
    <div v-else class="animate-fade">
      <!-- Encabezado de la vista con Botón de Regreso -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button class="btn btn-secondary" @click="volverALaLista" style="display: flex; align-items: center; gap: 0.4rem; font-weight: bold; font-size: 0.85rem; padding: 0.4rem 0.8rem; background: var(--bg-window);">
            <i class="ph ph-arrow-left" style="font-size: 1.1rem; color: var(--accent-primary);"></i> Volver a Pedidos
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.25rem; font-weight: bold; color: var(--text-primary); display: flex; align-items: center; gap: 0.6rem;">
              Pedido: {{ selectedPedido.codigo }}
              <span :style="getEstadoTextStyle(selectedPedido.estado)" style="font-size: 1rem;">({{ selectedPedido.estado }})</span>
            </h2>
          </div>
        </div>

        <!-- Acciones Destacadas Superior -->
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
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
          <!-- Tarjeta de Resumen / Metadatos -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; background: var(--bg-secondary); padding: 1rem; border-radius: 0; border: 1px solid var(--bevel-light);">
            <div>
              <span class="text-xs text-muted" style="display: block; font-weight: bold; text-transform: uppercase;">Sucursal Destino</span>
              <span style="font-size: 1.1rem; font-weight: bold; color: var(--text-primary);">
                {{ selectedPedido.sucursal || '-' }}
                <span v-if="loadingSucursalStock" style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal; margin-left: 0.4rem;">
                  <i class="ph ph-spinner spinner"></i> Consultando stock...
                </span>
              </span>
            </div>
            <div>
              <span class="text-xs text-muted" style="display: block; font-weight: bold; text-transform: uppercase;">Fecha Emisión</span>
              <span style="font-size: 1.1rem; font-weight: bold; color: var(--text-primary);">{{ formatDate(selectedPedido.fecha) }}</span>
            </div>
            <div>
              <span class="text-xs text-muted" style="display: block; font-weight: bold; text-transform: uppercase;">Total Productos</span>
              <span style="font-size: 1.1rem; font-weight: bold; color: var(--accent-primary);">{{ selectedPedido.items ? selectedPedido.items.length : 0 }} Ítems</span>
            </div>
            <div>
              <span class="text-xs text-muted" style="display: block; font-weight: bold; text-transform: uppercase;">Estado Actual</span>
              <span :style="getEstadoTextStyle(selectedPedido.estado)" style="font-size: 1.05rem;">{{ selectedPedido.estado }}</span>
            </div>
          </div>

          <!-- Ítems Enviados -->
          <div>
            <h3 style="font-size: 0.95rem; font-weight: bold; margin-bottom: 0.6rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
              <i class="ph ph-check-circle text-green" style="font-size: 1.2rem;"></i> Ítems Enviados ({{ itemsEnviados.length }})
            </h3>
            <div class="table-container">
              <table class="access-table" style="width: 100%; font-size: 0.85rem;">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th class="text-right">Pzas Pedidas</th>
                    <th class="text-right">Frac Pedida</th>
                    <th class="text-right">Pzas Enviadas</th>
                    <th class="text-right">Frac Enviada</th>
                    <th class="text-right">Peso Enviado</th>
                    <th class="text-right" style="color: var(--accent-orange);">Stock CD</th>
                    <th class="text-right" style="color: var(--accent-primary);">Stock Sucursal</th>
                    <th class="text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in itemsEnviados" :key="item.id">
                    <td><strong>{{ item.codigo_producto }}</strong></td>
                    <td>{{ item.Producto?.nombre || 'Sin nombre' }}</td>
                    <td class="text-right">{{ item.pieza || 0 }}</td>
                    <td class="text-right">{{ parseFloat(item.fraccion || 0).toFixed(3) }}</td>
                    <td class="text-right fw-bold text-green">{{ item.cantidad_enviada || 0 }}</td>
                    <td class="text-right fw-bold text-green">{{ parseFloat(item.fraccion_enviada || 0).toFixed(3) }}</td>
                    <td class="text-right fw-bold text-green">{{ item.peso_enviado ? parseFloat(item.peso_enviado).toFixed(3) + ' kg' : '-' }}</td>
                    <td class="text-right font-mono fw-bold">
                      <span :style="{ color: getStockCD(item) <= 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }">
                        {{ formatStockVal(getStockCD(item)) }}
                      </span>
                    </td>
                    <td class="text-right font-mono fw-bold">
                      <span v-if="loadingSucursalStock" class="text-muted" style="font-size: 0.75rem;"><i class="ph ph-spinner spinner"></i></span>
                      <span v-else :style="{ color: getStockColor(sucursalStockMap[item.codigo_producto]) }">
                        {{ formatStockVal(sucursalStockMap[item.codigo_producto]) }}
                      </span>
                    </td>
                    <td class="text-center">
                      <span class="badge badge-success" style="font-size: 0.7rem; padding: 2px 6px;">Enviado</span>
                    </td>
                  </tr>
                  <tr v-if="itemsEnviados.length === 0">
                    <td colspan="10" class="text-center text-muted" style="padding: 1.5rem;">
                      Ningún producto enviado en este pedido.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Ítems No Enviados -->
          <div v-if="itemsNoEnviados.length > 0">
            <h3 style="font-size: 0.95rem; font-weight: bold; margin-bottom: 0.6rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
              <i class="ph ph-minus-circle text-muted" style="font-size: 1.2rem;"></i> Ítems No Enviados ({{ itemsNoEnviados.length }})
            </h3>
            <div class="table-container">
              <table class="access-table" style="width: 100%; font-size: 0.85rem;">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th class="text-right">Pzas Pedidas</th>
                    <th class="text-right">Frac Pedida</th>
                    <th class="text-right" style="color: var(--accent-orange);">Stock CD</th>
                    <th class="text-right" style="color: var(--accent-primary);">Stock Sucursal</th>
                    <th class="text-center">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in itemsNoEnviados" :key="item.id" style="opacity: 0.85;">
                    <td><strong>{{ item.codigo_producto }}</strong></td>
                    <td>{{ item.Producto?.nombre || 'Sin nombre' }}</td>
                    <td class="text-right">{{ item.pieza || 0 }}</td>
                    <td class="text-right">{{ parseFloat(item.fraccion || 0).toFixed(3) }}</td>
                    <td class="text-right font-mono fw-bold">
                      <span :style="{ color: getStockCD(item) <= 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }">
                        {{ formatStockVal(getStockCD(item)) }}
                      </span>
                    </td>
                    <td class="text-right font-mono fw-bold">
                      <span v-if="loadingSucursalStock" class="text-muted" style="font-size: 0.75rem;"><i class="ph ph-spinner spinner"></i></span>
                      <span v-else :style="{ color: getStockColor(sucursalStockMap[item.codigo_producto]) }">
                        {{ formatStockVal(sucursalStockMap[item.codigo_producto]) }}
                      </span>
                    </td>
                    <td class="text-center">
                      <span v-if="item.no_envia" class="badge badge-secondary" style="font-size: 0.7rem; padding: 2px 6px;">No Envía</span>
                      <span v-else class="badge badge-danger" style="font-size: 0.7rem; padding: 2px 6px;">Sin Stock</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- MODO EDICIÓN EN PÁGINA COMPLETA -->
        <div v-else>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--bevel-light);">
            <h3 style="margin: 0; font-size: 1.1rem; font-weight: bold; color: var(--accent-primary);">
              Modificando Pedido: {{ editForm.codigo }}
            </h3>
            <button class="btn btn-secondary btn-sm" @click="isEditingMode = false">Cancelar Edición</button>
          </div>

          <form @submit.prevent="saveEditPedido">
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              
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

              <!-- Tabla de Ítems a Editar -->
              <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--bevel-dark); padding: 0.75rem;">
                <div style="font-size: 0.85rem; font-weight: bold; margin-bottom: 0.5rem; color: var(--text-primary);">
                  Productos en el Pedido ({{ editForm.items.length }})
                </div>
                <div class="table-container" style="max-height: 350px; overflow-y: auto;">
                  <table class="access-table" style="width: 100%; font-size: 0.8rem;">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th class="text-right" style="width: 75px;">Ped. Pzs</th>
                        <th class="text-right" style="width: 80px;">Ped. Frac</th>
                        <th class="text-right" style="width: 85px; color: var(--accent-orange);">Stock CD</th>
                        <th class="text-right" style="width: 85px; color: var(--accent-primary);">Stock Suc.</th>
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
                        <td class="text-right font-mono fw-bold">
                          <span v-if="loadingSucursalStock" class="text-muted" style="font-size: 0.75rem;"><i class="ph ph-spinner spinner"></i></span>
                          <span v-else :style="{ color: getStockColor(sucursalStockMap[item.codigo_producto]) }">
                            {{ formatStockVal(sucursalStockMap[item.codigo_producto]) }}
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

              <!-- Formulario Agregar Producto -->
              <div class="card" style="border: 1px solid var(--bevel-light); padding: 0.75rem; background: var(--bg-secondary);">
                <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 0.4rem; color: var(--text-secondary);">
                  <i class="ph ph-plus-circle"></i> Agregar Producto al Pedido
                </div>
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.5rem; align-items: end;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <input 
                      type="text"
                      list="catalog-products-list-edit"
                      v-model="editProductSearchInput"
                      @input="handleEditProductInput"
                      class="form-control" 
                      placeholder="Buscar producto..."
                      style="font-size: 0.8rem; height: 30px;"
                    />
                    <datalist id="catalog-products-list-edit">
                      <option v-for="prod in catalogProducts" :key="prod.codigo" :value="prod.codigo">{{ prod.nombre }}</option>
                    </datalist>
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <input type="number" v-model.number="newProductPiece" placeholder="Pzs" min="0" class="form-control" style="font-size: 0.8rem; height: 30px; text-align: right;" />
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <input type="number" step="0.001" v-model.number="newProductFraccion" placeholder="Kg Frac" min="0" class="form-control" style="font-size: 0.8rem; height: 30px; text-align: right;" />
                  </div>
                  <button type="button" class="btn btn-secondary" style="height: 30px; padding: 0 0.75rem;" @click="addEditItem">Añadir</button>
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
            <span class="win-dialog-titlebar-text">Control de Ítems Enviados</span>
            <button class="win-dialog-close" @click="closeControlModal"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body" style="padding: 1.25rem;">
            <!-- Barra de Progreso y Porcentaje -->
            <div style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: bold; margin-bottom: 0.4rem; color: var(--text-primary);">
                <span>Avance del Control</span>
                <span>{{ controlProgressPercentage }}% ({{ controlCheckedCount }} de {{ controlItems.length }})</span>
              </div>
              <div style="width: 100%; height: 16px; background: var(--bg-secondary); border: 2px solid var(--bevel-dark); padding: 1px; box-shadow: var(--inset-shadow); box-sizing: border-box; position: relative;">
                <div :style="{ width: controlProgressPercentage + '%' }" style="height: 100%; background: #1a7f37; transition: width 0.2s ease;"></div>
              </div>
            </div>

            <!-- Card del Ítem Actual -->
            <div v-if="currentControlItem" class="card" style="padding: 1.25rem; border: 2px solid var(--bevel-dark); background: var(--bg-window); min-height: 140px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h4 style="margin: 0 0 1rem 0; font-size: 0.95rem; font-weight: bold; color: var(--text-secondary); line-height: 1.3;">
                  {{ currentControlItem.Producto?.nombre || 'Sin nombre' }}
                </h4>

                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 2px solid var(--bevel-dark); padding: 0.75rem 1rem; border-radius: 0; box-shadow: var(--inset-shadow); margin-bottom: 0.75rem;">
                  <div>
                    <span style="font-size: 0.75rem; color: var(--text-muted); display: block; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Código</span>
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

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--bevel-light); padding-top: 0.5rem; font-size: 0.8rem;">
                <span style="color: var(--text-secondary); font-weight: bold;">Cantidades:</span>
                <span style="font-weight: bold; color: var(--text-primary);">
                  {{ currentControlItem.cantidad_enviada || 0 }} pzas / {{ parseFloat(currentControlItem.fraccion_enviada || 0).toFixed(3) }} frac
                </span>
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
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useWinDialog } from '../composables/useWinDialog'

const authStore = useAuthStore()
const { winConfirm } = useWinDialog()

// Estados reactivos
const pedidos = ref([])
const selectedPedido = ref(null)
const showDetailModal = ref(false)
const statusFilter = ref('Todos')

// Consulta de Stock por Ubicación / Sucursal Destino (Usando el ID de BBDD MariaDB de Sucursal)
const sucursalStockMap = ref({})
const loadingSucursalStock = ref(false)
const listSucursales = ref([])

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

    // 2. Obtener EXCLUSIVAMENTE el id de BBDD MariaDB de la sucursal (sucursal.id)
    let mariadbSucursalId = null

    if (pedido.id_sucursal) {
      mariadbSucursalId = pedido.id_sucursal
    } else if (pedido.sucursal_id) {
      mariadbSucursalId = pedido.sucursal_id
    }

    if (!mariadbSucursalId && pedido.sucursal) {
      const sucursalStr = String(pedido.sucursal).trim().toLowerCase()
      const foundSuc = listSucursales.value.find(s => 
        String(s.id) === sucursalStr || 
        String(s.sucursal || '').trim().toLowerCase() === sucursalStr ||
        String(s.numero) === sucursalStr
      )
      if (foundSuc) {
        mariadbSucursalId = foundSuc.id // ID de BBDD MariaDB (Primary Key: sucursal.id)
      }
    }

    if (!mariadbSucursalId && !isNaN(parseInt(pedido.sucursal, 10))) {
      mariadbSucursalId = parseInt(pedido.sucursal, 10)
    }

    // Fallback a ID 1 si no se determina la sucursal
    if (!mariadbSucursalId) mariadbSucursalId = 1

    console.log(`[Pedidos] Consultando stock con el ID de BBDD MariaDB sucursal.id = ${mariadbSucursalId} para el pedido ${pedido.codigo}`)

    // 3. Consultar stock llamando al endpoint con el ID de MariaDB de la sucursal
    let wmsHeaders = {}
    const savedSession = localStorage.getItem('wms_session')
    if (savedSession) {
      try {
        const sess = JSON.parse(savedSession)
        if (sess.sessionId) {
          wmsHeaders = {
            'X-WMS-Session-Id': sess.sessionId,
            'X-WMS-Site-Id': sess.siteId || '194326',
            'X-WMS-Host': sess.host || 'http://192.168.10.2'
          }
        }
      } catch (e) {}
    }

    const res = await fetch(`/api/wms/stock-site/${mariadbSucursalId}`, { headers: wmsHeaders })
    if (res.ok) {
      const data = await res.json()
      if (data.ok && Array.isArray(data.productos)) {
        const map = {}
        data.productos.forEach(prod => {
          map[prod.codigo] = parseFloat(prod.stockFisico) || 0
        })
        sucursalStockMap.value = map
      }
    }
  } catch (err) {
    console.error('Error al consultar stock con ID de sucursal MariaDB:', err)
  } finally {
    loadingSucursalStock.value = false
  }
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
  fetchSucursalStockForPedido(p)
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

    const pesoPieza = parseFloat(item.Producto?.peso_x_pieza || 0)
    const pesoFrac = parseFloat(item.Producto?.kg_x_bolsita || 0)

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

  // Búsqueda interactiva (busca en código de pedido, sucursal o códigos de productos del pedido)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => {
      const codeMatch = p.codigo ? p.codigo.toLowerCase().includes(query) : false
      const sucursalMatch = p.sucursal ? p.sucursal.toLowerCase().includes(query) : false
      const statusMatch = p.estado ? p.estado.toLowerCase().includes(query) : false
      const itemMatch = p.items ? p.items.some(item => 
        item.codigo_producto.toLowerCase().includes(query) || 
        (item.Producto?.nombre && item.Producto.nombre.toLowerCase().includes(query))
      ) : false

      return codeMatch || sucursalMatch || statusMatch || itemMatch
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

// Productos con demanda total mayor al stock CD (en pedidos pendientes o en preparación)
const productosConDeficit = computed(() => {
  const map = {}

  pedidos.value.forEach(p => {
    // Consideramos pedidos en estado Pendiente, Preparando o Procesando
    if (['Pendiente', 'Preparando', 'Procesando'].includes(p.estado) && Array.isArray(p.items)) {
      p.items.forEach(item => {
        const code = item.codigo_producto
        if (!code) return

        const pesoEnviado = parseFloat(item.peso_enviado || 0)

        // Si aún no se pesó (peso_enviado == 0), se omite directamente
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
