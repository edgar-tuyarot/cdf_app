const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testDateSql() {
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

    // Test 1: CONVERT(date, fecha_cierre, 103)
    const sql1 = `SELECT TOP 100 * FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos WHERE id_entidades_sites = ''194326'' AND id_operaciones_tipos = 1 AND CONVERT(date, fecha_cierre, 103) >= ''2026-08-01'' AND CONVERT(date, fecha_cierre, 103) <= ''2026-08-29'' ORDER BY codigo_ordenes DESC`;

    console.log('Testing SQL 1 (CONVERT date):', sql1);
    const start1 = Date.now();
    const res1 = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql1, start: '0', length: '500' }), { headers, timeout: 60000 });
    const time1 = Date.now() - start1;
    let data1 = res1.data;
    if (typeof data1 === 'string') data1 = JSON.parse(data1);

    console.log(`\nRESULT 1: ${data1.length} filas devueltas en ${time1}ms!`);

  } catch (err) {
    console.error('ERROR 1:', err.message);
  }
}

testDateSql();
