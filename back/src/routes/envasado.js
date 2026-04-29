const express = require('express');
const router = express.Router();
const envasadoController = require('../controllers/envasadoController');

router.get('/', envasadoController.obtenerStockEnvasado);
router.get('/:codigo', envasadoController.obtenerPorCodigo);
router.post('/sumar', envasadoController.sumarStock);
router.post('/restar', envasadoController.restarStock);
router.delete('/:id', envasadoController.eliminarStock);

module.exports = router;
