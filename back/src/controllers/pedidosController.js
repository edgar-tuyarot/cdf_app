const { Pedido, ProductoPedido, Producto, Fraccionado, DescuentoStock, ProductoVencimiento, Sucursal, PedidoSinStock, PedidoArmadoItem, ProductoStock, Ubicacion, sequelize } = require('../models');
const { enviarMailConfirmacion } = require('../utils/email');

// Función auxiliar para determinar el estado automático de un pedido según la carga de peso de sus ítems
const determinarEstadoPedido = (items) => {
  if (!Array.isArray(items) || items.length === 0) return 'Pendiente';

  let itemsResueltosOPesados = 0;

  for (const item of items) {
    const pesoEnv = parseFloat(item.peso_enviado || 0);
    const pzasEnv = parseInt(item.cantidad_enviada || 0, 10);
    const fracEnv = parseFloat(item.fraccion_enviada || 0);
    const esEspecial = !!(item.no_envia || item.sin_stock || item.noEnvia || item.sinStock);

    if (pesoEnv > 0 || pzasEnv > 0 || fracEnv > 0 || esEspecial) {
      itemsResueltosOPesados++;
    }
  }

  if (itemsResueltosOPesados === 0) return 'Pendiente';
  if (itemsResueltosOPesados >= items.length) return 'Listo';
  return 'Preparando';
};

// Obtener todos los pedidos con sus productos asociados
exports.obtenerPedidos = async (req, res) => {
  try {
    const { sucursal } = req.query;
    const id_ubicacion = req.ubicacionId;
    const where = { id_ubicacion };
    if (sucursal) {
      where.sucursal = sucursal;
    }

    const pedidos = await Pedido.findAll({
      where,
      include: [
        {
          model: ProductoPedido,
          as: 'items',
          include: [{
            model: Producto,
            as: 'Producto',
            attributes: ['codigo', 'nombre', 'peso_pieza', 'peso_fraccion', 'peso_unidad', 'tipo_calculo_piezas', 'pesable', 'codigo_barra'],
            include: [{
              model: ProductoStock,
              as: 'Stocks',
              where: { id_ubicacion },
              required: false
            }]
          }]
        },
        {
          model: PedidoArmadoItem,
          as: 'ArmadoItems'
        }
      ]
    });

    const mapped = pedidos.map(p => {
      const json = p.toJSON();
      if (json.items) {
        json.items = json.items.map(item => {
          if (item.Producto) {
            const stockObj = item.Producto.Stocks && item.Producto.Stocks[0] ? item.Producto.Stocks[0] : null;
            item.Producto.stock = stockObj ? parseFloat(stockObj.stock) : 0.0000;
          }
          return item;
        });
      }
      return json;
    });

    res.json(mapped);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

// Obtener un pedido específico por ID
exports.obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const id_ubicacion = req.ubicacionId;

    const pedido = await Pedido.findOne({
      where: { id, id_ubicacion },
      include: [
        {
          model: ProductoPedido,
          as: 'items',
          include: [{
            model: Producto,
            as: 'Producto',
            attributes: ['codigo', 'nombre', 'peso_pieza', 'peso_fraccion', 'peso_unidad', 'tipo_calculo_piezas', 'pesable', 'codigo_barra'],
            include: [{
              model: ProductoStock,
              as: 'Stocks',
              where: { id_ubicacion },
              required: false
            }]
          }]
        },
        {
          model: PedidoSinStock,
          as: 'SinStockItems'
        }
      ]
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const json = pedido.toJSON();
    if (json.items) {
      json.items = json.items.map(item => {
        if (item.Producto) {
          const stockObj = item.Producto.Stocks && item.Producto.Stocks[0] ? item.Producto.Stocks[0] : null;
          item.Producto.stock = stockObj ? parseFloat(stockObj.stock) : 0.0000;
        }
        return item;
      });
    }

    res.json(json);
  } catch (error) {
    console.error('Error al obtener pedido por ID:', error);
    res.status(500).json({ error: 'Error al obtener el pedido' });
  }
};

// Crear un nuevo pedido con sus respectivos productos (transaccional)
exports.crearPedido = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { codigo, sucursal, estado, fecha, items } = req.body;

    if (!codigo) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El campo "codigo" del pedido es obligatorio.' });
    }

    // Validar tipo de sucursal y sus ítems permitidos y obtener su ubicación
    let tipoSucursal = 'ambas';
    let sucursalUbicacionId = null;
    if (sucursal) {
      const dbSuc = await Sucursal.findOne({ where: { sucursal }, transaction });
      if (dbSuc) {
        tipoSucursal = dbSuc.tipo || 'con_sector';
        sucursalUbicacionId = dbSuc.id_ubicacion;
      }
    }

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const { pieza, fraccion } = item;
        if (tipoSucursal === 'con_sector' && fraccion && parseFloat(fraccion) > 0) {
          await transaction.rollback();
          return res.status(400).json({ error: `La sucursal "${sucursal}" es de tipo "con_sector" y sólo puede pedir piezas (no fraccionados).` });
        }
        if (tipoSucursal === 'express' && pieza && parseInt(pieza, 10) > 0) {
          await transaction.rollback();
          return res.status(400).json({ error: `La sucursal "${sucursal}" es de tipo "express" y sólo puede pedir productos fraccionados (no piezas).` });
        }
      }
    }

    // 1. Crear el pedido principal
    const nuevoPedido = await Pedido.create({
      codigo,
      fecha: fecha || new Date(),
      sucursal,
      estado: estado || 'Pendiente',
      id_ubicacion: sucursalUbicacionId || req.ubicacionId || 1
    }, { transaction });

    // 2. Si se suministra un array de items (productos vinculados), los registramos
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const { codigo_producto, pieza, fraccion, peso_enviado, cantidad_enviada, fraccion_enviada } = item;

        if (!codigo_producto) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Cada item del pedido debe tener un "codigo_producto" válido.' });
        }

        // Si el producto no existe en stock, lo creamos dinámicamente como en la carga masiva y edición
        const productoExiste = await Producto.findByPk(codigo_producto, { transaction });
        if (!productoExiste) {
          await Producto.create({
            codigo: codigo_producto,
            nombre: `PRODUCTO AUTOCREADO (${codigo_producto})`,
            peso_pieza: 0,
            cantidad_piezas: 0,
            vencimientos: null,
            peso_fraccion: 0
          }, { transaction });
        }

        // Crear la relación en la tabla intermedia
        await ProductoPedido.create({
          id_pedido: nuevoPedido.id,
          codigo_producto,
          pieza: pieza || 0,
          fraccion: fraccion || 0,
          peso_enviado: peso_enviado || 0,
          cantidad_enviada: cantidad_enviada || 0,
          fraccion_enviada: fraccion_enviada || 0
        }, { transaction });
      }
    }

    await transaction.commit();

    // Consultar el pedido recién creado con todos sus datos completos
    const id_ubicacion = req.ubicacionId || 1;
    const pedidoCompletoRaw = await Pedido.findByPk(nuevoPedido.id, {
      include: [{
        model: ProductoPedido,
        as: 'items',
        include: [{
          model: Producto,
          as: 'Producto',
          attributes: ['codigo', 'nombre', 'peso_pieza', 'peso_fraccion', 'peso_unidad', 'tipo_calculo_piezas', 'pesable', 'codigo_barra'],
          include: [{
            model: ProductoStock,
            as: 'Stocks',
            where: { id_ubicacion },
            required: false
          }]
        }]
      }]
    });

    const pedidoCompleto = pedidoCompletoRaw.toJSON();
    if (pedidoCompleto.items) {
      pedidoCompleto.items = pedidoCompleto.items.map(item => {
        if (item.Producto) {
          const stockObj = item.Producto.Stocks && item.Producto.Stocks[0] ? item.Producto.Stocks[0] : null;
          item.Producto.stock = stockObj ? parseFloat(stockObj.stock) : 0.0000;
        }
        return item;
      });
    }

    // Enviar correo de confirmación de manera asíncrona (segundo plano)
    if (sucursal) {
      Sucursal.findOne({ where: { sucursal: sucursal } })
        .then(async (dbSuc) => {
          if (dbSuc && dbSuc.email) {
            const itemsFormatted = pedidoCompleto.items.map(item => ({
              codigo_producto: item.codigo_producto,
              nombre_producto: item.Producto?.nombre || item.codigo_producto,
              pieza: item.pieza,
              fraccion: item.fraccion
            }));
            await enviarMailConfirmacion(dbSuc.email, pedidoCompleto, itemsFormatted);
          } else {
            console.log(`Sucursal "${sucursal}" no tiene un email registrado para recibir notificaciones.`);
          }
        })
        .catch(err => {
          console.error('Error al intentar enviar el email de confirmación de pedido:', err);
        });
    }

    res.status(201).json({
      mensaje: 'Pedido y productos registrados exitosamente',
      pedido: pedidoCompleto
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error al registrar el pedido' });
  }
};

