const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testEgresosQuery() {
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

    // Test 1: Check id_operaciones_tipos values in view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos or view_WMS_Rpt_Ordenes_Egreso / view_WMS_Rpt_Ordenes_Egreso2
    console.log('--- TEST 1: Check id_operaciones_tipos = 2 in view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos ---');
    const sql1 = `SELECT TOP 20 * FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos WHERE id_entidades_sites = ''194326'' AND id_operaciones_tipos = 2 ORDER BY codigo_ordenes DESC`;
    const res1 = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql1, start: '0', length: '50' }), { headers, timeout: 60000 });
    let data1 = res1.data;
    if (typeof data1 === 'string') data1 = JSON.parse(data1);
    console.log(`TEST 1 RESULT (${data1.length} filas):`);
    if (data1.length > 0) {
      console.log('Muestra de fila 1:', JSON.stringify(data1[0], null, 2));
    }

    // Test 2: Check view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Egresos if exists
    console.log('\n--- TEST 2: Check view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Egresos ---');
    const sql2 = `SELECT TOP 20 * FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Egresos WHERE id_entidades_sites = ''194326'' ORDER BY fecha_cierre DESC, codigo_ordenes DESC`;
    try {
      const res2 = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql2, start: '0', length: '50' }), { headers, timeout: 60000 });
      let data2 = res2.data;
      if (typeof data2 === 'string') data2 = JSON.parse(data2);
      console.log(`TEST 2 RESULT (${data2.length} filas):`);
      if (data2.length > 0) {
        console.log('Muestra de fila 1:', JSON.stringify(data2[0], null, 2));
      }
    } catch (err2) {
      console.log('TEST 2 Error:', err2.message);
    }

    // Test 3: Check view_WMS_Rpt_Ordenes_Egreso
    console.log('\n--- TEST 3: Check view_WMS_Rpt_Ordenes_Egreso ---');
    const sql3 = `SELECT TOP 20 * FROM view_WMS_Rpt_Ordenes_Egreso WHERE id_entidades_sites = ''194326'' ORDER BY fecha_cierre DESC`;
    try {
      const res3 = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql3, start: '0', length: '50' }), { headers, timeout: 60000 });
      let data3 = res3.data;
      if (typeof data3 === 'string') data3 = JSON.parse(data3);
      console.log(`TEST 3 RESULT (${data3.length} filas):`);
      if (data3.length > 0) {
        console.log('Muestra de fila 1:', JSON.stringify(data3[0], null, 2));
      }
    } catch (err3) {
      console.log('TEST 3 Error:', err3.message);
    }

  } catch (err) {
    console.error('ERROR GENERAL:', err.message);
  }
}

testEgresosQuery();
