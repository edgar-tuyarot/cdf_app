const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testPic() {
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

    const sql = `SELECT TOP 20 * FROM view_WMS_Rpt_Ordenes_Diferencias_PIC WHERE id_entidades_sites = ''194326'' ORDER BY fecha_cierre DESC, codigo_ordenes DESC`;

    console.log('Querying view_WMS_Rpt_Ordenes_Diferencias_PIC...');
    const res = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql, start: '0', length: '50' }), { headers, timeout: 30000 });
    let data = res.data;
    if (typeof data === 'string') data = JSON.parse(data);

    console.log(`\nRESULT (${data.length} filas):`);
    if (data.length > 0) {
      console.log('Fila 1:', JSON.stringify(data[0], null, 2));
      console.log('Fila 2:', JSON.stringify(data[1], null, 2));
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testPic();
