const express = require('express');
const router = express.Router();
const ingresosController = require('../controllers/ingresosController');

// Rutas para /api/ingresos
router.get('/', ingresosController.obtenerIngresos);
router.post('/', ingresosController.crearIngreso);

module.exports = router;
