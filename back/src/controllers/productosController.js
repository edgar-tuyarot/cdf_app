const { Producto, ProductoVencimiento, IngresoProveedor, Proveedor, Generador, Sucursal, Proceso, LogConversion, Bulto, Fraccionado, SucursalProductoPermiso, Ubicacion, ProductoStock, MovimientoStock, sequelize } = require('../models');
const wmsService = require('../services/wmsService');
const { calcularPiezasProducto } = require('../utils/calculoPiezas');

// Helper to sync Fraccionado template mapping
const syncFraccionadoTemplate = async (codigoProductoOriginal, codigoFraccionado, id_ubicacion, transaction) => {
  if (codigoFraccionado) {
    // 1. Check if a Fraccionado record exists
    const existing = await Fraccionado.findOne({
      where: {
        codigo_producto_original: codigoProductoOriginal,
        codigo_fraccionado: codigoFraccionado,
        id_ubicacion
      },
      transaction
    });

    if (!existing) {
      // 2. Create the template mapping
      await Fraccionado.create({
        codigo_producto_original: codigoProductoOriginal,
        codigo_fraccionado: codigoFraccionado,
        peso_a_fraccionar: 0,
        peso_a_descontar: 0,
        id_ubicacion
      }, { transaction });
    }

    // 3. Delete any other templates for this mother product pointing to different fractioned codes
    const { Op } = require('sequelize');
    await Fraccionado.destroy({
      where: {
        codigo_producto_original: codigoProductoOriginal,
        codigo_fraccionado: {
          [Op.ne]: codigoFraccionado
        },
        id_ubicacion
      },
      transaction
    });
  } else {
    // If it was cleared, remove all Fraccionado records for this mother product
    await Fraccionado.destroy({
      where: {
        codigo_producto_original: codigoProductoOriginal,
        id_ubicacion
      },
      transaction
    });
  }
};

// Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const id_ubicacion = req.ubicacionId;
    const { Op } = require('sequelize');

    // Obtener la fecha del último log/movimiento de stock para cada producto
    const logDates = await MovimientoStock.findAll({
      attributes: [
        'codigo_producto',
        [sequelize.fn('MAX', sequelize.col('fecha')), 'max_fecha']
      ],
      where: {
        [Op.or]: [
          { id_ubicacion },
          { id_ubicacion: null }
        ]
      },
      group: ['codigo_producto'],
      raw: true
    });

    const logDateMap = {};
    logDates.forEach(item => {
      logDateMap[item.codigo_producto] = item.max_fecha;
    });

    const productos = await Producto.findAll({
      include: [
        {
          model: ProductoVencimiento,
          as: 'vencimientosList',
          where: { id_ubicacion },
          required: false
        },
        {
          model: SucursalProductoPermiso,
          as: 'SucursalPermisos',
          attributes: ['id_sucursal']
        },
        {
          model: ProductoStock,
          as: 'Stocks',
          where: { id_ubicacion },
          required: false
        },
        {
          model: Proveedor,
          as: 'Proveedor',
          attributes: ['id', 'nombre'],
          required: false
        }
      ]
    });

    const mapped = productos.map(p => {
      const json = p.toJSON();
      const stockObj = p.Stocks && p.Stocks[0] ? p.Stocks[0] : null;
      
      // Stock normal
      json.stock = stockObj ? parseFloat(stockObj.stock) : 0.0000;
      json.kilos_calculado = json.stock;
      
      // Stock de recortes, decomisos y fraccionados local
      json.kg_recorte = stockObj ? parseFloat(stockObj.recorte) : 0.000;
      json.kg_decomiso = stockObj ? parseFloat(stockObj.decomiso) : 0.000;
      json.kg_fraccionados = stockObj ? parseFloat(stockObj.kg_fraccionados) : 0.000;
      
      // Piezas localizadas (calculadas dinámicamente según stock y tipo_calculo_piezas)
      json.cantidad_piezas = calcularPiezasProducto(json.stock, json);

      // Determinar la fecha de última modificación según el último log de stock o la fecha de edición del producto
      const maxLogDate = logDateMap[p.codigo];
      if (maxLogDate && json.updated_at) {
        json.updated_at = new Date(maxLogDate) > new Date(json.updated_at) ? maxLogDate : json.updated_at;
      } else if (maxLogDate) {
        json.updated_at = maxLogDate;
      }
      
      return json;
    });

    res.json(mapped);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Crear un nuevo producto
exports.crearProducto = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { 
      codigo, nombre, stock, peso_pieza, cantidad_piezas, 
      vencimientos, peso_fraccion, peso_unidad, tipo_calculo_piezas, kg_fraccionados, kg_decomiso, kg_recorte,
      vencimientosList, destacado, codigo_barra, pesable, activo,
      codigo_fraccionado, sucursalesHabilitadas, proveedor_id
    } = req.body;

    if (!codigo || !nombre) {
      await transaction.rollback();
      return res.status(400).json({ error: 'codigo y nombre son obligatorios' });
    }

    const tipoCalc = tipo_calculo_piezas || 'normal';
    if (!['normal', 'fraccionado', 'unidad'].includes(tipoCalc)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El tipo_calculo_piezas debe ser "normal", "fraccionado" o "unidad".' });
    }

    const pesoP = parseFloat(peso_pieza) || 0;
    const kgB = parseFloat(peso_fraccion) || 0;
    const pesoU = parseFloat(peso_unidad) || 1.000;

    if (tipoCalc === 'normal' && pesoP <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Para productos normales, el peso por pieza debe ser mayor a 0.' });
    }
    if (tipoCalc === 'fraccionado' && kgB <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Para productos fraccionados, el peso por fraccion (peso_fraccion) debe ser mayor a 0.' });
    }
    if (tipoCalc === 'unidad' && pesoU <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Para productos por unidad, el peso por unidad debe ser mayor a 0.' });
    }

    const existe = await Producto.findByPk(codigo, { transaction });
    if (existe) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Ya existe un producto con ese código' });
    }

    const nuevoProducto = await Producto.create({
      codigo,
      nombre,
      peso_pieza: pesoP,
      peso_fraccion: kgB,
      peso_unidad: pesoU,
      tipo_calculo_piezas: tipoCalc,
      destacado: destacado !== undefined ? destacado : false,
      codigo_barra,
      pesable: pesable !== undefined ? pesable : true,
      activo: activo !== undefined ? activo : true,
      codigo_fraccionado,
      proveedor_id: proveedor_id || null,
      updated_at: new Date()
    }, { 
      transaction
    });

    const activeUbicacionId = req.ubicacionId;
    const initialStockVal = parseFloat(stock) || 0;
    if (initialStockVal > 0) {
      const [prodStock] = await ProductoStock.findOrCreate({
        where: { codigo_producto: codigo, id_ubicacion: activeUbicacionId },
        defaults: { stock: 0.0000, recorte: 0.000, decomiso: 0.000, kg_fraccionados: 0.000 },
        transaction
      });
      prodStock.stock = initialStockVal;
      await prodStock.save({
        transaction,
        tipo_movimiento: 'PRODUCTO_CREADO',
        concepto: 'Alta inicial del stock en catálogo'
      });
    }

    if (Array.isArray(vencimientosList) && vencimientosList.length > 0) {
      const pesoXP = parseFloat(peso_pieza) || 0;
      const activeVencimientos = vencimientosList
        .filter(v => v.vencimiento && ((parseInt(v.piezas, 10) || 0) > 0 || parseFloat(v.peso) > 0))
        .map(v => {
          const piezasCount = parseInt(v.piezas, 10) || 0;
          const pesoVal = parseFloat(v.peso) || (piezasCount * pesoXP);
          return {
            codigo_producto: codigo,
            vencimiento: v.vencimiento,
            piezas: 0,
            peso: pesoVal,
            id_ubicacion: activeUbicacionId
          };
        });
      if (activeVencimientos.length > 0) {
        await ProductoVencimiento.bulkCreate(activeVencimientos, { transaction });
      }
    }

    if (codigo_fraccionado !== undefined) {
      await syncFraccionadoTemplate(codigo, codigo_fraccionado, activeUbicacionId, transaction);
    }

    if (sucursalesHabilitadas !== undefined) {
      await syncSucursalesHabilitadas(codigo, sucursalesHabilitadas, transaction);
    }

    await transaction.commit();

    // Fetch product with vencimientos list to return complete data
    const finalProduct = await Producto.findByPk(codigo, {
      include: [
        { model: ProductoVencimiento, as: 'vencimientosList', where: { id_ubicacion: activeUbicacionId }, required: false },
        { model: ProductoStock, as: 'Stocks', where: { id_ubicacion: activeUbicacionId }, required: false },
        { model: Proveedor, as: 'Proveedor', attributes: ['id', 'nombre'], required: false }
      ]
    });

    const finalProductJson = finalProduct.toJSON();
    const stockObj = finalProduct.Stocks && finalProduct.Stocks[0] ? finalProduct.Stocks[0] : null;
    finalProductJson.stock = stockObj ? parseFloat(stockObj.stock) : 0.0000;
    finalProductJson.kilos_calculado = finalProductJson.stock;
    
    finalProductJson.kg_recorte = stockObj ? parseFloat(stockObj.recorte) : 0.000;
    finalProductJson.kg_decomiso = stockObj ? parseFloat(stockObj.decomiso) : 0.000;
    finalProductJson.kg_fraccionados = stockObj ? parseFloat(stockObj.kg_fraccionados) : 0.000;

    const vList = finalProductJson.vencimientosList || [];
    finalProductJson.cantidad_piezas = vList.reduce((sum, v) => sum + (parseInt(v.piezas, 10) || 0), 0);

    res.status(201).json({
      mensaje: 'Producto creado exitosamente',
      producto: finalProductJson
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear el producto' });
  }
};

