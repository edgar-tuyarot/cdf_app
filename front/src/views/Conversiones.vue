<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Conversión de Fraccionados</h2>
        <p class="page-description">Administra las plantillas de conversión y procesa la división de productos fraccionados en stock.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem;">
        <button 
          v-if="selectedItems.length > 0 && activeTab === 'templates'" 
          class="btn btn-primary animate-fade" 
          style="background-color: var(--accent-success);" 
          @click="openBulkProcesarModal"
        >
          <i class="ph ph-gear"></i> Procesar Lote ({{ selectedItems.length }})
        </button>
        <button class="btn btn-secondary" @click="fetchFraccionados" :disabled="loadingFraccionados">
          <i class="ph ph-spinner spinner" v-if="loadingFraccionados"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Conversiones
        </button>
        <button class="btn btn-primary" @click="openModal()">
          <i class="ph ph-plus"></i> Nueva Conversión
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- PESTAÑAS DE VISTA (TABS) -->
    <div class="card-tabs no-print" style="display: flex; gap: 0.25rem; margin-bottom: -1px; position: relative; z-index: 2;">
      <button 
        :class="['btn', activeTab === 'templates' ? 'btn-primary' : 'btn-secondary']" 
        @click="activeTab = 'templates'"
        style="border-radius: 0; padding: 0.5rem 1rem; border-bottom: none; font-weight: bold;"
      >
        <i class="ph ph-arrows-left-right" style="margin-right: 0.3rem;"></i> Plantillas de Conversión
      </button>
      <button 
        :class="['btn', activeTab === 'logs' ? 'btn-primary' : 'btn-secondary']" 
        @click="activeTab = 'logs'"
        style="border-radius: 0; padding: 0.5rem 1rem; border-bottom: none; font-weight: bold;"
      >
        <i class="ph ph-clock-counter-clockwise" style="margin-right: 0.3rem;"></i> Log de Conversiones Realizadas
      </button>
    </div>

    <!-- HISTORIAL: LISTADO DE FRACCIONADOS EN CARDS -->
    <div class="card" v-if="activeTab === 'templates'">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; background-color: #38761d;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span class="card-title" style="color: white; font-weight: bold;">Plantillas de Conversión Activas</span>
          
          <!-- Seleccionar Lote Completo -->
          <label v-if="filteredAndSortedFraccionados.length > 0" style="color: white; font-weight: 800; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3);">
            <input 
              type="checkbox" 
              v-model="selectAll" 
              @change="toggleSelectAll" 
              style="transform: scale(1.2); cursor: pointer;"
            />
            Seleccionar Lote Completo ({{ filteredAndSortedFraccionados.length }})
          </label>
        </div>

        <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
          <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar conversión..." 
            style="border: none; outline: none; font-size: 0.85rem; background: transparent; width: 140px; color: var(--text-primary);"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
            <i class="ph ph-x-circle"></i>
          </button>
        </div>
      </div>

      <!-- CONTENEDOR DE CARDS DE CONVERSIÓN -->
      <div class="cards-container" style="max-height: 580px; overflow-y: auto; background: var(--bg-secondary); padding: 1rem;">
        
        <!-- Cargando -->
        <div v-if="loadingFraccionados" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando historial de conversiones...
        </div>

        <!-- GRID DE CARDS -->
        <div 
          v-if="!loadingFraccionados && filteredAndSortedFraccionados.length > 0" 
          style="display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 1rem;"
        >
          <div 
            v-for="f in filteredAndSortedFraccionados" 
            :key="f.id" 
            class="conversion-card" 
            :style="{ 
              borderColor: selectedItems.includes(f.id) ? '#0284c7' : 'var(--bevel-dark)',
              background: selectedItems.includes(f.id) ? 'rgba(2, 132, 199, 0.06)' : 'var(--bg-window)',
              boxShadow: selectedItems.includes(f.id) ? '0 0 0 2px #0284c7' : '0 2px 5px rgba(0,0,0,0.05)'
            }"
            style="border: 2px solid; border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.15s ease;"
          >
            <!-- Header de la Card -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid var(--bevel-light); padding-bottom: 0.5rem; margin-bottom: 0.75rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; flex: 1; min-width: 0; margin-right: 0.5rem;">
                <input 
                  type="checkbox" 
                  :value="f.id" 
                  v-model="selectedItems" 
                  @change="updateSelectAllState" 
                  style="transform: scale(1.25); cursor: pointer; flex-shrink: 0;"
                />
                <span class="badge" style="background: var(--bg-secondary); border: 1px solid var(--bevel-dark); font-weight: 900; font-size: 0.8rem; font-family: monospace; flex-shrink: 0;">
                  ID #{{ f.id }}
                </span>
                <span 
                  v-if="f.ProductoOriginal?.nombre" 
                  style="font-weight: 800; font-size: 0.82rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                  :title="f.ProductoOriginal.nombre.slice(4).trim()"
                >
                  {{ f.ProductoOriginal.nombre.slice(4).trim() }}
                </span>
              </label>

              <div style="display: flex; gap: 0.25rem;">
                <button 
                  title="Editar Plantilla"
                  @click.stop="openModal(f)"
                  style="border: none; background: transparent; cursor: pointer; padding: 4px; color: var(--accent-primary); font-size: 1.15rem;"
                >
                  <i class="ph ph-pencil-simple"></i>
                </button>
                <button 
                  title="Eliminar Plantilla"
                  @click.stop="confirmDelete(f)"
                  style="border: none; background: transparent; cursor: pointer; padding: 4px; color: var(--accent-error); font-size: 1.15rem;"
                >
                  <i class="ph ph-trash"></i>
                </button>
              </div>
            </div>

            <!-- Flujo Origen -> Destino -->
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.5rem; align-items: center; margin-bottom: 0.85rem;">
              
              <!-- Producto Origen -->
              <div style="background: var(--bg-secondary); border: 1.5px solid #fca5a5; border-radius: 6px; padding: 0.6rem;">
                <div style="font-size: 0.68rem; font-weight: 900; color: #dc2626; text-transform: uppercase; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.2rem;">
                  <i class="ph ph-minus-circle"></i> ORIGEN
                </div>
                <div style="font-weight: 900; font-size: 0.95rem; color: var(--text-primary); font-family: monospace; letter-spacing: 0.02em;">
                  {{ f.codigo_producto_original }}
                </div>
                <div style="font-size: 0.9rem; font-weight: 900; color: #dc2626; margin-top: 0.4rem;">
                  -{{ parseFloat(f.peso_a_descontar).toFixed(3) }} kg
                </div>
              </div>

              <!-- Flecha Indicadora -->
              <div style="display: flex; flex-direction: column; align-items: center; color: #0284c7; font-size: 1.3rem;">
                <i class="ph ph-arrow-right-bold"></i>
              </div>

              <!-- Producto Destino (Fraccionado) -->
              <div style="background: var(--bg-secondary); border: 1.5px solid #86efac; border-radius: 6px; padding: 0.6rem;">
                <div style="font-size: 0.68rem; font-weight: 900; color: #16a34a; text-transform: uppercase; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.2rem;">
                  <i class="ph ph-plus-circle"></i> DESTINO
                </div>
                <div style="font-weight: 900; font-size: 0.95rem; color: var(--text-primary); font-family: monospace; letter-spacing: 0.02em;">
                  {{ f.codigo_fraccionado }}
                </div>
                <div style="font-size: 0.9rem; font-weight: 900; color: #16a34a; margin-top: 0.4rem;">
                  +{{ parseFloat(f.peso_a_fraccionar).toFixed(3) }} kg
                </div>
              </div>

            </div>

            <!-- Advertencia si Peso a Convertir < Peso a Descontar -->
            <div v-if="parseFloat(f.peso_a_fraccionar) < parseFloat(f.peso_a_descontar)" style="background: #fef2f2; border: 1.5px solid #ef4444; padding: 0.4rem 0.6rem; border-radius: 6px; margin-bottom: 0.75rem; font-size: 0.76rem; color: #991b1b; display: flex; align-items: center; gap: 0.4rem;">
              <i class="ph ph-warning-circle" style="font-size: 1.1rem; flex-shrink: 0;"></i>
              <span><strong>Inválido:</strong> El peso a convertir es menor al peso a descontar.</span>
            </div>

            <!-- Botón Acción Individual -->
            <button 
              class="win-dialog-btn win-dialog-btn-ok"
              @click.stop="confirmProcesar(f)"
              :disabled="parseFloat(f.peso_a_fraccionar) < parseFloat(f.peso_a_descontar)"
              style="width: 100%; font-weight: 900; font-size: 0.82rem; padding: 6px; display: flex; align-items: center; justify-content: center; gap: 0.4rem;"
            >
              <i class="ph ph-gear"></i> Procesar Conversión ({{ parseFloat(f.peso_a_fraccionar).toFixed(3) }} kg)
            </button>
          </div>
        </div>

        <!-- Historial Vacío -->
        <div v-if="!loadingFraccionados && filteredAndSortedFraccionados.length === 0" class="empty-state">
          <i class="ph ph-arrows-left-right icon-xl"></i>
          No hay conversiones con valores a convertir.
        </div>
      </div>
    </div>


    <!-- LOG DE CONVERSIONES REALIZADAS -->
    <div class="card" v-if="activeTab === 'logs'">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background-color: #0b5394;">
        <span class="card-title" style="color: white; font-weight: bold;">Historial de Procesamientos de Conversiones</span>
        <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
          <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar comprobante..." 
            style="border: none; outline: none; font-size: 0.85rem; background: transparent; width: 140px; color: var(--text-primary);"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
            <i class="ph ph-x-circle"></i>
          </button>
        </div>
      </div>

      <div class="table-container" style="max-height: 520px; overflow-y: auto;">
        <table v-if="!loadingLogs && filteredLogs.length > 0">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Comprobante</th>
              <th>Producto Original (Origen)</th>
              <th class="text-right">Peso Descontado</th>
              <th>Producto Fraccionado (Destino)</th>
              <th class="text-right">Peso Fraccionado</th>
              <th>Operario</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in filteredLogs" :key="l.id">
              <td class="font-mono text-xs">{{ formatDateTime(l.fecha) }}</td>
              <td><strong>{{ l.comprobante }}</strong></td>
              <td>
                <span class="fw-bold">{{ l.codigo_producto_original }}</span>
                <div class="text-muted text-xs">{{ l.ProductoOriginal?.nombre || 'Desconocido' }}</div>
              </td>
              <td class="text-right fw-bold text-red">{{ parseFloat(l.peso_descontado).toFixed(3) }} kg</td>
              <td>
                <span class="fw-bold">{{ l.codigo_fraccionado }}</span>
                <div class="text-muted text-xs text-green">{{ l.ProductoFraccionado?.nombre || 'Desconocido' }}</div>
              </td>
              <td class="text-right fw-bold text-blue">{{ parseFloat(l.peso_fraccionado).toFixed(3) }} kg</td>
              <td class="text-xs">{{ l.usuario || 'Sistema' }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Cargando -->
        <div v-if="loadingLogs" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando log de conversiones realizadas...
        </div>

        <!-- Vacío -->
        <div v-if="!loadingLogs && filteredLogs.length === 0" class="empty-state">
          <i class="ph ph-clock-counter-clockwise icon-xl"></i>
          No hay procesamientos de conversiones registrados.
        </div>
      </div>
    </div>

    <!-- Modal Formulario -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @mousedown.self="closeModal">
        <div class="modal-card" style="max-width: 500px;">
          <div class="modal-header" :style="isEditingFraccionado ? 'background-color: var(--accent-orange);' : 'background-color: var(--accent-success);'">
            <h3 class="modal-title" style="color: white; font-weight: bold;">
              {{ isEditingFraccionado ? 'Editar Conversión #' + editFraccionadoId : 'Nueva Conversión (Fraccionados)' }}
            </h3>
            <button class="icon-btn" style="color: white;" @click="closeModal"><i class="ph ph-x"></i></button>
          </div>
          <form @submit.prevent="submitFraccionadoForm">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 0.75rem;">
              
              <!-- Producto Original -->
              <div class="form-group">
                <label class="form-label">Producto Original (Origen) *</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
                  <input 
                    type="text" 
                    v-model="origSearchQuery" 
                    list="catalog-products-list-orig" 
                    @input="handleOrigProductInput" 
                    class="form-control" 
                    placeholder="Escribe código o nombre para buscar..." 
                    required 
                    style="padding-left: 2rem; height: 32px;"
                  />
                </div>
                <datalist id="catalog-products-list-orig">
                  <option 
                    v-for="p in productos" 
                    :key="p.codigo" 
                    :value="p.codigo"
                  >
                    {{ p.nombre }}
                  </option>
                </datalist>
                
                <!-- Vista previa del producto seleccionado -->
                <div 
                  v-if="selectedOrigProduct" 
                  class="selected-product-badge mt-2 animate-fade"
                  style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; background-color: var(--accent-success-light); border: 1px solid var(--accent-success); font-size: 0.8rem; color: var(--text-primary);"
                >
                  <i class="ph ph-circle-wavy-check text-green" style="font-size: 1rem;"></i>
                  <span>
                    Seleccionado: <strong>{{ selectedOrigProduct.nombre }}</strong>
                  </span>
                </div>
              </div>

              <!-- Pesos y Conversión -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <div class="form-group">
                  <label class="form-label">Peso a Descontar (kg) *</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    min="0" 
                    v-model.number="fraccionadoForm.peso_a_descontar" 
                    class="form-control fw-bold text-red" 
                    required 
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Peso a Fraccionar (kg) *</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    min="0" 
                    v-model.number="fraccionadoForm.peso_a_fraccionar" 
                    class="form-control fw-bold text-blue" 
                    required 
                  />
                </div>
              </div>

              <!-- Producto Fraccionado Resultante -->
              <div class="form-group">
                <label class="form-label">Producto Fraccionado (Destino) *</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
                  <input 
                    type="text" 
                    v-model="destSearchQuery" 
                    list="catalog-products-list-dest" 
                    @input="handleDestProductInput" 
                    class="form-control" 
                    placeholder="Escribe código o nombre para buscar..." 
                    required 
                    style="padding-left: 2rem; height: 32px;"
                  />
                </div>
                <datalist id="catalog-products-list-dest">
                  <option 
                    v-for="p in productos" 
                    :key="p.codigo" 
                    :value="p.codigo"
                  >
                    {{ p.nombre }}
                  </option>
                </datalist>
                
                <!-- Vista previa del producto seleccionado -->
                <div 
                  v-if="selectedDestProduct" 
                  class="selected-product-badge mt-2 animate-fade"
                  style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; background-color: var(--accent-success-light); border: 1px solid var(--accent-success); font-size: 0.8rem; color: var(--text-primary);"
                >
                  <i class="ph ph-circle-wavy-check text-green" style="font-size: 1rem;"></i>
                  <span>
                    Seleccionado: <strong>{{ selectedDestProduct.nombre }}</strong>
                  </span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" style="background-color: var(--accent-success); border-color: var(--accent-success-hover);" :disabled="submittingFraccionado">
                <i class="ph ph-spinner spinner" v-if="submittingFraccionado"></i>
                <i class="ph ph-floppy-disk" v-else></i>
                {{ submittingFraccionado ? 'Guardando...' : (isEditingFraccionado ? 'Actualizar' : 'Convertir / Guardar') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal de Acciones de Conversión -->
    <Teleport to="body">
      <div v-if="selectedRowItem" class="win-dialog-overlay" @mousedown.self="selectedRowItem = null">
        <div class="win-dialog" style="max-width: 400px; width: 90vw;">
          <div class="win-dialog-titlebar" style="background-color: var(--accent-primary);">
            <span class="win-dialog-titlebar-text" style="color: white; font-weight: bold;">Opciones de Conversión</span>
            <button class="win-dialog-close" style="color: white;" @click="selectedRowItem = null"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; align-items: stretch;">
            <div style="margin-bottom: 0.5rem; font-size: 0.9rem; text-align: center; line-height: 1.4;">
              Conversión de <strong>{{ selectedRowItem.codigo_producto_original }}</strong><br>
              a <strong>{{ selectedRowItem.codigo_fraccionado }}</strong>
            </div>
            
            <button 
              class="btn btn-primary" 
              style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem; background-color: var(--accent-success); border-color: var(--accent-success); color: white;" 
              :disabled="parseFloat(selectedRowItem.peso_a_fraccionar) <= 0"
              @click="handleRowAction('procesar')"
            >
              <i class="ph ph-gear" style="font-size: 1.2rem;"></i>
              Procesar Conversión ({{ parseFloat(selectedRowItem.peso_a_fraccionar).toFixed(3) }} kg)
            </button>
            
            <button 
              class="btn btn-secondary" 
              style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem;" 
              @click="handleRowAction('editar')"
            >
              <i class="ph ph-pencil-simple" style="font-size: 1.2rem; color: var(--accent-primary);"></i>
              Editar Plantilla
            </button>
            
            <button 
              class="btn btn-danger" 
              style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem; background-color: var(--accent-error); border-color: var(--accent-error); color: white;" 
              @click="handleRowAction('eliminar')"
            >
              <i class="ph ph-trash" style="font-size: 1.2rem;"></i>
              Eliminar Plantilla
            </button>
          </div>
          <div class="win-dialog-footer" style="justify-content: center; padding: 0.75rem;">
            <button class="win-dialog-btn" @click="selectedRowItem = null" style="min-width: 100px;">Cancelar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Confirmación Eliminar -->
    <Teleport to="body">
      <div v-if="itemToDelete" class="win-dialog-overlay" @mousedown.self="itemToDelete = null">
        <div class="win-dialog">
          <div class="win-dialog-titlebar">
            <span class="win-dialog-titlebar-text">Confirmar Eliminación</span>
            <button class="win-dialog-close" @click="itemToDelete = null"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body">
            <i class="ph ph-warning-circle win-dialog-icon text-red"></i>
            <p class="win-dialog-msg">
              ¿Estás seguro de que deseas eliminar el registro de conversión ID #<strong>{{ itemToDelete.id }}</strong> ({{ itemToDelete.codigo_producto_original }} -> {{ itemToDelete.codigo_fraccionado }})?<br><br>Esta acción no se puede deshacer.
            </p>
          </div>
          <div class="win-dialog-footer">
            <button class="win-dialog-btn win-dialog-btn-ok" @click="deleteItem">Sí</button>
            <button class="win-dialog-btn" @click="itemToDelete = null">No</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Confirmación Procesar Conversión -->
    <Teleport to="body">
      <div v-if="itemsToProcesar.length > 0" class="win-dialog-overlay" @mousedown.self="closeProcesarModal">
        <div class="win-dialog" style="max-width: 480px;">
          <div class="win-dialog-titlebar" style="background: var(--accent-success);">
            <span class="win-dialog-titlebar-text" style="color: white;">
              {{ itemsToProcesar.length > 1 ? 'Procesar Lote de Conversiones' : 'Confirmar Procesamiento' }}
            </span>
            <button class="win-dialog-close" @click="closeProcesarModal"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body" style="display: flex; flex-direction: column; gap: 0.5rem;">
            
            <div class="alert-box success" style="border-left-width: 4px; padding: 0.4rem; font-size: 0.75rem; margin-bottom: 0.5rem;">
              <strong>Información:</strong> Esta acción sumará el stock calculado al destino y registrará la trazabilidad. No restará stock del producto origen (se asume descontado previamente al registrar el proceso).
            </div>

            <!-- Si es una sola conversión -->
            <div v-if="itemsToProcesar.length === 1" style="display: flex; gap: 0.75rem; align-items: start;">
              <i class="ph ph-gear win-dialog-icon text-green" style="font-size: 2rem;"></i>
              <p class="win-dialog-msg">
                ¿Estás seguro de que deseas procesar la conversión de <strong>{{ parseFloat(itemsToProcesar[0].peso_a_fraccionar).toFixed(3) }} kg</strong>?<br><br>
                Esto sumará los kilos al campo <strong>Kilos Calculado</strong> del producto final <strong>{{ itemsToProcesar[0].ProductoFraccionado?.nombre || itemsToProcesar[0].codigo_fraccionado }}</strong> y restablecerá los pesos a 0 en esta plantilla.
              </p>
            </div>

            <!-- Si es un lote de conversiones -->
            <div v-else>
              <label class="form-label" style="font-size: 0.75rem; font-weight: bold; margin-bottom: 0.25rem; display: block;">
                Lote de conversiones a procesar ({{ itemsToProcesar.length }})
              </label>
              <div style="max-height: 160px; overflow-y: auto; border: 1px solid var(--bevel-dark); border-radius: 0; margin-bottom: 0.75rem; background: var(--bg-window); box-shadow: var(--inset-shadow);">
                <table style="width: 100%; font-size: 0.75rem; border-collapse: collapse;">
                  <thead>
                    <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--bevel-dark); position: sticky; top: 0; z-index: 1;">
                      <th style="padding: 4px; text-align: left;">ID</th>
                      <th style="padding: 4px; text-align: left;">Origen</th>
                      <th style="padding: 4px; text-align: left;">Destino</th>
                      <th style="padding: 4px; text-align: right;">A Descontar</th>
                      <th style="padding: 4px; text-align: right;">A Fraccionar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in itemsToProcesar" :key="item.id" style="border-bottom: 1px solid var(--bg-secondary);">
                      <td style="padding: 4px; font-weight: bold;">{{ item.id }}</td>
                      <td style="padding: 4px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {{ item.codigo_producto_original }}
                      </td>
                      <td style="padding: 4px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {{ item.codigo_fraccionado }}
                      </td>
                      <td style="padding: 4px; text-align: right; color: var(--accent-danger); font-weight: bold;">
                        {{ parseFloat(item.peso_a_descontar).toFixed(3) }} kg
                      </td>
                      <td style="padding: 4px; text-align: right; color: var(--accent-success); font-weight: bold;">
                        {{ parseFloat(item.peso_a_fraccionar).toFixed(3) }} kg
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.7rem;">Total Descontar (Lote)</label>
                  <input type="text" :value="`${totalKilosADescontar.toFixed(3)} kg`" class="form-control fw-bold text-red" disabled style="height: 28px; font-size: 0.85rem;" />
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.7rem;">Total Fraccionar (Lote)</label>
                  <input type="text" :value="`${totalKilosAFraccionar.toFixed(3)} kg`" class="form-control fw-bold text-green" disabled style="height: 28px; font-size: 0.85rem;" />
                </div>
              </div>
            </div>
            
            <div class="form-group mt-2">
              <label class="form-label font-bold">Número de Comprobante *</label>
              <input 
                type="text" 
                v-model="comprobanteProcesar" 
                placeholder="Ej: 0001-0004562" 
                class="form-control" 
                required 
                style="height: 36px;"
              />
            </div>
          </div>
          <div class="win-dialog-footer">
            <button 
              class="win-dialog-btn win-dialog-btn-ok" 
              style="background-color: var(--accent-success); color: white;" 
              @click="handleProcesar" 
              :disabled="processingFrac || !comprobanteProcesar.trim()"
            >
              <i class="ph ph-spinner spinner" v-if="processingFrac"></i>
              {{ itemsToProcesar.length > 1 ? 'Sí, Procesar Lote' : 'Sí, Procesar' }}
            </button>
            <button class="win-dialog-btn" @click="closeProcesarModal" :disabled="processingFrac">No</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// Pestañas (Tabs)
const activeTab = ref('templates')

// Datos
const fraccionados = ref([])
const productos = ref([])
const conversionLogs = ref([])
const loadingFraccionados = ref(false)
const loadingLogs = ref(false)
const submittingFraccionado = ref(false)
const isEditingFraccionado = ref(false)
const editFraccionadoId = ref(null)
const itemToDelete = ref(null)
const itemsToProcesar = ref([])
const comprobanteProcesar = ref('')
const processingFrac = ref(false)
const showModal = ref(false)

const selectedRowItem = ref(null)

const handleRowAction = (action) => {
  const item = selectedRowItem.value
  selectedRowItem.value = null
  if (action === 'procesar') {
    confirmProcesar(item)
  } else if (action === 'editar') {
    openModal(item)
  } else if (action === 'eliminar') {
    confirmDelete(item)
  }
}

// Selección por Lote
const selectedItems = ref([])
const selectAll = ref(false)

const alert = ref({ show: false, message: '', type: 'success' })

const openModal = (item = null) => {
  if (item) {
    loadFraccionadoToForm(item)
  } else {
    resetFraccionadoForm()
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetFraccionadoForm()
}

// Formulario Conversiones / Fraccionados
const defaultFraccionadoForm = {
  codigo_producto_original: '',
  peso_a_fraccionar: 0,
  codigo_fraccionado: '',
  peso_a_descontar: 0
}

const fraccionadoForm = ref({ ...defaultFraccionadoForm })

// Autocomplete Preselección
const origSearchQuery = ref('')
const selectedOrigProduct = ref(null)

const destSearchQuery = ref('')
const selectedDestProduct = ref(null)

const handleOrigProductInput = () => {
  const code = origSearchQuery.value.trim()
  const found = productos.value.find(p => p.codigo === code)
  if (found) {
    selectedOrigProduct.value = found
    fraccionadoForm.value.codigo_producto_original = found.codigo
  } else {
    selectedOrigProduct.value = null
    fraccionadoForm.value.codigo_producto_original = ''
  }
}

const handleDestProductInput = () => {
  const code = destSearchQuery.value.trim()
  const found = productos.value.find(p => p.codigo === code)
  if (found) {
    selectedDestProduct.value = found
    fraccionadoForm.value.codigo_fraccionado = found.codigo
  } else {
    selectedDestProduct.value = null
    fraccionadoForm.value.codigo_fraccionado = ''
  }
}

// Búsqueda y Ordenación
const searchQuery = ref('')
const sortKey = ref('id')
const sortOrder = ref(-1) // Más reciente primero

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3500)
}

// Cargar Datos de Conversiones (Fraccionados)
const fetchFraccionados = async () => {
  loadingFraccionados.value = true
  selectedItems.value = []
  selectAll.value = false
  try {
    const resProd = await fetch('/api/productos')
    if (resProd.ok) {
      productos.value = await resProd.json()
    }
    const resFrac = await fetch('/api/fraccionados')
    if (resFrac.ok) {
      fraccionados.value = await resFrac.json()
    } else {
      showAlert('Error al cargar historial de conversiones', 'error')
    }
    await fetchLogs()
  } catch (error) {
    console.error('Error fetching fraccionados:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loadingFraccionados.value = false
  }
}

const fetchLogs = async () => {
  loadingLogs.value = true
  try {
    const res = await fetch('/api/fraccionados/logs')
    if (res.ok) {
      conversionLogs.value = await res.json()
    } else {
      console.error('Error al cargar log de conversiones')
    }
  } catch (error) {
    console.error('Error fetching logs:', error)
  } finally {
    loadingLogs.value = false
  }
}

// CRUD: CONVERTIR / FRACCIONADOS
const submitFraccionadoForm = async () => {
  if (!fraccionadoForm.value.codigo_producto_original || !fraccionadoForm.value.codigo_fraccionado) {
    showAlert('Debe completar ambos productos (Origen y Destino)', 'error')
    return
  }

  const pDescontar = parseFloat(fraccionadoForm.value.peso_a_descontar) || 0
  const pFraccionar = parseFloat(fraccionadoForm.value.peso_a_fraccionar) || 0

  if (pFraccionar < pDescontar) {
    showAlert('Validación fallida: El peso a convertir (fraccionar) no puede ser menor al peso a descontar', 'error')
    return
  }

  submittingFraccionado.value = true
  const url = isEditingFraccionado.value ? `/api/fraccionados/${editFraccionadoId.value}` : '/api/fraccionados'
  const method = isEditingFraccionado.value ? 'PUT' : 'POST'

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo_producto_original: fraccionadoForm.value.codigo_producto_original,
        peso_a_fraccionar: parseFloat(fraccionadoForm.value.peso_a_fraccionar) || 0,
        codigo_fraccionado: fraccionadoForm.value.codigo_fraccionado,
        peso_a_descontar: parseFloat(fraccionadoForm.value.peso_a_descontar) || 0
      })
    })

    const dataRes = await res.json()

    if (res.ok) {
      showAlert(isEditingFraccionado.value ? 'Conversión actualizada correctamente' : 'Conversión registrada exitosamente')
      closeModal()
      fetchFraccionados()
    } else {
      showAlert(dataRes.error || dataRes.mensaje || 'Error al guardar la conversión', 'error')
    }
  } catch (error) {
    console.error('Error saving fraccionado:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    submittingFraccionado.value = false
  }
}

