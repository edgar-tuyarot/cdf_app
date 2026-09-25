const { Proceso, Producto, ProductoStock, Usuario, Sucursal, Proveedor, ProductoVencimiento, MovimientoStock, IngresoProveedor, sequelize } = require('../models');
const { Op } = require('sequelize');

// 1. Obtener la producción del día (para feteado y envasado)
exports.getProduccionDia = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const id_ubicacion = req.ubicacionId;

    const processes = await Proceso.findAll({
      where: { fecha: todayStr, id_ubicacion },
      include: [{ model: Producto, attributes: ['nombre'] }]
    });

    const feteadosMap = {};
    const envasadosMap = {};

    processes.forEach(p => {
      const isFeteado = ['Fraccionamiento', 'Feteado'].includes(p.proceso);
      const isEnvasado = p.proceso === 'Envasado';
      const code = p.codigo;
      const prodName = p.Producto?.nombre || 'Producto Desconocido';

      if (isFeteado) {
        if (!feteadosMap[code]) {
          feteadosMap[code] = {
            codigo: code,
            producto: prodName,
            peso_feteado: 0,
            cantidad_bolsitas: 0
          };
        }
        feteadosMap[code].peso_feteado += parseFloat(p.peso_bruto) || 0;
        feteadosMap[code].cantidad_bolsitas += parseInt(p.piezas, 10) || 0;
      } else if (isEnvasado) {
        if (!envasadosMap[code]) {
          envasadosMap[code] = {
            codigo: code,
            producto: prodName,
            cantidad_bolsitas: 0
          };
        }
        envasadosMap[code].cantidad_bolsitas += parseInt(p.piezas, 10) || 0;
      }
    });

    res.json({
      feteados: Object.values(feteadosMap),
      envasados: Object.values(envasadosMap)
    });
  } catch (error) {
    console.error('Error en getProduccionDia:', error);
    res.status(500).json({ error: 'Error al obtener producción del día' });
  }
};

// 2. Obtener el rendimiento por operador para el día de hoy
exports.getProduccionOperador = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const id_ubicacion = req.ubicacionId;

    const processes = await Proceso.findAll({
      where: { fecha: todayStr, id_ubicacion },
      include: [
        { model: Usuario, as: 'Usuario', attributes: ['id', 'nombre', 'rol'] }
      ]
    });

    const opMap = {};

    processes.forEach(p => {
      const name = p.Usuario?.nombre || 'Desconocido';

      if (!opMap[name]) {
        opMap[name] = {
          nombre: name,
          total_feteado_kilos: 0,
          total_feteado_bolsitas: 0,
          total_envasado_bolsitas: 0
        };
      }

      const isFeteado = ['Fraccionamiento', 'Feteado'].includes(p.proceso);
      const isEnvasado = p.proceso === 'Envasado';

      if (isFeteado) {
        opMap[name].total_feteado_kilos += parseFloat(p.peso_bruto) || 0;
        opMap[name].total_feteado_bolsitas += parseInt(p.piezas, 10) || 0;
      } else if (isEnvasado) {
        opMap[name].total_envasado_bolsitas += parseInt(p.piezas, 10) || 0;
      }
    });

    res.json(Object.values(opMap));
  } catch (error) {
    console.error('Error en getProduccionOperador:', error);
    res.status(500).json({ error: 'Error al obtener rendimiento por operador' });
  }
};

// 3. Obtener mermas de stock acumuladas
exports.getMermasStock = async (req, res) => {
  try {
    const id_ubicacion = req.ubicacionId;
    const stocks = await ProductoStock.findAll({
      where: {
        id_ubicacion,
        [Op.or]: [
          { decomiso: { [Op.gt]: 0 } },
          { recorte: { [Op.gt]: 0 } }
        ]
      },
      include: [{ model: Producto, as: 'Producto' }]
    });

    const decomiso = stocks
      .filter(ps => parseFloat(ps.decomiso) > 0)
      .map(ps => ({
        codigo: ps.codigo_producto,
        nombre: ps.Producto ? ps.Producto.nombre : 'Producto Desconocido',
        peso: parseFloat(ps.decomiso)
      }))
      .sort((a, b) => b.peso - a.peso);

    const picadas = stocks
      .filter(ps => parseFloat(ps.recorte) > 0)
      .map(ps => ({
        codigo: ps.codigo_producto,
        nombre: ps.Producto ? ps.Producto.nombre : 'Producto Desconocido',
        peso: parseFloat(ps.recorte)
      }))
      .sort((a, b) => b.peso - a.peso);

    res.json({ decomiso, picadas });
  } catch (error) {
    console.error('Error en getMermasStock:', error);
    res.status(500).json({ error: 'Error al obtener mermas de stock' });
  }
};

