import { ref } from 'vue'

// Estado global singleton
const isVisible = ref(false)
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogType = ref('info') // 'info' | 'confirm' | 'warning' | 'error' | 'success'
let resolvePromise = null

const showDialog = (message, { title = 'Información', type = 'info' } = {}) => {
  dialogTitle.value = title
  dialogMessage.value = message
  dialogType.value = type
  isVisible.value = true

  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

const accept = () => {
  isVisible.value = false
  if (resolvePromise) resolvePromise(true)
  resolvePromise = null
}

const cancel = () => {
  isVisible.value = false
  if (resolvePromise) resolvePromise(false)
  resolvePromise = null
}

// Atajos
const winAlert = (message, type = 'info') => {
  const titles = {
    info: 'Información',
    success: 'Éxito',
    warning: 'Advertencia',
    error: 'Error'
  }
  return showDialog(message, { title: titles[type] || 'Información', type })
}

const winConfirm = (message, title = 'Confirmar') => {
  return showDialog(message, { title, type: 'confirm' })
}

export function useWinDialog() {
  return {
    isVisible,
    dialogTitle,
    dialogMessage,
    dialogType,
    showDialog,
    accept,
    cancel,
    winAlert,
    winConfirm
  }
}
