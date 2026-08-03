const fs = require('fs');

const content = fs.readFileSync('c:/cdf-app/back/src/controllers/pedidosController.js', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.trim().startsWith('exports.')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
