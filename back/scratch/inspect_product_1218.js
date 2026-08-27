const { Producto } = require('../src/models');

async function inspectProduct() {
  try {
    const prod = await Producto.findByPk('1218');
    console.log('PRODUCT 1218:', prod ? prod.toJSON() : 'Not found');

    const sampleProds = await Producto.findAll({ limit: 10 });
    console.log('SAMPLE PRODUCTS:', sampleProds.map(p => ({
      codigo: p.codigo,
      nombre: p.nombre,
      peso_x_pieza: p.peso_x_pieza,
      kg_x_bolsita: p.kg_x_bolsita
    })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectProduct();
