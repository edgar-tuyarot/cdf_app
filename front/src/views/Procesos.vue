<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Gestión de Procesos y Conversiones</h2>
        <p class="page-description">Registra los procesos generales o administra las conversiones de productos fraccionados.</p>
      </div>
      <div class="header-actions mt-2">
        <button class="btn btn-secondary" @click="refreshCurrentData" :disabled="loadingData || loadingFraccionados">
          <i class="ph ph-spinner spinner" v-if="loadingData || loadingFraccionados"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Todo
        </button>
      </div>
    </div>

    <!-- Pestañas (Tabs) Estilo Windows 98 -->
    <div class="tabs">
      <button 
        type="button" 
        :class="['tab-btn', activeTab === 'procesos' ? 'active' : '']"
        @click="switchTab('procesos')"
      >
        <i class="ph ph-arrows-clockwise"></i> Procesos Generales
      </button>
      <button 
        type="button" 
        :class="['tab-btn', activeTab === 'convertir' ? 'active' : '']"
        @click="switchTab('convertir')"
      >
        <i class="ph ph-arrows-left-right"></i> Convertir / Fraccionados
      </button>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Contenedor de doble columna: Formulario y Listado -->
    <div class="procesos-grid">
      
      <!-- ============================================== -->
      <!-- FORMULARIO: PROCESOS GENERALES                -->
      <!-- ============================================== -->
      <div v-if="activeTab === 'procesos'" class="card form-column">
        <div class="card-header" :style="isEditing ? 'background-color: var(--accent-orange);' : ''">
          <span class="card-title">{{ isEditing ? 'Editar Proceso #' + editId : 'Registrar Nuevo Proceso' }}</span>
        </div>
        <form @submit.prevent="submitForm" class="p-4" style="display: flex; flex-direction: column; gap: 0.75rem;">
          
          <div class="form-group">
            <label class="form-label">Colaborador *</label>
            <select v-model="form.colaborador_id" class="form-control" required style="padding: 0 0.25rem;">
              <option :value="null" disabled>Seleccione un colaborador</option>
              <option v-for="c in colaboradores" :key="c.id" :value="c.id">
                {{ c.nombre }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Tipo de Proceso *</label>
            <select v-model="form.proceso" class="form-control" required style="padding: 0 0.25rem;">
              <option value="Fraccionamiento">Fraccionamiento</option>
              <option value="Envasado">Envasado</option>
              <option value="Picada">Picada</option>
              <option value="Decomiso Directo">Decomiso Directo</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Fecha del Proceso</label>
            <input type="date" v-model="form.fecha" class="form-control" />
          </div>

          <!-- Selector Autocomplete de Producto -->
          <div class="form-group">
            <label class="form-label">Producto Asociado *</label>
            <div style="position: relative; display: flex; align-items: center;">
              <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
              <input 
                type="text" 
                v-model="productSearch" 
                list="catalog-products-list-main" 
                @input="handleProductInput" 
                class="form-control" 
                placeholder="Escribe código o nombre para buscar..." 
                required 
                style="padding-left: 2rem; height: 32px;"
              />
            </div>
            <datalist id="catalog-products-list-main">
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
              v-if="selectedMainProduct" 
              class="selected-product-badge mt-2 animate-fade"
              style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; background-color: var(--accent-success-light); border: 1px solid var(--accent-success); font-size: 0.8rem; color: var(--text-primary);"
            >
              <i class="ph ph-circle-wavy-check text-green" style="font-size: 1rem;"></i>
              <span>
                Seleccionado: <strong>{{ selectedMainProduct.nombre }}</strong>
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <div class="form-group">
              <label class="form-label">Piezas</label>
              <input type="number" min="0" v-model.number="form.piezas" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label">Peso Bruto (kg)</label>
              <input type="number" step="0.001" min="0" v-model.number="form.peso_bruto" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label">Recorte (kg)</label>
              <input type="number" step="0.001" min="0" v-model.number="form.recorte" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label">Decomiso (kg)</label>
              <input type="number" step="0.001" min="0" v-model.number="form.decomiso" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label">Kg a Descontar</label>
              <input type="number" step="0.001" v-model.number="form.kg_a_desc" class="form-control" disabled />
            </div>

            <div class="form-group">
              <label class="form-label">Kg a Sumar</label>
              <input type="number" step="0.001" min="0" v-model.number="form.kg_a_sumar" class="form-control" />
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <button v-if="isEditing" type="button" class="btn btn-secondary w-full" @click="cancelEdit">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary w-full" :disabled="submitting">
              <i class="ph ph-spinner spinner" v-if="submitting"></i>
              <i class="ph ph-floppy-disk" v-else></i>
              {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Registrar') }}
            </button>
          </div>
        </form>
      </div>

      <!-- ============================================== -->
      <!-- FORMULARIO: CONVERTIR / FRACCIONADOS          -->
      <!-- ============================================== -->
      <div v-else class="card form-column">
        <div class="card-header" :style="isEditingFraccionado ? 'background-color: var(--accent-orange);' : 'background-color: var(--accent-success);'">
          <span class="card-title">{{ isEditingFraccionado ? 'Editar Conversión #' + editFraccionadoId : 'Nueva Conversión (Fraccionados)' }}</span>
        </div>
        <form @submit.prevent="submitFraccionadoForm" class="p-4" style="display: flex; flex-direction: column; gap: 0.75rem;">
          
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

          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <button v-if="isEditingFraccionado" type="button" class="btn btn-secondary w-full" @click="cancelFraccionadoEdit">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary w-full" style="background-color: var(--accent-success);" :disabled="submittingFraccionado">
              <i class="ph ph-spinner spinner" v-if="submittingFraccionado"></i>
              <i class="ph ph-floppy-disk" v-else></i>
              {{ submittingFraccionado ? 'Guardando...' : (isEditingFraccionado ? 'Actualizar' : 'Convertir / Guardar') }}
            </button>
          </div>
        </form>
      </div>

      <!-- ============================================== -->
      <!-- HISTORIAL: LISTADO DE PROCESOS                 -->
      <!-- ============================================== -->
      <div v-if="activeTab === 'procesos'" class="card list-column">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span class="card-title">Historial de Procesos</span>
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar proceso..." 
              style="border: none; outline: none; font-size: 0.85rem; background: transparent; width: 140px; color: var(--text-primary);"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
              <i class="ph ph-x-circle"></i>
            </button>
          </div>
        </div>

        <div class="table-container" style="max-height: 520px; overflow-y: auto;">
          <table v-if="!loadingData && filteredAndSortedProcesos.length > 0">
            <thead>
              <tr>
                <th @click="sortBy('id')" class="sortable">ID <i v-if="sortKey === 'id'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('fecha')" class="sortable">Fecha <i v-if="sortKey === 'fecha'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('proceso')" class="sortable">Proceso <i v-if="sortKey === 'proceso'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('colaborador')" class="sortable">Colaborador <i v-if="sortKey === 'colaborador'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th>Producto</th>
                <th class="text-right">Detalles</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredAndSortedProcesos" :key="p.id">
                <td><strong>{{ p.id }}</strong></td>
                <td>{{ formatDate(p.fecha) }}</td>
                <td>
                  <span :class="['badge', getBadgeType(p.proceso)]">{{ p.proceso }}</span>
                </td>
                <td>{{ p.Colaborador?.nombre || p.colaborador || 'Sin Colaborador' }}</td>
                <td>
                  <span class="text-xs" :title="p.codigo">
                    <strong>{{ p.codigo }}</strong> - {{ p.Producto?.nombre || 'Desconocido' }}
                  </span>
                </td>
                <td class="text-right" style="font-size: 0.75rem; white-space: nowrap; line-height: 1.3;">
                  <div>Pzs: {{ p.piezas }} | Bruto: {{ parseFloat(p.peso_bruto).toFixed(3) }} kg</div>
                  <div class="text-muted">Rec: {{ parseFloat(p.recorte).toFixed(3) }} | Dec: {{ parseFloat(p.decomiso).toFixed(3) }}</div>
                  <div class="text-blue">Desc: {{ parseFloat(p.kg_a_desc).toFixed(3) }} | Sum: {{ parseFloat(p.kg_a_sumar).toFixed(3) }}</div>
                </td>
                <td>
                  <div style="display: flex; gap: 0.25rem; justify-content: center;">
                    <button class="icon-btn" title="Editar" @click="loadProcesoToForm(p)">
                      <i class="ph ph-pencil-simple text-blue"></i>
                    </button>
                    <button class="icon-btn" title="Eliminar" @click="confirmDelete(p)">
                      <i class="ph ph-trash text-red"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Cargando -->
          <div v-if="loadingData" class="loading-state">
            <i class="ph ph-spinner spinner icon-xl"></i>
            Cargando historial de procesos...
          </div>

          <!-- Historial Vacío -->
          <div v-if="!loadingData && filteredAndSortedProcesos.length === 0" class="empty-state">
            <i class="ph ph-arrows-clockwise icon-xl"></i>
            No se encontraron procesos registrados.
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- HISTORIAL: LISTADO DE FRACCIONADOS            -->
      <!-- ============================================== -->
      <div v-else class="card list-column">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span class="card-title">Historial de Conversiones (Fraccionados)</span>
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

        <div class="table-container" style="max-height: 520px; overflow-y: auto;">
          <table v-if="!loadingFraccionados && filteredAndSortedFraccionados.length > 0">
            <thead>
              <tr>
                <th @click="sortBy('id')" class="sortable">ID <i v-if="sortKey === 'id'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th>Producto Original (Origen)</th>
                <th @click="sortBy('peso_a_descontar')" class="sortable text-right">Peso a Descontar <i v-if="sortKey === 'peso_a_descontar'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('peso_a_fraccionar')" class="sortable text-right">Peso a Fraccionar <i v-if="sortKey === 'peso_a_fraccionar'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th>Producto Fraccionado (Destino)</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in filteredAndSortedFraccionados" :key="f.id">
                <td><strong>{{ f.id }}</strong></td>
                <td>
                  <span class="fw-bold">{{ f.codigo_producto_original }}</span>
                  <div class="text-muted text-xs">{{ f.ProductoOriginal?.nombre || 'Desconocido' }}</div>
                </td>
                <td class="text-right fw-bold text-red">{{ parseFloat(f.peso_a_descontar).toFixed(3) }} kg</td>
                <td class="text-right fw-bold text-blue">{{ parseFloat(f.peso_a_fraccionar).toFixed(3) }} kg</td>
                <td>
                  <span class="fw-bold">{{ f.codigo_fraccionado }}</span>
                  <div class="text-muted text-xs text-green">{{ f.ProductoFraccionado?.nombre || 'Desconocido' }}</div>
                </td>
                <td>
                  <div style="display: flex; gap: 0.35rem; justify-content: center; align-items: center;">
                    <button 
                      class="btn btn-secondary text-green" 
                      style="min-height: 24px; padding: 0.1rem 0.5rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.2rem;" 
                      title="Procesar Conversión" 
                      @click="confirmProcesar(f)"
                      :disabled="parseFloat(f.peso_a_fraccionar) <= 0"
                    >
                      <i class="ph ph-gear"></i> Procesar
                    </button>
                    <button class="icon-btn" title="Editar" @click="loadFraccionadoToForm(f)">
                      <i class="ph ph-pencil-simple text-blue"></i>
                    </button>
                    <button class="icon-btn" title="Eliminar" @click="confirmDelete(f)">
                      <i class="ph ph-trash text-red"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Cargando -->
          <div v-if="loadingFraccionados" class="loading-state">
            <i class="ph ph-spinner spinner icon-xl"></i>
            Cargando historial de conversiones...
          </div>

          <!-- Historial Vacío -->
          <div v-if="!loadingFraccionados && filteredAndSortedFraccionados.length === 0" class="empty-state">
            <i class="ph ph-arrows-left-right icon-xl"></i>
            No se encontraron conversiones registradas.
          </div>
        </div>
      </div>

    </div>

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
              <span v-if="activeTab === 'procesos'">
                ¿Estás seguro de que deseas eliminar el registro de proceso de <strong>{{ itemToDelete.proceso }}</strong> del colaborador <strong>{{ itemToDelete.colaborador }}</strong>?
              </span>
              <span v-else>
                ¿Estás seguro de que deseas eliminar el registro de conversión ID #<strong>{{ itemToDelete.id }}</strong> ({{ itemToDelete.codigo_producto_original }} -> {{ itemToDelete.codigo_fraccionado }})?
              </span>
              <br><br>Esta acción no se puede deshacer.
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
      <div v-if="itemToProcesar" class="win-dialog-overlay" @mousedown.self="itemToProcesar = null">
        <div class="win-dialog" style="max-width: 420px;">
          <div class="win-dialog-titlebar" style="background: var(--accent-success);">
            <span class="win-dialog-titlebar-text" style="color: white;">Confirmar Procesamiento</span>
            <button class="win-dialog-close" @click="itemToProcesar = null"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body">
            <i class="ph ph-gear win-dialog-icon text-green"></i>
            <p class="win-dialog-msg">
              ¿Estás seguro de que deseas procesar la conversión de <strong>{{ parseFloat(itemToProcesar.peso_a_fraccionar).toFixed(3) }} kg</strong>?<br><br>
              Esto sumará los kilos al campo <strong>kg_fraccionados</strong> del producto final <strong>{{ itemToProcesar.ProductoFraccionado?.nombre || itemToProcesar.codigo_fraccionado }}</strong> y restablecerá los pesos acumulados del origen y destino a 0 en esta plantilla.<br><br>
              Esta acción es atómica y no se puede deshacer.
            </p>
          </div>
          <div class="win-dialog-footer">
            <button class="win-dialog-btn win-dialog-btn-ok" style="background-color: var(--accent-success); color: white;" @click="handleProcesar" :disabled="processingFrac">
              <i class="ph ph-spinner spinner" v-if="processingFrac"></i>
              Sí, Procesar
            </button>
            <button class="win-dialog-btn" @click="itemToProcesar = null" :disabled="processingFrac">No</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// Pestañas (Tab selector)
const activeTab = ref('procesos')

// Datos
const procesos = ref([])
const fraccionados = ref([])
const productos = ref([])
const colaboradores = ref([])
const loadingData = ref(true)
const loadingFraccionados = ref(false)
const submitting = ref(false)
const submittingFraccionado = ref(false)
const isEditing = ref(false)
const isEditingFraccionado = ref(false)
const editId = ref(null)
const editFraccionadoId = ref(null)
const itemToDelete = ref(null)
const itemToProcesar = ref(null)
const processingFrac = ref(false)

const alert = ref({ show: false, message: '', type: 'success' })

// Formulario Procesos Generales
const getTodayString = () => new Date().toISOString().split('T')[0]

const defaultForm = {
  colaborador_id: null,
  proceso: 'Fraccionamiento',
  fecha: getTodayString(),
  codigo: '',
  piezas: 0,
  peso_bruto: 0,
  recorte: 0,
  decomiso: 0,
  kg_a_desc: 0,
  kg_a_sumar: 0
}

const form = ref({ ...defaultForm })

// Formulario Conversiones / Fraccionados
const defaultFraccionadoForm = {
  codigo_producto_original: '',
  peso_a_fraccionar: 0,
  codigo_fraccionado: '',
  peso_a_descontar: 0
}

const fraccionadoForm = ref({ ...defaultFraccionadoForm })

// Autocomplete Preselección (Nueva Lógica)
const productSearch = ref('')
const selectedMainProduct = ref(null)

const origSearchQuery = ref('')
const selectedOrigProduct = ref(null)

const destSearchQuery = ref('')
const selectedDestProduct = ref(null)

const handleProductInput = () => {
  const code = productSearch.value.trim()
  const found = productos.value.find(p => p.codigo === code)
  if (found) {
    selectedMainProduct.value = found
    form.value.codigo = found.codigo
  } else {
    selectedMainProduct.value = null
    form.value.codigo = ''
  }
}

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

// Watcher para calcular automáticamente "Kg a Descontar" = peso_bruto - (decomiso + recorte)
watch(
  () => [form.value.peso_bruto, form.value.decomiso, form.value.recorte],
  ([bruto, decomiso, recorte]) => {
    const valBruto = parseFloat(bruto) || 0
    const valDecomiso = parseFloat(decomiso) || 0
    const valRecorte = parseFloat(recorte) || 0
    const calc = valBruto - (valDecomiso + valRecorte)
    form.value.kg_a_desc = parseFloat(calc.toFixed(3))
  }
)

// Búsqueda y Ordenación
const searchQuery = ref('')
const sortKey = ref('id')
const sortOrder = ref(-1) // Más reciente primero

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3500)
}

