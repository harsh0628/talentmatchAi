const { v4: uuidv4 } = require('uuid');
const benchmarksService = require('./benchmarks.service');
const { generateCandidateMatch, generateHeuristicMatch } = require('../ai/ai.service');
const { observeBenchmarkEvaluation } = require('../../common/metrics');

/**
 * Create a new benchmark test case
 * POST /api/benchmarks
 */
exports.createBenchmark = async (req, res) => {
	try {
		const {
			jobTitle,
			jobDescription,
			requiredSkills,
			candidateName,
			candidateRole,
			candidateYearsExperience,
			candidateSkills,
			candidateSummary,
			expectedOverallScore,
			expectedStrengths,
			expectedGaps,
			expectedSummaryKeywords,
			category,
			difficulty,
			description,
		} = req.body;

		if (!jobTitle || !jobDescription || !candidateRole || expectedOverallScore === undefined) {
			return res.status(400).json({
				error: 'Missing required fields: jobTitle, jobDescription, candidateRole, expectedOverallScore',
			});
		}

		if (expectedOverallScore < 0 || expectedOverallScore > 100) {
			return res.status(400).json({ error: 'expectedOverallScore must be 0-100' });
		}

		const benchmark = await benchmarksService.createBenchmark({
			jobTitle,
			jobDescription,
			requiredSkills,
			candidateName,
			candidateRole,
			candidateYearsExperience,
			candidateSkills,
			candidateSummary,
			expectedOverallScore,
			expectedStrengths,
			expectedGaps,
			expectedSummaryKeywords,
			category,
			difficulty,
			description,
		});

		return res.status(201).json({
			message: 'Benchmark created successfully',
			benchmark,
		});
	} catch (error) {
		console.error('Create benchmark error:', error);
		return res.status(500).json({ error: error.message });
	}
};

/**
 * Get all benchmarks or filter by category/difficulty
 * GET /api/benchmarks?category=perfect-match&difficulty=hard
 */
exports.getBenchmarks = async (req, res) => {
	try {
		const { category, difficulty } = req.query;
		const query = {};
		if (category) query.category = category;
		if (difficulty) query.difficulty = difficulty;

		const benchmarks = await require('./benchmarks.model').find(query).lean();

		return res.json({
			success: true,
			data: benchmarks,
		});
	} catch (error) {
		console.error('Get benchmarks error:', error);
		return res.status(500).json({ error: error.message });
	}
};

/**
 * Run evaluation against all benchmarks
 * POST /api/benchmarks/evaluate
 * Body: { category?: string, difficulty?: string, scoringMethod: 'gemini' | 'heuristic' | 'hybrid' }
 */
exports.evaluateBenchmarks = async (req, res) => {
	const startedAt = Date.now();
	const scoringMethod = req.body?.scoringMethod || 'gemini';
	try {
		const { category, difficulty } = req.body;
		const requestId = uuidv4();

		// AI generation function based on scoring method
		let generateFn = generateCandidateMatch; // default: gemini with fallback
		if (scoringMethod === 'hybrid') {
			const { generateHybridMatch } = require('../ai/ai.service');
			generateFn = generateHybridMatch;
		} else if (scoringMethod === 'heuristic') {
			generateFn = generateHeuristicMatch;
		}

		const evaluation = await benchmarksService.runBenchmarkEvaluation(
			(payload) => generateFn(payload, { requestId }),
			{ category, difficulty }
		);

		observeBenchmarkEvaluation({
			scoringMethod,
			status: 'success',
			durationSeconds: (Date.now() - startedAt) / 1000,
			passRate: Number(evaluation.passRate),
		});

		return res.json({
			success: true,
			message: `Evaluation complete: ${evaluation.passRate}% pass rate`,
			data: evaluation,
		});
	} catch (error) {
		console.error('Evaluate benchmarks error:', error);
		observeBenchmarkEvaluation({
			scoringMethod,
			status: 'error',
			durationSeconds: (Date.now() - startedAt) / 1000,
		});
		return res.status(500).json({ message: error.message, error: error.message });
	}
};

/**
 * Get benchmark statistics
 * GET /api/benchmarks/stats
 */
exports.getBenchmarkStats = async (req, res) => {
	try {
		const stats = await benchmarksService.getBenchmarkStats();

		return res.json({
			success: true,
			data: stats,
		});
	} catch (error) {
		console.error('Get benchmark stats error:', error);
		return res.status(500).json({ error: error.message });
	}
};

/**
 * Batch create benchmarks (for seeding)
 * POST /api/benchmarks/batch
 */
exports.batchCreateBenchmarks = async (req, res) => {
	try {
		const { benchmarks } = req.body;

		if (!Array.isArray(benchmarks) || benchmarks.length === 0) {
			return res.status(400).json({ error: 'benchmarks array is required and must not be empty' });
		}

		const Benchmark = require('./benchmarks.model');
		const created = await Benchmark.insertMany(benchmarks);

		return res.status(201).json({
			message: `${created.length} benchmarks created`,
			created,
		});
	} catch (error) {
		console.error('Batch create benchmarks error:', error);
		return res.status(500).json({ error: error.message });
	}
};
