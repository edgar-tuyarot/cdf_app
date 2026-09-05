const { consultarSqlWMS } = require('../src/services/wmsService')

async function testRptUpdate() {
  try {
    const ordenWms = '299626'
    console.log(`--- CONSULTANDO DATOS EN RPT_Ordenes_Productividad PARA ORDEN ${ordenWms} ---`)

    const sqlHeader = `SELECT * FROM RPT_Ordenes_Productividad WHERE codigo_ordenes = '${ordenWms}'`
    const rowsHeader = await consultarSqlWMS(sqlHeader)
    console.log(`Filas en RPT_Ordenes_Productividad: ${rowsHeader.length}`)
    if (rowsHeader.length > 0) {
      console.log('Cabecera:', {
        id_RPT_Ordenes_Productividad: rowsHeader[0].id_RPT_Ordenes_Productividad,
        codigo_ordenes: rowsHeader[0].codigo_ordenes,
        id_status: rowsHeader[0].id_status
      })

      const idHeader = rowsHeader[0].id_RPT_Ordenes_Productividad
      const sqlItems = `SELECT * FROM RPT_Ordenes_Productividad_Items WHERE id_RPT_Ordenes_Productividad = ${idHeader}`
      const rowsItems = await consultarSqlWMS(sqlItems)
      console.log(`Filas en RPT_Ordenes_Productividad_Items: ${rowsItems.length}`)
      if (rowsItems.length > 0) {
        console.table(rowsItems.map(i => ({
          id_RPT_Ordenes_Productividad_Items: i.id_RPT_Ordenes_Productividad_Items,
          cantidad_original: i.cantidad_original,
          cantidad_actual: i.cantidad_actual
        })))
      }

      console.log('\nEjecutando UPDATE de prueba en RPT_Ordenes_Productividad y RPT_Ordenes_Productividad_Items...')
      
      // Actualizar cantidad_actual = cantidad_original
      const sqlUpdItem = `UPDATE RPT_Ordenes_Productividad_Items SET cantidad_actual = cantidad_original WHERE id_RPT_Ordenes_Productividad = ${idHeader}`
      await consultarSqlWMS(sqlUpdItem)

      // Actualizar id_status = 3 (Finalizada)
      const sqlUpdHeader = `UPDATE RPT_Ordenes_Productividad SET id_status = 3 WHERE id_RPT_Ordenes_Productividad = ${idHeader}`
      await consultarSqlWMS(sqlUpdHeader)

      console.log('\n--- COMPROBANDO ESTADO EN VISTA DESPUÉS DEL UPDATE ---')
      const sqlCheck = `SELECT codigo_ordenes, status, id_status, cantidad_original, Cantidad_recibida FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE codigo_ordenes = '${ordenWms}'`
      const resCheck = await consultarSqlWMS(sqlCheck)
      console.table(resCheck)
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

testRptUpdate()
