const { Producto, ProductoVencimiento, MovimientoStock, IngresoProveedor, sequelize } = require('./src/models');

async function inspect() {
  try {
    await sequelize.authenticate();
    console.log("=== PRODUCTO 3781 ===");
    const prod = await Producto.findByPk('3781');
    if (!prod) {
      console.log("Producto 3781 no encontrado en la base de datos.");
    } else {
      console.log(JSON.stringify(prod.toJSON(), null, 2));
    }

    console.log("\n=== VENCIMIENTOS DE 3781 ===");
    const v = await ProductoVencimiento.findAll({ where: { codigo_producto: '3781' } });
    console.log(JSON.stringify(v.map(x => x.toJSON()), null, 2));

    console.log("\n=== INGRESOS PROVEEDOR DE 3781 ===");
    const i = await IngresoProveedor.findAll({ where: { codigo_producto: '3781' } });
    console.log(JSON.stringify(i.map(x => x.toJSON()), null, 2));

    console.log("\n=== MOVIMIENTOS DE STOCK RECIENTES DE 3781 ===");
    const m = await MovimientoStock.findAll({ 
      where: { codigo_producto: '3781' },
      order: [['fecha', 'DESC'], ['id', 'DESC']],
      limit: 10
    });
    console.log(JSON.stringify(m.map(x => x.toJSON()), null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sequelize.close();
  }
}

inspect();
