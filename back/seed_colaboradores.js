const { sequelize, Colaborador } = require('./src/models');

const colaboradores = [
  { nombre: 'Mauricio', puesto: 'Fiambrero' },
  { nombre: 'Juan', puesto: 'Fiambrero' },
  { nombre: 'Ulises', puesto: 'Fiambrero' },
  { nombre: 'Braian', puesto: 'Fiambrero' }
];

async function seed() {
  try {
    await sequelize.authenticate();
    
    await Colaborador.bulkCreate(colaboradores);
    
    console.log('¡Colaboradores insertados exitosamente!');
  } catch (error) {
    console.error('Error insertando colaboradores:', error);
  } finally {
    await sequelize.close();
  }
}

seed();
