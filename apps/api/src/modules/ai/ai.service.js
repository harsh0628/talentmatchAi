const env = require('../../config/env');
const { recordAiScoring } = require('../../common/metrics');
const { buildRagContext } = require('./rag.service');

const STOP_WORDS = new Set([
	'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is', 'it', 'of', 'on',
	'or', 'that', 'the', 'to', 'with', 'will', 'you', 'your', 'we', 'our', 'this', 'these', 'those',
]);

function clampScore(value) {
	const numberValue = Number(value || 0);
	if (Number.isNaN(numberValue)) {
		return 0;
	}
	return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function parseSkills(input) {
	if (!input) {
		return [];
	}

	return String(input)
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
		.slice(0, 25);
}

function extractKeywords(...segments) {
	return [...new Set(
		segments
			.join(' ')
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, ' ')
			.split(/\s+/)
			.filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
	)];
}

function extractRequiredYears(jobText) {
	const match = String(jobText || '').match(/(\d+)\s*\+?\s*(?:years|year|yrs|yr)/i);
	if (!match) {
		return 0;
	}
	return Number(match[1]) || 0;
}

function normalizeMatchPayload(payload = {}) {
	return {
		jobTitle: String(payload.jobTitle || '').trim(),
		jobDescription: String(payload.jobDescription || '').trim(),
		requiredSkills: parseSkills(payload.requiredSkills).join(', '),
		candidateName: String(payload.candidateName || '').trim(),
		candidateRole: String(payload.candidateRole || '').trim(),
		candidateYearsExperience: Number(payload.candidateYearsExperience || 0),
		candidateSkills: parseSkills(payload.candidateSkills).join(', '),
		candidateSummary: String(payload.candidateSummary || '').trim(),
	};
}

function scoreHeuristically(payload) {
	const jobKeywords = extractKeywords(payload.jobTitle, payload.jobDescription, payload.requiredSkills || '');
	const candidateKeywords = extractKeywords(
		payload.candidateRole,
		payload.candidateSummary || '',
		payload.candidateSkills || '',
	);

	const overlap = jobKeywords.filter((keyword) => candidateKeywords.includes(keyword));
	const skillMatch = clampScore((overlap.length / Math.max(jobKeywords.length, 1)) * 100);

	const requiredYears = extractRequiredYears(payload.jobDescription);
	const candidateYears = Number(payload.candidateYearsExperience || 0);
	const experienceRatio = requiredYears > 0 ? Math.min(candidateYears / requiredYears, 1) : 0.7;
	const experienceMatch = clampScore(experienceRatio * 100);

	const titleTokens = extractKeywords(payload.jobTitle);
	const roleTokens = extractKeywords(payload.candidateRole);
	const roleOverlap = titleTokens.filter((token) => roleTokens.includes(token));
	const roleMatch = clampScore((roleOverlap.length / Math.max(titleTokens.length, 1)) * 100);

	const overallScore = clampScore(skillMatch * 0.6 + experienceMatch * 0.25 + roleMatch * 0.15);

	const missingKeywords = jobKeywords.filter((keyword) => !candidateKeywords.includes(keyword)).slice(0, 5);
	const strengths = overlap.slice(0, 5).map((item) => `Demonstrates relevance in ${item}`);

	return {
		overallScore,
		skillMatch,
		experienceMatch,
		roleMatch,
		strengths: strengths.length > 0 ? strengths : ['Role profile is partially aligned with the job scope'],
		gaps: missingKeywords.length > 0 ? missingKeywords.map((item) => `Needs stronger evidence in ${item}`) : [],
		summary: `Candidate appears ${overallScore >= 75 ? 'strongly' : overallScore >= 55 ? 'moderately' : 'weakly'} aligned for this role based on profile signals.`,
		confidence: clampScore(overallScore * 0.9),
		provider: 'heuristic-fallback',
		model: 'local-scoring-v1',
	};
}

function normalizeModelResponse(result) {
	return {
		overallScore: clampScore(result.overallScore),
		skillMatch: clampScore(result.skillMatch),
		experienceMatch: clampScore(result.experienceMatch),
		roleMatch: clampScore(result.roleMatch),
		strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 6) : [],
		gaps: Array.isArray(result.gaps) ? result.gaps.slice(0, 6) : [],
		summary: String(result.summary || '').slice(0, 600),
		confidence: clampScore(result.confidence),
	};
}

