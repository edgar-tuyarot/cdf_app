<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Conversión de Fraccionados</h2>
        <p class="page-description">Administra las plantillas de conversión y procesa la división de productos fraccionados en stock.</p>
      </div>
      <div class="header-actions mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button 
          v-if="selectedItems.length > 0" 
          class="btn btn-primary animate-fade" 
          @click="openBulkProcesarModal"
        >
          <i class="ph ph-gear"></i> Procesar Lote ({{ selectedItems.length }})
        </button>
        <button class="btn btn-secondary" @click="fetchFraccionados" :disabled="loadingFraccionados">
          <i class="ph ph-spinner spinner" v-if="loadingFraccionados"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Conversiones
        </button>
        <router-link 
          to="/productos" 
          class="btn btn-primary" 
          style="display: flex; align-items: center; gap: 0.35rem; text-decoration: none;" 
          title="Vincular o configurar productos fraccionados en el Catálogo"
        >
          <i class="ph ph-sliders"></i> Gestionar en Catálogo
        </router-link>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- TABLA 1: CONVERSIONES PENDIENTES DE PROCESAR -->
    <div class="card mb-4">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <span class="card-title" style="color: white; font-weight: bold; display: flex; align-items: center; gap: 0.4rem;">
            <i class="ph ph-scales" style="font-size: 1.15rem;"></i> Conversiones Pendientes de Procesar ({{ filteredAndSortedFraccionados.length }})
          </span>
          
          <!-- Totales rápidos -->
          <div style="display: flex; gap: 0.75rem; font-size: 0.78rem; background: rgba(0,0,0,0.2); padding: 3px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.15); color: white;">
            <span>A Descontar: <strong style="color: #fca5a5;">{{ totalKilosADescontarPendientes.toFixed(3) }} kg</strong></span>
            <span>|</span>
            <span>A Ingresar: <strong style="color: #86efac;">{{ totalKilosAFraccionarPendientes.toFixed(3) }} kg</strong></span>
          </div>

          <!-- Seleccionar Lote Completo -->
          <label v-if="filteredAndSortedFraccionados.length > 0" style="color: white; font-weight: 800; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3);">
            <input 
              type="checkbox" 
              v-model="selectAll" 
              @change="toggleSelectAll" 
              style="transform: scale(1.15); cursor: pointer;"
            />
            Seleccionar todos ({{ filteredAndSortedFraccionados.length }})
          </label>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <label style="font-size: 0.78rem; color: white; display: flex; align-items: center; gap: 0.35rem; cursor: pointer; user-select: none;">
            <input type="checkbox" v-model="mostrarTodasLasPlantillas" style="cursor: pointer;" />
            Ver todas las plantillas (incluidas en 0 kg)
          </label>

          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
            <input 
              type="text" 
              v-model="searchPendientesQuery" 
              placeholder="Filtrar pendientes..." 
              style="border: none; outline: none; font-size: 0.82rem; background: transparent; width: 140px; color: var(--text-primary);"
            />
            <button v-if="searchPendientesQuery" @click="searchPendientesQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
              <i class="ph ph-x-circle"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="table-container" style="max-height: 440px; overflow-y: auto;">
        <table v-if="!loadingFraccionados && filteredAndSortedFraccionados.length > 0">
          <thead>
            <tr>
              <th style="width: 38px; text-align: center;">
                <input 
                  type="checkbox" 
                  v-model="selectAll" 
                  @change="toggleSelectAll" 
                  style="cursor: pointer;"
                />
              </th>
              <th style="width: 65px;" class="sortable" @click="sortBy('id')">
                ID <i class="ph" :class="getSortIcon('id')"></i>
              </th>
              <th>Producto Origen (Madre)</th>
              <th style="width: 130px;" class="text-right sortable" @click="sortBy('peso_a_descontar')">
                A Descontar <i class="ph" :class="getSortIcon('peso_a_descontar')"></i>
              </th>
              <th style="width: 30px; text-align: center;"></th>
              <th>Producto Destino (Fraccionado)</th>
              <th style="width: 130px;" class="text-right sortable" @click="sortBy('peso_a_fraccionar')">
                A Fraccionar <i class="ph" :class="getSortIcon('peso_a_fraccionar')"></i>
              </th>
              <th class="text-right" style="width: 110px;">Diferencia</th>
              <th class="text-center" style="width: 170px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="f in filteredAndSortedFraccionados" 
              :key="f.id"
              :class="{ 'selected-row': selectedItems.includes(f.id) }"
            >
              <td style="text-align: center;">
                <input 
                  type="checkbox" 
                  :value="f.id" 
                  v-model="selectedItems" 
                  @change="updateSelectAllState" 
                  style="cursor: pointer;"
                />
              </td>
              <td>
                <span class="badge" style="background: var(--bg-secondary); border: 1px solid var(--bevel-dark); font-weight: 800; font-family: monospace;">
                  #{{ f.id }}
                </span>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 0.55rem;">
                  <span class="badge" style="background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--bevel-dark); font-family: monospace; font-weight: 800; font-size: 0.85rem; padding: 2px 7px; border-radius: 4px; white-space: nowrap;">
                    {{ f.codigo_producto_original }}
                  </span>
                  <span style="font-weight: 600; color: var(--text-primary);">
                    {{ f.ProductoOriginal?.nombre || 'Desconocido' }}
                  </span>
                </div>
              </td>
              <td class="text-right fw-bold text-red font-mono" style="font-size: 0.92rem;">
                -{{ parseFloat(f.peso_a_descontar).toFixed(3) }} kg
              </td>
              <td style="text-align: center; color: #0284c7; font-size: 1.1rem;">
                <i class="ph ph-arrow-right-bold"></i>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 0.55rem;">
                  <span class="badge" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-family: monospace; font-weight: 800; font-size: 0.85rem; padding: 2px 7px; border-radius: 4px; white-space: nowrap;">
                    {{ f.codigo_fraccionado }}
                  </span>
                  <span style="font-weight: 600; color: var(--text-primary);">
                    {{ f.ProductoFraccionado?.nombre || 'Desconocido' }}
                  </span>
                </div>
              </td>
              <td class="text-right fw-bold text-green font-mono" style="font-size: 0.92rem;">
                +{{ parseFloat(f.peso_a_fraccionar).toFixed(3) }} kg
              </td>
              <td class="text-right font-mono" style="font-size: 0.85rem;">
                <span 
                  :style="{ color: (parseFloat(f.peso_a_fraccionar) - parseFloat(f.peso_a_descontar)) >= 0 ? '#16a34a' : '#dc2626' }"
                  style="font-weight: 700;"
                >
                  {{ (parseFloat(f.peso_a_fraccionar) - parseFloat(f.peso_a_descontar)) >= 0 ? '+' : '' }}{{ (parseFloat(f.peso_a_fraccionar) - parseFloat(f.peso_a_descontar)).toFixed(3) }} kg
                </span>
              </td>
              <td class="text-center">
                <div style="display: flex; gap: 0.35rem; justify-content: center; align-items: center;">
                  <button 
                    class="btn btn-sm btn-primary" 
                    @click.stop="confirmProcesar(f)"
                    :disabled="parseFloat(f.peso_a_fraccionar) <= 0 || parseFloat(f.peso_a_fraccionar) < parseFloat(f.peso_a_descontar)"
                    style="padding: 2px 8px; font-size: 0.76rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem;"
                    title="Procesar conversión de esta fila"
                  >
                    <i class="ph ph-gear"></i> Procesar
                  </button>
                  <button 
                    class="btn btn-sm btn-secondary" 
                    title="Ajustar kilos pendientes"
                    @click.stop="openModal(f)"
                    style="padding: 2px 6px; font-size: 0.8rem; color: var(--accent-primary);"
                  >
                    <i class="ph ph-pencil-simple"></i>
                  </button>
                  <button 
                    class="btn btn-sm btn-secondary" 
                    title="Desvincular del catálogo"
                    @click.stop="confirmDelete(f)"
                    style="padding: 2px 6px; font-size: 0.8rem; color: var(--accent-error);"
                  >
                    <i class="ph ph-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Cargando -->
        <div v-if="loadingFraccionados" class="loading-state">
          <i class="ph ph-spinner spinner icon-xl"></i>
          Cargando conversiones pendientes...
        </div>

        <!-- Vacío -->
        <div v-if="!loadingFraccionados && filteredAndSortedFraccionados.length === 0" class="empty-state">
          <i class="ph ph-check-circle icon-xl text-green"></i>
          No hay conversiones pendientes de procesar en este momento.
        </div>
      </div>
    </div>


    <!-- TABLA 2: HISTORIAL DE CONVERSIONES REALIZADAS -->
    <div class="card mb-4">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span class="card-title" style="color: white; font-weight: bold; display: flex; align-items: center; gap: 0.4rem;">
          <i class="ph ph-clock-counter-clockwise" style="font-size: 1.15rem;"></i> Historial de Conversiones Realizadas ({{ filteredLogs.length }})
        </span>

        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
            <input 
              type="text" 
              v-model="searchLogsQuery" 
              placeholder="Buscar comprobante, orden, SKU..." 
              style="border: none; outline: none; font-size: 0.82rem; background: transparent; width: 190px; color: var(--text-primary);"
            />
            <button v-if="searchLogsQuery" @click="searchLogsQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
              <i class="ph ph-x-circle"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="table-container" style="max-height: 480px; overflow-y: auto;">
        <table v-if="!loadingLogs && filteredLogs.length > 0">
          <thead>
            <tr>
              <th style="width: 135px;">Fecha y Hora</th>
              <th style="width: 125px;">Comprobante</th>
              <th style="width: 125px; text-align: center;">Orden Block (WMS)</th>
              <th>Producto Original (Origen)</th>
              <th class="text-right" style="width: 120px;">Descontado</th>
              <th>Producto Fraccionado (Destino)</th>
              <th class="text-right" style="width: 120px;">Ingresado</th>
              <th style="width: 100px;">Operario</th>
              <th class="text-center" style="width: 90px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in filteredLogs" :key="l.id">
              <td class="font-mono text-xs">{{ formatDateTime(l.fecha) }}</td>
              <td><strong class="font-mono">{{ l.comprobante }}</strong></td>
              <td style="text-align: center;">
                <span v-if="l.id_orden_wms" class="badge" style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-weight: 800; font-family: monospace;">
                  <i class="ph ph-check-circle" style="color: #0284c7; margin-right: 2px;"></i>#{{ l.id_orden_wms }}
                </span>
                <span v-else class="text-muted text-xs">—</span>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 0.55rem;">
                  <span class="badge" style="background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--bevel-dark); font-family: monospace; font-weight: 800; font-size: 0.82rem; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">
                    {{ l.codigo_producto_original }}
                  </span>
                  <span style="font-weight: 600; color: var(--text-primary); font-size: 0.88rem;">
                    {{ l.ProductoOriginal?.nombre || 'Desconocido' }}
                  </span>
                </div>
              </td>
              <td class="text-right fw-bold text-red font-mono">-{{ parseFloat(l.peso_descontado).toFixed(3) }} kg</td>
              <td>
                <div style="display: flex; align-items: center; gap: 0.55rem;">
                  <span class="badge" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-family: monospace; font-weight: 800; font-size: 0.82rem; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">
                    {{ l.codigo_fraccionado }}
                  </span>
                  <span style="font-weight: 600; color: var(--text-primary); font-size: 0.88rem;">
                    {{ l.ProductoFraccionado?.nombre || 'Desconocido' }}
                  </span>
                </div>
              </td>
              <td class="text-right fw-bold text-green font-mono">+{{ parseFloat(l.peso_fraccionado).toFixed(3) }} kg</td>
              <td class="text-xs">{{ l.usuario || 'Sistema' }}</td>
              <td class="text-center">
                <button 
                  class="btn btn-secondary" 
                  style="padding: 2px 8px; font-size: 0.78rem; color: var(--accent-error); border-color: var(--accent-error); font-weight: bold;"
                  title="Revertir esta conversión"
                  @click="confirmRevertir(l)"
                >
                  <i class="ph ph-arrow-u-down-left"></i> Revertir
                </button>
              </td>
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

    <!-- Modal Formulario: Ajustar Kilos de Conversión -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @mousedown.self="closeModal">
        <div class="modal-card" style="max-width: 500px;">
          <div class="modal-header" style="background-color: var(--accent-orange);">
            <h3 class="modal-title" style="color: white; font-weight: bold; display: flex; align-items: center; gap: 0.4rem;">
              <i class="ph ph-scales"></i> Ajustar Kilos de Conversión #{{ editFraccionadoId }}
            </h3>
            <button class="icon-btn" style="color: white;" @click="closeModal"><i class="ph ph-x"></i></button>
          </div>
          <form @submit.prevent="submitFraccionadoForm">
            <div class="modal-body" style="display: flex; flex-direction: column; gap: 0.85rem;">
              
              <!-- Información de Productos Origen y Destino (Gobernados por el Catálogo) -->
              <div style="background: var(--bg-secondary); border: 1.5px solid var(--bevel-dark); padding: 0.75rem 1rem; border-radius: 6px; display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem;">
                  <span style="color: var(--text-secondary); font-weight: 700;">Origen (Madre):</span>
                  <span style="font-weight: 800; font-family: monospace;">{{ fraccionadoForm.codigo_producto_original }} - {{ selectedOrigProduct?.nombre || '' }}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem;">
                  <span style="color: var(--text-secondary); font-weight: 700;">Destino (Fraccionado):</span>
                  <span style="font-weight: 800; font-family: monospace; color: var(--accent-primary);">{{ fraccionadoForm.codigo_fraccionado }} - {{ selectedDestProduct?.nombre || '' }}</span>
                </div>
                <div style="font-size: 0.74rem; color: var(--text-muted); border-top: 1px dashed var(--bevel-dark); padding-top: 0.4rem; display: flex; align-items: center; gap: 0.35rem;">
                  <i class="ph ph-info" style="font-size: 0.95rem; color: #0284c7;"></i> La relación de productos se define y gestiona desde el Catálogo de Productos.
                </div>
              </div>

              <!-- Pesos y Conversión -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700;">Peso a Descontar (kg) *</label>
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
                  <label class="form-label" style="font-weight: 700;">Peso a Fraccionar (kg) *</label>
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

            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submittingFraccionado">
                <i class="ph ph-spinner spinner" v-if="submittingFraccionado"></i>
                <i class="ph ph-floppy-disk" v-else></i>
                {{ submittingFraccionado ? 'Guardando...' : 'Actualizar Kilos' }}
              </button>
            </div>
          </form>
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
              ¿Estás seguro de que deseas eliminar la conversión del producto <strong>{{ itemToDelete.codigo_producto_original }}</strong> ({{ itemToDelete.ProductoOriginal?.nombre || '' }})?<br><br>
              Esta acción <strong>desvinculará el producto fraccionado en el Catálogo de Productos</strong> y eliminará esta plantilla de conversión.
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
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 0.65rem 0.85rem; font-size: 0.82rem; color: #166534; display: flex; align-items: center; gap: 0.55rem; margin-top: 0.5rem;">
              <i class="ph ph-check-circle" style="font-size: 1.35rem; color: #16a34a; flex-shrink: 0;"></i>
              <div>
                <strong>Ajuste Automático en BlockWMS:</strong> Al confirmar, se creará y finalizará la orden de ajuste directamente en BlockWMS asignándole automáticamente su número de orden oficial.
              </div>
            </div>
          </div>
          <div class="win-dialog-footer">
            <button 
              class="win-dialog-btn win-dialog-btn-ok" 
              style="background-color: var(--accent-success); color: white; display: inline-flex; align-items: center; gap: 0.4rem;" 
              @click="handleProcesar" 
              :disabled="processingFrac"
            >
              <i class="ph ph-spinner spinner" v-if="processingFrac"></i>
              <span v-if="processingFrac">Procesando en BlockWMS...</span>
              <span v-else>{{ itemsToProcesar.length > 1 ? 'Sí, Procesar Lote' : 'Sí, Procesar' }}</span>
            </button>
            <button class="win-dialog-btn" @click="closeProcesarModal" :disabled="processingFrac">No</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Confirmación Revertir Conversión del Log -->
    <Teleport to="body">
      <div v-if="itemToRevert" class="win-dialog-overlay" @mousedown.self="itemToRevert = null">
        <div class="win-dialog" style="max-width: 460px;">
          <div class="win-dialog-titlebar" style="background: var(--accent-error);">
            <span class="win-dialog-titlebar-text" style="color: white; font-weight: bold;">Confirmar Reversión de Conversión</span>
            <button class="win-dialog-close" style="color: white;" @click="itemToRevert = null"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; gap: 0.75rem; align-items: start;">
              <i class="ph ph-arrow-u-down-left win-dialog-icon text-red" style="font-size: 2.2rem; flex-shrink: 0;"></i>
              <div class="win-dialog-msg">
                ¿Estás seguro de que deseas revertir la conversión del comprobante <strong>#{{ itemToRevert.comprobante }}</strong>?<br><br>
                <strong>Efectos de la reversión:</strong>
                <ul style="margin-top: 0.35rem; margin-left: 1.2rem; font-size: 0.8rem; line-height: 1.4;">
                  <li>Se descontarán <strong>{{ parseFloat(itemToRevert.peso_fraccionado).toFixed(3) }} kg</strong> del stock destino ({{ itemToRevert.codigo_fraccionado }}).</li>
                  <li>Se devolverán <strong>{{ parseFloat(itemToRevert.peso_descontado).toFixed(3) }} kg</strong> al stock del producto origen ({{ itemToRevert.codigo_producto_original }}).</li>
                  <li>La plantilla reaparecerá activa en la lista de conversiones pendientes para volver a procesarse.</li>
                  <li><em style="color: var(--text-muted);">Nota: Acción local en la app (sin órdenes en BlockWMS).</em></li>
                </ul>
              </div>
            </div>
          </div>
          <div class="win-dialog-footer">
            <button 
              class="win-dialog-btn win-dialog-btn-ok" 
              style="background-color: var(--accent-error); color: white;" 
              @click="handleRevertir" 
              :disabled="revertingLog"
            >
              <i class="ph ph-spinner spinner" v-if="revertingLog"></i>
              {{ revertingLog ? 'Revirtiendo...' : 'Sí, Revertir' }}
            </button>
            <button class="win-dialog-btn" @click="itemToRevert = null" :disabled="revertingLog">Cancelar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { formatDateTime } from '../utils/dateFormat'

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
const itemToRevert = ref(null)
const revertingLog = ref(false)
const itemsToProcesar = ref([])
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
const searchPendientesQuery = ref('')
const searchLogsQuery = ref('')
const mostrarTodasLasPlantillas = ref(false)
const sortKey = ref('id')
const sortOrder = ref(-1) // Más reciente primero

