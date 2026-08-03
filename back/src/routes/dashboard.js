const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/produccion-dia', dashboardController.getProduccionDia);
router.get('/produccion-operador', dashboardController.getProduccionOperador);
router.get('/mermas-stock', dashboardController.getMermasStock);
router.get('/produccion-semanal', dashboardController.getProduccionSemanal);
router.get('/produccion-semanal-productos', dashboardController.getProduccionSemanalProductos);
router.get('/actividad-reciente', dashboardController.getRecentActivity);
router.get('/usuario/:usuario', dashboardController.getProduccionUsuario);

module.exports = router;
