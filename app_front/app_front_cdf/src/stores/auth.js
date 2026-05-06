import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const storedUser = localStorage.getItem('auth_user')
  const user = ref(storedUser ? JSON.parse(storedUser) : null)
  const isAuthenticated = ref(!!storedUser)

  const isColaborador = computed(() => user.value?.rol === 'COLABORADOR')

  const login = async (username, password) => {
    try {
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)
      formData.append('remember-me', 'true')

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
          id: data.id || null,
          usuario: username,
          rol: data.rol || 'ADMIN' 
        }
        isAuthenticated.value = true
        localStorage.setItem('auth_user', JSON.stringify(user.value))
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
    localStorage.removeItem('auth_user')
  }

  return { user, isAuthenticated, isColaborador, login, logout }
})
