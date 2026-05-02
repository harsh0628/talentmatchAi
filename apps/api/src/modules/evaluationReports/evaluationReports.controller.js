const evaluationReportsService = require('./evaluationReports.service');

function validateRequiredFields(body) {
	const requiredFields = ['candidateId', 'name', 'role', 'technical', 'communication', 'problemSolving'];
	const missing = requiredFields.filter(
		(field) => body[field] === undefined || body[field] === null || body[field] === '',
	);
	return missing;
}

function splitCsvToList(value) {
	if (Array.isArray(value)) {
		return value;
	}

	if (typeof value !== 'string') {
		return [];
	}

	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

function normalizePayload(body) {
	return {
		...body,
		technical: Number(body.technical),
		communication: Number(body.communication),
		problemSolving: Number(body.problemSolving),
		strengths: splitCsvToList(body.strengths),
		improvements: splitCsvToList(body.improvements),
	};
}

async function getEvaluationReports(req, res, next) {
	try {
		const reports = await evaluationReportsService.listEvaluationReports();
		res.status(200).json({ success: true, message: 'Evaluation reports fetched successfully', data: reports });
	} catch (error) {
		next(error);
	}
}

async function getEvaluationReport(req, res, next) {
	try {
		const report = await evaluationReportsService.getEvaluationReportById(req.params.id);

		if (!report) {
			return res.status(404).json({ success: false, message: 'Evaluation report not found' });
		}

		res.status(200).json({ success: true, message: 'Evaluation report fetched successfully', data: report });
	} catch (error) {
		next(error);
	}
}

async function createEvaluationReport(req, res, next) {
	try {
		const missing = validateRequiredFields(req.body);

		if (missing.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Missing required fields: ${missing.join(', ')}`,
			});
		}

		const created = await evaluationReportsService.createEvaluationReport(normalizePayload(req.body));
		res.status(201).json({ success: true, message: 'Evaluation report created successfully', data: created });
	} catch (error) {
		next(error);
	}
}

async function updateEvaluationReport(req, res, next) {
	try {
		const updated = await evaluationReportsService.updateEvaluationReport(req.params.id, normalizePayload(req.body));

		if (!updated) {
			return res.status(404).json({ success: false, message: 'Evaluation report not found' });
		}

		res.status(200).json({ success: true, message: 'Evaluation report updated successfully', data: updated });
	} catch (error) {
		next(error);
	}
}

async function deleteEvaluationReport(req, res, next) {
	try {
		const removed = await evaluationReportsService.removeEvaluationReport(req.params.id);

		if (!removed) {
			return res.status(404).json({ success: false, message: 'Evaluation report not found' });
		}

		res.status(200).json({ success: true, message: 'Evaluation report deleted successfully', data: null });
	} catch (error) {
		next(error);
	}
}

module.exports = {
	getEvaluationReports,
	getEvaluationReport,
	createEvaluationReport,
	updateEvaluationReport,
	deleteEvaluationReport,
};
