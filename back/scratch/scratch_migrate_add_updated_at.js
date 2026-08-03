const { sequelize } = require('./src/models');

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Database connected. Altering 'productos' table to add 'updated_at' column...");

    // Check if column already exists
    const [columns] = await sequelize.query("DESCRIBE productos");
    const hasUpdatedAt = columns.some(col => col.Field === 'updated_at');

    if (!hasUpdatedAt) {
      await sequelize.query("ALTER TABLE productos ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;");
      console.log("Column 'updated_at' added successfully with auto-update!");
    } else {
      console.log("Column 'updated_at' already exists.");
    }
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await sequelize.close();
  }
}

main();
