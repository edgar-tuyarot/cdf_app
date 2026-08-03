<template>
  <div class="page-container animate-fade">
    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]" style="margin-bottom: 1rem;">
      {{ alert.message }}
    </div>

    <!-- Master-Detail Layout -->
    <div class="master-detail-container" style="display: flex; gap: 1.5rem; width: 100%; align-items: flex-start; margin-top: 1rem;">
      
      <!-- COLUMNA MASTER: Historial de Pedidos -->
      <div 
        class="card master-column" 
        :class="{ 'hidden-mobile': selectedPedido && showMobileDetail }"
        style="flex: 0 0 320px; width: 320px; display: flex; flex-direction: column; overflow: hidden;"
      >
        <div class="card-header" style="display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span class="card-title" style="margin: 0; font-weight: bold; font-size: 0.9rem;">Pedidos ({{ filteredAndSortedPedidos.length }})</span>
            <button class="btn btn-secondary" style="height: 24px; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem; padding: 0 0.4rem;" @click="openCreateModal">
              <i class="ph ph-plus-circle"></i> Nuevo
            </button>
          </div>
          <!-- Buscador -->
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.2rem 0.4rem; box-shadow: var(--inset-shadow); border-radius: 4px; border: 1px solid var(--bevel-light); width: 100%;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar por código, sucursal..." 
              style="border: none; outline: none; font-size: 0.8rem; background: transparent; width: 100%; color: var(--text-primary);"
            />
          </div>
        </div>

        <!-- Lista scrollable -->
        <div style="max-height: calc(100vh - 280px); overflow-y: auto; padding: 0.75rem; background-color: var(--bg-secondary);">
          <!-- Cargando -->
          <div v-if="loading" style="display: flex; flex-direction: column; align-items: center; padding: 2rem; gap: 0.5rem; font-size: 0.8rem; color: var(--text-secondary);">
            <i class="ph ph-spinner spinner" style="font-size: 1.5rem;"></i>
            <span>Cargando pedidos...</span>
          </div>

          <!-- Sin resultados -->
          <div v-else-if="filteredAndSortedPedidos.length === 0" style="text-align: center; padding: 2rem; font-size: 0.8rem; color: var(--text-muted);">
            No se encontraron pedidos.
          </div>

          <!-- Iteración de Pedidos -->
          <div v-else>
            <div 
              v-for="p in filteredAndSortedPedidos" 
              :key="p.id" 
              class="pedido-item card mb-2" 
              :class="{ 'selected': selectedPedido && selectedPedido.id === p.id }"
              style="padding: 0.65rem; cursor: pointer; border: 1px solid var(--bevel-light); transition: all 0.2s;"
              @click="selectPedido(p)"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                <strong style="color: var(--text-primary); font-size: 0.82rem;">{{ p.codigo }}</strong>
                <span :class="['badge', getEstadoBadgeClass(p.estado)]" style="font-size: 0.65rem; padding: 1px 4px;">
                  {{ p.estado }}
                </span>
              </div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); display: flex; justify-content: space-between; gap: 0.25rem;">
                <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 140px;">Suc: <strong>{{ p.sucursal || '-' }}</strong></span>
                <span>{{ formatDate(p.fecha) }}</span>
              </div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.25rem; display: flex; justify-content: space-between; align-items: center;">
                <span>Ítems: <strong>{{ p.items ? p.items.length : 0 }}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COLUMNA DETAIL: Detalle u Edición del Pedido Seleccionado -->
      <div 
        class="card detail-column"
        :class="{ 'hidden-mobile': !selectedPedido || !showMobileDetail }"
        style="flex: 1 1 auto; display: flex; flex-direction: column; overflow: hidden; min-height: 400px;"
      >
        <!-- Placeholder cuando no hay ningún pedido seleccionado -->
        <div v-if="!selectedPedido" style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex-grow: 1; padding: 3rem; text-align: center; color: var(--text-muted);">
          <i class="ph ph-shopping-cart" style="font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.35; color: var(--text-primary);"></i>
          <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-weight: bold;">Ningún Pedido Seleccionado</h3>
          <p style="margin: 0; font-size: 0.85rem; max-width: 320px; line-height: 1.4;">
            Selecciona un pedido del historial de la izquierda para ver su detalle e iniciar gestiones.
          </p>
        </div>

        <!-- Pedido Seleccionado -->
        <div v-else style="display: flex; flex-direction: column; height: 100%;">
          
          <!-- MODO VISTA DETALLE READ-ONLY -->
          <div v-if="!isEditingMode" style="display: flex; flex-direction: column; height: 100%;">
            <!-- Cabecera Detalle -->
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem 1rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <button 
                  class="btn btn-secondary mobile-only-btn" 
                  style="padding: 0.25rem 0.5rem; font-size: 0.78rem; display: flex; align-items: center; gap: 0.25rem;"
                  @click="showMobileDetail = false"
                >
                  <i class="ph ph-arrow-left"></i> Volver
                </button>
                <span class="card-title" style="margin: 0; font-weight: bold;">Pedido: {{ selectedPedido.codigo }}</span>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center; font-size: 0.78rem;">
                <span style="color: var(--text-secondary);">Sucursal: <strong style="color: var(--text-primary);">{{ selectedPedido.sucursal || '-' }}</strong></span>
                <span style="color: var(--bevel-dark);">|</span>
                <span style="color: var(--text-secondary);">Fecha: <strong style="color: var(--text-primary);">{{ formatDate(selectedPedido.fecha) }}</strong></span>
                <span style="color: var(--bevel-dark);">|</span>
                <span :class="['badge', getEstadoBadgeClass(selectedPedido.estado)]">{{ selectedPedido.estado }}</span>
              </div>
            </div>

            <!-- Tabla de Ítems Read-only -->
            <div class="table-container" style="max-height: calc(100vh - 280px); overflow-y: auto; flex-grow: 1; padding: 0.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
              
              <!-- Ítems Enviados -->
              <div>
                <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 0.5rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.25rem;">
                  <i class="ph ph-check-circle text-green" style="font-size: 1rem;"></i> Ítems Enviados ({{ itemsEnviados.length }})
                </div>
                <table style="width: 100%; font-size: 0.8rem;">
                  <thead>
                    <tr style="background: var(--bg-secondary);">
                      <th>Código</th>
                      <th>Producto</th>
                      <th class="text-right">Pzas Pedidas</th>
                      <th class="text-right">Frac Pedida</th>
                      <th class="text-right">Pzas Enviadas</th>
                      <th class="text-right">Frac Enviada</th>
                      <th class="text-right">Peso Enviado</th>
                      <th class="text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in itemsEnviados" :key="item.id" style="border-bottom: 1px solid var(--bevel-light);">
                      <td><strong>{{ item.codigo_producto }}</strong></td>
                      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {{ item.Producto?.nombre || 'Sin nombre' }}
                      </td>
                      <td class="text-right">{{ item.pieza || 0 }}</td>
                      <td class="text-right">{{ parseFloat(item.fraccion || 0).toFixed(3) }}</td>
                      <td class="text-right fw-bold" style="color: var(--accent-success);">{{ item.cantidad_enviada || 0 }}</td>
                      <td class="text-right fw-bold" style="color: var(--accent-success);">{{ parseFloat(item.fraccion_enviada || 0).toFixed(3) }}</td>
                      <td class="text-right fw-bold" style="color: var(--accent-success);">{{ item.peso_enviado ? parseFloat(item.peso_enviado).toFixed(3) + ' kg' : '-' }}</td>
                      <td class="text-center">
                        <span class="badge badge-success" style="font-size: 0.65rem; padding: 1px 4px;">Enviado</span>
                      </td>
                    </tr>
                    <tr v-if="itemsEnviados.length === 0">
                      <td colspan="8" class="text-center text-muted" style="padding: 1.5rem; font-size: 0.8rem;">
                        Ningún producto enviado en este pedido.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Ítems No Enviados -->
              <div v-if="itemsNoEnviados.length > 0">
                <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 0.5rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.25rem;">
                  <i class="ph ph-minus-circle text-muted" style="font-size: 1rem;"></i> Ítems No Enviados ({{ itemsNoEnviados.length }})
                </div>
                <table style="width: 100%; font-size: 0.8rem;">
                  <thead>
                    <tr style="background: var(--bg-secondary);">
                      <th>Código</th>
                      <th>Producto</th>
                      <th class="text-right">Pzas Pedidas</th>
                      <th class="text-right">Frac Pedida</th>
                      <th class="text-center">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in itemsNoEnviados" :key="item.id" style="border-bottom: 1px solid var(--bevel-light); opacity: 0.75;">
                      <td><strong>{{ item.codigo_producto }}</strong></td>
                      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary);">
                        {{ item.Producto?.nombre || 'Sin nombre' }}
                      </td>
                      <td class="text-right" style="color: var(--text-secondary);">{{ item.pieza || 0 }}</td>
                      <td class="text-right" style="color: var(--text-secondary);">{{ parseFloat(item.fraccion || 0).toFixed(3) }}</td>
                      <td class="text-center">
                        <span v-if="item.no_envia" class="badge badge-secondary" style="font-size: 0.65rem; padding: 1px 4px; background: #6e7681; color: #fff;">No Envía</span>
                        <span v-else class="badge badge-danger" style="font-size: 0.65rem; padding: 1px 4px; background: #cf222e; color: #fff;">Sin Stock</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            <!-- Footer con Acciones -->
            <div class="card-footer" style="padding: 1rem; border-top: 1px solid var(--bevel-light); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
              <div style="display: flex; gap: 0.5rem;">
                <!-- Confirmar Envío (Preparación) -->
                <button 
                  v-if="selectedPedido.estado === 'Pendiente' || selectedPedido.estado === 'Procesando'"
                  type="button" 
                  class="btn" 
                  style="background: #1a7f37; color: #fff; border: 1px solid #15692e; display: flex; align-items: center; gap: 0.3rem;"
                  @click="openConfirmEnvioModal"
                >
                  <i class="ph ph-check-circle"></i> Confirmar Preparación
                </button>

                <!-- Entregar / Enviar -->
                <button 
                  v-if="selectedPedido.estado === 'Listo'"
                  type="button" 
                  class="btn" 
                  style="background: #1a7f37; color: #fff; border: 1px solid #15692e; display: flex; align-items: center; gap: 0.3rem;"
                  @click="marcarComoEnviado(selectedPedido)"
                  :disabled="markingEnviado"
                >
                  <i class="ph ph-spinner spinner" v-if="markingEnviado"></i>
                  <i class="ph ph-truck" v-else></i>
                  {{ markingEnviado ? 'Actualizando...' : 'Entregar / Enviar' }}
                </button>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 0.25rem;" @click="openControlModal(selectedPedido)">
                  <i class="ph ph-check-square"></i> Control
                </button>
                <button class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 0.25rem;" @click="printPedido(selectedPedido)">
                  <i class="ph ph-printer"></i> Imprimir Remito
                </button>
                <button class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 0.25rem;" @click="openEditModal(selectedPedido)">
                  <i class="ph ph-pencil-simple"></i> Editar Pedido
                </button>
                <button class="btn btn-secondary btn-sm text-red" style="display: flex; align-items: center; gap: 0.25rem;" @click="confirmDeletePedido(selectedPedido)">
                  <i class="ph ph-trash"></i> Eliminar
                </button>
              </div>
            </div>
          </div>

          <!-- MODO VISTA EDICIÓN ACTIVE -->
          <div v-else style="display: flex; flex-direction: column; height: 100%;">
            <!-- Cabecera Edición -->
            <div class="card-header" style="background-color: var(--bevel-dark); padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span class="card-title" style="margin: 0; font-weight: bold;">Editando Pedido: {{ editForm.codigo }}</span>
              <button class="btn btn-secondary btn-sm" @click="isEditingMode = false">Cancelar</button>
            </div>

            <!-- Formulario de Edición -->
            <form @submit.prevent="saveEditPedido" style="display: flex; flex-direction: column; flex-grow: 1; overflow: hidden;">
              <div style="padding: 1rem; overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; gap: 1rem;">
                
                <!-- Datos básicos -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; border-bottom: 2px solid var(--bevel-light); padding-bottom: 0.75rem;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.75rem;">Código de Pedido</label>
                    <input type="text" v-model="editForm.codigo" class="form-control" required style="height: 28px; font-size: 0.8rem; color: var(--text-primary);" />
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.75rem;">Sucursal</label>
                    <input type="text" v-model="editForm.sucursal" class="form-control" style="height: 28px; font-size: 0.8rem; color: var(--text-primary);" />
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.75rem;">Fecha</label>
                    <input type="date" v-model="editForm.fecha" class="form-control" required style="height: 28px; font-size: 0.8rem; color: var(--text-primary);" />
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.75rem;">Estado</label>
                    <select v-model="editForm.estado" class="form-control" required style="height: 28px; font-size: 0.8rem; color: var(--text-primary);">
                      <option value="Pendiente">Pendiente</option>
                      <option value="Procesando">Procesando</option>
                      <option value="Listo">Listo</option>
                      <option value="Completado">Completado</option>
                      <option value="Enviado">Enviado</option>
                    </select>
                  </div>
                </div>

                <!-- Tabla de ítems a editar -->
                <div class="card mb-3" style="box-shadow: var(--inset-shadow); background: var(--bg-secondary); border: 1px solid var(--bevel-dark);">
                  <div class="card-header" style="background-color: var(--bevel-dark); padding: 0.4rem 0.6rem;">
                    <span style="font-size: 0.78rem; font-weight: bold; color: var(--text-primary);">Productos en el Pedido ({{ editForm.items.length }})</span>
                  </div>
                  <div style="padding: 0.25rem; max-height: 250px; overflow-y: auto;">
                    <table class="sub-table" style="width: 100%; border: none; font-size: 0.72rem;">
                      <thead>
                        <tr style="background-color: var(--bg-window);">
                          <th style="padding: 0.3rem;">Código</th>
                          <th style="padding: 0.3rem;">Producto</th>
                          <th style="padding: 0.3rem; width: 65px;" class="text-right">Ped. Pzs</th>
                          <th style="padding: 0.3rem; width: 75px;" class="text-right">Ped. Frac</th>
                          <th style="padding: 0.3rem; width: 65px;" class="text-right">Env. Pzs</th>
                          <th style="padding: 0.3rem; width: 75px;" class="text-right">Env. Frac</th>
                          <th style="padding: 0.3rem; width: 80px;" class="text-right">Env. Kg</th>
                          <th style="padding: 0.3rem; width: 35px;" class="text-center">X</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, idx) in editForm.items" :key="idx" style="border-bottom: 1px solid var(--bevel-light);">
                          <td style="padding: 0.25rem;"><strong>{{ item.codigo_producto }}</strong></td>
                          <td style="padding: 0.25rem; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            {{ item.Producto?.nombre || 'Sin nombre' }}
                          </td>
                          <td style="padding: 0.15rem;"><input type="number" v-model.number="item.pieza" min="0" class="form-control text-right" style="height: 22px; font-size: 0.72rem; padding: 2px;" /></td>
                          <td style="padding: 0.15rem;"><input type="number" step="0.001" v-model.number="item.fraccion" min="0" class="form-control text-right" style="height: 22px; font-size: 0.72rem; padding: 2px;" /></td>
                          <td style="padding: 0.15rem;"><input type="number" v-model.number="item.cantidad_enviada" min="0" class="form-control text-right" style="height: 22px; font-size: 0.72rem; padding: 2px;" /></td>
                          <td style="padding: 0.15rem;"><input type="number" step="0.001" v-model.number="item.fraccion_enviada" min="0" class="form-control text-right" style="height: 22px; font-size: 0.72rem; padding: 2px;" /></td>
                          <td style="padding: 0.15rem;"><input type="number" step="0.001" v-model.number="item.peso_enviado" min="0" class="form-control text-right" style="height: 22px; font-size: 0.72rem; padding: 2px;" /></td>
                          <td style="padding: 0.25rem;" class="text-center">
                            <button type="button" class="icon-btn text-red" style="padding: 1px 3px;" @click="removeEditItem(idx)"><i class="ph ph-trash"></i></button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Formulario Agregar Item -->
                <div class="card" style="border: 1px solid var(--bevel-light); padding: 0.5rem; background: var(--bg-secondary);">
                  <div style="font-size: 0.72rem; font-weight: bold; margin-bottom: 0.35rem; color: var(--text-secondary);">
                    <i class="ph ph-plus-circle"></i> Agregar Producto
                  </div>
                  <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.4rem; align-items: end;">
                    <div class="form-group" style="margin-bottom: 0;">
                      <input 
                        type="text"
                        list="catalog-products-list-edit"
                        v-model="editProductSearchInput"
                        @input="handleEditProductInput"
                        class="form-control" 
                        placeholder="Buscar producto..."
                        style="font-size: 0.72rem; height: 24px; padding: 0 4px; color: var(--text-primary);"
                      />
                      <datalist id="catalog-products-list-edit">
                        <option v-for="prod in catalogProducts" :key="prod.codigo" :value="prod.codigo">{{ prod.nombre }}</option>
                      </datalist>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <input type="number" v-model.number="newProductPiece" placeholder="Pzs" min="0" class="form-control" style="font-size: 0.72rem; height: 24px; padding: 0 4px; text-align: right;" />
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <input type="number" step="0.001" v-model.number="newProductFraccion" placeholder="Kg Frac" min="0" class="form-control" style="font-size: 0.72rem; height: 24px; padding: 0 4px; text-align: right;" />
                    </div>
                    <button type="button" class="btn btn-secondary" style="height: 24px; font-size: 0.72rem; padding: 0 0.4rem;" @click="addEditItem">Añadir</button>
                  </div>
                  <div v-if="selectedEditProduct" style="font-size: 0.65rem; color: var(--text-primary); margin-top: 0.25rem;">
                    Seleccionado: <strong>{{ selectedEditProduct.nombre }}</strong>
                  </div>
                </div>

              </div>

              <!-- Footer guardar/cancelar -->
              <div class="card-footer" style="padding: 0.75rem 1rem; border-top: 1px solid var(--bevel-light); display: flex; justify-content: flex-end; gap: 0.5rem; background: var(--bg-secondary);">
                <button type="button" class="btn btn-secondary" @click="isEditingMode = false">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="savingEdit">
                  <i class="ph ph-spinner spinner" v-if="savingEdit"></i>
                  <i class="ph ph-floppy-disk" v-else></i> Guardar
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

    </div>
  </div>

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
                <span style="font-size: 0.8rem; font-weight: bold; color: var(--text-primary);">Productos en este Pedido ({{ createForm.items.length }})</span>
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
                  <!-- Vista previa del producto seleccionado -->
                  <div 
                    v-if="selectedCreateProduct" 
                    class="selected-product-badge mt-1 animate-fade"
                    style="font-size: 0.65rem; padding: 0.2rem 0.4rem; background-color: var(--accent-success-light); border: 1px solid var(--accent-success); display: flex; align-items: center; gap: 0.25rem;"
                  >
                    <i class="ph ph-circle-wavy-check text-green" style="font-size: 0.8rem;"></i>
                    <span>{{ selectedCreateProduct.nombre }}</span>
                  </div>
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
            <!-- Progress bar container -->
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

              <!-- Resaltado igual de Código y Peso -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 2px solid var(--bevel-dark); padding: 0.75rem 1rem; border-radius: 4px; box-shadow: var(--inset-shadow); margin-bottom: 0.75rem;">
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
          <!-- Peso (desde pedido_armado_items) -->
          <td style="border: 1px solid #000; text-align: right; font-weight: bold; padding: 4px;">
            {{ getPrintArmadoPeso(item.codigo_producto) }}
          </td>
          <!-- Piezas (desde pedido_armado_items) -->
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
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// Estados reactivos
const pedidos = ref([])
const selectedPedido = ref(null)
const showMobileDetail = ref(false)

const selectPedido = (p) => {
  selectedPedido.value = p
  isEditingMode.value = false
  showMobileDetail.value = true
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

const getEstadoBadgeClass = (estado) => {
  if (estado === 'Pendiente') return 'badge-warning'
  if (estado === 'Completado') return 'badge-success'
  if (estado === 'Procesando') return 'badge-primary'
  if (estado === 'Listo') return 'badge-info'
  if (estado === 'Enviado') return 'badge-success'
  return 'badge-secondary'
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
  if (!confirm('¿Estás seguro de marcar este pedido como Enviado?')) return
  
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
