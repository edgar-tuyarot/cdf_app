const multer = require('multer');
const XLSX = require('xlsx');
const { PedidoSucursal, ItemPedido, Producto, Sucursal } = require('../models');
const sequelize = require('../config/db');

// Configurar multer para almacenar en memoria (no necesitamos guardar el archivo)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware de upload para usar en la ruta
exports.upload = upload.single('archivo');

// POST /api/pedidos/cargar-excel
// Recibe un .xlsx, lee la hoja "Historial_Pedidos", borra todos los pedidos/items existentes
// y los reemplaza con los datos del Excel.
exports.cargarExcel = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    // 1. Leer el Excel desde el buffer en memoria
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

    // Buscar la hoja "Historial_Pedidos"
    const sheetName = 'Historial_Pedidos';
    if (!workbook.SheetNames.includes(sheetName)) {
      await t.rollback();
      return res.status(400).json({ 
        error: `No se encontró la hoja "${sheetName}". Hojas disponibles: ${workbook.SheetNames.join(', ')}` 
      });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'La hoja está vacía' });
    }

    // 2. Borrar todos los items y pedidos existentes (en ese orden por FK)
    await ItemPedido.destroy({ where: {}, transaction: t });
    await PedidoSucursal.destroy({ where: {}, transaction: t });

    // 3. Agrupar filas por Codigo_pedido para crear pedidos únicos
    const pedidosMap = {};

    for (const row of rows) {
      const codigoPedido = String(row['Codigo_pedido'] || '').trim();
      if (!codigoPedido) continue;

      if (!pedidosMap[codigoPedido]) {
        pedidosMap[codigoPedido] = {
          fecha: row['Fecha'],
          sucursal: String(row['Suc.'] || '').trim(),
          items: []
        };
      }

      pedidosMap[codigoPedido].items.push({
        cod: String(row['Cod'] || '').trim(),
        piezas: parseInt(row['Pieza']) || 0,
        fraccionado: parseInt(row['Fraccionado']) || 0
      });
    }

    // 4. Procesar cada pedido
    let pedidosCreados = 0;
    let itemsCreados = 0;
    let itemsIgnorados = 0;

    for (const [codigoPedido, data] of Object.entries(pedidosMap)) {

      // Buscar o crear la sucursal
      const [sucursalDb] = await Sucursal.findOrCreate({
        where: { nombre: data.sucursal },
        defaults: { ubicacion: '' },
        transaction: t
      });

      // Parsear la fecha (viene como "14/4/2026" o como número de Excel)
      let fechaPedido;
      if (typeof data.fecha === 'number') {
        // Fecha como número serial de Excel
        fechaPedido = XLSX.SSF.parse_date_code(data.fecha);
        fechaPedido = new Date(fechaPedido.y, fechaPedido.m - 1, fechaPedido.d);
      } else if (typeof data.fecha === 'string') {
        const partes = data.fecha.split('/');
        if (partes.length === 3) {
          fechaPedido = new Date(partes[2], partes[1] - 1, partes[0]);
        } else {
          fechaPedido = new Date();
        }
      } else {
        fechaPedido = new Date();
      }

      // Crear el pedido
      const pedido = await PedidoSucursal.create({
        id_pedido: codigoPedido,
        codigo_pedido: codigoPedido,
        id_sucursal: sucursalDb.id_sucursal,
        fecha_pedido: fechaPedido,
        estado: 'Pendiente'
      }, { transaction: t });

      pedidosCreados++;

      // Crear los items del pedido
      for (const item of data.items) {
        const productoDb = await Producto.findOne({ 
          where: { codigo_interno: item.cod },
          transaction: t 
        });

        if (productoDb) {
          await ItemPedido.create({
            id_pedido: pedido.id_pedido,
            id_producto: productoDb.id_producto,
            cantidad_piezas: item.piezas,
            cantidad_fraccionado: item.fraccionado
          }, { transaction: t });
          itemsCreados++;
        } else {
          itemsIgnorados++;
        }
      }
    }

    await t.commit();

    res.json({
      mensaje: 'Excel procesado correctamente',
      resumen: {
        pedidos_creados: pedidosCreados,
        items_creados: itemsCreados,
        items_ignorados_sku_no_encontrado: itemsIgnorados
      }
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al procesar Excel:', error);
    res.status(500).json({ error: 'Error al procesar el archivo Excel' });
  }
};
