const { StockPiezas, Producto } = require('../models');

// GET /api/piezas
// Sincroniza con la tabla productos y devuelve todos con descripcion
exports.obtenerTodos = async (req, res) => {
  try {
    const productos = await Producto.findAll({ attributes: ['codigo_interno', 'descripcion'] });

    await Promise.all(
      productos.map((p) =>
        StockPiezas.findOrCreate({
          where: { codigo: p.codigo_interno },
          defaults: { cantidad: 0, vencimiento: null, fecha_ultimo_registro: new Date() }
        })
      )
    );

    const stock = await StockPiezas.findAll({ order: [['codigo', 'ASC']] });

    const productoMap = {};
    productos.forEach((p) => { productoMap[p.codigo_interno] = p.descripcion; });

    const stockConNombre = stock.map((item) => ({
      ...item.toJSON(),
      descripcion: productoMap[item.codigo] || 'Sin descripción'
    }));

    res.json(stockConNombre);
  } catch (error) {
    console.error('Error al obtener stock de piezas:', error);
    res.status(500).json({ error: 'Error al obtener stock de piezas' });
  }
};

// GET /api/piezas/:codigo
exports.obtenerPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const item = await StockPiezas.findOne({ where: { codigo } });
    if (!item) return res.status(404).json({ error: 'Código no encontrado' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el código' });
  }
};

// POST /api/piezas/sumar
// Body: { codigo, cantidad, vencimiento }
// vencimiento: string "dd-mm-aa"
exports.sumar = async (req, res) => {
  try {
    const { codigo, cantidad, vencimiento } = req.body;
    if (!codigo) return res.status(400).json({ error: 'El código es obligatorio' });

    const [item, created] = await StockPiezas.findOrCreate({
      where: { codigo },
      defaults: {
        cantidad: cantidad || 0,
        vencimiento: vencimiento || null,
        fecha_ultimo_registro: new Date()
      }
    });

    if (!created) {
      item.cantidad = parseInt(item.cantidad) + parseInt(cantidad || 0);
      if (vencimiento) item.vencimiento = vencimiento;
      item.fecha_ultimo_registro = new Date();
      await item.save();
    }

    res.json({ mensaje: 'Stock sumado/creado correctamente', item });
  } catch (error) {
    console.error('Error al sumar piezas:', error);
    res.status(500).json({ error: 'Error al procesar el stock' });
  }
};

// POST /api/piezas/restar
// Body: { codigo, cantidad, vencimiento }
// vencimiento: string "dd-mm-aa"
exports.restar = async (req, res) => {
  try {
    const { codigo, cantidad, vencimiento } = req.body;
    if (!codigo) return res.status(400).json({ error: 'El código es obligatorio' });

    const item = await StockPiezas.findOne({ where: { codigo } });
    if (!item) return res.status(404).json({ error: 'Código no encontrado para restar' });

    item.cantidad = Math.max(0, parseInt(item.cantidad) - parseInt(cantidad || 0));
    if (vencimiento) item.vencimiento = vencimiento;
    item.fecha_ultimo_registro = new Date();
    await item.save();

    res.json({ mensaje: 'Stock restado correctamente', item });
  } catch (error) {
    res.status(500).json({ error: 'Error al restar el stock' });
  }
};

// DELETE /api/piezas/:id
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    await StockPiezas.destroy({ where: { id } });
    res.json({ mensaje: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};
