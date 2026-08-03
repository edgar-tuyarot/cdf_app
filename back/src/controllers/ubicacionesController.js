const { Ubicacion } = require('../models');

exports.obtenerUbicaciones = async (req, res) => {
  try {
    const ubicaciones = await Ubicacion.findAll({
      order: [['numero', 'ASC']]
    });
    res.json(ubicaciones);
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    res.status(500).json({ error: 'Error al obtener ubicaciones' });
  }
};

exports.obtenerUbicacionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const ubicacion = await Ubicacion.findByPk(id);
    if (!ubicacion) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }
    res.json(ubicacion);
  } catch (error) {
    console.error('Error al obtener ubicación:', error);
    res.status(500).json({ error: 'Error al obtener ubicación' });
  }
};

exports.crearUbicacion = async (req, res) => {
  try {
    const { numero, nombre } = req.body;
    if (numero === undefined || !nombre) {
      return res.status(400).json({ error: 'El número y nombre de ubicación son requeridos' });
    }
    const nuevaUbicacion = await Ubicacion.create({ numero, nombre });
    res.status(201).json(nuevaUbicacion);
  } catch (error) {
    console.error('Error al crear ubicación:', error);
    res.status(500).json({ error: 'Error al crear ubicación' });
  }
};

exports.actualizarUbicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, nombre } = req.body;
    
    const ubicacion = await Ubicacion.findByPk(id);
    if (!ubicacion) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }
    
    ubicacion.numero = numero !== undefined ? numero : ubicacion.numero;
    ubicacion.nombre = nombre !== undefined ? nombre : ubicacion.nombre;
    await ubicacion.save();
    
    res.json(ubicacion);
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
};

exports.eliminarUbicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const ubicacion = await Ubicacion.findByPk(id);
    
    if (!ubicacion) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }
    
    await ubicacion.destroy();
    res.json({ mensaje: 'Ubicación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar ubicación:', error);
    res.status(500).json({ error: 'Error al eliminar ubicación' });
  }
};
