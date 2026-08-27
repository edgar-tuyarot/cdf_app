import { ref } from 'vue'

// Estado global singleton
const isVisible = ref(false)
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogType = ref('info') // 'info' | 'confirm' | 'warning' | 'error' | 'success'
const dialogDetails = ref(null) // Para stack traces, endpoint, HTTP status, etc.
let resolvePromise = null

const showDialog = (message, { title = 'Información', type = 'info', details = null } = {}) => {
  dialogTitle.value = title
  dialogMessage.value = message
  dialogType.value = type
  dialogDetails.value = details
  isVisible.value = true

  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

const accept = () => {
  isVisible.value = false
  if (resolvePromise) resolvePromise(true)
  resolvePromise = null
  dialogDetails.value = null
}

const cancel = () => {
  isVisible.value = false
  if (resolvePromise) resolvePromise(false)
  resolvePromise = null
  dialogDetails.value = null
}

// Atajos
const winAlert = (message, type = 'info', details = null) => {
  const titles = {
    info: 'Información',
    success: 'Éxito',
    warning: 'Advertencia',
    error: 'Error de Operación'
  }
  return showDialog(message, { title: titles[type] || 'Información', type, details })
}

const winConfirm = (message, title = 'Confirmar') => {
  return showDialog(message, { title, type: 'confirm' })
}

const winErrorModal = (message, { title = 'Error de Sistema', details = null } = {}) => {
  return showDialog(message, { title, type: 'error', details })
}

export function useWinDialog() {
  return {
    isVisible,
    dialogTitle,
    dialogMessage,
    dialogType,
    dialogDetails,
    showDialog,
    accept,
    cancel,
    winAlert,
    winConfirm,
    winErrorModal
  }
}
