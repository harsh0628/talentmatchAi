const mongoose = require('mongoose');

const benchmarkSchema = new mongoose.Schema(
	{
		// Test case inputs
		jobTitle: {
			type: String,
			required: true,
			trim: true,
		},
		jobDescription: {
			type: String,
			required: true,
			trim: true,
		},
		requiredSkills: String,

		// Candidate inputs
		candidateName: String,
		candidateRole: {
			type: String,
			required: true,
			trim: true,
		},
		candidateYearsExperience: {
			type: Number,
			default: 0,
		},
		candidateSkills: String,
		candidateSummary: String,

		// Expected results (what the AI SHOULD score)
		expectedOverallScore: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
		},
		expectedStrengths: [String],
		expectedGaps: [String],
		expectedSummaryKeywords: [String], // Keywords that should appear in summary

		// Metadata
		category: {
			type: String,
			enum: ['perfect-match', 'partial-match', 'poor-match', 'edge-case'],
			default: 'partial-match',
		},
		difficulty: {
			type: String,
			enum: ['easy', 'medium', 'hard'],
			default: 'medium',
		},
		description: String, // Why this test case matters

		// Evaluation results
		evaluationResults: [
			{
				evaluatedAt: {
					type: Date,
					default: Date.now,
				},
				provider: String, // 'gemini', 'hybrid', 'heuristic-fallback'
				model: String,
				predictedScore: Number,
				scoreDifference: Number, // predicted - expected
				isCorrect: Boolean, // if |difference| <= tolerance
				matchedStrengths: Number, // How many strength themes matched
				matchedGaps: Number, // How many gap themes matched
				latencyMs: Number,
			},
		],

		createdAt: {
			type: Date,
			default: Date.now,
		},
		updatedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	},
);

const Benchmark = mongoose.model('Benchmark', benchmarkSchema);

module.exports = Benchmark;
