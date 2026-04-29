const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const excelPedidosController = require('../controllers/excelPedidosController');

// Rutas para /api/pedidos
router.get('/', pedidosController.obtenerPedidos);
router.get('/calculo-stock', pedidosController.calcularStockVsPedidos);
router.get('/:id', pedidosController.obtenerPedidoPorId);
router.patch('/:id/confirmar', pedidosController.confirmarPedido);
router.patch('/:id/estado', pedidosController.cambiarEstado);
router.post('/:id/despachar', pedidosController.despacharPedido);

// Carga masiva desde Excel
router.post('/cargar-excel', excelPedidosController.upload, excelPedidosController.cargarExcel);

module.exports = router;
