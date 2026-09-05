const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function parseWmsLevels() {
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

    for (const lvl of ['Nivel1', 'Nivel2', 'Nivel3']) {
      const res = await axios.post(`${host}/proc_menu.php`, `accion=${lvl}`, { headers, timeout: 5000 })
      console.log(`\n=== /proc_menu.php (accion=${lvl}) ===`)
      let data = res.data
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) {}
      }
      if (Array.isArray(data)) {
        console.log(`Fila de muestra (Total: ${data.length}):`)
        console.table(data.slice(0, 10))
      } else {
        console.log(String(res.data).substring(0, 500))
      }
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

parseWmsLevels()
