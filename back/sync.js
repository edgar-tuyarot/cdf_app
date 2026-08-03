const { sequelize } = require('./src/models');

async function syncDatabase() {
  try {
    // 1. Autenticar conexión
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida exitosamente.');

    // 2. Crear las nuevas tablas proveedores y generadores si no existen
    console.log('Creando nuevas tablas si no existen...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS proveedores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS generadores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tipo VARCHAR(255) NOT NULL,
        id_asociado INT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);


    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS pedidos_sin_stock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_pedido INT NOT NULL,
        codigo_producto VARCHAR(255) NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY (codigo_producto) REFERENCES productos(codigo) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sucursal_producto_permisos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_sucursal INT NOT NULL,
        codigo_producto VARCHAR(255) NOT NULL,
        permite_piezas TINYINT(1) NOT NULL DEFAULT 1,
        permite_fracciones TINYINT(1) NOT NULL DEFAULT 1,
        UNIQUE KEY uq_suc_prod (id_sucursal, codigo_producto),
        FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE CASCADE,
        FOREIGN KEY (codigo_producto) REFERENCES productos(codigo) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Tabla sucursal_producto_permisos verificada/creada.');
 
    console.log('Creando tabla bultos si no existe...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS bultos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        codigo_producto VARCHAR(255) NOT NULL,
        id_proveedor INT NOT NULL,
        peso_caja DECIMAL(10,3) NOT NULL DEFAULT 0.000,
        peso_caja_vacia DECIMAL(10,3) NOT NULL DEFAULT 0.000,
        cantidad_piezas INT NOT NULL DEFAULT 0,
        activo TINYINT(1) NOT NULL DEFAULT 1,
        FOREIGN KEY (codigo_producto) REFERENCES productos(codigo) ON DELETE CASCADE,
        FOREIGN KEY (id_proveedor) REFERENCES proveedores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Tabla bultos verificada/creada.');

    const [bultosColsCheck] = await sequelize.query("DESCRIBE bultos");
    if (!bultosColsCheck.find(c => c.Field === 'peso_caja_vacia')) {
      await sequelize.query("ALTER TABLE bultos ADD COLUMN peso_caja_vacia DECIMAL(10,3) NOT NULL DEFAULT 0.000;");
      console.log('Columna peso_caja_vacia agregada a la tabla bultos.');
    }

    // 3. Agregar nuevas columnas si no existen (como nullables)
    console.log('Comprobando y agregando nuevas columnas generador_id y proveedor_id...');
    
    const [procesosCols] = await sequelize.query("DESCRIBE procesos");
    if (!procesosCols.find(c => c.Field === 'generador_id')) {
      await sequelize.query("ALTER TABLE procesos ADD COLUMN generador_id INT NULL;");
      console.log('Columna generador_id agregada a procesos.');
    }

    if (!procesosCols.find(c => c.Field === 'createdAt')) {
      await sequelize.query("ALTER TABLE procesos ADD COLUMN createdAt DATETIME NULL;");
      await sequelize.query("UPDATE procesos SET createdAt = CAST(fecha AS DATETIME) WHERE createdAt IS NULL;");
      await sequelize.query("ALTER TABLE procesos MODIFY COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;");
      console.log('Columna createdAt agregada a procesos y poblada con la fecha existente.');
    }

    if (!procesosCols.find(c => c.Field === 'pendiente')) {
      await sequelize.query("ALTER TABLE procesos ADD COLUMN pendiente TINYINT(1) NOT NULL DEFAULT 0;");
      console.log('Columna "pendiente" agregada a procesos.');
    }

    const [ingresosCols] = await sequelize.query("DESCRIBE ingreso_proveedores");
    if (!ingresosCols.find(c => c.Field === 'proveedor_id')) {
      await sequelize.query("ALTER TABLE ingreso_proveedores ADD COLUMN proveedor_id INT NULL;");
      console.log('Columna proveedor_id agregada a ingreso_proveedores.');
    }

    if (!ingresosCols.find(c => c.Field === 'bulto_id')) {
      await sequelize.query("ALTER TABLE ingreso_proveedores ADD COLUMN bulto_id INT NULL;");
      await sequelize.query("ALTER TABLE ingreso_proveedores ADD CONSTRAINT fk_ingresos_bultos FOREIGN KEY (bulto_id) REFERENCES bultos(id) ON DELETE SET NULL;");
      console.log('Columna bulto_id y FK agregada a ingreso_proveedores.');
    }

    if (!ingresosCols.find(c => c.Field === 'cantidad_bultos')) {
      await sequelize.query("ALTER TABLE ingreso_proveedores ADD COLUMN cantidad_bultos INT NULL;");
      console.log('Columna cantidad_bultos agregada a ingreso_proveedores.');
    }

    if (!ingresosCols.find(c => c.Field === 'nro_factura')) {
      await sequelize.query("ALTER TABLE ingreso_proveedores ADD COLUMN nro_factura VARCHAR(255) NULL;");
      console.log('Columna nro_factura agregada a ingreso_proveedores.');
    }

    const [sucursalesColsCheck] = await sequelize.query("DESCRIBE sucursales");
    if (!sucursalesColsCheck.find(c => c.Field === 'tipo')) {
      await sequelize.query("ALTER TABLE sucursales ADD COLUMN tipo VARCHAR(255) NOT NULL DEFAULT 'con_sector';");
      console.log('Columna "tipo" agregada a sucursales.');
    }

    const [productosCols] = await sequelize.query("DESCRIBE productos");
    if (!productosCols.find(c => c.Field === 'permite_piezas')) {
      await sequelize.query("ALTER TABLE productos ADD COLUMN permite_piezas TINYINT(1) NOT NULL DEFAULT 1;");
      console.log('Columna "permite_piezas" agregada a productos.');
    }
    if (!productosCols.find(c => c.Field === 'permite_fracciones')) {
      await sequelize.query("ALTER TABLE productos ADD COLUMN permite_fracciones TINYINT(1) NOT NULL DEFAULT 1;");
      console.log('Columna "permite_fracciones" agregada a productos.');
    }
    if (!productosCols.find(c => c.Field === 'destacado')) {
      await sequelize.query("ALTER TABLE productos ADD COLUMN destacado TINYINT(1) NOT NULL DEFAULT 0;");
      console.log('Columna "destacado" agregada a productos.');
    }
    if (!productosCols.find(c => c.Field === 'codigo_barra')) {
      await sequelize.query("ALTER TABLE productos ADD COLUMN codigo_barra VARCHAR(255) NULL;");
      console.log('Columna "codigo_barra" agregada a productos.');
    }
    if (!productosCols.find(c => c.Field === 'pesable')) {
      await sequelize.query("ALTER TABLE productos ADD COLUMN pesable TINYINT(1) NOT NULL DEFAULT 1;");
      console.log('Columna "pesable" agregada a productos.');
    }
    if (!productosCols.find(c => c.Field === 'proveedor_id')) {
      await sequelize.query("ALTER TABLE productos ADD COLUMN proveedor_id INT NULL;");
      await sequelize.query("ALTER TABLE productos ADD CONSTRAINT fk_productos_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL;");
      console.log('Columna "proveedor_id" agregada a productos.');
    }

    // 4. Poblar generadores con Colaboradores existentes
    console.log('Sincronizando generadores para colaboradores...');
    const [colaboradores] = await sequelize.query("SELECT id, nombre FROM colaboradores");
    for (const col of colaboradores) {
      const [existing] = await sequelize.query("SELECT id FROM generadores WHERE tipo = 'colaborador' AND id_asociado = ?", { replacements: [col.id] });
      if (existing.length === 0) {
        await sequelize.query("INSERT INTO generadores (tipo, id_asociado) VALUES ('colaborador', ?)", { replacements: [col.id] });
      }
    }

    // 5. Poblar generadores con Sucursales existentes
    console.log('Sincronizando generadores para sucursales...');
    const [sucursales] = await sequelize.query("SELECT id, sucursal FROM sucursales");
    for (const suc of sucursales) {
      const [existing] = await sequelize.query("SELECT id FROM generadores WHERE tipo = 'sucursal' AND id_asociado = ?", { replacements: [suc.id] });
      if (existing.length === 0) {
        await sequelize.query("INSERT INTO generadores (tipo, id_asociado) VALUES ('sucursal', ?)", { replacements: [suc.id] });
      }
    }

    // 6. Extraer y poblar proveedores desde ingreso_proveedores y procesos
    console.log('Mapeando y creando proveedores y sus generadores...');
    const provNamesSet = new Set();
    
    const hasProveedorCol = !!ingresosCols.find(c => c.Field === 'proveedor');
    const hasColaboradorCol = !!procesosCols.find(c => c.Field === 'colaborador');
    const hasColaboradorIdCol = !!procesosCols.find(c => c.Field === 'colaborador_id');

    if (hasProveedorCol) {
      const [uniqueProvNames] = await sequelize.query("SELECT DISTINCT proveedor FROM ingreso_proveedores WHERE proveedor IS NOT NULL AND proveedor != ''");
      uniqueProvNames.forEach(r => provNamesSet.add(r.proveedor.trim()));
    }
    
    if (hasColaboradorCol) {
      const [uniqueProvFromProcesos] = await sequelize.query("SELECT DISTINCT colaborador FROM procesos WHERE colaborador LIKE 'Proveedor:%'");
      uniqueProvFromProcesos.forEach(r => {
        const name = r.colaborador.replace('Proveedor:', '').trim();
        if (name) provNamesSet.add(name);
      });
    }

    for (const name of provNamesSet) {
      let [existingProv] = await sequelize.query("SELECT id FROM proveedores WHERE nombre = ?", { replacements: [name] });
      let provId;
      if (existingProv.length === 0) {
        // Usamos insert manual y obtenemos el último ID
        await sequelize.query("INSERT INTO proveedores (nombre) VALUES (?)", { replacements: [name] });
        const [insertedProv] = await sequelize.query("SELECT id FROM proveedores WHERE nombre = ?", { replacements: [name] });
        provId = insertedProv[0].id;
        console.log(`Creado proveedor: ${name} (ID: ${provId})`);
      } else {
        provId = existingProv[0].id;
      }

      // Crear Generador para este proveedor
      const [existingGen] = await sequelize.query("SELECT id FROM generadores WHERE tipo = 'proveedor' AND id_asociado = ?", { replacements: [provId] });
      if (existingGen.length === 0) {
        await sequelize.query("INSERT INTO generadores (tipo, id_asociado) VALUES ('proveedor', ?)", { replacements: [provId] });
        console.log(`Creado generador para proveedor: ${name}`);
      }
    }

    // 7. Actualizar ingreso_proveedores.proveedor_id
    if (hasProveedorCol) {
      console.log('Actualizando referencias de proveedor_id en ingreso_proveedores...');
      const [ingresos] = await sequelize.query("SELECT id, proveedor FROM ingreso_proveedores");
      for (const ing of ingresos) {
        if (ing.proveedor) {
          const name = ing.proveedor.trim();
          const [prov] = await sequelize.query("SELECT id FROM proveedores WHERE nombre = ?", { replacements: [name] });
          if (prov.length > 0) {
            await sequelize.query("UPDATE ingreso_proveedores SET proveedor_id = ? WHERE id = ?", { replacements: [prov[0].id, ing.id] });
          }
        }
      }
    }

    // Asignar proveedor por defecto si alguno quedó en NULL
    const [nullIngresos] = await sequelize.query("SELECT id FROM ingreso_proveedores WHERE proveedor_id IS NULL");
    if (nullIngresos.length > 0) {
      let [defaultProv] = await sequelize.query("SELECT id FROM proveedores WHERE nombre = 'General'");
      let defaultProvId;
      if (defaultProv.length === 0) {
        await sequelize.query("INSERT INTO proveedores (nombre) VALUES ('General')");
        const [res] = await sequelize.query("SELECT id FROM proveedores WHERE nombre = 'General'");
        defaultProvId = res[0].id;
        
        // Crear su generador
        await sequelize.query("INSERT INTO generadores (tipo, id_asociado) VALUES ('proveedor', ?)", { replacements: [defaultProvId] });
      } else {
        defaultProvId = defaultProv[0].id;
      }
      await sequelize.query("UPDATE ingreso_proveedores SET proveedor_id = ? WHERE proveedor_id IS NULL", { replacements: [defaultProvId] });
      console.log(`Asignado proveedor por defecto 'General' a ${nullIngresos.length} ingresos.`);
    }

    // 8. Actualizar procesos.generador_id
    if (hasColaboradorCol || hasColaboradorIdCol) {
      console.log('Actualizando referencias de generador_id en procesos...');
      let selectFields = "id";
      if (hasColaboradorCol) selectFields += ", colaborador";
      if (hasColaboradorIdCol) selectFields += ", colaborador_id";
      
      const [procesos] = await sequelize.query(`SELECT ${selectFields} FROM procesos`);
      let updatedProcesosCount = 0;
      for (const proc of procesos) {
        let genId = null;

        if (hasColaboradorIdCol && proc.colaborador_id) {
          const [gen] = await sequelize.query("SELECT id FROM generadores WHERE tipo = 'colaborador' AND id_asociado = ?", { replacements: [proc.colaborador_id] });
          if (gen.length > 0) {
            genId = gen[0].id;
          }
        } else if (hasColaboradorCol && proc.colaborador) {
          const colStr = proc.colaborador.trim();
          if (colStr.startsWith('Proveedor:')) {
            const provName = colStr.replace('Proveedor:', '').trim();
            const [prov] = await sequelize.query("SELECT id FROM proveedores WHERE nombre = ?", { replacements: [provName] });
            if (prov.length > 0) {
              const [gen] = await sequelize.query("SELECT id FROM generadores WHERE tipo = 'proveedor' AND id_asociado = ?", { replacements: [prov[0].id] });
              if (gen.length > 0) genId = gen[0].id;
            }
          } else if (colStr.startsWith('Sucursal:')) {
            const sucName = colStr.replace('Sucursal:', '').trim();
            const [suc] = await sequelize.query("SELECT id FROM sucursales WHERE LOWER(sucursal) = LOWER(?)", { replacements: [sucName] });
            if (suc.length > 0) {
              const [gen] = await sequelize.query("SELECT id FROM generadores WHERE tipo = 'sucursal' AND id_asociado = ?", { replacements: [suc[0].id] });
              if (gen.length > 0) genId = gen[0].id;
            }
          } else {
            // Intentar por nombre de colaborador
            const [col] = await sequelize.query("SELECT id FROM colaboradores WHERE LOWER(nombre) = LOWER(?)", { replacements: [colStr] });
            if (col.length > 0) {
              const [gen] = await sequelize.query("SELECT id FROM generadores WHERE tipo = 'colaborador' AND id_asociado = ?", { replacements: [col[0].id] });
              if (gen.length > 0) genId = gen[0].id;
            }
          }
        }

        if (genId) {
          await sequelize.query("UPDATE procesos SET generador_id = ? WHERE id = ?", { replacements: [genId, proc.id] });
          updatedProcesosCount++;
        }
      }
      console.log(`Se actualizaron ${updatedProcesosCount} procesos con su generador correspondiente.`);
    }

    // 8.2. Crear y poblar ubicaciones
    console.log('Creando tabla de ubicaciones si no existe...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ubicaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero INT NOT NULL,
        nombre VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [existingLocations] = await sequelize.query("SELECT COUNT(*) as count FROM ubicaciones");
    if (existingLocations[0].count === 0) {
      console.log('Insertando ubicaciones por defecto...');
      await sequelize.query("INSERT INTO ubicaciones (numero, nombre) VALUES (1, 'CD Chaco')");
      await sequelize.query("INSERT INTO ubicaciones (numero, nombre) VALUES (2, 'CD Corrientes')");
      console.log('Ubicaciones por defecto creadas.');
    }

    // 8.5. Crear y poblar usuarios
    console.log('Creando tabla de usuarios si no existe...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        contrasena VARCHAR(255) NOT NULL,
        rol VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Poblar usuarios iniciales si la tabla está vacía
    const [existingUsers] = await sequelize.query("SELECT COUNT(*) as count FROM usuarios");
    if (existingUsers[0].count === 0) {
      console.log('Insertando usuarios por defecto...');
      await sequelize.query("INSERT INTO usuarios (nombre, contrasena, rol) VALUES ('edgar', 'admin', 'Admin')");
      await sequelize.query("INSERT INTO usuarios (nombre, contrasena, rol) VALUES ('admin', 'admin', 'Admin')");
      await sequelize.query("INSERT INTO usuarios (nombre, contrasena, rol) VALUES ('colaborador', 'colaborador', 'Colaborador')");
      await sequelize.query("INSERT INTO usuarios (nombre, contrasena, rol) VALUES ('usuario', 'usuario', 'Usuario')");
      console.log('Usuarios por defecto creados.');
    }

    // Comprobar y agregar id_ubicacion a la tabla usuarios
    const [usuariosColsCheck] = await sequelize.query("DESCRIBE usuarios");
    if (!usuariosColsCheck.find(c => c.Field === 'id_ubicacion')) {
      await sequelize.query("ALTER TABLE usuarios ADD COLUMN id_ubicacion INT NULL;");
      await sequelize.query("ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id) ON DELETE SET NULL;");
      console.log('Columna id_ubicacion y FK agregada a usuarios.');
    }

    // 8.6. Crear tabla productos_stock
    console.log('Creando tabla productos_stock si no existe...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS productos_stock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo_producto VARCHAR(255) NOT NULL,
        id_ubicacion INT NOT NULL,
        stock DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
        UNIQUE KEY uq_prod_ub (codigo_producto, id_ubicacion),
        FOREIGN KEY (codigo_producto) REFERENCES productos(codigo) ON DELETE CASCADE,
        FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migración segura de stocks
    const [productosColsCheck] = await sequelize.query("DESCRIBE productos");
    const hasStockCol = productosColsCheck.find(c => c.Field === 'stock');
    if (hasStockCol) {
      console.log('Migrando stock existente desde productos a productos_stock...');
      
      const [productosConStock] = await sequelize.query("SELECT codigo, stock FROM productos");
      
      for (const p of productosConStock) {
        const currentStock = parseFloat(p.stock) || 0;
        
        // CD Chaco (id_ubicacion: 1) recibe el stock actual
        await sequelize.query(`
          INSERT INTO productos_stock (codigo_producto, id_ubicacion, stock)
          VALUES (?, 1, ?)
          ON DUPLICATE KEY UPDATE stock = ?
        `, { replacements: [p.codigo, currentStock, currentStock] });

        // CD Corrientes (id_ubicacion: 2) recibe stock 0
        await sequelize.query(`
          INSERT INTO productos_stock (codigo_producto, id_ubicacion, stock)
          VALUES (?, 2, 0.0000)
          ON DUPLICATE KEY UPDATE stock = stock
        `, { replacements: [p.codigo] });
      }
      console.log('Migración de stocks completada.');

      console.log('Eliminando columnas stock y kilos_calculado de productos...');
      await sequelize.query("ALTER TABLE productos DROP COLUMN stock;");
      if (productosColsCheck.find(c => c.Field === 'kilos_calculado')) {
        await sequelize.query("ALTER TABLE productos DROP COLUMN kilos_calculado;");
      }
      console.log('Columnas eliminadas con éxito de la tabla productos.');
    }

    // Comprobar y agregar recorte, decomiso y kg_fraccionados a productos_stock
    const [prodStockColsCheck] = await sequelize.query("DESCRIBE productos_stock");
    
    if (!prodStockColsCheck.find(c => c.Field === 'recorte')) {
      await sequelize.query("ALTER TABLE productos_stock ADD COLUMN recorte DECIMAL(10, 3) NOT NULL DEFAULT 0.000;");
      console.log('Columna recorte agregada a productos_stock.');
    }
    if (!prodStockColsCheck.find(c => c.Field === 'decomiso')) {
      await sequelize.query("ALTER TABLE productos_stock ADD COLUMN decomiso DECIMAL(10, 3) NOT NULL DEFAULT 0.000;");
      console.log('Columna decomiso agregada a productos_stock.');
    }
    if (!prodStockColsCheck.find(c => c.Field === 'kg_fraccionados')) {
      await sequelize.query("ALTER TABLE productos_stock ADD COLUMN kg_fraccionados DECIMAL(10, 3) NOT NULL DEFAULT 0.000;");
      console.log('Columna kg_fraccionados agregada a productos_stock.');
    }

    // Migrar datos históricos de recortes, decomisos y kg_fraccionados de productos a productos_stock para la ubicación 1 (CD Chaco)
    const [productosColsCheck2] = await sequelize.query("DESCRIBE productos");
    const hasKgRecorte = productosColsCheck2.find(c => c.Field === 'kg_recorte');
    if (hasKgRecorte) {
      console.log('Migrando recortes, decomisos y kilos fraccionados desde productos a productos_stock (ubicación 1)...');
      await sequelize.query(`
        UPDATE productos_stock ps 
        JOIN productos p ON ps.codigo_producto = p.codigo 
        SET ps.recorte = COALESCE(p.kg_recorte, 0), 
            ps.decomiso = COALESCE(p.kg_decomiso, 0), 
            ps.kg_fraccionados = COALESCE(p.kg_fraccionados, 0) 
        WHERE ps.id_ubicacion = 1;
      `);
      console.log('Migración de históricos a productos_stock completada.');
    }

    // Eliminar columna piezas de productos_stock (para evitar desnormalización)
    if (prodStockColsCheck.find(c => c.Field === 'piezas')) {
      await sequelize.query("ALTER TABLE productos_stock DROP COLUMN piezas;");
      console.log('Columna piezas eliminada de productos_stock.');
    }

    // Eliminar columnas obsoletas de la tabla productos
    if (productosColsCheck2.find(c => c.Field === 'cantidad_piezas')) {
      await sequelize.query("ALTER TABLE productos DROP COLUMN cantidad_piezas;");
      console.log('Columna cantidad_piezas eliminada de productos.');
    }
    if (productosColsCheck2.find(c => c.Field === 'vencimientos')) {
      await sequelize.query("ALTER TABLE productos DROP COLUMN vencimientos;");
      console.log('Columna vencimientos eliminada de productos.');
    }
    if (productosColsCheck2.find(c => c.Field === 'kg_fraccionados')) {
      await sequelize.query("ALTER TABLE productos DROP COLUMN kg_fraccionados;");
      console.log('Columna kg_fraccionados eliminada de productos.');
    }
    if (productosColsCheck2.find(c => c.Field === 'kg_decomiso')) {
      await sequelize.query("ALTER TABLE productos DROP COLUMN kg_decomiso;");
      console.log('Columna kg_decomiso eliminada de productos.');
    }
    if (productosColsCheck2.find(c => c.Field === 'kg_recorte')) {
      await sequelize.query("ALTER TABLE productos DROP COLUMN kg_recorte;");
      console.log('Columna kg_recorte eliminada de productos.');
    }

    // Comprobar y agregar id_ubicacion a la tabla movimiento_stocks
    const [movimientosColsCheck] = await sequelize.query("DESCRIBE movimiento_stocks");
    if (!movimientosColsCheck.find(c => c.Field === 'id_ubicacion')) {
      await sequelize.query("ALTER TABLE movimiento_stocks ADD COLUMN id_ubicacion INT NULL;");
      await sequelize.query("ALTER TABLE movimiento_stocks ADD CONSTRAINT fk_movimientos_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id) ON DELETE SET NULL;");
      console.log('Columna id_ubicacion y FK agregada a movimiento_stocks.');
    }

    // Comprobar y agregar id_ubicacion a la tabla sucursales
    const [sucursalesUbicacionColsCheck] = await sequelize.query("DESCRIBE sucursales");
    if (!sucursalesUbicacionColsCheck.find(c => c.Field === 'id_ubicacion')) {
      await sequelize.query("ALTER TABLE sucursales ADD COLUMN id_ubicacion INT NULL;");
      await sequelize.query("ALTER TABLE sucursales ADD CONSTRAINT fk_sucursales_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id) ON DELETE SET NULL;");
      await sequelize.query("UPDATE sucursales SET id_ubicacion = 1;");
      console.log('Columna id_ubicacion y FK agregada e inicializada en la tabla sucursales.');
    }

    // Comprobar y agregar id_ubicacion a la tabla pedidos
    const [pedidosColsCheck] = await sequelize.query("DESCRIBE pedidos");
    if (!pedidosColsCheck.find(c => c.Field === 'id_ubicacion')) {
      await sequelize.query("ALTER TABLE pedidos ADD COLUMN id_ubicacion INT NULL;");
      await sequelize.query("ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id) ON DELETE SET NULL;");
      await sequelize.query("UPDATE pedidos SET id_ubicacion = 1;");
      console.log('Columna id_ubicacion y FK agregada e inicializada en la tabla pedidos.');
    }

    // Comprobar y agregar id_ubicacion a la tabla fraccionados
    const [fraccionadosColsCheck] = await sequelize.query("DESCRIBE fraccionados");
    if (!fraccionadosColsCheck.find(c => c.Field === 'id_ubicacion')) {
      await sequelize.query("ALTER TABLE fraccionados ADD COLUMN id_ubicacion INT NULL;");
      await sequelize.query("ALTER TABLE fraccionados ADD CONSTRAINT fk_fraccionados_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id) ON DELETE CASCADE;");
      await sequelize.query("UPDATE fraccionados SET id_ubicacion = 1;");
      console.log('Columna id_ubicacion y FK agregada e inicializada en la tabla fraccionados.');
    }

    // Comprobar y agregar id_ubicacion a la tabla procesos
    const [procesosColsCheck] = await sequelize.query("DESCRIBE procesos");
    if (!procesosColsCheck.find(c => c.Field === 'id_ubicacion')) {
      await sequelize.query("ALTER TABLE procesos ADD COLUMN id_ubicacion INT NULL;");
      await sequelize.query("ALTER TABLE procesos ADD CONSTRAINT fk_procesos_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id) ON DELETE CASCADE;");
      await sequelize.query("UPDATE procesos SET id_ubicacion = 1;");
      console.log('Columna id_ubicacion y FK agregada e inicializada en la tabla procesos.');
    }

    // Comprobar y agregar id_ubicacion a la tabla log_conversiones
    const [logConversionesColsCheck] = await sequelize.query("DESCRIBE log_conversiones");
    if (!logConversionesColsCheck.find(c => c.Field === 'id_ubicacion')) {
      await sequelize.query("ALTER TABLE log_conversiones ADD COLUMN id_ubicacion INT NULL;");
      await sequelize.query("ALTER TABLE log_conversiones ADD CONSTRAINT fk_log_conversiones_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id) ON DELETE CASCADE;");
      await sequelize.query("UPDATE log_conversiones SET id_ubicacion = 1;");
      console.log('Columna id_ubicacion y FK agregada e inicializada en la tabla log_conversiones.');
    }

    // Comprobar y agregar id_ubicacion a la tabla ingreso_recortes
    const [ingresoRecortesColsCheck] = await sequelize.query("DESCRIBE ingreso_recortes");
    if (!ingresoRecortesColsCheck.find(c => c.Field === 'id_ubicacion')) {
      await sequelize.query("ALTER TABLE ingreso_recortes ADD COLUMN id_ubicacion INT NULL;");
      await sequelize.query("ALTER TABLE ingreso_recortes ADD CONSTRAINT fk_ingreso_recortes_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id) ON DELETE CASCADE;");
      await sequelize.query("UPDATE ingreso_recortes SET id_ubicacion = 1;");
      console.log('Columna id_ubicacion y FK agregada e inicializada en la tabla ingreso_recortes.');
    }

    // Comprobar y agregar id_ubicacion a la tabla ingresos_sucursales
    const [ingresosSucursalesColsCheck] = await sequelize.query("DESCRIBE ingresos_sucursales");
    if (!ingresosSucursalesColsCheck.find(c => c.Field === 'id_ubicacion')) {
      await sequelize.query("ALTER TABLE ingresos_sucursales ADD COLUMN id_ubicacion INT NULL;");
      await sequelize.query("ALTER TABLE ingresos_sucursales ADD CONSTRAINT fk_ingresos_sucursales_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id) ON DELETE CASCADE;");
      await sequelize.query("UPDATE ingresos_sucursales SET id_ubicacion = 1;");
      console.log('Columna id_ubicacion y FK agregada e inicializada en la tabla ingresos_sucursales.');
    }

    // Comprobar y agregar id_ubicacion a la tabla ingreso_proveedores
    const [ingresoProveedoresColsCheck] = await sequelize.query("DESCRIBE ingreso_proveedores");
    if (!ingresoProveedoresColsCheck.find(c => c.Field === 'id_ubicacion')) {
      await sequelize.query("ALTER TABLE ingreso_proveedores ADD COLUMN id_ubicacion INT NULL;");
      await sequelize.query("ALTER TABLE ingreso_proveedores ADD CONSTRAINT fk_ingreso_proveedores_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id) ON DELETE CASCADE;");
      await sequelize.query("UPDATE ingreso_proveedores SET id_ubicacion = 1;");
      console.log('Columna id_ubicacion y FK agregada e inicializada en la tabla ingreso_proveedores.');
    }

    // Comprobar y agregar id_ubicacion a la tabla producto_vencimientos
    const [productoVencimientosColsCheck] = await sequelize.query("DESCRIBE producto_vencimientos");
    if (!productoVencimientosColsCheck.find(c => c.Field === 'id_ubicacion')) {
      await sequelize.query("ALTER TABLE producto_vencimientos ADD COLUMN id_ubicacion INT NULL;");
      await sequelize.query("ALTER TABLE producto_vencimientos ADD CONSTRAINT fk_producto_vencimientos_ubicacion FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id) ON DELETE CASCADE;");
      await sequelize.query("UPDATE producto_vencimientos SET id_ubicacion = 1;");
      console.log('Columna id_ubicacion y FK agregada e inicializada en la tabla producto_vencimientos.');
    }

    // 9. Ejecutar alter-sync final de Sequelize para que valide claves foráneas y no nulls
    console.log('Ejecutando sequelize.sync({ alter: true }) para sincronizar modelos...');
    await sequelize.sync({ alter: true });
    console.log('Sincronización de modelos completada con éxito.');

    // 10. Limpiar columnas obsoletas
    console.log('Eliminando columnas obsoletas de procesos e ingreso_proveedores...');
    const [finalProcesosCols] = await sequelize.query("DESCRIBE procesos");
    if (finalProcesosCols.find(c => c.Field === 'colaborador')) {
      await sequelize.query("ALTER TABLE procesos DROP COLUMN colaborador;");
      console.log('Columna "colaborador" eliminada de procesos.');
    }
    if (finalProcesosCols.find(c => c.Field === 'colaborador_id')) {
      await sequelize.query("ALTER TABLE procesos DROP COLUMN colaborador_id;");
      console.log('Columna "colaborador_id" eliminada de procesos.');
    }

    const [finalIngresoCols] = await sequelize.query("DESCRIBE ingreso_proveedores");
    if (finalIngresoCols.find(c => c.Field === 'proveedor')) {
      await sequelize.query("ALTER TABLE ingreso_proveedores DROP COLUMN proveedor;");
      console.log('Columna "proveedor" eliminada de ingreso_proveedores.');
    }

    // Crear tabla de armado en tiempo real (si no existe)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS pedido_armado_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_pedido INT NOT NULL,
        codigo_producto VARCHAR(255) NOT NULL,
        piezas INT DEFAULT 0,
        peso DECIMAL(10,3) DEFAULT 0,
        fraccion DECIMAL(10,3) DEFAULT 0,
        no_envia TINYINT(1) DEFAULT 0,
        sin_stock TINYINT(1) DEFAULT 0,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_pedido_producto (id_pedido, codigo_producto),
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // 11. Eliminar tablas obsoletas pedidos_enviados y pedido_enviado_items
    console.log('Eliminando tablas obsoletas pedidos_enviados y pedido_enviado_items...');
    await sequelize.query("DROP TABLE IF EXISTS pedido_enviado_items;");
    await sequelize.query("DROP TABLE IF EXISTS pedidos_enviados;");
    console.log('Tablas eliminadas con éxito.');

    console.log('MIGRACIÓN Y SINCRONIZACIÓN REALIZADA CON ÉXITO.');

  } catch (error) {
    console.error('Error durante la sincronización/migración:', error);
  } finally {
    await sequelize.close();
  }
}

syncDatabase();
