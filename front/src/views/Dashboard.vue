<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.rol?.toLowerCase() === 'admin')
const isColaborador = computed(() => authStore.user?.rol?.toLowerCase() === 'colaborador')
const isSucursal = computed(() => authStore.user?.rol?.toLowerCase() === 'sucursal')
const isUsuario = computed(() => authStore.user?.rol?.toLowerCase() === 'usuario')
const isLoading = ref(false)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// ─── ESTADO OPERARIO ─────────────────────────────────────────────
const historial = ref([])
const expandedRows = ref(new Set())

const toggleRow = (id) => {
  if (expandedRows.value.has(id)) expandedRows.value.delete(id)
  else expandedRows.value.add(id)
}

const totalBolsitas = computed(() =>
  historial.value.reduce((sum, item) => sum + (Number(item.cantidad_bolsitas) || 0), 0)
)

const produccionPorProceso = computed(() => {
  const counts = { Feteado: 0, Envasado: 0 }
  historial.value.forEach(item => {
    if (counts[item.tipo_proceso] !== undefined) {
      counts[item.tipo_proceso] += Number(item.cantidad_bolsitas) || 0
    }
  })
  return counts
})

// ─── ESTADO ADMIN ────────────────────────────────────────────────
const produccionDia    = ref({ feteados: [], envasados: [] })
const produccionOperador = ref([])
const mermasStock      = ref({ decomiso: [], picadas: [] })
const produccionSemanal = ref([])
const stockAFetear      = ref([])

const filteredStockAFetear = computed(() => 
  stockAFetear.value.filter(item => (Number(item.cantidad) || 0) > 0)
)

const totalStockAFetearKg = computed(() =>
  filteredStockAFetear.value.reduce((acc, item) => acc + (Number(item.peso) || 0), 0)
)

const totalOperadores = computed(() => {
  return produccionOperador.value.reduce((acc, op) => ({
    feteadoKg: acc.feteadoKg + (Number(op.total_feteado_kilos) || 0),
    feteadoBols: acc.feteadoBols + (Number(op.total_feteado_bolsitas) || 0),
    envasadoBols: acc.envasadoBols + (Number(op.total_envasado_bolsitas) || 0)
  }), { feteadoKg: 0, feteadoBols: 0, envasadoBols: 0 })
})

// KPIs Admin
const adminTotalFeteadoKg  = computed(() =>
  produccionDia.value.feteados.reduce((acc, c) => acc + (Number(c.peso_feteado) || 0), 0)
)
const adminTotalFeteadoBolsitas = computed(() =>
  produccionDia.value.feteados.reduce((acc, c) => acc + (Number(c.cantidad_bolsitas) || 0), 0)
)
const adminTotalEnvasado = computed(() =>
  produccionDia.value.envasados.reduce((acc, c) => acc + (Number(c.cantidad_bolsitas) || 0), 0)
)
const adminTotalDecomiso = computed(() =>
  mermasStock.value.decomiso.reduce((acc, c) => acc + (Number(c.peso) || 0), 0)
)
const adminTotalPicadas  = computed(() =>
  mermasStock.value.picadas.reduce((acc, c) => acc + (Number(c.peso) || 0), 0)
)

// ─── SEMANAL ─────────────────────────────────────────
const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

const actividadReciente = ref({ resumenHoy: {}, feed: [] })
const activeActivityTab = ref('Todos')

const formatRecentDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isToday = date.toDateString() === today.toDateString()
  const isYesterday = date.toDateString() === yesterday.toDateString()

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isToday) return `Hoy, ${timeStr}`
  if (isYesterday) return `Ayer, ${timeStr}`

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}, ${timeStr}`
}

const getActivityIcon = (evt) => {
  if (evt.tipo === 'ingreso') return 'ph-arrow-circle-down'
  if (evt.tipo === 'egreso') return 'ph-arrow-circle-up'
  if (evt.tipo === 'proceso') return 'ph-package'
  if (evt.tipo === 'conversion') return 'ph-arrows-left-right'
  if (evt.tipo === 'ajuste') return 'ph-wrench'
  return 'ph-info'
}

const filteredActivityFeed = computed(() => {
  const feed = actividadReciente.value.feed || []
  if (activeActivityTab.value === 'Todos') return feed
  if (activeActivityTab.value === 'Ingresos') return feed.filter(x => x.tipo === 'ingreso')
  if (activeActivityTab.value === 'Egresos') return feed.filter(x => x.tipo === 'egreso')
  if (activeActivityTab.value === 'Procesos') return feed.filter(x => x.tipo === 'proceso')
  if (activeActivityTab.value === 'Ajustes') return feed.filter(x => ['ajuste', 'conversion'].includes(x.tipo))
  return feed
})

// ─── CARGA DE DATOS ──────────────────────────────────────────────
const cargarDatosAdmin = async () => {
  try {
    const [resDia, resOp, resMermas, resSemanal, resAct] = await Promise.all([
      fetch('/api/dashboard/produccion-dia'),
      fetch('/api/dashboard/produccion-operador'),
      fetch('/api/dashboard/mermas-stock'),
      fetch('/api/dashboard/produccion-semanal'),
      fetch('/api/dashboard/actividad-reciente')
    ])
    if (resDia.ok)     produccionDia.value     = await resDia.json()
    if (resOp.ok)      produccionOperador.value = await resOp.json()
    if (resMermas.ok)  mermasStock.value        = await resMermas.json()
    if (resSemanal.ok) produccionSemanal.value  = await resSemanal.json()
    if (resAct.ok)     actividadReciente.value = await resAct.json()
  } catch (err) {
    console.error('Error cargando dashboard admin:', err)
  }
}

const cargarDatosOperario = async () => {
  const res = await fetch(`/api/produccion/usuario/${authStore.user.usuario}`)
  if (res.ok) historial.value = await res.json()
}

const cargarDatos = async () => {
  if (!authStore.user?.usuario) return
  isLoading.value = true
  try {
    if (isAdmin.value) await cargarDatosAdmin()
    else               await cargarDatosOperario()
  } catch (e) {
    console.error('Error cargando dashboard:', e)
  } finally {
    isLoading.value = false
  }
}

// Listado de todos los posibles enlaces del menú para la vista simplificada de Colaboradores
const allMenuItems = [
  { path: '/productos', title: 'Productos', desc: 'Ver catálogo y stock de productos', icon: 'ph-package', color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.1)', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador'] },
  { path: '/ingresos', title: 'Ingreso Mercadería', desc: 'Registrar entrada de mercadería', icon: 'ph-download-simple', color: 'var(--accent-info)', bg: 'rgba(6, 182, 212, 0.1)', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
  { path: '/movimientos-stock', title: 'Historial de Stock', desc: 'Ver log de movimientos de stock', icon: 'ph-clock-counter-clockwise', color: 'var(--accent-primary)', bg: 'rgba(99, 102, 241, 0.1)', roles: ['Admin', 'Referente'] },
  { path: '/vencimientos', title: 'Vencimientos', desc: 'Ver productos próximos a vencer e iniciar auditoría', icon: 'ph-calendar', color: 'var(--accent-warning)', bg: 'rgba(245, 158, 11, 0.1)', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Usuario'] },
  { path: '/procesos', title: 'Gestión de Procesos', desc: 'Registrar fraccionamiento, envasado y mermas', icon: 'ph-arrows-clockwise', color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.1)', roles: ['Admin', 'Referente', 'Feteador', 'Envasador', 'Colaborador'] },
  { path: '/conversiones', title: 'Conversiones', desc: 'Convertir recortes y registrar cambios', icon: 'ph-arrows-left-right', color: 'var(--accent-orange)', bg: 'rgba(249, 115, 22, 0.1)', roles: ['Admin', 'Referente', 'Feteador', 'Envasador'] },
  { path: '/recortes', title: 'Stock de Recortes', desc: 'Ver stock y planillas de recortes', icon: 'ph-scissors', color: 'var(--accent-danger)', bg: 'rgba(239, 68, 68, 0.1)', roles: ['Admin', 'Referente'] },
  { path: '/decomisos', title: 'Decomisos', desc: 'Ver descarte y mermas por mal estado', icon: 'ph-trash', color: 'var(--accent-danger)', bg: 'rgba(239, 68, 68, 0.1)', roles: ['Admin', 'Referente'] },
  { path: '/preparar', title: 'Preparar Pedidos', desc: 'Ver pedidos entrantes y armar bultos', icon: 'ph-shopping-cart', color: 'var(--accent-success)', bg: 'rgba(16, 185, 129, 0.1)', roles: ['Admin', 'Referente', 'Preparador', 'Colaborador'] },
  { path: '/pedidos', title: 'Ver Pedidos', desc: 'Buscar y ver planillas de pedidos', icon: 'ph-shopping-cart-simple', color: 'var(--accent-success)', bg: 'rgba(16, 185, 129, 0.1)', roles: ['Admin', 'Referente', 'Preparador', 'Colaborador'] },
  { path: '/crear-pedido-sucursal', title: 'Cargar Pedido', desc: 'Cargar pedido manual o sucursales', icon: 'ph-file-plus', color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.1)', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador'] },
  { path: '/demanda-pendiente', title: 'Demanda Pendiente', desc: 'Ver stock y pedidos solicitados', icon: 'ph-chart-line', color: 'var(--accent-info)', bg: 'rgba(139, 92, 246, 0.1)', roles: ['Admin', 'Referente', 'Preparador', 'Colaborador', 'Usuario'] },
  { path: '/reportes-pedidos', title: 'Reportes de Pedidos', desc: 'Gráficos y planillas de balance de pedidos', icon: 'ph-chart-line-up', color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.1)', roles: ['Admin', 'Referente', 'Preparador', 'Colaborador', 'Usuario'] },
  { path: '/reportes-produccion', title: 'Top Fraccionados', desc: 'Estadísticas de productos más feteados', icon: 'ph-chart-bar', color: 'var(--accent-success)', bg: 'rgba(16, 185, 129, 0.1)', roles: ['Admin', 'Referente', 'Feteador', 'Envasador', 'Colaborador'] },
  { path: '/reporte-trazabilidad', title: 'Trazabilidad de Producto', desc: 'Evolución e historial de stock por producto', icon: 'ph-line-segments', color: 'var(--accent-primary)', bg: 'rgba(2, 132, 199, 0.1)', roles: ['Admin', 'Referente', 'Preparador', 'Feteador', 'Envasador', 'Colaborador', 'Usuario'] },
  { path: '/colaboradores', title: 'Colaboradores', desc: 'Administrar personal y operarios', icon: 'ph-users', color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.1)', roles: ['Admin'] },
  { path: '/sucursales', title: 'Sucursales', desc: 'Administrar sucursales asociadas', icon: 'ph-storefront', color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.1)', roles: ['Admin'] },
  { path: '/proveedores', title: 'Proveedores', desc: 'Administrar proveedores de planta', icon: 'ph-handshake', color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.1)', roles: ['Admin'] },
  { path: '/bultos', title: 'Bultos', desc: 'Configuración de cajas y pesos', icon: 'ph-package', color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.1)', roles: ['Admin'] },
  { path: '/ubicaciones', title: 'Ubicaciones', desc: 'Configuración de depósitos y sucursales', icon: 'ph-map-pin', color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.1)', roles: ['Admin'] },
  { path: '/usuarios', title: 'Usuarios', desc: 'Administrar credenciales y accesos', icon: 'ph-user-gear', color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.1)', roles: ['Admin'] },
  { path: '/permisos', title: 'Permisos de Roles', desc: 'Matriz de permisos por rol', icon: 'ph-shield-check', color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.1)', roles: ['Admin'] }
]

const enabledMenuItems = computed(() => {
  return allMenuItems.filter(item => authStore.hasPermission(item.path, item.roles))
})

onMounted(cargarDatos)
</script>

<template>
  <div class="page-container animate-fade">

    <!-- ══════════════ VISTA COLABORADOR (MENÚ PRINCIPAL MÓVIL) ══════════════ -->
    <template v-if="isColaborador">
      <div class="mobile-menu-container mt-2">
        <div class="card">
          <div class="card-body mobile-menu-grid">
            <!-- Enlaces dinámicos habilitados según configuración -->
            <router-link 
              v-for="item in enabledMenuItems" 
              :key="item.path" 
              :to="item.path" 
              class="menu-item-btn"
            >
              <div class="menu-item-icon" :style="{ backgroundColor: item.bg, color: item.color }">
                <i :class="['ph', item.icon]"></i>
              </div>
              <div class="menu-item-text">
                <span class="title">{{ item.title }}</span>
                <span class="desc">{{ item.desc }}</span>
              </div>
              <i class="ph ph-caret-right chevron"></i>
            </router-link>

            <!-- Botón de Cerrar Sesión -->
            <button @click="handleLogout" class="menu-item-btn logout-item-btn">
              <div class="menu-item-icon logout-icon">
                <i class="ph ph-sign-out"></i>
              </div>
              <div class="menu-item-text">
                <span class="title">Cerrar Sesión</span>
                <span class="desc">Salir de tu cuenta de colaborador</span>
              </div>
              <i class="ph ph-caret-right chevron"></i>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════ VISTA GENERAL (README) ══════════════ -->
    <template v-else>
      <div class="welcome-section mt-2">
        <div class="welcome-text">
          <h1 class="welcome-title">Bienvenido a la Planta de Producción CDF</h1>
          <p class="welcome-subtitle">Sistema de Distribución & Gestión de Stock</p>
        </div>
      </div>

      <div class="card mt-4">
        <div class="card-header" style="background-color: var(--bg-tertiary); color: white; border-bottom: 2px solid var(--bevel-dark);">
          <span class="card-title" style="color: white; font-weight: bold;">
            Información de Usuario (README)
          </span>
        </div>
        <div class="card-body" style="padding: 1.5rem; line-height: 1.6; color: var(--text-primary); background: var(--bg-secondary);">
          <h3 style="margin-bottom: 0.5rem; font-weight: bold; color: var(--accent-primary);">¡Hola, {{ authStore.user?.usuario }}!</h3>
          <p style="margin-bottom: 1rem;">
            Has ingresado al panel de control de CDF. Desde el menú lateral izquierdo puedes navegar por las herramientas e informes que tienes asignados en el sistema.
          </p>

          <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: bold;">Módulos del Sistema:</h4>
          <ul style="margin-left: 1.5rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem;">
            <li><strong>Pedidos:</strong> Carga de pedidos de mercadería y seguimiento de solicitudes históricas.</li>
            <li><strong>Producción y Procesos:</strong> Registro de fraccionamientos, envasado y mermas en planta.</li>
            <li><strong>Inventario:</strong> Consulta de productos, stock en block, recortes y vencimientos.</li>
            <li><strong>Reportes:</strong> Análisis de rendimiento y evolución histórica de stock.</li>
          </ul>

          <div style="background-color: var(--bg-window); border-left: 4px solid var(--accent-info); padding: 0.75rem 1rem; border-radius: 0; border-top: 1px solid var(--bevel-dark); border-right: 1px solid var(--bevel-dark); border-bottom: 1px solid var(--bevel-dark);">
            <strong>Soporte Técnico:</strong> Si requieres acceso a un nuevo módulo o tienes consultas operativas, ponte en contacto con el administrador del sistema.
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════ VISTA ADMIN / REFERENTES (Métricas completas) ══════════════ -->
    <template v-if="false">
      <!-- Encabezado -->
      <div class="welcome-section">
        <div class="welcome-text">
          <h1 class="welcome-title">
            Panel de Control
          </h1>
          <p class="welcome-subtitle">
            Resumen de producción del día y la semana.
          </p>
        </div>
        <button class="icon-btn" @click="cargarDatos" :disabled="isLoading" title="Actualizar">
          <i class="ph ph-arrows-clockwise" :class="{ spinner: isLoading }"></i>
        </button>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid mt-4">
        <div class="kpi-card kpi-green">
          <i class="ph ph-knife kpi-icon"></i>
          <div>
            <span class="kpi-label">Feteado hoy</span>
            <span class="kpi-value">{{ adminTotalFeteadoKg.toFixed(2) }} <small>Kg</small></span>
          </div>
        </div>
        <div class="kpi-card kpi-blue">
          <i class="ph ph-stack kpi-icon"></i>
          <div>
            <span class="kpi-label">Bolsitas feteadas hoy</span>
            <span class="kpi-value">{{ adminTotalFeteadoBolsitas }} <small>unid.</small></span>
          </div>
        </div>
        <div class="kpi-card kpi-red">
          <i class="ph ph-warning kpi-icon"></i>
          <div>
            <span class="kpi-label">Decomiso (stock)</span>
            <span class="kpi-value">{{ adminTotalDecomiso.toFixed(2) }} <small>Kg</small></span>
          </div>
        </div>
        <div class="kpi-card kpi-orange">
          <i class="ph ph-funnel kpi-icon"></i>
          <div>
            <span class="kpi-label">Picadas (stock)</span>
            <span class="kpi-value">{{ adminTotalPicadas.toFixed(2) }} <small>Kg</small></span>
          </div>
        </div>
      </div>

      <!-- Resumen Operativo de Hoy -->
      <div class="card mt-4">
        <div class="card-header pb-2 mb-2 border-bottom">
          <h3 class="card-title"><i class="ph ph-activity text-accent mr-1"></i>Resumen Operativo de Hoy</h3>
        </div>
        <div class="stats-grid" style="margin-top: 0.5rem; gap: 0.75rem;">
          <div class="card stat-card" style="border-left-color: #16a34a; background: #f0fdf4;">
            <span class="stat-label" style="color: #15803d;">Ingresos de Hoy</span>
            <span class="stat-value" style="font-size: 1.4rem;">
              {{ (actividadReciente.resumenHoy?.ingresosKilos || 0).toFixed(2) }} <small style="font-size:0.6em; color:var(--text-muted);">Kg</small>
            </span>
            <span class="stat-unit" style="color: #16a34a; font-weight: bold;">
              {{ actividadReciente.resumenHoy?.ingresosPiezas || 0 }} piezas
            </span>
          </div>

          <div class="card stat-card" style="border-left-color: #dc2626; background: #fef2f2;">
            <span class="stat-label" style="color: #b91c1c;">Egresos de Hoy</span>
            <span class="stat-value" style="font-size: 1.4rem;">
              {{ (actividadReciente.resumenHoy?.egresosKilos || 0).toFixed(2) }} <small style="font-size:0.6em; color:var(--text-muted);">Kg</small>
            </span>
            <span class="stat-unit" style="color: #dc2626; font-weight: bold;">
              {{ actividadReciente.resumenHoy?.egresosPiezas || 0 }} piezas
            </span>
          </div>

          <div class="card stat-card" style="border-left-color: #2563eb; background: #eff6ff;">
            <span class="stat-label" style="color: #1d4ed8;">Procesos de Hoy</span>
            <span class="stat-value" style="font-size: 1.4rem;">
              {{ (actividadReciente.resumenHoy?.procesosKilos || 0).toFixed(2) }} <small style="font-size:0.6em; color:var(--text-muted);">Kg</small>
            </span>
            <span class="stat-unit" style="color: #2563eb; font-weight: bold;">
              Feteado / Envasado
            </span>
          </div>

          <div class="card stat-card" style="border-left-color: #d97706; background: #fffbeb;">
            <span class="stat-label" style="color: #a16207;">Ajustes y Conversiones</span>
            <span class="stat-value" style="font-size: 1.4rem;">
              {{ ((actividadReciente.resumenHoy?.ajustesKilos || 0) + (actividadReciente.resumenHoy?.conversionesKilos || 0)).toFixed(2) }} <small style="font-size:0.6em; color:var(--text-muted);">Kg</small>
            </span>
            <span class="stat-unit" style="color: #d97706; font-weight: bold;">
              Modificaciones
            </span>
          </div>
        </div>
      </div>

      <!-- Registro de Actividad Reciente (Hoy y Ayer) -->
      <div class="card mt-4">
        <div class="card-header border-bottom pb-2 mb-2" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <h3 class="card-title"><i class="ph ph-clock-counter-clockwise text-accent mr-1"></i>Actividad Reciente (Hoy y Ayer)</h3>
          
          <!-- Botones de pestañas al estilo clásico Windows 98 -->
          <div class="win-tabs" style="display: flex; gap: 2px;">
            <button 
              v-for="tab in ['Todos', 'Ingresos', 'Egresos', 'Procesos', 'Ajustes']" 
              :key="tab"
              :class="['win-tab-btn', activeActivityTab === tab ? 'active' : '']"
              @click="activeActivityTab = tab"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <div class="activity-feed-container" style="max-height: 400px; overflow-y: auto; padding: 0.5rem 0;">
          <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
          <div v-else-if="filteredActivityFeed.length" class="activity-timeline">
            <div 
              v-for="evt in filteredActivityFeed" 
              :key="evt.id" 
              class="activity-item"
              :class="`activity-type-${evt.tipo}`"
            >
              <!-- Icono y color del tipo -->
              <div class="activity-icon-wrapper">
                <i :class="['ph', getActivityIcon(evt)]"></i>
              </div>

              <!-- Contenido principal -->
              <div class="activity-details">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                  <span class="activity-title">
                    <strong>{{ evt.producto_codigo }}</strong> - {{ evt.producto_nombre }}
                  </span>
                  <span class="activity-time">{{ formatRecentDate(evt.fecha) }}</span>
                </div>
                <p class="activity-concept">{{ evt.concepto }}</p>
                <div class="activity-meta">
                  <span class="meta-tag badge-gray"><i class="ph ph-user"></i> {{ evt.usuario }}</span>
                  <span v-if="evt.pendiente" class="badge" style="background-color: var(--accent-orange); color: white; font-size: 0.65rem;">PENDIENTE ENVASADO</span>
                  <span v-if="evt.kilos" class="meta-tag" :class="evt.tipo === 'ingreso' ? 'badge-green' : (evt.tipo === 'egreso' ? 'badge-red' : 'badge-blue')">
                    {{ evt.kilos.toFixed(2) }} Kg
                  </span>
                  <span v-if="evt.piezas" class="meta-tag badge-accent">
                    {{ evt.piezas }} pzs
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-mini text-center" style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No hay actividad registrada en la pestaña seleccionada para las últimas 48 horas.</div>
        </div>
      </div>

      <!-- ── Producción del Día ── -->
      <div class="tables-row mt-4">
        <!-- Feteados del día -->
        <div class="card section-card">
          <div class="card-header border-bottom pb-2 mb-2">
            <h3 class="card-title"><i class="ph ph-knife text-green mr-1"></i>Feteado del día</h3>
          </div>
          <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
          <table v-else-if="produccionDia.feteados.length" class="data-table">
            <thead>
              <tr><th>Código</th><th>Producto</th><th class="text-right">Kg</th><th class="text-right">Bolsitas</th></tr>
            </thead>
            <tbody>
              <tr v-for="f in produccionDia.feteados" :key="f.codigo">
                <td class="code-cell">{{ f.codigo }}</td>
                <td>{{ f.producto }}</td>
                <td class="text-right fw-bold text-green">{{ Number(f.peso_feteado).toFixed(2) }}</td>
                <td class="text-right fw-bold text-accent">{{ f.cantidad_bolsitas }}</td>
              </tr>
            </tbody>
            <tfoot class="total-row">
              <tr>
                <td colspan="2" class="fw-bold">TOTALES</td>
                <td class="text-right fw-bold text-green">{{ adminTotalFeteadoKg.toFixed(2) }}</td>
                <td class="text-right fw-bold text-accent">{{ adminTotalFeteadoBolsitas }}</td>
              </tr>
            </tfoot>
          </table>
          <div v-else class="empty-mini">Sin registros hoy</div>
        </div>

        <!-- Stock a Fetear (MEDIO) -->
        <div class="card section-card">
          <div class="card-header border-bottom pb-2 mb-2">
            <h3 class="card-title"><i class="ph ph-package text-accent mr-1"></i>Stock a Fetear</h3>
          </div>
          <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
          <table v-else-if="filteredStockAFetear.length" class="data-table">
            <thead>
              <tr><th>Código</th><th>Producto</th><th class="text-right">Kg</th></tr>
            </thead>
            <tbody>
              <tr v-for="s in filteredStockAFetear" :key="s.id">
                <td class="code-cell">{{ s.codigo }}</td>
                <td class="truncate-text" :title="s.Producto?.descripcion">{{ s.Producto?.descripcion || '—' }}</td>
                <td class="text-right fw-bold text-green">{{ Number(s.peso).toFixed(2) }}</td>
              </tr>
            </tbody>
            <tfoot class="total-row">
              <tr>
                <td colspan="2" class="fw-bold">TOTAL</td>
                <td class="text-right fw-bold text-green">{{ totalStockAFetearKg.toFixed(2) }}</td>
              </tr>
            </tfoot>
          </table>
          <div v-else class="empty-mini">Sin stock a fetear</div>
        </div>

        <!-- Envasados del día -->
        <div class="card section-card">
          <div class="card-header border-bottom pb-2 mb-2">
            <h3 class="card-title"><i class="ph ph-package text-blue mr-1"></i>Envasado del día</h3>
          </div>
          <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
          <table v-else-if="produccionDia.envasados.length" class="data-table">
            <thead>
              <tr><th>Código</th><th>Producto</th><th class="text-right">Unid.</th></tr>
            </thead>
            <tbody>
              <tr v-for="e in produccionDia.envasados" :key="e.codigo">
                <td class="code-cell">{{ e.codigo }}</td>
                <td>{{ e.producto }}</td>
                <td class="text-right fw-bold text-blue">{{ e.cantidad_bolsitas }}</td>
              </tr>
            </tbody>
            <tfoot class="total-row">
              <tr>
                <td colspan="2" class="fw-bold">TOTAL</td>
                <td class="text-right fw-bold text-blue">{{ adminTotalEnvasado }}</td>
              </tr>
            </tfoot>
          </table>
          <div v-else class="empty-mini">Sin registros hoy</div>
        </div>
      </div>

      <!-- ── Operadores + Mermas ── -->
      <div class="tables-row mt-4">
        <!-- Rendimiento de operadores -->
        <div class="card section-card">
          <div class="card-header border-bottom pb-2 mb-2">
            <h3 class="card-title"><i class="ph ph-users text-accent mr-1"></i>Rendimiento de operadores (hoy)</h3>
          </div>
          <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
          <table v-else-if="produccionOperador.length" class="data-table">
            <thead>
              <tr>
                <th>Operador</th>
                <th class="text-right">Feteado (Kg)</th>
                <th class="text-right">Feteado (Bolsitas)</th>
                <th class="text-right">Envasado (Bolsitas)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="op in produccionOperador" :key="op.nombre">
                <td class="fw-bold">{{ op.nombre }}</td>
                <td class="text-right text-green">{{ Number(op.total_feteado_kilos).toFixed(2) }}</td>
                <td class="text-right text-accent">{{ op.total_feteado_bolsitas }}</td>
                <td class="text-right text-blue">{{ op.total_envasado_bolsitas }}</td>
              </tr>
            </tbody>
            <tfoot class="total-row">
              <tr>
                <td class="fw-bold">TOTALES</td>
                <td class="text-right fw-bold text-green">{{ totalOperadores.feteadoKg.toFixed(2) }}</td>
                <td class="text-right fw-bold text-accent">{{ totalOperadores.feteadoBols }}</td>
                <td class="text-right fw-bold text-blue">{{ totalOperadores.envasadoBols }}</td>
              </tr>
            </tfoot>
          </table>
          <div v-else class="empty-mini">Sin datos de operadores hoy</div>
        </div>

        <!-- Mermas: decomiso y picadas -->
        <div class="mermas-row" style="display: flex; gap: 1rem;">
          <!-- Decomiso -->
          <div class="card section-card" style="flex: 1;">
            <div class="card-header border-bottom pb-2 mb-2">
              <h3 class="card-title"><i class="ph ph-warning-circle text-red mr-1"></i>Decomiso (stock)</h3>
            </div>
            <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
            <table v-else-if="mermasStock.decomiso.length" class="data-table mb-3">
              <thead><tr><th>Código</th><th>Producto</th><th class="text-right">Kg</th></tr></thead>
              <tbody>
                <tr v-for="d in mermasStock.decomiso.slice(0, 5)" :key="d.codigo">
                  <td class="code-cell">{{ d.codigo }}</td>
                  <td>{{ d.nombre }}</td>
                  <td class="text-right fw-bold text-red">{{ Number(d.peso).toFixed(2) }}</td>
                </tr>
              </tbody>
              <tfoot class="total-row">
                <tr>
                  <td colspan="2" class="fw-bold">TOTAL</td>
                  <td class="text-right fw-bold text-red">{{ adminTotalDecomiso.toFixed(2) }}</td>
                </tr>
              </tfoot>
            </table>
            <div v-else class="empty-mini mb-3">Sin decomiso</div>
          </div>
          <!-- Picadas -->
          <div class="card section-card" style="flex: 1;">
            <div class="card-header border-bottom pb-2 mb-2">
              <h3 class="card-title"><i class="ph ph-funnel text-orange mr-1"></i>Picadas (stock)</h3>
            </div>
            <div v-if="isLoading" class="mini-loading"><i class="ph ph-spinner spinner"></i></div>
            <table v-else-if="mermasStock.picadas.length" class="data-table">
              <thead><tr><th>Código</th><th>Producto</th><th class="text-right">Kg</th></tr></thead>
              <tbody>
                <tr v-for="p in mermasStock.picadas.slice(0, 5)" :key="p.codigo">
                  <td class="code-cell">{{ p.codigo }}</td>
                  <td>{{ p.nombre }}</td>
                  <td class="text-right fw-bold text-orange">{{ Number(p.peso).toFixed(2) }}</td>
                </tr>
              </tbody>
              <tfoot class="total-row">
                <tr>
                  <td colspan="2" class="fw-bold">TOTAL</td>
                  <td class="text-right fw-bold text-orange">{{ adminTotalPicadas.toFixed(2) }}</td>
                </tr>
              </tfoot>
            </table>
            <div v-else class="empty-mini">Sin picadas</div>
          </div>
        </div>
      </div>

      <!-- ── Producción Semanal (Tabla) ── -->
      <div class="card mt-4">
        <div class="card-header border-bottom pb-2 mb-3">
          <h3 class="card-title"><i class="ph ph-calendar-blank text-green mr-1"></i>Rendimiento semanal por operador (Lunes–Sábado)</h3>
        </div>
        <div v-if="isLoading" class="loading-state"><i class="ph ph-spinner spinner icon-xl"></i></div>
        <div class="table-responsive" v-else-if="produccionSemanal.length">
          <table class="data-table">
            <thead>
              <tr>
                <th>Operador</th>
                <th v-for="dia in DIAS" :key="dia" class="text-center">{{ dia }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="op in produccionSemanal" :key="op.operador">
                <td class="fw-bold">{{ op.operador }}</td>
                <td v-for="dia in DIAS" :key="dia" class="text-center">
                  <div v-if="op.dias[dia] && (op.dias[dia].feteado_kilos > 0 || op.dias[dia].feteado_bolsitas > 0 || op.dias[dia].envasado_bolsitas > 0)">
                    <div style="display: flex; flex-direction: column; gap: 2px; align-items: center;">
                      <div style="background: #f3f3f3; border-radius: 0; padding: 2px 6px; font-size: 0.78em; color: #222; font-weight: 700; min-width: 60px;">
                        {{ Number((op.dias[dia].feteado_kilos || 0) + (op.dias[dia].envasado_kilos || 0)).toFixed(2) }} Kg
                      </div>
                      <div style="background: #e0e0e0; border-radius: 0; padding: 2px 6px; font-size: 0.78em; color: #222; font-weight: 700; min-width: 60px;">
                        {{ (op.dias[dia].feteado_bolsitas || 0) + (op.dias[dia].envasado_bolsitas || 0) }} unid.
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">
          <i class="ph ph-table icon-xl"></i>
          <p>Sin datos para la semana actual</p>
        </div>
      </div>

    </template>

    <!-- ══════════════ VISTA OPERARIO ══════════════ -->
    <template v-if="false">
      <div class="stats-grid mt-4">
        <div class="card stat-card">
          <span class="stat-label">Total Producido</span>
          <span class="stat-value">{{ totalBolsitas }}</span>
          <span class="stat-unit">unidades</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">Feteado</span>
          <span class="stat-value">{{ produccionPorProceso.Feteado }}</span>
          <span class="stat-unit">unidades</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">Envasado</span>
          <span class="stat-value">{{ produccionPorProceso.Envasado }}</span>
          <span class="stat-unit">unidades</span>
        </div>
      </div>

      <div class="card mt-4 no-padding-mobile">
        <div class="card-header responsive-card-header">
          <h3 class="card-title">Mi Actividad Reciente</h3>
        </div>
        <div class="table-container">
          <div v-if="isLoading" class="loading-state">
            <i class="ph ph-spinner spinner icon-xl"></i>
            <p>Cargando...</p>
          </div>
          <table v-else-if="historial.length" class="responsive-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th class="text-right">Bolsitas</th>
                <th class="d-none-mobile text-center">Proceso</th>
                <th class="d-none-mobile">Fecha</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="item in historial" :key="item.id_produccion">
                <tr @click="toggleRow(item.id_produccion)" :class="{ 'row-expanded': expandedRows.has(item.id_produccion) }">
                  <td>
                    <div class="prod-cell">
                      <span class="fw-bold">{{ item.Producto?.descripcion }}</span>
                      <span class="d-only-mobile text-xs text-muted">{{ item.fecha?.split('T')[0] }}</span>
                    </div>
                  </td>
                  <td class="text-right fw-bold text-blue">{{ item.cantidad_bolsitas }}</td>
                  <td class="d-none-mobile text-center">
                    <span class="badge" :class="item.tipo_proceso === 'Feteado' ? 'badge-primary' : 'badge-warning'">
                      {{ item.tipo_proceso }}
                    </span>
                  </td>
                  <td class="d-none-mobile text-muted text-sm">{{ item.fecha?.split('T')[0] }}</td>
                </tr>
                <tr v-if="expandedRows.has(item.id_produccion)" class="detail-row d-only-mobile">
                  <td colspan="2">
                    <div class="detail-content animate-slide-down">
                      <div class="detail-mini-grid">
                        <div><span class="label">Proceso</span><span class="value">{{ item.tipo_proceso }}</span></div>
                        <div><span class="label">Fecha</span><span class="value">{{ item.fecha?.split('T')[0] }}</span></div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <i class="ph ph-tray icon-xl"></i>
            <p>No hay registros para mostrar.</p>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<style scoped>
/* ─── Layout base ─────────────────────────────────── */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.5rem 0 0.75rem;
}
.welcome-title   { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
.welcome-subtitle { color: var(--text-muted); font-size: 0.78rem; margin-top: 0.1rem; }

/* ─── KPIs ────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
}
.kpi-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  border-radius: 0;
  border: 1px solid rgba(0,0,0,0.04);
}
.kpi-icon { font-size: 1.6rem; opacity: 0.85; }
.kpi-label { display: block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
.kpi-value { font-size: 1.5rem; font-weight: 800; line-height: 1.1; color: var(--text-primary); }
.kpi-value small { font-size: 0.7rem; font-weight: 600; color: var(--text-muted); }

.kpi-green  { background: #f0fdf4; border-color: #bbf7d0; }
.kpi-blue   { background: #eff6ff; border-color: #bfdbfe; }
.kpi-red    { background: #fef2f2; border-color: #fecaca; }
.kpi-orange { background: #fffbeb; border-color: #fde68a; }

/* ─── Sección de tablas en fila ────────────────────── */
.tables-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
.section-card { padding: 0.85rem !important; }

/* ─── Tabla de datos ─────────────────────────────── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.data-table th {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #b0b0b0; /* Más claro que --text-muted */
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid var(--bg-tertiary);
  text-align: left;
}
.data-table td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--bg-tertiary);
  vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--bg-secondary); }

.code-cell  { font-family: monospace; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
.text-green { color: #16a34a; }
.text-blue  { color: #2563eb; }
.text-red   { color: #dc2626; }
.text-orange { color: #d97706; }
.text-accent { color: var(--accent-primary); }

.total-row td {
  background: var(--bg-tertiary);
  border-top: 2px solid var(--bg-tertiary);
  border-bottom: none !important;
  color: var(--text-primary);
  font-size: 0.85rem;
}

.truncate-text {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.merma-subtitle {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  margin: 0.5rem 0 0.25rem;
}
.mb-3 { margin-bottom: 0.75rem; }

/* ─── Tabla responsive ─────────────────────────────── */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}
.text-center { text-align: center !important; }
.text-xs { font-size: 0.65rem; }
.mt-1 { margin-top: 0.25rem; }

/* ─── Estados ────────────────────────────────────── */
.mini-loading { padding: 1.5rem; text-align: center; color: var(--text-muted); }
.empty-mini   { padding: 0.75rem 0.5rem; font-size: 0.78rem; color: var(--text-muted); font-style: italic; }
.loading-state, .empty-state {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* ─── Utilidades ─────────────────────────────────── */
.border-bottom { border-bottom: 1px solid var(--bg-tertiary); }
.pb-2 { padding-bottom: 0.5rem; }
.mb-2 { margin-bottom: 0.75rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mr-1 { margin-right: 0.35rem; }
.fw-bold { font-weight: 700; }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ─── Vista Operario ─────────────────────────────── */
.stats-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.stat-card   { padding: 0.6rem 0.75rem !important; display: flex; flex-direction: column; gap: 0.15rem; border-left: 3px solid var(--accent-primary); }
.stat-label  { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
.stat-value  { font-size: 1.6rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
.stat-unit   { font-size: 0.68rem; color: var(--text-muted); font-weight: 600; }

.prod-cell { display: flex; flex-direction: column; }
.responsive-table tr { cursor: pointer; }
.row-expanded { background: var(--accent-primary-light) !important; }
.detail-row td { padding: 0 !important; }
.detail-content { padding: 0.6rem 0.75rem; background: #e8e5dc; border-bottom: 1px solid var(--bg-tertiary); }
.detail-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.detail-mini-grid .label { display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
.detail-mini-grid .value { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }

.d-none-mobile { display: none; }
.d-only-mobile { display: block; }

/* ─── Responsive ─────────────────────────────────── */
@media (min-width: 640px) {
  .kpi-grid    { grid-template-columns: repeat(4, 1fr); }
}
@media (min-width: 1024px) {
  .tables-row  { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 768px) {
  .d-none-mobile { display: table-cell; }
  .d-only-mobile { display: none !important; }
  .responsive-table tr { cursor: default; }
}

/* ─── Registro de Actividad Reciente (Estilo Win98) ─── */
.win-tabs {
  background: var(--bg-window);
  border: 1px solid var(--bevel-dark);
  padding: 2px;
  display: flex;
}
.win-tab-btn {
  background: #d4d0c8;
  border: 1px solid #fff;
  border-right-color: #808080;
  border-bottom-color: #808080;
  color: #000;
  padding: 3px 10px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  outline: none;
}
.win-tab-btn:active, .win-tab-btn.active {
  background: #e4e0d8;
  border: 1px solid #808080;
  border-right-color: #fff;
  border-bottom-color: #fff;
  box-shadow: inset 1px 1px 0px #000;
}

.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.5rem;
}
.activity-item {
  display: flex;
  gap: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--bevel-dark);
  padding: 0.6rem 0.75rem;
  border-radius: 0;
}
.activity-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 0;
  flex-shrink: 0;
  font-size: 1.1rem;
  box-shadow: var(--inset-shadow);
  background: var(--bg-window);
}
.activity-type-ingreso .activity-icon-wrapper { background: #dcfce7; color: #16a34a; }
.activity-type-egreso .activity-icon-wrapper { background: #fee2e2; color: #dc2626; }
.activity-type-proceso .activity-icon-wrapper { background: #dbeafe; color: #2563eb; }
.activity-type-conversion .activity-icon-wrapper { background: #fef3c7; color: #d97706; }
.activity-type-ajuste .activity-icon-wrapper { background: #f3f4f6; color: #4b5563; }

.activity-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.activity-title { font-size: 0.82rem; color: var(--text-primary); }
.activity-time { font-size: 0.72rem; color: var(--text-muted); }
.activity-concept { font-size: 0.78rem; margin: 0; color: var(--text-secondary); font-style: italic; }

.activity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.25rem;
}
.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 0;
  border: 1px solid rgba(0, 0, 0, 0.05);
}
.badge-gray { background: #e5e7eb; color: #374151; }
.badge-green { background: #dcfce7; color: #16a34a; }
.badge-red { background: #fee2e2; color: #dc2626; }
.badge-blue { background: #dbeafe; color: #2563eb; }
.badge-accent { background: var(--accent-primary-light); color: var(--accent-primary); }

/* Estilos para Menú Colaborador */
.mobile-menu-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
}

.menu-item-btn {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  background-color: var(--bg-window);
  border: 2px solid var(--bevel-dark);
  border-radius: 0;
  color: var(--text-primary);
  text-decoration: none;
  text-align: left;
  transition: all 0.12s ease;
  cursor: pointer;
  width: 100%;
}

.menu-item-btn:active {
  transform: scale(0.97);
  background-color: #e2e8f0;
}

.menu-item-icon {
  width: 42px;
  height: 42px;
  background-color: var(--accent-primary-light);
  color: var(--accent-primary);
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.logout-icon {
  background-color: #fee2e2;
  color: var(--accent-danger);
}

.menu-item-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.menu-item-text .title {
  font-size: 0.95rem;
  font-weight: 700;
}

.menu-item-text .desc {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.chevron {
  font-size: 1.1rem;
  color: var(--text-muted);
}

.logout-item-btn {
  border-color: #fee2e2;
}
.logout-item-btn:active {
  background-color: #fef2f2;
}
</style>
