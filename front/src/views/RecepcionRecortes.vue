<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Ingreso de Recortes</h2>
        <p class="page-description">Registra ingresos de recortes y mermas por sucursal de forma manual o cargando un archivo Excel para actualizar el stock.</p>
      </div>
    </div>

    <!-- Mensajes de Estado -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      <div class="alert-icon">
        <i class="ph ph-info" v-if="alert.type === 'info'"></i>
        <i class="ph ph-check-circle" v-if="alert.type === 'success'"></i>
        <i class="ph ph-warning-circle" v-if="alert.type === 'error'"></i>
      </div>
      <div class="alert-message">
        {{ alert.message }}
      </div>
      <button class="alert-close" @click="alert.show = false">
        <i class="ph ph-x"></i>
      </button>
    </div>

    <div class="grid-layout">
      <!-- Columna Izquierda: Formulario e Importador -->
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        
        <!-- Formulario de Registro (Izquierda) -->
        <div class="card">
          <div class="card-header" style="background-color: #0b5394;">
            <span class="card-title" style="color: white; font-weight: bold;">Formulario de Ingreso</span>
          </div>
          <div class="card-body">
            <form @submit.prevent="addItemToList">
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                
                <!-- Fila 1: Sucursal y Fecha -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label">Sucursal / Origen *</label>
                    <select 
                      v-model="form.id_sucursal" 
                      class="form-control" 
                      required 
                      style="height: 34px; padding: 0 0.5rem;"
                    >
                      <option :value="null" disabled>Seleccione Sucursal</option>
                      <option v-for="suc in sucursales" :key="suc.id" :value="suc.id">
                        {{ suc.sucursal }} {{ suc.numero ? `(${suc.numero})` : '' }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Fecha de Ingreso *</label>
                    <input 
                      type="date" 
                      v-model="form.fecha" 
                      class="form-control" 
                      required 
                      style="height: 34px;"
                    />
                  </div>
                </div>

                <!-- Fila 2: Producto Searchable Datalist -->
                <div class="form-group">
                  <label class="form-label">Producto *</label>
                  <div style="position: relative; display: flex; align-items: center;">
                    <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
                    <input 
                      type="text" 
                      v-model="productSearchInput" 
                      list="catalog-products-list" 
                      @input="handleProductInput" 
                      class="form-control" 
                      placeholder="Escribe código o nombre del producto para buscar..." 
                      required 
                      style="padding-left: 2rem; height: 34px;"
                    />
                  </div>
                  <datalist id="catalog-products-list">
                    <option 
                      v-for="p in catalogProducts" 
                      :key="p.codigo" 
                      :value="p.codigo"
                    >
                      {{ p.nombre }}
                    </option>
                  </datalist>
                  
                  <!-- Vista previa del producto seleccionado -->
                  <div 
                    v-if="selectedProduct" 
                    class="selected-product-badge mt-2 animate-fade"
                  >
                    <i class="ph ph-circle-wavy-check text-green" style="font-size: 1rem;"></i>
                    <span>
                      Seleccionado: <strong>{{ selectedProduct.nombre }}</strong> (Código: <strong>{{ selectedProduct.codigo }}</strong>)
                    </span>
                  </div>
                </div>

                <!-- Fila 3: Peso (kg) -->
                <div class="form-group">
                  <label class="form-label">Peso del Recorte (kg) *</label>
                  <div style="position: relative; display: flex; align-items: center;">
                    <input 
                      type="number" 
                      step="0.001" 
                      min="0.001" 
                      v-model.number="form.peso" 
                      class="form-control text-right font-mono text-xl" 
                      placeholder="0,000" 
                      required 
                      style="padding-right: 2.5rem; font-weight: bold; height: 40px;"
                    />
                    <span style="position: absolute; right: 0.8rem; font-weight: bold; color: var(--text-muted);">kg</span>
                  </div>
                </div>

                <!-- Botón Agregar a la lista temporal -->
                <div style="margin-top: 0.5rem; display: flex; justify-content: flex-end;">
                  <button 
                    type="submit" 
                    class="btn btn-secondary btn-lg" 
                    style="width: 100%; height: 42px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: bold; font-size: 0.95rem; border: 1px dashed #0b5394; color: #0b5394; background-color: rgba(11, 83, 148, 0.05);"
                  >
                    <i class="ph ph-plus-circle"></i>
                    Agregar a la Lista de Envíos
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>

        <!-- Carga Masiva desde Excel (Nuevo) -->
        <div class="card animate-fade">
          <div class="card-header" style="background-color: #1e6ec8;">
            <span class="card-title" style="color: white; font-weight: bold;">Carga Masiva desde Excel</span>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.4;">
                Sube un archivo Excel <strong>.xlsx</strong> o <strong>.xls</strong> con las columnas:
                <span style="background-color: var(--bg-secondary); color: var(--text-primary); font-size: 0.75rem; border: 1px solid var(--bevel-dark); padding: 1px 4px; font-family: monospace; border-radius: 2px;">codigo_entidades</span>,
                <span style="background-color: var(--bg-secondary); color: var(--text-primary); font-size: 0.75rem; border: 1px solid var(--bevel-dark); padding: 1px 4px; font-family: monospace; border-radius: 2px;">codigo</span> y
                <span style="background-color: var(--bg-secondary); color: var(--text-primary); font-size: 0.75rem; border: 1px solid var(--bevel-dark); padding: 1px 4px; font-family: monospace; border-radius: 2px;">cantidad_original</span>.
              </p>

              <!-- Zona de Carga -->
              <div 
                v-if="!excelFile"
                style="border: 2px dashed #1e6ec8; padding: 1.5rem; text-align: center; background: rgba(30, 110, 200, 0.03); display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; position: relative;"
              >
                <i class="ph ph-file-xls" style="font-size: 2.5rem; color: #1e6ec8;"></i>
                <span style="font-size: 0.85rem; font-weight: bold; color: #1e6ec8;">Arrastra tu archivo aquí o haz clic para buscar</span>
                <span style="font-size: 0.7rem; color: var(--text-muted);">Soporta formatos (.xlsx, .xls)</span>
                <input type="file" accept=".xlsx, .xls" @change="handleExcelUpload" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" />
              </div>

              <!-- Vista previa y Resultados del Excel -->
              <div v-else class="animate-fade" style="display: flex; flex-direction: column; gap: 0.75rem;">
                
                <!-- Detalles del archivo y contadores -->
                <div style="background-color: var(--bg-secondary); border: 1px solid var(--bevel-dark); padding: 0.5rem 0.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; box-shadow: var(--inset-shadow);">
                  <div style="font-size: 0.8rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">
                    <i class="ph ph-file-xls text-green" style="font-size: 1rem; vertical-align: middle;"></i> {{ excelFile.name }}
                  </div>
                  <div style="display: flex; gap: 0.35rem;">
                    <span class="badge" style="background-color: #2b3e50; color: white;">Total: {{ excelSummary.total }}</span>
                    <span class="badge" style="background-color: #38761d; color: white;">Válidos: {{ excelSummary.valid }}</span>
                    <span class="badge" v-if="excelSummary.errors > 0" style="background-color: #cc0000; color: white;">Errores: {{ excelSummary.errors }}</span>
                  </div>
                </div>

                <!-- Tabla de vista previa -->
                <div class="table-container" style="max-height: 180px; overflow-y: auto; border: 1px solid var(--bevel-dark);">
                  <table style="width: 100%;">
                    <thead>
                      <tr>
                        <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem; width: 35px;">Fila</th>
                        <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem;">Sucursal</th>
                        <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem;">Producto</th>
                        <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem; text-align: right; width: 70px;">Peso</th>
                        <th style="font-size: 0.7rem; padding: 0.25rem 0.4rem; text-align: center; width: 100px;">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in parsedRecords" :key="r.index">
                        <td style="font-size: 0.7rem; padding: 0.25rem 0.4rem; text-align: center; font-weight: bold;">{{ r.index }}</td>
                        <td style="font-size: 0.7rem; padding: 0.25rem 0.4rem; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          <span v-if="r.sucursal" :title="r.sucursal.sucursal">
                            {{ r.sucursal.sucursal }} {{ r.sucursal.numero ? `(${r.sucursal.numero})` : '' }}
                          </span>
                          <span v-else class="text-red fw-bold" :title="'Código origen: ' + r.rawBranch">
                            Desconocido ({{ r.rawBranch }})
                          </span>
                        </td>
                        <td style="font-size: 0.7rem; padding: 0.25rem 0.4rem; max-width: 105px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          <span v-if="r.producto" :title="r.producto.nombre">
                            <strong>{{ r.producto.codigo }}</strong> - {{ r.producto.nombre }}
                          </span>
                          <span v-else class="text-red fw-bold" :title="'Código producto: ' + r.rawProduct">
                            Desconocido ({{ r.rawProduct }})
                          </span>
                        </td>
                        <td style="font-size: 0.7rem; padding: 0.25rem 0.4rem; text-align: right; font-weight: bold; font-family: monospace;">
                          {{ r.rawWeight.toFixed(3) }} kg
                        </td>
                        <td style="font-size: 0.65rem; padding: 0.25rem 0.4rem; text-align: center;">
                          <span 
                            :style="{
                              backgroundColor: r.isValid ? '#d4edda' : '#f8d7da',
                              color: r.isValid ? '#155724' : '#721c24',
                              border: '1px solid ' + (r.isValid ? '#c3e6cb' : '#f5c6cb'),
                              padding: '1px 5px',
                              fontWeight: 'bold',
                              borderRadius: '2px',
                              display: 'inline-block'
                            }"
                          >
                            {{ r.statusText }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Acciones de carga -->
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.25rem;">
                  <button class="btn btn-secondary" @click="clearExcelImport" style="font-weight: bold; height: 32px; padding: 0 0.75rem; font-size: 0.8rem;">
                    Cancelar
                  </button>
                  <button 
                    class="btn btn-primary" 
                    @click="loadValidRowsToBatch" 
                    :disabled="excelSummary.valid === 0"
                    style="background-color: var(--accent-success); border-color: var(--accent-success-hover); font-weight: bold; height: 32px; padding: 0 0.75rem; font-size: 0.8rem; display: flex; align-items: center; gap: 0.25rem;"
                  >
                    <i class="ph ph-list-plus"></i> Cargar {{ excelSummary.valid }} válidos al lote
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>

      <!-- Sección Derecha: Lote a enviar e Historial de la sesión -->
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        
        <!-- Lista de Ingresos Preparados (Lote temporal) -->
        <div class="card">
          <div class="card-header" style="background-color: var(--color-primary, #2b3e50); display: flex; justify-content: space-between; align-items: center;">
            <span class="card-title" style="color: white; font-weight: bold;">Lote Preparado (Pendiente de Guardar)</span>
            <span class="badge" style="background-color: white; color: var(--color-primary, #2b3e50); font-weight: bold;">
              {{ pendingList.length }} ítems
            </span>
          </div>
          <div class="table-container" style="max-height: 250px; overflow-y: auto;">
            <table>
              <thead>
                <tr>
                  <th style="font-size: 0.75rem;">Sucursal</th>
                  <th style="font-size: 0.75rem;">Producto</th>
                  <th style="font-size: 0.75rem; text-align: right;">Peso</th>
                  <th style="font-size: 0.75rem; text-align: center; width: 60px;">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in pendingList" :key="index" class="animate-fade">
                  <td style="font-size: 0.75rem;">{{ item.sucursal_nombre }}</td>
                  <td style="font-size: 0.75rem; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <strong>{{ item.id_producto }}</strong> - {{ item.producto_nombre }}
                  </td>
                  <td style="font-size: 0.75rem; text-align: right;" class="fw-bold">
                    {{ item.peso_recorte.toFixed(3) }} kg
                  </td>
                  <td style="font-size: 0.75rem; text-align: center;">
                    <button class="btn-icon btn-delete" style="padding: 2px;" @click="removeItemFromList(index)" title="Quitar">
                      <i class="ph ph-minus-circle" style="font-size: 1.1rem; color: #cc0000;"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="pendingList.length === 0">
                  <td colspan="4" class="empty-state" style="padding: 2.5rem 1rem;">
                    <i class="ph ph-list-plus icon-xl mb-2" style="color: var(--text-muted); opacity: 0.6;"></i>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">No hay registros en el lote. Completa el formulario o sube un Excel.</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-if="pendingList.length > 0" class="card-footer" style="padding: 0.75rem 1rem; background-color: var(--bg-secondary); border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
            <button 
              class="btn btn-primary" 
              @click="submitBatch" 
              :disabled="saving"
              style="height: 38px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: bold; width: 100%;"
            >
              <i class="ph ph-spinner spinner" v-if="saving"></i>
              <i class="ph ph-cloud-arrow-up" v-else></i>
              {{ saving ? 'Guardando Lote...' : 'Confirmar e Ingresar Lote Completo' }}
            </button>
          </div>
        </div>

        <!-- Historial General de Ingresos -->
        <div class="card">
          <div class="card-header" style="background-color: var(--color-primary, #2b3e50); display: flex; justify-content: space-between; align-items: center;">
            <span class="card-title" style="color: white; font-weight: bold;">Historial de Ingresos de Recortes</span>
            <button class="btn btn-secondary btn-sm" @click="fetchIngresosHistory" :disabled="loadingHistory" style="height: 24px; padding: 0 0.5rem; font-size: 0.7rem; border-color: rgba(255,255,255,0.3); color: white; background: rgba(255,255,255,0.1);">
              <i class="ph ph-spinner spinner" v-if="loadingHistory"></i>
              <i class="ph ph-arrows-clockwise" v-else></i>
            </button>
          </div>
          <div class="table-container" style="max-height: 280px; overflow-y: auto;">
            <table>
              <thead>
                <tr>
                  <th style="font-size: 0.75rem;">Fecha</th>
                  <th style="font-size: 0.75rem;">Sucursal</th>
                  <th style="font-size: 0.75rem;">Producto</th>
                  <th style="font-size: 0.75rem; text-align: right;">Peso</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in historyList" :key="item.id || index" class="animate-fade">
                  <td style="font-size: 0.75rem;">{{ formatDate(item.fecha) }}</td>
                  <td style="font-size: 0.75rem;">
                    {{ item.Sucursal ? `${item.Sucursal.sucursal} ${item.Sucursal.numero ? `(${item.Sucursal.numero})` : ''}` : 'Desconocido' }}
                  </td>
                  <td style="font-size: 0.75rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="item.Producto ? item.Producto.nombre : ''">
                    <strong>{{ item.id_producto }}</strong> - {{ item.Producto ? item.Producto.nombre : 'Desconocido' }}
                  </td>
                  <td style="font-size: 0.75rem; text-align: right;" class="text-red fw-bold">
                    {{ parseFloat(item.peso_recorte).toFixed(3) }} kg
                  </td>
                </tr>
                <tr v-if="historyList.length === 0">
                  <td colspan="4" class="empty-state" style="padding: 2.5rem 1rem;">
                    <i class="ph ph-clock-counter-clockwise icon-xl mb-2" style="color: var(--text-muted); opacity: 0.6;"></i>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">No hay ingresos de recortes registrados en el historial.</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as XLSX from 'xlsx'

// Estado del formulario manual
const form = ref({
  id_sucursal: null,
  fecha: new Date().toISOString().split('T')[0],
  codigo: '',
  peso: null
})

const productSearchInput = ref('')
const selectedProduct = ref(null)

// Catálogos e Historiales
const catalogProducts = ref([])
const sucursales = ref([])
const pendingList = ref([])
const historyList = ref([])
const loadingHistory = ref(false)

const saving = ref(false)
const alert = ref({ show: false, message: '', type: 'success' })

// Estado del Importer Excel
const excelFile = ref(null)
const parsedRecords = ref([])
const excelSummary = ref({ total: 0, valid: 0, errors: 0 })

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 5000)
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

