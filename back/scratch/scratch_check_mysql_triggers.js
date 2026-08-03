const { sequelize } = require('./src/models');

async function main() {
  try {
    const [results] = await sequelize.query("SHOW TRIGGERS");
    console.log(`Found ${results.length} triggers:`);
    results.forEach(t => {
      console.log(`Trigger: ${t.Trigger}, Table: ${t.Table}, Event: ${t.Event}, Timing: ${t.Timing}, Statement: ${t.Statement}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

main();
