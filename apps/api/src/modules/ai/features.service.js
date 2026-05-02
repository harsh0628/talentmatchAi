/**
 * Feature extraction for hybrid scoring
 * Combines LLM judgment with deterministic metrics
 */

const STOP_WORDS = new Set([
	'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is', 'it', 'of', 'on',
	'or', 'that', 'the', 'to', 'with', 'will', 'you', 'your', 'we', 'our', 'this', 'these', 'those',
	'job', 'position', 'role', 'candidate', 'experience', 'must', 'have', 'should', 'skill',
]);

/**
 * Extract words from text (keywords >= 3 chars, excluding stop words)
 */
function extractKeywords(text = '') {
	return [...new Set(
		String(text)
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, ' ')
			.split(/\s+/)
			.filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
	)];
}

/**
 * Parse comma-separated skills list
 */
function parseSkills(input = '') {
	return String(input)
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean)
		.slice(0, 50);
}

/**
 * Calculate skill overlap percentage
 * What % of required skills does the candidate have?
 */
function calculateSkillOverlapScore(requiredSkills, candidateSkills) {
	const required = parseSkills(requiredSkills);
	const candidate = parseSkills(candidateSkills);

	if (required.length === 0) return 100; // No requirements = perfect match

	const matches = required.filter((skill) => {
		return candidate.some((cSkill) => {
			// Exact match or substring match
			return cSkill === skill || skill.includes(cSkill) || cSkill.includes(skill);
		});
	}).length;

	return (matches / required.length) * 100;
}

/**
 * Calculate experience alignment score
 * Does candidate have enough years?
 */
function calculateExperienceScore(requiredYears, candidateYears) {
	const required = Number(requiredYears) || 0;
	const candidate = Number(candidateYears) || 0;

	if (required === 0) return 100; // No requirement
	if (candidate >= required) return 100; // Meets or exceeds
	if (candidate >= required * 0.8) return 80; // 80% of requirement
	if (candidate >= required * 0.5) return 60; // 50% of requirement
	return Math.max(0, (candidate / required) * 100); // Proportional
}

/**
 * Calculate role similarity score
 * How similar is the candidate's role to the job title?
 */
function calculateRoleSimilarityScore(jobTitle, candidateRole) {
	const jobKeywords = extractKeywords(jobTitle);
	const roleKeywords = extractKeywords(candidateRole);

	if (jobKeywords.length === 0) return 50; // Unknown
	if (roleKeywords.length === 0) return 0; // No role specified

	const matches = jobKeywords.filter((keyword) => roleKeywords.includes(keyword)).length;
	return (matches / jobKeywords.length) * 100;
}

/**
 * Calculate text similarity between two descriptions (Jaccard similarity)
 * Higher overlap = higher similarity
 */
function calculateTextSimilarity(text1, text2) {
	const words1 = new Set(extractKeywords(text1));
	const words2 = new Set(extractKeywords(text2));

	if (words1.size === 0 || words2.size === 0) return 0;

	const intersection = new Set([...words1].filter((x) => words2.has(x)));
	const union = new Set([...words1, ...words2]);

	return (intersection.size / union.size) * 100;
}

/**
 * Extract required years from job description
 */
function extractRequiredYears(jobDescription) {
	const match = String(jobDescription || '').match(/(\d+)\s*\+?\s*(?:years|year|yrs|yr)/i);
	return Number(match?.[1]) || 0;
}

/**
 * Main feature extraction function
 * Returns all features needed for hybrid scoring
 */
function extractFeatures(payload) {
	const requiredYears = extractRequiredYears(payload.jobDescription);

	return {
		skillOverlap: calculateSkillOverlapScore(payload.requiredSkills, payload.candidateSkills),
		experienceMatch: calculateExperienceScore(requiredYears, payload.candidateYearsExperience),
		roleSimilarity: calculateRoleSimilarityScore(payload.jobTitle, payload.candidateRole),
		jobDescriptionSimilarity: calculateTextSimilarity(
			payload.jobDescription,
			payload.candidateSummary,
		),
		requiredYears,
		candidateYears: Number(payload.candidateYearsExperience) || 0,
	};
}

/**
 * Combine LLM score with feature scores using weighted average
 * @param {number} llmScore - Raw Gemini score (0-100)
 * @param {Object} features - Feature scores object
 * @param {Object} weights - Custom weights (optional)
 * @returns {Object} Hybrid result with breakdown
 */
function hybridScore(llmScore, features, weights = {}) {
	// Default weights: 60% LLM, 20% skill, 15% experience, 5% role
	const w = {
		llm: weights.llm ?? 0.6,
		skill: weights.skill ?? 0.2,
		experience: weights.experience ?? 0.15,
		role: weights.role ?? 0.05,
	};

	// Normalize weights
	const totalWeight = w.llm + w.skill + w.experience + w.role;
	const normalizedWeights = {
		llm: w.llm / totalWeight,
		skill: w.skill / totalWeight,
		experience: w.experience / totalWeight,
		role: w.role / totalWeight,
	};

	// Calculate hybrid score
	const hybridResult = (
		llmScore * normalizedWeights.llm +
		features.skillOverlap * normalizedWeights.skill +
		features.experienceMatch * normalizedWeights.experience +
		features.roleSimilarity * normalizedWeights.role
	);

	return {
		hybridScore: Math.round(hybridResult),
		llmScore,
		featureBreakdown: {
			skillOverlap: Math.round(features.skillOverlap),
			experienceMatch: Math.round(features.experienceMatch),
			roleSimilarity: Math.round(features.roleSimilarity),
		},
		weights: normalizedWeights,
		confidence: Math.round(llmScore * 0.95), // Slightly lower confidence than pure LLM
	};
}

module.exports = {
	extractFeatures,
	hybridScore,
	calculateSkillOverlapScore,
	calculateExperienceScore,
	calculateRoleSimilarityScore,
	calculateTextSimilarity,
};