// Actualizar los datos de un pedido
exports.actualizarPedido = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { codigo, sucursal, fecha, estado, items } = req.body;

    const pedido = await Pedido.findByPk(id, { transaction });
    if (!pedido) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Validar tipo de sucursal y compatibilidad de ítems
    const targetSucursalName = sucursal !== undefined ? sucursal : pedido.sucursal;
    let tipoSucursal = 'ambas';
    let sucursalUbicacionId = null;
    if (targetSucursalName) {
      const dbSuc = await Sucursal.findOne({ where: { sucursal: targetSucursalName }, transaction });
      if (dbSuc) {
        tipoSucursal = dbSuc.tipo || 'con_sector';
        sucursalUbicacionId = dbSuc.id_ubicacion;
      }
    }

    if (items !== undefined) {
      if (!Array.isArray(items)) {
        await transaction.rollback();
        return res.status(400).json({ error: 'El campo "items" debe ser un array.' });
      }
      for (const item of items) {
        const { pieza, fraccion } = item;
        if (tipoSucursal === 'con_sector' && fraccion && parseFloat(fraccion) > 0) {
          await transaction.rollback();
          return res.status(400).json({ error: `La sucursal "${targetSucursalName}" es de tipo "con_sector" y sólo puede pedir piezas (no fraccionados).` });
        }
        if (tipoSucursal === 'express' && pieza && parseInt(pieza, 10) > 0) {
          await transaction.rollback();
          return res.status(400).json({ error: `La sucursal "${targetSucursalName}" es de tipo "express" y sólo puede pedir productos fraccionados (no piezas).` });
        }
      }
    } else if (sucursal !== undefined) {
      // Se cambió la sucursal pero no los items, validar contra items existentes
      const itemsExistentes = await ProductoPedido.findAll({ where: { id_pedido: id }, transaction });
      for (const item of itemsExistentes) {
        if (tipoSucursal === 'con_sector' && item.fraccion && parseFloat(item.fraccion) > 0) {
          await transaction.rollback();
          return res.status(400).json({ error: `La sucursal "${targetSucursalName}" es de tipo "con_sector" y no es compatible con el pedido existente que contiene productos fraccionados.` });
        }
        if (tipoSucursal === 'express' && item.pieza && parseInt(item.pieza, 10) > 0) {
          await transaction.rollback();
          return res.status(400).json({ error: `La sucursal "${targetSucursalName}" es de tipo "express" y no es compatible con el pedido existente que contiene piezas.` });
        }
      }
    }

    const prevEstado = pedido.estado;
    const nextEstado = estado !== undefined ? estado : pedido.estado;

    // 1. Actualizar los datos básicos del pedido
    await pedido.update({
      codigo: codigo !== undefined ? codigo : pedido.codigo,
      sucursal: sucursal !== undefined ? sucursal : pedido.sucursal,
      fecha: fecha !== undefined ? fecha : pedido.fecha,
      estado: nextEstado,
      id_ubicacion: sucursalUbicacionId || pedido.id_ubicacion
    }, { transaction });

    // 2. Si el pedido pasa a "Enviado", ejecutar deducción real de stock y lotes
    if (nextEstado === 'Enviado' && prevEstado !== 'Enviado') {
      await procesarDescuentoStockEnviado(pedido, transaction, sucursalUbicacionId || pedido.id_ubicacion, req.body.usuario || 'Sistema');
    }

    // 3. Si se suministra la lista de items, la actualizamos
    if (items !== undefined) {

      // Validar e insertar ítems
      for (const item of items) {
        const { codigo_producto, pieza, fraccion } = item;
        if (!codigo_producto) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Cada item del pedido debe tener un "codigo_producto" válido.' });
        }

        // Si el producto no existe en stock, lo creamos dinámicamente como en la carga masiva
        const productoExiste = await Producto.findByPk(codigo_producto, { transaction });
        if (!productoExiste) {
          await Producto.create({
            codigo: codigo_producto,
            nombre: `PRODUCTO AUTOCREADO (${codigo_producto})`,
            peso_pieza: 0,
            cantidad_piezas: 0,
            vencimientos: null,
            peso_fraccion: 0
          }, { transaction });
        }
      }

      // Eliminar ítems existentes
      await ProductoPedido.destroy({
        where: { id_pedido: id },
        transaction
      });

      // Crear nuevos ítems
      for (const item of items) {
        const { codigo_producto, pieza, fraccion, peso_enviado, cantidad_enviada, fraccion_enviada } = item;
        await ProductoPedido.create({
          id_pedido: id,
          codigo_producto,
          pieza: pieza || 0,
          fraccion: fraccion || 0,
          peso_enviado: peso_enviado || 0,
          cantidad_enviada: cantidad_enviada || 0,
          fraccion_enviada: fraccion_enviada || 0
        }, { transaction });
      }
    }

    // Recalcular estado dinámico (Pendiente / Preparando / Listo) si el pedido no está Enviado o Completado
    if (pedido.estado !== 'Enviado' && pedido.estado !== 'Completado') {
      const itemsActuales = await ProductoPedido.findAll({ where: { id_pedido: id }, transaction });
      const estadoCalculado = determinarEstadoPedido(itemsActuales);
      if (pedido.estado !== estadoCalculado) {
        await pedido.update({ estado: estadoCalculado }, { transaction });
      }
    }

    await transaction.commit();

    // Devolver el pedido actualizado con todas sus relaciones cargadas
    const id_ubicacion = req.ubicacionId || 1;
    const pedidoCompletoRaw = await Pedido.findByPk(id, {
      include: [{
        model: ProductoPedido,
        as: 'items',
        include: [{
          model: Producto,
          as: 'Producto',
          attributes: ['codigo', 'nombre', 'peso_pieza', 'peso_fraccion', 'peso_unidad', 'tipo_calculo_piezas', 'pesable', 'codigo_barra'],
          include: [{
            model: ProductoStock,
            as: 'Stocks',
            where: { id_ubicacion },
            required: false
          }]
        }]
      }]
    });

    const pedidoCompleto = pedidoCompletoRaw.toJSON();
    if (pedidoCompleto.items) {
      pedidoCompleto.items = pedidoCompleto.items.map(item => {
        if (item.Producto) {
          const stockObj = item.Producto.Stocks && item.Producto.Stocks[0] ? item.Producto.Stocks[0] : null;
          item.Producto.stock = stockObj ? parseFloat(stockObj.stock) : 0.0000;
        }
        return item;
      });
    }

    res.json({
      mensaje: 'Pedido actualizado exitosamente',
      pedido: pedidoCompleto
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al actualizar pedido:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar el pedido' });
  }
};

