import { exec } from 'child_process';

const child = exec('npx tsx server.ts');

child.stdout.on('data', (data) => console.log('STDOUT:', data));
child.stderr.on('data', (data) => console.error('STDERR:', data));

setTimeout(() => {
  child.kill();
  console.log('Done');
}, 5000);
