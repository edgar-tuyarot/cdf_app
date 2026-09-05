const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testStockBySite(searchProduct) {
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

    // Query 1: view_Reporte_Stock_ConsolidadoPorSite
    const sql1 = `SELECT site, codigo_productos, producto, SUM(cantidad_fisica) AS stock_total FROM view_Reporte_StockXUbicacion WHERE (codigo_productos LIKE ''%${searchProduct}%'' OR producto LIKE ''%${searchProduct}%'') GROUP BY site, codigo_productos, producto ORDER BY site, codigo_productos`;

    console.log('Ejecutando SQL en proc_paginado_query.php:');
    console.log(sql1);

    const res1 = await axios.post(`${host}/proc_paginado_query.php`, new URLSearchParams({ query: sql1, start: '0', length: '500' }), { headers });
    let data1 = res1.data;
    if (typeof data1 === 'string') data1 = JSON.parse(data1);

    console.log(`\n=======================================================`);
    console.log(` STOCK TOTAL POR SITE/SUCURSAL PARA "${searchProduct}": ${data1.length} SITIOS`);
    console.log(`=======================================================\n`);

    if (data1.length > 0) {
      console.log('RESULTADOS:');
      console.log(JSON.stringify(data1, null, 2));
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testStockBySite('1218');
