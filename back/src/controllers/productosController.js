const { Producto, sequelize } = require('../models');

// Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll();
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Crear un nuevo producto
exports.crearProducto = async (req, res) => {
  try {
    const { 
      codigo, nombre, kilos_block, peso_x_pieza, cantidad_piezas, 
      vencimientos, kg_x_bolsita, kg_fraccionados, kg_decomiso, kg_recorte 
    } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'codigo y nombre son obligatorios' });
    }

    const existe = await Producto.findByPk(codigo);
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un producto con ese código' });
    }

    const nuevoProducto = await Producto.create({
      codigo,
      nombre,
      kilos_block,
      peso_x_pieza,
      cantidad_piezas,
      vencimientos,
      kg_x_bolsita,
      kg_fraccionados,
      kg_decomiso,
      kg_recorte
    });

    res.status(201).json({
      mensaje: 'Producto creado exitosamente',
      producto: nuevoProducto
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear el producto' });
  }
};

// Actualizar producto
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params; // codigo
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await producto.update(req.body);

    res.json({
      mensaje: 'Producto actualizado exitosamente',
      producto
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
};

// Eliminar producto
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await producto.destroy();

    res.json({ mensaje: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar el producto' });
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
      productosData = data.map(row => ({
        codigo: row['Codigo'] || row['codigo'] || String(row['Código']),
        nombre: row['Nombre'] || row['nombre'],
        kilos_block: parseFloat(row['Kilos Block'] || row['kilos_block'] || 0),
        peso_x_pieza: parseFloat(row['Peso x Pieza'] || row['peso_x_pieza'] || 0),
        cantidad_piezas: parseInt(row['Cantidad Piezas'] || row['cantidad_piezas'] || 0, 10),
        vencimientos: row['Vencimientos'] || row['vencimientos'] || null,
        kg_x_bolsita: parseFloat(row['Kg x bolsita'] || row['kg_x_bolsita'] || 0),
        kg_fraccionados: parseFloat(row['Kg Fraccionados'] || row['kg_fraccionados'] || 0),
        kg_decomiso: parseFloat(row['Kg Decomiso'] || row['kg_decomiso'] || 0),
        kg_recorte: parseFloat(row['Kg Recorte'] || row['kg_recorte'] || 0)
      })).filter(p => p.codigo && p.nombre); // Filtrar filas vacías
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
        'nombre', 'kilos_block', 'peso_x_pieza', 'cantidad_piezas', 
        'vencimientos', 'kg_x_bolsita', 'kg_fraccionados', 'kg_decomiso', 'kg_recorte'
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
    
    const productos = await Producto.findAll({
      where: {
        kg_recorte: {
          [Op.gt]: 0
        }
      }
    });

    let totalKilos = 0;
    const listado = productos.map(p => {
      const kilos = parseFloat(p.kg_recorte) || 0;
      totalKilos += kilos;
      return {
        codigo: p.codigo,
        nombre: p.nombre,
        kilos: kilos
      };
    });

    res.json({
      Kilos_Totales: `${totalKilos.toFixed(3).replace('.', ',')} kg`, // Formato con coma decimal o punto si prefieres
      productos_con_recortes: listado
    });
  } catch (error) {
    console.error('Error al obtener recortes:', error);
    res.status(500).json({ error: 'Error al obtener recortes' });
  }
};

// Convertir recortes: resta de origen y suma a kilos_block del destino '7718'
exports.convertirRecorte = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { codigo, kilos } = req.body;

    if (!codigo || kilos === undefined || kilos === null) {
      await transaction.rollback();
      return res.status(400).json({ error: 'codigo y kilos son obligatorios' });
    }

    const valorKilos = parseFloat(kilos);
    if (isNaN(valorKilos) || valorKilos <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'kilos debe ser un número mayor a cero' });
    }

    // 1. Buscar el producto de origen
    const productoOrigen = await Producto.findByPk(codigo, { transaction });
    if (!productoOrigen) {
      await transaction.rollback();
      return res.status(404).json({ error: `Producto con código ${codigo} no encontrado` });
    }

    // Restar de kg_recorte
    const recorteActual = parseFloat(productoOrigen.kg_recorte) || 0;
    if (recorteActual < valorKilos) {
      await transaction.rollback();
      return res.status(400).json({
        error: `No hay suficientes recortes. Stock actual de recortes: ${recorteActual} kg. Intentado restar: ${valorKilos} kg.`
      });
    }

    // Descontar y actualizar
    productoOrigen.kg_recorte = Math.max(0, recorteActual - valorKilos);
    await productoOrigen.save({ transaction });

    // 2. Buscar el producto destino (7718)
    let productoDestino = await Producto.findByPk('7718', { transaction });
    if (!productoDestino) {
      productoDestino = await Producto.create({
        codigo: '7718',
        nombre: 'FIAM PICADITAS X KG',
        kilos_block: valorKilos
      }, { transaction });
    } else {
      const blockActual = parseFloat(productoDestino.kilos_block) || 0;
      productoDestino.kilos_block = blockActual + valorKilos;
      await productoDestino.save({ transaction });
    }

    await transaction.commit();

    res.json({
      mensaje: 'Recorte convertido exitosamente',
      productoOrigen: {
        codigo: productoOrigen.codigo,
        nombre: productoOrigen.nombre,
        kg_recorte_nuevo: parseFloat(productoOrigen.kg_recorte) || 0
      },
      productoDestino: {
        codigo: '7718',
        nombre: productoDestino.nombre,
        kilos_block_nuevo: parseFloat(productoDestino.kilos_block) || 0
      }
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al convertir recorte:', error);
    res.status(500).json({ error: 'Error interno al procesar la conversión del recorte' });
  }
};