// Eliminar un pedido (debido a ON DELETE CASCADE, también borra de forma automática sus producto_pedidos)
exports.eliminarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findByPk(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    await pedido.destroy();
    res.json({ mensaje: 'Pedido y sus productos asociados eliminados exitosamente' });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({ error: 'Error al eliminar el pedido' });
  }
};

// Carga masiva de pedidos desde Excel (.xlsx / .xls)
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo Excel.' });
    }

    const xlsx = require('xlsx');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parsear a JSON
    const data = xlsx.utils.sheet_to_json(sheet);
    if (data.length === 0) {
      return res.status(400).json({ error: 'El archivo Excel está vacío.' });
    }

    // Helper para parsear la fecha de forma robusta
    const parseExcelDate = (val) => {
      if (!val) return new Date();
      if (val instanceof Date) return val;

      if (typeof val === 'number') {
        const UTC_DAYS_DIFF = 25569;
        const MS_PER_DAY = 86400 * 1000;
        return new Date((val - UTC_DAYS_DIFF) * MS_PER_DAY);
      }

      const str = String(val).trim();
      const parts = str.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }

      const parsed = Date.parse(str);
      if (!isNaN(parsed)) {
        return new Date(parsed);
      }
      return new Date();
    };

    // Cargar todas las sucursales para mapear nombre/número de forma flexible
    const todasLasSucursales = await Sucursal.findAll();
    const findSucursal = (val) => {
      if (val === undefined || val === null) return null;
      const strVal = String(val).trim();
      
      // Intentar buscar por nombre (case-insensitive)
      let found = todasLasSucursales.find(s => s.sucursal.toLowerCase() === strVal.toLowerCase());
      if (found) return found;

      // Intentar buscar por número
      const numVal = parseInt(strVal, 10);
      if (!isNaN(numVal)) {
        found = todasLasSucursales.find(s => s.numero === numVal);
        if (found) return found;
      }
      return null;
    };

    // Agrupar y consolidar filas del Excel por Codigo_pedido y Producto
    const pedidosAgrupados = {};

    for (const row of data) {
      // Buscar las columnas por coincidencia flexible de mayúsculas/minúsculas o acentos
      const codigoPedido = row['Codigo_pedido'] || row['codigo_pedido'] || row['Codigo'] || row['codigo'] || row['CODIGO_PEDIDO'] || row['Codigo pedido'];
      if (!codigoPedido) continue;

      const codProducto = row['Cod'] || row['cod'] || row['codigo_producto'] || row['Cod.'] || row['COD'] || row['Código Producto'];
      if (!codProducto) continue;

      const fechaRaw = row['Fecha'] || row['fecha'] || row['FECHA'];
      const sucursalRaw = row['Suc.'] || row['suc.'] || row['Sucursal'] || row['sucursal'] || row['SUC'] || '';
      const dbSuc = findSucursal(sucursalRaw);
      const sucursalName = dbSuc ? dbSuc.sucursal : String(sucursalRaw).trim();
      
      const pieza = parseInt(row['Pieza'] || row['pieza'] || row['piezas'] || row['PIEZA'] || 0, 10);
      const fraccion = parseFloat(row['Fraccionado'] || row['fraccionado'] || row['fraccion'] || row['FRACCIONADO'] || 0);

      const codigoPedidoStr = String(codigoPedido).trim();
      const codProductoStr = String(codProducto).trim();

      if (!pedidosAgrupados[codigoPedidoStr]) {
        pedidosAgrupados[codigoPedidoStr] = {
          codigo: codigoPedidoStr,
          fecha: parseExcelDate(fechaRaw),
          sucursal: sucursalName,
          items: {} // Consolidar por código de producto en un objeto
        };
      }

      if (!pedidosAgrupados[codigoPedidoStr].items[codProductoStr]) {
        pedidosAgrupados[codigoPedidoStr].items[codProductoStr] = {
          codigo_producto: codProductoStr,
          pieza: 0,
          fraccion: 0
        };
      }

      // Sumar si el mismo producto viene repetido en el mismo pedido
      pedidosAgrupados[codigoPedidoStr].items[codProductoStr].pieza += pieza;
      pedidosAgrupados[codigoPedidoStr].items[codProductoStr].fraccion += fraccion;
    }

    const codigosNuevos = Object.keys(pedidosAgrupados);
    if (codigosNuevos.length === 0) {
      return res.status(400).json({ error: 'El archivo Excel no contenía columnas válidas de pedidos (ej: Codigo_pedido, Cod, Fecha).' });
    }

    // Buscar cuáles de estos códigos de pedido ya existen en la BBDD
    const pedidosExistentes = await Pedido.findAll({
      where: {
        codigo: codigosNuevos
      },
      attributes: ['codigo']
    });

    const codigosExistentesSet = new Set(pedidosExistentes.map(p => p.codigo));

    // Filtrar para quedarnos únicamente con los pedidos nuevos
    const pedidosAProcesar = codigosNuevos.filter(cod => !codigosExistentesSet.has(cod));

    if (pedidosAProcesar.length === 0) {
      return res.json({
        mensaje: 'Carga masiva finalizada. Todos los pedidos del archivo ya existían en la base de datos (se omitieron).',
        pedidosRegistrados: 0,
        pedidosOmitidos: codigosExistentesSet.size
      });
    }

    // Iniciar transacción de base de datos para guardar todo el lote
    const transaction = await sequelize.transaction();
    let creadosCount = 0;

    try {
      for (const codigo of pedidosAProcesar) {
        const pedData = pedidosAgrupados[codigo];

        // Determinar tipo de sucursal para limpiar cantidades incompatibles y heredar su ubicación
        let tipoSucursal = 'ambas';
        let sucursalUbicacionId = null;
        if (pedData.sucursal) {
          const dbSuc = await Sucursal.findOne({ where: { sucursal: pedData.sucursal }, transaction });
          if (dbSuc) {
            tipoSucursal = dbSuc.tipo || 'con_sector';
            sucursalUbicacionId = dbSuc.id_ubicacion;
          }
        }

        // 1. Crear pedido
        const nuevoPedido = await Pedido.create({
          codigo: pedData.codigo,
          fecha: pedData.fecha,
          sucursal: pedData.sucursal,
          estado: 'Pendiente',
          id_ubicacion: sucursalUbicacionId || req.ubicacionId || 1
        }, { transaction });

        // Convertir el objeto indexado de items a array
        const itemsArray = Object.values(pedData.items);

        // 2. Crear items del pedido
        for (const item of itemsArray) {
          let piezaFinal = item.pieza;
          let fraccionFinal = item.fraccion;
          if (tipoSucursal === 'con_sector') {
            fraccionFinal = 0;
          } else if (tipoSucursal === 'express') {
            piezaFinal = 0;
          }

          // Validar que el producto exista en la base de datos para cumplir FK
          const productoExiste = await Producto.findByPk(item.codigo_producto, { transaction });
          if (!productoExiste) {
            // Si el producto del pedido no existe en la tabla de productos, lo creamos
            // con un nombre de fantasía genérico para no arrojar error de llave foránea.
            await Producto.create({
              codigo: item.codigo_producto,
              nombre: `PRODUCTO AUTOCREADO (${item.codigo_producto})`,
              peso_pieza: 0,
              cantidad_piezas: 0,
              vencimientos: null,
              peso_fraccion: 0
            }, { transaction });
          }

          // Crear ProductoPedido
          await ProductoPedido.create({
            id_pedido: nuevoPedido.id,
            codigo_producto: item.codigo_producto,
            pieza: piezaFinal,
            fraccion: fraccionFinal
          }, { transaction });
        }
        creadosCount++;
      }

      await transaction.commit();

      res.status(201).json({
        mensaje: 'Carga masiva de pedidos procesada con éxito.',
        pedidosRegistrados: creadosCount,
        pedidosOmitidos: codigosExistentesSet.size
      });

    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }

  } catch (error) {
    console.error('Error al realizar carga masiva de pedidos:', error);
    res.status(500).json({ error: 'Error al procesar la carga masiva de pedidos.' });
  }
};

