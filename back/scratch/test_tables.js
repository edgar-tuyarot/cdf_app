const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testTables() {
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

    const sql = "SELECT TABLE_TYPE, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_TYPE, TABLE_NAME";
    const queryPayload = new URLSearchParams({
      query: sql,
      start: '0',
      length: '1000'
    });

    console.log('Sending query to INFORMATION_SCHEMA.TABLES...');
    const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers });
    let data = res.data;
    if (typeof data === 'string') data = JSON.parse(data);

    console.log('TOTAL TABLAS/VISTAS:', data.length);
    if (data.length > 0) {
      console.log('MUESTRA PRIMERAS 30 TABLAS/VISTAS:\n', JSON.stringify(data.slice(0, 30), null, 2));
    }
  } catch (err) {
    console.error('ERROR:', err.message, err.stack);
  }
}

testTables();
