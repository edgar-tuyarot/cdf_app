const { Producto, Proceso, Fraccionado, LogConversion } = require('../src/models');

async function checkData() {
  try {
    console.log('=== PRODUCTOS DE BONDIOLA ===');
    const prods = await Producto.findAll({
      where: {
        nombre: { [require('sequelize').Op.like]: '%bondiola%' }
      }
    });
    console.log(JSON.stringify(prods, null, 2));

    console.log('\n=== PROCESOS DE BONDIOLA ===');
    const procesos = await Proceso.findAll({
      order: [['id', 'DESC']],
      limit: 10
    });
    console.log(JSON.stringify(procesos, null, 2));

    console.log('\n=== TABLA FRACCIONADOS (PLANTILLAS) ===');
    const fraccs = await Fraccionado.findAll();
    console.log(JSON.stringify(fraccs, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkData();
