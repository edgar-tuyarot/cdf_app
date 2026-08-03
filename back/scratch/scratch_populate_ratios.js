const { Proceso, Producto, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function populateRatios() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos para migración de datos...');

    // 1. Obtener todos los procesos donde peso_bruto > 0
    const procesos = await Proceso.findAll({
      where: {
        peso_bruto: {
          [Op.gt]: 0
        }
      }
    });

    console.log(`Procesando ${procesos.length} registros de procesos...`);

    // 2. Agrupar totales por producto
    const acumulador = {};
    for (const p of procesos) {
      const codigo = p.codigo;
      if (!acumulador[codigo]) {
        acumulador[codigo] = {
          total_peso_bruto: 0,
          total_recorte: 0,
          total_decomiso: 0,
          total_envasado: 0
        };
      }

      acumulador[codigo].total_peso_bruto += parseFloat(p.peso_bruto) || 0;
      acumulador[codigo].total_recorte += parseFloat(p.recorte) || 0;
      acumulador[codigo].total_decomiso += parseFloat(p.decomiso) || 0;
      acumulador[codigo].total_envasado += parseFloat(p.kg_a_sumar) || 0;
    }

    // 3. Iterar y actualizar cada producto
    let productosActualizados = 0;
    for (const codigo of Object.keys(acumulador)) {
      const totals = acumulador[codigo];
      const pb = totals.total_peso_bruto;

      if (pb > 0) {
        const pct_recorte = parseFloat(((totals.total_recorte / pb) * 100).toFixed(2));
        const pct_decomiso = parseFloat(((totals.total_decomiso / pb) * 100).toFixed(2));
        const pct_envasado = parseFloat(((totals.total_envasado / pb) * 100).toFixed(2));

        const producto = await Producto.findByPk(codigo);
        if (producto) {
          await producto.update({
            pct_recorte,
            pct_decomiso,
            pct_envasado
          }, {
            skipAuditLog: true // No registrar en auditoría de stock ya que no estamos moviendo stock físico
          });
          productosActualizados++;
          console.log(`Producto ${codigo} (${producto.nombre}) actualizado: Envasado=${pct_envasado}%, Recorte=${pct_recorte}%, Decomiso=${pct_decomiso}%`);
        } else {
          console.log(`Advertencia: Producto con código ${codigo} no encontrado en el catálogo.`);
        }
      }
    }

    console.log(`Se actualizaron con éxito ${productosActualizados} productos con sus promedios históricos.`);
  } catch (error) {
    console.error('Error durante la migración de proporciones:', error);
  } finally {
    await sequelize.close();
  }
}

populateRatios();
