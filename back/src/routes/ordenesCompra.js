const express = require('express');
const router = express.Router();
const ordenesCompraController = require('../controllers/ordenesCompraController');

router.get('/', ordenesCompraController.getOrdenes);
router.get('/:id', ordenesCompraController.getOrdenById);
router.post('/', ordenesCompraController.crearOrden);
router.put('/:id/estado', ordenesCompraController.cambiarEstado);
router.delete('/:id', ordenesCompraController.eliminarOrden);

module.exports = router;
