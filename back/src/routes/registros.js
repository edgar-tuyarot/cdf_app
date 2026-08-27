const express = require('express');
const router = express.Router();
const registrosController = require('../controllers/registrosController');

router.get('/', registrosController.getRegistros);
router.post('/', registrosController.crearRegistro);
router.delete('/:id', registrosController.eliminarRegistro);

module.exports = router;
