const { Proceso, Producto, Fraccionado, Colaborador, sequelize } = require('../models');

// Obtener todos los procesos (con datos del producto asociado)
exports.obtenerProcesos = async (req, res) => {
  try {
    const procesos = await Proceso.findAll({
      include: [
        {
          model: Producto,
          attributes: ['nombre']
        },
        {
          model: Colaborador,
          as: 'Colaborador',
          attributes: ['nombre']
        }
      ]
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
    const proceso = await Proceso.findByPk(id, {
      include: [
        {
          model: Producto,
          attributes: ['nombre']
        },
        {
          model: Colaborador,
          as: 'Colaborador',
          attributes: ['nombre']
        }
      ]
    });
    if (!proceso) {
      return res.status(404).json({ error: 'Proceso no encontrado' });
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
      colaborador_id, proceso, fecha, codigo, piezas,
      peso_bruto, recorte, decomiso, kg_a_desc, kg_a_sumar
    } = req.body;

    if (!codigo) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El campo "codigo" de producto es obligatorio.' });
    }

    //Validar que el producto exista
    const producto = await Producto.findByPk(codigo, { transaction });
    if (!producto) {
      await transaction.rollback();
      return res.status(400).json({ error: `El producto con código ${codigo} no existe.` });
    }

    //Parsear valores numéricos
    const valPesoBruto = parseFloat(peso_bruto) || 0;
    const valRecorte = parseFloat(recorte) || 0;
    const valDecomiso = parseFloat(decomiso) || 0;
    const valPiezas = parseInt(piezas, 10) || 0;

    // Crear el proceso
    const nuevoProceso = await Proceso.create({
      colaborador_id,
      colaborador: null, // Dejando sin efecto el nombre (string)
      proceso,
      fecha: fecha || new Date(),
      codigo,
      piezas: valPiezas,
      peso_bruto: valPesoBruto,
      recorte: valRecorte,
      decomiso: valDecomiso,
      kg_a_desc: kg_a_desc || 0,
      kg_a_sumar: kg_a_sumar || 0
    }, { transaction });

    // Modificar stock del producto
    // 1. Sumar a kg_recorte y kg_decomiso
    producto.kg_recorte = (parseFloat(producto.kg_recorte) || 0) + valRecorte;
    producto.kg_decomiso = (parseFloat(producto.kg_decomiso) || 0) + valDecomiso;

    // 2. Restar peso bruto de kilos_block
    const blockActual = parseFloat(producto.kilos_block) || 0;
    producto.kilos_block = blockActual - valPesoBruto;

    // 3. Restar piezas de cantidad_piezas
    const piezasActual = parseInt(producto.cantidad_piezas, 10) || 0;
    producto.cantidad_piezas = Math.max(0, piezasActual - valPiezas);

    await producto.save({ transaction });

    // 4. Si el código está en fraccionados como producto original, actualizamos peso_a_fraccionar y peso_a_descontar
    const valKgASumar = parseFloat(kg_a_sumar) || 0;
    const valKgADescontar = parseFloat(kg_a_desc) || 0;
    if (valKgASumar > 0 || valKgADescontar > 0) {
      const mappings = await Fraccionado.findAll({
        where: { codigo_producto_original: codigo },
        transaction
      });
      for (const mapping of mappings) {
        const pesoActual = parseFloat(mapping.peso_a_fraccionar) || 0;
        mapping.peso_a_fraccionar = pesoActual + valKgASumar;

        const descActual = parseFloat(mapping.peso_a_descontar) || 0;
        mapping.peso_a_descontar = descActual + valKgADescontar;

        await mapping.save({ transaction });
      }
    }

    await transaction.commit();


    res.status(201).json({
      mensaje: 'Proceso registrado y stock actualizado exitosamente',
      proceso: nuevoProceso,
      productoActualizado: {
        codigo: producto.codigo,
        nombre: producto.nombre,
        kilos_block_nuevo: producto.kilos_block,
        kg_recorte_nuevo: producto.kg_recorte,
        kg_decomiso_nuevo: producto.kg_decomiso,
        cantidad_piezas_nueva: producto.cantidad_piezas
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
    const proceso = await Proceso.findByPk(id);
    if (!proceso) {
      return res.status(404).json({ error: 'Proceso no encontrado' });
    }

    // Si se está cambiando el código de producto, validar que exista
    if (req.body.codigo) {
      const productoExiste = await Producto.findByPk(req.body.codigo);
      if (!productoExiste) {
        return res.status(400).json({ error: `El producto con código ${req.body.codigo} no existe.` });
      }
    }

    await proceso.update(req.body);

    res.json({
      mensaje: 'Proceso actualizado exitosamente',
      proceso
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
    const proceso = await Proceso.findByPk(id, { transaction });
    if (!proceso) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Proceso no encontrado' });
    }

    // Buscar producto relacionado
    const producto = await Producto.findByPk(proceso.codigo, { transaction });
    if (producto) {
      const valPesoBruto = parseFloat(proceso.peso_bruto) || 0;
      const valRecorte = parseFloat(proceso.recorte) || 0;
      const valDecomiso = parseFloat(proceso.decomiso) || 0;
      const valPiezas = parseInt(proceso.piezas, 10) || 0;

      // Operación inversa
      // 1. Restar recorte y decomiso
      const recorteActual = parseFloat(producto.kg_recorte) || 0;
      const decomisoActual = parseFloat(producto.kg_decomiso) || 0;

      producto.kg_recorte = Math.max(0, recorteActual - valRecorte);
      producto.kg_decomiso = Math.max(0, decomisoActual - valDecomiso);

      // 2. Sumar peso_bruto a kilos_block
      const blockActual = parseFloat(producto.kilos_block) || 0;
      producto.kilos_block = blockActual + valPesoBruto;

      // 3. Sumar piezas a cantidad_piezas
      const piezasActual = parseInt(producto.cantidad_piezas, 10) || 0;
      producto.cantidad_piezas = piezasActual + valPiezas;

      await producto.save({ transaction });
    }

    // 4. Operación inversa para fraccionados: Restar kg_a_sumar de peso_a_fraccionar y valKgADescontar de peso_a_descontar
    const valKgASumar = parseFloat(proceso.kg_a_sumar) || 0;
    const valKgADescontar = parseFloat(proceso.peso_bruto) || 0;
    if (valKgASumar > 0 || valKgADescontar > 0) {
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

