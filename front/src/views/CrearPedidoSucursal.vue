<template>
  <div class="page-container animate-fade mobile-layout font-sans">
    
    <!-- Encabezado de Carga de Pedidos -->
    <div class="page-header compact-mobile-header">
      <div class="header-content">
        <h2 class="page-title"><i class="ph ph-file-plus"></i> Cargar Pedido Sucursal</h2>
        <p class="page-description">Carga rápida y unificada de pedidos en tres columnas para PC.</p>
      </div>
    </div>

    <!-- Banner de Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-3 alert-touch animate-fade', alert.type]" id="alert-banner">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <i class="ph" :class="alert.type === 'error' ? 'ph-warning-circle' : 'ph-check-circle'"></i>
        <span>{{ alert.message }}</span>
      </div>
      <button class="alert-close" @click="alert.show = false"><i class="ph ph-x"></i></button>
    </div>

    <!-- CONTENEDOR DE PASOS DINÁMICOS -->
    <div class="steps-flow-container">
      <transition :name="transitionName" mode="out-in">
        
        <!-- PASO 1: DATOS SUCURSAL (Centrada) -->
        <div v-if="currentStep === 1" key="step1" class="step-wrapper step-1-centered animate-fade">
          <div class="card shadow-bevel mx-auto" style="max-width: 480px; width: 100%;">
            <div class="card-header bg-secondary-touch">
              <span class="card-title text-sm"><i class="ph ph-storefront"></i> 1. Destino y Datos del Pedido</span>
            </div>
            <div class="card-body padding-md" style="background-color: var(--bg-window); display: flex; flex-direction: column; gap: 1rem;">
              
              <div class="form-group">
                <label class="form-label text-xs font-bold text-secondary">Sucursal de Destino *</label>
                <select v-model="selectedSucursal" class="form-control select-touch" required style="padding: 0 0.5rem; height: 40px;" @change="handleSucursalChange">
                  <option :value="null">-- Seleccione una sucursal --</option>
                  <option v-for="suc in sucursales" :key="suc.id" :value="suc">
                    🏬 N° {{ suc.numero }} - {{ suc.sucursal }}
                  </option>
                </select>
              </div>

              <!-- Botón Continuar -->
              <button 
                type="button" 
                class="btn btn-confirm-giant w-full mt-2" 
                :disabled="!selectedSucursal"
                @click="goToStep(2)"
              >
                <span>Continuar al Catálogo</span>
                <i class="ph ph-arrow-right"></i>
              </button>

            </div>
          </div>
        </div>

        <!-- PASO 2: GRILLA DE PRODUCTOS Y DETALLE (2 Columnas) -->
        <div v-else key="step2" class="step-wrapper step-2-grid animate-fade">
          
          <!-- Resumen de Destino Seleccionado -->
          <div v-if="selectedSucursal" class="selected-sucursal-summary animate-fade" style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.85rem; background-color: var(--accent-primary-light); border: 2px solid var(--accent-primary); border-radius: 0; gap: 0.5rem;">
              <span style="font-size: 0.8rem; font-weight: bold; color: var(--text-primary);">
                🏬 Cargando para: <strong class="text-green">N° {{ selectedSucursal.numero }} - {{ selectedSucursal.sucursal }}</strong>
              </span>
              <button 
                v-if="!isLoggedAsSucursal"
                type="button" 
                class="btn btn-secondary btn-touch-sm" 
                style="height: 26px !important; font-size: 0.7rem !important; border-color: var(--bevel-dark); padding: 0 0.5rem;"
                @click="goToStep(1)"
              >
                <i class="ph ph-pencil"></i> Cambiar Sucursal
              </button>
            </div>
          </div>

          <!-- Banner Marquesina de Destacados -->
          <div v-if="destacadosProductos.length > 0" class="destacados-marquee-banner mb-3 shadow-bevel">
            <div class="marquee-title-label">
              <i class="ph ph-star-fill animate-pulse text-amber-400"></i>
              <span>PRODUCTOS DESTACADOS:</span>
            </div>
            <div class="marquee-content-wrapper">
              <div class="marquee-track">
                <span 
                  v-for="p in destacadosProductos" 
                  :key="p.codigo" 
                  class="marquee-item"
                  @click="focusDestacado(p)"
                  title="Haz clic para filtrar este producto en el catálogo"
                >
                  <span class="marquee-item-bubble">
                    <strong class="font-mono">#{{ p.codigo }}</strong> {{ p.nombre }}
                    <span v-if="basket[p.codigo]?.piezaValue > 0 || basket[p.codigo]?.fraccionValue > 0" class="badge-active-dot ml-1"></span>
                  </span>
                </span>
                <!-- Duplicamos los elementos para asegurar un scroll continuo fluido en pantallas anchas -->
                <span 
                  v-for="p in destacadosProductos" 
                  :key="p.codigo + '-dup'" 
                  class="marquee-item"
                  @click="focusDestacado(p)"
                  title="Haz clic para filtrar este producto en el catálogo"
                >
                  <span class="marquee-item-bubble">
                    <strong class="font-mono">#{{ p.codigo }}</strong> {{ p.nombre }}
                    <span v-if="basket[p.codigo]?.piezaValue > 0 || basket[p.codigo]?.fraccionValue > 0" class="badge-active-dot ml-1"></span>
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div class="order-creation-grid-step2">

            <!-- COLUMNA 1: BUSCADOR Y PRODUCTOS (50%) -->
            <div class="card shadow-bevel">
              <div class="card-header bg-secondary-touch" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="card-title text-sm"><i class="ph ph-magnifying-glass"></i> Catálogo de Productos</span>
                <!-- Botón de Impresión PDF -->
                <button 
                  type="button" 
                  class="btn btn-secondary btn-touch-sm" 
                  style="height: 28px !important; font-size: 0.72rem !important; border-color: var(--bevel-dark); padding: 0 0.5rem;"
                  @click="printCatalog"
                  title="Imprimir planilla de pedido en PDF"
                >
                  <i class="ph ph-printer"></i> Imprimir Planilla (PDF)
                </button>
              </div>
              <div class="card-body padding-md" style="display: flex; flex-direction: column; gap: 0.75rem;">
                
                <!-- Buscador Superior -->
                <div class="form-group">
                  <div class="search-input-wrapper">
                    <i class="ph ph-magnifying-glass search-icon"></i>
                    <input 
                      type="text" 
                      class="form-control search-touch-input" 
                      v-model="searchProductQuery" 
                      placeholder="Filtrar por código o nombre..." 
                    />
                    <button v-if="searchProductQuery" class="clear-search-btn" @click="searchProductQuery = ''">
                      <i class="ph ph-x"></i>
                    </button>
                  </div>
                </div>

                <div v-if="loadingProductos" class="loading-state padding-lg text-center">
                  <i class="ph ph-spinner spinner icon-xl text-primary"></i>
                  <p class="text-xs text-muted mt-2">Cargando catálogo...</p>
                </div>

                <!-- PLANILLA DE PRODUCTOS (Con columnas de Pieza y Fraccionado, y altura compacta) -->
                <div v-else class="access-datasheet-container" style="max-height: 500px !important; overflow-y: auto;">
                  <table class="access-table">
                    <thead>
                      <tr>
                        <th class="col-code">Código</th>
                        <th class="col-product">Producto</th>
                        <th class="col-input">Piezas</th>
                        <th class="col-input">Fracc.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr 
                        v-for="p in filteredProductos" 
                        :key="p.codigo" 
                        :class="{ 'row-active': (basket[p.codigo]?.piezaValue > 0 || basket[p.codigo]?.fraccionValue > 0) }"
                      >
                        <td class="col-code font-mono">{{ p.codigo }}</td>
                        <td class="col-product font-bold" style="font-size: 0.82rem;">
                          {{ p.nombre }}
                          <span v-if="isFractionedProduct(p)" class="badge badge-primary font-bold text-xs" style="margin-left: 0.35rem; padding: 1px 4px;">Frac</span>
                        </td>
                        <td class="col-input">
                          <input 
                            type="text" 
                            inputmode="numeric"
                            pattern="[0-9]*"
                            :placeholder="p.tipo_calculo_piezas === 'fraccionado' || (selectedSucursal && selectedSucursal.tipo === 'express') ? 'N/A' : '0'"
                            v-model="basket[p.codigo].piezaValue" 
                            @input="basket[p.codigo].piezaValue = String(basket[p.codigo].piezaValue).replace(/[^0-9]/g, '')"
                            class="access-input-cell"
                            :disabled="p.tipo_calculo_piezas === 'fraccionado' || (selectedSucursal && selectedSucursal.tipo === 'express')"
                            :title="p.tipo_calculo_piezas === 'fraccionado' ? 'Producto fraccionado' : (selectedSucursal && selectedSucursal.tipo === 'express' ? 'Sucursales Express no pueden pedir piezas' : '')"
                          />
                        </td>
                        <td class="col-input">
                          <input 
                            type="text" 
                            inputmode="numeric"
                            pattern="[0-9]*"
                            :placeholder="p.tipo_calculo_piezas === 'normal' || (selectedSucursal && selectedSucursal.tipo === 'con_sector') ? 'N/A' : '0'"
                            v-model="basket[p.codigo].fraccionValue" 
                            @input="basket[p.codigo].fraccionValue = String(basket[p.codigo].fraccionValue).replace(/[^0-9]/g, '')"
                            class="access-input-cell font-bold text-green"
                            :disabled="p.tipo_calculo_piezas === 'normal' || (selectedSucursal && selectedSucursal.tipo === 'con_sector')"
                            :title="p.tipo_calculo_piezas === 'normal' ? 'Producto de horma entera' : (selectedSucursal && selectedSucursal.tipo === 'con_sector' ? 'Sucursales con Sector no pueden pedir fraccionados' : '')"
                          />
                        </td>
                      </tr>
                      <tr v-if="filteredProductos.length === 0">
                        <td colspan="4" class="text-center py-4 text-muted text-xs">No se encontraron productos disponibles</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </div>

            <!-- COLUMNA 2: DETALLE DEL PEDIDO (50%) -->
            <div class="card shadow-bevel">
              <div class="card-header bg-secondary-touch">
                <span class="card-title text-sm"><i class="ph ph-shopping-bag-open"></i> Detalle del Pedido</span>
                <span class="badge badge-primary font-bold" style="font-size: 0.72rem;">
                  {{ basketItems.length }} Ítems
                </span>
              </div>
              <div class="card-body padding-md" style="display: flex; flex-direction: column; gap: 1rem; min-height: 300px; justify-content: space-between;">
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
                  
                  <div v-if="basketItems.length === 0" class="empty-state py-5 text-center" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <i class="ph ph-shopping-bag icon-xl text-muted" style="font-size: 3rem; margin-bottom: 0.5rem;"></i>
                    <p class="text-xs text-muted">Aún no has cargado ningún producto.</p>
                    <p class="text-2xs text-muted" style="margin-top: 2px;">Ingresa cantidades en la columna central para comenzar.</p>
                  </div>

                  <!-- Listado Scrollable de Productos Cargados -->
                  <div v-else class="basket-scrollable-container" style="max-height: 550px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.4rem; padding-right: 2px;">
                    <div 
                      v-for="item in basketItems" 
                      :key="item.codigo" 
                      class="basket-item-row"
                      style="display: flex; justify-content: space-between; align-items: center; padding: 0.55rem 0.65rem; background-color: var(--bg-window); border: 2px solid var(--bevel-dark); border-radius: 0; gap: 0.5rem;"
                    >
                      <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
                        <span class="font-bold text-xs truncate-name">{{ item.nombre }}</span>
                        <span class="font-mono text-3xs text-muted">#{{ item.codigo }}</span>
                      </div>
                      
                      <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                        <div style="display: flex; flex-direction: column; align-items: flex-end; font-size: 0.75rem; font-weight: bold;" class="font-mono">
                          <span v-if="item.piezaValue > 0" class="text-primary">{{ item.piezaValue }} pz</span>
                          <span v-if="item.fraccionValue > 0" class="text-green">{{ item.fraccionValue }} fr</span>
                        </div>
                        
                        <button 
                          type="button" 
                          class="btn btn-secondary btn-touch-sm text-red" 
                          style="padding: 2px 6px; border-color: var(--accent-danger); height: 26px !important; display: flex; align-items: center; justify-content: center;"
                          @click="removeItemFromBasket(item.codigo)"
                          title="Quitar"
                        >
                          <i class="ph ph-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                <!-- Botón de Envío e Instrucción -->
                <div style="border-top: 2px solid var(--bevel-dark); padding-top: 1rem; margin-top: 0.5rem;">
                  <button 
                    type="button" 
                    class="btn btn-confirm-giant w-full" 
                    @click="submitOrder"
                    :disabled="submittingOrder || basketItems.length === 0 || !selectedSucursal"
                    id="btn-submit-order"
                    style="height: 52px !important; font-size: 0.95rem !important;"
                  >
                    <i class="ph ph-spinner spinner" v-if="submittingOrder"></i>
                    <i class="ph ph-floppy-disk" v-else></i>
                    <span>Enviar Pedido de Sucursal</span>
                  </button>
                  <p v-if="!selectedSucursal" class="text-3xs text-red text-center mt-2 font-bold">
                    * Debe seleccionar la sucursal de destino antes de enviar.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoggedAsSucursal = computed(() => authStore.user?.rol?.toLowerCase() === 'sucursal')

