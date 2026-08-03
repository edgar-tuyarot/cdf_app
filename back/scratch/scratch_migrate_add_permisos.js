const { sequelize } = require('./src/models');

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Database connected.");

    // Create table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS rol_permisos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rol VARCHAR(50) NOT NULL,
        vista VARCHAR(100) NOT NULL,
        permitido TINYINT(1) DEFAULT 0,
        UNIQUE KEY unique_rol_vista (rol, vista)
      );
    `);
    console.log("Table 'rol_permisos' created successfully.");

    // Clear old data if any
    await sequelize.query("DELETE FROM rol_permisos;");

    // Default permissions list
    const defaults = [
      // Colaborador
      { rol: 'Colaborador', vista: 'pedidos', permitido: 1 },
      { rol: 'Colaborador', vista: 'procesos', permitido: 1 },
      { rol: 'Colaborador', vista: 'conversiones', permitido: 1 },
      { rol: 'Colaborador', vista: 'ingreso-recortes', permitido: 1 },
      { rol: 'Colaborador', vista: 'vencimientos', permitido: 1 },
      { rol: 'Colaborador', vista: 'demanda-pendiente', permitido: 1 },
      { rol: 'Colaborador', vista: 'organizacion', permitido: 1 },

      // Usuario (acting as Reporter)
      { rol: 'Usuario', vista: 'reporte-produccion', permitido: 1 },
      { rol: 'Usuario', vista: 'analisis-rendimiento', permitido: 1 },
      { rol: 'Usuario', vista: 'rendimiento-estimado', permitido: 1 },
      { rol: 'Usuario', vista: 'evolucion-stock', permitido: 1 },
      { rol: 'Usuario', vista: 'fifo-audit', permitido: 1 },
      { rol: 'Usuario', vista: 'vencimientos', permitido: 1 },

      // Sucursal / Sucursales
      { rol: 'Sucursal', vista: 'crear-pedido-sucursal', permitido: 1 },
      { rol: 'Sucursal', vista: 'pedidos', permitido: 1 }
    ];

    for (const d of defaults) {
      await sequelize.query(
        "INSERT INTO rol_permisos (rol, vista, permitido) VALUES (?, ?, ?);",
        { replacements: [d.rol, d.vista, d.permitido] }
      );
    }
    console.log("Default permissions inserted successfully.");

  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await sequelize.close();
  }
}

main();
