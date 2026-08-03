<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Configuración de Permisos</h2>
        <p class="page-description">Define las vistas y módulos a los que tiene acceso cada rol en la plataforma.</p>
      </div>
      <div class="header-actions" style="margin-top: 0.5rem;">
        <button class="btn btn-primary" @click="savePermisos" :disabled="saving">
          <i class="ph ph-spinner spinner" v-if="saving"></i>
          <i class="ph ph-floppy-disk" v-else></i>
          Guardar Configuración
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- TABS DE ROLES -->
    <div class="card-tabs" style="display: flex; gap: 0.25rem; margin-bottom: -1px; position: relative; z-index: 2; flex-wrap: wrap;">
      <button 
        v-for="role in rolesList" 
        :key="role.value"
        :class="['btn', activeRole === role.value ? 'btn-primary' : 'btn-secondary']" 
        @click="activeRole = role.value"
        style="border-radius: 4px 4px 0 0; padding: 0.5rem 1.25rem; border-bottom: none; font-weight: bold; display: flex; align-items: center; gap: 0.4rem;"
      >
        <i :class="['ph', role.icon]"></i>
        {{ role.label }}
      </button>
    </div>

    <!-- PANEL DE PERMISOS PARA EL ROL SELECCIONADO -->
    <div class="card">
      <div class="card-header" style="background: var(--bevel-dark); border-bottom: 2px solid var(--bevel-dark);">
        <span class="card-title" style="color: white; font-weight: bold;">
          Vistas habilitadas para el rol: {{ rolesList.find(r => r.value === activeRole)?.label }}
        </span>
      </div>

      <div class="card-body" style="padding: 1.5rem;">
        <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;">
          <div 
            v-for="group in permissionGroups" 
            :key="group.name" 
            style="background: var(--bg-secondary); border: 2px solid var(--bevel-dark); border-radius: var(--border-radius-md); padding: 1rem; box-shadow: var(--inset-shadow);"
          >
            <h4 style="margin: 0 0 1rem 0; font-weight: bold; font-size: 0.95rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem; border-bottom: 2px solid var(--bevel-dark); padding-bottom: 0.25rem;">
              <i :class="['ph', group.icon]" style="color: var(--accent-primary);"></i>
              {{ group.name }}
            </h4>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
              <div 
                v-for="item in group.items" 
                :key="item.path"
                style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--bg-window); border: 1px solid var(--bevel-dark); border-radius: 4px;"
              >
                <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                  <span style="font-weight: bold; font-size: 0.85rem; color: var(--text-primary);">{{ item.name }}</span>
                  <span style="font-size: 0.7rem; color: var(--text-muted);">{{ item.path }}</span>
                </div>

                <label class="switch-container" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
                  <input 
                    type="checkbox" 
                    :checked="getPermissionState(activeRole, item.path)" 
                    @change="togglePermission(activeRole, item.path)"
                    style="width: 18px; height: 18px; cursor: pointer;"
                  />
                  <span style="font-size: 0.8rem; font-weight: bold;" :style="{ color: getPermissionState(activeRole, item.path) ? 'var(--accent-success)' : 'var(--text-muted)' }">
                    {{ getPermissionState(activeRole, item.path) ? 'Habilitado' : 'Bloqueado' }}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const activeRole = ref('Referente')
const loading = ref(true)
const saving = ref(false)

const alert = ref({
  show: false,
  message: '',
  type: 'success'
})

const showAlert = (message, type = 'success') => {
  alert.value = { show: true, message, type }
  setTimeout(() => {
    alert.value.show = false
  }, 4000)
}

