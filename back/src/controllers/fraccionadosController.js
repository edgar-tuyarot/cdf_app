const { Fraccionado, Producto, sequelize } = require('../models');

// Obtener todos los fraccionados con los nombres de sus productos asociados
exports.obtenerFraccionados = async (req, res) => {
  try {
    const fraccionados = await Fraccionado.findAll({
      include: [
        { model: Producto, as: 'ProductoOriginal', attributes: ['nombre'] },
        { model: Producto, as: 'ProductoFraccionado', attributes: ['nombre'] }
      ]
    });
    res.json(fraccionados);
  } catch (error) {
    console.error('Error al obtener fraccionados:', error);
    res.status(500).json({ error: 'Error al obtener fraccionados' });
  }
};

// Obtener un registro de fraccionado por ID
exports.obtenerFraccionadoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const fraccionado = await Fraccionado.findByPk(id, {
      include: [
        { model: Producto, as: 'ProductoOriginal', attributes: ['nombre'] },
        { model: Producto, as: 'ProductoFraccionado', attributes: ['nombre'] }
      ]
    });
    if (!fraccionado) {
      return res.status(404).json({ error: 'Registro fraccionado no encontrado' });
    }
    res.json(fraccionado);
  } catch (error) {
    console.error('Error al obtener fraccionado por ID:', error);
    res.status(500).json({ error: 'Error al obtener el fraccionado' });
  }
};

// Crear un nuevo registro de fraccionado
exports.crearFraccionado = async (req, res) => {
  try {
    const { codigo_producto_original, peso_a_fraccionar, codigo_fraccionado } = req.body;

    if (!codigo_producto_original || !codigo_fraccionado) {
      return res.status(400).json({ error: 'Los campos "codigo_producto_original" y "codigo_fraccionado" son obligatorios.' });
    }

    // Validar producto original
    const originalExiste = await Producto.findByPk(codigo_producto_original);
    if (!originalExiste) {
      return res.status(400).json({ error: `El producto original con código ${codigo_producto_original} no existe.` });
    }

    // Validar producto fraccionado
    const fraccionadoExiste = await Producto.findByPk(codigo_fraccionado);
    if (!fraccionadoExiste) {
      return res.status(400).json({ error: `El producto fraccionado con código ${codigo_fraccionado} no existe.` });
    }

    const nuevoFraccionado = await Fraccionado.create({
      codigo_producto_original,
      peso_a_fraccionar: peso_a_fraccionar || 0,
      codigo_fraccionado
    });

    res.status(201).json({
      mensaje: 'Registro fraccionado creado exitosamente',
      fraccionado: nuevoFraccionado
    });
  } catch (error) {
    console.error('Error al crear fraccionado:', error);
    res.status(500).json({ error: 'Error al registrar el fraccionado' });
  }
};

// Actualizar un registro de fraccionado
exports.actualizarFraccionado = async (req, res) => {
  try {
    const { id } = req.params;
    const fraccionado = await Fraccionado.findByPk(id);
    if (!fraccionado) {
      return res.status(404).json({ error: 'Registro fraccionado no encontrado' });
    }

    if (req.body.codigo_producto_original) {
      const originalExiste = await Producto.findByPk(req.body.codigo_producto_original);
      if (!originalExiste) {
        return res.status(400).json({ error: `El producto original con código ${req.body.codigo_producto_original} no existe.` });
      }
    }

    if (req.body.codigo_fraccionado) {
      const fraccionadoExiste = await Producto.findByPk(req.body.codigo_fraccionado);
      if (!fraccionadoExiste) {
        return res.status(400).json({ error: `El producto fraccionado con código ${req.body.codigo_fraccionado} no existe.` });
      }
    }

    await fraccionado.update(req.body);

    res.json({
      mensaje: 'Registro fraccionado actualizado exitosamente',
      fraccionado
    });
  } catch (error) {
    console.error('Error al actualizar fraccionado:', error);
    res.status(500).json({ error: 'Error al actualizar el fraccionado' });
  }
};

// Eliminar un registro de fraccionado
exports.eliminarFraccionado = async (req, res) => {
  try {
    const { id } = req.params;
    const fraccionado = await Fraccionado.findByPk(id);
    if (!fraccionado) {
      return res.status(404).json({ error: 'Registro fraccionado no encontrado' });
    }

    await fraccionado.destroy();
    res.json({ mensaje: 'Registro fraccionado eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar fraccionado:', error);
    res.status(500).json({ error: 'Error al eliminar el fraccionado' });
  }
};

// Procesar fraccionamiento (acumular peso en kg_fraccionados del producto final y limpiar el registro fraccionado)
exports.procesarFraccionamiento = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    
    // 1. Buscar registro fraccionado
    const fraccionado = await Fraccionado.findByPk(id, { transaction });
    if (!fraccionado) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Registro fraccionado no encontrado.' });
    }

    const valPesoAFraccionar = parseFloat(fraccionado.peso_a_fraccionar) || 0;
    const codigoDestino = fraccionado.codigo_fraccionado;

    if (valPesoAFraccionar <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'No hay peso a fraccionar en este registro (el peso es 0).' });
    }

    // 2. Buscar producto fraccionado (destino)
    const productoDestino = await Producto.findByPk(codigoDestino, { transaction });
    if (!productoDestino) {
      await transaction.rollback();
      return res.status(400).json({ error: `El producto fraccionado de destino con código ${codigoDestino} no existe.` });
    }

    // 3. Sumar peso_a_fraccionar a kilos_block del producto final
    const kilosBlockActual = parseFloat(productoDestino.kilos_block) || 0;
    productoDestino.kilos_block = kilosBlockActual + valPesoAFraccionar;
    await productoDestino.save({ transaction });

    // 4. Limpiar los pesos del registro fraccionado (poner a 0)
    fraccionado.peso_a_fraccionar = 0;
    fraccionado.peso_a_descontar = 0;
    await fraccionado.save({ transaction });

    await transaction.commit();

    res.json({
      mensaje: 'Fraccionamiento procesado exitosamente',
      productoDestinoActualizado: {
        codigo: productoDestino.codigo,
        nombre: productoDestino.nombre,
        kilos_block_nuevo: productoDestino.kilos_block
      },
      fraccionadoLimpio: fraccionado
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al procesar fraccionamiento:', error);
    res.status(500).json({ error: 'Error al procesar el fraccionamiento' });
  }
};

