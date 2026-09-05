const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware to resolve active location (id_ubicacion)
app.use((req, res, next) => {
  const headerVal = req.headers['x-ubicacion-id'];
  const queryVal = req.query.id_ubicacion;
  const bodyVal = req.body ? req.body.id_ubicacion : null;
  req.ubicacionId = parseInt(headerVal || queryVal || bodyVal || 1, 10);
  console.log(`[Ubicacion Middleware] URL: ${req.method} ${req.url} | X-Ubicacion-Id: ${headerVal} | Resolvio a: ${req.ubicacionId}`);
  next();
});

// Rutas Modulares
const productosRoutes = require('././src/routes/productos');
const procesosRoutes = require('./src/routes/procesos');
const fraccionadosRoutes = require('./src/routes/fraccionados');
const pedidosRoutes = require('./src/routes/pedidos');
const colaboradoresRoutes = require('./src/routes/colaboradores');
const sucursalesRoutes = require('./src/routes/sucursales');
const proveedoresRoutes = require('./src/routes/proveedores');
const ingresoSucursalesRoutes = require('./src/routes/ingresosSucursales');
const dashboardRoutes = require('./src/routes/dashboard');
const authRoutes = require('./src/routes/auth');
const permisosRoutes = require('./src/routes/permisos');
const bultosRoutes = require('./src/routes/bultos');
const ubicacionesRoutes = require('./src/routes/ubicaciones');
const usuariosRoutes = require('./src/routes/usuarios');
const ordenesCompraRoutes = require('./src/routes/ordenesCompra');
const stockDebugRoutes = require('./src/routes/stockDebug');
const wmsRoutes = require('./src/routes/wms');
const registrosRoutes = require('./src/routes/registros');
const productosController = require('./src/controllers/productosController');

app.use('/api/productos', productosRoutes);
app.get('/api/movimientos-stock', productosController.obtenerMovimientosStock);
app.use('/api/procesos', procesosRoutes);
app.use('/api/fraccionados', fraccionadosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/colaboradores', colaboradoresRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/bultos', bultosRoutes);
app.use('/api/ingreso-sucursales', ingresoSucursalesRoutes);
app.use('/api/ingresos-sucursales', ingresoSucursalesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/produccion', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/permisos', permisosRoutes);
app.use('/api/ubicaciones', ubicacionesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/ordenes-compra', ordenesCompraRoutes);
app.use('/api/stock', stockDebugRoutes);
app.use('/api/wms', wmsRoutes);
app.use('/api/registros', registrosRoutes);

// Servir frontend compilado en producción (dist)
const path = require('path');
const distPath = path.join(__dirname, '../front/dist');
app.use(express.static(distPath));

app.get('/{*path}', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Middleware global de manejo de errores en Backend Express
app.use((err, req, res, next) => {
  console.error(`[Error Handler Backend] URL: ${req.method} ${req.originalUrl}`, err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Ocurrió un error interno e inesperado en el servidor.';

  res.status(status).json({
    error: message,
    detalles: process.env.NODE_ENV === 'development' ? err.stack : (err.detalles || err.stack || null),
    path: req.originalUrl,
    method: req.method,
    status
  });
});

// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
