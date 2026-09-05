const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function discoverWriteEndpoints() {
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

    const testEndpoints = [
      '/proc_abm.php',
      '/proc_guardar.php',
      '/proc_ejecutar.php',
      '/proc_query.php',
      '/proc_sql.php',
      '/proc_exec.php',
      '/proc_accion.php',
      '/proc_save.php',
      '/proc_update.php',
      '/proc_abm_ordenes_ingreso.php',
      '/proc_ordenes_ingreso_save.php',
      '/proc_grabar.php'
    ]

    console.log('--- BUSCANDO ENDPOINTS PHP DE ESCRITURA EN BLOCKWMS ---')

    for (const ep of testEndpoints) {
      try {
        const res = await axios.post(`${host}${ep}`, 'query=SELECT+1', { headers, timeout: 4000, validateStatus: () => true })
        const titleMatch = typeof res.data === 'string' ? res.data.match(/<title>(.*?)<\/title>/i) : null
        const title = titleMatch ? titleMatch[1].trim() : 'Sin título'
        console.log(`[${res.status}] ${ep.padEnd(32)} | Título: ${title} | Body: ${String(res.data).substring(0, 100)}`)
      } catch (err) {
        console.log(`[ERR] ${ep.padEnd(32)} | ${err.message}`)
      }
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

discoverWriteEndpoints()
