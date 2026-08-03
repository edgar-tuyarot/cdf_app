const express = require('express');
const router = express.Router();
const permisosController = require('../controllers/permisosController');

router.get('/', permisosController.obtenerPermisos);
router.post('/', permisosController.actualizarPermisos);

module.exports = router;