const loadFraccionadoToForm = (item) => {
  isEditingFraccionado.value = true
  editFraccionadoId.value = item.id

  fraccionadoForm.value = {
    codigo_producto_original: item.codigo_producto_original,
    peso_a_fraccionar: parseFloat(item.peso_a_fraccionar),
    codigo_fraccionado: item.codigo_fraccionado,
    peso_a_descontar: parseFloat(item.peso_a_descontar) || 0
  }

  const matchedOrig = productos.value.find(p => p.codigo === item.codigo_producto_original)
  origSearchQuery.value = matchedOrig ? matchedOrig.codigo : item.codigo_producto_original
  selectedOrigProduct.value = matchedOrig || null

  const matchedDest = productos.value.find(p => p.codigo === item.codigo_fraccionado)
  destSearchQuery.value = matchedDest ? matchedDest.codigo : item.codigo_fraccionado
  selectedDestProduct.value = matchedDest || null
}

const cancelFraccionadoEdit = () => {
  closeModal()
}

const resetFraccionadoForm = () => {
  isEditingFraccionado.value = false
  editFraccionadoId.value = null
  fraccionadoForm.value = { ...defaultFraccionadoForm }
  origSearchQuery.value = ''
  destSearchQuery.value = ''
  selectedOrigProduct.value = null
  selectedDestProduct.value = null
}

