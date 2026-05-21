const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

router.get('/diaria', reportesController.getDiaria);
router.get('/semanal', reportesController.getSemanal);
router.get('/mensual', reportesController.getMensual);
router.get('/productos-mas-procesados', reportesController.getProductosMasProcesados);

module.exports = router;
