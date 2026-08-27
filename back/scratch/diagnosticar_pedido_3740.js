const { sequelize, Pedido, ProductoPedido, PedidoArmadoItem, Producto } = require('../src/models');

async function diagnosticar() {
  try {
    console.log('--- BUSCANDO PEDIDO / PRODUCTO CÓDIGO 3740 EN LAPRIDA 31/07 ---');

    // 1. Buscar pedidos con código 3740 o con fecha 31/07 y sucursal Laprida
    const pedidos = await Pedido.findAll({
      where: {
        sucursal: 'Laprida'
      },
      include: [
        { model: ProductoPedido, as: 'items', include: [{ model: Producto, as: 'Producto' }] },
        { model: PedidoArmadoItem, as: 'ArmadoItems' }
      ]
    });

    console.log(`Se encontraron ${pedidos.length} pedidos de Laprida:`);

    for (const p of pedidos) {
      const fechaStr = String(p.fecha);
      const is31Jul = fechaStr.includes('07-31') || fechaStr.includes('31/07') || fechaStr.includes('07/31');
      const isCodigo3740 = String(p.codigo).includes('3740');

      if (is31Jul || isCodigo3740) {
        console.log(`\n========================================`);
        console.log(`PEDIDO ID: ${p.id} | Código: ${p.codigo} | Fecha: ${p.fecha} | Sucursal: ${p.sucursal} | Estado: ${p.estado}`);
        
        console.log('\n--- Ítems en producto_pedidos (items) ---');
        if (p.items && p.items.length > 0) {
          p.items.forEach(it => {
            console.log(`  Prod: ${it.codigo_producto} - ${it.Producto?.nombre || 'N/A'} | Pieza: ${it.pieza} | Frac: ${it.fraccion} | PesoEnv: ${it.peso_enviado} | CantEnv: ${it.cantidad_enviada} | FracEnv: ${it.fraccion_enviada} | SinStock: ${it.sin_stock} | NoEnvia: ${it.no_envia}`);
          });
        } else {
          console.log('  [NINGÚN REGISTRO EN producto_pedidos]');
        }

        console.log('\n--- Ítems en pedido_armado_items (ArmadoItems) ---');
        if (p.ArmadoItems && p.ArmadoItems.length > 0) {
          p.ArmadoItems.forEach(arm => {
            console.log(`  Prod: ${arm.codigo_producto} | Piezas: ${arm.piezas} | Peso: ${arm.peso} | Frac: ${arm.fraccion} | SinStock: ${arm.sin_stock} | NoEnvia: ${arm.no_envia}`);
          });
        } else {
          console.log('  [NINGÚN REGISTRO EN pedido_armado_items]');
        }
      }
    }

    // 2. Buscar si 3740 es un código de producto
    const prod3740 = await Producto.findOne({ where: { codigo: '3740' } });
    console.log('\n--- BÚSQUEDA DE PRODUCTO CÓDIGO 3740 ---');
    if (prod3740) {
      console.log(`Producto encontrado: ${prod3740.codigo} - ${prod3740.nombre}`);
    } else {
      console.log('No existe ningún producto con el código 3740.');
    }

    // 3. Buscar si hay ítems con codigo_producto = '3740' en ProductoPedido o PedidoArmadoItem
    const itemsProd3740 = await ProductoPedido.findAll({
      where: { codigo_producto: '3740' },
      include: [{ model: Pedido, as: 'Pedido' }]
    });

    console.log(`\nRegistros de ProductoPedido con codigo_producto='3740': ${itemsProd3740.length}`);
    itemsProd3740.forEach(it => {
      console.log(`  Pedido ID: ${it.id_pedido} (Cód: ${it.Pedido?.codigo}, Fecha: ${it.Pedido?.fecha}, Suc: ${it.Pedido?.sucursal}) | Frac: ${it.fraccion} | PesoEnv: ${it.peso_enviado}`);
    });

    const armadoProd3740 = await PedidoArmadoItem.findAll({
      where: { codigo_producto: '3740' },
      include: [{ model: Pedido, as: 'Pedido' }]
    });

    console.log(`\nRegistros de PedidoArmadoItem con codigo_producto='3740': ${armadoProd3740.length}`);
    armadoProd3740.forEach(arm => {
      console.log(`  Pedido ID: ${arm.id_pedido} (Cód: ${arm.Pedido?.codigo}, Fecha: ${arm.Pedido?.fecha}, Suc: ${arm.Pedido?.sucursal}) | Peso: ${arm.peso} | Frac: ${arm.fraccion}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error en diagnóstico:', err);
    process.exit(1);
  }
}

diagnosticar();