// Métodos de Selección
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedItems.value = filteredAndSortedFraccionados.value.map(f => f.id)
  } else {
    selectedItems.value = []
  }
}

const updateSelectAllState = () => {
  const visibleIds = filteredAndSortedFraccionados.value.map(f => f.id)
  if (visibleIds.length === 0) {
    selectAll.value = false
    return
  }
  selectAll.value = visibleIds.every(id => selectedItems.value.includes(id))
}

// PROCESAMIENTO DE FRACCIONADOS
const confirmProcesar = (item) => {
  const pDescontar = parseFloat(item.peso_a_descontar) || 0
  const pFraccionar = parseFloat(item.peso_a_fraccionar) || 0

  if (pFraccionar < pDescontar) {
    showAlert('Validación fallida: El peso a convertir no puede ser menor al peso a descontar', 'error')
    return
  }

  itemsToProcesar.value = [item]
  comprobanteProcesar.value = ''
}

const openBulkProcesarModal = () => {
  if (selectedItems.value.length === 0) return
  const items = fraccionados.value.filter(f => selectedItems.value.includes(f.id))
  
  const invalid = items.filter(item => (parseFloat(item.peso_a_fraccionar) || 0) < (parseFloat(item.peso_a_descontar) || 0))
  if (invalid.length > 0) {
    showAlert(`No se puede procesar el lote: Hay ${invalid.length} conversión(es) donde el peso a convertir es menor al peso a descontar`, 'error')
    return
  }

  itemsToProcesar.value = items
  comprobanteProcesar.value = ''
}

