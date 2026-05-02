const { buildRagContext } = require('./rag.service');
const { generateHybridMatch } = require('./ai.service');

function normalizeWorkflowPayload(payload = {}) {
	return {
		jobTitle: String(payload.jobTitle || '').trim(),
		jobDescription: String(payload.jobDescription || '').trim(),
		requiredSkills: String(payload.requiredSkills || '').trim(),
		candidateName: String(payload.candidateName || '').trim(),
		candidateRole: String(payload.candidateRole || '').trim(),
		candidateYearsExperience: Number(payload.candidateYearsExperience || 0),
		candidateSkills: String(payload.candidateSkills || '').trim(),
		candidateSummary: String(payload.candidateSummary || '').trim(),
		useRag: Boolean(payload.useRag),
	};
}

function buildLangChainBlueprint(normalizedPayload, ragContext, result) {
	const retrievalUsed = Boolean(ragContext?.enabled && ragContext?.contextText);

	return {
		framework: 'LangChain-style pipeline',
		concept: 'LangChain is the part that gathers context, formats it, and feeds it into the scoring step.',
		steps: [
			'Load the job and candidate input.',
			retrievalUsed ? 'Retrieve related jobs and candidates for extra context.' : 'Skip retrieval because no context was available.',
			'Build a structured prompt with the job and candidate details.',
			'Pass the prompt into the AI scorer.',
			'Normalize the AI output into a stable JSON response.',
		],
		inputs: {
			jobTitle: normalizedPayload.jobTitle,
			candidateRole: normalizedPayload.candidateRole,
			requiredSkills: normalizedPayload.requiredSkills,
		},
		retrieval: {
			used: retrievalUsed,
			source: ragContext?.source || 'none',
			keywords: ragContext?.keywords || [],
			contextPreview: String(ragContext?.contextText || '').slice(0, 600),
		},
		output: {
			overallScore: result.overallScore,
			summary: result.summary,
			confidence: result.confidence,
		},
	};
}

function buildLangGraphBlueprint(normalizedPayload, ragContext, result) {
	const retrievalUsed = Boolean(ragContext?.enabled && ragContext?.contextText);
	const nodes = [
		{ id: 'ingest', label: 'Ingest input', status: 'done' },
		{ id: 'retrieve', label: 'Retrieve context', status: retrievalUsed ? 'done' : 'skipped' },
		{ id: 'score', label: 'Score match', status: 'done' },
		{ id: 'explain', label: 'Explain result', status: 'done' },
	];

	return {
		framework: 'LangGraph-style workflow',
		concept: 'LangGraph is the control flow that decides which node runs next, like a small state machine.',
		nodes,
		edges: [
			{ from: 'ingest', to: 'retrieve' },
			{ from: 'retrieve', to: 'score' },
			{ from: 'score', to: 'explain' },
		],
		executionPath: retrievalUsed
			? ['ingest', 'retrieve', 'score', 'explain']
			: ['ingest', 'score', 'explain'],
		decision: retrievalUsed
			? 'The workflow used retrieval because the input had searchable keywords.'
			: 'The workflow skipped retrieval and used the scoring pipeline only.',
		output: {
			overallScore: result.overallScore,
			hybridScore: result.hybridScore,
			provider: result.provider,
			model: result.model,
		},
		inputSnapshot: {
			jobTitle: normalizedPayload.jobTitle,
			candidateName: normalizedPayload.candidateName,
			candidateRole: normalizedPayload.candidateRole,
		},
	};
}

async function generateLangChainGraphMatch(payload = {}, context = {}) {
	const normalizedPayload = normalizeWorkflowPayload(payload);
	const result = await generateHybridMatch({ ...normalizedPayload, useRag: true }, context);
	const ragContext = result.ragContext || null;
	const retrievalUsed = Boolean(ragContext?.enabled && ragContext?.contextText);

	return {
		...result,
		workflowType: 'langchain-langgraph',
		ragContext,
		workflow: {
			beginnerExplanation:
				'LangChain is the part that prepares the context and LangGraph is the part that controls the order of steps. Together they create a small AI workflow around the existing match scorer.',
			chain: buildLangChainBlueprint(normalizedPayload, ragContext, result),
			graph: buildLangGraphBlueprint(normalizedPayload, ragContext, result),
			steps: [
				{ node: 'ingest', status: 'done' },
				{ node: 'retrieve', status: retrievalUsed ? 'done' : 'skipped' },
				{ node: 'score', status: 'done' },
				{ node: 'explain', status: 'done' },
			],
		},
	};
}

module.exports = {
	generateLangChainGraphMatch,
	buildLangChainBlueprint,
	buildLangGraphBlueprint,
};