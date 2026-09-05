const { Producto, sequelize } = require('../models');

async function runBackfill() {
  const isApply = process.argv.includes('--apply');
  console.log(`=== SCRIPT DE BACKFILL TIPO CALCULO PIEZAS (Modo: ${isApply ? 'APLICAR CAMBIOS' : 'DRY-RUN / SOLO REPORTE'}) ===\n`);

  try {
    const productos = await Producto.findAll({ raw: true });
    console.log(`Total productos analizados: ${productos.length}`);

    const clasificaciones = {
      normal: [],
      fraccionado: [],
      unidad: []
    };

    for (const p of productos) {
      let nuevoTipo = 'normal';

      const kgBolsita = parseFloat(p.peso_fraccion || 0);
      const nombreUpper = String(p.nombre || '').toUpperCase();
      const isPesable = p.pesable === true || p.pesable === 1;

      if (kgBolsita > 0 || nombreUpper.startsWith('FRAC ') || nombreUpper.includes('FRACCIONADO')) {
        nuevoTipo = 'fraccionado';
      } else if (!isPesable) {
        nuevoTipo = 'unidad';
      }

      clasificaciones[nuevoTipo].push(p);
    }

    console.log(`\nRESUMEN DE CLASIFICACIÓN PROPUESTA:`);
    console.log(` - Normales (Hormas/Piezas): ${clasificaciones.normal.length}`);
    console.log(` - Fraccionados (Bolsitas): ${clasificaciones.fraccionado.length}`);
    console.log(` - Por Unidad (Unidades): ${clasificaciones.unidad.length}`);

    console.log(`\nMUESTRA DE FRACCIONADOS CLASIFICADOS (${Math.min(5, clasificaciones.fraccionado.length)}):`);
    clasificaciones.fraccionado.slice(0, 5).forEach(p => {
      console.log(`  [${p.codigo}] ${p.nombre} (peso_fraccion: ${p.peso_fraccion})`);
    });

    console.log(`\nMUESTRA DE UNIDADES CLASIFICADAS (${Math.min(5, clasificaciones.unidad.length)}):`);
    clasificaciones.unidad.slice(0, 5).forEach(p => {
      console.log(`  [${p.codigo}] ${p.nombre} (pesable: ${p.pesable})`);
    });

    if (isApply) {
      console.log('\n[APLICANDO CAMBIOS EN BASE DE DATOS...]');
      const transaction = await sequelize.transaction();
      try {
        for (const tipo of ['normal', 'fraccionado', 'unidad']) {
          const codigos = clasificaciones[tipo].map(p => p.codigo);
          if (codigos.length > 0) {
            await Producto.update(
              { tipo_calculo_piezas: tipo },
              { where: { codigo: codigos }, transaction }
            );
          }
        }
        await transaction.commit();
        console.log('✔ Backfill aplicado con éxito en la base de datos.');
      } catch (err) {
        await transaction.rollback();
        console.error('❌ Error al aplicar backfill:', err.message);
      }
    } else {
      console.log('\n💡 Para aplicar estos cambios en la base de datos, ejecute:');
      console.log('   node src/scripts/backfill_tipo_calculo_piezas.js --apply');
    }

  } catch (error) {
    console.error('Error durante el backfill:', error);
  } finally {
    process.exit(0);
  }
}

runBackfill();