// Actualizar producto
exports.actualizarProducto = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params; // codigo
    const producto = await Producto.findByPk(id, { transaction });
    
    if (!producto) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { vencimientosList, sucursalesHabilitadas, ...otherFields } = req.body;
    otherFields.updated_at = new Date();

    const targetTipoCalc = otherFields.tipo_calculo_piezas !== undefined ? otherFields.tipo_calculo_piezas : producto.tipo_calculo_piezas;
    if (!['normal', 'fraccionado', 'unidad'].includes(targetTipoCalc)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El tipo_calculo_piezas debe ser "normal", "fraccionado" o "unidad".' });
    }

    const targetPesoP = otherFields.peso_pieza !== undefined ? parseFloat(otherFields.peso_pieza) : (otherFields.peso_pieza !== undefined ? parseFloat(otherFields.peso_pieza) : parseFloat(producto.peso_pieza));
    const targetKgB = otherFields.peso_fraccion !== undefined ? parseFloat(otherFields.peso_fraccion) : (otherFields.peso_fraccion !== undefined ? parseFloat(otherFields.peso_fraccion) : parseFloat(producto.peso_fraccion));
    const targetPesoU = otherFields.peso_unidad !== undefined ? parseFloat(otherFields.peso_unidad) : (otherFields.peso_unidad !== undefined ? parseFloat(otherFields.peso_unidad) : parseFloat(producto.peso_unidad));

    if (targetTipoCalc === 'normal' && (isNaN(targetPesoP) || targetPesoP <= 0)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Para productos normales, el peso por pieza debe ser mayor a 0.' });
    }
    if (targetTipoCalc === 'fraccionado' && (isNaN(targetKgB) || targetKgB <= 0)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Para productos fraccionados, el peso por fraccion (peso_fraccion) debe ser mayor a 0.' });
    }
    if (targetTipoCalc === 'unidad' && (isNaN(targetPesoU) || targetPesoU <= 0)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Para productos por unidad, el peso por unidad debe ser mayor a 0.' });
    }

    const id_ubicacion = req.ubicacionId;
    if (otherFields.stock !== undefined) {
      const stockVal = parseFloat(otherFields.stock) || 0;
      const [prodStock, created] = await ProductoStock.findOrCreate({
        where: { codigo_producto: id, id_ubicacion },
        defaults: { stock: 0.0000 },
        transaction
      });
      prodStock.stock = stockVal;
      await prodStock.save({
        transaction,
        tipo_movimiento: 'AJUSTE_DIRECTO',
        concepto: 'Modificación manual de stock desde catálogo'
      });
      
      delete otherFields.stock;
      delete otherFields.kilos_calculado;
    }

    // Check if vencimientosList is provided
    if (vencimientosList !== undefined) {
      // Obtener piezas anteriores
      const currentVencimientos = await ProductoVencimiento.findAll({
        where: { codigo_producto: id, id_ubicacion },
        transaction
      });
      const oldPiecesTotal = currentVencimientos.reduce((sum, v) => sum + (parseInt(v.piezas, 10) || 0), 0);

      // Delete existing vencimientos
      await ProductoVencimiento.destroy({
        where: { codigo_producto: id, id_ubicacion },
        transaction
      });

      // Filter and insert new vencimientos
      let calculatedPieces = 0;
      if (Array.isArray(vencimientosList) && vencimientosList.length > 0) {
        const pesoXP = parseFloat(producto.peso_pieza) || 0;
        const activeVencimientos = vencimientosList
          .filter(v => v.vencimiento && ((parseInt(v.piezas, 10) || 0) > 0 || parseFloat(v.peso) > 0))
          .map(v => {
            const piezasCount = parseInt(v.piezas, 10) || 0;
            calculatedPieces += piezasCount;
            const pesoVal = parseFloat(v.peso) || (piezasCount * pesoXP);
            return {
              codigo_producto: id,
              vencimiento: v.vencimiento,
              piezas: 0,
              peso: pesoVal,
              id_ubicacion
            };
          });

        if (activeVencimientos.length > 0) {
          await ProductoVencimiento.bulkCreate(activeVencimientos, { transaction });
        }
      }

      // Registrar movimiento de stock si hubo variación de piezas
      const deltaPieces = calculatedPieces - oldPiecesTotal;
      if (deltaPieces !== 0) {
        await MovimientoStock.create({
          codigo_producto: id,
          id_ubicacion,
          tipo_movimiento: 'AUDITORIA_PIEZAS',
          concepto: `Modificación de lotes de vencimiento desde edición de producto (piezas aprox: ${oldPiecesTotal} -> ${calculatedPieces})`,
          cantidad_piezas: 0,
          stock: deltaPieces * (parseFloat(producto.peso_pieza) || 0),
          kilos_calculado: deltaPieces * (parseFloat(producto.peso_pieza) || 0),
          usuario: req.usuario?.nombre || 'Sistema',
          fecha: new Date()
        }, { transaction });
      }
    }

    // pieces are now calculated dynamically, no separate cache is updated

    await producto.update(otherFields, { 
      transaction
    });

    if (otherFields.codigo_fraccionado !== undefined) {
      await syncFraccionadoTemplate(id, otherFields.codigo_fraccionado, id_ubicacion, transaction);
    }

    if (sucursalesHabilitadas !== undefined) {
      await syncSucursalesHabilitadas(id, sucursalesHabilitadas, transaction);
    }

    await transaction.commit();

    // Fetch updated product with associations
    const finalProduct = await Producto.findByPk(id, {
      include: [
        { model: ProductoVencimiento, as: 'vencimientosList', where: { id_ubicacion }, required: false },
        { model: ProductoStock, as: 'Stocks', where: { id_ubicacion }, required: false },
        { model: Proveedor, as: 'Proveedor', attributes: ['id', 'nombre'], required: false }
      ]
    });

    const finalProductJson = finalProduct.toJSON();
    const stockObj = finalProduct.Stocks && finalProduct.Stocks[0] ? finalProduct.Stocks[0] : null;
    finalProductJson.stock = stockObj ? parseFloat(stockObj.stock) : 0.0000;
    finalProductJson.kilos_calculado = finalProductJson.stock;

    finalProductJson.kg_recorte = stockObj ? parseFloat(stockObj.recorte) : 0.000;
    finalProductJson.kg_decomiso = stockObj ? parseFloat(stockObj.decomiso) : 0.000;
    finalProductJson.kg_fraccionados = stockObj ? parseFloat(stockObj.kg_fraccionados) : 0.000;

    const vList = finalProductJson.vencimientosList || [];
    finalProductJson.cantidad_piezas = vList.reduce((sum, v) => sum + (parseInt(v.piezas, 10) || 0), 0);

    res.json({
      mensaje: 'Producto actualizado exitosamente',
      producto: finalProductJson
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
};

// Eliminar producto (Borrado Lógico)
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    producto.activo = false;
    producto.updated_at = new Date();
    await producto.save();

    res.json({ mensaje: 'Producto desactivado exitosamente', producto });
  } catch (error) {
    console.error('Error al desactivar producto (borrado lógico):', error);
    res.status(500).json({ error: 'Error al desactivar el producto' });
  }
};

