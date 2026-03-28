import { exec } from 'child_process';

exec('ps aux | grep node', (err, stdout, stderr) => {
  console.log('STDOUT:', stdout);
  console.error('STDERR:', stderr);
});
