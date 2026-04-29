// Instancia compartida de pinia para uso fuera de componentes (ej: router guards)
// Ver: https://pinia.vuejs.org/core-concepts/outside-component-usage.html
import { createPinia } from 'pinia'

export const pinia = createPinia()
