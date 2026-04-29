const { PreparacionPedido } = require('../models');

// Obtener todos los registros de preparación de pedidos
exports.obtenerTodos = async (req, res) => {
  try {
    const registros = await PreparacionPedido.findAll({
      order: [['timestamp', 'DESC']]
    });
    res.json(registros);
  } catch (error) {
    console.error('Error al obtener registros de preparación:', error);
    res.status(500).json({ error: 'Error al obtener los registros' });
  }
};

// Obtener un registro por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const registro = await PreparacionPedido.findByPk(id);
    if (!registro) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    res.json(registro);
  } catch (error) {
    console.error('Error al obtener el registro:', error);
    res.status(500).json({ error: 'Error al obtener el registro' });
  }
};

// Obtener registros por código de pedido
exports.obtenerPorPedido = async (req, res) => {
  try {
    const { codigo_de_pedido } = req.params;
    const registros = await PreparacionPedido.findAll({
      where: { codigo_de_pedido },
      order: [['timestamp', 'DESC']]
    });
    
    // Devolvemos array vacío si no hay en lugar de 404, suele ser más práctico en el front
    res.json(registros);
  } catch (error) {
    console.error('Error al obtener los registros por pedido:', error);
    res.status(500).json({ error: 'Error al obtener los registros por pedido' });
  }
};

// Crear un nuevo registro
exports.crear = async (req, res) => {
  try {
    const { 
      codigo_de_pedido, 
      codigo_producto, 
      cantidad_piezas_pedida, 
      cantidad_fracciones_pedidas, 
      peso_piezas_preparadas, 
      peso_fracciones_preparadas, 
      cantidad_bolsitas_preparadas 
    } = req.body;

    if (!codigo_de_pedido || !codigo_producto) {
      return res.status(400).json({ error: 'El código de pedido y código de producto son obligatorios' });
    }

    const nuevoRegistro = await PreparacionPedido.create({
      codigo_de_pedido,
      codigo_producto,
      cantidad_piezas_pedida: cantidad_piezas_pedida || 0,
      cantidad_fracciones_pedidas: cantidad_fracciones_pedidas || 0,
      peso_piezas_preparadas: peso_piezas_preparadas || 0,
      peso_fracciones_preparadas: peso_fracciones_preparadas || 0,
      cantidad_bolsitas_preparadas: cantidad_bolsitas_preparadas || 0
    });

    res.status(201).json({
      mensaje: 'Registro creado correctamente',
      registro: nuevoRegistro
    });
  } catch (error) {
    console.error('Error al crear registro de preparación:', error);
    res.status(500).json({ error: 'Error al crear el registro' });
  }
};

// Actualizar un registro existente
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const registro = await PreparacionPedido.findByPk(id);

    if (!registro) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    // Actualiza los campos que se envíen en el body
    await registro.update({
      ...req.body,
      timestamp: new Date() // Actualizar el timestamp
    });

    res.json({
      mensaje: 'Registro actualizado correctamente',
      registro
    });
  } catch (error) {
    console.error('Error al actualizar registro de preparación:', error);
    res.status(500).json({ error: 'Error al actualizar el registro' });
  }
};

// Eliminar un registro
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await PreparacionPedido.destroy({ where: { id } });

    if (!eliminado) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ mensaje: 'Registro eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar registro de preparación:', error);
    res.status(500).json({ error: 'Error al eliminar el registro' });
  }
};
