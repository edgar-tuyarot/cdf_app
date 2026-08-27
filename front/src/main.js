import { createApp } from 'vue'
import '@phosphor-icons/web/regular'
import '@phosphor-icons/web/bold'
import '@phosphor-icons/web/fill'
import '@phosphor-icons/web/duotone'
import '@phosphor-icons/web/light'
import '@phosphor-icons/web/thin'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import { useWinDialog } from './composables/useWinDialog'

// Interceptor global de Fetch para inyectar ubicación y capturar errores HTTP/Red
const originalFetch = window.fetch;
window.fetch = async function (resource, options = {}) {
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

  const newOptions = { ...options };
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

  const url = typeof resource === 'string' ? resource : (resource?.url || 'API');
  const method = (newOptions.method || 'GET').toUpperCase();

  try {
    const response = await originalFetch(resource, newOptions);

    // Si la petición falla (HTTP status >= 400) y no se silenció explícitamente el modal global
    if (!response.ok && !newOptions.suppressGlobalError && !newOptions.silentError) {
      const clonedRes = response.clone();
      let errorMsg = `Error HTTP ${response.status}: ${response.statusText || 'Error en servidor'}`;
      let technicalDetails = {
        url,
        method,
        status: response.status,
        statusText: response.statusText
      };

      try {
        const data = await clonedRes.json();
        if (data) {
          if (data.error) errorMsg = data.error;
          else if (data.message) errorMsg = data.message;
          technicalDetails = { ...technicalDetails, ...data };
        }
      } catch (jsonErr) {
        try {
          const text = await clonedRes.text();
          if (text) {
            technicalDetails.errorText = text.length > 500 ? text.substring(0, 500) + '...' : text;
          }
        } catch (tErr) {}
      }

      const { winErrorModal } = useWinDialog();
      winErrorModal(errorMsg, {
        title: `Error en Operación (HTTP ${response.status})`,
        details: technicalDetails
      });
    }

    return response;
  } catch (netErr) {
    // Error de red / Conexión rehusada / Servidor caído
    if (!newOptions.suppressGlobalError && !newOptions.silentError) {
      const { winErrorModal } = useWinDialog();
      winErrorModal('No se pudo establecer comunicación con el servidor backend. Verifique que el servidor esté activo y su conexión a red.', {
        title: 'Error de Conexión de Red',
        details: {
          url,
          method,
          error: netErr.message || 'Failed to fetch',
          stack: netErr.stack
        }
      });
    }
    throw netErr;
  }
};

const app = createApp(App)

// Manejador global de excepciones en Vue
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Global Error Handler]', err, info);
  const { winErrorModal } = useWinDialog();
  winErrorModal(`Ocurrió un error inesperado en la interfaz (${info}): ${err.message || err}`, {
    title: 'Error de la Aplicación (Vue)',
    details: {
      componentInfo: info,
      error: err.message || String(err),
      stack: err.stack
    }
  });
};

// Captura global de promesas rechazadas no atrapadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
  // Omitir si fue una cancelación intencional de red o similar
  if (event.reason && (event.reason.name === 'AbortError' || event.reason.suppressGlobalError)) return;
  
  const { winErrorModal } = useWinDialog();
  const msg = event.reason?.message || event.reason?.error || (typeof event.reason === 'string' ? event.reason : 'Excepción asíncrona no controlada');
  winErrorModal(`Error no controlado: ${msg}`, {
    title: 'Error Asíncrono no Controlado',
    details: {
      error: msg,
      stack: event.reason?.stack || String(event.reason)
    }
  });
});

app.use(pinia)
app.use(router)

app.mount('#app')
