const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function testAbmGenera2() {
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
      '/abm_genera2.php',
      '/block_ordenes.php',
      '/proc_productos.php',
      '/proc_globals.php'
    ]

    for (const ep of testEndpoints) {
      try {
        const res = await axios.post(`${host}${ep}`, 'accion=test', { headers, timeout: 5000, validateStatus: () => true })
        console.log(`[${res.status}] ${ep.padEnd(25)} | Data: ${String(res.data).substring(0, 200)}`)
      } catch (e) {
        console.log(`[ERR] ${ep}: ${e.message}`)
      }
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

testAbmGenera2()
