const { Pedido } = require('./src/models');

async function main() {
  try {
    const list = await Pedido.findAll({ limit: 15, order: [['id', 'DESC']] });
    console.log(`Found ${list.length} recent pedidos:`);
    list.forEach(p => {
      console.log(`ID: ${p.id}, Codigo: "${p.codigo}", Fecha: "${p.fecha}", Sucursal: "${p.sucursal}", Estado: "${p.estado}"`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

main();
