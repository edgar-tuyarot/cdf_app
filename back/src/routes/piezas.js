const express = require('express');
const router = express.Router();
const piezasController = require('../controllers/piezasController');

router.get('/', piezasController.obtenerTodos);
router.get('/:codigo', piezasController.obtenerPorCodigo);
router.post('/sumar', piezasController.sumar);
router.post('/restar', piezasController.restar);
router.delete('/:id', piezasController.eliminar);

module.exports = router;