// Carga masiva desde un archivo Excel o array JSON
exports.uploadExcel = async (req, res) => {
  try {
    let productosData = [];

    // Si viene un archivo (Excel/CSV)
    if (req.file) {
      const xlsx = require('xlsx');
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Parsear la hoja a JSON
      const data = xlsx.utils.sheet_to_json(sheet);
      
      // Mapear los nombres de columnas que puedan venir del Excel a nuestro modelo
      productosData = data.map(row => {
        const kb = parseFloat(row['Kilos Block'] || row['stock'] || 0);
        const ean = row['codigo_ean'] || row['Codigo_ean'] || row['Codigo_Ean'] || row['CODIGO_EAN'] || row['ean'] || row['EAN'] || row['Ean'] || row['Código EAN'] || row['codigo ean'] || row['Codigo Ean'] || row['código ean'] || row['CÓDIGO EAN'] || row['codigo_barra'] || row['codigo barra'];
        const dest = row['destacado'] || row['Destacado'] || row['DESTACADO'];
        const pes = row['pesable'] || row['Pesable'] || row['PESABLE'];
        return {
          codigo: row['Codigo'] || row['codigo'] || String(row['Código']),
          nombre: row['Nombre'] || row['nombre'],
          stock: kb,
          kilos_calculado: kb,
          peso_pieza: parseFloat(row['Peso x Pieza'] || row['peso_pieza'] || row['peso_pieza'] || 0),
          cantidad_piezas: parseInt(row['Cantidad Piezas'] || row['cantidad_piezas'] || 0, 10),
          vencimientos: row['Vencimientos'] || row['vencimientos'] || null,
          peso_fraccion: parseFloat(row['Kg x bolsita'] || row['peso_fraccion'] || row['peso_fraccion'] || 0),
          kg_fraccionados: parseFloat(row['Kg Fraccionados'] || row['kg_fraccionados'] || 0),
          kg_decomiso: parseFloat(row['Kg Decomiso'] || row['kg_decomiso'] || 0),
          kg_recorte: parseFloat(row['Kg Recorte'] || row['kg_recorte'] || 0),
          codigo_barra: ean ? String(ean).trim() : null,
          destacado: dest === true || String(dest).toLowerCase().trim() === 'true' || parseInt(dest, 10) === 1,
          pesable: pes === undefined ? (!/(?:\d+\s*X|X\s*\d+)(?![\s\d\.]*k)/i.test(row['Nombre'] || row['nombre'])) : (pes === true || String(pes).toLowerCase().trim() === 'true' || parseInt(pes, 10) === 1)
        };
      }).filter(p => p.codigo && p.nombre); // Filtrar filas vacías
    } 
    // Si viene un array directamente en el body
    else if (Array.isArray(req.body) && req.body.length > 0) {
      productosData = req.body;
    } 
    else {
      return res.status(400).json({ error: 'No se envió ningún archivo ni un array válido.' });
    }

    if (productosData.length === 0) {
      return res.status(400).json({ error: 'El archivo o array no contenía productos válidos (falta código o nombre).' });
    }

    // Insertar masivamente (ignorar o actualizar duplicados)
    await Producto.bulkCreate(productosData, {
      updateOnDuplicate: [
        'nombre', 'stock', 'kilos_calculado', 'peso_pieza', 'cantidad_piezas', 
        'vencimientos', 'peso_fraccion', 'kg_fraccionados', 'kg_decomiso', 'kg_recorte',
        'codigo_barra', 'destacado', 'pesable', 'proveedor_id'
      ]
    });

    res.json({
      mensaje: 'Carga masiva completada exitosamente',
      registros_procesados: productosData.length
    });
  } catch (error) {
    console.error('Error en carga masiva:', error);
    res.status(500).json({ error: 'Error procesando la carga masiva' });
  }
};

// Obtener sumatoria de recortes y listado de productos con recortes
exports.obtenerRecortes = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const id_ubicacion = req.ubicacionId;
    
    const stocks = await ProductoStock.findAll({
      where: {
        id_ubicacion,
        recorte: {
          [Op.gt]: 0
        }
      },
      include: [{ model: Producto, as: 'Producto' }]
    });

    let totalKilos = 0;
    const listado = stocks.map(ps => {
      const kilos = parseFloat(ps.recorte) || 0;
      totalKilos += kilos;
      return {
        codigo: ps.codigo_producto,
        nombre: ps.Producto ? ps.Producto.nombre : 'Producto Desconocido',
        kilos: kilos
      };
    });

    res.json({
      Kilos_Totales: `${totalKilos.toFixed(3).replace('.', ',')} kg`,
      productos_con_recortes: listado
    });
  } catch (error) {
    console.error('Error al obtener recortes:', error);
    res.status(500).json({ error: 'Error al obtener recortes' });
  }
};

// Convertir recortes: resta de origen y suma a stock del destino '7718'
exports.convertirRecorte = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, comprobante, usuario } = req.body;

    if (!comprobante) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El número de comprobante es obligatorio.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Debe enviar un array "items" con los productos a convertir.' });
    }

    const resultDetails = [];
    let totalKilosConvertidos = 0;

    for (const item of items) {
      const { codigo, kilos } = item;
      if (!codigo || kilos === undefined || kilos === null) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Cada item debe tener codigo y kilos.' });
      }

      const valorKilos = parseFloat(kilos);
      if (isNaN(valorKilos) || valorKilos <= 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Los kilos a convertir deben ser mayores a cero.' });
      }

      const productoOrigen = await Producto.findByPk(codigo, { transaction });
      if (!productoOrigen) {
        await transaction.rollback();
        return res.status(404).json({ error: `Producto con código ${codigo} no encontrado.` });
      }

      const [prodStock, created] = await ProductoStock.findOrCreate({
        where: { codigo_producto: codigo, id_ubicacion: req.ubicacionId },
        defaults: { stock: 0.0000, recorte: 0.000, decomiso: 0.000, kg_fraccionados: 0.000 },
        transaction
      });

      const recorteActual = parseFloat(prodStock.recorte) || 0;
      if (recorteActual < valorKilos) {
        await transaction.rollback();
        return res.status(400).json({
          error: `No hay suficientes recortes para ${codigo}. Stock actual: ${recorteActual} kg. Solicitado: ${valorKilos} kg.`
        });
      }

      prodStock.recorte = Math.max(0, recorteActual - valorKilos);
      await prodStock.save({ 
        transaction,
        tipo_movimiento: 'CONVERSION',
        concepto: `Conversión: Egreso de recorte (Comprobante: ${comprobante})`
      });

      // Crear el log de conversión en log_conversiones
      await LogConversion.create({
        id_ubicacion: req.ubicacionId,
        codigo_producto_original: codigo,
        peso_descontado: valorKilos,
        codigo_fraccionado: '7718',
        peso_fraccionado: valorKilos,
        comprobante: comprobante,
        usuario: usuario || 'Sistema',
        fecha: new Date()
      }, { transaction });

      totalKilosConvertidos += valorKilos;
      resultDetails.push({
        codigo: codigo,
        nombre: productoOrigen.nombre,
        kg_recorte_nuevo: parseFloat(prodStock.recorte)
      });
    }

    // Buscar/crear o actualizar producto destino (7718)
    let productoDestino = await Producto.findByPk('7718', { transaction });
    if (!productoDestino) {
      productoDestino = await Producto.create({
        codigo: '7718',
        nombre: 'FIAM PICADITAS X KG'
      }, { transaction });
    }

    const id_ubicacion = req.ubicacionId;
    const [destStock, destCreated] = await ProductoStock.findOrCreate({
      where: { codigo_producto: '7718', id_ubicacion },
      defaults: { stock: 0.0000 },
      transaction
    });

    const stockActual = parseFloat(destStock.stock) || 0;
    destStock.stock = stockActual + totalKilosConvertidos;
    await destStock.save({
      transaction,
      tipo_movimiento: 'CONVERSION',
      concepto: `Conversión lote: Ingreso de kilos por recortes (Comprobante: ${comprobante})`
    });

    await transaction.commit();

    // Emitir automáticamente Orden de Ajuste en BlockWMS para Picaditas:
    // Bajas ID 49 ("Baja fiambrería para picaditas") de originales y Alta ID 28 ("Elaboración del Sector") para 7718
    try {
      const wmsItems = [];
      for (const item of items) {
        const valKilos = parseFloat(item.kilos) || 0;
        if (item.codigo && valKilos > 0) {
          wmsItems.push({
            codigoProducto: item.codigo,
            cantidad: valKilos,
            operador: 'resta',
            idMotivo: '49' // 49 = Baja fiambreria para picaditas
          });
        }
      }

      if (totalKilosConvertidos > 0) {
        wmsItems.push({
          codigoProducto: '7718', // 7718 = FIAM PICADITAS X KG
          cantidad: totalKilosConvertidos,
          operador: 'suma',
          idMotivo: '28' // 28 = Elaboración del Sector
        });
      }

      if (wmsItems.length > 0) {
        const wmsCreds = {
          sessionId: req.headers['x-wms-session-id'] || req.body?.sessionId || '',
          siteId: req.headers['x-wms-site-id'] || req.body?.siteId || '194326',
          host: req.headers['x-wms-host'] || req.body?.host || 'http://192.168.10.2'
        };

        wmsService.ejecutarAjusteMultipleWMS({
          items: wmsItems,
          observaciones: `Conversión Picaditas (Comprobante: ${comprobante})`,
          ...wmsCreds
        }).then(resWms => {
          console.log(`[WMS-Picadas] Orden de ajuste #${resWms.idOrdenes} generada en BlockWMS.`);
        }).catch(errWms => {
          console.warn('[WMS-Picadas] Advertencia al emitir orden en BlockWMS:', errWms.message);
        });
      }
    } catch (errWms) {
      console.warn('[WMS-Picadas] Error WMS:', errWms.message);
    }

    res.json({
      mensaje: 'Lote de recortes convertido exitosamente',
      detalles: resultDetails,
      totalKilosConvertidos,
      productoDestino: {
        codigo: '7718',
        nombre: productoDestino.nombre,
        stock_nuevo: parseFloat(destStock.stock) || 0,
        kilos_calculado_nuevo: parseFloat(destStock.stock) || 0
      }
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al convertir lote de recortes:', error);
    res.status(500).json({ error: 'Error interno al procesar la conversión del lote.' });
  }
};

