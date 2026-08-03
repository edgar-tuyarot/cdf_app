const fs = require('fs');
const path = require('path');

const routesDir = 'c:/cdf-app/back/src/routes';
if (fs.existsSync(routesDir)) {
  const files = fs.readdirSync(routesDir);
  files.forEach(file => {
    console.log(`Route file: ${file}`);
    const content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('router.') || line.includes('.post') || line.includes('.get')) {
        console.log(`  ${index + 1}: ${line.trim()}`);
      }
    });
  });
}
