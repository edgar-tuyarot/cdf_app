const { Fraccionado, Proceso, Producto, LogConversion, sequelize } = require('./src/models');

async function syncFraccionadosWeights() {
  const transaction = await sequelize.transaction();
  try {
    console.log('=== INICIANDO RECÁLCULO Y REINICIALIZACIÓN DE FRACCIONADOS ===');

    // 1. Obtener todas las plantillas de fraccionados
    const fraccionados = await Fraccionado.findAll({ transaction });

    for (const f of fraccionados) {
      const origCode = f.codigo_producto_original;
      const id_ubicacion = f.id_ubicacion;

      // Obtener todos los procesos no pendientes para este producto y ubicación
      const procesos = await Proceso.findAll({
        where: {
          codigo: origCode,
          id_ubicacion,
          pendiente: false
        },
        transaction
      });

      // Sumar kg_a_sumar y kg_a_desc / peso_bruto de procesos de producción / fraccionamiento
      let totalSumar = 0;
      let totalDescontar = 0;

      for (const p of procesos) {
        if (p.proceso === 'Fraccionamiento' || p.proceso === 'Desosado' || p.proceso === 'Feteado' || p.proceso === 'Limpieza' || p.kg_a_sumar > 0) {
          const kgSum = parseFloat(p.kg_a_sumar) || 0;
          const kgDesc = parseFloat(p.kg_a_desc) || parseFloat(p.peso_bruto) || 0;
          totalSumar += kgSum;
          totalDescontar += kgDesc;
        }
      }

      // Descontar conversiones ya procesadas en LogConversion
      const logs = await LogConversion.findAll({
        where: {
          codigo_producto_original: origCode,
          id_ubicacion
        },
        transaction
      });

      let totalLogsFraccionado = 0;
      let totalLogsDescontado = 0;

      for (const l of logs) {
        // Ignorar logs auto-generados de procesos directos
        if (!l.comprobante || !l.comprobante.startsWith('PROCESO #')) {
          totalLogsFraccionado += parseFloat(l.peso_fraccionado) || 0;
          totalLogsDescontado += parseFloat(l.peso_descontatedo || l.peso_descontado) || 0;
        }
      }

      const finalSumar = Math.max(0, totalSumar - totalLogsFraccionado);
      const finalDescontar = Math.max(0, totalDescontar - totalLogsDescontado);

      console.log(`Producto ${origCode} (Ubicación ${id_ubicacion}):`);
      console.log(`  Procesos acumulados -> Sumar: ${totalSumar.toFixed(3)} kg | Descontar: ${totalDescontar.toFixed(3)} kg`);
      console.log(`  Logs procesados     -> Sumar: ${totalLogsFraccionado.toFixed(3)} kg | Descontar: ${totalLogsDescontado.toFixed(3)} kg`);
      console.log(`  => RESULTADO FINAL  -> peso_a_fraccionar: ${finalSumar.toFixed(3)} kg | peso_a_descontar: ${finalDescontar.toFixed(3)} kg`);

      f.peso_a_fraccionar = finalSumar;
      f.peso_a_descontar = finalDescontar;
      await f.save({ transaction });
    }

    // 2. Verificar si hay productos que tengan codigo_fraccionado pero NO tengan registro en fraccionados
    const productosConFrac = await Producto.findAll({
      where: {
        codigo_fraccionado: { [require('sequelize').Op.ne]: null }
      },
      transaction
    });

    for (const prod of productosConFrac) {
      if (!prod.codigo_fraccionado || !prod.codigo_fraccionado.trim()) continue;

      const existe = await Fraccionado.findOne({
        where: { codigo_producto_original: prod.codigo, id_ubicacion: 1 },
        transaction
      });

      if (!existe) {
        // Calcular procesos para este nuevo registro
        const procesos = await Proceso.findAll({
          where: { codigo: prod.codigo, id_ubicacion: 1, pendiente: false },
          transaction
        });

        let totalSumar = 0;
        let totalDescontar = 0;
        for (const p of procesos) {
          if (p.proceso === 'Fraccionamiento' || p.proceso === 'Desosado' || p.proceso === 'Feteado' || p.proceso === 'Limpieza' || p.kg_a_sumar > 0) {
            totalSumar += parseFloat(p.kg_a_sumar) || 0;
            totalDescontar += parseFloat(p.kg_a_desc) || parseFloat(p.peso_bruto) || 0;
          }
        }

        const nuevoFrac = await Fraccionado.create({
          id_ubicacion: 1,
          codigo_producto_original: prod.codigo,
          codigo_fraccionado: prod.codigo_fraccionado,
          peso_a_fraccionar: totalSumar,
          peso_a_descontar: totalDescontar
        }, { transaction });

        console.log(`CREADO NUEVO FRACCIONADO para ${prod.codigo} (${prod.nombre}) -> ${prod.codigo_fraccionado} con ${totalSumar.toFixed(3)} kg`);
      }
    }

    await transaction.commit();
    console.log('=== RECÁLCULO COMPLETADO CON ÉXITO ===');
  } catch (err) {
    await transaction.rollback();
    console.error('Error al sincronizar fraccionados:', err);
  } finally {
    process.exit();
  }
}

syncFraccionadosWeights();
