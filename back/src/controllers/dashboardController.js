const { 
  ProduccionFeteado, 
  ProduccionEnvasado, 
  StockADecomiso, 
  StockAPicada, 
  Producto, 
  Colaborador 
} = require('../models');
const { Op } = require('sequelize');

const getTodayString = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const getStartOfDay = (dateString = null) => {
  const d = dateString ? new Date(dateString + 'T00:00:00') : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (dateString = null) => {
  const d = dateString ? new Date(dateString + 'T23:59:59') : new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const getStartOfISOWeek = () => {
  const d = new Date();
  const day = d.getDay(); 
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
};

// 1. Producción del día (Feteados y Envasados)
exports.obtenerProduccionDelDia = async (req, res) => {
  try {
    const start = getStartOfDay();
    const end = getEndOfDay();

    // Feteados del día
    const feteados = await ProduccionFeteado.findAll({
      where: {
        fecha: {
          [Op.gte]: start,
          [Op.lte]: end
        }
      }
    });

    const feteadosAgrupados = {};
    for (const f of feteados) {
      if (!feteadosAgrupados[f.codigo_producto]) {
        const prod = await Producto.findOne({ where: { codigo_interno: f.codigo_producto } });
        feteadosAgrupados[f.codigo_producto] = {
          codigo: f.codigo_producto,
          producto: prod ? prod.descripcion : 'Desconocido',
          peso_feteado: 0,
          cantidad_bolsitas: 0
        };
      }
      feteadosAgrupados[f.codigo_producto].peso_feteado += parseFloat(f.peso_feteado || 0);
      feteadosAgrupados[f.codigo_producto].cantidad_bolsitas += parseInt(f.cantidad_bolsitas || 0);
    }

    // Envasados del día (Usando la nueva tabla histórica)
    const envasados = await ProduccionEnvasado.findAll({
      where: {
        fecha: {
          [Op.gte]: start,
          [Op.lte]: end
        }
      }
    });

    const envasadosAgrupados = {};
    for (const e of envasados) {
      const codigo = e.codigo_producto || 'N/A';
      
      if (!envasadosAgrupados[codigo]) {
        const prod = await Producto.findOne({ where: { codigo_interno: codigo } });
        envasadosAgrupados[codigo] = {
          codigo,
          producto: prod ? prod.descripcion : 'Desconocido',
          cantidad_bolsitas: 0,
          peso: 0
        };
      }
      envasadosAgrupados[codigo].cantidad_bolsitas += parseInt(e.cantidad || 0);
      envasadosAgrupados[codigo].peso += parseFloat(e.peso || 0);
    }

    res.json({
      feteados: Object.values(feteadosAgrupados),
      envasados: Object.values(envasadosAgrupados)
    });
  } catch (error) {
    console.error('Error al obtener producción del día:', error);
    res.status(500).json({ error: 'Error al obtener producción del día' });
  }
};

// 2. Producido por cada operador (Feteado y Envasado)
exports.obtenerProduccionPorOperador = async (req, res) => {
  try {
    const start = getStartOfDay();
    const end = getEndOfDay();

    const feteados = await ProduccionFeteado.findAll({
      where: {
        fecha: {
          [Op.gte]: start,
          [Op.lte]: end
        }
      }
    });

    const envasados = await ProduccionEnvasado.findAll({
      where: {
        fecha: {
          [Op.gte]: start,
          [Op.lte]: end
        }
      }
    });

    const operadores = {};

    for (const f of feteados) {
      const nombre = f.feteador || 'Desconocido';
      if (!operadores[nombre]) {
        operadores[nombre] = { nombre, total_feteado_kilos: 0, total_feteado_bolsitas: 0, total_envasado_bolsitas: 0, total_envasado_kilos: 0 };
      }
      operadores[nombre].total_feteado_kilos += parseFloat(f.peso_feteado || 0);
      operadores[nombre].total_feteado_bolsitas += parseInt(f.cantidad_bolsitas || 0);
    }

    for (const e of envasados) {
      const nombre = e.envasador || 'Desconocido';
      if (!operadores[nombre]) {
        operadores[nombre] = { nombre, total_feteado_kilos: 0, total_feteado_bolsitas: 0, total_envasado_bolsitas: 0, total_envasado_kilos: 0 };
      }
      operadores[nombre].total_envasado_bolsitas += parseInt(e.cantidad || 0);
      operadores[nombre].total_envasado_kilos += parseFloat(e.peso || 0);
    }

    res.json(Object.values(operadores));
  } catch (error) {
    console.error('Error al obtener producción por operador:', error);
    res.status(500).json({ error: 'Error al obtener producción por operador' });
  }
};

// 3. Cantidades de Decomiso y Picadas por código
exports.obtenerDecomisoYPicadas = async (req, res) => {
  try {
    const decomisos = await StockADecomiso.findAll();
    const picadas = await StockAPicada.findAll();
    const productos = await Producto.findAll({ attributes: ['codigo_interno', 'descripcion'] });

    const productoMap = {};
    productos.forEach(p => { productoMap[p.codigo_interno] = p.descripcion; });

    const decomisosFormat = decomisos.map(d => ({
      codigo: d.codigo,
      nombre: productoMap[d.codigo] || 'Desconocido',
      peso: parseFloat(d.peso || 0)
    }));

    const picadasFormat = picadas.map(p => ({
      codigo: p.codigo,
      nombre: productoMap[p.codigo] || 'Desconocido',
      peso: parseFloat(p.peso || 0)
    }));

    const agrupar = (arr) => {
      const res = {};
      arr.forEach(item => {
        if (!res[item.codigo]) res[item.codigo] = { ...item };
        else res[item.codigo].peso += item.peso;
      });
      return Object.values(res);
    };

    res.json({
      decomiso: agrupar(decomisosFormat),
      picadas: agrupar(picadasFormat)
    });
  } catch (error) {
    console.error('Error al obtener decomisos y picadas:', error);
    res.status(500).json({ error: 'Error al obtener decomisos y picadas' });
  }
};

// 4. Producción de la semana por cada operador por cada día
exports.obtenerProduccionSemanal = async (req, res) => {
  try {
    const inicioSemana = getStartOfISOWeek(); // Lunes 00:00
    
    // Sabado 23:59
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 5); 
    finSemana.setHours(23, 59, 59, 999);

    const feteados = await ProduccionFeteado.findAll({
      where: {
        fecha: {
          [Op.gte]: inicioSemana,
          [Op.lte]: finSemana
        }
      }
    });

    const envasados = await ProduccionEnvasado.findAll({
      where: {
        fecha: {
          [Op.gte]: inicioSemana,
          [Op.lte]: finSemana
        }
      }
    });

    const operadores = {};
    const diasNombres = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

    const getEstructuraDias = () => {
      const d = {};
      diasNombres.forEach(dia => d[dia] = { feteado_kilos: 0, feteado_bolsitas: 0, envasado_bolsitas: 0, envasado_kilos: 0 });
      return d;
    };

    for (const f of feteados) {
      const nombre = f.feteador || 'Desconocido';
      const f_date = new Date(f.fecha);
      const diaSemanaIndex = f_date.getDay(); // 0 Domingo, 1 Lunes... 6 Sabado
      
      if (diaSemanaIndex >= 1 && diaSemanaIndex <= 6) {
        const diaNombre = diasNombres[diaSemanaIndex - 1];

        if (!operadores[nombre]) {
          operadores[nombre] = { operador: nombre, dias: getEstructuraDias() };
        }
        operadores[nombre].dias[diaNombre].feteado_kilos += parseFloat(f.peso_feteado || 0);
        operadores[nombre].dias[diaNombre].feteado_bolsitas += parseInt(f.cantidad_bolsitas || 0);
      }
    }

    for (const e of envasados) {
      const nombre = e.envasador || 'Desconocido';
      const f_date = new Date(e.fecha);
      const diaSemanaIndex = f_date.getDay();

      if (diaSemanaIndex >= 1 && diaSemanaIndex <= 6) {
        const diaNombre = diasNombres[diaSemanaIndex - 1];

        if (!operadores[nombre]) {
          operadores[nombre] = { operador: nombre, dias: getEstructuraDias() };
        }
        operadores[nombre].dias[diaNombre].envasado_bolsitas += parseInt(e.cantidad || 0);
        operadores[nombre].dias[diaNombre].envasado_kilos += parseFloat(e.peso || 0);
      }
    }

    res.json(Object.values(operadores));
  } catch (error) {
    console.error('Error al obtener producción semanal:', error);
    res.status(500).json({ error: 'Error al obtener producción semanal' });
  }
};
