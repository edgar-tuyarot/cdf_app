const { Sucursal } = require('../models');

// Obtener todas las sucursales
exports.obtenerSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursal.findAll({
      order: [['nombre', 'ASC']]
    });
    res.json(sucursales);
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
};

// Crear una nueva sucursal
exports.crearSucursal = async (req, res) => {
  try {
    const { nombre, ubicacion } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la sucursal es obligatorio' });
    }

    const nuevaSucursal = await Sucursal.create({
      nombre,
      ubicacion
    });

    res.status(201).json({
      mensaje: 'Sucursal creada exitosamente',
      sucursal: nuevaSucursal
    });
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    res.status(500).json({ error: 'Error al crear la sucursal' });
  }
};

// Modificar una sucursal
exports.modificarSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, ubicacion } = req.body;

    const sucursal = await Sucursal.findByPk(id);
    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    sucursal.nombre = nombre || sucursal.nombre;
    sucursal.ubicacion = ubicacion || sucursal.ubicacion;

    await sucursal.save();

    res.json({
      mensaje: 'Sucursal actualizada exitosamente',
      sucursal
    });
  } catch (error) {
    console.error('Error al modificar sucursal:', error);
    res.status(500).json({ error: 'Error al actualizar la sucursal' });
  }
};

// Eliminar una sucursal
exports.eliminarSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const sucursal = await Sucursal.findByPk(id);

    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    await sucursal.destroy();

    res.json({ mensaje: 'Sucursal eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar sucursal:', error);
    res.status(500).json({ error: 'Error al eliminar la sucursal' });
  }
};
