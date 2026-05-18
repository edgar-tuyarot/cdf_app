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

app.use('/api/productos', productosRoutes);
app.use('/api/procesos', procesosRoutes);
app.use('/api/fraccionados', fraccionadosRoutes);
app.use('/api/pedidos', pedidosRoutes);


// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
