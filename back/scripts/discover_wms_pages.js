const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function discoverWmsPages() {
  try {
    const config = cargarConfiguracion()
    const host = config.host.replace(/\/+$/, '')
    const loginRes = await loginWMS(config)
    const sessionId = loginRes.sessionId || config.sessionId

    const headers = {
      'User-Agent': 'Mozilla/5.0',
      'Cookie': `PHPSESSID=${sessionId}`
    }

    // Pedir /main.php o /index.php o /menu.php
    const pagesToTry = ['/main.php', '/index.php', '/menu.php', '/home.php']

    for (const p of pagesToTry) {
      const res = await axios.get(`${host}${p}`, { headers, timeout: 5000, validateStatus: () => true })
      console.log(`\n=== PÁGINA: ${p} (Status: ${res.status}, Length: ${String(res.data).length}) ===`)
      if (typeof res.data === 'string') {
        const phpMatches = res.data.match(/[a-zA-Z0-9_]+\.php/gi)
        if (phpMatches) {
          const uniquePhp = Array.from(new Set(phpMatches))
          console.log('Archivos PHP encontrados en la página:', uniquePhp)
        }
      }
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

discoverWmsPages()