// 4. Obtener rendimiento semanal por operador (Lunes - Sábado)
exports.getProduccionSemanal = async (req, res) => {
  try {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    saturday.setHours(23, 59, 59, 999);

    const startDateStr = monday.toISOString().split('T')[0];
    const endDateStr = saturday.toISOString().split('T')[0];
    const id_ubicacion = req.ubicacionId;

    const processes = await Proceso.findAll({
      where: {
        fecha: {
          [Op.between]: [startDateStr, endDateStr]
        },
        id_ubicacion
      },
      include: [
        { model: Usuario, as: 'Usuario', attributes: ['id', 'nombre', 'rol'] }
      ]
    });

    const dayNames = {
      1: 'Lunes',
      2: 'Martes',
      3: 'Miercoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sabado'
    };

    const semanalMap = {};

    processes.forEach(p => {
      const opName = p.Usuario?.nombre || 'Desconocido';

      if (!semanalMap[opName]) {
        semanalMap[opName] = {
          operador: opName,
          dias: {}
        };
        Object.values(dayNames).forEach(d => {
          semanalMap[opName].dias[d] = {
            feteado_kilos: 0,
            feteado_bolsitas: 0,
            envasado_bolsitas: 0,
            envasado_kilos: 0
          };
        });
      }

      // Parse the day of the week, safe timezone mapping
      const dateParts = p.fecha.split('-');
      const pDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0);
      const dayNum = pDate.getDay();
      const dayName = dayNames[dayNum];

      if (dayName) {
        const isFeteado = ['Fraccionamiento', 'Feteado'].includes(p.proceso);
        const isEnvasado = p.proceso === 'Envasado';

        if (isFeteado) {
          semanalMap[opName].dias[dayName].feteado_kilos += parseFloat(p.peso_bruto) || 0;
          semanalMap[opName].dias[dayName].feteado_bolsitas += parseInt(p.piezas, 10) || 0;
        } else if (isEnvasado) {
          semanalMap[opName].dias[dayName].envasado_bolsitas += parseInt(p.piezas, 10) || 0;
          semanalMap[opName].dias[dayName].envasado_kilos += parseFloat(p.kg_a_sumar) || 0;
        }
      }
    });

    res.json(Object.values(semanalMap));
  } catch (error) {
    console.error('Error en getProduccionSemanal:', error);
    res.status(500).json({ error: 'Error al obtener rendimiento semanal' });
  }
};

