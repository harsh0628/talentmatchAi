const interviewsService = require('./interviews.service');

function validateRequiredFields(body) {
	const requiredFields = ['date', 'candidate', 'panel', 'mode'];
	const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
	return missing;
}

async function getInterviews(req, res, next) {
	try {
		const interviews = await interviewsService.listInterviews();
		res.status(200).json({ success: true, message: 'Interviews fetched successfully', data: interviews });
	} catch (error) {
		next(error);
	}
}

async function getInterview(req, res, next) {
	try {
		const interview = await interviewsService.getInterviewById(req.params.id);

		if (!interview) {
			return res.status(404).json({ success: false, message: 'Interview not found' });
		}

		res.status(200).json({ success: true, message: 'Interview fetched successfully', data: interview });
	} catch (error) {
		next(error);
	}
}

async function createInterview(req, res, next) {
	try {
		const missing = validateRequiredFields(req.body);

		if (missing.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Missing required fields: ${missing.join(', ')}`,
			});
		}

		const created = await interviewsService.createInterview(req.body);
		res.status(201).json({ success: true, message: 'Interview created successfully', data: created });
	} catch (error) {
		next(error);
	}
}

async function updateInterview(req, res, next) {
	try {
		const updated = await interviewsService.updateInterview(req.params.id, req.body);

		if (!updated) {
			return res.status(404).json({ success: false, message: 'Interview not found' });
		}

		res.status(200).json({ success: true, message: 'Interview updated successfully', data: updated });
	} catch (error) {
		next(error);
	}
}

async function deleteInterview(req, res, next) {
	try {
		const removed = await interviewsService.removeInterview(req.params.id);

		if (!removed) {
			return res.status(404).json({ success: false, message: 'Interview not found' });
		}

		res.status(200).json({ success: true, message: 'Interview deleted successfully', data: null });
	} catch (error) {
		next(error);
	}
}

module.exports = {
	getInterviews,
	getInterview,
	createInterview,
	updateInterview,
	deleteInterview,
};
