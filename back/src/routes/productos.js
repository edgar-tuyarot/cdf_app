const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

router.get('/', productosController.obtenerProductos);
router.get('/stock-total', productosController.obtenerStockTotal);
router.patch('/:id/stock', productosController.corregirStock);
router.post('/', productosController.crearProducto);

module.exports = router;
