<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseSelect from '../components/BaseSelect.vue'

const form = ref({
  codigo_producto: '',
  estado: '',
  kilos: '',
  unidades: '',
  ubicacion: ''
})

const estados = [
  { value: 'PIEZA', label: 'Pieza' },
  { value: 'FRACCIONADO', label: 'Fraccionado' },
  { value: 'RECORTE', label: 'Recorte' },
  { value: 'ENVASADO', label: 'Envasado' },
  { value: 'DECOMISADO', label: 'Decomisado' },
  { value: 'KILOS', label: 'Kilos' }
]

const ubicaciones = ref([])
const productos = ref([])
const isSubmitting = ref(false)
const message = ref({ text: '', type: '' })

const fetchProductos = async () => {
  try {
    const res = await fetch('/api/productos')
    if (res.ok) {
      productos.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching products:', error)
  }
}

const fetchUbicaciones = async () => {
  try {
    const res = await fetch('/api/ubicaciones')
    if (res.ok) {
      const data = await res.json()
      ubicaciones.value = data.map(u => ({ value: u.id, label: `${u.numero} - ${u.nombre}` }))
    }
  } catch (error) {
    console.error('Error fetching locations:', error)
  }
}

onMounted(() => {
  fetchProductos()
  fetchUbicaciones()
})

const isUnidadesEnabled = computed(() => {
  return ['PIEZA', 'ENVASADO', 'FRACCIONADO'].includes(form.value.estado)
})

const isKilosEnabled = computed(() => {
  return ['RECORTE', 'DECOMISADO', 'KILOS'].includes(form.value.estado)
})

watch(() => form.value.estado, (newEstado) => {
  if (['PIEZA', 'ENVASADO', 'FRACCIONADO'].includes(newEstado)) {
    form.value.kilos = ''
  } else if (['RECORTE', 'DECOMISADO', 'KILOS'].includes(newEstado)) {
    form.value.unidades = ''
  }
})

const registrarExistencia = async () => {
  if (!form.value.codigo_producto || !form.value.estado || !form.value.ubicacion) {
    message.value = { text: 'Completa los campos obligatorios.', type: 'error' }
    return
  }

  isSubmitting.value = true
  message.value = { text: '', type: '' }

  try {
    const payload = {
      codigo_producto: form.value.codigo_producto,
      estado: form.value.estado,
      kilos: form.value.kilos ? Number(form.value.kilos) : null,
      unidades: form.value.unidades ? Number(form.value.unidades) : null,
      ubicacionId: Number(form.value.ubicacion)
    }

    const res = await fetch('/api/existencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      message.value = { text: 'Existencia registrada correctamente.', type: 'success' }
      form.value = { codigo_producto: '', estado: '', kilos: '', unidades: '', ubicacion: '' }
    } else {
      const data = await res.json().catch(() => ({}))
      message.value = { text: data.message || 'Error al registrar existencia.', type: 'error' }
    }
  } catch (error) {
    message.value = { text: 'Error de conexión.', type: 'error' }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="existencias-view">
    <header class="view-header">
      <h2>Existencias</h2>
      <p>Gestión de stock físico y ubicaciones</p>
    </header>

    <BaseCard>
      <template #header>
        <h3>Carga de Stock</h3>
      </template>

      <form @submit.prevent="registrarExistencia" class="modern-form">
        <div class="form-grid">
          <BaseInput 
            v-model="form.codigo_producto" 
            label="Código de Producto *" 
            placeholder="Escribe o selecciona..." 
            list="productos-list"
            required
          />
          <datalist id="productos-list">
            <option v-for="p in productos" :key="p.codigo" :value="p.codigo">
              {{ p.codigo }} - {{ p.nombre }}
            </option>
          </datalist>
          
          <BaseSelect 
            v-model="form.estado" 
            label="Estado *" 
            placeholder="Selecciona estado"
            :options="estados"
            required
          />
        </div>

        <div class="form-grid">
          <BaseInput 
            v-model="form.kilos" 
            label="Kilogramos" 
            type="number" 
            step="0.001" 
            placeholder="0.000" 
            :disabled="!isKilosEnabled"
          />
          
          <BaseInput 
            v-model="form.unidades" 
            label="Unidades" 
            type="number" 
            placeholder="0" 
            :disabled="!isUnidadesEnabled"
          />
        </div>

        <BaseSelect 
          v-model="form.ubicacion" 
          label="Ubicación *" 
          placeholder="Selecciona ubicación"
          :options="ubicaciones"
          required
        />

        <div v-if="message.text" :class="['alert', message.type]">
          {{ message.text }}
        </div>

        <BaseButton 
          variant="primary" 
          fullWidth 
          type="submit" 
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Registrando...' : 'Confirmar Stock' }}
        </BaseButton>
      </form>
    </BaseCard>
  </div>
</template>

<style scoped>
.view-header {
  margin-bottom: var(--space-lg);
}

.modern-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.alert {
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border);
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: var(--space-md);
  text-align: center;
}

.alert.success {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.alert.error {
  background-color: #FFEBEE;
  color: #C62828;
}

@media (max-width: 480px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
