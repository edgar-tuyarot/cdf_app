const fs = require('fs');

const content = fs.readFileSync('c:/cdf-app/front/src/views/Pedidos.vue', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('uploadFile') || line.includes('selectedFile') || line.includes('onFileSelected') || line.includes('triggerFileInput')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
