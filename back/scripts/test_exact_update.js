const { consultarSqlWMS } = require('../src/services/wmsService')

async function testExactUpdate() {
  try {
    const ordenWms = '299626'
    const idOrdenes = 1241873

    console.log(`--- APLICANDO UPDATE EXACTO PARA ORDEN WMS ${ordenWms} (id_ordenes = ${idOrdenes}) ---`)

    // 1. Actualizar cantidad en Ordenes_Items (seteando cantidad = 0.2)
    const sqlItem = `UPDATE Ordenes_Items SET cantidad = cantidad_original WHERE id_ordenes = ${idOrdenes}`
    console.log(`Ejecutando: ${sqlItem}`)
    await consultarSqlWMS(sqlItem)

    // 2. Actualizar status en Ordenes (id_status = 3, status = 'Finalizada')
    const sqlHeader = `UPDATE Ordenes SET id_status = 3, status = 'Finalizada' WHERE id_ordenes = ${idOrdenes}`
    console.log(`Ejecutando: ${sqlHeader}`)
    await consultarSqlWMS(sqlHeader)

    // 3. Comprobar vista view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2
    console.log('\n--- VERIFICANDO ESTADO EN VISTA WMS DESPUÉS DEL UPDATE ---')
    const checkSql = `SELECT codigo_ordenes, status, id_status, cantidad_original, Cantidad_recibida FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 WHERE codigo_ordenes = '${ordenWms}'`
    const resCheck = await consultarSqlWMS(checkSql)
    console.log(`Filas retornadas en la vista para orden ${ordenWms}: ${resCheck.length}`)
    if (resCheck.length > 0) {
      console.table(resCheck)
    } else {
      console.log('✅ ¡Éxito absoluto! La orden ya NO aparece en las órdenes pendientes porque status = Finalizada.')
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

testExactUpdate()
