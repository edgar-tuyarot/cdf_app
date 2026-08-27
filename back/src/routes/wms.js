const express = require('express');
const router = express.Router();
const wmsController = require('../controllers/wmsController');

// Rutas de configuración y sesión WMS
router.get('/config', wmsController.getConfig);
router.post('/config', wmsController.saveConfig);
router.post('/login', wmsController.login);
router.post('/test-login', wmsController.testLogin);

// Servicio de consulta de productos externos en JSON y ubicaciones/sites
router.get('/productos', wmsController.getProductos);
router.get('/entidades', wmsController.getEntidades);
router.get('/sites', wmsController.getSitesDisponibles);
router.get('/stock-site/:siteId', wmsController.getStockPorUbicacion);

// Servicio de sincronización de stock local con WMS
router.post('/sync-stock', wmsController.syncStock);

// Motivos y ejecución de Ajustes de Stock en WMS
router.get('/motivos', wmsController.getMotivos);
router.post('/ajuste', wmsController.ejecutarAjuste);

module.exports = router;
