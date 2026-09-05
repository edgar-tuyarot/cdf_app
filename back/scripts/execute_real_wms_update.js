const { consultarSqlWMS } = require('../src/services/wmsService')

async function executeRealWmsUpdate() {
  try {
    const ordenWms = '299626'
    console.log(`--- ACTUALIZANDO ORDEN WMS ${ordenWms} EN LAS TABLAS REALES ---`)

    // 1. Obtener los IDs internos de la orden 299626
    const sqlGetId = `
      SELECT o.id_ordenes, o.codigo_ordenes, o.id_status, i.id_ordenes_items, i.cantidad_original, i.cantidad_actual, i.id_productos_presentaciones
      FROM Ordenes o
      JOIN Ordenes_Items i ON o.id_ordenes = i.id_ordenes
      WHERE o.codigo_ordenes = '${ordenWms}'
    `
    const rows = await consultarSqlWMS(sqlGetId)
    console.log(`Filas encontradas en Ordenes / Ordenes_Items para ${ordenWms}: ${rows.length}`)
    if (rows.length > 0) {
      console.table(rows)

      const idOrdenes = rows[0].id_ordenes
      const idItems = rows[0].id_ordenes_items
      const cantOrig = rows[0].cantidad_original || 0.2

      console.log(`\nEjecutando UPDATE sobre Ordenes_Items (id_ordenes_items = ${idItems})...`)
      const sqlUpdateItem = `UPDATE Ordenes_Items SET cantidad_actual = ${cantOrig} WHERE id_ordenes = ${idOrdenes}`
      await consultarSqlWMS(sqlUpdateItem)

      console.log(`Ejecutando UPDATE sobre Ordenes (id_ordenes = ${idOrdenes}, id_status = 3)...`)
      const sqlUpdateHeader = `UPDATE Ordenes SET id_status = 3, status = 'Finalizada' WHERE id_ordenes = ${idOrdenes}`
      await consultarSqlWMS(sqlUpdateHeader)

      console.log('\n--- VERIFICANDO ESTADO DE LA ORDEN 299626 EN LA VISTA DESPUÉS DEL UPDATE ---')
      const checkView = `SELECT codigo_ordenes, status, id_status, cantidad_original, Cantidad_recibida FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE codigo_ordenes = '${ordenWms}'`
      const resCheck = await consultarSqlWMS(checkView)
      console.table(resCheck)
    } else {
      console.log('Buscando en RPT_Ordenes_Productividad...')
      const sqlRpt = `
        SELECT o.id_RPT_Ordenes_Productividad, o.codigo_ordenes, o.id_status, i.id_RPT_Ordenes_Productividad_Items, i.cantidad_original, i.cantidad_actual
        FROM RPT_Ordenes_Productividad o
        JOIN RPT_Ordenes_Productividad_Items i ON o.id_RPT_Ordenes_Productividad = i.id_RPT_Ordenes_Productividad
        WHERE o.codigo_ordenes = '${ordenWms}'
      `
      const rptRows = await consultarSqlWMS(sqlRpt)
      console.table(rptRows)
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

executeRealWmsUpdate()
