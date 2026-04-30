const { spawn } = require('child_process');

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, ['tsx', 'server.ts'], { 
  stdio: 'inherit', 
  shell: true,
  env: { ...process.env, PORT: '3001' }
});

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
  fetch('http://localhost:3001/api/auth/url')
    .then(r => r.json())
    .then(data => {
      console.log('TEST SERVER RESPONSE:', data);
      child.kill('SIGTERM');
      process.exit(0);
    })
    .catch(e => {
      console.error(e);
      child.kill('SIGTERM');
      process.exit(1);
    });
}, 5000);
