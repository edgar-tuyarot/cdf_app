<template>
  <div class="page-container animate-fade">
    <!-- Encabezado de la Vista -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Gestión de Pedidos</h2>
        <p class="page-description">Carga masiva de planillas de pedidos y consulta detallada del historial de órdenes.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem;">
        <button class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.25rem;" @click="showUploadModal = true">
          <i class="ph ph-file-xls"></i> Carga Masiva (Excel)
        </button>
        <button class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.25rem;" @click="fetchPedidos" :disabled="loading">
          <i class="ph ph-spinner spinner" v-if="loading"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Lista
        </button>
      </div>
    </div>

    <!-- Mensajes de Alerta -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- ============================================== -->
    <!-- HISTORIAL DE PEDIDOS                           -->
    <!-- ============================================== -->
    <div class="card list-column">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span class="card-title">Historial de Pedidos ({{ filteredAndSortedPedidos.length }})</span>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button class="btn btn-secondary" style="height: 26px; font-size: 0.8rem; display: flex; align-items: center; gap: 0.25rem; padding: 0 0.5rem;" @click="openCreateModal">
              <i class="ph ph-plus-circle"></i> Nuevo Pedido
            </button>
            <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
              <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Buscar por código, sucursal..." 
                style="border: none; outline: none; font-size: 0.85rem; background: transparent; width: 180px; color: var(--text-primary);"
              />
              <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
                <i class="ph ph-x-circle"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="table-container" style="max-height: 600px; overflow-y: auto;">
          <table v-if="!loading && filteredAndSortedPedidos.length > 0">
            <thead>
              <tr>
                <th style="width: 40px;" class="text-center">Items</th>
                <th @click="sortBy('codigo')" class="sortable">Código / ID <i v-if="sortKey === 'codigo'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('fecha')" class="sortable">Fecha <i v-if="sortKey === 'fecha'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('sucursal')" class="sortable">Sucursal <i v-if="sortKey === 'sucursal'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('estado')" class="sortable">Estado <i v-if="sortKey === 'estado'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th class="text-center" style="width: 100px;">Productos</th>
                <th class="text-center" style="width: 100px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <!-- Iteración de Pedidos -->
              <template v-for="p in filteredAndSortedPedidos" :key="p.id">
                <tr :class="{'bg-active-row': expandedPedidos[p.id]}">
                  <td class="text-center">
                    <button 
                      class="icon-btn" 
                      style="min-height: auto; padding: 0.25rem; font-size: 0.9rem;"
                      @click="togglePedidoExpand(p.id)"
                    >
                      <i :class="['ph', expandedPedidos[p.id] ? 'ph-caret-down' : 'ph-caret-right']"></i>
                    </button>
                  </td>
                  <td><strong>{{ p.codigo }}</strong></td>
                  <td>{{ formatDate(p.fecha) }}</td>
                  <td>{{ p.sucursal || '-' }}</td>
                  <td>
                    <span :class="['badge', getEstadoBadgeClass(p.estado)]">
                      {{ p.estado }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="badge badge-secondary fw-bold" style="font-size: 0.75rem;">
                      {{ p.items ? p.items.length : 0 }} items
                    </span>
                  </td>
                  <td class="text-center">
                    <div style="display: flex; gap: 0.25rem; justify-content: center;">
                      <button class="icon-btn" title="Editar" @click="openEditModal(p)">
                        <i class="ph ph-pencil-simple text-blue"></i>
                      </button>
                      <button class="icon-btn" title="Eliminar" @click="confirmDeletePedido(p)">
                        <i class="ph ph-trash text-red"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Detalle Desplegable (Accordion) del Pedido -->
                <tr v-if="expandedPedidos[p.id]" class="detail-row">
                  <td colspan="7" style="padding: 0.5rem 1rem; background-color: var(--bg-secondary);">
                    <div class="card" style="box-shadow: var(--inset-shadow); border: 1px solid var(--bevel-dark); background: var(--bg-window);">
                      <div class="card-header" style="background-color: var(--bevel-dark); padding: 0.25rem 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.75rem; font-weight: bold; color: white;">Productos de la Orden [{{ p.codigo }}]</span>
                        <button 
                          type="button" 
                          class="btn btn-secondary no-print" 
                          style="height: 20px; padding: 0 0.4rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem; background: var(--bg-secondary); color: var(--text-primary); border-color: var(--bevel-light);"
                          @click="printPedido(p)"
                        >
                          <i class="ph ph-printer"></i> Imprimir PDF / Remito
                        </button>
                      </div>
                      
                      <!-- Listado de Productos del Pedido -->
                      <table class="sub-table" style="width: 100%; border: none;">
                        <thead>
                          <tr style="background-color: var(--bg-secondary);">
                            <th style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">Cód. Producto</th>
                            <th style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">Descripción del Producto</th>
                            <th style="font-size: 0.7rem; padding: 0.25rem 0.5rem;" class="text-right">Pzs Pedidas</th>
                            <th style="font-size: 0.7rem; padding: 0.25rem 0.5rem;" class="text-right">Frac Pedida</th>
                            <th style="font-size: 0.7rem; padding: 0.25rem 0.5rem;" class="text-right text-green">Pzs Enviadas</th>
                            <th style="font-size: 0.7rem; padding: 0.25rem 0.5rem;" class="text-right text-green">Frac Enviada</th>
                            <th style="font-size: 0.7rem; padding: 0.25rem 0.5rem;" class="text-right text-green">Peso Enviado</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="item in p.items" :key="item.id" style="border-bottom: 1px solid var(--bg-secondary);">
                            <td style="font-size: 0.7rem; padding: 0.3rem 0.5rem;">
                              <strong>{{ item.codigo_producto }}</strong>
                            </td>
                            <td style="font-size: 0.7rem; padding: 0.3rem 0.5rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="item.Producto?.nombre">
                              <span v-if="item.Producto?.nombre?.includes('AUTOCREADO')" class="text-orange" title="El producto fue auto-creado porque no existía en el catálogo inicial">
                                <i class="ph ph-warning-circle"></i> {{ item.Producto?.nombre }}
                              </span>
                              <span v-else>{{ item.Producto?.nombre || 'Sin nombre cargado' }}</span>
                            </td>
                            <td style="font-size: 0.7rem; padding: 0.3rem 0.5rem;" class="text-right fw-bold text-muted">
                              {{ item.pieza }}
                            </td>
                            <td style="font-size: 0.7rem; padding: 0.3rem 0.5rem;" class="text-right fw-bold text-blue">
                              {{ parseFloat(item.fraccion).toFixed(3) }}
                            </td>
                            <td style="font-size: 0.7rem; padding: 0.3rem 0.5rem;" class="text-right fw-bold text-green">
                              {{ item.cantidad_enviada || 0 }}
                            </td>
                            <td style="font-size: 0.7rem; padding: 0.3rem 0.5rem;" class="text-right fw-bold text-green">
                              {{ parseFloat(item.fraccion_enviada || 0).toFixed(3) }}
                            </td>
                            <td style="font-size: 0.7rem; padding: 0.3rem 0.5rem;" class="text-right fw-bold text-green">
                              {{ parseFloat(item.peso_enviado || 0).toFixed(3) }} kg
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>

          <!-- Cargando -->
          <div v-if="loading" class="loading-state">
            <i class="ph ph-spinner spinner icon-xl"></i>
            Cargando registros de pedidos...
          </div>

          <!-- Historial Vacío -->
          <div v-if="!loading && filteredAndSortedPedidos.length === 0" class="empty-state">
            <i class="ph ph-file-xls icon-xl"></i>
            No se encontraron pedidos registrados. ¡Usa la Carga Masiva arriba o crea uno nuevo!
          </div>
        </div>
      </div>

  </div>

  <!-- Modal de Edición de Pedido -->
  <Teleport to="body">
    <div v-if="showEditModal" class="modal-overlay" @mousedown.self="showEditModal = false">
      <div class="modal-card" style="max-width: 1100px; width: 95%;">
        <div class="modal-header">
          <h3 class="modal-title">Editar Pedido: {{ editForm.codigo }}</h3>
          <button class="icon-btn" @click="showEditModal = false"><i class="ph ph-x"></i></button>
        </div>
        
        <form @submit.prevent="saveEditPedido">
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto; padding-right: 0.5rem;">
            
            <!-- Metadatos de la Orden -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; border-bottom: 2px solid var(--bevel-light); padding-bottom: 1rem;">
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
                <select v-model="editForm.estado" class="form-control" required style="height: 30px;">
                  <option value="Pendiente">Pendiente</option>
                  <option value="Procesando">Procesando</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
            </div>

            <!-- Listado dinámico de Ítems -->
            <div class="card mb-3" style="box-shadow: var(--inset-shadow); background: var(--bg-secondary); border: 1px solid var(--bevel-dark);">
              <div class="card-header" style="background-color: var(--bevel-dark); padding: 0.3rem 0.5rem;">
                <span style="font-size: 0.8rem; font-weight: bold; color: white;">Productos en este Pedido ({{ editForm.items.length }})</span>
              </div>
              
              <div style="padding: 0.5rem; max-height: 220px; overflow-y: auto;">
                <table class="sub-table" style="width: 100%; border: none;">
                  <thead>
                    <tr style="background-color: var(--bg-window);">
                      <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem;">Cód. Producto</th>
                      <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem;">Descripción</th>
                      <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem; width: 65px;" class="text-right">Pzs Pedidas</th>
                      <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem; width: 75px;" class="text-right">Frac Pedida</th>
                      <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem; width: 65px; color: var(--accent-success);" class="text-right">Pzs Envia.</th>
                      <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem; width: 75px; color: var(--accent-success);" class="text-right">Frac Envia.</th>
                      <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem; width: 75px; color: var(--accent-success);" class="text-right">Peso Env.(kg)</th>
                      <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem; width: 40px;" class="text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in editForm.items" :key="idx" style="border-bottom: 1px solid var(--bevel-light);">
                      <td style="font-size: 0.75rem; padding: 0.3rem 0.4rem;">
                        <strong>{{ item.codigo_producto }}</strong>
                      </td>
                      <td style="font-size: 0.75rem; padding: 0.3rem 0.4rem; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="item.Producto?.nombre">
                        {{ item.Producto?.nombre || 'Sin nombre cargado' }}
                      </td>
                      <td style="font-size: 0.75rem; padding: 0.2rem 0.3rem;" class="text-right">
                        <input 
                          type="number" 
                          v-model.number="item.pieza" 
                          min="0"
                          class="form-control" 
                          style="text-align: right; height: 24px; padding: 0 0.3rem; font-size: 0.75rem;" 
                        />
                      </td>
                      <td style="font-size: 0.75rem; padding: 0.2rem 0.3rem;" class="text-right">
                        <input 
                          type="number" 
                          step="0.001" 
                          v-model.number="item.fraccion" 
                          min="0"
                          class="form-control" 
                          style="text-align: right; height: 24px; padding: 0 0.3rem; font-size: 0.75rem;" 
                        />
                      </td>
                      <td style="font-size: 0.75rem; padding: 0.2rem 0.3rem;" class="text-right">
                        <input 
                          type="number" 
                          v-model.number="item.cantidad_enviada" 
                          min="0"
                          class="form-control" 
                          style="text-align: right; height: 24px; padding: 0 0.3rem; font-size: 0.75rem; border-color: var(--accent-success);" 
                        />
                      </td>
                      <td style="font-size: 0.75rem; padding: 0.2rem 0.3rem;" class="text-right">
                        <input 
                          type="number" 
                          step="0.001" 
                          v-model.number="item.fraccion_enviada" 
                          min="0"
                          class="form-control" 
                          style="text-align: right; height: 24px; padding: 0 0.3rem; font-size: 0.75rem; border-color: var(--accent-success);" 
                        />
                      </td>
                      <td style="font-size: 0.75rem; padding: 0.2rem 0.3rem;" class="text-right">
                        <input 
                          type="number" 
                          step="0.001" 
                          v-model.number="item.peso_enviado" 
                          min="0"
                          class="form-control" 
                          style="text-align: right; height: 24px; padding: 0 0.3rem; font-size: 0.75rem; border-color: var(--accent-success);" 
                        />
                      </td>
                      <td style="font-size: 0.75rem; padding: 0.2rem 0.3rem;" class="text-center">
                        <button type="button" class="icon-btn text-red" style="padding: 0.1rem 0.3rem;" @click="removeEditItem(idx)">
                          <i class="ph ph-trash"></i>
                        </button>
                      </td>
                    </tr>
                    
                    <tr v-if="editForm.items.length === 0">
                      <td colspan="5" class="text-center text-muted" style="padding: 1rem; font-size: 0.75rem;">
                        No hay productos en esta orden. Añade un producto usando el formulario de abajo.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Formulario de Agregar Nuevo Ítem -->
            <div class="card" style="border: 1px solid var(--bevel-light); padding: 0.5rem; background: var(--bg-window);">
              <div style="font-size: 0.75rem; font-weight: bold; margin-bottom: 0.4rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.25rem;">
                <i class="ph ph-plus-circle"></i> Agregar Producto a la Orden
              </div>
              
              <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.5rem; align-items: end;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-size: 0.7rem; margin-bottom: 0.15rem;">Producto *</label>
                  <input 
                    list="catalog-products-list-edit"
                    v-model="selectedProductCode"
                    class="form-control" 
                    placeholder="Escribe código o nombre..."
                    style="font-size: 0.75rem; height: 26px; padding: 0 0.25rem;"
                  />
                  <datalist id="catalog-products-list-edit">
                    <option v-for="prod in catalogProducts" :key="prod.codigo" :value="prod.codigo">
                      {{ prod.nombre }}
                    </option>
                  </datalist>
                </div>
                
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-size: 0.7rem; margin-bottom: 0.15rem;">Piezas</label>
                  <input 
                    type="number" 
                    v-model.number="newProductPiece" 
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
                    v-model.number="newProductFraccion" 
                    min="0"
                    class="form-control" 
                    style="font-size: 0.75rem; height: 26px; padding: 0 0.25rem;" 
                  />
                </div>
                
                <button type="button" class="btn btn-secondary" style="height: 26px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; padding: 0 0.5rem;" @click="addEditItem">
                  <i class="ph ph-plus"></i> Añadir
                </button>
              </div>
            </div>

          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false">
              <i class="ph ph-x"></i> Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="savingEdit">
              <i class="ph ph-spinner spinner" v-if="savingEdit"></i>
              <i class="ph ph-floppy-disk" v-else></i> 
              {{ savingEdit ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
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
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto; padding-right: 0.5rem;">
            
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
                <span style="font-size: 0.8rem; font-weight: bold; color: white;">Productos en este Pedido ({{ createForm.items.length }})</span>
              </div>
              
              <div style="padding: 0.5rem; max-height: 220px; overflow-y: auto;">
                <table class="sub-table" style="width: 100%; border: none;">
                  <thead>
                    <tr style="background-color: var(--bg-window);">
                      <th style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cód. Producto</th>
                      <th style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Descripción</th>
                      <th style="font-size: 0.75rem; padding: 0.25rem 0.5rem; width: 80px;" class="text-right">Piezas</th>
                      <th style="font-size: 0.75rem; padding: 0.25rem 0.5rem; width: 110px;" class="text-right">Fracción</th>
                      <th style="font-size: 0.75rem; padding: 0.25rem 0.5rem; width: 50px;" class="text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in createForm.items" :key="idx" style="border-bottom: 1px solid var(--bevel-light);">
                      <td style="font-size: 0.75rem; padding: 0.3rem 0.5rem;">
                        <strong>{{ item.codigo_producto }}</strong>
                      </td>
                      <td style="font-size: 0.75rem; padding: 0.3rem 0.5rem; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="item.Producto?.nombre">
                        {{ item.Producto?.nombre || 'Sin nombre' }}
                      </td>
                      <td style="font-size: 0.75rem; padding: 0.2rem 0.5rem;" class="text-right">
                        <input 
                          type="number" 
                          v-model.number="item.pieza" 
                          min="0"
                          class="form-control" 
                          style="text-align: right; height: 24px; padding: 0 0.3rem; font-size: 0.75rem;" 
                        />
                      </td>
                      <td style="font-size: 0.75rem; padding: 0.2rem 0.5rem;" class="text-right">
                        <input 
                          type="number" 
                          step="0.001" 
                          v-model.number="item.fraccion" 
                          min="0"
                          class="form-control" 
                          style="text-align: right; height: 24px; padding: 0 0.3rem; font-size: 0.75rem;" 
                        />
                      </td>
                      <td style="font-size: 0.75rem; padding: 0.2rem 0.5rem;" class="text-center">
                        <button type="button" class="icon-btn text-red" style="padding: 0.1rem 0.3rem;" @click="removeCreateItem(idx)">
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
            <div class="card" style="border: 1px solid var(--bevel-light); padding: 0.5rem; background: var(--bg-window);">
              <div style="font-size: 0.75rem; font-weight: bold; margin-bottom: 0.4rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.25rem;">
                <i class="ph ph-plus-circle"></i> Agregar Producto a la Orden
              </div>
              
              <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.5rem; align-items: end;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-size: 0.7rem; margin-bottom: 0.15rem;">Producto *</label>
                  <input 
                    list="catalog-products-list-create"
                    v-model="selectedCreateProductCode"
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
          
          <div class="modal-footer">
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

  <!-- Modal de Importación Excel (Carga Masiva) -->
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

          <!-- Input File Personalizado Retro -->
          <div class="file-dropzone" @click="triggerFileInput" style="margin-bottom: 0.5rem;">
            <input 
              type="file" 
              ref="fileInput" 
              @change="onFileSelected" 
              accept=".xlsx, .xls" 
              style="display: none;" 
            />
            <i class="ph ph-file-xls text-blue" style="font-size: 2.5rem; margin-bottom: 0.5rem;"></i>
            <span class="fw-bold" style="font-size: 0.85rem; color: var(--text-primary);">
              {{ selectedFile ? selectedFile.name : 'Haz clic para seleccionar archivo' }}
            </span>
            <span class="text-xs text-muted mt-1" v-if="!selectedFile">
              Soporta planillas .xlsx y .xls
            </span>
            <span class="text-xs text-green fw-bold mt-1" v-else>
              {{ (selectedFile.size / 1024).toFixed(1) }} KB - Listo para subir
            </span>
          </div>

          <!-- Historial de Resultados de la Carga -->
          <div v-if="uploadResult" class="card" style="box-shadow: var(--inset-shadow); background: var(--bg-secondary); border-color: var(--bevel-dark); margin-top: 0.5rem;">
            <div class="card-header" style="background-color: var(--bevel-dark); padding: 0.2rem 0.5rem; display: flex; justify-content: space-between;">
              <span style="font-size: 0.75rem; font-weight: bold; color: white;">Resultado de Importación</span>
              <button @click="uploadResult = null" style="background: none; border: none; color: white; cursor: pointer; font-size: 0.7rem;"><i class="ph ph-x"></i></button>
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
        
        <div class="modal-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
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
          <th style="border: 1px solid #000; text-align: left; width: 15%;">Cód. Producto</th>
          <th style="border: 1px solid #000; text-align: left; width: 45%;">Descripción del Producto</th>
          <th style="border: 1px solid #000; text-align: right; width: 12%;">Pieza(s)</th>
          <th style="border: 1px solid #000; text-align: right; width: 13%;">Fracción (Unidades)</th>
          <th style="border: 1px solid #000; text-align: center; width: 15%;">Peso enviado</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in activePrintPedido.items" :key="item.id" style="border-bottom: 1px solid #000;">
          <td style="border: 1px solid #000;">
            <strong>{{ item.codigo_producto }}</strong>
          </td>
          <td style="border: 1px solid #000;">
            {{ item.Producto?.nombre || 'Producto sin nombre cargado' }}
          </td>
          <td style="border: 1px solid #000; text-align: right; font-weight: bold;">
            {{ item.cantidad_enviada !== undefined && item.cantidad_enviada !== 0 ? item.cantidad_enviada : (item.pieza || 0) }}
          </td>
          <td style="border: 1px solid #000; text-align: right; font-weight: bold;">
            {{ parseFloat(item.fraccion_enviada !== undefined && parseFloat(item.fraccion_enviada) !== 0 ? item.fraccion_enviada : (item.fraccion || 0)).toFixed(3) }}
          </td>
          <td style="border: 1px solid #000; text-align: right; font-weight: bold;">
            {{ item.peso_enviado !== undefined && parseFloat(item.peso_enviado) !== 0 ? parseFloat(item.peso_enviado).toFixed(3) + ' kg' : '' }}
          </td>
        </tr>
        <tr v-if="!activePrintPedido.items || activePrintPedido.items.length === 0">
          <td colspan="5" style="border: 1px solid #000; padding: 12px; text-align: center; font-size: 0.8rem; color: #555;">
            No hay productos registrados en este pedido.
          </td>
        </tr>
      </tbody>
    </table>
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Estados reactivos
const pedidos = ref([])
const loading = ref(false)
const uploading = ref(false)
const selectedFile = ref(null)
const uploadResult = ref(null)
const showUploadModal = ref(false)
const expandedPedidos = ref({})
const alert = ref({ show: false, message: '', type: 'success' })

const fileInput = ref(null)

// Estados reactivos para la Edición de Pedidos
const catalogProducts = ref([])
const showEditModal = ref(false)
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
    const res = await fetch('/api/pedidos')
    if (res.ok) {
      pedidos.value = await res.json()
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

const getEstadoBadgeClass = (estado) => {
  if (estado === 'Pendiente') return 'badge-warning'
  if (estado === 'Completado') return 'badge-success'
  if (estado === 'Procesando') return 'badge-primary'
  return 'badge-secondary'
}

// Buscador predictivo reactivo
const filteredAndSortedPedidos = computed(() => {
  let result = [...pedidos.value]

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
  newProductPiece.value = 0
  newProductFraccion.value = 0

  showEditModal.value = true
  
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
      showEditModal.value = false
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

onMounted(() => {
  fetchPedidos()
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

/* Estilo Subtabla de Items en Acordeón */
.sub-table th {
  background-color: var(--bg-secondary) !important;
  color: var(--text-secondary);
  font-weight: bold;
  border-bottom: 1px solid var(--bevel-dark);
  border-top: none;
}

.sub-table td {
  border: none;
  background: transparent !important;
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
