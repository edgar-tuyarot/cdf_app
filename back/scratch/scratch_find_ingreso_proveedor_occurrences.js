const fs = require('fs');
const path = require('path');

const srcDir = 'c:/cdf-app/back/src';

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('INGRESO_PROVEEDOR')) {
          console.log(`${path.relative(srcDir, fullPath)}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  });
}

searchDir(srcDir);