// Obtener sumatoria de decomisos y listado de productos con decomisos
exports.obtenerDecomisos = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const id_ubicacion = req.ubicacionId;
    
    const stocks = await ProductoStock.findAll({
      where: {
        id_ubicacion,
        decomiso: {
          [Op.gt]: 0
        }
      },
      include: [{ model: Producto, as: 'Producto' }]
    });

    let totalKilos = 0;
    const listado = stocks.map(ps => {
      const kilos = parseFloat(ps.decomiso) || 0;
      totalKilos += kilos;
      return {
        codigo: ps.codigo_producto,
        nombre: ps.Producto ? ps.Producto.nombre : 'Producto Desconocido',
        kilos: kilos,
        stock: parseFloat(ps.stock) || 0,
        pesable: ps.Producto ? ps.Producto.pesable : true
      };
    });

    res.json({
      Kilos_Totales: `${totalKilos.toFixed(3).replace('.', ',')} kg`,
      productos_con_decomisos: listado
    });
  } catch (error) {
    console.error('Error al obtener decomisos:', error);
    res.status(500).json({ error: 'Error al obtener decomisos' });
  }
};

// Descontar del stock de decomisos de un producto (procesar en lote)
exports.descontarDecomiso = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, comprobante, usuario } = req.body;

    if (!comprobante) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El número de comprobante es obligatorio.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Debe enviar un array "items" con los decomisos a descontar.' });
    }

    const resultDetails = [];

    for (const item of items) {
      const { codigo, kilos } = item;
      if (!codigo || kilos === undefined || kilos === null) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Cada item debe tener codigo y kilos.' });
      }

      const valorKilos = parseFloat(kilos);
      if (isNaN(valorKilos) || valorKilos <= 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Los kilos a descontar deben ser mayores a cero.' });
      }

      const producto = await Producto.findByPk(codigo, { transaction });
      if (!producto) {
        await transaction.rollback();
        return res.status(404).json({ error: `Producto con código ${codigo} no encontrado.` });
      }

      const [prodStock, created] = await ProductoStock.findOrCreate({
        where: { codigo_producto: codigo, id_ubicacion: req.ubicacionId },
        defaults: { stock: 0.0000, recorte: 0.000, decomiso: 0.000, kg_fraccionados: 0.000 },
        transaction
      });

      const decomisoActual = parseFloat(prodStock.decomiso) || 0;
      if (decomisoActual < valorKilos) {
        await transaction.rollback();
        return res.status(400).json({
          error: `No hay suficientes decomisos para ${codigo}. Stock actual: ${decomisoActual} kg. Solicitado: ${valorKilos} kg.`
        });
      }

      prodStock.decomiso = Math.max(0, decomisoActual - valorKilos);
      await prodStock.save({
        transaction,
        tipo_movimiento: 'DECOMISO',
        concepto: `Baja / Descarte de decomiso (Comprobante: ${comprobante})`,
        kg_decomiso: -valorKilos,
        usuario: usuario || 'Sistema'
      });

      resultDetails.push({
        codigo: codigo,
        nombre: producto.nombre,
        kg_decomiso_nuevo: parseFloat(prodStock.decomiso)
      });
    }

    await transaction.commit();

    // Emitir automáticamente Orden de Ajuste en BlockWMS para Decomisos:
    // Bajas ID 55 ("Decomiso")
    try {
      const wmsItems = [];
      for (const item of items) {
        const valKilos = parseFloat(item.kilos) || 0;
        if (item.codigo && valKilos > 0) {
          wmsItems.push({
            codigoProducto: item.codigo,
            cantidad: valKilos,
            operador: 'resta',
            idMotivo: '55' // 55 = Decomiso
          });
        }
      }

      if (wmsItems.length > 0) {
        const wmsCreds = {
          sessionId: req.headers['x-wms-session-id'] || req.body?.sessionId || '',
          siteId: req.headers['x-wms-site-id'] || req.body?.siteId || '194326',
          host: req.headers['x-wms-host'] || req.body?.host || 'http://192.168.10.2'
        };

        wmsService.ejecutarAjusteMultipleWMS({
          items: wmsItems,
          observaciones: `Baja por Decomiso (Comprobante: ${comprobante})`,
          ...wmsCreds
        }).then(resWms => {
          console.log(`[WMS-Decomisos] Orden de ajuste #${resWms.idOrdenes} generada en BlockWMS.`);
        }).catch(errWms => {
          console.warn('[WMS-Decomisos] Advertencia al emitir orden en BlockWMS:', errWms.message);
        });
      }
    } catch (errWms) {
      console.warn('[WMS-Decomisos] Error WMS:', errWms.message);
    }

    res.json({
      mensaje: 'Lote de decomisos descontado exitosamente',
      detalles: resultDetails
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al descontar lote de decomisos:', error);
    res.status(500).json({ error: 'Error interno al descontar el lote de decomisos.' });
  }
};

// Ingresar recortes desde el formulario externo (Recepcion/Ingresos de Recortes)
exports.ingresarRecorte = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { codigo, peso, sucursal, fecha } = req.body;

    if (!codigo || peso === undefined || peso === null) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El código del producto y el peso son obligatorios' });
    }

    const valorPeso = parseFloat(peso);
    if (isNaN(valorPeso) || valorPeso <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El peso debe ser un número mayor a cero' });
    }

    // 1. Buscar el producto
    const producto = await Producto.findByPk(codigo, { transaction });
    if (!producto) {
      await transaction.rollback();
      return res.status(404).json({ error: `El producto con código ${codigo} no existe en el catálogo.` });
    }

    // 2. Incrementar el campo recorte en ProductoStock de la ubicación
    const [prodStock, created] = await ProductoStock.findOrCreate({
      where: { codigo_producto: codigo, id_ubicacion: req.ubicacionId },
      defaults: { stock: 0.0000, recorte: 0.000, decomiso: 0.000, kg_fraccionados: 0.000 },
      transaction
    });

    prodStock.recorte = (parseFloat(prodStock.recorte) || 0) + valorPeso;
    await prodStock.save({ 
      transaction,
      tipo_movimiento: 'INGRESO_RECORTE',
      concepto: `Ingreso de recortes desde sucursal ${sucursal || 'Desconocida'}`
    });

    // Buscar el generador correspondiente a la sucursal
    let generadorId = null;
    if (sucursal) {
      const suc = await Sucursal.findOne({
        where: { sucursal: sucursal },
        transaction
      });
      if (suc) {
        const gen = await Generador.findOne({
          where: { tipo: 'sucursal', id_asociado: suc.id },
          transaction
        });
        if (gen) generadorId = gen.id;
      }
    }

    // 3. Crear un registro en la tabla de procesos como trazabilidad histórica
    await Proceso.create({
      generador_id: generadorId,
      proceso: 'Ingreso de Recorte',
      fecha: fecha || new Date(),
      codigo: codigo,
      piezas: 0,
      peso_bruto: 0,
      recorte: valorPeso,
      decomiso: 0,
      kg_a_desc: 0,
      kg_a_sumar: 0
    }, { transaction });

    await transaction.commit();

    res.json({
      mensaje: 'Recorte ingresado y stock actualizado exitosamente',
      producto: {
        codigo: producto.codigo,
        nombre: producto.nombre,
        kg_recorte_nuevo: parseFloat(prodStock.recorte) || 0
      }
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al ingresar recorte:', error);
    res.status(500).json({ error: 'Error interno al registrar el ingreso de recorte' });
  }
};

