const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// 1. Producción del dia
router.get('/produccion-dia', dashboardController.obtenerProduccionDelDia);

// 2. Producido por cada operador
router.get('/produccion-operador', dashboardController.obtenerProduccionPorOperador);

// 3. Cantidades de Decomiso y Picadas por codigo
router.get('/mermas-stock', dashboardController.obtenerDecomisoYPicadas);

// 4. Produccion de la semana por cada operador por cada dia
router.get('/produccion-semanal', dashboardController.obtenerProduccionSemanal);

module.exports = router;
