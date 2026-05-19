const { Sucursal } = require('../models');

exports.obtenerSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursal.findAll();
    res.json(sucursales);
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
};

exports.obtenerSucursalPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const sucursal = await Sucursal.findByPk(id);
    if (!sucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }
    res.json(sucursal);
  } catch (error) {
    console.error('Error al obtener sucursal:', error);
    res.status(500).json({ error: 'Error al obtener sucursal' });
  }
};

exports.crearSucursal = async (req, res) => {
  try {
    const { sucursal, numero, direccion } = req.body;
    if (!sucursal) {
      return res.status(400).json({ error: 'El nombre de la sucursal es requerido' });
    }
    const nuevaSucursal = await Sucursal.create({ 
      sucursal, 
      numero: numero ? parseInt(numero, 10) : null, 
      direccion 
    });
    res.status(201).json(nuevaSucursal);
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    res.status(500).json({ error: 'Error al crear sucursal' });
  }
};

exports.actualizarSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const { sucursal, numero, direccion } = req.body;
    
    const entSucursal = await Sucursal.findByPk(id);
    if (!entSucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }
    
    entSucursal.sucursal = sucursal !== undefined ? sucursal : entSucursal.sucursal;
    entSucursal.numero = numero !== undefined ? (numero ? parseInt(numero, 10) : null) : entSucursal.numero;
    entSucursal.direccion = direccion !== undefined ? direccion : entSucursal.direccion;
    
    await entSucursal.save();
    res.json(entSucursal);
  } catch (error) {
    console.error('Error al actualizar sucursal:', error);
    res.status(500).json({ error: 'Error al actualizar sucursal' });
  }
};

exports.eliminarSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const entSucursal = await Sucursal.findByPk(id);
    if (!entSucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }
    await entSucursal.destroy();
    res.json({ mensaje: 'Sucursal eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar sucursal:', error);
    res.status(500).json({ error: 'Error al eliminar sucursal' });
  }
};
