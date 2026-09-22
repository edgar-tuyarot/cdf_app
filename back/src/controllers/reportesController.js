const { Pedido, ProductoPedido, Producto, sequelize } = require('../models');
const wmsService = require('../services/wmsService');

// Helper para formatear fechas YYYY-MM-DD
function formatYYYYMMDD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Obtener la semana actual de Lunes a Sábado por defecto
function getDefaultWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  
  // Calcular Lunes de la semana actual
  const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMon);

  // Calcular Sábado de la semana actual
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);

  return {
    startDate: formatYYYYMMDD(monday),
    endDate: formatYYYYMMDD(saturday)
  };
}

exports.obtenerReporteSemanal = async (req, res) => {
  try {
    const id_ubicacion = req.ubicacionId || 1;
    let { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      const defaultRange = getDefaultWeekRange();
      startDate = startDate || defaultRange.startDate;
      endDate = endDate || defaultRange.endDate;
    }

    let listEnviados = [];
    let origenDatos = 'WMS_DESPACHOS';

    // 1. Intentar consultar despachos a sucursales reales desde Block WMS (Egresos Finalizados -> Despacho)
    try {
      const siteId = req.headers['x-wms-site-id'] || req.query.siteId || '194326';
      const wmsRes = await wmsService.obtenerOrdenesEgresoWMS({
        siteId,
        fechaDesde: startDate,
        fechaHasta: endDate,
        tipoComprobante: 'Despacho'
      }, req);

      if (wmsRes && wmsRes.ok && Array.isArray(wmsRes.productosConsolidados) && wmsRes.productosConsolidados.length > 0) {
        listEnviados = wmsRes.productosConsolidados.map(item => ({
          codigo: item.codigo,
          nombre: item.producto || 'Sin nombre',
          piezas: 0,
          fracciones: 0,
          peso_total: parseFloat(item.totalDespachado || 0),
          total_pedidos: parseInt(item.cantOrdenes || 0, 10)
        })).filter(i => i.peso_total > 0);
      }
    } catch (wmsErr) {
      console.warn('[ReportesSemanal] No se pudo obtener despachos directamente de WMS, ejecutando fallback a pedidos locales:', wmsErr.message);
    }

    // 2. Si no se obtuvieron resultados de WMS (o falló la conexión WMS), usar fallback de pedidos locales (Enviados/Completados)
    if (listEnviados.length === 0) {
      origenDatos = 'LOCAL_PEDIDOS';
      const sqlEnviados = `
        SELECT 
          pp.codigo_producto,
          prod.nombre AS producto_nombre,
          SUM(COALESCE(pp.peso_enviado, 0)) AS peso_enviado,
          SUM(COALESCE(pp.cantidad_enviada, 0)) AS cantidad_enviada,
          SUM(COALESCE(pp.fraccion_enviada, 0)) AS fraccion_enviada,
          COUNT(DISTINCT ped.id) AS total_pedidos
        FROM producto_pedidos pp
        INNER JOIN pedidos ped ON pp.id_pedido = ped.id
        LEFT JOIN productos prod ON pp.codigo_producto = prod.codigo
        WHERE (ped.id_ubicacion = :id_ubicacion OR ped.id_ubicacion IS NULL)
          AND ped.estado IN ('Enviado', 'Completado')
          AND ped.fecha BETWEEN :startDate AND :endDate
        GROUP BY pp.codigo_producto, prod.nombre
        ORDER BY peso_enviado DESC;
      `;

      const [resEnviados] = await sequelize.query(sqlEnviados, { replacements: { id_ubicacion, startDate, endDate } });

      listEnviados = resEnviados.map(row => {
        return {
          codigo: row.codigo_producto,
          nombre: row.producto_nombre || 'Sin nombre',
          piezas: parseInt(row.cantidad_enviada || 0, 10),
          fracciones: parseFloat(row.fraccion_enviada || 0),
          peso_total: parseFloat(row.peso_enviado || 0),
          total_pedidos: parseInt(row.total_pedidos || 0, 10)
        };
      }).filter(item => item.peso_total > 0 || item.piezas > 0 || item.fracciones > 0);
    }

    // Ordenar de mayor a menor kilos
    listEnviados.sort((a, b) => b.peso_total - a.peso_total);

    // 3. Consultar stock actual de catálogo para la ubicación incluyendo codigo_fraccionado
    const [stocksRows] = await sequelize.query(`
      SELECT 
        p.codigo,
        p.nombre,
        p.peso_pieza,
        p.peso_fraccion,
        p.peso_unidad,
        p.tipo_calculo_piezas,
        p.codigo_fraccionado,
        p.activo,
        COALESCE(ps.stock, 0) AS stock_actual
      FROM productos p
      LEFT JOIN productos_stock ps ON p.codigo = ps.codigo_producto AND ps.id_ubicacion = :id_ubicacion
      WHERE p.activo = 1
    `, { replacements: { id_ubicacion } });

    const catalogMap = new Map();
    const madreAHijo = new Map();
    const hijoAMadre = new Map();

    stocksRows.forEach(r => {
      const cod = String(r.codigo).trim();
      const codFrac = (r.codigo_fraccionado && String(r.codigo_fraccionado).trim() !== '' && String(r.codigo_fraccionado).trim() !== cod)
        ? String(r.codigo_fraccionado).trim()
        : null;

      catalogMap.set(cod, {
        codigo: cod,
        nombre: r.nombre,
        stock_actual: parseFloat(r.stock_actual || 0),
        peso_pieza: parseFloat(r.peso_pieza || 0),
        peso_fraccion: parseFloat(r.peso_fraccion || 0),
        peso_unidad: parseFloat(r.peso_unidad || 1),
        tipo_calculo_piezas: r.tipo_calculo_piezas || 'normal',
        codigo_fraccionado: codFrac
      });

      if (codFrac) {
        madreAHijo.set(cod, codFrac);
        hijoAMadre.set(codFrac, cod);
      }
    });

    // Mapa rápido de envíos por SKU
    const envMap = new Map();
    listEnviados.forEach(item => {
      envMap.set(String(item.codigo).trim(), item);
    });

    // Enriquecer listEnviados con stock_actual y relaciones madre/hijo
    listEnviados.forEach(item => {
      const cod = String(item.codigo).trim();
      const cat = catalogMap.get(cod);
      item.stock_actual = cat ? parseFloat(cat.stock_actual.toFixed(3)) : 0;
      item.peso_pieza = cat ? cat.peso_pieza : 1;
      item.tipo_calculo_piezas = cat ? cat.tipo_calculo_piezas : 'normal';

      const hijoCod = madreAHijo.get(cod);
      const madreCod = hijoAMadre.get(cod);

      item.es_madre = !!hijoCod;
      item.es_derivado = !!madreCod;
      item.codigo_fraccionado = hijoCod || null;
      item.codigo_madre = madreCod || null;

      if (hijoCod) {
        const hijoCat = catalogMap.get(hijoCod);
        const hijoEnv = envMap.get(hijoCod);
        const despHijo = hijoEnv ? hijoEnv.peso_total : 0;
        const stockHijo = hijoCat ? hijoCat.stock_actual : 0;
        item.despacho_consolidado_kg = parseFloat((item.peso_total + despHijo).toFixed(3));
        item.stock_consolidado_kg = parseFloat((item.stock_actual + stockHijo).toFixed(3));
        item.nombre_derivado = hijoCat ? hijoCat.nombre : null;
      } else {
        item.despacho_consolidado_kg = item.peso_total;
        item.stock_consolidado_kg = item.stock_actual;
      }
    });

    // Totales generales para métricas KPI
    const totalEnviadoKg = listEnviados.reduce((acc, curr) => acc + curr.peso_total, 0);
    const totalPiezasEnviadas = listEnviados.reduce((acc, curr) => acc + curr.piezas + Math.round(curr.fracciones || 0), 0);
    const totalStockActualKg = listEnviados.reduce((acc, curr) => acc + (curr.stock_actual || 0), 0);

    // 4. Rango mensual para proyección de demanda estable (Últimos 30 días)
    const hoy = new Date();
    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const monthEndDate = formatYMD(hoy);
    const date30DaysAgo = new Date(hoy);
    date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
    const monthStartDate = formatYMD(date30DaysAgo);

    // Contar días operativos (Lunes a Sábado) en los últimos 30 días
    let diasOperativosMes = 0;
    const curDate = new Date(date30DaysAgo);
    while (curDate <= hoy) {
      if (curDate.getDay() !== 0) { // 0 = Domingo
        diasOperativosMes++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    if (diasOperativosMes === 0) diasOperativosMes = 26;

    // Consultar despachos del último mes (WMS o fallback a pedidos locales)
    let listEnviadosMes = [];
    try {
      const siteId = req.headers['x-wms-site-id'] || req.query.siteId || '194326';
      const wmsResMes = await wmsService.obtenerOrdenesEgresoWMS({
        siteId,
        fechaDesde: monthStartDate,
        fechaHasta: monthEndDate,
        tipoComprobante: 'Despacho'
      }, req);

      if (wmsResMes && wmsResMes.ok && Array.isArray(wmsResMes.productosConsolidados) && wmsResMes.productosConsolidados.length > 0) {
        listEnviadosMes = wmsResMes.productosConsolidados.map(item => ({
          codigo: String(item.codigo).trim(),
          peso_total: parseFloat(item.totalDespachado || 0)
        })).filter(i => i.peso_total > 0);
      }
    } catch (wmsErr) {
      // Ignorar error WMS para usar fallback local
    }

    if (listEnviadosMes.length === 0) {
      const sqlEnviadosMes = `
        SELECT 
          pp.codigo_producto,
          SUM(COALESCE(pp.peso_enviado, 0)) AS peso_enviado
        FROM producto_pedidos pp
        INNER JOIN pedidos ped ON pp.id_pedido = ped.id
        WHERE (ped.id_ubicacion = :id_ubicacion OR ped.id_ubicacion IS NULL)
          AND ped.estado IN ('Enviado', 'Completado')
          AND ped.fecha BETWEEN :monthStartDate AND :monthEndDate
        GROUP BY pp.codigo_producto;
      `;
      const [resMes] = await sequelize.query(sqlEnviadosMes, {
        replacements: { id_ubicacion, monthStartDate, monthEndDate }
      });
      listEnviadosMes = resMes.map(r => ({
        codigo: String(r.codigo_producto).trim(),
        peso_total: parseFloat(r.peso_enviado || 0)
      }));
    }

    const envMesMap = new Map();
    listEnviadosMes.forEach(item => {
      envMesMap.set(item.codigo, item.peso_total);
    });

    // Construir dataset completo de proyección de cobertura con ritmo mensual y consolidación madre-derivado
    const proyeccion = stocksRows.map(r => {
      const cod = String(r.codigo).trim();
      const env = envMap.get(cod);
      const despSemanaPropio = env ? env.peso_total : 0;
      const stockPropio = parseFloat(r.stock_actual || 0);
      const pedidosPropio = env ? env.total_pedidos : 0;
      const piezasPropio = env ? (env.piezas || Math.round(env.fracciones || 0)) : 0;

      // Despacho del último mes (30 días)
      const despMesPropio = envMesMap.get(cod) || 0;

      const hijoCod = madreAHijo.get(cod);
      const madreCod = hijoAMadre.get(cod);

      let hijoCat = null;
      let hijoEnv = null;
      let hijoDespachoSemana = 0;
      let hijoDespachoMes = 0;
      let hijoStock = 0;
      let hijoPiezas = 0;

      if (hijoCod) {
        hijoCat = catalogMap.get(hijoCod);
        hijoEnv = envMap.get(hijoCod);
        hijoDespachoSemana = hijoEnv ? hijoEnv.peso_total : 0;
        hijoDespachoMes = envMesMap.get(hijoCod) || 0;
        hijoStock = hijoCat ? hijoCat.stock_actual : 0;
        hijoPiezas = hijoEnv ? (hijoEnv.piezas || Math.round(hijoEnv.fracciones || 0)) : 0;
      }

      const madreCat = madreCod ? catalogMap.get(madreCod) : null;

      // Despachos consolidados
      const despachoSemanaConsolidado = hijoCod ? (despSemanaPropio + hijoDespachoSemana) : despSemanaPropio;
      const despachoMesConsolidado = hijoCod ? (despMesPropio + hijoDespachoMes) : despMesPropio;
      const stockConsolidado = hijoCod ? (stockPropio + hijoStock) : stockPropio;

      // Ritmo diario basado en el último mes (30 días / días operativos)
      const ritmoDiario = diasOperativosMes > 0 ? (despachoMesConsolidado / diasOperativosMes) : 0;
      const despachoSemanalPromedio = ritmoDiario * 6;

      return {
        codigo: cod,
        nombre: r.nombre,
        tipo_calculo_piezas: r.tipo_calculo_piezas,
        peso_pieza: parseFloat(r.peso_pieza || 0),

        // Valores propios del SKU
        stock_propio_kg: parseFloat(stockPropio.toFixed(3)),
        despacho_semana_propio_kg: parseFloat(despSemanaPropio.toFixed(3)),
        despacho_mes_propio_kg: parseFloat(despMesPropio.toFixed(3)),
        pedidos_count: pedidosPropio,
        piezas_enviadas: piezasPropio,

        // Roles de transformación
        es_madre: !!hijoCod,
        es_derivado: !!madreCod,
        codigo_fraccionado: hijoCod || null,
        codigo_madre: madreCod || null,
        nombre_madre: madreCat ? madreCat.nombre : null,

        // Información del hijo si es madre
        derivado_info: hijoCod ? {
          codigo: hijoCod,
          nombre: hijoCat ? hijoCat.nombre : '',
          despacho_semana_kg: parseFloat(hijoDespachoSemana.toFixed(3)),
          despacho_mes_kg: parseFloat(hijoDespachoMes.toFixed(3)),
          stock_kg: parseFloat(hijoStock.toFixed(3)),
          piezas: hijoPiezas
        } : null,

        // Despachos del mes (30 días)
        despacho_mes_derivados_kg: parseFloat(hijoDespachoMes.toFixed(3)),
        despacho_mes_consolidado_kg: parseFloat(despachoMesConsolidado.toFixed(3)),
        despacho_mes_kg: parseFloat(despachoMesConsolidado.toFixed(3)),

        // Ritmo diario y despacho semanal promedio derivado del mes
        ritmo_diario_kg: parseFloat(ritmoDiario.toFixed(3)),
        despacho_semanal_promedio_kg: parseFloat(despachoSemanalPromedio.toFixed(3)),

        // Despachos de la semana seleccionada
        despacho_semana_consolidado_kg: parseFloat(despachoSemanaConsolidado.toFixed(3)),
        despacho_semana_derivados_kg: parseFloat(hijoDespachoSemana.toFixed(3)),

        // Stocks
        stock_derivados_kg: parseFloat(hijoStock.toFixed(3)),
        stock_consolidado_kg: parseFloat(stockConsolidado.toFixed(3)),

        // Campos compatibles por defecto con frontend
        despacho_semanal_kg: parseFloat(despachoSemanalPromedio.toFixed(3)), // Ahora es el promedio semanal basado en el mes
        despacho_semana_kg: parseFloat((hijoCod ? despachoSemanaConsolidado : despSemanaPropio).toFixed(3)), // Kilos de la semana consultada
        stock_actual: parseFloat((hijoCod ? stockConsolidado : stockPropio).toFixed(3))
      };
    });

    res.json({
      startDate,
      endDate,
      origenDatos,
      ventanaMes: {
        startDate: monthStartDate,
        endDate: monthEndDate,
        diasOperativos: diasOperativosMes
      },
      enviados: listEnviados,
      proyeccion,
      metricas: {
        totalEnviadoKg: parseFloat(totalEnviadoKg.toFixed(3)),
        totalPiezasEnviadas,
        totalProductosDistintos: listEnviados.length,
        totalStockActualKg: parseFloat(totalStockActualKg.toFixed(3))
      }
    });

  } catch (error) {
    console.error('Error al generar reporte semanal de envíos:', error);
    res.status(500).json({ error: 'Error interno al obtener reporte semanal de envíos' });
  }
};
