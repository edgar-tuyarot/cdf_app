const { sequelize } = require('./src/models');
async function test() {
  try {
    const [rows] = await sequelize.query("SELECT colaborador, colaborador_id, COUNT(*) as count FROM procesos GROUP BY colaborador, colaborador_id");
    console.log("UNIQUE PROCESS GENERATORS IN DB:", rows);

    const [colaboradores] = await sequelize.query("SELECT id, nombre FROM colaboradores");
    console.log("COLABORADORES IN DB:", colaboradores);

    const [sucursales] = await sequelize.query("SELECT id, sucursal FROM sucursales");
    console.log("SUCURSALES IN DB:", sucursales);
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit();
}
test();
