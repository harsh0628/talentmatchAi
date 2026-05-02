const app = require('./app');
const env = require('./config/env');
const connectDb = require('./config/db');

async function startServer() {
	try {
		await connectDb();

		app.listen(env.port, () => {
			console.log(`API running on http://localhost:${env.port}`);
		});
	} catch (error) {
		console.error('Server startup failed:', error.message);
		process.exit(1);
	}
}

startServer();
