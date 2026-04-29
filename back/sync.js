const { sequelize } = require('./src/models');

async function syncDatabase() {
  try {
    // Autenticamos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida exitosamente.');

    // Sincronizamos (force: false para no borrar si ya existen)
    await sequelize.sync({ alter: true });
    console.log('Todas las tablas fueron creadas/sincronizadas correctamente según los modelos.');
  } catch (error) {
    console.error('Error al conectar o sincronizar con la base de datos:', error);
  } finally {
    // Cerramos la conexión para que el script termine
    await sequelize.close();
  }
}

syncDatabase();
