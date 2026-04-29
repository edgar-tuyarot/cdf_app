const express = require('express');
const router = express.Router();
const sucursalesController = require('../controllers/sucursalesController');

// Rutas para /api/sucursales
router.get('/', sucursalesController.obtenerSucursales);
router.post('/', sucursalesController.crearSucursal);
router.put('/:id', sucursalesController.modificarSucursal);
router.delete('/:id', sucursalesController.eliminarSucursal);

module.exports = router;
