const { spawn } = require('child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
let shuttingDown = false;

function startProcess(label, command, args) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    shell: false,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown || code === 0) {
      return;
    }

    console.error(`${label} exited with ${signal || code}`);
    shuttingDown = true;
    api.kill();
    web.kill();
    process.exit(code || 1);
  });

  return child;
}

const api = startProcess('API', npmCommand, ['run', 'dev', '--workspace', 'apps/api']);
const web = startProcess('Web', npmCommand, ['run', 'dev', '--workspace', 'apps/web']);

function shutdown() {
  shuttingDown = true;
  api.kill();
  web.kill();
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});