// Carga masiva de stock desde Excel (suma peso a stock)
exports.cargarStockExcel = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    if (!req.file) {
      await transaction.rollback();
      return res.status(400).json({ error: 'No se envió ningún archivo Excel.' });
    }

    const xlsx = require('xlsx');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = xlsx.utils.sheet_to_json(sheet);
    if (data.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El archivo Excel está vacío.' });
    }

    let procesados = 0;
    let omitidos = 0;
    const detalles = [];
    const errores = [];
    const codigosPresentes = [];

    for (const row of data) {
      const codigo = row['codigo_productos'] || row['codigo_producto'] || row['Codigo_productos'] || row['Codigo_producto'] || row['CODIGO_PRODUCTOS'] || row['CODIGO_PRODUCTO'] || row['Codigo'] || row['codigo'] || row['CODIGO'] || row['Código'] || row['Cod'] || row['cod'] || row['COD'];
      const peso = row['cantidad_fisica'] || row['Cantidad_fisica'] || row['CANTIDAD_FISICA'] || row['Peso'] || row['peso'] || row['PESO'] || row['Kilos'] || row['kilos'] || row['KILOS'] || row['kg'] || row['Kg'];

      if (!codigo) {
        omitidos++;
        continue;
      }

      let valorPeso = parseFloat(peso);
      if (isNaN(valorPeso)) {
        valorPeso = 0;
      }

      const codigoStr = String(codigo).trim();

      // Buscar el producto
      const producto = await Producto.findByPk(codigoStr, { transaction });
      if (!producto) {
        errores.push(`Código ${codigoStr}: producto no encontrado`);
        omitidos++;
        continue;
      }

      const ean = row['codigo_ean'] || row['Codigo_ean'] || row['Codigo_Ean'] || row['CODIGO_EAN'] || row['ean'] || row['EAN'] || row['Ean'] || row['Código EAN'] || row['codigo ean'] || row['Codigo Ean'] || row['código ean'] || row['CÓDIGO EAN'] || row['codigo_barra'] || row['codigo barra'];
      const dest = row['destacado'] || row['Destacado'] || row['DESTACADO'];
      const pes = row['pesable'] || row['Pesable'] || row['PESABLE'];

      if (ean !== undefined && ean !== null) {
        producto.codigo_barra = String(ean).trim();
      }
      if (dest !== undefined && dest !== null) {
        producto.destacado = dest === true || String(dest).toLowerCase().trim() === 'true' || parseInt(dest, 10) === 1;
      }
      if (pes !== undefined && pes !== null) {
        producto.pesable = pes === true || String(pes).toLowerCase().trim() === 'true' || parseInt(pes, 10) === 1;
      } else {
        producto.pesable = !/(?:\d+\s*X|X\s*\d+)(?![\s\d\.]*k)/i.test(producto.nombre);
      }

      // Reemplazar stock en ProductoStock para la ubicación activa, y activar el producto
      const id_ubicacion = req.ubicacionId;
      const [prodStock, created] = await ProductoStock.findOrCreate({
        where: { codigo_producto: codigoStr, id_ubicacion },
        defaults: { stock: 0.0000 },
        transaction
      });
      prodStock.stock = valorPeso;
      await prodStock.save({
        transaction,
        tipo_movimiento: 'AJUSTE_DIRECTO',
        concepto: 'Actualización masiva de stock y activación desde Excel'
      });

      producto.activo = true;
      await producto.save({ transaction });

      detalles.push({
        codigo: codigoStr,
        nombre: producto.nombre,
        peso_sumado: valorPeso,
        stock_nuevo: valorPeso,
        kilos_calculado_nuevo: valorPeso,
        activo: true
      });

      codigosPresentes.push(codigoStr);
      procesados++;
    }

    // Poner en 0 los stock y deactivar los productos que NO estaban en el Excel
    const { Op } = require('sequelize');
    const whereCondition = codigosPresentes.length > 0
      ? { codigo: { [Op.notIn]: codigosPresentes } }
      : {};

    await Producto.update({
      stock: 0,
      kilos_calculado: 0,
      activo: false
    }, {
      where: whereCondition,
      transaction,
      individualHooks: true,
      tipo_movimiento: 'AJUSTE_DIRECTO',
      concepto: 'Desactivación y puesta a 0 de stock por no estar presente en el Excel de stock'
    });

    await transaction.commit();

    res.json({
      mensaje: `Carga de stock procesada. ${procesados} producto(s) actualizados, ${omitidos} fila(s) omitidas.`,
      procesados,
      omitidos,
      errores: errores.length > 0 ? errores : undefined,
      detalles
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al cargar stock desde Excel:', error);
    res.status(500).json({ error: 'Error interno al procesar la carga de stock.' });
  }
};

exports.obtenerVencimientosCercanos = async (req, res) => {
  try {
    const id_ubicacion = req.ubicacionId;
    const vencimientos = await ProductoVencimiento.findAll({
      where: { id_ubicacion },
      include: [
        {
          model: Producto,
          as: 'producto',
          attributes: ['nombre', 'peso_pieza'],
          include: [{
            model: ProductoStock,
            as: 'Stocks',
            where: { id_ubicacion },
            required: false
          }]
        }
      ],
      order: [['vencimiento', 'ASC']]
    });

    const mapped = vencimientos.map(v => {
      const json = v.toJSON();
      if (json.producto) {
        const stockObj = json.producto.Stocks && json.producto.Stocks[0] ? json.producto.Stocks[0] : null;
        json.producto.stock = stockObj ? parseFloat(stockObj.stock) : 0.0000;
      }
      return json;
    });

    res.json(mapped);
  } catch (error) {
    console.error('Error al obtener vencimientos cercanos:', error);
    res.status(500).json({ error: 'Error al obtener los vencimientos' });
  }
};

