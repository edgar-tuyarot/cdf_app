<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'

const authStore = useAuthStore()
const codigo = ref('')
const stockDisponible = ref(null)
const isLoadingStock = ref(false)
const isSubmitting = ref(false)
const stockAFetear = ref([])

const form = ref({
  cantidad: '',
  peso: ''
})

const cargarStockAFetear = async () => {
  // Mock data for now, or actual API call if configured
  stockAFetear.value = [
    { id: 1, codigo: '8010', peso: 15.5, cantidad: 50 },
    { id: 2, codigo: '8020', peso: 8.2, cantidad: 20 }
  ]
}

onMounted(() => {
  cargarStockAFetear()
})

const buscarStock = async () => {
  if (!codigo.value) return
  isLoadingStock.value = true
  // Mock finding stock
  setTimeout(() => {
    stockDisponible.value = { codigo: codigo.value, cantidad: 45, peso: 12.5 }
    isLoadingStock.value = false
  }, 500)
}

const registrarEnvasado = async () => {
  isSubmitting.value = true
  setTimeout(() => {
    console.log('Envasado registrado', { ...form.value, codigo: codigo.value })
    isSubmitting.value = false
    stockDisponible.value = null
    codigo.value = ''
    form.value = { cantidad: '', peso: '' }
  }, 1000)
}
</script>

<template>
  <div class="envasado-view">
    <header class="view-header">
      <h2>Envasado</h2>
      <p>Registro de productos finalizados</p>
    </header>

    <BaseCard>
      <template #header>
        <h3>Registro de Envasado</h3>
      </template>

      <div class="search-section">
        <BaseInput 
          v-model="codigo" 
          label="Código de Producto" 
          placeholder="Ej: 8010" 
          @keyup.enter="buscarStock"
        />
        <BaseButton @click="buscarStock" :disabled="isLoadingStock">
          {{ isLoadingStock ? '...' : '🔍 Buscar' }}
        </BaseButton>
      </div>

      <div v-if="stockDisponible" class="stock-info fade-in">
        <div class="info-item">
          <span class="label">Stock Disponible</span>
          <span class="value">{{ stockDisponible.cantidad }} u</span>
        </div>
        <div class="info-item">
          <span class="label">Peso Total</span>
          <span class="value">{{ stockDisponible.peso }} kg</span>
        </div>
      </div>

      <form v-if="stockDisponible" @submit.prevent="registrarEnvasado" class="envasado-form fade-in">
        <BaseInput 
          v-model="form.cantidad" 
          label="Cantidad a Envasar" 
          type="number" 
          placeholder="0" 
        />
        <BaseInput 
          v-model="form.peso" 
          label="Peso Envasado (kg)" 
          type="number" 
          step="0.001" 
          placeholder="0.000" 
        />
        
        <BaseButton variant="primary" fullWidth :disabled="isSubmitting">
          {{ isSubmitting ? 'Registrando...' : 'Confirmar Envasado' }}
        </BaseButton>
      </form>
    </BaseCard>

    <BaseCard>
      <template #header>
        <h3>Stock para Envasar</h3>
      </template>
      <div class="table-wrapper">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Cód.</th>
              <th>Peso</th>
              <th>Cant.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in stockAFetear" :key="item.id">
              <td><strong>{{ item.codigo }}</strong></td>
              <td>{{ item.peso }} kg</td>
              <td>{{ item.cantidad }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.view-header {
  margin-bottom: var(--space-lg);
}

.search-section {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: var(--space-lg);
}

.stock-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  background-color: #F0F0F0;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border);
  margin-bottom: var(--space-lg);
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item .label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.info-item .value {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-primary);
}

.envasado-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.table-wrapper {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table th {
  text-align: left;
  padding: 12px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  border-bottom: 2px solid var(--color-border);
}

.modern-table td {
  padding: 12px;
  border-bottom: 1px solid #EEE;
}

.modern-table tr:last-child td {
  border-bottom: none;
}
</style>
