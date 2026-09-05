const axios = require('axios')
const { cargarConfiguracion, loginWMS } = require('../src/services/wmsService')

async function inspectProcOrdenes() {
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

    console.log('Inspeccionando /proc_ordenes.php en BlockWMS...')

    // Probar GET
    const resGet = await axios.get(`${host}/proc_ordenes.php`, { headers, timeout: 5000, validateStatus: () => true })
    console.log(`[GET /proc_ordenes.php] Status: ${resGet.status}`)
    console.log('Respuesta GET (primeros 500 chars):', String(resGet.data).substring(0, 500))

    // Probar POST con acciones comunes (ej: accion=get_orden, accion=recepcion, etc.)
    const accionesToTest = [
      'recepcion',
      'recepcionar',
      'cerrar_orden',
      'guardar_recepcion',
      'save_recepcion',
      'update_orden',
      'confirmar_ingreso'
    ]

    for (const acc of accionesToTest) {
      const params = new URLSearchParams({ accion: acc, id_ordenes: '1256967' })
      const resPost = await axios.post(`${host}/proc_ordenes.php`, params, { headers, timeout: 5000, validateStatus: () => true })
      console.log(`\n[POST accion=${acc}] Status: ${resPost.status}`)
      console.log('Respuesta POST:', String(resPost.data).substring(0, 300))
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

inspectProcOrdenes()
