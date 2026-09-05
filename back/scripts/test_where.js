const { consultarSqlWMS } = require('../src/services/wmsService')

async function testWhere() {
  try {
    // Test A: id_entidades_sites direct
    const sqlA = `SELECT id_ordenes, codigo_ordenes, status, id_entidades_sites, site, cantidad_original, Cantidad_recibida FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE id_entidades_sites = ''194326'' AND status NOT IN (''Cancelada'', ''Cerrada'', ''Finalizada'') AND (cantidad_original - Cantidad_recibida) > 0`
    const rowsA = await consultarSqlWMS(sqlA)
    console.log(`[Test A] id_entidades_sites = ''194326'': ${rowsA.length} filas`)
    if (rowsA.length > 0) console.table(rowsA.slice(0, 5))

    // Test B: site LIKE '%Distribución%' OR id_entidades_sites = '194326'
    const sqlB = `SELECT id_ordenes, codigo_ordenes, status, id_entidades_sites, site, cantidad_original, Cantidad_recibida FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE (id_entidades_sites = ''194326'' OR site LIKE ''%Distribución%'') AND status NOT IN (''Cancelada'', ''Cerrada'', ''Finalizada'') AND (cantidad_original - Cantidad_recibida) > 0`
    const rowsB = await consultarSqlWMS(sqlB)
    console.log(`[Test B] con OR site LIKE: ${rowsB.length} filas`)

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

testWhere()
