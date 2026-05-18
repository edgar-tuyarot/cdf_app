import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Usuario administrador hardcodeado para acceso directo
  const adminUser = {
    id_usuario: 1,
    usuario: 'Edgar',
    nombre_completo: 'Edgar',
    rol: 'Admin',
    estado: 'Activo'
  }

  const user = ref(adminUser)
  const isAuthenticated = ref(true)

  const login = async (usuario, password) => {
    // Simulamos un login exitoso siempre
    return { success: true }
  }

  const logout = () => {
    // Desactivado el cierre de sesión real
    console.log('Sesión modo administrador (logout deshabilitado)')
  }

  return {
    user,
    isAuthenticated,
    login,
    logout
  }
})
