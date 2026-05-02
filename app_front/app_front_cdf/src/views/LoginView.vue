<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMsg.value = 'Por favor, completa todos los campos'
    return
  }

  isLoading.value = true
  errorMsg.value = ''

  const result = await authStore.login(username.value, password.value)

  if (result.success) {
    router.push('/')
  } else {
    errorMsg.value = result.message
  }
  isLoading.value = false
}
</script>

<template>
  <div class="login-page">
    <div class="login-container fade-in">
      <header class="login-header">
        <h1 class="logo">CDF APP</h1>
      </header>

      <BaseCard>
        <template #header>
          <h2>Iniciar Sesión</h2>
          <p class="subtitle">Ingresa tus credenciales para acceder</p>
        </template>

        <form @submit.prevent="handleLogin">
          <BaseInput 
            v-model="username" 
            label="Usuario" 
            placeholder="Nombre de usuario" 
            :disabled="isLoading"
          />
          
          <BaseInput 
            v-model="password" 
            label="Contraseña" 
            type="password"
            placeholder="••••••••" 
            :disabled="isLoading"
          />

          <div v-if="errorMsg" class="error-box animate-shake">
            {{ errorMsg }}
          </div>

          <BaseButton 
            variant="primary" 
            fullWidth 
            type="submit"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Entrando...' : 'Entrar' }}
          </BaseButton>
        </form>
      </BaseCard>

      <footer class="login-footer">
        <p>&copy; 2026 CDF Production System</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
  padding: var(--space-md);
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.login-header .logo {
  color: var(--color-primary);
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: -2px;
}

.subtitle {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.error-box {
  background-color: #FFF0F0;
  color: #D32F2F;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 2px solid #D32F2F;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: var(--space-md);
  text-align: center;
}

.login-footer {
  text-align: center;
  margin-top: var(--space-xl);
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.2s ease-in-out 0s 2;
}
</style>
