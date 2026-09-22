const { StockAPicada } = require('../models');

/**
 * Servicio utilitario para gestión y acumulación de mermas/recortes hacia Picadas.
 *
 * Suma peso al stock acumulado de picadas para un código de producto dado.
 * Si el registro no existe en la tabla `stock_a_picadas`, lo inicializa.
 *
 * @param {string} codigo - Código del producto origen o subproducto.
 * @param {number|string} peso - Peso en kilogramos a incorporar al lote de picadas.
 * @returns {Promise<object>} Instancia de StockAPicada actualizada o recién creada.
 * @throws {Error} Si el parámetro `codigo` está ausente o vacío.
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
