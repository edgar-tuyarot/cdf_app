const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testDocSql() {
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

    const sql = `SELECT DISTINCT documento, codigo_ordenes_documentos FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos WHERE id_entidades_sites = ''194326'' AND id_operaciones_tipos = 1`;

    console.log('Ejecutando SQL para obtener tipos de comprobante:', sql);
    const res = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql, start: '0', length: '500' }), { headers, timeout: 60000 });
    let data = res.data;
    if (typeof data === 'string') data = JSON.parse(data);

    console.log(`\nTIPOS DE COMPROBANTE ENCONTRADOS (${data.length}):`);
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testDocSql();
