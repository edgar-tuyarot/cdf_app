const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function testMenuActions() {
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

    const acciones = ['menu', 'getmenu', 'obtener_menu', 'cargar_menu', 'init', 'list', 'build_menu', 'get_nodes']

    for (const a of acciones) {
      const res = await axios.post(`${host}/proc_menu.php`, `accion=${a}`, { headers, timeout: 5000, validateStatus: () => true })
      console.log(`[accion=${a}] Status: ${res.status} | Data: ${String(res.data).substring(0, 150)}`)
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

testMenuActions()
