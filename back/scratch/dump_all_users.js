const fs = require('fs');
const path = require('path');
const axios = require('axios');
const wms = require('../src/services/wmsService');

async function dumpAllUsers() {
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

    const sql = "SELECT * FROM Logins ORDER BY id_logins ASC";
    console.log('Ejecutando SQL en Block WMS:', sql);

    const queryPayload = new URLSearchParams({
      query: sql,
      start: '0',
      length: '2000'
    });

    const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers });
    let data = res.data;
    if (typeof data === 'string') data = JSON.parse(data);

    console.log(`\nTOTAL USUARIOS RECUPERADOS: ${data.length}`);

    // Clean internal datatable props if needed, but keep all SQL columns
    const cleaned = data.map(row => {
      const copy = { ...row };
      delete copy.Count;
      delete copy.Row;
      return copy;
    });

    // Write JSON file
    const jsonPath = path.join(__dirname, 'usuarios_block_wms.json');
    fs.writeFileSync(jsonPath, JSON.stringify(cleaned, null, 2), 'utf8');
    console.log('Guardado JSON en:', jsonPath);

    // Build CSV
    if (cleaned.length > 0) {
      const keys = Object.keys(cleaned[0]);
      const csvHeader = keys.join(',');
      const csvRows = cleaned.map(row => {
        return keys.map(k => {
          let val = row[k];
          if (val === null || val === undefined) return '""';
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        }).join(',');
      });
      const csvContent = [csvHeader, ...csvRows].join('\n');
      const csvPath = path.join(__dirname, 'usuarios_block_wms.csv');
      fs.writeFileSync(csvPath, csvContent, 'utf8');
      console.log('Guardado CSV en:', csvPath);
    }

    // Build Markdown Artifact File
    const artifactPath = "C:\\Users\\CDF Chaco\\.gemini\\antigravity\\brain\\4a23f247-6f89-457b-b97d-1b0622c01aa1\\tabla_usuarios_block_wms.md";
    let md = `# Tabla Completa de Usuarios - Block WMS (Total: ${cleaned.length} registros)\n\n`;
    md += `| ID | Username | Nombre | Apellido | Pass/PIN | Email | Activo | Perfil ID | Site ID | Fecha Alta | Último Login |\n`;
    md += `| :-: | :--- | :--- | :--- | :-: | :--- | :-: | :-: | :-: | :-: | :-: |\n`;
    cleaned.forEach(u => {
      md += `| ${u.id_logins || '-'} | \`${u.username || ''}\` | ${u.nombre || ''} | ${u.apellido || ''} | \`${u.pass || u.password || ''}\` | ${u.email || '-'} | ${u.activo === 1 ? 'Sí' : 'No'} | ${u.id_perfiles || '-'} | ${u.id_entidades_sites || '-'} | ${u.fecha_alta || '-'} | ${u.fecha_ult_log || '-'} |\n`;
    });

    fs.writeFileSync(artifactPath, md, 'utf8');
    console.log('Guardado Artifact Markdown en:', artifactPath);

  } catch (err) {
    console.error('ERROR AL DUMPEAR USUARIOS:', err.message);
  }
}

dumpAllUsers();
