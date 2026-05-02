const candidatesService = require('./candidates.service');

function validateRequiredFields(body) {
	const requiredFields = ['name', 'role', 'score', 'stage'];
	const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
	return missing;
}

async function getCandidates(req, res, next) {
	try {
		const candidates = await candidatesService.listCandidates();
		res.status(200).json({ success: true, message: 'Candidates fetched successfully', data: candidates });
	} catch (error) {
		next(error);
	}
}

async function getCandidate(req, res, next) {
	try {
		const candidate = await candidatesService.getCandidateById(req.params.id);

		if (!candidate) {
			return res.status(404).json({ success: false, message: 'Candidate not found' });
		}

		res.status(200).json({ success: true, message: 'Candidate fetched successfully', data: candidate });
	} catch (error) {
		next(error);
	}
}

async function createCandidate(req, res, next) {
	try {
		const missing = validateRequiredFields(req.body);

		if (missing.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Missing required fields: ${missing.join(', ')}`,
			});
		}

		const created = await candidatesService.createCandidate(req.body);
		res.status(201).json({ success: true, message: 'Candidate created successfully', data: created });
	} catch (error) {
		next(error);
	}
}

async function updateCandidate(req, res, next) {
	try {
		const updated = await candidatesService.updateCandidate(req.params.id, req.body);

		if (!updated) {
			return res.status(404).json({ success: false, message: 'Candidate not found' });
		}

		res.status(200).json({ success: true, message: 'Candidate updated successfully', data: updated });
	} catch (error) {
		next(error);
	}
}

async function deleteCandidate(req, res, next) {
	try {
		const removed = await candidatesService.removeCandidate(req.params.id);

		if (!removed) {
			return res.status(404).json({ success: false, message: 'Candidate not found' });
		}

		res.status(200).json({ success: true, message: 'Candidate deleted successfully', data: null });
	} catch (error) {
		next(error);
	}
}

module.exports = {
	getCandidates,
	getCandidate,
	createCandidate,
	updateCandidate,
	deleteCandidate,
};
