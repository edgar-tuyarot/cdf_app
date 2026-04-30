const { RecorteRecepcion } = require('../models');
const { sumarAPicadas } = require('../utils/picadas');

exports.recepcionRecortes = async (req, res) => {
  try {
    const { items, fecha } = req.body;
    if (!Array.isArray(items) || !fecha) {
      return res.status(400).json({ error: 'Faltan datos requeridos.' });
    }

    // Crea la tabla si no existe
    await RecorteRecepcion.sync();

    // Sumar a picadas antes de guardar
    for (const item of items) {
      if (item.tipo === 'picada') {
        await sumarAPicadas(item.codigo_interno, item.peso);
      }
    }

    // Inserta todos los items
    const registros = await RecorteRecepcion.bulkCreate(
      items.map(item => ({ ...item, fecha })),
      { validate: true }
    );

    res.status(201).json({ success: true, registros });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar los recortes.' });
  }
};

exports.getRecortesRecepcion = async (req, res) => {
  try {
    await RecorteRecepcion.sync();
    const registros = await RecorteRecepcion.findAll({ order: [['fecha', 'DESC']] });
    res.json(registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los recortes.' });
  }
};
