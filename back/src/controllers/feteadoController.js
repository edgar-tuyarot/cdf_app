const { DetalleFeteado, ProduccionFeteado, StockAFetear, StockAPicada, StockADecomiso, Producto } = require('../models');
const { sumarAPicadas } = require('../utils/picadas');

// --- DETALLES HISTÓRICOS ---
exports.obtenerDetalles = async (req, res) => {
  try {
    const detalles = await DetalleFeteado.findAll({ order: [['fecha', 'DESC']] });
    res.json(detalles);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los detalles' });
  }
};

exports.crearDetalle = async (req, res) => {
  try {
    const { codigo_producto, peso_bruto, cantidad_fraccionada, decomiso, recorte, total_feteado, nombre_usuario } = req.body;
    if (!codigo_producto) return res.status(400).json({ error: 'El código de producto es obligatorio' });
    const nuevoDetalle = await DetalleFeteado.create({ codigo_producto, peso_bruto, cantidad_fraccionada, decomiso, recorte, total_feteado, nombre_usuario });
    res.status(201).json({ mensaje: 'Detalle registrado', detalle: nuevoDetalle });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el detalle' });
  }
};

exports.actualizarDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const detalle = await DetalleFeteado.findByPk(id);
    if (!detalle) return res.status(404).json({ error: 'Registro no encontrado' });
    await detalle.update(req.body);
    res.json({ mensaje: 'Registro actualizado', detalle });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

