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

    const pCajaBruto = parseFloat(peso_caja) || 0.000;
    const pCajaVacia = parseFloat(peso_caja_vacia) || 0.000;
    const pNeto = Math.max(0, pCajaBruto - pCajaVacia);

    let piezEst = parseInt(cantidad_piezas, 10);
    if (!piezEst || isNaN(piezEst) || piezEst <= 0) {
      const prod = await Producto.findByPk(codigo_producto);
      if (prod && prod.peso_x_pieza && parseFloat(prod.peso_x_pieza) > 0) {
        piezEst = Math.round(pNeto / parseFloat(prod.peso_x_pieza));
      } else {
        piezEst = 0;
      }
    }

    const nuevoBulto = await Bulto.create({
      nombre,
      codigo_producto,
      id_proveedor,
      peso_caja: pCajaBruto,
      peso_caja_vacia: pCajaVacia,
      cantidad_piezas: piezEst,
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

    const pNeto = Math.max(0, parseFloat(bulto.peso_caja) - parseFloat(bulto.peso_caja_vacia));

    let piezEst = parseInt(cantidad_piezas, 10);
    if (piezEst === undefined || isNaN(piezEst) || piezEst <= 0) {
      const prod = await Producto.findByPk(bulto.codigo_producto);
      if (prod && prod.peso_x_pieza && parseFloat(prod.peso_x_pieza) > 0) {
        piezEst = Math.round(pNeto / parseFloat(prod.peso_x_pieza));
      } else {
        piezEst = bulto.cantidad_piezas || 0;
      }
    }
    bulto.cantidad_piezas = piezEst;

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