// Cargar catálogo de sucursales
const fetchSucursales = async () => {
  try {
    const res = await fetch('/api/sucursales')
    if (res.ok) {
      sucursales.value = await res.json()
      if (sucursales.value.length > 0) {
        form.value.id_sucursal = sucursales.value[0].id
      }
    }
  } catch (error) {
    console.error('Error fetching sucursales:', error)
  }
}

// Escuchar cambios en la búsqueda del producto
const handleProductInput = () => {
  const code = productSearchInput.value.trim()
  const found = catalogProducts.value.find(p => p.codigo === code)
  if (found) {
    selectedProduct.value = found
    form.value.codigo = found.codigo
  } else {
    selectedProduct.value = null
    form.value.codigo = ''
  }
}

// Agregar ítem actual a la lista temporal
const addItemToList = () => {
  if (!form.value.id_sucursal) {
    showAlert('Por favor, selecciona una sucursal de origen.', 'error')
    return
  }

  if (!form.value.codigo) {
    showAlert('Por favor, selecciona un producto válido del catálogo.', 'error')
    return
  }

  if (!form.value.peso || form.value.peso <= 0) {
    showAlert('El peso del recorte debe ser mayor a 0 kg.', 'error')
    return
  }

  const selectedSuc = sucursales.value.find(s => s.id === form.value.id_sucursal)
  const selectedProd = catalogProducts.value.find(p => p.codigo === form.value.codigo)

  // Agregar al lote
  pendingList.value.push({
    id_sucursal: form.value.id_sucursal,
    sucursal_nombre: selectedSuc ? `${selectedSuc.sucursal} ${selectedSuc.numero ? `(${selectedSuc.numero})` : ''}` : 'Desconocido',
    id_producto: form.value.codigo,
    producto_nombre: selectedProd ? selectedProd.nombre : 'Desconocido',
    peso_recorte: parseFloat(form.value.peso),
    fecha: form.value.fecha
  })

  // Limpiar campos de producto y peso para la siguiente carga, reteniendo sucursal y fecha
  form.value.peso = null
  form.value.codigo = ''
  productSearchInput.value = ''
  selectedProduct.value = null

  showAlert('Registro agregado al lote preparado.', 'info')
}

