import { spawn } from 'child_process';

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(npxCmd, ['tsx', 'server.ts'], { stdio: 'inherit', shell: true, env: { ...process.env, PORT: '3001' } });

child.on('error', (err) => {
  console.error("Failed to start process:", err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (code !== 0 && signal !== 'SIGTERM') {
    console.error(`Process exited with code ${code} and signal ${signal}`);
    process.exit(code || 1);
  }
});

setTimeout(() => {
  child.kill('SIGTERM');
  console.log('Smoke test passed. Server booted and stayed alive for 5s.');
  process.exit(0);
}, 5000);
