const fs = require('fs');
const path = require('path');

const files = [
  'c:/cdf-app/front/src/views/CrearPedidoSucursal.vue',
  'c:/cdf-app/front/src/views/PrepararPedido.vue',
  'c:/cdf-app/front/src/views/Pedidos.vue',
  'c:/cdf-app/front/src/views/Productos.vue'
];

files.forEach(filepath => {
  if (fs.existsSync(filepath)) {
    console.log(`\n=== File: ${path.basename(filepath)} ===`);
    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('pesable')) {
        console.log(`${index + 1}: ${line.trim()}`);
      }
    });
  } else {
    console.log(`File not found: ${filepath}`);
  }
});
