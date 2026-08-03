const { execSync } = require('child_process');

try {
  const log = execSync('git log -n 5 -p c:/cdf-app/back/src/controllers/productosController.js', { encoding: 'utf-8' });
  console.log(log);
} catch (error) {
  console.error(error);
}
