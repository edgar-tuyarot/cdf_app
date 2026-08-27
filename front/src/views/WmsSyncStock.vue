<template>
  <div class="page-container animate-fade">
    <!-- Encabezado -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-arrows-clockwise"></i> Sincronización de Stock con BlockWMS
        </h2>
        <p class="page-description">
          Sincronice el stock de los productos locales con las existencias registradas en el servidor externo BlockWMS.
        </p>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="ph ph-arrows-down-up"></i> Ejecutar Sincronización Masiva
        </h3>
      </div>
      <div class="card-body">
        <p class="mb-4 text-muted">
          Esta acción consultará el inventario actual en BlockWMS y actualizará los balances de stock de la base de datos de App CDF.
        </p>

        <div v-if="syncMessage" class="alert alert-success mb-4">
          <i class="ph ph-check-circle"></i> {{ syncMessage }}
        </div>
        <div v-if="syncError" class="alert alert-danger mb-4">
          <i class="ph ph-x-circle"></i> {{ syncError }}
        </div>

        <button type="button" class="btn btn-primary btn-lg" @click="runStockSync" :disabled="loadingSync">
          <i class="ph ph-spinner spinner" v-if="loadingSync"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Iniciar Sincronización Ahora
        </button>

        <div v-if="syncDetails" class="mt-4 p-3 bg-light rounded border">
          <h5 class="fw-bold mb-2"><i class="ph ph-receipt"></i> Resultado de la Sincronización</h5>
          <ul class="mb-0 text-sm">
            <li><strong>Productos Procesados:</strong> {{ syncDetails.totalProcesados || 0 }}</li>
            <li><strong>Stock Actualizado:</strong> {{ syncDetails.totalActualizados || 0 }}</li>
            <li><strong>Fecha y Hora:</strong> {{ new Date().toLocaleString() }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const loadingSync = ref(false)
const syncMessage = ref('')
const syncError = ref('')
const syncDetails = ref(null)

const getWmsHeaders = () => {
  const savedSession = localStorage.getItem('wms_session')
  if (!savedSession) return {}
  try {
    const sess = JSON.parse(savedSession)
    if (sess.sessionId) {
      return {
        'X-WMS-Session-Id': sess.sessionId,
        'X-WMS-Site-Id': sess.siteId || '194326',
        'X-WMS-Host': sess.host || 'http://192.168.10.2'
      }
    }
  } catch (e) {}
  return {}
}

const runStockSync = async () => {
  loadingSync.value = true
  syncMessage.value = ''
  syncError.value = ''
  syncDetails.value = null

  try {
    const res = await fetch('/api/wms/sync-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getWmsHeaders() }
    })
    const data = await res.json()
    if (data.wmsSession && data.wmsSession.sessionId) {
      localStorage.setItem('wms_session', JSON.stringify(data.wmsSession))
    }
    if (res.ok && data.ok) {
      syncMessage.value = data.mensaje || data.message || 'Sincronización de stock completada exitosamente.'
      syncDetails.value = data.report || data.detalles || data
    } else {
      throw new Error(data.error || 'Falla al ejecutar la sincronización de stock con BlockWMS.')
    }
  } catch (err) {
    syncError.value = err.message
  } finally {
    loadingSync.value = false
  }
}
</script>