// Lista de roles definidos
const rolesList = [
  { value: 'Referente', label: 'Referentes', icon: 'ph-user-gear' },
  { value: 'Preparador', label: 'Preparadores', icon: 'ph-package' },
  { value: 'Feteador', label: 'Feteadores', icon: 'ph-knife' },
  { value: 'Envasador', label: 'Envasadores', icon: 'ph-mailbox' },
  { value: 'Colaborador', label: 'Colaboradores', icon: 'ph-users-three' },
  { value: 'Usuario', label: 'Usuarios (General)', icon: 'ph-user' },
  { value: 'Sucursal', label: 'Sucursales (Clientes)', icon: 'ph-storefront' }
]

// Lista de rutas organizadas por grupos
const permissionGroups = [
  {
    name: 'Inventario',
    icon: 'ph-package',
    items: [
      { name: 'Productos', path: 'productos' },
      { name: 'Ingreso Mercadería', path: 'ingresos' },
      { name: 'Historial de Stock', path: 'movimientos-stock' },
      { name: 'Vencimientos', path: 'vencimientos' },
      { name: 'Control de Piezas', path: 'control-piezas' }
    ]
  },
  {
    name: 'Producción',
    icon: 'ph-arrows-clockwise',
    items: [
      { name: 'Procesos', path: 'procesos' },
      { name: 'Conversiones', path: 'conversiones' },
      { name: 'Ingreso Recortes', path: 'ingreso-recortes' },
      { name: 'Recortes', path: 'recortes' },
      { name: 'Decomisos', path: 'decomisos' }
    ]
  },
  {
    name: 'Pedidos',
    icon: 'ph-shopping-cart',
    items: [
      { name: 'Preparar', path: 'preparar' },
      { name: 'Pedidos (Ver Todos)', path: 'pedidos' },
      { name: 'Cargar Pedido', path: 'crear-pedido-sucursal' },
      { name: 'Demanda Pendiente', path: 'demanda-pendiente' }
    ]
  },
  {
    name: 'Configuración',
    icon: 'ph-gear',
    items: [
      { name: 'Colaboradores', path: 'colaboradores' },
      { name: 'Sucursales', path: 'sucursales' },
      { name: 'Proveedores', path: 'proveedores' },
      { name: 'Bultos', path: 'bultos' },
      { name: 'Ubicaciones', path: 'ubicaciones' },
      { name: 'Usuarios', path: 'usuarios' }
    ]
  }
]

// Permisos en memoria
const dbPermisos = ref([])

// Cargar permisos desde base de datos
const fetchPermisos = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/permisos')
    if (res.ok) {
      dbPermisos.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching permissions:', error)
    showAlert('Error al conectar con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

// Obtener estado activo/inactivo para el switch
const getPermissionState = (role, path) => {
  const perm = dbPermisos.value.find(
    p => p.rol.toLowerCase() === role.toLowerCase() && p.vista.replace(/^\//, '') === path.replace(/^\//, '')
  )
  return perm ? !!perm.permitido : false
}

// Toggle local en memoria
const togglePermission = (role, path) => {
  const idx = dbPermisos.value.findIndex(
    p => p.rol.toLowerCase() === role.toLowerCase() && p.vista.replace(/^\//, '') === path.replace(/^\//, '')
  )

  if (idx !== -1) {
    dbPermisos.value[idx].permitido = !dbPermisos.value[idx].permitido
  } else {
    // Si no existía, lo agregamos como activo
    dbPermisos.value.push({
      rol: role,
      vista: path,
      permitido: true
    })
  }
}

// Guardar al servidor
const savePermisos = async () => {
  saving.value = true
  try {
    const res = await fetch('/api/permisos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permisos: dbPermisos.value })
    })

    if (res.ok) {
      showAlert('Configuración de permisos guardada exitosamente')
      // Forzar recarga en el store global para actualizar el menú de inmediato
      await authStore.loadPermissions()
    } else {
      showAlert('Error al guardar la configuración de permisos', 'error')
    }
  } catch (error) {
    console.error('Error saving permissions:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(fetchPermisos)
</script>

<style scoped>
.switch-container input:focus {
  outline: 2px solid var(--accent-primary);
}
</style>