function extractJson(text) {
	if (!text) {
		return null;
	}

	try {
		return JSON.parse(text);
	} catch (error) {
		const start = text.indexOf('{');
		const end = text.lastIndexOf('}');
		if (start === -1 || end === -1 || end <= start) {
			return null;
		}

		try {
			return JSON.parse(text.slice(start, end + 1));
		} catch (nestedError) {
			return null;
		}
	}
}

function buildPrompt(payload, ragContext = null) {
	const promptSections = [
		'You are an experienced technical recruiter assistant.',
		'Return ONLY valid JSON. No markdown, no extra text.',
		'Use this exact schema:',
		'{"overallScore":0-100,"skillMatch":0-100,"experienceMatch":0-100,"roleMatch":0-100,"strengths":["..."],"gaps":["..."],"summary":"...","confidence":0-100}',
		'Scoring rubric:',
		'- overallScore = 60% skillMatch + 25% experienceMatch + 15% roleMatch',
		'- strengths and gaps should each have up to 5 concise bullets',
		'- confidence should reflect how complete the input data is',
		'',
		`Job Title: ${String(payload.jobTitle || '').slice(0, 180)}`,
		`Job Description: ${String(payload.jobDescription || '').slice(0, 4000)}`,
		`Required Skills: ${String(payload.requiredSkills || '').slice(0, 500)}`,
		`Candidate Name: ${String(payload.candidateName || '').slice(0, 180)}`,
		`Candidate Role: ${String(payload.candidateRole || '').slice(0, 180)}`,
		`Candidate Years Experience: ${Number(payload.candidateYearsExperience || 0)}`,
		`Candidate Skills: ${String(payload.candidateSkills || '').slice(0, 500)}`,
		`Candidate Summary: ${String(payload.candidateSummary || '').slice(0, 2500)}`,
	];

	if (ragContext?.enabled && ragContext.contextText) {
		promptSections.push('');
		promptSections.push('Retrieved internal context for RAG:', ragContext.contextText.slice(0, 4000));
	}

	return promptSections.join('\n');
}

function buildSkillGapPrompt(payload, ragContext = null) {
	const promptSections = [
		'You are an experienced technical recruiter assistant focused on skill gap analysis.',
		'Return ONLY valid JSON. No markdown, no extra text.',
		'Use this exact schema:',
		'{"overallScore":0-100,"matchedSkills":["..."],"missingSkills":["..."],"prioritySkills":["..."],"learningPlan":[{"skill":"...","why":"...","action":"...","effort":"High|Medium|Low"}],"interviewFocus":["..."],"summary":"...","confidence":0-100}',
		'Scoring rubric:',
		'- overallScore should represent how ready the candidate is for the role',
		'- matchedSkills and missingSkills should be concise and role-specific',
		'- prioritySkills should list the highest-impact missing skills first',
		'- learningPlan should contain practical next steps the candidate can follow',
		'- confidence should reflect how complete the input data is',
		'',
		`Job Title: ${String(payload.jobTitle || '').slice(0, 180)}`,
		`Job Description: ${String(payload.jobDescription || '').slice(0, 4000)}`,
		`Required Skills: ${String(payload.requiredSkills || '').slice(0, 500)}`,
		`Candidate Name: ${String(payload.candidateName || '').slice(0, 180)}`,
		`Candidate Role: ${String(payload.candidateRole || '').slice(0, 180)}`,
		`Candidate Years Experience: ${Number(payload.candidateYearsExperience || 0)}`,
		`Candidate Skills: ${String(payload.candidateSkills || '').slice(0, 500)}`,
		`Candidate Summary: ${String(payload.candidateSummary || '').slice(0, 2500)}`,
	];

	if (ragContext?.enabled && ragContext.contextText) {
		promptSections.push('');
		promptSections.push('Retrieved internal context for RAG:', ragContext.contextText.slice(0, 4000));
	}

	return promptSections.join('\n');
}

