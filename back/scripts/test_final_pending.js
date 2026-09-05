const { obtenerOrdenesIngresoPendientesWMS, cargarConfiguracion } = require('../src/services/wmsService')

async function testFinalPending() {
  try {
    const config = cargarConfiguracion()
    console.log('Site ID:', config.siteId)

    const result = await obtenerOrdenesIngresoPendientesWMS({}, { siteId: config.siteId })
    console.log(`\n✅ Órdenes pendientes cargadas exitosamente para site ${config.siteId}:`)
    console.log(`- Total Ítems: ${result.totalItems}`)
    console.log(`- Total Órdenes: ${result.totalOrdenes}`)
    console.log(`- Total Pendiente Kilos: ${result.totalPendienteKilos}`)

    if (result.items.length > 0) {
      console.log('\n--- MUESTRA DE LAS PRIMERAS 5 FILAS ---')
      console.table(result.items.slice(0, 5))
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

testFinalPending()
