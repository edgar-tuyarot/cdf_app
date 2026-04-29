const express = require('express');
const router = express.Router();
const feteadoController = require('../controllers/feteadoController');

// --- STOCK A FETEAR (Suma peso y cantidad) ---
// Estas rutas deben ir ANTES de las rutas con :id para evitar conflictos
router.get('/stock-a-fetear', feteadoController.obtenerStockAFetear);
router.get('/stock-a-fetear/:codigo', feteadoController.obtenerStockAFetearPorCodigo);
router.put('/stock-a-fetear', feteadoController.sumarStockAFetear);
router.post('/stock-a-fetear/restar', feteadoController.restarStockAFetear);
router.patch('/stock-a-fetear', feteadoController.sumarStockAFetear);
router.delete('/stock-a-fetear/:id', feteadoController.eliminarStockAFetear);

// --- STOCK A PICADA (Suma peso) ---
router.get('/stock-a-picada', feteadoController.obtenerStockAPicada);
router.put('/stock-a-picada', feteadoController.sumarStockAPicada);
router.put('/stock-a-picada/:id', feteadoController.actualizarStockAPicada);
router.patch('/stock-a-picada', feteadoController.sumarStockAPicada);
router.post('/stock-a-picada/resetear', feteadoController.resetearStockAPicada);
router.delete('/stock-a-picada/:id', feteadoController.eliminarStockAPicada);

// --- STOCK A DECOMISO (CRUD) ---
router.get('/stock-a-decomiso', feteadoController.obtenerStockADecomiso);
router.post('/stock-a-decomiso', feteadoController.crearStockADecomiso);
router.put('/stock-a-decomiso/:id', feteadoController.actualizarStockADecomiso);
router.post('/stock-a-decomiso/resetear', feteadoController.resetearStockADecomiso);
router.delete('/stock-a-decomiso/:id', feteadoController.eliminarStockADecomiso);

// --- PRODUCCIÓN FETEADOS ---
router.get('/produccion', feteadoController.obtenerProduccionFeteados);
router.post('/produccion', feteadoController.crearProduccionFeteado);
router.delete('/produccion/:id', feteadoController.eliminarProduccionFeteado);

// --- DETALLES HISTÓRICOS (Rutas genéricas al final) ---
router.get('/', feteadoController.obtenerDetalles);
router.post('/', feteadoController.crearDetalle);
router.put('/:id', feteadoController.actualizarDetalle);
router.delete('/:id', feteadoController.eliminarDetalle);

module.exports = router;
