const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'talentmatch_api_',
});

const httpRequestsTotal = new client.Counter({
  name: 'talentmatch_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'talentmatch_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const aiScoringRequestsTotal = new client.Counter({
  name: 'talentmatch_ai_scoring_requests_total',
  help: 'Total AI scoring requests by mode/provider/result',
  labelNames: ['mode', 'provider', 'result'],
  registers: [register],
});

const benchmarkEvaluationDurationSeconds = new client.Histogram({
  name: 'talentmatch_benchmark_evaluation_duration_seconds',
  help: 'Benchmark evaluation duration in seconds',
  labelNames: ['scoring_method', 'status'],
  buckets: [0.05, 0.1, 0.5, 1, 2, 5, 10, 20, 30],
  registers: [register],
});

const benchmarkEvaluationPassRate = new client.Gauge({
  name: 'talentmatch_benchmark_evaluation_pass_rate',
  help: 'Last benchmark evaluation pass rate percentage',
  labelNames: ['scoring_method'],
  registers: [register],
});

function getRouteLabel(req) {
  if (req.baseUrl && req.route && req.route.path) {
    return `${req.baseUrl}${req.route.path}`;
  }

  if (req.route && req.route.path) {
    return req.route.path;
  }

  if (req.path) {
    return req.path;
  }

  return 'unmatched';
}

function metricsMiddleware(req, res, next) {
  const startedAtNs = process.hrtime.bigint();

  res.on('finish', () => {
    const route = getRouteLabel(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    const durationSeconds = Number(process.hrtime.bigint() - startedAtNs) / 1e9;

    httpRequestsTotal.inc(labels, 1);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
}

async function metricsHandler(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

function recordAiScoring({ mode = 'unknown', provider = 'unknown', result = 'success' }) {
  aiScoringRequestsTotal.inc({ mode, provider, result }, 1);
}

function observeBenchmarkEvaluation({
  scoringMethod = 'unknown',
  status = 'success',
  durationSeconds = 0,
  passRate,
}) {
  benchmarkEvaluationDurationSeconds.observe({ scoring_method: scoringMethod, status }, durationSeconds);

  if (typeof passRate === 'number' && Number.isFinite(passRate)) {
    benchmarkEvaluationPassRate.set({ scoring_method: scoringMethod }, passRate);
  }
}

module.exports = {
  register,
  metricsMiddleware,
  metricsHandler,
  recordAiScoring,
  observeBenchmarkEvaluation,
};
