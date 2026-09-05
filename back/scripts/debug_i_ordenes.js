const { consultarSqlWMS } = require('../src/services/wmsService')

async function debugIOrdenes() {
  try {
    const ordenWms = '299626'
    console.log(`--- CONSULTANDO TABLAS i_Ordenes Y i_Ordenes_Items PARA ORDEN ${ordenWms} ---`)

    const sqlIHeader = `SELECT * FROM i_Ordenes WHERE codigo_ordenes = '${ordenWms}'`
    const rowsHeader = await consultarSqlWMS(sqlIHeader)
    console.log(`Filas en i_Ordenes: ${rowsHeader.length}`)
    if (rowsHeader.length > 0) {
      console.log('Fila i_Ordenes:')
      console.log(rowsHeader[0])

      const idOrdenes = rowsHeader[0].id_ordenes
      const sqlIItems = `SELECT * FROM i_Ordenes_Items WHERE id_ordenes = ${idOrdenes}`
      const rowsItems = await consultarSqlWMS(sqlIItems)
      console.log(`\nFilas en i_Ordenes_Items: ${rowsItems.length}`)
      if (rowsItems.length > 0) console.table(rowsItems)
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

debugIOrdenes()
