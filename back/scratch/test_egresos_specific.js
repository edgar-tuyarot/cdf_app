const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testEgresosSpecific() {
  try {
    const config = wms.cargarConfiguracion();
    const loginRes = await wms.loginWMS(config);
    const sessionId = loginRes.sessionId;
    const host = config.host;

    const headers = {
      'User-Agent': 'Mozilla/5.0',
      'Cookie': `PHPSESSID=${sessionId}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    // 1. Query view_WMS_Rpt_Ordenes_Diferencias_desp for site 194326
    console.log('--- TEST: view_WMS_Rpt_Ordenes_Diferencias_desp for site 194326 ---');
    const sql1 = `SELECT TOP 20 * FROM view_WMS_Rpt_Ordenes_Diferencias_desp WHERE id_entidades_sites = ''194326'' ORDER BY codigo_ordenes DESC`;
    const res1 = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql1, start: '0', length: '50' }), { headers, timeout: 30000 });
    let data1 = res1.data;
    if (typeof data1 === 'string') data1 = JSON.parse(data1);
    console.log(`view_WMS_Rpt_Ordenes_Diferencias_desp (${data1.length} filas):`);
    if (data1.length > 0) {
      console.log('Muestra Fila 1:', JSON.stringify(data1[0], null, 2));
    }

    // 2. Query view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos for id_operaciones_tipos = 2 (or <> 1)
    console.log('\n--- TEST: view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos WHERE id_operaciones_tipos != 1 ---');
    const sql2 = `SELECT TOP 20 * FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos WHERE id_entidades_sites = ''194326'' AND id_operaciones_tipos <> 1 ORDER BY codigo_ordenes DESC`;
    const res2 = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql2, start: '0', length: '50' }), { headers, timeout: 30000 });
    let data2 = res2.data;
    if (typeof data2 === 'string') data2 = JSON.parse(data2);
    console.log(`id_operaciones_tipos != 1 (${data2.length} filas):`);
    if (data2.length > 0) {
      console.log('Muestra Fila 1:', JSON.stringify(data2[0], null, 2));
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testEgresosSpecific();
