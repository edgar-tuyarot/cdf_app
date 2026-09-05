const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function parseProcMenu() {
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

    const res = await axios.post(`${host}/proc_menu.php`, 'accion=get_menu', { headers, timeout: 5000, validateStatus: () => true })
    console.log(`[POST /proc_menu.php] Status: ${res.status}`)
    let data = res.data
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) {}
    }

    console.log('Estructura de respuesta de proc_menu.php:', typeof data)
    if (Array.isArray(data)) {
      console.log(`Total ítems de menú: ${data.length}`)
      console.log('Muestra primeros 15 ítems:')
      console.log(data.slice(0, 15))
    } else {
      console.log('Respuesta raw:', String(res.data).substring(0, 1000))
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

parseProcMenu()
