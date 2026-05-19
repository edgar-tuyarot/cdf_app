const express = require('express');
const router = express.Router();
const multer = require('multer');
const pedidosController = require('../controllers/pedidosController');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', pedidosController.obtenerPedidos);
router.get('/promedio-sucursal', pedidosController.obtenerPromedioFraccionPorSucursal);
router.get('/:id', pedidosController.obtenerPedidoPorId);
router.post('/', pedidosController.crearPedido);
router.post('/upload', upload.single('file'), pedidosController.uploadExcel);
router.put('/:id', pedidosController.actualizarPedido);
router.delete('/:id', pedidosController.eliminarPedido);

module.exports = router;
