const express = require('express');
const router = express.Router();
const multer = require('multer');
const pedidosController = require('../controllers/pedidosController');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', pedidosController.obtenerPedidos);
router.get('/promedio-sucursal', pedidosController.obtenerPromedioFraccionPorSucursal);
router.get('/pendientes-stock', pedidosController.obtenerPendientesStock);
router.get('/demanda-pendiente', pedidosController.obtenerDemandaUltimoPedido);
router.get('/promedio-historico', pedidosController.obtenerPromedioHistorico);
router.get('/:id', pedidosController.obtenerPedidoPorId);
router.post('/', pedidosController.crearPedido);
router.post('/upload', upload.single('file'), pedidosController.uploadExcel);
router.post('/confirmar-excel', upload.single('file'), pedidosController.confirmarPedidosDesdeExcel);
router.post('/:id/confirmar', pedidosController.confirmarPedido);

// Rutas de armado en tiempo real
router.get('/:id/armado', pedidosController.obtenerArmadoItems);
router.post('/:id/armado', pedidosController.upsertArmadoItem);
router.delete('/:id/armado', pedidosController.limpiarArmadoItems);

router.put('/:id/items/:codigo_producto', pedidosController.actualizarItemPedido);
router.put('/:id', pedidosController.actualizarPedido);
router.delete('/:id', pedidosController.eliminarPedido);

module.exports = router;

