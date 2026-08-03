const fs = require('fs');

const content = fs.readFileSync('c:/cdf-app/front/src/views/Pedidos.vue', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('showUploadModal') || line.includes('uploadExcel') || line.includes('onFileChange')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
