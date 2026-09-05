const axios = require('axios');
const wms = require('../src/services/wmsService');

async function testIngresosOrders(fechaDesde, fechaHasta) {
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

    const sql = `SELECT * FROM view_CUSTOM_DEPOT_WMS_Rpt_Ordenes_Diferencias_Ingresos WHERE id_entidades_sites = ''194326'' AND id_operaciones_tipos = 1 ORDER BY fecha_cierre DESC, codigo_ordenes DESC`;

    console.log('Ejecutando SQL en proc_paginado_query.php con length 1000:');

    const queryPayload = new URLSearchParams({
      query: sql,
      start: '0',
      length: '1000'
    });

    const res = await axios.post(`${host}/proc_paginado_query.php`, queryPayload, { headers });
    let data = res.data;
    if (typeof data === 'string') data = JSON.parse(data);

    console.log(`\n=======================================================`);
    console.log(` TOTAL FILAS OBTENIDAS DE BLOCK: ${data.length}`);
    console.log(`=======================================================\n`);

    const parseDDMMYYYY = (dateStr) => {
      if (!dateStr || dateStr === '-') return null;
      const parts = String(dateStr).split(' ')[0].split('/');
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`);
      }
      return null;
    };

    const dDesde = new Date(`${fechaDesde}T00:00:00`);
    const dHasta = new Date(`${fechaHasta}T23:59:59`);

    const filteredRows = data.filter(row => {
      const dt = parseDDMMYYYY(row.fecha_cierre || row.fecha_alta);
      if (!dt) return true;
      return dt >= dDesde && dt <= dHasta;
    });

    console.log(`FILAS FILTRADAS POR FECHA (${fechaDesde} a ${fechaHasta}): ${filteredRows.length}`);

    // Group by codigo_ordenes
    const ordersMap = new Map();
    for (const row of filteredRows) {
      const orden = row.codigo_ordenes || row.codigo_ordenes_erp || 'S/N';
      if (!ordersMap.has(orden)) {
        ordersMap.set(orden, {
          orden,
          fechaCierre: row.fecha_cierre || row.fecha_alta,
          proveedor: row.cliente_proveedor || row.proveedor || '-',
          documento: row.documento || row.codigo_ordenes_documentos || '-',
          operador: row.operador || '-',
          totalBultos: row.total_bultos || 0,
          items: []
        });
      }

      const getNum = (keywords) => {
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

      const o = ordersMap.get(orden);
      o.items.push({
        codigo: row.codigo_productos || row.codigo_productos_VIS_ || '-',
        producto: row.producto || row.producto_VIS_ || '-',
        lote: row.lote_VIS_ || row.lote || '-',
        recibida: getNum(['cantidad_actual', 'recibida']),
        esperada: getNum(['cantidad_original', 'esperada']),
        ubicacion: row.ubicacion_origen || row.Ubicación_VIS_ || '-'
      });
    }

    const ordersList = Array.from(ordersMap.values());
    console.log(`\n=======================================================`);
    console.log(` TOTAL ÓRDENES ÚNICAS DE INGRESO: ${ordersList.length}`);
    console.log(`=======================================================\n`);
    if (ordersList.length > 0) {
      console.log('MUESTRA PRIMERA ÓRDEN Y SUS ÍTEMS:\n', JSON.stringify(ordersList[0], null, 2));
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testIngresosOrders('2026-08-26', '2026-08-28');
