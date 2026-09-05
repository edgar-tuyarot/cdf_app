const { consultarSqlWMS } = require('../src/services/wmsService')

async function debugRawSql() {
  try {
    const rawSql = `SELECT id_ordenes, id_entidades_sites, site, codigo_ordenes AS orden_wms, codigo_ordenes_erp AS orden_compra_erp, fecha_alta, fecha_entrega_programada AS fecha_programada, documento AS tipo_comprobante, status AS estado_orden, entidad AS proveedor, codigo_productos AS codigo_producto, producto AS nombre_producto, cantidad_original AS cantidad_esperada, Cantidad_recibida AS cantidad_recibida, (ISNULL(cantidad_original, 0) - ISNULL(Cantidad_recibida, 0)) AS cantidad_pendiente FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE id_entidades_sites = ''194326'' AND status NOT IN (''Cancelada'', ''Cerrada'', ''Finalizada'', ''Anulada'', ''Baja'') AND (ISNULL(cantidad_original, 0) - ISNULL(Cantidad_recibida, 0)) > 0 ORDER BY codigo_ordenes DESC, id_ordenes DESC`

    console.log('Ejecutando rawSql...')
    const rows = await consultarSqlWMS(rawSql)
    console.log(`Filas retornadas: ${rows.length}`)
    if (rows.length > 0) console.table(rows)

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

debugRawSql()
