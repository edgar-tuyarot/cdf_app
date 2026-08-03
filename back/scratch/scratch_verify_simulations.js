const { MovimientoStock, Producto } = require('./src/models');

async function main() {
  const productsToCheck = ['3781', '2912', '5075', '4787', '2379', '3755'];
  
  for (const code of productsToCheck) {
    try {
      const prod = await Producto.findByPk(code);
      if (!prod) continue;
      
      const movs = await MovimientoStock.findAll({
        where: { codigo_producto: code },
        order: [['fecha', 'ASC'], ['id', 'ASC']]
      });
      
      let calculatedNoFix = 0;
      let calculatedWithFix = 0;
      
      movs.forEach(m => {
        let delta = parseInt(m.cantidad_piezas, 10) || 0;
        calculatedNoFix += delta;
        
        // If it's a negative INGRESO_PROVEEDOR, fix the sign in the simulation
        if (m.tipo_movimiento === 'INGRESO_PROVEEDOR' && delta < 0) {
          delta = -delta;
        }
        calculatedWithFix += delta;
      });
      
      console.log(`Product ${code} (${prod.nombre}):`);
      console.log(`  Actual Stock Table: ${prod.cantidad_piezas} u`);
      console.log(`  Calculated (No Fix): ${calculatedNoFix} u (Diff: ${prod.cantidad_piezas - calculatedNoFix})`);
      console.log(`  Calculated (With Fix): ${calculatedWithFix} u (Diff: ${prod.cantidad_piezas - calculatedWithFix})`);
      console.log('---');
    } catch (e) {
      console.error(e);
    }
  }
  process.exit();
}

main();