// Quitar un ítem de la lista temporal
const removeItemFromList = (index) => {
  pendingList.value.splice(index, 1)
  showAlert('Registro removido del lote.', 'info')
}

// Enviar todo el lote preparado al backend
const submitBatch = async () => {
  if (pendingList.value.length === 0) {
    showAlert('No hay registros en el lote para guardar.', 'error')
    return
  }

  saving.value = true
  try {
    const res = await fetch('/api/ingreso-recortes/masivo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pendingList.value)
    })

    const data = await res.json()

    if (res.ok) {
      showAlert(`Lote de recortes guardado con éxito. Se procesaron ${pendingList.value.length} registros y se actualizó el stock.`)
      
      // Limpiar lote
      pendingList.value = []
      
      // Cargar historial de base de datos actualizado
      await fetchIngresosHistory()
    } else {
      showAlert(data.error || 'Error al guardar el lote de recortes', 'error')
    }
  } catch (error) {
    console.error('Error saving batch of recortes:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    saving.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

const fetchIngresosHistory = async () => {
  loadingHistory.value = true
  try {
    const res = await fetch('/api/ingreso-recortes')
    if (res.ok) {
      historyList.value = await res.json()
    } else {
      console.error('Error al obtener el historial de recortes')
    }
  } catch (error) {
    console.error('Error fetching recortes history:', error)
  } finally {
    loadingHistory.value = false
  }
}

// ==========================================
// CONTROLADORES Y LÓGICA DE EXCEL PARSER
// ==========================================
const handleExcelUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return

  excelFile.value = file
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const data = new Uint8Array(event.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      processExcelData(jsonData)
    } catch (err) {
      console.error('Error al procesar archivo Excel:', err)
      showAlert('Error al procesar el archivo Excel. Asegúrate de que sea un archivo válido.', 'error')
      clearExcelImport()
    }
  }
  reader.readAsArrayBuffer(file)
}