const getSortIcon = (key) => {
  if (sortKey.value !== key) return 'ph-caret-up-down'
  return sortOrder.value === 1 ? 'ph-caret-up' : 'ph-caret-down'
}

const totalKilosADescontarPendientes = computed(() => {
  return filteredAndSortedFraccionados.value.reduce((acc, f) => acc + (parseFloat(f.peso_a_descontar) || 0), 0)
})

const totalKilosAFraccionarPendientes = computed(() => {
  return filteredAndSortedFraccionados.value.reduce((acc, f) => acc + (parseFloat(f.peso_a_fraccionar) || 0), 0)
})

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
}

const closeProcesarModal = () => {
  itemsToProcesar.value = []
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

  // Validación previa al envío
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
          usuario: authStore.user?.nombre || 'Sistema'
        })
      })
    } else {
      res = await fetch('/api/fraccionados/procesar-lote', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ids: itemsToProcesar.value.map(item => item.id),
          usuario: authStore.user?.nombre || 'Sistema'
        })
      })
    }

    const dataRes = await res.json()

    if (res.ok) {
      const ordenNum = dataRes.id_orden_wms || dataRes.comprobante
      const msg = itemsToProcesar.value.length === 1
        ? `Fraccionamiento exitoso (Orden Block #${ordenNum}): Se sumaron ${parseFloat(itemsToProcesar.value[0].peso_a_fraccionar).toFixed(3)} kg al stock de ${dataRes.productoDestinoActualizado?.nombre || itemsToProcesar.value[0].codigo_fraccionado}`
        : `Procesamiento de lote exitoso (Orden Block #${ordenNum}): Se procesaron ${itemsToProcesar.value.length} conversiones`
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

// REVERSIÓN DE LOG DE CONVERSIÓN
const confirmRevertir = (item) => {
  itemToRevert.value = item
}

const handleRevertir = async () => {
  if (!itemToRevert.value || revertingLog.value) return

  revertingLog.value = true
  try {
    const res = await fetch(`/api/fraccionados/logs/${itemToRevert.value.id}/revertir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    const dataRes = await res.json()

    if (res.ok) {
      showAlert(dataRes.mensaje || 'Conversión revertida correctamente')
      itemToRevert.value = null
      await fetchFraccionados()
      activeTab.value = 'templates'
    } else {
      showAlert(dataRes.error || dataRes.mensaje || 'Error al revertir la conversión', 'error')
    }
  } catch (error) {
    console.error('Error reverting conversion:', error)
    showAlert('Error de conexión al revertir la conversión', 'error')
  } finally {
    revertingLog.value = false
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

  // Si no está marcado ver todas, SOLO mostrar las que tengan valores pendientes de convertir
  if (!mostrarTodasLasPlantillas.value) {
    result = result.filter(f => {
      const pFrac = parseFloat(f.peso_a_fraccionar) || 0
      const pDesc = parseFloat(f.peso_a_descontar) || 0
      return pFrac > 0 || pDesc > 0
    })
  }

  if (searchPendientesQuery.value.trim()) {
    const query = searchPendientesQuery.value.toLowerCase().trim()
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

  if (searchLogsQuery.value.trim()) {
    const query = searchLogsQuery.value.toLowerCase().trim()
    result = result.filter(l => {
      const idMatch = l.id ? l.id.toString().includes(query) : false
      const compMatch = l.comprobante ? l.comprobante.toLowerCase().includes(query) : false
      const wmsMatch = l.id_orden_wms ? l.id_orden_wms.toLowerCase().includes(query) : false
      const origCodeMatch = l.codigo_producto_original ? l.codigo_producto_original.toLowerCase().includes(query) : false
      const origNameMatch = l.ProductoOriginal?.nombre ? l.ProductoOriginal.nombre.toLowerCase().includes(query) : false
      const destCodeMatch = l.codigo_fraccionado ? l.codigo_fraccionado.toLowerCase().includes(query) : false
      const destNameMatch = l.ProductoFraccionado?.nombre ? l.ProductoFraccionado.nombre.toLowerCase().includes(query) : false
      const userMatch = l.usuario ? l.usuario.toLowerCase().includes(query) : false
      return idMatch || compMatch || wmsMatch || origCodeMatch || origNameMatch || destCodeMatch || destNameMatch || userMatch
    })
  }

  return result
})

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
