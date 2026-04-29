import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const isAuthenticated = ref(!!user.value)

  const login = async (usuario, password) => {
    try {
      const res = await fetch('/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      })

      const data = await res.json()

      if (res.ok) {
        // NORMALIZACIÓN CRÍTICA:
        // Tu API devuelve { "mensaje": "...", "usuario": { ... } } o { "usuario": [{ ... }] }
        // Extraemos solo el objeto del usuario
        let userData = data.usuario
        
        // Si la API devuelve el usuario dentro de un array [ { ... } ]
        if (Array.isArray(userData)) {
          userData = userData[0]
        }

        user.value = userData
        isAuthenticated.value = true
        localStorage.setItem('user', JSON.stringify(userData))
        
        console.log('Sesión iniciada correctamente:', userData)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Credenciales inválidas' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Error de conexión con el servidor' }
    }
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('user')
  }

  return {
    user,
    isAuthenticated,
    login,
    logout
  }
})
