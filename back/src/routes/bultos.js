const express = require('express');
const router = express.Router();
const bultosController = require('../controllers/bultosController');

router.get('/', bultosController.obtenerBultos);
router.post('/', bultosController.crearBulto);
router.put('/:id', bultosController.actualizarBulto);
router.delete('/:id', bultosController.eliminarBulto);

module.exports = router;