const processExcelData = (rows) => {
  const records = []
  let validCount = 0
  let errorCount = 0

  rows.forEach((row, index) => {
    // Exact column matchers
    const rawProdCode = row['codigo'] !== undefined ? row['codigo'] : (row['codigos_productos'] !== undefined ? row['codigos_productos'] : row['codigo_producto']);
    const rawWeight = row['cantidad_original'] !== undefined ? row['cantidad_original'] : (row['cantidad'] !== undefined ? row['cantidad'] : row['peso']);
    const rawBranch = row['codigo_entidades'] !== undefined ? row['codigo_entidades'] : row['codigo_entidad'];

    const prodCode = rawProdCode ? String(rawProdCode).trim() : ''
    const weightVal = rawWeight ? parseFloat(rawWeight) : 0
    const branchVal = rawBranch ? String(rawBranch).trim() : ''

    // Match branch code / entity to active sucursales
    // Rule: codigo_entidades maps to sucursal number (numero) or id
    let matchedSucursal = null
    if (branchVal) {
      // Find by sucursal number first, fall back to id
      matchedSucursal = sucursales.value.find(s => String(s.numero) === branchVal || String(s.id) === branchVal)
    }

    // Match product catalog code
    let matchedProduct = null
    if (prodCode) {
      matchedProduct = catalogProducts.value.find(p => String(p.codigo).toLowerCase() === prodCode.toLowerCase())
    }

    // Determine row status
    let statusText = 'Válido'
    let isValid = true

    if (!branchVal || !matchedSucursal) {
      statusText = 'Sucursal no encontrada'
      isValid = false
    } else if (!prodCode || !matchedProduct) {
      statusText = 'Producto no encontrado'
      isValid = false
    } else if (isNaN(weightVal) || weightVal <= 0) {
      statusText = 'Peso inválido'
      isValid = false
    }

    if (isValid) {
      validCount++
    } else {
      errorCount++
    }

    records.push({
      index: index + 2, // Excel rows are 1-indexed, headers are row 1
      rawBranch: branchVal || '(Vacío)',
      rawProduct: prodCode || '(Vacío)',
      rawWeight: isNaN(weightVal) ? 0 : weightVal,
      sucursal: matchedSucursal,
      producto: matchedProduct,
      isValid,
      statusText
    })
  })

  parsedRecords.value = records
  excelSummary.value = {
    total: rows.length,
    valid: validCount,
    errors: errorCount
  }
}

