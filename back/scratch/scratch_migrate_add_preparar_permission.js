const { sequelize } = require('./src/models');

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Database connected.");

    // Insert permission for Colaborador on 'preparar'
    await sequelize.query(`
      INSERT INTO rol_permisos (rol, vista, permitido) 
      VALUES ('Colaborador', 'preparar', 1)
      ON DUPLICATE KEY UPDATE permitido = 1;
    `);
    console.log("Permission for Colaborador on 'preparar' view inserted successfully.");

  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await sequelize.close();
  }
}

main();