// 5. Historial de producción de un operario (para vista Operario)
exports.getProduccionUsuario = async (req, res) => {
  try {
    const { usuario } = req.params;
    const id_ubicacion = req.ubicacionId;

    const user = await Usuario.findOne({
      where: sequelize.where(
        sequelize.fn('lower', sequelize.col('nombre')),
        sequelize.fn('lower', usuario)
      )
    });

    if (!user) {
      return res.json([]);
    }

    const processes = await Proceso.findAll({
      where: { usuario_id: user.id, id_ubicacion },
      include: [{ model: Producto, attributes: ['nombre'] }],
      order: [['id', 'DESC']]
    });

    const mapped = processes.map(p => ({
      id_produccion: p.id,
      tipo_proceso: p.proceso === 'Fraccionamiento' ? 'Feteado' : p.proceso,
      cantidad_bolsitas: p.piezas,
      fecha: p.fecha + 'T12:00:00.000Z',
      Producto: {
        descripcion: p.Producto?.nombre || ''
      }
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error en getProduccionUsuario:', error);
    res.status(500).json({ error: 'Error al obtener historial de producción de usuario' });
  }
};

// 6. Obtener registro consolidated de actividad reciente (Hoy y Ayer)
exports.getRecentActivity = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 1);
    since.setHours(0, 0, 0, 0); // Inicio de ayer

    // A. Consultar Movimientos de Stock (excluyendo PROCESO e INGRESO_PROVEEDOR para evitar duplicación con tablas específicas)
    const id_ubicacion = req.ubicacionId;
    const movimientos = await MovimientoStock.findAll({
      where: {
        id_ubicacion,
        fecha: { [Op.gte]: since },
        tipo_movimiento: { [Op.notIn]: ['PROCESO', 'INGRESO_PROVEEDOR'] }
      },
      include: [{ model: Producto, as: 'Producto', attributes: ['nombre'] }],
      order: [['fecha', 'DESC']]
    });

    // B. Consultar Procesos (Feteado, Envasado, Picada, Decomisos cargados)
    const procesos = await Proceso.findAll({
      where: {
        createdAt: { [Op.gte]: since },
        id_ubicacion
      },
      include: [
        { model: Producto, attributes: ['nombre'] },
        { model: Usuario, as: 'Usuario', attributes: ['id', 'nombre', 'rol'] }
      ],
      order: [['id', 'DESC']]
    });

    // C. Consultar Ingresos de Proveedores
    const ingresosProveedores = await IngresoProveedor.findAll({
      where: {
        fecha: { [Op.gte]: since },
        id_ubicacion
      },
      include: [
        { model: Producto, as: 'Producto', attributes: ['nombre'] },
        { model: Proveedor, as: 'Proveedor', attributes: ['nombre'] }
      ],
      order: [['fecha', 'DESC']]
    });

    const unifiedFeed = [];

    // Mapear Procesos
    procesos.forEach(p => {
      const user = p.Usuario?.nombre || 'Sistema';

      unifiedFeed.push({
        id: `proceso-${p.id}`,
        tipo: 'proceso',
        subtipo: p.proceso,
        producto_codigo: p.codigo,
        producto_nombre: p.Producto?.nombre || 'Producto Desconocido',
        concepto: `${p.proceso}: ${p.piezas} pzs, ${parseFloat(p.peso_bruto).toFixed(3)} kg ${p.pendiente ? '(Pendiente)' : ''}`,
        usuario: user,
        fecha: p.createdAt || p.fecha,
        piezas: p.piezas,
        kilos: parseFloat(p.peso_bruto) || 0,
        pendiente: p.pendiente
      });
    });

    // Mapear Ingresos Proveedores
    ingresosProveedores.forEach(ip => {
      unifiedFeed.push({
        id: `ingprov-${ip.id}`,
        tipo: 'ingreso',
        subtipo: 'INGRESO_PROVEEDOR',
        producto_codigo: ip.codigo_producto,
        producto_nombre: ip.Producto?.nombre || 'Producto Desconocido',
        concepto: `Ingreso Proveedor: ${ip.Proveedor?.nombre || 'Sin Nombre'} (${ip.piezas} pzs, Vence: ${ip.vencimiento})${ip.nro_factura ? ` [Factura: ${ip.nro_factura}]` : ''}`,
        usuario: 'Sistema',
        fecha: ip.fecha,
        piezas: ip.piezas,
        kilos: parseFloat(ip.peso_calculado) || 0,
        pendiente: false
      });
    });

    // Mapear Otros Movimientos de Stock
    movimientos.forEach(m => {
      let tipo = 'ajuste';
      if (['INGRESO_SUCURSAL', 'INGRESO_RECORTE'].includes(m.tipo_movimiento)) {
        tipo = 'ingreso';
      } else if (m.tipo_movimiento === 'PEDIDO_ENVIADO') {
        tipo = 'egreso';
      } else if (m.tipo_movimiento === 'CONVERSION') {
        tipo = 'conversion';
      }

      const pzs = Math.abs(m.cantidad_piezas || 0);
      const kgs = Math.abs(parseFloat(m.kilos_calculado) || parseFloat(m.stock) || parseFloat(m.kg_fraccionados) || parseFloat(m.kg_recorte) || parseFloat(m.kg_decomiso) || 0);

      unifiedFeed.push({
        id: `mov-${m.id}`,
        tipo: tipo,
        subtipo: m.tipo_movimiento,
        producto_codigo: m.codigo_producto,
        producto_nombre: m.Producto?.nombre || 'Producto Desconocido',
        concepto: m.concepto,
        usuario: m.usuario || 'Sistema',
        fecha: m.fecha,
        piezas: pzs,
        kilos: kgs,
        pendiente: false
      });
    });

    // Ordenar por fecha descendente
    unifiedFeed.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Calcular el resumen de hoy
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const resumenHoy = {
      ingresosKilos: 0,
      ingresosPiezas: 0,
      egresosKilos: 0,
      egresosPiezas: 0,
      ajustesKilos: 0,
      procesosKilos: 0,
      conversionesKilos: 0
    };

    unifiedFeed.forEach(evt => {
      if (new Date(evt.fecha) >= todayStart) {
        if (evt.tipo === 'ingreso') {
          resumenHoy.ingresosKilos += evt.kilos;
          resumenHoy.ingresosPiezas += evt.piezas;
        } else if (evt.tipo === 'egreso') {
          resumenHoy.egresosKilos += evt.kilos;
          resumenHoy.egresosPiezas += evt.piezas;
        } else if (evt.tipo === 'proceso') {
          resumenHoy.procesosKilos += evt.kilos;
        } else if (evt.tipo === 'ajuste') {
          resumenHoy.ajustesKilos += evt.kilos;
        } else if (evt.tipo === 'conversion') {
          resumenHoy.conversionesKilos += evt.kilos;
        }
      }
    });

    res.json({
      resumenHoy,
      feed: unifiedFeed
    });
  } catch (error) {
    console.error('Error en getRecentActivity:', error);
    res.status(500).json({ error: 'Error al obtener actividad reciente del dashboard' });
  }
};

