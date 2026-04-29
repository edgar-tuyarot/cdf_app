<script setup>
import { useWinDialog } from '../composables/useWinDialog'

const { isVisible, dialogTitle, dialogMessage, dialogType, accept, cancel } = useWinDialog()
</script>

<template>
  <Teleport to="body">
    <div v-if="isVisible" class="win-dialog-overlay" @click.self="dialogType === 'confirm' ? cancel() : accept()">
      <div class="win-dialog">
        <!-- Title bar -->
        <div class="win-dialog-titlebar">
          <span class="win-dialog-titlebar-text">{{ dialogTitle }}</span>
          <button class="win-dialog-close" @click="dialogType === 'confirm' ? cancel() : accept()">X</button>
        </div>
        <!-- Body -->
        <div class="win-dialog-body">
          <div class="win-dialog-icon">
            <i v-if="dialogType === 'success'" class="ph ph-check-circle" style="color:#2e7d32;font-size:2rem"></i>
            <i v-else-if="dialogType === 'error'" class="ph ph-x-circle" style="color:#c62828;font-size:2rem"></i>
            <i v-else-if="dialogType === 'warning'" class="ph ph-warning" style="color:#e65100;font-size:2rem"></i>
            <i v-else-if="dialogType === 'confirm'" class="ph ph-question" style="color:#1565c0;font-size:2rem"></i>
            <i v-else class="ph ph-info" style="color:#1565c0;font-size:2rem"></i>
          </div>
          <p class="win-dialog-msg">{{ dialogMessage }}</p>
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
