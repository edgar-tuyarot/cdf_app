<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseCheckbox from '../components/BaseCheckbox.vue'

const router = useRouter()
const isSubmitting = ref(false)
const error = ref('')
const success = ref(false)

const form = ref({
  codigo: '',
  nombre: '',
  picable: false,
  feteable: false,
  kilosPorBolsita: ''
})

const handleSubmit = async () => {
  isSubmitting.value = true
  error.value = ''
  success.value = false

  try {
    const response = await fetch('/api/productos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}` // Add auth if needed, assuming handled by interceptors or similar
      },
      body: JSON.stringify({
        ...form.value,
        kilosPorBolsita: parseFloat(form.value.kilosPorBolsita) || 0
      })
    })

    if (!response.ok) {
      throw new Error('Error al dar de alta el producto')
    }

    success.value = true
    // Reset form after success
    form.value = {
      codigo: '',
      nombre: '',
      picable: false,
      feteable: false,
      kilosPorBolsita: ''
    }
    
    setTimeout(() => {
      success.value = false
    }, 3000)

  } catch (err) {
    error.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="nuevo-producto-view">
    <header class="view-header">
      <h2>Alta de Producto</h2>
      <p>Registrar un nuevo producto en el sistema</p>
    </header>

    <BaseCard>
      <template #header>
        <h3>Información del Producto</h3>
      </template>

      <form @submit.prevent="handleSubmit" class="product-form">
        <BaseInput 
          v-model="form.codigo" 
          label="Código" 
          placeholder="Ej: 8010" 
          required
        />
        
        <BaseInput 
          v-model="form.nombre" 
          label="Nombre del Producto" 
          placeholder="Ej: Queso Tybo" 
          required
        />

        <div class="checkbox-group">
          <BaseCheckbox 
            v-model="form.picable" 
            label="¿Es picable?" 
          />
          
          <BaseCheckbox 
            v-model="form.feteable" 
            label="¿Es feteable?" 
          />
        </div>

        <BaseInput 
          v-model="form.kilosPorBolsita" 
          label="Kilos por Bolsita" 
          type="number" 
          step="0.001" 
          placeholder="0.000" 
          required
        />

        <div v-if="error" class="error-message">
          ⚠️ {{ error }}
        </div>

        <div v-if="success" class="success-message">
          ✅ Producto registrado con éxito
        </div>

        <div class="form-actions">
          <BaseButton 
            type="button" 
            variant="secondary" 
            @click="router.back()"
            :disabled="isSubmitting"
          >
            Cancelar
          </BaseButton>
          <BaseButton 
            type="submit" 
            variant="primary" 
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Guardando...' : 'Dar de Alta' }}
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>

<style scoped>
.view-header {
  margin-bottom: var(--space-lg);
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.checkbox-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.form-actions {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.form-actions > * {
  flex: 1;
}

.error-message {
  background-color: #FFF0F0;
  color: #D32F2F;
  padding: 12px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid #FFCDD2;
}

.success-message {
  background-color: #E8F5E9;
  color: #2E7D32;
  padding: 12px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid #C8E6C9;
}

@media (max-width: 480px) {
  .checkbox-group {
    grid-template-columns: 1fr;
  }
}
</style>
