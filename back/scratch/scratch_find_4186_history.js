const { sequelize, Proceso, LogConversion } = require('./src/models');
const { Op } = require('sequelize');

async function main() {
  try {
    await sequelize.authenticate();
    
    // Find all conversions where 4186 is original or fractioned
    const conversions = await LogConversion.findAll({
      where: {
        [Op.or]: [
          { codigo_producto_original: '4186' },
          { codigo_fraccionado: '4186' }
        ]
      }
    });
    console.log("=== CONVERSIONS INVOLVING 4186 ===");
    console.log(JSON.stringify(conversions, null, 2));

    // Find all processes where 4186 is involved
    const procesos = await Proceso.findAll({
      where: { codigo: '4186' }
    });
    console.log("\n=== PROCESOS INVOLVING 4186 ===");
    console.log(JSON.stringify(procesos, null, 2));

    // Let's also check if there is a stock movement table, let's search in sequelize models
    const models = Object.keys(sequelize.models);
    console.log("\n=== ALL SEQUELIZE MODELS ===");
    console.log(models);

    // If there is MovimientoStock, query it for 4186
    if (sequelize.models.MovimientoStock) {
      const MovimientoStock = sequelize.models.MovimientoStock;
      const movements = await MovimientoStock.findAll({
        where: { codigo_producto: '4186' },
        limit: 20,
        order: [['createdAt', 'DESC']]
      });
      console.log("\n=== STOCK MOVEMENTS FOR 4186 ===");
      console.log(JSON.stringify(movements, null, 2));
    }
  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

main();