// Navegación de Pasos
const currentStep = ref(1)
const transitionName = ref('slide-left')

const goToStep = (step) => {
  if (step === 2) {
    if (!orderCode.value) {
      orderCode.value = generateOrderCode()
    }
    transitionName.value = 'slide-left'
    currentStep.value = 2
  } else {
    transitionName.value = 'slide-right'
    currentStep.value = 1
  }
}

// Estados Generales
const sucursales = ref([])
const productos = ref([])
const enabledProductCodes = ref([])
const loadingEnabledProducts = ref(false)

const loadingSucursales = ref(false)
const loadingProductos = ref(false)
const submittingOrder = ref(false)

// Filtros y Estados de Inputs
const searchProductQuery = ref('')
const selectedSucursal = ref(null)

const orderCode = ref('')
const orderDate = ref('')
const alert = ref({ show: false, message: '', type: 'success' })

// Canasta de Ítems: codigo_producto -> { piezaValue: '', fraccionValue: '' }
const basket = ref({})

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Saber si un producto es fraccionado por su nombre
const isFractionedProduct = (p) => {
  return (p.nombre || '').toUpperCase().trim().startsWith('FRAC')
}

// Carga Inicial
const fetchData = async () => {
  loadingSucursales.value = true
  loadingProductos.value = true
  try {
    const resSuc = await fetch('/api/sucursales')
    if (resSuc.ok) {
      sucursales.value = await resSuc.json()
    } else {
      throw new Error('Error al recuperar sucursales')
    }

    const resProd = await fetch('/api/productos')
    if (resProd.ok) {
      productos.value = await resProd.json()
      // Inicializar canasta vacía para todos los productos
      productos.value.forEach(p => {
        basket.value[p.codigo] = {
          piezaValue: '',
          fraccionValue: ''
        }
      })
    } else {
      throw new Error('Error al recuperar catálogo de productos')
    }
  } catch (err) {
    console.error('Error fetching catalog data:', err)
    showAlert('Error de conexión al cargar catálogos', 'error')
  } finally {
    loadingSucursales.value = false
    loadingProductos.value = false
  }
}

