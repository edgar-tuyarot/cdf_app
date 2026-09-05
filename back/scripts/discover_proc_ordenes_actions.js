const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function discoverProcOrdenesActions() {
  try {
    const config = cargarConfiguracion()
    const host = config.host.replace(/\/+$/, '')
    const loginRes = await loginWMS(config)
    const sessionId = loginRes.sessionId || config.sessionId

    const headers = {
      'User-Agent': 'Mozilla/5.0',
      'Cookie': `PHPSESSID=${sessionId}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    const testAcciones = [
      'cerrar',
      'finalizar',
      'guardar',
      'save',
      'insert',
      'update',
      'recepcion_guardar',
      'orden_cerrar',
      'orden_finalizar',
      'finalizar_orden',
      'abm_ordenes'
    ]

    for (const a of testAcciones) {
      const payload = new URLSearchParams({
        accion: a,
        codigo_ordenes: '299626',
        id_ordenes: '1241873'
      })

      const res = await axios.post(`${host}/proc_ordenes.php`, payload, { headers, timeout: 5000, validateStatus: () => true })
      console.log(`[accion=${a.padEnd(20)}] Status: ${res.status} | Data: ${String(res.data).substring(0, 150)}`)
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

discoverProcOrdenesActions()
