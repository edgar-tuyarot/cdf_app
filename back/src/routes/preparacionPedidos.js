const express = require('express');
const router = express.Router();
const preparacionPedidosController = require('../controllers/preparacionPedidosController');

// Rutas para /api/preparacion-pedidos
router.get('/', preparacionPedidosController.obtenerTodos);
router.get('/pedido/:codigo_de_pedido', preparacionPedidosController.obtenerPorPedido);
router.get('/:id', preparacionPedidosController.obtenerPorId);
router.post('/', preparacionPedidosController.crear);
router.put('/:id', preparacionPedidosController.actualizar);
router.delete('/:id', preparacionPedidosController.eliminar);

module.exports = router;
