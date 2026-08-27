<template>
  <div class="page-container animate-fade">
    <!-- Encabezado -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <i class="ph ph-list-numbers"></i> Catálogo de Productos BlockWMS (JSON)
        </h2>
        <p class="page-description">
          Consulta externa del catálogo de artículos registrados en el servidor BlockWMS.
        </p>
      </div>
    </div>

    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
        <h3 class="card-title">
          <i class="ph ph-magnifying-glass"></i> Buscador de Productos WMS
        </h3>
        <button type="button" class="btn btn-sm btn-primary" @click="fetchWmsProducts" :disabled="loadingProducts">
          <i class="ph ph-spinner spinner" v-if="loadingProducts"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Lista
        </button>
      </div>
      <div class="card-body">
        <div class="form-group mb-4">
          <input 
            type="text" 
            v-model="searchQuery" 
            class="form-control" 
            placeholder="Buscar por código de producto o descripción..." 
          />
        </div>

        <div v-if="productsError" class="alert alert-danger mb-4">
          <i class="ph ph-x-circle"></i> {{ productsError }}
        </div>

        <div style="overflow-x: auto;">
          <table class="table table-bordered table-striped" style="font-size: 0.9rem;">
            <thead>
              <tr style="background-color: var(--bg-secondary);">
                <th style="width: 20%;">Código</th>
                <th style="width: 50%;">Descripción</th>
                <th style="width: 15%;">Stock Físico WMS</th>
                <th style="width: 15%;">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredProducts" :key="p.codigo">
                <td><strong>{{ p.codigo }}</strong></td>
                <td>{{ p.nombre }}</td>
                <td><span class="badge badge-info">{{ p.stockFisico || p.stock || 0 }} kg/un</span></td>
                <td>
                  <span class="badge" :class="p.activo !== false ? 'badge-success' : 'badge-danger'">
                    {{ p.activo !== false ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0 && !loadingProducts">
                <td colspan="4" class="text-center text-muted py-4">
                  No se encontraron productos registrados o coincidentes.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const loadingProducts = ref(false)
const productsError = ref('')
const productsList = ref([])
const searchQuery = ref('')

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

const fetchWmsProducts = async () => {
  loadingProducts.value = true
  productsError.value = ''
  try {
    const res = await fetch('/api/wms/productos', { headers: getWmsHeaders() })
    const data = await res.json()
    if (res.ok && data.ok) {
      productsList.value = data.productos || []
    } else {
      throw new Error(data.error || 'Error al obtener la lista de productos de BlockWMS.')
    }
  } catch (err) {
    productsError.value = err.message
  } finally {
    loadingProducts.value = false
  }
}

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return productsList.value
  const q = searchQuery.value.toLowerCase()
  return productsList.value.filter(p => 
    (p.codigo && p.codigo.toLowerCase().includes(q)) || 
    (p.nombre && p.nombre.toLowerCase().includes(q))
  )
})

onMounted(() => {
  fetchWmsProducts()
})
</script>
