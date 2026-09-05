const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function discoverWmsRecepcionEndpoints() {
  try {
    const config = cargarConfiguracion()
    const host = config.host.replace(/\/+$/, '')
    const loginRes = await loginWMS(config)
    const sessionId = loginRes.sessionId || config.sessionId

    console.log(`Probeando conexión con BlockWMS en ${host} (Session: ${sessionId})...`)

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Cookie': `PHPSESSID=${sessionId}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    const potentialEndpoints = [
      '/recepcion.php',
      '/proc_recepcion.php',
      '/frm_recepcion.php',
      '/ordenes_ingreso.php',
      '/proc_ordenes_ingreso.php',
      '/proc_ordenes.php',
      '/ajax_recepcion.php',
      '/ajax_ordenes.php',
      '/proc_recepcion_save.php',
      '/frm_ordenes_ingreso.php',
      '/proc_ordenes_items.php',
      '/proc_abm_ordenes.php',
      '/frm_abm_ordenes.php',
      '/ingreso.php',
      '/frm_ingreso.php',
      '/proc_ingreso.php'
    ]

    console.log('\n--- DIAGNÓSTICO DE ENDPOINTS DE RECEPCIÓN BLOCKWMS ---')

    for (const ep of potentialEndpoints) {
      try {
        const url = `${host}${ep}`
        const res = await axios.get(url, { headers, timeout: 5000, validateStatus: () => true })
        
        const isHTML = typeof res.data === 'string' && (res.data.includes('<html') || res.data.includes('<form') || res.data.includes('<?php'))
        const titleMatch = typeof res.data === 'string' ? res.data.match(/<title>(.*?)<\/title>/i) : null
        const title = titleMatch ? titleMatch[1].trim() : 'Sin título'
        
        console.log(`[${res.status}] ${ep.padEnd(28)} | ${isHTML ? 'HTML Form' : 'JSON/Texto'} | Título: ${title}`)

        if (isHTML && typeof res.data === 'string' && res.data.includes('<form')) {
          const formMatches = res.data.match(/<form[^>]*action=['"]?([^'"\s>]+)['"]?[^>]*>/gi)
          if (formMatches) {
            console.log(`   -> Formularios encontrados: ${formMatches.join(' | ')}`)
          }
          const inputNames = res.data.match(/name=['"]([^'"]+)['"]/gi)
          if (inputNames && inputNames.length > 0) {
            const uniqueNames = Array.from(new Set(inputNames.map(n => n.replace(/name=['"]/i, '').replace(/['"]/, '')))).slice(0, 10)
            console.log(`   -> Inputs principales: ${uniqueNames.join(', ')}`)
          }
        }
      } catch (err) {
        console.log(`[ERR] ${ep.padEnd(28)} | Error: ${err.message}`)
      }
    }

    process.exit(0)
  } catch (err) {
    console.error('Error durante diagnóstico:', err.message)
    process.exit(1)
  }
}

discoverWmsRecepcionEndpoints()
