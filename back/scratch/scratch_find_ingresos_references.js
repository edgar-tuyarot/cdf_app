const fs = require('fs');
const path = require('path');

const srcDir = 'c:/cdf-app/front/src';

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.vue') || file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('ingreso-proveedores') || line.includes('ingreso-sucursales') || line.includes('IngresoProveedores') || line.includes('IngresosSucursales')) {
          console.log(`${path.relative(srcDir, fullPath)}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  });
}

searchDir(srcDir);
