const { MovimientoStock } = require('./src/models');

async function main() {
  try {
    const list = await MovimientoStock.findAll({
      where: { tipo_movimiento: 'INGRESO_PROVEEDOR' }
    });
    console.log(`Total INGRESO_PROVEEDOR: ${list.length}`);
    list.forEach(m => {
      if (m.cantidad_piezas < 0) {
        console.log(`Negative: ID: ${m.id}, Prod: ${m.codigo_producto}, Concept: "${m.concepto}", Delta Piezas: ${m.cantidad_piezas}, Kilos Block: ${m.kilos_block}`);
      }
    });
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

main();
