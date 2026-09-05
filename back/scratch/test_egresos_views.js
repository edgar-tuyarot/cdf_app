const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testViews() {
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

    const views = [
      "view_WMS_Rpt_Ordenes_Diferencias_desp",
      "view_WMS_Rpt_Nota_Despacho",
      "view_WMS_Rpt_Ordenes_Diferencias_PIC",
      "view_Ordenes_Despacho_Pendientes",
      "view_Reporte_Ordenes_Movimientos"
    ];

    for (const v of views) {
      console.log(`\n--- Testing ${v} ---`);
      const sql = `SELECT TOP 5 * FROM ${v} WHERE id_entidades_sites = ''194326''`;
      try {
        const res = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql, start: '0', length: '10' }), { headers, timeout: 60000 });
        let data = res.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch(e) {}
        }
        if (Array.isArray(data)) {
          console.log(`SUCCESS ${v}: ${data.length} filas.`);
          if (data.length > 0) {
            console.log('Columnas disponibles:', Object.keys(data[0]));
            console.log('Fila 1:', JSON.stringify(data[0], null, 2));
          }
        } else {
          console.log(`FAILED ${v}:`, String(res.data).substring(0, 150));
        }
      } catch (err) {
        console.log(`ERROR ${v}:`, err.message);
      }
    }

  } catch (err) {
    console.error('ERROR GENERAL:', err.message);
  }
}

testViews();