const loadValidRowsToBatch = () => {
  const validRecords = parsedRecords.value.filter(r => r.isValid)
  if (validRecords.length === 0) {
    showAlert('No hay registros válidos para cargar en el lote.', 'error')
    return
  }

  validRecords.forEach(r => {
    pendingList.value.push({
      id_sucursal: r.sucursal.id,
      sucursal_nombre: `${r.sucursal.sucursal} ${r.sucursal.numero ? `(${r.sucursal.numero})` : ''}`,
      id_producto: r.producto.codigo,
      producto_nombre: r.producto.nombre,
      peso_recorte: r.rawWeight,
      fecha: form.value.fecha
    })
  })

  showAlert(`Se cargaron ${validRecords.length} registros válidos al lote preparado exitosamente.`, 'success')
  clearExcelImport()
}

const clearExcelImport = () => {
  excelFile.value = null
  parsedRecords.value = []
  excelSummary.value = { total: 0, valid: 0, errors: 0 }
}

onMounted(() => {
  fetchCatalogProducts()
  fetchSucursales()
  fetchIngresosHistory()
})
</script>

<script>
export default {
  name: 'RecepcionRecortes'
}
</script>

<style scoped>
.grid-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .grid-layout {
    grid-template-columns: 5fr 6fr;
  }
}

.selected-product-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background-color: var(--accent-success-light);
  border: 1px solid var(--accent-success);
  font-size: 0.8rem;
  color: var(--text-primary);
  margin-top: 0.5rem;
}

.font-mono {
  font-family: 'Courier New', Courier, monospace;
}

.text-xl {
  font-size: 1.25rem;
}

.text-red {
  color: #cc0000;
}

.fw-bold {
  font-weight: bold;
}
</style>
