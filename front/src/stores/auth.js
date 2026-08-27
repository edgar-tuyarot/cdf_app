import { defineStore } from 'pinia'
import { ref } from 'vue'


export const useAuthStore = defineStore('auth', () => {
  // Cargar sesión guardada de localStorage si existe
  const savedUser = localStorage.getItem('user')
  const user = ref(savedUser ? JSON.parse(savedUser) : null)
  const isAuthenticated = ref(!!savedUser)
  const permissions = ref([])

  const loadPermissions = async () => {
    try {
      const res = await fetch('/api/permisos')
      if (res.ok) {
        permissions.value = await res.json()
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
    }
  }

  // Cargar permisos automáticamente al iniciar el store si ya hay sesión guardada
  if (isAuthenticated.value) {
    loadPermissions()
  }

  const hasPermission = (viewPath, allowedRoles = []) => {
    const userRole = user.value?.rol?.toLowerCase() || ''
    if (!userRole) return false
    if (userRole === 'admin') return true // Admin siempre tiene acceso total

    // Normalizar ruta (remover barra inicial y pasar a minúsculas)
    const viewName = viewPath.replace(/^\//, '').toLowerCase()

    // Buscar el permiso configurado explícitamente en la base de datos
    const perm = permissions.value.find(
      p => p.rol.toLowerCase() === userRole && p.vista.replace(/^\//, '').toLowerCase() === viewName
    )

    if (perm !== undefined) {
      return !!perm.permitido
    }

    // Si existen permisos configurados en BBDD para este ROL pero esta vista no está registrada,
    // se DENEGA el acceso (Principio de seguridad: denegación implícita por defecto)
    const roleHasDbConfig = permissions.value.some(p => p.rol.toLowerCase() === userRole)
    if (roleHasDbConfig) {
      return false
    }

    // Fallback a roles estáticos únicamente si la base de datos no tiene ningún registro para este rol
    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
      const allowedRolesLower = allowedRoles.map(r => r.toLowerCase())
      return allowedRolesLower.includes(userRole)
    }

    return false // Bloquear por defecto
  }

  const login = async (usuario, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario, password })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        user.value = data.user
        isAuthenticated.value = true
        localStorage.setItem('user', JSON.stringify(data.user))
        await loadPermissions()
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Credenciales incorrectas' }
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      return { success: false, error: 'Error de conexión con el servidor' }
    }
  }

  const loginComoSucursal = async (sucursal) => {
    const mockUser = {
      id_usuario: 9999 + sucursal.id,
      usuario: sucursal.sucursal,
      nombre_completo: sucursal.sucursal,
      rol: 'Sucursal',
      estado: 'Activo',
      id_sucursal: sucursal.id
    }
    user.value = mockUser
    isAuthenticated.value = true
    localStorage.setItem('user', JSON.stringify(mockUser))
    await loadPermissions()
    return { success: true }
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
    permissions.value = []
    localStorage.removeItem('user')
  }

  return {
    user,
    isAuthenticated,
    permissions,
    loadPermissions,
    hasPermission,
    login,
    loginComoSucursal,
    logout
  }
})
