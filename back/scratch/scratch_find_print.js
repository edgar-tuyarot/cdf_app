const fs = require('fs');

const filepath = 'c:/cdf-app/front/src/views/CrearPedidoSucursal.vue';
if (fs.existsSync(filepath)) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('print') || line.includes('Print')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log("File not found");
}