function buildSkillGapHeuristic(payload) {
	const requiredSkills = parseSkills(payload.requiredSkills);
	const candidateSkills = parseSkills(payload.candidateSkills);
	const lowerCandidateSkills = candidateSkills.map((skill) => skill.toLowerCase());

	const matchedSkills = requiredSkills.filter((skill) => {
		const lowerSkill = skill.toLowerCase();
		return lowerCandidateSkills.some((candidateSkill) => (
			candidateSkill === lowerSkill || candidateSkill.includes(lowerSkill) || lowerSkill.includes(candidateSkill)
		));
	});

	const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill));
	const prioritySkills = missingSkills.slice(0, 5);
	const fitScore = clampScore(requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) * 100 : 70);

	const requiredYears = extractRequiredYears(payload.jobDescription);
	const candidateYears = Number(payload.candidateYearsExperience || 0);
	const experienceScore = clampScore(
		requiredYears > 0 ? Math.min(candidateYears / requiredYears, 1) * 100 : 70,
	);

	const titleTokens = extractKeywords(payload.jobTitle);
	const roleTokens = extractKeywords(payload.candidateRole);
	const roleOverlap = titleTokens.filter((token) => roleTokens.includes(token));
	const roleScore = clampScore((roleOverlap.length / Math.max(titleTokens.length, 1)) * 100);

	const learningPlan = prioritySkills.map((skill, index) => ({
		skill,
		why: `Important for ${payload.jobTitle || 'this role'}`,
		action: index === 0
			? 'Build one small project or task using this skill.'
			: 'Practice interview questions and add one project example.',
		effort: index === 0 ? 'High' : 'Medium',
	}));

	return {
		overallScore: fitScore,
		skillMatch: fitScore,
		experienceMatch: experienceScore,
		roleMatch: roleScore,
		strengths: matchedSkills.length > 0 ? matchedSkills.map((skill) => `Already shows evidence of ${skill}`) : ['Profile is directionally related to the role'],
		gaps: missingSkills.length > 0 ? missingSkills.map((skill) => `Needs stronger evidence in ${skill}`) : [],
		summary: prioritySkills.length > 0
			? `The main growth areas are ${prioritySkills.join(', ')}.`
			: 'The candidate is closely aligned with the role requirements.',
		confidence: clampScore(fitScore * 0.9),
		skillGapAnalysis: {
			matchedSkills,
			missingSkills,
			prioritySkills,
			learningPlan,
			interviewFocus: prioritySkills.length > 0
				? prioritySkills.map((skill) => `Be ready to explain real examples using ${skill}`)
				: ['Be ready to explain recent projects, tradeoffs, and outcomes'],
			nextStep: prioritySkills.length > 0
				? `Start with ${prioritySkills[0]} and validate it in a small project.`
				: 'Focus on interview storytelling and project depth.',
			experienceGap: requiredYears > candidateYears
				? `${requiredYears - candidateYears} more year(s) of experience are expected for this role.`
				: 'Experience level looks aligned with the role.',
			roleAlignment: roleScore,
		},
		provider: 'heuristic-fallback',
		model: 'local-skill-gap-v1',
	};
}

async function requestGemini(payload, ragContext = null) {
	return requestGeminiWithPrompt(buildPrompt(payload, ragContext));
}

async function requestGeminiWithPrompt(promptText) {
	const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), env.aiRequestTimeoutMs);

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				contents: [
					{
						role: 'user',
						parts: [{ text: promptText }],
					},
				],
				generationConfig: {
					temperature: 0.2,
					responseMimeType: 'application/json',
				},
			}),
			signal: controller.signal,
		});

		const responseBody = await response.json();
		if (!response.ok) {
			const error = new Error(responseBody?.error?.message || 'Gemini request failed');
			error.statusCode = response.status;
			throw error;
		}

		const responseText = responseBody?.candidates?.[0]?.content?.parts?.[0]?.text || '';
		const parsed = extractJson(responseText);
		if (!parsed) {
			throw new Error('Gemini returned invalid JSON output');
		}

		return {
			...normalizeModelResponse(parsed),
			provider: 'gemini',
			model: env.geminiModel,
		};
	} finally {
		clearTimeout(timeoutId);
	}
}

