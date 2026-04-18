const { exec } = require('child_process');
const child = exec('PORT=3001 npx tsx server.ts');
child.stdout.on('data', console.log);
child.stderr.on('data', console.error);
setTimeout(() => {
  fetch('http://localhost:3001/api/auth/url')
    .then(r => r.json())
    .then(data => {
      console.log('TEST SERVER RESPONSE:', data);
      child.kill();
      process.exit(0);
    })
    .catch(e => {
      console.error(e);
      child.kill();
      process.exit(1);
    });
}, 5000);
