const { Producto } = require('../models');

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
    const { codigo_interno, codigo_proveedor, descripcion, categoria } = req.body;

    if (!codigo_interno || !descripcion) {
      return res.status(400).json({ error: 'codigo_interno y descripcion son obligatorios' });
    }

    // Verificar si el código interno ya existe
    const existe = await Producto.findOne({ where: { codigo_interno } });
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un producto con ese código interno' });
    }

    const nuevoProducto = await Producto.create({
      codigo_interno,
      codigo_proveedor,
      descripcion,
      categoria
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

// Obtener stock consolidado (Kilos + Feteados) - INNER JOIN
exports.obtenerStockTotal = async (req, res) => {
  try {
    const { StockProduccion } = require('../models');
    
    const productos = await Producto.findAll({
      include: [{
        model: StockProduccion,
        required: false // Esto permite ver TODOS los productos, tengan o no stock envasado (LEFT JOIN)
      }],
      attributes: ['codigo_interno', 'descripcion', 'categoria', 'stock'] 
    });

    // Formateamos la respuesta para que sea más clara para el front
    const respuesta = productos.map(p => ({
      codigo_interno: p.codigo_interno,
      descripcion: p.descripcion,
      categoria: p.categoria,
      stock_en_kilos: p.stock,
      stock_feteados: p.StockProduccion ? p.StockProduccion.cantidad_bolsitas : 0
    }));

    res.json(respuesta);
  } catch (error) {
    console.error('Error al obtener stock total:', error);
    res.status(500).json({ error: 'Error al obtener el stock consolidado' });
  }
};

// Corregir stock de un producto (Kilos)
exports.corregirStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevo_stock } = req.body;

    if (nuevo_stock === undefined || nuevo_stock === null) {
      return res.status(400).json({ error: 'El campo nuevo_stock es obligatorio' });
    }

    // Buscamos por el código interno en lugar del ID autoincremental
    const producto = await Producto.findOne({ 
      where: { codigo_interno: id } 
    });
    
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    producto.stock = nuevo_stock;
    await producto.save();

    res.json({
      mensaje: 'Stock corregido exitosamente',
      producto
    });
  } catch (error) {
    console.error('Error al corregir stock:', error);
    res.status(500).json({ error: 'Error al corregir el stock del producto' });
  }
};
