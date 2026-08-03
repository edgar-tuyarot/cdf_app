const { Pedido, ProductoPedido } = require('./src/models');

async function main() {
  try {
    const list = await Pedido.findAll({
      where: { estado: ['Pendiente', 'Armando'] },
      include: [{ model: ProductoPedido, as: 'items' }]
    });
    console.log(`Found ${list.length} pending orders:`);
    list.forEach(p => {
      console.log(`ID: ${p.id}, Code: "${p.codigo}", Sucursal: "${p.sucursal}", Estado: "${p.estado}", Items count: ${p.items.length}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

main();
