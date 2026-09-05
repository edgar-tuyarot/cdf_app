const { consultarSqlWMS } = require('../src/services/wmsService')

async function testQuotes() {
  try {
    // Test 1: Single quotes '194326'
    const sql1 = `SELECT id_ordenes, codigo_ordenes, status FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE id_entidades_sites = '194326' AND status NOT IN ('Cancelada', 'Cerrada', 'Finalizada', 'Anulada', 'Baja')`
    const rows1 = await consultarSqlWMS(sql1)
    console.log(`[Test 1 - Single quotes '194326']: ${rows1.length} filas`)

    // Test 2: Double single quotes ''194326''
    const sql2 = `SELECT id_ordenes, codigo_ordenes, status FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE id_entidades_sites = ''194326'' AND status NOT IN (''Cancelada'', ''Cerrada'', ''Finalizada'', ''Anulada'', ''Baja'')`
    const rows2 = await consultarSqlWMS(sql2)
    console.log(`[Test 2 - Double single quotes ''194326'']: ${rows2.length} filas`)

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

testQuotes()
