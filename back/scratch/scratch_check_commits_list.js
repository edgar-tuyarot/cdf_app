const { execSync } = require('child_process');

try {
  const log = execSync('git log --oneline', { encoding: 'utf-8' });
  console.log(log);
} catch (error) {
  console.error(error);
}
