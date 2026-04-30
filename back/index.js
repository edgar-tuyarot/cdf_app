const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas Modulares
const productosRoutes = require('./src/routes/productos');
const colaboradoresRoutes = require('./src/routes/colaboradores');
const produccionRoutes = require('./src/routes/produccion');
const uploadRoutes = require('./src/routes/upload');
const ingresosRoutes = require('./src/routes/ingresos');
const sucursalesRoutes = require('./src/routes/sucursales');
const pedidosRoutes = require('./src/routes/pedidos');
const usuariosRoutes = require('./src/routes/usuarios');
const feteadoRoutes = require('./src/routes/feteado');
const envasadoRoutes = require('./src/routes/envasado');
const piezasRoutes = require('./src/routes/piezas');
const stockKilosRoutes = require('./src/routes/stockKilos');
const preparacionPedidosRoutes = require('./src/routes/preparacionPedidos');
const dashboardRoutes = require('./src/routes/dashboard');
const recortesRoutes = require('./src/routes/recortes');

app.use('/api/productos', productosRoutes);
app.use('/api/colaboradores', colaboradoresRoutes);
app.use('/api/produccion', produccionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ingresos', ingresosRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/feteado', feteadoRoutes);
app.use('/api/envasado', envasadoRoutes);
app.use('/api/piezas', piezasRoutes);
app.use('/api/stock-kilos', stockKilosRoutes);
app.use('/api/preparacion-pedidos', preparacionPedidosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recortes', recortesRoutes);

// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
