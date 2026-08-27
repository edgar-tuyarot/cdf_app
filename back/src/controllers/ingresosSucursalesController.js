const { IngresoSucursal, Producto, Sucursal, ProductoVencimiento, MovimientoStock, ProductoStock, sequelize } = require('../models');

// 1. Listar ingresos desde sucursales
exports.list = async (req, res) => {
  try {
    const id_ubicacion = req.ubicacionId;
    const ingresos = await IngresoSucursal.findAll({
      where: { id_ubicacion },
      include: [
        {
          model: Producto,
          as: 'Producto',
          attributes: ['codigo', 'nombre', 'peso_x_pieza']
        },
        {
          model: Sucursal,
          as: 'Sucursal',
          attributes: ['id', 'sucursal', 'numero']
        }
      ],
      order: [['fecha', 'DESC']]
    });
    res.json(ingresos);
  } catch (error) {
    console.error('Error al listar ingresos de sucursales:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener la lista.' });
  }
};

// 2. Registrar un nuevo ingreso desde sucursal (devuelto para re-procesar/fraccionar)
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { codigo_producto, piezas, peso, sucursal_id, vencimiento, usuario } = req.body;
    const id_ubicacion = req.ubicacionId;

    // Validaciones básicas
    if (!codigo_producto || !piezas || !peso || !sucursal_id || !vencimiento) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios: codigo_producto, piezas, peso, sucursal_id, vencimiento.' });
    }

    const cantPiezas = parseInt(piezas, 10);
    const pesoKilos = parseFloat(peso);

    if (isNaN(cantPiezas) || cantPiezas <= 0) {
      return res.status(400).json({ error: 'La cantidad de piezas debe ser un número entero mayor a cero.' });
    }
    if (isNaN(pesoKilos) || pesoKilos <= 0) {
      return res.status(400).json({ error: 'El peso ingresado debe ser un número decimal mayor a cero.' });
    }

    // Verificar si el producto existe
    const producto = await Producto.findByPk(codigo_producto, { transaction: t });
    if (!producto) {
      await t.rollback();
      return res.status(404).json({ error: `El producto con código ${codigo_producto} no existe.` });
    }

    // Verificar si la sucursal existe
    const sucursal = await Sucursal.findByPk(sucursal_id, { transaction: t });
    if (!sucursal) {
      await t.rollback();
      return res.status(404).json({ error: `La sucursal con ID ${sucursal_id} no existe.` });
    }

    // A. Registrar el ingreso de sucursal
    const ingresoSucursal = await IngresoSucursal.create({
      id_ubicacion,
      codigo_producto,
      piezas: cantPiezas,
      peso: pesoKilos,
      sucursal_id,
      vencimiento,
      fecha: new Date()
    }, { transaction: t });

    // B. Buscar si ya existe un lote de vencimiento para este producto y fecha
    let lote = await ProductoVencimiento.findOne({
      where: {
        codigo_producto,
        vencimiento,
        id_ubicacion
      },
      transaction: t
    });

    if (lote) {
      // Sumar piezas y peso al lote existente
      lote.piezas += cantPiezas;
      lote.peso = (parseFloat(lote.peso) || 0) + pesoKilos;
      await lote.save({ transaction: t });
    } else {
      // Crear un lote de vencimiento nuevo
      lote = await ProductoVencimiento.create({
        codigo_producto,
        vencimiento,
        piezas: cantPiezas,
        peso: pesoKilos,
        id_ubicacion
      }, { transaction: t });
    }

    // C. Incrementar el stock de la ubicación activa en ProductoStock
    const [pStockRecord, created] = await ProductoStock.findOrCreate({
      where: { codigo_producto, id_ubicacion },
      defaults: { stock: 0.0000, recorte: 0.000, decomiso: 0.000, kg_fraccionados: 0.000 },
      transaction: t
    });
    pStockRecord.stock = parseFloat(pStockRecord.stock) + pesoKilos;
    await pStockRecord.save({ transaction: t, skipAuditLog: true });

    // D. Registrar la auditoría detallada del movimiento en movimiento_stocks
    const nombreSucursal = sucursal.numero 
      ? `Sucursal ${sucursal.numero} - ${sucursal.sucursal}` 
      : sucursal.sucursal;

    await MovimientoStock.create({
      codigo_producto,
      id_ubicacion,
      tipo_movimiento: 'INGRESO_SUCURSAL',
      referencia_id: ingresoSucursal.id,
      concepto: `Ingreso de ${cantPiezas} piezas (${pesoKilos.toFixed(3)} kg) devueltas de ${nombreSucursal}`,
      cantidad_piezas: cantPiezas,
      kilos_calculado: pesoKilos,
      usuario: usuario || 'Sistema',
      fecha: new Date()
    }, { transaction: t });

    // Confirmamos la transacción
    await t.commit();

    // Responder con éxito
    res.status(201).json({
      message: 'Ingreso de sucursal registrado con éxito y sumado al stock.',
      ingreso: ingresoSucursal,
      nuevoKilosCalculado: pStockRecord.stock
    });

  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error('Error al registrar ingreso de sucursal:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el ingreso.' });
  }
};
