const { StockEnvasado, ProduccionEnvasado } = require('../models');

// Obtener todo el stock envasado
exports.obtenerStockEnvasado = async (req, res) => {
  try {
    const stock = await StockEnvasado.findAll({
      order: [['fecha_ultimo_registro', 'DESC']]
    });
    res.json(stock);
  } catch (error) {
    console.error('Error al obtener stock envasado:', error);
    res.status(500).json({ error: 'Error al obtener el stock' });
  }
};

// Obtener por código
exports.obtenerPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const item = await StockEnvasado.findOne({ where: { codigo } });
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar' });
  }
};

// Sumar/Actualizar stock (Aditivo)
exports.sumarStock = async (req, res) => {
  try {
    const { codigo, cantidad, peso, envasador } = req.body;
    if (!codigo) return res.status(400).json({ error: 'Código obligatorio' });

    // 1. Actualizar Stock Total
    const [item, created] = await StockEnvasado.findOrCreate({
      where: { codigo },
      defaults: { 
        cantidad: cantidad || 0, 
        peso: peso || 0,
        fecha_ultimo_registro: new Date()
      }
    });

    if (!created) {
      item.cantidad = parseInt(item.cantidad) + parseInt(cantidad || 0);
      item.peso = parseFloat(item.peso) + parseFloat(peso || 0);
      item.fecha_ultimo_registro = new Date();
      await item.save();
    }

    // 2. Crear Registro Histórico
    await ProduccionEnvasado.create({
      codigo_producto: codigo,
      cantidad: cantidad || 0,
      peso: peso || 0,
      envasador: envasador || 'Sistema',
      fecha: new Date()
    });

    res.json({ mensaje: 'Stock envasado actualizado e historial registrado', item });
  } catch (error) {
    console.error('Error al sumar stock envasado:', error);
    res.status(500).json({ error: 'Error al procesar' });
  }
};

// Restar stock
exports.restarStock = async (req, res) => {
  try {
    const { codigo, cantidad, peso } = req.body;
    const item = await StockEnvasado.findOne({ where: { codigo } });

    if (!item) return res.status(404).json({ error: 'No encontrado' });

    item.cantidad = Math.max(0, parseInt(item.cantidad) - parseInt(cantidad || 0));
    item.peso = Math.max(0, parseFloat(item.peso) - parseFloat(peso || 0));
    item.fecha_ultimo_registro = new Date();
    await item.save();

    res.json({ mensaje: 'Stock restado', item });
  } catch (error) {
    res.status(500).json({ error: 'Error al restar' });
  }
};

// Eliminar
exports.eliminarStock = async (req, res) => {
  try {
    const { id } = req.params;
    await StockEnvasado.destroy({ where: { id } });
    res.json({ mensaje: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};
