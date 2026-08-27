<script setup>
import { ref, watch } from 'vue'
import { useWinDialog } from '../composables/useWinDialog'

const { isVisible, dialogTitle, dialogMessage, dialogType, dialogDetails, accept, cancel } = useWinDialog()

const showDetails = ref(false)
const copied = ref(false)

watch(isVisible, (newVal) => {
  if (!newVal) {
    showDetails.value = false
    copied.value = false
  }
})

const copyDetails = async () => {
  try {
    const info = [
      `Título: ${dialogTitle.value}`,
      `Mensaje: ${dialogMessage.value}`,
      dialogDetails.value ? `Detalles: ${JSON.stringify(dialogDetails.value, null, 2)}` : ''
    ].filter(Boolean).join('\n')

    await navigator.clipboard.writeText(info)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err)
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isVisible" class="win-dialog-overlay" @click.self="dialogType === 'confirm' ? cancel() : accept()">
      <div class="win-dialog" :style="{ maxWidth: dialogDetails ? '560px' : '440px', width: '90%' }">
        <!-- Title bar -->
        <div class="win-dialog-titlebar">
          <span class="win-dialog-titlebar-text">{{ dialogTitle }}</span>
          <button class="win-dialog-close" @click="dialogType === 'confirm' ? cancel() : accept()">X</button>
        </div>

        <!-- Body -->
        <div class="win-dialog-body" style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
            <div class="win-dialog-icon" style="flex-shrink: 0;">
              <i v-if="dialogType === 'success'" class="ph ph-check-circle" style="color:#2e7d32;font-size:2rem"></i>
              <i v-else-if="dialogType === 'error'" class="ph ph-x-circle" style="color:#c62828;font-size:2rem"></i>
              <i v-else-if="dialogType === 'warning'" class="ph ph-warning" style="color:#e65100;font-size:2rem"></i>
              <i v-else-if="dialogType === 'confirm'" class="ph ph-question" style="color:#1565c0;font-size:2rem"></i>
              <i v-else class="ph ph-info" style="color:#1565c0;font-size:2rem"></i>
            </div>
            <div style="flex-grow: 1;">
              <p class="win-dialog-msg" style="margin: 0; white-space: pre-wrap; line-height: 1.4;">{{ dialogMessage }}</p>
            </div>
          </div>

          <!-- Bloque de detalles técnicos colapsable -->
          <div v-if="dialogDetails" style="border-top: 1px dashed var(--bevel-dark); padding-top: 0.5rem; margin-top: 0.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <button 
                type="button"
                @click="showDetails = !showDetails" 
                style="background: none; border: none; color: #1565c0; cursor: pointer; font-size: 0.78rem; font-weight: bold; padding: 0; display: flex; align-items: center; gap: 0.25rem;"
              >
                <i :class="['ph', showDetails ? 'ph-caret-up' : 'ph-caret-down']"></i>
                {{ showDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos' }}
              </button>

              <button 
                type="button"
                @click="copyDetails"
                style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; cursor: pointer; font-size: 0.72rem; padding: 2px 6px; display: flex; align-items: center; gap: 0.25rem;"
                title="Copiar reporte completo para soporte"
              >
                <i :class="['ph', copied ? 'ph-check' : 'ph-copy']"></i>
                {{ copied ? '¡Copiado!' : 'Copiar detalle' }}
              </button>
            </div>

            <div v-if="showDetails" style="margin-top: 0.5rem; background-color: #0f172a; color: #38bdf8; font-family: monospace; font-size: 0.75rem; padding: 0.6rem; border-radius: 4px; max-height: 180px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;">
              <div v-if="dialogDetails.status || dialogDetails.method">
                <strong style="color: #f43f5e;">Petición:</strong> {{ dialogDetails.method || 'GET' }} {{ dialogDetails.url || dialogDetails.path || '' }}
                <span v-if="dialogDetails.status"> | Status: <strong>{{ dialogDetails.status }}</strong></span>
              </div>
              <div v-if="dialogDetails.error" style="margin-top: 0.25rem;">
                <strong style="color: #f43f5e;">Error:</strong> {{ dialogDetails.error }}
              </div>
              <div v-if="dialogDetails.detalles" style="margin-top: 0.25rem; color: #94a3b8;">
                <strong style="color: #fbbf24;">Detalles:</strong> {{ typeof dialogDetails.detalles === 'object' ? JSON.stringify(dialogDetails.detalles, null, 2) : dialogDetails.detalles }}
              </div>
              <div v-if="dialogDetails.stack" style="margin-top: 0.25rem; color: #64748b;">
                <strong style="color: #fbbf24;">Stack:</strong> {{ dialogDetails.stack }}
              </div>
              <div v-if="!dialogDetails.status && !dialogDetails.error && !dialogDetails.stack" style="color: #cbd5e1;">
                {{ JSON.stringify(dialogDetails, null, 2) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="win-dialog-footer">
          <template v-if="dialogType === 'confirm'">
            <button class="win-dialog-btn" @click="accept">Aceptar</button>
            <button class="win-dialog-btn" @click="cancel">Cancelar</button>
          </template>
          <template v-else>
            <button class="win-dialog-btn win-dialog-btn-ok" @click="accept">Aceptar</button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
