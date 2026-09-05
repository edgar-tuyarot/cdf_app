const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testFast() {
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

    const sql = `SELECT TOP 200 * FROM view_WMS_Rpt_Ordenes_Diferencias_PIC WHERE id_entidades_sites = ''194326'' AND CONVERT(date, fecha_cierre, 103) >= ''2026-08-01'' AND CONVERT(date, fecha_cierre, 103) <= ''2026-08-29'' ORDER BY codigo_ordenes DESC`;

    console.log('Querying view_WMS_Rpt_Ordenes_Diferencias_PIC with date filter...');
    const start = Date.now();
    const res = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql, start: '0', length: '500' }), { headers, timeout: 30000 });
    const elapsed = Date.now() - start;
    let data = res.data;
    if (typeof data === 'string') data = JSON.parse(data);

    console.log(`\nRESULT: ${data.length} filas devueltas en ${elapsed}ms!`);
    if (data.length > 0) {
      // Group distinct orders
      const orderMap = new Map();
      data.forEach(row => {
        const key = row.codigo_ordenes;
        if (!orderMap.has(key)) {
          orderMap.set(key, {
            orden: row.codigo_ordenes,
            fechaCierre: row.fecha_cierre,
            entidad: row.entidad,
            documento: row.documento,
            operador: row.operador,
            operacion: row.operacion,
            itemsCount: 0,
            totalKilos: 0
          });
        }
        const o = orderMap.get(key);
        o.itemsCount++;
        const cant = parseFloat(String(row.cantidad_actual || row.cantidad_original || 0).replace(',', '.'));
        o.totalKilos += Math.abs(cant);
      });

      console.log(`Total Órdenes Únicas en Agosto: ${orderMap.size}`);
      console.log('Muestra de primeras 3 órdenes de egreso:');
      console.log(JSON.stringify(Array.from(orderMap.values()).slice(0, 3), null, 2));
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testFast();
