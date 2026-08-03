const { sequelize, Pedido, ProductoPedido } = require('./src/models');

async function main() {
  try {
    await sequelize.authenticate();
    const pedido = await Pedido.findOne({
      where: { codigo: 'PED-2607-LEF5' }
    });
    if (!pedido) {
      console.log("Pedido not found");
      return;
    }
    console.log("=== PEDIDO INFO ===");
    console.log(JSON.stringify(pedido, null, 2));

    const items = await ProductoPedido.findAll({
      where: { id_pedido: pedido.id }
    });
    console.log("\n=== PEDIDO ITEMS ===");
    console.log(JSON.stringify(items.map(i => ({
      codigo_producto: i.codigo_producto,
      cantidad_pedida: i.cantidad_pedida,
      cantidad_enviada: i.cantidad_enviada, // piezas
      peso_pedido: i.peso_pedido,
      peso_enviado: i.peso_enviado,
      fraccion_pedida: i.fraccion_pedida,
      fraccion_enviada: i.fraccion_enviada, // kilos frac
      confirmado: i.confirmado,
      no_envia: i.no_envia
    })), null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

main();
