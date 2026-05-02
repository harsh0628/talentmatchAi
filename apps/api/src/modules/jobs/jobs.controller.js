const jobsService = require('./jobs.service');

function validateRequiredFields(body) {
	const requiredFields = ['title', 'location', 'experience', 'description'];
	const missing = requiredFields.filter((field) => !body[field]);
	return missing;
}

async function getJobs(req, res, next) {
	try {
		const jobs = await jobsService.listJobs();
		res.status(200).json({ success: true, message: 'Jobs fetched successfully', data: jobs });
	} catch (error) {
		next(error);
	}
}

async function getJob(req, res, next) {
	try {
		const job = await jobsService.getJobById(req.params.id);

		if (!job) {
			return res.status(404).json({ success: false, message: 'Job not found' });
		}

		res.status(200).json({ success: true, message: 'Job fetched successfully', data: job });
	} catch (error) {
		next(error);
	}
}

async function createJob(req, res, next) {
	try {
		const missing = validateRequiredFields(req.body);

		if (missing.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Missing required fields: ${missing.join(', ')}`,
			});
		}

		const created = await jobsService.createJob(req.body);
		res.status(201).json({ success: true, message: 'Job created successfully', data: created });
	} catch (error) {
		next(error);
	}
}

async function updateJob(req, res, next) {
	try {
		const updated = await jobsService.updateJob(req.params.id, req.body);

		if (!updated) {
			return res.status(404).json({ success: false, message: 'Job not found' });
		}

		res.status(200).json({ success: true, message: 'Job updated successfully', data: updated });
	} catch (error) {
		next(error);
	}
}

async function deleteJob(req, res, next) {
	try {
		const removed = await jobsService.removeJob(req.params.id);

		if (!removed) {
			return res.status(404).json({ success: false, message: 'Job not found' });
		}

		res.status(200).json({ success: true, message: 'Job deleted successfully', data: null });
	} catch (error) {
		next(error);
	}
}

module.exports = {
	getJobs,
	getJob,
	createJob,
	updateJob,
	deleteJob,
};
