const express = require('express');
const router = express.Router();
const recortesController = require('../controllers/recortesController');

router.post('/recepcion', recortesController.recepcionRecortes);
router.get('/recepcion', recortesController.getRecortesRecepcion);

module.exports = router;
