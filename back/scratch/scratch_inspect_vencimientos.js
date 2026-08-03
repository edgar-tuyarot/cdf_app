const { sequelize, Producto, ProductoVencimiento } = require('./src/models');

async function main() {
  try {
    await sequelize.authenticate();
    const vencimientos = await ProductoVencimiento.findAll({
      limit: 10
    });
    console.log("VENCIMIENTOS:");
    console.log(vencimientos.map(v => ({
      id: v.id,
      codigo_producto: v.codigo_producto,
      piezas: v.piezas,
      vencimiento: v.vencimiento
    })));

    const productos = await Producto.findAll({
      limit: 10
    });
    console.log("PRODUCTOS:");
    console.log(productos.map(p => ({
      codigo: p.codigo,
      nombre: p.nombre,
      cantidad_piezas: p.cantidad_piezas
    })));
  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

main();
