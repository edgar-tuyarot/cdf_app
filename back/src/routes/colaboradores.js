const express = require('express');
const router = express.Router();
const colaboradoresController = require('../controllers/colaboradoresController');

router.get('/', colaboradoresController.obtenerColaboradores);
router.get('/:id', colaboradoresController.obtenerColaboradorPorId);
router.post('/', colaboradoresController.crearColaborador);
router.put('/:id', colaboradoresController.actualizarColaborador);
router.delete('/:id', colaboradoresController.eliminarColaborador);

module.exports = router;