// Generar código de pedido automático
const generateOrderCode = () => {
  const dateObj = new Date()
  const year = dateObj.getFullYear().toString().slice(-2)
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `PED-${year}${month}-${randomStr}`
}

// Establecer fecha por defecto (hoy en formato YYYY-MM-DD local)
const setDefaultDate = () => {
  const today = new Date()
  const offset = today.getTimezoneOffset()
  const localToday = new Date(today.getTime() - (offset*60*1000))
  orderDate.value = localToday.toISOString().split('T')[0]
}

// Seleccionar Sucursal
const handleSucursalChange = async () => {
  if (selectedSucursal.value) {
    if (!orderCode.value) {
      orderCode.value = generateOrderCode()
    }
    const tipo = selectedSucursal.value.tipo
    if (tipo === 'con_sector') {
      // Borrar todas las cantidades fraccionadas si es con_sector (solo permite piezas)
      Object.keys(basket.value).forEach(k => {
        basket.value[k].fraccionValue = ''
      })
    } else if (tipo === 'express') {
      // Borrar todas las piezas si es express (solo permite fraccionados)
      Object.keys(basket.value).forEach(k => {
        basket.value[k].piezaValue = ''
      })
    }

    // Cargar permisos de productos habilitados para esta sucursal
    loadingEnabledProducts.value = true
    try {
      const res = await fetch(`/api/sucursales/${selectedSucursal.value.id}/productos`)
      if (res.ok) {
        const data = await res.json()
        // Guardar sólo los códigos que estén habilitados
        enabledProductCodes.value = data.filter(p => p.habilitado === true).map(p => p.codigo)
      } else {
        enabledProductCodes.value = []
      }
    } catch (error) {
      console.error('Error fetching enabled products for sucursal:', error)
      enabledProductCodes.value = []
    } finally {
      loadingEnabledProducts.value = false
    }
  } else {
    enabledProductCodes.value = []
  }
}

