const { sequelize } = require('./src/models');

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Database connected. Altering 'productos' table to add 'activo' column...");

    // Check if column already exists
    const [columns] = await sequelize.query("DESCRIBE productos");
    const hasActivo = columns.some(col => col.Field === 'activo');

    if (!hasActivo) {
      await sequelize.query("ALTER TABLE productos ADD COLUMN activo TINYINT(1) DEFAULT 1;");
      console.log("Column 'activo' added successfully!");
    } else {
      console.log("Column 'activo' already exists.");
    }
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await sequelize.close();
  }
}

main();
