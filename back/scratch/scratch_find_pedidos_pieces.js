const fs = require('fs');

const filepath = 'c:/cdf-app/back/src/controllers/pedidosController.js';
if (fs.existsSync(filepath)) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('pieza') || line.includes('cantidad_piezas') || line.includes('cantidad_enviada')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log("File not found");
}