// 7. Obtener la producción semanal de productos (lo que se fetea/fracciona por código de lunes a sábado)
exports.getProduccionSemanalProductos = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    saturday.setHours(23, 59, 59, 999);

    const startDateStr = monday.toISOString().split('T')[0];
    const endDateStr = saturday.toISOString().split('T')[0];
    const id_ubicacion = req.ubicacionId;

    const processes = await Proceso.findAll({
      where: {
        fecha: {
          [Op.between]: [startDateStr, endDateStr]
        },
        proceso: {
          [Op.in]: ['Fraccionamiento', 'Feteado']
        },
        id_ubicacion
      },
      include: [{ model: Producto, attributes: ['nombre'] }]
    });

    const dayNames = {
      1: 'Lunes',
      2: 'Martes',
      3: 'Miercoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sabado'
    };

    const prodMap = {};

    processes.forEach(p => {
      const code = p.codigo;
      const prodName = p.Producto?.nombre || 'Producto Desconocido';

      if (!prodMap[code]) {
        prodMap[code] = {
          codigo: code,
          producto: prodName,
          dias: {},
          total_kilos: 0,
          total_piezas: 0
        };
        Object.values(dayNames).forEach(d => {
          prodMap[code].dias[d] = {
            kilos: 0,
            piezas: 0
          };
        });
      }

      // Parse date to avoid timezone offset shifts
      const dateParts = p.fecha.split('-');
      const pDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0);
      const dayNum = pDate.getDay();
      const dayName = dayNames[dayNum];

      if (dayName) {
        const kgs = parseFloat(p.peso_bruto) || 0;
        const pzs = parseInt(p.piezas, 10) || 0;

        prodMap[code].dias[dayName].kilos += kgs;
        prodMap[code].dias[dayName].piezas += pzs;
        prodMap[code].total_kilos += kgs;
        prodMap[code].total_piezas += pzs;
      }
    });

    res.json(Object.values(prodMap));
  } catch (error) {
    console.error('Error en getProduccionSemanalProductos:', error);
    res.status(500).json({ error: 'Error al obtener producción semanal de productos' });
  }
};