// Registrar ingreso de piezas y kilos desde proveedor con vencimiento
exports.ingresarProveedor = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let { codigo, piezas, vencimiento, proveedor_id, peso, usuario, bulto_id, cantidad_bultos } = req.body;

    if (bulto_id) {
      const { Bulto } = require('../models');
      const bultoObj = await Bulto.findByPk(bulto_id, { transaction });
      if (!bultoObj) {
        await transaction.rollback();
        return res.status(404).json({ error: `El bulto con ID ${bulto_id} no existe.` });
      }
      codigo = bultoObj.codigo_producto;
      proveedor_id = bultoObj.id_proveedor;
      piezas = parseInt(cantidad_bultos, 10) * bultoObj.cantidad_piezas;

      const pesoBruto = parseFloat(peso);
      const taraCajas = parseInt(cantidad_bultos, 10) * parseFloat(bultoObj.peso_caja_vacia || 0);

      if (!isNaN(pesoBruto) && pesoBruto > 0) {
        // Peso neto = peso bruto - tara
        peso = Math.max(0, pesoBruto - taraCajas);
      } else {
        // Fallback: peso aproximado neto
        const pesoReferenciaNeto = Math.max(0, parseFloat(bultoObj.peso_caja || 0) - parseFloat(bultoObj.peso_caja_vacia || 0));
        peso = parseInt(cantidad_bultos, 10) * pesoReferenciaNeto;
      }
    }

    if (!codigo || piezas === undefined || piezas === null || !vencimiento || !proveedor_id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El código del producto, la cantidad de piezas, el proveedor y la fecha de vencimiento son obligatorios.' });
    }

    const valorPiezas = parseInt(piezas, 10);
    if (isNaN(valorPiezas) || valorPiezas <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'La cantidad de piezas debe ser un número entero mayor a cero.' });
    }

    // 1. Buscar el producto
    const producto = await Producto.findByPk(codigo, { transaction });
    if (!producto) {
      await transaction.rollback();
      return res.status(404).json({ error: `El producto con código ${codigo} no existe en el catálogo.` });
    }

    // Validar el proveedor
    const prov = await Proveedor.findByPk(proveedor_id, { transaction });
    if (!prov) {
      await transaction.rollback();
      return res.status(400).json({ error: `El proveedor con ID ${proveedor_id} no existe.` });
    }

    // Buscar su generador polimórfico
    const gen = await Generador.findOne({
      where: { tipo: 'proveedor', id_asociado: proveedor_id },
      transaction
    });
    if (!gen) {
      await transaction.rollback();
      return res.status(400).json({ error: `No se encontró el generador asociado para el proveedor.` });
    }

    // Peso ingresado manualmente o calculado como fallback si no se provee
    let kilosASumar = parseFloat(peso);
    if (isNaN(kilosASumar) || kilosASumar < 0) {
      kilosASumar = valorPiezas * (parseFloat(producto.peso_pieza) || 0);
    }

    if (isNaN(valorPiezas) || valorPiezas <= 0) {
      const pxp = parseFloat(producto.peso_pieza) || 0;
      valorPiezas = (pxp > 0 && kilosASumar >= pxp) ? Math.round(kilosASumar / pxp) : 0;
    }

    const id_ubicacion = req.ubicacionId;

    // 2. Crear la fila de auditoría persistente en la tabla ingreso_proveedores
    const nuevoIngreso = await IngresoProveedor.create({
      id_ubicacion,
      proveedor_id: proveedor_id,
      codigo_producto: codigo,
      piezas: 0,
      vencimiento: vencimiento,
      peso_calculado: kilosASumar,
      bulto_id: bulto_id || null,
      cantidad_bultos: cantidad_bultos || null,
      fecha: new Date()
    }, { transaction });

    // 3. Buscar o crear el vencimiento en la tabla de producto_vencimientos (PRIMERO)
    let prodVencimiento = await ProductoVencimiento.findOne({
      where: {
        codigo_producto: codigo,
        vencimiento: vencimiento,
        id_ubicacion
      },
      transaction
    });

    if (prodVencimiento) {
      prodVencimiento.piezas = 0;
      prodVencimiento.peso = (parseFloat(prodVencimiento.peso) || 0) + kilosASumar;
      await prodVencimiento.save({ transaction });
    } else {
      prodVencimiento = await ProductoVencimiento.create({
        codigo_producto: codigo,
        vencimiento: vencimiento,
        piezas: 0,
        peso: kilosASumar,
        id_ubicacion
      }, { transaction });
    }

    const [prodStock, created] = await ProductoStock.findOrCreate({
      where: { codigo_producto: codigo, id_ubicacion },
      defaults: { stock: 0.0000, recorte: 0.000, decomiso: 0.000, kg_fraccionados: 0.000 },
      transaction
    });
    prodStock.stock = (parseFloat(prodStock.stock) || 0) + kilosASumar;
    await prodStock.save({
      transaction,
      skipAuditLog: true
    });

    let conceptoMovimiento = `Ingreso de ${valorPiezas} piezas (${kilosASumar.toFixed(3)} kg) de proveedor ${prov.nombre} (vence ${vencimiento})`;
    if (bulto_id) {
      const { Bulto } = require('../models');
      const bultoObjForLog = await Bulto.findByPk(bulto_id, { transaction });
      const bultoNombre = bultoObjForLog ? bultoObjForLog.nombre : `Bulto #${bulto_id}`;
      conceptoMovimiento = `Ingreso por Bultos (${cantidad_bultos} bulto/s "${bultoNombre}", total ${valorPiezas} pz, ${kilosASumar.toFixed(3)} kg) de proveedor ${prov.nombre} (vence ${vencimiento})`;
    }

    // 5. Crear manualmente el registro en MovimientoStock con el delta real
    const { MovimientoStock } = sequelize.models;
    await MovimientoStock.create({
      codigo_producto: codigo,
      id_ubicacion: id_ubicacion,
      tipo_movimiento: 'INGRESO_PROVEEDOR',
      referencia_id: nuevoIngreso.id,
      concepto: conceptoMovimiento,
      cantidad_piezas: 0,
      stock: kilosASumar,
      kilos_calculado: kilosASumar,
      kg_fraccionados: 0,
      kg_recorte: 0,
      kg_decomiso: 0,
      usuario: usuario || 'Sistema',
      fecha: new Date()
    }, { transaction });

    // 6. Crear un registro en la tabla de procesos como trazabilidad complementaria en el historial general
    await Proceso.create({
      id_ubicacion,
      generador_id: gen.id,
      proceso: 'Ingreso Proveedor',
      fecha: new Date(),
      codigo: codigo,
      piezas: 0,
      peso_bruto: kilosASumar,
      recorte: 0,
      decomiso: 0,
      kg_a_desc: 0,
      kg_a_sumar: kilosASumar
    }, { transaction });

    await transaction.commit();

    // Volver a cargar el ingreso con el Proveedor
    const ingresoConRelacion = await IngresoProveedor.findByPk(nuevoIngreso.id, {
      include: [
        { model: Producto, as: 'Producto', attributes: ['nombre'] },
        { model: Proveedor, as: 'Proveedor', attributes: ['nombre'] }
      ]
    });

    res.status(201).json({
      mensaje: 'Ingreso de proveedor procesado y persistido exitosamente',
      ingreso: ingresoConRelacion,
      producto: await Producto.findByPk(codigo, {
        include: [{ model: ProductoVencimiento, as: 'vencimientosList', where: { id_ubicacion }, required: false }]
      })
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al ingresar piezas de proveedor:', error);
    res.status(500).json({ error: 'Error interno al registrar el ingreso del proveedor' });
  }
};

