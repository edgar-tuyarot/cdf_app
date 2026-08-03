const { sequelize, Producto, ProductoVencimiento, Proceso, LogConversion } = require('./src/models');
const { Op } = require('sequelize');

async function main() {
  try {
    await sequelize.authenticate();
    
    // 1. Get product 4186 details
    const product = await Producto.findOne({
      where: { codigo: '4186' },
      include: [{ model: ProductoVencimiento, as: 'vencimientosList' }]
    });
    
    if (!product) {
      console.log("Product 4186 not found!");
      return;
    }
    
    console.log("=== PRODUCT 4186 INFO ===");
    console.log(JSON.stringify(product, null, 2));
    
    // 2. Search for any processes or conversions involving product 4186
    // Let's find columns in Proceso and LogConversion models first to see if they relate to codigo_producto or similar.
    console.log("\n=== MODEL FIELDS ===");
    console.log("Proceso attributes:", Object.keys(Proceso.rawAttributes));
    if (LogConversion) {
      console.log("LogConversion attributes:", Object.keys(LogConversion.rawAttributes));
    }
    
  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

main();
