// Intercept global fetch to automatically inject active location header
const originalFetch = window.fetch;
window.fetch = async function (resource, options) {
  const user = localStorage.getItem('user');
  let locationId = '1';
  if (user) {
    try {
      const parsed = JSON.parse(user);
      if (parsed.id_ubicacion) {
        locationId = String(parsed.id_ubicacion);
      }
    } catch (e) {
      console.error('Error parsing user from localStorage in fetch interceptor', e);
    }
  }

  const newOptions = options ? { ...options } : {};
  let headersObj = {};
  if (newOptions.headers) {
    if (typeof newOptions.headers.forEach === 'function') {
      newOptions.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
    } else if (Array.isArray(newOptions.headers)) {
      newOptions.headers.forEach(([key, value]) => {
        headersObj[key] = value;
      });
    } else {
      headersObj = { ...newOptions.headers };
    }
  }
  
  headersObj['X-Ubicacion-Id'] = locationId;
  newOptions.headers = headersObj;

  return originalFetch(resource, newOptions);
};

import { createApp } from 'vue'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import { pinia } from './stores'

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