// Filtrar productos excluyendo los que empiezan con "INSU" y stock menor a 1 (excepto si empieza con FRAC)
const filteredProductos = computed(() => {
  if (selectedSucursal.value && loadingEnabledProducts.value) {
    return []
  }

  let list = productos.value.filter(p => {
    const code = (p.codigo || '').toUpperCase()
    return !code.startsWith('INSU') && (isFractionedProduct(p) || parseFloat(p.stock || 0) >= 1)
  })

  // Filtrar por productos habilitados para la sucursal
  if (selectedSucursal.value) {
    list = list.filter(p => enabledProductCodes.value.includes(p.codigo))
  }

  // Excluir productos que tengan ambas opciones deshabilitadas para la sucursal seleccionada
  if (selectedSucursal.value) {
    list = list.filter(p => {
      const piezasDisabled = p.tipo_calculo_piezas === 'fraccionado' || selectedSucursal.value.tipo === 'express'
      const fraccionesDisabled = p.tipo_calculo_piezas === 'normal' || selectedSucursal.value.tipo === 'con_sector'
      return !(piezasDisabled && fraccionesDisabled)
    })
  }

  const q = searchProductQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(p => {
      return p.nombre?.toLowerCase().includes(q) || p.codigo?.toLowerCase().includes(q)
    })
  }
  return list
})