// Obtener stock actual de productos y la sumatoria de piezas y kilos solicitados en pedidos pendientes o en proceso
exports.obtenerPendientesStock = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const id_ubicacion = req.ubicacionId;
    const resultados = await Producto.findAll({
      attributes: [
        'codigo',
        'nombre',
        'peso_pieza',
        'peso_fraccion'
      ],
      include: [
        {
          model: ProductoStock,
          as: 'Stocks',
          where: { id_ubicacion },
          required: false
        },
        {
          model: ProductoVencimiento,
          as: 'vencimientosList',
          where: { id_ubicacion },
          required: false
        },
        {
          model: ProductoPedido,
          as: 'PedidosAsociados',
          required: false,
          attributes: ['pieza', 'fraccion'],
          include: [
            {
              model: Pedido,
              as: 'Pedido',
              required: false,
              where: {
                estado: {
                  [Op.in]: ['Pendiente', 'Procesando']
                }
              },
              attributes: ['id', 'estado']
            }
          ]
        }
      ]
    });

    const productosMap = resultados.map(p => {
      let piezasPendientes = 0;
      let fraccionesPendientes = 0;

      if (Array.isArray(p.PedidosAsociados)) {
        p.PedidosAsociados.forEach(item => {
          // Check if there is a valid pending or processing order associated
          if (item.Pedido) {
            piezasPendientes += parseInt(item.pieza || 0, 10);
            fraccionesPendientes += parseFloat(item.fraccion || 0);
          }
        });
      }

      const pesoXPieza = parseFloat(p.peso_pieza || 0);
      const kgXBolsita = parseFloat(p.peso_fraccion || 0);

      const piezasPendientesKg = piezasPendientes * pesoXPieza;
      const fraccionesPendientesKg = fraccionesPendientes * kgXBolsita;
      const kilosPendientes = piezasPendientesKg + fraccionesPendientesKg;

      const stockObj = p.Stocks && p.Stocks[0] ? p.Stocks[0] : null;
      const stockKilos = stockObj ? parseFloat(stockObj.stock) : 0;
      
      const vencimientos = p.vencimientosList || [];
      const stockPiezas = vencimientos.reduce((sum, v) => sum + (parseInt(v.piezas, 10) || 0), 0);
      
      const stockFrac = stockObj ? parseFloat(stockObj.kg_fraccionados) : 0;
      const stockRec = stockObj ? parseFloat(stockObj.recorte) : 0;

      return {
        codigo: p.codigo,
        nombre: p.nombre,
        stock_piezas: stockPiezas,
        stock_kilos: stockKilos,
        stock_kilos_calculado: stockKilos,
        stock_fraccionados: stockFrac,
        stock_recorte: stockRec,
        peso_pieza: pesoXPieza,
        peso_fraccion: kgXBolsita,
        piezas_pendientes: piezasPendientes,
        piezas_pendientes_kg: piezasPendientesKg,
        fracciones_pendientes: fraccionesPendientes,
        fracciones_pendientes_kg: fraccionesPendientesKg,
        kilos_pendientes: kilosPendientes
      };
    });

    // Omit items with absolutely zero stock and zero pending orders
    const filtrados = productosMap.filter(p => 
      p.stock_piezas > 0 || 
      p.stock_kilos > 0 || 
      p.stock_fraccionados > 0 || 
      p.stock_recorte > 0 || 
      p.piezas_pendientes > 0 || 
      p.fracciones_pendientes > 0
    );

    res.json(filtrados);
  } catch (error) {
    console.error('Error al obtener stock y pendientes:', error);
    res.status(500).json({ error: 'Error interno al obtener stock y pendientes.' });
  }
};

// Obtener promedio de fracciones (kilos) por sucursal y producto
exports.obtenerPromedioFraccionPorSucursal = async (req, res) => {
  try {
    const query = `
      SELECT 
          p.sucursal,
          pp.codigo_producto,
          pr.nombre as nombre_producto,
          SUM(pp.fraccion) AS total_fraccion,
          COUNT(pp.id_pedido) AS cantidad_pedidos,
          AVG(pp.fraccion) AS promedio_fraccion
      FROM pedidos p
      INNER JOIN producto_pedidos pp 
          ON p.id = pp.id_pedido
      LEFT JOIN productos pr 
          ON pp.codigo_producto = pr.codigo
      WHERE pp.fraccion > 0
      GROUP BY 
          p.sucursal,
          pp.codigo_producto,
          pr.nombre
      ORDER BY 
          p.sucursal,
          pp.codigo_producto;
    `;
    const [resultados] = await sequelize.query(query);

    // Agrupar por sucursal para unificar la vista en el frontend
    const sucursalesMap = {};
    resultados.forEach(row => {
      const sucursal = row.sucursal || 'Sin Sucursal';
      if (!sucursalesMap[sucursal]) {
        sucursalesMap[sucursal] = {
          sucursal: sucursal,
          productos: []
        };
      }
      sucursalesMap[sucursal].productos.push({
        codigo_producto: row.codigo_producto,
        nombre: row.nombre_producto || 'Desconocido',
        total_fraccion: parseFloat(parseFloat(row.total_fraccion || 0).toFixed(3)),
        cantidad_pedidos: parseInt(row.cantidad_pedidos || 0, 10),
        promedio_fraccion: parseFloat(parseFloat(row.promedio_fraccion || 0).toFixed(3))
      });
    });

    res.json(Object.values(sucursalesMap));
  } catch (error) {
    console.error('Error al obtener el promedio de fracciones por sucursal:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de sucursales' });
  }
};

