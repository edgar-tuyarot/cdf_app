const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

router.get('/semanal', reportesController.obtenerReporteSemanal);

module.exports = router;