// Registrar ingreso en lote (varios ítems) desde proveedor con vencimiento y número de factura
exports.ingresarProveedorLote = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { proveedor_id, nro_factura, usuario, items } = req.body;

    if (!proveedor_id) {
      if (!transaction.finished) await transaction.rollback();
      return res.status(400).json({ error: 'El proveedor es obligatorio.' });
    }

    if (!nro_factura) {
      if (!transaction.finished) await transaction.rollback();
      return res.status(400).json({ error: 'El número de factura/lote/recepción es obligatorio.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      if (!transaction.finished) await transaction.rollback();
      return res.status(400).json({ error: 'Debe ingresar al menos un artículo.' });
    }

    // Validar el proveedor
    const prov = await Proveedor.findByPk(proveedor_id, { transaction });
    if (!prov) {
      if (!transaction.finished) await transaction.rollback();
      return res.status(400).json({ error: `El proveedor con ID ${proveedor_id} no existe.` });
    }

    // Buscar su generador polimórfico
    const gen = await Generador.findOne({
      where: { tipo: 'proveedor', id_asociado: proveedor_id },
      transaction
    });
    if (!gen) {
      if (!transaction.finished) await transaction.rollback();
      return res.status(400).json({ error: `No se encontró el generador asociado para el proveedor.` });
    }

    const { Bulto, MovimientoStock } = require('../models');

    const ingresosRegistrados = [];

    for (const item of items) {
      let { codigo, piezas, vencimiento, peso, bulto_id, cantidad_bultos, tipo } = item;

      let bultoObj = null;

      if (tipo === 'bulto') {
        if (!bulto_id) {
          if (!transaction.finished) await transaction.rollback();
          return res.status(400).json({ error: 'El tipo de bulto es obligatorio para los ítems tipo bulto.' });
        }
        bultoObj = await Bulto.findByPk(bulto_id, { transaction });
        if (!bultoObj) {
          if (!transaction.finished) await transaction.rollback();
          return res.status(404).json({ error: `El bulto con ID ${bulto_id} no existe.` });
        }
        codigo = bultoObj.codigo_producto;
        piezas = parseInt(cantidad_bultos, 10) * bultoObj.cantidad_piezas;

        const pesoBruto = parseFloat(peso);
        const taraCajas = parseInt(cantidad_bultos, 10) * parseFloat(bultoObj.peso_caja_vacia || 0);

        if (!isNaN(pesoBruto) && pesoBruto > 0) {
          peso = Math.max(0, pesoBruto - taraCajas);
        } else {
          const pesoReferenciaNeto = Math.max(0, parseFloat(bultoObj.peso_caja || 0) - parseFloat(bultoObj.peso_caja_vacia || 0));
          peso = parseInt(cantidad_bultos, 10) * pesoReferenciaNeto;
        }
      }

      if (!codigo || !vencimiento) {
        if (!transaction.finished) await transaction.rollback();
        return res.status(400).json({ error: 'El código del producto y la fecha de vencimiento son obligatorios para todos los ítems.' });
      }

      let valorPiezas = parseInt(piezas, 10) || 0;

      // Buscar el producto
      const producto = await Producto.findByPk(codigo, { transaction });
      if (!producto) {
        if (!transaction.finished) await transaction.rollback();
        return res.status(404).json({ error: `El producto con código ${codigo} no existe en el catálogo.` });
      }

      let kilosASumar = parseFloat(peso);
      if (isNaN(kilosASumar) || kilosASumar < 0) {
        kilosASumar = (!isNaN(valorPiezas) && valorPiezas > 0) ? valorPiezas * (parseFloat(producto.peso_pieza) || 0) : 0;
      }

      if (isNaN(valorPiezas) || valorPiezas <= 0) {
        const pxp = parseFloat(producto.peso_pieza) || 0;
        valorPiezas = (pxp > 0 && kilosASumar >= pxp) ? Math.round(kilosASumar / pxp) : 0;
      }

      if (!codigo || !vencimiento) {
        if (!transaction.finished) await transaction.rollback();
        return res.status(400).json({ error: 'El código del producto y la fecha de vencimiento son obligatorios para todos los ítems.' });
      }

      const id_ubicacion = req.ubicacionId;

      // Crear la fila de auditoría persistente
      const nuevoIngreso = await IngresoProveedor.create({
        id_ubicacion,
        proveedor_id: proveedor_id,
        codigo_producto: codigo,
        piezas: 0,
        vencimiento: vencimiento,
        peso_calculado: kilosASumar,
        bulto_id: tipo === 'bulto' ? bulto_id : null,
        cantidad_bultos: tipo === 'bulto' ? cantidad_bultos : null,
        nro_factura: nro_factura,
        fecha: new Date()
      }, { transaction });

      // Buscar o crear el vencimiento
      let prodVencimiento = await ProductoVencimiento.findOne({
        where: {
          codigo_producto: codigo,
          vencimiento: vencimiento,
          id_ubicacion
        },
        transaction
      });

      if (prodVencimiento) {
        prodVencimiento.piezas = 0;
        prodVencimiento.peso = (parseFloat(prodVencimiento.peso) || 0) + kilosASumar;
        await prodVencimiento.save({ transaction });
      } else {
        prodVencimiento = await ProductoVencimiento.create({
          codigo_producto: codigo,
          vencimiento: vencimiento,
          piezas: 0,
          peso: kilosASumar,
          id_ubicacion
        }, { transaction });
      }

      const [prodStock, created] = await ProductoStock.findOrCreate({
        where: { codigo_producto: codigo, id_ubicacion },
        defaults: { stock: 0.0000, recorte: 0.000, decomiso: 0.000, kg_fraccionados: 0.000 },
        transaction
      });
      prodStock.stock = (parseFloat(prodStock.stock) || 0) + kilosASumar;
      await prodStock.save({
        transaction,
        skipAuditLog: true
      });

      let conceptoMovimiento = `Ingreso de ${valorPiezas} piezas (${kilosASumar.toFixed(3)} kg) de proveedor ${prov.nombre} (vence ${vencimiento}, Factura: ${nro_factura})`;
      if (tipo === 'bulto') {
        const bultoNombre = bultoObj ? bultoObj.nombre : `Bulto #${bulto_id}`;
        conceptoMovimiento = `Ingreso por Bultos (${cantidad_bultos} bulto/s "${bultoNombre}", total ${valorPiezas} pz, ${kilosASumar.toFixed(3)} kg) de proveedor ${prov.nombre} (vence ${vencimiento}, Factura: ${nro_factura})`;
      }

      // Crear movimiento de stock
      await MovimientoStock.create({
        codigo_producto: codigo,
        id_ubicacion: id_ubicacion,
        tipo_movimiento: 'INGRESO_PROVEEDOR',
        referencia_id: nuevoIngreso.id,
        concepto: conceptoMovimiento,
        cantidad_piezas: 0,
        stock: kilosASumar,
        kilos_calculado: kilosASumar,
        kg_fraccionados: 0,
        kg_recorte: 0,
        kg_decomiso: 0,
        usuario: usuario || 'Sistema',
        fecha: new Date()
      }, { transaction });

      // Crear proceso de trazabilidad
      await Proceso.create({
        id_ubicacion,
        generador_id: gen.id,
        proceso: 'Ingreso Proveedor',
        fecha: new Date(),
        codigo: codigo,
        piezas: 0,
        peso_bruto: kilosASumar,
        recorte: 0,
        decomiso: 0,
        kg_a_desc: 0,
        kg_a_sumar: kilosASumar
      }, { transaction });

      ingresosRegistrados.push(nuevoIngreso.id);
    }

    await transaction.commit();

    // Obtener los ingresos guardados con sus relaciones para la respuesta
    const ingresosConRelacion = await IngresoProveedor.findAll({
      where: { id: ingresosRegistrados },
      include: [
        { model: Producto, as: 'Producto', attributes: ['nombre'] },
        { model: Proveedor, as: 'Proveedor', attributes: ['nombre'] }
      ]
    });

    res.status(201).json({
      mensaje: `Lote de ingreso de proveedor procesado con éxito (${ingresosConRelacion.length} artículos).`,
      ingresos: ingresosConRelacion
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al registrar ingreso en lote de proveedor:', error);
    res.status(500).json({ error: 'Error interno al registrar el ingreso en lote del proveedor' });
  }
};

// Obtener todos los ingresos de proveedores para trazabilidad en el historial
exports.obtenerIngresosProveedores = async (req, res) => {
  try {
    const id_ubicacion = req.ubicacionId;
    const { Op } = require('sequelize');
    const whereClause = id_ubicacion ? { [Op.or]: [{ id_ubicacion }, { id_ubicacion: null }] } : {};

    const ingresos = await IngresoProveedor.findAll({
      where: whereClause,
      include: [
        {
          model: Producto,
          as: 'Producto',
          attributes: ['codigo', 'nombre']
        },
        {
          model: Proveedor,
          as: 'Proveedor',
          attributes: ['id', 'nombre']
        },
        {
          model: Bulto,
          as: 'Bulto',
          attributes: ['id', 'nombre', 'cantidad_piezas']
        }
      ],
      order: [['fecha', 'DESC'], ['id', 'DESC']]
    });
    res.json(ingresos);
  } catch (error) {
    console.error('Error al obtener ingresos de proveedores:', error);
    res.status(500).json({ error: 'Error al obtener los ingresos de proveedores' });
  }
};

// Obtener historial completo de movimientos de stock con nombres de producto
exports.obtenerMovimientosStock = async (req, res) => {
  try {
    const { MovimientoStock, Producto } = require('../models');
    const id_ubicacion = req.ubicacionId;
    const movimientos = await MovimientoStock.findAll({
      where: { id_ubicacion },
      include: [
        {
          model: Producto,
          as: 'Producto',
          attributes: ['nombre']
        }
      ],
      order: [['fecha', 'DESC'], ['id', 'DESC']]
    });
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener movimientos de stock:', error);
    res.status(500).json({ error: 'Error interno al obtener movimientos de stock' });
  }
};

// Obtener movimientos de stock para un producto específico
exports.obtenerMovimientosPorProducto = async (req, res) => {
  try {
    const { codigo } = req.params;
    const id_ubicacion = req.ubicacionId;
    const { MovimientoStock } = require('../models');
    const movimientos = await MovimientoStock.findAll({
      where: { codigo_producto: codigo, id_ubicacion },
      order: [['fecha', 'ASC'], ['id', 'ASC']]
    });
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener movimientos por producto:', error);
    res.status(500).json({ error: 'Error interno al obtener movimientos por producto' });
  }
};

// Obtener todos los snapshots de stock
exports.obtenerSnapshots = async (req, res) => {
  try {
    const { StockSnapshot } = require('../models');
    const snapshots = await StockSnapshot.findAll({
      order: [['fecha_corte', 'DESC'], ['id', 'DESC']]
    });
    res.json(snapshots);
  } catch (error) {
    console.error('Error al obtener snapshots de stock:', error);
    res.status(500).json({ error: 'Error interno al obtener snapshots de stock' });
  }
};

// Obtener sucursales habilitadas para un producto
exports.obtenerSucursalesHabilitadas = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { SucursalProductoPermiso } = require('../models');
    const permisos = await SucursalProductoPermiso.findAll({
      where: { codigo_producto: codigo },
      attributes: ['id_sucursal']
    });
    const ids = permisos.map(p => p.id_sucursal);
    res.json(ids);
  } catch (error) {
    console.error('Error al obtener sucursales habilitadas:', error);
    res.status(500).json({ error: 'Error al obtener sucursales habilitadas' });
  }
};

// Helper para sincronizar sucursales habilitadas para un producto
const syncSucursalesHabilitadas = async (codigoProducto, sucursalIds, transaction) => {
  const { SucursalProductoPermiso } = require('../models');
  // 1. Eliminar permisos anteriores para este producto
  await SucursalProductoPermiso.destroy({
    where: { codigo_producto: codigoProducto },
    transaction
  });

  // 2. Insertar nuevos permisos si hay sucursales seleccionadas
  if (Array.isArray(sucursalIds) && sucursalIds.length > 0) {
    const records = sucursalIds.map(id_sucursal => ({
      id_sucursal,
      codigo_producto: codigoProducto
    }));
    await SucursalProductoPermiso.bulkCreate(records, { transaction });
  }
};

