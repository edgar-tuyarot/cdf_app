const { consultarSqlWMS } = require('../src/services/wmsService')

async function testSiteTypes() {
  try {
    // 1. Without ISNULL
    const sql1 = `SELECT id_ordenes, codigo_ordenes, status, id_entidades_sites FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE id_entidades_sites = '194326' AND status NOT IN ('Cancelada', 'Cerrada', 'Finalizada', 'Anulada', 'Baja')`
    const res1 = await consultarSqlWMS(sql1)
    console.log(`[SQL 1 - sin ISNULL condition]: ${res1.length} filas`)

    // 2. With ISNULL in WHERE
    const sql2 = `SELECT id_ordenes, codigo_ordenes, status FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE id_entidades_sites = '194326' AND status NOT IN ('Cancelada', 'Cerrada', 'Finalizada', 'Anulada', 'Baja') AND (ISNULL(cantidad_original, 0) - ISNULL(Cantidad_recibida, 0)) > 0`
    const res2 = await consultarSqlWMS(sql2)
    console.log(`[SQL 2 - con ISNULL condition]: ${res2.length} filas`)

    // 3. With COALESCE or simple > 0 check
    const sql3 = `SELECT id_ordenes, codigo_ordenes, status, cantidad_original, Cantidad_recibida FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE id_entidades_sites = '194326' AND status NOT IN ('Cancelada', 'Cerrada', 'Finalizada', 'Anulada', 'Baja') AND (cantidad_original > 0 OR Cantidad_recibida IS NULL)`
    const res3 = await consultarSqlWMS(sql3)
    console.log(`[SQL 3 - con simple check]: ${res3.length} filas`)

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

testSiteTypes()
