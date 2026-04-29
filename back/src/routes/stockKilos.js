const express = require('express');
const router = express.Router();
const stockKilosController = require('../controllers/stockKilosController');

router.get('/', stockKilosController.obtenerTodos);
router.post('/cargar-excel', stockKilosController.upload, stockKilosController.cargarExcel);
router.post('/restar', stockKilosController.restar);

module.exports = router;
