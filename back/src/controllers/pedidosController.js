const { Pedido, ProductoPedido, Producto, Fraccionado, DescuentoStock, sequelize } = require('../models');

// Obtener todos los pedidos con sus productos asociados
exports.obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      include: [{
        model: ProductoPedido,
        as: 'items',
        include: [{ model: Producto, as: 'Producto', attributes: ['nombre'] }]
      }]
    });
    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

// Obtener un pedido específico por ID
exports.obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findByPk(id, {
      include: [{
        model: ProductoPedido,
        as: 'items',
        include: [{ model: Producto, as: 'Producto', attributes: ['nombre'] }]
      }]
    });
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(pedido);
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

    // 1. Crear el pedido principal
    const nuevoPedido = await Pedido.create({
      codigo,
      fecha: fecha || new Date(),
      sucursal,
      estado: estado || 'Pendiente'
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
            kilos_block: 0,
            peso_x_pieza: 0,
            cantidad_piezas: 0,
            vencimientos: null,
            kg_x_bolsita: 0
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
    const pedidoCompleto = await Pedido.findByPk(nuevoPedido.id, {
      include: [{
        model: ProductoPedido,
        as: 'items',
        include: [{ model: Producto, as: 'Producto', attributes: ['nombre'] }]
      }]
    });

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

    // 1. Actualizar los datos básicos del pedido
    await pedido.update({
      codigo: codigo !== undefined ? codigo : pedido.codigo,
      sucursal: sucursal !== undefined ? sucursal : pedido.sucursal,
      fecha: fecha !== undefined ? fecha : pedido.fecha,
      estado: estado !== undefined ? estado : pedido.estado
    }, { transaction });

    // 2. Si se suministra la lista de items, la actualizamos
    if (items !== undefined) {
      if (!Array.isArray(items)) {
        await transaction.rollback();
        return res.status(400).json({ error: 'El campo "items" debe ser un array.' });
      }

      // Validar e insertar ítems
      for (const item of items) {
        const { codigo_producto } = item;
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
            kilos_block: 0,
            peso_x_pieza: 0,
            cantidad_piezas: 0,
            vencimientos: null,
            kg_x_bolsita: 0
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

    await transaction.commit();

    // Devolver el pedido actualizado con todas sus relaciones cargadas
    const pedidoCompleto = await Pedido.findByPk(id, {
      include: [{
        model: ProductoPedido,
        as: 'items',
        include: [{ model: Producto, as: 'Producto', attributes: ['nombre'] }]
      }]
    });

    res.json({
      mensaje: 'Pedido actualizado exitosamente',
      pedido: pedidoCompleto
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ error: 'Error al actualizar el pedido' });
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

    // Agrupar y consolidar filas del Excel por Codigo_pedido y Producto
    const pedidosAgrupados = {};

    for (const row of data) {
      // Buscar las columnas por coincidencia flexible de mayúsculas/minúsculas o acentos
      const codigoPedido = row['Codigo_pedido'] || row['codigo_pedido'] || row['Codigo'] || row['codigo'] || row['CODIGO_PEDIDO'] || row['Codigo pedido'];
      if (!codigoPedido) continue;

      const codProducto = row['Cod'] || row['cod'] || row['codigo_producto'] || row['Cod.'] || row['COD'] || row['Código Producto'];
      if (!codProducto) continue;

      const fechaRaw = row['Fecha'] || row['fecha'] || row['FECHA'];
      const sucursal = row['Suc.'] || row['suc.'] || row['Sucursal'] || row['sucursal'] || row['SUC'] || '';
      
      const pieza = parseInt(row['Pieza'] || row['pieza'] || row['piezas'] || row['PIEZA'] || 0, 10);
      const fraccion = parseFloat(row['Fraccionado'] || row['fraccionado'] || row['fraccion'] || row['FRACCIONADO'] || 0);

      const codigoPedidoStr = String(codigoPedido).trim();
      const codProductoStr = String(codProducto).trim();

      if (!pedidosAgrupados[codigoPedidoStr]) {
        pedidosAgrupados[codigoPedidoStr] = {
          codigo: codigoPedidoStr,
          fecha: parseExcelDate(fechaRaw),
          sucursal: String(sucursal).trim(),
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

        // 1. Crear pedido
        const nuevoPedido = await Pedido.create({
          codigo: pedData.codigo,
          fecha: pedData.fecha,
          sucursal: pedData.sucursal,
          estado: 'Pendiente'
        }, { transaction });

        // Convertir el objeto indexado de items a array
        const itemsArray = Object.values(pedData.items);

        // 2. Crear items del pedido
        for (const item of itemsArray) {
          // Validar que el producto exista en la base de datos para cumplir FK
          const productoExiste = await Producto.findByPk(item.codigo_producto, { transaction });
          if (!productoExiste) {
            // Si el producto del pedido no existe en la tabla de productos, lo creamos
            // con un nombre de fantasía genérico para no arrojar error de llave foránea.
            await Producto.create({
              codigo: item.codigo_producto,
              nombre: `PRODUCTO AUTOCREADO (${item.codigo_producto})`,
              kilos_block: 0,
              peso_x_pieza: 0,
              cantidad_piezas: 0,
              vencimientos: null,
              kg_x_bolsita: 0
            }, { transaction });
          }

          // Crear ProductoPedido
          await ProductoPedido.create({
            id_pedido: nuevoPedido.id,
            codigo_producto: item.codigo_producto,
            pieza: item.pieza,
            fraccion: item.fraccion
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

// Obtener promedio de fracciones (kilos) por sucursal y producto
exports.obtenerPromedioFraccionPorSucursal = async (req, res) => {
  try {
    const query = `
      SELECT 
          p.sucursal,
          pp.codigo_producto,
          pr.nombre as nombre_producto,
          CEILING(AVG(pp.fraccion)) AS mayor_fraccion_pedida
      FROM pedidos p
      INNER JOIN producto_pedidos pp 
          ON p.id = pp.id_pedido
      LEFT JOIN productos pr 
          ON pp.codigo_producto = pr.codigo
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
        mayor_fraccion_pedida: parseInt(row.mayor_fraccion_pedida || 0)
      });
    });

    res.json(Object.values(sucursalesMap));
  } catch (error) {
    console.error('Error al obtener el promedio de fracciones por sucursal:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de sucursales' });
  }
};

// Confirmar pedido: descontar stock y cambiar estado a "Enviado"
// POST /api/pedidos/:id/confirmar
// Body: { items: [{ codigo, peso }, ...] }
exports.confirmarPedido = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { items } = req.body;

    // 1. Validar que el pedido existe
    const pedido = await Pedido.findByPk(id, { transaction });
    if (!pedido) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    // 2. Validar que el pedido no fue ya enviado/confirmado
    if (pedido.estado === 'Enviado') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Este pedido ya fue enviado. No se puede volver a confirmar.' });
    }

    // 3. Validar items
    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Debe enviar un array "items" con al menos un elemento [{ codigo, peso }].' });
    }

    // 5. Primera pasada: validar stock suficiente para TODOS los items antes de descontar
    const productosSinStock = [];
    const operaciones = []; // Guardar las operaciones a realizar

    for (const item of items) {
      const { codigo, peso } = item;

      if (!codigo || peso === undefined || peso === null) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Cada item debe tener "codigo" y "peso".' });
      }

      const valorPeso = parseFloat(peso);
      if (isNaN(valorPeso) || valorPeso <= 0) {
        await transaction.rollback();
        return res.status(400).json({ error: `El peso del producto ${codigo} debe ser un número mayor a cero.` });
      }

      const producto = await Producto.findByPk(codigo, { transaction });
      if (!producto) {
        await transaction.rollback();
        return res.status(404).json({ error: `El producto con código ${codigo} no existe.` });
      }

      // Determinar de qué campo descontar: SIEMPRE de kilos_block según requerimiento
      const campo = 'kilos_block';
      const stockActual = parseFloat(producto[campo]) || 0;

      if (stockActual < valorPeso) {
        productosSinStock.push({
          codigo,
          nombre: producto.nombre,
          campo,
          stock_actual: stockActual,
          peso_solicitado: valorPeso
        });
      } else {
        operaciones.push({
          producto,
          campo,
          valorPeso,
          codigo
        });
      }
    }

    // Si hay productos sin stock, rechazar todo
    if (productosSinStock.length > 0) {
      await transaction.rollback();
      const detalle = productosSinStock.map(p => 
        `• ${p.codigo} (${p.nombre}): stock en ${p.campo} = ${p.stock_actual} kg, solicitado = ${p.peso_solicitado} kg`
      ).join('\n');
      return res.status(400).json({
        error: 'No hay stock suficiente para los siguientes productos:',
        productos_sin_stock: productosSinStock,
        detalle
      });
    }

    // 6. Segunda pasada: realizar los descuentos y crear registros de trazabilidad
    const descuentosRealizados = [];

    for (const op of operaciones) {
      const stockActual = parseFloat(op.producto[op.campo]) || 0;
      op.producto[op.campo] = stockActual - op.valorPeso;
      await op.producto.save({ transaction });

      // Crear registro de trazabilidad
      await DescuentoStock.create({
        id_pedido: parseInt(id),
        codigo_producto: op.codigo,
        peso_descontado: op.valorPeso,
        campo_descontado: op.campo,
        fecha: new Date()
      }, { transaction });

      descuentosRealizados.push({
        codigo: op.codigo,
        nombre: op.producto.nombre,
        campo: op.campo,
        peso_descontado: op.valorPeso,
        stock_restante: parseFloat(op.producto[op.campo]) || 0
      });
    }

    // 7. Cambiar estado del pedido a "Enviado"
    pedido.estado = 'Enviado';
    await pedido.save({ transaction });

    await transaction.commit();

    res.json({
      mensaje: 'Pedido confirmado y stock descontado exitosamente.',
      pedido: {
        id: pedido.id,
        codigo: pedido.codigo,
        estado: pedido.estado
      },
      descuentos: descuentosRealizados
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al confirmar pedido:', error);
    res.status(500).json({ error: 'Error interno al confirmar el pedido y descontar stock.' });
  }
};
