const { StockAPicada } = require('../models');

/**
 * Suma peso al stock de picadas para un código dado.
 * Si no existe, lo crea.
 * @param {string} codigo
 * @param {number|string} peso
 * @returns {Promise<object>} El registro actualizado o creado
 */
async function sumarAPicadas(codigo, peso) {
  if (!codigo) throw new Error('El código es obligatorio');
  const [item, created] = await StockAPicada.findOrCreate({
    where: { codigo },
    defaults: { peso: peso || 0 }
  });
  if (!created) {
    item.peso = parseFloat(item.peso) + parseFloat(peso || 0);
    await item.save();
  }
  return item;
}

module.exports = { sumarAPicadas };
