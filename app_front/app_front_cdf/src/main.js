import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
import { setActivePinia } from 'pinia'
setActivePinia(pinia)

app.use(router)

app.mount('#app')
