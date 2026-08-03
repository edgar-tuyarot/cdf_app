const { sequelize } = require('./src/models');

async function main() {
  try {
    await sequelize.authenticate();
    const MovimientoStock = sequelize.models.MovimientoStock;
    console.log("MovimientoStock attributes:", Object.keys(MovimientoStock.rawAttributes));
    
    // Find all movements for 4186
    const movements = await MovimientoStock.findAll({
      where: { codigo_producto: '4186' },
      order: [['id', 'DESC']] // Order by ID instead of createdAt
    });
    console.log("=== STOCK MOVEMENTS FOR 4186 ===");
    console.log(JSON.stringify(movements.map(m => ({
      id: m.id,
      tipo_movimiento: m.tipo_movimiento,
      concepto: m.concepto,
      cantidad_piezas: m.cantidad_piezas,
      stock: m.stock,
      kilos_calculado: m.kilos_calculado,
      kg_fraccionados: m.kg_fraccionados,
      kg_decomiso: m.kg_decomiso,
      kg_recorte: m.kg_recorte,
      usuario: m.usuario,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    })), null, 2));

  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

main();
