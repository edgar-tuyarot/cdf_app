import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useVariabilidadStore = defineStore('variabilidad', () => {
  // Estado de la consulta
  const loading = ref(false)
  const hasSearched = ref(false)
  const error = ref('')
  const justCompleted = ref(false)
  let justCompletedTimeout = null

  // Timer
  const elapsedTime = ref(0)
  let timerInterval = null

  const startTimer = () => {
    elapsedTime.value = 0
    clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      elapsedTime.value += 0.1
    }, 100)
  }

  const stopTimer = () => {
    clearInterval(timerInterval)
    timerInterval = null
  }

  const formattedTimer = computed(() => elapsedTime.value.toFixed(1))

  // Parámetros de la última consulta realizada
  const codigo1 = ref('')
  const codigo2 = ref('')
  const fechaDesde = ref('')
  const fechaHasta = ref('')
  const soloAjustes = ref(true)

  // Resultados
  const metricas1 = ref(null)
  const metricas2 = ref(null)
  const brechaKilosNetos = ref(0)
  const items1 = ref([])
  const items2 = ref([])
  const itemsCombinados = ref([])

  /**
   * Ejecuta la comparación en segundo plano.
   * Si el usuario navega a otra pantalla de CDF, esta función continúa
   * ejecutándose en el contexto global de Pinia sin interrumpirse.
   */
  const ejecutarComparacion = async ({ c1, c2, fDesde, fHasta, ajustes }) => {
    if (!c1 || !c2) {
      error.value = 'Debes especificar ambos códigos de producto.'
      return false
    }

    codigo1.value = String(c1).trim()
    codigo2.value = String(c2).trim()
    fechaDesde.value = fDesde
    fechaHasta.value = fHasta
    soloAjustes.value = ajustes !== false

    loading.value = true
    hasSearched.value = true
    error.value = ''
    justCompleted.value = false
    clearTimeout(justCompletedTimeout)
    startTimer()

    try {
      const params = new URLSearchParams({
        codigo1: codigo1.value,
        codigo2: codigo2.value,
        fecha_desde: fechaDesde.value,
        fecha_hasta: fechaHasta.value,
        solo_ajustes: soloAjustes.value ? 'true' : 'false'
      })

      let res
      try {
        res = await fetch(`/api/wms/comparacion-variabilidad?${params.toString()}`, {
          suppressGlobalError: true
        })
      } catch (netErr) {
        throw new Error('El servidor de BlockWMS demoró más de lo esperado en procesar la consulta. Prueba seleccionando un rango de fechas más acotado (ej: 7 o 14 días).')
      }

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al obtener datos de BlockWMS.')
      }

      metricas1.value = data.metricas1
      metricas2.value = data.metricas2
      brechaKilosNetos.value = data.brechaKilosNetos
      items1.value = data.items1 || []
      items2.value = data.items2 || []
      itemsCombinados.value = data.itemsCombinados || []

      justCompleted.value = true
      justCompletedTimeout = setTimeout(() => {
        justCompleted.value = false
      }, 45000)

      return true
    } catch (e) {
      console.error('[VariabilidadStore] Error en consulta de variabilidad:', e)
      error.value = e.message || 'Error al conectar con BlockWMS.'
      return false
    } finally {
      stopTimer()
      loading.value = false
    }
  }

  const limpiarResultados = () => {
    metricas1.value = null
    metricas2.value = null
    brechaKilosNetos.value = 0
    items1.value = []
    items2.value = []
    itemsCombinados.value = []
    hasSearched.value = false
    error.value = ''
  }

  return {
    loading,
    hasSearched,
    error,
    justCompleted,
    elapsedTime,
    formattedTimer,
    codigo1,
    codigo2,
    fechaDesde,
    fechaHasta,
    soloAjustes,
    metricas1,
    metricas2,
    brechaKilosNetos,
    items1,
    items2,
    itemsCombinados,
    ejecutarComparacion,
    limpiarResultados
  }
})
