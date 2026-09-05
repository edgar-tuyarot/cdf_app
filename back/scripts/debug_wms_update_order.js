const { consultarSqlWMS } = require('../src/services/wmsService')

async function debugWmsUpdateOrder() {
  try {
    const ordenWms = '299626'
    console.log(`--- PROBANDO ACTUALIZACIÓN SQL DIRECTA PARA ORDEN ${ordenWms} ---`)

    // 1. Ver cómo está compuesta la vista view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2
    const sqlViewDef = `
      SELECT OBJECT_DEFINITION(OBJECT_ID('view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2')) AS definition
    `
    const resDef = await consultarSqlWMS(sqlViewDef)
    if (resDef.length > 0 && resDef[0].definition) {
      console.log('\n--- DEFINICIÓN SQL DE LA VISTA view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2 ---')
      console.log(resDef[0].definition)
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

debugWmsUpdateOrder()
