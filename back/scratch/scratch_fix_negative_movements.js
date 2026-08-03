const { sequelize } = require('./src/models');

async function main() {
  try {
    const [results] = await sequelize.query(`
      UPDATE movimiento_stocks 
      SET cantidad_piezas = ABS(cantidad_piezas) 
      WHERE tipo_movimiento = 'INGRESO_PROVEEDOR' AND cantidad_piezas < 0
    `);
    console.log('Database correction completed.');
    console.log('Rows affected:', results.affectedRows || results.changedRows || 0);
  } catch (error) {
    console.error('Error running correction query:', error);
  } finally {
    process.exit();
  }
}

main();
