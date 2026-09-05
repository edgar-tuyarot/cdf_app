const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function parseMenuService() {
  try {
    const config = cargarConfiguracion()
    const host = config.host.replace(/\/+$/, '')
    const loginRes = await loginWMS(config)
    const sessionId = loginRes.sessionId || config.sessionId

    const headers = {
      'User-Agent': 'Mozilla/5.0',
      'Cookie': `PHPSESSID=${sessionId}`
    }

    const res = await axios.get(`${host}/js/Menu/menuservice.js`, { headers, timeout: 5000 })
    const content = String(res.data)

    console.log(`\n=== /js/Menu/menuservice.js (${content.length} bytes) ===`)
    console.log(content.substring(0, 2000))

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

parseMenuService()