// Obtener sumatoria de decomisos y listado de productos con decomisos
exports.obtenerDecomisos = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    
    const productos = await Producto.findAll({
      where: {
        kg_decomiso: {
          [Op.gt]: 0
        }
      }
    });

    let totalKilos = 0;
    const listado = productos.map(p => {
      const kilos = parseFloat(p.kg_decomiso) || 0;
      totalKilos += kilos;
      return {
        codigo: p.codigo,
        nombre: p.nombre,
        kilos: kilos
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

// Descontar del stock de decomisos de un producto
exports.descontarDecomiso = async (req, res) => {
  try {
    const { codigo, kilos } = req.body;

    if (!codigo || kilos === undefined || kilos === null) {
      return res.status(400).json({ error: 'codigo y kilos son obligatorios' });
    }

    const valorKilos = parseFloat(kilos);
    if (isNaN(valorKilos) || valorKilos <= 0) {
      return res.status(400).json({ error: 'kilos debe ser un número mayor a cero' });
    }

    const producto = await Producto.findByPk(codigo);
    if (!producto) {
      return res.status(404).json({ error: `Producto con código ${codigo} no encontrado` });
    }

    const decomisoActual = parseFloat(producto.kg_decomiso) || 0;
    if (decomisoActual < valorKilos) {
      return res.status(400).json({
        error: `No hay suficientes decomisos. Stock actual de decomisos: ${decomisoActual} kg. Intentado restar: ${valorKilos} kg.`
      });
    }

    producto.kg_decomiso = Math.max(0, decomisoActual - valorKilos);
    await producto.save();

    res.json({
      mensaje: 'Decomiso descontado exitosamente',
      producto: {
        codigo: producto.codigo,
        nombre: producto.nombre,
        kg_decomiso_nuevo: parseFloat(producto.kg_decomiso) || 0
      }
    });
  } catch (error) {
    console.error('Error al descontar decomiso:', error);
    res.status(500).json({ error: 'Error interno al descontar decomiso' });
  }
};




