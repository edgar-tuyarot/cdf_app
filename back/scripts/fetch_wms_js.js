const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function fetchWmsJsFiles() {
  try {
    const config = cargarConfiguracion()
    const host = config.host.replace(/\/+$/, '')
    const loginRes = await loginWMS(config)
    const sessionId = loginRes.sessionId || config.sessionId

    const headers = {
      'User-Agent': 'Mozilla/5.0',
      'Cookie': `PHPSESSID=${sessionId}`
    }

    const jsFiles = [
      '/js/genera_listado.js',
      '/js/ordenes.js',
      '/js/recepcion.js',
      '/js/ingresos.js',
      '/js/block.js'
    ]

    for (const js of jsFiles) {
      try {
        const res = await axios.get(`${host}${js}`, { headers, timeout: 5000, validateStatus: () => true })
        if (res.status === 200 && typeof res.data === 'string') {
          console.log(`\n=== ARTIFACT JS: ${js} (${res.data.length} bytes) ===`)
          const procMatches = res.data.match(/proc_[a-zA-Z0-9_]+\.php/g)
          if (procMatches) {
            console.log('Endpoints PHP referenciados:', Array.from(new Set(procMatches)))
          }
          const accionMatches = res.data.match(/accion\s*[:=]\s*['"]([^'"]+)['"]/g)
          if (accionMatches) {
            console.log('Acciones referenciadas:', Array.from(new Set(accionMatches)))
          }
        } else {
          console.log(`[${res.status}] ${js}`)
        }
      } catch (e) {
        console.log(`[ERR] ${js}: ${e.message}`)
      }
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

fetchWmsJsFiles()
