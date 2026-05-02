const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const authRouter = require('./modules/auth/auth.routes');
const jobsRouter = require('./modules/jobs/jobs.routes');
const candidatesRouter = require('./modules/candidates/candidates.routes');
const interviewsRouter = require('./modules/interviews/interviews.routes');
const evaluationReportsRouter = require('./modules/evaluationReports/evaluationReports.routes');
const aiRouter = require('./modules/ai/ai.routes');
const benchmarksRouter = require('./modules/benchmarks/benchmarks.routes');
const { allowRoles, requireAuth } = require('./middleware/auth');
const requestContext = require('./middleware/requestContext');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { metricsMiddleware, metricsHandler } = require('./common/metrics');

const app = express();

app.use(
	cors({
		origin: env.clientUrl,
		credentials: true,
	}),
);
app.use(
	helmet({
		crossOriginResourcePolicy: false,
	}),
);
app.use(requestContext);

morgan.token('requestId', (req) => req.requestId || '-');
app.use(cookieParser());
app.use(express.json());
app.use(morgan(':requestId :method :url :status :response-time ms'));
app.use(metricsMiddleware);

app.get('/health', (req, res) => {
	res.status(200).json({ success: true, message: 'API is healthy' });
});

app.get('/metrics', metricsHandler);

app.use('/api/auth', authRouter);

app.use('/api/jobs', requireAuth, allowRoles('Admin', 'Recruiter'), jobsRouter);
app.use('/api/candidates', requireAuth, allowRoles('Admin', 'Recruiter'), candidatesRouter);
app.use('/api/interviews', requireAuth, allowRoles('Admin', 'Recruiter', 'Interviewer'), interviewsRouter);
app.use('/api/evaluation-reports', requireAuth, allowRoles('Admin', 'Recruiter', 'Interviewer'), evaluationReportsRouter);
app.use('/api/ai', requireAuth, allowRoles('Admin', 'Recruiter', 'Interviewer'), aiRouter);
app.use('/api/benchmarks', requireAuth, allowRoles('Admin', 'Recruiter'), benchmarksRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
