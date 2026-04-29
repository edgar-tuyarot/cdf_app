const { sequelize } = require('./src/models');
async function test() {
  const [results] = await sequelize.query("SHOW TABLES");
  console.log(results);
  process.exit();
}
test();
