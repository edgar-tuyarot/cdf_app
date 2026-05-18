const express = require('express');
const router = express.Router();
const fraccionadosController = require('../controllers/fraccionadosController');

router.get('/', fraccionadosController.obtenerFraccionados);
router.get('/:id', fraccionadosController.obtenerFraccionadoPorId);
router.post('/', fraccionadosController.crearFraccionado);
router.put('/:id', fraccionadosController.actualizarFraccionado);
router.delete('/:id', fraccionadosController.eliminarFraccionado);
router.post('/:id/procesar', fraccionadosController.procesarFraccionamiento);

module.exports = router;
