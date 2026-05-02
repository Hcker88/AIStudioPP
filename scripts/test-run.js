import { spawn } from 'child_process';

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(npxCmd, ['tsx', 'server.ts'], { stdio: 'inherit', shell: true, env: { ...process.env, PORT: '3005', APP_URL: 'http://localhost:3005', NODE_ENV: 'production' } });

child.on('error', (err) => {
  console.error("Failed to start process:", err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
    console.error(`Process exited with code ${code} and signal ${signal}`);
    process.exit(code || 1);
  }
});

let attempts = 0;
const maxAttempts = 15;

const ping = () => {
  attempts++;
  const ac = new AbortController();
  const timeoutId = setTimeout(() => ac.abort(), 2000);
  
  fetch('http://localhost:3005/api/health', { signal: ac.signal })
    .then(r => {
      clearTimeout(timeoutId);
      if (r.ok) return r.json();
      throw new Error(`Status HTTP ${r.status}`);
    })
    .then(data => {
      console.log('Smoke test passed. Server health:', data);
      child.kill('SIGTERM');
      process.exit(0);
    })
    .catch(e => {
      clearTimeout(timeoutId);
      if (attempts >= maxAttempts) {
        console.error('Smoke test failed after multiple attempts:', e.message);
        child.kill('SIGTERM');
        process.exit(1);
      } else {
        setTimeout(ping, 2000);
      }
    });
};

setTimeout(ping, 2000);
