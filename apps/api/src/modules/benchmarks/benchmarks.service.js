const Benchmark = require('./benchmarks.model');

/**
 * Extract key themes from text
 * Used to match expected vs predicted strengths/gaps
 */
function extractThemes(text = '') {
	return text
		.toLowerCase()
		.split(/[\s,.:;!?]/g)
		.filter((word) => word.length >= 4)
		.filter((word) => !['skill', 'gap', 'experience', 'candidate', 'match'].includes(word))
		.slice(0, 10);
}

/**
 * Calculate theme overlap between expected and predicted
 */
function calculateThemeOverlap(expected = [], predicted = []) {
	const expectedThemes = expected.flatMap(extractThemes);
	const predictedThemes = predicted.flatMap(extractThemes);

	if (expectedThemes.length === 0) return 1; // Perfect match if no expectations
	if (predictedThemes.length === 0) return 0; // No match if nothing predicted

	const matches = predictedThemes.filter((theme) => expectedThemes.includes(theme)).length;
	return matches / Math.max(expectedThemes.length, 1);
}

/**
 * Evaluate a single AI prediction against benchmark
 * @param {Object} benchmark - The benchmark test case
 * @param {Object} aiResult - The AI prediction result
 * @param {number} tolerancePoints - How many points difference is acceptable (default 10)
 * @returns {Object} Evaluation result
 */
function evaluateResult(benchmark, aiResult, tolerancePoints = 10) {
	const startTime = Date.now();

	const scoreDifference = Math.abs(aiResult.overallScore - benchmark.expectedOverallScore);
	const isCorrect = scoreDifference <= tolerancePoints;

	const strengthsOverlap = calculateThemeOverlap(benchmark.expectedStrengths, aiResult.strengths);
	const gapsOverlap = calculateThemeOverlap(benchmark.expectedGaps, aiResult.gaps);

	const matchedStrengths = Math.round(strengthsOverlap * (benchmark.expectedStrengths?.length || 5));
	const matchedGaps = Math.round(gapsOverlap * (benchmark.expectedGaps?.length || 5));

	return {
		evaluatedAt: new Date(),
		provider: aiResult.provider,
		model: aiResult.model,
		predictedScore: aiResult.overallScore,
		scoreDifference,
		isCorrect,
		matchedStrengths,
		matchedGaps,
		latencyMs: Date.now() - startTime,
	};
}

/**
 * Run all benchmarks and return metrics
 * @returns {Object} Comprehensive evaluation report
 */
async function runBenchmarkEvaluation(aiGenerateFn, filters = {}) {
	const query = {};

	// Optional filtering
	if (filters.category) query.category = filters.category;
	if (filters.difficulty) query.difficulty = filters.difficulty;

	const benchmarks = await Benchmark.find(query).lean();

	if (benchmarks.length === 0) {
		throw new Error('No benchmarks found. Please create test cases first.');
	}

	const results = {
		totalTests: 0,
		passedTests: 0,
		failedTests: 0,
		averageScoreDiff: 0,
		averageStrengthMatch: 0,
		averageGapMatch: 0,
		medianLatency: 0,
		testResults: [],
	};

	const latencies = [];
	let totalScoreDiff = 0;
	let totalStrengthMatch = 0;
	let totalGapMatch = 0;

	for (const benchmark of benchmarks) {
		try {
			// Call AI to generate prediction
			const aiResult = await aiGenerateFn({
				jobTitle: benchmark.jobTitle,
				jobDescription: benchmark.jobDescription,
				requiredSkills: benchmark.requiredSkills,
				candidateName: benchmark.candidateName,
				candidateRole: benchmark.candidateRole,
				candidateYearsExperience: benchmark.candidateYearsExperience,
				candidateSkills: benchmark.candidateSkills,
				candidateSummary: benchmark.candidateSummary,
			});

			// Evaluate prediction
			const evaluation = evaluateResult(benchmark, aiResult);

			results.testResults.push({
				benchmarkId: benchmark._id,
				jobTitle: benchmark.jobTitle,
				candidateRole: benchmark.candidateRole,
				...evaluation,
			});

			results.totalTests += 1;
			if (evaluation.isCorrect) results.passedTests += 1;
			else results.failedTests += 1;

			totalScoreDiff += evaluation.scoreDifference;
			totalStrengthMatch += evaluation.matchedStrengths;
			totalGapMatch += evaluation.matchedGaps;
			latencies.push(evaluation.latencyMs);
		} catch (error) {
			results.testResults.push({
				benchmarkId: benchmark._id,
				error: error.message,
			});
			results.failedTests += 1;
		}
	}

	results.averageScoreDiff = (totalScoreDiff / results.totalTests).toFixed(2);
	results.averageStrengthMatch = (totalStrengthMatch / results.totalTests).toFixed(2);
	results.averageGapMatch = (totalGapMatch / results.totalTests).toFixed(2);

	// Calculate median latency
	latencies.sort((a, b) => a - b);
	results.medianLatency =
		latencies[Math.floor(latencies.length / 2)] || 0;

	results.passRate = ((results.passedTests / results.totalTests) * 100).toFixed(2);

	return results;
}

/**
 * Create a new benchmark test case
 */
async function createBenchmark(data) {
	const benchmark = new Benchmark({
		jobTitle: data.jobTitle,
		jobDescription: data.jobDescription,
		requiredSkills: data.requiredSkills,
		candidateName: data.candidateName,
		candidateRole: data.candidateRole,
		candidateYearsExperience: data.candidateYearsExperience,
		candidateSkills: data.candidateSkills,
		candidateSummary: data.candidateSummary,
		expectedOverallScore: data.expectedOverallScore,
		expectedStrengths: data.expectedStrengths || [],
		expectedGaps: data.expectedGaps || [],
		expectedSummaryKeywords: data.expectedSummaryKeywords || [],
		category: data.category,
		difficulty: data.difficulty,
		description: data.description,
	});

	return await benchmark.save();
}

/**
 * Get benchmark statistics
 */
async function getBenchmarkStats() {
	const stats = await Benchmark.aggregate([
		{
			$group: {
				_id: '$category',
				count: { $sum: 1 },
				avgExpectedScore: { $avg: '$expectedOverallScore' },
			},
		},
		{
			$sort: { _id: 1 },
		},
	]);

	return stats;
}

module.exports = {
	createBenchmark,
	runBenchmarkEvaluation,
	evaluateResult,
	getBenchmarkStats,
};
