const { consultarSqlWMS } = require('../src/services/wmsService')

async function debugSelectAll() {
  try {
    const rawSql = `SELECT * FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE id_entidades_sites = '194326' AND status NOT IN ('Cancelada', 'Cerrada', 'Finalizada', 'Anulada', 'Baja') ORDER BY codigo_ordenes DESC`

    const rows = await consultarSqlWMS(rawSql)
    console.log(`Filas recibidas con SELECT *: ${rows.length}`)
    if (rows.length > 0) {
      console.log('Claves:', Object.keys(rows[0]))
      console.log('\nMuestra fila 1:', {
        codigo_ordenes: rows[0].codigo_ordenes,
        codigo_ordenes_erp: rows[0].codigo_ordenes_erp,
        fecha_alta: rows[0].fecha_alta,
        status: rows[0].status,
        entidad: rows[0].entidad,
        codigo_productos: rows[0].codigo_productos,
        producto: rows[0].producto,
        cantidad_original: rows[0].cantidad_original,
        Cantidad_recibida: rows[0].Cantidad_recibida
      })
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

debugSelectAll()
