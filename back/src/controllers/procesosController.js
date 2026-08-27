const { Proceso, Producto, Fraccionado, Colaborador, Sucursal, Proveedor, Generador, ProductoVencimiento, LogConversion, ProductoStock, Ubicacion, sequelize } = require('../models');

// Obtener todos los procesos (con datos del producto y generador asociado)
exports.obtenerProcesos = async (req, res) => {
  try {
    const id_ubicacion = req.ubicacionId;
    const procesos = await Proceso.findAll({
      where: { id_ubicacion },
      include: [
        {
          model: Producto,
          attributes: ['nombre']
        },
        {
          model: Generador,
          as: 'Generador',
          include: [
            { model: Colaborador, as: 'colaborador', attributes: ['id', 'nombre'] },
            { model: Sucursal, as: 'sucursal', attributes: ['id', 'sucursal'] },
            { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }
          ]
        }
      ],
      order: [['id', 'DESC']]
    });
    res.json(procesos);
  } catch (error) {
    console.error('Error al obtener procesos:', error);
    res.status(500).json({ error: 'Error al obtener procesos' });
  }
};

// Obtener un proceso por ID
exports.obtenerProcesoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const id_ubicacion = req.ubicacionId;
    const proceso = await Proceso.findOne({
      where: { id, id_ubicacion },
      include: [
        {
          model: Producto,
          attributes: ['nombre']
        },
        {
          model: Generador,
          as: 'Generador',
          include: [
            { model: Colaborador, as: 'colaborador', attributes: ['id', 'nombre'] },
            { model: Sucursal, as: 'sucursal', attributes: ['id', 'sucursal'] },
            { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }
          ]
        }
      ]
    });
    if (!proceso) {
      return res.status(404).json({ error: 'Proceso no encontrado o no pertenece a su ubicacion' });
    }
    res.json(proceso);
  } catch (error) {
    console.error('Error al obtener proceso por ID:', error);
    res.status(500).json({ error: 'Error al obtener el proceso' });
  }
};

