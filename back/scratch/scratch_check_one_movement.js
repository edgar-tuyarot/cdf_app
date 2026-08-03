const { MovimientoStock } = require('./src/models');

async function main() {
  try {
    const m = await MovimientoStock.findByPk(1920);
    if (m) {
      console.log(JSON.stringify(m, null, 2));
    } else {
      console.log("Movement not found");
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

main();