const fetchColaboradores = async () => {
  try {
    const res = await fetch('/api/colaboradores')
    if (res.ok) {
      colaboradores.value = await res.json()
      if (colaboradores.value.length > 0 && !form.value.colaborador_id && !isEditing.value) {
        const userMatched = colaboradores.value.find(c => c.nombre.toLowerCase() === (authStore.user?.usuario || '').toLowerCase())
        form.value.colaborador_id = userMatched ? userMatched.id : colaboradores.value[0].id
      }
    }
  } catch (error) {
    console.error('Error fetching colaboradores:', error)
  }
}

// Cargar Datos Iniciales de Procesos
const fetchInitialData = async () => {
  loadingData.value = true
  try {
    await fetchColaboradores()
    const resProd = await fetch('/api/productos')
    if (resProd.ok) {
      productos.value = await resProd.json()
    }
    const resProc = await fetch('/api/procesos')
    if (resProc.ok) {
      procesos.value = await resProc.json()
    } else {
      showAlert('Error al cargar historial de procesos', 'error')
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loadingData.value = false
  }
}

// Cargar Datos de Conversiones (Fraccionados)
const fetchFraccionados = async () => {
  loadingFraccionados.value = true
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
  } catch (error) {
    console.error('Error fetching fraccionados:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loadingFraccionados.value = false
  }
}

const refreshCurrentData = () => {
  if (activeTab.value === 'procesos') {
    fetchInitialData()
  } else {
    fetchFraccionados()
  }
}

const switchTab = (tab) => {
  activeTab.value = tab
  searchQuery.value = ''
  sortKey.value = 'id'
  sortOrder.value = -1
  
  if (tab === 'procesos') {
    resetForm()
    fetchInitialData()
  } else {
    resetFraccionadoForm()
    fetchFraccionados()
  }
}

// ==============================================
// CRUD: PROCESOS GENERALES
// ==============================================
const submitForm = async () => {
  if (!form.value.codigo) {
    showAlert('Debe seleccionar un producto válido', 'error')
    return
  }

  submitting.value = true
  const url = isEditing.value ? `/api/procesos/${editId.value}` : '/api/procesos'
  const method = isEditing.value ? 'PUT' : 'POST'

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    const dataRes = await res.json()

    if (res.ok) {
      showAlert(isEditing.value ? 'Proceso actualizado correctamente' : 'Proceso registrado exitosamente')
      resetForm()
      fetchInitialData()
    } else {
      showAlert(dataRes.error || 'Ocurrió un error al procesar la solicitud', 'error')
    }
  } catch (error) {
    console.error('Error saving process:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    submitting.value = false
  }
}

const loadProcesoToForm = (proceso) => {
  isEditing.value = true
  editId.value = proceso.id
  
  form.value = {
    colaborador_id: proceso.colaborador_id,
    proceso: proceso.proceso,
    fecha: proceso.fecha ? proceso.fecha.split('T')[0] : getTodayString(),
    codigo: proceso.codigo,
    piezas: proceso.piezas,
    peso_bruto: parseFloat(proceso.peso_bruto),
    recorte: parseFloat(proceso.recorte),
    decomiso: parseFloat(proceso.decomiso),
    kg_a_desc: parseFloat(proceso.kg_a_desc),
    kg_a_sumar: parseFloat(proceso.kg_a_sumar)
  }

  const matched = productos.value.find(p => p.codigo === proceso.codigo)
  productSearch.value = matched ? matched.codigo : proceso.codigo
  selectedMainProduct.value = matched || null
}

const cancelEdit = () => {
  resetForm()
}

const resetForm = () => {
  isEditing.value = false
  editId.value = null
  form.value = { 
    ...defaultForm, 
    fecha: getTodayString() 
  }
  if (colaboradores.value.length > 0) {
    const userMatched = colaboradores.value.find(c => c.nombre.toLowerCase() === (authStore.user?.usuario || '').toLowerCase())
    form.value.colaborador_id = userMatched ? userMatched.id : colaboradores.value[0].id
  }
  productSearch.value = ''
  selectedMainProduct.value = null
}

// ==============================================
// CRUD: CONVERTIR / FRACCIONADOS
// ==============================================
const submitFraccionadoForm = async () => {
  if (!fraccionadoForm.value.codigo_producto_original || !fraccionadoForm.value.codigo_fraccionado) {
    showAlert('Debe completar ambos productos (Origen y Destino)', 'error')
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
      resetFraccionadoForm()
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
  resetFraccionadoForm()
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

// ==============================================
// PROCESAMIENTO DE FRACCIONADOS
// ==============================================
const confirmProcesar = (item) => {
  itemToProcesar.value = item
}

const handleProcesar = async () => {
  if (!itemToProcesar.value) return

  processingFrac.value = true
  try {
    const res = await fetch(`/api/fraccionados/${itemToProcesar.value.id}/procesar`, {
      method: 'POST'
    })
    const dataRes = await res.json()

    if (res.ok) {
      showAlert(`Fraccionamiento exitoso: Se sumaron ${parseFloat(itemToProcesar.value.peso_a_fraccionar).toFixed(3)} kg al stock fraccionado de ${dataRes.productoDestinoActualizado?.nombre || itemToProcesar.value.codigo_fraccionado}`)
      itemToProcesar.value = null
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

// ==============================================
// ELIMINACIÓN GENERAL REUTILIZABLE
// ==============================================
const confirmDelete = (item) => {
  itemToDelete.value = item
}

const deleteItem = async () => {
  if (!itemToDelete.value) return

  const isProc = activeTab.value === 'procesos'
  const url = isProc ? `/api/procesos/${itemToDelete.value.id}` : `/api/fraccionados/${itemToDelete.value.id}`

  try {
    const res = await fetch(url, { method: 'DELETE' })
    if (res.ok) {
      showAlert('Registro eliminado correctamente')
      if (isProc) {
        fetchInitialData()
      } else {
        fetchFraccionados()
      }
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

// Auxiliares y Formateos
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

const getBadgeType = (tipo) => {
  if (tipo === 'Fraccionamiento') return 'badge-primary'
  if (tipo === 'Envasado') return 'badge-success'
  if (tipo === 'Picada') return 'badge-warning'
  if (tipo === 'Decomiso Directo') return 'badge-danger'
  return ''
}


// Búsqueda y Ordenación Reactiva - Procesos
const filteredAndSortedProcesos = computed(() => {
  let result = [...procesos.value]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => {
      const idMatch = p.id ? p.id.toString().includes(query) : false
      const colabName = p.Colaborador?.nombre || p.colaborador || ''
      const colabMatch = colabName.toLowerCase().includes(query)
      const procMatch = p.proceso ? p.proceso.toLowerCase().includes(query) : false
      const codMatch = p.codigo ? p.codigo.toLowerCase().includes(query) : false
      const prodNameMatch = p.Producto?.nombre ? p.Producto.nombre.toLowerCase().includes(query) : false
      return idMatch || colabMatch || procMatch || codMatch || prodNameMatch
    })
  }

  if (sortKey.value) {
    result.sort((a, b) => {
      let valA = a[sortKey.value]
      let valB = b[sortKey.value]

      if (sortKey.value === 'colaborador') {
        valA = a.Colaborador?.nombre || a.colaborador || ''
        valB = b.Colaborador?.nombre || b.colaborador || ''
      }

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

// Búsqueda y Ordenación Reactiva - Fraccionados
const filteredAndSortedFraccionados = computed(() => {
  let result = [...fraccionados.value]

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

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

onMounted(() => {
  fetchInitialData()
})
</script>

<style scoped>
.procesos-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-column {
  /* Scroll naturally in stacked layout */
}

.list-column {
  min-height: 300px;
}

/* Pestañas (Tabs) Estilo Retro */
.tabs {
  display: flex;
  border-bottom: 2px solid var(--bevel-dark);
  margin-bottom: 1rem;
}

.tab-btn {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--bevel-dark);
  border-bottom: none;
  background: var(--bg-secondary);
  color: var(--text-muted);
  cursor: pointer;
  font-weight: bold;
  font-size: 0.8rem;
  margin-right: 2px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: var(--bg-window);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--bg-window) !important;
  color: var(--text-primary) !important;
  border-color: var(--bevel-dark) var(--bevel-dark) transparent var(--bevel-dark);
  box-shadow: 1px -1px 0 var(--bevel-light) inset;
  margin-bottom: -1px;
  padding-top: 0.45rem;
  z-index: 2;
}

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

.dropdown-item {
  transition: background-color 0.15s ease;
}

.dropdown-item:hover {
  background-color: var(--accent-primary-hover) !important;
  color: var(--text-on-accent) !important;
}
</style>
