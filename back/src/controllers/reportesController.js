const { Proceso, Colaborador, Producto, sequelize } = require('../models');

// Helper to get start (Monday) and end (Sunday) dates of an ISO week
function getWeekRange(year, week) {
  // ISO week date math
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  
  const monday = new Date(ISOweekStart);
  const sunday = new Date(ISOweekStart);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    inicio: monday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    fin: sunday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  };
}

// 1. Daily production by collaborator
exports.getDiaria = async (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    
    // Fetch all processes on that day with collaborator and product
    const procesos = await Proceso.findAll({
      where: { fecha },
      include: [
        {
          model: Colaborador,
          as: 'Colaborador',
          attributes: ['id', 'nombre']
        },
        {
          model: Producto,
          attributes: ['codigo', 'nombre']
        }
      ]
    });

    // Group by collaborator
    const colaboradorMap = {};

    procesos.forEach(p => {
      const colId = p.colaborador_id || 0;
      const colName = p.Colaborador?.nombre || p.colaborador || 'Sin Colaborador';
      
      if (!colaboradorMap[colId]) {
        colaboradorMap[colId] = {
          colaborador_id: colId,
          nombre: colName,
          total_piezas: 0,
          total_peso_bruto: 0,
          total_recorte: 0,
          total_decomiso: 0,
          detalles: {}
        };
      }

      const colData = colaboradorMap[colId];
      const pzs = parseInt(p.piezas, 10) || 0;
      const peso = parseFloat(p.peso_bruto) || 0;
      const rec = parseFloat(p.recorte) || 0;
      const dec = parseFloat(p.decomiso) || 0;

      colData.total_piezas += pzs;
      colData.total_peso_bruto += peso;
      colData.total_recorte += rec;
      colData.total_decomiso += dec;

      // Group product details under this collaborator
      const prodCode = p.codigo || 'SIN_CODIGO';
      const prodName = p.Producto?.nombre || 'Producto Desconocido';
      const key = `${prodCode}-${p.proceso || 'General'}`;

      if (!colData.detalles[key]) {
        colData.detalles[key] = {
          codigo: prodCode,
          nombre: prodName,
          proceso: p.proceso || 'General',
          piezas: 0,
          peso_bruto: 0,
          recorte: 0,
          decomiso: 0
        };
      }

      colData.detalles[key].piezas += pzs;
      colData.detalles[key].peso_bruto += peso;
      colData.detalles[key].recorte += rec;
      colData.detalles[key].decomiso += dec;
    });

    // Convert map to array and details map to array
    const resultado = Object.values(colaboradorMap).map(col => {
      return {
        ...col,
        total_peso_bruto: parseFloat(col.total_peso_bruto.toFixed(3)),
        total_recorte: parseFloat(col.total_recorte.toFixed(3)),
        total_decomiso: parseFloat(col.total_decomiso.toFixed(3)),
        detalles: Object.values(col.detalles).map(det => ({
          ...det,
          peso_bruto: parseFloat(det.peso_bruto.toFixed(3)),
          recorte: parseFloat(det.recorte.toFixed(3)),
          decomiso: parseFloat(det.decomiso.toFixed(3))
        }))
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener reporte diario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// 2. Weekly production by collaborator
exports.getSemanal = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const query = `
      SELECT 
        YEAR(fecha) AS anio,
        WEEK(fecha, 1) AS semana,
        colaborador_id,
        c.nombre AS colaborador_nombre,
        SUM(piezas) AS total_piezas,
        SUM(peso_bruto) AS total_peso_bruto,
        SUM(recorte) AS total_recorte,
        SUM(decomiso) AS total_decomiso
      FROM procesos p
      LEFT JOIN colaboradores c ON p.colaborador_id = c.id
      WHERE YEAR(fecha) = :year
      GROUP BY YEAR(fecha), WEEK(fecha, 1), colaborador_id
      ORDER BY WEEK(fecha, 1) DESC, total_peso_bruto DESC
    `;

    const resultados = await sequelize.query(query, {
      replacements: { year },
      type: sequelize.QueryTypes.SELECT
    });

    // Enhance with week date ranges
    const enhanced = resultados.map(row => {
      const range = getWeekRange(row.anio, row.semana);
      return {
        ...row,
        total_piezas: parseInt(row.total_piezas, 10) || 0,
        total_peso_bruto: parseFloat(parseFloat(row.total_peso_bruto || 0).toFixed(3)),
        total_recorte: parseFloat(parseFloat(row.total_recorte || 0).toFixed(3)),
        total_decomiso: parseFloat(parseFloat(row.total_decomiso || 0).toFixed(3)),
        rango_fechas: `${range.inicio} al ${range.fin}`
      };
    });

    res.json(enhanced);
  } catch (error) {
    console.error('Error al obtener reporte semanal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// 3. Monthly production by collaborator
exports.getMensual = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const query = `
      SELECT 
        YEAR(fecha) AS anio,
        MONTH(fecha) AS mes,
        colaborador_id,
        c.nombre AS colaborador_nombre,
        SUM(piezas) AS total_piezas,
        SUM(peso_bruto) AS total_peso_bruto,
        SUM(recorte) AS total_recorte,
        SUM(decomiso) AS total_decomiso
      FROM procesos p
      LEFT JOIN colaboradores c ON p.colaborador_id = c.id
      WHERE YEAR(fecha) = :year
      GROUP BY YEAR(fecha), MONTH(fecha), colaborador_id
      ORDER BY MONTH(fecha) DESC, total_peso_bruto DESC
    `;

    const resultados = await sequelize.query(query, {
      replacements: { year },
      type: sequelize.QueryTypes.SELECT
    });

    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const enhanced = resultados.map(row => {
      const mesNombre = nombresMeses[(row.mes - 1)] || 'Desconocido';
      return {
        ...row,
        total_piezas: parseInt(row.total_piezas, 10) || 0,
        total_peso_bruto: parseFloat(parseFloat(row.total_peso_bruto || 0).toFixed(3)),
        total_recorte: parseFloat(parseFloat(row.total_recorte || 0).toFixed(3)),
        total_decomiso: parseFloat(parseFloat(row.total_decomiso || 0).toFixed(3)),
        mes_nombre: mesNombre
      };
    });

    res.json(enhanced);
  } catch (error) {
    console.error('Error al obtener reporte mensual:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// 4. Top products and monthly quantities
exports.getProductosMasProcesados = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month, 10) : null;

    let whereClause = 'WHERE YEAR(fecha) = :year';
    const replacements = { year };

    if (month) {
      whereClause += ' AND MONTH(fecha) = :month';
      replacements.month = month;
    }

    const query = `
      SELECT 
        YEAR(fecha) AS anio,
        MONTH(fecha) AS mes,
        p.codigo AS producto_codigo,
        prod.nombre AS producto_nombre,
        SUM(piezas) AS total_piezas,
        SUM(peso_bruto) AS total_peso_bruto,
        SUM(recorte) AS total_recorte,
        SUM(decomiso) AS total_decomiso
      FROM procesos p
      LEFT JOIN productos prod ON p.codigo = prod.codigo
      ${whereClause}
      GROUP BY YEAR(fecha), MONTH(fecha), p.codigo
      ORDER BY MONTH(fecha) DESC, total_peso_bruto DESC
    `;

    const resultados = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const enhanced = resultados.map(row => {
      const mesNombre = nombresMeses[(row.mes - 1)] || 'Desconocido';
      return {
        ...row,
        total_piezas: parseInt(row.total_piezas, 10) || 0,
        total_peso_bruto: parseFloat(parseFloat(row.total_peso_bruto || 0).toFixed(3)),
        total_recorte: parseFloat(parseFloat(row.total_recorte || 0).toFixed(3)),
        total_decomiso: parseFloat(parseFloat(row.total_decomiso || 0).toFixed(3)),
        mes_nombre: mesNombre
      };
    });

    res.json(enhanced);
  } catch (error) {
    console.error('Error al obtener productos más procesados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
