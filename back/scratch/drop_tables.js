const { sequelize } = require('../src/models');

async function run() {
  try {
    console.log('Dropping tables envio_items and envios if they exist...');
    await sequelize.query('DROP TABLE IF EXISTS envio_items;');
    await sequelize.query('DROP TABLE IF EXISTS envios;');
    console.log('Tables dropped successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error dropping tables:', error);
    process.exit(1);
  }
}

run();
