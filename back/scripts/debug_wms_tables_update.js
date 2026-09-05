const { consultarSqlWMS } = require('../src/services/wmsService')

async function debugWmsTablesUpdate() {
  try {
    console.log('--- 1. CONSULTANDO ORDEN 299626 EN VISTA Y TABLAS WMS ---')
    const sqlView = `SELECT * FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE codigo_ordenes = '299626'`
    const rowsView = await consultarSqlWMS(sqlView)
    console.log(`Filas en vista view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 para 299626: ${rowsView.length}`)
    if (rowsView.length > 0) {
      console.log('Datos actual de la orden 299626:')
      console.log({
        id_ordenes: rowsView[0].id_ordenes,
        codigo_ordenes: rowsView[0].codigo_ordenes,
        status: rowsView[0].status,
        id_status: rowsView[0].id_status,
        cantidad_original: rowsView[0].cantidad_original,
        Cantidad_recibida: rowsView[0].Cantidad_recibida
      })
    }

    console.log('\n--- 2. BUSCANDO ESTRUCTURA DE TABLAS REALES DE ÓRDENES EN INFORMATION_SCHEMA ---')
    const sqlTables = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%Ordenes%' OR TABLE_NAME LIKE '%Ingreso%'`
    const rowsTables = await consultarSqlWMS(sqlTables)
    console.log('Tablas encontradas relacionadas con Órdenes/Ingresos:')
    console.table(rowsTables)

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

debugWmsTablesUpdate()
