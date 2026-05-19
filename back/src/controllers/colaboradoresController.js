const { Colaborador } = require('../models');

exports.obtenerColaboradores = async (req, res) => {
  try {
    const colaboradores = await Colaborador.findAll();
    res.json(colaboradores);
  } catch (error) {
    console.error('Error al obtener colaboradores:', error);
    res.status(500).json({ error: 'Error al obtener colaboradores' });
  }
};

exports.obtenerColaboradorPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const colaborador = await Colaborador.findByPk(id);
    if (!colaborador) {
      return res.status(404).json({ error: 'Colaborador no encontrado' });
    }
    res.json(colaborador);
  } catch (error) {
    console.error('Error al obtener colaborador:', error);
    res.status(500).json({ error: 'Error al obtener colaborador' });
  }
};

exports.crearColaborador = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const nuevoColaborador = await Colaborador.create({ nombre });
    res.status(201).json(nuevoColaborador);
  } catch (error) {
    console.error('Error al crear colaborador:', error);
    res.status(500).json({ error: 'Error al crear colaborador' });
  }
};

exports.actualizarColaborador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    
    const colaborador = await Colaborador.findByPk(id);
    if (!colaborador) {
      return res.status(404).json({ error: 'Colaborador no encontrado' });
    }
    
    colaborador.nombre = nombre !== undefined ? nombre : colaborador.nombre;
    await colaborador.save();
    
    res.json(colaborador);
  } catch (error) {
    console.error('Error al actualizar colaborador:', error);
    res.status(500).json({ error: 'Error al actualizar colaborador' });
  }
};

exports.eliminarColaborador = async (req, res) => {
  try {
    const { id } = req.params;
    const colaborador = await Colaborador.findByPk(id);
    
    if (!colaborador) {
      return res.status(404).json({ error: 'Colaborador no encontrado' });
    }
    
    await colaborador.destroy();
    res.json({ mensaje: 'Colaborador eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar colaborador:', error);
    res.status(500).json({ error: 'Error al eliminar colaborador' });
  }
};
