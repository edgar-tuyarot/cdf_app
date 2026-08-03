const { sequelize, MovimientoStock, Producto } = require('./src/models');

async function main() {
  try {
    const prod = await Producto.findByPk('3781');
    if (!prod) {
      console.log("Product not found");
      return;
    }
    console.log(`Product: ${prod.nombre}`);
    console.log(`Current cantidad_piezas: ${prod.cantidad_piezas}`);
    console.log(`Current kilos_block: ${prod.kilos_block}`);

    const movs = await MovimientoStock.findAll({
      where: { codigo_producto: '3781' },
      order: [['fecha', 'ASC'], ['id', 'ASC']]
    });

    console.log(`Found ${movs.length} movements:`);
    let cumulative = 0;
    movs.forEach((m, idx) => {
      cumulative += parseInt(m.cantidad_piezas, 10) || 0;
      console.log(`${idx + 1}. [${m.fecha.toISOString()}] Type: ${m.tipo_movimiento}, Concept: "${m.concepto}", Delta Piezas: ${m.cantidad_piezas}, Cumulative: ${cumulative}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

main();
