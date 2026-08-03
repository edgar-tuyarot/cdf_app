const { RolPermiso, sequelize } = require('../models');

// Obtener todos los permisos configurados
exports.obtenerPermisos = async (req, res) => {
  try {
    const permisos = await RolPermiso.findAll();
    res.json(permisos);
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({ error: 'Error al obtener permisos' });
  }
};

// Guardar o actualizar un listado de permisos (bulk upsert)
exports.actualizarPermisos = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { permisos } = req.body;
    if (!Array.isArray(permisos)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'El cuerpo de la solicitud debe contener un array de permisos' });
    }

    for (const p of permisos) {
      await RolPermiso.upsert({
        rol: p.rol,
        vista: p.vista,
        permitido: !!p.permitido
      }, { transaction });
    }

    await transaction.commit();
    res.json({ mensaje: 'Permisos actualizados exitosamente' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al guardar permisos:', error);
    res.status(500).json({ error: 'Error al guardar permisos en el servidor' });
  }
};