const closeProcesarModal = () => {
  itemsToProcesar.value = []
  comprobanteProcesar.value = ''
}

const totalKilosADescontar = computed(() => {
  return itemsToProcesar.value.reduce((sum, item) => sum + (parseFloat(item.peso_a_descontar) || 0), 0)
})

const totalKilosAFraccionar = computed(() => {
  return itemsToProcesar.value.reduce((sum, item) => sum + (parseFloat(item.peso_a_fraccionar) || 0), 0)
})

const handleProcesar = async () => {
  if (processingFrac.value) return
  if (itemsToProcesar.value.length === 0) return
  if (!comprobanteProcesar.value.trim()) {
    showAlert('El número de comprobante es obligatorio', 'error')
    return
  }

  // Validación final previa al envío
  const invalid = itemsToProcesar.value.filter(item => (parseFloat(item.peso_a_fraccionar) || 0) < (parseFloat(item.peso_a_descontar) || 0))
  if (invalid.length > 0) {
    showAlert('Validación fallida: El peso a convertir no puede ser menor al peso a descontar', 'error')
    return
  }

  processingFrac.value = true
  try {
    let headers = { 'Content-Type': 'application/json' }
    const savedSession = localStorage.getItem('wms_session')
    if (savedSession) {
      try {
        const sess = JSON.parse(savedSession)
        if (sess.sessionId) {
          headers['X-WMS-Session-Id'] = sess.sessionId
          headers['X-WMS-Site-Id'] = sess.siteId || '194326'
          headers['X-WMS-Host'] = sess.host || 'http://192.168.10.2'
        }
      } catch (e) {}
    }

    let res
    if (itemsToProcesar.value.length === 1) {
      res = await fetch(`/api/fraccionados/${itemsToProcesar.value[0].id}/procesar`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          comprobante: comprobanteProcesar.value.trim(),
          usuario: authStore.user?.nombre || 'Sistema'
        })
      })
    } else {
      res = await fetch('/api/fraccionados/procesar-lote', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ids: itemsToProcesar.value.map(item => item.id),
          comprobante: comprobanteProcesar.value.trim(),
          usuario: authStore.user?.nombre || 'Sistema'
        })
      })
    }

    const dataRes = await res.json()

    if (res.ok) {
      const msg = itemsToProcesar.value.length === 1
        ? `Fraccionamiento exitoso: Se sumaron ${parseFloat(itemsToProcesar.value[0].peso_a_fraccionar).toFixed(3)} kg al stock fraccionado de ${dataRes.productoDestinoActualizado?.nombre || itemsToProcesar.value[0].codigo_fraccionado}`
        : `Procesamiento de lote exitoso: Se procesaron ${itemsToProcesar.value.length} conversiones`
      showAlert(msg)
      closeProcesarModal()
      fetchFraccionados()
    } else {
      showAlert(dataRes.error || dataRes.mensaje || 'Error al procesar la conversión', 'error')
    }
  } catch (error) {
    console.error('Error processing fraccionado:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    processingFrac.value = false
  }
}

