const app = require('./app');
const env = require('./config/env');

function startServerNoDb() {
  console.warn('Starting server in NO-DB mode (skipping connectDb)');

  app.listen(env.port, () => {
    console.log(`API (no-db) running on http://localhost:${env.port}`);
  });
}

startServerNoDb();
