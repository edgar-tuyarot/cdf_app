const { Producto, ProductoVencimiento, IngresoProveedor, sequelize } = require('../models');

// Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      include: [
        {
          model: ProductoVencimiento,
          as: 'vencimientosList'
        }
      ]
    });
    res.json(productos);
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
      codigo, nombre, kilos_block, peso_x_pieza, cantidad_piezas, 
      vencimientos, kg_x_bolsita, kg_fraccionados, kg_decomiso, kg_recorte,
      vencimientosList
    } = req.body;

    if (!codigo || !nombre) {
      await transaction.rollback();
      return res.status(400).json({ error: 'codigo y nombre son obligatorios' });
    }

    const existe = await Producto.findByPk(codigo, { transaction });
    if (existe) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Ya existe un producto con ese código' });
    }

    // Sum pieces across vencimientosList if provided
    let calculatedPieces = cantidad_piezas || 0;
    if (Array.isArray(vencimientosList) && vencimientosList.length > 0) {
      calculatedPieces = vencimientosList.reduce((acc, curr) => acc + (parseInt(curr.piezas, 10) || 0), 0);
    }

    const nuevoProducto = await Producto.create({
      codigo,
      nombre,
      kilos_block,
      peso_x_pieza,
      cantidad_piezas: calculatedPieces,
      vencimientos,
      kg_x_bolsita,
      kg_fraccionados,
      kg_decomiso,
      kg_recorte
    }, { transaction });

    if (Array.isArray(vencimientosList) && vencimientosList.length > 0) {
      const activeVencimientos = vencimientosList
        .filter(v => v.vencimiento && (parseInt(v.piezas, 10) || 0) > 0)
        .map(v => ({
          codigo_producto: codigo,
          vencimiento: v.vencimiento,
          piezas: parseInt(v.piezas, 10) || 0
        }));
      if (activeVencimientos.length > 0) {
        await ProductoVencimiento.bulkCreate(activeVencimientos, { transaction });
      }
    }

    await transaction.commit();

    // Fetch product with vencimientos list to return complete data
    const finalProduct = await Producto.findByPk(codigo, {
      include: [{ model: ProductoVencimiento, as: 'vencimientosList' }]
    });

    res.status(201).json({
      mensaje: 'Producto creado exitosamente',
      producto: finalProduct
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

    const { vencimientosList, ...otherFields } = req.body;

    // Check if vencimientosList is provided
    if (vencimientosList !== undefined) {
      // Delete existing vencimientos
      await ProductoVencimiento.destroy({
        where: { codigo_producto: id },
        transaction
      });

      // Filter and insert new vencimientos
      let calculatedPieces = 0;
      if (Array.isArray(vencimientosList) && vencimientosList.length > 0) {
        const activeVencimientos = vencimientosList
          .filter(v => v.vencimiento && (parseInt(v.piezas, 10) || 0) > 0)
          .map(v => {
            const piezasCount = parseInt(v.piezas, 10) || 0;
            calculatedPieces += piezasCount;
            return {
              codigo_producto: id,
              vencimiento: v.vencimiento,
              piezas: piezasCount
            };
          });

        if (activeVencimientos.length > 0) {
          await ProductoVencimiento.bulkCreate(activeVencimientos, { transaction });
        }
      }

      // Override/update cantidad_piezas in otherFields or set it directly
      otherFields.cantidad_piezas = calculatedPieces;
    }

    await producto.update(otherFields, { transaction });
    await transaction.commit();

    // Fetch updated product with associations
    const finalProduct = await Producto.findByPk(id, {
      include: [{ model: ProductoVencimiento, as: 'vencimientosList' }]
    });

    res.json({
      mensaje: 'Producto actualizado exitosamente',
      producto: finalProduct
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
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

    // 2. Incrementar el campo kg_recorte del producto
    producto.kg_recorte = (parseFloat(producto.kg_recorte) || 0) + valorPeso;
    await producto.save({ transaction });

    // 3. Crear un registro en la tabla de procesos como trazabilidad histórica
    const { Proceso } = require('../models');
    await Proceso.create({
      colaborador: sucursal ? `Sucursal: ${sucursal}` : 'Ingreso Externo',
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
        kg_recorte_nuevo: parseFloat(producto.kg_recorte) || 0
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

// Carga masiva de stock desde Excel (suma peso a kilos_block)
// POST /api/productos/cargar-stock
// Archivo Excel con columnas: codigo, peso
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

    for (const row of data) {
      // Buscar columnas con flexibilidad de nombre
      const codigo = row['Codigo'] || row['codigo'] || row['CODIGO'] || row['Código'] || row['Cod'] || row['cod'] || row['COD'];
      const peso = row['Peso'] || row['peso'] || row['PESO'] || row['Kilos'] || row['kilos'] || row['KILOS'] || row['kg'] || row['Kg'];

      if (!codigo) {
        omitidos++;
        continue;
      }

      const valorPeso = parseFloat(peso);
      if (isNaN(valorPeso) || valorPeso <= 0) {
        omitidos++;
        continue;
      }

      const codigoStr = String(codigo).trim();

      // Buscar el producto
      const producto = await Producto.findByPk(codigoStr, { transaction });
      if (!producto) {
        errores.push(`Código ${codigoStr}: producto no encontrado`);
        omitidos++;
        continue;
      }

      // Reemplazar kilos_block con el valor del Excel
      producto.kilos_block = valorPeso;
      await producto.save({ transaction });

      detalles.push({
        codigo: codigoStr,
        nombre: producto.nombre,
        peso_sumado: valorPeso,
        kilos_block_nuevo: parseFloat(producto.kilos_block)
      });

      procesados++;
    }

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

// Obtener todos los vencimientos ordenados de forma ascendente con detalles del producto
exports.obtenerVencimientosCercanos = async (req, res) => {
  try {
    const vencimientos = await ProductoVencimiento.findAll({
      include: [
        {
          model: Producto,
          as: 'producto',
          attributes: ['nombre', 'peso_x_pieza', 'kilos_block']
        }
      ],
      order: [['vencimiento', 'ASC']]
    });
    res.json(vencimientos);
  } catch (error) {
    console.error('Error al obtener vencimientos cercanos:', error);
    res.status(500).json({ error: 'Error al obtener los vencimientos' });
  }
};

// Registrar ingreso de piezas desde proveedor con vencimiento (Persistido históricamente en ingreso_proveedores)
exports.ingresarProveedor = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { codigo, piezas, vencimiento, proveedor } = req.body;

    if (!codigo || piezas === undefined || piezas === null || !vencimiento) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El código del producto, la cantidad de piezas y la fecha de vencimiento son obligatorios.' });
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

    // Calcular el peso a sumar a kilos_block: piezas * peso_x_pieza
    const pesoPieza = parseFloat(producto.peso_x_pieza) || 0;
    const kilosBlockActual = parseFloat(producto.kilos_block) || 0;
    const kilosASumar = valorPiezas * pesoPieza;

    // 2. Crear la fila de auditoría persistente en la tabla ingreso_proveedores
    const nuevoIngreso = await IngresoProveedor.create({
      proveedor: proveedor || 'Proveedor Anónimo',
      codigo_producto: codigo,
      piezas: valorPiezas,
      vencimiento: vencimiento,
      peso_calculado: kilosASumar,
      fecha: new Date()
    }, { transaction });

    // 3. Incrementar la cantidad total de piezas y el peso en block del producto
    producto.cantidad_piezas = (parseInt(producto.cantidad_piezas, 10) || 0) + valorPiezas;
    producto.kilos_block = kilosBlockActual + kilosASumar;
    await producto.save({ transaction });

    // 4. Buscar o crear el vencimiento en la tabla de producto_vencimientos
    let prodVencimiento = await ProductoVencimiento.findOne({
      where: {
        codigo_producto: codigo,
        vencimiento: vencimiento
      },
      transaction
    });

    if (prodVencimiento) {
      prodVencimiento.piezas = (parseInt(prodVencimiento.piezas, 10) || 0) + valorPiezas;
      await prodVencimiento.save({ transaction });
    } else {
      prodVencimiento = await ProductoVencimiento.create({
        codigo_producto: codigo,
        vencimiento: vencimiento,
        piezas: valorPiezas
      }, { transaction });
    }

    // 5. Crear un registro en la tabla de procesos como trazabilidad complementaria en el historial general
    const { Proceso } = require('../models');
    await Proceso.create({
      colaborador: proveedor ? `Proveedor: ${proveedor}` : 'Proveedor Anónimo',
      proceso: 'Ingreso Proveedor',
      fecha: new Date(),
      codigo: codigo,
      piezas: valorPiezas,
      peso_bruto: kilosASumar,
      recorte: 0,
      decomiso: 0,
      kg_a_desc: 0,
      kg_a_sumar: kilosASumar
    }, { transaction });

    await transaction.commit();

    // Buscar el producto con sus vencimientos actualizados para retornar
    const finalProduct = await Producto.findByPk(codigo, {
      include: [{ model: ProductoVencimiento, as: 'vencimientosList' }]
    });

    res.status(201).json({
      mensaje: 'Ingreso de proveedor procesado y persistido exitosamente',
      ingreso: nuevoIngreso,
      producto: finalProduct
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al ingresar piezas de proveedor:', error);
    res.status(500).json({ error: 'Error interno al registrar el ingreso del proveedor' });
  }
};

// Obtener todos los ingresos de proveedores para trazabilidad en el historial
exports.obtenerIngresosProveedores = async (req, res) => {
  try {
    const ingresos = await IngresoProveedor.findAll({
      include: [
        {
          model: Producto,
          as: 'Producto',
          attributes: ['nombre']
        }
      ],
      order: [['fecha', 'DESC']]
    });
    res.json(ingresos);
  } catch (error) {
    console.error('Error al obtener ingresos de proveedores:', error);
    res.status(500).json({ error: 'Error al obtener los ingresos de proveedores' });
  }
};
