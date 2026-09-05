const axios = require('axios');
const wms = require('../src/services/wmsService');

async function findEgresosTables() {
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

    // 1. Search views/tables related to egresos, salidas, expedicion, remitos, diferencias, picking, etc.
    const sqlTables = `SELECT TABLE_NAME, TABLE_TYPE FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE ''%egreso%'' OR TABLE_NAME LIKE ''%salida%'' OR TABLE_NAME LIKE ''%expedicion%'' OR TABLE_NAME LIKE ''%remito%'' OR TABLE_NAME LIKE ''%despacho%'' OR TABLE_NAME LIKE ''%pedido%'' OR TABLE_NAME LIKE ''%Ordenes%'' ORDER BY TABLE_TYPE, TABLE_NAME`;

    console.log('Searching Block WMS tables for Egresos...');
    const res = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sqlTables, start: '0', length: '500' }), { headers, timeout: 60000 });
    let data = res.data;
    if (typeof data === 'string') data = JSON.parse(data);

    console.log(`\nTABLAS / VISTAS DE EGRESOS ENCONTRADAS (${data.length}):`);
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

findEgresosTables();
