const { IngresoProveedor } = require('./src/models');

async function main() {
  try {
    const ip = await IngresoProveedor.findByPk(87);
    if (ip) {
      console.log(JSON.stringify(ip, null, 2));
    } else {
      console.log("IngresoProveedor not found");
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

main();
