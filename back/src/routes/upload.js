const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');

// Configuración de multer (guardamos en la carpeta temporal 'uploads/')
const upload = multer({ dest: 'uploads/' });

// Ruta para subir productos masivamente (espera un archivo con key 'file')
router.post('/productos', upload.single('file'), uploadController.uploadProductosCSV);

// Ruta para subir pedidos masivamente (espera un archivo con key 'file')
router.post('/pedidos', upload.single('file'), uploadController.uploadPedidosCSV);

module.exports = router;
