const express = require('express');
const router = express.Router();
const ubicacionesController = require('../controllers/ubicacionesController');

router.get('/', ubicacionesController.obtenerUbicaciones);
router.get('/:id', ubicacionesController.obtenerUbicacionPorId);
router.post('/', ubicacionesController.crearUbicacion);
router.put('/:id', ubicacionesController.actualizarUbicacion);
router.delete('/:id', ubicacionesController.eliminarUbicacion);

module.exports = router;
