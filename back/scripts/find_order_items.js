const { consultarSqlWMS } = require('../src/services/wmsService')

async function findOrderItems() {
  try {
    const ordenWms = '299626'
    console.log(`--- INVESTIGANDO DETALLE DE ORDEN 299626 EN TABLA Ordenes ---`)

    const sqlHeader = `SELECT * FROM Ordenes WHERE codigo_ordenes = '${ordenWms}'`
    const rowsHeader = await consultarSqlWMS(sqlHeader)
    console.log('Cabecera en Ordenes:')
    console.log(rowsHeader[0])

    const idOrdenes = rowsHeader[0].id_ordenes

    const itemTablesToTest = [
      'Ordenes_Items',
      'i_Ordenes_Ingreso_Items',
      'i_Ordenes_Items',
      'Ordenes_Items_Copia',
      'h_Ordenes_Items_Copia'
    ]

    for (const tbl of itemTablesToTest) {
      try {
        const sql = `SELECT * FROM ${tbl} WHERE id_ordenes = ${idOrdenes}`
        const res = await consultarSqlWMS(sql)
        console.log(`[Tabla ${tbl.padEnd(28)}]: ${res.length} filas con id_ordenes=${idOrdenes}`)
        if (res.length > 0) {
          console.log(`Columnas de ${tbl}:`, Object.keys(res[0]))
          console.table(res)
        }
      } catch (e) {
        console.log(`[Tabla ${tbl.padEnd(28)}]: Error -> ${e.message}`)
      }
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

findOrderItems()
