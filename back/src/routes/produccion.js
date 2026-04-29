const express = require('express');
const router = express.Router();
const produccionController = require('../controllers/produccionController');

// Rutas para /api/produccion
router.get('/', produccionController.obtenerRegistros);
router.get('/usuario/:nombre', produccionController.obtenerProduccionPorUsuario);
router.get('/operarios', produccionController.obtenerProduccionOperarios);
router.get('/stock-envasado', produccionController.obtenerStockEnvasado);
router.post('/', produccionController.crearRegistro);

module.exports = router;
