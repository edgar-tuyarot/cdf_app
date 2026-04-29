const { ProduccionFeteado, RegistroProduccion } = require('./src/models');
async function test() {
  const fet = await ProduccionFeteado.count();
  const reg = await RegistroProduccion.count();
  console.log('feteados:', fet, 'registros:', reg);
  process.exit();
}
test();
