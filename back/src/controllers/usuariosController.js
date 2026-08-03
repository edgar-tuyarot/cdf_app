const { Usuario, Ubicacion } = require('../models');

exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'rol', 'id_ubicacion'],
      include: [{
        model: Ubicacion,
        as: 'Ubicacion',
        attributes: ['id', 'numero', 'nombre']
      }],
      order: [['nombre', 'ASC']]
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios del sistema' });
  }
};

exports.obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id, {
      attributes: ['id', 'nombre', 'rol', 'id_ubicacion'],
      include: [{
        model: Ubicacion,
        as: 'Ubicacion',
        attributes: ['id', 'numero', 'nombre']
      }]
    });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, contrasena, rol, id_ubicacion } = req.body;
    if (!nombre || !contrasena || !rol) {
      return res.status(400).json({ error: 'Nombre de usuario, contraseña y rol son requeridos' });
    }
    
    // Verificar si el usuario ya existe
    const existing = await Usuario.findOne({ where: { nombre: nombre.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
    }

    const nuevoUsuario = await Usuario.create({
      nombre: nombre.toLowerCase(),
      contrasena,
      rol,
      id_ubicacion: id_ubicacion || null
    });

    const result = await Usuario.findByPk(nuevoUsuario.id, {
      attributes: ['id', 'nombre', 'rol', 'id_ubicacion'],
      include: [{
        model: Ubicacion,
        as: 'Ubicacion',
        attributes: ['id', 'numero', 'nombre']
      }]
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contrasena, rol, id_ubicacion } = req.body;
    
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    if (nombre) {
      // Verificar si el nuevo nombre ya está ocupado por otro usuario
      const existing = await Usuario.findOne({ where: { nombre: nombre.toLowerCase() } });
      if (existing && existing.id !== usuario.id) {
        return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
      }
      usuario.nombre = nombre.toLowerCase();
    }

    if (contrasena) {
      usuario.contrasena = contrasena;
    }

    if (rol) {
      usuario.rol = rol;
    }

    if (id_ubicacion !== undefined) {
      usuario.id_ubicacion = id_ubicacion || null;
    }

    await usuario.save();
    
    const result = await Usuario.findByPk(usuario.id, {
      attributes: ['id', 'nombre', 'rol', 'id_ubicacion'],
      include: [{
        model: Ubicacion,
        as: 'Ubicacion',
        attributes: ['id', 'numero', 'nombre']
      }]
    });

    res.json(result);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Evitar que el administrador se elimine a sí mismo
    if (usuario.nombre.toLowerCase() === 'admin') {
      return res.status(400).json({ error: 'No se puede eliminar el usuario administrador por defecto' });
    }

    await usuario.destroy();
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
