const express = require('express');
const router = express.Router();
const colaboradoresController = require('../controllers/colaboradoresController');

router.get('/', colaboradoresController.obtenerColaboradores);
router.post('/', colaboradoresController.crearColaborador);
router.put('/:id', colaboradoresController.modificarColaborador);

module.exports = router;
