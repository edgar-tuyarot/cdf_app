const express = require('express');
const router = express.Router();
const ingresosSucursalesController = require('../controllers/ingresosSucursalesController');

// Definir endpoints
router.get('/', ingresosSucursalesController.list);
router.post('/', ingresosSucursalesController.create);

module.exports = router;
