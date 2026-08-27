const { OrdenCompra, OrdenCompraItem, Proveedor, Producto, Bulto, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper para generar número de orden automático si no viene asignado
const generarNumeroOrden = async () => {
  const count = await OrdenCompra.count();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const numFormatted = String(count + 1).padStart(4, '0');
  return `OC-${dateStr}-${numFormatted}`;
};

// Obtener todas las órdenes de compra (con filtros opcionales)
exports.getOrdenes = async (req, res) => {
  try {
    const { estado, id_proveedor } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (id_proveedor) where.id_proveedor = id_proveedor;

    const ordenes = await OrdenCompra.findAll({
      where,
      include: [
        {
          model: Proveedor,
          as: 'proveedor',
          attributes: ['id', 'nombre']
        },
        {
          model: OrdenCompraItem,
          as: 'items',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['codigo', 'nombre', 'peso_x_pieza', 'kg_x_bolsita']
            }
          ]
        }
      ],
      order: [['id', 'DESC']]
    });

    res.json(ordenes);
  } catch (error) {
    console.error('Error al obtener órdenes de compra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener una orden de compra por ID
exports.getOrdenById = async (req, res) => {
  try {
    const { id } = req.params;
    const orden = await OrdenCompra.findByPk(id, {
      include: [
        {
          model: Proveedor,
          as: 'proveedor',
          attributes: ['id', 'nombre']
        },
        {
          model: OrdenCompraItem,
          as: 'items',
          include: [
            {
              model: Producto,
              as: 'producto'
            }
          ]
        }
      ]
    });

    if (!orden) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    res.json(orden);
  } catch (error) {
    console.error('Error al obtener orden de compra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear nueva orden de compra
exports.crearOrden = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let { numero_orden, id_proveedor, fecha, observaciones, items } = req.body;

    if (!id_proveedor) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El proveedor es obligatorio' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Debe agregar al menos un producto a la orden' });
    }

    if (!numero_orden || numero_orden.trim() === '') {
      numero_orden = await generarNumeroOrden();
    }

    const nuevaOrden = await OrdenCompra.create({
      numero_orden: numero_orden.trim(),
      id_proveedor,
      fecha: fecha || new Date(),
      estado: 'Pendiente',
      observaciones: observaciones || null,
      id_ubicacion: req.ubicacionId || 1
    }, { transaction });

    const itemsToCreate = items.map(item => ({
      id_orden_compra: nuevaOrden.id,
      codigo_producto: item.codigo_producto,
      cantidad_cajas: parseFloat(item.cantidad_cajas) || 0,
      cantidad_piezas: parseInt(item.cantidad_piezas, 10) || 0
    }));

    await OrdenCompraItem.bulkCreate(itemsToCreate, { transaction });

    await transaction.commit();

    // Retornar orden creada con relaciones
    const ordenCompleta = await OrdenCompra.findByPk(nuevaOrden.id, {
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: OrdenCompraItem, as: 'items', include: [{ model: Producto, as: 'producto' }] }
      ]
    });

    res.status(201).json(ordenCompleta);
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear orden de compra:', error);
    res.status(500).json({ error: 'Error al crear la orden de compra: ' + error.message });
  }
};

// Cambiar estado de la orden (Administrativo: 'Pendiente', 'Recibida', 'Cancelada')
exports.cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['Pendiente', 'Recibida', 'Cancelada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const orden = await OrdenCompra.findByPk(id);
    if (!orden) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    orden.estado = estado;
    await orden.save();

    res.json({ message: `Estado actualizado a ${estado}`, orden });
  } catch (error) {
    console.error('Error al cambiar estado de orden de compra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar orden de compra
exports.eliminarOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const orden = await OrdenCompra.findByPk(id);

    if (!orden) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    await orden.destroy();
    res.json({ message: 'Orden de compra eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar orden de compra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
