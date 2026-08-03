const { sequelize } = require('./src/models');

async function main() {
  try {
    await sequelize.authenticate();
    const [columns] = await sequelize.query("DESCRIBE productos");
    console.log("Columns of table 'productos':");
    console.table(columns);
  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

main();
