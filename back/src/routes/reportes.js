const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const stockProximoDespachoController = require('../controllers/stockProximoDespachoController');

router.get('/semanal', reportesController.obtenerReporteSemanal);
router.get('/proximo-despacho', stockProximoDespachoController.getProyeccionProximoDespacho);

module.exports = router;