exports.controlPiezas = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id_ubicacion = req.ubicacionId;
    const { auditorias } = req.body; // Array de { codigo_producto, lotes: [{ id, vencimiento, piezas }] }
    const usuario = req.usuario?.nombre || 'Sistema';

    if (!Array.isArray(auditorias) || auditorias.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Listado de auditorías no válido o vacío.' });
    }

    const { Producto, ProductoStock, ProductoVencimiento, MovimientoStock } = require('../models');

    const resultReport = [];

    for (const aud of auditorias) {
      const { codigo_producto, lotes } = aud;

      const producto = await Producto.findByPk(codigo_producto, { transaction });
      if (!producto) {
        await transaction.rollback();
        return res.status(404).json({ error: `Producto con código ${codigo_producto} no encontrado.` });
      }

      // Obtener stock de kilos
      const [pStockRecord, created] = await ProductoStock.findOrCreate({
        where: { codigo_producto, id_ubicacion },
        defaults: { stock: 0.0000, recorte: 0.000, decomiso: 0.000, kg_fraccionados: 0.000 },
        transaction
      });

      // Obtener vencimientos actuales para calcular el delta original de piezas
      const currentVencimientos = await ProductoVencimiento.findAll({
        where: { codigo_producto, id_ubicacion },
        transaction
      });

      const pesoXPieza = parseFloat(producto.peso_pieza) || 0;

      const originalPiecesTotal = currentVencimientos.reduce((sum, v) => {
        const pL = parseFloat(v.peso) || 0;
        const est = (pL <= 0 || pesoXPieza <= 0 || pL < pesoXPieza) ? 0 : Math.round(pL / pesoXPieza);
        return sum + est;
      }, 0);

      // Eliminar lotes actuales que NO vienen en la auditoría (o que vienen con piezas = 0)
      for (const curV of currentVencimientos) {
        const matchingIncoming = lotes.find(l => l.id && parseInt(l.id, 10) === curV.id);
        if (!matchingIncoming || (parseInt(matchingIncoming.piezas, 10) || 0) <= 0) {
          const oldPeso = parseFloat(curV.peso) || 0;
          if (oldPeso > 0) {
            await MovimientoStock.create({
              codigo_producto,
              id_ubicacion,
              tipo_movimiento: 'AUDITORIA_PIEZAS',
              concepto: `Auditoría: Eliminación de lote vencimiento ${curV.vencimiento}`,
              cantidad_piezas: 0,
              stock: -oldPeso,
              kilos_calculado: -oldPeso,
              usuario
            }, { transaction });
          }
          await curV.destroy({ transaction });
        }
      }

      // Actualizar o crear los lotes entrantes
      let auditedPiecesTotal = 0;

      for (const incomingL of lotes) {
        const incomingPieces = parseInt(incomingL.piezas, 10) || 0;
        if (incomingPieces <= 0) continue;

        auditedPiecesTotal += incomingPieces;
        const pesoLote = incomingPieces * pesoXPieza;

        if (incomingL.id) {
          const existingV = currentVencimientos.find(v => v.id === parseInt(incomingL.id, 10));
          if (existingV) {
            const oldPeso = parseFloat(existingV.peso) || 0;
            const oldDate = existingV.vencimiento;
            const hasChanges = oldPeso !== pesoLote || oldDate !== incomingL.vencimiento;

            if (hasChanges) {
              existingV.piezas = 0;
              existingV.peso = pesoLote;
              existingV.vencimiento = incomingL.vencimiento;
              await existingV.save({ transaction });

              await MovimientoStock.create({
                codigo_producto,
                id_ubicacion,
                tipo_movimiento: 'AUDITORIA_PIEZAS',
                concepto: `Auditoría: Lote modificado (${oldDate} -> ${incomingL.vencimiento}, peso: ${oldPeso.toFixed(3)} -> ${pesoLote.toFixed(3)} kg)`,
                cantidad_piezas: 0,
                stock: pesoLote - oldPeso,
                kilos_calculado: pesoLote - oldPeso,
                usuario
              }, { transaction });
            }
          }
        } else {
          await ProductoVencimiento.create({
            codigo_producto,
            id_ubicacion,
            vencimiento: incomingL.vencimiento,
            piezas: 0,
            peso: pesoLote
          }, { transaction });

          await MovimientoStock.create({
            codigo_producto,
            id_ubicacion,
            tipo_movimiento: 'AUDITORIA_PIEZAS',
            concepto: `Auditoría: Nuevo lote vencimiento ${incomingL.vencimiento} (${incomingPieces} pzs aprox -> ${pesoLote.toFixed(3)} kg)`,
            cantidad_piezas: 0,
            stock: pesoLote,
            kilos_calculado: pesoLote,
            usuario
          }, { transaction });
        }
      }

      const deltaPiezas = auditedPiecesTotal - originalPiecesTotal;
      let deltaKilos = 0;

      if (deltaPiezas !== 0) {
        if (pesoXPieza > 0) {
          deltaKilos = deltaPiezas * pesoXPieza;
          const originalStock = parseFloat(pStockRecord.stock) || 0;
          pStockRecord.stock = Math.max(0, originalStock + deltaKilos);
          await pStockRecord.save({
            transaction,
            skipAuditLog: true
          });

          await MovimientoStock.create({
            codigo_producto,
            id_ubicacion,
            tipo_movimiento: 'AUDITORIA_PIEZAS',
            concepto: `Auditoría: Ajuste neto de stock por variación de piezas (${deltaPiezas} piezas -> ${deltaKilos.toFixed(3)} kg)`,
            cantidad_piezas: 0,
            stock: deltaKilos,
            kilos_calculado: deltaKilos,
            usuario
          }, { transaction });
        }
      }

      resultReport.push({
        codigo: codigo_producto,
        nombre: producto.nombre,
        piezasOriginales: originalPiecesTotal,
        piezasAuditadas: auditedPiecesTotal,
        deltaPiezas,
        deltaKilos
      });
    }

    await transaction.commit();

    res.json({
      mensaje: 'Auditoría de piezas guardada correctamente en la base de datos',
      reporte: resultReport
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error en controlPiezas:', error);
    res.status(500).json({ error: 'Error interno al guardar la auditoría de piezas.' });
  }
};

// Actualizar un lote de vencimiento (codigo_producto, peso, vencimiento)
exports.actualizarVencimiento = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { codigo_producto, peso, vencimiento } = req.body;
    const id_ubicacion = req.ubicacionId;

    const lote = await ProductoVencimiento.findOne({
      where: { id, id_ubicacion },
      transaction
    });

    if (!lote) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Lote de vencimiento no encontrado.' });
    }

    const prodCode = codigo_producto || lote.codigo_producto;
    const producto = await Producto.findByPk(prodCode, { transaction });
    if (!producto) {
      await transaction.rollback();
      return res.status(404).json({ error: `El producto ${prodCode} no existe en el catálogo.` });
    }

    const pesoVal = parseFloat(peso !== undefined ? peso : lote.peso) || 0;
    const pxp = parseFloat(producto.peso_pieza) || 0;
    const valPiezas = (pesoVal > 0 && pxp > 0 && pesoVal >= pxp) ? Math.round(pesoVal / pxp) : 0;

    lote.codigo_producto = prodCode;
    lote.peso = pesoVal;
    lote.piezas = valPiezas;
    if (vencimiento) {
      lote.vencimiento = vencimiento;
    }

    await lote.save({ transaction });
    await transaction.commit();

    const loteActualizado = await ProductoVencimiento.findByPk(id, {
      include: [{
        model: Producto,
        as: 'producto',
        attributes: ['nombre', 'peso_pieza'],
        include: [{
          model: ProductoStock,
          as: 'Stocks',
          where: { id_ubicacion },
          required: false
        }]
      }]
    });

    if (loteActualizado && loteActualizado.producto) {
      const stockObj = loteActualizado.producto.Stocks && loteActualizado.producto.Stocks[0] ? loteActualizado.producto.Stocks[0] : null;
      loteActualizado.producto.stock = stockObj ? parseFloat(stockObj.stock) : 0.0000;
    }

    res.json({
      mensaje: 'Lote de vencimiento actualizado correctamente.',
      vencimiento: loteActualizado
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error('Error al actualizar vencimiento:', error);
    res.status(500).json({ error: 'Error interno al actualizar lote de vencimiento.' });
  }
};

// Eliminar un lote de vencimiento
exports.eliminarVencimiento = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const id_ubicacion = req.ubicacionId;

    const lote = await ProductoVencimiento.findOne({
      where: { id, id_ubicacion },
      transaction
    });

    if (!lote) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Lote de vencimiento no encontrado.' });
    }

    await lote.destroy({ transaction });
    await transaction.commit();

    res.json({ mensaje: 'Lote de vencimiento eliminado correctamente.' });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error('Error al eliminar vencimiento:', error);
    res.status(500).json({ error: 'Error interno al eliminar lote de vencimiento.' });
  }
};

