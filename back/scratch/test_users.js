const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testUsers() {
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

    const sql = "SELECT * FROM Logins";
    console.log('Ejecutando SQL en Block WMS:', sql);

    const queryPayload = new URLSearchParams({
      query: sql,
      start: '0',
      length: '500'
    });

    const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers });
    let data = res.data;
    if (typeof data === 'string') data = JSON.parse(data);

    console.log(`\n=======================================================`);
    console.log(` TOTAL USUARIOS EN CUALQUIER TABLA LOGINS BLOCK: ${data.length}`);
    console.log(`=======================================================\n`);

    if (data.length > 0) {
      console.log('COLUMNAS DE LOGINS:', Object.keys(data[0]));
      console.log('\nFILAS DE LOGINS:\n', JSON.stringify(data, null, 2));
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testUsers();
