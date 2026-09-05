const { obtenerOrdenesIngresoPendientesWMS, cargarConfiguracion } = require('../src/services/wmsService')

async function testSiteQuery() {
  try {
    const config = cargarConfiguracion()
    console.log('Site ID en config:', config.siteId)

    const result = await obtenerOrdenesIngresoPendientesWMS({}, { siteId: config.siteId })
    console.log('Resultado de obtenerOrdenesIngresoPendientesWMS:')
    console.log(`- totalItems: ${result.totalItems}`)
    console.log(`- totalOrdenes: ${result.totalOrdenes}`)
    console.log(`- totalPendienteKilos: ${result.totalPendienteKilos}`)

    if (result.items.length > 0) {
      console.log('\n--- PRIMERAS 5 FILAS ---')
      console.table(result.items.slice(0, 5))
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

testSiteQuery()