// Confirmar pedido: descontar stock (peso y piezas) y cambiar estado a "Enviado"
// POST /api/pedidos/:id/confirmar
// Body: { items: [{ codigo, peso, piezas }, ...] }
// Función auxiliar interna para procesar la confirmación física y deducción de stock
// Función auxiliar para procesar la deducción real de stock cuando un pedido pasa a "Enviado"
const procesarDescuentoStockEnviado = async (pedido, transaction, id_ubicacion = 1, usuario = 'Sistema') => {
  const items = await ProductoPedido.findAll({
    where: { id_pedido: pedido.id, no_envia: false },
    include: [{ model: Producto, as: 'Producto' }],
    transaction
  });

  const operaciones = [];

  for (const item of items) {
    const valPeso = parseFloat(item.peso_enviado) || 0;
    let valPiezas = parseInt(item.cantidad_enviada, 10) || 0;
    const valFraccion = parseFloat(item.fraccion_enviada) || 0;
    const prod = item.Producto;
    const codigo = item.codigo_producto;

    if (valPeso === 0 && valPiezas === 0 && valFraccion === 0) continue;

    const fuePedidoPorPiezas = (parseInt(item.pieza, 10) || 0) > 0;

    // Si fue pedido por piezas, y piezas = 0 pero hay peso > 0, autocalcular piezas con peso_pieza
    if (fuePedidoPorPiezas && valPiezas === 0 && valPeso > 0 && prod) {
      const pUnit = parseFloat(prod.peso_pieza) || 0;
      valPiezas = (pUnit > 0 && valPeso >= pUnit) ? Math.round(valPeso / pUnit) : 0;
      item.cantidad_enviada = valPiezas;
      await item.save({ transaction });
    } else if (!fuePedidoPorPiezas) {
      // Si el producto fue pedido por fracción / kg (NO por piezas), se fuerza piezas a 0
      valPiezas = 0;
      if (item.cantidad_enviada !== 0) {
        item.cantidad_enviada = 0;
        await item.save({ transaction });
      }
    }

    operaciones.push({
      item,
      producto: prod,
      codigo,
      valPeso,
      valPiezas,
      valFraccion,
      fuePedidoPorPiezas
    });
  }

  // 2. Ejecutar deducción real de stock (kilos y piezas, permitiendo stock negativo si no hay suficiente)
  const descuentosRealizados = [];

  for (const op of operaciones) {
    const [pStockRecord] = await ProductoStock.findOrCreate({
      where: { codigo_producto: op.codigo, id_ubicacion },
      defaults: { stock: 0.0000, piezas: 0 },
      transaction
    });

    const stockKilosActual = parseFloat(pStockRecord.stock) || 0;
    const kilosEnviadosTotal = op.valPeso > 0 ? op.valPeso : op.valFraccion;
    pStockRecord.stock = stockKilosActual - kilosEnviadosTotal;

    await pStockRecord.save({
      transaction,
      tipo_movimiento: 'PEDIDO_ENVIADO',
      referencia_id: pedido.id,
      concepto: `Envío de pedido Nro ${pedido.codigo} a sucursal ${pedido.sucursal || 'Desconocida'} (${op.fuePedidoPorPiezas ? op.valPiezas + ' pz' : op.valFraccion + ' fracc'}, ${kilosEnviadosTotal.toFixed(3)} kg)`,
      cantidad_piezas: (op.fuePedidoPorPiezas && op.valPiezas > 0) ? -op.valPiezas : 0,
      usuario
    });

    if (op.fuePedidoPorPiezas && op.valPiezas > 0) {
      const vencimientos = await ProductoVencimiento.findAll({
        where: { codigo_producto: op.codigo, id_ubicacion },
        order: [['vencimiento', 'ASC']],
        transaction
      });

      let remainingToDeduct = op.valPiezas;
      for (const v of vencimientos) {
        if (remainingToDeduct <= 0) break;
        const currentPiezas = parseInt(v.piezas, 10) || 0;
        if (currentPiezas <= remainingToDeduct) {
          remainingToDeduct -= currentPiezas;
          await v.destroy({ transaction });
        } else {
          v.piezas = currentPiezas - remainingToDeduct;
          remainingToDeduct = 0;
          await v.save({ transaction });
        }
      }
    }

    if (kilosEnviadosTotal > 0) {
      await DescuentoStock.create({
        id_pedido: pedido.id,
        codigo_producto: op.codigo,
        peso_descontado: kilosEnviadosTotal,
        campo_descontado: op.valFraccion > 0 ? 'kg_fraccionados' : 'kilos_calculado',
        fecha: new Date()
      }, { transaction });
    }

    descuentosRealizados.push({
      codigo: op.codigo,
      nombre: op.producto ? op.producto.nombre : op.codigo,
      peso_descontado: kilosEnviadosTotal,
      piezas_descontadas: op.fuePedidoPorPiezas ? op.valPiezas : 0,
      stock_kilos_restante: parseFloat(pStockRecord.stock) || 0
    });
  }

  return descuentosRealizados;
};

// Función auxiliar interna para procesar la preparación del pedido y pasar a "Listo" (NO descuenta stock)
const confirmarPedidoCore = async (pedido, items, usuario, transaction, omitirValidacionStock = false, id_ubicacion = 1) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Debe enviar un array "items" con al menos un elemento.');
  }

  for (const item of items) {
    const { codigo, peso, piezas, fraccion, sinStock, noEnvia, no_envia } = item;

    if (!codigo) {
      throw new Error('Cada item debe tener un "codigo" de producto válido.');
    }

    const isNoEnvia = !!(noEnvia || no_envia);
    const isSinStock = !!sinStock;
    const isSpecial = isSinStock || isNoEnvia;

    const valorPeso = isSpecial ? 0 : (parseFloat(peso) || 0);
    let valorPiezas = isSpecial ? 0 : (parseInt(piezas, 10) || 0);
    const valorFraccion = isSpecial ? 0 : (parseFloat(fraccion) || 0);

    if (!isSpecial) {
      // REGLA: La cantidad de kilos a enviar es obligatoria (aplica a valorPeso o valorFraccion)
      const totalKgEnviar = valorPeso + valorFraccion;
      if (totalKgEnviar <= 0) {
        const prodObj = await Producto.findByPk(codigo, { transaction });
        throw new Error(`La cantidad de kilos a enviar para el producto ${codigo} (${prodObj ? prodObj.nombre : ''}) es obligatoria y debe ser mayor a 0.`);
      }

      // REGLA: Si piezas = 0 y valorPeso > 0, autocalcular con peso_pieza
      if (valorPiezas === 0 && valorPeso > 0) {
        const prodObj = await Producto.findByPk(codigo, { transaction });
        const pUnit = parseFloat(prodObj?.peso_pieza) || 0;
        if (pUnit > 0) {
          valorPiezas = valorPeso < pUnit ? 0 : Math.round(valorPeso / pUnit);
        }
      }
    }

    const productoPedido = await ProductoPedido.findOne({
      where: { id_pedido: pedido.id, codigo_producto: codigo },
      transaction
    });

    if (productoPedido) {
      const totalPesoCalculado = isSpecial ? 0 : (valorPeso + valorFraccion);
      productoPedido.peso_enviado = totalPesoCalculado;
      productoPedido.cantidad_enviada = valorPiezas;
      productoPedido.fraccion_enviada = valorFraccion;
      productoPedido.confirmado = true;
      productoPedido.sin_stock = isSinStock;
      productoPedido.no_envia = isNoEnvia || (!isSinStock && totalPesoCalculado === 0 && valorPiezas === 0);
      await productoPedido.save({ transaction });
    }

    if (isSinStock) {
      await PedidoSinStock.findOrCreate({
        where: { id_pedido: pedido.id, codigo_producto: codigo },
        defaults: { fecha: new Date() },
        transaction
      });
    }
  }

  // REGLA CLAVE: Cambiar estado a "Listo" (Listo NO descuenta stock)
  pedido.estado = 'Listo';
  await pedido.save({ transaction });

  return [];
};

