const { sequelize, Producto } = require('./src/models');

async function listAll() {
  try {
    await sequelize.authenticate();
    const productos = await Producto.findAll({
      attributes: ['codigo', 'nombre', 'pesable']
    });
    productos.forEach(p => {
      console.log(`${p.codigo} | ${p.nombre} | ${p.pesable}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

listAll();
