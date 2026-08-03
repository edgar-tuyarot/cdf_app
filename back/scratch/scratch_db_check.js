const { sequelize } = require('./src/models');

async function checkTable() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully!");
    
    // Check if table exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'ingresos_sucursales'");
    console.log("Table 'ingresos_sucursales' exists check:", tables);
    
    if (tables.length > 0) {
      const [columns] = await sequelize.query("DESCRIBE ingresos_sucursales");
      console.log("Columns of ingresos_sucursales:");
      console.table(columns);
    } else {
      console.log("Table 'ingresos_sucursales' does NOT exist!");
    }
  } catch (error) {
    console.error("Database error:", error);
  } finally {
    await sequelize.close();
  }
}

checkTable();
