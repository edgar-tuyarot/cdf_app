const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function parseHomeMenu() {
  try {
    const config = cargarConfiguracion()
    const host = config.host.replace(/\/+$/, '')
    const loginRes = await loginWMS(config)
    const sessionId = loginRes.sessionId || config.sessionId

    const headers = {
      'User-Agent': 'Mozilla/5.0',
      'Cookie': `PHPSESSID=${sessionId}`
    }

    const res = await axios.get(`${host}/home.php`, { headers, timeout: 5000 })
    const html = String(res.data)

    console.log(`\n=== /home.php Content Length: ${html.length} bytes ===`)
    
    // Buscar menús, enlaces o llamadas JS a páginas PHP
    const links = html.match(/href=['"]?([^'"\s>]+?\.php[^'"\s>]*)['"]?/gi) || []
    console.log('Enlaces PHP en home.php:', Array.from(new Set(links.map(l => l.replace(/href=['"]?/i, '').replace(/['"]$/, '')))))

    const scripts = html.match(/src=['"]?([^'"\s>]+?\.js[^'"\s>]*)['"]?/gi) || []
    console.log('Scripts JS en home.php:', Array.from(new Set(scripts.map(s => s.replace(/src=['"]?/i, '').replace(/['"]$/, '')))))

    // Buscar si hay llamadas a treeview o ajax menu
    const treeMatches = html.match(/add\([^)]+\)/gi) || html.match(/d\.add\([^)]+\)/gi) || []
    if (treeMatches.length > 0) {
      console.log(`\n--- ÍTEMS DEL MENÚ BLOCKWMS (${treeMatches.length} ítems) ---`)
      console.log(treeMatches.slice(0, 30).join('\n'))
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

parseHomeMenu()
