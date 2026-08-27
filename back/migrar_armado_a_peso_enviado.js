const { sequelize, ProductoPedido, PedidoArmadoItem } = require('./src/models');

async function migrarArmadoAPesoEnviado() {
  console.log('--- INICIANDO MIGRACIÓN DE ARMADO A PESO ENVIADO ---');
  try {
    // 1. Asegurar que la columna sin_stock exista en la base de datos MySQL
    try {
      await sequelize.query(`ALTER TABLE producto_pedidos ADD COLUMN sin_stock TINYINT(1) DEFAULT 0;`);
      console.log('✓ Columna sin_stock agregada a producto_pedidos.');
    } catch (err) {
      if (err.message.includes('Duplicate column name') || err.original?.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ Columna sin_stock ya existía en producto_pedidos.');
      } else {
        console.warn('Nota sobre ALTER TABLE sin_stock:', err.message);
      }
    }

    // 2. Obtener todos los registros de pedido_armado_items y producto_pedidos
    const armadoItems = await PedidoArmadoItem.findAll();
    const productoPedidos = await ProductoPedido.findAll();

    console.log(`Buscando coincidencias para ${productoPedidos.length} ítems de producto_pedidos y ${armadoItems.length} registros de armado...`);

    // Crear mapa rápido para búsqueda por `${id_pedido}_${codigo_producto}`
    const armadoMap = {};
    armadoItems.forEach(arm => {
      const key = `${arm.id_pedido}_${arm.codigo_producto}`;
      armadoMap[key] = arm;
    });

    let migradosDesdeArmado = 0;
    let migradosDesdeFraccion = 0;
    let marcadosSinStock = 0;
    let marcadosNoEnvia = 0;

    // 3. Procesar e igualar cada registro de producto_pedidos
    for (const item of productoPedidos) {
      const key = `${item.id_pedido}_${item.codigo_producto}`;
      const arm = armadoMap[key];
      let modificado = false;

      if (arm) {
        // Sumar peso + fraccion de pedido_armado_items
        const pesoTotal = parseFloat(arm.peso || 0) + parseFloat(arm.fraccion || 0);

        if (arm.sin_stock) {
          item.sin_stock = true;
          item.no_envia = false;
          item.peso_enviado = 0;
          item.cantidad_enviada = 0;
          item.confirmado = true;
          marcadosSinStock++;
          modificado = true;
        } else if (arm.no_envia) {
          item.no_envia = true;
          item.sin_stock = false;
          item.peso_enviado = 0;
          item.cantidad_enviada = 0;
          item.confirmado = true;
          marcadosNoEnvia++;
          modificado = true;
        } else {
          item.peso_enviado = pesoTotal;
          item.cantidad_enviada = parseInt(arm.piezas, 10) || item.cantidad_enviada || 0;
          item.fraccion_enviada = parseFloat(arm.fraccion || 0);
          item.confirmado = true;
          item.sin_stock = false;
          item.no_envia = false;
          migradosDesdeArmado++;
          modificado = true;
        }
      } else {
        // Si no tiene armado explícito pero fraccion_enviada > 0 y peso_enviado === 0, estandarizar en peso_enviado
        const fraccEnv = parseFloat(item.fraccion_enviada || 0);
        const pesoEnv = parseFloat(item.peso_enviado || 0);

        if (fraccEnv > 0 && pesoEnv === 0) {
          item.peso_enviado = fraccEnv;
          item.confirmado = true;
          migradosDesdeFraccion++;
          modificado = true;
        }
      }

      if (modificado) {
        await item.save();
      }
    }

    console.log('\n--- RESULTADOS DE LA MIGRACIÓN ---');
    console.log(`✓ Ítems actualizados desde pedido_armado_items: ${migradosDesdeArmado}`);
    console.log(`✓ Ítems estandarizados desde fraccion_enviada: ${migradosDesdeFraccion}`);
    console.log(`✓ Ítems marcados con Sin Stock (S/S): ${marcadosSinStock}`);
    console.log(`✓ Ítems marcados con No Envía (N/E): ${marcadosNoEnvia}`);
    console.log('✓ Proceso de migración finalizado exitosamente.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la ejecución del script:', error);
    process.exit(1);
  }
}

migrarArmadoAPesoEnviado();
