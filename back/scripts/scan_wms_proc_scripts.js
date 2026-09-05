const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function scanProcScripts() {
  try {
    const config = cargarConfiguracion()
    const host = config.host.replace(/\/+$/, '')
    const loginRes = await loginWMS(config)
    const sessionId = loginRes.sessionId || config.sessionId

    const headers = {
      'User-Agent': 'Mozilla/5.0',
      'Cookie': `PHPSESSID=${sessionId}`
    }

    const jsList = [
      '/js/library.js',
      '/js/library_datatable.js',
      '/js/library_datatable_advanced.js',
      '/js/globalsdata.js',
      '/js/genera_listado.js',
      '/js/library_modals.js'
    ]

    console.log('--- ESCANEANDO CONTROLADORES PHP REFERENCIADOS EN SCRIPTS BASE ---')

    for (const js of jsList) {
      try {
        const res = await axios.get(`${host}${js}`, { headers, timeout: 5000, validateStatus: () => true })
        if (res.status === 200 && typeof res.data === 'string') {
          const phpFiles = res.data.match(/[a-zA-Z0-9_]+\.php/gi)
          if (phpFiles) {
            console.log(`\nEn ${js}:`)
            console.log(Array.from(new Set(phpFiles)))
          }
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

scanProcScripts()
