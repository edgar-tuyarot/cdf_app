const { sequelize } = require('./src/models');

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Database connected. Altering 'procesos' table to add 'peso_bandeja' column...");

    // Check if column already exists
    const [columns] = await sequelize.query("DESCRIBE procesos");
    const hasPesoBandeja = columns.some(col => col.Field === 'peso_bandeja');

    if (!hasPesoBandeja) {
      await sequelize.query("ALTER TABLE procesos ADD COLUMN peso_bandeja DECIMAL(10, 3) DEFAULT 0.000;");
      console.log("Column 'peso_bandeja' added successfully!");
    } else {
      console.log("Column 'peso_bandeja' already exists.");
    }
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await sequelize.close();
  }
}

main();
