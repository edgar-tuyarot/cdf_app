const axios = require('axios');
const wms = require('../src/services/wmsService');

async function runTest() {
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

    const rawSql = "select * from view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos WHERE id_entidades_sites = ''194326'' and id_operaciones_tipos = 1 order by fecha_cierre desc, codigo_ordenes desc";

    const queryPayload = new URLSearchParams({
      query: rawSql,
      start: '0',
      length: '50'
    });

    const pagRes = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers });
    let rows = pagRes.data;
    if (typeof rows === 'string') rows = JSON.parse(rows);

    const getNumFromRow = (row, keywords) => {
      for (const key of Object.keys(row)) {
        const kLower = key.toLowerCase();
        for (const kw of keywords) {
          if (kLower.includes(kw.toLowerCase())) {
            const val = row[key];
            if (val !== undefined && val !== null && val !== '') {
              const num = parseFloat(String(val).replace(',', '.'));
              if (!isNaN(num)) return num;
            }
          }
        }
      }
      return 0;
    };

    const parsed = rows.slice(0, 10).map((row, idx) => {
      const codigo = row.codigo_productos || row.codigo_productos_VIS_ || '-';
      const producto = row.producto || row.producto_VIS_ || row.descri || codigo;
      const esperada = getNumFromRow(row, ['cantidad_original', 'esperada']);
      const recibida = getNumFromRow(row, ['cantidad_actual', 'recibida']);
      const diferencia = row.diferencia !== undefined && row.diferencia !== null ? parseFloat(row.diferencia) : (recibida - esperada);

      return {
        id: idx + 1,
        orden: row.codigo_ordenes || row.codigo_ordenes_erp || 'S/N',
        proveedor: row.cliente_proveedor || row.proveedor || '-',
        codigoProducto: codigo,
        producto: producto,
        lote: row.lote_VIS_ || row.lote || '-',
        cantidadEsperada: esperada,
        cantidadRecibida: recibida,
        diferencia: parseFloat(diferencia.toFixed(3)),
        fechaCierre: row.fecha_cierre || '-',
        operador: row.operador || '-'
      };
    });

    console.log('PARSED FIRST 10 ITEMS:\n', JSON.stringify(parsed, null, 2));

  } catch (err) {
    console.error('TEST ERROR:', err.message, err.stack);
  }
}

runTest();
