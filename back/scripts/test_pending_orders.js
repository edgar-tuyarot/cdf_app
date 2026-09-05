const { consultarSqlWMS } = require('../src/services/wmsService')

async function queryPendingIngresos() {
  try {
    console.log('Buscando Órdenes de Ingreso Pendientes reales en BlockWMS...')

    const sql = `
      SELECT 
        id_ordenes,
        codigo_ordenes,
        codigo_ordenes_erp,
        fecha_alta,
        fecha_entrega_programada,
        documento,
        status,
        id_status,
        entidad AS proveedor,
        codigo_productos,
        producto,
        cantidad_original,
        Cantidad_recibida,
        (cantidad_original - Cantidad_recibida) AS pendiente
      FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2
      WHERE status NOT IN ('Cancelada', 'Cerrada', 'Finalizada')
        AND (cantidad_original - Cantidad_recibida) > 0
      ORDER BY codigo_ordenes DESC
    `

    const rows = await consultarSqlWMS(sql)
    console.log(`\n✅ Total de renglones/ítems pendientes de ingreso encontrados: ${rows.length}`)

    if (rows.length > 0) {
      console.log('\n--- MUESTRA DE LAS PRIMERAS 10 ÓRDENES PENDIENTES ---')
      console.table(rows.slice(0, 10))
    } else {
      console.log('\nProbrando filtro general por id_status en Ordenes cabecera...')
      const sqlCabecera = `SELECT TOP 20 id_ordenes, codigo_ordenes, fecha_alta, status, id_status FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 GROUP BY id_ordenes, codigo_ordenes, fecha_alta, status, id_status ORDER BY id_ordenes DESC`
      const cabeceras = await consultarSqlWMS(sqlCabecera)
      console.table(cabeceras)
    }

    process.exit(0)
  } catch (err) {
    console.error('Error al consultar:', err.message)
    process.exit(1)
  }
}

queryPendingIngresos()
