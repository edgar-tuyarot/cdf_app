const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function testProcGlobals() {
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
      'query',
      'execute',
      'exec',
      'sql',
      'update',
      'run',
      'save'
    ]

    for (const a of testAcciones) {
      const payload = new URLSearchParams({
        accion: a,
        sql: "UPDATE Ordenes SET id_status = 3 WHERE id_ordenes = 1241873",
        query: "UPDATE Ordenes SET id_status = 3 WHERE id_ordenes = 1241873"
      })

      const res = await axios.post(`${host}/proc_globals.php`, payload, { headers, timeout: 4000, validateStatus: () => true })
      console.log(`[accion=${a.padEnd(12)}] Status: ${res.status} | Data: ${String(res.data).substring(0, 150)}`)
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

testProcGlobals()