exports.eliminarDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    await DetalleFeteado.destroy({ where: { id_detalle: id } });
    res.json({ mensaje: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

// --- PRODUCCIÓN FETEADOS ---
exports.obtenerProduccionFeteados = async (req, res) => {
  try {
    const registros = await ProduccionFeteado.findAll({ order: [['fecha', 'DESC']] });
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los registros' });
  }
};

exports.crearProduccionFeteado = async (req, res) => {
  try {
    const { codigo_producto, peso_bruto, peso_decomiso, peso_recorte, peso_feteado, cantidad_bolsitas, feteador } = req.body;
    if (!codigo_producto) return res.status(400).json({ error: 'El código de producto es obligatorio' });
    const nuevoRegistro = await ProduccionFeteado.create({ codigo_producto, peso_bruto, peso_decomiso, peso_recorte, peso_feteado, cantidad_bolsitas, feteador });
    res.status(201).json({ mensaje: 'Producción registrada', registro: nuevoRegistro });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar la producción' });
  }
};

exports.eliminarProduccionFeteado = async (req, res) => {
  try {
    const { id } = req.params;
    await ProduccionFeteado.destroy({ where: { id_feteado: id } });
    res.json({ mensaje: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

// --- STOCK A FETEAR (ADITIVO) ---
exports.obtenerStockAFetear = async (req, res) => {
  try {
    const stock = await StockAFetear.findAll({
      include: [{
        model: Producto,
        attributes: ['descripcion']
      }]
    });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el stock' });
  }
};

exports.sumarStockAFetear = async (req, res) => {
  try {
    const { codigo, peso, cantidad } = req.body;
    if (!codigo) return res.status(400).json({ error: 'El código es obligatorio' });

    const [item, created] = await StockAFetear.findOrCreate({
      where: { codigo },
      defaults: { peso: peso || 0, cantidad: cantidad || 0 }
    });

    if (!created) {
      item.peso = parseFloat(item.peso) + parseFloat(peso || 0);
      item.cantidad = parseInt(item.cantidad) + parseInt(cantidad || 0);
      await item.save();
    }
    res.json({ mensaje: 'Stock sumado/creado correctamente', item });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar el stock' });
  }
};

// Restar stock a fetear
exports.restarStockAFetear = async (req, res) => {
  try {
    const { codigo, peso, cantidad } = req.body;
    if (!codigo) return res.status(400).json({ error: 'El código es obligatorio' });

    const item = await StockAFetear.findOne({ where: { codigo } });

    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado para restar' });
    }

    // Restamos y aseguramos que no baje de 0 (opcional, pero seguro)
    item.peso = Math.max(0, parseFloat(item.peso) - parseFloat(peso || 0));
    item.cantidad = Math.max(0, parseInt(item.cantidad) - parseInt(cantidad || 0));
    
    await item.save();

    res.json({ mensaje: 'Stock restado correctamente', item });
  } catch (error) {
    console.error('Error al restar stock:', error);
    res.status(500).json({ error: 'Error al restar el stock' });
  }
};

// Obtener stock a fetear por código específico
exports.obtenerStockAFetearPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const item = await StockAFetear.findOne({ where: { codigo } });
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el stock' });
  }
};

exports.eliminarStockAFetear = async (req, res) => {
  try {
    const { id } = req.params;
    await StockAFetear.destroy({ where: { id: id } });
    res.json({ mensaje: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

// --- STOCK A PICADA (ADITIVO) ---
exports.obtenerStockAPicada = async (req, res) => {
  try {
    const [stock, productos] = await Promise.all([
      StockAPicada.findAll(),
      Producto.findAll({ attributes: ['codigo_interno', 'descripcion'] })
    ]);

    const productoMap = {};
    productos.forEach(p => { productoMap[p.codigo_interno] = p.descripcion; });

    const resultado = stock.map(item => ({
      ...item.toJSON(),
      nombre: productoMap[item.codigo] || 'Sin descripción'
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener stock' });
  }
};

exports.sumarStockAPicada = async (req, res) => {
  try {
    const { codigo, peso } = req.body;
    if (!codigo) return res.status(400).json({ error: 'El código es obligatorio' });

    const [item, created] = await StockAPicada.findOrCreate({
      where: { codigo },
      defaults: { peso: peso || 0 }
    });

    if (!created) {
      item.peso = parseFloat(item.peso) + parseFloat(peso || 0);
      await item.save();
    }
    res.json({ mensaje: 'Stock picada sumado/creado', item });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar stock' });
  }
};

exports.actualizarStockAPicada = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, peso } = req.body;
    const item = await StockAPicada.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Registro no encontrado' });
    
    await item.update({ codigo, peso });
    res.json({ mensaje: 'Registro actualizado', item });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar registro' });
  }
};

exports.eliminarStockAPicada = async (req, res) => {
  try {
    const { id } = req.params;
    await StockAPicada.destroy({ where: { id } });
    res.json({ mensaje: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

// Resetear todo stock picada a 0
exports.resetearStockAPicada = async (req, res) => {
  try {
    await StockAPicada.update({ peso: 0 }, { where: {} });
    res.json({ mensaje: 'Todo el stock de picada fue reseteado a 0' });
  } catch (error) {
    res.status(500).json({ error: 'Error al resetear stock de picada' });
  }
};

// --- STOCK A DECOMISO (CRUD) ---
exports.obtenerStockADecomiso = async (req, res) => {
  try {
    const [stock, productos] = await Promise.all([
      StockADecomiso.findAll({ order: [['id', 'DESC']] }),
      Producto.findAll({ attributes: ['codigo_interno', 'descripcion'] })
    ]);

    const productoMap = {};
    productos.forEach(p => { productoMap[p.codigo_interno] = p.descripcion; });

    const resultado = stock.map(item => ({
      ...item.toJSON(),
      nombre: productoMap[item.codigo] || 'Sin descripción'
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener decomisos' });
  }
};

exports.crearStockADecomiso = async (req, res) => {
  try {
    const { codigo, peso, motivo } = req.body;
    const nuevo = await StockADecomiso.create({ codigo, peso, motivo });
    res.status(201).json({ mensaje: 'Decomiso registrado', nuevo });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar decomiso' });
  }
};

exports.actualizarStockADecomiso = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, peso, motivo } = req.body;
    const item = await StockADecomiso.findByPk(id);
    if (!item) return res.status(404).json({ error: 'Registro no encontrado' });
    
    await item.update({ codigo, peso, motivo });
    res.json({ mensaje: 'Registro actualizado', item });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar registro' });
  }
};

exports.eliminarStockADecomiso = async (req, res) => {
  try {
    const { id } = req.params;
    await StockADecomiso.destroy({ where: { id } });
    res.json({ mensaje: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

// Resetear todo stock decomiso a 0
exports.resetearStockADecomiso = async (req, res) => {
  try {
    await StockADecomiso.update({ peso: 0 }, { where: {} });
    res.json({ mensaje: 'Todo el stock de decomiso fue reseteado a 0' });
  } catch (error) {
    res.status(500).json({ error: 'Error al resetear stock de decomiso' });
  }
};
