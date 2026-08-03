const { execSync } = require('child_process');

try {
  const diff = execSync('git log -p -S "INGRESO_PROVEEDOR" c:/cdf-app/back', { encoding: 'utf-8' });
  console.log(diff.substring(0, 1500));
} catch (error) {
  console.error(error);
}
