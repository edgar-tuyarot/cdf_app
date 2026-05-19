const express = require('express');
const router = express.Router();
const ingresoRecortesController = require('../controllers/ingresoRecortesController');

router.get('/', ingresoRecortesController.obtenerIngresosRecortes);
router.post('/masivo', ingresoRecortesController.crearIngresosRecortesMasivo);

module.exports = router;
