const fs = require('fs');
const path = require('path');

const controllersDir = 'c:/cdf-app/back/src/controllers';
if (fs.existsSync(controllersDir)) {
  const files = fs.readdirSync(controllersDir);
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(path.join(controllersDir, file), 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('cantidad_piezas') || line.includes('piezas')) {
          console.log(`${file}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  });
} else {
  console.log("Controllers folder not found");
}