// Crear un nuevo proceso
exports.crearProceso = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      generador_id, proceso, fecha, codigo, piezas,
      peso_bruto, recorte, decomiso, kg_a_desc, kg_a_sumar
    } = req.body;

    if (!codigo) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El campo "codigo" de producto es obligatorio.' });
    }

    // Validar que el producto exista
    const producto = await Producto.findByPk(codigo, { transaction });
    if (!producto) {
      await transaction.rollback();
      return res.status(400).json({ error: `El producto con código ${codigo} no existe.` });
    }

    // Validar y resolver generador
    let resolvedGeneradorId = generador_id;
    if (!resolvedGeneradorId && req.body.generador_tipo && req.body.id_asociado) {
      const generador = await Generador.findOne({
        where: { tipo: req.body.generador_tipo, id_asociado: req.body.id_asociado },
        transaction
      });
      if (generador) {
        resolvedGeneradorId = generador.id;
      } else {
        await transaction.rollback();
        return res.status(400).json({ error: `El generador de tipo ${req.body.generador_tipo} con ID de asociado ${req.body.id_asociado} no existe.` });
      }
    } else if (resolvedGeneradorId) {
      const generador = await Generador.findByPk(resolvedGeneradorId, { transaction });
      if (!generador) {
        await transaction.rollback();
        return res.status(400).json({ error: `El generador con ID ${resolvedGeneradorId} no existe.` });
      }
    }

    // Parsear valores numéricos
    const valPesoBruto = parseFloat(peso_bruto) || 0;
    const valRecorte = parseFloat(recorte) || 0;
    const valDecomiso = parseFloat(decomiso) || 0;
    const valPiezas = parseInt(piezas, 10) || 0;
    const valKgASumar = parseFloat(kg_a_sumar) || 0;
    const valKgADescontar = parseFloat(kg_a_desc) || 0;

    if (!valPiezas || valPiezas <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'La cantidad de piezas es obligatoria y debe ser mayor a 0.' });
    }

    const id_ubicacion = req.ubicacionId;
    let stockActual = 0;
    let pStockRecord = null;

    let piezasActual = 0;
    if (req.body.pendiente !== true) {
      pStockRecord = await ProductoStock.findOne({
        where: { codigo_producto: codigo, id_ubicacion },
        transaction
      });
      stockActual = pStockRecord ? parseFloat(pStockRecord.stock) : 0;
      piezasActual = pStockRecord ? parseInt(pStockRecord.piezas, 10) : 0;
    }

    // Validar stock si no es un proceso pendiente
    if (req.body.pendiente !== true) {
      if (valPesoBruto > 0 && proceso !== 'Fraccionamiento') {
        const calculadoActual = stockActual;
        if (calculadoActual < valPesoBruto) {
          await transaction.rollback();
          return res.status(400).json({ error: `Stock de kilos insuficiente para el producto ${codigo} (${producto.nombre}). Disponible: ${calculadoActual} kg, Requerido: ${valPesoBruto} kg.` });
        }
      }
      if (valPiezas > 0 && proceso !== 'Fraccionamiento') {
        if (piezasActual < valPiezas) {
          await transaction.rollback();
          return res.status(400).json({ error: `Stock de piezas insuficiente para el producto ${codigo} (${producto.nombre}). Disponible: ${piezasActual}, Requerido: ${valPiezas}.` });
        }
      }
    }

    // Crear el proceso
    const nuevoProceso = await Proceso.create({
      id_ubicacion,
      generador_id: resolvedGeneradorId,
      proceso,
      fecha: fecha || new Date(),
      codigo,
      piezas: valPiezas,
      peso_bruto: valPesoBruto,
      recorte: valRecorte,
      decomiso: valDecomiso,
      kg_a_desc: kg_a_desc || 0,
      kg_a_sumar: kg_a_sumar || 0,
      pendiente: req.body.pendiente === true
    }, { transaction });

    // Modificar stock del producto si no es un proceso pendiente
    if (req.body.pendiente !== true) {
      if (!pStockRecord) {
        const [createdRecord] = await ProductoStock.findOrCreate({
          where: { codigo_producto: codigo, id_ubicacion },
          defaults: { stock: 0.0000, recorte: 0.000, decomiso: 0.000, kg_fraccionados: 0.000 },
          transaction
        });
        pStockRecord = createdRecord;
      }

      // 1. Sumar a recorte y decomiso de la ubicación en ProductoStock
      pStockRecord.recorte = (parseFloat(pStockRecord.recorte) || 0) + valRecorte;
      pStockRecord.decomiso = (parseFloat(pStockRecord.decomiso) || 0) + valDecomiso;

      // 2. Restar peso bruto de stock y manejar stock de fraccionados
      let descuentoCalculado = valPesoBruto;
      let esConvertible = await Fraccionado.count({
        where: { codigo_producto_original: codigo, id_ubicacion },
        transaction
      });
      if (esConvertible === 0 && producto.codigo_fraccionado) {
        await Fraccionado.create({
          id_ubicacion,
          codigo_producto_original: codigo,
          codigo_fraccionado: producto.codigo_fraccionado,
          peso_a_fraccionar: 0,
          peso_a_descontar: 0
        }, { transaction });
        esConvertible = 1;
      }
      if (esConvertible === 0) {
        // Si no hay código de conversión, sumamos el peso producido a su stock de fraccionados
        pStockRecord.kg_fraccionados = (parseFloat(pStockRecord.kg_fraccionados) || 0) + valKgASumar;

        // Registrar en LogConversion como conversión directa
        if (valKgASumar > 0) {
          await LogConversion.create({
            id_ubicacion,
            codigo_producto_original: codigo,
            peso_descontado: valPesoBruto,
            codigo_fraccionado: codigo,
            peso_fraccionado: valKgASumar,
            comprobante: `PROCESO #${nuevoProceso.id}`,
            usuario: req.body.usuario || 'Sistema',
            fecha: new Date()
          }, { transaction });
        }
      }

      pStockRecord.stock = stockActual - descuentoCalculado;
      await pStockRecord.save({
        transaction,
        tipo_movimiento: 'PROCESO',
        referencia_id: nuevoProceso.id,
        concepto: `Proceso de ${proceso || 'Producción'} registrado`,
        cantidad_piezas: valPiezas > 0 ? -valPiezas : 0,
        kg_recorte: valRecorte,
        kg_decomiso: valDecomiso,
        usuario: req.body.usuario || 'Sistema'
      });

      // 3. FIFO deduction on ProductoVencimiento (lotes de vencimiento)
      if (valPiezas > 0) {
        const vencimientos = await ProductoVencimiento.findAll({
          where: { codigo_producto: codigo, id_ubicacion },
          order: [['vencimiento', 'ASC']],
          transaction
        });

        let remainingToDeduct = valPiezas;
        for (const v of vencimientos) {
          if (remainingToDeduct <= 0) break;
          const currentPiezas = parseInt(v.piezas, 10) || 0;
          if (currentPiezas <= remainingToDeduct) {
            remainingToDeduct -= currentPiezas;
            await v.destroy({ transaction });
          } else {
            v.piezas = currentPiezas - remainingToDeduct;
            remainingToDeduct = 0;
            await v.save({ transaction });
          }
        }

        // Si aún restan piezas por descontar (producto sin lotes previos o con piezas insuficientes en lotes)
        if (remainingToDeduct > 0) {
          const farFuture = new Date();
          farFuture.setFullYear(farFuture.getFullYear() + 1);
          const defaultDateStr = farFuture.toISOString().split('T')[0];

          await ProductoVencimiento.create({
            codigo_producto: codigo,
            id_ubicacion,
            vencimiento: defaultDateStr,
            piezas: -remainingToDeduct
          }, { transaction });
        }
      }

      // 4. Si el código está en fraccionados como producto original (o si el producto tiene codigo_fraccionado configurado), actualizamos peso_a_fraccionar y peso_a_descontar
      const descAplicar = valKgADescontar > 0 ? valKgADescontar : valPesoBruto;
      if (valKgASumar > 0 || descAplicar > 0) {
        let mappings = await Fraccionado.findAll({
          where: { codigo_producto_original: codigo, id_ubicacion },
          transaction
        });

        if (mappings.length === 0 && producto.codigo_fraccionado) {
          const newMapping = await Fraccionado.create({
            id_ubicacion,
            codigo_producto_original: codigo,
            codigo_fraccionado: producto.codigo_fraccionado,
            peso_a_fraccionar: 0,
            peso_a_descontar: 0
          }, { transaction });
          mappings = [newMapping];
        }

        for (const mapping of mappings) {
          const pesoActual = parseFloat(mapping.peso_a_fraccionar) || 0;
          mapping.peso_a_fraccionar = pesoActual + valKgASumar;

          const descActual = parseFloat(mapping.peso_a_descontar) || 0;
          mapping.peso_a_descontar = descActual + descAplicar;

          await mapping.save({ transaction });
        }
      }
    }

    await transaction.commit();

    // Volver a cargar el proceso con relaciones para responder de forma consistente
    const procesoConRelaciones = await Proceso.findByPk(nuevoProceso.id, {
      include: [
        {
          model: Producto,
          attributes: ['nombre']
        },
        {
          model: Generador,
          as: 'Generador',
          include: [
            { model: Colaborador, as: 'colaborador', attributes: ['id', 'nombre'] },
            { model: Sucursal, as: 'sucursal', attributes: ['id', 'sucursal'] },
            { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }
          ]
        }
      ]
    });

    // Calcular piezas restantes en la ubicación
    const piezasRestantes = req.body.pendiente === true ? 0 : (await ProductoVencimiento.sum('piezas', {
      where: { codigo_producto: codigo, id_ubicacion }
    }) || 0);

    res.status(201).json({
      mensaje: 'Proceso registrado y stock actualizado exitosamente',
      proceso: procesoConRelaciones,
      productoActualizado: {
        codigo: producto.codigo,
        nombre: producto.nombre,
        stock_nuevo: pStockRecord ? parseFloat(pStockRecord.stock) : 0,
        kilos_calculado_nuevo: pStockRecord ? parseFloat(pStockRecord.stock) : 0,
        kg_recorte_nuevo: pStockRecord ? parseFloat(pStockRecord.recorte) : 0,
        kg_decomiso_nuevo: pStockRecord ? parseFloat(pStockRecord.decomiso) : 0,
        cantidad_piezas_nueva: piezasRestantes
      }
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al crear proceso:', error);
    res.status(500).json({ error: 'Error al registrar el proceso' });
  }
};

