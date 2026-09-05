const axios = require('axios');
const wms = require('../src/services/wmsService');

async function formatUsersTable() {
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

    const sql = "SELECT id_logins, username, nombre, apellido, email, activo, fecha_alta, fecha_ult_log, id_perfiles, id_entidades_sites FROM Logins ORDER BY id_logins DESC";

    const queryPayload = new URLSearchParams({
      query: sql,
      start: '0',
      length: '500'
    });

    const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers });
    let data = res.data;
    if (typeof data === 'string') data = JSON.parse(data);

    console.log('TOTAL USUARIOS:', data.length);
    if (data.length > 0) {
      console.log('COLUMNAS:', Object.keys(data[0]));
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

formatUsersTable();
