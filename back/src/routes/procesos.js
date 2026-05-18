const express = require('express');
const router = express.Router();
const procesosController = require('../controllers/procesosController');

router.get('/', procesosController.obtenerProcesos);
router.get('/:id', procesosController.obtenerProcesoPorId);
router.post('/', procesosController.crearProceso);
router.put('/:id', procesosController.actualizarProceso);
router.delete('/:id', procesosController.eliminarProceso);

module.exports = router;