// Actualizar un proceso
exports.actualizarProceso = async (req, res) => {
  try {
    const { id } = req.params;
    const id_ubicacion = req.ubicacionId;
    const proceso = await Proceso.findOne({ where: { id, id_ubicacion } });
    if (!proceso) {
      return res.status(404).json({ error: 'Proceso no encontrado o no pertenece a su ubicacion' });
    }

    // Si se está cambiando el código de producto, validar que exista
    if (req.body.codigo) {
      const productoExiste = await Producto.findByPk(req.body.codigo);
      if (!productoExiste) {
        return res.status(400).json({ error: `El producto con código ${req.body.codigo} no existe.` });
      }
    }

    // Si se cambia el generador, validar o resolver
    let resolvedGeneradorId = req.body.generador_id;
    if (!resolvedGeneradorId && req.body.generador_tipo && req.body.id_asociado) {
      const generador = await Generador.findOne({
        where: { tipo: req.body.generador_tipo, id_asociado: req.body.id_asociado }
      });
      if (generador) {
        resolvedGeneradorId = generador.id;
      } else {
        return res.status(400).json({ error: `El generador de tipo ${req.body.generador_tipo} con ID de asociado ${req.body.id_asociado} no existe.` });
      }
    } else if (resolvedGeneradorId) {
      const generadorExiste = await Generador.findByPk(resolvedGeneradorId);
      if (!generadorExiste) {
        return res.status(400).json({ error: `El generador con ID ${resolvedGeneradorId} no existe.` });
      }
    }

    const updateData = { ...req.body };
    if (resolvedGeneradorId !== undefined) {
      updateData.generador_id = resolvedGeneradorId;
    }

    await proceso.update(updateData);

    const procesoConRelaciones = await Proceso.findByPk(proceso.id, {
      include: [
        {
          model: Producto,
          attributes: ['nombre']
        },
        {
          model: Generador,
          as: 'Generador',
          include: [
            { model: Colaborador, as: 'colaborador', attributes: ['id', 'nombre'] },
            { model: Sucursal, as: 'sucursal', attributes: ['id', 'sucursal'] },
            { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }
          ]
        }
      ]
    });

    res.json({
      mensaje: 'Proceso actualizado exitosamente',
      proceso: procesoConRelaciones
    });
  } catch (error) {
    console.error('Error al actualizar proceso:', error);
    res.status(500).json({ error: 'Error al actualizar el proceso' });
  }
};

