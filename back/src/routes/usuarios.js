const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// Rutas para /api/usuarios
router.get('/', usuariosController.obtenerUsuarios);
router.post('/', usuariosController.crearUsuario);
router.post('/login', usuariosController.login);
router.delete('/:id', usuariosController.eliminarUsuario);

module.exports = router;