// ELIMINACIÓN
const confirmDelete = (item) => {
  itemToDelete.value = item
}

const deleteItem = async () => {
  if (!itemToDelete.value) return

  try {
    const res = await fetch(`/api/fraccionados/${itemToDelete.value.id}`, { method: 'DELETE' })
    if (res.ok) {
      showAlert('Registro de conversión eliminado correctamente')
      fetchFraccionados()
    } else {
      showAlert('No se pudo eliminar el registro', 'error')
    }
  } catch (error) {
    console.error('Error deleting:', error)
    showAlert('Error de conexión', 'error')
  } finally {
    itemToDelete.value = null
  }
}

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

// Búsqueda y Ordenación Reactiva
const filteredAndSortedFraccionados = computed(() => {
  let result = [...fraccionados.value]

  // SOLO mostrar cards que tengan valores a convertir
  result = result.filter(f => {
    const pFrac = parseFloat(f.peso_a_fraccionar) || 0
    const pDesc = parseFloat(f.peso_a_descontar) || 0
    return pFrac > 0 || pDesc > 0
  })

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(f => {
      const idMatch = f.id ? f.id.toString().includes(query) : false
      const origCodeMatch = f.codigo_producto_original ? f.codigo_producto_original.toLowerCase().includes(query) : false
      const origNameMatch = f.ProductoOriginal?.nombre ? f.ProductoOriginal.nombre.toLowerCase().includes(query) : false
      const destCodeMatch = f.codigo_fraccionado ? f.codigo_fraccionado.toLowerCase().includes(query) : false
      const destNameMatch = f.ProductoFraccionado?.nombre ? f.ProductoFraccionado.nombre.toLowerCase().includes(query) : false
      return idMatch || origCodeMatch || origNameMatch || destCodeMatch || destNameMatch
    })
  }

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

// Filtrado de logs de conversión procesados (solo fraccionados)
const filteredLogs = computed(() => {
  let result = [...conversionLogs.value]

  // SOLO mostrar conversiones de fraccionado (peso_fraccionado > 0 y código fraccionado asignado)
  result = result.filter(l => {
    const pFrac = parseFloat(l.peso_fraccionado) || 0
    return pFrac > 0 && Boolean(l.codigo_fraccionado)
  })

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(l => {
      const idMatch = l.id ? l.id.toString().includes(query) : false
      const compMatch = l.comprobante ? l.comprobante.toLowerCase().includes(query) : false
      const origCodeMatch = l.codigo_producto_original ? l.codigo_producto_original.toLowerCase().includes(query) : false
      const origNameMatch = l.ProductoOriginal?.nombre ? l.ProductoOriginal.nombre.toLowerCase().includes(query) : false
      const destCodeMatch = l.codigo_fraccionado ? l.codigo_fraccionado.toLowerCase().includes(query) : false
      const destNameMatch = l.ProductoFraccionado?.nombre ? l.ProductoFraccionado.nombre.toLowerCase().includes(query) : false
      const userMatch = l.usuario ? l.usuario.toLowerCase().includes(query) : false
      return idMatch || compMatch || origCodeMatch || origNameMatch || destCodeMatch || destNameMatch || userMatch
    })
  }

  return result
})

// Helper para dar formato dd/mm/yyyy hh:mm
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const pad = (n) => n.toString().padStart(2, '0')
  const dd = pad(date.getDate())
  const mm = pad(date.getMonth() + 1)
  const yyyy = date.getFullYear()
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

onMounted(() => {
  fetchFraccionados()
})
</script>

<style scoped>
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
tr.selected-row {
  background-color: rgba(16, 185, 129, 0.08); /* Soft emerald green for selected conversions */
}

tbody tr:hover {
  background-color: var(--bevel-dark, rgba(0, 0, 0, 0.03)) !important;
}
</style>
