import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = ref(false)

  const isColaborador = computed(() => user.value?.rol === 'COLABORADOR')

  const login = async (username, password) => {
    try {
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      })

      // Si el login es exitoso, Spring redirige a /api/auth/success
      // fetch sigue los redireccionamientos por defecto, por lo que 'response' será el resultado de /api/auth/success
      if (response.ok) {
        const data = await response.json()
        
        user.value = { 
          usuario: username,
          rol: data.rol || 'ADMIN' 
        }
        isAuthenticated.value = true
        return { success: true, message: 'Sesión iniciada' }
      } else {
        // Si falló (redirigió a /api/auth/failure o devolvió error)
        return { success: false, message: 'Usuario o contraseña incorrectos' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Error de conexión con el servidor' }
    }
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
  }

  return { user, isAuthenticated, isColaborador, login, logout }
})
