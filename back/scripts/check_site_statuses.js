const { consultarSqlWMS } = require('../src/services/wmsService')

async function checkStatuses() {
  try {
    const sql = `
      SELECT status, COUNT(*) AS cantidad
      FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2
      WHERE id_entidades_sites = '194326'
        AND (cantidad_original - Cantidad_recibida) > 0
      GROUP BY status
    `
    const rows = await consultarSqlWMS(sql)
    console.log('--- ESTADOS DE ÓRDENES PENDIENTES EN SITE 194326 ("26 - Distribución. Fiambrería Chaco") ---')
    console.table(rows)

    const sqlActive = `
      SELECT TOP 20 id_ordenes, codigo_ordenes, codigo_ordenes_erp, status, entidad, producto, cantidad_original, Cantidad_recibida
      FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2
      WHERE id_entidades_sites = '194326'
        AND status NOT IN ('Cancelada', 'Cerrada', 'Finalizada', 'Anulada', 'Baja')
    `
    const rowsActive = await consultarSqlWMS(sqlActive)
    console.log(`\n--- ÓRDENES ACTIVAS (NO CANCELADAS NI ANULADAS) EN SITE 194326 ---: ${rowsActive.length} filas`)
    if (rowsActive.length > 0) {
      console.table(rowsActive)
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

checkStatuses()