// Eliminar un proceso
exports.eliminarProceso = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const id_ubicacion = req.ubicacionId;
    const proceso = await Proceso.findOne({ where: { id, id_ubicacion }, transaction });
    if (!proceso) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Proceso no encontrado o no pertenece a su ubicacion' });
    }

    // Buscar producto relacionado
    const producto = await Producto.findByPk(proceso.codigo, { transaction });
    if (producto && !proceso.pendiente) {
      const valPesoBruto = parseFloat(proceso.peso_bruto) || 0;
      const valRecorte = parseFloat(proceso.recorte) || 0;
      const valDecomiso = parseFloat(proceso.decomiso) || 0;
      const valPiezas = parseInt(proceso.piezas, 10) || 0;

      // Operación inversa
      // Sumar peso bruto de vuelta en ProductoStock
      const [pStockRecord, created] = await ProductoStock.findOrCreate({
        where: { codigo_producto: proceso.codigo, id_ubicacion },
        defaults: { stock: 0.0000, recorte: 0.000, decomiso: 0.000, kg_fraccionados: 0.000 },
        transaction
      });

      // Operación inversa
      // 1. Restar recorte y decomiso de la ubicación
      const recorteActual = parseFloat(pStockRecord.recorte) || 0;
      const decomisoActual = parseFloat(pStockRecord.decomiso) || 0;

      pStockRecord.recorte = Math.max(0, recorteActual - valRecorte);
      pStockRecord.decomiso = Math.max(0, decomisoActual - valDecomiso);

      // 2. Sumar peso_bruto a stock de ubicación en ProductoStock y manejar reversión de fraccionados
      let sumarBlock = valPesoBruto;
      const valKgASumar = parseFloat(proceso.kg_a_sumar) || 0;
      let esConvertible = await Fraccionado.count({
        where: { codigo_producto_original: proceso.codigo, id_ubicacion },
        transaction
      });
      if (esConvertible === 0 && producto.codigo_fraccionado) {
        await Fraccionado.create({
          id_ubicacion,
          codigo_producto_original: proceso.codigo,
          codigo_fraccionado: producto.codigo_fraccionado,
          peso_a_fraccionar: 0,
          peso_a_descontar: 0
        }, { transaction });
        esConvertible = 1;
      }
      if (esConvertible === 0) {
        // Si no es convertible, restamos de kg_fraccionados de la ubicación
        pStockRecord.kg_fraccionados = Math.max(0, (parseFloat(pStockRecord.kg_fraccionados) || 0) - valKgASumar);

        // Eliminar LogConversion asociado si existe
        await LogConversion.destroy({
          where: {
            id_ubicacion,
            codigo_producto_original: proceso.codigo,
            comprobante: `PROCESO #${proceso.id}`
          },
          transaction
        });
      }

      pStockRecord.stock = parseFloat(pStockRecord.stock) + sumarBlock;
      await pStockRecord.save({
        transaction,
        tipo_movimiento: 'PROCESO',
        referencia_id: proceso.id,
        concepto: `Proceso de ${proceso.proceso || 'Producción'} eliminado. Reversión de stock.`
      });

      // Restore pieces in ProductoVencimiento
      if (valPiezas > 0) {
        const oldestVencimiento = await ProductoVencimiento.findOne({
          where: { codigo_producto: proceso.codigo, id_ubicacion: proceso.id_ubicacion },
          order: [['vencimiento', 'ASC']],
          transaction
        });

        if (oldestVencimiento) {
          oldestVencimiento.piezas = (parseInt(oldestVencimiento.piezas, 10) || 0) + valPiezas;
          await oldestVencimiento.save({ transaction });
        } else {
          // If no batch exists, create a default one expiring in 30 days
          const defaultDate = new Date();
          defaultDate.setDate(defaultDate.getDate() + 30);
          const yyyy = defaultDate.getFullYear();
          const mm = String(defaultDate.getMonth() + 1).padStart(2, '0');
          const dd = String(defaultDate.getDate()).padStart(2, '0');
          const formattedDate = `${yyyy}-${mm}-${dd}`;

          await ProductoVencimiento.create({
            codigo_producto: proceso.codigo,
            vencimiento: formattedDate,
            piezas: valPiezas,
            id_ubicacion: proceso.id_ubicacion
          }, { transaction });
        }
      }
    }

    // 4. Operación inversa para fraccionados: Restar kg_a_sumar de peso_a_fraccionar y valKgADescontar de peso_a_descontar
    const valKgASumar = parseFloat(proceso.kg_a_sumar) || 0;
    const valKgADescontar = parseFloat(proceso.peso_bruto) || 0;
    if (!proceso.pendiente && (valKgASumar > 0 || valKgADescontar > 0)) {
      const mappings = await Fraccionado.findAll({
        where: { codigo_producto_original: proceso.codigo },
        transaction
      });
      for (const mapping of mappings) {
        const pesoActual = parseFloat(mapping.peso_a_fraccionar) || 0;
        mapping.peso_a_fraccionar = Math.max(0, pesoActual - valKgASumar);

        const descActual = parseFloat(mapping.peso_a_descontar) || 0;
        mapping.peso_a_descontar = Math.max(0, descActual - valKgADescontar);

        await mapping.save({ transaction });
      }
    }

    // Eliminar proceso
    await proceso.destroy({ transaction });

    await transaction.commit();
    res.json({ mensaje: 'Proceso eliminado y stock restaurado exitosamente' });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al eliminar proceso:', error);
    res.status(500).json({ error: 'Error al eliminar el proceso' });
  }
};

