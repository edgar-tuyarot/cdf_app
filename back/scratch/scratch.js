const express = require('express');
const app = express();
app.use(express.json());

try {
  const productosRoutes = require('./src/routes/productos');
  const procesosRoutes = require('./src/routes/procesos');
  const proveedoresRoutes = require('./src/routes/proveedores');
  
  app.use('/api/productos', productosRoutes);
  app.use('/api/procesos', procesosRoutes);
  app.use('/api/proveedores', proveedoresRoutes);

  console.log("BACKEND CODE COMPILES AND IMPORTS SUCCESSFULLY!");
  process.exit(0);
} catch (e) {
  console.error("IMPORT ERROR:", e);
  process.exit(1);
}
