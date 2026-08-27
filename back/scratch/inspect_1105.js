const { Fraccionado, Proceso, Producto } = require('../src/models');

async function inspectProceso1105() {
  try {
    const proc = await Proceso.findByPk(1105);
    console.log('Proceso 1105:', proc ? proc.toJSON() : 'No encontrado');

    const fracc = await Fraccionado.findOne({ where: { codigo_producto_original: '8974' } });
    console.log('Fraccionado 8974:', fracc ? fracc.toJSON() : 'No encontrado');

    // Revisar producto 8974
    const prod = await Producto.findByPk('8974');
    console.log('Producto 8974:', prod ? prod.toJSON() : 'No encontrado');

    // Revisar producto 8016
    const fracc8016 = await Fraccionado.findOne({ where: { codigo_producto_original: '8016' } });
    console.log('Fraccionado 8016:', fracc8016 ? fracc8016.toJSON() : 'No encontrado');

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

inspectProceso1105();