async function generateCandidateMatch(payload, context = {}) {
	const normalizedPayload = normalizeMatchPayload(payload);
	const useRag = Boolean(payload.useRag);
	const modeLabel = useRag ? 'rag-gemini' : 'gemini';
	let ragContext = null;

	if (useRag) {
		try {
			ragContext = await buildRagContext(normalizedPayload);
		} catch (error) {
			ragContext = {
				enabled: false,
				keywords: [],
				topJobs: [],
				topCandidates: [],
				contextText: '',
				note: `RAG retrieval failed: ${error.message}`,
			};
		}
	}

	if (!env.geminiApiKey) {
		if (!env.aiEnableHeuristicFallback) {
			recordAiScoring({ mode: modeLabel, provider: 'gemini', result: 'error' });
			const error = new Error('GEMINI_API_KEY is missing on the server');
			error.statusCode = 503;
			throw error;
		}

		recordAiScoring({ mode: modeLabel, provider: 'heuristic-fallback', result: 'fallback' });

		return {
			...scoreHeuristically(normalizedPayload),
			requestId: context.requestId || '',
			ragContext,
			note: 'Heuristic fallback used because Gemini key is not configured.',
		};
	}

	try {
		const result = await requestGemini(normalizedPayload, ragContext);
		recordAiScoring({ mode: modeLabel, provider: 'gemini', result: 'success' });
		return {
			...result,
			requestId: context.requestId || '',
			ragContext,
		};
	} catch (error) {
		if (!env.aiEnableHeuristicFallback) {
			recordAiScoring({ mode: modeLabel, provider: 'gemini', result: 'error' });
			throw error;
		}

		recordAiScoring({ mode: modeLabel, provider: 'heuristic-fallback', result: 'fallback' });

		return {
			...scoreHeuristically(normalizedPayload),
			requestId: context.requestId || '',
			ragContext,
			note: `Fallback used because Gemini call failed: ${error.message}`,
		};
	}
}

async function generateHeuristicMatch(payload, context = {}) {
	const normalizedPayload = normalizeMatchPayload(payload);
	recordAiScoring({ mode: 'heuristic', provider: 'heuristic-fallback', result: 'success' });
	return {
		...scoreHeuristically(normalizedPayload),
		requestId: context.requestId || '',
		note: 'Heuristic scoring mode selected.',
	};
}

/**
 * Generate hybrid score combining LLM + deterministic features
 * @param {Object} payload - Job and candidate data
 * @param {Object} context - Request context (requestId, etc)
 * @returns {Object} Hybrid score result with feature breakdown
 */
async function generateHybridMatch(payload, context = {}) {
	const { extractFeatures, hybridScore } = require('./features.service');

	// First get LLM score
	const llmResult = await generateCandidateMatch(payload, context);

	// Extract deterministic features
	const features = extractFeatures({
		jobTitle: String(payload.jobTitle || '').trim(),
		jobDescription: String(payload.jobDescription || '').trim(),
		requiredSkills: payload.requiredSkills,
		candidateRole: String(payload.candidateRole || '').trim(),
		candidateYearsExperience: Number(payload.candidateYearsExperience || 0),
		candidateSkills: payload.candidateSkills,
		candidateSummary: String(payload.candidateSummary || '').trim(),
	});

	// Combine LLM score with features
	const hybrid = hybridScore(llmResult.overallScore, features);
	recordAiScoring({ mode: 'hybrid', provider: 'hybrid', result: 'success' });

	return {
		overallScore: hybrid.hybridScore,
		skillMatch: llmResult.skillMatch,
		experienceMatch: llmResult.experienceMatch,
		roleMatch: llmResult.roleMatch,
		strengths: llmResult.strengths,
		gaps: llmResult.gaps,
		summary: llmResult.summary,
		hybridScore: hybrid.hybridScore,
		llmScore: llmResult.overallScore,
		llmBreakdown: {
			skillMatch: llmResult.skillMatch,
			experienceMatch: llmResult.experienceMatch,
			roleMatch: llmResult.roleMatch,
		},
		determinisiticFeatures: features,
		featureBreakdown: hybrid.featureBreakdown,
		weights: hybrid.weights,
		llmStrengths: llmResult.strengths,
		llmGaps: llmResult.gaps,
		llmSummary: llmResult.summary,
		confidence: hybrid.confidence,
		provider: 'hybrid',
		model: `${llmResult.provider}+features-v1`,
		requestId: context.requestId || '',
		ragContext: llmResult.ragContext || null,
	};
}
function normalizeSkillGapModelResponse(result) {
	return {
		overallScore: clampScore(result.overallScore),
		skillMatch: clampScore(result.skillMatch ?? result.overallScore),
		experienceMatch: clampScore(result.experienceMatch),
		roleMatch: clampScore(result.roleMatch),
		strengths: Array.isArray(result.matchedSkills)
			? result.matchedSkills.slice(0, 6).map((skill) => `Already shows evidence of ${skill}`)
			: (Array.isArray(result.strengths) ? result.strengths.slice(0, 6) : []),
		gaps: Array.isArray(result.missingSkills)
			? result.missingSkills.slice(0, 6).map((skill) => `Needs stronger evidence in ${skill}`)
			: (Array.isArray(result.gaps) ? result.gaps.slice(0, 6) : []),
		summary: String(result.summary || '').slice(0, 600),
		confidence: clampScore(result.confidence),
		skillGapAnalysis: {
			matchedSkills: Array.isArray(result.matchedSkills) ? result.matchedSkills.slice(0, 8) : [],
			missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills.slice(0, 8) : [],
			prioritySkills: Array.isArray(result.prioritySkills) ? result.prioritySkills.slice(0, 5) : [],
			learningPlan: Array.isArray(result.learningPlan)
				? result.learningPlan.slice(0, 5).map((item) => ({
					skill: String(item.skill || '').slice(0, 80),
					why: String(item.why || '').slice(0, 180),
					action: String(item.action || '').slice(0, 220),
					effort: ['High', 'Medium', 'Low'].includes(item.effort) ? item.effort : 'Medium',
				}))
				: [],
			interviewFocus: Array.isArray(result.interviewFocus) ? result.interviewFocus.slice(0, 6) : [],
			nextStep: String(result.nextStep || '').slice(0, 200),
			experienceGap: String(result.experienceGap || '').slice(0, 200),
			roleAlignment: clampScore(result.roleAlignment),
		},
	};
}

