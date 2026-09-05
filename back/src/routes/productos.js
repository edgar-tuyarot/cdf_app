const express = require('express');
const router = express.Router();
const multer = require('multer');
const productosController = require('../controllers/productosController');

// Configuración de multer en memoria para no guardar el archivo en disco
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', productosController.obtenerProductos);
router.post('/', productosController.crearProducto);
// Ruta para carga masiva (admite FormData con un archivo "file" o un JSON Array en el body)
router.post('/upload', upload.single('file'), productosController.uploadExcel);
router.post('/cargar-stock', upload.single('file'), productosController.cargarStockExcel);
router.get('/recortes', productosController.obtenerRecortes);
router.post('/convertir-recorte', productosController.convertirRecorte);
router.post('/ingresar-recorte', productosController.ingresarRecorte);
router.get('/decomisos', productosController.obtenerDecomisos);
router.post('/descontar-decomiso', productosController.descontarDecomiso);
router.get('/vencimientos-cercanos', productosController.obtenerVencimientosCercanos);
router.put('/vencimientos/:id', productosController.actualizarVencimiento);
router.delete('/vencimientos/:id', productosController.eliminarVencimiento);
router.post('/ingresar-proveedor', productosController.ingresarProveedor);
router.post('/ingresar-proveedor-lote', productosController.ingresarProveedorLote);
router.get('/ingresos-proveedores', productosController.obtenerIngresosProveedores);
router.get('/movimientos-stock', productosController.obtenerMovimientosStock);
router.get('/snapshots', productosController.obtenerSnapshots);
router.post('/control-piezas', productosController.controlPiezas);
router.get('/:codigo/movimientos', productosController.obtenerMovimientosPorProducto);
router.get('/:codigo/sucursales', productosController.obtenerSucursalesHabilitadas);
router.put('/:id', productosController.actualizarProducto);
router.delete('/:id', productosController.eliminarProducto);

module.exports = router;
