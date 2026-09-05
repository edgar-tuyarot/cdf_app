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

// Consulta de Reporte de Diferencias en Órdenes de Ingreso
router.get('/reporte-diferencias-ingreso', wmsController.getReporteDiferenciasIngreso);
router.post('/reporte-diferencias-ingreso', wmsController.getReporteDiferenciasIngreso);

// Consulta de Stock por Sucursales (Consolidado por Sitio)
router.get('/stock-sucursales', wmsController.getStockSucursales);
router.post('/stock-sucursales', wmsController.getStockSucursales);

// Consulta de Órdenes de Ingreso por Rango de Fecha y Site
router.get('/ordenes-ingreso', wmsController.getOrdenesIngreso);
router.post('/ordenes-ingreso', wmsController.getOrdenesIngreso);

// Consulta de Órdenes de Ingreso Pendientes por Site
router.get('/ordenes-ingreso-pendientes', wmsController.getOrdenesIngresoPendientes);
router.post('/ordenes-ingreso-pendientes', wmsController.getOrdenesIngresoPendientes);
router.post('/recepcionar-orden', wmsController.procesarRecepcionOrden);

// Consulta de Órdenes de Egreso / Despacho por Rango de Fecha y Site
router.get('/ordenes-egreso', wmsController.getOrdenesEgreso);
router.post('/ordenes-egreso', wmsController.getOrdenesEgreso);

// Sumar pesos de una orden al campo recorte de productos_stock en BBDD local
router.post('/impactar-recortes', wmsController.impactarRecortesOrden);
router.post('/registrar-vencimientos', wmsController.registrarVencimientosOrden);
router.get('/pdf-orden-wms', wmsController.obtenerPdfOrdenWMS);

// Metadatos de la BBDD BlockWMS (Tablas/Vistas) y consultas dinámicas
router.get('/tablas', wmsController.getTablas);
router.post('/consulta-sql', wmsController.ejecutarConsultaSql);

module.exports = router;