// Confirmar preparación del pedido por el preparador: pasa el pedido a estado "Listo" (NO a "Enviado")
exports.confirmarPedido = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { items, usuario } = req.body;

    const pedido = await Pedido.findByPk(id, { transaction });
    if (!pedido) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    if (pedido.estado === 'Completado' || pedido.estado === 'Enviado') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Este pedido ya fue completado o enviado.' });
    }

    const descuentos = await confirmarPedidoCore(pedido, items, usuario || 'Sistema', transaction, false, req.ubicacionId);

    // El pedido pasa a estado "Listo" al finalizar la preparación
    pedido.estado = 'Listo';
    await pedido.save({ transaction });

    await transaction.commit();

    res.json({
      mensaje: 'Pedido preparado exitosamente y marcado como "Listo".',
      pedido: {
        id: pedido.id,
        codigo: pedido.codigo,
        estado: pedido.estado
      },
      descuentos
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al confirmar preparación de pedido:', error);
    const status = error.message && error.message.includes('insuficiente') ? 400 : 500;
    res.status(status).json({ error: error.message || 'Error interno al preparar el pedido.' });
  }
};

// Confirmar pedidos de forma masiva desde una planilla de Excel de envíos
exports.confirmarPedidosDesdeExcel = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    if (!req.file) {
      await transaction.rollback();
      return res.status(400).json({ error: 'No se envió ningún archivo Excel.' });
    }

    const xlsx = require('xlsx');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El archivo Excel está vacío.' });
    }

    // Cargar todas las sucursales para mapear nombre/número de forma flexible en transacción
    const todasLasSucursales = await Sucursal.findAll({ transaction });
    const findSucursal = (val) => {
      if (val === undefined || val === null) return null;
      const strVal = String(val).trim();
      
      // Intentar buscar por número
      const numVal = parseInt(strVal, 10);
      if (!isNaN(numVal)) {
        const found = todasLasSucursales.find(s => s.numero === numVal);
        if (found) return found;
      }
      
      // Intentar buscar por nombre (case-insensitive)
      const foundByName = todasLasSucursales.find(s => s.sucursal.toLowerCase() === strVal.toLowerCase());
      if (foundByName) return foundByName;
      
      return null;
    };

    // 1. Agrupar filas por número de sucursal
    const rowsBySucursalNum = {};
    for (const row of data) {
      const sucNumRaw = row['codigo_entidades'] || row['Codigo_entidades'] || row['codigo_entidad'] || row['Codigo_entidad'] || row['sucursal_numero'] || row['numero_sucursal'];
      const prodCodeRaw = row['codigo_productos'] || row['Codigo_productos'] || row['codigo_producto'] || row['Codigo_producto'] || row['cod_prod'];
      const qtyRaw = row['cantidad_original'] || row['Cantidad_original'] || row['cantidad'] || row['Cantidad'] || row['peso'] || row['Peso'];

      if (sucNumRaw === undefined || prodCodeRaw === undefined || qtyRaw === undefined) {
        continue;
      }

      const dbSuc = findSucursal(sucNumRaw);
      if (!dbSuc) {
        await transaction.rollback();
        return res.status(400).json({ error: `La sucursal con identificador "${sucNumRaw}" no está registrada en el sistema.` });
      }

      const sucNum = dbSuc.numero;
      const prodCode = String(prodCodeRaw).trim();
      const qty = parseFloat(qtyRaw) || 0;

      if (!rowsBySucursalNum[sucNum]) {
        rowsBySucursalNum[sucNum] = [];
      }
      rowsBySucursalNum[sucNum].push({ prodCode, qty });
    }

    const sucursalNums = Object.keys(rowsBySucursalNum);
    if (sucursalNums.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El archivo Excel no contiene columnas válidas (se requiere: codigo_entidades, codigo_productos, cantidad_original).' });
    }

    // 2. Buscar todas las sucursales involucradas
    const sucursalesFound = await Sucursal.findAll({
      where: { numero: sucursalNums },
      transaction
    });

    const sucursalByNum = {};
    sucursalesFound.forEach(s => {
      sucursalByNum[s.numero] = s;
    });

    const confirmaciones = [];

    // 3. Procesar los pedidos de cada sucursal
    for (const sucNum of sucursalNums) {
      const sucursal = sucursalByNum[sucNum];
      if (!sucursal) {
        await transaction.rollback();
        return res.status(400).json({ error: `La sucursal con número "${sucNum}" no está registrada en el sistema.` });
      }

      // Buscar si tiene un pedido abierto (Pendiente, Preparando, Armando o Procesando)
      let pedido = await Pedido.findOne({
        where: {
          sucursal: sucursal.sucursal,
          estado: ['Pendiente', 'Preparando', 'Armando', 'Procesando']
        },
        transaction
      });

      // Si no tiene pedido abierto, lo autocreamos
      if (!pedido) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `PED-${dateStr}-${randomStr}`;
        pedido = await Pedido.create({
          codigo: code,
          fecha: new Date(),
          sucursal: sucursal.sucursal,
          estado: 'Pendiente'
        }, { transaction });
      }

      // Obtener los productos ya cargados en ese pedido
      const existingItems = await ProductoPedido.findAll({
        where: { id_pedido: pedido.id },
        transaction
      });

      const existingItemsMap = {};
      existingItems.forEach(item => {
        existingItemsMap[item.codigo_producto] = item;
      });

      const excelRows = rowsBySucursalNum[sucNum];
      const excelProdCodes = new Set();

      for (const row of excelRows) {
        const { prodCode, qty } = row;
        excelProdCodes.add(prodCode);

        // Buscar el producto en el catálogo; si no existe, autocrearlo
        let prod = await Producto.findByPk(prodCode, { transaction });
        if (!prod) {
          prod = await Producto.create({
            codigo: prodCode,
            nombre: `PRODUCTO AUTOCREADO (${prodCode})`,
            peso_pieza: 0,
            cantidad_piezas: 0,
            vencimientos: null,
            peso_fraccion: 0,
            pesable: true
          }, { transaction });
        }

        // Buscar o crear la relación en el pedido
        let prodPed = existingItemsMap[prodCode];
        if (!prodPed) {
          prodPed = await ProductoPedido.create({
            id_pedido: pedido.id,
            codigo_producto: prodCode,
            pieza: 0,
            fraccion: 0,
            peso_enviado: 0,
            cantidad_enviada: 0,
            fraccion_enviada: 0,
            confirmado: false,
            no_envia: false
          }, { transaction });
          existingItemsMap[prodCode] = prodPed;
        }

        // Determinar las cantidades reales enviadas a registrar
        if (prod.pesable === false) {
          // No pesable -> Se envían unidades físicas
          prodPed.cantidad_enviada = Math.round(qty);
          prodPed.peso_enviado = 0;
          prodPed.fraccion_enviada = 0;
        } else {
          // Pesable -> Se envía peso en kilos siempre en peso_enviado
          prodPed.peso_enviado = qty;
          prodPed.fraccion_enviada = prodPed.fraccion > 0 ? qty : 0;
          if (prodPed.pieza > 0) {
            prodPed.cantidad_enviada = prodPed.pieza; // por defecto, asume que envió las piezas pedidas
          } else {
            prodPed.cantidad_enviada = 0;
          }
        }

        prodPed.confirmado = true;
        prodPed.no_envia = false;
        await prodPed.save({ transaction });
      }

      // Marcar los productos del pedido original que NO vinieron en el Excel como "no enviado" (stock = 0)
      for (const pCode of Object.keys(existingItemsMap)) {
        if (!excelProdCodes.has(pCode)) {
          const prodPed = existingItemsMap[pCode];
          prodPed.peso_enviado = 0;
          prodPed.cantidad_enviada = 0;
          prodPed.fraccion_enviada = 0;
          prodPed.confirmado = true;
          prodPed.no_envia = true;
          await prodPed.save({ transaction });
        }
      }

      // Volver a leer la lista de ítems final para invocar confirmarPedidoCore
      const updatedItems = await ProductoPedido.findAll({
        where: { id_pedido: pedido.id },
        transaction
      });

      const itemsForCore = updatedItems.map(item => ({
        codigo: item.codigo_producto,
        peso: item.peso_enviado || 0,
        piezas: item.cantidad_enviada || 0,
        fraccion: item.fraccion_enviada || 0,
        sinStock: item.no_envia
      }));

      // Confirmar el pedido y descontar el stock correspondiente
      const usuario = req.body.usuario || 'Importación Planilla Excel';
      const descuentos = await confirmarPedidoCore(pedido, itemsForCore, usuario, transaction, true, req.ubicacionId);

      confirmaciones.push({
        pedido_id: pedido.id,
        codigo_pedido: pedido.codigo,
        sucursal: pedido.sucursal,
        descuentos
      });
    }

    await transaction.commit();

    res.json({
      mensaje: 'Planilla de carga procesada y pedidos confirmados exitosamente.',
      confirmaciones
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al procesar planilla Excel de envíos:', error);
    res.status(500).json({ error: error.message || 'Error interno al procesar la planilla de envíos.' });
  }
};

