const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas Modulares
const productosRoutes = require('././src/routes/productos');
const procesosRoutes = require('./src/routes/procesos');
const fraccionadosRoutes = require('./src/routes/fraccionados');
const pedidosRoutes = require('./src/routes/pedidos');
const colaboradoresRoutes = require('./src/routes/colaboradores');
const sucursalesRoutes = require('./src/routes/sucursales');
const ingresoRecortesRoutes = require('./src/routes/ingresoRecortes');
const reportesRoutes = require('./src/routes/reportes');

app.use('/api/productos', productosRoutes);
app.use('/api/procesos', procesosRoutes);
app.use('/api/fraccionados', fraccionadosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/colaboradores', colaboradoresRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/ingreso-recortes', ingresoRecortesRoutes);
app.use('/api/reportes', reportesRoutes);


// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
