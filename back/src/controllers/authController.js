const { Usuario, Ubicacion } = require('../models');

exports.login = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Buscar el usuario de forma insensible a mayúsculas, incluyendo su Ubicación
    const dbUser = await Usuario.findOne({
      where: { nombre: usuario.toLowerCase() },
      include: [{
        model: Ubicacion,
        as: 'Ubicacion',
        attributes: ['id', 'nombre']
      }]
    });

    if (!dbUser || dbUser.contrasena !== password) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    res.json({
      success: true,
      user: {
        id_usuario: dbUser.id,
        usuario: dbUser.nombre,
        nombre_completo: dbUser.nombre,
        rol: dbUser.rol,
        id_ubicacion: dbUser.id_ubicacion,
        nombre_ubicacion: dbUser.Ubicacion ? dbUser.Ubicacion.nombre : null,
        estado: 'Activo'
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