// Confirmar un proceso pendiente cargando su peso envasado y ejecutando descuentos de stock
exports.confirmarProceso = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { kg_a_sumar } = req.body;

    const proceso = await Proceso.findByPk(id, { transaction });
    if (!proceso) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Proceso no encontrado' });
    }

    if (!proceso.pendiente) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Este proceso ya ha sido confirmado y no está pendiente.' });
    }

    const valKgASumar = parseFloat(kg_a_sumar) || 0;

    // Actualizar el proceso para marcarlo como no pendiente y guardar el peso envasado
    proceso.kg_a_sumar = valKgASumar;
    proceso.pendiente = false;
    await proceso.save({ transaction });

    // Cargar producto asociado
    const producto = await Producto.findByPk(proceso.codigo, { transaction });
    if (!producto) {
      await transaction.rollback();
      return res.status(400).json({ error: `El producto con código ${proceso.codigo} no existe.` });
    }

    // Ejecutar lógica de stock postergada
    const valRecorte = parseFloat(proceso.recorte) || 0;
    const valDecomiso = parseFloat(proceso.decomiso) || 0;
    const valPesoBruto = parseFloat(proceso.peso_bruto) || 0;
    const valPiezas = parseInt(proceso.piezas, 10) || 0;
    const valKgADescontar = parseFloat(proceso.kg_a_desc) || 0;

    // Validar stock
    const [pStockRecord, created] = await ProductoStock.findOrCreate({
      where: { codigo_producto: proceso.codigo, id_ubicacion: proceso.id_ubicacion },
      defaults: { stock: 0.0000, recorte: 0.000, decomiso: 0.000, kg_fraccionados: 0.000 },
      transaction
    });

    const stockActual = parseFloat(pStockRecord.stock) || 0;
    if (valPesoBruto > 0 && proceso.proceso !== 'Fraccionamiento') {
      if (stockActual < valPesoBruto) {
        await transaction.rollback();
        return res.status(400).json({ error: `Stock de kilos insuficiente para confirmar el proceso para el producto ${proceso.codigo} (${producto.nombre}). Disponible: ${stockActual} kg, Requerido: ${valPesoBruto} kg.` });
      }
    }

    const piezasActual = await ProductoVencimiento.sum('piezas', {
      where: { codigo_producto: proceso.codigo, id_ubicacion: proceso.id_ubicacion },
      transaction
    }) || 0;
    if (valPiezas > 0 && proceso.proceso !== 'Fraccionamiento') {
      if (piezasActual < valPiezas) {
        await transaction.rollback();
        return res.status(400).json({ error: `Stock de piezas insuficiente para confirmar el proceso para el producto ${proceso.codigo} (${producto.nombre}). Disponible: ${piezasActual}, Requerido: ${valPiezas}.` });
      }
    }

    // 1. Sumar a recorte y decomiso de la ubicación en ProductoStock
    pStockRecord.recorte = (parseFloat(pStockRecord.recorte) || 0) + valRecorte;
    pStockRecord.decomiso = (parseFloat(pStockRecord.decomiso) || 0) + valDecomiso;

    // 2. Restar peso bruto de stock y manejar stock de fraccionados
    let descuentoCalculado = valPesoBruto;
    let esConvertible = await Fraccionado.count({
      where: { codigo_producto_original: proceso.codigo, id_ubicacion: proceso.id_ubicacion },
      transaction
    });
    if (esConvertible === 0 && producto.codigo_fraccionado) {
      await Fraccionado.create({
        id_ubicacion: proceso.id_ubicacion,
        codigo_producto_original: proceso.codigo,
        codigo_fraccionado: producto.codigo_fraccionado,
        peso_a_fraccionar: 0,
        peso_a_descontar: 0
      }, { transaction });
      esConvertible = 1;
    }
    if (esConvertible === 0) {
      // Sumamos el peso producido a su stock de fraccionados local
      pStockRecord.kg_fraccionados = (parseFloat(pStockRecord.kg_fraccionados) || 0) + valKgASumar;

      // Registrar en LogConversion como conversión directa
      if (valKgASumar > 0) {
        await LogConversion.create({
          id_ubicacion: proceso.id_ubicacion,
          codigo_producto_original: proceso.codigo,
          peso_descontado: valPesoBruto,
          codigo_fraccionado: proceso.codigo,
          peso_fraccionado: valKgASumar,
          comprobante: `PROCESO #${proceso.id}`,
          usuario: req.body.usuario || 'Sistema',
          fecha: new Date()
        }, { transaction });
      }
    }

    pStockRecord.stock = stockActual - descuentoCalculado;
    await pStockRecord.save({ 
      transaction,
      tipo_movimiento: 'PROCESO',
      referencia_id: proceso.id,
      concepto: `Proceso de ${proceso.proceso || 'Producción'} confirmado (peso envasado cargado)`
    });

    // 3. FIFO deduction on ProductoVencimiento (lotes de vencimiento)
    if (valPiezas > 0) {
      const vencimientos = await ProductoVencimiento.findAll({
        where: { codigo_producto: proceso.codigo, id_ubicacion: proceso.id_ubicacion },
        order: [['vencimiento', 'ASC']],
        transaction
      });

      let remainingToDeduct = valPiezas;
      for (const v of vencimientos) {
        if (remainingToDeduct <= 0) break;
        const currentPiezas = parseInt(v.piezas, 10) || 0;
        if (currentPiezas <= remainingToDeduct) {
          remainingToDeduct -= currentPiezas;
          await v.destroy({ transaction });
        } else {
          v.piezas = currentPiezas - remainingToDeduct;
          remainingToDeduct = 0;
          await v.save({ transaction });
        }
      }

      // Si aún restan piezas por descontar (producto sin lotes previos o con piezas insuficientes en lotes)
      if (remainingToDeduct > 0) {
        const farFuture = new Date();
        farFuture.setFullYear(farFuture.getFullYear() + 1);
        const defaultDateStr = farFuture.toISOString().split('T')[0];

        await ProductoVencimiento.create({
          codigo_producto: proceso.codigo,
          id_ubicacion: proceso.id_ubicacion,
          vencimiento: defaultDateStr,
          piezas: -remainingToDeduct
        }, { transaction });
      }
    }

    // 4. Si el código está en fraccionados como producto original (o si el producto tiene codigo_fraccionado configurado), actualizamos peso_a_fraccionar y peso_a_descontar
    const descAplicar = valKgADescontar > 0 ? valKgADescontar : valPesoBruto;
    if (valKgASumar > 0 || descAplicar > 0) {
      let mappings = await Fraccionado.findAll({
        where: { codigo_producto_original: proceso.codigo, id_ubicacion: proceso.id_ubicacion },
        transaction
      });

      if (mappings.length === 0 && producto.codigo_fraccionado) {
        const newMapping = await Fraccionado.create({
          id_ubicacion: proceso.id_ubicacion,
          codigo_producto_original: proceso.codigo,
          codigo_fraccionado: producto.codigo_fraccionado,
          peso_a_fraccionar: 0,
          peso_a_descontar: 0
        }, { transaction });
        mappings = [newMapping];
      }

      for (const mapping of mappings) {
        const pesoActual = parseFloat(mapping.peso_a_fraccionar) || 0;
        mapping.peso_a_fraccionar = pesoActual + valKgASumar;

        const descActual = parseFloat(mapping.peso_a_descontar) || 0;
        mapping.peso_a_descontar = descActual + descAplicar;

        await mapping.save({ transaction });
      }
    }

    await transaction.commit();

    // Obtener proceso completo con relaciones
    const procesoConRelaciones = await Proceso.findByPk(proceso.id, {
      include: [
        {
          model: Producto,
          attributes: ['nombre']
        },
        {
          model: Generador,
          as: 'Generador',
          include: [
            { model: Colaborador, as: 'colaborador', attributes: ['id', 'nombre'] },
            { model: Sucursal, as: 'sucursal', attributes: ['id', 'sucursal'] },
            { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }
          ]
        }
      ]
    });

    const piezasRestantes = await ProductoVencimiento.sum('piezas', {
      where: { codigo_producto: proceso.codigo, id_ubicacion: proceso.id_ubicacion }
    }) || 0;

    res.json({
      mensaje: 'Proceso confirmado y stock descontado exitosamente',
      proceso: procesoConRelaciones,
      productoActualizado: {
        codigo: producto.codigo,
        nombre: producto.nombre,
        stock_nuevo: pStockRecord ? parseFloat(pStockRecord.stock) : 0,
        kilos_calculado_nuevo: pStockRecord ? parseFloat(pStockRecord.stock) : 0,
        kg_recorte_nuevo: pStockRecord ? parseFloat(pStockRecord.recorte) : 0,
        kg_decomiso_nuevo: pStockRecord ? parseFloat(pStockRecord.decomiso) : 0,
        cantidad_piezas_nueva: piezasRestantes
      }
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error al confirmar proceso:', error);
    res.status(500).json({ error: 'Error al confirmar el proceso' });
  }
};
