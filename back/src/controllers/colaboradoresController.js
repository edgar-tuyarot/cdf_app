const { Colaborador } = require('../models');

// Obtener todos los colaboradores
exports.obtenerColaboradores = async (req, res) => {
  try {
    const colaboradores = await Colaborador.findAll();
    res.json(colaboradores);
  } catch (error) {
    console.error('Error al obtener colaboradores:', error);
    res.status(500).json({ error: 'Error al obtener colaboradores' });
  }
};

// Crear un nuevo colaborador
exports.crearColaborador = async (req, res) => {
  try {
    const { nombre, rol, password } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const nuevoColaborador = await Colaborador.create({
      nombre,
      rol: rol || 'Fiambrero',
      password
    });

    res.status(201).json({
      mensaje: 'Colaborador creado exitosamente',
      colaborador: nuevoColaborador
    });
  } catch (error) {
    console.error('Error al crear colaborador:', error);
    res.status(500).json({ error: 'Error al crear el colaborador' });
  }
};

// Modificar un colaborador existente
exports.modificarColaborador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, rol, password } = req.body;

    const colaborador = await Colaborador.findByPk(id);

    if (!colaborador) {
      return res.status(404).json({ error: 'Colaborador no encontrado' });
    }

    // Actualizar campos si vienen en el body
    colaborador.nombre = nombre || colaborador.nombre;
    colaborador.rol = rol || colaborador.rol;
    colaborador.password = password || colaborador.password;

    await colaborador.save();

    res.json({
      mensaje: 'Colaborador actualizado exitosamente',
      colaborador
    });
  } catch (error) {
    console.error('Error al modificar colaborador:', error);
    res.status(500).json({ error: 'Error al actualizar el colaborador' });
  }
};
