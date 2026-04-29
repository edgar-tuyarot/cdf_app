const { Usuario } = require('../models');

// Obtener todos los usuarios
exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password'] } // Por seguridad básica, no enviamos password en el listado
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// Crear usuario
exports.crearUsuario = async (req, res) => {
  try {
    const { usuario, password, rol } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y password son obligatorios' });
    }

    const nuevoUsuario = await Usuario.create({ usuario, password, rol });
    res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: { id: nuevoUsuario.id_usuario, usuario: nuevoUsuario.usuario, rol: nuevoUsuario.rol } });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear el usuario (puede que el nombre ya exista)' });
  }
};

// Login básico (sin tokens ni hashing por pedido del usuario)
exports.login = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    const user = await Usuario.findOne({ where: { usuario, password } });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json({ mensaje: 'Login exitoso', usuario: { id: user.id_usuario, usuario: user.usuario, rol: user.rol } });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el proceso de login' });
  }
};

// Eliminar usuario
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await Usuario.destroy({ where: { id_usuario: id } });
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
