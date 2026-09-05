const { consultarSqlWMS, cargarConfiguracion } = require('../src/services/wmsService')

async function debugSitePending() {
  try {
    const config = cargarConfiguracion()
    console.log('Configuracion actual de WMS:', config)

    // 1. Consultar id_entidades_sites en las ordenes pendientes
    const sql1 = `
      SELECT TOP 20
        id_entidades_sites,
        site,
        id_ordenes,
        codigo_ordenes,
        status,
        cantidad_original,
        Cantidad_recibida
      FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2
      WHERE status NOT IN ('Cancelada', 'Cerrada', 'Finalizada')
        AND (cantidad_original - Cantidad_recibida) > 0
    `
    const rows1 = await consultarSqlWMS(sql1)
    console.log('\n--- MUESTRA DE SITIOS (sites) EN ÓRDENES PENDIENTES ---')
    console.table(rows1)

    // 2. Probar filtrando por siteId de config (194326)
    const sql2 = `
      SELECT TOP 20
        id_entidades_sites,
        site,
        id_ordenes,
        codigo_ordenes,
        status
      FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Ingreso2
      WHERE id_entidades_sites = '${config.siteId}'
        AND status NOT IN ('Cancelada', 'Cerrada', 'Finalizada')
        AND (cantidad_original - Cantidad_recibida) > 0
    `
    const rows2 = await consultarSqlWMS(sql2)
    console.log(`\n--- ÓRDENES PENDIENTES PARA SITE ${config.siteId} ---: ${rows2.length} filas`)
    console.table(rows2)

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

debugSitePending()
