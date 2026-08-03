const { Bulto, Producto, Proveedor } = require('../models');

exports.obtenerBultos = async (req, res) => {
  try {
    const bultos = await Bulto.findAll({
      where: { activo: true },
      include: [
        { model: Producto, as: 'Producto', attributes: ['codigo', 'nombre'] },
        { model: Proveedor, as: 'Proveedor', attributes: ['id', 'nombre'] }
      ],
      order: [['id', 'DESC']]
    });
    res.json(bultos);
  } catch (error) {
    console.error('Error al obtener bultos:', error);
    res.status(500).json({ error: 'Error al obtener bultos' });
  }
};

exports.crearBulto = async (req, res) => {
  try {
    const { nombre, codigo_producto, id_proveedor, peso_caja, peso_caja_vacia, cantidad_piezas } = req.body;
    if (!nombre || !codigo_producto || !id_proveedor) {
      return res.status(400).json({ error: 'El nombre, producto y proveedor son requeridos.' });
    }
    const nuevoBulto = await Bulto.create({
      nombre,
      codigo_producto,
      id_proveedor,
      peso_caja: parseFloat(peso_caja) || 0.000,
      peso_caja_vacia: parseFloat(peso_caja_vacia) || 0.000,
      cantidad_piezas: parseInt(cantidad_piezas, 10) || 0,
      activo: true
    });
    res.status(201).json(nuevoBulto);
  } catch (error) {
    console.error('Error al crear bulto:', error);
    res.status(500).json({ error: 'Error al crear bulto' });
  }
};

exports.actualizarBulto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo_producto, id_proveedor, peso_caja, peso_caja_vacia, cantidad_piezas } = req.body;
    
    const bulto = await Bulto.findByPk(id);
    if (!bulto) {
      return res.status(404).json({ error: 'Bulto no encontrado' });
    }

    bulto.nombre = nombre !== undefined ? nombre : bulto.nombre;
    bulto.codigo_producto = codigo_producto !== undefined ? codigo_producto : bulto.codigo_producto;
    bulto.id_proveedor = id_proveedor !== undefined ? id_proveedor : bulto.id_proveedor;
    bulto.peso_caja = peso_caja !== undefined ? parseFloat(peso_caja) || 0 : bulto.peso_caja;
    bulto.peso_caja_vacia = peso_caja_vacia !== undefined ? parseFloat(peso_caja_vacia) || 0 : bulto.peso_caja_vacia;
    bulto.cantidad_piezas = cantidad_piezas !== undefined ? parseInt(cantidad_piezas, 10) || 0 : bulto.cantidad_piezas;

    await bulto.save();
    res.json(bulto);
  } catch (error) {
    console.error('Error al actualizar bulto:', error);
    res.status(500).json({ error: 'Error al actualizar bulto' });
  }
};

exports.eliminarBulto = async (req, res) => {
  try {
    const { id } = req.params;
    const bulto = await Bulto.findByPk(id);
    if (!bulto) {
      return res.status(404).json({ error: 'Bulto no encontrado' });
    }
    bulto.activo = false; // Logical delete
    await bulto.save();
    res.json({ mensaje: 'Bulto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar bulto:', error);
    res.status(500).json({ error: 'Error al eliminar bulto' });
  }
};