// Productos destacados (Ingresos Recientes)
const destacadosProductos = computed(() => {
  if (selectedSucursal.value && loadingEnabledProducts.value) {
    return []
  }

  let list = productos.value.filter(p => {
    const code = (p.codigo || '').toUpperCase()
    return !code.startsWith('INSU') && (isFractionedProduct(p) || parseFloat(p.stock || 0) >= 1)
  })

  // Filtrar por productos habilitados para la sucursal
  if (selectedSucursal.value) {
    list = list.filter(p => enabledProductCodes.value.includes(p.codigo))
  }

  // Excluir productos que tengan ambas opciones deshabilitadas para la sucursal seleccionada
  if (selectedSucursal.value) {
    list = list.filter(p => {
      const piezasDisabled = p.tipo_calculo_piezas === 'fraccionado' || selectedSucursal.value.tipo === 'express'
      const fraccionesDisabled = p.tipo_calculo_piezas === 'normal' || selectedSucursal.value.tipo === 'con_sector'
      return !(piezasDisabled && fraccionesDisabled)
    })
  }

  // Filtrar por propiedad destacado
  return list.filter(p => p.destacado === true || p.destacado === 1 || String(p.destacado).toLowerCase() === 'true')
})

const focusDestacado = (p) => {
  searchProductQuery.value = p.codigo
}

// Canasta items (con cantidades cargadas)
const basketItems = computed(() => {
  const list = []
  productos.value.forEach(p => {
    const entry = basket.value[p.codigo]
    if (entry) {
      const pz = parseInt(entry.piezaValue) || 0
      const fr = parseInt(entry.fraccionValue) || 0
      if (pz > 0 || fr > 0) {
        list.push({
          codigo: p.codigo,
          nombre: p.nombre,
          piezaValue: pz,
          fraccionValue: fr
        })
      }
    }
  })
  return list
})

