const { MovimientoStock } = require('./src/models');

async function main() {
  try {
    const list = await MovimientoStock.findAll({
      where: { tipo_movimiento: 'INGRESO_PROVEEDOR' },
      order: [['id', 'ASC']]
    });
    list.forEach(m => {
      console.log(`ID: ${m.id}, Date: ${m.fecha.toISOString()}, Prod: ${m.codigo_producto}, Concept: "${m.concepto}", Delta: ${m.cantidad_piezas}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

main();
