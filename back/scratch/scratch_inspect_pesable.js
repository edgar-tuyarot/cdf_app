const { sequelize, Producto } = require('./src/models');

async function inspect() {
  try {
    await sequelize.authenticate();
    
    const countPesable = await Producto.count({ where: { pesable: true } });
    const countNoPesable = await Producto.count({ where: { pesable: false } });
    
    console.log(`Pesable: ${countPesable}, No Pesable: ${countNoPesable}`);
    
    if (countNoPesable > 0) {
      const sample = await Producto.findAll({
        where: { pesable: false },
        limit: 10,
        attributes: ['codigo', 'nombre', 'pesable']
      });
      console.log("Sample non-pesable products:");
      console.log(JSON.stringify(sample, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sequelize.close();
  }
}

inspect();
