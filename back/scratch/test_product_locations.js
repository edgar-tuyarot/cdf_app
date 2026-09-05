const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testProductLocations(searchProduct) {
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

    const sql = `SELECT * FROM view_Reporte_StockXUbicacion WHERE id_entidades_sites = ''194326'' AND (codigo_productos LIKE ''%${searchProduct}%'' OR producto LIKE ''%${searchProduct}%'') ORDER BY ubicacion, codigo_productos`;

    console.log('Ejecutando SQL en proc_paginado_query.php:');
    console.log(sql);

    const queryPayload = new URLSearchParams({
      query: sql,
      start: '0',
      length: '500'
    });

    const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers });
    let data = res.data;
    if (typeof data === 'string') data = JSON.parse(data);

    console.log(`\n=======================================================`);
    console.log(` RESULTADOS ENCONTRADOS PARA "${searchProduct}": ${data.length} UBICACIONES`);
    console.log(`=======================================================\n`);

    if (data.length > 0) {
      console.log('FILA 0 COMPLETA JSON:\n', JSON.stringify(data[0], null, 2));
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testProductLocations('1218');
