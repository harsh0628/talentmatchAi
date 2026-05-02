const aiService = require('./ai.service');
const workflowService = require('./workflow.service');

function validatePayload(body = {}) {
	const missing = [];

	if (!body.jobTitle) {
		missing.push('jobTitle');
	}
	if (!body.jobDescription) {
		missing.push('jobDescription');
	}
	if (!body.candidateName) {
		missing.push('candidateName');
	}
	if (!body.candidateRole) {
		missing.push('candidateRole');
	}

	return missing;
}

async function generateMatchScore(req, res, next) {
	try {
		const missing = validatePayload(req.body);
		if (missing.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Missing required fields: ${missing.join(', ')}`,
			});
		}

		const result = await aiService.generateCandidateMatch(req.body, {
			requestId: req.requestId,
			userId: req.user?.id,
		});

		return res.status(200).json({
			success: true,
			message: 'AI match score generated successfully',
			data: result,
		});
	} catch (error) {
		next(error);
	}
}

async function generateHybridScore(req, res, next) {
	try {
		const missing = validatePayload(req.body);
		if (missing.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Missing required fields: ${missing.join(', ')}`,
			});
		}

		const result = await aiService.generateHybridMatch(req.body, {
			requestId: req.requestId,
			userId: req.user?.id,
		});

		return res.status(200).json({
			success: true,
			message: 'Hybrid match score generated successfully (LLM + deterministic features)',
			data: result,
		});
	} catch (error) {
		next(error);
	}
}

async function generateWorkflowScore(req, res, next) {
	try {
		const missing = validatePayload(req.body);
		if (missing.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Missing required fields: ${missing.join(', ')}`,
			});
		}

		const result = await workflowService.generateLangChainGraphMatch(req.body, {
			requestId: req.requestId,
			userId: req.user?.id,
		});

		return res.status(200).json({
			success: true,
			message: 'LangChain + LangGraph workflow generated successfully',
			data: result,
		});
	} catch (error) {
		next(error);
	}
}

async function generateSkillGapAnalysis(req, res, next) {
	try {
		const missing = validatePayload(req.body);
		if (missing.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Missing required fields: ${missing.join(', ')}`,
			});
		}

		const result = await aiService.generateSkillGapAnalysis(req.body, {
			requestId: req.requestId,
			userId: req.user?.id,
		});

		return res.status(200).json({
			success: true,
			message: 'Skill gap analysis generated successfully',
			data: result,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	generateMatchScore,
	generateHybridScore,
	generateWorkflowScore,
	generateSkillGapAnalysis,
};
