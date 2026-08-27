<template>
  <div class="page-container animate-fade">
    <!-- Encabezado -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-bug"></i> Inspección RAW & Parseo de Stock PHP
        </h2>
        <p class="page-description">
          Prueba de descarga y parseo de Excel <code>.xlsx</code> en tiempo real desde <code>192.168.10.2</code>.
        </p>
      </div>
      <div class="header-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button 
          class="btn" 
          :class="selectedEndpoint === 'excel_export.php' ? 'btn-primary' : 'btn-secondary'" 
          @click="changeEndpoint('excel_export.php')" 
          :disabled="loading"
        >
          <i class="ph ph-file-excel"></i> Probar excel_export.php (Parseo JSON)
        </button>
        <button 
          class="btn" 
          :class="selectedEndpoint === 'block_reporte_stock.php' ? 'btn-primary' : 'btn-secondary'" 
          @click="changeEndpoint('block_reporte_stock.php')" 
          :disabled="loading"
        >
          <i class="ph ph-layout"></i> Probar block_reporte_stock.php
        </button>
      </div>
    </div>

    <!-- Banner de Resultado de Parseo de Excel -->
    <div v-if="responseInfo && responseInfo.totalParsedItems > 0 && !loading" class="mb-4">
      <div class="alert alert-success" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <i class="ph ph-table" style="font-size: 2rem;"></i>
          <div>
            <h4 class="mb-0 fw-bold" style="font-size: 1.1rem; color: #155724;">
              ¡Excel Parseado Exitosamente a JSON!
            </h4>
            <p class="mb-0 text-sm">
              Se descargó el archivo y se extrajeron <strong>{{ responseInfo.totalParsedItems }} productos</strong> en {{ responseInfo.durationMs }} ms.
            </p>
          </div>
        </div>
        <a 
          v-if="responseInfo.excelFileUrl" 
          :href="responseInfo.excelFileUrl" 
          target="_blank" 
          class="btn btn-sm btn-secondary"
        >
          <i class="ph ph-download-simple"></i> Descargar .xlsx Original
        </a>
      </div>
    </div>

    <!-- Banner de Estado de Sesión PHP -->
    <div v-if="responseInfo && !loading" class="mb-4">
      <div v-if="responseInfo.isSessionValid" class="alert alert-info-retro" style="display: flex; align-items: center; gap: 0.75rem;">
        <i class="ph ph-check-circle" style="font-size: 1.5rem;"></i>
        <div>
          <strong>Sesión PHP Válida:</strong> {{ responseInfo.sessionStatusMessage }}
        </div>
      </div>

      <div v-else-if="!responseInfo.hasSessionConfigured" class="alert alert-warning" style="display: flex; align-items: center; gap: 0.75rem;">
        <i class="ph ph-warning" style="font-size: 1.5rem;"></i>
        <div>
          <strong>Sesión no configurada:</strong> {{ responseInfo.sessionStatusMessage }}
          <br />
          <small>Edite el archivo <code>.env</code> en el backend e ingrese <code>PHP_SESSION_ID=&lt;TU_SESSION_ID&gt;</code> para probar con sesión activa.</small>
        </div>
      </div>

      <div v-else class="alert alert-danger" style="display: flex; align-items: center; gap: 0.75rem;">
        <i class="ph ph-x-circle" style="font-size: 1.5rem;"></i>
        <div>
          <strong>Sesión PHP Inválida o Expirada:</strong> {{ responseInfo.sessionStatusMessage }}
          <br />
          <small>Obtenga una nueva cookie <code>PHPSESSID</code> desde su navegador e insértela en el archivo <code>.env</code> del backend.</small>
        </div>
      </div>
    </div>

    <!-- Panel de Detalles HTTP -->
    <div class="card mb-4">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h3 class="card-title">
          <i class="ph ph-sliders"></i> Detalles de Petición ({{ selectedEndpoint }})
        </h3>
        <span class="badge badge-secondary" v-if="responseInfo">
          {{ responseInfo.durationMs }} ms
        </span>
      </div>
      <div class="card-body">
        <div class="info-grid">
          <div>
            <strong>URL Destino (PHP):</strong>
            <br />
            <code class="url-badge">{{ responseInfo?.targetUrl || `http://192.168.10.2/${selectedEndpoint}` }}</code>
          </div>
          <div>
            <strong>Estado HTTP:</strong>
            <br />
            <span v-if="!responseInfo" class="text-muted">Sin ejecutar</span>
            <span v-else-if="responseInfo.ok" class="badge badge-success" style="font-size: 1rem;">
              {{ responseInfo.status }} {{ responseInfo.statusText }}
            </span>
            <span v-else class="badge badge-danger" style="font-size: 1rem;">
              {{ responseInfo.status || 'ERROR' }} {{ responseInfo.statusText || responseInfo.error }}
            </span>
          </div>
          <div>
            <strong>Ítems Extraídos:</strong>
            <br />
            <span v-if="responseInfo?.totalParsedItems > 0" class="badge badge-success" style="font-size: 1rem;">
              {{ responseInfo.totalParsedItems }} registros
            </span>
            <span v-else class="text-muted">0</span>
          </div>
          <div>
            <strong>Cookie PHPSESSID:</strong>
            <br />
            <span v-if="responseInfo?.hasSessionConfigured" class="badge badge-info-retro">
              <i class="ph ph-lock"></i> Enviada en Header (Oculta)
            </span>
            <span v-else class="badge badge-warning">
              <i class="ph ph-warning"></i> No configurada
            </span>
          </div>
        </div>

        <details class="mt-3">
          <summary class="cursor-pointer font-bold text-muted">
            Ver Parámetros GET Enviados
          </summary>
          <pre class="code-block mt-2">{{ JSON.stringify(requestParams, null, 2) }}</pre>
        </details>
      </div>
    </div>

    <!-- Estado de Carga -->
    <div v-if="loading" class="card p-4 text-center">
      <i class="ph ph-spinner spinner icon-xl mb-2"></i>
      <p class="mb-0 fw-bold">Consultando {{ selectedEndpoint }} y procesando archivo Excel en Node.js...</p>
      <small class="text-muted">Por favor espere (Timeout máximo: 15s)</small>
    </div>

    <!-- Error de Conexión / Red -->
    <div v-else-if="errorMessage" class="card border-danger mb-4">
      <div class="card-header bg-danger text-white">
        <h3 class="card-title">
          <i class="ph ph-warning-circle"></i> Falla en la Comunicación
        </h3>
      </div>
      <div class="card-body">
        <p class="fw-bold text-danger">{{ errorMessage }}</p>
        <div v-if="errorDetails" class="alert alert-warning mb-0">
          <strong>Detalles del diagnóstico:</strong> {{ errorDetails }}
        </div>
      </div>
    </div>

    <!-- Pestañas de Resultados -->
    <div v-if="responseInfo && !loading" class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div style="display: flex; gap: 0.5rem;">
          <button 
            v-if="responseInfo.parsedItems && responseInfo.parsedItems.length > 0"
            class="btn btn-sm" 
            :class="viewMode === 'parsed' ? 'btn-primary' : 'btn-secondary'" 
            @click="viewMode = 'parsed'"
          >
            <i class="ph ph-table"></i> Productos JSON ({{ responseInfo.totalParsedItems }})
          </button>
          <button 
            class="btn btn-sm" 
            :class="viewMode === 'raw' ? 'btn-primary' : 'btn-secondary'" 
            @click="viewMode = 'raw'"
          >
            <i class="ph ph-code"></i> Respuesta HTML RAW
          </button>
          <button 
            class="btn btn-sm" 
            :class="viewMode === 'preview' ? 'btn-primary' : 'btn-secondary'" 
            @click="viewMode = 'preview'"
          >
            <i class="ph ph-eye"></i> Vista Renderizada
          </button>
        </div>
      </div>

      <div class="card-body">
        <!-- VISTA: TABLA DE PRODUCTOS PARSEADOS DESDE EXCEL -->
        <div v-if="viewMode === 'parsed' && responseInfo.parsedItems">
          <div style="display: flex; justify-content: space-between; align-items: center;" class="mb-3">
            <span class="fw-bold text-muted">Muestra de Productos Parseados desde el .xlsx (Primeros {{ Math.min(50, responseInfo.parsedItems.length) }} registros):</span>
            <button class="btn btn-sm btn-secondary" @click="copyParsedToClipboard">
              <i class="ph ph-copy"></i> Copiar JSON al portapapeles
            </button>
          </div>

          <div style="max-height: 500px; overflow: auto; border: 1px solid var(--bevel-light);">
            <table class="table table-bordered table-striped" style="font-size: 0.85rem; width: 100%;">
              <thead>
                <tr style="background-color: var(--bg-secondary);">
                  <th v-for="(val, colName) in responseInfo.parsedItems[0]" :key="colName" style="white-space: nowrap;">
                    {{ colName }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in responseInfo.parsedItems.slice(0, 50)" :key="idx">
                  <td v-for="(val, colName) in item" :key="colName" style="white-space: nowrap;">
                    {{ val }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- VISTA: CÓDIGO HTML RAW -->
        <div v-else-if="viewMode === 'raw'">
          <div style="display: flex; justify-content: space-between; align-items: center;" class="mb-2">
            <span class="text-xs text-muted fw-bold">Cuerpo de la Respuesta PHP (sin procesar):</span>
            <button class="btn btn-sm btn-secondary" @click="copyToClipboard">
              <i class="ph ph-copy"></i> Copiar al portapapeles
            </button>
          </div>
          <pre class="raw-response-box">{{ responseDataRaw }}</pre>
        </div>

        <!-- VISTA: RENDERIZADO HTML -->
        <div v-else-if="viewMode === 'preview'">
          <div class="alert alert-info mb-2 text-xs">
            <i class="ph ph-info"></i> Previsualización devuelta por el servidor PHP.
          </div>
          <div class="html-preview-box" v-html="responseDataRaw"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const loading = ref(false)
const selectedEndpoint = ref('excel_export.php')
const responseInfo = ref(null)
const responseDataRaw = ref('')
const errorMessage = ref('')
const errorDetails = ref('')
const viewMode = ref('parsed') // 'parsed' | 'raw' | 'preview'

const requestParams = {
  id_ordenes: '',
  accion: 'listar',
  filtro: '',
  h_trFiltros: '0',
  codigo_productos: '',
  lote: '',
  localidad_to_lote: '',
  serie: '',
  fecha_desde: '1900-01-01',
  fecha_hasta: '1900-01-01',
  stock_desde: '',
  stock_hasta: '',
  id_entidades_sites: '194326',
  id_layout_grupos_tipos: '0',
  codigo_layout_grupos: '',
  codigo_contenedores: '',
  custom2: '',
  custom3: '',
  custom4: '',
  custom5: ''
}

const changeEndpoint = (endpoint) => {
  selectedEndpoint.value = endpoint
  fetchStockDebug()
}

const fetchStockDebug = async () => {
  loading.value = true
  errorMessage.value = ''
  errorDetails.value = ''
  
  try {
    const res = await fetch(`/api/stock/debug?endpoint=${encodeURIComponent(selectedEndpoint.value)}`)
    const json = await res.json()
    
    responseInfo.value = json
    
    if (json.parsedItems && json.parsedItems.length > 0) {
      viewMode.value = 'parsed'
    } else {
      viewMode.value = 'raw'
    }

    if (json.data !== undefined && json.data !== null) {
      responseDataRaw.value = typeof json.data === 'object' 
        ? JSON.stringify(json.data, null, 2) 
        : String(json.data)
    } else {
      responseDataRaw.value = '(Cuerpo de respuesta vacío)'
    }

    if (!json.ok && json.error) {
      errorMessage.value = json.error
      errorDetails.value = json.details || ''
    }
  } catch (err) {
    console.error('Error al llamar a /api/stock/debug:', err)
    errorMessage.value = err.message || 'Error al comunicarse con la API de Node.js'
    errorDetails.value = 'Asegúrese de que el servidor backend de Node.js esté en ejecución.'
  } finally {
    loading.value = false
  }
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(responseDataRaw.value)
    .then(() => alert('Respuesta RAW copiada al portapapeles.'))
    .catch(err => console.error('Error al copiar:', err))
}

const copyParsedToClipboard = () => {
  if (responseInfo.value && responseInfo.value.parsedItems) {
    navigator.clipboard.writeText(JSON.stringify(responseInfo.value.parsedItems, null, 2))
      .then(() => alert('Lista de productos JSON copiada al portapapeles.'))
      .catch(err => console.error('Error al copiar:', err))
  }
}

onMounted(() => {
  fetchStockDebug()
})
</script>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.url-badge {
  background-color: var(--bg-secondary, #f0f0f0);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  word-break: break-all;
}

.code-block {
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 1rem;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.85rem;
  max-height: 250px;
  overflow: auto;
}

.raw-response-box {
  background-color: #1b1d22;
  color: #a9b7c6;
  padding: 1.25rem;
  border-radius: 6px;
  border: 1px solid #323742;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.88rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 600px;
  overflow-y: auto;
}

.html-preview-box {
  background-color: white;
  color: black;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-height: 600px;
  overflow: auto;
}

.cursor-pointer {
  cursor: pointer;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
}

.alert-info-retro {
  background-color: #d9edf7;
  color: #31708f;
  border: 1px solid #bce8f1;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
}

.badge-info-retro {
  background-color: #d9edf7;
  color: #31708f;
  border: 1px solid #bce8f1;
}

.border-danger {
  border-color: #dc3545 !important;
}

.bg-danger {
  background-color: #dc3545 !important;
}

.text-danger {
  color: #dc3545 !important;
}

.badge-danger {
  background-color: #dc3545;
  color: white;
}
</style>
