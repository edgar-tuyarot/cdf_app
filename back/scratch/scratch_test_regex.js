const { sequelize, Producto } = require('./src/models');

async function testRegex() {
  try {
    await sequelize.authenticate();
    const productos = await Producto.findAll({
      attributes: ['codigo', 'nombre']
    });
    
    // Updated regex to catch both \d+X and X\d+ when not followed by KG or similar weight markers
    const nonPesableRegex = /(?:\d+\s*X|X\s*\d+)(?![\s\d\.]*k)/i;
    
    let countPesable = 0;
    let countNoPesable = 0;
    
    console.log("CLASSIFIED AS NON-PESABLE (UD):");
    const nonPesableList = [];
    const pesableList = [];
    
    productos.forEach(p => {
      const isNonPesable = nonPesableRegex.test(p.nombre);
      if (isNonPesable) {
        countNoPesable++;
        nonPesableList.push(p);
      } else {
        countPesable++;
        pesableList.push(p);
      }
    });
    
    nonPesableList.forEach(p => {
      console.log(`- ${p.codigo} | ${p.nombre}`);
    });
    
    console.log(`\nSummary - Pesable: ${countPesable}, Non-Pesable: ${countNoPesable}`);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

testRegex();
