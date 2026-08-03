const { sequelize } = require('./src/models');

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    const [users] = await sequelize.query("SELECT id, nombre, rol FROM usuarios;");
    console.log("Users in database:", users);

    const [distinctRoles] = await sequelize.query("SELECT DISTINCT rol FROM usuarios;");
    console.log("Distinct roles:", distinctRoles);

  } catch (error) {
    console.error("Error checking roles:", error);
  } finally {
    await sequelize.close();
  }
}

main();
