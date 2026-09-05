const axios = require('axios');
const wms = require('../src/services/wmsService');

async function listAllTables() {
  try {
    const config = wms.cargarConfiguracion();
    console.log('Conectando a Block WMS en:', config.host);
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
      length: '2000'
    });

    console.log('Ejecutando consulta SQL a INFORMATION_SCHEMA.TABLES...\n');
    const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers });
    
    let data = res.data;
    if (typeof data === 'string') data = JSON.parse(data);

    console.log(`=======================================================`);
    console.log(` TOTAL DE TABLAS Y VISTAS EN BBDD BLOCK WMS: ${data.length}`);
    console.log(`=======================================================\n`);

    const tablasBase = data.filter(d => d.TABLE_TYPE === 'BASE TABLE');
    const vistas = data.filter(d => d.TABLE_TYPE === 'VIEW');

    console.log(`--- TABLAS BASE (${tablasBase.length}) ---`);
    tablasBase.forEach((t, i) => {
      console.log(`${String(i + 1).padStart(3, ' ')}. ${t.TABLE_NAME}`);
    });

    console.log(`\n--- VISTAS / VIEWS (${vistas.length}) ---`);
    vistas.forEach((v, i) => {
      console.log(`${String(i + 1).padStart(3, ' ')}. ${v.TABLE_NAME}`);
    });

  } catch (err) {
    console.error('ERROR AL LISTAR TABLAS:', err.message);
  }
}

listAllTables();