async function generateSkillGapAnalysis(payload, context = {}) {
	const normalizedPayload = normalizeMatchPayload(payload);
	const useRag = Boolean(payload.useRag);
	const modeLabel = useRag ? 'rag-skill-gap' : 'skill-gap';
	let ragContext = null;

	if (useRag) {
		try {
			ragContext = await buildRagContext(normalizedPayload);
		} catch (error) {
			ragContext = {
				enabled: false,
				keywords: [],
				topJobs: [],
				topCandidates: [],
				contextText: '',
				note: `RAG retrieval failed: ${error.message}`,
			};
		}
	}

	if (!env.geminiApiKey) {
		if (!env.aiEnableHeuristicFallback) {
			recordAiScoring({ mode: modeLabel, provider: 'gemini', result: 'error' });
			const error = new Error('GEMINI_API_KEY is missing on the server');
			error.statusCode = 503;
			throw error;
		}

		recordAiScoring({ mode: modeLabel, provider: 'heuristic-fallback', result: 'fallback' });

		return {
			...buildSkillGapHeuristic(normalizedPayload),
			requestId: context.requestId || '',
			ragContext,
			skillGapAnalysis: {
				...buildSkillGapHeuristic(normalizedPayload).skillGapAnalysis,
			},
			note: 'Heuristic fallback used because Gemini key is not configured.',
			analysisType: 'skill-gap',
		};
	}

	try {
		const response = await requestGeminiWithPrompt(buildSkillGapPrompt(normalizedPayload, ragContext));
		recordAiScoring({ mode: modeLabel, provider: 'gemini', result: 'success' });
		const normalized = normalizeSkillGapModelResponse(response);
		return {
			...normalized,
			requestId: context.requestId || '',
			ragContext,
			analysisType: 'skill-gap',
			provider: 'gemini',
			model: env.geminiModel,
		};
	} catch (error) {
		if (!env.aiEnableHeuristicFallback) {
			recordAiScoring({ mode: modeLabel, provider: 'gemini', result: 'error' });
			throw error;
		}

		recordAiScoring({ mode: modeLabel, provider: 'heuristic-fallback', result: 'fallback' });
		const fallback = buildSkillGapHeuristic(normalizedPayload);
		return {
			...fallback,
			requestId: context.requestId || '',
			ragContext,
			analysisType: 'skill-gap',
			note: `Fallback used because Gemini call failed: ${error.message}`,
		};
	}
}

module.exports = {
	generateCandidateMatch,
	generateHeuristicMatch,
	generateHybridMatch,
	generateSkillGapAnalysis,
};
