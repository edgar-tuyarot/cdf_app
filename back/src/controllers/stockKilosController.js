const multer = require('multer');
const XLSX = require('xlsx');
const { StockKilos, Producto, StockEnvasado } = require('../models');
const sequelize = require('../config/db');

const upload = multer({ storage: multer.memoryStorage() });
exports.upload = upload.single('archivo');

// GET /api/stock-kilos
// Devuelve: codigo, nombre, stock_kilos, stock_envasados
exports.obtenerTodos = async (req, res) => {
  try {
    const [stockKilos, productos, stockEnvasados] = await Promise.all([
      StockKilos.findAll(),
      Producto.findAll({ attributes: ['codigo_interno', 'descripcion'] }),
      StockEnvasado.findAll()
    ]);

    // Mapas para lookup rápido
    const productoMap = {};
    productos.forEach(p => { productoMap[p.codigo_interno] = p.descripcion; });

    const envasadoMap = {};
    stockEnvasados.forEach(e => { envasadoMap[e.codigo] = e.cantidad; });

    const resultado = stockKilos
      .sort((a, b) => String(a.codigo_producto).localeCompare(String(b.codigo_producto)))
      .map(item => ({
        codigo: item.codigo_producto,
        nombre: productoMap[item.codigo_producto] || 'Sin descripción',
        stock_kilos: parseFloat(item.cantidad_kilos) || 0,
        stock_envasados: parseInt(envasadoMap[item.codigo_producto]) || 0
      }));

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener stock de kilos:', error);
    res.status(500).json({ error: 'Error al obtener stock de kilos' });
  }
};

// POST /api/stock-kilos/cargar-excel
// Recibe un .xlsx con una única hoja.
// Lee las columnas "codigo_productos" y "cantidad_fisica".
// Borra todos los registros existentes y los reemplaza con los del Excel.
// "cantidad_fisica" usa coma como separador decimal (ej: "3,26" -> 3.26).
exports.cargarExcel = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    // Leer el Excel desde buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

    // Tomar la primera hoja (única hoja del archivo)
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'El archivo está vacío o no tiene datos' });
    }

    // Verificar que las columnas necesarias existen
    const primeraFila = rows[0];
    if (!('codigo_productos' in primeraFila) || !('cantidad_fisica' in primeraFila)) {
      await t.rollback();
      return res.status(400).json({
        error: 'El archivo no contiene las columnas requeridas: "codigo_productos" y "cantidad_fisica"'
      });
    }

    // Borrar todos los registros existentes
    await StockKilos.destroy({ where: {}, transaction: t });

    // Procesar cada fila
    let insertados = 0;
    let ignorados = 0;

    for (const row of rows) {
      const codigo = String(row['codigo_productos'] || '').trim();

      // "cantidad_fisica" puede venir como string con coma ("3,26") o como número
      let kilos = 0;
      const rawKilos = row['cantidad_fisica'];
      if (typeof rawKilos === 'string') {
        // Reemplazar coma decimal por punto y convertir
        kilos = parseFloat(rawKilos.replace(',', '.')) || 0;
      } else if (typeof rawKilos === 'number') {
        kilos = rawKilos;
      }

      if (!codigo) {
        ignorados++;
        continue;
      }

      await StockKilos.create({
        codigo_producto: codigo,
        cantidad_kilos: kilos
      }, { transaction: t });

      insertados++;
    }

    await t.commit();

    res.json({
      mensaje: 'Excel procesado correctamente',
      resumen: {
        registros_insertados: insertados,
        registros_ignorados: ignorados
      }
    });

  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al procesar el archivo Excel' });
  }
};

// POST /api/stock-kilos/restar
// Recibe { codigo_producto, kilos_a_descontar }
// Resta la cantidad especificada de los kilos existentes, asegurando que no quede en negativo.
exports.restar = async (req, res) => {
  try {
    const { codigo_producto, kilos_a_descontar } = req.body;

    if (!codigo_producto || kilos_a_descontar === undefined) {
      return res.status(400).json({ error: 'Faltan datos requeridos: codigo_producto y kilos_a_descontar' });
    }

    const descuento = parseFloat(kilos_a_descontar);
    if (isNaN(descuento) || descuento <= 0) {
      return res.status(400).json({ error: 'kilos_a_descontar debe ser un número mayor a 0' });
    }

    const item = await StockKilos.findOne({ where: { codigo_producto } });

    if (!item) {
      return res.status(404).json({ error: 'Código de producto no encontrado en stock_kilos' });
    }

    const nuevoStock = Math.max(0, parseFloat(item.cantidad_kilos) - descuento);
    
    item.cantidad_kilos = nuevoStock;
    await item.save();

    res.json({
      mensaje: 'Stock descontado correctamente',
      registro: item
    });

  } catch (error) {
    console.error('Error al restar stock de kilos:', error);
    res.status(500).json({ error: 'Error interno al restar stock' });
  }
};
