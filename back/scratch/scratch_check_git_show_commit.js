const { execSync } = require('child_process');

try {
  const diff = execSync('git show ea47cd77558b13b8d9c8b3485287851fa428cd06 -- c:/cdf-app/back/src/controllers/productosController.js', { encoding: 'utf-8' });
  console.log(diff.substring(0, 4000));
} catch (error) {
  console.error(error);
}
