const { sequelize } = require('../src/models');

async function run() {
  try {
    const [columns] = await sequelize.query('DESCRIBE producto_vencimientos;');
    console.log('Columns in producto_vencimientos:', columns);
    process.exit(0);
  } catch (error) {
    console.error('Error describing table:', error);
    process.exit(1);
  }
}

run();