// Obtener la demanda consolidada de todos los pedidos pendientes (Suma de todos los pedidos pendientes)
exports.obtenerDemandaUltimoPedido = async (req, res) => {
  try {
    const id_ubicacion = req.ubicacionId || 1;
    const query = `
      SELECT 
          pp.codigo_producto,
          prod.nombre AS producto_nombre,
          COALESCE(prod.peso_pieza, 0) AS peso_pieza,
          COALESCE(prod.peso_fraccion, 0) AS peso_fraccion,
          SUM(COALESCE(pp.pieza, 0)) AS total_piezas_pedidas,
          SUM(COALESCE(pp.fraccion, 0)) AS total_fracciones_pedidas,
          COALESCE(MAX(ps.stock), 0) AS stock
      FROM producto_pedidos pp
      INNER JOIN pedidos ped ON pp.id_pedido = ped.id
      LEFT JOIN productos prod ON pp.codigo_producto = prod.codigo
      LEFT JOIN productos_stock ps ON pp.codigo_producto = ps.codigo_producto AND ps.id_ubicacion = :id_ubicacion
      WHERE ped.estado = 'Pendiente'
      GROUP BY pp.codigo_producto, prod.nombre, prod.peso_pieza, prod.peso_fraccion
      HAVING total_piezas_pedidas > 0 OR total_fracciones_pedidas > 0
      ORDER BY pp.codigo_producto;
    `;
    const [resultados] = await sequelize.query(query, {
      replacements: { id_ubicacion }
    });
    res.json(resultados);
  } catch (error) {
    console.error('Error al obtener demanda de pedidos pendientes:', error);
    res.status(500).json({ error: 'Error interno al obtener demanda de pedidos pendientes.' });
  }
};

// Obtener promedio histórico de peso enviado, piezas pedidas y fracciones pedidas de pedidos enviados/completados
exports.obtenerPromedioHistorico = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateCondition = "";
    const replacements = {};

    if (startDate && endDate) {
      dateCondition = "AND p.fecha BETWEEN :startDate AND :endDate";
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    } else if (startDate) {
      dateCondition = "AND p.fecha >= :startDate";
      replacements.startDate = startDate;
    } else if (endDate) {
      dateCondition = "AND p.fecha <= :endDate";
      replacements.endDate = endDate;
    }

    const query = `
      SELECT 
          p.sucursal,
          pp.codigo_producto,
          pr.nombre as nombre_producto,
          AVG(COALESCE(pp.peso_enviado, 0)) AS avg_peso_enviado,
          AVG(COALESCE(pp.pieza, 0)) AS avg_pieza_pedida,
          AVG(COALESCE(pp.fraccion, 0)) AS avg_fraccion_pedida
      FROM pedidos p
      INNER JOIN producto_pedidos pp 
          ON p.id = pp.id_pedido
      LEFT JOIN productos pr 
          ON pp.codigo_producto = pr.codigo
      WHERE p.estado IN ('Enviado', 'Completado') ${dateCondition}
      GROUP BY 
          p.sucursal,
          pp.codigo_producto,
          pr.nombre
      ORDER BY 
          p.sucursal,
          pp.codigo_producto;
    `;
    const resultados = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Agrupar por sucursal para unificar la vista en el frontend
    const sucursalesMap = {};
    resultados.forEach(row => {
      const sucursal = row.sucursal || 'Sin Sucursal';
      if (!sucursalesMap[sucursal]) {
        sucursalesMap[sucursal] = {
          sucursal: sucursal,
          productos: []
        };
      }
      sucursalesMap[sucursal].productos.push({
        codigo_producto: row.codigo_producto,
        nombre: row.nombre_producto || 'Desconocido',
        avg_peso_enviado: parseFloat(parseFloat(row.avg_peso_enviado || 0).toFixed(3)),
        avg_pieza_pedida: parseFloat(parseFloat(row.avg_pieza_pedida || 0).toFixed(3)),
        avg_fraccion_pedida: parseFloat(parseFloat(row.avg_fraccion_pedida || 0).toFixed(3))
      });
    });

    res.json(Object.values(sucursalesMap));
  } catch (error) {
    console.error('Error al obtener el promedio histórico de pedidos:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del historial de pedidos.' });
  }
};

