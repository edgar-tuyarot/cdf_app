const { Fraccionado, Producto, LogConversion, ProductoStock, ProductoVencimiento, Ubicacion, sequelize } = require('../models');
const wmsService = require('../services/wmsService');

// Obtener todos los fraccionados con los nombres de sus productos asociados
exports.obtenerFraccionados = async (req, res) => {
  try {
    const id_ubicacion = req.ubicacionId;
    const fraccionados = await Fraccionado.findAll({
      where: { id_ubicacion },
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
    const id_ubicacion = req.ubicacionId;
    const fraccionado = await Fraccionado.findOne({
      where: { id, id_ubicacion },
      include: [
        { model: Producto, as: 'ProductoOriginal', attributes: ['nombre'] },
        { model: Producto, as: 'ProductoFraccionado', attributes: ['nombre'] }
      ]
    });
    if (!fraccionado) {
      return res.status(404).json({ error: 'Registro fraccionado no encontrado o no pertenece a su ubicacion' });
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
    const id_ubicacion = req.ubicacionId;

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
      codigo_fraccionado,
      id_ubicacion
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
    const id_ubicacion = req.ubicacionId;
    const fraccionado = await Fraccionado.findOne({ where: { id, id_ubicacion } });
    if (!fraccionado) {
      return res.status(404).json({ error: 'Registro fraccionado no encontrado o no pertenece a su ubicacion' });
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
    const id_ubicacion = req.ubicacionId;
    const fraccionado = await Fraccionado.findOne({ where: { id, id_ubicacion } });
    if (!fraccionado) {
      return res.status(404).json({ error: 'Registro fraccionado no encontrado o no pertenece a su ubicacion' });
    }

    await fraccionado.destroy();
    res.json({ mensaje: 'Registro fraccionado eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar fraccionado:', error);
    res.status(500).json({ error: 'Error al eliminar el fraccionado' });
  }
};

// Procesar fraccionamiento (acumular en el destino, registrar log y limpiar pesos en la plantilla)
exports.procesarFraccionamiento = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { comprobante, usuario } = req.body;
    const id_ubicacion = req.ubicacionId;

    if (!comprobante) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El número de comprobante es obligatorio para registrar la conversión.' });
    }

    // 1. Buscar registro fraccionado
    const fraccionado = await Fraccionado.findOne({ where: { id, id_ubicacion }, transaction });
    if (!fraccionado) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Registro fraccionado no encontrado o no pertenece a su ubicacion.' });
    }

    const valPesoAFraccionar = parseFloat(fraccionado.peso_a_fraccionar) || 0;
    const valPesoADescontar = parseFloat(fraccionado.peso_a_descontar) || 0;
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

    // 3. Sumar peso_a_fraccionar a stock del ProductoStock
    const [pStockRecord, created] = await ProductoStock.findOrCreate({
      where: { codigo_producto: codigoDestino, id_ubicacion },
      defaults: { stock: 0.0000 },
      transaction
    });
    const kilosCalculadoActual = parseFloat(pStockRecord.stock) || 0;
    pStockRecord.stock = kilosCalculadoActual + valPesoAFraccionar;
    await pStockRecord.save({ 
      transaction,
      tipo_movimiento: 'CONVERSION',
      concepto: `Ingreso de stock por fraccionamiento de ${valPesoAFraccionar.toFixed(3)} kg del producto original ${fraccionado.codigo_producto_original} (Comprobante: ${comprobante})`
    });

    // 4. Crear el registro en el log de conversiones
    await LogConversion.create({
      id_ubicacion,
      codigo_producto_original: fraccionado.codigo_producto_original,
      peso_descontado: valPesoADescontar,
      codigo_fraccionado: fraccionado.codigo_fraccionado,
      peso_fraccionado: valPesoAFraccionar,
      comprobante,
      usuario: usuario || 'Sistema',
      fecha: new Date()
    }, { transaction });

    // 5. Deducción por FEFO en ProductoVencimiento para el producto original
    const pesoADescontarVenc = valPesoADescontar > 0 ? valPesoADescontar : valPesoAFraccionar;
    if (pesoADescontarVenc > 0) {
      const vencimientos = await ProductoVencimiento.findAll({
        where: { codigo_producto: fraccionado.codigo_producto_original, id_ubicacion },
        order: [['vencimiento', 'ASC']],
        transaction
      });

      let remainingWeightToDeduct = pesoADescontarVenc;
      for (const v of vencimientos) {
        if (remainingWeightToDeduct <= 0) break;
        const currentPeso = parseFloat(v.peso) || 0;
        if (currentPeso <= remainingWeightToDeduct) {
          remainingWeightToDeduct -= currentPeso;
          await v.destroy({ transaction });
        } else {
          v.peso = parseFloat((currentPeso - remainingWeightToDeduct).toFixed(3));
          remainingWeightToDeduct = 0;
          await v.save({ transaction });
        }
      }
    }

    // 5. Limpiar los pesos del registro fraccionado (poner a 0)
    fraccionado.peso_a_fraccionar = 0;
    fraccionado.peso_a_descontar = 0;
    await fraccionado.save({ transaction });

    await transaction.commit();

    // 6. Emitir Orden de Ajuste en BlockWMS (Baja ID 57 y Alta ID 28)
    try {
      const wmsItems = [];
      if (valPesoADescontar > 0) {
        wmsItems.push({
          codigoProducto: fraccionado.codigo_producto_original,
          cantidad: valPesoADescontar,
          operador: 'resta',
          idMotivo: '57' // 57 = Baja Fiam p/ Envasado al vacío
        });
      }
      if (valPesoAFraccionar > 0) {
        wmsItems.push({
          codigoProducto: fraccionado.codigo_fraccionado,
          cantidad: valPesoAFraccionar,
          operador: 'suma',
          idMotivo: '28' // 28 = Elaboración del Sector
        });
      }

      if (wmsItems.length > 0) {
        // Para conversiones en CD Chaco, el sitio en Block WMS es estrictamente 194326 (Distribución Chaco - Depot 026)
        const siteId = '194326';

        const wmsCreds = {
          sessionId: req.headers['x-wms-session-id'] || req.body?.sessionId || '',
          siteId,
          host: req.headers['x-wms-host'] || req.body?.host || 'http://192.168.10.2'
        };

        wmsService.ejecutarAjusteMultipleWMS({
          items: wmsItems,
          observaciones: `Conversión Fraccionados (Comprobante: ${comprobante})`,
          ...wmsCreds
        }).then(resWms => {
          console.log(`[WMS-Conversión] Orden de ajuste #${resWms.idOrdenes} generada en BlockWMS.`);
        }).catch(errWms => {
          console.warn('[WMS-Conversión] Advertencia al emitir orden en BlockWMS:', errWms.message);
        });
      }
    } catch (errWms) {
      console.warn('[WMS-Conversión] Error WMS:', errWms.message);
    }

    res.json({
      mensaje: 'Fraccionamiento procesado exitosamente',
      productoDestinoActualizado: {
        codigo: productoDestino.codigo,
        nombre: productoDestino.nombre,
        stock_nuevo: parseFloat(pStockRecord.stock),
        kilos_calculado_nuevo: parseFloat(pStockRecord.stock)
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

// Procesar lote de fraccionamientos (agrupados y por lotes transaccionales)
exports.procesarFraccionamientoLote = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { ids, comprobante, usuario } = req.body;
    const id_ubicacion = req.ubicacionId;

    if (!comprobante) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El número de comprobante es obligatorio para registrar las conversiones.' });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Debe enviar un array "ids" con los identificadores de conversiones a procesar.' });
    }

    const detalles = [];
    const wmsItemsCache = [];

    for (const id of ids) {
      const fraccionado = await Fraccionado.findOne({ where: { id, id_ubicacion }, transaction });
      if (!fraccionado) {
        await transaction.rollback();
        return res.status(404).json({ error: `Registro de conversión ID ${id} no encontrado o no pertenece a su ubicacion.` });
      }

      const valPesoAFraccionar = parseFloat(fraccionado.peso_a_fraccionar) || 0;
      const valPesoADescontar = parseFloat(fraccionado.peso_a_descontar) || 0;
      const codigoDestino = fraccionado.codigo_fraccionado;

      if (valPesoAFraccionar <= 0) {
        await transaction.rollback();
        return res.status(400).json({ error: `La conversión ID ${id} no tiene peso a fraccionar (el peso es 0).` });
      }

      // Buscar producto fraccionado (destino)
      const productoDestino = await Producto.findByPk(codigoDestino, { transaction });
      if (!productoDestino) {
        await transaction.rollback();
        return res.status(400).json({ error: `El producto fraccionado de destino con código ${codigoDestino} para la conversión ID ${id} no existe.` });
      }

      // Sumar al stock de la ubicación activa en ProductoStock
      const [pStockRecord, created] = await ProductoStock.findOrCreate({
        where: { codigo_producto: codigoDestino, id_ubicacion },
        defaults: { stock: 0.0000 },
        transaction
      });
      const kilosCalculadoActual = parseFloat(pStockRecord.stock) || 0;
      pStockRecord.stock = kilosCalculadoActual + valPesoAFraccionar;
      await pStockRecord.save({ 
        transaction,
        tipo_movimiento: 'CONVERSION',
        concepto: `Ingreso de stock por fraccionamiento de ${valPesoAFraccionar.toFixed(3)} kg del producto original ${fraccionado.codigo_producto_original} (Comprobante: ${comprobante})`
      });

      // Crear log de conversión
      await LogConversion.create({
        id_ubicacion,
        codigo_producto_original: fraccionado.codigo_producto_original,
        peso_descontado: valPesoADescontar,
        codigo_fraccionado: fraccionado.codigo_fraccionado,
        peso_fraccionado: valPesoAFraccionar,
        comprobante,
        usuario: usuario || 'Sistema',
        fecha: new Date()
      }, { transaction });

      // Deducción por FEFO en ProductoVencimiento para el producto original
      const pesoADescontarLoteVenc = valPesoADescontar > 0 ? valPesoADescontar : valPesoAFraccionar;
      if (pesoADescontarLoteVenc > 0) {
        const vencimientos = await ProductoVencimiento.findAll({
          where: { codigo_producto: fraccionado.codigo_producto_original, id_ubicacion },
          order: [['vencimiento', 'ASC']],
          transaction
        });

        let remainingWeightToDeduct = pesoADescontarLoteVenc;
        for (const v of vencimientos) {
          if (remainingWeightToDeduct <= 0) break;
          const currentPeso = parseFloat(v.peso) || 0;
          if (currentPeso <= remainingWeightToDeduct) {
            remainingWeightToDeduct -= currentPeso;
            await v.destroy({ transaction });
          } else {
            v.peso = parseFloat((currentPeso - remainingWeightToDeduct).toFixed(3));
            remainingWeightToDeduct = 0;
            await v.save({ transaction });
          }
        }
      }

      // Guardar ítems para la orden de WMS
      if (valPesoADescontar > 0) {
        wmsItemsCache.push({
          codigoProducto: fraccionado.codigo_producto_original,
          cantidad: valPesoADescontar,
          operador: 'resta',
          idMotivo: '57' // 57 = Baja Fiam p/ Envasado al vacío
        });
      }
      if (valPesoAFraccionar > 0) {
        wmsItemsCache.push({
          codigoProducto: fraccionado.codigo_fraccionado,
          cantidad: valPesoAFraccionar,
          operador: 'suma',
          idMotivo: '28' // 28 = Elaboración del Sector
        });
      }

      // Limpiar pesos de la plantilla
      fraccionado.peso_a_fraccionar = 0;
      fraccionado.peso_a_descontar = 0;
      await fraccionado.save({ transaction });

      detalles.push({
        id,
        codigo_original: fraccionado.codigo_producto_original,
        codigo_fraccionado: fraccionado.codigo_fraccionado,
        nombre_fraccionado: productoDestino.nombre,
        peso_fraccionado: valPesoAFraccionar
      });
    }

    await transaction.commit();

    // Emitir Orden de Ajuste en Lote para BlockWMS
    if (wmsItemsCache.length > 0) {
      try {
        // Para conversiones en CD Chaco, el sitio en Block WMS es estrictamente 194326 (Distribución Chaco - Depot 026)
        const siteId = '194326';

        const wmsCreds = {
          sessionId: req.headers['x-wms-session-id'] || req.body?.sessionId || '',
          siteId,
          host: req.headers['x-wms-host'] || req.body?.host || 'http://192.168.10.2'
        };

        wmsService.ejecutarAjusteMultipleWMS({
          items: wmsItemsCache,
          observaciones: `Conversión Lote Fraccionados (Comprobante: ${comprobante})`,
          ...wmsCreds
        }).then(resWms => {
          console.log(`[WMS-Conversión Lote] Orden de ajuste #${resWms.idOrdenes} generada en BlockWMS con ${resWms.totalRenglones} renglones.`);
        }).catch(errWms => {
          console.warn('[WMS-Conversión Lote] Advertencia al emitir orden Lote en BlockWMS:', errWms.message);
        });
      } catch (errWms) {
        console.warn('[WMS-Conversión Lote] Error WMS:', errWms.message);
      }
    }

    res.json({
      mensaje: `Lote de ${ids.length} conversiones procesado exitosamente`,
      detalles
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al procesar lote de fraccionamiento:', error);
    res.status(500).json({ error: 'Error al procesar el lote de fraccionamiento' });
  }
};

// Obtener historial del log de conversiones
exports.obtenerLogsConversiones = async (req, res) => {
  try {
    const id_ubicacion = req.ubicacionId;
    const logs = await LogConversion.findAll({
      where: { id_ubicacion },
      include: [
        { model: Producto, as: 'ProductoOriginal', attributes: ['nombre'] },
        { model: Producto, as: 'ProductoFraccionado', attributes: ['nombre'] }
      ],
      order: [['fecha', 'DESC'], ['id', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    console.error('Error al obtener logs de conversiones:', error);
    res.status(500).json({ error: 'Error al obtener logs de conversiones' });
  }
};

// Revertir una conversión del log (solo app local, restablece plantilla y ajusta stock)
exports.revertirLogConversion = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const id_ubicacion = req.ubicacionId;

    // 1. Buscar el registro en el log de conversiones
    const log = await LogConversion.findOne({ where: { id, id_ubicacion }, transaction });
    if (!log) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Registro de conversión en el log no encontrado o no pertenece a su ubicación.' });
    }

    const valPesoFraccionado = parseFloat(log.peso_fraccionado) || 0;
    const valPesoDescontado = parseFloat(log.peso_descontado) || 0;
    const codigoDestino = log.codigo_fraccionado;
    const codigoOrigen = log.codigo_producto_original;

    // 2. Revertir stock del producto destino en ProductoStock (restar peso_fraccionado)
    if (valPesoFraccionado > 0) {
      const [pStockDestino] = await ProductoStock.findOrCreate({
        where: { codigo_producto: codigoDestino, id_ubicacion },
        defaults: { stock: 0.0000 },
        transaction
      });
      const stockActualDestino = parseFloat(pStockDestino.stock) || 0;
      pStockDestino.stock = Math.max(0, stockActualDestino - valPesoFraccionado);
      await pStockDestino.save({
        transaction,
        tipo_movimiento: 'REVERSION_CONVERSION',
        concepto: `Reversión de conversión (Log #${log.id}): Deducción de ${valPesoFraccionado.toFixed(3)} kg del producto destino (Comprobante: ${log.comprobante})`
      });
    }

    // 3. Restablecer stock/vencimiento del producto origen (sumar peso_descontado)
    const pesoARestaurarOrigen = valPesoDescontado > 0 ? valPesoDescontado : valPesoFraccionado;
    if (pesoARestaurarOrigen > 0) {
      // Buscar o crear un lote de vencimiento para el producto origen
      let loteVenc = await ProductoVencimiento.findOne({
        where: { codigo_producto: codigoOrigen, id_ubicacion },
        order: [['vencimiento', 'ASC']],
        transaction
      });

      if (loteVenc) {
        loteVenc.peso = parseFloat((parseFloat(loteVenc.peso || 0) + pesoARestaurarOrigen).toFixed(3));
        await loteVenc.save({ transaction });
      } else {
        // Si no tenía lote de vencimiento activo, crear uno por defecto (vencimiento a 30 días)
        const fechaDefecto = new Date();
        fechaDefecto.setDate(fechaDefecto.getDate() + 30);
        const yyyy = fechaDefecto.getFullYear();
        const mm = String(fechaDefecto.getMonth() + 1).padStart(2, '0');
        const dd = String(fechaDefecto.getDate()).padStart(2, '0');
        const vencStr = `${yyyy}-${mm}-${dd}`;

        await ProductoVencimiento.create({
          codigo_producto: codigoOrigen,
          vencimiento: vencStr,
          piezas: 0,
          peso: pesoARestaurarOrigen,
          id_ubicacion
        }, { transaction });
      }

      // También asegurar actualización del ProductoStock origen
      const [pStockOrigen] = await ProductoStock.findOrCreate({
        where: { codigo_producto: codigoOrigen, id_ubicacion },
        defaults: { stock: 0.0000 },
        transaction
      });
      const stockActualOrigen = parseFloat(pStockOrigen.stock) || 0;
      pStockOrigen.stock = stockActualOrigen + pesoARestaurarOrigen;
      await pStockOrigen.save({
        transaction,
        skipAuditLog: true
      });
    }

    // 4. Restaurar la plantilla de conversión (Fraccionado) para que aparezca disponible nuevamente
    let fraccionado = await Fraccionado.findOne({
      where: {
        codigo_producto_original: codigoOrigen,
        codigo_fraccionado: codigoDestino,
        id_ubicacion
      },
      transaction
    });

    if (fraccionado) {
      fraccionado.peso_a_fraccionar = valPesoFraccionado;
      fraccionado.peso_a_descontar = valPesoDescontado;
      await fraccionado.save({ transaction });
    } else {
      fraccionado = await Fraccionado.create({
        id_ubicacion,
        codigo_producto_original: codigoOrigen,
        codigo_fraccionado: codigoDestino,
        peso_a_fraccionar: valPesoFraccionado,
        peso_a_descontar: valPesoDescontado
      }, { transaction });
    }

    // 5. Eliminar el registro del LogConversion revertido
    await log.destroy({ transaction });

    await transaction.commit();

    res.json({
      mensaje: `Conversión del comprobante ${log.comprobante} revertida exitosamente. La plantilla volvió a habilitarse con sus pesos originales.`,
      fraccionadoRestaurado: fraccionado
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al revertir conversión del log:', error);
    res.status(500).json({ error: 'Error interno al revertir la conversión.' });
  }
};
