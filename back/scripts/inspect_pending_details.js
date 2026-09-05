const { consultarSqlWMS } = require('../src/services/wmsService')

async function inspectPendingDetails() {
  try {
    const sql = `
      SELECT id_ordenes, codigo_ordenes, status, id_entidades_sites, site, cantidad_original, Cantidad_recibida, (cantidad_original - Cantidad_recibida) AS diff
      FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2
      WHERE id_entidades_sites = '194326'
        AND status = 'Pendiente'
    `
    const rows = await consultarSqlWMS(sql)
    console.log(`--- DETALLE DE LAS 18 FILAS CON STATUS 'Pendiente' EN SITE 194326 ---`)
    console.table(rows)

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

inspectPendingDetails()
