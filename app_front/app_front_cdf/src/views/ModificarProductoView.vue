<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseCheckbox from '../components/BaseCheckbox.vue'
import BaseSelect from '../components/BaseSelect.vue'

const router = useRouter()
const route = useRoute()
const productoCodigo = route.params.id

const isSubmitting = ref(false)
const isLoadingData = ref(true)
const error = ref('')
const success = ref(false)
const proveedores = ref([])

const form = ref({
  codigo: '',
  nombre: '',
  picable: false,
  feteable: false,
  kilosPorBolsita: '',
  proveedorId: ''
})

const fetchProduct = async () => {
  try {
    const res = await fetch(`/api/productos/${productoCodigo}`)
    if (!res.ok) throw new Error('Error al cargar el producto')
    const data = await res.json()
    form.value = {
      codigo: data.codigo,
      nombre: data.nombre,
      picable: data.picable,
      feteable: data.feteable,
      kilosPorBolsita: data.kilosPorBolsita,
      proveedorId: data.proveedorId
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoadingData.value = false
  }
}

const fetchProveedores = async () => {
  try {
    const res = await fetch('/api/proveedores')
    if (res.ok) {
      const data = await res.json()
      proveedores.value = data.map(p => ({ value: p.id, label: p.nombre }))
    }
  } catch (err) {
    console.error('Error fetching suppliers:', err)
  }
}

onMounted(async () => {
  if (!productoCodigo) {
    isLoadingData.value = false
    return
  }
  await Promise.all([fetchProduct(), fetchProveedores()])
})

const handleSubmit = async () => {
  isSubmitting.value = true
  error.value = ''
  success.value = false

  try {
    const response = await fetch(`/api/productos/${productoCodigo}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        codigo: form.value.codigo,
        nombre: form.value.nombre,
        picable: form.value.picable,
        feteable: form.value.feteable,
        kilosPorBolsita: parseFloat(form.value.kilosPorBolsita) || 0,
        proveedorId: Number(form.value.proveedorId)
      })
    })

    if (!response.ok) {
      throw new Error('Error al actualizar el producto')
    }

    success.value = true
    
    setTimeout(() => {
      router.push('/productos')
    }, 1500)

  } catch (err) {
    error.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="modificar-producto-view">
    <header class="view-header">
      <h2>Modificar Producto</h2>
      <p>Actualizar información del producto</p>
    </header>

    <BaseCard>
      <template #header>
        <h3>Información del Producto</h3>
      </template>

      <div v-if="!productoCodigo" class="placeholder-content">
        <span class="icon">🔍</span>
        <p>Por favor, selecciona un producto del listado para editarlo.</p>
        <BaseButton @click="router.push('/productos')" variant="primary">
          Ver Listado de Productos
        </BaseButton>
      </div>

      <div v-else-if="isLoadingData" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando datos del producto...</p>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="product-form">
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

        <BaseSelect 
          v-model="form.proveedorId" 
          label="Proveedor *" 
          placeholder="Selecciona un proveedor"
          :options="proveedores"
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
          ✅ Producto actualizado con éxito. Redirigiendo...
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
            {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
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

.loading-state, .placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  color: var(--color-text-muted);
  text-align: center;
}

.icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-md);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .checkbox-group {
    grid-template-columns: 1fr;
  }
}
</style>
