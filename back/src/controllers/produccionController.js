const { RegistroProduccion, Colaborador, Producto, StockProduccion } = require('../models');

// Obtener todos los registros de producción
exports.obtenerRegistros = async (req, res) => {
  try {
    const registros = await RegistroProduccion.findAll({
      include: [
        { model: Colaborador, attributes: ['nombre', 'rol'] },
        { model: Producto, attributes: ['descripcion', 'codigo_interno'] }
      ],
      order: [['fecha', 'DESC'], ['id_produccion', 'DESC']]
    });
    res.json(registros);
  } catch (error) {
    console.error('Error al obtener registros de producción:', error);
    res.status(500).json({ error: 'Error al obtener los registros de producción' });
  }
};

// Obtener el stock actual de envasados
exports.obtenerStockEnvasado = async (req, res) => {
  try {
    const stock = await StockProduccion.findAll({
      order: [['nombre', 'ASC']]
    });
    res.json(stock);
  } catch (error) {
    console.error('Error al obtener stock envasado:', error);
    res.status(500).json({ error: 'Error al obtener el stock' });
  }
};

// Obtener producción filtrada por nombre de usuario (colaborador)
exports.obtenerProduccionPorUsuario = async (req, res) => {
  try {
    const { nombre } = req.params;
    
    const registros = await RegistroProduccion.findAll({
      include: [
        { 
          model: Colaborador, 
          where: { nombre: nombre }, // Filtramos por el nombre que coincide con el usuario
          attributes: ['nombre', 'rol'] 
        },
        { model: Producto, attributes: ['descripcion', 'codigo_interno'] }
      ],
      order: [['fecha', 'DESC']]
    });

    res.json(registros);
  } catch (error) {
    console.error('Error al obtener producción del usuario:', error);
    res.status(500).json({ error: 'Error al obtener el historial de producción' });
  }
};

// Obtener producción de todos los que NO son Admin
exports.obtenerProduccionOperarios = async (req, res) => {
  try {
    const { Usuario } = require('../models');
    const { Op } = require('sequelize');

    const registros = await RegistroProduccion.findAll({
      include: [
        { 
          model: Colaborador, 
          attributes: ['nombre', 'rol'],
          required: true,
          include: [{
            model: Usuario,
            attributes: ['rol'],
            where: {
              rol: { [Op.ne]: 'Admin' } // Excluir Administradores
            }
          }]
        },
        { model: Producto, attributes: ['descripcion', 'codigo_interno'] }
      ],
      order: [['fecha', 'DESC']]
    });

    res.json(registros);
  } catch (error) {
    console.error('Error al obtener reporte de operarios:', error);
    res.status(500).json({ error: 'Error al obtener el reporte de operarios' });
  }
};

// Crear un nuevo registro de producción
exports.crearRegistro = async (req, res) => {
  try {
    const { fecha, id_colaborador, id_producto, cantidad_bolsitas, tipo_proceso } = req.body;

    if (!fecha || !id_colaborador || !id_producto || !cantidad_bolsitas || !tipo_proceso) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // 1. Buscamos el producto original para obtener el nombre y el código
    const productoOriginal = await Producto.findByPk(id_producto);
    if (!productoOriginal) {
      return res.status(404).json({ error: 'Producto original no encontrado' });
    }

    // 2. Creamos el registro de producción (histórico)
    const nuevoRegistro = await RegistroProduccion.create({
      fecha,
      id_colaborador,
      id_producto,
      cantidad_bolsitas,
      tipo_proceso
    });

    // 3. Actualizamos o creamos el stock en la tabla de envasados
    const [stockItem, created] = await StockProduccion.findOrCreate({
      where: { codigo: productoOriginal.codigo_interno },
      defaults: {
        nombre: productoOriginal.descripcion,
        cantidad_bolsitas: cantidad_bolsitas
      }
    });

    if (!created) {
      // Si ya existía, sumamos la nueva cantidad
      stockItem.cantidad_bolsitas += parseInt(cantidad_bolsitas);
      await stockItem.save();
    }

    res.status(201).json({
      mensaje: 'Registro creado y stock actualizado',
      registro: nuevoRegistro,
      stockActualizado: stockItem
    });
  } catch (error) {
    console.error('Error al crear registro de producción:', error);
    res.status(500).json({ error: 'Error al guardar el registro de producción' });
  }
};
