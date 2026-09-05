const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testAllEgresos() {
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

    // 1. Check distinct id_operaciones_tipos & operacion in view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos
    console.log('--- Checking all operacion types in view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos ---');
    const sql1 = `SELECT DISTINCT id_operaciones_tipos, codigo_operaciones, operacion, documento FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos`;
    const res1 = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql1, start: '0', length: '500' }), { headers, timeout: 60000 });
    let data1 = res1.data;
    if (typeof data1 === 'string') data1 = JSON.parse(data1);
    console.log('Operaciones en view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos:');
    console.log(JSON.stringify(data1, null, 2));

    // 2. Check view_WMS_Rpt_Ordenes_Diferencias_desp without site filter
    console.log('\n--- Checking view_WMS_Rpt_Ordenes_Diferencias_desp ---');
    const sql2 = `SELECT TOP 10 * FROM view_WMS_Rpt_Ordenes_Diferencias_desp ORDER BY fecha_cierre DESC`;
    const res2 = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql2, start: '0', length: '50' }), { headers, timeout: 60000 });
    let data2 = res2.data;
    if (typeof data2 === 'string') data2 = JSON.parse(data2);
    console.log(`view_WMS_Rpt_Ordenes_Diferencias_desp RESULT (${data2.length} filas):`);
    if (data2.length > 0) {
      console.log('Fila 1:', JSON.stringify(data2[0], null, 2));
    }

    // 3. Check view_e_Ordenes (Egresos)
    console.log('\n--- Checking view_e_Ordenes ---');
    const sql3 = `SELECT TOP 10 * FROM view_e_Ordenes ORDER BY fecha_alta DESC`;
    const res3 = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql3, start: '0', length: '50' }), { headers, timeout: 60000 });
    let data3 = res3.data;
    if (typeof data3 === 'string') data3 = JSON.parse(data3);
    console.log(`view_e_Ordenes RESULT (${data3.length} filas):`);
    if (data3.length > 0) {
      console.log('Fila 1:', JSON.stringify(data3[0], null, 2));
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testAllEgresos();
