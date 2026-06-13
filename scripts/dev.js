const { spawn } = require('child_process');

let shuttingDown = false;

function startProcess(label, commandLine) {
  const isWindows = process.platform === 'win32';
  const child = isWindows
    ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', commandLine], {
        cwd: process.cwd(),
        shell: false,
        stdio: 'inherit',
        env: process.env,
      })
    : spawn('npm', commandLine.split(' '), {
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

const api = startProcess('API', 'npm run dev -w apps/api');
const web = startProcess('Web', 'npm run dev -w apps/web');

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