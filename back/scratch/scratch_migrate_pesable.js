const { sequelize, Producto } = require('./src/models');

async function migrate() {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.authenticate();
    console.log("Database connected. Starting migration...");

    const productos = await Producto.findAll({ transaction });
    const nonPesableRegex = /(?:\d+\s*X|X\s*\d+)(?![\s\d\.]*k)/i;

    let updatedCount = 0;
    for (const p of productos) {
      const isNonPesable = nonPesableRegex.test(p.nombre);
      const targetPesable = !isNonPesable;

      if (p.pesable !== targetPesable) {
        console.log(`Updating product [${p.codigo}] ${p.nombre}: pesable = ${targetPesable}`);
        p.pesable = targetPesable;
        // Prevent registering direct audit log delta changes for this initial cleanup
        await p.save({ transaction, skipAuditLog: true });
        updatedCount++;
      }
    }

    await transaction.commit();
    console.log(`Migration successful. Updated ${updatedCount} products.`);
  } catch (err) {
    console.error("Migration failed:", err);
    if (!transaction.finished) {
      await transaction.rollback();
    }
  } finally {
    await sequelize.close();
  }
}

migrate();