// Actualizar cantidad y peso enviado de un item individual en un pedido (para el wizard móvil)
// PUT /api/pedidos/:id/items/:codigo_producto
// Body: { cantidad_enviada, peso_enviado, fraccion_enviada, sinStock, no_envia }
exports.actualizarItemPedido = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, codigo_producto } = req.params;
    const { cantidad_enviada, peso_enviado, fraccion_enviada, sinStock, no_envia } = req.body;

    // 1. Buscar la relación en producto_pedidos
    const item = await ProductoPedido.findOne({
      where: {
        id_pedido: parseInt(id, 10),
        codigo_producto: codigo_producto
      },
      transaction
    });

    if (!item) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Item de pedido no encontrado.' });
    }

    // 2. Actualizar valores en ProductoPedido
    item.cantidad_enviada = cantidad_enviada !== undefined ? parseInt(cantidad_enviada, 10) || 0 : item.cantidad_enviada;
    item.peso_enviado = peso_enviado !== undefined ? parseFloat(peso_enviado) || 0 : item.peso_enviado;
    item.fraccion_enviada = fraccion_enviada !== undefined ? parseFloat(fraccion_enviada) || 0 : item.fraccion_enviada;
    item.confirmado = true;
    item.no_envia = no_envia !== undefined ? !!no_envia : (item.cantidad_enviada === 0 && item.peso_enviado === 0 && item.fraccion_enviada === 0 && !sinStock);
    await item.save({ transaction });

    // 3. Gestionar PedidoSinStock
    if (sinStock) {
      // Buscar o crear entrada en PedidoSinStock
      await PedidoSinStock.findOrCreate({
        where: {
          id_pedido: parseInt(id, 10),
          codigo_producto: codigo_producto
        },
        transaction
      });
    } else {
      // Eliminar de PedidoSinStock si existía
      await PedidoSinStock.destroy({
        where: {
          id_pedido: parseInt(id, 10),
          codigo_producto: codigo_producto
        },
        transaction
      });
    }

    // 4. Recalcular estado automático del pedido (Pendiente / Preparando / Listo)
    const pedidoObj = await Pedido.findByPk(parseInt(id, 10), { transaction });
    if (pedidoObj && pedidoObj.estado !== 'Enviado' && pedidoObj.estado !== 'Completado') {
      const itemsActuales = await ProductoPedido.findAll({ where: { id_pedido: parseInt(id, 10) }, transaction });
      const estadoCalculado = determinarEstadoPedido(itemsActuales);
      if (pedidoObj.estado !== estadoCalculado) {
        await pedidoObj.update({ estado: estadoCalculado }, { transaction });
      }
    }

    await transaction.commit();
    res.json({ mensaje: 'Item del pedido actualizado exitosamente.', item });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al actualizar item del pedido:', error);
    res.status(500).json({ error: 'Error interno al actualizar item del pedido.' });
  }
};

// ============================================================
// ENDPOINTS DE ARMADO EN TIEMPO REAL
// ============================================================

// GET /api/pedidos/:id/armado
// Devuelve todos los ítems confirmados por el armador para este pedido
exports.obtenerArmadoItems = async (req, res) => {
  try {
    const { id } = req.params;
    const id_ubicacion = req.ubicacionId;
    const items = await PedidoArmadoItem.findAll({
      where: { id_pedido: parseInt(id, 10) },
      include: [{
        model: Producto,
        as: 'Producto',
        attributes: ['codigo', 'nombre', 'peso_pieza', 'peso_fraccion', 'peso_unidad', 'tipo_calculo_piezas', 'pesable'],
        include: [{
          model: ProductoStock,
          as: 'Stocks',
          where: { id_ubicacion },
          required: false
        }]
      }],
      order: [['fecha', 'ASC']]
    });

    const mapped = items.map(item => {
      const json = item.toJSON();
      if (json.Producto) {
        const stockObj = json.Producto.Stocks && json.Producto.Stocks[0] ? json.Producto.Stocks[0] : null;
        json.Producto.stock = stockObj ? parseFloat(stockObj.stock) : 0.0000;
      }
      return json;
    });

    res.json(mapped);
  } catch (error) {
    console.error('Error al obtener items de armado:', error);
    res.status(500).json({ error: 'Error al obtener items de armado.' });
  }
};

// POST /api/pedidos/:id/armado
// Crea o actualiza (upsert) un ítem en la tabla de armado
// Body: { codigo_producto, piezas, peso, fraccion, no_envia, sin_stock }
exports.upsertArmadoItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo_producto, piezas, peso, fraccion, no_envia, sin_stock } = req.body;

    if (!codigo_producto) {
      return res.status(400).json({ error: 'codigo_producto es requerido.' });
    }

    const id_pedido = parseInt(id, 10);

    // Verificar que el pedido exista
    const pedido = await Pedido.findByPk(id_pedido);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    const isNoEnvia = !!no_envia;
    const isSinStock = !!sin_stock;
    const isSpecial = isNoEnvia || isSinStock;

    const valPiezas = isSpecial ? 0 : (parseInt(piezas, 10) || 0);
    const valPeso = isSpecial ? 0 : (parseFloat(peso) || 0);
    const valFraccion = isSpecial ? 0 : (parseFloat(fraccion) || 0);

    // Si todo es 0 y no hay estados especiales, eliminamos el item del armado (liberado)
    if (valPiezas === 0 && valPeso === 0 && valFraccion === 0 && !isNoEnvia && !isSinStock) {
      await PedidoArmadoItem.destroy({
        where: { id_pedido, codigo_producto }
      });
      return res.json({ mensaje: 'Item liberado del armado exitosamente.', item: null });
    }

    // Upsert: buscar o crear, luego actualizar
    const [item, created] = await PedidoArmadoItem.findOrCreate({
      where: { id_pedido, codigo_producto },
      defaults: {
        piezas: valPiezas,
        peso: valPeso,
        fraccion: valFraccion,
        no_envia: isNoEnvia,
        sin_stock: isSinStock,
        fecha: new Date()
      }
    });

    if (!created) {
      // Actualizar registro existente
      item.piezas = valPiezas;
      item.peso = valPeso;
      item.fraccion = valFraccion;
      item.no_envia = isNoEnvia;
      item.sin_stock = isSinStock;
      item.fecha = new Date();
      await item.save();
    }

    // Sincronizar también en ProductoPedido para estandarización
    const totalPesoCalculado = isSpecial ? 0 : (valPeso + valFraccion);
    const prodPedido = await ProductoPedido.findOne({ where: { id_pedido, codigo_producto } });
    if (prodPedido) {
      prodPedido.peso_enviado = totalPesoCalculado;
      prodPedido.cantidad_enviada = valPiezas;
      prodPedido.fraccion_enviada = valFraccion;
      prodPedido.sin_stock = isSinStock;
      prodPedido.no_envia = isNoEnvia;
      prodPedido.confirmado = true;
      await prodPedido.save();
    }

    res.json({ mensaje: created ? 'Item de armado creado.' : 'Item de armado actualizado.', item });
  } catch (error) {
    console.error('Error al guardar item de armado:', error);
    res.status(500).json({ error: 'Error al guardar item de armado.' });
  }
};

// DELETE /api/pedidos/:id/armado
// Elimina todos los items de armado de un pedido (al confirmar despacho final)
exports.limpiarArmadoItems = async (req, res) => {
  try {
    const { id } = req.params;
    await PedidoArmadoItem.destroy({ where: { id_pedido: parseInt(id, 10) } });
    res.json({ mensaje: 'Items de armado eliminados.' });
  } catch (error) {
    console.error('Error al limpiar armado:', error);
    res.status(500).json({ error: 'Error al limpiar items de armado.' });
  }
};