const removeItemFromBasket = (code) => {
  if (basket.value[code]) {
    basket.value[code].piezaValue = ''
    basket.value[code].fraccionValue = ''
  }
}

// Imprimir catálogo completo a planilla PDF
const printCatalog = () => {
  let listToPrint = productos.value.filter(p => {
    const code = (p.codigo || '').toUpperCase()
    return !code.startsWith('INSU') && (isFractionedProduct(p) || parseFloat(p.stock || 0) >= 1)
  })

  if (selectedSucursal.value) {
    listToPrint = listToPrint.filter(p => enabledProductCodes.value.includes(p.codigo))
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    showAlert('El navegador bloqueó la ventana emergente de impresión. Por favor, permita las ventanas emergentes en su navegador.', 'error')
    return
  }

  let tableRows = ''
  listToPrint.forEach(p => {
    const isFrac = isFractionedProduct(p)
    const piezasDisabled = p.tipo_calculo_piezas === 'fraccionado' || (selectedSucursal.value && selectedSucursal.value.tipo === 'express')
    const fraccionesDisabled = p.tipo_calculo_piezas === 'normal' || (selectedSucursal.value && selectedSucursal.value.tipo === 'con_sector')

    const piezasContent = piezasDisabled ? 'No' : ''
    const fraccionesContent = fraccionesDisabled ? 'No' : ''

    tableRows += `
      <tr>
        <td style="font-family: monospace; font-weight: bold; border: 1px solid #000; padding: 6px; text-align: center; font-size: 11px;">${p.codigo}</td>
        <td style="border: 1px solid #000; padding: 6px; font-weight: bold; font-size: 11px;">
          ${p.nombre}
          ${isFrac ? '<span style="font-size: 8px; border: 1px solid #000; padding: 1px 3px; margin-left: 4px; border-radius: 0; background-color: #eee;">FRAC</span>' : ''}
        </td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 90px; font-size: 11px; font-weight: bold;">${piezasContent}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 90px; font-size: 11px; font-weight: bold;">${fraccionesContent}</td>
      </tr>
    `
  })

  const htmlContent = `
    <html>
      <head>
        <title>Planilla de Pedido - Catálogo de Productos</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            margin: 25px;
            color: #000;
            background-color: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px double #000;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 20px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .meta-info {
            font-size: 11px;
            text-align: right;
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            background-color: #eaeaea;
            border: 1.5px solid #000;
            padding: 8px;
            font-weight: 800;
            text-align: left;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.03em;
          }
          tr {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">📋 Planilla de Pedido de Sucursal</div>
            <div style="font-size: 11px; margin-top: 4px; color: #444;">Formulario de carga manual para planta.</div>
          </div>
          <div class="meta-info">
            <strong>Fecha de Impresión:</strong> ${new Date().toLocaleDateString('es-AR')}<br />
            <strong>Sucursal Destino:</strong> ${selectedSucursal.value ? selectedSucursal.value.sucursal : '______________________'}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 110px; text-align: center;">Código</th>
              <th>Producto</th>
              <th style="width: 110px; text-align: center;">Piezas</th>
              <th style="width: 110px; text-align: center;">Fracc.</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        <\/script>
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

// Registrar y Enviar Pedido
const submitOrder = async () => {
  if (!selectedSucursal.value) {
    showAlert('Seleccione la sucursal de destino en la primera columna.', 'error')
    return
  }

  if (!orderCode.value.trim()) {
    showAlert('Debe ingresar un código de pedido válido.', 'error')
    return
  }

  if (basketItems.value.length === 0) {
    showAlert('Debe cargar cantidades para al menos 1 producto antes de enviar.', 'error')
    return
  }

  submittingOrder.value = true

  // Estructurar ítems del payload
  const itemsPayload = []
  basketItems.value.forEach(item => {
    itemsPayload.push({
      codigo_producto: item.codigo,
      pieza: item.piezaValue || 0,
      fraccion: item.fraccionValue || 0
    })
  })

  try {
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: orderCode.value.trim(),
        sucursal: selectedSucursal.value.sucursal,
        fecha: orderDate.value,
        estado: 'Pendiente',
        items: itemsPayload
      })
    })

    const result = await res.json()

    if (res.ok) {
      showAlert(`¡Pedido ${orderCode.value.trim()} creado con éxito para ${selectedSucursal.value.sucursal}!`, 'success')
      
      // Limpiar canasta
      productos.value.forEach(p => {
        basket.value[p.codigo] = { piezaValue: '', fraccionValue: '' }
      })
      selectedSucursal.value = null
      orderCode.value = ''
      
      // Redirigir al listado de pedidos si está autenticado, sino reiniciar al paso 1
      setTimeout(() => {
        if (authStore.isAuthenticated) {
          router.push('/pedidos')
        } else {
          currentStep.value = 1
        }
      }, 1500)
    } else {
      showAlert(result.error || 'Error al registrar el pedido.', 'error')
    }
  } catch (err) {
    console.error('Error submitting order:', err)
    showAlert('Error de conexión con el servidor de base de datos.', 'error')
  } finally {
    submittingOrder.value = false
  }
}

onMounted(async () => {
  await fetchData()
  setDefaultDate()
  
  if (authStore.user?.id_sucursal) {
    const sucursalId = parseInt(authStore.user.id_sucursal)
    const matchingSucursal = sucursales.value.find(s => s.id === sucursalId)
    if (matchingSucursal) {
      selectedSucursal.value = matchingSucursal
      handleSucursalChange()
      goToStep(2)
    }
  }
})
</script>

<style scoped>
.mobile-layout {
  padding: 0.5rem !important;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.mobile-layout *,
.mobile-layout *::before,
.mobile-layout *::after {
  box-sizing: border-box !important;
}

.compact-mobile-header {
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--bevel-light);
}

.compact-mobile-header .page-title {
  font-size: 1.15rem !important;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.compact-mobile-header .page-description {
  font-size: 0.75rem !important;
  margin-top: 2px;
}

.bg-secondary-touch {
  background-color: var(--bg-secondary) !important;
}

/* Grilla responsive de 3 columnas */
.order-creation-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .order-creation-grid {
    grid-template-columns: 320px 1fr 380px;
    align-items: start;
    gap: 1.25rem;
  }
}

/* Filtro de búsqueda táctil */
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 1rem;
  color: var(--text-muted);
  pointer-events: none;
}

.search-touch-input {
  width: 100%;
  height: 44px !important;
  padding: 0 2.2rem 0 2.2rem !important;
  font-size: 0.9rem !important;
  box-shadow: var(--inset-shadow);
  border: 2px solid var(--bevel-dark);
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1rem;
  display: flex;
  align-items: center;
  padding: 0;
}

.btn-touch-sm {
  height: 32px !important;
  font-size: 0.75rem !important;
  padding: 0 0.6rem !important;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* PLANILLA ESTILO MS ACCESS DATASHEET */
.access-datasheet-container {
  overflow-x: auto;
  border: 2px solid var(--bevel-dark);
  box-shadow: var(--inset-shadow);
  background-color: var(--bg-primary);
  max-height: 320px !important; /* Altura compacta para scroll de 5-10 elementos */
  overflow-y: auto;
  border-radius: 0;
}

.access-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  color: var(--text-primary);
  text-align: left;
}

.access-table th {
  background-color: #1e293b;
  color: white;
  border-bottom: 2.5px solid var(--bevel-darker);
  border-right: 1.5px solid var(--bevel-dark);
  padding: 6px 8px;
  font-weight: bold;
  font-size: 0.72rem;
  text-transform: uppercase;
  position: sticky;
  top: 0;
  z-index: 5;
}

.access-table td {
  border-bottom: 1.5px solid var(--bevel-dark);
  border-right: 1.5px solid var(--bevel-dark);
  padding: 4px 6px;
  vertical-align: middle;
}

.access-table tr:nth-child(odd) td {
  background-color: var(--bg-secondary);
}

.access-table tr:nth-child(even) td {
  background-color: #e2e8f0;
}

.access-table tr.row-active td {
  background-color: #d1fae5 !important;
}

.access-table tr:hover td {
  background-color: #a7f3d0 !important;
}

.col-code {
  font-family: monospace;
  font-weight: bold;
  color: var(--text-secondary);
  width: 60px;
  text-align: center;
}

.col-product {
  font-weight: 600;
  min-width: 150px;
}

.col-input {
  width: 65px;
  text-align: center;
}

/* Inputs incrustados en celdas */
.access-input-cell {
  width: 100%;
  height: 28px;
  padding: 2px 4px;
  font-size: 0.82rem;
  font-weight: bold;
  border: 2px solid var(--bevel-dark);
  border-radius: 0;
  text-align: center;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
  box-shadow: var(--inset-shadow);
  transition: all 0.1s ease;
}

.access-input-cell:focus {
  border-color: var(--accent-primary);
  background-color: white;
}

.access-input-cell:disabled {
  background-color: #cbd5e1;
  color: #64748b;
  border-color: #cbd5e1;
  cursor: not-allowed;
}

.btn-confirm-giant {
  height: 48px !important;
  font-size: 0.9rem !important;
  background-color: var(--accent-primary) !important;
  border-color: var(--accent-primary-hover) !important;
  color: white !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-weight: bold;
  box-shadow: var(--raised-shadow);
  border-radius: 0;
}

.btn-confirm-giant:active {
  transform: scale(0.98);
}

.btn-confirm-giant:disabled {
  background-color: #cbd5e1 !important;
  color: #94a3b8 !important;
  border-color: #cbd5e1 !important;
  box-shadow: none !important;
  cursor: not-allowed;
}

.alert-touch {
  padding: 0.6rem 0.8rem !important;
  font-size: 0.85rem !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--raised-shadow) !important;
}

.alert-close {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: 1rem;
  display: flex;
  align-items: center;
  padding: 0;
}

/* --- DISEÑO DE PASOS Y ANIMACIÓN DE CAROUSEL --- */
.steps-flow-container {
  width: 100%;
  overflow: hidden;
  position: relative;
  min-height: 480px;
}

.step-wrapper {
  width: 100%;
}

.step-1-centered {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 380px;
  width: 100%;
}

.order-creation-grid-step2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .order-creation-grid-step2 {
    grid-template-columns: 1fr 1fr;
    align-items: start;
    gap: 1.25rem;
  }
}

/* --- ESTILOS DE LA MARQUESINA DE DESTACADOS --- */
.destacados-marquee-banner {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 2px solid var(--accent-primary);
  border-radius: 0;
  overflow: hidden;
  height: 44px;
  margin: 0.5rem 0 1.75rem 0; /* Más margen arriba y abajo para desahogar el espacio */
}

.marquee-title-label {
  background: var(--accent-primary);
  color: white;
  padding: 0 0.85rem;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 800;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  z-index: 10;
  white-space: nowrap;
  box-shadow: 2px 0 6px rgba(0,0,0,0.15);
  border-right: 1px solid var(--bevel-dark);
}

.marquee-content-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
}

.marquee-track {
  display: flex;
  gap: 1.5rem;
  white-space: nowrap;
  animation: marquee-scroll 45s linear infinite;
  padding-left: 1rem;
}

.marquee-track:hover {
  animation-play-state: paused;
}

.marquee-item {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.marquee-item-bubble {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  background: var(--bg-primary);
  border: 1px solid var(--bevel-dark);
  border-radius: 0;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text-primary);
  box-shadow: var(--raised-shadow);
  transition: all 0.1s ease;
}

.marquee-item-bubble:hover {
  background: var(--accent-warning-light);
  border-color: var(--accent-warning);
  transform: translateY(-1px);
}

.marquee-item-bubble:active {
  box-shadow: var(--inset-shadow);
  transform: translateY(0);
}

.badge-active-dot {
  width: 7px;
  height: 7px;
  background-color: var(--accent-success);
  border-radius: 0;
  display: inline-block;
  box-shadow: 0 0 4px var(--accent-success);
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

/* Transiciones deslizantes bidireccionales */
.slide-left-enter-active, .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  transform: translateX(100px);
  opacity: 0;
}
.slide-left-leave-to {
  transform: translateX(-100px);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100px);
  opacity: 0;
}
.slide-right-leave-to {
  transform: translateX(100px);
  opacity: 0;
}
</style>
