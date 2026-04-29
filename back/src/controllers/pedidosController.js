const { PedidoSucursal, ItemPedido, Producto, Sucursal, StockEnvasado, StockKilos, PreparacionPedido } = require('../models');

// Obtener todos los pedidos con sus detalles
exports.obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await PedidoSucursal.findAll({
      include: [
        { model: Sucursal, attributes: ['nombre', 'ubicacion'] },
        { 
          model: ItemPedido, 
          include: [{ model: Producto, attributes: ['descripcion', 'codigo_interno', 'categoria'] }] 
        }
      ],
      order: [['fecha_pedido', 'DESC'], ['id_pedido', 'DESC']]
    });
    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error al obtener el listado de pedidos' });
  }
};

// Obtener un solo pedido por su ID (Código PED-...)
exports.obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await PedidoSucursal.findOne({
      where: { id_pedido: id },
      include: [
        { model: Sucursal, attributes: ['nombre', 'ubicacion'] },
        { 
          model: ItemPedido, 
          include: [{ model: Producto, attributes: ['descripcion', 'codigo_interno', 'categoria'] }] 
        }
      ]
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(pedido);
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({ error: 'Error al obtener el detalle del pedido' });
  }
};

// Confirmar un pedido (Cambiar estado a 'Confirmado')
exports.confirmarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await PedidoSucursal.findByPk(id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    pedido.estado = 'Confirmado';
    await pedido.save();

    res.json({
      mensaje: 'Pedido confirmado exitosamente',
      pedido
    });
  } catch (error) {
    console.error('Error al confirmar pedido:', error);
    res.status(500).json({ error: 'Error al confirmar el pedido' });
  }
};

// PATCH /api/pedidos/:id/estado
// Body: { estado: "Preparado" } (o cualquier estado válido)
exports.cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ error: 'El campo "estado" es obligatorio' });
    }

    const pedido = await PedidoSucursal.findByPk(id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    pedido.estado = estado;
    await pedido.save();

    res.json({
      mensaje: `Estado del pedido actualizado a "${estado}"`,
      pedido
    });
  } catch (error) {
    console.error('Error al cambiar estado del pedido:', error);
    res.status(500).json({ error: 'Error al cambiar el estado del pedido' });
  }
};

// GET /api/pedidos/calculo-stock
// Calcula la diferencia entre lo pedido (estado Pendiente) y el stock de envasados.
exports.calcularStockVsPedidos = async (req, res) => {
  try {
    // 1. Obtener pedidos pendientes con sus items y productos
    const pedidosPendientes = await PedidoSucursal.findAll({
      where: { estado: 'Pendiente' },
      include: [
        { 
          model: ItemPedido, 
          include: [{ model: Producto, attributes: ['codigo_interno', 'descripcion'] }] 
        }
      ]
    });

    // 2. Obtener todo el stock de envasados
    const stockEnvasados = await StockEnvasado.findAll();
    const stockMap = {};
    stockEnvasados.forEach(s => { stockMap[s.codigo] = s.cantidad; });

    // 3. Estructuras para los resultados
    const totalesAgrupados = {}; // { "codigo": { nombre, pedido_total } }
    const porPedido = [];

    // 4. Procesar la información
    for (const pedido of pedidosPendientes) {
      const pedidoInfo = {
        id_pedido: pedido.id_pedido,
        sucursal: pedido.id_sucursal, // Podría hacer join con Sucursal para el nombre si se necesita
        fecha: pedido.fecha_pedido,
        items: []
      };

      for (const item of pedido.ItemPedidos) {
        if (!item.Producto) continue;

        const codigo = item.Producto.codigo_interno;
        const nombre = item.Producto.descripcion;
        const cantidadPedida = parseFloat(item.cantidad_fraccionado) || 0;

        // Sumar al total agrupado
        if (!totalesAgrupados[codigo]) {
          totalesAgrupados[codigo] = {
            codigo,
            nombre,
            pedido_total: 0
          };
        }
        totalesAgrupados[codigo].pedido_total += cantidadPedida;

        // Añadir al desglose del pedido (solo si se pidió cantidad)
        if (cantidadPedida > 0) {
          pedidoInfo.items.push({
            codigo,
            nombre,
            cantidad_pedida: cantidadPedida
          });
        }
      }

      porPedido.push(pedidoInfo);
    }

    // 5. Calcular la diferencia final para los totales
    const totalesArray = Object.values(totalesAgrupados).map(item => {
      const stockActual = parseFloat(stockMap[item.codigo]) || 0;
      const diferencia = stockActual - item.pedido_total;
      
      return {
        codigo: item.codigo,
        nombre: item.nombre,
        pedido_total: item.pedido_total,
        stock_actual: stockActual,
        diferencia: diferencia // Puede ser negativo
      };
    });

    // Ordenar los totales por código
    totalesArray.sort((a, b) => a.codigo.localeCompare(b.codigo));

    // 6. Enviar la respuesta unificada
    res.json({
      total: totalesArray,
      por_pedido: porPedido
    });

  } catch (error) {
    console.error('Error al calcular el stock vs pedidos:', error);
    res.status(500).json({ error: 'Error al realizar el cálculo de stock' });
  }
};

// POST /api/pedidos/:id/despachar
// Lee los items preparados en preparacion_pedidos para ese pedido,
// descuenta de stock_envasados (cantidad_bolsitas) y de stock_kilos (peso preparado).
// Permite stock negativo.
exports.despacharPedido = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Verificar que el pedido existe
    const pedido = await PedidoSucursal.findByPk(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // 2. Buscar todos los registros de preparación para este pedido
    const preparaciones = await PreparacionPedido.findAll({
      where: { codigo_de_pedido: id }
    });

    if (preparaciones.length === 0) {
      return res.status(400).json({ error: 'No hay preparaciones registradas para este pedido' });
    }

    const resumen = [];

    for (const prep of preparaciones) {
      const codigo = prep.codigo_producto;
      const bolsitas = parseInt(prep.cantidad_bolsitas_preparadas) || 0;
      const pesoPreparado = (parseFloat(prep.peso_piezas_preparadas) || 0) + 
                            (parseFloat(prep.peso_fracciones_preparadas) || 0);

      // 3. Descontar de stock_envasados (permite negativo)
      const envasado = await StockEnvasado.findOne({ where: { codigo } });
      let nuevoStockEnvasado = null;
      if (envasado) {
        envasado.cantidad = parseInt(envasado.cantidad) - bolsitas;
        await envasado.save();
        nuevoStockEnvasado = envasado.cantidad;
      }

      // 4. Descontar de stock_kilos (permite negativo)
      const stockKilo = await StockKilos.findOne({ where: { codigo_producto: codigo } });
      let nuevoStockKilos = null;
      if (stockKilo) {
        stockKilo.cantidad_kilos = parseFloat(stockKilo.cantidad_kilos) - pesoPreparado;
        await stockKilo.save();
        nuevoStockKilos = parseFloat(stockKilo.cantidad_kilos);
      }

      resumen.push({
        codigo,
        bolsitas_descontadas: bolsitas,
        peso_descontado: pesoPreparado,
        nuevo_stock_envasado: nuevoStockEnvasado,
        nuevo_stock_kilos: nuevoStockKilos
      });
    }

    // 5. Marcar el pedido como Despachado
    pedido.estado = 'Despachado';
    await pedido.save();

    res.json({
      mensaje: `Pedido ${id} despachado correctamente. Stocks descontados.`,
      resumen
    });

  } catch (error) {
    console.error('Error al despachar pedido:', error);
    res.status(500).json({ error: 'Error al procesar el despacho del pedido' });
  }
};
