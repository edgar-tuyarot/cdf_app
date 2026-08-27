const { Producto, Proceso, Fraccionado, LogConversion } = require('../src/models');

async function checkBondiolaDetails() {
  try {
    const bondiolas = await Producto.findAll({
      where: {
        nombre: { [require('sequelize').Op.like]: '%bondiola%' }
      }
    });
    
    console.log('=== PRODUCTOS BONDIOLA ===');
    for (const b of bondiolas) {
      console.log(`Codigo: ${b.codigo} | Nombre: ${b.nombre} | codigo_fraccionado: ${b.codigo_fraccionado}`);
      
      const procs = await Proceso.findAll({ where: { codigo: b.codigo } });
      console.log(`  Procesos (${procs.length}):`);
      procs.forEach(p => {
        console.log(`    ID: ${p.id} | Proceso: ${p.proceso} | Bruto: ${p.peso_bruto} | kg_a_desc: ${p.kg_a_desc} | kg_a_sumar: ${p.kg_a_sumar} | Pendiente: ${p.pendiente} | Fecha: ${p.fecha}`);
      });

      const fraccs = await Fraccionado.findAll({ where: { codigo_producto_original: b.codigo } });
      console.log(`  Fraccionados (${fraccs.length}):`);
      fraccs.forEach(f => {
        console.log(`    ID: ${f.id} | Original: ${f.codigo_producto_original} | Fraccionado: ${f.codigo_fraccionado} | peso_a_fraccionar: ${f.peso_a_fraccionar} | peso_a_descontar: ${f.peso_a_descontar}`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkBondiolaDetails();
