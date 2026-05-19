const { IngresoRecorte, Producto, Sucursal, Proceso, sequelize } = require('../models');

// Obtener todos los ingresos de recortes (historial)
exports.obtenerIngresosRecortes = async (req, res) => {
  try {
    const ingresos = await IngresoRecorte.findAll({
      include: [
        {
          model: Sucursal,
          as: 'Sucursal',
          attributes: ['id', 'sucursal', 'numero']
        },
        {
          model: Producto,
          as: 'Producto',
          attributes: ['codigo', 'nombre']
        }
      ],
      order: [['fecha', 'DESC']]
    });
    res.json(ingresos);
  } catch (error) {
    console.error('Error al obtener ingresos de recortes:', error);
    res.status(500).json({ error: 'Error al obtener ingresos de recortes' });
  }
};

// Crear ingresos de recortes masivamente (recibe un array)
exports.crearIngresosRecortesMasivo = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const items = req.body; // Se espera un array de ingresos

    if (!Array.isArray(items)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Se esperaba un array de registros de ingresos de recorte' });
    }

    if (items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El array de ingresos de recorte está vacío' });
    }

    const creados = [];

    for (const item of items) {
      const { id_sucursal, id_producto, peso_recorte, fecha } = item;

      if (!id_sucursal || !id_producto || peso_recorte === undefined || peso_recorte === null) {
        throw new Error('Faltan campos obligatorios en uno de los registros (id_sucursal, id_producto, peso_recorte)');
      }

      const valorPeso = parseFloat(peso_recorte);
      if (isNaN(valorPeso) || valorPeso <= 0) {
        throw new Error(`El peso del recorte para el producto ${id_producto} debe ser un número mayor a cero`);
      }

      // Validar producto
      const producto = await Producto.findByPk(id_producto, { transaction });
      if (!producto) {
        throw new Error(`El producto con código ${id_producto} no existe en el catálogo.`);
      }

      // Validar sucursal
      const sucursal = await Sucursal.findByPk(id_sucursal, { transaction });
      if (!sucursal) {
        throw new Error(`La sucursal con ID ${id_sucursal} no existe.`);
      }

      // 1. Crear el registro en ingreso_recortes
      const nuevoIngreso = await IngresoRecorte.create({
        id_sucursal,
        id_producto,
        peso_recorte: valorPeso,
        fecha: fecha || new Date()
      }, { transaction });

      // 2. Incrementar el stock del recorte en Producto
      producto.kg_recorte = (parseFloat(producto.kg_recorte) || 0) + valorPeso;
      await producto.save({ transaction });

      // 3. Crear trazabilidad histórica en la tabla procesos
      await Proceso.create({
        colaborador: `Sucursal: ${sucursal.sucursal}`,
        proceso: 'Ingreso de Recorte',
        fecha: fecha || new Date(),
        codigo: id_producto,
        piezas: 0,
        peso_bruto: 0,
        recorte: valorPeso,
        decomiso: 0,
        kg_a_desc: 0,
        kg_a_sumar: 0
      }, { transaction });

      creados.push(nuevoIngreso);
    }

    await transaction.commit();

    res.status(201).json({
      mensaje: `${creados.length} ingresos de recorte registrados y stock actualizado exitosamente`,
      registros: creados
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al procesar ingresos de recortes masivos:', error);
    res.status(500).json({ error: error.message || 'Error interno al procesar los ingresos de recorte' });
  }
};
