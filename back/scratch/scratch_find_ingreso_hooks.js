const fs = require('fs');

const filepath = 'c:/cdf-app/back/src/models/index.js';
if (fs.existsSync(filepath)) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('IngresoProveedor.') || line.includes('IngresoProveedorClass') || line.includes('ingreso_proveedores')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log("File not found");
}
