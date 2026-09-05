const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function parseWmsMenuData() {
  try {
    const config = cargarConfiguracion()
    const host = config.host.replace(/\/+$/, '')
    const loginRes = await loginWMS(config)
    const sessionId = loginRes.sessionId || config.sessionId

    const headers = {
      'User-Agent': 'Mozilla/5.0',
      'Cookie': `PHPSESSID=${sessionId}`
    }

    const res = await axios.get(`${host}/js/Menu/menudata.js`, { headers, timeout: 5000 })
    const content = String(res.data)

    console.log(`\n=== /js/Menu/menudata.js (${content.length} bytes) ===`)
    
    // Extraer todos los links .php o nombres de funciones
    const matches = content.match(/["']([^"'\s>]+\.php[^"'\s>]*)["']/gi) || []
    const uniquePhp = Array.from(new Set(matches.map(m => m.replace(/["']/g, ''))))
    console.log(`Archivos PHP en el menú de BlockWMS (${uniquePhp.length} encontrados):`)
    console.log(uniquePhp.slice(0, 50))

    // Buscar nombres de módulos de Recepción o Ingresos
    const recepcionMatches = content.match(/\{[^}]*(?:recepc|ingres|orden)[^}]*\}/gi) || []
    if (recepcionMatches.length > 0) {
      console.log('\n--- MÓDULOS DE RECEPCIÓN / INGRESOS EN EL MENÚ ---')
      console.log(recepcionMatches.slice(0, 15).join('\n---\n'))
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

parseWmsMenuData()
