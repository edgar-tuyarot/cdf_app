const { Sucursal } = require('./src/models');

async function main() {
  try {
    const list = await Sucursal.findAll();
    console.log(`Found ${list.length} sucursales:`);
    list.forEach(s => {
      console.log(`ID: ${s.id}, Sucursal: "${s.sucursal}", Numero: "${s.numero}", Tipo: "${s.tipo}"`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

main();
