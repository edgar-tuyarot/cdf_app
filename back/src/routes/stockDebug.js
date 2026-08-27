const express = require('express');
const router = express.Router();
const stockDebugController = require('../controllers/stockDebugController');

// GET /api/stock/debug
router.get('/debug', stockDebugController.consultarStockDebug);

module.exports = router;
