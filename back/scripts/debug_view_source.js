const { consultarSqlWMS } = require('../src/services/wmsService')

async function debugViewSource() {
  try {
    const ordenWms = '299626'
    console.log(`--- INVESTIGANDO DE QUÉ TABLA PROVIENE LA ORDEN ${ordenWms} ---`)

    const tablesToTest = [
      'Ordenes',
      'i_Ordenes',
      'i_Ordenes_Ingreso',
      'RPT_Ordenes_Productividad',
      'Ordenes_Ingreso',
      'Ordenes_Comprobantes',
      'Ordenes_Items'
    ]

    for (const tbl of tablesToTest) {
      try {
        const sql = `SELECT COUNT(*) AS total FROM ${tbl} WHERE codigo_ordenes = '${ordenWms}'`
        const res = await consultarSqlWMS(sql)
        console.log(`[Tabla ${tbl.padEnd(28)}]: ${res[0]?.total || 0} filas`)
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

debugViewSource()
