const { IngresoProveedor, Producto, sequelize } = require('../models');

// Obtener historial de ingresos
exports.obtenerIngresos = async (req, res) => {
  try {
    const ingresos = await IngresoProveedor.findAll({
      include: [{ model: Producto, attributes: ['descripcion', 'codigo_interno'] }],
      order: [['fecha', 'DESC']]
    });
    res.json(ingresos);
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    res.status(500).json({ error: 'Error al obtener historial de ingresos' });
  }
};

// Crear un nuevo ingreso y sumar stock
exports.crearIngreso = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { 
      fecha, 
      proveedor, 
      nro_factura, 
      id_producto_proveedor, 
      id_producto, 
      kilos_totales, 
      bultos, 
      vencimiento 
    } = req.body;

    if (!id_producto || !kilos_totales) {
      return res.status(400).json({ error: 'Producto y Kilos Totales son obligatorios' });
    }

    // 1. Crear el registro de ingreso
    const nuevoIngreso = await IngresoProveedor.create({
      fecha,
      proveedor,
      nro_factura,
      id_producto_proveedor,
      id_producto,
      kilos_totales,
      bultos,
      vencimiento
    }, { transaction: t });

    // 2. Buscar el producto para sumar el stock
    const producto = await Producto.findByPk(id_producto, { transaction: t });
    if (!producto) {
      await t.rollback();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // 3. Sumar los kilos al stock actual (stock en kilos)
    producto.stock = parseFloat(producto.stock) + parseFloat(kilos_totales);
    await producto.save({ transaction: t });

    // Confirmar transacción
    await t.commit();

    res.status(201).json({
      mensaje: 'Ingreso registrado y stock actualizado',
      ingreso: nuevoIngreso,
      nuevoStock: producto.stock
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al procesar ingreso:', error);
    res.status(500).json({ error: 'Error al procesar el ingreso de mercadería' });
  }
};
