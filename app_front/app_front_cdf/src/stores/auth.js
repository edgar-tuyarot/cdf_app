import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = ref(false)

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        user.value = { usuario: username }
        isAuthenticated.value = true
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.message || 'Error en el login' }
      }
    } catch (error) {
      return { success: false, message: 'Error de conexión con el servidor' }
    }
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
  }

  return { user, isAuthenticated, login, logout }
})
