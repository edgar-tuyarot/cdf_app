const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testPicOps() {
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

    const sql = `SELECT DISTINCT id_operaciones_tipos, codigo_operaciones, operacion, codigo_ordenes_documentos, documento FROM view_WMS_Rpt_Ordenes_Diferencias_PIC WHERE id_entidades_sites = ''194326''`;

    console.log('Querying distinct operaciones in view_WMS_Rpt_Ordenes_Diferencias_PIC...');
    const res = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql, start: '0', length: '500' }), { headers, timeout: 30000 });
    let data = res.data;
    if (typeof data === 'string') data = JSON.parse(data);

    console.log(`\nTIPOS DE EGRESO/OPERACIÓN EN PIC (${data.length}):`);
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testPicOps();
