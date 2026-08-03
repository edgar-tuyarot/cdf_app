const { execSync } = require('child_process');

try {
  const diffs = execSync('git log -p -G"cantidad_piezas:"', { encoding: 'utf-8' });
  console.log(diffs.substring(0, 4000));
} catch (error) {
  console.error(error);
}
