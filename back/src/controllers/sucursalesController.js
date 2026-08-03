const { Sucursal, SucursalProductoPermiso, Producto, Ubicacion } = require('../models');

exports.obtenerSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursal.findAll({
      include: [{ model: Ubicacion, as: 'Ubicacion', attributes: ['nombre'] }]
    });
    res.json(sucursales);
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
};

exports.obtenerSucursalPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const sucursal = await Sucursal.findByPk(id, {
      include: [{ model: Ubicacion, as: 'Ubicacion', attributes: ['nombre'] }]
    });
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
    const { sucursal, numero, direccion, email, id_ubicacion } = req.body;
    if (!sucursal) {
      return res.status(400).json({ error: 'El nombre de la sucursal es requerido' });
    }
    const nuevaSucursal = await Sucursal.create({ 
      sucursal, 
      numero: numero ? parseInt(numero, 10) : null, 
      direccion,
      email,
      id_ubicacion: id_ubicacion ? parseInt(id_ubicacion, 10) : null
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
    const { sucursal, numero, direccion, email, id_ubicacion } = req.body;
    
    const entSucursal = await Sucursal.findByPk(id);
    if (!entSucursal) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }
    
    entSucursal.sucursal = sucursal !== undefined ? sucursal : entSucursal.sucursal;
    entSucursal.numero = numero !== undefined ? (numero ? parseInt(numero, 10) : null) : entSucursal.numero;
    entSucursal.direccion = direccion !== undefined ? direccion : entSucursal.direccion;
    entSucursal.email = email !== undefined ? email : entSucursal.email;
    entSucursal.id_ubicacion = id_ubicacion !== undefined ? (id_ubicacion ? parseInt(id_ubicacion, 10) : null) : entSucursal.id_ubicacion;
    
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

exports.obtenerProductosHabilitados = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener todos los productos en el sistema
    const productos = await Producto.findAll({
      attributes: ['codigo', 'nombre']
    });

    // Obtener permisos habilitados para esta sucursal
    const permisos = await SucursalProductoPermiso.findAll({
      where: { id_sucursal: id }
    });

    const codigosHabilitados = permisos.map(p => p.codigo_producto);

    const resultado = productos.map(prod => ({
      codigo: prod.codigo,
      nombre: prod.nombre,
      habilitado: codigosHabilitados.includes(prod.codigo)
    }));

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener productos habilitados:', error);
    res.status(500).json({ error: 'Error al obtener productos habilitados' });
  }
};

exports.guardarProductosHabilitados = async (req, res) => {
  const { id } = req.params;
  const { codigos } = req.body; // Array de codigos de producto habilitados
  
  if (!Array.isArray(codigos)) {
    return res.status(400).json({ error: 'El campo "codigos" debe ser un array' });
  }

  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();

  try {
    // 1. Eliminar permisos anteriores
    await SucursalProductoPermiso.destroy({
      where: { id_sucursal: id },
      transaction
    });

    // 2. Insertar nuevos permisos
    for (const codigo of codigos) {
      await SucursalProductoPermiso.create({
        id_sucursal: id,
        codigo_producto: codigo
      }, { transaction });
    }

    await transaction.commit();
    res.json({ mensaje: 'Permisos de productos actualizados exitosamente' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al guardar productos habilitados:', error);
    res.status(500).json({ error: 'Error al guardar productos habilitados' });
  }
};
