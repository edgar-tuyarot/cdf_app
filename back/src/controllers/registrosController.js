const { Registro, sequelize } = require('../models');
const { Op } = require('sequelize');

// 1. Obtener todos los registros con orden cronológico inverso
exports.getRegistros = async (req, res) => {
  try {
    const { busqueda } = req.query;
    const id_ubicacion = req.ubicacionId;

    const whereClause = {};
    if (id_ubicacion) {
      whereClause[Op.or] = [
        { id_ubicacion },
        { id_ubicacion: null }
      ];
    }

    if (busqueda && busqueda.trim() !== '') {
      const query = busqueda.trim();
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { texto: { [Op.like]: `%${query}%` } },
            { usuario_registro: { [Op.like]: `%${query}%` } }
          ]
        }
      ];
    }

    const registros = await Registro.findAll({
      where: whereClause,
      order: [['fecha', 'DESC'], ['id', 'DESC']]
    });

    res.json(registros);
  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({ error: 'Error interno al obtener los registros.' });
  }
};

// 2. Crear un nuevo registro
exports.crearRegistro = async (req, res) => {
  try {
    const { texto, usuario_registro, fecha } = req.body;

    if (!texto || texto.trim() === '') {
      return res.status(400).json({ error: 'El campo texto es obligatorio.' });
    }

    const usuarioFinal = (usuario_registro && usuario_registro.trim() !== '')
      ? usuario_registro.trim()
      : (req.user ? (req.user.nombre || req.user.usuario) : 'Sistema');

    const nuevoRegistro = await Registro.create({
      fecha: fecha ? new Date(fecha) : new Date(),
      texto: texto.trim(),
      usuario_registro: usuarioFinal,
      id_ubicacion: req.ubicacionId || 1
    });

    res.status(201).json({
      mensaje: 'Registro creado exitosamente.',
      registro: nuevoRegistro
    });
  } catch (error) {
    console.error('Error al crear registro:', error);
    res.status(500).json({ error: 'Error interno al guardar el registro.' });
  }
};

// 3. Eliminar un registro por ID
exports.eliminarRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    const registro = await Registro.findByPk(id);

    if (!registro) {
      return res.status(404).json({ error: 'Registro no encontrado.' });
    }

    await registro.destroy();
    res.json({ mensaje: 'Registro eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar registro:', error);
    res.status(500).json({ error: 'Error interno al eliminar el registro.' });
  }
};
